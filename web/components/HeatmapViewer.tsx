"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useClassifiedLidarStream } from "@/hooks/useClassifiedLidarStream";
import { useRobotState } from "@/hooks/useRobotState";
import { usePathTrail } from "@/hooks/usePathTrail";
import { PointCloud } from "@/components/PointCloud";
import { PathTrail } from "@/components/PathTrail";
import { VoltageMarker3D } from "@/components/VoltageMarker3D";
import { HEATMAP_WS_URL } from "@/lib/constants";

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(0,0,0,0.55)",
        padding: "6px 12px",
        borderRadius: 6,
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: connected ? "#00ff88" : "#ff4444",
          display: "inline-block",
        }}
      />
      {connected ? "Live" : "Reconnecting…"}
    </div>
  );
}

// Terrain heatmap tab: classified point cloud (ground/obstacle, from
// terrain_analysis via a second lidar_web_bridge instance) plus the live
// voltage-colored path trail and moving voltage label, all driven by the
// same /ws/state feed the rest of the app already uses.
export function HeatmapViewer() {
  const { positions, colors, pointCount, connected } = useClassifiedLidarStream(HEATMAP_WS_URL);
  const { state } = useRobotState();
  const trail = usePathTrail(state);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#0a0a0a" }}>
      <ConnectionBadge connected={connected} />
      {/* Pulled back further than LidarViewer's default — this tab's classified
          cloud covers a much wider area (see mock_terrain_cloud_publisher.py's
          GRID_HALF_EXTENT), so the same close-in framing left most of it
          off-screen until the user manually zoomed out. */}
      <Canvas camera={{ position: [0, 25, 40], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <OrbitControls makeDefault />
        {positions && positions.length > 0 && (
          <PointCloud positions={positions} colors={colors} pointCount={pointCount} />
        )}
        <PathTrail positions={trail.positions} colors={trail.colors} />
        <VoltageMarker3D state={state} />
      </Canvas>
    </div>
  );
}
