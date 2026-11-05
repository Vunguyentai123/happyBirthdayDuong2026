import { ArrowLeft } from 'lucide-react'

// Nút "Màn trước" ở góc trên trái — đối xứng với đĩa nhạc ở góc trên phải.
// Chỉ hiện từ màn thổi nến trở đi (SceneManager quyết định), để màn khoá và
// thiệp chào mừng vẫn sạch.
export function SceneBack({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="scene-back"
      aria-label="Xem lại màn trước"
      title="Xem lại màn trước"
    >
      <ArrowLeft size={15} strokeWidth={2.7} aria-hidden />
      <span>Màn trước</span>
    </button>
  )
}
