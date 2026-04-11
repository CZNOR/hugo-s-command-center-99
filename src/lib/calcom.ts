// ── Cal.com REST client v2 ─────────────────────────────────────────────────
const CALCOM_KEY = import.meta.env.VITE_CALCOM_API_KEY as string;
const BASE = "https://api.cal.com/v2";
const CAL_HEADERS = {
  "Authorization": `Bearer ${CALCOM_KEY}`,
  "cal-api-version": "2024-08-13",
  "Content-Type": "application/json",
};

export interface CalBooking {
  id: number;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "accepted" | "cancelled" | "pending" | "rejected";
  attendee: {
    name: string;
    email: string;
    phone?: string;
  };
  closer: string;
  budget?: string;
  niveau?: string;
  formation?: string;
}

export interface CalStats {
  bookings: CalBooking[];
  total: number;
  accepted: number;
  cancelled: number;
  thisMonth: number;
  upcoming: CalBooking[];
  byCloser: Record<string, number>;
  byBudget: Record<string, number>;
  byNiveau: Record<string, number>;
}

// ── Fetch bookings by v2 status filter ───────────────────────────────────────
async function fetchByStatus(
  statusFilter: "past" | "upcoming" | "cancelled",
  limit = 250
): Promise<CalBooking[]> {
  const res = await fetch(
    `${BASE}/bookings?status=${statusFilter}&limit=${limit}`,
    { headers: CAL_HEADERS }
  );
  if (!res.ok) throw new Error(`Cal.com error: ${res.status}`);
  const json = await res.json();
  const data: any[] = Array.isArray(json.data) ? json.data : [];

  return data.map((b) => ({
    id: b.id,
    uid: b.uid,
    title: b.title,
    startTime: b.start,
    endTime: b.end,
    status: (b.status ?? "pending").toLowerCase() as CalBooking["status"],
    attendee: {
      name: b.attendees?.[0]?.name ?? "Inconnu",
      email: b.attendees?.[0]?.email ?? "",
      phone: b.attendees?.[0]?.phoneNumber ?? b.bookingFieldsResponses?.attendeePhoneNumber ?? undefined,
    },
    closer: b.hosts?.[0]?.name ?? "—",
    budget: b.bookingFieldsResponses?.budget?.[0] ?? undefined,
    niveau: b.bookingFieldsResponses?.niveau?.[0] ?? undefined,
    formation: b.bookingFieldsResponses?.formation ?? undefined,
  }));
}

// ── Fetch all bookings (past + upcoming + cancelled) ─────────────────────────
export async function fetchAllBookings(): Promise<CalBooking[]> {
  const [past, upcoming, cancelled] = await Promise.all([
    fetchByStatus("past"),
    fetchByStatus("upcoming"),
    fetchByStatus("cancelled"),
  ]);
  // Deduplicate by id
  const seen = new Set<number>();
  const all: CalBooking[] = [];
  for (const b of [...past, ...upcoming, ...cancelled]) {
    if (!seen.has(b.id)) { seen.add(b.id); all.push(b); }
  }
  return all;
}

// ── Compute aggregate stats ───────────────────────────────────────────────────
export async function fetchCalStats(): Promise<CalStats> {
  const bookings = await fetchAllBookings();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const accepted  = bookings.filter((b) => b.status === "accepted");
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const thisMonth = bookings.filter(
    (b) => b.status === "accepted" && new Date(b.startTime) >= startOfMonth
  );
  const upcoming = accepted
    .filter((b) => new Date(b.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 10);

  const byCloser: Record<string, number> = {};
  for (const b of accepted) {
    const short = b.closer.split(" ")[0];
    byCloser[short] = (byCloser[short] ?? 0) + 1;
  }

  const byBudget: Record<string, number> = {};
  for (const b of accepted) {
    if (b.budget) byBudget[b.budget] = (byBudget[b.budget] ?? 0) + 1;
  }

  const byNiveau: Record<string, number> = {};
  for (const b of accepted) {
    if (b.niveau) byNiveau[b.niveau] = (byNiveau[b.niveau] ?? 0) + 1;
  }

  return {
    bookings: accepted.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    ),
    total:    bookings.length,
    accepted: accepted.length,
    cancelled: cancelled.length,
    thisMonth: thisMonth.length,
    upcoming,
    byCloser,
    byBudget,
    byNiveau,
  };
}
