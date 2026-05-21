"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pickupIcon = L.divIcon({
  html: `<div style="background:#22C55E;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">P</div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const dropIcon = L.divIcon({
  html: `<div style="background:#EF4444;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">D</div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function createDroneIcon(pulse = false) {
  return L.divIcon({
    html: `
      <div style="position:relative;">
        ${pulse ? `<div style="position:absolute;inset:-8px;background:rgba(14,165,233,0.25);border-radius:50%;animation:dronePulse 2s ease-in-out infinite;"></div>` : ""}
        <div style="background:#0EA5E9;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 3px 12px rgba(14,165,233,0.5);position:relative;z-index:2;transition:transform 0.3s;">🚁</div>
      </div>
    `,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

type MapProps = {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  pickupLabel?: string;
  dropLabel?: string;
  droneLat?: number | null;
  droneLng?: number | null;
  droneLabel?: string;
  height?: string;
  /** If true and drone exists, animate it along the route */
  animateDrone?: boolean;
  /** Delivery status — controls animation behavior */
  status?: string;
};

export default function LeafletMap({
  pickupLat, pickupLng, dropLat, dropLng,
  pickupLabel = "Pickup", dropLabel = "Drop-off",
  droneLat, droneLng, droneLabel = "Drone",
  height = "300px",
  animateDrone = false,
  status = "",
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const droneMarkerRef = useRef<L.Marker | null>(null);
  const trailRef = useRef<L.Polyline | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Generate intermediate waypoints for a more realistic flight path
  const getWaypoints = useCallback(() => {
    const steps = 80;
    const points: [number, number][] = [];

    const midLat = (pickupLat + dropLat) / 2;
    const midLng = (pickupLng + dropLng) / 2;
    // Offset to create a slight arc
    const latDiff = dropLat - pickupLat;
    const lngDiff = dropLng - pickupLng;
    const arcOffsetLat = -lngDiff * 0.1;
    const arcOffsetLng = latDiff * 0.1;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Quadratic bezier for arc path
      const controlLat = midLat + arcOffsetLat;
      const controlLng = midLng + arcOffsetLng;
      const lat = (1 - t) * (1 - t) * pickupLat + 2 * (1 - t) * t * controlLat + t * t * dropLat;
      const lng = (1 - t) * (1 - t) * pickupLng + 2 * (1 - t) * t * controlLng + t * t * dropLng;
      points.push([lat, lng]);
    }
    return points;
  }, [pickupLat, pickupLng, dropLat, dropLng]);

  // Determine starting progress based on status
  const getStartProgress = useCallback(() => {
    switch (status) {
      case "ASSIGNED": return 0;
      case "PICKED_UP": return 0.05;
      case "IN_TRANSIT": return 0.15;
      case "DELIVERED": return 1;
      default: return 0;
    }
  }, [status]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Inject pulse animation CSS
    if (!document.getElementById("drone-pulse-css")) {
      const style = document.createElement("style");
      style.id = "drone-pulse-css";
      style.textContent = `
        @keyframes dronePulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    const map = L.map(mapRef.current, {
      center: [(pickupLat + dropLat) / 2, (pickupLng + dropLng) / 2],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Pickup marker
    L.marker([pickupLat, pickupLng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup(`<b>📍 ${pickupLabel}</b>`);

    // Drop marker
    L.marker([dropLat, dropLng], { icon: dropIcon })
      .addTo(map)
      .bindPopup(`<b>🏁 ${dropLabel}</b>`);

    const isActive = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(status);
    const showDrone = droneLat && droneLng;

    if (animateDrone && isActive) {
      // Animated drone path
      const waypoints = getWaypoints();

      // Draw the full planned route (faded)
      L.polyline(waypoints, {
        color: "#94A3B8",
        weight: 2,
        dashArray: "6, 8",
        opacity: 0.4,
      }).addTo(map);

      // Drone trail (shows where it's been)
      const trail = L.polyline([], {
        color: "#0EA5E9",
        weight: 3,
        opacity: 0.8,
      }).addTo(map);
      trailRef.current = trail;

      // Drone marker
      const startProgress = getStartProgress();
      const startIdx = Math.floor(startProgress * (waypoints.length - 1));
      const startPos = waypoints[startIdx] || waypoints[0];

      const drone = L.marker(startPos, { icon: createDroneIcon(true), zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<b>🚁 ${droneLabel}</b><br/>In flight`);
      droneMarkerRef.current = drone;

      progressRef.current = startProgress;
      lastTimeRef.current = 0;

      // Speed: complete the journey in ~60 seconds
      const duration = 60000;

      function animate(timestamp: number) {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const elapsed = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        // Advance progress
        progressRef.current += elapsed / duration;

        // Loop back when reaching end
        if (progressRef.current >= 1) {
          progressRef.current = getStartProgress();
          if (trailRef.current) trailRef.current.setLatLngs([]);
        }

        const currentIdx = Math.min(
          Math.floor(progressRef.current * (waypoints.length - 1)),
          waypoints.length - 1
        );
        const nextIdx = Math.min(currentIdx + 1, waypoints.length - 1);

        // Sub-step interpolation for smoothness
        const segmentProgress = (progressRef.current * (waypoints.length - 1)) % 1;
        const currentLat = waypoints[currentIdx][0] + (waypoints[nextIdx][0] - waypoints[currentIdx][0]) * segmentProgress;
        const currentLng = waypoints[currentIdx][1] + (waypoints[nextIdx][1] - waypoints[currentIdx][1]) * segmentProgress;

        drone.setLatLng([currentLat, currentLng]);

        // Update trail
        const trailPoints = waypoints.slice(0, currentIdx + 1);
        trailPoints.push([currentLat, currentLng]);
        if (trailRef.current) trailRef.current.setLatLngs(trailPoints);

        animFrameRef.current = requestAnimationFrame(animate);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Static route line
      L.polyline(
        [[pickupLat, pickupLng], [dropLat, dropLng]],
        { color: "#0EA5E9", weight: 3, dashArray: "8, 8", opacity: 0.7 }
      ).addTo(map);

      // Static drone marker
      if (showDrone) {
        const delivered = status === "DELIVERED";
        const dronePos: [number, number] = delivered ? [dropLat, dropLng] : [droneLat!, droneLng!];
        L.marker(dronePos, { icon: createDroneIcon(false), zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup(`<b>🚁 ${droneLabel}</b>`);
      }
    }

    // Fit bounds
    const bounds = L.latLngBounds([
      [pickupLat, pickupLng],
      [dropLat, dropLng],
    ]);
    if (showDrone) bounds.extend([droneLat!, droneLng!]);
    map.fitBounds(bounds, { padding: [50, 50] });

    mapInstanceRef.current = map;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapInstanceRef.current = null;
      droneMarkerRef.current = null;
      trailRef.current = null;
    };
  }, [pickupLat, pickupLng, dropLat, dropLng, droneLat, droneLng, pickupLabel, dropLabel, droneLabel, animateDrone, status, getWaypoints, getStartProgress]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%" }}
      className="rounded-xl overflow-hidden border border-border-light"
    />
  );
}
