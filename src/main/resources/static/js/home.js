document.addEventListener('DOMContentLoaded', async () => {
    const nameSpan = document.getElementById('nav-username');
    const signinBtn = document.getElementById('signinBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminLink = document.getElementById('admin-link');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('main-nav');

    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !mobileMenuToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });

    // Smooth scroll for nav links
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80,
                    behavior: 'smooth'
                });

                // Close mobile menu when a link is clicked
                if (window.innerWidth < 968) {
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            }
        });
    });

    // Form submission handling (mock)
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }

    // Fetch current authenticated user and roles from backend
    const fetchMe = async () => {
        try {
            const res = await fetch('/me');
            if (!res.ok) {
                // If the response is not OK, it means the user is not authenticated
                // or there's another issue. Redirect to the login page.
                window.location.href = 'index.html';
                return null; // Return null to stop further execution
            }
            return await res.json();
        } catch (e) {
            console.warn('Auth check failed, redirecting to login:', e);
            window.location.href = 'index.html';
            return null; // Return null to stop further execution
        }
    };

    const me = await fetchMe();

    // If fetchMe returned null, it means a redirect is in progress, so we stop.
    if (!me) return;

    if (me && me.authenticated && me.username) {
        signinBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        nameSpan.textContent = 'Welcome, ' + me.username;

        const roles = Array.isArray(me.roles) ? me.roles : [];
        const isAdmin = roles.includes('ROLE_ADMIN');
        if (isAdmin) {
            adminLink.style.display = 'block';
            getStartedBtn.addEventListener('click', () => {
                window.location.href = 'admin.html';
            });
        } else {
            adminLink.style.display = 'none';
            getStartedBtn.addEventListener('click', () => {
                // For non-admin users, the button can lead to a user-specific page or action
                window.location.href = 'ai-detection.html';
            });
        }
    } else {
        // This part might not be reached if fetchMe redirects, but as a fallback:
        window.location.href = 'index.html';
    }

    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/logout', {method: 'POST'});
        } catch (e) {
            console.warn('Logout failed, redirecting anyway:', e);
        } finally {
            window.location.href = 'index.html';
        }
    });
});