import { useRef, useState, type DragEvent } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { CopyButton } from "./CopyButton";

interface Staged {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

function fmt(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function MediaDropZone() {
  const [files, setFiles] = useState<Staged[]>([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ingest = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const preview = typeof result === "string" && f.type.startsWith("image/") ? result : undefined;
        setFiles((cur) => [...cur, { name: f.name, size: f.size, type: f.type || "raw/binary", preview }]);
      };
      if (f.type.startsWith("image/")) reader.readAsDataURL(f);
      else {
        reader.readAsArrayBuffer(f);
      }
    });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    ingest(e.dataTransfer.files);
  };

  const manifest = JSON.stringify(files.map(({ preview: _p, ...r }) => r), null, 2);

  return (
    <section className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Module · 02</p>
          <h3 className="font-display text-base font-semibold">RAW Drop Zone</h3>
        </div>
        <CopyButton value={manifest} label="Manifest" />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`mt-4 cursor-pointer rounded-xl border border-dashed p-6 text-center transition-colors ${
          drag ? "border-gold bg-gold/5" : "border-border bg-background/40"
        }`}
      >
        <UploadCloud className="mx-auto text-gold" size={28} />
        <p className="mt-2 text-sm font-semibold">Stage RAW files or datasheets</p>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          Drop · or tap to browse — processed locally via FileReader
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => ingest(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-2"
            >
              {f.preview ? (
                <img src={f.preview} alt={f.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded bg-background text-gold">
                  <FileText size={16} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{f.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {fmt(f.size)} · {f.type}
                </p>
              </div>
              <button
                onClick={() => setFiles((cur) => cur.filter((_, idx) => idx !== i))}
                className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
