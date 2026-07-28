import type { DefenderSummary } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export interface DefenderDetail extends DefenderSummary {
  bio: string | null;
  candleCount: number;
}

/**
 * Результат запиту з явним розрізненням «порожньо» і «недоступно».
 *
 * Це принципово для меморіалу: якщо база недоступна, сторінка мусить
 * сказати про це чесно, а не показати демонстраційні імена так, ніби це
 * реальні загиблі. Мовчазний фолбэк на моки — неприпустимий.
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "unavailable" | "not_found" };

async function get<T>(path: string, revalidate = 30): Promise<Result<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (res.status === 404) return { ok: false, reason: "not_found" };
    if (!res.ok) return { ok: false, reason: "unavailable" };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function fetchDefenders(params?: {
  q?: string;
  unitId?: string;
  regionId?: string;
  limit?: number;
}): Promise<Result<DefenderSummary[]>> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.unitId) qs.set("unit_id", params.unitId);
  if (params?.regionId) qs.set("region_id", params.regionId);
  if (params?.limit) qs.set("limit", String(params.limit));

  const r = await get<{ items: DefenderSummary[] }>(`/defenders?${qs.toString()}`);
  return r.ok ? { ok: true, data: r.data.items } : r;
}

export async function fetchDefenderByPid(pid: string): Promise<Result<DefenderDetail>> {
  return get<DefenderDetail>(`/defenders/${encodeURIComponent(pid)}`);
}

export interface Stats {
  total: number;
  verified: number;
  pending: number;
  places: number;
  units: number;
}

export async function fetchStats(): Promise<Result<Stats>> {
  return get<Stats>("/stats", 60);
}

// ── Структура сайту (керується з адмінки) ──

export type MenuMap = Record<string, { label: string; href: string }[]>;

export async function fetchMenu(): Promise<Result<MenuMap>> {
  return get<MenuMap>("/site/menu", 300);
}

export interface RouteStop {
  name: string;
  text: string | null;
  placeId: string;
  /** [довгота, широта] з PostGIS — для перельоту камери */
  center: [number, number];
}
export interface MemoryRoute {
  slug: string | null;
  title: string;
  description: string | null;
  stops: RouteStop[];
}

export async function fetchRoutes(): Promise<Result<MemoryRoute[]>> {
  return get<MemoryRoute[]>("/site/routes", 300);
}

export interface PageBlockDto {
  id: string;
  type: string;
  label: string;
  props: Record<string, unknown>;
}

/** Блоки сторінки в порядку показу — керуються з /admin/pages. */
export async function fetchPageBlocks(page: string): Promise<Result<PageBlockDto[]>> {
  return get<PageBlockDto[]>(`/site/pages/${encodeURIComponent(page)}/blocks`, 30);
}

export interface NewsListItem {
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  publishedAt: string;
}

export interface NewsDetail extends NewsListItem {
  body: string;
  author: { displayName: string } | null;
}

export async function fetchNews(): Promise<Result<NewsListItem[]>> {
  return get<NewsListItem[]>("/news", 60);
}

export async function fetchNewsBySlug(slug: string): Promise<Result<NewsDetail>> {
  return get<NewsDetail>(`/news/${encodeURIComponent(slug)}`, 60);
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
}

const SETTINGS_DEFAULTS: SiteSettings = {
  siteName: "Незабутні",
  tagline: "Цифровий меморіал захисників Одеської області",
  contactEmail: "hello@nezabutni.ua",
};

/** Налаштування сайту з БД; якщо API недоступне — ті самі значення, що й дефолт бекенду. */
export async function fetchSettings(): Promise<SiteSettings> {
  const r = await get<SiteSettings>("/site/settings", 300);
  return r.ok ? r.data : SETTINGS_DEFAULTS;
}

export async function lightCandle(pid: string): Promise<{ candleCount: number } | null> {
  try {
    const res = await fetch(`${API_URL}/defenders/${pid}/candles`, { method: "POST" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
