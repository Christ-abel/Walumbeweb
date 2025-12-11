import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

DATA_FILE = 'data.json'

# --- CLEAN DATA: Only Admin exists by default ---
DEFAULT_DATA = {
    'users_store': {
        '1': {'id': 1, 'username': 'admin', 'name': 'Admin User', 'password': 'password', 'is_admin': True},
        # I REMOVED THE FAKE EMPLOYEES HERE
    },
    'next_user_id': 2, # Starts counting from 2
    'jobs_store': {}, 
    'next_job_id': 101,
}

def load_data():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            json.dump(DEFAULT_DATA, f, indent=4)
        return DEFAULT_DATA
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

APP_DATA = load_data()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- ROUTES ---

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = next((u for u in APP_DATA['users_store'].values() if u['username'] == username), None)
    if user is None or user['password'] != password:
        return jsonify({'error': 'invalid credentials'}), 401
    return jsonify({'id': user['id'], 'username': user['username'], 'name': user['name'], 'isAdmin': user['is_admin']}), 200

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    name = data.get('name')
    password = data.get('password')
    role = data.get('role', 'employee')
    
    if next((u for u in APP_DATA['users_store'].values() if u['username'] == username), None):
        return jsonify({'error': 'username already exists'}), 409
    
    new_id = APP_DATA['next_user_id']
    APP_DATA['next_user_id'] += 1
    
    new_user = {'id': new_id, 'username': username, 'name': name, 'password': password, 'is_admin': role.lower() == 'admin'}
    APP_DATA['users_store'][str(new_id)] = new_user 
    save_data(APP_DATA)
    return jsonify(new_user), 201

@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    assigned_to_id = request.args.get('assignedToId', type=int)
    jobs_list = list(APP_DATA['jobs_store'].values())
    if assigned_to_id is not None:
        jobs_list = [job for job in jobs_list if job.get('assignedToId') == assigned_to_id]
    
    jobs_list.sort(key=lambda x: x['id'], reverse=True)
    return jsonify(jobs_list), 200

@app.route('/api/jobs', methods=['POST'])
def create_job():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    assigned_to_id = data.get('assignedToId', 0)
    # Logic: If ID is valid and not 0, it is ALLOCATED
    status = 'ALLOCATED' if assigned_to_id and assigned_to_id != 0 else 'NOT_ALLOCATED'
    
    new_id = APP_DATA['next_job_id']
    APP_DATA['next_job_id'] += 1
    
    new_job = {
        'id': new_id, 
        'title': title, 
        'description': description, 
        'status': status, 
        'assignedToId': assigned_to_id 
    }
    APP_DATA['jobs_store'][str(new_id)] = new_job 
    save_data(APP_DATA)
    return jsonify(new_job), 201

@app.route('/api/jobs/<int:job_id>/done', methods=['PUT'])
def mark_done(job_id):
    job = APP_DATA['jobs_store'].get(str(job_id))
    if not job: return jsonify({'error': 'not found'}), 404
    job['status'] = 'DONE'
    save_data(APP_DATA)
    return jsonify(job), 200

@app.route('/api/jobs/<int:job_id>/assign', methods=['PUT'])
def assign_job(job_id):
    data = request.get_json()
    new_assigned_id = data.get('assignedToId')
    
    job = APP_DATA['jobs_store'].get(str(job_id))
    if not job: return jsonify({'error': 'not found'}), 404
    
    job['assignedToId'] = new_assigned_id
    job['status'] = 'NOT_ALLOCATED' if new_assigned_id == 0 else 'ALLOCATED'
    
    save_data(APP_DATA)
    return jsonify(job), 200

@app.route('/api/users', methods=['GET'])
def list_users():
    users_list = list(APP_DATA['users_store'].values())
    clean_users = [{'id': u['id'], 'name': u['name'], 'username': u['username'], 'isAdmin': u['is_admin']} for u in users_list]
    clean_users.sort(key=lambda x: x['name'])
    return jsonify(clean_users), 200

if __name__ == '__main__':
    print("Starting Flask Backend on port 8080...")
    app.run(debug=True, host='0.0.0.0', port=8080)