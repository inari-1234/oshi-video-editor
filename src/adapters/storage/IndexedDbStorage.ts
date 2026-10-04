import type { AssetReference, Project } from '../../core/project/types'
import type { AssetResolver } from '../../core/media/types'

const DB_NAME = 'oshi-video-stage1'
const DB_VERSION = 1
const PROJECTS = 'projects'
const ASSETS = 'assets'
const MAX_PERSISTED_ASSET_BYTES = 64 * 1024 * 1024
const SOFT_TOTAL_ASSET_BUDGET = 256 * 1024 * 1024

interface StoredAsset { assetId: string; blob: Blob; savedAt: string }

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(ASSETS)) db.createObjectStore(ASSETS, { keyPath: 'assetId' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

async function persistedBytes(db: IDBDatabase): Promise<number> {
  const tx = db.transaction(ASSETS, 'readonly')
  const rows = await requestToPromise(tx.objectStore(ASSETS).getAll()) as StoredAsset[]
  return rows.reduce((sum, row) => sum + row.blob.size, 0)
}

export class IndexedDbStorage implements AssetResolver {
  private sessionAssets = new Map<string, Blob>()
  private objectUrls = new Map<string, string>()

  async saveProject(project: Project): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(PROJECTS, 'readwrite')
    await requestToPromise(tx.objectStore(PROJECTS).put(project))
  }

  async loadProject(projectId: string): Promise<Project | null> {
    const db = await openDb()
    const tx = db.transaction(PROJECTS, 'readonly')
    const project = await requestToPromise(tx.objectStore(PROJECTS).get(projectId)) as Project | undefined
    if (!project) return null
    const clips = await Promise.all(project.clips.map(async (clip) => ({
      ...clip,
      source: { ...clip.source, requiresRelink: !(await this.getBlob(clip.source)) },
    })))
    let music = project.music
    if (music) music = { ...music, source: { ...music.source, requiresRelink: !(await this.getBlob(music.source)) } }
    return { ...project, clips, music }
  }

  async listProjects(): Promise<Project[]> {
    const db = await openDb()
    const tx = db.transaction(PROJECTS, 'readonly')
    const rows = await requestToPromise(tx.objectStore(PROJECTS).getAll()) as Project[]
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async storeAsset(ref: AssetReference, blob: Blob): Promise<AssetReference> {
    if (blob.size > MAX_PERSISTED_ASSET_BYTES) {
      this.sessionAssets.set(ref.assetId, blob)
      return { ...ref, persistence: 'ephemeral' }
    }

    const db = await openDb()
    const used = await persistedBytes(db)
    let quotaSafe = true
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      if (estimate.quota && estimate.usage) quotaSafe = estimate.usage + blob.size < estimate.quota * 0.8
    }
    if (!quotaSafe || used + blob.size > SOFT_TOTAL_ASSET_BUDGET) {
      this.sessionAssets.set(ref.assetId, blob)
      return { ...ref, persistence: 'ephemeral' }
    }

    const tx = db.transaction(ASSETS, 'readwrite')
    await requestToPromise(tx.objectStore(ASSETS).put({ assetId: ref.assetId, blob, savedAt: new Date().toISOString() } satisfies StoredAsset))
    return { ...ref, persistence: 'indexeddb' }
  }

  async getBlob(ref: AssetReference): Promise<Blob | null> {
    const session = this.sessionAssets.get(ref.assetId)
    if (session) return session
    const db = await openDb()
    const tx = db.transaction(ASSETS, 'readonly')
    const row = await requestToPromise(tx.objectStore(ASSETS).get(ref.assetId)) as StoredAsset | undefined
    return row?.blob ?? null
  }

  async getObjectUrl(ref: AssetReference): Promise<string | null> {
    const existing = this.objectUrls.get(ref.assetId)
    if (existing) return existing
    const blob = await this.getBlob(ref)
    if (!blob) return null
    const url = URL.createObjectURL(blob)
    this.objectUrls.set(ref.assetId, url)
    return url
  }

  releaseObjectUrl(assetId: string): void {
    const url = this.objectUrls.get(assetId)
    if (url) URL.revokeObjectURL(url)
    this.objectUrls.delete(assetId)
  }

  releaseAllObjectUrls(): void {
    for (const url of this.objectUrls.values()) URL.revokeObjectURL(url)
    this.objectUrls.clear()
  }
}

export const assetPersistenceLimits = {
  maxPersistedAssetBytes: MAX_PERSISTED_ASSET_BYTES,
  softTotalAssetBudget: SOFT_TOTAL_ASSET_BUDGET,
}
