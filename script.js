// script.js - Shared logic for landing page (index.html) and login page (login.html)

// Helper: reads or writes current user to sessionStorage
const storageKey = 'efs_currentUser';
const setCurrentUser = (user) => sessionStorage.setItem(storageKey, JSON.stringify(user));
const getCurrentUser = () => JSON.parse(sessionStorage.getItem(storageKey) || 'null');
const clearCurrentUser = () => sessionStorage.removeItem(storageKey);

// Elements that may exist on page
const landingPage = document.getElementById('landing-page');
const dashboardRoot = document.getElementById('dashboard-root');
const loginButton = document.getElementById('login-button');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const registerForm = document.getElementById('register-form');
// Dashboard-specific elements (may be null on pages where dashboard isn't present)
const jobList = document.getElementById('job-list');
const dashboardTitle = document.getElementById('dashboard-title');
const adminTools = document.getElementById('admin-tools');
const newJobForm = document.getElementById('new-job-form');

let currentUser = getCurrentUser();

// API base - point the frontend to the Java backend when available
const apiBase = 'http://localhost:8080/api';
// Toggle integration; if true the frontend will try API calls first and fallback to localStorage if a call fails
const useBackend = true;
let backendAvailable = false; // updated at runtime

const apiFetch = async (path, init = {}) => {
    const url = `${apiBase}${path}`;
    const res = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, init));
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
    return res.json();
};

// Check backend availability on load
const checkBackend = async () => {
    if (!useBackend) return false;
    try {
        await fetch(`${apiBase}/jobs`);
        backendAvailable = true;
        console.log('Backend available at', apiBase);
        return true;
    } catch (err) {
        backendAvailable = false;
        console.warn('Backend not available, falling back to localStorage:', err.message);
        return false;
    }
};

// Persist mock jobs in localStorage so they survive page reloads
const jobsKey = 'efs_jobs';
const defaultJobs = [
        { id: 1, title: "Install Alarm System - Client A", description: "Full alarm system setup for new residential client including motion sensors and door contacts.", status: "ALLOCATED", assignedToId: 2 },
        { id: 2, title: "CCTV Maintenance - Office B", description: "Routine check and lens cleaning for all 8 CCTV cameras at main office.", status: "DONE", assignedToId: 3 },
        { id: 3, title: "Quote for Solar Panel Installation", description: "Site visit and proposal generation for 5kW solar system at a commercial property.", status: "NOT_ALLOCATED", assignedToId: 0 },
        { id: 4, title: "Electrical Fence Repair - Farm C", description: "Repair damaged section of electrical fence and test voltage.", status: "ALLOCATED", assignedToId: 2 },
        { id: 5, title: "New Alarm System Setup - Admin", description: "Internal setup for new security system in company workshop.", status: "ALLOCATED", assignedToId: 1 },
    ];

const loadJobs = () => {
    try {
        const raw = localStorage.getItem(jobsKey);
        if (!raw) {
            localStorage.setItem(jobsKey, JSON.stringify(defaultJobs));
            return defaultJobs.slice();
        }
        return JSON.parse(raw);
    } catch (err) {
        console.error('Failed to load jobs from storage', err);
        return defaultJobs.slice();
    }
};
const saveJobs = (jobs) => {
    try {
        localStorage.setItem(jobsKey, JSON.stringify(jobs));
    } catch (err) {
        console.error('Failed to save jobs to storage', err);
    }
};

let jobs = loadJobs();

// Check for backend availability and set initial state
checkBackend().then(() => {
    // If currentUser exists and we are on dashboard, fetch and render jobs from backend
    if (currentUser && dashboardRoot !== null) {
        renderJobs().then(() => attachEventListeners()).catch(console.error);
    }
});

// backend-aware job fetching
const fetchJobsForUser = async (userId) => {
    if (useBackend && backendAvailable) {
        try {
            const data = await apiFetch(`/jobs?assignedToId=${userId}`);
            return data;
        } catch (err) {
            console.warn('Failed to fetch jobs from backend, using localStorage fallback:', err.message);
            return jobs.filter(j => j.assignedToId === userId);
        }
    }
    return jobs.filter(j => j.assignedToId === userId);
};

const fetchAllJobs = async () => {
    if (useBackend && backendAvailable) {
        try {
            return await apiFetch('/jobs');
        } catch (err) {
            console.warn('Failed to fetch jobs from backend, using localStorage fallback:', err.message);
            return jobs.slice();
        }
    }
    return jobs.slice();
};

// Mock Job Data - top-level so all pages can use it (dashboard, etc.)
// jobs are loaded above via `loadJobs` into variable `jobs`

    const attachEventListeners = () => {
        // Attach Mark Done listener
        document.querySelectorAll('.mark-done-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const jobId = parseInt(e.target.dataset.jobId);
                await markJobDone(jobId);
            });
        });

        if (newJobForm !== null) {
            // Fetch users and populate dropdown when admin tools are visible
            const fetchAndPopulateUsers = async () => {
                try {
                    const usersList = await apiFetch('/users');
                    const userDropdown = document.getElementById('user-dropdown');
                    userDropdown.innerHTML = '';
                    
                    // Add "Not Allocated" option
                    const notAllocatedOption = document.createElement('div');
                    notAllocatedOption.className = 'p-3 hover:bg-gray-100 cursor-pointer';
                    notAllocatedOption.textContent = 'Not Allocated';
                    notAllocatedOption.onclick = () => {
                        document.getElementById('assign-user-input').value = 'Not Allocated';
                        document.getElementById('assigned-user-id').value = '0';
                        userDropdown.classList.add('hidden');
                    };
                    userDropdown.appendChild(notAllocatedOption);
                    
                    // Add user options
                    usersList.forEach(user => {
                        const option = document.createElement('div');
                        option.className = 'p-3 hover:bg-gray-100 cursor-pointer border-b';
                        option.textContent = `${user.name} (${user.username})`;
                        option.onclick = () => {
                            document.getElementById('assign-user-input').value = user.name;
                            document.getElementById('assigned-user-id').value = user.id;
                            userDropdown.classList.add('hidden');
                        };
                        userDropdown.appendChild(option);
                    });
                } catch (err) {
                    console.warn('Failed to fetch users:', err.message);
                }
            };
            
            // Show dropdown when user starts typing
            const userInput = document.getElementById('assign-user-input');
            userInput.addEventListener('focus', async () => {
                await fetchAndPopulateUsers();
                document.getElementById('user-dropdown').classList.remove('hidden');
            });
            
            userInput.addEventListener('input', (e) => {
                const filter = e.target.value.toLowerCase();
                const options = document.getElementById('user-dropdown').querySelectorAll('div');
                options.forEach(option => {
                    if (filter === '' || option.textContent.toLowerCase().includes(filter)) {
                        option.style.display = 'block';
                    } else {
                        option.style.display = 'none';
                    }
                });
            });
            
            // Hide dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#assign-user-input') && !e.target.closest('#user-dropdown')) {
                    document.getElementById('user-dropdown').classList.add('hidden');
                }
            });
            
            newJobForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = document.getElementById('job-title').value;
                const description = document.getElementById('job-description').value;
                const assignedToId = parseInt(document.getElementById('assigned-user-id').value || '0');

                const newStatus = assignedToId !== 0 ? 'ALLOCATED' : 'NOT_ALLOCATED';

                if (useBackend && backendAvailable) {
                    try {
                        const created = await apiFetch('/jobs', { method: 'POST', body: JSON.stringify({ title, description, status: newStatus, assignedToId }) });
                        // sync cache with backend
                        jobs = await fetchAllJobs();
                    } catch (err) {
                        console.warn('Failed creating job on backend, falling back to local: ', err.message);
                        jobs.unshift({ id: jobs.length + 1, title, description, status: newStatus, assignedToId });
                    }
                } else {
                    jobs.unshift({ id: jobs.length + 1, title, description, status: newStatus, assignedToId });
                    saveJobs(jobs);
                }

                newJobForm.reset();
                document.getElementById('assigned-user-id').value = '0';
                renderJobs();
            });
        }
    };

    const renderJobCard = async (job, usersMap = {}) => {
        const statusMap = {
            'NOT_ALLOCATED': { text: 'Not Allocated', color: 'amber-600', button: '' },
            'ALLOCATED': { text: 'Allocated', color: 'blue-600', button: currentUser && currentUser.isAdmin ? '' : `<button data-job-id="${job.id}" class="mark-done-btn bg-accent text-primary py-1 px-3 rounded-md hover:bg-yellow-600">Mark Done</button>` },
            'DONE': { text: 'Done', color: 'emerald-600', button: '<span class="text-sm text-gray-500">Completed!</span>' }
        };

        const statusInfo = statusMap[job.status];

        // Get assigned user name from usersMap
        const assignedToName = usersMap[job.assignedToId] || 'Unknown';

        if (!currentUser) return '';
        if (!currentUser.isAdmin && job.assignedToId !== currentUser.id) return '';

        return `
            <div class="job-card status-${job.status.toLowerCase()} bg-white p-5 rounded-xl shadow-md flex justify-between items-center">
                <div>
                    <h4 class="text-xl font-semibold text-primary mb-1">${job.title}</h4>
                    <p class="text-sm text-gray-500 mb-2">${job.description}</p>
                    ${currentUser.isAdmin ? `<p class="text-xs text-gray-400">Assigned: ${assignedToName}</p>` : ''}
                </div>
                <div class="flex flex-col items-end space-y-2">
                    <span class="text-sm font-medium text-${statusInfo.color}">${statusInfo.text}</span>
                    ${statusInfo.button}
                </div>
            </div>
        `;
    };

    const renderJobs = async () => {
        jobList.innerHTML = '';

        if (!currentUser) return;

        // Fetch users to create a name map
        let usersMap = { 0: 'Not Allocated' };
        try {
            const usersList = await apiFetch('/users');
            usersList.forEach(user => {
                usersMap[user.id] = user.name;
            });
        } catch (err) {
            console.warn('Failed to fetch users for display:', err.message);
        }

        let listToRender = [];
        if (currentUser.isAdmin) {
            dashboardTitle.textContent = "Admin Dashboard: All Tasks";
            adminTools.classList.remove('hidden');
            listToRender = await fetchAllJobs();
        } else {
            dashboardTitle.textContent = "Employee Dashboard: Your Tasks";
            adminTools.classList.add('hidden');
            listToRender = await fetchJobsForUser(currentUser.id);
        }

        for (const job of listToRender) {
            jobList.innerHTML += await renderJobCard(job, usersMap);
        }

        attachEventListeners();
        // Show a 'no jobs' message if the user has no jobs to display
        const noJobsElem = document.getElementById('no-jobs');
        if (jobList.children.length === 0) {
            if (noJobsElem) noJobsElem.classList.remove('hidden');
            jobList.classList.add('hidden');
        } else {
            if (noJobsElem) noJobsElem.classList.add('hidden');
            jobList.classList.remove('hidden');
        }
    };

    const markJobDone = async (jobId) => {
        if (useBackend && backendAvailable) {
            try {
                await fetch(`${apiBase}/jobs/${jobId}/done`, { method: 'PUT' });
                // sync local cache
                jobs = await fetchAllJobs();
                alertModal('Task marked as DONE!');
                await renderJobs();
                return;
            } catch (err) {
                console.warn('Failed to mark job done via API, falling back to local:', err.message);
            }
        }
        const jobIndex = jobs.findIndex(job => job.id === jobId);
        if (jobIndex > -1) {
            jobs[jobIndex].status = 'DONE';
            saveJobs(jobs);
            await renderJobs();
            alertModal(`Task "${jobs[jobIndex].title}" marked as DONE!`);
        }
    };

    // Navigation helpers
    const showDashboardPage = async () => {
        // Ensure we have a current user
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        // If we're on index.html, redirect to dashboard.html
        if (landingPage !== null) {
            window.location.href = 'dashboard.html';
            return;
        }
        // If we're already on dashboard page, re-render jobs
        await renderJobs();
    };

    const logout = () => {
        clearCurrentUser();
        currentUser = null;
        // Redirect back to landing page
        window.location.href = 'index.html';
    };

    // Expose logout to the global scope so the button can call it inline
    window.logout = logout;

    // Simple alert modal used in the app
    const alertModal = (message) => {
        const existingModal = document.getElementById('custom-alert-modal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div id="custom-alert-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
                    <h4 class="text-xl font-bold text-accent mb-4">Notification</h4>
                    <p class="text-gray-700 mb-6">${message}</p>
                    <button onclick="document.getElementById('custom-alert-modal').remove()" 
                            class="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-300">
                        OK
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    // Initialize landing/dashboard button behavior on pages where it exists
    if (landingPage !== null && loginButton !== null) {
        if (currentUser) {
            loginButton.textContent = 'Dashboard';
            loginButton.onclick = showDashboardPage;
        } else {
            loginButton.textContent = 'Login';
            loginButton.onclick = () => { window.location.href = 'login.html'; };
        }
    }
    
    // If we are on the dashboard page and we have necessary elements, show dashboard
    if (dashboardRoot !== null) {
        // If no user, redirect to login
        if (!currentUser) {
            window.location.href = 'login.html';
        } else {
            // Ensure the logout button and admin tools exist (server is persistent)
            // Render jobs then attach listeners
            renderJobs().then(() => attachEventListeners()).catch(console.error);
        }
    }
 
// If we are on the login page, hook the submit event to set the user object and redirect back
if (loginForm !== null) {
    // If already logged in, redirect to landing which will show dashboard
    if (currentUser) {
        window.location.href = 'dashboard.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.toLowerCase();
        const password = document.getElementById('password').value;

        if (useBackend && backendAvailable) {
            try {
                const user = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
                setCurrentUser(user);
                window.location.href = 'dashboard.html';
                return;
            } catch (err) {
                // fallback to local mock
                console.warn('API login failed, falling back to local mock:', err.message);
            }
        }

        if (password === 'password') {
                if (username === 'admin') {
                    // If using backend, login via API instead
                    // fetch(`${apiBase}/auth/login`, ...)
                    currentUser = { id: 101, name: 'Admin User', isAdmin: true };
                } else if (username === 'employee') {
                    currentUser = { id: 102, name: 'Electrician Mike', isAdmin: false };
                } else {
                    if (loginMessage !== null) {
                        loginMessage.textContent = 'Invalid username or password.';
                        loginMessage.classList.remove('hidden');
                    }
                    return;
                }

                setCurrentUser(currentUser);
                // redirect to dashboard page
                window.location.href = 'dashboard.html';
            } else {
            if (loginMessage !== null) {
                loginMessage.textContent = 'Invalid credentials.';
                loginMessage.classList.remove('hidden');
            }
        }
    });
}

// If we are on the registration page, hook the submit event to mock-register a new user
if (registerForm !== null) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.toLowerCase();
        const password = document.getElementById('reg-password').value;
        const name = document.getElementById('reg-name').value;
        const role = document.querySelector('input[name="role"]:checked')?.value || 'employee';

        if (useBackend && backendAvailable) {
            try {
                const user = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username, name, password, role }) });
                // create starter job for the user on the backend
                await apiFetch('/jobs', { method: 'POST', body: JSON.stringify({ title: `Welcome Job for ${user.name}`, description: `Welcome ${user.name}. This is your first task.`, status: 'ALLOCATED', assignedToId: user.id }) });
                setCurrentUser(user);
                window.location.href = 'dashboard.html';
                return;
            } catch (err) {
                console.warn('Failed to register via backend, falling back to local registration:', err.message);
            }
        }
        // Local fallback
        const user = { id: Date.now() % 10000, name: name || username, username: username, isAdmin: role === 'admin' };
        const starterJob = { id: jobs.length + 1, title: `Welcome Job for ${user.name}`, description: `Welcome ${user.name}. This is your first task.`, status: 'ALLOCATED', assignedToId: user.id };
        jobs.unshift(starterJob);
        saveJobs(jobs);
        setCurrentUser(user);
        window.location.href = 'dashboard.html';
    });
}

// Generic helper: remove any login modal if present on a page (backwards compatibility with modal-based version)
const loginModalElement = document.getElementById('login-modal');
if (loginModalElement) loginModalElement.remove();

// Hero slider initialization
const initHeroSlider = () => {
    const slider = document.getElementById('heroCarousel');
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll('.hero-slide'));
    const dots = Array.from(slider.querySelectorAll('.dot'));
    let active = 0;
    const show = (index) => {
        slides.forEach((s, i) => {
            if (i === index) {
                s.classList.remove('opacity-0', 'pointer-events-none');
                s.classList.add('opacity-100');
                s.setAttribute('aria-hidden', 'false');
            } else {
                s.classList.remove('opacity-100');
                s.classList.add('opacity-0', 'pointer-events-none');
                s.setAttribute('aria-hidden', 'true');
            }
        });
        dots.forEach((d, i) => d.classList.toggle('bg-opacity-60', i === index));
        active = index;
    };
    // Auto-rotate
    let interval = setInterval(() => {
        show((active + 1) % slides.length);
    }, 3500);
    // Dot controls
    dots.forEach((d) => {
        d.addEventListener('click', () => {
            const idx = parseInt(d.dataset.index, 10);
            show(idx);
            // reset interval
            clearInterval(interval);
            interval = setInterval(() => show((active + 1) % slides.length), 3500);
        });
    });
    // Initialize
    show(0);
};

initHeroSlider();
