FROM python:3.12-slim

WORKDIR /app

COPY apps/log_bridge/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/log_bridge/ apps/log_bridge/
COPY apps/__init__.py apps/__init__.py

ENV PYTHONPATH=/app

CMD ["python", "-m", "apps.log_bridge.main"]
