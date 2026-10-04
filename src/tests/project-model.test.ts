import { describe, expect, it } from 'vitest'
import { createProject } from '../core/project/types'
import { validateProject } from '../core/project/validation'

describe('project model', () => {
  it('uses the frozen stage-1 9:16 defaults', () => {
    const p = createProject()
    expect(p.schemaVersion).toBe(1); expect(p.aspectRatio).toBe('9:16')
    expect([p.canvasWidth, p.canvasHeight]).toEqual([720, 1280])
  })
  it('reports an empty project without crashing', () => {
    expect(validateProject(createProject()).some((x) => x.code === 'NO_CLIPS')).toBe(true)
  })
})
