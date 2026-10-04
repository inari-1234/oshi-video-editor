import type { AssetReference, MediaType } from '../project/types'

export interface ImportedAsset {
  ref: AssetReference
  blob: Blob
  objectUrl: string
}

export interface MediaAdapter {
  importFiles(files: FileList | File[], expected?: MediaType): Promise<ImportedAsset[]>
}

export interface AssetResolver {
  getBlob(ref: AssetReference): Promise<Blob | null>
  getObjectUrl(ref: AssetReference): Promise<string | null>
  releaseObjectUrl(assetId: string): void
  releaseAllObjectUrls(): void
}
