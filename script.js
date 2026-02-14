/* =========================================
   PHASE 4: DATA PERSISTENCE & INITIALIZATION
   ========================================= */
const STORAGE_KEY = 'ipt_demo_v1';

// Global State
let db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};
let currentUser = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    handleRouting(); // Handle initial URL
});

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        db = JSON.parse(data);
    } else {
        // Seed Data if empty
        seedData();
    }
    // Check if user was logged in
    const storedEmail = localStorage.getItem('auth_token');
    if (storedEmail) {
        const user = db.accounts.find(u => u.email === storedEmail);
        if (user) setAuthState(true, user);
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function seedData() {
    db.accounts.push({
        firstName: "Admin", lastName: "User", email: "ucadmin@gmail.com",
        password: "waypassword", role: "Admin", verified: true
    });
    db.departments.push(
        { name: "Engineering", description: "Tech stuff" },
        { name: "HR", description: "People stuff" }
    );
    saveToStorage();
}

/* =========================================
   PHASE 2: CLIENT-SIDE ROUTING
   ========================================= */
window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    let hash = window.location.hash || '#/';
    
    // Normalize hash (e.g., #/login -> login)
    let path = hash.replace('#/', '');
    if (path === '') path = 'home';

    // Guard: Protect routes
    const protectedRoutes = ['profile', 'requests'];
    const adminRoutes = ['employees', 'accounts', 'departments'];

    if ((protectedRoutes.includes(path) || adminRoutes.includes(path)) && !currentUser) {
        navigateTo('login');
        return;
    }

    if (adminRoutes.includes(path) && currentUser && currentUser.role !== 'Admin') {
        alert("Access Denied: Admins only.");
        navigateTo('home');
        return;
    }

    // UI Switching
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const activePage = document.getElementById(`${path}-page`);
    if (activePage) activePage.classList.add('active');

    // Render Data based on page
    if (path === 'profile') renderProfile();
    if (path === 'accounts') renderAccounts();
    if (path === 'departments') renderDepartments();
    if (path === 'requests') renderRequests();
}

function navigateTo(route) {
    window.location.hash = `#/${route}`;
}

/* =========================================
   PHASE 3: AUTHENTICATION
   ========================================= */

// A. Registration
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const first = document.getElementById('reg-first').value;
    const last = document.getElementById('reg-last').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if (db.accounts.find(u => u.email === email)) {
        alert("Email already exists!");
        return;
    }

    const newUser = { firstName: first, lastName: last, email, password: pass, role: "User", verified: false };
    db.accounts.push(newUser);
    saveToStorage();

    localStorage.setItem('unverified_email', email);
    navigateTo('verify-email');
});

// B. Email Verification
function simulateEmailVerification() {
    const email = localStorage.getItem('unverified_email');
    if (!email) { navigateTo('login'); return; }

    const user = db.accounts.find(u => u.email === email);
    if (user) {
        user.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');
        alert("Email Verified! Please Login.");
        navigateTo('login');
    }
}

// C. Login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    const user = db.accounts.find(u => u.email === email && u.password === pass);

    if (user) {
        if (!user.verified) {
            alert("Please verify your email first.");
            return;
        }
        localStorage.setItem('auth_token', email);
        setAuthState(true, user);
        navigateTo('profile');
    } else {
        alert("Invalid credentials.");
    }
});

// D. Auth State Management
function setAuthState(isAuth, user) {
    currentUser = user;
    if (isAuth) {
        document.body.classList.remove('not-authenticated');
        document.body.classList.add('authenticated');
        document.getElementById('navUserDropdown').textContent = user.firstName;
        
        if (user.role === 'Admin') document.body.classList.add('is-admin');
        else document.body.classList.remove('is-admin');
    } else {
        currentUser = null;
        document.body.classList.add('not-authenticated');
        document.body.classList.remove('authenticated');
        document.body.classList.remove('is-admin');
    }
}

// E. Logout
function logout() {
    localStorage.removeItem('auth_token');
    setAuthState(false, null);
    navigateTo('home');
}

/* =========================================
   PHASE 5: PROFILE
   ========================================= */
function renderProfile() {
    if (!currentUser) return;
    const container = document.getElementById('profile-card');
    container.innerHTML = `
        <h4>${currentUser.firstName} ${currentUser.lastName}</h4>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Role:</strong> <span class="badge bg-info">${currentUser.role}</span></p>
        <button class="btn btn-outline-primary" onclick="alert('Edit feature coming soon!')">Edit Profile</button>
    `;
}

/* =========================================
   PHASE 6: ADMIN CRUD (Accounts & Depts)
   ========================================= */
function renderAccounts() {
    const tbody = document.getElementById('accounts-table-body');
    tbody.innerHTML = db.accounts.map((acc, index) => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td>${acc.role}</td>
            <td>${acc.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Add Account (Admin)
document.getElementById('add-account-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newUser = {
        firstName: document.getElementById('acc-first').value,
        lastName: document.getElementById('acc-last').value,
        email: document.getElementById('acc-email').value,
        password: document.getElementById('acc-pass').value,
        role: document.getElementById('acc-role').value,
        verified: true
    };
    db.accounts.push(newUser);
    saveToStorage();
    renderAccounts();
    // Close Modal (using Bootstrap API)
    const modalEl = document.getElementById('accountModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    e.target.reset();
});

function deleteAccount(index) {
    if (confirm("Are you sure?")) {
        db.accounts.splice(index, 1);
        saveToStorage();
        renderAccounts();
    }
}

function renderDepartments() {
    const list = document.getElementById('departments-list');
    list.innerHTML = db.departments.map(dept => `
        <li class="list-group-item">
            <strong>${dept.name}</strong> - ${dept.description}
        </li>
    `).join('');
}

/* =========================================
   PHASE 7: USER REQUESTS
   ========================================= */
function renderRequests() {
    const tbody = document.getElementById('requests-table-body');
    // Filter requests for current user
    const myRequests = db.requests.filter(r => r.employeeEmail === currentUser.email);
    
    tbody.innerHTML = myRequests.map(req => `
        <tr>
            <td>${req.date}</td>
            <td>${req.type}</td>
            <td>${req.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</td>
            <td><span class="badge bg-warning">${req.status}</span></td>
        </tr>
    `).join('');
}

// Open Modal & Reset
function openRequestModal() {
    document.getElementById('req-items-container').innerHTML = ''; // Clear items
    addRequestItemRow(); // Add first empty row
    new bootstrap.Modal(document.getElementById('requestModal')).show();
}

// Dynamic Item Rows
function addRequestItemRow() {
    const container = document.getElementById('req-items-container');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `
        <input type="text" class="form-control" placeholder="Item Name" required>
        <input type="number" class="form-control" placeholder="Qty" value="1" style="max-width: 80px" required>
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

// Handle Request Submit
document.getElementById('request-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Gather Items
    const items = [];
    document.querySelectorAll('#req-items-container .input-group').forEach(row => {
        const inputs = row.querySelectorAll('input');
        items.push({ name: inputs[0].value, qty: inputs[1].value });
    });

    const newRequest = {
        id: Date.now(),
        type: document.getElementById('req-type').value,
        items: items,
        status: "Pending",
        date: new Date().toLocaleDateString(),
        employeeEmail: currentUser.email
    };

    db.requests.push(newRequest);
    saveToStorage();
    renderRequests();
    
    // Close Modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('requestModal'));
    modal.hide();
});