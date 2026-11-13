/* ========================================
   Main JavaScript - Interactions & Logic
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Preloader
    initPreloader();
    // Custom Cursor
    initCursor();
    // Navigation
    initNavigation();
    // Typing Effect
    initTypingEffect();
    // Mobile Menu
    initMobileMenu();
    // Smooth Scroll
    initSmoothScroll();
    // Reveal on Scroll
    initRevealOnScroll();
    // Tilt Effect on Cards
    initTiltEffect();
});

/* Preloader */
function initPreloader() {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            preloader.classList.add('loaded');
            document.body.style.overflow = 'auto';
        }, 800);
    });
    document.body.style.overflow = 'hidden';
}

/* Custom Cursor */
function initCursor() {
    const dot = document.querySelector('.cursor-dot');
    const outline = document.querySelector('.cursor-outline');

    if (!dot || !outline) return;

    // Check for touch device
    if ('ontouchstart' in window) {
        dot.style.display = 'none';
        outline.style.display = 'none';
        return;
    }

    let cursorX = 0, cursorY = 0;
    let outlineX = 0, outlineY = 0;

    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        dot.style.left = cursorX + 'px';
        dot.style.top = cursorY + 'px';
    });

    function animateOutline() {
        outlineX += (cursorX - outlineX) * 0.15;
        outlineY += (cursorY - outlineY) * 0.15;
        outline.style.left = outlineX + 'px';
        outline.style.top = outlineY + 'px';
        requestAnimationFrame(animateOutline);
    }
    animateOutline();

    // Hover effects
    const hoverElements = document.querySelectorAll('a, button, .btn, .project-card, .achievement-card, .skill-item');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            outline.classList.add('hover');
            dot.style.transform = 'scale(1.5)';
        });
        el.addEventListener('mouseleave', () => {
            outline.classList.remove('hover');
            dot.style.transform = 'scale(1)';
        });
    });
}

/* Navigation */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Active nav link
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.style.color = '';
            if (link.getAttribute('href') === '#' + current) {
                link.style.color = 'var(--primary)';
            }
        });
    });
}

/* Typing Effect */
function initTypingEffect() {
    const typedElement = document.querySelector('.typed-text');
    if (!typedElement) return;

    const strings = [
        'Agentic AI Developer',
        'Quantum Computing Enthusiast',
        'National Hackathon Winner',
        'Siemens Gen AI Intern',
        'IIT Tirupati Research Intern',
        'Robotics Team Leader',
        'Full-Stack AI Engineer'
    ];

    let stringIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function type() {
        const currentString = strings[stringIndex];

        if (isDeleting) {
            typedElement.textContent = currentString.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 40;
        } else {
            typedElement.textContent = currentString.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 80;
        }

        if (!isDeleting && charIndex === currentString.length) {
            typingSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            stringIndex = (stringIndex + 1) % strings.length;
            typingSpeed = 500; // Pause before typing next
        }

        setTimeout(type, typingSpeed);
    }

    // Start typing after preloader
    setTimeout(type, 1600);
}

/* Mobile Menu */
function initMobileMenu() {
    const hamburger = document.querySelector('.nav-hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
}

/* Smooth Scroll */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return; // bare "#" is not a valid selector
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* Reveal on Scroll */
function initRevealOnScroll() {
    const revealElements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));
}

/* Tilt Effect on Cards */
function initTiltEffect() {
    const cards = document.querySelectorAll('.project-card, .achievement-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
}

/* Magnetic Buttons */
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
    });
});

/* Neural Signal Effect - Random highlights */
setInterval(() => {
    const nodes = document.querySelectorAll('.skill-item');
    if (nodes.length === 0) return;
    const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
    randomNode.style.background = 'rgba(0, 245, 255, 0.15)';
    randomNode.style.color = '#00f5ff';
    setTimeout(() => {
        randomNode.style.background = '';
        randomNode.style.color = '';
    }, 1000);
}, 3000);

/* ============================================
   Journey Gallery — Lightbox
   ============================================ */
(function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const imgEl = lightbox.querySelector('.lightbox-img');
    const captionEl = lightbox.querySelector('.lightbox-caption');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-item');

    function openLightbox(src, alt, caption) {
        imgEl.src = src;
        imgEl.alt = alt || '';
        captionEl.textContent = caption || '';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // clear src after fade out
        setTimeout(() => {
            if (!lightbox.classList.contains('open')) imgEl.src = '';
        }, 350);
    }

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const title = item.querySelector('h4');
            const cat = item.querySelector('.gallery-cat');
            if (!img) return;
            const caption = [
                cat ? cat.innerText.trim() : '',
                title ? title.innerText.trim() : ''
            ].filter(Boolean).join(' · ');
            openLightbox(img.src, img.alt, caption);
        });
    });

    // Experience & project photos open in the same lightbox
    document.querySelectorAll('.timeline-media img, .project-image img').forEach(img => {
        img.addEventListener('click', () => {
            const card = img.closest('.timeline-content, .project-card');
            const title = card ? card.querySelector('h3') : null;
            const org = card ? card.querySelector('.timeline-company, .project-subtitle') : null;
            const caption = [title, org]
                .map(el => (el ? el.innerText.trim() : ''))
                .filter(Boolean)
                .join(' · ');
            openLightbox(img.currentSrc || img.src, img.alt, caption);
        });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
})();
