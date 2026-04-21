const TEAM_ID = 408704;
const KV_KEY = "ctftime_data";
const CTFTIME_UA = "02labs-www/1.0 (+https://02labs.me)";
const KV_STALE_MS = 15 * 60 * 1000;
const KV_TTL_SECONDS = 90_000;
const EVENT_WEIGHT_BATCH_SIZE = 4;
const EVENT_WEIGHT_BATCH_DELAY_MS = 350;

export interface CTFEvent {
	event_id: string;
	title: string;
	place: number;
	ctf_points: string;
	rating_points: number | null;
	weight: number | null;
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

interface CTFTimeEventResponse {
	weight?: number;
}

interface KVNamespaceLike {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export const fallbackCTFTimeData: CTFTimeData = {
	team: {
		name: "Ch0wn3rs",
		country: "CO",
		rating_place: 40,
		country_place: 1,
		rating_points: 121.352,
	},
	events: [
		{ event_id: "3043", title: "Srdnlen CTF 2026 Quals", place: 131, ctf_points: "250.0000", rating_points: null, weight: null, time: 0 },
		{ event_id: "3127", title: "EHAX CTF 2026", place: 24, ctf_points: "5312.0000", rating_points: null, weight: null, time: 0 },
		{ event_id: "3098", title: "Batman's Kitchen CTF 2026", place: 10, ctf_points: "10689.0000", rating_points: null, weight: null, time: 0 },
		{ event_id: "3122", title: "BITSCTF 2026", place: 31, ctf_points: "2672.0000", rating_points: null, weight: null, time: 0 },
		{ event_id: "3086", title: "TaipanByte\u2019s Chart CTF", place: 34, ctf_points: "5730.0000", rating_points: null, weight: null, time: 0 },
		{ event_id: "3081", title: "0xFUN CTF 2026", place: 291, ctf_points: "1903.0000", rating_points: null, weight: null, time: 0 },
		{ event_id: "3066", title: "Nullcon Goa HackIM 2026 CTF", place: 12, ctf_points: "5262.0000", rating_points: null, weight: null, time: 0 },
		{ event_id: "2767", title: "PascalCTF 2026", place: 63, ctf_points: "6413.0000", rating_points: null, weight: null, time: 0 },
	],
	year: new Date().getUTCFullYear(),
	updated_at: new Date(0).toISOString(),
};

export function sortCTFEventsByBestPerformance(events: CTFEvent[]): CTFEvent[] {
	return [...events].sort((a, b) => {
		const aRating = typeof a.rating_points === "number" ? a.rating_points : -1;
		const bRating = typeof b.rating_points === "number" ? b.rating_points : -1;
		if (aRating !== bRating) return bRating - aRating;

		if (a.place !== b.place) return a.place - b.place;

		const aPoints = Number.parseFloat(a.ctf_points);
		const bPoints = Number.parseFloat(b.ctf_points);
		if (!Number.isNaN(aPoints) && !Number.isNaN(bPoints) && aPoints !== bPoints) {
			return bPoints - aPoints;
		}

		if (a.time !== b.time) return b.time - a.time;
		return a.title.localeCompare(b.title);
	});
}

export function getTopCTFPerformances(events: CTFEvent[], limit = 5): CTFEvent[] {
	return sortCTFEventsByBestPerformance(events).slice(0, limit);
}

function isStale(data: CTFTimeData): boolean {
	const updatedAt = Date.parse(data.updated_at);
	if (Number.isNaN(updatedAt)) return true;
	return Date.now() - updatedAt > KV_STALE_MS;
}

function normalizeCTFEvent(event: CTFEvent): CTFEvent {
	return {
		...event,
		rating_points: typeof event.rating_points === "number" ? event.rating_points : null,
		weight: typeof event.weight === "number" ? event.weight : null,
	};
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readCachedCTFTimeData(kv: KVNamespaceLike | undefined): Promise<CTFTimeData | null> {
	if (!kv) return null;
	try {
		const raw = await kv.get(KV_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as CTFTimeData;
		return {
			...parsed,
			events: sortCTFEventsByBestPerformance((parsed.events ?? []).map(normalizeCTFEvent)),
		};
	} catch {
		return null;
	}
}

async function fetchCTFTimeEventWeight(eventId: string): Promise<number | null> {
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const resp = await fetch(`https://ctftime.org/api/v1/events/${eventId}/`, {
				headers: { "User-Agent": CTFTIME_UA },
				signal: AbortSignal.timeout(8000),
			});
			if (!resp.ok) {
				await wait(500 * (attempt + 1));
				continue;
			}

			const event = (await resp.json()) as CTFTimeEventResponse;
			return typeof event.weight === "number" ? event.weight : null;
		} catch {
			await wait(500 * (attempt + 1));
		}
	}

	return null;
}

function calculateRatingPoints(teamPoints: number, bestPoints: number, place: number, weight: number | null): number | null {
	if (!weight || !bestPoints || !place || teamPoints <= 0) return null;
	const pointsCoef = teamPoints / bestPoints;
	const placeCoef = 1 / place;
	return Math.round((pointsCoef + placeCoef) * weight * 1_000_000) / 1_000_000;
}

export async function fetchFreshCTFTimeData(): Promise<CTFTimeData> {
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

	const events: Array<CTFEvent & { best_points: number }> = [];
	for (const [eventId, event] of Object.entries(resultsData)) {
		const score = event.scores?.find((entry) => entry.team_id === TEAM_ID);
		if (!score) continue;

		const bestPoints = event.scores.reduce((best, entry) => {
			const points = Number.parseFloat(entry.points);
			return Number.isNaN(points) ? best : Math.max(best, points);
		}, 0);

		events.push({
			event_id: eventId,
			title: event.title,
			place: score.place,
			ctf_points: score.points,
			rating_points: null,
			weight: null,
			time: event.time,
			best_points: bestPoints,
		});
	}

	const eventsWithWeights: CTFEvent[] = [];
	for (let index = 0; index < events.length; index += EVENT_WEIGHT_BATCH_SIZE) {
		const batch = events.slice(index, index + EVENT_WEIGHT_BATCH_SIZE);
		const resolvedBatch = await Promise.all(
			batch.map(async ({ best_points, ...event }) => {
				const weight = await fetchCTFTimeEventWeight(event.event_id);
				return {
					...event,
					weight,
					rating_points: calculateRatingPoints(
						Number.parseFloat(event.ctf_points),
						best_points,
						event.place,
						weight
					),
				};
			})
		);
		eventsWithWeights.push(...resolvedBatch);
		if (index + EVENT_WEIGHT_BATCH_SIZE < events.length) {
			await wait(EVENT_WEIGHT_BATCH_DELAY_MS);
		}
	}

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
		events: sortCTFEventsByBestPerformance(eventsWithWeights),
		year,
		updated_at: new Date().toISOString(),
	};
}

export async function getServerCTFTimeData(kv: KVNamespaceLike | undefined): Promise<CTFTimeData> {
	const cachedData = await readCachedCTFTimeData(kv);
	if (cachedData && !isStale(cachedData)) return cachedData;

	try {
		const freshData = await fetchFreshCTFTimeData();
		if (kv) {
			await kv.put(KV_KEY, JSON.stringify(freshData), {
				expirationTtl: KV_TTL_SECONDS,
			});
		}
		return freshData;
	} catch {
		return cachedData ?? {
			...fallbackCTFTimeData,
			events: sortCTFEventsByBestPerformance(fallbackCTFTimeData.events.map(normalizeCTFEvent)),
		};
	}
}
