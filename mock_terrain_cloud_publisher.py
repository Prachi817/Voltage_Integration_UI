#!/usr/bin/env python3
"""
Standalone, ROS-free stand-in for the terrain heatmap WebSocket stream that
terrain_heatmap_stream.launch.py normally serves (a second lidar_web_bridge
instance subscribed to terrain_analysis's terrain_cloud topic).

Serves the exact same "CI" binary frame format the real bridge produces
(see src/lidar_web_bridge/lidar_web_bridge/lidar_stream_node.py and
point_cloud_utils.py): an 8-byte header ("CI" + 2 reserved bytes + uint32
point count, little-endian) followed by that many (x, y, z, intensity)
float32 tuples. So the web UI's Voltage Map tab can be exercised locally
without ROS 2, terrain_analysis, or the real robot.

Unlike mock_owon_publisher.py, this has NO rclpy/ROS dependency at all — it
is not a ROS node, does not run under any launch file, and is never part of
the real robot's process tree. It only ever exists if you explicitly run
this script yourself, on a port (8766) nothing else uses unless you point a
client at it. Do not run this on the robot's NUC — it would bind the same
port the real terrain_heatmap_stream bridge uses and shadow it.

Usage (a plain Python environment with `websockets` installed; no ROS 2
sourcing needed):
    python3 -m pip install websockets
    python3 mock_terrain_cloud_publisher.py
"""

import asyncio
import math
import random
import struct

import websockets

WS_HOST = "0.0.0.0"
WS_PORT = 8766
N_GROUND_POINTS = 1200
N_OBSTACLE_POINTS = 150
GRID_HALF_EXTENT = 5.0
OBSTACLE_CENTER = (2.0, 1.5)
OBSTACLE_RADIUS = 0.8
TICK_SECONDS = 0.5

MAGIC = b"CI\x00\x00"


def _generate_frame() -> bytes:
    points: list[tuple[float, float, float, float]] = []

    # Ground plane: a jittered grid, intensity 0.0 — matches
    # terrain_processor.cpp's ground classification.
    for _ in range(N_GROUND_POINTS):
        x = random.uniform(-GRID_HALF_EXTENT, GRID_HALF_EXTENT)
        y = random.uniform(-GRID_HALF_EXTENT, GRID_HALF_EXTENT)
        z = random.uniform(-0.02, 0.02)
        points.append((x, y, z, 0.0))

    # One obstacle cluster: intensity 1.0 — matches terrain_processor.cpp's
    # obstacle classification, so the heatmap has something red to show.
    for _ in range(N_OBSTACLE_POINTS):
        angle = random.uniform(0, 2 * math.pi)
        radius = random.uniform(0, OBSTACLE_RADIUS)
        height = random.uniform(0.0, 1.2)
        x = OBSTACLE_CENTER[0] + radius * math.cos(angle)
        y = OBSTACLE_CENTER[1] + radius * math.sin(angle)
        points.append((x, y, height, 1.0))

    payload = b"".join(struct.pack("<ffff", *p) for p in points)
    header = MAGIC + struct.pack("<I", len(points))
    return header + payload


async def _handler(ws) -> None:
    print(f"[mock_terrain_cloud] client connected: {ws.remote_address}")
    try:
        while True:
            await ws.send(_generate_frame())
            await asyncio.sleep(TICK_SECONDS)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        print(f"[mock_terrain_cloud] client disconnected: {ws.remote_address}")


async def main() -> None:
    async with websockets.serve(_handler, WS_HOST, WS_PORT):
        print(
            f"[mock_terrain_cloud] serving fake classified point cloud on "
            f"ws://{WS_HOST}:{WS_PORT} — dev/local use only, never run this on the robot"
        )
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
