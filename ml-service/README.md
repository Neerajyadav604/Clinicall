# Clinicall ML Service

Clinicall ML Service is a FastAPI-based Python microservice reserved for the machine-learning layer of the Clinicall healthcare platform. Phase 1 establishes only the service infrastructure, request schemas, model stubs, and Node.js integration points. No ML routes or model logic are implemented yet.

## Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the service:

```bash
python -m uvicorn main:app --reload --port 8000
```

You can also run:

```bash
python main.py
```

## Current Endpoint

- `GET /health`
  Returns the service health payload.

## Planned ML Endpoints

- `POST /ml/symptoms` - Symptom checker, planned for Phase 2
- `POST /ml/recommend-doctors` - Doctor recommender, planned for Phase 3
- `POST /ml/summarize-records` - Medical record summarizer, planned for Phase 3
- `POST /ml/check-drugs` - Drug interaction checker, planned for Phase 4

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_BACKEND_URL` | Yes | `http://localhost:4000` | Base URL of the Node.js backend used for internal data fetches in later phases. |
| `ML_SERVICE_PORT` | Yes | `8000` | Port intended for the FastAPI service. |
| `ENVIRONMENT` | Yes | `development` | Runtime environment label. |

## Health Check

Local health check URL:

```text
http://localhost:8000/health
```

Expected response:

```json
{"status":"ok","models_loaded":true,"version":"1.0.0","service":"Clinicall ML"}
```

## Test With curl

```bash
curl http://localhost:8000/health
```

## Project Structure

- `main.py` - FastAPI application entry point
- `schemas/request_schemas.py` - Pydantic request and response contracts for all planned ML modules
- `models/` - Placeholder module implementations for upcoming phases
- `data/drug_interactions.json` - Versioned interaction dataset placeholder for Phase 4
- `saved_models/` - Directory reserved for trained model artifacts
