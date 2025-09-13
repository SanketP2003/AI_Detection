document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(data)
                });

                if (response.ok) {
                    window.location.href = '/home.html';
                } else {
                    errorMessage.textContent = 'Invalid username or password. Please try again.';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Login request failed:', error);
                errorMessage.textContent = 'An unexpected error occurred. Please try again later.';
                errorMessage.style.display = 'block';
            }
        });
    }
});
