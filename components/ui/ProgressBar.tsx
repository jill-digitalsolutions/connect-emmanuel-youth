export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="mt-2 h-[7px] overflow-hidden rounded-md bg-line">
      <div
        className="h-full rounded-md bg-amber transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
