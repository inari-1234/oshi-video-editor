import { describe, expect, it } from 'vitest'
import { createProject, type AssetReference } from '../core/project/types'
import { addAssetAsClip, moveClip, removeClip, trimVideo, updatePhotoDuration } from '../core/project/timeline'

const image = (name: string): AssetReference => ({ assetId: name, kind: 'image', name, mimeType: 'image/png', size: 100, persistence: 'indexeddb' })
const video = (name: string, duration = 10): AssetReference => ({ assetId: name, kind: 'video', name, mimeType: 'video/mp4', size: 100, duration, persistence: 'indexeddb' })

describe('timeline', () => {
  it('A: creates a photo-only project', () => { const p = addAssetAsClip(createProject(), image('photo')); expect(p.clips).toHaveLength(1); expect(p.duration).toBe(3) })
  it('B/E: creates and trims a video project', () => { let p = addAssetAsClip(createProject(), video('video')); p = trimVideo(p, p.clips[0].id, 2, 4); expect(p.clips[0].sourceStart).toBe(2); expect(p.clips[0].timelineDuration).toBe(4) })
  it('C/D: mixes and reorders media', () => { let p = createProject(); p = addAssetAsClip(p, image('a')); p = addAssetAsClip(p, video('b', 5)); p = moveClip(p, p.clips[1].id, -1); expect(p.clips[0].source.name).toBe('b'); expect(p.clips[1].timelineStart).toBe(p.clips[0].timelineDuration) })
  it('F: changes photo duration', () => { let p = addAssetAsClip(createProject(), image('photo')); p = updatePhotoDuration(p, p.clips[0].id, 5.5); expect(p.duration).toBe(5.5) })
  it('removes a clip', () => { let p = createProject(); p = addAssetAsClip(p, image('a')); p = addAssetAsClip(p, image('b')); p = removeClip(p, p.clips[0].id); expect(p.clips[0].timelineStart).toBe(0); expect(p.duration).toBe(3) })
})
