---
title: RLM Interactive Console
emoji: 🚀
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
---

# RLM Interactive Console

The **RLM Interactive Console** is a full-stack application designed to demonstrate and interact with Reinforcement Learning Models (or similar agentic systems). It features a generic **FastAPI** backend for handling model inference and dataset management, coupled with a modern **Next.js** frontend for an interactive user experience.

## ✨ Features

- **Interactive Chat Interface**: user-friendly chat UI to interact with models.
- **Dataset Integration**: Fetches and caches datasets from Hugging Face (e.g., `oolongbench/oolong-real`).
- **Response Caching**: Caches model responses to local JSON files to improve performance and avoid redundant computation.
- **Agentic Workflow**: Integrates with `smolagents` for agent-based reasoning.
- **Real-time Feedback**: Displays thinking process and final answers.

## 🛠 Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/), React 19, TailwindCSS, TypeScript.
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), Python 3.12+, Uvicorn.
- **AI/ML**: `smolagents`, `openenv`, `datasets`, Hugging Face Hub.
- **Package Management**: `npm` (frontend), `uv` or `pip` (backend).

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (v3.12+)
- **Git**

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd RLM-Demo
```

### 2. Backend Setup

The backend is located in the `backend/` directory.

#### Create a Virtual Environment

It is recommended to use `uv` for fast package management, but standard `pip` works as well.

**Using `uv` (Recommended):**

```bash
# Install uv if you haven't already
pip install uv

# Create virtual environment and sync dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r backend/requirements.txt
```

**Using standard `pip`:**

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
```

#### Environment Variables

Create a `.env` file in the root (or `backend/` depending on where you run it) with the following variables:

```ini
HF_TOKEN=your_hugging_face_token
SPACE_URL=optional_space_url
MODEL_NAME=meta-llama/Llama-3.1-70B-Instruct
DATASET_SUBSET=default
DATASET_SPLIT=test
EXAMPLE_INDEX=0
MAX_ITERATIONS=10
CUTOFF_INDEX=15
```

### 3. Frontend Setup

The frontend is located in the `frontend/` directory.

```bash
cd frontend
npm install
```

## 🏃‍♂️ Running the Application

### Development Mode

Run the backend and frontend in separate terminals.

**Terminal 1: Backend**

```bash
# From the root directory
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

**Terminal 2: Frontend**

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

*Note: The Next.js app is configured to proxy API requests to `http://localhost:8000` or expects the backend to server the frontend in production.*

### Production (Docker)

The project includes a `Dockerfile` for easy deployment, compatible with Hugging Face Spaces.

```bash
docker build -t rlm-demo .
docker run -p 7860:7860 rlm-demo
```

## 📂 Project Structure

```
RLM-Demo/
├── backend/                # FastAPI backend
│   ├── main.py             # App entry point
│   ├── repl_process.py     # Agent logic
│   ├── data/               # Cached datasets
│   ├── answer/             # Cached answers
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── app/                # App router (pages & layouts)
│   ├── components/         # React components
│   └── package.json        # Frontend dependencies
├── Dockerfile              # Deployment configuration
└── README.md               # Project documentation
```
