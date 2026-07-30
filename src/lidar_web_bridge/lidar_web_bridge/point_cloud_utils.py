import numpy as np


def parse_pointcloud2_xyz(msg) -> np.ndarray:
    """Extract (N, 3) float32 XYZ array from a sensor_msgs/PointCloud2."""
    field_offsets = {f.name: f.offset for f in msg.fields}
    try:
        x_off = field_offsets["x"]
        y_off = field_offsets["y"]
        z_off = field_offsets["z"]
    except KeyError as exc:
        raise ValueError("PointCloud2 message must include x, y, and z fields") from exc

    point_step = msg.point_step
    n_points = msg.width * msg.height
    if n_points == 0:
        return np.empty((0, 3), dtype=np.float32)

    byte_order = ">" if msg.is_bigendian else "<"
    dtype = np.dtype(
        {
            "names": ["x", "y", "z"],
            "formats": [
                f"{byte_order}f4",
                f"{byte_order}f4",
                f"{byte_order}f4",
            ],
            "offsets": [x_off, y_off, z_off],
            "itemsize": point_step,
        }
    )

    points = np.frombuffer(msg.data, dtype=dtype, count=n_points)
    xyz = np.column_stack((points["x"], points["y"], points["z"])).astype(np.float32, copy=False)
    valid = np.isfinite(xyz).all(axis=1)
    return xyz[valid]


def parse_pointcloud2_xyzi(msg) -> np.ndarray:
    """Extract (N, 4) float32 XYZI array from a sensor_msgs/PointCloud2.

    Used for classified clouds (e.g. terrain_analysis's terrain_cloud) where
    intensity carries per-point classification (0.0 ground / 1.0 obstacle),
    unlike parse_pointcloud2_xyz which discards it.
    """
    field_offsets = {f.name: f.offset for f in msg.fields}
    try:
        x_off = field_offsets["x"]
        y_off = field_offsets["y"]
        z_off = field_offsets["z"]
        i_off = field_offsets["intensity"]
    except KeyError as exc:
        raise ValueError(
            "PointCloud2 message must include x, y, z, and intensity fields"
        ) from exc

    point_step = msg.point_step
    n_points = msg.width * msg.height
    if n_points == 0:
        return np.empty((0, 4), dtype=np.float32)

    byte_order = ">" if msg.is_bigendian else "<"
    dtype = np.dtype(
        {
            "names": ["x", "y", "z", "intensity"],
            "formats": [f"{byte_order}f4"] * 4,
            "offsets": [x_off, y_off, z_off, i_off],
            "itemsize": point_step,
        }
    )

    points = np.frombuffer(msg.data, dtype=dtype, count=n_points)
    xyzi = np.column_stack(
        (points["x"], points["y"], points["z"], points["intensity"])
    ).astype(np.float32, copy=False)
    valid = np.isfinite(xyzi).all(axis=1)
    return xyzi[valid]


def downsample_stride(xyz: np.ndarray, keep_every: int) -> np.ndarray:
    """Return every keep_every-th point (row), regardless of column count."""
    return xyz[::keep_every]


def transform_nwu_to_threejs(xyz: np.ndarray) -> np.ndarray:
    """
    Convert ROS NWU (X=Forward, Y=Left, Z=Up) to Three.js Y-Up right-handed
    (X=Right, Y=Up, Z=toward viewer).

    Mapping:
      Three.js X =  -ROS Y
      Three.js Y =   ROS Z
      Three.js Z =  -ROS X

    Operates on the first 3 columns only, so it works unchanged whether xyz
    has 3 columns (XYZ) or more (e.g. XYZI) — extra columns pass through.
    """
    out = xyz.copy()
    out[:, 0] = -xyz[:, 1]
    out[:, 1] = xyz[:, 2]
    out[:, 2] = -xyz[:, 0]
    return out


def pack_xyz_binary(xyz: np.ndarray) -> bytes:
    """Flatten (N, 3) float32 to raw bytes for the WebSocket wire format."""
    return xyz.astype(np.float32, copy=False).tobytes()


def pack_xyzi_binary(xyzi: np.ndarray) -> bytes:
    """Flatten (N, 4) float32 to raw bytes for the WebSocket wire format."""
    return xyzi.astype(np.float32, copy=False).tobytes()
