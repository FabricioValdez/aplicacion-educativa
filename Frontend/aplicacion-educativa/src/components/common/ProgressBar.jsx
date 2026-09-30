export default function ProgressBar({ current, total, label }) {
  const safeTotal = Math.max(total, 1);
  const percentage = Math.min(100, Math.round((current / safeTotal) * 100));

  return (
    <div className="w-full rounded-3xl bg-white p-3 shadow-sm" aria-label={label || `Pregunta ${current} de ${total}`}>
      <div className="mb-2 flex items-center justify-between gap-3 px-1 text-sm font-extrabold text-slate-600">
        <span>{label || `Pregunta ${current} de ${total}`}</span>
        <span className="shrink-0 text-[#059669]">{percentage}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#E2E8F0]">
        <div
          className="h-full rounded-full bg-[#34D399] transition-[width] duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={percentage}
        />
      </div>
    </div>
  );
}
