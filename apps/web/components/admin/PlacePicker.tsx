"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const DEFAULT_CENTER: [number, number] = [30.2, 46.4];

/** Клікабельна міні-карта: клік ставить/пересуває маркер, координати йдуть назовні. */
export function PlacePicker({
  lon,
  lat,
  onPick,
}: {
  lon: number | null;
  lat: number | null;
  onPick: (lon: number, lat: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: lon !== null && lat !== null ? [lon, lat] : DEFAULT_CENTER,
      zoom: lon !== null && lat !== null ? 11 : 6.4,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const place = (ln: number, la: number) => {
      if (markerRef.current) {
        markerRef.current.setLngLat([ln, la]);
      } else {
        markerRef.current = new maplibregl.Marker({ color: "#df9b3b" }).setLngLat([ln, la]).addTo(map);
      }
    };

    if (lon !== null && lat !== null) place(lon, lat);

    map.on("click", (e) => {
      place(e.lngLat.lng, e.lngLat.lat);
      onPickRef.current(e.lngLat.lng, e.lngLat.lat);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Якщо координати змінили ззовні (напр. очистили форму) — синхронізуємо маркер.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lon === null || lat === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (markerRef.current) {
      markerRef.current.setLngLat([lon, lat]);
    } else {
      markerRef.current = new maplibregl.Marker({ color: "#df9b3b" }).setLngLat([lon, lat]).addTo(map);
    }
  }, [lon, lat]);

  return (
    <div>
      <div ref={containerRef} className="h-[320px] w-full overflow-hidden rounded-[4px] border border-hair" />
      <p className="mt-1.5 text-xs text-ink-lo">Клацніть по карті, щоб поставити точку</p>
    </div>
  );
}
