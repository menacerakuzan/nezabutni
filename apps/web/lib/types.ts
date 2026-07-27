// Типи узгоджені з docs/db/schema.dbml та docs/api/openapi.yaml

export type VerificationStatus = "draft" | "pending" | "verified" | "disputed" | "archived";

export interface DefenderSummary {
  pid: string;
  fullName: string;
  callsign: string | null;
  birthDate: string | null;
  deathDate: string | null;
  unitName: string | null;
  regionName: string | null;
  portraitUrl: string | null;
  excerpt: string;
  verificationStatus: VerificationStatus;
  /** Реальні координати з API (перше повʼязане місце), або null. */
  lon: number | null;
  lat: number | null;
}
