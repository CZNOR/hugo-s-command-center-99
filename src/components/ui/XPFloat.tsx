import { useState } from "react";

export function useXPFloat() {
  const [floats, setFloats] = useState<{ id: number; amount: number }[]>([]);

  const triggerXP = (amount: number) => {
    const id = Date.now();
    setFloats((prev) => [...prev, { id, amount }]);
    setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 1300);
  };

  return { floats, triggerXP };
}

export function XPFloats({ floats }: { floats: { id: number; amount: number }[] }) {
  return (
    <>
      {floats.map((f) => (
        <span
          key={f.id}
          className="absolute top-0 right-4 animate-float-up font-mono-data font-bold text-hugoos-purple pointer-events-none"
        >
          +{f.amount} XP
        </span>
      ))}
    </>
  );
}
