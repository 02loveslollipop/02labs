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
// Boot
// --------------------------------------------------------------------------

setupNav();
setupCardStack();
runHeroAnimation();
