export function intersectsBoundingBox(origin: any, dir: any, boxCenter: any, boxSize: any) {
  const min = { x: boxCenter.x - boxSize.w/2, y: boxCenter.y, z: boxCenter.z - boxSize.d/2 };
  const max = { x: boxCenter.x + boxSize.w/2, y: boxCenter.y + boxSize.h, z: boxCenter.z + boxSize.d/2 };
  let tmin = (min.x - origin.x) / dir.x, tmax = (max.x - origin.x) / dir.x;
  if (tmin > tmax) [tmin, tmax] = [tmax, tmin];
  let tymin = (min.y - origin.y) / dir.y, tymax = (max.y - origin.y) / dir.y;
  if (tymin > tymax) [tymin, tymax] = [tymax, tymin];
  if ((tmin > tymax) || (tymin > tmax)) return false;
  if (tymin > tmin) tmin = tymin;
  if (tymax < tmax) tmax = tymax;
  let tzmin = (min.z - origin.z) / dir.z, tzmax = (max.z - origin.z) / dir.z;
  if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];
  if ((tmin > tzmax) || (tzmin > tmax)) return false;
  return true;
}