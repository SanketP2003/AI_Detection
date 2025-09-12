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
                    // Success! The server has authenticated the user and set the session cookie.
                    // Now, we can safely redirect to the home page.
                    window.location.href = '/home.html';
                } else {
                    // Failure. Display an error message.
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
