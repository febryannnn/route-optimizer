# ── Backend: Python / Flask ─────────────────────────────────
FROM python:3.12-slim

# Buat non-root user untuk keamanan
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Install dependencies dulu (layer cache-friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY app.py .

# Ownership ke non-root user
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

# Gunakan gunicorn di production, bukan flask dev server
# Fallback ke python app.py jika gunicorn tidak ada
CMD ["python", "app.py"]