const TOKEN = process.env.NOTION_TOKEN;
const DB_ID = "84280a15-8ae3-4e4c-a4f2-831ac17aa527";
const BASE = "https://api.notion.com/v1";

const h = () => ({
  Authorization: `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
});

function toApp(name: string): string {
  if (name === "In progress") return "progress";
  if (name === "Done") return "done";
  return "todo";
}

function toNotion(s: string): string {
  if (s === "progress") return "In progress";
  if (s === "done") return "Done";
  return "To-do";
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!TOKEN) return res.status(500).json({ error: "NOTION_TOKEN not configured" });

  try {
    if (req.method === "GET") {
      const all: any[] = [];
      let cursor: string | undefined;
      do {
        const body: any = { sorts: [{ property: "Due", direction: "ascending" }], page_size: 100 };
        if (cursor) body.start_cursor = cursor;
        const r = await fetch(`${BASE}/databases/${DB_ID}/query`, {
          method: "POST", headers: h(), body: JSON.stringify(body),
        });
        const data = await r.json();
        all.push(...(data.results ?? []));
        cursor = data.has_more ? data.next_cursor : undefined;
      } while (cursor);

      const tasks = all.map((p: any) => ({
        id: p.id,
        title: p.properties["Task name"]?.title?.[0]?.plain_text ?? "",
        status: toApp(p.properties["Status"]?.status?.name ?? ""),
        deadline: p.properties["Due"]?.date?.start ?? undefined,
        createdAt: p.created_time?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      }));
      return res.status(200).json({ tasks });
    }

    if (req.method === "POST") {
      const { title, status, deadline } = req.body;
      const r = await fetch(`${BASE}/pages`, {
        method: "POST", headers: h(),
        body: JSON.stringify({
          parent: { database_id: DB_ID },
          properties: {
            "Task name": { title: [{ text: { content: title } }] },
            Status: { status: { name: toNotion(status ?? "todo") } },
            ...(deadline ? { Due: { date: { start: deadline } } } : {}),
          },
        }),
      });
      const p = await r.json();
      return res.status(200).json({
        id: p.id, title, status: status ?? "todo", deadline,
        createdAt: p.created_time?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      });
    }

    if (req.method === "PATCH") {
      const { id, title, status, deadline } = req.body;
      const properties: any = {};
      if (title !== undefined) properties["Task name"] = { title: [{ text: { content: title } }] };
      if (status !== undefined) properties["Status"] = { status: { name: toNotion(status) } };
      if (deadline !== undefined) properties["Due"] = deadline ? { date: { start: deadline } } : { date: null };
      await fetch(`${BASE}/pages/${id}`, {
        method: "PATCH", headers: h(), body: JSON.stringify({ properties }),
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      await fetch(`${BASE}/pages/${id}`, {
        method: "PATCH", headers: h(), body: JSON.stringify({ archived: true }),
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
