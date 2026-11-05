import * as THREE from 'three'
import { makeHeartGeometry } from './heart'

// Bóng bay tròn: thân + nút thắt + dây cong.
export function makeRoundBalloonGeometries() {
  const body = new THREE.SphereGeometry(0.28, 24, 20)
  body.scale(1, 1.12, 1)

  const knot = new THREE.ConeGeometry(0.045, 0.08, 10, 1)
  knot.rotateX(Math.PI)
  knot.translate(0, -0.34, 0)

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.38, 0),
    new THREE.Vector3(0.07, -0.78, 0.03),
    new THREE.Vector3(-0.06, -1.12, -0.03),
    new THREE.Vector3(0.02, -1.55, 0),
  ])
  const string = new THREE.TubeGeometry(curve, 26, 0.0055, 4, false)

  return { body, knot, string }
}

// Bóng bay hình tim: tim dày + nút + dây dài hơn.
export function makeHeartBalloonGeometries() {
  // Tim dày, bo tròn nhiều để nhìn như bóng bay bơm căng chứ không phải hình cắt.
  const body = makeHeartGeometry(4.5, 1.8)
  body.scale(0.8, 0.8, 0.8)

  const knot = new THREE.ConeGeometry(0.052, 0.085, 10, 1)
  knot.rotateX(Math.PI)
  knot.translate(0, -0.43, 0)

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.47, 0),
    new THREE.Vector3(0.08, -0.92, 0.04),
    new THREE.Vector3(-0.07, -1.35, -0.04),
    new THREE.Vector3(0.02, -1.8, 0),
  ])
  const string = new THREE.TubeGeometry(curve, 28, 0.0055, 4, false)

  return { body, knot, string }
}
