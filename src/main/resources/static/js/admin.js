document.addEventListener('DOMContentLoaded', async () => {
    const nameSpan = document.getElementById('nav-username');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminContainer = document.querySelector('.admin-container');
    const userTableBody = document.getElementById('userTableBody');
    const editUserForm = document.getElementById('editUserForm');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    /**
     * Checks the user's authentication and authorization status by calling the backend API.
     * @returns {Promise<object>} A promise that resolves to the user object.
     */
    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/api/user/me'); // Use relative path
            if (!response.ok) {
                console.error("Auth check failed:", response.status);
                return { authenticated: false };
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching auth status:", error);
            return { authenticated: false };
        }
    };

    const user = await checkAuthStatus();

    // Check if the user is authenticated and is an admin
    if (user && user.authenticated && user.isAdmin) {
        if(logoutBtn) logoutBtn.style.display = 'block';
        if(nameSpan) nameSpan.textContent = 'Welcome, ' + user.username;

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

        async function fetchUsers() {
            try {
                const response = await fetch('/api/user'); // Corrected path
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

        function editUser(id) {
            fetch(`/api/user/${id}`)
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

        saveEditBtn.addEventListener('click', () => {
            const id = editUserForm.dataset.id;
            const updatedUser = {
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                role: document.getElementById('editRole').value,
                status: document.getElementById('editStatus').value
            };
            fetch(`/api/user/${id}`, {
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

        cancelEditBtn.addEventListener('click', () => {
            editUserForm.style.display = 'none';
        });

        function deleteUser(id) {
            // In a real app, a custom modal is better than confirm().
            if (confirm('Are you sure you want to delete this user?')) {
                fetch(`/api/user/${id}`, {
                    method: 'DELETE'
                })
                    .then(() => fetchUsers()) // Refresh user list
                    .catch(error => console.error('Error deleting user:', error));
            }
        }

        fetchUsers();
    } else {
        // Display access denied message if user is not an authorized admin
        adminContainer.innerHTML = `
            <div class="access-denied">
                <h2>Access Denied</h2>
                <p>You do not have the necessary admin privileges to access this page.</p>
                <a href="home.html" class="btn btn-primary">Return to Home</a>
            </div>
        `;
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Should ideally call a backend logout endpoint
            window.location.href = 'home.html';
        });
    }
});
