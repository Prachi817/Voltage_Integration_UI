// Voltage integration: coordinate helper for the Voltage Map tab (path trail + moving marker).
// Mirrors point_cloud_utils.py's transform_nwu_to_threejs, applied client-side
// since odometry (unlike the point cloud) isn't pre-transformed by the backend.
//
// ROS NWU (X=Forward, Y=Left, Z=Up) -> Three.js Y-up right-handed:
//   Three.js X =  -ROS Y
//   Three.js Y =   ROS Z
//   Three.js Z =  -ROS X
export function rosToThreeJS(x: number, y: number, z = 0): [number, number, number] {
  return [-y, z, -x];
}
