"use client";

import { useRef, useState } from "react";
import { authFetch } from "../lib/auth-client";

/**
 * Завантаження родинних матеріалів: світлини, листи, документи.
 * Тип файлу остаточно перевіряє сервер за сигнатурою — тут лише
 * попередня підказка користувачу й показ стану.
 */

export interface UploadedMedia {
  id: string;
  title: string | null;
  kind: string;
  sizeBytes: number | null;
  url: string;
  deduplicated?: boolean;
}

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,video/mp4,audio/mpeg";
const MAX_MB = 15;

export function FileUpload({
  onChange,
}: {
  onChange?: (items: UploadedMedia[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadedMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function send(files: FileList | File[]) {
    setError(null);
    const list = Array.from(files);
    setBusy(true);
    const added: UploadedMedia[] = [];

    for (const file of list) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`«${file.name}» більший за ${MAX_MB} МБ.`);
        continue;
      }
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await authFetch("/media/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.message ?? "Не вдалося завантажити файл.");
          continue;
        }
        added.push(data as UploadedMedia);
      } catch {
        setError("Немає зв’язку із сервером. Спробуйте ще раз.");
      }
    }

    const next = [...items, ...added];
    setItems(next);
    onChange?.(next);
    setBusy(false);
  }

  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    onChange?.(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) send(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        className={`cursor-pointer border border-dashed px-6 py-10 text-center transition-colors ${
          dragOver ? "border-gold bg-gold/[0.06]" : "border-hair-strong hover:border-cream"
        }`}
      >
        <p className="font-medium text-cream">
          {busy ? "Завантажуємо…" : "Перетягніть файли або натисніть, щоб обрати"}
        </p>
        <p className="mt-2 text-sm text-ink-lo">
          Світлини, листи, документи · JPEG, PNG, WebP, PDF, MP4, MP3 · до {MAX_MB} МБ
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => e.target.files && send(e.target.files)}
        />
      </div>

      {error && (
        <p className="mt-3 border-l-2 border-crimson-bright pl-3 text-sm text-ink">{error}</p>
      )}

      {items.length > 0 && (
        <ul className="mt-4 divide-y divide-hair border-y border-hair">
          {items.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-cream">{m.title}</p>
                <p className="text-xs text-ink-lo">
                  {m.kind} · {m.sizeBytes ? `${Math.round(m.sizeBytes / 1024)} КБ` : "—"}
                  {m.deduplicated && " · такий файл уже є в архіві"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="shrink-0 text-xs text-ink-lo transition-colors hover:text-crimson-bright"
              >
                Прибрати
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-ink-lo">
        Матеріали публікуються лише після перевірки модератором.
      </p>
    </div>
  );
}
