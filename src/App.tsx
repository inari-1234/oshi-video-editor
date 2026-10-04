import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { createProject, type Clip, type Project } from './core/project/types'
import { addAssetAsClip, moveClip, removeClip, trimVideo, updatePhotoDuration } from './core/project/timeline'
import { validateProject } from './core/project/validation'
import { IndexedDbStorage } from './adapters/storage/IndexedDbStorage'
import { PwaMediaAdapter } from './adapters/pwa/PwaMediaAdapter'
import { CanvasPreviewRenderer } from './rendering/CanvasPreviewRenderer'
import { MediaRecorderExportRenderer } from './adapters/export/MediaRecorderExportRenderer'
import { generateStage1TestFiles } from './testdata/generateTestMedia'

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

function friendlyError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') return '靽�摰寥���頞喋��艾��整��之��蝝������艾�����'
  if (error instanceof Error) return error.message
  return '�衣��怠仃���整���閰西��������'
}

export default function App() {
  const storage = useMemo(() => new IndexedDbStorage(), [])
  const mediaAdapter = useMemo(() => new PwaMediaAdapter(storage), [storage])
  const exporter = useMemo(() => new MediaRecorderExportRenderer(storage), [storage])
  const [project, setProject] = useState<Project>(() => createProject())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [message, setMessage] = useState('蝝��蕭���衣楊��憪��艾�����')
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [musicUrl, setMusicUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<CanvasPreviewRenderer | null>(null)
  const playbackStartRef = useRef(0)
  const playbackFromRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)

  const selected = project.clips.find((clip) => clip.id === selectedId) ?? null
  const capability = exporter.detectCapability()

  useEffect(() => {
    if (!canvasRef.current) return
    rendererRef.current = new CanvasPreviewRenderer(canvasRef.current, storage)
    return () => rendererRef.current?.dispose()
  }, [storage])

  useEffect(() => {
    let cancelled = false
    if (!project.music) { setMusicUrl(null); return }
    void storage.getObjectUrl(project.music.source).then((url) => { if (!cancelled) setMusicUrl(url) })
    return () => { cancelled = true }
  }, [project.music?.source.assetId, storage])

  const syncMusic = useCallback((at: number, shouldPlay: boolean) => {
    const audio = musicAudioRef.current
    if (!audio || !project.music || !musicUrl) return
    audio.pause()
    if (at < project.music.timelineStart) return
    const desired = project.music.sourceStart + (at - project.music.timelineStart)
    if (Math.abs(audio.currentTime - desired) > 0.25) audio.currentTime = Math.max(0, desired)
    audio.volume = project.music.volume
    if (shouldPlay) void audio.play().catch(() => undefined)
  }, [project.music, musicUrl])


  useEffect(() => {
    void rendererRef.current?.render(project, time, playing).catch((e) => setError(friendlyError(e)))
  }, [project, time, playing])

  useEffect(() => {
    if (!playing) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rendererRef.current?.pause()
      musicAudioRef.current?.pause()
      return
    }
    playbackStartRef.current = performance.now()
    playbackFromRef.current = time
    syncMusic(time, true)
    const tick = () => {
      const next = playbackFromRef.current + (performance.now() - playbackStartRef.current) / 1000
      if (next >= project.duration) {
        setTime(project.duration)
        setPlaying(false)
        return
      }
      setTime(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  const importVisuals = async (files: FileList | File[]) => {
    setError(null)
    try {
      const imported = await mediaAdapter.importFiles(files)
      let next = project
      for (const item of imported) if (item.ref.kind !== 'audio') next = addAssetAsClip(next, item.ref)
      setProject(next)
      setSelectedId(next.clips.at(-1)?.id ?? null)
      setMessage(`${imported.length}隞嗚蝝��蕭���整��)
    } catch (e) { setError(friendlyError(e)) }
  }

  const importMusic = async (files: FileList | File[]) => {
    setError(null)
    try {
      const [item] = await mediaAdapter.importFiles(files, 'audio')
      if (!item) return
      setProject((p) => ({ ...p, music: { source: item.ref, timelineStart: 0, sourceStart: 0, volume: 0.7 }, updatedAt: new Date().toISOString() }))
      setMessage('BGM�身摰��整���')
    } catch (e) { setError(friendlyError(e)) }
  }

  const handleVisualInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) void importVisuals(event.target.files)
    event.target.value = ''
  }
  const handleMusicInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) void importMusic(event.target.files)
    event.target.value = ''
  }

  const save = async () => {
    try { await storage.saveProject(project); setMessage('Project��摮��整���'); setError(null) }
    catch (e) { setError(friendlyError(e)) }
  }

  const loadLatest = async () => {
    try {
      const list = await storage.listProjects()
      if (!list[0]) { setMessage('靽�皜Project�胯������'); return }
      const loaded = await storage.loadProject(list[0].id)
      if (!loaded) return
      setProject(loaded); setSelectedId(loaded.clips[0]?.id ?? null); setTime(0); setPlaying(false)
      const missing = validateProject(loaded).filter((x) => x.code === 'RELINK_REQUIRED').length
      setMessage(missing ? `Project�儔���整����豢���閬蝝�: ${missing}隞跆 : 'Project�儔���整���')
    } catch (e) { setError(friendlyError(e)) }
  }

  const makeTestProject = async () => {
    setError(null); setMessage('�����������')
    try {
      const files = await generateStage1TestFiles()
      const visualAssets = await mediaAdapter.importFiles([...files.photos, ...files.videos])
      const musicAsset = (await mediaAdapter.importFiles([files.music], 'audio'))[0]
      let next = createProject('撌亦�1 ��roject')
      for (const asset of visualAssets) next = addAssetAsClip(next, asset.ref)
      next = { ...next, music: { source: musicAsset.ref, timelineStart: 0, sourceStart: 0, volume: 0.55 } }
      setProject(next); setSelectedId(next.clips[0]?.id ?? null); setTime(0); setMessage('��2��2�研BGM1�研��roject�����整���')
    } catch (e) { setError(friendlyError(e)) }
  }

  const exportVideo = async () => {
    setError(null)
    const issues = validateProject(project)
    if (issues.length) { setError(issues.map((x) => x.message).join(' / ')); return }
    setExporting(true); setExportProgress(0)
    try {
      const blob = await exporter.export(project, { width: project.canvasWidth, height: project.canvasHeight, fps: 30 }, (p) => setExportProgress(p.ratio))
      const extension = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `oshi-video-${Date.now()}.${extension}`; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setMessage(extension === 'mp4' ? 'MP4綷��詻��箝��整��Phone�柴��～�怒�����蝣箄��������' : 'WebM��������柴��押�嗚�烘P4�湔�����箝����扼���')
    } catch (e) { setError(`�詻��箝�憭望�: ${friendlyError(e)}`) }
    finally { setExporting(false) }
  }

  const patchSelected = (fn: (clip: Clip) => Project) => { if (selected) setProject(fn(selected)) }

  return <main className="app-shell">
    <audio ref={musicAudioRef} src={musicUrl ?? undefined} preload="auto" hidden />
    <header className="topbar">
      <div><div className="eyebrow">STAGE 1</div><h1>�具��蝺券�</h1></div>
      <button className="ghost" onClick={() => { storage.releaseAllObjectUrls(); setProject(createProject()); setSelectedId(null); setTime(0); setPlaying(false) }}>�啗�</button>
    </header>

    {error && <div className="notice error"><strong>�衣��扼��整����</strong><span>{error}</span></div>}
    <div className="notice"><span>{message}</span></div>

    <section className="preview-card">
      <div className="canvas-wrap"><canvas ref={canvasRef} aria-label="9:16 preview" /></div>
      <div className="playback-row">
        <button onClick={() => { if (project.duration > 0) { const nextTime = time >= project.duration ? 0 : time; if (time >= project.duration) setTime(0); if (!playing) syncMusic(nextTime, true); else musicAudioRef.current?.pause(); setPlaying((x) => !x) } }}>{playing ? '銝��甇�' : '��'}</button>
        <input aria-label="��雿蔭" type="range" min="0" max={Math.max(project.duration, 0.01)} step="0.01" value={Math.min(time, project.duration)} onChange={(e: ChangeEvent<HTMLInputElement>) => { setPlaying(false); setTime(Number(e.target.value)); syncMusic(Number(e.target.value), false) }} />
        <span>{formatTime(time)} / {formatTime(project.duration)}</span>
      </div>
    </section>

    <section className="timeline-card">
      <div className="section-title"><h2>�踴��扎</h2><span>{project.clips.length} clips</span></div>
      <div className="clip-list">
        {project.clips.map((clip, index) => <button key={clip.id} className={`clip-chip ${selectedId === clip.id ? 'selected' : ''}`} onClick={() => setSelectedId(clip.id)}>
          <span className="clip-index">{index + 1}</span><span>{clip.mediaType === 'image' ? '��' : '�'}</span><strong>{clip.source.name}</strong><span>{clip.timelineDuration.toFixed(1)}蝘�</span>
        </button>)}
        {!project.clips.length && <div className="empty">���整��臬��颯�餈賢��������</div>}
      </div>

      {selected && <div className="inspector">
        <div><strong>{selected.source.name}</strong><span>{selected.mediaType === 'image' ? '��' : '�'} / {selected.fitMode}</span></div>
        <div className="inspector-controls">
          <button onClick={() => setProject(moveClip(project, selected.id, -1))}>�� �</button>
          <button onClick={() => setProject(moveClip(project, selected.id, 1))}>敺��� ��</button>
          <button onClick={() => patchSelected((clip) => ({ ...project, clips: project.clips.map((c) => c.id === clip.id ? { ...c, fitMode: c.fitMode === 'cover' ? 'contain' : 'cover' } : c), updatedAt: new Date().toISOString() }))}>{selected.fitMode === 'cover' ? '�其�銵函內' : '�駁��晞�'}</button>
          <button className="danger" onClick={() => { storage.releaseObjectUrl(selected.source.assetId); setProject(removeClip(project, selected.id)); setSelectedId(null) }}>�</button>
        </div>
        {selected.mediaType === 'image' ? <label>銵函內�� <input type="number" min="0.2" max="30" step="0.1" value={selected.timelineDuration} onChange={(e: ChangeEvent<HTMLInputElement>) => setProject(updatePhotoDuration(project, selected.id, Number(e.target.value)))} /> 蝘�</label>
          : <div className="trim-grid">
            <label>�� <input type="number" min="0" step="0.1" value={selected.sourceStart ?? 0} onChange={(e: ChangeEvent<HTMLInputElement>) => setProject(trimVideo(project, selected.id, Number(e.target.value), selected.sourceDuration ?? selected.timelineDuration))} /></label>
            <label>雿輻蝘 <input type="number" min="0.1" step="0.1" value={selected.sourceDuration ?? selected.timelineDuration} onChange={(e: ChangeEvent<HTMLInputElement>) => setProject(trimVideo(project, selected.id, selected.sourceStart ?? 0, Number(e.target.value)))} /></label>
          </div>}
      </div>}
    </section>

    <section className="music-card">
      <div className="section-title"><h2>BGM</h2><span>1 track</span></div>
      {project.music ? <div className="music-controls">
        <strong>{project.music.source.name}</strong>
        <label>��雿蔭 <input type="number" min="0" step="0.1" value={project.music.sourceStart} onChange={(e: ChangeEvent<HTMLInputElement>) => setProject({ ...project, music: project.music ? { ...project.music, sourceStart: Number(e.target.value) } : null })} /> 蝘�</label>
        <label>�喲� <input type="range" min="0" max="1" step="0.05" value={project.music.volume} onChange={(e: ChangeEvent<HTMLInputElement>) => setProject({ ...project, music: project.music ? { ...project.music, volume: Number(e.target.value) } : null })} /></label>
        <button className="ghost" onClick={() => setProject({ ...project, music: null })}>BGM閫�</button>
      </div> : <span className="muted">BGM�舀閮剖��扼���</span>}
    </section>

    <section className="export-card">
      <div className="section-title"><h2>�詻��箝�</h2><span>{project.canvasWidth}�{project.canvasHeight}</span></div>
      <div className={`capability ${capability.supported ? 'ok' : 'bad'}`}>
        {capability.supported ? `�拍�航: ${capability.mimeType}` : capability.reasons.join(' ')}
      </div>
      <label className="resolution">閫��摨�
        <select value={project.canvasWidth} onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const width = Number(e.target.value) as 720 | 1080
          setProject({ ...project, canvasWidth: width, canvasHeight: width === 1080 ? 1920 : 1280 })
        }}><option value="720">720 � 1280嚗憟剁�</option><option value="1080">1080 � 1920</option></select>
      </label>
      {exporting && <progress max="1" value={exportProgress} />}
    </section>

    <nav className="action-dock">
      <label className="action-button">餈賢�<input hidden type="file" multiple accept="image/*,video/*" onChange={handleVisualInput} /></label>
      <label className="action-button">BGM<input hidden type="file" accept="audio/*" onChange={handleMusicInput} /></label>
      <button onClick={save}>靽�</button>
      <button onClick={loadLatest}>敺拙�</button>
      <button className="primary" disabled={exporting || !capability.supported} onClick={() => void exportVideo()}>{exporting ? `${Math.round(exportProgress * 100)}%` : '�詻��箝�'}</button>
    </nav>

    <button className="test-data" onClick={() => void makeTestProject()}>��具��嫘�Project����</button>
  </main>
}
