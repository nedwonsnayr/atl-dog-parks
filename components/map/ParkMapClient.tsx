"use client";

import { type MutableRefObject, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { ParkMapProps } from "@/components/contracts";
import { publicEnv } from "@/lib/env";
import { appleMapsUrl, googleMapsUrl } from "@/lib/mapLinks";
import type { LatLng } from "@/lib/geo";
import type { Park } from "@/lib/schema";

import styles from "./ParkMap.module.css";
import { ATLANTA_CENTER, findPark, parksToFeatureCollection } from "./mapData";

const PARK_SOURCE_ID = "atl-dog-parks";
const CLUSTERS_LAYER_ID = "atl-dog-park-clusters";
const CLUSTER_COUNT_LAYER_ID = "atl-dog-park-cluster-count";
const PARKS_LAYER_ID = "atl-dog-park-points";
const SELECTED_PARK_LAYER_ID = "atl-dog-park-selected";
const OPEN_FREE_MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DEMO_STYLE = "https://demotiles.maplibre.org/style.json";

maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

const STYLE_URLS = Array.from(
  new Set([publicEnv.NEXT_PUBLIC_MAP_STYLE_URL, OPEN_FREE_MAP_STYLE, DEMO_STYLE]),
);

type MapStatus = "loading" | "ready" | "error";

function addParkLayers(map: MapLibreMap, parks: readonly Park[]) {
  map.addSource(PARK_SOURCE_ID, {
    type: "geojson",
    data: parksToFeatureCollection(parks),
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 48,
  });

  map.addLayer({
    id: CLUSTERS_LAYER_ID,
    type: "circle",
    source: PARK_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": ["step", ["get", "point_count"], "#0f766e", 10, "#047857", 25, "#166534"],
      "circle-radius": ["step", ["get", "point_count"], 18, 10, 23, 25, 28],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });

  map.addLayer({
    id: CLUSTER_COUNT_LAYER_ID,
    type: "symbol",
    source: PARK_SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-size": 12,
    },
    paint: {
      "text-color": "#ffffff",
    },
  });

  map.addLayer({
    id: PARKS_LAYER_ID,
    type: "circle",
    source: PARK_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#15803d",
      "circle-radius": 8,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });

  map.addLayer({
    id: SELECTED_PARK_LAYER_ID,
    type: "circle",
    source: PARK_SOURCE_ID,
    filter: ["==", ["get", "slug"], ""],
    paint: {
      "circle-color": "#f59e0b",
      "circle-radius": 11,
      "circle-stroke-color": "#78350f",
      "circle-stroke-width": 3,
    },
  });
}

function setSelectedLayer(map: MapLibreMap, slug?: string) {
  if (map.getLayer(SELECTED_PARK_LAYER_ID)) {
    map.setFilter(SELECTED_PARK_LAYER_ID, ["==", ["get", "slug"], slug ?? ""]);
  }
}

function appendLink(
  parent: HTMLElement,
  label: string,
  href: string,
  testId?: string,
  external = false,
) {
  const link = document.createElement("a");
  link.className = styles.popupLink;
  link.href = href;
  link.textContent = label;
  if (testId) link.dataset.testid = testId;
  if (external) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  parent.append(link);
}

function createPopupContent(park: Park): HTMLElement {
  const content = document.createElement("section");
  content.className = styles.popup;
  content.dataset.testid = "map-popup";
  content.setAttribute("aria-label", `${park.name} map details`);

  const title = document.createElement("h2");
  title.className = styles.popupTitle;
  title.textContent = park.name;
  content.append(title);

  const address = document.createElement("p");
  address.className = styles.popupAddress;
  address.textContent = `${park.address} · ${park.neighborhood}`;
  content.append(address);

  const links = document.createElement("p");
  links.className = styles.popupLinks;
  appendLink(links, "View details", `/parks/${encodeURIComponent(park.slug)}`, "map-popup-link");
  appendLink(links, "Google Maps", googleMapsUrl(park), undefined, true);
  appendLink(links, "Apple Maps", appleMapsUrl(park), undefined, true);
  content.append(links);

  return content;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function showPark(map: MapLibreMap, popup: Popup, park: Park, move: boolean) {
  setSelectedLayer(map, park.slug);
  popup.setLngLat([park.lng, park.lat]).setDOMContent(createPopupContent(park)).addTo(map);

  if (move) {
    map.easeTo({
      center: [park.lng, park.lat],
      zoom: Math.max(map.getZoom(), 14),
      duration: prefersReducedMotion() ? 0 : 500,
    });
  }
}

function fitParks(map: MapLibreMap, parks: readonly Park[]) {
  if (parks.length === 0) {
    map.jumpTo({ center: ATLANTA_CENTER, zoom: 10 });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();
  parks.forEach((park) => bounds.extend([park.lng, park.lat]));
  map.fitBounds(bounds, {
    padding: 48,
    maxZoom: 13,
    duration: prefersReducedMotion() ? 0 : 500,
  });
}

function syncUserLocation(
  map: MapLibreMap,
  markerRef: MutableRefObject<maplibregl.Marker | null>,
  location: LatLng | null | undefined,
) {
  if (!location) {
    markerRef.current?.remove();
    markerRef.current = null;
    return;
  }

  if (!markerRef.current) {
    const element = document.createElement("div");
    element.className = styles.locationMarker;
    element.dataset.testid = "user-location-marker";
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", "Your approximate location");
    markerRef.current = new maplibregl.Marker({ element })
      .setLngLat([location.lng, location.lat])
      .addTo(map);
  }

  // Coordinates only enter MapLibre's in-memory marker state; they are not added to tile requests.
  markerRef.current.setLngLat([location.lng, location.lat]);
}

function pointSlug(feature: MapGeoJSONFeature | undefined): string | undefined {
  const slug = feature?.properties.slug;
  return typeof slug === "string" ? slug : undefined;
}

export default function ParkMapClient({
  parks,
  selectedSlug,
  onSelect,
  userLocation,
}: ParkMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const readyRef = useRef(false);
  const parksRef = useRef(parks);
  const selectedSlugRef = useRef(selectedSlug);
  const onSelectRef = useRef(onSelect);
  const userLocationRef = useRef(userLocation);
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    parksRef.current = parks;
    selectedSlugRef.current = selectedSlug;
    onSelectRef.current = onSelect;
    userLocationRef.current = userLocation;
  }, [onSelect, parks, selectedSlug, userLocation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let attemptId = 0;

    const startMap = (styleIndex: number) => {
      if (disposed) return;
      if (styleIndex >= STYLE_URLS.length) {
        popupRef.current?.remove();
        popupRef.current = null;
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
        mapRef.current?.remove();
        mapRef.current = null;
        setStatus("error");
        return;
      }

      const currentAttempt = ++attemptId;
      readyRef.current = false;
      popupRef.current?.remove();
      userMarkerRef.current?.remove();
      mapRef.current?.remove();

      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        focusAfterOpen: true,
        maxWidth: "18rem",
      });
      popupRef.current = popup;

      let map: MapLibreMap;
      try {
        map = new maplibregl.Map({
          container,
          style: STYLE_URLS[styleIndex],
          center: ATLANTA_CENTER,
          zoom: 10,
          attributionControl: { compact: true },
        });
      } catch {
        startMap(styleIndex + 1);
        return;
      }

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      const tryNextStyle = () => {
        if (disposed || readyRef.current || currentAttempt !== attemptId) return;
        ++attemptId;
        queueMicrotask(() => startMap(styleIndex + 1));
      };

      map.on("error", tryNextStyle);
      map.once("load", () => {
        if (disposed || currentAttempt !== attemptId) return;

        try {
          addParkLayers(map, parksRef.current);

          map.on("click", CLUSTERS_LAYER_ID, async (event) => {
            const clusterId = Number(event.features?.[0]?.properties.cluster_id);
            if (!Number.isFinite(clusterId)) return;

            const source = map.getSource(PARK_SOURCE_ID) as GeoJSONSource;
            const zoom = await source.getClusterExpansionZoom(clusterId);
            map.easeTo({
              center: (event.features?.[0]?.geometry as GeoJSON.Point).coordinates as [
                number,
                number,
              ],
              zoom,
              duration: prefersReducedMotion() ? 0 : 500,
            });
          });

          map.on("click", PARKS_LAYER_ID, (event) => {
            const slug = pointSlug(event.features?.[0]);
            const park = findPark(parksRef.current, slug);
            if (!park) return;

            showPark(map, popup, park, false);
            onSelectRef.current?.(park.slug);
          });

          [CLUSTERS_LAYER_ID, PARKS_LAYER_ID].forEach((layerId) => {
            map.on("mouseenter", layerId, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", layerId, () => {
              map.getCanvas().style.cursor = "";
            });
          });

          readyRef.current = true;
          syncUserLocation(map, userMarkerRef, userLocationRef.current);
          const selectedPark = findPark(parksRef.current, selectedSlugRef.current);
          if (selectedPark) {
            showPark(map, popup, selectedPark, true);
          } else {
            fitParks(map, parksRef.current);
          }
          setStatus("ready");
        } catch (error) {
          console.error("Map initialization failed", error);
          readyRef.current = false;
          startMap(styleIndex + 1);
        }
      });
    };

    startMap(0);

    return () => {
      disposed = true;
      ++attemptId;
      readyRef.current = false;
      popupRef.current?.remove();
      popupRef.current = null;
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const source = map.getSource(PARK_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(parksToFeatureCollection(parks));
    if (!findPark(parks, selectedSlug)) fitParks(map, parks);
  }, [parks, selectedSlug]);

  useEffect(() => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!map || !popup || !readyRef.current) return;

    const park = findPark(parks, selectedSlug);
    if (park) {
      showPark(map, popup, park, true);
    } else {
      setSelectedLayer(map);
      popup.remove();
    }
  }, [parks, selectedSlug]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    syncUserLocation(map, userMarkerRef, userLocation);
  }, [userLocation]);

  return (
    <>
      <div ref={containerRef} className={styles.canvas} aria-hidden={status !== "ready"} />
      {status === "loading" && (
        <div className={styles.status} role="status">
          Loading map…
        </div>
      )}
      {status === "error" && (
        <div className={`${styles.status} ${styles.error}`} role="alert">
          The map is unavailable right now. Park details are still available in the list.
        </div>
      )}
    </>
  );
}
