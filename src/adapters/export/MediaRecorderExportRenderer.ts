import type { AssetResolver } from '../../core/media/types'
import type { Project } from '../../core/project/types'
import type { ExportCapability, ExportOptions, ExportProgress, ExportRenderer } from '../../core/export/types'
import { clipAtTime } from '../../core/project/timeline'
import { drawFitted } from '../../rendering/draw'

const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp8,opus','video/webm']

export class MediaRecorderExportRenderer implements ExportRenderer {
  constructor(private resolver: AssetResolver) {}
  detectCapability(): ExportCapability {
    const reasons: string[] = []
    if (typeof MediaRecorder === 'undefined') reasons.push('MediaRecorder API がありません。')
    if (!HTMLCanvasElement.prototype.captureStream) reasons.push('Canvas captureStream API がありません。')
    const mimeType = typeof MediaRecorder === 'undefined' ? null : types.find(x => MediaRecorder.isTypeSupported(x)) ?? null
    if (!mimeType) reasons.push('対応する動画形式を検出できませんでした。')
    return { supported: reasons.length === 0, mimeType, container: mimeType?.includes('mp4') ? 'mp4' : mimeType ? 'webm' : null, reasons }
  }
  async export(project: Project, options: ExportOptions, onProgress?: (p: ExportProgress) => void): Promise<Blob> {
    const cap = this.detectCapability()
    if (!cap.supported || !cap.mimeType) throw new Error(cap.reasons.join(' '))
    const canvas = document.createElement('canvas'); canvas.width=options.width; canvas.height=options.height
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvasを作成できません。')
    const visuals = new Map<string, HTMLImageElement|HTMLVideoElement>()
    for (const clip of project.clips) {
      const url = await this.resolver.getObjectUrl(clip.source); if (!url) throw new Error('素材が見つかりません。')
      if (clip.mediaType === 'image') { const el=new Image(); el.src=url; await el.decode(); visuals.set(clip.id,el) }
      else { const el=document.createElement('video'); el.src=url; el.muted=true; el.playsInline=true; await new Promise<void>((ok,bad)=>{el.onloadeddata=()=>ok();el.onerror=()=>bad(new Error('動画読込失敗'))}); visuals.set(clip.id,el) }
    }
    const AC = window.AudioContext ?? (window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext
    if (!AC) throw new Error('Web Audio API がありません。')
    const ac=new AC(); await ac.resume(); const dest=ac.createMediaStreamDestination()
    let bgm: AudioBufferSourceNode|null=null
    if (project.music) {
      const b=await this.resolver.getBlob(project.music.source); if(!b) throw new Error('BGMが見つかりません。')
      const buf=await ac.decodeAudioData(await b.arrayBuffer()); const gain=ac.createGain(); gain.gain.value=project.music.volume; gain.connect(dest)
      bgm=ac.createBufferSource(); bgm.buffer=buf; bgm.connect(gain); bgm.start(ac.currentTime+project.music.timelineStart, Math.min(project.music.sourceStart,Math.max(0,buf.duration-.01)))
    }
    const cs=canvas.captureStream(options.fps), out=new MediaStream()
    cs.getVideoTracks().forEach(t=>out.addTrack(t)); dest.stream.getAudioTracks().forEach(t=>out.addTrack(t))
    const chunks:BlobPart[]=[]; const rec=new MediaRecorder(out,{mimeType:cap.mimeType}); rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)}
    const started=performance.now()
    return await new Promise<Blob>((resolve,reject)=>{
      rec.onerror=()=>reject(new Error('動画エンコードに失敗しました。'))
      rec.onstop=()=>{ cs.getTracks().forEach(t=>t.stop()); out.getTracks().forEach(t=>t.stop()); void ac.close(); resolve(new Blob(chunks,{type:cap.container==='mp4'?'video/mp4':'video/webm'})) }
      rec.start(1000)
      const frame=async()=>{ const t=Math.min(project.duration,(performance.now()-started)/1000); const clip=clipAtTime(project,Math.min(t,Math.max(0,project.duration-.001)))
        ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height)
        if(clip){const m=visuals.get(clip.id);if(m instanceof HTMLImageElement)drawFitted(ctx,m,m.naturalWidth,m.naturalHeight,canvas.width,canvas.height,clip.fitMode,clip.position,clip.scale)
        else if(m){m.currentTime=Math.max(0,(clip.sourceStart??0)+t-clip.timelineStart);await m.play().catch(()=>undefined);if(m.readyState>=2)drawFitted(ctx,m,m.videoWidth,m.videoHeight,canvas.width,canvas.height,clip.fitMode,clip.position,clip.scale)}}
        onProgress?.({ratio:project.duration?t/project.duration:1,elapsed:t,duration:project.duration}); if(t>=project.duration)rec.stop();else requestAnimationFrame(()=>{void frame()})}
      void frame()
    })
  }
}
