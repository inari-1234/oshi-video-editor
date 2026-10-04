import type { ImportedAsset, MediaAdapter } from '../../core/media/types'
import type { AssetReference, MediaType } from '../../core/project/types'
import { IndexedDbStorage } from '../storage/IndexedDbStorage'

function inferKind(file: File): MediaType | null {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return null
}

async function metadataDuration(file: File, kind: MediaType): Promise<number | undefined> {
  if (kind === 'image') return Promise.resolve(undefined)
  return new Promise((resolve, reject) => {
    const element = document.createElement(kind === 'video' ? 'video' : 'audio')
    const url = URL.createObjectURL(file)
    element.preload = 'metadata'
    element.onloadedmetadata = () => {
      const duration = Number.isFinite(element.duration) ? element.duration : undefined
      URL.revokeObjectURL(url)
      resolve(duration)
    }
    element.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`${kind === 'video' ? '動画' : '音声'}のメタデータを読み込めませんでした。`))
    }
    element.src = url
  })
}

export class PwaMediaAdapter implements MediaAdapter {
  constructor(private storage: IndexedDbStorage) {}

  async importFiles(filesLike: FileList | File[], expected?: MediaType): Promise<ImportedAsset[]> {
    const files = Array.from(filesLike)
    const imported: ImportedAsset[] = []
    for (const file of files) {
      const kind = inferKind(file)
      if (!kind || (expected && kind !== expected)) throw new Error(`未対応の素材形式です: ${file.name}`)
      const duration = await metadataDuration(file, kind)
      let ref: AssetReference = {
        assetId: crypto.randomUUID(), kind, name: file.name, mimeType: file.type || 'application/octet-stream',
        size: file.size, duration, persistence: 'ephemeral', requiresRelink: false,
      }
      ref = await this.storage.storeAsset(ref, file)
      const objectUrl = await this.storage.getObjectUrl(ref)
      if (!objectUrl) throw new Error(`素材を読み込めませんでした: ${file.name}`)
      imported.push({ ref, blob: file, objectUrl })
    }
    return imported
  }
}
