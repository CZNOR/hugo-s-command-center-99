import { useState } from "react";
import { checkCode, saveCode } from "@/lib/api";

// Écran de code d'accès, affiché une fois par appareil
export default function AccessGate({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setErr("");
    const ok = await checkCode(code).catch(() => false);
    setBusy(false);
    if (!ok) return setErr("Code incorrect.");
    saveCode(code);
    onDone();
  }

  return (
    <form className="gate" onSubmit={submit}>
      <img src="/icon-192.png" alt="" />
      <h1 className="h">Code <em>d'accès</em></h1>
      <p className="sub">À saisir une seule fois sur cet appareil.</p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="current-password"
        type="password"
        placeholder="mot-mot-mot-mot-000"
      />
      {err && <p className="err">{err}</p>}
      <button className="btn" disabled={busy}>{busy ? "Vérification…" : "Entrer"}</button>
    </form>
  );
}
