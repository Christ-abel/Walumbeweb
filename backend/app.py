import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- Configuration & Persistence Setup ---
DATA_FILE = 'data.json'
DEFAULT_DATA = {
    'users_store': {
        '1': {'id': 1, 'username': 'admin', 'name': 'Admin User', 'password': 'password', 'is_admin': True},
        '2': {'id': 2, 'username': 'emp1', 'name': 'Employee One', 'password': 'password', 'is_admin': False},
    },
    'next_user_id': 3,
    'jobs_store': {
        '101': {'id': 101, 'title': 'Fix Backend Bug', 'description': 'The API sometimes returns 500.', 'status': 'IN_PROGRESS', 'assigned_to_id': 2},
        '102': {'id': 102, 'title': 'Design Homepage', 'description': 'Create a new design for the main landing page.', 'status': 'NOT_ALLOCATED', 'assigned_to_id': 0},
    },
    'next_job_id': 103,
}

def load_data():
    """Load data from JSON file, or create file with default data if it doesn't exist."""
    if not os.path.exists(DATA_FILE):
        print(f"Creating default data file: {DATA_FILE}")
        with open(DATA_FILE, 'w') as f:
            json.dump(DEFAULT_DATA, f, indent=4)
        return DEFAULT_DATA
    
    with open(DATA_FILE, 'r') as f:
        # JSON keys are always strings, so we ensure IDs in stores are read as strings
        return json.load(f)

def save_data(data):
    """Save current data back to JSON file."""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# Load data on startup
APP_DATA = load_data()

# Initialize Flask app
app = Flask(__name__)
# Configure CORS for frontend access
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5500"}})

# =======================================================
# ===================== ENDPOINTS =======================
# =======================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400
    
    user = next((u for u in APP_DATA['users_store'].values() if u['username'] == username), None)

    if user is None or user['password'] != password:
        return jsonify({'error': 'invalid credentials'}), 401
    
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'name': user['name'],
        'isAdmin': user['is_admin']
    }), 200

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    name = data.get('name')
    password = data.get('password')
    role = data.get('role', 'employee')
    
    if not username or not password or not name:
        return jsonify({'error': 'username, name and password required'}), 400
    
    if next((u for u in APP_DATA['users_store'].values() if u['username'] == username), None):
        return jsonify({'error': 'username already exists'}), 409
    
    # Get and increment ID
    new_id = APP_DATA['next_user_id']
    APP_DATA['next_user_id'] += 1
    is_admin = role.lower() == 'admin'
    
    new_user = {
        'id': new_id,
        'username': username,
        'name': name,
        'password': password, 
        'is_admin': is_admin
    }
    
    # Save to store and file (JSON keys must be strings)
    APP_DATA['users_store'][str(new_id)] = new_user 
    save_data(APP_DATA)
    
    return jsonify({
        'id': new_user['id'],
        'username': new_user['username'],
        'name': new_user['name'],
        'isAdmin': new_user['is_admin']
    }), 201

@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    assigned_to_id = request.args.get('assignedToId', type=int)
    jobs_list = list(APP_DATA['jobs_store'].values())
    
    if assigned_to_id is not None:
        jobs_list = [job for job in jobs_list if job['assigned_to_id'] == assigned_to_id]
    
    jobs_list.sort(key=lambda x: x['id'])
    return jsonify(jobs_list), 200

@app.route('/api/jobs', methods=['POST'])
def create_job():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    status = data.get('status', 'NOT_ALLOCATED')
    assigned_to_id = data.get('assignedToId', 0)
    
    if not title or not description:
        return jsonify({'error': 'title and description required'}), 400
    
    # Get and increment ID
    new_id = APP_DATA['next_job_id']
    APP_DATA['next_job_id'] += 1
    
    new_job = {
        'id': new_id,
        'title': title,
        'description': description,
        'status': status,
        'assignedToId': assigned_to_id
    }
    
    # Save to store and file
    APP_DATA['jobs_store'][str(new_id)] = new_job 
    save_data(APP_DATA)
    
    return jsonify(new_job), 201

@app.route('/api/jobs/<int:job_id>/done', methods=['PUT'])
def mark_done(job_id):
    job_to_update = APP_DATA['jobs_store'].get(str(job_id))
    
    if job_to_update is None:
        return jsonify({'error': 'job not found'}), 404
    
    job_to_update['status'] = 'DONE'
    save_data(APP_DATA)
    
    return jsonify({'ok': True}), 200

@app.route('/api/users', methods=['GET'])
def list_users():
    users_list = []
    for user in APP_DATA['users_store'].values():
        users_list.append({
            'id': user['id'],
            'name': user['name'],
            'username': user['username'],
            'isAdmin': user['is_admin']
        })
    
    users_list.sort(key=lambda x: x['name'])
    return jsonify(users_list), 200

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'storage': 'json-persistent'}), 200

if __name__ == '__main__':
    print("Starting Flask backend with JSON file persistence on port 8080...")
    app.run(debug=True, host='0.0.0.0', port=8080)