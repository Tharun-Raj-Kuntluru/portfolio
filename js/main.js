/* =====================================================================
   Page interactions: loader, theme, nav, reveals, role flip, counters,
   doors, project filter, 3D tilt, experience year rail, skill sphere,
   lightbox. No dependencies.
   ===================================================================== */
(function () {
    'use strict';

    var root = document.documentElement;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    function $(s, c) { return (c || document).querySelector(s); }
    function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

    /* ---------- Loader ---------- */
    function ready() {
        var l = $('#loader');
        if (l) l.classList.add('done');
        document.body.classList.add('is-ready');
    }
    if (document.readyState === 'complete') setTimeout(ready, 150);
    else {
        window.addEventListener('load', function () { setTimeout(ready, 250); });
        setTimeout(ready, 1800);                       // never block on a slow asset
    }

    /* ---------- Display font: switch to full-size headline once it has loaded ---------- */
    (function () {
        if (!document.fonts || !document.fonts.load) { root.classList.add('fonts-ready'); return; }
        var tries = 0;
        (function poll() {
            document.fonts.load('900 20px "Big Shoulders Display"').then(function (faces) {
                if (faces && faces.length) root.classList.add('fonts-ready');
                else if (++tries < 80) setTimeout(poll, 250);
            }, function () { if (++tries < 80) setTimeout(poll, 250); });
        })();
    })();

    /* ---------- Theme ---------- */
    var themeBtn = $('#theme-toggle');
    var themeMeta = $('meta[name="theme-color"]');
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
            if (themeMeta) themeMeta.setAttribute('content', next === 'light' ? '#f2f0e8' : '#07080c');
            window.dispatchEvent(new Event('themechange'));
        });
    }

    /* ---------- Nav ---------- */
    var nav = $('#nav'), navLinks = $('#nav-links'), burger = $('#nav-burger'), progress = $('#scroll-progress');
    function closeMenu() {
        if (!navLinks) return;
        navLinks.classList.remove('open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
    }
    if (burger && navLinks) {
        burger.addEventListener('click', function () {
            var open = navLinks.classList.toggle('open');
            burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        $$('a', navLinks).forEach(function (a) { a.addEventListener('click', closeMenu); });
    }

    var sections = $$('main section[id]');
    var linkFor = {};
    $$('a', navLinks).forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });
    var lastY = window.scrollY, ticking = false;

    function onScroll() {
        ticking = false;
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';

        if (nav) {
            var menuOpen = navLinks && navLinks.classList.contains('open');
            if (y > lastY + 6 && y > 500 && !menuOpen) nav.classList.add('is-hidden');
            else if (y < lastY - 6 || y <= 500) nav.classList.remove('is-hidden');
        }
        lastY = y;

        var current = null, mid = window.innerHeight * 0.4;
        sections.forEach(function (s) {
            var r = s.getBoundingClientRect();
            if (r.top <= mid && r.bottom > mid) current = s.id;
        });
        Object.keys(linkFor).forEach(function (id) { linkFor[id].classList.toggle('is-active', id === current); });

        updateYearRail();
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);

    /* ---------- Reveal on scroll ---------- */
    var reveals = $$('.reveal');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                var sibs = el.parentElement ? $$(':scope > .reveal', el.parentElement) : [el];
                var i = Math.max(0, sibs.indexOf(el));
                el.style.transitionDelay = Math.min(i % 4, 3) * 80 + 'ms';
                el.classList.add('in');
                setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
                io.unobserve(el);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
        reveals.forEach(function (el) { io.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---------- Hero role flip ---------- */
    (function () {
        var box = $('#role-flip');
        if (!box || reduced) return;
        var roles = ['AI Engineer', 'Robotics & AI Engineer', 'Agentic AI Developer', 'Software Engineer', 'Hackathon Winner'];
        var i = 0, word = $('.flip-word', box);
        setInterval(function () {
            if (document.hidden) return;
            word.classList.remove('in');
            word.classList.add('out');
            setTimeout(function () {
                i = (i + 1) % roles.length;
                word.textContent = roles[i];
                word.classList.remove('out');
                word.classList.add('in');
            }, 360);
        }, 2600);
    })();

    /* ---------- Stat counters ---------- */
    (function () {
        var nums = $$('.stat b[data-count]');
        if (!nums.length || reduced || !('IntersectionObserver' in window)) return;
        var seen = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target, target = parseFloat(el.getAttribute('data-count'));
                var dec = parseInt(el.getAttribute('data-decimals') || '0', 10), t0 = null;
                function step(ts) {
                    if (t0 === null) t0 = ts;
                    var k = Math.min((ts - t0) / 1300, 1);
                    el.textContent = (target * (1 - Math.pow(1 - k, 3))).toFixed(dec);
                    if (k < 1) requestAnimationFrame(step);
                    else el.textContent = target.toFixed(dec);
                }
                el.textContent = (0).toFixed(dec);
                setTimeout(function () { requestAnimationFrame(step); }, 900);
                seen.unobserve(el);
            });
        }, { threshold: 0.4 });
        nums.forEach(function (n) { seen.observe(n); });
    })();

    /* ---------- Project filter ---------- */
    var grid = $('#project-grid'), filterBtns = $$('.filter');
    function setFilter(f) {
        filterBtns.forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-filter') === f); });
        if (!grid) return;
        grid.classList.toggle('is-filtered', f !== 'all');
        $$('.proj', grid).forEach(function (card) {
            var show = f === 'all' || (' ' + card.getAttribute('data-domain') + ' ').indexOf(' ' + f + ' ') !== -1;
            card.classList.toggle('is-hidden', !show);
            if (show) card.classList.add('in');
        });
    }
    filterBtns.forEach(function (b) {
        b.addEventListener('click', function () { setFilter(b.getAttribute('data-filter')); });
    });

    /* ---------- Doors ---------- */
    $$('.door').forEach(function (door) {
        door.addEventListener('click', function (e) {
            if (e.target.closest('.door-go')) return;
            if (finePointer) return;                    // hover handles it on desktop
            var wasOpen = door.classList.contains('open');
            $$('.door.open').forEach(function (d) { d.classList.remove('open'); });
            if (!wasOpen) door.classList.add('open');
        });
        door.addEventListener('keydown', function (e) {
            if (e.target !== door || (e.key !== 'Enter' && e.key !== ' ')) return;
            e.preventDefault();
            door.classList.toggle('open');
        });
    });
    $$('[data-filter-go]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            setFilter(btn.getAttribute('data-filter-go'));
            var target = $('#projects');
            if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        });
    });

    /* ---------- 3D tilt ---------- */
    if (finePointer && !reduced) {
        $$('[data-tilt]').forEach(function (el) {
            var max = el.classList.contains('portrait') ? 9 : 5;
            el.addEventListener('pointermove', function (e) {
                var r = el.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
                el.classList.add('is-tilting');
                el.style.setProperty('--ry', ((px - 0.5) * 2 * max).toFixed(2) + 'deg');
                el.style.setProperty('--rx', ((0.5 - py) * 2 * max).toFixed(2) + 'deg');
                el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
                el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
            });
            el.addEventListener('pointerleave', function () {
                el.classList.remove('is-tilting');
                el.style.setProperty('--rx', '0deg');
                el.style.setProperty('--ry', '0deg');
            });
        });
    }

    /* ---------- Experience: sticky year rail ---------- */
    var xpItems = $$('.xp-item'), xpYear = $('#xp-year'), xpCount = $('#xp-count'), xpBar = $('#xp-bar'), xpCurrent = -1;
    function updateYearRail() {
        if (!xpItems.length) return;
        var mid = window.innerHeight * 0.45, best = 0, bestD = Infinity;
        xpItems.forEach(function (it, i) {
            var r = it.getBoundingClientRect();
            var d = Math.abs((r.top + r.bottom) / 2 - mid);
            if (d < bestD) { bestD = d; best = i; }
        });
        if (best === xpCurrent) return;
        xpCurrent = best;
        xpItems.forEach(function (it, i) { it.classList.toggle('is-current', i === best); });
        var year = xpItems[best].getAttribute('data-year');
        if (xpYear && xpYear.textContent !== year) {
            xpYear.textContent = year;
            xpYear.classList.remove('tick');
            void xpYear.offsetWidth;
            xpYear.classList.add('tick');
        }
        if (xpCount) xpCount.textContent = (best + 1 < 10 ? '0' : '') + (best + 1);
        if (xpBar) xpBar.style.transform = 'scaleX(' + ((best + 1) / xpItems.length) + ')';
    }

    /* ---------- Skill sphere (canvas, drag to rotate) ---------- */
    (function () {
        var cv = $('#skill-sphere');
        if (!cv || !cv.getContext) return;
        var ctx = cv.getContext('2d');
        var TAGS = [
            ['Python', 'ml'], ['C++', 'ml'], ['SQL', 'ml'], ['DSA', 'ml'], ['OOP', 'ml'], ['FastAPI', 'ml'], ['REST APIs', 'ml'], ['Git', 'ml'], ['Linux', 'ml'],
            ['Agentic AI', 'agentic'], ['LangGraph', 'agentic'], ['CrewAI', 'agentic'], ['LangChain', 'agentic'], ['Gen AI', 'agentic'], ['Multimodal AI', 'agentic'],
            ['PyTorch', 'agentic'], ['Deep Learning', 'agentic'], ['NLP', 'agentic'], ['XGBoost', 'agentic'], ['LightGBM', 'agentic'], ['Ollama', 'agentic'],
            ['ROS2', 'robotics'], ['RViz', 'robotics'], ['JAKA ZU5', 'robotics'], ['ZED 2i', 'robotics'], ['Computer Vision', 'robotics'], ['PLC', 'robotics'],
            ['TIA Portal', 'robotics'], ['HMI', 'robotics'], ['PID Control', 'robotics'], ['Sensor Fusion', 'robotics'], ['Arduino', 'robotics'], ['Raspberry Pi', 'robotics'],
            ['Qiskit', 'quantum'], ['Quantum Algorithms', 'quantum'], ['Circuit Optimisation', 'quantum'], ['Job Scheduling', 'quantum']
        ];
        var n = TAGS.length, pts = [], i;
        for (i = 0; i < n; i++) {                       // Fibonacci sphere
            var yy = 1 - (2 * (i + 0.5)) / n, rad = Math.sqrt(1 - yy * yy), th = i * Math.PI * (3 - Math.sqrt(5));
            pts.push({ x: Math.cos(th) * rad, y: yy, z: Math.sin(th) * rad, label: TAGS[(i * 7) % n][0], dom: TAGS[(i * 7) % n][1] });
        }
        var colors = {}, textColor = '#fff', lineColor = 'rgba(255,255,255,.1)';
        function readColors() {
            var cs = getComputedStyle(root);
            ['agentic', 'robotics', 'quantum', 'ml'].forEach(function (k) { colors[k] = cs.getPropertyValue('--c-' + k).trim(); });
            textColor = cs.getPropertyValue('--text').trim();
            lineColor = cs.getPropertyValue('--line-strong').trim();
        }
        var size = 560, dpr = 1;
        function resize() {
            var w = cv.clientWidth || 480;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            size = w;
            cv.width = cv.height = Math.round(w * dpr);
        }
        var vx = 0.0032, vy = 0.0014, dragging = false, px = 0, py = 0, visible = false, raf = null;
        function rotate(ax, ay) {
            var cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
            pts.forEach(function (p) {
                var x = p.x * cx + p.z * sx, z = -p.x * sx + p.z * cx;      // around Y
                var y = p.y * cy - z * sy; z = p.y * sy + z * cy;           // around X
                p.x = x; p.y = y; p.z = z;
            });
        }
        function draw() {
            var R = size * 0.36, c = size / 2;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, size, size);
            ctx.strokeStyle = lineColor; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(c, c, R * 1.18, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(c, c, R * 1.18, R * 0.36, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(c, c, R * 0.36, R * 1.18, 0, 0, Math.PI * 2); ctx.stroke();
            pts.slice().sort(function (a, b) { return a.z - b.z; }).forEach(function (p) {
                var depth = (p.z + 1) / 2, s = 0.62 + depth * 0.62;
                var x = c + p.x * R * (0.82 + depth * 0.3), y = c + p.y * R * (0.82 + depth * 0.3);
                ctx.globalAlpha = 0.18 + depth * 0.82;
                ctx.font = '700 ' + (13 * s).toFixed(1) + 'px Manrope, system-ui, sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                var w = ctx.measureText(p.label).width;
                ctx.fillStyle = colors[p.dom] || textColor;
                ctx.beginPath(); ctx.arc(x - w / 2 - 8 * s, y, 3 * s, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = depth > 0.55 ? textColor : (colors[p.dom] || textColor);
                ctx.fillText(p.label, x, y);
            });
            ctx.globalAlpha = 1;
        }
        function loop() {
            raf = null;
            if (!visible) return;
            if (!dragging) { rotate(vx, vy); vx += (0.0032 * Math.sign(vx || 1) - vx) * 0.02; vy += (0.0012 * Math.sign(vy || 1) - vy) * 0.02; }
            draw();
            if (!reduced) raf = requestAnimationFrame(loop);
        }
        cv.addEventListener('pointerdown', function (e) { dragging = true; px = e.clientX; py = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (err) {} });
        cv.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            var dx = (e.clientX - px) * 0.006, dy = (e.clientY - py) * 0.006;
            px = e.clientX; py = e.clientY;
            rotate(dx, dy); vx = dx || vx; vy = dy || vy;
            if (reduced) draw();
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { cv.addEventListener(ev, function () { dragging = false; }); });
        window.addEventListener('resize', function () { resize(); draw(); });
        window.addEventListener('themechange', function () { readColors(); draw(); });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (en) {
                visible = en[0].isIntersecting;
                if (visible && !raf) { resize(); loop(); }
            }, { threshold: 0.05 }).observe(cv);
        } else { visible = true; }
        readColors(); resize(); rotate(0.6, 0.35); draw();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
        if (visible) loop();
    })();

    /* ---------- Lightbox ---------- */
    (function () {
        var lb = $('#lightbox');
        if (!lb) return;
        var img = $('.lightbox-img', lb), cap = $('.lightbox-caption', lb), closeBtn = $('.lightbox-close', lb), lastFocus = null;
        function open(src, alt, caption) {
            lastFocus = document.activeElement;
            img.src = src; img.alt = alt || ''; cap.textContent = caption || alt || '';
            lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            closeBtn.focus();
        }
        function close() {
            lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            setTimeout(function () { if (!lb.classList.contains('open')) img.removeAttribute('src'); }, 350);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }
        $$('.g-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var im = $('img', item), h = $('h4', item), s = $('figcaption span', item);
                if (!im) return;
                open(im.currentSrc || im.src, im.alt, [s ? s.textContent.trim() : '', h ? h.textContent.trim() : ''].filter(Boolean).join(' · '));
            });
        });
        $$('img[data-zoom]').forEach(function (im) {
            im.addEventListener('click', function (e) {
                e.stopPropagation();
                var card = im.closest('.proj, .xp-item, .award'), h = card ? $('h3', card) : null;
                open(im.currentSrc || im.src, im.alt, h ? h.textContent.trim() : im.alt);
            });
        });
        closeBtn.addEventListener('click', close);
        lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
    })();

    onScroll();
})();
