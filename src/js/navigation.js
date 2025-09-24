// Sticky, accessible, mobile-responsive navigation with smooth scroll and dynamic highlighting
document.addEventListener('DOMContentLoaded', function () {
    // Declare variables only once
    const nav = document.querySelector('.nav');
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.getElementById('nav-list');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = Array.from(document.querySelectorAll('section'));

    // Set #nav-section nav link as active by default after DOM is ready
    function setDefaultActiveNav() {
        navLinks.forEach(l => {
            l.classList.remove('active');
            l.removeAttribute('aria-current');
        });
        const navSectionLink = Array.from(navLinks).find(l => l.getAttribute('href') === '#nav-section');
        if (navSectionLink) {
            navSectionLink.classList.add('active');
            navSectionLink.setAttribute('aria-current', 'page');
        }
    }
    setDefaultActiveNav();

    // Mobile menu toggle
    navToggle.addEventListener('click', function () {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !expanded);
        navList.classList.toggle('open');
        navToggle.classList.toggle('active');
        if (!expanded) {
            navList.querySelector('.nav-link').focus();
        } else {
            navToggle.focus();
        }
    });

    // Keyboard navigation for menu toggle
    navToggle.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navToggle.click();
        }
    });

    // Smooth scroll and focus management
    let isClickingNav = false;
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            isClickingNav = true;
            const targetId = link.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (target) {
                // Calculate offset for sticky header
                const header = document.querySelector('header.sticky-nav');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetY = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({ top: targetY, behavior: 'smooth' });
                setTimeout(() => {
                    target.focus();
                    isClickingNav = false;
                }, 400);
            }
            navLinks.forEach(l => {
                l.classList.remove('active');
                l.removeAttribute('aria-current');
            });
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
            navList.classList.remove('open');
            navToggle.setAttribute('aria-expanded', false);
        });
        // Keyboard navigation for links
        link.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                link.click();
            }
        });
    });

    // Improved dynamic tab highlighting using Intersection Observer
    const sectionMap = {};
    sections.forEach(section => {
        sectionMap[section.id] = section;
    });
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // 50% of section visible
    };
    let currentActive = null;
    const observer = new IntersectionObserver((entries) => {
    // Always allow scroll-based highlighting
        let mostVisible = null;
        let maxRatio = 0;
        entries.forEach(entry => {
            if (entry.intersectionRatio > maxRatio) {
                maxRatio = entry.intersectionRatio;
                mostVisible = entry.target;
            }
        });
        if (mostVisible) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            });
            const activeLink = Array.from(navLinks).find(l => l.getAttribute('href').slice(1) === mostVisible.id);
            if (activeLink) {
                activeLink.classList.add('active');
                activeLink.setAttribute('aria-current', 'page');
            }
        }
    }, observerOptions);
    sections.forEach(section => observer.observe(section));

    // Accessibility: trap focus in menu when open (mobile)
    navList.addEventListener('keydown', function (e) {
        if (!navList.classList.contains('open')) return;
        const focusable = Array.from(navList.querySelectorAll('.nav-link'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
});

                setTimeout(() => {
                    window.navState.isScrolling = false;
                }, 1000);
