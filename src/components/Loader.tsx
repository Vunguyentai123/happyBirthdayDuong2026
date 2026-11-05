export function Loader({ progress }: { progress: number }) {
  const percent = Math.round(progress * 100)

  return (
    <div className="loader-screen">
      <div className="loader-card">
        <span aria-hidden className="loader-cake">
          🎂
        </span>
        <p className="loader-text">Usagi &amp; Momonga đang gói quà...</p>
        <div
          className="loader-track"
          role="progressbar"
          aria-label="Đang tải"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <span className="loader-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  )
}
