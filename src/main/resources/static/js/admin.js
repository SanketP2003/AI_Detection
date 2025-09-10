document.addEventListener('DOMContentLoaded', async () => {
    const nameSpan = document.getElementById('nav-username');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminContainer = document.querySelector('.admin-container');
    const userTableBody = document.getElementById('userTableBody');
    const editUserForm = document.getElementById('editUserForm');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    // Simulate user authentication with ROLE_ADMIN by default
    const simulateAuthCheck = async () => {
        return {
            username: "admin_user",
            authorities: [{authority: "ROLE_ADMIN"}]
            // For testing ROLE_USER, use: authorities: [{ authority: "ROLE_USER" }]
        };
    };

    const user = await simulateAuthCheck();

    if (user && user.username && user.authorities && user.authorities.some(auth => auth.authority === 'ROLE_ADMIN')) {
        logoutBtn.style.display = 'block';
        nameSpan.textContent = 'Welcome, ' + user.username;

        // Tab navigation functionality for admin panel
        const tabLinks = document.querySelectorAll('.sidebar-menu a');
        const tabSections = document.querySelectorAll('.admin-section');

        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.getAttribute('data-tab');

                tabLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                tabSections.forEach(section => section.classList.remove('active'));
                document.getElementById(`${tabId}-section`).classList.add('active');
            });
        });

        // Fetch and populate users
        async function fetchUsers() {
            try {
                const response = await fetch('http://localhost:8080/users');
                const users = await response.json();
                userTableBody.innerHTML = '';
                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td><span class="badge ${user.status === 'Active' ? 'badge-success' : 'badge-danger'}">${user.status}</span></td>
                        <td>
                            <button class="btn btn-secondary edit-btn" data-id="${user.id}">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${user.id}">Delete</button>
                        </td>
                    `;
                    userTableBody.appendChild(row);
                });

                // Add event listeners for edit and delete buttons
                document.querySelectorAll('.edit-btn').forEach(button => {
                    button.addEventListener('click', () => editUser(button.dataset.id));
                });
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', () => deleteUser(button.dataset.id));
                });
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        }

        // Edit user function
        function editUser(id) {
            fetch(`http://localhost:8080/users/${id}`)
                .then(response => response.json())
                .then(user => {
                    document.getElementById('editUsername').value = user.username;
                    document.getElementById('editEmail').value = user.email;
                    document.getElementById('editRole').value = user.role;
                    document.getElementById('editStatus').value = user.status;
                    editUserForm.dataset.id = id;
                    editUserForm.style.display = 'block';
                })
                .catch(error => console.error('Error fetching user:', error));
        }

        // Save edited user
        saveEditBtn.addEventListener('click', () => {
            const id = editUserForm.dataset.id;
            const updatedUser = {
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                role: document.getElementById('editRole').value,
                status: document.getElementById('editStatus').value
            };
            fetch(`http://localhost:8080/users/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(updatedUser)
            })
                .then(response => response.json())
                .then(() => {
                    editUserForm.style.display = 'none';
                    fetchUsers(); // Refresh user list
                })
                .catch(error => console.error('Error updating user:', error));
        });

        // Cancel edit
        cancelEditBtn.addEventListener('click', () => {
            editUserForm.style.display = 'none';
        });

        // Delete user function
        function deleteUser(id) {
            if (confirm('Are you sure you want to delete this user?')) {
                fetch(`http://localhost:8080/users/${id}`, {
                    method: 'DELETE'
                })
                    .then(() => fetchUsers()) // Refresh user list
                    .catch(error => console.error('Error deleting user:', error));
            }
        }

        // Initial fetch of users
        fetchUsers();
    } else {
        // Hide admin content and show access denied message
        adminContainer.innerHTML = `
            <div class="access-denied">
                <h2>Access Denied</h2>
                <p>You do not have the necessary admin privileges to access this page.</p>
                <a href="home.html" class="btn btn-primary">Return to Home</a>
            </div>
        `;
        alert('Access Denied: Admin privileges required.');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 3000); // Redirect after 3 seconds
    }

    logoutBtn.addEventListener('click', () => {
        // Simulate logout by redirecting to home and resetting session
        window.location.href = 'home.html';
    });
});