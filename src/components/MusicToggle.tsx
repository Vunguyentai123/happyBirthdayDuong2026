import { SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useSceneStore } from '../store/useSceneStore'
import { content } from '../data/content'

// Nút bật/tắt nhạc + chuyển bài (phát nhạc do <MusicPlayer/> ở App đảm nhiệm).
// - variant="classic": kiểu viên kẹo giấy của các màn khác.
// - variant="disc": đĩa than nhỏ đặt cạnh CTA ở thiệp chào mừng.
export function MusicToggle({ variant = 'classic' }: { variant?: 'classic' | 'disc' }) {
  const musicOn = useSceneStore((s) => s.musicOn)
  const setMusicOn = useSceneStore((s) => s.setMusicOn)
  const trackIndex = useSceneStore((s) => s.trackIndex)
  const nextTrack = useSceneStore((s) => s.nextTrack)

  const playlist = content.musicPlaylist?.length ? content.musicPlaylist : [content.musicSrc]
  const trackNo = (trackIndex % playlist.length) + 1
  const nextSong = () => {
    nextTrack()
    if (!musicOn) setMusicOn(true)
  }

  if (variant === 'disc') {
    return (
      <div className="bday-music relative shrink-0">
        <button
          onClick={() => setMusicOn(!musicOn)}
          aria-pressed={musicOn}
          aria-label={musicOn ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
          title={
            musicOn
              ? `Tắt nhạc nền (đang phát bài ${trackNo}/${playlist.length})`
              : `Bật nhạc nền (bài ${trackNo}/${playlist.length})`
          }
          className={`music-disc relative grid h-[54px] w-[54px] place-items-center rounded-full border transition active:scale-95 ${
            musicOn ? 'is-playing text-[#9C2F52]' : 'text-[#C0738A]'
          }`}
        >
          <span aria-hidden className={`music-grooves ${musicOn ? 'is-spinning' : ''}`} />
          <span className="relative z-10 grid place-items-center">
            {musicOn ? (
              <Volume2 size={19} strokeWidth={2.2} />
            ) : (
              <VolumeX size={18} strokeWidth={2.2} />
            )}
          </span>
        </button>

        {playlist.length > 1 && (
          <button
            onClick={nextSong}
            aria-label={`Bài tiếp theo, đang phát bài ${trackNo}/${playlist.length}`}
            title={`Bài tiếp theo (${trackNo}/${playlist.length})`}
            className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border border-[#C9A25D]/55 bg-[#FFF9EE] text-[#6B2336] shadow-[0_5px_12px_-7px_rgba(59,27,41,.9),inset_0_1px_0_rgba(255,255,255,.9)] transition hover:bg-white active:scale-90"
          >
            <SkipForward size={10} strokeWidth={3} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setMusicOn(!musicOn)}
        aria-pressed={musicOn}
        aria-label={musicOn ? 'Tắt nhạc' : 'Bật nhạc'}
        title={musicOn ? 'Tắt nhạc' : 'Bật nhạc'}
        className={`grid h-12 w-12 place-items-center rounded-xl border transition active:scale-95 ${
          musicOn
            ? 'border-[#E9A7BC]/80 bg-[#FFE7EF] text-[#9C2F52] shadow-[0_12px_24px_-16px_rgba(214,92,128,.9),inset_0_1px_0_rgba(255,255,255,.95)]'
            : 'border-[#C9A25D]/45 bg-[#FFF9EE]/85 text-[#6B2336] shadow-[inset_0_1px_0_rgba(255,255,255,.8)] hover:bg-[#FFFCF5]'
        }`}
      >
        {musicOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
      </button>
      {playlist.length > 1 && (
        <button
          onClick={nextSong}
          aria-label="Bài tiếp theo"
          title={`Bài tiếp theo (đang phát bài ${trackNo}/${playlist.length})`}
          className="relative grid h-12 w-12 place-items-center rounded-xl border border-[#C9A25D]/45 bg-[#FFF9EE]/85 text-[#6B2336] shadow-[inset_0_1px_0_rgba(255,255,255,.8)] transition hover:bg-[#FFFCF5] active:scale-95"
        >
          <SkipForward size={15} />
        </button>
      )}
    </div>
  )
}
