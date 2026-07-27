"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { authFetch } from "../../../lib/auth-client";
import { StatusBadge } from "../../../components/StatusBadge";
import { PlacePicker } from "../../../components/admin/PlacePicker";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface AdminPlace {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string | null;
  region_name: string | null;
  lon: number;
  lat: number;
  cover_media_id: string | null;
}

const TYPES = [
  { value: "battle", label: "Місце бою" },
  { value: "memorial", label: "Меморіал" },
  { value: "burial", label: "Поховання" },
  { value: "monument", label: "Пам’ятник" },
  { value: "museum_site", label: "Музейна локація" },
  { value: "frontline_segment", label: "Лінія фронту" },
];

export default function AdminPlacesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("memorial");
  const [coords, setCoords] = useState<{ lon: number; lat: number } | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [photo, setPhoto] = useState<{ id: string; url: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const canEdit = user?.roles.some((r) => ["editor", "admin", "superadmin"].includes(r));

  async function loadPlaces() {
    const res = await authFetch("/places/admin");
    if (res.ok) {
      setPlaces(await res.json());
    } else if (res.status === 403) {
      setError("Немає доступу до керування картою.");
    }
  }

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) loadPlaces();
  }, [user]);

  async function uploadPhoto(file: File) {
    setPhotoError(null);
    setPhotoBusy(true);
    const body = new FormData();
    body.append("file", file);
    const res = await authFetch("/media/upload", { method: "POST", body });
    setPhotoBusy(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setPhotoError(data?.message ?? "Не вдалося завантажити фото.");
      return;
    }
    setPhoto({ id: data.id, url: `${API_URL}${(data.url as string).replace("/api/v1", "")}` });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coords) return;
    setSubmitting(true);
    setListError(null);
    const res = await authFetch("/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        lat: coords.lat,
        lon: coords.lon,
        description,
        coverMediaId: photo?.id,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setName("");
      setCoords(null);
      setDescription("");
      setPhoto(null);
      await loadPlaces();
    } else {
      const body = await res.json().catch(() => null);
      setListError(body?.message ?? "Не вдалося додати точку.");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Видалити цю точку з карти?")) return;
    setListError(null);
    const res = await authFetch(`/places/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadPlaces();
    } else {
      const body = await res.json().catch(() => null);
      setListError(body?.message ?? "Не вдалося видалити точку.");
    }
  }

  if (loading || !user) {
    return <div className="text-ink-lo">Завантаження…</div>;
  }

  if (error) {
    return <div className="text-crimson-bright">{error}</div>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl font-semibold text-cream">Керування картою пам’яті</h1>
      <p className="mt-2 text-ink">Точки для «Карти пам’яті» — клацніть по карті, щоб поставити місце.</p>

      {listError && (
        <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{listError}</p>
      )}

      {canEdit && (
        <form onSubmit={onSubmit} className="mt-8 space-y-5 border-t border-hair pt-8">
          <h2 className="font-display text-lg font-semibold text-cream">Нова точка</h2>
          <div>
            <label className="block text-sm font-medium text-cream" htmlFor="name">
              Назва
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full py-2.5 text-cream"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cream" htmlFor="type">
              Тип
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full max-w-xs py-2.5 text-cream"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="block text-sm font-medium text-cream">Місце на карті</p>
            <div className="mt-1">
              <PlacePicker lon={coords?.lon ?? null} lat={coords?.lat ?? null} onPick={(lon, lat) => setCoords({ lon, lat })} />
            </div>
            {coords && (
              <p className="mt-1.5 text-xs text-ink-lo">
                Обрано: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-cream" htmlFor="description">
              Опис
            </label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full py-2.5 text-cream"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-cream">Фото місця</p>
            {photo ? (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-20 w-28 rounded-[3px] object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="text-xs text-ink-lo hover:text-crimson-bright"
                >
                  Прибрати
                </button>
              </div>
            ) : (
              <div
                onClick={() => photoInputRef.current?.click()}
                role="button"
                tabIndex={0}
                className="mt-2 cursor-pointer rounded-[3px] border border-dashed border-hair-strong px-4 py-6 text-center text-sm text-ink-lo hover:border-cream"
              >
                {photoBusy ? "Завантажуємо…" : "Натисніть, щоб додати фото"}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
                />
              </div>
            )}
            {photoError && <p className="mt-1.5 text-xs text-crimson-bright">{photoError}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting || !coords}
            className="rounded-[3px] bg-crimson px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-crimson-bright disabled:opacity-60"
          >
            {submitting ? "Додаємо…" : coords ? "Додати на карту" : "Спершу оберіть точку на карті"}
          </button>
        </form>
      )}

      <h2 className="mt-10 font-display text-lg font-semibold text-cream">Усі точки ({places.length})</h2>
      <ul className="mt-4 space-y-3">
        {places.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 rounded-lg border border-hair bg-white/[0.03] p-4">
            <div className="flex min-w-0 items-center gap-3">
              {p.cover_media_id && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_URL}/media/file/${p.cover_media_id}`}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-[3px] object-cover"
                />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-cream">{p.name}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-xs text-ink-lo">
                  {TYPES.find((t) => t.value === p.type)?.label ?? p.type} · {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                  {p.region_name ? ` · ${p.region_name}` : ""}
                </p>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => onDelete(p.id)}
                className="shrink-0 rounded-md border border-hair px-3 py-1.5 text-xs text-crimson-bright transition-colors hover:border-crimson-bright hover:bg-crimson-bright/15"
              >
                Видалити
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
