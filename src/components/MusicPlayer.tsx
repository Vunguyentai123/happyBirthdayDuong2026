import { useCallback, useEffect, useRef } from 'react'
import { useSceneStore } from '../store/useSceneStore'
import { content } from '../data/content'

// Player nhạc duy nhất, sống suốt app để nhạc không ngắt khi chuyển màn.
// Phát cả playlist trong content.ts nối tiếp nhau; playlist chỉ có 1 bài thì
// lặp lại vô hạn (thuộc tính loop) để nhạc nền không bao giờ tắt giữa chừng.
// Chỉ phát sau khi người dùng bấm (store.musicOn) — đúng luật autoplay của
// Safari trên iPhone và Chrome trên Android.
export function MusicPlayer() {
  const musicOn = useSceneStore((s) => s.musicOn)
  const duckMusic = useSceneStore((s) => s.duckMusic)
  const setMusicOn = useSceneStore((s) => s.setMusicOn)
  const setMusicLoading = useSceneStore((s) => s.setMusicLoading)
  const trackIndex = useSceneStore((s) => s.trackIndex)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const badTracks = useRef<Set<string>>(new Set())

  const playlist = content.musicPlaylist?.length ? content.musicPlaylist : [content.musicSrc]
  const safeIndex = ((trackIndex % playlist.length) + playlist.length) % playlist.length
  const currentSrc = playlist[safeIndex]
  const singleTrack = playlist.length === 1

  // Safari chặn play() nếu không có cử chỉ thật. Khi bị chặn, ta giữ nút ở trạng
  // thái bật và tự phát ở lần chạm kế tiếp thay vì tắt nhạc trong im lặng.
  const retryOnGesture = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    window.addEventListener(
      'pointerdown',
      () => {
        useSceneStore.getState().setMusicLoading(true)
        void a.play().catch(() => useSceneStore.getState().setMusicLoading(false))
      },
      { once: true },
    )
  }, [])

  const start = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    setMusicLoading(true)
    void a.play().catch((err: unknown) => {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError') {
        // Chưa có cử chỉ: tắt vòng xoay (tránh quay mãi) và phát ở lần chạm sau.
        setMusicLoading(false)
        retryOnGesture()
        return
      }
      // AbortError: vừa đổi bài/dừng ngay sau lệnh phát, không phải lỗi thật.
      if (name === 'AbortError') return
      setMusicLoading(false)
      setMusicOn(false)
    })
  }, [retryOnGesture, setMusicLoading, setMusicOn])

  // Bật thì phát, tắt thì dừng. React tự cập nhật thuộc tính src khi đổi bài nên
  // trình duyệt tự nạp bài mới; preload="metadata" giúp lấy độ dài sớm và vào
  // nhạc nhanh hơn trên mạng chậm mà không tải cả file.
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (musicOn) {
      start()
      return
    }
    a.pause()
    setMusicLoading(false)
  }, [musicOn, currentSrc, start, setMusicLoading])

  // Nhạc hộp sinh nhật phát đè lên: hạ nhạc nền rồi trả lại âm lượng cũ.
  // iOS bỏ qua thuộc tính volume của thẻ audio nên trên iPhone hai nhạc cùng
  // phát ở âm lượng máy — vẫn nghe rõ, chỉ không hạ được nhạc nền.
  useEffect(() => {
    const a = audioRef.current
    if (a) a.volume = duckMusic ? 0.22 : 1
  }, [duckMusic, currentSrc])

  // Playlist nhiều bài: hết bài thì sang bài kế. Một bài: thuộc tính loop tự lặp.
  const handleEnded = () => {
    if (singleTrack) return
    useSceneStore.getState().nextTrack()
  }

  // File lỗi/không tải được: nhảy bài kế thay vì im lặng. Mọi bài đều lỗi thì
  // tắt nhạc để không lặp vô hạn.
  const handleError = () => {
    badTracks.current.add(currentSrc)
    setMusicLoading(false)
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
      preload="metadata"
      loop={singleTrack}
      onEnded={handleEnded}
      onError={handleError}
      onPlaying={() => setMusicLoading(false)}
      onCanPlay={() => setMusicLoading(false)}
      onWaiting={() => setMusicLoading(true)}
      onStalled={() => setMusicLoading(true)}
    />
  )
}
