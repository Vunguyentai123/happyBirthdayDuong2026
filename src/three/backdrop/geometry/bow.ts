import * as THREE from 'three'
import { mergeParts, place } from './common'

// Nơ ribbon: 2 vòng dày (lỗ nhỏ để nhìn như dải lụa cuộn), nút giữa và 2 đuôi
// có xẻ chữ V. Gộp thành 1 geometry để chỉ tốn 1 draw call.
export function makeBowGeometry(): THREE.BufferGeometry {
  const loop = new THREE.TorusGeometry(0.062, 0.043, 10, 26)
  const left = place(loop, [-0.055, 0.012, 0], [0, 0, 0.4], [1.45, 0.92, 0.85])
  const right = place(loop, [0.055, 0.012, 0], [0, 0, -0.4], [1.45, 0.92, 0.85])
  const knot = place(
    new THREE.SphereGeometry(0.045, 12, 10),
    [0, 0.004, 0.01],
    [0, 0, 0],
    [1.0, 0.85, 0.9],
  )

  const tailShape = new THREE.Shape()
  tailShape.moveTo(-0.032, 0)
  tailShape.lineTo(0.032, 0)
  tailShape.lineTo(0.032, -0.17)
  tailShape.lineTo(0, -0.135)
  tailShape.lineTo(-0.032, -0.17)
  tailShape.closePath()

  const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.014, bevelEnabled: false })
  const tailL = place(tailGeo, [-0.035, -0.018, -0.012], [0, 0, 0.32], [1, 1, 1])
  const tailR = place(tailGeo, [0.035, -0.018, -0.012], [0, 0, -0.32], [1, 1, 1])

  const merged = mergeParts([left, right, knot, tailL, tailR])

  loop.dispose()
  left.dispose()
  right.dispose()
  knot.dispose()
  tailGeo.dispose()
  tailL.dispose()
  tailR.dispose()

  return merged
}
