import { create } from 'zustand'

export type SceneId = 'lock' | 'greeting' | 'candle' | 'photos' | 'letter' | 'gift'
export const sceneOrder: SceneId[] = ['lock', 'greeting', 'candle', 'photos', 'letter', 'gift']

export interface SceneStore {
  scene: SceneId
  progress: number // 0..1 trong man hien tai (dung cho backdrop doi mau/toc do)
  wishBlown: boolean // da thoi dieu uoc (mat banh doi sang ban cuoi + confetti)
  giftOpen: boolean
  unlocked: boolean
  musicOn: boolean
  trackIndex: number
  gatePassed: boolean // tra loi dung ca 3 cau man khoa
  setScene: (s: SceneId) => void
  next: () => void
  restart: () => void
  setProgress: (p: number) => void
  setWishBlown: (v: boolean) => void
  setGiftOpen: (v: boolean) => void
  setUnlocked: (v: boolean) => void
  setMusicOn: (v: boolean) => void
  nextTrack: () => void
  setGatePassed: (v: boolean) => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  scene: 'lock',
  progress: 0,
  wishBlown: false,
  giftOpen: false,
  unlocked: false,
  musicOn: false,
  trackIndex: 0,
  gatePassed: false,
  setScene: (scene) => set({ scene, progress: 0 }),
  next: () =>
    set((s) => {
      const i = sceneOrder.indexOf(s.scene)
      if (i < 0 || i >= sceneOrder.length - 1) return s
      return { scene: sceneOrder[i + 1], progress: 0 }
    }),
  restart: () => set({ scene: 'lock', progress: 0, wishBlown: false, giftOpen: false, unlocked: false, gatePassed: false }),
  setProgress: (progress) => set({ progress }),
  setWishBlown: (wishBlown) => set({ wishBlown }),
  setGiftOpen: (giftOpen) => set({ giftOpen }),
  setUnlocked: (unlocked) => set({ unlocked }),
  setMusicOn: (musicOn) => set({ musicOn }),
  nextTrack: () => set((s) => ({ trackIndex: s.trackIndex + 1 })),
  setGatePassed: (gatePassed) => set({ gatePassed }),
}))
