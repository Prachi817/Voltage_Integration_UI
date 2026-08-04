// Voltage integration: terrain heatmap stream for the Voltage Map tab.
// Parses the "CI" (classified-intensity) binary frame format produced by
// lidar_stream_node.py when include_intensity:=true — used for the
// terrain_analysis heatmap stream, as opposed to parsePointCloud.ts's plain
// "PC" format used by the raw LiDAR viewer.
export interface ParsedClassifiedFrame {
  positions: Float32Array; // xyz per point
  colors: Float32Array; // rgb per point, derived from intensity
  pointCount: number;
}

const MAGIC_0 = 0x43; // 'C'
const MAGIC_1 = 0x49; // 'I'
const HEADER_BYTES = 8;
const BYTES_PER_POINT = 16; // x,y,z,intensity as float32

// terrain_processor.cpp: intensity = 1.0 for obstacle, 0.0 for ground.
const OBSTACLE_THRESHOLD = 0.5;
// terrain_analysis.rviz: ground uses FlatColor 170;170;255, obstacle layer
// uses Intensity-mapped 255;0;0 — matched here so the web heatmap agrees
// with the RViz view.
const GROUND_RGB: [number, number, number] = [170 / 255, 170 / 255, 1.0];
const OBSTACLE_RGB: [number, number, number] = [1.0, 0, 0];

export function parseClassifiedFrame(buffer: ArrayBuffer): ParsedClassifiedFrame | null {
  if (buffer.byteLength < HEADER_BYTES) return null;

  const header = new Uint8Array(buffer, 0, HEADER_BYTES);
  if (header[0] !== MAGIC_0 || header[1] !== MAGIC_1) return null;

  const pointCount = new DataView(buffer, 4, 4).getUint32(0, true);
  const expectedBytes = HEADER_BYTES + pointCount * BYTES_PER_POINT;
  if (buffer.byteLength !== expectedBytes) return null;

  const xyzi = new Float32Array(buffer, HEADER_BYTES, pointCount * 4);
  const positions = new Float32Array(pointCount * 3);
  const colors = new Float32Array(pointCount * 3);

  for (let i = 0; i < pointCount; i++) {
    positions[i * 3] = xyzi[i * 4];
    positions[i * 3 + 1] = xyzi[i * 4 + 1];
    positions[i * 3 + 2] = xyzi[i * 4 + 2];

    const rgb = xyzi[i * 4 + 3] >= OBSTACLE_THRESHOLD ? OBSTACLE_RGB : GROUND_RGB;
    colors[i * 3] = rgb[0];
    colors[i * 3 + 1] = rgb[1];
    colors[i * 3 + 2] = rgb[2];
  }

  return { positions, colors, pointCount };
}
