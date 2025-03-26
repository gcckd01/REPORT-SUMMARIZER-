FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create directories for uploads and summaries
RUN mkdir -p uploads summaries

# Expose port for the API
EXPOSE 5000

# Run the API server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]