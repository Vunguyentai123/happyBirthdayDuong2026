import * as THREE from 'three'

// Gộp geometry tự viết (tránh import BufferGeometryUtils để không kéo thêm một
// bản Three.js thứ hai vào bundle).
export function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const items = parts.map((g) => (g.index ? g.toNonIndexed() : g))
  const merged = new THREE.BufferGeometry()
  const names = ['position', 'normal', 'uv'] as const

  for (const name of names) {
    const attrs = items.map((g) => g.getAttribute(name))
    if (attrs.some((a) => !a)) continue

    const size = attrs[0].itemSize
    let total = 0
    for (const a of attrs) total += a.count * size

    const arr = new Float32Array(total)
    let offset = 0
    for (const a of attrs) {
      arr.set(a.array as Float32Array, offset)
      offset += a.count * size
    }
    merged.setAttribute(name, new THREE.BufferAttribute(arr, size))
  }

  items.forEach((g, i) => {
    if (g !== parts[i]) g.dispose()
  })
  return merged
}

export function place(
  geo: THREE.BufferGeometry,
  pos: [number, number, number],
  rot: [number, number, number],
  scale: [number, number, number],
): THREE.BufferGeometry {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(...scale),
  )
  return geo.clone().applyMatrix4(m)
}
