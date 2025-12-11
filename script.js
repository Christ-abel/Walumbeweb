// script.js - Fixed Logic for Admin/Employee Dashboard

const storageKey = 'efs_currentUser';
const setCurrentUser = (user) => sessionStorage.setItem(storageKey, JSON.stringify(user));
const getCurrentUser = () => JSON.parse(sessionStorage.getItem(storageKey) || 'null');
const clearCurrentUser = () => sessionStorage.removeItem(storageKey);

const landingPage = document.getElementById('landing-page');
const dashboardRoot = document.getElementById('dashboard-root');
const loginButton = document.getElementById('login-button');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const registerForm = document.getElementById('register-form');
const jobList = document.getElementById('job-list');
const dashboardTitle = document.getElementById('dashboard-title');
const adminTools = document.getElementById('admin-tools');
const newJobForm = document.getElementById('new-job-form');
const userRoleDisplay = document.getElementById('user-role-display');

let currentUser = getCurrentUser();
const apiBase = 'http://localhost:8080/api';
const useBackend = true;
let backendAvailable = false;

// --- API HELPERS ---
const apiFetch = async (path, init = {}) => {
    const url = `${apiBase}${path}`;
    const res = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, init));
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
};

const checkBackend = async () => {
    try {
        await fetch(`${apiBase}/jobs`);
        backendAvailable = true;
        return true;
    } catch (err) {
        backendAvailable = false;
        console.warn('Backend offline');
        return false;
    }
};

checkBackend().then(() => {
    if (currentUser && dashboardRoot) {
        renderJobs();
    }
});

// --- RENDER CARD LOGIC ---
const renderJobCard = (job, usersMap = {}) => {
    const assignedName = usersMap[job.assignedToId] || 'Unknown';
    let statusBadge = '';
    let actionButton = '';

    if (job.status === 'NOT_ALLOCATED') {
        statusBadge = '<span class="text-amber-600 font-bold">Not Allocated</span>';
        if (currentUser.isAdmin) {
            actionButton = `<button onclick="openAllocateModal(${job.id})" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 font-semibold shadow">Allocate ➜</button>`;
        }
    } else if (job.status === 'ALLOCATED') {
        statusBadge = '<span class="text-blue-600 font-bold">Allocated</span>';
        if (!currentUser.isAdmin && job.assignedToId === currentUser.id) {
            actionButton = `<button onclick="markDone(${job.id})" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Mark Done</button>`;
        }
        if (currentUser.isAdmin) {
             actionButton = `<button onclick="openAllocateModal(${job.id})" class="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300">Re-Allocate</button>`;
        }
    } else {
        statusBadge = '<span class="text-emerald-600 font-bold">Done</span>';
        actionButton = '<span class="text-gray-400 text-sm">Completed</span>';
    }

    if (!currentUser.isAdmin && job.assignedToId !== currentUser.id) return '';

    return `
        <div class="bg-white p-5 rounded-xl shadow-md flex justify-between items-center border-l-4 border-${job.status === 'DONE' ? 'green' : (job.status === 'ALLOCATED' ? 'blue' : 'amber')}-500 mb-4">
            <div>
                <h4 class="text-xl font-semibold text-gray-800">${job.title}</h4>
                <p class="text-gray-600">${job.description}</p>
                ${currentUser.isAdmin ? `<p class="text-xs text-gray-400 mt-1">Assigned to: <span class="font-medium">${assignedName}</span></p>` : ''}
            </div>
            <div class="flex flex-col items-end space-y-2">
                ${statusBadge}
                ${actionButton}
            </div>
        </div>
    `;
};

const renderJobs = async () => {
    jobList.innerHTML = '<p class="text-gray-500">Loading...</p>';
    
    // 1. Setup UI based on Role
    if (currentUser.isAdmin) {
        dashboardTitle.textContent = "Admin Dashboard";
        if (userRoleDisplay) userRoleDisplay.textContent = `User: ${currentUser.name} (Admin)`;
        if (adminTools) adminTools.classList.remove('hidden'); // Show Admin Tools
    } else {
        dashboardTitle.textContent = "My Tasks";
        if (userRoleDisplay) userRoleDisplay.textContent = `User: ${currentUser.name} (Employee)`;
        if (adminTools) adminTools.classList.add('hidden'); // Hide Admin Tools
    }

    // 2. Fetch Data
    let usersMap = { "0": "Not Allocated" };
    try {
        const users = await apiFetch('/users');
        users.forEach(u => usersMap[u.id] = u.name);
    } catch(e) {}

    let jobs = [];
    try {
        jobs = await apiFetch('/jobs');
    } catch(e) {}

    // 3. Render
    jobList.innerHTML = '';
    jobs.sort((a, b) => b.id - a.id); // Newest first

    jobs.forEach(job => {
        jobList.innerHTML += renderJobCard(job, usersMap);
    });

    if (jobList.innerHTML === '') jobList.innerHTML = '<p class="p-4 text-gray-500 text-center">No tasks found.</p>';
};

// --- GLOBAL ACTIONS ---
window.markDone = async (jobId) => {
    await apiFetch(`/jobs/${jobId}/done`, { method: 'PUT' });
    renderJobs();
};

window.openAllocateModal = async (jobId) => {
    const existing = document.getElementById('allocate-modal');
    if (existing) existing.remove();

    let users = [];
    try { users = await apiFetch('/users'); } catch(e) {}
    
    const employees = users.filter(u => !u.isAdmin);

    let userButtons = employees.map(u => `
        <button onclick="assignJob(${jobId}, ${u.id})" class="w-full text-left p-3 border-b hover:bg-blue-50 transition flex justify-between">
            <span class="font-bold text-gray-700">${u.name}</span> 
            <span class="text-gray-400 text-sm">Select</span>
        </button>
    `).join('');

    const modalHtml = `
        <div id="allocate-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-96 overflow-hidden">
                <div class="bg-blue-900 p-4 flex justify-between items-center">
                    <h3 class="text-white font-bold">Assign to Employee</h3>
                    <button onclick="document.getElementById('allocate-modal').remove()" class="text-white text-xl font-bold">&times;</button>
                </div>
                <div class="max-h-64 overflow-y-auto">
                    ${userButtons}
                    ${userButtons.length === 0 ? '<p class="p-4 text-gray-500">No employees found.</p>' : ''}
                </div>
                <div class="p-2 bg-gray-100 text-right">
                    <button onclick="document.getElementById('allocate-modal').remove()" class="text-gray-500 text-sm">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.assignJob = async (jobId, userId) => {
    await apiFetch(`/jobs/${jobId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ assignedToId: userId })
    });
    document.getElementById('allocate-modal').remove();
    renderJobs();
};

window.logout = () => {
    clearCurrentUser();
    window.location.href = 'index.html';
};

// --- FORM HANDLING ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        try {
            const user = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
            setCurrentUser(user);
            window.location.href = 'dashboard.html';
        } catch(e) {
            // Backup Login
            if (u === 'admin' && p === 'password') {
                setCurrentUser({ id: 1, name: 'Admin', isAdmin: true });
                window.location.href = 'dashboard.html';
            } else if (u === 'employee' && p === 'password') {
                setCurrentUser({ id: 2, name: 'Employee', isAdmin: false });
                window.location.href = 'dashboard.html';
            } else {
                if (loginMessage) loginMessage.classList.remove('hidden');
            }
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('reg-username').value;
        const p = document.getElementById('reg-password').value;
        const n = document.getElementById('reg-name').value;
        const r = document.querySelector('input[name="role"]:checked')?.value || 'employee';
        
        try {
            const user = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username: u, password: p, name: n, role: r }) });
            setCurrentUser(user);
            window.location.href = 'dashboard.html';
        } catch(e) { 
            // Backup Register
            const localUser = { id: Date.now(), username: u, name: n, isAdmin: (r === 'admin') };
            setCurrentUser(localUser);
            window.location.href = 'dashboard.html';
        }
    });
}

// Logic for the "Assign New Job" dropdown inside Dashboard
if (newJobForm) {
    const userInput = document.getElementById('assign-user-input');
    const userDropdown = document.getElementById('user-dropdown');
    const assignIdField = document.getElementById('assigned-user-id');
    
    if(userInput) {
        userInput.addEventListener('focus', async () => {
            let users = [];
            try { users = await apiFetch('/users'); } catch(e) {}
            
            userDropdown.innerHTML = '<div onclick="selectUser(0, \'Not Allocated\')" class="p-2 hover:bg-gray-100 cursor-pointer text-amber-600 font-bold">Not Allocated</div>';
            users.forEach(u => {
                if(!u.isAdmin) {
                    userDropdown.innerHTML += `<div onclick="selectUser(${u.id}, '${u.name}')" class="p-2 hover:bg-gray-100 cursor-pointer border-t">${u.name}</div>`;
                }
            });
            userDropdown.classList.remove('hidden');
        });
        
        window.selectUser = (id, name) => {
            userInput.value = name;
            assignIdField.value = id;
            userDropdown.classList.add('hidden');
        };
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#assign-user-input') && !e.target.closest('#user-dropdown')) {
                userDropdown.classList.add('hidden');
            }
        });
    }

    newJobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('job-title').value;
        const desc = document.getElementById('job-description').value;
        const assignId = parseInt(assignIdField.value || 0);
        
        try {
            await apiFetch('/jobs', {
                method: 'POST',
                body: JSON.stringify({ title: title, description: desc, assignedToId: assignId })
            });
            newJobForm.reset();
            assignIdField.value = 0;
            if(userInput) userInput.value = '';
            renderJobs();
        } catch(e) {
            alert("Backend offline. Cannot create job.");
        }
    });
}

if (landingPage && loginButton) {
    loginButton.textContent = currentUser ? 'Dashboard' : 'Login';
    loginButton.onclick = () => window.location.href = currentUser ? 'dashboard.html' : 'login.html';
}

// Hero Slider
const slider = document.getElementById('heroCarousel');
if (slider) {
    let slides = slider.querySelectorAll('.hero-slide');
    let dots = slider.querySelectorAll('.dot');
    let i = 0;
    setInterval(() => {
        slides.forEach(s => s.classList.add('opacity-0'));
        slides[i].classList.remove('opacity-0');
        dots.forEach(d => d.classList.remove('bg-opacity-100'));
        dots[i].classList.add('bg-opacity-100');
        i = (i + 1) % slides.length;
    }, 3000);
}