"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

import type { ParkMapProps } from "@/components/contracts";

import styles from "./ParkMap.module.css";

const MapClient = dynamic<ParkMapProps>(() => import("./ParkMapClient"), {
  ssr: false,
  loading: () => (
    <div className={styles.status} role="status">
      Loading map…
    </div>
  ),
});

interface MapErrorBoundaryProps {
  children: ReactNode;
}

interface MapErrorBoundaryState {
  failed: boolean;
}

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className={`${styles.status} ${styles.error}`} role="alert">
          The map could not be loaded. Park details are still available in the list.
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ParkMap({
  parks,
  selectedSlug,
  onSelect,
  userLocation,
  className,
}: ParkMapProps) {
  return (
    <div
      data-testid="park-map"
      className={`${styles.root} ${className ?? ""}`}
      role="region"
      aria-label={`Map of ${parks.length} dog ${parks.length === 1 ? "park" : "parks"}`}
    >
      <MapErrorBoundary>
        <MapClient
          parks={parks}
          selectedSlug={selectedSlug}
          onSelect={onSelect}
          userLocation={userLocation}
        />
      </MapErrorBoundary>
    </div>
  );
}
