import * as THREE from 'three'

export function makeStarGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape()
  const R = 0.5
  const r = 0.21

  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * rad
    const y = Math.sin(a) * rad
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()

  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.26,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.055,
    bevelThickness: 0.07,
  })
  g.center()
  return g
}
