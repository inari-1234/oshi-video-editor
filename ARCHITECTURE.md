# ARCHITECTURE — Stage 1

工程1では Project/Timeline、Media Adapter、Preview Renderer、Export Renderer、Storage、PWA Adapter を分離します。

- UI: src/App.tsx
- Project/Timeline: src/core/project/
- Media abstraction: src/core/media/types.ts
- PWA media adapter: src/adapters/pwa/PwaMediaAdapter.ts
- Preview: src/rendering/CanvasPreviewRenderer.ts
- Export: src/adapters/export/MediaRecorderExportRenderer.ts
- Storage: src/adapters/storage/IndexedDbStorage.ts
- PWA: public/manifest.webmanifest, public/sw.js

Project ModelはWeb APIに依存させず、将来Capacitor/Native Adapterへ差し替え可能な構造を維持します。
