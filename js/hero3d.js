/* =====================================================================
   Hero 3D stage. Three simulations, one per domain, that rotate
   automatically and can be picked from the HUD tabs:
     - agentic  : multi-agent workflow (state machine, parallel agents,
                  tool calls, verification loop)
     - robotics : cobot running the 9-stage pick & place pipeline
     - quantum  : quantum job pipeline (forecast, circuit optimisation, run)
   Plain Three.js (global build, bundled in js/vendor), no build step.
   ===================================================================== */
(function () {
    'use strict';

    var META = {
        agentic: {
            title: 'Agent workflow',
            foot: 'Modelled on Agentic Veritas (LangGraph + CrewAI)',
            stages: ['Query in', 'State machine plans', 'Parallel agents', 'Multimodal tool calls', 'Verification loop', 'Verified answer']
        },
        robotics: {
            title: '9-stage pick & place',
            foot: 'The pipeline I built at IIT Tirupati',
            stages: ['Home position', 'Approach via ZED 2i', 'Error correction & sizing', 'Gentle grasp', 'Pick', 'Optimised path', 'Safe move', 'Place without crushing', 'Return home']
        },
        quantum: {
            title: 'Quantum job pipeline',
            foot: 'Modelled on QuantuSight',
            stages: ['Job queued', 'Forecast completion time', 'Agent optimises circuit', 'Scheduled', 'Job running', 'Job complete']
        }
    };
    var ORDER = ['agentic', 'robotics', 'quantum'];

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpAngle(a, b, t) {
        var d = b - a;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        return a + d * t;
    }
    function cyl(x, z) { return { a: Math.atan2(x, z), r: Math.hypot(x, z) }; }

    function init() {
        var canvas = document.getElementById('hero-canvas');
        var hero = document.getElementById('hero');
        var root = document.documentElement;
        if (!canvas || !hero) return;
        if (!window.THREE) { root.classList.add('no-webgl'); return; }
        var THREE = window.THREE;

        var renderer;
        try {
            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        } catch (e) {
            root.classList.add('no-webgl');
            return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.92;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
        var CAM_BASE = new THREE.Vector3(5.4, 3.5, 7.4);
        var CAM_TARGET = new THREE.Vector3(0, 1.3, 0.25);
        var VIEW_UNITS = 2 * CAM_BASE.distanceTo(CAM_TARGET) * Math.tan(THREE.MathUtils.degToRad(15));

        var LIME = 0xa6e000, ORANGE = 0xff4f1c, VIOLET = 0x7a5cff, CYAN = 0x18b8e8, WHITE = 0xe9e9e3;

        /* ---------- Environment (soft reflections) ---------- */
        (function makeEnv() {
            var s = new THREE.Scene();
            var box = new THREE.BoxGeometry(1, 1, 1);
            function panel(hex, k, p, sc) {
                var m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) }));
                m.position.set(p[0], p[1], p[2]);
                m.scale.set(sc[0], sc[1], sc[2]);
                s.add(m);
            }
            s.add(new THREE.Mesh(new THREE.SphereGeometry(20, 24, 12), new THREE.MeshBasicMaterial({ color: 0x191b23, side: THREE.BackSide })));
            panel(0xffffff, 4.5, [0, 9, 0], [8, 0.2, 8]);
            panel(0xc6ff3a, 5, [-9, 2, -3], [0.2, 5, 6]);
            panel(0xff6a3d, 4, [9, 1.5, 3], [0.2, 4, 5]);
            panel(0x9d8bff, 4, [0, 2, -9], [7, 4, 0.2]);
            panel(0xffffff, 1.6, [3, 3, 9], [5, 3, 0.2]);
            var pm = new THREE.PMREMGenerator(renderer);
            scene.environment = pm.fromScene(s, 0.03).texture;
            pm.dispose();
        })();

        /* ---------- Lights ---------- */
        var hemi = new THREE.HemisphereLight(0xffffff, 0x20222c, 0.5);
        scene.add(hemi);
        var key = new THREE.DirectionalLight(0xffffff, 1.25);
        key.position.set(4, 8, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.left = -4.5; key.shadow.camera.right = 4.5;
        key.shadow.camera.top = 4.5; key.shadow.camera.bottom = -4.5;
        key.shadow.camera.near = 1; key.shadow.camera.far = 20;
        key.shadow.bias = -0.0015;
        key.shadow.radius = 5;
        scene.add(key);
        var rim = new THREE.PointLight(0xc6ff3a, 1.4, 14);
        rim.position.set(-3.5, 2.8, -2.5);
        scene.add(rim);

        /* ---------- Shared materials & helpers ---------- */
        var matBody = new THREE.MeshStandardMaterial({ color: WHITE, metalness: 0.35, roughness: 0.36 });
        var matDark = new THREE.MeshStandardMaterial({ color: 0x1b1e28, metalness: 0.65, roughness: 0.38 });
        var matAcc = new THREE.MeshStandardMaterial({ color: 0xa8e010, emissive: 0x9fdc00, emissiveIntensity: 0.3, metalness: 0.1, roughness: 0.5, envMapIntensity: 0.25 });

        function cylinder(rt, rb, h, mat) {
            var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 48), mat);
            m.castShadow = true;
            return m;
        }
        function glowMat(hex) {
            return new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.1, metalness: 0.1, roughness: 0.45, envMapIntensity: 0.3 });
        }
        function flatRing(r0, r1, hex, opacity) {
            var m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 56), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: opacity, depthWrite: false }));
            m.rotation.x = -Math.PI / 2; m.position.y = 0.006;
            return m;
        }

        // Text labels drawn to a canvas; redrawn when the theme changes
        var labelDraws = [];
        function makeLabel(text, plain) {
            var cv = document.createElement('canvas');
            var tex = new THREE.CanvasTexture(cv);
            tex.encoding = THREE.sRGBEncoding;
            var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
            var font = '600 30px Consolas, "JetBrains Mono", monospace', h = 56;
            var probe = cv.getContext('2d'); probe.font = font;
            var w = Math.ceil(probe.measureText(text).width) + (plain ? 12 : 40);
            cv.width = w; cv.height = h;
            function draw(light) {
                var c = cv.getContext('2d');
                c.clearRect(0, 0, w, h);
                if (!plain) {
                    c.beginPath();
                    c.moveTo(h / 2, 1); c.lineTo(w - h / 2, 1); c.arc(w - h / 2, h / 2, h / 2 - 1, -Math.PI / 2, Math.PI / 2);
                    c.lineTo(h / 2, h - 1); c.arc(h / 2, h / 2, h / 2 - 1, Math.PI / 2, Math.PI * 1.5); c.closePath();
                    c.fillStyle = light ? 'rgba(255,255,255,0.9)' : 'rgba(16,19,27,0.82)'; c.fill();
                    c.lineWidth = 2; c.strokeStyle = light ? 'rgba(12,14,22,0.2)' : 'rgba(255,255,255,0.22)'; c.stroke();
                }
                c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle';
                c.fillStyle = light ? '#10121a' : '#f3f2ec';
                c.fillText(text, w / 2, h / 2 + 2);
                tex.needsUpdate = true;
            }
            sp.scale.set(0.23 * w / h, 0.23, 1);
            labelDraws.push(draw);
            draw(false);
            return sp;
        }

        /* ---------- World: floor shared by all scenes ---------- */
        var world = new THREE.Group();
        scene.add(world);

        var shadowMat = new THREE.ShadowMaterial({ opacity: 0.42 });
        var shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), shadowMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.receiveShadow = true;
        world.add(shadowPlane);

        var gridCanvas = document.createElement('canvas');
        gridCanvas.width = gridCanvas.height = 1024;
        var gridTex = new THREE.CanvasTexture(gridCanvas);
        gridTex.anisotropy = 4;
        var grid = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, depthWrite: false }));
        grid.rotation.x = -Math.PI / 2;
        grid.position.y = 0.002;
        world.add(grid);

        function drawGrid(light) {
            var c = gridCanvas.getContext('2d'), S = 1024, n = 22, i;
            c.clearRect(0, 0, S, S);
            c.strokeStyle = light ? 'rgba(15,18,30,0.20)' : 'rgba(255,255,255,0.16)';
            c.lineWidth = 2;
            for (i = 0; i <= n; i++) {
                var p = (i / n) * S;
                c.beginPath(); c.moveTo(p, 0); c.lineTo(p, S); c.stroke();
                c.beginPath(); c.moveTo(0, p); c.lineTo(S, p); c.stroke();
            }
            c.globalCompositeOperation = 'destination-in';
            var g = c.createRadialGradient(S / 2, S / 2, S * 0.08, S / 2, S / 2, S * 0.5);
            g.addColorStop(0, 'rgba(0,0,0,1)');
            g.addColorStop(0.55, 'rgba(0,0,0,0.75)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = g;
            c.fillRect(0, 0, S, S);
            c.globalCompositeOperation = 'source-over';
            gridTex.needsUpdate = true;
        }

        /* ---------- HUD ---------- */
        var hud = document.getElementById('hud');
        var hudNum = document.getElementById('hud-num');
        var hudOf = document.getElementById('hud-of');
        var hudName = document.getElementById('hud-name');
        var hudDots = document.getElementById('hud-dots');
        var hudTitle = document.getElementById('hud-title');
        var hudFoot = document.getElementById('hud-foot');
        var hudTabs = hud ? Array.prototype.slice.call(hud.querySelectorAll('[data-scene-tab]')) : [];
        var active = null, currentStage = -1;

        function setStage(s) {
            if (s === currentStage) return;
            currentStage = s;
            var st = META[active].stages;
            if (hudNum) hudNum.textContent = (s + 1 < 10 ? '0' : '') + (s + 1);
            if (hudName) hudName.textContent = st[s];
            if (hudDots) for (var i = 0; i < hudDots.children.length; i++) hudDots.children[i].classList.toggle('on', i <= s);
        }
        function setHudScene(name) {
            var m = META[name], n = m.stages.length, i;
            if (hud) hud.setAttribute('data-scene', name);
            hero.setAttribute('data-scene', name);
            if (hudTitle) hudTitle.textContent = m.title;
            if (hudFoot) hudFoot.textContent = m.foot;
            if (hudOf) hudOf.textContent = '/ ' + (n < 10 ? '0' : '') + n;
            if (hudDots) {
                hudDots.innerHTML = '';
                hudDots.style.gridTemplateColumns = 'repeat(' + n + ', 1fr)';
                for (i = 0; i < n; i++) hudDots.appendChild(document.createElement('i'));
            }
            hudTabs.forEach(function (t) {
                var on = t.getAttribute('data-scene-tab') === name;
                t.classList.toggle('is-active', on);
                t.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            currentStage = -1;
        }

        // Generic step runner used by the agentic and quantum scenes
        function Timeline(build) {
            var steps = build(), i = 0, t = 0, started = false;
            this.update = function (dt) {
                var st = steps[i];
                if (!started) { started = true; if (st.start) st.start(); setStage(st.s); }
                t += dt / st.d;
                if (st.run) st.run(clamp(t, 0, 1));
                if (t >= 1) {
                    if (st.end) st.end();
                    i++; t = 0; started = false;
                    if (i >= steps.length) { steps = build(); i = 0; return true; }
                }
                return false;
            };
            this.stage = function () { return steps[i].s; };
        }

        /* =====================================================================
           Scene 1: Agentic AI workflow
           ===================================================================== */
        var agentic = (function () {
            var g = new THREE.Group();
            world.add(g);
            var nodes = {}, edges = {}, time = 0, spin = 0.6;

            function node(id, pos, geo, hex, r, label) {
                var mat = glowMat(hex);
                var m = new THREE.Mesh(geo, mat);
                m.position.set(pos[0], pos[1], pos[2]);
                m.castShadow = true;
                g.add(m);
                nodes[id] = { mesh: m, mat: mat, heat: 0, p: m.position.clone() };
                if (label) {
                    var sp = makeLabel(label);
                    sp.position.set(pos[0], pos[1] + r + 0.26, pos[2]);
                    g.add(sp);
                }
            }
            function sphere(r) { return new THREE.SphereGeometry(r, 36, 24); }
            function cube(s) { return new THREE.BoxGeometry(s, s, s); }

            node('in', [-1.95, 1.95, 0.45], cube(0.32), WHITE, 0.19, 'Query');
            node('orch', [-0.65, 2.55, 0.2], sphere(0.42), LIME, 0.48, 'State machine');
            node('a1', [1.2, 1.4, -0.7], sphere(0.24), WHITE, 0.24);
            node('a2', [0.6, 1.1, 0.45], sphere(0.24), WHITE, 0.24, 'Parallel agents');
            node('a3', [-0.05, 0.85, 1.55], sphere(0.24), WHITE, 0.24);
            node('t1', [2.3, 1.05, -0.3], cube(0.23), CYAN, 0.14);
            node('t2', [1.8, 0.65, 0.95], cube(0.23), CYAN, 0.14, 'Tools · APIs');
            node('t3', [1.0, 0.38, 2.1], cube(0.23), CYAN, 0.14);
            node('ver', [-1.35, 0.75, 1.1], new THREE.OctahedronGeometry(0.32), VIOLET, 0.32, 'Verifier');
            node('out', [-0.75, 0.3, 2.55], cube(0.32), LIME, 0.19, 'Answer');

            var orchRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.018, 10, 80), matAcc);
            orchRing.position.copy(nodes.orch.p);
            g.add(orchRing);

            function edge(a, b) {
                var mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
                var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([nodes[a].p, nodes[b].p]), mat);
                g.add(line);
                edges[a + '>' + b] = edges[b + '>' + a] = { mat: mat, heat: 0 };
            }
            [['in', 'orch'], ['orch', 'a1'], ['orch', 'a2'], ['orch', 'a3'], ['a1', 't1'], ['a2', 't2'], ['a3', 't3'],
             ['a1', 'ver'], ['a2', 'ver'], ['a3', 'ver'], ['ver', 'orch'], ['ver', 'out']].forEach(function (e) { edge(e[0], e[1]); });

            var pulseGeo = new THREE.SphereGeometry(0.075, 16, 12);
            var pulseMat = new THREE.MeshBasicMaterial({ color: 0xd6ff5c });
            var pulses = [0, 1, 2].map(function () { var p = new THREE.Mesh(pulseGeo, pulseMat); p.visible = false; g.add(p); return p; });

            function travel(pairs, k) {
                var e = ease(k);
                pulses.forEach(function (p, i) {
                    var pr = pairs[i];
                    p.visible = !!pr && k > 0.02 && k < 0.98;
                    if (!pr) return;
                    p.position.lerpVectors(nodes[pr[0]].p, nodes[pr[1]].p, e);
                    edges[pr[0] + '>' + pr[1]].heat = 1;
                });
            }
            function hide() { pulses.forEach(function (p) { p.visible = false; }); }
            function heat() { for (var i = 0; i < arguments.length; i++) nodes[arguments[i]].heat = 1; }

            var tl = new Timeline(function () {
                return [
                    { s: 0, d: 1.0, start: function () { heat('in'); }, run: function (k) { travel([['in', 'orch']], k); }, end: function () { hide(); heat('orch'); } },
                    { s: 1, d: 1.0, run: function (k) { nodes.orch.heat = 0.55 + 0.45 * Math.sin(k * Math.PI * 5); spin = 5; }, end: function () { spin = 0.6; } },
                    { s: 2, d: 1.0, run: function (k) { travel([['orch', 'a1'], ['orch', 'a2'], ['orch', 'a3']], k); }, end: function () { hide(); heat('a1', 'a2', 'a3'); } },
                    { s: 3, d: 0.8, run: function (k) { travel([['a1', 't1'], ['a2', 't2'], ['a3', 't3']], k); }, end: function () { hide(); heat('t1', 't2', 't3'); } },
                    { s: 3, d: 0.8, run: function (k) { travel([['t1', 'a1'], ['t2', 'a2'], ['t3', 'a3']], k); }, end: function () { hide(); heat('a1', 'a2', 'a3'); } },
                    { s: 4, d: 0.9, run: function (k) { travel([['a1', 'ver'], ['a2', 'ver'], ['a3', 'ver']], k); }, end: function () { hide(); heat('ver'); } },
                    { s: 4, d: 0.75, run: function (k) { travel([['ver', 'orch']], k); }, end: function () { hide(); heat('orch'); } },
                    { s: 4, d: 0.65, run: function (k) { travel([['orch', 'a2']], k); }, end: function () { hide(); heat('a2'); } },
                    { s: 4, d: 0.65, run: function (k) { travel([['a2', 'ver']], k); }, end: function () { hide(); heat('ver'); } },
                    { s: 5, d: 0.9, run: function (k) { travel([['ver', 'out']], k); }, end: function () { hide(); heat('out'); } },
                    { s: 5, d: 1.3, run: function () { nodes.out.heat = Math.max(nodes.out.heat, 0.8); } }
                ];
            });

            function settle(dt) {
                time += dt;
                var decay = Math.exp(-dt * 2.4), id, n, e;
                for (id in nodes) {
                    n = nodes[id];
                    n.heat *= decay;
                    n.mat.emissiveIntensity = 0.1 + n.heat * 1.0;
                    n.mesh.scale.setScalar(1 + n.heat * 0.16);
                    n.mesh.rotation.y += dt * (0.25 + n.heat);
                }
                for (id in edges) { e = edges[id]; e.heat *= decay; e.mat.opacity = 0.2 + e.heat * 0.6; }
                orchRing.rotation.x += dt * spin * 0.7;
                orchRing.rotation.y += dt * spin;
                g.rotation.y = Math.sin(time * 0.35) * 0.1;
            }

            return {
                group: g,
                update: function (dt) { var done = tl.update(dt); settle(dt); return done; },
                still: function () { heat('orch', 'a1', 'a2', 'a3'); settle(0.016); setStage(2); },
                theme: function (light) {
                    for (var id in edges) edges[id].mat.color.set(light ? 0x10121a : 0xffffff);
                    pulseMat.color.set(light ? 0x6fa800 : 0xd6ff5c);
                }
            };
        })();

        /* =====================================================================
           Scene 2: Robotics, cobot pick & place
           ===================================================================== */
        var robotics = (function () {
            var g = new THREE.Group();
            world.add(g);
            var L1 = 1.55, L2 = 1.35, L3 = 0.7, SHOULDER_Y = 1.15, BLOCK = 0.34, GRASP = 0.12;

            function joint(radius, width, y) {
                var j = new THREE.Group();
                var a = cylinder(radius, radius, width, matDark); a.rotation.z = Math.PI / 2;
                var b = cylinder(radius * 0.62, radius * 0.62, width + 0.035, matAcc); b.rotation.z = Math.PI / 2;
                j.add(a, b);
                j.position.y = y;
                return j;
            }

            var ped = cylinder(0.6, 0.7, 0.2, matDark); ped.position.y = 0.1; g.add(ped);
            var col = cylinder(0.4, 0.46, 0.5, matBody); col.position.y = 0.45; g.add(col);
            var ring = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.035, 12, 64), matAcc);
            ring.rotation.x = Math.PI / 2; ring.position.y = 0.7; g.add(ring);

            var yaw = new THREE.Group(); yaw.position.y = 0.72; g.add(yaw);
            var turret = cylinder(0.4, 0.42, 0.3, matBody); turret.position.y = 0.15; yaw.add(turret);
            yaw.add(joint(0.3, 0.74, SHOULDER_Y - 0.72));
            var shoulder = new THREE.Group(); shoulder.position.y = SHOULDER_Y - 0.72; yaw.add(shoulder);
            var link1 = cylinder(0.16, 0.2, L1, matBody); link1.position.y = L1 / 2; shoulder.add(link1);
            shoulder.add(joint(0.24, 0.6, L1));
            var elbow = new THREE.Group(); elbow.position.y = L1; shoulder.add(elbow);
            var link2 = cylinder(0.115, 0.155, L2, matBody); link2.position.y = L2 / 2; elbow.add(link2);
            elbow.add(joint(0.175, 0.44, L2));
            var wrist = new THREE.Group(); wrist.position.y = L2; elbow.add(wrist);
            var tool = cylinder(0.095, 0.12, 0.28, matBody); tool.position.y = 0.14; wrist.add(tool);
            var flange = cylinder(0.15, 0.15, 0.06, matDark); flange.position.y = 0.31; wrist.add(flange);
            var palm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.2), matDark); palm.position.y = 0.38; palm.castShadow = true; wrist.add(palm);
            var fingerGeo = new THREE.BoxGeometry(0.05, L3 - 0.42, 0.15);
            var fingerL = new THREE.Mesh(fingerGeo, matBody), fingerR = new THREE.Mesh(fingerGeo, matBody);
            fingerL.castShadow = fingerR.castShadow = true;
            fingerL.position.y = fingerR.position.y = 0.42 + (L3 - 0.42) / 2;
            wrist.add(fingerL, fingerR);
            var GRIP_OPEN = 0.27, GRIP_CLOSED = BLOCK / 2 + 0.025;

            // depth camera prop with its view cone
            (function () {
                var pos = new THREE.Vector3(-2.7, 2.7, -1.5), aim = new THREE.Vector3(-1.2, 0, 1.0);
                var pole = cylinder(0.035, 0.05, pos.y, matDark); pole.position.set(pos.x, pos.y / 2, pos.z);
                var bar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 0.12), matDark);
                bar.position.copy(pos); bar.castShadow = true; bar.lookAt(aim);
                [-0.17, 0.17].forEach(function (x) {
                    var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20), matAcc);
                    lens.rotation.x = Math.PI / 2; lens.position.set(x, 0, 0.065);
                    bar.add(lens);
                });
                var h = pos.distanceTo(aim);
                var coneGeo = new THREE.ConeGeometry(1.25, h, 40, 1, true);
                coneGeo.translate(0, -h / 2, 0);
                var cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xc6ff3a, transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false }));
                cone.position.copy(pos);
                cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim.clone().sub(pos).normalize());
                g.add(pole, bar, cone);
            })();

            var COLORS = [LIME, ORANGE, VIOLET];
            var SLOTS = [[-1.55, 0.95], [-0.85, 1.65], [-1.95, 0.1]];
            var PLACE = [1.5, 1.05];
            var HOME = { a: 0.15, r: 1.15, y: 1.75 };

            var slotRings = SLOTS.map(function (s) {
                var r = flatRing(0.36, 0.385, 0xffffff, 0.22); r.position.x = s[0]; r.position.z = s[1]; g.add(r);
                return r;
            });
            var pad = flatRing(0.4, 0.44, 0xc6ff3a, 0.75); pad.position.x = PLACE[0]; pad.position.z = PLACE[1]; g.add(pad);
            var padFill = flatRing(0, 0.4, 0xc6ff3a, 0.07); padFill.position.x = PLACE[0]; padFill.position.z = PLACE[1]; g.add(padFill);
            var scan = flatRing(0.3, 0.33, 0xc6ff3a, 0); g.add(scan);

            var blockGeo = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK);
            var blocks = COLORS.map(function (hex) {
                var b = new THREE.Mesh(blockGeo, new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.08, metalness: 0, roughness: 0.55, envMapIntensity: 0.2 }));
                b.castShadow = true; b.receiveShadow = true;
                g.add(b);
                return b;
            });
            function spawnBlocks() {
                blocks.forEach(function (b, i) {
                    g.attach(b);
                    var x = SLOTS[i][0] + (Math.random() - 0.5) * 0.2;
                    var z = SLOTS[i][1] + (Math.random() - 0.5) * 0.2;
                    b.position.set(x, BLOCK / 2, z);
                    b.rotation.set(0, Math.atan2(x, z), 0);
                    b.userData.pick = { x: x, z: z };
                });
            }

            var tip = { a: HOME.a, r: HOME.r, y: HOME.y }, grip = GRIP_OPEN;
            function solve() {
                yaw.rotation.y = tip.a;
                var wy = tip.y + L3 - SHOULDER_Y;
                var D = clamp(Math.hypot(tip.r, wy), Math.abs(L1 - L2) + 0.01, L1 + L2 - 0.01);
                var phi = Math.atan2(tip.r, wy);
                var alpha = Math.acos(clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1));
                var beta = Math.acos(clamp((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2), -1, 1));
                var t1 = phi - alpha, t2 = Math.PI - beta;
                shoulder.rotation.x = t1;
                elbow.rotation.x = t2;
                wrist.rotation.x = Math.PI - t1 - t2;       // tool always points straight down
                fingerL.position.x = -grip; fingerR.position.x = grip;
            }

            var steps = [], idx = 0, st = 0, from = null;
            function buildProgram() {
                steps = [];
                blocks.forEach(function (b, i) {
                    var nominal = cyl(SLOTS[i][0], SLOTS[i][1]);
                    var actual = cyl(b.userData.pick.x, b.userData.pick.z);
                    var place = cyl(PLACE[0], PLACE[1]);
                    var pickY = BLOCK / 2 - GRASP, placeY = BLOCK / 2 + i * BLOCK - GRASP;
                    steps.push(
                        { s: 0, to: HOME, d: 0.55 },
                        { s: 1, to: { a: nominal.a, r: nominal.r, y: 1.05 }, d: 1.05 },
                        { s: 2, to: { a: actual.a, r: actual.r, y: 0.82 }, d: 0.95, scan: b },
                        { s: 3, to: { a: actual.a, r: actual.r, y: pickY }, d: 0.85 },
                        { s: 3, grip: GRIP_CLOSED, d: 0.5, after: function () { wrist.attach(b); b.position.set(0, L3 - GRASP, 0); b.rotation.set(0, 0, 0); } },
                        { s: 4, to: { a: actual.a, r: actual.r, y: 1.1 }, d: 0.65 },
                        { s: 5, to: { a: place.a, r: place.r, y: placeY + 0.85 }, d: 1.3, arc: 0.3 },
                        { s: 6, to: { a: place.a, r: place.r, y: placeY + 0.2 }, d: 0.75 },
                        { s: 7, to: { a: place.a, r: place.r, y: placeY }, d: 0.6 },
                        { s: 7, grip: GRIP_OPEN, d: 0.45, after: function () { g.attach(b); b.position.set(PLACE[0], BLOCK / 2 + i * BLOCK, PLACE[1]); b.rotation.set(0, place.a, 0); } },
                        { s: 8, to: { a: place.a, r: place.r, y: placeY + 0.7 }, d: 0.5 },
                        { s: 8, to: HOME, d: 0.9, cycle: true }            // one block placed: a natural point to change scene
                    );
                });
                steps.push({ s: 0, wait: true, d: 0.8 }, { s: 0, reset: true, d: 0.9 });
                idx = 0; st = 0; from = null;
            }

            function update(dt) {
                var s = steps[idx], done = false;
                if (!from) { from = { a: tip.a, r: tip.r, y: tip.y, grip: grip }; setStage(s.s); }
                st += dt / s.d;
                var k = ease(clamp(st, 0, 1));
                if (s.to) {
                    tip.a = lerpAngle(from.a, s.to.a, k);
                    tip.r = lerp(from.r, s.to.r, k);
                    tip.y = lerp(from.y, s.to.y, k) + (s.arc ? Math.sin(Math.PI * k) * s.arc : 0);
                }
                if (s.grip !== undefined) grip = lerp(from.grip, s.grip, k);
                if (s.scan) {
                    scan.position.x = s.scan.position.x; scan.position.z = s.scan.position.z;
                    var pulse = 1 + 0.55 * Math.abs(Math.sin(st * Math.PI * 3));
                    scan.scale.set(pulse, pulse, 1);
                    scan.material.opacity = 0.85 * Math.sin(Math.PI * clamp(st, 0, 1));
                }
                if (s.reset) {
                    var sc = st < 0.5 ? 1 - ease(clamp(st * 2, 0, 1)) : ease(clamp(st * 2 - 1, 0, 1));
                    if (st >= 0.5 && !s.done) { spawnBlocks(); s.done = true; }
                    blocks.forEach(function (b) { b.scale.setScalar(Math.max(sc, 0.001)); });
                }
                if (st >= 1) {
                    if (s.after) s.after();
                    if (s.scan) scan.material.opacity = 0;
                    if (s.cycle) done = true;
                    idx++; st = 0; from = null;
                    if (idx >= steps.length) buildProgram();
                }
                solve();
                return done;
            }

            spawnBlocks();
            buildProgram();
            solve();

            return {
                group: g,
                update: update,
                still: function () { tip = { a: -0.6, r: 1.7, y: 1.0 }; solve(); setStage(1); },
                theme: function (light) {
                    slotRings.forEach(function (r) { r.material.color.set(light ? 0x10121a : 0xffffff); r.material.opacity = light ? 0.3 : 0.22; });
                    pad.material.color.set(light ? 0x5c8f00 : 0xc6ff3a);
                }
            };
        })();

        /* =====================================================================
           Scene 3: Quantum job pipeline
           ===================================================================== */
        var quantum = (function () {
            var g = new THREE.Group();
            world.add(g);
            var time = 0;

            // Bloch sphere with a state vector
            var bloch = new THREE.Group();
            bloch.position.set(-0.95, 2.2, 0.25);
            g.add(bloch);
            var R = 0.86;
            var shellMat = new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.09, depthWrite: false });
            var shell = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 28), shellMat);
            shell.castShadow = true;
            bloch.add(shell);
            var ringMat = new THREE.MeshBasicMaterial({ color: 0x9d8bff, transparent: true, opacity: 0.8 });
            var rings = [[Math.PI / 2, 0], [0, 0], [0, Math.PI / 2]].map(function (r) {
                var t = new THREE.Mesh(new THREE.TorusGeometry(R, 0.011, 8, 120), ringMat);
                t.rotation.set(r[0], r[1], 0);
                bloch.add(t);
                return t;
            });
            var axis = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 2 * R + 0.3, 8), ringMat);
            bloch.add(axis);
            var l0 = makeLabel('|0⟩', true); l0.position.set(0, R + 0.3, 0); bloch.add(l0);
            var l1 = makeLabel('|1⟩', true); l1.position.set(0, -R - 0.3, 0); bloch.add(l1);

            var arrow = new THREE.Group();
            var arrowMat = glowMat(0xf3f2ec); arrowMat.emissiveIntensity = 0.35;
            var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, R * 0.84, 16), arrowMat); shaft.position.y = R * 0.42;
            var head = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.2, 24), arrowMat); head.position.y = R * 0.92;
            var core = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), arrowMat);
            shaft.castShadow = head.castShadow = true;
            arrow.add(shaft, head, core);
            bloch.add(arrow);
            var theta = 0.25, phi = 0, UP = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
            function aim() {
                dir.set(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
                arrow.quaternion.setFromUnitVectors(UP, dir);
            }

            // Circuit: three qubit wires with gates
            var WIRE_Y = 0.42, WIRE_Z = [0.55, 1.05, 1.55], X0 = -1.15, DX = 0.5;
            function slotX(i) { return X0 + i * DX; }
            var wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
            WIRE_Z.forEach(function (z, i) {
                var w = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 4.2, 8), wireMat);
                w.rotation.z = Math.PI / 2; w.position.set(X0 + 1.75, WIRE_Y, z);
                g.add(w);
                var q = makeLabel('q' + i, true); q.position.set(X0 - 0.6, WIRE_Y, z); g.add(q);
            });

            function gateMat(letter, hex) {
                var cv = document.createElement('canvas'); cv.width = cv.height = 128;
                var c = cv.getContext('2d');
                c.fillStyle = '#' + new THREE.Color(hex).getHexString(); c.fillRect(0, 0, 128, 128);
                c.fillStyle = 'rgba(8,9,14,0.88)'; c.font = '700 86px Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
                c.fillText(letter, 64, 70);
                var tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding;
                return new THREE.MeshStandardMaterial({ map: tex, emissive: hex, emissiveIntensity: 0.1, metalness: 0, roughness: 0.5, envMapIntensity: 0.25 });
            }
            var GM = { H: gateMat('H', 0x8f78ff), X: gateMat('X', 0x25c2ee), Z: gateMat('Z', 0xe9e9e3) };
            var gateGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            // [wire, slot, type, cancelled by the optimiser?, slot after compaction]
            var LAYOUT = [
                [0, 0, 'H', 1], [0, 1, 'H', 1], [0, 2, 'X', 0, 0], [0, 4, 'Z', 0, 1], [0, 6, 'H', 0, 2],
                [1, 0, 'X', 0, 0], [1, 2, 'H', 1], [1, 3, 'H', 1], [1, 5, 'X', 1], [1, 6, 'X', 1],
                [2, 1, 'H', 0, 0], [2, 3, 'X', 1], [2, 4, 'X', 1], [2, 7, 'H', 0, 1]
            ];
            var gates = LAYOUT.map(function (d) {
                var m = new THREE.Mesh(gateGeo, GM[d[2]]);
                m.castShadow = true;
                m.position.set(slotX(d[1]), WIRE_Y, WIRE_Z[d[0]]);
                g.add(m);
                return { mesh: m, slot: d[1], cut: !!d[3], to: d[4], flash: 0, s: 0 };
            });

            // forecast bar: predicted runtime, and a marker that runs along it
            var BAR_Z = 2.2, BAR_LEN = 3.7, FULL = 1, OPT = 3 / 8;
            var track = new THREE.Mesh(new THREE.BoxGeometry(BAR_LEN, 0.03, 0.09), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 }));
            track.position.set(X0 - 0.2 + BAR_LEN / 2, 0.05, BAR_Z); g.add(track);
            var fillGeo = new THREE.BoxGeometry(BAR_LEN, 0.05, 0.11); fillGeo.translate(BAR_LEN / 2, 0, 0);
            var fill = new THREE.Mesh(fillGeo, new THREE.MeshBasicMaterial({ color: 0x9d8bff }));
            fill.position.set(X0 - 0.2, 0.06, BAR_Z); fill.scale.x = 0.001; g.add(fill);
            var marker = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            marker.position.set(X0 - 0.2, 0.1, BAR_Z); marker.visible = false; g.add(marker);
            var barLabel = makeLabel('Predicted runtime'); barLabel.position.set(X0 + 0.9, 0.34, BAR_Z + 0.3); g.add(barLabel);

            var scanMat = new THREE.MeshBasicMaterial({ color: 0x9d8bff, transparent: true, opacity: 0, depthWrite: false });
            var scanner = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 1.45), scanMat);
            scanner.position.set(X0, WIRE_Y + 0.08, (WIRE_Z[0] + WIRE_Z[2]) / 2);
            g.add(scanner);

            function resetGates() {
                gates.forEach(function (q) { q.mesh.position.x = slotX(q.slot); q.s = 0; q.flash = 0; q.mesh.rotation.set(0, 0, 0); });
                fill.scale.x = 0.001; marker.visible = false; scanMat.opacity = 0; theta = 0.25;
            }

            var tl = new Timeline(function () {
                return [
                    { s: 0, d: 1.2, start: resetGates, run: function (k) { gates.forEach(function (q) { q.s = ease(clamp(k * 1.9 - q.slot * 0.11, 0, 1)); }); } },
                    { s: 1, d: 1.1, run: function (k) { fill.scale.x = Math.max(0.001, ease(k) * FULL); } },
                    { s: 2, d: 0.8, run: function (k) { gates.forEach(function (q) { if (q.cut) { q.s = 1 - ease(k); q.mesh.rotation.y = k * Math.PI; } }); } },
                    { s: 2, d: 0.9, run: function (k) {
                        var e = ease(k);
                        gates.forEach(function (q) { if (!q.cut) q.mesh.position.x = lerp(slotX(q.slot), slotX(q.to), e); });
                        fill.scale.x = lerp(FULL, OPT, e);
                    } },
                    { s: 3, d: 0.8, run: function (k) { var p = 1 + 0.07 * Math.sin(k * Math.PI); bloch.scale.setScalar(p); }, end: function () { bloch.scale.setScalar(1); } },
                    { s: 4, d: 2.3, start: function () { marker.visible = true; }, run: function (k) {
                        var x = lerp(slotX(-0.7), slotX(2.7), k);
                        scanner.position.x = x;
                        scanMat.opacity = 0.34 * Math.sin(Math.PI * clamp(k, 0, 1));
                        marker.position.x = X0 - 0.2 + BAR_LEN * OPT * k;
                        gates.forEach(function (q) { if (!q.cut && Math.abs(q.mesh.position.x - x) < 0.14) q.flash = 1; });
                        theta = lerp(0.25, 2.35, ease(k)); phi += 0.07;
                    }, end: function () { scanMat.opacity = 0; } },
                    { s: 5, d: 1.4, run: function (k) { shellMat.opacity = 0.09 + 0.2 * Math.sin(Math.PI * k); }, end: function () { shellMat.opacity = 0.09; } }
                ];
            });

            function settle(dt) {
                time += dt;
                var decay = Math.exp(-dt * 3);
                gates.forEach(function (q) {
                    q.flash *= decay;
                    q.mesh.scale.setScalar(Math.max(0.001, q.s * (1 + q.flash * 0.3)));
                    q.mesh.visible = q.s > 0.01;
                });
                phi += dt * 0.5;
                aim();
                bloch.rotation.y = Math.sin(time * 0.3) * 0.3;
            }

            resetGates();
            return {
                group: g,
                update: function (dt) { var done = tl.update(dt); settle(dt); return done; },
                still: function () { gates.forEach(function (q) { q.s = 1; }); fill.scale.x = FULL; theta = 0.9; settle(0.016); setStage(1); },
                theme: function (light) {
                    wireMat.color.set(light ? 0x10121a : 0xffffff);
                    track.material.color.set(light ? 0x10121a : 0xffffff);
                    marker.material.color.set(light ? 0x10121a : 0xffffff);
                    ringMat.color.set(light ? 0x5a43e0 : 0x9d8bff);
                    arrowMat.color.set(light ? 0x2a2d3a : 0xf3f2ec);
                    arrowMat.emissive.set(light ? 0x000000 : 0xf3f2ec);
                }
            };
        })();

        var SCENES = { agentic: agentic, robotics: robotics, quantum: quantum };

        /* ---------- Layout: place the stage beside (desktop) or below (mobile) the text ---------- */
        var W = 1, H = 1;
        function layout() {
            var rect = hero.getBoundingClientRect();
            W = Math.max(1, Math.round(rect.width)); H = Math.max(1, Math.round(rect.height));
            renderer.setSize(W, H, false);
            camera.aspect = W / H;

            var stats = hero.querySelector('.hero-stats');
            var cta = hero.querySelector('.hero-cta');
            var statsTop = stats ? stats.offsetTop : H;
            var cx, cy, rw, rh;
            if (W >= 900) {
                if (hud) hud.style.top = '';
                rw = W * 0.54; cx = W * 0.72;
                var top = 96; rh = Math.max(240, statsTop - top - 10); cy = top + rh / 2;
            } else {
                var ctaBottom = cta ? (cta.getBoundingClientRect().bottom - rect.top) : H * 0.5;
                var hudH = 0;
                if (hud) { hud.style.top = Math.round(ctaBottom + 18) + 'px'; hudH = hud.offsetHeight + 18; }
                rw = W; cx = W / 2;
                rh = Math.max(200, statsTop - ctaBottom - hudH - 16); cy = ctaBottom + hudH + 8 + rh / 2;
            }
            var zoom = Math.min((VIEW_UNITS * rh) / (4.7 * H), (VIEW_UNITS * rw) / (5.8 * H));
            camera.zoom = clamp(zoom, 0.15, 3);
            camera.setViewOffset(W, H, -(cx - W / 2), -(cy - H / 2), W, H);
            camera.updateProjectionMatrix();
        }

        /* ---------- Theme ---------- */
        function applyTheme() {
            var light = root.getAttribute('data-theme') === 'light';
            drawGrid(light);
            labelDraws.forEach(function (d) { d(light); });
            matBody.color.set(light ? 0xffffff : WHITE);
            shadowMat.opacity = light ? 0.2 : 0.42;
            hemi.intensity = light ? 0.85 : 0.5;
            rim.intensity = light ? 0.5 : 1.4;
            ORDER.forEach(function (n) { SCENES[n].theme(light); });
            renderOnce();
        }

        /* ---------- Scene switching ---------- */
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var hold = 0, switching = false;
        function activate(name) {
            active = name;
            ORDER.forEach(function (n) { SCENES[n].group.visible = n === name; });
            setHudScene(name);
            if (reduced) SCENES[name].still();
            else setStage(0);
        }
        function show(name, manual) {
            if (manual) hold = 40;                              // stay on a hand-picked scene for a while
            if (name === active || switching) return;
            if (reduced) { activate(name); renderOnce(); return; }
            switching = true;
            canvas.style.opacity = '0';
            setTimeout(function () {
                activate(name);
                canvas.style.opacity = '1';
                switching = false;
            }, 380);
        }
        hudTabs.forEach(function (t) {
            t.addEventListener('click', function () { show(t.getAttribute('data-scene-tab'), true); });
        });

        /* ---------- Loop ---------- */
        var pointer = { x: 0, y: 0 }, cam = { x: 0, y: 0 };
        var visible = true, running = false, last = 0;

        function renderOnce() {
            cam.x += (pointer.x - cam.x) * 0.05;
            cam.y += (pointer.y - cam.y) * 0.05;
            camera.position.set(CAM_BASE.x + cam.x * 1.1, CAM_BASE.y - cam.y * 0.5, CAM_BASE.z - cam.x * 0.8);
            camera.lookAt(CAM_TARGET);
            renderer.render(scene, camera);
        }
        function frame(now) {
            if (!running) return;
            var dt = Math.min((now - last) / 1000, 0.05); last = now;
            hold = Math.max(0, hold - dt);
            if (!switching) {
                var done = SCENES[active].update(dt);
                if (done && hold <= 0) show(ORDER[(ORDER.indexOf(active) + 1) % ORDER.length], false);
            }
            renderOnce();
            requestAnimationFrame(frame);
        }
        function start() {
            if (running || reduced || !visible || document.hidden) return;
            running = true; last = performance.now();
            requestAnimationFrame(frame);
        }
        function stop() { running = false; }

        window.addEventListener('pointermove', function (e) {
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });
        window.addEventListener('resize', function () { layout(); renderOnce(); });
        document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
        window.addEventListener('themechange', applyTheme);
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                if (visible) start(); else stop();
            }, { threshold: 0.02 }).observe(hero);
        }
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); renderOnce(); });
        window.addEventListener('load', function () { layout(); renderOnce(); });

        canvas.style.transition = 'opacity 0.38s ease';
        activate('agentic');
        layout();
        applyTheme();
        start();
    }

    // Three.js is bundled with the site and loaded without blocking the page
    function boot() {
        if (window.THREE) { init(); return; }
        var s = document.createElement('script');
        s.src = 'js/vendor/three.min.js';
        s.async = true;
        s.onload = init;
        s.onerror = function () { document.documentElement.classList.add('no-webgl'); };
        document.head.appendChild(s);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
