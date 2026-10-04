export type MediaType = 'image' | 'video' | 'audio'
export type FitMode = 'contain' | 'cover'
export type AssetPersistence = 'indexeddb' | 'ephemeral'

export interface AssetReference {
  assetId: string
  kind: MediaType
  name: string
  mimeType: string
  size: number
  duration?: number
  persistence: AssetPersistence
  requiresRelink?: boolean
}

export interface Point { x: number; y: number }

export interface Clip {
  id: string
  mediaType: 'image' | 'video'
  source: AssetReference
  timelineStart: number
  timelineDuration: number
  sourceStart?: number
  sourceDuration?: number
  fitMode: FitMode
  position: Point
  scale: number
}

export interface MusicTrack {
  source: AssetReference
  timelineStart: number
  sourceStart: number
  volume: number
}

export interface Project {
  schemaVersion: 1
  id: string
  title: string
  aspectRatio: '9:16'
  canvasWidth: 720 | 1080
  canvasHeight: 1280 | 1920
  duration: number
  music: MusicTrack | null
  clips: Clip[]
  createdAt: string
  updatedAt: string
}

export const createProject = (title = '新しい推し動画'): Project => {
  const now = new Date().toISOString()
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    title,
    aspectRatio: '9:16',
    canvasWidth: 720,
    canvasHeight: 1280,
    duration: 0,
    music: null,
    clips: [],
    createdAt: now,
    updatedAt: now,
  }
}
