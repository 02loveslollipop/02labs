#!/usr/bin/env node
/**
 * Fetches CTFtime data for Ch0wn3rs and bakes it into the www app as a
 * build-time snapshot: apps/www/src/data/ctftime-snapshot.json
 *
 * Runs locally (npm run sync:ctftime) and in CI before `astro build`.
 * CI contract: when the fetch fails but a snapshot already exists
 * (restored from the Actions cache or committed baseline), this script
 * keeps the old snapshot and exits 0 so the deploy can proceed with the
 * last known-good data. It only exits 1 when there is no snapshot at all.
 * Emits `fetched=true|false` to $GITHUB_OUTPUT when running in Actions.
 */
import { existsSync, writeFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TEAM_ID = 408704;
const CTFTIME_UA = "02labs-ctftime-sync/1.0 (+https://02labs.me)";
const SNAPSHOT_PATH = fileURLToPath(
	new URL("../apps/www/src/data/ctftime-snapshot.json", import.meta.url)
);
const EVENT_WEIGHT_BATCH_SIZE = 4;
const EVENT_WEIGHT_BATCH_DELAY_MS = 350;
const MAIN_ATTEMPTS = 3;

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, attempts = 1) {
	let lastError = null;
	for (let attempt = 0; attempt < attempts; attempt++) {
		try {
			const resp = await fetch(url, {
				headers: { "User-Agent": CTFTIME_UA },
				signal: AbortSignal.timeout(10000),
			});
			if (!resp.ok) {
				lastError = new Error(`HTTP ${resp.status} for ${url}`);
				await wait(500 * (attempt + 1));
				continue;
			}
			return await resp.json();
		} catch (error) {
			lastError = error;
			await wait(500 * (attempt + 1));
		}
	}
	throw lastError;
}

async function fetchCTFTimeEventWeight(eventId) {
	try {
		const event = await fetchJson(
			`https://ctftime.org/api/v1/events/${eventId}/`,
			3
		);
		return typeof event.weight === "number" ? event.weight : null;
	} catch {
		return null;
	}
}

function calculateRatingPoints(teamPoints, bestPoints, place, weight) {
	if (!weight || !bestPoints || !place || teamPoints <= 0) return null;
	const pointsCoef = teamPoints / bestPoints;
	const placeCoef = 1 / place;
	return Math.round((pointsCoef + placeCoef) * weight * 1_000_000) / 1_000_000;
}

function sortCTFEventsByBestPerformance(events) {
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

async function fetchFreshCTFTimeData() {
	const year = new Date().getUTCFullYear();

	const [teamData, resultsData] = await Promise.all([
		fetchJson(`https://ctftime.org/api/v1/teams/${TEAM_ID}/`, MAIN_ATTEMPTS),
		fetchJson(`https://ctftime.org/api/v1/results/${year}/`, MAIN_ATTEMPTS),
	]);

	const yearRating = teamData.rating?.[year.toString()] ?? {};

	const events = [];
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

	const eventsWithWeights = [];
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

function reportFetched(value) {
	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(process.env.GITHUB_OUTPUT, `fetched=${value}\n`);
	}
}

async function main() {
	const hasSnapshot = existsSync(SNAPSHOT_PATH);

	try {
		const data = await fetchFreshCTFTimeData();
		writeFileSync(SNAPSHOT_PATH, JSON.stringify(data, null, "\t") + "\n");
		console.log(
			`CTFtime snapshot written: ${data.events.length} events, year ${data.year}, team rating_place=${data.team.rating_place}`
		);
		reportFetched(true);
	} catch (error) {
		console.error(`CTFtime fetch failed: ${error?.message ?? error}`);
		if (hasSnapshot) {
			console.warn(
				"Keeping the existing snapshot (last good data) and continuing."
			);
			reportFetched(false);
			return;
		}
		console.error(
			"No snapshot available to fall back on — failing the build. " +
				"Run `npm run sync:ctftime` locally to generate a baseline."
		);
		reportFetched(false);
		process.exitCode = 1;
	}
}

await main();
