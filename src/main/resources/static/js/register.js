document.getElementById('registrationForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    const user = {};
    formData.forEach((value, key) => user[key] = value);

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
        .then(response => response.text())
        .then(data => {
            const messageElement = document.getElementById('message');
            messageElement.textContent = data;
            if (data === 'Registration successful') {
                messageElement.style.color = 'green';
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
            } else {
                messageElement.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('message').textContent = 'An error occurred during registration.';
        });
});