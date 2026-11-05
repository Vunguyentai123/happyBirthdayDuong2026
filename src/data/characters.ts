import { asset } from './assets'

export type UsagiRole = 'idle' | 'hop1' | 'hop2' | 'hop3' | 'hop4' | 'hop5' | 'hop6' | 'waiting' | 'cheer' | 'bounce'
export type MomongaRole = 'idle' | 'angel' | 'magic' | 'wave' | 'guard' | 'writing'
export type CharacterName = 'usagi' | 'momonga'

export interface CharacterRoleDef {
  file: string
  label: string
}

export const usagiRoles: Record<UsagiRole, CharacterRoleDef> = {
  idle: { file: asset('/characters/usagi-01.png'), label: 'Usagi dung thang' },
  hop1: { file: asset('/characters/usagi-01.png'), label: 'Usagi hop 1' },
  hop2: { file: asset('/characters/usagi-02.png'), label: 'Usagi hop 2' },
  hop3: { file: asset('/characters/usagi-03.png'), label: 'Usagi hop 3' },
  hop4: { file: asset('/characters/usagi-04.png'), label: 'Usagi hop 4' },
  hop5: { file: asset('/characters/usagi-05.png'), label: 'Usagi hop 5' },
  hop6: { file: asset('/characters/usagi-06.png'), label: 'Usagi hop 6' },
  waiting: { file: asset('/characters/usagi-07.png'), label: 'Usagi nam uon cho' },
  cheer: { file: asset('/characters/usagi-08.png'), label: 'Usagi chu V le luoi' },
  bounce: { file: asset('/characters/usagi-09.png'), label: 'Usagi nhun nhay' },
}

export const momongaRoles: Record<MomongaRole, CharacterRoleDef> = {
  idle: { file: asset('/characters/momonga-01.png'), label: 'Momonga la ca' },
  angel: { file: asset('/characters/momonga-02.png'), label: 'Momonga thien than' },
  magic: { file: asset('/characters/momonga-04.png'), label: 'Momonga tien phep' },
  wave: { file: asset('/characters/momonga-05.png'), label: 'Momonga vay duoi' },
  guard: { file: asset('/characters/momonga-06.png'), label: 'Momonga hau gai chan cua' },
  writing: { file: asset('/characters/momonga-07.png'), label: 'Momonga nam ve so' },
}

export function getCharacterFile(name: CharacterName, role: string): string {
  if (name === 'usagi') return usagiRoles[role as UsagiRole]?.file ?? usagiRoles.idle.file
  return momongaRoles[role as MomongaRole]?.file ?? momongaRoles.idle.file
}

// Khung UsagiHop: usagi-01..06 o 5-6fps
export const usagiHopFrames: string[] = [
  usagiRoles.hop1.file,
  usagiRoles.hop2.file,
  usagiRoles.hop3.file,
  usagiRoles.hop4.file,
  usagiRoles.hop5.file,
  usagiRoles.hop6.file,
]
