import { useSceneStore, sceneOrder } from '../store/useSceneStore'
import { MusicToggle } from '../components/MusicToggle'
import { SceneBack } from '../components/SceneBack'
import { LockScene } from './LockScene'
import { GreetingScene } from './GreetingScene'
import { CandleScene } from './CandleScene'
import { PhotosScene } from './PhotosScene'
import { LetterScene } from './LetterScene'
import { GiftScene } from './GiftScene'

// State machine tuyến tính, chuyển cảnh mượt.
export function SceneManager({ lite }: { lite: boolean }) {
  const scene = useSceneStore((s) => s.scene)
  const prev = useSceneStore((s) => s.prev)
  const index = sceneOrder.indexOf(scene)
  // Màn khoá (0) và thiệp chào mừng (1) không có nút quay lại: trước chúng chỉ
  // là màn khoá, quay lại đó không có ý nghĩa.
  const canGoBack = index >= 2

  return (
    <div className="ui-layer min-h-dvh flex flex-col">
      {/* Từ màn 03 trở đi vẫn có nút tắt/bật nhạc (màn 02 đã có đĩa nhạc riêng). */}
      {scene !== 'lock' && scene !== 'greeting' && (
        <div className="fixed right-3 top-3 z-40 sm:right-5 sm:top-5">
          <MusicToggle variant="disc" />
        </div>
      )}
      {canGoBack && (
        <div className="fixed left-3 top-3 z-40 sm:left-5 sm:top-5">
          <SceneBack onClick={prev} />
        </div>
      )}
      <main key={scene} className="scene-in flex-1">
        {scene === 'lock' && <LockScene />}
        {scene === 'greeting' && <GreetingScene />}
        {scene === 'candle' && <CandleScene lite={lite} />}
        {scene === 'photos' && <PhotosScene />}
        {scene === 'letter' && <LetterScene />}
        {scene === 'gift' && <GiftScene lite={lite} />}
      </main>
    </div>
  )
}
