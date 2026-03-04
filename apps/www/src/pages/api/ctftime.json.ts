import type { APIRoute } from "astro";

export const prerender = false;

export interface CTFEvent {
	event_id: string;
	title: string;
	place: number;
	ctf_points: string;
	time: number;
}

export interface CTFTimeData {
	team: {
		name: string;
		country: string;
		rating_place: number | null;
		rating_points: number | null;
		country_place: number | null;
	};
	events: CTFEvent[];
	year: number;
	updated_at: string;
}

export const GET: APIRoute = async ({ locals }) => {
	const kv = locals.runtime?.env?.CTFTIME_KV;

	if (!kv) {
		return new Response(JSON.stringify({ error: "KV not available" }), {
			status: 503,
			headers: { "Content-Type": "application/json" },
		});
	}

	const raw = await kv.get("ctftime_data");

	if (!raw) {
		return new Response(JSON.stringify({ error: "No data yet" }), {
			status: 404,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-store",
			},
		});
	}

	return new Response(raw, {
		headers: {
			"Content-Type": "application/json",
			// Let CDN cache for 10 minutes (aligns with client poll interval)
			"Cache-Control": "public, max-age=600, stale-while-revalidate=60",
		},
	});
};
