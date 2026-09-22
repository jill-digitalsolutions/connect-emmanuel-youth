import clsx from "clsx";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mt-3 mb-1.5 block text-xs font-bold text-text-soft">{children}</label>;
}

const fieldClasses =
  "w-full rounded-[9px] border border-line bg-page px-3 py-2.5 text-[13.5px] text-text placeholder:text-text-soft/70";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={clsx(fieldClasses, className)} {...rest} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={clsx(fieldClasses, "min-h-[70px] resize-y", className)} {...rest} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select className={clsx(fieldClasses, className)} {...rest} />;
}

export function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2.5 sm:flex-row">{children}</div>;
}
