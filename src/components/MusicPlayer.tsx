import { useEffect, useRef } from 'react'
import { useSceneStore } from '../store/useSceneStore'
import { content } from '../data/content'

// Player nhạc duy nhất, sống suốt app để nhạc không ngắt khi chuyển màn.
// Phát cả 2 bài bai1.mp3 + bai2.mp3 nối tiếp nhau, hết bài 2 tự quay lại bài 1.
// Chỉ phát sau khi người dùng bấm nút (store.musicOn).
export function MusicPlayer() {
  const musicOn = useSceneStore((s) => s.musicOn)
  const setMusicOn = useSceneStore((s) => s.setMusicOn)
  const trackIndex = useSceneStore((s) => s.trackIndex)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playlist = content.musicPlaylist?.length ? content.musicPlaylist : [content.musicSrc]
  const currentSrc = playlist[trackIndex % playlist.length]

  // Đổi src khi chuyển bài, nếu đang bật thì phát tiếp luôn.
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (a.getAttribute('src') !== currentSrc) {
      a.src = currentSrc
      a.load()
    }
    if (musicOn) a.play().catch(() => setMusicOn(false))
  }, [currentSrc, musicOn, setMusicOn])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (musicOn) a.play().catch(() => setMusicOn(false))
    else a.pause()
  }, [musicOn, setMusicOn])

  const handleEnded = () => {
    useSceneStore.getState().nextTrack()
  }

  return <audio ref={audioRef} src={currentSrc} preload="none" onEnded={handleEnded} />
}
