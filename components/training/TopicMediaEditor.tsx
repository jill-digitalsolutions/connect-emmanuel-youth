"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Link2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { youtubeId } from "@/lib/utils/youtube";

const MAX_PDF = 20 * 1024 * 1024;

export function TopicMediaEditor({
  courseId,
  topicId,
  youtubeUrl,
  pdfName,
  pdfPath,
}: {
  courseId: string;
  topicId: string;
  youtubeUrl: string | null;
  pdfName: string | null;
  pdfPath: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState(youtubeUrl ?? "");
  const [busy, setBusy] = useState(false);

  async function saveLink() {
    const trimmed = link.trim();
    if (trimmed && !youtubeId(trimmed)) {
      toast("That doesn't look like a YouTube link.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().from("course_topics").update({ youtube_url: trimmed || null }).eq("id", topicId);
    setBusy(false);
    if (error) toast(/youtube_url/.test(error.message) ? "Run the training SQL (0016) in Supabase first." : error.message);
    else {
      toast(trimmed ? "Video link saved" : "Video link removed");
      router.refresh();
    }
  }

  async function uploadPdf(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf") return void toast("Please choose a PDF file.");
    if (file.size > MAX_PDF) return void toast("PDFs must be 20MB or smaller.");
    setBusy(true);
    const supabase = createClient();
    const path = `${courseId}/${topicId}/${crypto.randomUUID()}.pdf`;
    const { error } = await supabase.storage.from("lessons").upload(path, file, { contentType: "application/pdf" });
    if (error) {
      setBusy(false);
      return void toast(error.message);
    }
    const { error: dbError } = await supabase.from("course_topics").update({ pdf_path: path, pdf_name: file.name }).eq("id", topicId);
    if (dbError) {
      await supabase.storage.from("lessons").remove([path]);
      setBusy(false);
      return void toast(dbError.message);
    }
    if (pdfPath) await supabase.storage.from("lessons").remove([pdfPath]);
    setBusy(false);
    toast("PDF uploaded");
    router.refresh();
  }

  return (
    <div className="mt-2 grid gap-2 rounded-xl bg-page p-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 flex-none text-text-soft" />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="YouTube link (optional)"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] text-text"
        />
        <button type="button" onClick={saveLink} disabled={busy} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
          Save
        </button>
      </div>
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 flex-none text-text-soft" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-text-soft">{pdfName ?? "No PDF yet"}</span>
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { uploadPdf(e.target.files?.[0]); e.target.value = ""; }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold disabled:opacity-50">
          <Upload className="h-3.5 w-3.5" /> {pdfName ? "Replace PDF" : "Upload PDF"}
        </button>
      </div>
    </div>
  );
}
