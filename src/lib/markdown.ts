// Mini rendu Markdown pour POINT-DU-JOUR.md : titres, tableaux, listes,
// gras, italique, code, liens. Tout est échappé avant mise en forme.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const STATUS: Record<string, [string, string]> = { "🟢": ["ok", "bon"], "🟡": ["mid", "moyen"], "🔴": ["bad", "à revoir"], "⚪": ["none", "—"] };

function inline(t: string): string {
  let s = esc(t);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  for (const [emoji, [cls, mot]] of Object.entries(STATUS)) {
    s = s.split(emoji).join(`<span class="state ${cls}">${mot}</span>`);
  }
  return s;
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*\|/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        if (!/^\s*\|?\s*:?-{2,}/.test(lines[i])) rows.push(cells(lines[i]));
        i++;
      }
      const [head, ...body] = rows;
      // Au-delà de 2 colonnes, un tableau est illisible sur iPhone : une fiche par ligne
      // (1re colonne en étiquette, 2e en texte principal, les autres en détails)
      if (head.length > 2) {
        out.push(
          '<div class="rows">' +
            body.map((r) =>
              `<div class="rowcard"><span class="chip">${inline(r[0] ?? "")}</span>` +
              `<p class="rc-main">${inline(r[1] ?? "")}</p>` +
              r.slice(2).map((c, k) => (c && c !== "—" ? `<div><span>${inline(head[k + 2] ?? "")}</span>${inline(c)}</div>` : "")).join("") +
              "</div>",
            ).join("") +
            "</div>",
        );
        continue;
      }
      out.push(
        `<div class="tbl"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
          body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") +
          "</tbody></table></div>",
      );
      continue;
    }
    if (/^\s*[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*[-*] /, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
    else if (/^-{3,}\s*$/.test(line)) out.push("<hr>");
    else if (line.trim().startsWith(">")) out.push(`<blockquote>${inline(line.replace(/^\s*>\s?/, ""))}</blockquote>`);
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    i++;
  }
  return out.join("\n");
}

// Découpe le point en sections (une par titre « ## »), pour l'affichage repliable.
// Le titre principal (« # ») et son chapeau sont ignorés : l'app a déjà son titre.
export function markdownSections(md: string): { title: string; html: string }[] {
  const sections: { title: string; lines: string[] }[] = [];
  for (const line of md.replace(/\r/g, "").split("\n")) {
    const h = line.match(/^##\s+(.*)/);
    if (h) sections.push({ title: h[1].replace(/^\d+\.\s*/, "").replace(/\*\*/g, ""), lines: [] });
    else if (sections.length) sections[sections.length - 1].lines.push(line);
  }
  return sections
    .map((s) => ({ title: s.title, html: renderMarkdown(s.lines.join("\n").replace(/^\s*---\s*$/gm, "")) }))
    .filter((s) => s.html.trim());
}
