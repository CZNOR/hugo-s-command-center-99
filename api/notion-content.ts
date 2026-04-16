const TOKEN = process.env.NOTION_TOKEN ?? process.env.VITE_NOTION_TOKEN;
const DB_ID = "32b1cbfe-7402-8093-b7d1-f05262cdb768";
const BASE = "https://api.notion.com/v1";

const h = () => ({
  Authorization: `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
});

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!TOKEN) return res.status(500).json({ error: "NOTION_TOKEN not configured" });

  try {
    const body = req.method === "POST" ? (req.body ?? {}) : {};
    const action: string | undefined = body.action;

    // List all items (GET or POST with no action)
    if (req.method === "GET" || !action) {
      const all: any[] = [];
      let cursor: string | undefined;
      do {
        const payload: any = {
          sorts: [{ property: "Date", direction: "ascending" }],
          page_size: 100,
        };
        if (cursor) payload.start_cursor = cursor;
        const r = await fetch(`${BASE}/databases/${DB_ID}/query`, {
          method: "POST", headers: h(), body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const text = await r.text();
          console.error("Notion content query failed", r.status, text);
          return res.status(r.status).json({ error: "Notion query failed", detail: text });
        }
        const data = await r.json();
        all.push(...(data.results ?? []));
        cursor = data.has_more ? data.next_cursor : undefined;
      } while (cursor);

      const items = all.map((p: any) => ({
        id: p.id,
        sujet: p.properties["Name"]?.title?.[0]?.plain_text ?? "",
        script: p.properties["Script"]?.rich_text?.[0]?.plain_text ?? "",
        format: p.properties["Format"]?.select?.name ?? "",
        date: p.properties["Date"]?.date?.start ?? "",
        statut: p.properties["Statut"]?.select?.name ?? "Idée",
        business: p.properties["Business"]?.select?.name ?? "",
        notes: p.properties["Notes perf"]?.rich_text?.[0]?.plain_text ?? "",
      }));
      return res.status(200).json({ items });
    }

    if (action === "create") {
      const { sujet, format, date, statut, business, notes } = body;
      const r = await fetch(`${BASE}/pages`, {
        method: "POST", headers: h(),
        body: JSON.stringify({
          parent: { database_id: DB_ID },
          properties: {
            Name: { title: [{ text: { content: sujet ?? "" } }] },
            ...(format   ? { Format:  { select: { name: format } } } : {}),
            ...(date     ? { Date:    { date: { start: date } } } : {}),
            ...(statut   ? { Statut:  { select: { name: statut } } } : {}),
            ...(business ? { Business: { select: { name: business } } } : {}),
            ...(notes    ? { "Notes perf": { rich_text: [{ text: { content: notes } }] } } : {}),
          },
        }),
      });
      const p = await r.json();
      if (p.object === "error") throw new Error(p.message);
      return res.status(200).json({
        id: p.id, sujet: sujet ?? "", script: "", format: format ?? "",
        date: date ?? "", statut: statut ?? "Idée", business: business ?? "", notes: notes ?? "",
      });
    }

    if (action === "update") {
      const { id, statut, sujet, format, date, business } = body;
      const properties: any = {};
      if (statut   !== undefined) properties["Statut"]   = { select: { name: statut } };
      if (sujet    !== undefined) properties["Name"]     = { title: [{ text: { content: sujet } }] };
      if (format   !== undefined) properties["Format"]   = { select: { name: format } };
      if (date     !== undefined) properties["Date"]     = date ? { date: { start: date } } : { date: null };
      if (business !== undefined) properties["Business"] = { select: { name: business } };
      const r = await fetch(`${BASE}/pages/${id}`, {
        method: "PATCH", headers: h(), body: JSON.stringify({ properties }),
      });
      if (!r.ok) {
        const text = await r.text();
        console.error("Notion content patch failed", r.status, text);
        return res.status(r.status).json({ error: "Notion patch failed", detail: text });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message ?? "Internal server error" });
  }
}
