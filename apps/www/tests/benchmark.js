import { performance } from 'perf_hooks';

// Simulate the logic from blog-posts.ts
const DOCUMENT_TYPE_TAG_SLUGS = new Set([
	"writeup",
	"post",
	"deep-dive",
	"deep-dive",
	"deep",
	"dive",
	"essay",
	"analysis",
	"note",
	"notes",
]);

function slugifyTag(input) {
	return String(input || "")
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, " ")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function getDisplayTagPriority(input) {
	const slug = slugifyTag(input);
	if (!slug) return 99;
	if (slug === "ctf") return 0;
	if (DOCUMENT_TYPE_TAG_SLUGS.has(slug)) return 2;
	return 1;
}

function orderDisplayTags(tags) {
	return [...tags].sort((a, b) => {
		const priorityDiff = getDisplayTagPriority(a) - getDisplayTagPriority(b);
		if (priorityDiff !== 0) return priorityDiff;
		return 0;
	});
}

function orderDisplayTagsOptimized(tags) {
	return tags
		.map(tag => ({ tag, priority: getDisplayTagPriority(tag) }))
		.sort((a, b) => {
			const priorityDiff = a.priority - b.priority;
			if (priorityDiff !== 0) return priorityDiff;
			return 0;
		})
		.map(item => item.tag);
}

const tags = [
    "ctf", "writeup", "pwn", "web", "crypto", "forensics", "reverse", "misc",
    "deep-dive", "essay", "note", "analysis", "Deep Dive", "CTF", "Writeup",
    "Post", "Notes", "Some really long tag name with spaces", "another tag",
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"
];

const NUM_ITERATIONS = 10000;

console.log("Benchmarking original...");
const startOriginal = performance.now();
for (let i = 0; i < NUM_ITERATIONS; i++) {
    orderDisplayTags(tags);
}
const endOriginal = performance.now();
console.log(`Original: ${endOriginal - startOriginal}ms`);

console.log("Benchmarking optimized...");
const startOptimized = performance.now();
for (let i = 0; i < NUM_ITERATIONS; i++) {
    orderDisplayTagsOptimized(tags);
}
const endOptimized = performance.now();
console.log(`Optimized: ${endOptimized - startOptimized}ms`);

console.log(`Improvement: ${((1 - (endOptimized - startOptimized) / (endOriginal - startOriginal)) * 100).toFixed(2)}%`);
