/* ========================================
   Three.js Neural Network Background
   Animated 3D brain-like particle network
   ======================================== */

class NeuralBackground {
    constructor() {
        this.canvas = document.getElementById('neural-bg');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
        
        this.particles = [];
        this.connections = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        this.clock = new THREE.Clock();
        
        this.init();
    }

    init() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        // Camera position
        this.camera.position.z = 30;
        this.camera.position.y = 0;

        // Create neural network
        this.createNeuralNetwork();
        this.createAmbientParticles();
        this.createGlowingSpheres();
        this.createFloatingGlyphs();

        // Events
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('scroll', () => this.onScroll());

        // Start animation
        this.animate();
    }

    createNeuralNetwork() {
        const nodeCount = 80;
        const spread = 40;
        const nodeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.8 });

        // Create nodes
        for (let i = 0; i < nodeCount; i++) {
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
            node.position.set(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread * 0.7,
                (Math.random() - 0.5) * 20
            );
            node.userData = {
                originalPos: node.position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.005
                ),
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.5 + Math.random() * 1.5
            };
            this.scene.add(node);
            this.particles.push(node);
        }

        // Create connections between nearby nodes
        this.connectionMaterial = new THREE.LineBasicMaterial({
            color: 0x00f5ff,
            transparent: true,
            opacity: 0.15
        });

        this.updateConnections();
    }

    updateConnections() {
        // Remove old connections
        this.connections.forEach(line => this.scene.remove(line));
        this.connections = [];

        const maxDistance = 8;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dist = this.particles[i].position.distanceTo(this.particles[j].position);
                if (dist < maxDistance) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        this.particles[i].position,
                        this.particles[j].position
                    ]);
                    const material = this.connectionMaterial.clone();
                    material.opacity = 0.15 * (1 - dist / maxDistance);
                    const line = new THREE.Line(geometry, material);
                    this.scene.add(line);
                    this.connections.push(line);
                }
            }
        }
    }

    createAmbientParticles() {
        const count = 500;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            sizes[i] = Math.random() * 2;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            color: 0x00f5ff,
            size: 0.05,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        this.ambientParticles = new THREE.Points(geometry, material);
        this.scene.add(this.ambientParticles);
    }

    createGlowingSpheres() {
        // Create a few larger glowing orbs
        const orbCount = 5;
        this.orbs = [];

        for (let i = 0; i < orbCount; i++) {
            const geometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.5, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x00f5ff : 0x7c3aed,
                transparent: true,
                opacity: 0.15
            });
            const orb = new THREE.Mesh(geometry, material);
            orb.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 20,
                -5 + Math.random() * -10
            );
            orb.userData = {
                speed: 0.2 + Math.random() * 0.3,
                amplitude: 3 + Math.random() * 5,
                phase: Math.random() * Math.PI * 2
            };
            this.scene.add(orb);
            this.orbs.push(orb);
        }
    }

    /* Floating CSE / AI / Quantum / Robotics terminology
       — pulled from the resume: languages, frameworks, tooling & concepts. */
    createFloatingGlyphs() {
        const terms = [
            // Languages & code
            'Python', 'C++', '{ }', '</>', 'def', 'class', 'async', '=>', '()', '[]',
            // AI / Agents
            'Agentic AI', 'LangGraph', 'LangChain', 'CrewAI', 'RAG', 'LLM', 'GPT',
            'Multimodal AI', 'Prompt Eng.', 'Gen AI', 'Deep Learning', 'XGBoost',
            'LightGBM', 'TF-IDF', 'NLP',
            // Quantum
            'Qiskit', 'Qubit', '|0⟩', '|1⟩', 'H|0⟩', 'CNOT', 'φ', 'Σ', '∇', 'λ', 'π', '∫', '⊗',
            // Robotics / control / industrial
            'PID', 'PLC', 'CoBot', 'TIA Portal', 'MPU-6050', 'Arduino', 'Raspberry Pi',
            'ROS', 'HMI', 'Sensor Fusion', 'Edge AI', 'IoT',
            // Companies / identity
            'Siemens', 'IBM Quantum', 'RGUKT',
            // Binary
            '01', '10', '110', '01011', '0x1F'
        ];

        // adaptive count for perf
        const isSmall = window.innerWidth < 768;
        const isMedium = window.innerWidth < 1200;
        const count = isSmall ? 22 : isMedium ? 34 : 48;

        const colors = ['#00f5ff', '#7c3aed', '#06ffa5', '#5eead4'];

        // helper — render one term to a canvas and return a CanvasTexture
        const makeTextTexture = (text, color) => {
            const c = document.createElement('canvas');
            c.width = 512; c.height = 128;
            const g = c.getContext('2d');
            g.clearRect(0, 0, c.width, c.height);
            g.shadowColor = color;
            g.shadowBlur = 22;
            g.fillStyle = color;
            g.font = '600 68px "Space Grotesk", "Segoe UI", monospace';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText(text, c.width / 2, c.height / 2);
            // second pass sharpens the letters
            g.shadowBlur = 6;
            g.fillText(text, c.width / 2, c.height / 2);
            const tex = new THREE.CanvasTexture(c);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.needsUpdate = true;
            return tex;
        };

        this.glyphs = [];
        for (let i = 0; i < count; i++) {
            const text = terms[Math.floor(Math.random() * terms.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const tex = makeTextTexture(text, color);
            const material = new THREE.SpriteMaterial({
                map: tex,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.3,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(material);
            const s = 2 + Math.random() * 2.5;                 // base scale
            sprite.scale.set(s * 2.2, s * 0.55, 1);             // canvas is 4:1
            sprite.position.set(
                (Math.random() - 0.5) * 70,
                (Math.random() - 0.5) * 40,
                -Math.random() * 30 - 4
            );
            sprite.userData = {
                baseY: sprite.position.y,
                driftSpeed: 0.02 + Math.random() * 0.06,
                phase: Math.random() * Math.PI * 2,
                bob: 0.3 + Math.random() * 0.8,
                twinkle: 0.4 + Math.random() * 0.6,
                baseOpacity: material.opacity
            };
            this.scene.add(sprite);
            this.glyphs.push(sprite);
        }
    }

    onMouseMove(event) {
        this.targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onScroll() {
        const scrollY = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const scrollProgress = scrollY / maxScroll;
        
        // Rotate scene slightly based on scroll
        this.scene.rotation.y = scrollProgress * 0.5;
        this.scene.rotation.x = scrollProgress * 0.2;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();
        
        // Smooth mouse following
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

        // Animate neural nodes
        this.particles.forEach((node, i) => {
            const { originalPos, velocity, pulsePhase, pulseSpeed } = node.userData;
            
            // Gentle floating motion
            node.position.x = originalPos.x + Math.sin(time * velocity.x * 10 + i) * 0.5;
            node.position.y = originalPos.y + Math.cos(time * velocity.y * 10 + i) * 0.5;
            node.position.z = originalPos.z + Math.sin(time * velocity.z * 10 + i * 0.5) * 0.3;
            
            // Pulse effect
            const pulse = Math.sin(time * pulseSpeed + pulsePhase) * 0.5 + 0.5;
            node.material.opacity = 0.4 + pulse * 0.6;
            node.scale.setScalar(0.8 + pulse * 0.4);
        });

        // Update connections periodically (every 60 frames)
        if (Math.floor(time * 60) % 60 === 0) {
            this.updateConnections();
        }

        // Animate ambient particles
        if (this.ambientParticles) {
            this.ambientParticles.rotation.y = time * 0.02;
            this.ambientParticles.rotation.x = time * 0.01;
        }

        // Animate orbs
        this.orbs.forEach((orb, i) => {
            const { speed, amplitude, phase } = orb.userData;
            orb.position.x += Math.sin(time * speed + phase) * 0.02;
            orb.position.y += Math.cos(time * speed * 0.7 + phase) * 0.015;
            orb.material.opacity = 0.08 + Math.sin(time * speed + phase) * 0.07;
        });

        // Animate floating resume glyphs — slow leftward drift + gentle bob + twinkle
        if (this.glyphs) {
            for (let i = 0; i < this.glyphs.length; i++) {
                const g = this.glyphs[i];
                const u = g.userData;
                g.position.x -= u.driftSpeed;
                g.position.y = u.baseY + Math.sin(time * u.twinkle + u.phase) * u.bob;
                // recycle to right edge once it drifts off-screen
                if (g.position.x < -38) {
                    g.position.x = 38;
                    g.position.z = -Math.random() * 30 - 4;
                    u.baseY = (Math.random() - 0.5) * 40;
                }
                g.material.opacity = u.baseOpacity + Math.sin(time * u.twinkle + u.phase) * 0.18;
            }
        }

        // Camera reacts to mouse
        this.camera.position.x += (this.mouseX * 3 - this.camera.position.x) * 0.02;
        this.camera.position.y += (this.mouseY * 2 - this.camera.position.y) * 0.02;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NeuralBackground();
});
