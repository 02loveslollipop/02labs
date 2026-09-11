import type { APIRoute } from "astro";
import { getCTFTimeData } from "../../lib/ctftime";

// Prerendered to a static file at build time; refreshed by the weekly CI rebuild.
export const GET: APIRoute = async () => {
	const data = getCTFTimeData();

	return new Response(JSON.stringify(data, null, "\t"), {
		headers: { "Content-Type": "application/json" },
	});
};
