"use client";

import { useState, CSSProperties } from "react";
import { LidarViewer } from "./LidarViewer";
import { CameraViewer } from "./CameraViewer";
import { VoltageBadge } from "./VoltageBadge";
// Voltage integration: Voltage Map tab.
import { HeatmapViewer } from "./HeatmapViewer";

type View = "lidar" | "camera" | "heatmap";

// Voltage integration: was a single cycling toggle (lidar/camera); switched to
// explicit per-tab buttons since a third state doesn't cycle cleanly with one button.
const TABS: { key: View; label: string }[] = [
  { key: "lidar", label: "LiDAR" },
  { key: "camera", label: "Camera" },
  { key: "heatmap", label: "Voltage Map" },
];

export function ViewportPanel() {
  const [view, setView] = useState<View>("lidar");

  const tabStyle = (key: View): CSSProperties => ({
    background: view === key ? "#00ff88" : "rgba(0,0,0,0.55)",
    color: view === key ? "#0a0a0a" : "#ccc",
    border: view === key ? "none" : "1px solid #333",
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 12,
    padding: "5px 12px",
    cursor: "pointer",
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {view === "lidar" && <LidarViewer />}
      {view === "camera" && <CameraViewer />}
      {/* Voltage integration: Voltage Map tab. */}
      {view === "heatmap" && <HeatmapViewer />}
      {/* VoltageMarker3D already shows voltage in the Voltage Map scene itself. */}
      {view !== "heatmap" && <VoltageBadge />}
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10, display: "flex", gap: 8 }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setView(key)} style={tabStyle(key)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
