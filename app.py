from flask import Flask, request, jsonify, send_from_directory # type: ignore
from flask_cors import CORS # type: ignore
from werkzeug.utils import secure_filename # type: ignore
from report_summarizer import ReportSummarizer  # Ensure this module exists and is properly imported
import os
import uuid

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
SUMMARY_FOLDER = 'summaries'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'md'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SUMMARY_FOLDER, exist_ok=True)

# Initialize the summarizer
summarizer = ReportSummarizer(method='extractive')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def home():
    return send_from_directory('../frontend', 'index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "API is running"})

@app.route('/api/summarize', methods=['POST'])
def summarize_text():
    if 'text' not in request.json:
        return jsonify({"error": "No text provided"}), 400
    
    text = request.json['text']
    method = request.json.get('method', 'extractive')
    max_length = request.json.get('max_length', 150)
    min_length = request.json.get('min_length', 40)
    
    # Update summarizer settings if different from current
    if summarizer.method != method:
        summarizer.method = method
    
    summarizer.max_length = max_length
    summarizer.min_length = min_length
    
    # Generate summary
    summary = summarizer.summarize(text)
    
    return jsonify({
        "original_length": len(text),
        "summary_length": len(summary),
        "summary": summary
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        # Generate a unique filename
        filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Get summarization parameters
        method = request.form.get('method', 'extractive')
        max_length = int(request.form.get('max_length', 150))
        min_length = int(request.form.get('min_length', 40))
        
        # Update summarizer settings if different from current
        if summarizer.method != method:
            summarizer.method = method
        
        summarizer.max_length = max_length
        summarizer.min_length = min_length
        
        # Generate summary
        summary = summarizer.summarize_file(file_path)
        
        # Save summary
        summary_filename = filename.rsplit('.', 1)[0] + '_summary.txt'
        summary_path = os.path.join(SUMMARY_FOLDER, summary_filename)
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary)
        
        return jsonify({"summary": summary, "summary_path": summary_path})
    
    return jsonify({"error": "File type not allowed"}), 400

@app.route('/api/summaries/<filename>', methods=['GET'])
def get_summary(filename):
    return send_from_directory(SUMMARY_FOLDER, filename)

@app.route('/api/files/<filename>', methods=['GET'])
def get_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/summaries', methods=['GET'])
def list_summaries():
    summaries = []
    for filename in os.listdir(SUMMARY_FOLDER):
        summaries.append(filename)
    
    return jsonify(summaries)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)