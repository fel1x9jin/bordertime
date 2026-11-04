"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { AIRPORTS } from "@/data/airports";
import { appendCountryFlag } from "@/lib/flags";
import { routesFromAirport, showcaseRoutes, type DirectedRoute } from "@/data/routes";
import { DIRECTION_LABEL } from "@/lib/types";
import type { Airport, Direction } from "@/lib/types";
import { PACE, markerHex, paceOf } from "./pace";
import GlobeFallback from "./GlobeFallback";

export type GlobeStatuses = Record<string, { departure: number | null; arrival: number | null }>;

interface Props {
  ready: boolean;
  statuses: GlobeStatuses;
}

type FlightArc = DirectedRoute & { id: string; shift: number; kind: "line" | "flight" };

type Tier = {
  routeLimit: number;
  showcaseLimit: number;
  pixel: number;
  rotate: boolean;
  flights: boolean;
};

type PinUi = {
  root: HTMLDivElement;
  dot: HTMLSpanElement;
  rows: Record<Direction, { swatch: HTMLSpanElement; text: HTMLSpanElement }>;
};

const ARC_ALTITUDE = 0.18;

function readTier(): Tier {
  const small = window.matchMedia("(max-width: 720px)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const save =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const low = save || cores <= 4;
  return {
    routeLimit: small || low ? 8 : 16,
    showcaseLimit: small ? 6 : 8,
    pixel: small || low ? 1 : Math.min(window.devicePixelRatio || 1, 1.6),
    rotate: !reduce && !save,
    flights: !reduce,
  };
}

function statusLine(ready: boolean, minutes: number | null): string {
  if (!ready) return "…";
  if (minutes === null) return "暂无数据";
  return `${minutes} 分钟 · ${PACE[paceOf(minutes)].label}`;
}

function toVector(lat: number, lng: number) {
  const phi = (lat * Math.PI) / 180;
  const theta = (lng * Math.PI) / 180;
  return {
    x: Math.cos(phi) * Math.cos(theta),
    y: Math.cos(phi) * Math.sin(theta),
    z: Math.sin(phi),
  };
}

function toLatLng(vector: { x: number; y: number; z: number }) {
  const lat = (Math.asin(Math.max(-1, Math.min(1, vector.z))) * 180) / Math.PI;
  const lng = (Math.atan2(vector.y, vector.x) * 180) / Math.PI;
  return { lat, lng };
}

function along(route: DirectedRoute, t: number) {
  const start = toVector(route.startLat, route.startLng);
  const end = toVector(route.endLat, route.endLng);
  const dot = Math.max(-1, Math.min(1, start.x * end.x + start.y * end.y + start.z * end.z));
  const omega = Math.acos(dot);
  if (omega < 1e-4) return { lat: route.startLat, lng: route.startLng };
  const sinOmega = Math.sin(omega);
  const a = Math.sin((1 - t) * omega) / sinOmega;
  const b = Math.sin(t * omega) / sinOmega;
  return toLatLng({
    x: a * start.x + b * end.x,
    y: a * start.y + b * end.y,
    z: a * start.z + b * end.z,
  });
}

const PLANE_MARK =
  '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#0B1F36" d="M30 16.2 17 12.2V7.2l2.2-1.6V3.4L16 5.6 12.8 3.4v2.2L15 7.2v5L2 16.2v2.2l13-2.2v6.2l-3 1.8v2l4-1.4 4 1.4v-2l-3-1.8v-6.2l13 2.2v-2.2z"/></svg>';

export default function AirportGlobe({ ready, statuses }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const flightLayerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const pins = useRef(new Map<string, PinUi>());
  const selectRef = useRef<(code: string) => void>(() => {});
  const selectedAt = useRef(0);

  const [tier, setTier] = useState<Tier | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [painted, setPainted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  selectRef.current = (code) => {
    selectedAt.current = Date.now();
    setSelected(code);
  };

  useEffect(() => {
    const apply = () => setTier(readTier());
    apply();
    const small = window.matchMedia("(max-width: 720px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    small.addEventListener("change", apply);
    reduce.addEventListener("change", apply);
    return () => {
      small.removeEventListener("change", apply);
      reduce.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const routes = useMemo(() => {
    if (!tier) return [];
    const picked = selected
      ? routesFromAirport(selected, tier.routeLimit)
      : showcaseRoutes(tier.showcaseLimit);
    return picked.map((route, index) => ({
      ...route,
      id: `${route.from}-${route.to}`,
      shift: (index * 0.17) % 1,
    }));
  }, [selected, tier]);

  const selectedAirport = AIRPORTS.find((airport) => airport.code === selected) ?? null;
  const arcData = useMemo(() => {
    return routes.flatMap((route) => {
      const line: FlightArc = { ...route, id: `${route.id}-line`, kind: "line" };
      if (!tier?.flights) return [line];
      const flight: FlightArc = { ...route, id: `${route.id}-flight`, kind: "flight" };
      return [line, flight];
    });
  }, [routes, tier]);

  useEffect(() => {
    for (const airport of AIRPORTS) {
      const ui = pins.current.get(airport.code);
      if (!ui) continue;
      const row = statuses[airport.code];
      const departure = row ? row.departure : null;
      const arrival = row ? row.arrival : null;
      ui.dot.style.background = ready ? markerHex(departure, arrival) : "#C5CDD6";
      ui.root.classList.toggle("is-selected", airport.code === selected);
      for (const direction of ["departure", "arrival"] as const) {
        const minutes = direction === "departure" ? departure : arrival;
        ui.rows[direction].swatch.style.background = ready ? PACE[paceOf(minutes)].hex : "#C5CDD6";
        ui.rows[direction].text.textContent = `${DIRECTION_LABEL[direction]} ${statusLine(ready, minutes)}`;
      }
    }
  }, [ready, statuses, painted, selected]);

  const makePin = useCallback((airport: Airport) => {
    const cached = pins.current.get(airport.code);
    if (cached) return cached.root;

    const root = document.createElement("div");
    root.className = "globe-pin";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "globe-pin-hit";
    button.setAttribute("aria-label", `查看从${airport.nameZh}（${airport.countryZh}）出发的航线`);

    const dot = document.createElement("span");
    dot.className = "globe-pin-dot";
    dot.style.background = "#C5CDD6";
    button.append(dot);

    const tip = document.createElement("span");
    tip.className = "globe-tip";
    const code = document.createElement("span");
    code.className = "globe-tip-code";
    code.textContent = airport.code;
    const name = document.createElement("span");
    name.className = "globe-tip-name";
    name.textContent = airport.nameZh;
    appendCountryFlag(name, airport.countryCode, airport.countryZh);
    tip.append(code, name);

    const rows = {} as PinUi["rows"];
    for (const direction of ["departure", "arrival"] as const) {
      const row = document.createElement("span");
      row.className = "globe-tip-row";
      const swatch = document.createElement("span");
      swatch.className = "globe-tip-swatch";
      swatch.style.background = "#C5CDD6";
      const text = document.createElement("span");
      text.textContent = `${DIRECTION_LABEL[direction]} …`;
      row.append(swatch, text);
      tip.append(row);
      rows[direction] = { swatch, text };
    }

    const link = document.createElement("a");
    link.className = "globe-tip-link";
    link.href = `/airports/${airport.code}`;
    link.textContent = "查看边检排队";
    tip.append(link);

    root.addEventListener("pointerdown", (event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a")) return;
      event.stopPropagation();
      selectRef.current(airport.code);
    });

    root.append(button, tip);
    pins.current.set(airport.code, { root, dot, rows });
    return root;
  }, []);

  const renderPin = useCallback((datum: object) => makePin(datum as Airport), [makePin]);

  function onReady() {
    const globe = globeRef.current;
    if (!globe || !tier) return;
    globe.renderer().setPixelRatio(tier.pixel);
    const controls = globe.controls();
    controls.autoRotate = tier.rotate;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.72;
    globe.pointOfView({ lat: 22, lng: 105, altitude: tier.routeLimit < 16 ? 1.95 : 1.62 }, 0);
    setPainted(true);
  }

  useEffect(() => {
    if (!painted || !tier) return;
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = tier.rotate && !selected;
    const el = wrapRef.current;
    if (!el) return;
    let resumeId = 0;
    const pause = () => {
      controls.autoRotate = false;
      window.clearTimeout(resumeId);
    };
    const resume = () => {
      window.clearTimeout(resumeId);
      resumeId = window.setTimeout(() => {
        if (tier.rotate && !selected) controls.autoRotate = true;
      }, 900);
    };
    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerup", resume);
    el.addEventListener("pointercancel", resume);
    const observer = new IntersectionObserver(
      ([entry]) => {
        controls.autoRotate = tier.rotate && !selected && entry.isIntersecting;
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => {
      window.clearTimeout(resumeId);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("pointerup", resume);
      el.removeEventListener("pointercancel", resume);
      observer.disconnect();
    };
  }, [painted, tier, selected]);

  useEffect(() => {
    if (!painted || !selected) return;
    const airport = AIRPORTS.find((item) => item.code === selected);
    const globe = globeRef.current;
    if (!airport || !globe) return;
    globe.pointOfView({ lat: airport.lat, lng: airport.lng, altitude: 1.72 }, 900);
  }, [painted, selected]);

  useEffect(() => {
    const globe = globeRef.current;
    const layer = flightLayerRef.current;
    if (!painted || !globe || !layer || routes.length === 0) return;

    const marks = routes.map(() => {
      const mark = document.createElement("span");
      mark.className = "globe-flight";
      mark.innerHTML = PLANE_MARK;
      layer.append(mark);
      return mark;
    });

    const place = (index: number, t: number) => {
      const route = routes[index];
      const here = along(route, t);
      const next = along(route, Math.min(0.985, t + 0.025));
      const altitude = 0.02 + ARC_ALTITUDE * Math.sin(Math.PI * t);
      const coords = globe.getCoords(here.lat, here.lng, altitude);
      const camera = globe.camera().position;
      const facing = coords.x * camera.x + coords.y * camera.y + coords.z * camera.z;
      const mark = marks[index];
      if (facing <= 0) {
        mark.style.visibility = "hidden";
        return;
      }
      const from = globe.getScreenCoords(here.lat, here.lng, altitude);
      const to = globe.getScreenCoords(next.lat, next.lng, altitude);
      const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
      mark.style.visibility = "visible";
      mark.style.left = `${from.x}px`;
      mark.style.top = `${from.y}px`;
      const icon = mark.firstElementChild as HTMLElement | null;
      if (icon) icon.style.transform = `rotate(${angle}deg)`;
    };

    if (!tier?.flights) {
      routes.forEach((_, index) => place(index, 0.42));
      return () => marks.forEach((mark) => mark.remove());
    }

    let frame = 0;
    const started = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - started) / 1000;
      routes.forEach((route, index) => {
        const t = (elapsed / 7.5 + route.shift) % 1;
        place(index, t);
      });
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(frame);
      marks.forEach((mark) => mark.remove());
    };
  }, [painted, routes, tier]);

  return (
    <div ref={wrapRef} className="relative h-full w-full touch-none">
      {(size.w < 10 || !tier) && <GlobeFallback />}
      {size.w >= 10 && tier && (
        <>
          {!painted && (
            <div className="absolute inset-0">
              <GlobeFallback />
            </div>
          )}
          <div className={painted ? "h-full w-full opacity-100 transition-opacity duration-300" : "h-full w-full opacity-0"}>
            <Globe
              ref={globeRef}
              width={size.w}
              height={size.h}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="/earth-blue-marble.jpg"
              showGraticules={false}
              showAtmosphere
              atmosphereColor="#b9d7ff"
              atmosphereAltitude={0.18}
              onGlobeReady={onReady}
              onGlobeClick={() => {
                if (Date.now() - selectedAt.current < 500) return;
                setSelected(null);
              }}
              htmlElementsData={AIRPORTS}
              htmlLat="lat"
              htmlLng="lng"
              htmlAltitude={0.012}
              htmlTransitionDuration={0}
              htmlElement={renderPin}
              arcsData={arcData}
              arcStartLat="startLat"
              arcStartLng="startLng"
              arcEndLat="endLat"
              arcEndLng="endLng"
              arcLabel={(datum: object) => {
                const arc = datum as FlightArc;
                if (arc.kind !== "line") return "";
                return `${arc.fromCity} → ${arc.toCity}`;
              }}
              arcColor={(datum: object) =>
                (datum as FlightArc).kind === "flight" ? "#fffaf0" : "rgba(255, 206, 72, 0.9)"
              }
              arcAltitude={ARC_ALTITUDE}
              arcStroke={(datum: object) => ((datum as FlightArc).kind === "flight" ? 1.5 : 0.42)}
              arcDashLength={(datum: object) => ((datum as FlightArc).kind === "flight" ? 0.05 : 1)}
              arcDashGap={(datum: object) => ((datum as FlightArc).kind === "flight" ? 0.95 : 0)}
              arcDashInitialGap={(datum: object) => ((datum as FlightArc).kind === "flight" ? (datum as FlightArc).shift : 0)}
              arcDashAnimateTime={(datum: object) =>
                (datum as FlightArc).kind === "flight" && tier.flights ? 6400 : 0
              }
              arcCurveResolution={48}
              arcsTransitionDuration={400}
            />
          </div>
          <div
            ref={flightLayerRef}
            className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
          />
          {selectedAirport && (
            <div className="absolute inset-x-2 bottom-1 z-40 flex items-center justify-between gap-2 rounded-2xl bg-white/95 px-3 py-2 text-xs text-ink shadow-card">
              <p className="min-w-0 truncate">
                <span className="font-semibold">{selectedAirport.code}</span>
                <span className="text-slate-600"> {selectedAirport.cityZh}出发 · {routes.length} 条航线</span>
              </p>
              <Link href={`/airports/${selectedAirport.code}`} className="shrink-0 font-semibold underline">
                查看排队
              </Link>
              <button type="button" onClick={() => setSelected(null)} className="shrink-0 text-slate-500">
                关闭
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
