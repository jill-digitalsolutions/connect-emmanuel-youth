"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { validateImageFile } from "@/lib/utils/image";
import { useToast } from "@/components/ui/Toast";

export function ImageInput({
  file,
  onChange,
  label = "Choose image",
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (f) {
            const err = validateImageFile(f);
            if (err) {
              toast(err);
              e.target.value = "";
              return;
            }
          }
          onChange(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-[9px] border border-dashed border-line bg-page px-3 py-3 text-[13px] font-semibold text-text-soft hover:bg-line/40"
      >
        <ImagePlus className="h-4 w-4" />
        {file ? file.name : label}
      </button>
    </div>
  );
}
