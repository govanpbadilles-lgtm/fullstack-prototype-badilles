/* =========================================
   PHASE 1 & 4: INITIALIZATION & LOCAL STORAGE
   ========================================= */
const STORAGE_KEY = 'ipt_demo_v1'; // Base sa Lab 2 guide

let db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};
let currentUser = null;

let editingAccountIndex = -1;
let editingEmployeeIndex = -1;
let editingDeptIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    handleRouting(); 
});

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        db = JSON.parse(data);
        if (!db.employees) db.employees = [];
        if (!db.requests) db.requests = [];
        if (!db.departments) db.departments = [];
    } else {
        seedData();
    }
    
    // Check if user is already logged in
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
    // Seed admin account and departments exactly as requested in Phase 4
    db.accounts.push({
        firstName: "Admin", lastName: "User", email: "admin@example.com",
        password: "Password123!", role: "Admin", verified: true
    });
    db.departments.push(
        { name: "Engineering", description: "Software team" },
        { name: "HR", description: "Human Resources" }
    );
    saveToStorage();
}

/* =========================================
   PHASE 2: ROUTING
   ========================================= */
window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    let hash = window.location.hash || '#/';
    let path = hash.replace('#/', '');
    if (path === '') path = 'home';

    const protectedRoutes = ['profile', 'requests'];
    const adminRoutes = ['employees', 'accounts', 'departments'];

    // Block unauthenticated users from protected/admin routes
    if ((protectedRoutes.includes(path) || adminRoutes.includes(path)) && !currentUser) {
        navigateTo('login');
        return;
    }

    // Block non-admins from admin routes
    if (adminRoutes.includes(path) && currentUser && currentUser.role !== 'Admin') {
        alert("Access Denied: Admins only.");
        navigateTo('home');
        return;
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const activePage = document.getElementById(`${path}-page`);
    if (activePage) activePage.classList.add('active');

    // Trigger render functions when pages load
    if (path === 'profile') renderProfile();
    if (path === 'accounts') renderAccounts();
    if (path === 'departments') renderDepartments();
    if (path === 'requests') renderRequests();
    if (path === 'employees') renderEmployees();
}

function navigateTo(route) {
    window.location.hash = `#/${route}`;
}

/* =========================================
   PHASE 3: AUTHENTICATION SYSTEM (No Backend)
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
    
    // Save new unverified user
    db.accounts.push({ firstName: first, lastName: last, email, password: pass, role: "User", verified: false });
    saveToStorage();
    
    localStorage.setItem('unverified_email', email);
    navigateTo('verify-email');
});

// B. Email Verification (Simulated)
function simulateEmailVerification() {
    const email = localStorage.getItem('unverified_email');
    
    if (!email) {
        alert("No pending verification found.");
        navigateTo('login');
        return;
    }

    const user = db.accounts.find(u => u.email === email);
    if (user) {
        user.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');

        const msgDiv = document.getElementById('verify-message');
        if(msgDiv) msgDiv.innerHTML = "<strong>✅ Email verified! You may now log in.</strong>";
        
        const simBtn = document.getElementById('btn-simulate');
        if(simBtn) {
            simBtn.innerText = "Verified";
            simBtn.disabled = true;
        }

        const loginBtn = document.getElementById('btn-login-link');
        if(loginBtn) {
            loginBtn.classList.remove('disabled');
            loginBtn.classList.remove('btn-outline-secondary');
            loginBtn.classList.add('btn-success');
        }
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
            alert("Please verify email first."); 
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
    document.getElementById('profile-card').innerHTML = `
        <div class="mb-3">
            <h4>${currentUser.firstName} ${currentUser.lastName}</h4>
            <p class="mb-1"><strong>Email:</strong> ${currentUser.email}</p>
            <p class="mb-3"><strong>Role:</strong> <span class="badge bg-info">${currentUser.role}</span></p>
            <button class="btn btn-outline-primary" onclick="prepareEditProfile()">Edit Profile</button>
        </div>
    `;
}

function prepareEditProfile() {
    document.getElementById('prof-first').value = currentUser.firstName;
    document.getElementById('prof-last').value = currentUser.lastName;
    document.getElementById('prof-email').value = currentUser.email; 
    new bootstrap.Modal(document.getElementById('profileModal')).show();
}

if(document.getElementById('edit-profile-form')) {
    document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newFirst = document.getElementById('prof-first').value;
        const newLast = document.getElementById('prof-last').value;
        const userIndex = db.accounts.findIndex(u => u.email === currentUser.email);
        
        if (userIndex !== -1) {
            db.accounts[userIndex].firstName = newFirst;
            db.accounts[userIndex].lastName = newLast;
            currentUser.firstName = newFirst;
            currentUser.lastName = newLast;
            saveToStorage();
            renderProfile(); 
            document.getElementById('navUserDropdown').textContent = newFirst; 
            bootstrap.Modal.getOrCreateInstance(document.getElementById('profileModal')).hide();
            alert("Profile updated!");
        }
    });
}

/* =========================================
   PHASE 6: ADMIN CRUD
   ========================================= */

// A. ACCOUNTS
function renderAccounts() {
    document.getElementById('accounts-table-body').innerHTML = db.accounts.map((acc, index) => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td>${acc.role}</td>
            <td>${acc.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editAccount(${index})">Edit</button>
                <button class="btn btn-sm btn-info me-1" onclick="resetPassword(${index})">Reset PW</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function prepareAddAccount() {
    editingAccountIndex = -1; 
    document.getElementById('add-account-form').reset();
    document.querySelector('#accountModal .modal-title').innerText = "Add Account";
    new bootstrap.Modal(document.getElementById('accountModal')).show();
}

function editAccount(index) {
    editingAccountIndex = index;
    const acc = db.accounts[index];
    document.getElementById('acc-first').value = acc.firstName;
    document.getElementById('acc-last').value = acc.lastName;
    document.getElementById('acc-email').value = acc.email;
    document.getElementById('acc-pass').value = acc.password;
    document.getElementById('acc-role').value = acc.role;
    document.querySelector('#accountModal .modal-title').innerText = "Edit Account";
    new bootstrap.Modal(document.getElementById('accountModal')).show();
}

function resetPassword(index) {
    const acc = db.accounts[index];
    const newPass = prompt(`Enter new password for ${acc.firstName}:`);
    if (newPass) {
        if (newPass.length < 6) { alert("Password too short."); return; }
        db.accounts[index].password = newPass;
        saveToStorage();
        alert("Password updated!");
    }
}

document.getElementById('add-account-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        firstName: document.getElementById('acc-first').value,
        lastName: document.getElementById('acc-last').value,
        email: document.getElementById('acc-email').value,
        password: document.getElementById('acc-pass').value,
        role: document.getElementById('acc-role').value,
        verified: true
    };
    if (editingAccountIndex === -1) db.accounts.push(data); 
    else db.accounts[editingAccountIndex] = data; 
    saveToStorage();
    renderAccounts();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('accountModal')).hide();
    e.target.reset();
});

function deleteAccount(i) {
    if (confirm("Are you sure?")) { 
        if(db.accounts[i].email === currentUser.email) {
            alert("You cannot delete your own account!");
            return;
        }
        db.accounts.splice(i, 1); 
        saveToStorage(); 
        renderAccounts(); 
    }
}

// B. DEPARTMENTS
function renderDepartments() {
    const tbody = document.getElementById('departments-table-body');
    if (!tbody) return;
    if (!db.departments) db.departments = [];
    tbody.innerHTML = db.departments.map((dept, index) => `
        <tr>
            <td>${dept.name}</td>
            <td>${dept.description}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="editDepartment(${index})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function prepareAddDepartment() {
    editingDeptIndex = -1;
    document.getElementById('add-department-form').reset();
    document.querySelector('#departmentModal .modal-title').innerText = "Add Department";
    new bootstrap.Modal(document.getElementById('departmentModal')).show();
}

function editDepartment(index) {
    editingDeptIndex = index;
    const dept = db.departments[index];
    document.getElementById('dept-name').value = dept.name;
    document.getElementById('dept-desc').value = dept.description;
    document.querySelector('#departmentModal .modal-title').innerText = "Edit Department";
    new bootstrap.Modal(document.getElementById('departmentModal')).show();
}

if(document.getElementById('add-department-form')) {
    document.getElementById('add-department-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('dept-name').value,
            description: document.getElementById('dept-desc').value
        };
        if (editingDeptIndex === -1) db.departments.push(data);
        else db.departments[editingDeptIndex] = data;
        saveToStorage();
        renderDepartments();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('departmentModal')).hide();
        e.target.reset();
    });
}

function deleteDepartment(i) {
    if(confirm("Delete Department?")) { db.departments.splice(i, 1); saveToStorage(); renderDepartments(); }
}

// C. EMPLOYEES
function renderEmployees() {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;
    if (!db.employees) db.employees = [];
    tbody.innerHTML = db.employees.map((emp, index) => `
        <tr>
            <td>${emp.id}</td>
            <td>${emp.email}</td>
            <td>${emp.position}</td>
            <td>${emp.department}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editEmployee(${index})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function prepareAddEmployee() {
    editingEmployeeIndex = -1;
    document.getElementById('add-employee-form').reset();
    
    // Populate Department Dropdown
    const deptSelect = document.getElementById('emp-dept');
    deptSelect.innerHTML = db.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('');

    document.querySelector('#employeeModal .modal-title').innerText = "Add Employee";
    new bootstrap.Modal(document.getElementById('employeeModal')).show();
}

function editEmployee(index) {
    editingEmployeeIndex = index;
    const emp = db.employees[index];
    
    // Populate Department Dropdown
    const deptSelect = document.getElementById('emp-dept');
    deptSelect.innerHTML = db.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('');

    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-email').value = emp.email;
    document.getElementById('emp-pos').value = emp.position;
    document.getElementById('emp-dept').value = emp.department;
    document.getElementById('emp-date').value = emp.date;
    document.querySelector('#employeeModal .modal-title').innerText = "Edit Employee";
    new bootstrap.Modal(document.getElementById('employeeModal')).show();
}

document.getElementById('add-employee-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('emp-email').value;
    
    // Check if email belongs to an existing account
    if (!db.accounts.find(u => u.email === emailInput)) {
        alert("User Email must match an existing account!");
        return;
    }

    const data = {
        id: document.getElementById('emp-id').value,
        email: emailInput,
        position: document.getElementById('emp-pos').value,
        department: document.getElementById('emp-dept').value,
        date: document.getElementById('emp-date').value
    };
    if (editingEmployeeIndex === -1) db.employees.push(data);
    else db.employees[editingEmployeeIndex] = data;
    saveToStorage();
    renderEmployees();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('employeeModal')).hide();
    e.target.reset();
});

function deleteEmployee(i) {
    if(confirm("Remove?")) { db.employees.splice(i, 1); saveToStorage(); renderEmployees(); }
}

/* =========================================
   PHASE 7: REQUESTS
   ========================================= */
function renderRequests() {
    const myRequests = db.requests.filter(r => r.employeeEmail === currentUser.email);
    document.getElementById('requests-table-body').innerHTML = myRequests.map(req => `
        <tr>
            <td>${req.date}</td>
            <td>${req.type}</td>
            <td>${req.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</td>
            <td><span class="badge bg-warning text-dark">${req.status}</span></td>
        </tr>
    `).join('');
}

function openRequestModal() {
    document.getElementById('req-items-container').innerHTML = '';
    addRequestItemRow();
    new bootstrap.Modal(document.getElementById('requestModal')).show();
}

function addRequestItemRow() {
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `<input type="text" class="form-control" placeholder="Item" required><input type="number" class="form-control" value="1" min="1" style="max-width:80px" required><button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('req-items-container').appendChild(div);
}

document.getElementById('request-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const items = [];
    document.querySelectorAll('#req-items-container .input-group').forEach(row => {
        const inputs = row.querySelectorAll('input');
        if(inputs[0].value) { // Basic validation
            items.push({ name: inputs[0].value, qty: inputs[1].value });
        }
    });

    if(items.length === 0) {
        alert("Please add at least one item.");
        return;
    }

    db.requests.push({
        id: Date.now(), type: document.getElementById('req-type').value, items, status: "Pending",
        date: new Date().toLocaleDateString(), employeeEmail: currentUser.email
    });
    saveToStorage();
    renderRequests();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('requestModal')).hide();
});