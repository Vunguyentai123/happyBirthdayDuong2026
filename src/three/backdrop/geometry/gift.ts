import * as THREE from 'three'
import { mergeParts } from './common'

// Hộp quà: thân + nắp + dải nơ chữ thập (gộp).
export function makeGiftGeometries() {
  const body = new THREE.BoxGeometry(0.34, 0.26, 0.34)
  const lid = new THREE.BoxGeometry(0.38, 0.09, 0.38)
  const bandA = new THREE.BoxGeometry(0.36, 0.27, 0.09)
  const bandB = new THREE.BoxGeometry(0.09, 0.27, 0.36)

  const ribbon = mergeParts([bandA, bandB])
  bandA.dispose()
  bandB.dispose()

  return { body, lid, ribbon }
}
