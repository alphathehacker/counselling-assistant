# Counselling Assistant

A college counselling and admission-prediction web application for Indian entrance exams (AP EAPCET, AP ECET, NEET, JEE Main, JEE Advanced). Students enter their exam, rank, category, gender, district and preferred branches, and get a list of colleges they are likely to get into, based on previous-year cutoff data.

**Final-year project** — React frontend, Node/Express + MongoDB backend, with a separate Python ML pipeline.

## What it does

**Students**
- Register / log in (email + password, Google/Facebook OAuth)
- Enter exam, rank, category, gender, district and branch preferences
- Get predicted colleges with chance bands, sorted by confidence and NIRF ranking
- Save prediction reports, bookmark colleges, compare colleges side by side
- Dashboard, profile settings, and a counselling chatbot for follow-up questions

**Admins**
- Separate admin login and panel
- Upload and manage the college / cutoff datasets (CSV) that predictions run on

## How prediction works (honestly)

The live prediction is **rule-based**: the student's rank is compared against stored previous-year closing ranks for each college/branch, and results are grouped into chance bands (roughly: rank well inside last year's closing rank → high chance, through to just outside it → low chance). The Python `ml_pipeline/` is a **separate experiment** in forecasting future closing ranks (scikit-learn models compared on generated sample data) — it is not wired into the live server yet.

## Architecture

```
React + Vite frontend  ──REST API──►  Express server  ──►  MongoDB (Mongoose)
 (src/, ~27 pages)                    (server/, JWT auth)     College / User /
                                                              Prediction models
ml_pipeline/  (Python, standalone experiment — not connected to the server)
```

## Tech stack

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Framer Motion, Recharts, Axios
- **Backend:** Node.js, Express, Mongoose, JWT, Passport (Google/Facebook OAuth)
- **Data:** Previous-year cutoff datasets per exam (CSV), admin CSV upload
- **ML (experimental):** Python, scikit-learn (`ml_pipeline/`)

## Run locally

Frontend:

```bash
npm install
npm run dev
```

Backend: copy `server/env.template` to `server/.env`, fill in your MongoDB URI and secrets, then:

```bash
cd server
npm install
node server.js
```

The frontend reads the API URL from `VITE_API_URL` and falls back to `http://localhost:5000/api`.

## Status

Final-year project, built and working locally. Screenshots: _(to be added)_
