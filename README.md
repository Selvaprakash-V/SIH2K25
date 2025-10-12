# RuralIQ (GramInsight)

A data-driven village development monitoring prototype for SC-majority villages under the PM-AJAY scheme. RuralIQ (aka GramInsight) helps government officers and citizens detect missing or weak basic services, visualize gaps on maps and dashboards, and prioritize interventions.


## One-liner
Smart, lightweight village gap detection and monitoring system — offline-ready, role-based, and demo-ready for SIH judging.


## Problem Statement
Many SC-majority & underserved villages lack easily accessible, consolidated information about infrastructure and service delivery (education, healthcare, water, sanitation, electricity, roads, internet). Field officers often rely on paper surveys and fragmented records. Without a central, data-driven view, planning and prioritization become slow and error-prone.


## Target Users / Beneficiaries
- District / State Government Officers (planning & monitoring)
- Field Officers (data collection & updates)
- Citizens (report issues and view local status)
- NGOs and civil society monitoring agencies


## Challenges
- Sparse and noisy data across villages
- Limited connectivity in rural areas (needs offline-first support)
- Role-based access requirements (admin / field officer / citizen)
- Simple, explainable gap-detection rules required for transparency


## Solution Overview
RuralIQ offers:
- Centralized backend (FastAPI + MongoDB) exposing REST endpoints
- React + Vite frontend with TailwindCSS, Leaflet maps, and charts
- Rule-based gap detection (clear business rules; ML placeholder available)
- Offline-capable reporting (IndexedDB queue + sync endpoint)
- Role-based JWT authentication
- Lightweight deployment-ready scaffolding and mock dataset for demo


## Key Features
- Village Dashboard: development index, cards, time-series charts
- Map view (Leaflet): color-coded pins for gap severity
- Gap Detection view: per-village table of missing services
- Project Tracker: CRUD projects with status badges
- Report Form: photo + GPS + description (offline queuing)
- Offline sync API to accept batched queued reports
- Recommendations endpoint that ranks villages by gap score


## Architecture (high-level)
- Frontend: React (Vite) + Tailwind + Leaflet + Recharts
- Backend: FastAPI (Python) + Uvicorn + MongoDB (Atlas) + JWT auth
- Storage: MongoDB collections for villages, amenities, projects, gaps, reports, users
- Media: Cloudinary or Firebase Storage for images
- Deployment: Backend -> Render / Railway, Frontend -> Vercel/Netlify


## Data Model (collections / tables)
- villages: { _id, name, district, state, population, sc_ratio, geo_lat, geo_long }
- amenities: { village_id, water, electricity (pct), schools, health_centers, toilets (%), internet (%) }
- projects: { village_id, name, type, progress_pct, status }
- gaps: { village_id, gap_type, severity_score, last_updated }
- reports: { user_id, village_id, image_url, gps: {lat,lon}, description, timestamp, synced }
- users: { _id, name, role, phone_or_email, password_hash }


## Gap Detection Rules (contract)
Inputs:
- Village + Amenities record
Outputs:
- gap object per village (gap types, severity score, boolean flags)
Error modes:
- missing amenity values → treat as unknown and set conservative gap flags

Example rule (simple, explainable):
- if electricity < 80 → electricity gap
- if school_count == 0 → education gap
- if health_centers == 0 → healthcare gap
- severity_score = weighted sum of missing/low amenities

Edge cases covered:
- Partial/unknown data (defaults and careful scoring)
- Large uploads (batching + pagination)
- Offline queued reports (retry + deduplication)


## API Endpoints (planned)
- POST /api/auth/login → returns JWT
- POST /api/auth/signup → create user
- GET /api/villages → list (filter by state/district, pagination)
- POST /api/villages → add village
- GET /api/villages/:id → village detail
- GET /api/gaps?village_id= → computed gap report
- GET /api/recommendations → top villages by severity
- CRUD /api/projects
- POST /api/reports → accept photo + gps + description
- POST /api/sync/reports → accept batched offline reports


## Development Setup (quick start)
Assumption: You want a local dev environment for both frontend and backend.

1) Clone the repo (if not already):

```powershell
# on Windows PowerShell
cd C:\Users\Yugendra\Downloads\SIH2
git clone <your-repo-url> .
```

2) Backend (FastAPI + venv + pip)

```powershell
# create venv
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r backend/requirements.txt
# run server
cd backend
uvicorn main:app --reload --port 8000
```

.env (backend) example (create `backend/.env`):

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/ruraliq?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_strong_secret
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
```

3) Frontend (React + Vite)

```powershell
cd frontend
npm install
npm run dev
```

.env (frontend) example (create `frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_if_using_mapbox
```


## Mock Data
Place `data/mock_villages.json` with sample village records (template provided in /data). The backend will include a loader script to seed DB in dev mode.

Sample record:

```json
{
  "village": "Rampur",
  "district": "Guna",
  "state": "MP",
  "SC_ratio": 68,
  "population": 2345,
  "schools": 1,
  "health_centers": 0,
  "electricity": 75,
  "toilets": 62,
  "internet": 45,
  "water": 1,
  "geo_lat": 24.6,
  "geo_long": 77.3
}
```


## How to Demo Quickly
1. Start backend (see above) — server runs on port 8000.
2. Seed the DB: `python backend/seed_mock_data.py` (script seeds villages/amenities/projects and computes initial gap documents).
3. Start frontend: `cd frontend; npm run dev` and open the local URL.
4. Login as demo users (seeded):
   - admin@example.com / password
   - officer@example.com / password
   - citizen@example.com / password

Navigate to Map/Dashboard and view color-coded pins, open a village card to see gap detection and suggested actions.


## Deploy Notes
- Use MongoDB Atlas for production DB; restrict IPs and use a DB user.
- Store JWT secret and storage credentials (Cloudinary/Firebase) in environment variables on Render/Vercel.
- For images, use Cloudinary for quick integration (signed uploads optional).
- For offline sync, ensure the backend `/api/sync/reports` accepts batched POSTs with idempotency keys.


## Tests
- Backend: pytest for key routes and gap detection logic (unit tests for rules).
- Frontend: React Testing Library for critical components (Dashboard, Map pin rendering, Report form offline queue).


## Future Improvements / Roadmap
- Replace rule-based logic with explainable ML models using historical datasets
- Add district-level aggregation & trend analytics
- SMS/WhatsApp alerts for critical gaps
- Role-based dashboards with approval workflows for projects
- Mobile PWA with push notifications and background sync


## Impact & Metrics (how judges evaluate)
- Clear problem definition & target population
- Demonstrable detection of critical infrastructure gaps
- Offline capability and field usability
- Explainable decisions and reproducible demo with mock data
- Deployment readiness (short path to production)


## Contributors
- Project: RuralIQ (GramInsight)
- Prototype created as part of SIH submission


## License
MIT — please include a LICENSE file if needed.


## Contact
For questions, contact the development lead: [your-name] <you@example.com>


----

If you want, I can now:
- Scaffold the repository folders (`/frontend`, `/backend`, `/data`, `/docs`) and add starter files (FastAPI app, React Vite app) with the mock data and seed scripts, or
- Tailor this README to use only the exact stack you prefer (e.g., Node.js backend instead of FastAPI), or
- Produce a shorter, judge-friendly one-page README for the SIH submission.

Tell me which of those you'd like next and I will implement it immediately.