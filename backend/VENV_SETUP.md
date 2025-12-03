# Flask Backend Setup Guide - Virtual Environment (venv)

## Why Use venv Instead of Conda?

**Problem with Conda:**
- Conda manages packages globally across your system
- Different projects sharing the same conda environment can conflict
- Version conflicts between projects cause errors (like Flask not being found)

**Solution - Python venv:**
- Creates an **isolated environment per project**
- Each project has its own Python packages
- No conflicts between different projects
- Uses only standard Python (no conda needed)

---

## Step-by-Step Setup

### Step 1: Open PowerShell in the Backend Directory

```powershell
cd "C:\Users\HP\OneDrive\Desktop\Walumbe Web\backend"
```

### Step 2: Create Virtual Environment

Run this command to create a folder called `venv` with an isolated Python environment:

```powershell
python -m venv venv
```

**What this does:**
- Creates a `venv` folder in your backend directory
- Inside it contains a copy of Python and pip (package manager)
- This is completely isolated from your system Python and conda

### Step 3: Activate the Virtual Environment

On **Windows PowerShell**:
```powershell
.\venv\Scripts\Activate.ps1
```

If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**What you should see:**
```
(venv) PS C:\Users\HP\OneDrive\Desktop\Walumbe Web\backend>
```

Notice the `(venv)` at the beginning - this means the virtual environment is active!

### Step 4: Install Dependencies

With the virtual environment activated, install Flask and Flask-CORS:

```powershell
pip install -r requirements.txt
```

Or manually:
```powershell
pip install Flask==3.0.0 Flask-CORS==4.0.0 Werkzeug==3.0.1
```

### Step 5: Run the Flask Backend

```powershell
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:8080
 * Debug mode: on
```

---

## Important Notes

**Remember to activate venv every time you want to work on the backend:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python app.py
```

**To deactivate the virtual environment** (when done):
```powershell
deactivate
```

---

## Troubleshooting

**Problem:** `python: The term 'python' is not recognized`
- **Solution:** You need to install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

**Problem:** `pip install` gives permission errors
- **Solution:** Make sure the virtual environment is activated (you should see `(venv)` in the prompt)

**Problem:** Flask still not found after installation
- **Solution:** 
  1. Verify you're in the backend folder: `pwd`
  2. Verify venv is activated: Look for `(venv)` in the prompt
  3. Try again: `pip install -r requirements.txt`

**Problem:** Port 8080 already in use
- **Solution:** Either stop the other process using port 8080, or change the port in `app.py`:
  ```python
  app.run(debug=True, host='0.0.0.0', port=8081)  # Changed to 8081
  ```

---

## File Structure

After setup, your backend folder should look like:
```
backend/
├── venv/                 (virtual environment - do NOT edit)
├── app.py               (Flask app)
├── requirements.txt     (dependencies list)
```

---

## Quick Reference Commands

| Command | What it does |
|---------|-------------|
| `python -m venv venv` | Create virtual environment |
| `.\venv\Scripts\Activate.ps1` | Activate venv (Windows PowerShell) |
| `deactivate` | Deactivate venv |
| `pip install -r requirements.txt` | Install packages from requirements |
| `python app.py` | Run Flask app |
| `pip list` | See all installed packages |
| `pip freeze > requirements.txt` | Save current packages to requirements.txt |

---

## Testing the API

Once the Flask backend is running, test it in another PowerShell window:

**Check health:**
```powershell
curl http://localhost:8080/api/health
```

**Login:**
```powershell
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"password\"}'
```

**List jobs:**
```powershell
curl http://localhost:8080/api/jobs
```

---

## Seed Users (for testing)

- **Username:** admin | **Password:** password | **Admin:** Yes
- **Username:** employee | **Password:** password | **Admin:** No
- **Username:** sarah | **Password:** password | **Admin:** No
