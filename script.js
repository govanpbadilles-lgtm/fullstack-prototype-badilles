/* =========================================
   PHASE 4: DATA PERSISTENCE & INITIALIZATION
   ========================================= */
const STORAGE_KEY = 'ipt_demo_final_v3'; // Bumped version to ensure clean load

// Global State
let db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};
let currentUser = null;

// TRACK EDITING STATE (-1 means "Create New")
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
        // Safety checks
        if (!db.employees) db.employees = [];
        if (!db.requests) db.requests = [];
        if (!db.departments) db.departments = [];
    } else {
        seedData();
    }
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

    if ((protectedRoutes.includes(path) || adminRoutes.includes(path)) && !currentUser) {
        navigateTo('login');
        return;
    }

    if (adminRoutes.includes(path) && currentUser && currentUser.role !== 'Admin') {
        alert("Access Denied: Admins only.");
        navigateTo('home');
        return;
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const activePage = document.getElementById(`${path}-page`);
    if (activePage) activePage.classList.add('active');

    // Render Data based on active page
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
   PHASE 3: AUTH
   ========================================= */
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
    db.accounts.push({ firstName: first, lastName: last, email, password: pass, role: "User", verified: false });
    saveToStorage();
    localStorage.setItem('unverified_email', email);
    navigateTo('verify-email');
});

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

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const user = db.accounts.find(u => u.email === email && u.password === pass);

    if (user) {
        if (!user.verified) { alert("Please verify email."); return; }
        localStorage.setItem('auth_token', email);
        setAuthState(true, user);
        navigateTo('profile');
    } else {
        alert("Invalid credentials.");
    }
});

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

function logout() {
    localStorage.removeItem('auth_token');
    setAuthState(false, null);
    navigateTo('home');
}

/* =========================================
   PHASE 5: PROFILE (COMPLETED WITH EDIT)
   ========================================= */
function renderProfile() {
    if (!currentUser) return;
    
    // Updated Layout: Button is now under the Role
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

// Check if form exists (to avoid errors on pages without the modal)
if(document.getElementById('edit-profile-form')) {
    document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newFirst = document.getElementById('prof-first').value;
        const newLast = document.getElementById('prof-last').value;

        // Find user index
        const userIndex = db.accounts.findIndex(u => u.email === currentUser.email);
        
        if (userIndex !== -1) {
            // Update Database
            db.accounts[userIndex].firstName = newFirst;
            db.accounts[userIndex].lastName = newLast;
            
            // Update Global State
            currentUser.firstName = newFirst;
            currentUser.lastName = newLast;

            saveToStorage();
            
            // Refresh UI
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

// --- ACCOUNTS LOGIC ---

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
    
    if (editingAccountIndex === -1) {
        db.accounts.push(data); 
    } else {
        db.accounts[editingAccountIndex] = data; 
    }

    saveToStorage();
    renderAccounts();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('accountModal')).hide();
    e.target.reset();
});

function deleteAccount(i) {
    if (confirm("Sure?")) { db.accounts.splice(i, 1); saveToStorage(); renderAccounts(); }
}


// --- EMPLOYEES LOGIC ---

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
    document.querySelector('#employeeModal .modal-title').innerText = "Add Employee";
    new bootstrap.Modal(document.getElementById('employeeModal')).show();
}

function editEmployee(index) {
    editingEmployeeIndex = index;
    const emp = db.employees[index];
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
    
    const data = {
        id: document.getElementById('emp-id').value,
        email: document.getElementById('emp-email').value,
        position: document.getElementById('emp-pos').value,
        department: document.getElementById('emp-dept').value,
        date: document.getElementById('emp-date').value
    };

    if (editingEmployeeIndex === -1) {
        db.employees.push(data);
    } else {
        db.employees[editingEmployeeIndex] = data;
    }

    saveToStorage();
    renderEmployees();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('employeeModal')).hide();
    e.target.reset();
});

function deleteEmployee(i) {
    if(confirm("Remove?")) { db.employees.splice(i, 1); saveToStorage(); renderEmployees(); }
}


// --- DEPARTMENTS LOGIC ---

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

        if (editingDeptIndex === -1) {
            db.departments.push(data);
        } else {
            db.departments[editingDeptIndex] = data;
        }

        saveToStorage();
        renderDepartments();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('departmentModal')).hide();
        e.target.reset();
    });
}

function deleteDepartment(i) {
    if(confirm("Delete Department?")) { db.departments.splice(i, 1); saveToStorage(); renderDepartments(); }
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
            <td><span class="badge bg-warning">${req.status}</span></td>
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
    div.innerHTML = `<input type="text" class="form-control" placeholder="Item"><input type="number" class="form-control" value="1" style="max-width:80px"><button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('req-items-container').appendChild(div);
}

document.getElementById('request-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const items = [];
    document.querySelectorAll('#req-items-container .input-group').forEach(row => {
        const inputs = row.querySelectorAll('input');
        items.push({ name: inputs[0].value, qty: inputs[1].value });
    });
    db.requests.push({
        id: Date.now(), type: document.getElementById('req-type').value, items, status: "Pending",
        date: new Date().toLocaleDateString(), employeeEmail: currentUser.email
    });
    saveToStorage();
    renderRequests();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('requestModal')).hide();
});