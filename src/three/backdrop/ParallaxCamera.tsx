import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Camera nhích nhẹ theo chuột để các lớp vật thể dịch chuyển lệch nhau -> cảm
// giác chiều sâu. Chỉ chạy trong Canvas nên dùng useFrame trực tiếp.
export function ParallaxCamera() {
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame(({ camera }, dt) => {
    const step = Math.min(dt, 0.06)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.current.x * 1.1, 2.6, step)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 1 - pointer.current.y * 0.55, 2.6, step)
    camera.lookAt(0, 0.5, 0)
  })

  return null
}
