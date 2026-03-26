import { useState } from "react";
import { Copy, Check } from "lucide-react";

const AFFILIATE_URL = "https://track.coolaffs.com/visit/?bta=37391&brand=corgibet";

export default function AffiliateCopyButton({ className, compact }: { className?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(AFFILIATE_URL);
    } catch {
      const el = document.createElement("textarea");
      el.value = AFFILIATE_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-150 select-none ${className ?? ""}`}
      style={{
        background: copied ? "rgba(0,204,68,0.15)" : "rgba(0,0,0,0.4)",
        border: `1px solid ${copied ? "#00cc44" : "#00cc4466"}`,
        color: "#00cc44",
        cursor: "pointer",
        whiteSpace: "nowrap",
        padding: compact ? "8px 10px" : "4px 10px",
      }}
      title="Copier lien affiliation"
    >
      {copied
        ? <><Check className="w-3 h-3" /><span className={compact ? "hidden sm:inline" : ""}>Lien copié !</span></>
        : <><Copy className="w-3 h-3" /><span className={compact ? "hidden sm:inline" : ""}>Copier lien affiliation</span></>
      }
    </button>
  );
}
