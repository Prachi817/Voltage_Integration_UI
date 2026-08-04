"use client";

import { useState, CSSProperties } from "react";
import { LidarViewer } from "@/components/LidarViewer";
// Voltage integration: Voltage Map tab.
import { HeatmapViewer } from "@/components/HeatmapViewer";
import { StatusPanel } from "@/components/StatusPanel";
import { ControlPanel } from "@/components/ControlPanel";
import { DiagnosticPanel } from "@/components/DiagnosticPanel";
import { LogPanel } from "@/components/LogPanel";
import { VoltageBadge } from "@/components/VoltageBadge";

type ViewTab = "lidar" | "heatmap";

// Voltage integration: LiDAR / Voltage Map tab switcher.
function ViewTabs({ active, onChange }: { active: ViewTab; onChange: (tab: ViewTab) => void }) {
  const tabStyle = (tab: ViewTab): CSSProperties => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: 13,
    background: active === tab ? "#00ff88" : "rgba(0,0,0,0.55)",
    color: active === tab ? "#0a0a0a" : "#fff",
  });

  return (
    <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10, display: "flex", gap: 8 }}>
      <button style={tabStyle("lidar")} onClick={() => onChange("lidar")}>
        LiDAR
      </button>
      <button style={tabStyle("heatmap")} onClick={() => onChange("heatmap")}>
        Voltage Map
      </button>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<ViewTab>("lidar");

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, position: "relative", minWidth: 0, overflow: "hidden" }}>
        {tab === "lidar" ? <LidarViewer /> : <HeatmapViewer />}
        <ViewTabs active={tab} onChange={setTab} />
        {tab === "lidar" && <VoltageBadge />}
      </div>
      <div
        style={{
          width: 320,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
          borderLeft: "1px solid #1e1e1e",
          minHeight: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <StatusPanel />
          <ControlPanel />
          <DiagnosticPanel />
        </div>
        <LogPanel />
      </div>
    </div>
  );
}
