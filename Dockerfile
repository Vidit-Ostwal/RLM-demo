# ---------- Frontend build ----------
FROM node:18 AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend .
RUN npm run build


# ---------- Backend runtime ----------
FROM python:3.10-slim

WORKDIR /app

COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Backend ./Backend

# copy static frontend
COPY --from=frontend-builder /frontend/out ./frontend

EXPOSE 7860

CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
