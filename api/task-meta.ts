// Supabase-backed storage for task metadata (business, priority, time, completedAt)
// that Notion doesn't support natively. Replaces localStorage for cross-device sync.

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";

const h = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
});

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    if (req.method === "GET") {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/task_meta?select=*`, { headers: h() });
      const rows = await r.json();
      const meta: Record<string, { business: string; priority: string; time?: string; completedAt?: string }> = {};
      for (const row of rows ?? []) {
        meta[row.notion_id] = {
          business:    row.business,
          priority:    row.priority,
          time:        row.time        ?? undefined,
          completedAt: row.completed_at ?? undefined,
        };
      }
      return res.status(200).json({ meta });
    }

    if (req.method === "POST") {
      const { notion_id, business, priority, time, completedAt } = req.body;
      if (!notion_id) return res.status(400).json({ error: "notion_id required" });

      await fetch(`${SUPABASE_URL}/rest/v1/task_meta`, {
        method: "POST",
        headers: { ...h(), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          notion_id,
          business:     business     ?? "coaching",
          priority:     priority     ?? "normale",
          time:         time         ?? null,
          completed_at: completedAt  ?? null,
          updated_at:   new Date().toISOString(),
        }),
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { notion_id } = req.body;
      if (!notion_id) return res.status(400).json({ error: "notion_id required" });

      await fetch(`${SUPABASE_URL}/rest/v1/task_meta?notion_id=eq.${encodeURIComponent(notion_id)}`, {
        method: "DELETE",
        headers: h(),
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
