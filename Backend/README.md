# FastAPI Boilerplate

A simple FastAPI backend.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## Endpoints

- `GET /health`: Health check.
- `POST /query`: Send a query.
  - Body:
    ```json
    {
      "user_query": "your query",
      "context": "some context"
    }
    ```
