# REPORT-SUMMARIZER-

# Report Summarizer

A full-stack application for summarizing texts and documents using extractive and abstractive methods.

## Features

- Summarize text input using either extractive (TF-IDF) or abstractive (BART) methods
- Upload and summarize files (TXT, PDF, DOCX, MD) 
- View summary history
- Download summaries as text files
- Responsive UI with light/dark mode

## Project Structure

```
report-summarizer/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── report_summarizer.py   # Core summarization logic
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Backend Docker configuration
│   ├── uploads/               # Uploaded files storage
│   └── summaries/             # Generated summaries storage
├── frontend/
│   ├── index.html             # Main HTML page
│   ├── styles.css             # CSS styles
│   ├── app.js                 # Frontend JavaScript
│   └── Dockerfile             # Frontend Docker configuration
├── docker-compose.yml         # Docker Compose configuration
├── setup.sh                   # Setup script
└── README.md                  # This documentation
```

## Prerequisites

- Docker and Docker Compose
- Python 3.9+ (for local development)
- Node.js (optional, for local frontend development)

## Installation and Setup

### Using Docker (Recommended)

1. Clone the repository or set up the project structure
2. Run the setup script to create the directory structure:

```bash
chmod +x setup.sh
./setup.sh
```

3. Start the application using Docker Compose:

```bash
docker-compose up -d
```

4. Access the application at http://localhost:8080

### Manual Setup (Without Docker)

#### Backend

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the Flask application:

```bash
python app.py
```

The API will be available at http://localhost:5000

#### Frontend

Simply open the `frontend/index.html` file in your browser, or use a simple HTTP server:

```bash
cd frontend
python -m http.server 8080
```

Then access the application at http://localhost:8080

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check endpoint |
| `/api/summarize` | POST | Summarize text content |
| `/api/upload` | POST | Upload and summarize a file |
| `/api/summaries` | GET | List all generated summaries |
| `/api/summaries/<filename>` | GET | Get a specific summary |
| `/api/files/<filename>` | GET | Get a specific uploaded file |

## Summarization Methods

### Extractive Summarization

Uses TF-IDF (Term Frequency-Inverse Document Frequency) to identify the most important sentences in the text. This method selects and combines existing sentences from the original document.

### Abstractive Summarization

Uses the BART (Bidirectional and Auto-Regressive Transformers) model to generate new text that captures the essential information from the original document. This method can create sentences that do not appear in the original text.

#
