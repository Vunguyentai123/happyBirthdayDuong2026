import * as THREE from 'three'

// Cupcake: vỏ giấy có gân, kem xoắn ốc, quả cherry + cuống.
export function makeCupcakeGeometries() {
  const wrapper = new THREE.CylinderGeometry(0.17, 0.115, 0.2, 18, 1, false)
  wrapper.translate(0, 0.1, 0)

  const pts = [
    new THREE.Vector2(0.14, 0.0),
    new THREE.Vector2(0.176, 0.035),
    new THREE.Vector2(0.146, 0.07),
    new THREE.Vector2(0.166, 0.105),
    new THREE.Vector2(0.122, 0.14),
    new THREE.Vector2(0.132, 0.175),
    new THREE.Vector2(0.086, 0.21),
    new THREE.Vector2(0.09, 0.24),
    new THREE.Vector2(0.042, 0.27),
    new THREE.Vector2(0.004, 0.295),
  ]
  const frosting = new THREE.LatheGeometry(pts, 30)
  frosting.translate(0, 0.2, 0)

  const cherry = new THREE.SphereGeometry(0.042, 12, 10)
  cherry.translate(0, 0.53, 0)

  const stem = new THREE.CylinderGeometry(0.004, 0.007, 0.075, 5)
  stem.rotateZ(0.22)
  stem.translate(0.01, 0.585, 0)

  return { wrapper, frosting, cherry, stem }
}
