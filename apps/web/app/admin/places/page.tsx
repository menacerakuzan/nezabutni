"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { authFetch } from "../../../lib/auth-client";
import { StatusBadge } from "../../../components/StatusBadge";

interface AdminPlace {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string | null;
  region_name: string | null;
  lon: number;
  lat: number;
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

  const [name, setName] = useState("");
  const [type, setType] = useState("memorial");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await authFetch("/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, lat: Number(lat), lon: Number(lon), description }),
    });
    setSubmitting(false);
    if (res.ok) {
      setName("");
      setLat("");
      setLon("");
      setDescription("");
      await loadPlaces();
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Видалити цю точку з карти?")) return;
    await authFetch(`/places/${id}`, { method: "DELETE" });
    await loadPlaces();
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
      <p className="mt-2 text-ink">
        Додавання точок для «Карти пам’яті» — POST/PATCH/DELETE /places, доступно ролям
        editor/admin/superadmin.
      </p>

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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-cream" htmlFor="type">
                Тип
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full py-2.5 text-cream"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cream" htmlFor="lat">
                Широта
              </label>
              <input
                id="lat"
                required
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="46.4825"
                className="mt-1 w-full py-2.5 text-cream"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cream" htmlFor="lon">
                Довгота
              </label>
              <input
                id="lon"
                required
                type="number"
                step="any"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="30.7233"
                className="mt-1 w-full py-2.5 text-cream"
              />
            </div>
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
          <button
            type="submit"
            disabled={submitting}
            className="rounded-[3px] bg-crimson px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-crimson-bright disabled:opacity-60"
          >
            {submitting ? "Додаємо…" : "Додати на карту"}
          </button>
        </form>
      )}

      <h2 className="mt-10 font-display text-lg font-semibold text-cream">Усі точки ({places.length})</h2>
      <ul className="mt-4 space-y-3">
        {places.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-lg border border-hair bg-white/[0.03] p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-cream">{p.name}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1 text-xs text-ink-lo">
                {TYPES.find((t) => t.value === p.type)?.label ?? p.type} · {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                {p.region_name ? ` · ${p.region_name}` : ""}
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => onDelete(p.id)}
                className="rounded-md border border-hair px-3 py-1.5 text-xs text-crimson-bright transition-colors hover:border-crimson-bright hover:bg-crimson-bright/15"
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
