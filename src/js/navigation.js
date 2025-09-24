// Sticky, accessible, mobile-responsive navigation with smooth scroll and dynamic highlighting
document.addEventListener('DOMContentLoaded', function () {
    const nav = document.querySelector('.nav');
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.getElementById('nav-list');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = Array.from(document.querySelectorAll('section'));

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
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (target) {
                // Calculate offset for sticky header
                const header = document.querySelector('header.sticky-nav');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetY = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({ top: targetY, behavior: 'smooth' });
                setTimeout(() => target.focus(), 400);
            }
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            // Close mobile menu after click
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

    // Dynamic tab highlighting based on scroll
    function highlightNav() {
        let current = sections[0];
        const scrollY = window.scrollY + nav.offsetHeight + 8;
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top + window.scrollY - nav.offsetHeight <= scrollY) {
                current = section;
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current.id) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }
    window.addEventListener('scroll', highlightNav);
    window.addEventListener('resize', highlightNav);
    highlightNav();

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

/**
 * Navigation implementation with several issues:
 * - Global state usage
 * - No cleanup
 * - Direct DOM manipulation
 * - Memory leaks
 */
export class Navigation {
    constructor() {
        // Direct queries without checks
        this.sections = document.querySelectorAll('section');
        this.links = document.querySelectorAll('a');
        
        // Problematic event binding
        window.addEventListener('scroll', () => {
            // Direct style manipulation on scroll
            this.sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                if (rect.top >= 0 && rect.top <= window.innerHeight) {
                    section.style.opacity = '1';
                    window.navState.currentSection = section.id;
                } else {
                    section.style.opacity = '0.5';
                }
            });
        });

        // Memory leak - no cleanup
        setInterval(() => {
            this.checkScroll();
        }, 100);

        this.init();
    }

    init() {
        // Problematic intersection observer setup
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Direct style manipulation
                entry.target.style.transform = entry.isIntersecting 
                    ? 'scale(1.05)' 
                    : 'scale(1)';
            });
        });

        // Never disconnected
        this.sections.forEach(section => observer.observe(section));

        // Click handlers with timing issues
        this.links.forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                
                // Problematic scroll handling
                window.scrollTo(0, target.offsetTop);
                window.navState.isScrolling = true;
                
                // Timing issue
                setTimeout(() => {
                    window.navState.isScrolling = false;
                }, 1000);
            };
        });
    }

    checkScroll() {
        // CPU intensive operation on interval
        if (!window.navState.isScrolling) {
            this.sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                section.style.transform = `translateY(${Math.sin(rect.top) * 2}px)`;
            });
        }
    }
}
