import { useEffect, useRef } from 'react'
import { useSceneStore } from '../store/useSceneStore'
import { content } from '../data/content'

// Player nhạc duy nhất, sống suốt app để nhạc không ngắt khi chuyển màn.
// Phát cả playlist trong content.ts nối tiếp nhau, hết bài cuối tự quay lại bài đầu.
// Chỉ phát sau khi người dùng bấm nút (store.musicOn).
export function MusicPlayer() {
  const musicOn = useSceneStore((s) => s.musicOn)
  const duckMusic = useSceneStore((s) => s.duckMusic)
  const setMusicOn = useSceneStore((s) => s.setMusicOn)
  const trackIndex = useSceneStore((s) => s.trackIndex)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const badTracks = useRef<Set<string>>(new Set())

  const playlist = content.musicPlaylist?.length ? content.musicPlaylist : [content.musicSrc]
  const safeIndex = ((trackIndex % playlist.length) + playlist.length) % playlist.length
  const currentSrc = playlist[safeIndex]

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

  // Nhạc hộp sinh nhật phát đè lên: hạ nhạc nền xuống rồi trả lại âm lượng cũ.
  useEffect(() => {
    const a = audioRef.current
    if (a) a.volume = duckMusic ? 0.22 : 1
  }, [duckMusic, currentSrc])

  const handleEnded = () => {
    useSceneStore.getState().nextTrack()
  }

  // File lỗi/không tải được: nhảy bài kế thay vì im lặng. Nếu mọi bài đều lỗi
  // thì tắt nhạc để không lặp vô hạn.
  const handleError = () => {
    badTracks.current.add(currentSrc)
    if (badTracks.current.size >= playlist.length) {
      setMusicOn(false)
      return
    }
    useSceneStore.getState().nextTrack()
  }

  return (
    <audio
      ref={audioRef}
      src={currentSrc}
      preload="none"
      onEnded={handleEnded}
      onError={handleError}
    />
  )
}
