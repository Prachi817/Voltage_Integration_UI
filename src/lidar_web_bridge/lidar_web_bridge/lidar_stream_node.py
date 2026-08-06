import asyncio
import struct
import threading
import time

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import PointCloud2

import websockets
from websockets.exceptions import ConnectionClosed

from .point_cloud_utils import (
    downsample_stride,
    pack_xyz_binary,
    pack_xyzi_binary,
    parse_pointcloud2_xyz,
    parse_pointcloud2_xyzi,
    transform_nwu_to_threejs,
)


class LidarStreamNode(Node):
    def __init__(self):
        super().__init__("lidar_stream")

        self.declare_parameter("ws_host", "0.0.0.0")
        self.declare_parameter("ws_port", 8765)
        self.declare_parameter("target_points", 4000)
        self.declare_parameter("input_topic", "/velodyne_points")
        self.declare_parameter("publish_rate_hz", 10.0)
        # Voltage integration: enables the terrain heatmap stream for the Voltage Map tab.
        self.declare_parameter("include_intensity", False)

        self._ws_host = self.get_parameter("ws_host").get_parameter_value().string_value
        self._ws_port = self.get_parameter("ws_port").get_parameter_value().integer_value
        self._target_points = self.get_parameter("target_points").get_parameter_value().integer_value
        self._input_topic = self.get_parameter("input_topic").get_parameter_value().string_value
        self._publish_rate_hz = self.get_parameter("publish_rate_hz").get_parameter_value().double_value
        self._include_intensity = self.get_parameter("include_intensity").get_parameter_value().bool_value

        self._ws_clients: set = set()
        self._ws_clients_lock = threading.Lock()
        self._last_publish_time = 0.0
        self._min_interval = 1.0 / max(self._publish_rate_hz, 0.1)
        self._ws_stop_event: asyncio.Event | None = None

        self.create_subscription(PointCloud2, self._input_topic, self._cloud_cb, 5)

        self._loop = asyncio.new_event_loop()
        self._ws_thread = threading.Thread(target=self._run_ws_server, daemon=True)
        self._ws_thread.start()

        mode = "XYZI (classified)" if self._include_intensity else "XYZ"
        self.get_logger().info(
            f"LidarStreamNode started — subscribing to {self._input_topic} ({mode}), "
            f"WebSocket on ws://{self._ws_host}:{self._ws_port}"
        )

    def _cloud_cb(self, msg: PointCloud2) -> None:
        now = time.monotonic()
        if now - self._last_publish_time < self._min_interval:
            return
        self._last_publish_time = now

        try:
            # Voltage integration: XYZI branch feeds the Voltage Map tab's terrain heatmap.
            if self._include_intensity:
                points = parse_pointcloud2_xyzi(msg)
            else:
                points = parse_pointcloud2_xyz(msg)
        except Exception as exc:
            self.get_logger().warn(f"Failed to parse PointCloud2 message: {exc}")
            return

        if len(points) == 0:
            return

        keep_every = max(1, len(points) // self._target_points)
        points = downsample_stride(points, keep_every)
        points = transform_nwu_to_threejs(points)

        n_points = len(points)
        # Voltage integration: "CI" wire format carries intensity for the Voltage Map tab.
        if self._include_intensity:
            payload = pack_xyzi_binary(points)
            header = b"CI\x00\x00" + struct.pack("<I", n_points)
        else:
            payload = pack_xyz_binary(points)
            header = b"PC\x00\x00" + struct.pack("<I", n_points)
        full_msg = header + payload

        asyncio.run_coroutine_threadsafe(self._broadcast(full_msg), self._loop)

    async def _broadcast(self, message: bytes) -> None:
        with self._ws_clients_lock:
            clients = set(self._ws_clients)
        if not clients:
            return
        dead = set()
        for ws in clients:
            try:
                await ws.send(message)
            except ConnectionClosed:
                dead.add(ws)
        if dead:
            with self._ws_clients_lock:
                self._ws_clients -= dead

    async def _ws_handler(self, ws) -> None:
        with self._ws_clients_lock:
            self._ws_clients.add(ws)
        remote = ws.remote_address
        self.get_logger().info(f"WebSocket client connected: {remote}")
        try:
            import json
            await ws.send(json.dumps({"type": "hello", "topic": self._input_topic}))
            async for _ in ws:
                pass  # ignore incoming messages
        except ConnectionClosed:
            pass
        finally:
            with self._ws_clients_lock:
                self._ws_clients.discard(ws)
            self.get_logger().info(f"WebSocket client disconnected: {remote}")

    def _run_ws_server(self) -> None:
        asyncio.set_event_loop(self._loop)
        self._ws_stop_event = asyncio.Event()

        async def _serve():
            async with websockets.serve(self._ws_handler, self._ws_host, self._ws_port):
                self.get_logger().info(
                    f"WebSocket server listening on ws://{self._ws_host}:{self._ws_port}"
                )
                await self._ws_stop_event.wait()

        self._loop.run_until_complete(_serve())

    def destroy_node(self) -> None:
        if self._ws_stop_event is not None:
            self._loop.call_soon_threadsafe(self._ws_stop_event.set)
        self._ws_thread.join(timeout=2.0)
        self._loop.close()
        super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = LidarStreamNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == "__main__":
    main()
