/**
 * Local end-to-end tests for the ctftime-sync Worker.
 *
 * Runs inside the real workerd runtime via @cloudflare/vitest-pool-workers.
 * The `SELF` fetcher calls our Worker's fetch handler directly (no network).
 * The `env` binding gives direct access to the in-memory KV store wrangler
 * provisions for tests.
 */

import { SELF, env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CTFTimeData } from "./index";

// ─────────────────────────────────────────────────────────────────────────────
// Mock fixtures
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_TEAM = {
	name: "Ch0wn3rs",
	primary_alias: "Ch0wn3rs",
	country: "Colombia",
	rating: {
		"2026": {
			rating_place: 42,
			rating_points: 100.5,
			country_place: 3,
		},
	},
};

/** Results map — only the first event includes team 408704. */
const MOCK_RESULTS = {
	"12345": {
		title: "HackTheBox CTF 2026",
		time: 1770000000,
		scores: [
			{ team_id: 408704, points: "500.000", place: 2 },
			{ team_id: 999, points: "400.000", place: 3 },
		],
	},
	"99999": {
		title: "Some Other CTF",
		time: 1760000000,
		scores: [{ team_id: 999, points: "200.000", place: 1 }],
	},
};

/** Returns a fresh vi.fn() that intercepts CTFtime API calls. */
function makeFetchMock() {
	return vi.fn((url: string | Request | URL, _init?: RequestInit): Promise<Response> => {
		const href = url instanceof Request ? url.url : url.toString();
		if (href.includes("/teams/")) {
			return Promise.resolve(new Response(JSON.stringify(MOCK_TEAM), { status: 200 }));
		}
		if (href.includes("/results/")) {
			return Promise.resolve(new Response(JSON.stringify(MOCK_RESULTS), { status: 200 }));
		}
		return Promise.resolve(new Response("Not Found", { status: 404 }));
	});
}

const KV_KEY = "ctftime_data";

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

describe("ctftime-sync worker — local E2E", () => {
	let fetchMock: ReturnType<typeof makeFetchMock>;

	beforeEach(async () => {
		// Fresh KV + fresh fetch mock for every test
		await env.CTFTIME_KV.delete(KV_KEY);
		fetchMock = makeFetchMock();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ── CORS preflight ────────────────────────────────────────────────────────
	it("OPTIONS / → 200 with CORS headers", async () => {
		const res = await SELF.fetch("https://api.02labs.me/", { method: "OPTIONS" });

		expect(res.status).toBe(200);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
	});

	// ── Method guard ──────────────────────────────────────────────────────────
	it("POST / → 405 Method Not Allowed", async () => {
		const res = await SELF.fetch("https://api.02labs.me/", {
			method: "POST",
			body: "{}",
		});

		expect(res.status).toBe(405);
		const body = (await res.json()) as { error: string };
		expect(body.error).toMatch(/method not allowed/i);
	});

	// ── Cold start: GET / with empty KV ──────────────────────────────────────
	it("GET / with empty KV → fetches CTFtime API and returns correct data", async () => {
		const res = await SELF.fetch("https://api.02labs.me/");

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toContain("application/json");

		const data = (await res.json()) as CTFTimeData;
		expect(data.team.name).toBe("Ch0wn3rs");
		expect(data.team.country).toBe("Colombia");
		expect(data.team.rating_place).toBe(42);
		expect(data.team.country_place).toBe(3);

		// Only the event that includes team 408704 should be included
		expect(data.events).toHaveLength(1);
		expect(data.events[0].title).toBe("HackTheBox CTF 2026");
		expect(data.events[0].place).toBe(2);
		expect(data.events[0].ctf_points).toBe("500.000");

		// KV should now be populated
		const cached = await env.CTFTIME_KV.get(KV_KEY);
		expect(cached).not.toBeNull();

		// CTFtime API was called (team + results)
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	// ── Cache hit: GET / with existing KV ────────────────────────────────────
	it("GET / with cached KV → returns cache without calling CTFtime API", async () => {
		const preset: CTFTimeData = {
			team: {
				name: "Ch0wn3rs",
				country: "Colombia",
				rating_place: 99,
				rating_points: 999,
				country_place: 1,
			},
			events: [],
			year: 2026,
			updated_at: "2026-03-04T00:00:00.000Z",
		};
		await env.CTFTIME_KV.put(KV_KEY, JSON.stringify(preset));

		// Replace fetch mock with a fresh spy so we can assert it was NOT called
		const spy = makeFetchMock();
		vi.stubGlobal("fetch", spy);

		const res = await SELF.fetch("https://api.02labs.me/");

		expect(res.status).toBe(200);
		const data = (await res.json()) as CTFTimeData;
		expect(data.team.rating_place).toBe(99); // came from cache

		// CTFtime API must NOT have been hit
		expect(spy).not.toHaveBeenCalled();
	});

	// ── On-demand sync: GET /sync ─────────────────────────────────────────────
	it("GET /sync → always calls CTFtime API, returns fresh data, and updates KV", async () => {
		// Populate KV with stale data to confirm it is overwritten
		await env.CTFTIME_KV.put(KV_KEY, JSON.stringify({ stale: true }));

		const res = await SELF.fetch("https://api.02labs.me/sync");

		expect(res.status).toBe(200);
		const data = (await res.json()) as CTFTimeData;
		expect(data.team.name).toBe("Ch0wn3rs");
		expect(data.events).toHaveLength(1);

		// Verify KV was overwritten with fresh data
		const stored = JSON.parse((await env.CTFTIME_KV.get(KV_KEY))!) as CTFTimeData;
		expect(stored.team.name).toBe("Ch0wn3rs");
		expect(stored.events).toHaveLength(1);

		// CTFtime API must have been fetched regardless of cached data
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	// ── CORS header present on data responses ─────────────────────────────────
	it("GET / → response carries Access-Control-Allow-Origin: *", async () => {
		const res = await SELF.fetch("https://api.02labs.me/");
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});
});
