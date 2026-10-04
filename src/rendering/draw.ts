import type { FitMode, Point } from '../core/project/types'

export function drawFitted(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  fitMode: FitMode,
  position: Point,
  scale = 1,
): void {
  const base = fitMode === 'cover'
    ? Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight)
    : Math.min(canvasWidth / sourceWidth, canvasHeight / sourceHeight)
  const s = base * scale
  const width = sourceWidth * s
  const height = sourceHeight * s
  const freeX = canvasWidth - width
  const freeY = canvasHeight - height
  const x = freeX * position.x
  const y = freeY * position.y
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  ctx.drawImage(source, x, y, width, height)
}
