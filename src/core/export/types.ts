import type { Project } from '../project/types'

export interface ExportOptions {
  width: 720 | 1080
  height: 1280 | 1920
  fps: 30
}

export interface ExportCapability {
  supported: boolean
  mimeType: string | null
  container: 'mp4' | 'webm' | null
  reasons: string[]
}

export interface ExportProgress {
  ratio: number
  elapsed: number
  duration: number
}

export interface ExportRenderer {
  detectCapability(): ExportCapability
  export(project: Project, options: ExportOptions, onProgress?: (progress: ExportProgress) => void): Promise<Blob>
}
