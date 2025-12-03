# ElectroFlow Frontend Mockup

This workspace contains a simple static frontend mockup. I separated the login into its own page and extracted JavaScript into `script.js`.

Files:
- `index.html` — Landing page and dashboard (protected via sessionStorage mock-auth).
- `login.html` — Login page to perform a mock login (username/password check).
- `script.js` — Shared JS used by both pages.

How to test locally:
1. Start the backend API (optional - recommended):
	- Open a terminal in the `backend/` folder and run:
	  ```powershell
	  mvn spring-boot:run
	  ```
	- The backend will start at http://localhost:8080.

2. Start the frontend dev server (static files):
	- From project root, run:
	  ```powershell
	  npm start
	  ```
	- The site will be available at http://localhost:5500.

3. Visit the site and test:
	- The frontend will attempt to use the backend API (http://localhost:8080/api) automatically; if the backend isn't reachable, it falls back to localStorage-based mock behavior.
	- Login via `login.html` with `admin/password` or `employee/password` to see the dashboard.
	- Registering at `register.html` will create a mock user and a starter job. If backend is running, registration and created jobs will be persisted by the API.
	- The "Logout" button clears the session and returns to the landing page.

	Quick run scripts:
	- `run-backend.ps1` - starts the Java backend in the current PowerShell window.
		- The script uses `mvnw` (wrapper) if present, otherwise it uses `mvn` on PATH.
	- `run-frontend.ps1` - starts the Node static server in the current PowerShell window.
	- `run-dev.ps1` - opens two new PowerShell windows and runs both servers (backend + frontend).
	- `run-all.bat` - batch script that starts both in separate PowerShell windows.

	Maven wrapper usage (no system Maven required)
	- You can run the backend using the included `mvnw` wrapper (this downloads Maven locally if needed):
		```powershell
		cd "C:\Users\HP\OneDrive\Desktop\Walumbe Web\backend"
		.\mvnw spring-boot:run
		```
		The wrapper prefers system `mvn` (if installed), then Docker (if available), then downloads a local Maven distribution inside `.mvn/apache-maven` and uses it.


	Example API calls (useful for testing):

	- Login:
		```powershell
		curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"password\"}"
		```

	- List jobs:
		```powershell
		curl http://localhost:8080/api/jobs
		```

	- List jobs for an admin or a specific user (replace ID):
		```powershell
		curl 'http://localhost:8080/api/jobs?assignedToId=101'
		```

	If the backend is not running the frontend will automatically fallback to the mock mode where all data is persisted in localStorage.

Notes:
- This uses `sessionStorage` for a simple mock authentication; for a real app, replace with server-side auth and proper redirects.
- The JS is currently designed for a local filesystem setup where `index.html` and `login.html` are in the same folder.
 - A tiny Node-based dev server is included for convenience. Run `npm start` to serve files at http://localhost:5500
 - A Spring Boot Java backend is included under `backend/` for demo API calls. It runs on port 8080 by default.
