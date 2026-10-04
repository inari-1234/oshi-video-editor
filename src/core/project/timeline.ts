import type { AssetReference, Clip, Project } from './types'

const touch = (project: Project): Project => ({ ...project, updatedAt: new Date().toISOString() })

export function normalizeTimeline(project: Project): Project {
  let cursor = 0
  const clips = project.clips.map((clip) => {
    const normalized = { ...clip, timelineStart: cursor }
    cursor += clip.timelineDuration
    return normalized
  })
  return touch({ ...project, clips, duration: cursor })
}

export function addAssetAsClip(project: Project, source: AssetReference): Project {
  if (source.kind === 'audio') return project
  const duration = source.kind === 'image' ? 3 : Math.min(source.duration ?? 3, 8)
  const clip: Clip = {
    id: crypto.randomUUID(),
    mediaType: source.kind,
    source,
    timelineStart: project.duration,
    timelineDuration: Math.max(0.1, duration),
    sourceStart: source.kind === 'video' ? 0 : undefined,
    sourceDuration: source.kind === 'video' ? Math.max(0.1, duration) : undefined,
    fitMode: 'cover',
    position: { x: 0.5, y: 0.5 },
    scale: 1,
  }
  return normalizeTimeline({ ...project, clips: [...project.clips, clip] })
}

export function removeClip(project: Project, clipId: string): Project {
  return normalizeTimeline({ ...project, clips: project.clips.filter((clip) => clip.id !== clipId) })
}

export function moveClip(project: Project, clipId: string, direction: -1 | 1): Project {
  const index = project.clips.findIndex((clip) => clip.id === clipId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= project.clips.length) return project
  const clips = [...project.clips]
  ;[clips[index], clips[target]] = [clips[target], clips[index]]
  return normalizeTimeline({ ...project, clips })
}

export function updatePhotoDuration(project: Project, clipId: string, seconds: number): Project {
  const clips = project.clips.map((clip) => clip.id === clipId && clip.mediaType === 'image'
    ? { ...clip, timelineDuration: Math.max(0.2, seconds) }
    : clip)
  return normalizeTimeline({ ...project, clips })
}

export function trimVideo(project: Project, clipId: string, sourceStart: number, sourceDuration: number): Project {
  const clips = project.clips.map((clip) => {
    if (clip.id !== clipId || clip.mediaType !== 'video') return clip
    const maxDuration = clip.source.duration ?? sourceStart + sourceDuration
    const start = Math.max(0, Math.min(sourceStart, Math.max(0, maxDuration - 0.1)))
    const duration = Math.max(0.1, Math.min(sourceDuration, maxDuration - start))
    return { ...clip, sourceStart: start, sourceDuration: duration, timelineDuration: duration }
  })
  return normalizeTimeline({ ...project, clips })
}

export function clipAtTime(project: Project, time: number): Clip | undefined {
  return project.clips.find((clip) => time >= clip.timelineStart && time < clip.timelineStart + clip.timelineDuration)
}
