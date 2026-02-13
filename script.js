let isLoggedIn = false;

function updateNavbar() {
    const nav = document.getElementById("navLinks");

    if (isLoggedIn) {
        nav.innerHTML = `
            <a href="#">Dashboard</a>
            <a href="#" onclick="logout()">Logout</a>
        `;
    } else {
        nav.innerHTML = `
            <a href="#">Login</a>
            <a href="#">Register</a>
        `;
    }
}

function login() {
    isLoggedIn = true;
    updateNavbar();
}

function logout() {
    isLoggedIn = false;
    updateNavbar();
}

updateNavbar();
