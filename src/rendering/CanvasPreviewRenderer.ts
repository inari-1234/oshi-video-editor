import type { AssetResolver } from '../core/media/types'
import type { Clip, Project } from '../core/project/types'
import { clipAtTime } from '../core/project/timeline'
import { drawFitted } from './draw'

type MediaEntry = HTMLImageElement | HTMLVideoElement

export class CanvasPreviewRenderer {
  private media = new Map<string, MediaEntry>()
  private activeVideo: HTMLVideoElement | null = null

  constructor(private canvas: HTMLCanvasElement, private resolver: AssetResolver) {}

  private async load(clip: Clip): Promise<MediaEntry | null> {
    const existing = this.media.get(clip.source.assetId)
    if (existing) return existing
    const url = await this.resolver.getObjectUrl(clip.source)
    if (!url) return null
    if (clip.mediaType === 'image') {
      const image = new Image(); image.src = url; await image.decode(); this.media.set(clip.source.assetId, image); return image
    }
    const video = document.createElement('video')
    video.src = url; video.preload = 'auto'; video.playsInline = true; video.muted = true; video.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => { video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error(`動画を読み込めませんでした: ${clip.source.name}`)) })
    this.media.set(clip.source.assetId, video); return video
  }

  async render(project: Project, time: number, playing: boolean): Promise<void> {
    const ctx = this.canvas.getContext('2d'); if (!ctx) throw new Error('Canvas 2D context is unavailable')
    this.canvas.width = project.canvasWidth; this.canvas.height = project.canvasHeight
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    const clip = clipAtTime(project, Math.min(Math.max(time, 0), Math.max(0, project.duration - 0.0001))); if (!clip) return
    const media = await this.load(clip); if (!media) return
    if (media instanceof HTMLImageElement) {
      if (this.activeVideo) this.activeVideo.pause(); this.activeVideo = null
      drawFitted(ctx, media, media.naturalWidth, media.naturalHeight, this.canvas.width, this.canvas.height, clip.fitMode, clip.position, clip.scale); return
    }
    const localTime = (clip.sourceStart ?? 0) + (time - clip.timelineStart)
    if (this.activeVideo && this.activeVideo !== media) this.activeVideo.pause(); this.activeVideo = media
    if (Math.abs(media.currentTime - localTime) > 0.18) media.currentTime = Math.max(0, localTime)
    if (playing && media.paused) await media.play().catch(() => undefined); if (!playing && !media.paused) media.pause()
    if (media.readyState >= 2) drawFitted(ctx, media, media.videoWidth, media.videoHeight, this.canvas.width, this.canvas.height, clip.fitMode, clip.position, clip.scale)
  }

  pause(): void { this.activeVideo?.pause() }
  dispose(): void { for (const item of this.media.values()) if (item instanceof HTMLVideoElement) item.pause(); this.media.clear(); this.activeVideo = null }
}
