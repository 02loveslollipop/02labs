/**
 * ctftime-sync — Cloudflare Worker
 *
 * • Cron trigger (daily): fetches CTFtime API data for Ch0wn3rs (team 408704)
 *   and stores it in Workers KV.
 * • HTTP GET /       → returns cached JSON from KV (CORS open for 02labs.me).
 * • HTTP GET /sync   → triggers an on-demand sync, then returns fresh JSON.
 */

const TEAM_ID = 408704;
const CTFTIME_UA = "02labs-ctftime-sync/1.0 (+https://02labs.me)";
const KV_KEY = "ctftime_data";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface Env {
	CTFTIME_KV: KVNamespace;
}

interface CTFTimeTeamRating {
	rating_place?: number;
	rating_points?: number;
	country_place?: number;
	organizer_points?: number;
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

interface CTFTimeEvent {
	title: string;
	scores: CTFTimeEventScore[];
	time: number;
}

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

// --------------------------------------------------------------------------
// Core sync logic
// --------------------------------------------------------------------------

async function syncData(env: Env): Promise<CTFTimeData> {
	const year = new Date().getUTCFullYear();

	const [teamResp, resultsResp] = await Promise.all([
		fetch(`https://ctftime.org/api/v1/teams/${TEAM_ID}/`, {
			headers: { "User-Agent": CTFTIME_UA },
		}),
		fetch(`https://ctftime.org/api/v1/results/${year}/`, {
			headers: { "User-Agent": CTFTIME_UA },
		}),
	]);

	if (!teamResp.ok || !resultsResp.ok) {
		throw new Error(
			`CTFtime API error: team=${teamResp.status} results=${resultsResp.status}`
		);
	}

	const teamData = (await teamResp.json()) as CTFTimeTeamResponse;
	const resultsData = (await resultsResp.json()) as Record<string, CTFTimeEvent>;

	const yearRating: CTFTimeTeamRating = teamData.rating?.[year.toString()] ?? {};

	// Filter events where this team participated
	const events: CTFEvent[] = [];
	for (const [eventId, event] of Object.entries(resultsData)) {
		const score = event.scores?.find((s) => s.team_id === TEAM_ID);
		if (score) {
			events.push({
				event_id: eventId,
				title: event.title,
				place: score.place,
				ctf_points: score.points,
				time: event.time,
			});
		}
	}

	// Most recent first
	events.sort((a, b) => b.time - a.time);

	const output: CTFTimeData = {
		team: {
			name: teamData.primary_alias || teamData.name,
			country: teamData.country,
			rating_place: yearRating.rating_place ?? null,
			rating_points: yearRating.rating_points
				? Math.round(yearRating.rating_points * 1000) / 1000
				: null,
			country_place: yearRating.country_place ?? null,
		},
		events,
		year,
		updated_at: new Date().toISOString(),
	};

	await env.CTFTIME_KV.put(KV_KEY, JSON.stringify(output), {
		// Keep for 25 hours so even if cron is slightly delayed there's always data
		expirationTtl: 90000,
	});

	return output;
}

// --------------------------------------------------------------------------
// CORS helper
// --------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Cache-Control": "public, max-age=3600",
};

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
	});
}

// --------------------------------------------------------------------------
// Worker entry point
// --------------------------------------------------------------------------

export default {
	// HTTP handler
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: CORS_HEADERS });
		}
		if (request.method !== "GET") {
			return jsonResponse({ error: "Method not allowed" }, 405);
		}

		const url = new URL(request.url);

		if (url.pathname === "/sync") {
			// On-demand sync (can be protected with a secret header if desired)
			const fresh = await syncData(env);
			return jsonResponse(fresh);
		}

		// Default: serve KV cache, fall back to live sync on cold start
		const cached = await env.CTFTIME_KV.get(KV_KEY);
		if (cached) {
			return new Response(cached, {
				headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
			});
		}

		// No cache yet — pull live data
		const fresh = await syncData(env);
		return jsonResponse(fresh);
	},

	// Cron trigger — runs on the schedule defined in wrangler.jsonc
	async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
		await syncData(env);
	},
} satisfies ExportedHandler<Env>;
