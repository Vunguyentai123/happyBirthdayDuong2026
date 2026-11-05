import * as THREE from 'three'
import { mergeParts } from './common'

// Mũ sinh nhật: nón có texture sọc + vành + pom-pom.
export function makePartyHatGeometries() {
  const cone = new THREE.ConeGeometry(0.19, 0.42, 24, 1, true)
  cone.translate(0, 0.21, 0)

  const brim = new THREE.TorusGeometry(0.19, 0.013, 6, 28)
  brim.rotateX(Math.PI / 2)
  brim.translate(0, 0.006, 0)

  const pom = new THREE.SphereGeometry(0.05, 12, 10)
  pom.translate(0, 0.44, 0)

  const trim = mergeParts([brim, pom])
  brim.dispose()
  pom.dispose()

  return { cone, trim }
}
