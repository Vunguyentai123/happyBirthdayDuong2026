// Bánh kem 2D: SVG thuần + lửa CSS, thay thế bản 3D.
// Số nến vẽ bằng <text> nên luôn đúng dáng số 1 / 7.
export function Cake2D({ lit }: { lit: boolean }) {
  return (
    <div className="anim-float w-full max-w-[300px] mx-auto select-none" aria-hidden>
      <svg viewBox="0 0 320 290" className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6A00" />
            <stop offset="55%" stopColor="#FFB62E" />
            <stop offset="100%" stopColor="#FFF6C8" />
          </linearGradient>
        </defs>

        {/* bóng đổ */}
        <ellipse cx="160" cy="262" rx="110" ry="13" fill="#000" opacity="0.08" />

        {/* đĩa */}
        <ellipse cx="160" cy="250" rx="122" ry="19" fill="#FFFFFF" />
        <ellipse cx="160" cy="250" rx="122" ry="19" fill="none" stroke="#E8B84B" strokeWidth="5" />
        <ellipse cx="160" cy="247" rx="106" ry="13" fill="#FFF3DC" />

        {/* tầng dưới */}
        <rect x="58" y="172" width="204" height="76" rx="18" fill="#FFEFC9" />
        <rect x="58" y="160" width="204" height="30" rx="15" fill="#FFF9EF" />
        {/* kem chảy tầng dưới */}
        {Array.from({ length: 9 }).map((_, i) => (
          <circle key={`d1-${i}`} cx={74 + i * 22} cy={188} r="9" fill="#FFF9EF" />
        ))}
        {/* dâu tây */}
        {[
          { x: 84, y: 168 },
          { x: 118, y: 163 },
          { x: 152, y: 163 },
          { x: 186, y: 163 },
          { x: 220, y: 165 },
          { x: 244, y: 170 },
        ].map((p, i) => (
          <g key={`st-${i}`}>
            <circle cx={p.x} cy={p.y} r="11" fill="#E94F5F" />
            <path d={`M ${p.x - 7} ${p.y - 9} L ${p.x} ${p.y - 17} L ${p.x + 7} ${p.y - 9} Z`} fill="#5FBF7A" />
            <circle cx={p.x - 3.5} cy={p.y - 1} r="1.8" fill="#fff" opacity="0.7" />
          </g>
        ))}

        {/* tầng trên */}
        <rect x="96" y="106" width="128" height="60" rx="16" fill="#FFC9DA" />
        <rect x="96" y="96" width="128" height="26" rx="13" fill="#FFF9EF" />
        {Array.from({ length: 6 }).map((_, i) => (
          <circle key={`d2-${i}`} cx={110 + i * 20} cy={120} r="7.5" fill="#FFF9EF" />
        ))}
        {/* bi kem tầng trên */}
        {Array.from({ length: 7 }).map((_, i) => (
          <circle key={`bd-${i}`} cx={108 + i * 17.5} cy={98} r="6" fill="#FFF9EF" stroke="#F3E3C8" strokeWidth="1" />
        ))}

        {/* nến số 1 */}
        <g>
          <rect x="131" y="62" width="9" height="36" rx="4" fill="#E8B84B" />
          <text
            x="135.5"
            y="62"
            textAnchor="middle"
            fontSize="58"
            fontWeight={800}
            fill="#FF5C8A"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke' } as React.CSSProperties}
            fontFamily="'Baloo 2', system-ui, sans-serif"
          >
            1
          </text>
          <rect x="133.5" y="2" width="4" height="9" rx="2" fill="#5B4A3F" />
        </g>

        {/* nến số 7 */}
        <g>
          <rect x="180" y="62" width="9" height="36" rx="4" fill="#E8B84B" />
          <text
            x="184.5"
            y="62"
            textAnchor="middle"
            fontSize="58"
            fontWeight={800}
            fill="#FF5C8A"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke' } as React.CSSProperties}
            fontFamily="'Baloo 2', system-ui, sans-serif"
          >
            7
          </text>
          <rect x="182.5" y="2" width="4" height="9" rx="2" fill="#5B4A3F" />
        </g>

        {/* lửa / khói */}
        {lit ? (
          <>
            <circle className="flame-glow" cx="135.5" cy="-12" r="20" fill="#FFB62E" opacity="0.35" />
            <circle className="flame-glow" cx="184.5" cy="-12" r="20" fill="#FFB62E" opacity="0.35" />
            <g className="flame">
              <ellipse cx="135.5" cy="-14" rx="10" ry="17" fill="url(#flameGrad)" />
            </g>
            <g className="flame" style={{ animationDelay: '-0.22s' }}>
              <ellipse cx="184.5" cy="-14" rx="10" ry="17" fill="url(#flameGrad)" />
            </g>
            <g className="flame-inner">
              <ellipse cx="135.5" cy="-8" rx="4.5" ry="8" fill="#FFFDF5" />
            </g>
            <g className="flame-inner" style={{ animationDelay: '-0.18s' }}>
              <ellipse cx="184.5" cy="-8" rx="4.5" ry="8" fill="#FFFDF5" />
            </g>
          </>
        ) : (
          <>
            <path className="smoke" d="M135.5 2 q -6 -8 0 -16 q 6 -8 0 -16" stroke="#C9BFAE" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path className="smoke" style={{ animationDelay: '-0.7s' }} d="M184.5 2 q 6 -8 0 -16 q -6 -8 0 -16" stroke="#C9BFAE" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </>
        )}
      </svg>
      <div className="text-center font-extrabold -mt-1">
        {lit ? '17 🕯️🕯️' : 'Nến tắt rồi! Yaha!'}
      </div>
    </div>
  )
}
