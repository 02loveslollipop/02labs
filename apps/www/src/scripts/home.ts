/**
 * 02Labs home – card-stack controller + hero entrance.
 *
 * All animations use the browser-native Web Animations API (WAAPI).
 * No external animation library required.
 */

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

const prefersReducedMotion =
	typeof window !== "undefined" &&
	window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Build a CSS transform string from individual values. */
function tf(y = 0, rotate = 0, scale = 1): string {
	return `translateY(${y}px) rotate(${rotate}deg) scale(${scale})`;
}

/** Set inline opacity + transform in one shot. */
function pose(el: HTMLElement, opacity: number, y = 0, rotate = 0, scale = 1) {
	el.style.opacity = String(opacity);
	el.style.transform = tf(y, rotate, scale);
}

/**
 * Run a WAAPI animation, commit its final keyframe as inline style,
 * and return a promise that resolves when it's done.
 */
function run(
	el: HTMLElement,
	from: Keyframe,
	to: Keyframe,
	duration: number,
	delay = 0,
	easing = EASE
): Promise<void> {
	const anim = el.animate([from, to], {
		duration,
		delay,
		easing,
		fill: "forwards",
	});
	return anim.finished.then(() => {
		// Commit the "to" state as persistent inline styles
		for (const [k, v] of Object.entries(to)) {
			(el.style as any)[k] = v;
		}
		anim.cancel(); // release the fill-forward hold
	});
}

// --------------------------------------------------------------------------
// Navbar scroll-aware styling
// --------------------------------------------------------------------------

function setupNav() {
	const nav = document.getElementById("siteNav");
	const sentinel = document.getElementById("heroSentinel");
	if (!nav || !sentinel) return;

	const io = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting) nav.removeAttribute("data-scrolled");
			else nav.dataset.scrolled = "true";
		},
		{ threshold: 0 }
	);
	io.observe(sentinel);
}

// --------------------------------------------------------------------------
// Card-stack controller — WAAPI-driven transitions
// --------------------------------------------------------------------------

function setupCardStack() {
	const sections = Array.from(
		document.querySelectorAll<HTMLElement>("[data-snap-section]")
	);
	if (sections.length === 0) return;

	let current = 0;
	let transitioning = false;
	const DUR = 560;

	document.documentElement.classList.add("card-stack-active");

	// ── Progress dots ────────────────────────────────────────────────────
	const dotsNav = document.createElement("nav");
	dotsNav.className = "card-dots";
	dotsNav.setAttribute("aria-label", "Card navigation");

	const dots: HTMLButtonElement[] = sections.map((_, i) => {
		const b = document.createElement("button");
		b.className = "card-dot";
		b.setAttribute("aria-label", `Go to card ${i + 1}`);
		b.addEventListener("click", () => goTo(i));
		dotsNav.appendChild(b);
		return b;
	});
	document.body.appendChild(dotsNav);

	// ── Initial state ────────────────────────────────────────────────────
	sections[0].dataset.state = "active";
	pose(sections[0], 1, 0, 0, 1);
	for (let i = 1; i < sections.length; i++) {
		pose(sections[i], 0, 60, 0, 0.96);
	}

	function syncUI(idx: number) {
		for (let i = 0; i < dots.length; i++) {
			if (i === idx) dots[i].dataset.active = "true";
			else dots[i].removeAttribute("data-active");
		}
		const nav = document.getElementById("siteNav");
		if (nav) {
			if (idx > 0) nav.dataset.scrolled = "true";
			else nav.removeAttribute("data-scrolled");
		}
	}

	// ── Transition engine ────────────────────────────────────────────────
	function goTo(to: number) {
		if (to === current || to < 0 || to >= sections.length || transitioning) return;

		transitioning = true;
		const from = current;
		const forward = to > from;
		const outEl = sections[from];
		const inEl = sections[to];

		current = to;
		syncUI(to);
		outEl.dataset.state = "";
		inEl.dataset.state = "active";

		// z-order so both are visible during animation
		for (const s of sections) s.style.zIndex = "0";
		outEl.style.zIndex = "2";
		inEl.style.zIndex = "3";

		if (prefersReducedMotion) {
			pose(outEl, 0, 0, 0, 1);
			pose(inEl, 1, 0, 0, 1);
			outEl.style.zIndex = "0";
			inEl.style.zIndex = "2";
			transitioning = false;
			return;
		}

		let outFrom: Keyframe, outTo: Keyframe;
		let inFrom: Keyframe, inTo: Keyframe;
		let outDur: number, inDur: number, inDelay: number;

		if (from === 0 && forward) {
			// Hero → first card: slide up
			outFrom = { opacity: "1", transform: tf(0, 0, 1) };
			outTo   = { opacity: "0", transform: tf(-100, 0, 0.96) };
			inFrom  = { opacity: "0", transform: tf(80, 0, 0.96) };
			inTo    = { opacity: "1", transform: tf(0, 0, 1) };
			outDur  = DUR;
			inDur   = DUR;
			inDelay = DUR * 0.55;

		} else if (to === 0 && !forward) {
			// Back to hero: slide down
			outFrom = { opacity: "1", transform: tf(0, 0, 1) };
			outTo   = { opacity: "0", transform: tf(80, 0, 0.96) };
			inFrom  = { opacity: "0", transform: tf(-100, 0, 0.96) };
			inTo    = { opacity: "1", transform: tf(0, 0, 1) };
			outDur  = DUR;
			inDur   = DUR;
			inDelay = 0; // both play simultaneously

		} else if (forward) {
			// Shuffle forward: current tilts to back, next dealt from below
			outFrom = { opacity: "1", transform: tf(0, 0, 1) };
			outTo   = { opacity: "0", transform: tf(-40, 6, 0.88) };
			inFrom  = { opacity: "0", transform: tf(60, -5, 0.92) };
			inTo    = { opacity: "1", transform: tf(0, 0, 1) };
			outDur  = DUR * 0.65;
			inDur   = DUR;
			inDelay = outDur + DUR * 0.05;

		} else {
			// Shuffle backward: reverse deal
			outFrom = { opacity: "1", transform: tf(0, 0, 1) };
			outTo   = { opacity: "0", transform: tf(60, -5, 0.92) };
			inFrom  = { opacity: "0", transform: tf(-40, 6, 0.88) };
			inTo    = { opacity: "1", transform: tf(0, 0, 1) };
			outDur  = DUR * 0.65;
			inDur   = DUR;
			inDelay = outDur + DUR * 0.05;
		}

		const outP = run(outEl, outFrom, outTo, outDur);
		const inP  = run(inEl, inFrom, inTo, inDur, inDelay);

		Promise.all([outP, inP]).then(() => {
			outEl.style.zIndex = "0";
			inEl.style.zIndex = "2";
			transitioning = false;
		});
	}

	function next() { goTo(current + 1); }
	function prev() { goTo(current - 1); }

	// ── Wheel ────────────────────────────────────────────────────────────
	let wheelAcc = 0;
	const WHEEL_THRESHOLD = 50;
	window.addEventListener(
		"wheel",
		(e) => {
			e.preventDefault();
			wheelAcc += e.deltaY;
			if (Math.abs(wheelAcc) >= WHEEL_THRESHOLD) {
				if (wheelAcc > 0) next(); else prev();
				wheelAcc = 0;
			}
		},
		{ passive: false }
	);

	// ── Touch ────────────────────────────────────────────────────────────
	let touchStartY = 0;
	const TOUCH_THRESHOLD = 50;
	window.addEventListener("touchstart", (e) => {
		touchStartY = e.touches[0].clientY;
	}, { passive: true });
	window.addEventListener("touchend", (e) => {
		const dy = touchStartY - e.changedTouches[0].clientY;
		if (Math.abs(dy) < TOUCH_THRESHOLD) return;
		if (dy > 0) next(); else prev();
	}, { passive: true });

	// ── Keyboard ─────────────────────────────────────────────────────────
	window.addEventListener("keydown", (e) => {
		switch (e.key) {
			case "ArrowDown": case "PageDown": case " ":
				e.preventDefault(); next(); break;
			case "ArrowUp": case "PageUp":
				e.preventDefault(); prev(); break;
			case "Home": e.preventDefault(); goTo(0); break;
			case "End":  e.preventDefault(); goTo(sections.length - 1); break;
		}
	});

	// ── Hash ─────────────────────────────────────────────────────────────
	function handleHash() {
		const hash = location.hash.slice(1);
		if (!hash) return;
		const idx = sections.findIndex(
			(s) => s.id === hash || s.querySelector(`#${CSS.escape(hash)}`) !== null
		);
		if (idx >= 0) goTo(idx);
	}
	window.addEventListener("hashchange", handleHash);
	handleHash();

	syncUI(0);
}

// --------------------------------------------------------------------------
// Hero entrance animation (WAAPI stagger)
// --------------------------------------------------------------------------

function runHeroAnimation() {
	if (prefersReducedMotion) return;

	const title    = document.querySelector<HTMLElement>("[data-animate='hero-title']");
	const kicker   = document.querySelector<HTMLElement>("[data-animate='hero-kicker']");
	const sub      = document.querySelector<HTMLElement>("[data-animate='hero-sub']");
	const navBrand = document.querySelector<HTMLElement>("[data-animate='nav-brand']");
	const navGH    = document.querySelector<HTMLElement>("[data-animate='nav-github']");
	const navLinks = Array.from(document.querySelectorAll<HTMLElement>(".nav__links a"));

	if (!title || !sub) return;

	const els = [kicker, title, sub, navBrand, navGH, ...navLinks].filter(
		(v): v is HTMLElement => Boolean(v)
	);

	// Hide immediately before first paint
	for (const el of els) {
		el.style.opacity = "0";
		el.style.transform = "translateY(14px)";
	}

	const fadeIn = (el: HTMLElement, dur: number, delay: number) => {
		const a = el.animate(
			[
				{ opacity: "0", transform: "translateY(14px)" },
				{ opacity: "1", transform: "translateY(0)" },
			],
			{ duration: dur, delay, easing: "cubic-bezier(0.33,1,0.68,1)", fill: "forwards" }
		);
		a.finished.then(() => {
			el.style.opacity = "1";
			el.style.transform = "translateY(0)";
			a.cancel();
		});
	};

	if (kicker) fadeIn(kicker, 520, 0);
	fadeIn(title, 720, kicker ? 120 : 0);
	fadeIn(sub, 640, kicker ? 320 : 200);

	let t = 80;
	if (navBrand) { fadeIn(navBrand, 520, t); t += 60; }
	for (const link of navLinks) { fadeIn(link, 520, t); t += 60; }
	if (navGH) { fadeIn(navGH, 480, t + 40); }
}

// --------------------------------------------------------------------------
// Hero wave field
// --------------------------------------------------------------------------

type HeroParticle = {
	x: number;
	y: number;
	jitter: number;
	level: number;
};

type HeroRipple = {
	x: number;
	y: number;
	start: number;
	strength: number;
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function mix(a: number, b: number, amount: number): number {
	return a + (b - a) * amount;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
	const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
	return x * x * (3 - 2 * x);
}

function setupHeroWaveParticles() {
	if (prefersReducedMotion) return;

	const hero = document.querySelector<HTMLElement>(".hero");
	const canvas = document.querySelector<HTMLCanvasElement>("[data-hero-wave]");
	if (!hero || !canvas) return;

	const ctx = canvas.getContext("2d", { alpha: true });
	if (!ctx) return;

	const heroEl = hero;
	const canvasEl = canvas;
	const context = ctx;

	let width = 0;
	let height = 0;
	let dpr = 1;
	let particles: HeroParticle[] = [];
	let ripples: HeroRipple[] = [];
	let raf = 0;
	let lastFrame = performance.now();
	let lastPointer: { x: number; y: number; time: number } | null = null;
	const accent = { r: 45, g: 108, b: 255 };
	const inactiveBlue = { r: 8, g: 22, b: 58 };

	const hashNoise = (x: number, y: number, seed: number): number => {
		const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
		return n - Math.floor(n);
	};

	const valueNoise = (x: number, y: number, seed: number): number => {
		const x0 = Math.floor(x);
		const y0 = Math.floor(y);
		const xf = x - x0;
		const yf = y - y0;
		const u = xf * xf * (3 - 2 * xf);
		const v = yf * yf * (3 - 2 * yf);
		const a = hashNoise(x0, y0, seed);
		const b = hashNoise(x0 + 1, y0, seed);
		const c = hashNoise(x0, y0 + 1, seed);
		const d = hashNoise(x0 + 1, y0 + 1, seed);

		return mix(mix(a, b, u), mix(c, d, u), v);
	};

	const waveFunction = (x: number, y: number, t: number): number => {
		const scale = Math.max(1, Math.min(width, height));
		const nx = (x - width * 0.5) / scale;
		const ny = (y - height * 0.5) / scale;
		const driftX = t * 0.075;
		const driftY = t * -0.052;
		const warpX = (valueNoise(nx * 2.2 + driftX, ny * 2.2 - t * 0.03, 8.4) - 0.5) * 1.28;
		const warpY = (valueNoise(nx * 2.2 + t * 0.04, ny * 2.2 + driftY, 19.7) - 0.5) * 1.28;
		const px = nx * 2.8 + warpX + driftX;
		const py = ny * 2.8 + warpY + driftY;
		let field = 0;
		let amplitude = 0.58;
		let total = 0;

		for (let octave = 0; octave < 5; octave++) {
			const frequency = 1.15 * 2 ** octave;
			const motion = t * (0.042 + octave * 0.013);
			field += valueNoise(
				px * frequency + motion,
				py * frequency - motion * 1.35,
				31.2 + octave * 11.9
			) * amplitude;
			total += amplitude;
			amplitude *= 0.52;
		}

		const plasma = field / total;
		const threshold = 0.42 + 0.08 * Math.sin(t * 1.18 + warpX * 2.4 - warpY * 1.7);
		const ember = smoothstep(threshold, threshold + 0.3, plasma);
		const hotCore = smoothstep(threshold + 0.16, threshold + 0.42, plasma);
		const breathe = 0.78 + 0.22 * Math.sin(t * 1.85 + plasma * Math.PI * 4);

		return clamp((ember * 0.7 + hotCore * 0.3) * breathe, 0, 0.98);
	};

	const rippleField = (particle: HeroParticle, now: number): number => {
		let intensity = 0;

		for (const ripple of ripples) {
			const age = (now - ripple.start) / 1000;
			const distance = Math.hypot(particle.x - ripple.x, particle.y - ripple.y);
			const radius = age * 430;
			const ringWidth = 58 + age * 24;
			const ring = Math.exp(-Math.pow((distance - radius) / ringWidth, 2));
			const oscillation = 0.5 + 0.5 * Math.cos((distance - radius) * 0.075);
			const damping = Math.exp(-age * 1.28);

			intensity = Math.max(
				intensity,
				ripple.strength * ring * oscillation * damping
			);
		}

		return clamp(intensity, 0, 1);
	};

	function resize() {
		const rect = heroEl.getBoundingClientRect();
		width = Math.max(1, rect.width);
		height = Math.max(1, rect.height);
		dpr = Math.min(2, window.devicePixelRatio || 1);

		canvasEl.width = Math.round(width * dpr);
		canvasEl.height = Math.round(height * dpr);
		canvasEl.style.width = `${width}px`;
		canvasEl.style.height = `${height}px`;
		context.setTransform(dpr, 0, 0, dpr, 0, 0);

		const spacing = clamp(Math.min(width, height) / 20, 22, 34);
		const cols = Math.ceil(width / spacing) + 2;
		const rows = Math.ceil(height / spacing) + 2;
		particles = [];

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const seed = Math.sin((row + 1) * 37.12 + (col + 1) * 19.42) * 43758.5453;
				const jitter = seed - Math.floor(seed);
				particles.push({
					x: (col - 0.5) * spacing + (jitter - 0.5) * spacing * 0.26,
					y: (row - 0.5) * spacing + (0.5 - jitter) * spacing * 0.18,
					jitter,
					level: 0,
				});
			}
		}
	}

	function addRipple(x: number, y: number, strength: number) {
		ripples.push({
			x,
			y,
			start: performance.now(),
			strength: clamp(strength, 0.24, 1.18),
		});

		if (ripples.length > 44) {
			ripples = ripples.slice(-44);
		}
	}

	function onPointerMove(event: PointerEvent) {
		const rect = heroEl.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const time = performance.now();

		if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

		if (lastPointer) {
			const dt = Math.max(16, time - lastPointer.time);
			const distance = Math.hypot(x - lastPointer.x, y - lastPointer.y);
			const velocity = distance / dt;

			if (distance > 8) {
				const steps = Math.min(12, Math.max(1, Math.ceil(distance / 34)));
				const strength = velocity * 1.12;

				for (let step = 1; step <= steps; step++) {
					const amount = step / steps;
					addRipple(
						mix(lastPointer.x, x, amount),
						mix(lastPointer.y, y, amount),
						strength
					);
				}
			}
		} else {
			addRipple(x, y, 0.36);
		}

		lastPointer = { x, y, time };
	}

	function draw(now: number) {
		const time = now / 1000;
		const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
		const sizeSmoothing = 1 - Math.exp(-dt * 7.2);
		lastFrame = now;
		ripples = ripples.filter((ripple) => (now - ripple.start) / 1000 < 2.2);
		context.clearRect(0, 0, width, height);

		context.lineCap = "square";
		context.globalCompositeOperation = "lighter";

		for (const particle of particles) {
			const base = waveFunction(particle.x, particle.y, time + particle.jitter * 0.18);
			const ripple = rippleField(particle, now);
			const target = Math.max(base, ripple);
			particle.level = mix(particle.level, target, sizeSmoothing);

			const glow = Math.pow(particle.level, 1.28);
			const arm = 1.4 + glow * 6.6 + particle.jitter * 0.55;
			const lineWidth = 0.42 + glow * 2.2;
			const alpha = 0.035 + glow * 0.72;
			const colorLevel = smoothstep(0.08, 0.86, glow);
			const red = Math.round(mix(inactiveBlue.r, accent.r, colorLevel));
			const green = Math.round(mix(inactiveBlue.g, accent.g, colorLevel));
			const blue = Math.round(mix(inactiveBlue.b, accent.b, colorLevel));

			context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
			context.lineWidth = lineWidth;
			context.beginPath();
			context.moveTo(particle.x - arm, particle.y);
			context.lineTo(particle.x + arm, particle.y);
			context.moveTo(particle.x, particle.y - arm);
			context.lineTo(particle.x, particle.y + arm);
			context.stroke();
		}

		context.globalCompositeOperation = "source-over";
		raf = window.requestAnimationFrame(draw);
	}

	const observer = new ResizeObserver(resize);
	observer.observe(heroEl);
	resize();

	heroEl.addEventListener("pointermove", onPointerMove, { passive: true });
	heroEl.addEventListener("pointerleave", () => {
		lastPointer = null;
	});
	addRipple(width * 0.72, height * 0.48, 0.38);
	raf = window.requestAnimationFrame(draw);

	window.addEventListener("pagehide", () => {
		window.cancelAnimationFrame(raf);
		observer.disconnect();
	});
}

// --------------------------------------------------------------------------
// Boot
// --------------------------------------------------------------------------

setupNav();
setupCardStack();
runHeroAnimation();
setupHeroWaveParticles();
