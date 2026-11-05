import { useEffect, type RefObject } from 'react'
import * as THREE from 'three'

// Gán màu pastel cho từng instance của một InstancedMesh.
export function useInstanceColors(
  mesh: RefObject<THREE.InstancedMesh | null>,
  colors: readonly string[],
  count: number,
) {
  useEffect(() => {
    const m = mesh.current
    if (!m) return

    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      color.set(colors[i % colors.length])
      m.setColorAt(i, color)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [mesh, colors, count])
}
