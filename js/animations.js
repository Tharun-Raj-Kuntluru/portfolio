/* ========================================
   GSAP Scroll Animations
   ======================================== */

class ScrollAnimations {
    constructor() {
        gsap.registerPlugin(ScrollTrigger);
        this.initHeroAnimations();
        this.initSectionAnimations();
        this.initParallax();
        this.initCounters();
    }

    initHeroAnimations() {
        const heroTl = gsap.timeline({ delay: 2.5 });

        heroTl
            .to('.hero-greeting', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out'
            })
            .to('.hero-name', {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out'
            }, '-=0.4')
            .to('.hero-title-wrapper', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.5')
            .to('.hero-tagline', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.4')
            .to('.hero-cta', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.4')
            .to('.hero-stats', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.3');
    }

    initSectionAnimations() {
        // Section titles
        gsap.utils.toArray('.section-title').forEach(title => {
            gsap.from(title, {
                scrollTrigger: {
                    trigger: title,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                x: -50,
                duration: 0.8,
                ease: 'power3.out'
            });
        });

        // About section
        gsap.from('.about-text', {
            scrollTrigger: {
                trigger: '.about-grid',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            x: -50,
            duration: 1,
            ease: 'power3.out'
        });

        gsap.from('.about-visual', {
            scrollTrigger: {
                trigger: '.about-grid',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            x: 50,
            duration: 1,
            ease: 'power3.out',
            delay: 0.2
        });

        // Timeline items
        gsap.utils.toArray('.timeline-item').forEach((item, i) => {
            gsap.from(item, {
                scrollTrigger: {
                    trigger: item,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                x: i % 2 === 0 ? -30 : 30,
                duration: 0.8,
                ease: 'power3.out'
            });
        });

        // Project cards
        gsap.utils.toArray('.project-card').forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                y: 50,
                scale: 0.95,
                duration: 0.8,
                ease: 'power3.out',
                delay: i * 0.15
            });
        });

        // Skill categories
        gsap.utils.toArray('.skill-category').forEach((skill, i) => {
            gsap.from(skill, {
                scrollTrigger: {
                    trigger: skill,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                y: 40,
                duration: 0.6,
                ease: 'power3.out',
                delay: i * 0.1
            });
        });

        // Achievement cards
        gsap.utils.toArray('.achievement-card').forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                y: 30,
                rotationX: 10,
                duration: 0.6,
                ease: 'power3.out',
                delay: i * 0.1
            });
        });

        // Contact section
        gsap.from('.contact-content', {
            scrollTrigger: {
                trigger: '.contact-content',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 50,
            duration: 1,
            ease: 'power3.out'
        });
    }

    initParallax() {
        // Subtle parallax on sections
        gsap.utils.toArray('.section').forEach(section => {
            gsap.to(section, {
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1
                },
                backgroundPositionY: '30%',
                ease: 'none'
            });
        });
    }

    initCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        counters.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-count'));
            const isFloat = target % 1 !== 0;

            ScrollTrigger.create({
                trigger: counter,
                start: 'top 85%',
                onEnter: () => {
                    gsap.to(counter, {
                        duration: 2,
                        ease: 'power2.out',
                        onUpdate: function() {
                            const progress = this.progress();
                            const current = target * progress;
                            counter.textContent = isFloat ? current.toFixed(1) : Math.floor(current);
                        }
                    });
                },
                once: true
            });
        });
    }
}

// Initialize after preloader
window.addEventListener('load', () => {
    setTimeout(() => {
        new ScrollAnimations();
    }, 2000);
});
