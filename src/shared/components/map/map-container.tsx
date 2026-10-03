"use client";

import { createLeafletContext, LeafletContext, type LeafletContextInterface } from "@react-leaflet/core";
import type { MapOptions } from "leaflet";
import L from "leaflet";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type MapContainerProps = {
  center: [number, number];
  zoom: number;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
} & Omit<MapOptions, "center" | "zoom">;

/**
 * Activity-safe drop-in replacement for react-leaflet's MapContainer.
 *
 * Next.js keeps visited routes mounted in a hidden <Activity> tree, so effects
 * are destroyed on navigation and re-run when the user returns — while the DOM
 * (and therefore the Leaflet container) stays attached. react-leaflet v5
 * destroys the map in cleanup and never recreates it, so the layer effects
 * that re-run on return call addLayer() on a dead map ("appendChild" of an
 * undefined pane, then "Map container is being reused"). StrictMode's
 * simulated remount fails the same way.
 *
 * Two differences from upstream keep the map alive across those cycles:
 * - the map is created per effect cycle, not once in a ref callback;
 * - cleanup only destroys the map when the container is actually detached
 *   from the document (real unmount). While the node stays connected the map
 *   is kept alive for the layer effects that re-attach when the tree is
 *   shown again — which also preserves the user's viewport across routes.
 */
export function MapContainer({
  center,
  zoom,
  children,
  style,
  className,
  ...options
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [context, setContext] = useState<LeafletContextInterface | null>(null);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (node == null) return;

    let map = mapRef.current;
    if (map == null || map.getContainer() !== node) {
      map = new L.Map(node, options);
      map.setView(center, zoom);
      mapRef.current = map;
      setContext(createLeafletContext(map));
    } else if (context?.map !== map) {
      setContext(createLeafletContext(map));
    }

    return () => {
      const container = map?.getContainer();
      if (container == null || container.isConnected) return;
      map?.remove();
      mapRef.current = null;
    };
    // center/zoom are initial values only; later moves go through child
    // components (Recenter/FitMarkers) holding the map handle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className={className} style={style}>
      {context ? <LeafletContext value={context}>{children}</LeafletContext> : null}
    </div>
  );
}
