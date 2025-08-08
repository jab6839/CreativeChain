# NeuroSphere (Flask) – Clinic Dashboard

Flask app with login, dashboard, calendar (FullCalendar), reminders, clinic log, messages, and dark mode.

## Requirements
- Python 3.11+ (3.12/3.13 OK)
- macOS/Windows/Linux

## Setup
```bash
cd NeuroSphere
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

Open: http://127.0.0.1:5000

Login: admin / admin

**Notes**  
JSON data files are created automatically on first run.

If port 5000 is busy, stop other Flask apps or change the port in app.py.
