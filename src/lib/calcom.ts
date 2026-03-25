// ── Cal.com REST client (browser-compatible) ─────────────────────────────────
const CALCOM_KEY = import.meta.env.VITE_CALCOM_API_KEY as string;
const BASE = "https://api.cal.com/v1";

export interface CalBooking {
  id: number;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "ACCEPTED" | "CANCELLED" | "PENDING" | "REJECTED";
  attendee: {
    name: string;
    email: string;
    phone?: string;
  };
  closer: string; // user.name
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

// ── Fetch all bookings (paginated) ───────────────────────────────────────────

async function fetchAllBookings(): Promise<CalBooking[]> {
  const res = await fetch(
    `${BASE}/bookings?apiKey=${CALCOM_KEY}&limit=100`,
    { headers: { "Content-Type": "application/json" } }
  );
  if (!res.ok) throw new Error(`Cal.com error: ${res.status} ${await res.text()}`);
  const { bookings } = await res.json();

  return (bookings as any[]).map((b) => ({
    id: b.id,
    uid: b.uid,
    title: b.title,
    startTime: b.startTime,
    endTime: b.endTime,
    status: b.status,
    attendee: {
      name: b.attendees?.[0]?.name ?? "Inconnu",
      email: b.attendees?.[0]?.email ?? "",
      phone: b.responses?.attendeePhoneNumber ?? undefined,
    },
    closer: b.user?.name ?? "—",
    budget: b.responses?.budget?.[0] ?? undefined,
    niveau: b.responses?.niveau?.[0] ?? undefined,
    formation: b.responses?.formation ?? undefined,
  }));
}

// ── Compute aggregate stats ───────────────────────────────────────────────────

export async function fetchCalStats(): Promise<CalStats> {
  const bookings = await fetchAllBookings();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const accepted = bookings.filter((b) => b.status === "ACCEPTED");
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");
  const thisMonth = bookings.filter(
    (b) => b.status === "ACCEPTED" && new Date(b.startTime) >= startOfMonth
  );
  const upcoming = accepted
    .filter((b) => new Date(b.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 10);

  // Group by closer (only accepted)
  const byCloser: Record<string, number> = {};
  for (const b of accepted) {
    // Simplify closer name: "Lionel Mathis - Équipe Made" → "Lionel"
    const short = b.closer.split(" ")[0];
    byCloser[short] = (byCloser[short] ?? 0) + 1;
  }

  // Group by budget
  const byBudget: Record<string, number> = {};
  for (const b of accepted) {
    if (b.budget) byBudget[b.budget] = (byBudget[b.budget] ?? 0) + 1;
  }

  // Group by niveau
  const byNiveau: Record<string, number> = {};
  for (const b of accepted) {
    if (b.niveau) byNiveau[b.niveau] = (byNiveau[b.niveau] ?? 0) + 1;
  }

  return {
    bookings: accepted.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    ),
    total: bookings.length,
    accepted: accepted.length,
    cancelled: cancelled.length,
    thisMonth: thisMonth.length,
    upcoming,
    byCloser,
    byBudget,
    byNiveau,
  };
}
