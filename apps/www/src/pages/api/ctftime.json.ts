import type { APIRoute } from "astro";
import { getServerCTFTimeData } from "../../lib/ctftime";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
	const data = await getServerCTFTimeData(locals.runtime?.env?.CTFTIME_KV);

	return new Response(JSON.stringify(data), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
		},
	});
};
