import type { Project } from './types'

export interface ProjectIssue { code: string; message: string; level: 'error' | 'warning'; clipId?: string }

export function validateProject(project: Project): ProjectIssue[] {
  const issues: ProjectIssue[] = []
  if (project.aspectRatio !== '9:16') issues.push({ code: 'ASPECT', level: 'error', message: '工程1は9:16のみ対応です。' })
  if (!project.clips.length) issues.push({ code: 'NO_CLIPS', level: 'error', message: '写真または動画を1つ以上追加してください。' })
  for (const clip of project.clips) {
    if (clip.timelineDuration <= 0) issues.push({ code: 'BAD_DURATION', level: 'error', message: 'クリップ長が不正です。', clipId: clip.id })
    if (clip.source.requiresRelink) issues.push({ code: 'RELINK_REQUIRED', level: 'error', message: clip.source.name + ' を再選択してください。', clipId: clip.id })
  }
  return issues
}
