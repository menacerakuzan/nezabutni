"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DefenderSummary } from "../../../lib/types";
import { formatDates } from "../../../lib/mock-data";
import { authFetch } from "../../../lib/auth-client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function AdminPeoplePage() {
  const [items, setItems] = useState<DefenderSummary[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState(false);
  const [busyPid, setBusyPid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingPid, setEditingPid] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [newPortraitId, setNewPortraitId] = useState<string | null>(null);
  const [portraitBusy, setPortraitBusy] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch(`${API}/defenders`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditingPid(null);
    setFullName("");
    setBirthDate("");
    setDeathDate("");
    setBio("");
    setPortraitUrl(null);
    setNewPortraitId(null);
    setPortraitError(null);
    setFormError(null);
  }

  function startCreate() {
    resetForm();
    setShowForm(true);
  }

  async function startEdit(pid: string) {
    resetForm();
    setShowForm(true);
    setEditingPid(pid);
    const res = await fetch(`${API}/defenders/${pid}`);
    if (!res.ok) return;
    const d = await res.json();
    setFullName(d.fullName ?? "");
    setBirthDate(d.birthDate ?? "");
    setDeathDate(d.deathDate ?? "");
    setBio(d.bio ?? "");
    setPortraitUrl(d.portraitUrl ?? null);
  }

  async function uploadPortrait(file: File) {
    setPortraitError(null);
    setPortraitBusy(true);
    const body = new FormData();
    body.append("file", file);
    const res = await authFetch("/media/upload", { method: "POST", body });
    setPortraitBusy(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setPortraitError(data?.message ?? "Не вдалося завантажити фото.");
      return;
    }
    setNewPortraitId(data.id);
    setPortraitUrl(`${API}${(data.url as string).replace("/api/v1", "")}`);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    setFormError(null);

    const payload = {
      fullName: fullName.trim(),
      birthDate: birthDate || undefined,
      deathDate: deathDate || undefined,
      bio: bio.trim() || undefined,
      ...(newPortraitId ? { portraitMediaId: newPortraitId } : {}),
    };

    const res = editingPid
      ? await authFetch(`/defenders/${editingPid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await authFetch("/defenders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (res.ok) {
      resetForm();
      setShowForm(false);
      load();
    } else if (res.status === 403) {
      setFormError("Редагування доступне модераторам і адміністраторам.");
    } else {
      const body = await res.json().catch(() => null);
      setFormError(body?.message ?? "Не вдалося зберегти. Перевірте поля.");
    }
  }

  const filtered = useMemo(
    () => items.filter((d) => d.fullName.toLowerCase().includes(q.trim().toLowerCase())),
    [items, q]
  );

  async function remove(pid: string, fullName: string) {
    if (!confirm(`Видалити «${fullName}» з реєстру? Сторінку пам’яті, свічки й спогади буде втрачено. Дію не можна скасувати.`)) {
      return;
    }
    setActionError(null);
    setBusyPid(pid);
    const res = await authFetch(`/defenders/${pid}`, { method: "DELETE" });
    setBusyPid(null);
    if (res.ok) {
      setItems((prev) => prev.filter((d) => d.pid !== pid));
    } else if (res.status === 403) {
      setActionError("Видалення доступне лише адміністраторам.");
    } else {
      const body = await res.json().catch(() => null);
      setActionError(body?.message ?? "Не вдалося видалити запис.");
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Меморіал</h1>
          <p className="mt-1 text-sm text-ink-lo">{items.length} записів у реєстрі</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => (showForm ? setShowForm(false) : startCreate())}
            className="rounded-[3px] bg-cream px-4 py-2 text-sm font-semibold text-void hover:bg-white"
          >
            {showForm ? "Скасувати" : "+ Додати людину"}
          </button>
          <Link
            href="/submissions/new"
            className="rounded-[3px] border border-hair px-4 py-2 text-sm text-ink hover:border-cream hover:text-cream"
          >
            Заявка від родини
          </Link>
        </div>
      </header>

      {error && (
        <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">
          Реєстр недоступний — перевірте, чи запущений API.
        </p>
      )}
      {actionError && (
        <p className="mt-6 border-l-2 border-crimson-bright pl-4 text-sm text-ink">{actionError}</p>
      )}

      {showForm && (
        <form onSubmit={submitForm} className="mt-6 max-w-xl space-y-4 rounded-[4px] border border-hair p-5">
          <h2 className="font-display text-lg font-semibold text-cream">
            {editingPid ? `Редагування · ${editingPid}` : "Нова людина"}
          </h2>
          <div>
            <label className="block text-sm font-semibold text-cream" htmlFor="p-name">
              Ім’я та прізвище *
            </label>
            <input
              id="p-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Напр.: Іваненко Іван Іванович"
              className="mt-1 w-full py-2.5 text-cream"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-cream" htmlFor="p-birth">
                Дата народження
              </label>
              <input
                id="p-birth"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full py-2.5 text-cream"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cream" htmlFor="p-death">
                Дата загибелі
              </label>
              <input
                id="p-death"
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
                className="mt-1 w-full py-2.5 text-cream"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-cream" htmlFor="p-bio">
              Коротка біографія
            </label>
            <textarea
              id="p-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-[3px] border border-hair bg-transparent px-3 py-2.5 text-sm text-cream outline-none"
            />
          </div>

          <div>
            <p className="block text-sm font-semibold text-cream">Портрет</p>
            {portraitUrl ? (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={portraitUrl} alt="" className="h-20 w-16 rounded-[3px] object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPortraitUrl(null);
                    setNewPortraitId(null);
                  }}
                  className="text-xs text-ink-lo hover:text-crimson-bright"
                >
                  Прибрати
                </button>
              </div>
            ) : (
              <div
                onClick={() => portraitInputRef.current?.click()}
                role="button"
                tabIndex={0}
                className="mt-2 cursor-pointer rounded-[3px] border border-dashed border-hair-strong px-4 py-6 text-center text-sm text-ink-lo hover:border-cream"
              >
                {portraitBusy ? "Завантажуємо…" : "Натисніть, щоб додати фото"}
                <input
                  ref={portraitInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadPortrait(e.target.files[0])}
                />
              </div>
            )}
            {portraitError && <p className="mt-1.5 text-xs text-crimson-bright">{portraitError}</p>}
          </div>

          {formError && <p className="border-l-2 border-crimson-bright pl-4 text-sm text-ink">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-[3px] bg-cream px-4 py-2 text-sm font-semibold text-void hover:bg-white disabled:opacity-50"
          >
            {saving ? "Зберігаємо…" : editingPid ? "Зберегти зміни" : "Додати до реєстру"}
          </button>
          {!editingPid && (
            <p className="text-xs text-ink-lo">
              Запис з’явиться в реєстрі одразу — на відміну від заявки родини, черга модерації не потрібна.
            </p>
          )}
        </form>
      )}

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Пошук за ім’ям…"
        className="mt-6 w-full max-w-md py-2.5 text-cream"
      />

      <div className="mt-6 overflow-x-auto rounded-[4px] border border-hair">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-hair text-[11px] uppercase text-ink-lo">
              <th className="px-4 py-3 font-semibold">Ім’я</th>
              <th className="px-4 py-3 font-semibold">Роки</th>
              <th className="px-4 py-3 font-semibold">Підрозділ</th>
              <th className="px-4 py-3 font-semibold">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {filtered.map((d) => (
              <tr key={d.pid} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-semibold text-cream">{d.fullName}</td>
                <td className="px-4 py-3 text-ink">{formatDates(d.birthDate, d.deathDate)}</td>
                <td className="px-4 py-3 text-ink">{d.unitName ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      d.verificationStatus === "verified"
                        ? "bg-good/15 text-good"
                        : "bg-warn/15 text-warn"
                    }`}
                  >
                    {d.verificationStatus === "verified" ? "Верифіковано" : "На перевірці"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <button onClick={() => startEdit(d.pid)} className="text-ink hover:text-cream">
                      Редагувати
                    </button>
                    <Link href={`/defenders/${d.pid}`} className="text-gold hover:text-gold-soft">
                      Відкрити ↗
                    </Link>
                    <button
                      onClick={() => remove(d.pid, d.fullName)}
                      disabled={busyPid === d.pid}
                      className="text-ink-faint transition-colors hover:text-crimson-bright disabled:opacity-50"
                    >
                      Видалити
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-lo">
        Видалення доступне адміністраторам і фіксується в журналі змін.
      </p>
    </div>
  );
}
