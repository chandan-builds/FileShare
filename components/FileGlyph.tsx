import {
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  File as FileIcon,
} from "lucide-react";
import { getFileExtension } from "@/lib/file-utils";

const iconClass = "h-6 w-6";

export function FileGlyph({
  fileName,
  contentType,
  className = "",
}: {
  fileName: string;
  contentType?: string;
  className?: string;
}) {
  const extension = getFileExtension(fileName);
  const type = contentType ?? "";
  let Icon = FileIcon;

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension) || type.startsWith("image/")) {
    Icon = FileImage;
  } else if (["mp4", "mov"].includes(extension) || type.startsWith("video/")) {
    Icon = FileVideo;
  } else if (extension === "mp3" || type.startsWith("audio/")) {
    Icon = FileAudio;
  } else if (["xls", "xlsx", "csv"].includes(extension)) {
    Icon = FileSpreadsheet;
  } else if (extension === "zip") {
    Icon = FileArchive;
  } else if (["json", "txt"].includes(extension)) {
    Icon = FileCode;
  } else if (["pdf", "doc", "docx", "ppt", "pptx"].includes(extension)) {
    Icon = FileText;
  }

  return (
    <span
      className={`grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-accent ${className}`}
      aria-hidden="true"
    >
      <Icon className={iconClass} strokeWidth={1.7} />
    </span>
  );
}

export function FileTypeLabel({ fileName }: { fileName: string }) {
  const extension = getFileExtension(fileName).toUpperCase() || "FILE";
  return (
    <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] text-muted">
      {extension}
    </span>
  );
}
