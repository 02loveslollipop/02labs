import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appRoot = path.resolve(__dirname, ".."); // apps/blog
const contentRoot = path.join(appRoot, "src", "content", "blog");
const publicRoot = path.join(appRoot, "public", "posts");

const ASSET_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"]);

async function walkFiles(dir) {
	const out = [];
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...(await walkFiles(fullPath)));
			continue;
		}
		if (entry.isFile()) out.push(fullPath);
	}
	return out;
}

async function main() {
	try {
		await fs.access(contentRoot);
	} catch {
		// No blog content yet; nothing to sync.
		return;
	}

	await fs.mkdir(publicRoot, { recursive: true });

	const files = await walkFiles(contentRoot);
	let copied = 0;

	for (const file of files) {
		const ext = path.extname(file).toLowerCase();
		if (!ASSET_EXTS.has(ext)) continue;

		const rel = path.relative(contentRoot, file);
		const dest = path.join(publicRoot, rel);
		await fs.mkdir(path.dirname(dest), { recursive: true });
		await fs.copyFile(file, dest);
		copied++;
	}

	// Keep output minimal; useful when CI runs prebuild/predev.
	if (copied > 0) {
		// eslint-disable-next-line no-console
		console.log(`[sync-post-assets] Copied ${copied} asset(s) to public/posts`);
	}
}

await main();

