import { useSceneStore } from '../store/useSceneStore'
import { Atmosphere } from './backdrop/Atmosphere'
import { ParallaxCamera } from './backdrop/ParallaxCamera'
import { ParticleField } from './backdrop/ParticleField'
import { SkyBackdrop } from './backdrop/SkyBackdrop'
import { palettes } from './backdrop/config'
import { Balloons } from './backdrop/objects/Balloons'
import { Cupcakes } from './backdrop/objects/Cupcakes'
import { Gifts } from './backdrop/objects/Gifts'
import { HeartBalloons } from './backdrop/objects/HeartBalloons'
import { HeartField } from './backdrop/objects/HeartField'
import { LoveLetters } from './backdrop/objects/LoveLetters'
import { PartyHats } from './backdrop/objects/PartyHats'
import { Pearls } from './backdrop/objects/Pearls'
import { RibbonBows } from './backdrop/objects/RibbonBows'
import { Rings } from './backdrop/objects/Rings'
import { Stars } from './backdrop/objects/Stars'

// Nền 3D dùng chung cho cả web. File này chỉ điều phối:
//  • SkyBackdrop     – trời gradient + aurora + quầng sáng
//  • Atmosphere      – môi trường phản chiếu, sương mù, đèn màu
//  • ParallaxCamera  – camera nhích theo chuột
//  • ParticleField   – 3 lớp hạt: bụi, đom đóm, bokeh
//  • objects/*       – mỗi loại vật thể là một component tự quản lý geometry,
//                      material, màu instance và animation riêng.
// Muốn chỉnh loại nào thì sửa đúng file trong src/three/backdrop/objects.
export function Backdrop3D({ quality = 1 }: { quality?: number }) {
  const scene = useSceneStore((s) => s.scene)
  const progress = useSceneStore((s) => s.progress)
  const palette = palettes[scene] ?? palettes.lock
  const speed = palette.speed * (1 + progress * 0.7)

  return (
    <group>
      <SkyBackdrop palette={palette} />
      <Atmosphere palette={palette} />
      <ParallaxCamera />
      <ParticleField quality={quality} />

      <Balloons quality={quality} speed={speed} />
      <HeartBalloons quality={quality} speed={speed} />
      <HeartField quality={quality} speed={speed} />
      <Stars quality={quality} speed={speed} />
      <Gifts quality={quality} speed={speed} />
      <Cupcakes quality={quality} speed={speed} />
      <LoveLetters quality={quality} speed={speed} />
      <RibbonBows quality={quality} speed={speed} />
      <PartyHats quality={quality} speed={speed} />
      <Rings quality={quality} speed={speed} />
      <Pearls quality={quality} speed={speed} />
    </group>
  )
}
