// Mini rendu Markdown pour POINT-DU-JOUR.md : titres, tableaux, listes,
// gras, italique, code, liens. Tout est échappé avant mise en forme.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const STATUS: Record<string, string> = { "🟢": "ok", "🟡": "mid", "🔴": "bad", "⚪": "none" };

function inline(t: string): string {
  let s = esc(t);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  for (const [emoji, cls] of Object.entries(STATUS)) {
    s = s.split(emoji).join(`<i class="dot ${cls}"></i>`);
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

// Lignes du tableau « Ce que tu fais aujourd'hui » pour l'accueil
export function todayRows(md: string, max = 3): { when: string; what: string }[] {
  const lines = md.split("\n");
  const start = lines.findIndex((l) => /^#+ .*aujourd/i.test(l));
  if (start < 0) return [];
  const rows: { when: string; what: string }[] = [];
  for (const l of lines.slice(start + 1)) {
    if (/^#/.test(l)) break;
    if (!/^\s*\|/.test(l) || /^\s*\|?\s*:?-{2,}/.test(l)) continue;
    const [when, what] = cells(l);
    if (!when || /^heure$/i.test(when)) continue;
    rows.push({ when: when.replace(/\*/g, ""), what: what.replace(/\*\*/g, "") });
    if (rows.length >= max) break;
  }
  return rows;
}
