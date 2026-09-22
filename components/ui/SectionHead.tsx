export function SectionHead({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-7.5 mb-3.5 flex items-baseline justify-between first:mt-0">
      <h3 className="m-0 text-[17px] font-semibold">{title}</h3>
      {action}
    </div>
  );
}
