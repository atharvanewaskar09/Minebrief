# MineBrief

MineBrief is a mine-operations reporting platform for shift reports, workforce attendance, equipment, maintenance, handovers, issues, and historical search. Its local development setup uses the existing React/Vite frontend, Flask API, and SQLite database. The Rajmahal demo data is fictional.

## Run locally on Windows

Open two PowerShell terminals at the repository root.

### Terminal 1: Flask API

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Set-Location backend
python run.py
```

The API starts at `http://localhost:5000`. On first startup, local SQLite tables and the demo workspace are created without resetting existing data.

### Terminal 2: Vite frontend

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`) and select **Explore Demo** to enter the fictional Rajmahal workspace without signing up. The frontend proxies `/api` requests to Flask.

To leave the virtual environment, run `deactivate` in the terminal where it is active.

## Supabase setup

Supabase Auth, Google OAuth, PostgreSQL, and private Storage are prepared but require a Supabase project and project-specific configuration before they can be used. Copy the example values to `frontend/.env.local` and `backend/.env`, then replace the placeholders locally. Keep database credentials and other backend secrets only in `backend/.env`; never commit populated environment files.

Before using Supabase PostgreSQL, apply the schema with `flask --app run:app db upgrade` from `backend`, then run `backend/supabase/policies.sql` in the Supabase SQL editor. Configure the OAuth provider and redirect URLs in the Supabase dashboard. The demo remains available independently of a Supabase session.

## Shift report extraction

The New Report workflow accepts a PDF or image, extracts report fields with the official `google-genai` SDK's Interactions API, and opens the existing report sections for review before saving. Add `GEMINI_API_KEY` to `backend/.env` and restart Flask to enable extraction; `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`. Files are stored through the existing private attachment flow only after the report is confirmed.

## Tests and production build

From the repository root:

```powershell
.\.venv\Scripts\python.exe -m pytest
Set-Location frontend
npm run build
```
