# ---------- Frontend build ----------
FROM node:20 AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend .
RUN npm run build


# ---------- Backend runtime ----------
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y git && \
    rm -rf /var/lib/apt/lists/*

COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -e git+https://github.com/meta-pytorch/OpenEnv.git@90f98d60dd502ec4be1ad370570970176ed26648#egg=openenv


COPY Backend ./Backend

# copy static frontend
COPY --from=frontend-builder /frontend/out ./frontend

EXPOSE 7860

CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
