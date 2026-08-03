"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MEDIA } from "../lib/media";
import { fetchRoutes, type MemoryRoute } from "../lib/api";

interface PlaceFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: { id: string; name: string; place_type: string; region_name: string | null; cover_media_id: string | null };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const TYPE_LABEL: Record<string, string> = {
  battle: "Місце бою",
  memorial: "Меморіал",
  burial: "Поховання",
  monument: "Пам’ятник",
  museum_site: "Музейна локація",
  frontline_segment: "Лінія фронту",
  alley_of_glory: "Алея слави",
};
// Приглушений темний стиль CARTO — тимчасовий, до власного тайл-сервера.
const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";


export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selected, setSelected] = useState<PlaceFeature["properties"] | null>(null);
  const [count, setCount] = useState(0);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(Object.keys(TYPE_LABEL)));
  const [routeStep, setRouteStep] = useState<number | null>(null);
  const [pano, setPano] = useState<string | null>(null);
  // Маршрут пам'яті приходить з CMS (memory_route + місця), а не з коду
  const [route, setRoute] = useState<MemoryRoute | null>(null);

  useEffect(() => {
    fetchRoutes().then((r) => {
      if (r.ok && r.data.length) setRoute(r.data[0]!);
    });
  }, []);

  // фільтр за типами
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("unclustered-point")) return;
    const list = [...activeTypes];
    map.setFilter("unclustered-point", [
      "all",
      ["!", ["has", "point_count"]],
      ["in", ["get", "place_type"], ["literal", list]],
    ] as never);
  }, [activeTypes]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [30.2, 46.4],
      zoom: 6.4,
      pitch: 30,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      let data: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
      try {
        const res = await fetch(`${apiUrl}/places`);
        if (res.ok) data = await res.json();
      } catch {
        /* карта лишається порожньою без падіння */
      }
      setCount(data.features.length);

      map.addSource("places", { type: "geojson", data, cluster: true, clusterRadius: 44 });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0B2A4D",
          "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 15, 26],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#df9b3b",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: { "text-field": "{point_count_abbreviated}", "text-size": 13 },
        paint: { "text-color": "#fff2e8" },
      });
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#EFC178",
          "circle-radius": 6,
          "circle-stroke-width": 6,
          "circle-stroke-color": "rgba(239,193,120,0.25)",
        },
      });

      map.on("click", "unclustered-point", (e) => {
        const f = e.features?.[0] as unknown as PlaceFeature | undefined;
        if (f) {
          setSelected(f.properties);
          map.flyTo({
            center: (f.geometry as unknown as { coordinates: [number, number] }).coordinates,
            zoom: Math.max(map.getZoom(), 12),
            pitch: 50,
            duration: 1600,
            essential: true,
          });
        }
      });
      map.on("click", "clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("places") as maplibregl.GeoJSONSource;
        if (clusterId !== undefined) {
          const zoom = await source.getClusterExpansionZoom(clusterId);
          map.easeTo({
            center: (features[0]!.geometry as unknown as { coordinates: [number, number] }).coordinates,
            zoom,
            duration: 1200,
          });
        }
      });
      map.on("mouseenter", "unclustered-point", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "unclustered-point", () => (map.getCanvas().style.cursor = ""));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const flyToStep = (i: number) => {
    const map = mapRef.current;
    const stop = route?.stops[i];
    if (!map || !stop) return;
    setRouteStep(i);
    setSelected(null);
    // Ракурс варіюємо за індексом — обліт не виглядає механічним
    map.flyTo({
      center: stop.center,
      zoom: 13.5,
      pitch: 45 + (i % 3) * 5,
      bearing: i % 2 ? 15 : -20,
      duration: 3200,
      essential: true,
      curve: 1.6,
    });
  };
  const exitRoute = () => {
    setRouteStep(null);
    mapRef.current?.flyTo({ center: [30.2, 46.4], zoom: 6.4, pitch: 30, bearing: 0, duration: 2400 });
  };

  const toggleType = (t: string) =>
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <div className="relative overflow-hidden rounded-[4px] border border-hair">
      <div ref={containerRef} className="h-[640px] w-full" />

      {/* лічильник */}
      <div className="pointer-events-none absolute left-4 top-4 rounded-[3px] border border-hair bg-black/70 px-3.5 py-1.5 text-xs text-cream backdrop-blur-sm">
        {count} {count === 1 ? "місце" : "місць"} пам’яті
      </div>

      {/* фільтри типів */}
      <div className="absolute left-4 top-14 flex max-w-[70%] flex-wrap gap-1.5">
        {(["battle", "memorial", "monument", "museum_site", "alley_of_glory"] as const).map((t) => {
          const label = TYPE_LABEL[t]!;
          return (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={`rounded-[3px] border px-2.5 py-1 text-[11px] backdrop-blur-sm transition-colors ${
              activeTypes.has(t)
                ? "border-gold/60 bg-gold/15 text-gold-soft"
                : "border-hair bg-black/50 text-ink-lo hover:text-ink"
            }`}
          >
            {label}
          </button>
          );
        })}
      </div>

      {/* Маршрут пам’яті — з CMS; якщо маршрутів немає, картку не показуємо */}
      {route && route.stops.length > 0 && (
      <div className="absolute bottom-4 left-4 w-[min(88vw,340px)] rounded-[4px] border border-hair-strong bg-[#0B0F16]/95 backdrop-blur-md">
        {routeStep === null ? (
          <div className="p-5">
            <span className="caption">Маршрут пам’яті</span>
            <h3 className="mt-2 font-display text-xl font-semibold text-cream">
              {route.title}
            </h3>
            <p className="mt-1.5 text-sm text-ink">
              {route.description ?? `${route.stops.length} місць пам’яті — кінематографічний обліт.`}
            </p>
            <button
              onClick={() => flyToStep(0)}
              className="mt-4 rounded-[3px] bg-cream px-4 py-2 text-sm font-medium text-void transition-colors hover:bg-white"
            >
              Розпочати обліт →
            </button>
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="caption">
                Зупинка {routeStep + 1} / {route?.stops.length ?? 0}
              </span>
              <button onClick={exitRoute} className="text-xs text-ink-lo hover:text-cream">
                Завершити ✕
              </button>
            </div>
            <h3 className="mt-2 font-display text-xl font-semibold text-cream">
              {route?.stops[routeStep]?.name}
            </h3>
            <p className="mt-1.5 text-sm text-ink">{route?.stops[routeStep]?.text}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => flyToStep(Math.max(0, routeStep - 1))}
                disabled={routeStep === 0}
                className="rounded-[3px] border border-hair px-3.5 py-2 text-sm text-ink transition-colors hover:border-cream hover:text-cream disabled:opacity-40"
              >
                ← Назад
              </button>
              {routeStep < (route?.stops.length ?? 0) - 1 ? (
                <button
                  onClick={() => flyToStep(routeStep + 1)}
                  className="rounded-[3px] bg-cream px-3.5 py-2 text-sm font-medium text-void transition-colors hover:bg-white"
                >
                  Далі →
                </button>
              ) : (
                <button
                  onClick={exitRoute}
                  className="rounded-[3px] bg-cream px-3.5 py-2 text-sm font-medium text-void transition-colors hover:bg-white"
                >
                  Повернутися ⌂
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* картка місця */}
      {selected && (
        <div className="absolute bottom-4 right-4 w-[min(88vw,320px)] overflow-hidden rounded-[4px] border border-hair-strong bg-[#0B0F16]/95 backdrop-blur-md">
          <div className="relative h-36">
            {selected.cover_media_id ? (
              <img
                src={`${API_URL}/media/file/${selected.cover_media_id}`}
                alt=""
                className="h-full w-full object-cover [filter:saturate(0.55)_brightness(0.8)]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
                <p className="px-6 text-center text-xs text-ink-faint">Фото ще не додано</p>
              </div>
            )}
            <button
              onClick={() => setSelected(null)}
              aria-label="Закрити"
              className="absolute right-3 top-2.5 text-cream/80 transition-colors hover:text-cream"
            >
              ✕
            </button>
          </div>
          <div className="p-5">
            <p className="caption">{TYPE_LABEL[selected.place_type] ?? selected.place_type}</p>
            <h3 className="mt-1.5 font-display text-lg font-semibold text-cream">{selected.name}</h3>
            {selected.region_name && <p className="mt-1 text-sm text-ink">{selected.region_name}</p>}
            <button
              onClick={() => setPano(selected.name)}
              className="mt-4 inline-flex items-center gap-2 text-sm text-gold transition-colors hover:text-gold-soft"
            >
              Панорамний перегляд →
            </button>
          </div>
        </div>
      )}

      {/* панорама (демо: перетягуваний широкий кадр) */}
      {pano && <PanoModal title={pano} onClose={() => setPano(null)} />}
    </div>
  );
}

/** Простий панорамний в’ювер: широкий кадр, який тягнеться мишею. */
function PanoModal({ title, onClose }: { title: string; onClose: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/95" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <span className="caption">Панорама · демонстрація</span>
          <h3 className="font-display text-lg font-semibold text-cream">{title}</h3>
        </div>
        <button onClick={onClose} aria-label="Закрити" className="text-2xl text-ink-lo hover:text-cream">
          ✕
        </button>
      </div>
      <div
        ref={trackRef}
        className="flex-1 cursor-grab overflow-x-auto overflow-y-hidden [scrollbar-width:none]"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, left: trackRef.current!.scrollLeft };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current && trackRef.current) {
            trackRef.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
          }
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <img
          src={MEDIA.cemeteryLanterns.replace("w=1600", "w=2400")}
          alt="Панорамний кадр місця пам’яті"
          className="h-full w-auto max-w-none select-none [filter:saturate(0.6)_brightness(0.85)]"
          draggable={false}
        />
      </div>
      <p className="px-6 py-4 text-center text-xs text-ink-lo">
        Тягніть кадр убік · Esc — закрити · У продакшні тут — Street View / власні 360°-панорами
      </p>
    </div>
  );
}
