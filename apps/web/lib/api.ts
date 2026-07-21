import type { DefenderSummary } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export interface DefenderDetail extends DefenderSummary {
  bio: string | null;
  candleCount: number;
}

export async function fetchDefenders(params?: {
  q?: string;
  unitId?: string;
  regionId?: string;
}): Promise<DefenderSummary[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.unitId) qs.set("unit_id", params.unitId);
  if (params?.regionId) qs.set("region_id", params.regionId);

  try {
    const res = await fetch(`${API_URL}/defenders?${qs.toString()}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items as DefenderSummary[];
  } catch {
    return [];
  }
}

export async function fetchDefenderByPid(pid: string): Promise<DefenderDetail | null> {
  try {
    const res = await fetch(`${API_URL}/defenders/${pid}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return (await res.json()) as DefenderDetail;
  } catch {
    return null;
  }
}

export async function lightCandle(pid: string): Promise<{ candleCount: number } | null> {
  const res = await fetch(`${API_URL}/defenders/${pid}/candles`, { method: "POST" });
  if (!res.ok) return null;
  return await res.json();
}
