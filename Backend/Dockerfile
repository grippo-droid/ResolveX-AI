# Backend/Dockerfile
FROM python:3.11-slim-bookworm

WORKDIR /app

# Update system packages first to patch vulnerabilities ✅
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend code
COPY . .

# Create directories
RUN mkdir -p uploads storage

# Non-root user for security ✅
RUN adduser --disabled-password --gecos "" appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
