"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import GlobeFallback from "./GlobeFallback";
import type { GlobeStatuses } from "./AirportGlobe";

const AirportGlobe = dynamic(() => import("./AirportGlobe"), {
  ssr: false,
  loading: () => <GlobeFallback />,
});

class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <GlobeFallback label="这台设备暂时无法显示立体地球仪" />;
    }
    return this.props.children;
  }
}

export default function AirportGlobeSlot({
  ready,
  statuses,
}: {
  ready: boolean;
  statuses: GlobeStatuses;
}) {
  return (
    <GlobeBoundary>
      <AirportGlobe ready={ready} statuses={statuses} />
    </GlobeBoundary>
  );
}
