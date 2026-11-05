import * as THREE from 'three'

export function makeHeartGeometry(depth = 1.2, bevel = 0.5): THREE.ExtrudeGeometry {
  const s = new THREE.Shape()
  s.moveTo(5, 5)
  s.bezierCurveTo(5, 5, 4, 0, 0, 0)
  s.bezierCurveTo(-6, 0, -6, 7, -6, 7)
  s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19)
  s.bezierCurveTo(12, 15.4, 16, 11, 16, 7)
  s.bezierCurveTo(16, 7, 16, 0, 10, 0)
  s.bezierCurveTo(7, 0, 5, 5, 5, 5)

  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    curveSegments: 16,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: bevel,
    bevelThickness: bevel,
  })
  g.center()
  g.scale(0.05, 0.05, 0.05)
  return g
}
