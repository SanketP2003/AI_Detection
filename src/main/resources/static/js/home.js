document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const nameSpan = document.getElementById('nav-username');
        const signinBtn = document.getElementById('signinBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const adminLink = document.getElementById('admin-link');
        const getStartedBtn = document.getElementById('getStartedBtn');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('main-nav');

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });
        }

        document.querySelectorAll('.nav-menu a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    if (navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                    }
                }
            });
        });

        const fetchUser = async () => {
            try {
                const response = await fetch('/api/user/me');
                if (response.ok) {
                    return await response.json();
                }
                return { authenticated: false };
            } catch (error) {
                console.error('Failed to fetch user status:', error);
                return { authenticated: false };
            }
        };

        const user = await fetchUser();

        if (user && user.authenticated) {
            if (signinBtn) signinBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (nameSpan) nameSpan.textContent = `Welcome, ${user.username}`;
            if (user.isAdmin) {
                if (adminLink) adminLink.style.display = 'block';
                if (getStartedBtn) {
                    getStartedBtn.addEventListener('click', () => window.location.href = 'admin.html');
                }
            } else {
                if (adminLink) adminLink.style.display = 'none';
                if (getStartedBtn) {
                    getStartedBtn.addEventListener('click', () => window.location.href = 'ai-detection.html');
                }
            }
        } else {
            if (signinBtn) signinBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (nameSpan) nameSpan.textContent = '';
            if (getStartedBtn) {
                getStartedBtn.addEventListener('click', () => window.location.href = 'index.html');
            }
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await fetch('/logout', { method: 'POST' });
                } finally {
                    window.location.href = 'index.html';
                }
            });
        }

        if (signinBtn) {
            signinBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }, 250);
});

