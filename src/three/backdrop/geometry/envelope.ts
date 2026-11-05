import * as THREE from 'three'
import { makeHeartGeometry } from './heart'

// Thiệp tình yêu: phong bì + nắp gấp chữ V + con dấu tim.
export function makeEnvelopeGeometries() {
  const body = new THREE.BoxGeometry(0.36, 0.24, 0.024)

  const flapShape = new THREE.Shape()
  flapShape.moveTo(-0.174, 0.116)
  flapShape.lineTo(0.174, 0.116)
  flapShape.lineTo(0, -0.032)
  flapShape.closePath()

  const flap = new THREE.ExtrudeGeometry(flapShape, { depth: 0.012, bevelEnabled: false })
  flap.translate(0, 0, 0.012)

  const seal = makeHeartGeometry()
  seal.scale(0.16, 0.16, 0.16)
  seal.translate(0, 0.03, 0.036)

  return { body, flap, seal }
}
