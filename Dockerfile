# ---------- Frontend build ----------
FROM node:20 AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend .
RUN npm run build


# ---------- backend runtime ----------
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y git && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install git+https://github.com/meta-pytorch/OpenEnv.git@90f98d60dd502ec4be1ad370570970176ed26648#egg=openenv-core


COPY backend ./backend

# copy static frontend
COPY --from=frontend-builder /frontend/out ./frontend

EXPOSE 7860

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
