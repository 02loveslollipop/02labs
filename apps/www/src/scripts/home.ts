import { createTimeline, set, stagger } from "animejs";

const prefersReducedMotion =
	typeof window !== "undefined" &&
	window.matchMedia &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function setupSnapSections() {
	const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-snap-section]"));
	if (sections.length === 0) return;

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const el = entry.target as HTMLElement;
				const active = entry.isIntersecting && entry.intersectionRatio >= 0.55;
				if (active) el.dataset.active = "true";
				else el.removeAttribute("data-active");
			}
		},
		{ threshold: [0.25, 0.55, 0.75] }
	);

	for (const section of sections) io.observe(section);
}

function runHeroAnimation() {
	if (prefersReducedMotion) return;

	const title = document.querySelector("[data-animate='hero-title']");
	const sub = document.querySelector("[data-animate='hero-sub']");
	const navBrand = document.querySelector("[data-animate='nav-brand']");
	const navLinks = document.querySelectorAll(".nav__links a");

	if (!title || !sub) return;

	const initialTargets = [title, sub, navBrand, ...Array.from(navLinks)].filter(
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
			{
				opacity: [0, 1],
				translateY: [10, 0],
				delay: stagger(60),
				duration: 520,
			},
			"-=520"
		);
	}
}

setupNav();
setupSnapSections();
runHeroAnimation();
