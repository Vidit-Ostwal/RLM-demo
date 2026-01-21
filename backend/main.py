from fastapi import FastAPI
from pydantic import BaseModel
from datasets import load_dataset
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os, json
from .repl_process import rlm_chat


load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
SPACE_URL = os.getenv("SPACE_URL")
MODEL_NAME = os.getenv("MODEL_NAME")
DATASET_SUBSET = os.getenv("DATASET_SUBSET")
DATASET_SPLIT = os.getenv("DATASET_SPLIT")
EXAMPLE_INDEX = os.getenv("EXAMPLE_INDEX")
MAX_ITERATIONS = os.getenv("MAX_ITERATIONS")
CUTOFF_INDEX = int(os.getenv("CUTOFF_INDEX", 30))

app = FastAPI()

# ---------------- API ----------------

class QueryRequest(BaseModel):
    index: int

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/get-dataset")
def get_dataset(index: int):
    index = index % CUTOFF_INDEX
    file_path = f"backend/data/dataset_{index}.json"

    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            example = json.load(f)
    else:
        dataset = load_dataset("oolongbench/oolong-real", DATASET_SUBSET, split=DATASET_SPLIT)
        example = dataset[index]
        os.makedirs("backend/data", exist_ok=True)
        with open(file_path, "w") as f:
            json.dump(example, f)

    return {
        "context": example["context_window_text"],
        "query": example["question"]
    }

@app.post("/api/query")
def query_endpoint(request: QueryRequest):
    index = request.index % CUTOFF_INDEX

    data = get_dataset(index)
    context = data["context"]
    question = data["query"]

    cache_path = f"backend/answer/answer_{index}.json"
    if os.path.exists(cache_path):
        with open(cache_path, 'r') as f:
            cached_data = json.load(f)
            return {"final_answer": cached_data['final_answer'], "messages": cached_data['code_and_output']}

    final_answer, code_and_output = rlm_chat(context, question)
    os.makedirs("backend/answer", exist_ok=True)

    with open(cache_path, 'w') as f:
        json.dump({'final_answer': final_answer, 'code_and_output': code_and_output}, f)

    return {"final_answer": final_answer, "messages": code_and_output}

# ---------------- FRONTEND ----------------

FRONTEND = Path(__file__).parent.parent / "frontend"

app.mount("/_next", StaticFiles(directory=FRONTEND / "_next"), name="_next")
app.mount("/static", StaticFiles(directory=FRONTEND), name="static")

@app.get("/")
def index():
    return FileResponse(FRONTEND / "index.html")

@app.get("/{path:path}")
def spa(path: str):
    return FileResponse(FRONTEND / "index.html")
