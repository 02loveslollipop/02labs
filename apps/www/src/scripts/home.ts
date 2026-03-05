import { createTimeline, set, stagger } from "animejs";

const prefersReducedMotion =
	typeof window !== "undefined" &&
	window.matchMedia &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --------------------------------------------------------------------------
// Navbar scroll-aware styling
// --------------------------------------------------------------------------

function setupNav() {
	const nav = document.getElementById("siteNav");
	const sentinel = document.getElementById("heroSentinel");
	if (!nav || !sentinel) return;

	const setScrolled = (scrolled: boolean) => {
		if (scrolled) nav.dataset.scrolled = "true";
		else nav.removeAttribute("data-scrolled");
	};

	const io = new IntersectionObserver(
		(entries) => {
			const entry = entries[0];
			if (!entry) return;
			setScrolled(!entry.isIntersecting);
		},
		{ threshold: 0 }
	);

	io.observe(sentinel);
}

// --------------------------------------------------------------------------
// Card-stack controller — anime.js drives every transition
// --------------------------------------------------------------------------

function setupCardStack() {
	const sections = Array.from(
		document.querySelectorAll<HTMLElement>("[data-snap-section]")
	);
	if (sections.length === 0) return;

	let current = 0;
	let transitioning = false;

	// ms for each animation phase (outgoing + incoming overlap slightly)
	const DUR = 560;

	// Lock page scroll
	document.documentElement.classList.add("card-stack-active");

	// ── Build progress dots ──────────────────────────────────────────────
	const dotsContainer = document.createElement("nav");
	dotsContainer.className = "card-dots";
	dotsContainer.setAttribute("aria-label", "Card navigation");

	const dots: HTMLButtonElement[] = sections.map((_, i) => {
		const btn = document.createElement("button");
		btn.className = "card-dot";
		btn.setAttribute("aria-label", `Go to card ${i + 1}`);
		btn.addEventListener("click", () => goTo(i));
		dotsContainer.appendChild(btn);
		return btn;
	});
	document.body.appendChild(dotsContainer);

	// ── Initial visual state (set via anime.js, no CSS transitions) ──────
	// Hero card: visible, centred
	set(sections[0], { opacity: 1, translateY: 0, rotate: 0, scale: 1 });
	sections[0].dataset.state = "active";

	// All other cards: hidden below
	for (let i = 1; i < sections.length; i++) {
		set(sections[i], { opacity: 0, translateY: 50, rotate: 0, scale: 0.96 });
	}

	// ── Helpers ──────────────────────────────────────────────────────────
	function updateDots(idx: number) {
		for (let i = 0; i < dots.length; i++) {
			if (i === idx) dots[i].dataset.active = "true";
			else dots[i].removeAttribute("data-active");
		}
	}

	function updateNav(idx: number) {
		const nav = document.getElementById("siteNav");
		if (!nav) return;
		if (idx > 0) nav.dataset.scrolled = "true";
		else nav.removeAttribute("data-scrolled");
	}

	function setZ(outEl: HTMLElement, inEl: HTMLElement) {
		for (const s of sections) s.style.zIndex = "0";
		outEl.style.zIndex = "2";
		inEl.style.zIndex = "3";
	}

	// ── Transition engine ────────────────────────────────────────────────
	function goTo(to: number) {
		if (to === current || to < 0 || to >= sections.length) return;
		if (transitioning) return;

		transitioning = true;
		const from = current;
		const forward = to > from;
		const outEl = sections[from];
		const inEl = sections[to];

		// Update logical state immediately
		current = to;
		updateDots(to);
		updateNav(to);
		outEl.dataset.state = "";
		inEl.dataset.state = "active";
		setZ(outEl, inEl);

		if (prefersReducedMotion) {
			set(outEl, { opacity: 0, translateY: 0, rotate: 0, scale: 1 });
			set(inEl,  { opacity: 1, translateY: 0, rotate: 0, scale: 1 });
			outEl.style.zIndex = "0";
			inEl.style.zIndex = "2";
			transitioning = false;
			return;
		}

		const tl = createTimeline({
			defaults: { ease: "inOutCubic" },
		});

		if (from === 0 && forward) {
			// ── Hero → first card: slide up ─────────────────────────────
			tl
				.add(outEl, {
					opacity: [1, 0],
					translateY: [0, -70],
					scale: [1, 0.97],
					duration: DUR,
				})
				.add(inEl, {
					opacity: [0, 1],
					translateY: [55, 0],
					scale: [0.97, 1],
					duration: DUR,
				}, `-=${DUR * 0.45}`);

		} else if (to === 0 && !forward) {
			// ── Back to hero: slide down ────────────────────────────────
			tl
				.add(outEl, {
					opacity: [1, 0],
					translateY: [0, 55],
					scale: [1, 0.97],
					duration: DUR,
				})
				.add(inEl, {
					opacity: [0, 1],
					translateY: [-70, 0],
					scale: [0.97, 1],
					duration: DUR,
				}, 0);

		} else if (forward) {
			// ── Shuffle forward: current tilts to back, next dealt in ───
			tl
				.add(outEl, {
					opacity: [1, 0],
					translateY: [0, -28],
					rotate: [0, 5],
					scale: [1, 0.90],
					duration: DUR * 0.65,
				})
				.add(inEl, {
					opacity: [0, 1],
					translateY: [45, 0],
					rotate: [-4, 0],
					scale: [0.93, 1],
					duration: DUR,
				}, `+=${DUR * 0.05}`);

		} else {
			// ── Shuffle backward: reverse deal ──────────────────────────
			tl
				.add(outEl, {
					opacity: [1, 0],
					translateY: [0, 45],
					rotate: [0, -4],
					scale: [1, 0.93],
					duration: DUR * 0.65,
				})
				.add(inEl, {
					opacity: [0, 1],
					translateY: [-28, 0],
					rotate: [5, 0],
					scale: [0.90, 1],
					duration: DUR,
				}, `+=${DUR * 0.05}`);
		}

		tl.then(() => {
			outEl.style.zIndex = "0";
			inEl.style.zIndex = "2";
			// Reset hidden outgoing card to a neutral resting state
			set(outEl, { rotate: 0, translateY: forward ? -70 : 55, scale: 0.97 });
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
		const delta = touchStartY - e.changedTouches[0].clientY;
		if (Math.abs(delta) < TOUCH_THRESHOLD) return;
		if (delta > 0) next(); else prev();
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

	// ── Hash navigation ──────────────────────────────────────────────────
	function handleHash() {
		const hash = window.location.hash.replace("#", "");
		if (!hash) return;
		const idx = sections.findIndex(
			(s) => s.id === hash || s.querySelector(`#${CSS.escape(hash)}`) !== null
		);
		if (idx >= 0) goTo(idx);
	}

	window.addEventListener("hashchange", handleHash);
	handleHash();

	// Initial dot state
	updateDots(0);
}

// --------------------------------------------------------------------------
// Hero entrance animation
// --------------------------------------------------------------------------

function runHeroAnimation() {
	if (prefersReducedMotion) return;

	const title = document.querySelector("[data-animate='hero-title']");
	const sub = document.querySelector("[data-animate='hero-sub']");
	const navBrand = document.querySelector("[data-animate='nav-brand']");
	const navGithub = document.querySelector("[data-animate='nav-github']");
	const navLinks = document.querySelectorAll(".nav__links a");

	if (!title || !sub) return;

	const initialTargets = [title, sub, navBrand, navGithub, ...Array.from(navLinks)].filter(
		(v): v is Element => Boolean(v)
	);

	set(initialTargets, { opacity: 0, translateY: 14, duration: 1 });

	const tl = createTimeline({ defaults: { ease: "outCubic" } });
	tl.add(title, { opacity: [0, 1], translateY: [14, 0], duration: 720 });
	tl.add(sub, { opacity: [0, 1], translateY: [14, 0], duration: 640 }, "-=520");

	if (navBrand) {
		tl.add(navBrand, { opacity: [0, 1], translateY: [10, 0], duration: 520 }, "-=640");
	}

	if (navLinks.length > 0) {
		tl.add(
			navLinks,
			{ opacity: [0, 1], translateY: [10, 0], delay: stagger(60), duration: 520 },
			"-=520"
		);
	}

	if (navGithub) {
		tl.add(navGithub, { opacity: [0, 1], translateY: [10, 0], duration: 480 }, "-=420");
	}
}

// --------------------------------------------------------------------------
// Boot
// --------------------------------------------------------------------------

setupNav();
setupCardStack();
runHeroAnimation();

