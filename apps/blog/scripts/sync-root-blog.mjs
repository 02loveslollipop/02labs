import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appRoot = path.resolve(__dirname, ".."); // apps/blog
const repoRoot = path.resolve(appRoot, "..", "..");

const srcRootBlog = path.join(repoRoot, "blog");
const destContentBlog = path.join(appRoot, "src", "content", "blog");

function slugifyFolderName(input) {
	const base = String(input || "")
		.replace(/\.md$/i, "")
		.trim()
		.toLowerCase();

	const hyphenated = base
		.replace(/[\s_]+/g, "-")
		.replace(/[^a-z0-9-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	return hyphenated;
}

function hasFrontmatter(md) {
	if (!md.startsWith("---")) return false;
	// Look for a second `---` delimiter on its own line.
	const lines = md.split(/\r?\n/);
	if (lines.length < 3) return false;
	if (lines[0] !== "---") return false;
	for (let i = 1; i < Math.min(lines.length, 200); i++) {
		if (lines[i] === "---") return true;
	}
	return false;
}

function yamlQuote(value) {
	return `"${String(value).replace(/\\/g, "\\\\").replace(/\"/g, '\\"')}"`;
}

function extractTitle(md, fallback) {
	const lines = md.split(/\r?\n/);
	for (const line of lines) {
		const m = /^#\s+(.+?)\s*$/.exec(line);
		if (m) return m[1];
	}
	return fallback;
}

function extractDescription(md, fallback) {
	const lines = md.split(/\r?\n/);
	let afterTitle = false;
	for (const line of lines) {
		if (!afterTitle) {
			if (/^#\s+/.test(line)) afterTitle = true;
			continue;
		}
		const trimmed = line.trim();
		if (!trimmed) continue;
		if (trimmed === "---") continue;
		if (/^#{1,6}\s+/.test(trimmed)) continue;
		if (/^[-*]\s+/.test(trimmed)) continue;
		return trimmed.slice(0, 180);
	}
	return fallback;
}

function toIsoDateOnly(date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

async function pathExists(p) {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
}

async function main() {
	if (!(await pathExists(srcRootBlog))) return;

	// Make the generated content deterministic and avoid stale entries.
	await fs.rm(destContentBlog, { recursive: true, force: true });
	await fs.mkdir(destContentBlog, { recursive: true });

	const entries = await fs.readdir(srcRootBlog, { withFileTypes: true });
	let synced = 0;

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;

		const srcDir = path.join(srcRootBlog, entry.name);
		const srcIndex = path.join(srcDir, "index.md");
		if (!(await pathExists(srcIndex))) continue;

		const slug = slugifyFolderName(entry.name);
		if (!slug) continue;

		const destDir = path.join(destContentBlog, slug);
		await fs.mkdir(destDir, { recursive: true });

		// Copy everything (images, extra files), then normalize index.md.
		await fs.cp(srcDir, destDir, { recursive: true, force: true });

		const raw = await fs.readFile(srcIndex, "utf-8");
		const normalized = await (async () => {
			if (hasFrontmatter(raw)) return raw;

			const st = await fs.stat(srcIndex);
			const pubDate = toIsoDateOnly(st.mtime);

			const title = extractTitle(raw, slug);
			const description = extractDescription(raw, title);

			const fm =
				`---\n` +
				`title: ${yamlQuote(title)}\n` +
				`description: ${yamlQuote(description)}\n` +
				`pubDate: ${pubDate}\n` +
				`---\n\n`;

			return fm + raw;
		})();

		await fs.writeFile(path.join(destDir, "index.md"), normalized, "utf-8");
		synced++;
	}

	if (synced > 0) {
		// eslint-disable-next-line no-console
		console.log(`[sync-root-blog] Synced ${synced} post folder(s) into src/content`);
	}
}

await main();

