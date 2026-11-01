"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MeshPhongMaterial } from "three";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { AIRPORTS } from "@/data/airports";
import { DIRECTION_LABEL } from "@/lib/types";
import type { Airport, Direction } from "@/lib/types";
import { PACE, markerHex, paceOf } from "./pace";
import GlobeFallback from "./GlobeFallback";

export type GlobeStatuses = Record<string, { departure: number | null; arrival: number | null }>;

interface Props {
  ready: boolean;
  statuses: GlobeStatuses;
}

/** 固定的装饰航线，不来自报告，也不表示真实航班。 */
const ROUTES: Array<[string, string]> = [
  ["LHR", "JFK"],
  ["CDG", "NRT"],
  ["SIN", "LHR"],
  ["DXB", "SYD"],
  ["LAX", "NRT"],
  ["FRA", "PEK"],
  ["HKG", "CDG"],
  ["IST", "JFK"],
  ["SFO", "ICN"],
  ["AMS", "SIN"],
  ["BCN", "JFK"],
  ["DXB", "LHR"],
];

type Arc = {
  id: string;
  kind: "trail" | "plane";
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  shift: number;
};

type Tier = {
  arcs: number;
  pixel: number;
  rotate: boolean;
  flights: boolean;
};

type PinUi = {
  dot: HTMLSpanElement;
  rows: Record<Direction, { swatch: HTMLSpanElement; text: HTMLSpanElement }>;
};

function readTier(): Tier {
  const small = window.matchMedia("(max-width: 720px)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const save =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const low = save || cores <= 4;
  return {
    arcs: small || low ? 5 : ROUTES.length,
    pixel: small || low ? 1 : Math.min(window.devicePixelRatio || 1, 1.6),
    rotate: !reduce && !low,
    flights: !reduce && !low,
  };
}

function statusLine(ready: boolean, minutes: number | null): string {
  if (!ready) return "…";
  if (minutes === null) return "暂无数据";
  return `${minutes} 分钟 · ${PACE[paceOf(minutes)].label}`;
}

function buildArcs(limit: number, flights: boolean): Arc[] {
  const byCode = new Map(AIRPORTS.map((airport) => [airport.code, airport]));
  const arcs: Arc[] = [];
  ROUTES.slice(0, limit).forEach(([from, to], index) => {
    const a = byCode.get(from);
    const b = byCode.get(to);
    if (!a || !b) return;
    const base = {
      startLat: a.lat,
      startLng: a.lng,
      endLat: b.lat,
      endLng: b.lng,
      shift: index * 0.17,
    };
    arcs.push({ ...base, id: `${from}-${to}-trail`, kind: "trail" });
    if (flights) arcs.push({ ...base, id: `${from}-${to}-plane`, kind: "plane" });
  });
  return arcs;
}

export default function AirportGlobe({ ready, statuses }: Props) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const pins = useRef(new Map<string, PinUi>());
  const pushRef = useRef(router.push);
  pushRef.current = router.push;

  const globeMaterial = useMemo(
    () =>
      new MeshPhongMaterial({
        color: "#1b568f",
        emissive: "#0d3a66",
        emissiveIntensity: 0.42,
        shininess: 14,
      }),
    [],
  );

  const [tier, setTier] = useState<Tier | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [painted, setPainted] = useState(false);

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

  const arcs = useMemo(
    () => (tier ? buildArcs(tier.arcs, tier.flights) : []),
    [tier],
  );

  useEffect(() => {
    for (const airport of AIRPORTS) {
      const ui = pins.current.get(airport.code);
      if (!ui) continue;
      const row = statuses[airport.code];
      const departure = row ? row.departure : null;
      const arrival = row ? row.arrival : null;
      ui.dot.style.background = ready ? markerHex(departure, arrival) : "#C5CDD6";
      for (const direction of ["departure", "arrival"] as const) {
        const minutes = direction === "departure" ? departure : arrival;
        ui.rows[direction].swatch.style.background = ready ? PACE[paceOf(minutes)].hex : "#C5CDD6";
        ui.rows[direction].text.textContent = `${DIRECTION_LABEL[direction]} ${statusLine(ready, minutes)}`;
      }
    }
  }, [ready, statuses, painted]);

  const makePin = useCallback((airport: Airport) => {
    const cached = pins.current.get(airport.code);
    if (cached) return cached.dot.parentElement as HTMLButtonElement;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "globe-pin";
    button.setAttribute("aria-label", `${airport.code} ${airport.nameZh}`);

    const dot = document.createElement("span");
    dot.className = "globe-pin-dot";
    dot.style.background = "#C5CDD6";

    const tip = document.createElement("span");
    tip.className = "globe-tip";
    const code = document.createElement("span");
    code.className = "globe-tip-code";
    code.textContent = airport.code;
    const name = document.createElement("span");
    name.className = "globe-tip-name";
    name.textContent = airport.nameZh;
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

    button.append(dot, tip);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      pushRef.current(`/airports/${airport.code}`);
    });
    pins.current.set(airport.code, { dot, rows });
    return button;
  }, []);

  const renderPin = useCallback((datum: object) => makePin(datum as Airport), [makePin]);

  function onReady() {
    const globe = globeRef.current as
      | (GlobeMethods & {
          globeMaterial: () => {
            color: { set: (hex: string) => void };
            emissive: { set: (hex: string) => void };
            emissiveIntensity: number;
            shininess: number;
          };
        })
      | undefined;
    if (!globe || !tier) return;
    globe.renderer().setPixelRatio(tier.pixel);
    const controls = globe.controls();
    controls.autoRotate = tier.rotate;
    controls.autoRotateSpeed = tier.arcs < ROUTES.length ? 0.28 : 0.42;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.72;
    globe.pointOfView({ lat: 28, lng: 8, altitude: tier.arcs < ROUTES.length ? 1.95 : 1.62 }, 0);
    setPainted(true);
  }

  useEffect(() => {
    if (!painted || !tier) return;
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = tier.rotate;
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
        if (tier.rotate) controls.autoRotate = true;
      }, 900);
    };
    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerup", resume);
    el.addEventListener("pointercancel", resume);
    const observer = new IntersectionObserver(
      ([entry]) => {
        controls.autoRotate = tier.rotate && entry.isIntersecting;
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
  }, [painted, tier]);

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
              globeImageUrl={null}
              globeMaterial={globeMaterial}
              showGraticules
              showAtmosphere
              atmosphereColor="#FFC72C"
              atmosphereAltitude={0.16}
              onGlobeReady={onReady}
              htmlElementsData={AIRPORTS}
              htmlLat="lat"
              htmlLng="lng"
              htmlAltitude={0.012}
              htmlTransitionDuration={0}
              htmlElement={renderPin}
              arcsData={arcs}
              arcStartLat="startLat"
              arcStartLng="startLng"
              arcEndLat="endLat"
              arcEndLng="endLng"
              arcColor={(datum: object) =>
                (datum as Arc).kind === "plane" ? "#FFE08A" : "rgba(255,199,44,0.7)"
              }
              arcAltitude={0.32}
              arcStroke={(datum: object) => ((datum as Arc).kind === "plane" ? 0.7 : 0.35)}
              arcDashLength={(datum: object) => ((datum as Arc).kind === "plane" ? 0.18 : 1)}
              arcDashGap={(datum: object) => ((datum as Arc).kind === "plane" ? 0.82 : 0)}
              arcDashInitialGap={(datum: object) => (datum as Arc).shift}
              arcDashAnimateTime={(datum: object) =>
                (datum as Arc).kind === "plane" && tier.flights ? 4200 : 0
              }
              arcCurveResolution={tier.flights ? 48 : 24}
              arcsTransitionDuration={0}
            />
          </div>
        </>
      )}
    </div>
  );
}
