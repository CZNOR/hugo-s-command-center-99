// ─── Google Calendar REST API integration ────────────────────────────────────
// Uses OAuth2 PKCE flow — no gapi client library, works cleanly with Vite/React
// Tokens stored in localStorage under "gcal_tokens"

const CLIENT_ID     = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET as string;

const SCOPES         = "https://www.googleapis.com/auth/calendar.events";
const AUTH_ENDPOINT  = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const CALENDAR_BASE  = "https://www.googleapis.com/calendar/v3";
const STORAGE_KEY    = "gcal_tokens";
const PKCE_KEY       = "gcal_pkce_verifier";
const STATE_KEY      = "gcal_oauth_state";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GCalTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // ms timestamp
}

export interface GCalEvent {
  id: string;
  summary: string;
  description?: string;
  colorId?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end:   { date?: string; dateTime?: string; timeZone?: string };
}

// ─── Token storage ─────────────────────────────────────────────────────────────

export function getTokens(): GCalTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GCalTokens) : null;
  } catch {
    return null;
  }
}

function saveTokens(tokens: GCalTokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PKCE_KEY);
  localStorage.removeItem(STATE_KEY);
}

export function isAuthenticated(): boolean {
  return !!getTokens();
}

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function generateVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 128);
}

async function generateChallenge(verifier: string): Promise<string> {
  const data   = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// ─── OAuth2 flow ──────────────────────────────────────────────────────────────

/** Returns the Google OAuth2 authorization URL and stores the PKCE verifier. */
export async function getAuthUrl(): Promise<string> {
  const verifier  = generateVerifier();
  const challenge = await generateChallenge(verifier);
  const state     = crypto.randomUUID();

  localStorage.setItem(PKCE_KEY, verifier);
  localStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    redirect_uri:          window.location.origin,
    response_type:         "code",
    scope:                 SCOPES,
    code_challenge:        challenge,
    code_challenge_method: "S256",
    access_type:           "offline",
    prompt:                "consent",
    state,
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string): Promise<void> {
  const verifier = localStorage.getItem(PKCE_KEY);
  if (!verifier) throw new Error("PKCE verifier not found");

  const body = new URLSearchParams({
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    code_verifier: verifier,
    grant_type:    "authorization_code",
    redirect_uri:  window.location.origin,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, string>;
    throw new Error(err.error_description ?? "Token exchange failed");
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  saveTokens({
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Date.now() + data.expires_in * 1000,
  });

  localStorage.removeItem(PKCE_KEY);
  localStorage.removeItem(STATE_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refresh_token) return null;

  const body = new URLSearchParams({
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: tokens.refresh_token,
    grant_type:    "refresh_token",
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  const updated: GCalTokens = {
    ...tokens,
    access_token: data.access_token,
    expires_at:   Date.now() + data.expires_in * 1000,
  };
  saveTokens(updated);
  return updated.access_token;
}

async function getValidAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens) return null;

  // Proactively refresh 60 s before expiry
  if (Date.now() > tokens.expires_at - 60_000) {
    return refreshAccessToken();
  }

  return tokens.access_token;
}

// ─── Init (handles OAuth callback) ───────────────────────────────────────────

/**
 * Must be called once on app load.
 * Detects the `?code=` redirect from Google, exchanges it for tokens,
 * then cleans the URL. Returns whether the user is authenticated.
 */
export async function initGoogleAuth(): Promise<boolean> {
  const params      = new URLSearchParams(window.location.search);
  const code        = params.get("code");
  const state       = params.get("state");
  const storedState = localStorage.getItem(STATE_KEY);

  if (code && state && state === storedState) {
    try {
      await exchangeCodeForTokens(code);
      // Remove OAuth params from the URL without a full page reload
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    } catch (err) {
      console.error("[gcal] OAuth callback error:", err);
      clearTokens();
      return false;
    }
  }

  return isAuthenticated();
}

// ─── Calendar REST API ────────────────────────────────────────────────────────

/** Fetches events for the primary calendar within the given ISO time range. */
export async function listCalendarEvents(
  timeMin: string,
  timeMax: string,
): Promise<GCalEvent[]> {
  const token = await getValidAccessToken();
  if (!token) return [];

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy:      "startTime",
    maxResults:   "200",
  });

  const res = await fetch(`${CALENDAR_BASE}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) clearTokens();
    return [];
  }

  const data = await res.json() as { items?: GCalEvent[] };
  return data.items ?? [];
}

/**
 * Creates a Google Calendar event on the primary calendar.
 * Pass allDay=true (or omit time from start) for all-day events.
 */
export async function createCalendarEvent(event: {
  summary: string;
  description?: string;
  start: string;  // "yyyy-mm-dd" for all-day OR ISO datetime for timed
  end?: string;
  allDay?: boolean;
  colorId?: string;
}): Promise<GCalEvent | null> {
  const token = await getValidAccessToken();
  if (!token) return null;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const body: Record<string, unknown> = {
    summary:     event.summary,
    description: event.description,
    colorId:     event.colorId,
  };

  if (event.allDay || !event.start.includes("T")) {
    // All-day: next calendar day as end
    const endDate = event.end ?? advanceDate(event.start, 1);
    body.start = { date: event.start };
    body.end   = { date: endDate };
  } else {
    // Timed: default duration 1 hour
    const endDt = event.end
      ?? new Date(new Date(event.start).getTime() + 60 * 60 * 1000).toISOString();
    body.start = { dateTime: event.start, timeZone: tz };
    body.end   = { dateTime: endDt,       timeZone: tz };
  }

  const res = await fetch(`${CALENDAR_BASE}/calendars/primary/events`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 401) clearTokens();
    return null;
  }

  return res.json() as Promise<GCalEvent>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function advanceDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
