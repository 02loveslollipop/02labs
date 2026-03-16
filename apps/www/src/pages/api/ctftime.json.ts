import type { APIRoute } from "astro";

export const prerender = false;

const TEAM_ID = 408704;
const KV_KEY = "ctftime_data";
const CTFTIME_UA = "02labs-www/1.0 (+https://02labs.me)";
const KV_STALE_MS = 15 * 60 * 1000;
const KV_TTL_SECONDS = 90_000;

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

interface CTFTimeTeamRating {
	rating_place?: number;
	rating_points?: number;
	country_place?: number;
}

interface CTFTimeTeamResponse {
	name: string;
	primary_alias: string;
	country: string;
	rating: Record<string, CTFTimeTeamRating>;
}

interface CTFTimeEventScore {
	team_id: number;
	points: string;
	place: number;
}

interface CTFTimeEventResult {
	title: string;
	scores: CTFTimeEventScore[];
	time: number;
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			"Content-Type": "application/json",
			...init?.headers,
		},
	});
}

function isStale(data: CTFTimeData): boolean {
	const updatedAt = Date.parse(data.updated_at);
	if (Number.isNaN(updatedAt)) return true;
	return Date.now() - updatedAt > KV_STALE_MS;
}

async function fetchFreshCTFTimeData(): Promise<CTFTimeData> {
	const year = new Date().getUTCFullYear();

	const [teamResp, resultsResp] = await Promise.all([
		fetch(`https://ctftime.org/api/v1/teams/${TEAM_ID}/`, {
			headers: { "User-Agent": CTFTIME_UA },
			signal: AbortSignal.timeout(8000),
		}),
		fetch(`https://ctftime.org/api/v1/results/${year}/`, {
			headers: { "User-Agent": CTFTIME_UA },
			signal: AbortSignal.timeout(8000),
		}),
	]);

	if (!teamResp.ok || !resultsResp.ok) {
		throw new Error(`CTFtime API error: team=${teamResp.status} results=${resultsResp.status}`);
	}

	const teamData = (await teamResp.json()) as CTFTimeTeamResponse;
	const resultsData = (await resultsResp.json()) as Record<string, CTFTimeEventResult>;
	const yearRating = teamData.rating?.[year.toString()] ?? {};

	const events: CTFEvent[] = [];
	for (const [eventId, event] of Object.entries(resultsData)) {
		const score = event.scores?.find((entry) => entry.team_id === TEAM_ID);
		if (!score) continue;

		events.push({
			event_id: eventId,
			title: event.title,
			place: score.place,
			ctf_points: score.points,
			time: event.time,
		});
	}

	events.sort((a, b) => b.time - a.time);

	return {
		team: {
			name: teamData.primary_alias || teamData.name,
			country: teamData.country,
			rating_place: yearRating.rating_place ?? null,
			rating_points:
				typeof yearRating.rating_points === "number"
					? Math.round(yearRating.rating_points * 1000) / 1000
					: null,
			country_place: yearRating.country_place ?? null,
		},
		events,
		year,
		updated_at: new Date().toISOString(),
	};
}

export const GET: APIRoute = async ({ locals }) => {
	const kv = locals.runtime?.env?.CTFTIME_KV;
	let cachedData: CTFTimeData | null = null;

	if (kv) {
		try {
			const raw = await kv.get(KV_KEY);
			if (raw) cachedData = JSON.parse(raw) as CTFTimeData;
		} catch {
			cachedData = null;
		}
	}

	if (cachedData && !isStale(cachedData)) {
		return new Response(JSON.stringify(cachedData), {
			headers: {
				"Content-Type": "application/json",
				// Keep CDN caching short so fresh KV values propagate quickly.
				"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
			},
		});
	}

	try {
		const freshData = await fetchFreshCTFTimeData();
		if (kv) {
			await kv.put(KV_KEY, JSON.stringify(freshData), {
				expirationTtl: KV_TTL_SECONDS,
			});
		}

		return new Response(JSON.stringify(freshData), {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
			},
		});
	} catch {
		if (cachedData) {
			return new Response(JSON.stringify(cachedData), {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=60, stale-while-revalidate=60",
				},
			});
		}
	}

	if (!kv) {
		return jsonResponse({ error: "KV not available" }, { status: 503 });
	}

	return jsonResponse({ error: "No data yet" }, {
		status: 404,
		headers: {
			"Cache-Control": "no-store",
		},
	});
};
