document.addEventListener('DOMContentLoaded', () => {
    // API endpoint
    const API_URL = 'http://localhost:5000/api';

    // Elements
    const homeSection = document.getElementById('home-section');
    const historySection = document.getElementById('history-section');
    const navHome = document.getElementById('nav-home');
    const navHistory = document.getElementById('nav-history');
    const alertsContainer = document.getElementById('alerts');
    const resultCard = document.getElementById('result-card');
    const summaryOutput = document.getElementById('summary-output');
    const summaryStats = document.getElementById('summary-stats');
    const textInput = document.getElementById('text-input');
    const summaryMethod = document.getElementById('summary-method');
    const maxLength = document.getElementById('max-length');
    const minLength = document.getElementById('min-length');
    const summarizeBtn = document.getElementById('summarize-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const fileSummaryMethod = document.getElementById('file-summary-method');
    const fileMaxLength = document.getElementById('file-max-length');
    const fileMinLength = document.getElementById('file-min-length');
    const historyTableBody = document.getElementById('history-table-body');
    const summaryModal = new bootstrap.Modal(document.getElementById('summaryModal'));
    const modalSummary = document.getElementById('modal-summary');

    // Navigation
    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        homeSection.style.display = 'block';
        historySection.style.display = 'none';
        navHome.classList.add('active');
        navHistory.classList.remove('active');
    });

    navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        homeSection.style.display = 'none';
        historySection.style.display = 'block';
        navHome.classList.remove('active');
        navHistory.classList.add('active');
        loadSummaryHistory();
    });

    // Show alert
    function showAlert(message, type = 'danger') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertsContainer.appendChild(alert);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    }

    // Check API health
    async function checkApiHealth() {
        try {
            const response = await fetch(`${API_URL}/health`);
            const data = await response.json();
            if (data.status === 'healthy') {
                console.log('API is healthy');
            } else {
                showAlert('API is not responding properly. Some features may not work.');
            }
        } catch (error) {
            console.error('API health check failed:', error);
            showAlert('Cannot connect to the backend API. Please make sure the server is running.');
        }
    }

    // Load summary history
    async function loadSummaryHistory() {
        try {
            const response = await fetch(`${API_URL}/summaries`);
            const data = await response.json();
            
            historyTableBody.innerHTML = '';
            
            if (data.length === 0) {
                historyTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">No summaries found</td>
                    </tr>
                `;
                return;
            }
            
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.original_filename}</td>
                    <td class="summary-preview">${item.summary}</td>
                    <td>${item.created_at}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-btn" data-id="${item.id}">
                            <i class="bi bi-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-outline-secondary download-history-btn" data-id="${item.id}">
                            <i class="bi bi-download"></i> Download
                        </button>
                    </td>
                `;
                historyTableBody.appendChild(row);
            });
            
            // Add event listeners to the view buttons
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.closest('button').dataset.id;
                    try {
                        const response = await fetch(`${API_URL}/summaries/${id}`);
                        const text = await response.text();
                        modalSummary.value = text;
                        summaryModal.show();
                    } catch (error) {
                        showAlert('Failed to load summary.');
                    }
                });
            });
            
            // Add event listeners to the download buttons
            document.querySelectorAll('.download-history-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.closest('button').dataset.id;
                    try {
                        const response = await fetch(`${API_URL}/summaries/${id}`);
                        const text = await response.text();
                        downloadText(text, id);
                    } catch (error) {
                        showAlert('Failed to download summary.');
                    }
                });
            });
        } catch (error) {
            console.error('Failed to load summary history:', error);
            showAlert('Failed to load summary history.');
        }
    }

    // Text summarization
    async function summarizeText() {
        const text = textInput.value.trim();
        if (!text) {
            showAlert('Please enter some text to summarize.');
            return;
        }
        
        summarizeBtn.disabled = true;
        summarizeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        try {
            const response = await fetch(`${API_URL}/summarize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    method: summaryMethod.value,
                    max_length: parseInt(maxLength.value),
                    min_length: parseInt(minLength.value)
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                showAlert(data.error);
                return;
            }
            
            summaryOutput.value = data.summary;
            summaryStats.textContent = `Original: ${data.original_length} chars | Summary: ${data.summary_length} chars (${Math.round((data.summary_length / data.original_length) * 100)}%)`;
            resultCard.style.display = 'block';
            
            // Scroll to result
            resultCard.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Summarization failed:', error);
            showAlert('Failed to summarize text. Please try again.');
        } finally {
            summarizeBtn.disabled = false;
            summarizeBtn.innerHTML = 'Summarize';
        }
    }

    // File upload and summarization
    async function uploadAndSummarize(e) {
        e.preventDefault();
        
        if (!fileInput.files || fileInput.files.length === 0) {
            showAlert('Please select a file to upload.');
            return;
        }
        
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('method', fileSummaryMethod.value);
        formData.append('max_length', fileMaxLength.value);
        formData.append('min_length', fileMinLength.value);
        
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.error) {
                showAlert(data.error);
                return;
            }
            
            summaryOutput.value = data.summary;
            summaryStats.textContent = `File: ${file.name} | Summary length: ${data.summary.length} chars`;
            resultCard.style.display = 'block';
            
            // Scroll to result
            resultCard.scrollIntoView({ behavior: 'smooth' });
            
            // Reset file input
            fileInput.value = '';
            
            // Show success message
            showAlert('File uploaded and summarized successfully.', 'success');
        } catch (error) {
            console.error('Upload failed:', error);
            showAlert('Failed to upload and summarize file. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Upload & Summarize';
        }
    }

    // Copy summary to clipboard
    function copySummary() {
        summaryOutput.select();
        document.execCommand('copy');
        
        // Show success message
        copyBtn.innerHTML = '<i class="bi bi-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
        }, 2000);
    }

    // Download summary as a text file
    function downloadSummary() {
        const summary = summaryOutput.value;
        downloadText(summary, `summary_${Date.now()}.txt`);
    }

    // Helper function to download text as a file
    function downloadText(text, filename) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    // Event listeners
    summarizeBtn.addEventListener('click', summarizeText);
    uploadForm.addEventListener('submit', uploadAndSummarize);
    copyBtn.addEventListener('click', copySummary);
    downloadBtn.addEventListener('click', downloadSummary);

    // Initial health check
    checkApiHealth();
});