import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN") || "";
const DATABASE_ID = "32b1cbfe74028093b7d1f05262cdb768";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sorts: [{ property: "Date", direction: "ascending" }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), { status: 500, headers: corsHeaders });
    }

    const data = await response.json();
    const items = (data.results || []).map((page: any) => ({
      id: page.id,
      sujet: page.properties?.Name?.title?.[0]?.plain_text || "",
      script: page.properties?.Script?.rich_text?.[0]?.plain_text || "",
      format: page.properties?.Format?.select?.name || "",
      date: page.properties?.Date?.date?.start || "",
      statut: page.properties?.Statut?.select?.name || "",
      business: page.properties?.Business?.select?.name || "",
      notes: page.properties?.["Notes perf"]?.rich_text?.[0]?.plain_text || "",
    }));

    return new Response(JSON.stringify({ items }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
