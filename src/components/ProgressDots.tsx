import { sceneOrder, useSceneStore, type SceneId } from '../store/useSceneStore'

export function ProgressDots({ onJump }: { onJump?: (s: SceneId) => void }) {
  const scene = useSceneStore((s) => s.scene)
  const unlocked = useSceneStore((s) => s.unlocked)
  const idx = sceneOrder.indexOf(scene)
  return (
    <nav aria-label="Tien do" className="flex items-center justify-center gap-2 py-2">
      {sceneOrder.map((s, i) => {
        const active = i === idx
        const done = i < idx
        const reachable = unlocked && onJump && i <= idx
        return (
          <button
            key={s}
            aria-label={`Màn ${i + 1}${active ? ' (hiện tại)' : ''}`}
            aria-current={active ? 'step' : undefined}
            disabled={!reachable}
            onClick={() => reachable && onJump?.(s)}
            className={`h-3 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 ${
              active
                ? 'w-8 bg-gradient-to-r from-rose-400 to-amber-400 shadow-[0_3px_10px_-2px_rgba(244,114,182,.65)]'
                : done
                  ? 'w-3 bg-emerald-300'
                  : 'w-3 border border-rose-200 bg-white/70'
            }`}
          />
        )
      })}
    </nav>
  )
}
