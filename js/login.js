// Login logic using localStorage

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;

        let users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            alert('Login successful! Welcome, ' + user.name + '.');
            // You can set a logged-in flag or redirect here
            window.location.href = 'index.html';
        } else {
            alert('Invalid email or password.');
        }
    });
});
