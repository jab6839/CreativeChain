from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import json, os
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = 'secret_key'

# ---------- Calendar storage ----------
CAL_FILE = 'calendar_events.json'
DEFAULT_EVENTS = [
    {"id": 1, "title": "Clinic – New Patients", "start": "2025-08-10T09:00", "end": "2025-08-10T12:00"},
    {"id": 2, "title": "Botox Session",        "start": "2025-08-11T14:00", "end": "2025-08-11T15:00"}
]
if not os.path.exists(CAL_FILE):
    with open(CAL_FILE, 'w') as f:
        json.dump(DEFAULT_EVENTS, f, indent=4)

def load_calendar():
    with open(CAL_FILE, 'r') as f:
        return json.load(f)

def save_calendar(items):
    with open(CAL_FILE, 'w') as f:
        json.dump(items, f, indent=4)

def next_event_id(items):
    return (max((e.get("id", 0) for e in items), default=0) + 1)

# -----------------------------
# Reminders storage
# -----------------------------
REMINDERS_FILE = 'reminders.json'
DEFAULT_REMINDERS = [
    {
        "id": 1,
        "title": "Call patient re: MRI results",
        "due": "2025-08-08 10:00",
        "priority": "High",
        "assignee": "Front Desk",
        "kind": "Patient",
        "status": "open"
    },
    {
        "id": 2,
        "title": "Order Botox vials (clinic stock)",
        "due": "2025-08-09 09:00",
        "priority": "Medium",
        "assignee": "MA Team",
        "kind": "Internal",
        "status": "open"
    }
]
if not os.path.exists(REMINDERS_FILE):
    with open(REMINDERS_FILE, 'w') as f:
        json.dump(DEFAULT_REMINDERS, f, indent=4)

def load_reminders():
    with open(REMINDERS_FILE, 'r') as f:
        return json.load(f)

def save_reminders(items):
    with open(REMINDERS_FILE, 'w') as f:
        json.dump(items, f, indent=4)

def next_reminder_id(items):
    return (max((r["id"] for r in items), default=0) + 1)

# -----------------------------
# Clinic Notes storage
# -----------------------------
NOTES_FILE = 'clinic_notes.json'
DEFAULT_NOTES = [
    {"title": "Follow-up", "content": "Patient needs MRI results review", "type": "Follow-up"},
    {"title": "Urgent", "content": "Call Dr. Smith about appointment change", "type": "Urgent"},
    {"title": "Prep", "content": "Set up Botox injections for next week", "type": "Botox"}
]
if not os.path.exists(NOTES_FILE):
    with open(NOTES_FILE, 'w') as f:
        json.dump(DEFAULT_NOTES, f, indent=4)

def load_notes():
    with open(NOTES_FILE, 'r') as f:
        return json.load(f)

def save_notes(notes):
    with open(NOTES_FILE, 'w') as f:
        json.dump(notes, f, indent=4)

# -----------------------------
# Messages storage (patient communications)
# -----------------------------
MESSAGES_FILE = 'messages.json'
DEFAULT_MESSAGES = [
    {"patient": "Jane Doe", "message": "Can you confirm my MRI appointment?", "status": "Unread"},
    {"patient": "John Smith", "message": "Need a refill on medication", "status": "Unread"}
]
if not os.path.exists(MESSAGES_FILE):
    with open(MESSAGES_FILE, 'w') as f:
        json.dump(DEFAULT_MESSAGES, f, indent=4)

def load_messages():
    with open(MESSAGES_FILE, 'r') as f:
        return json.load(f)

def save_messages(messages):
    with open(MESSAGES_FILE, 'w') as f:
        json.dump(messages, f, indent=4)

# -----------------------------
# Auth
# -----------------------------
@app.route('/', methods=['GET', 'POST'])
def login():
    error = ''
    if request.method == 'POST':
        if request.form['username'] == 'admin' and request.form['password'] == 'admin':
            session['username'] = 'admin'
            return redirect(url_for('dashboard'))
        error = 'Invalid credentials'
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

# -----------------------------
# Dark mode toggle (POST)
# -----------------------------
@app.route('/toggle_dark_mode', methods=['POST'])
def toggle_dark_mode():
    session['dark_mode'] = not session.get('dark_mode', False)
    return redirect(request.referrer or url_for('dashboard'))

# -----------------------------
# Pages
# -----------------------------
@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html', dark_mode=session.get('dark_mode', False))

# -----------------------------
# Messages (patient communications)
# -----------------------------
@app.route('/messages', methods=['GET', 'POST'])
def messages():
    if 'username' not in session:
        return redirect(url_for('login'))

    messages_list = load_messages()

    if request.method == 'POST':
        patient = request.form.get('patient', '').strip()
        message = request.form.get('message', '').strip()
        if patient and message:
            messages_list.append({"patient": patient, "message": message, "status": "Unread"})
            save_messages(messages_list)
        return redirect(url_for('messages'))

    return render_template('messages.html', messages=messages_list, dark_mode=session.get('dark_mode', False))

@app.route('/delete_message/<int:index>', methods=['POST'])
def delete_message(index):
    if 'username' not in session:
        return redirect(url_for('login'))
    messages_list = load_messages()
    if 0 <= index < len(messages_list):
        del messages_list[index]
        save_messages(messages_list)
    return redirect(url_for('messages'))

# -----------------------------
# Reminders
# -----------------------------
@app.route('/reminders', methods=['GET', 'POST'])
def reminders():
    if 'username' not in session:
        return redirect(url_for('login'))

    items = load_reminders()

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        assignee = request.form.get('assignee', '').strip()
        kind = request.form.get('kind', 'Patient').strip()
        priority = request.form.get('priority', 'Medium').strip()
        due_raw = request.form.get('due', '').strip()  # could be 'YYYY-MM-DDTHH:MM'
        if 'T' in due_raw:
            due = due_raw.replace('T', ' ')
        else:
            due = due_raw
        if title and due:
            items.append({
                "id": next_reminder_id(items),
                "title": title,
                "due": due,
                "priority": priority,
                "assignee": assignee or "Unassigned",
                "kind": kind,
                "status": "open"
            })
            save_reminders(items)
        return redirect(url_for('reminders'))

    return render_template('reminders.html',
                           reminders=items,
                           dark_mode=session.get('dark_mode', False))

@app.route('/reminders/complete/<int:rid>', methods=['POST'])
def reminders_complete(rid):
    if 'username' not in session:
        return redirect(url_for('login'))
    items = load_reminders()
    for r in items:
        if r["id"] == rid:
            r["status"] = "done"
            break
    save_reminders(items)
    return redirect(url_for('reminders'))

@app.route('/reminders/snooze/<int:rid>', methods=['POST'])
def reminders_snooze(rid):
    if 'username' not in session:
        return redirect(url_for('login'))
    items = load_reminders()
    for r in items:
        if r["id"] == rid:
            try:
                dt = datetime.strptime(r["due"], "%Y-%m-%d %H:%M")
                dt += timedelta(days=1)
                r["due"] = dt.strftime("%Y-%m-%d %H:%M")
            except Exception:
                pass
            break
    save_reminders(items)
    return redirect(url_for('reminders'))

@app.route('/reminders/delete/<int:rid>', methods=['POST'])
def reminders_delete(rid):
    if 'username' not in session:
        return redirect(url_for('login'))
    items = load_reminders()
    items = [r for r in items if r["id"] != rid]
    save_reminders(items)
    return redirect(url_for('reminders'))

# -----------------------------
# Calendar
# -----------------------------
@app.route('/calendar')
def calendar():
    if 'username' not in session:
        return redirect(url_for('login'))
    # Important: do not pass events to the template
    return render_template('calendar.html', dark_mode=session.get('dark_mode', False))

@app.route('/api/events')
def api_events():
    # Return JSON that FullCalendar can fetch
    if 'username' not in session:
        return jsonify([]), 401
    return jsonify(load_calendar())

@app.route('/add_calendar_event', methods=['POST'])
def add_calendar_event():
    if 'username' not in session:
        return redirect(url_for('login'))

    title = request.form.get('title', '').strip()
    start = request.form.get('start', '').strip()
    end = request.form.get('end', '').strip()

    if not title or not start:
        return redirect(url_for('calendar'))

    items = load_calendar()
    eid = next_event_id(items)
    event = {"id": eid, "title": title, "start": start}
    if end:
        event["end"] = end

    items.append(event)
    save_calendar(items)
    return redirect(url_for('calendar'))

@app.route('/calendar/delete/<int:eid>', methods=['POST'])
def calendar_delete(eid):
    if 'username' not in session:
        return redirect(url_for('login'))
    items = load_calendar()
    items = [e for e in items if int(e.get("id", 0)) != eid]
    save_calendar(items)
    return redirect(url_for('calendar'))

# -----------------------------
# Schedule
# -----------------------------
@app.route('/schedule')
def schedule():
    if 'username' not in session:
        return redirect(url_for('login'))
    schedules = [
        {"date": "2025-08-08", "time": "09:00–12:00", "provider": "Dr. Rao", "location": "Main Clinic"},
        {"date": "2025-08-08", "time": "13:00–17:00", "provider": "NP Lewis", "location": "Telehealth"},
    ]
    return render_template('schedule.html', schedules=schedules, dark_mode=session.get('dark_mode', False))

# -----------------------------
# Clinic Log (with filters + suggestions)
# -----------------------------
NOTE_TYPES = ["Urgent", "MSF", "Follow-up", "Botox", "General"]
TEMPLATES = {
    "Urgent":      {"title": "Urgent", "content": "⚠️ Action needed today."},
    "MSF":         {"title": "MSF", "content": "MSF slot/clinic item—coordinate with staff."},
    "Follow-up":   {"title": "Follow-up", "content": "Schedule follow-up visit in 2–4 weeks."},
    "Botox":       {"title": "Botox", "content": "Prep Botox consent & order vial(s)."},
    "General":     {"title": "", "content": ""}
}

@app.route('/clinic_log', methods=['GET', 'POST'])
def clinic_log():
    if 'username' not in session:
        return redirect(url_for('login'))

    notes = load_notes()

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()
        note_type = request.form.get('note_type', 'General').strip() or 'General'
        if title and content:
            notes.append({"title": title, "content": content, "type": note_type})
            save_notes(notes)
        return redirect(url_for('clinic_log', filter=request.args.get('filter', 'all')))

    current_filter = request.args.get('filter', 'all')
    if current_filter != 'all':
        notes = [n for n in notes if n.get('type', 'General') == current_filter]

    return render_template(
        'clinic_log.html',
        notes=notes,
        note_types=NOTE_TYPES,
        templates=TEMPLATES,
        current_filter=current_filter,
        dark_mode=session.get('dark_mode', False)
    )

@app.route('/delete_note/<int:index>', methods=['POST'])
def delete_note(index):
    if 'username' not in session:
        return redirect(url_for('login'))
    notes = load_notes()
    if 0 <= index < len(notes):
        del notes[index]
        save_notes(notes)
    return redirect(url_for('clinic_log', filter=request.args.get('filter', 'all')))

# -----------------------------
if __name__ == '__main__':
    app.run(debug=True)

