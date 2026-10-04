# 工程1 設計Freeze — 2026-10-03

## Repository structure

- `src/core/project`: Project Model / Timeline / validation
- `src/core/media`: Media abstraction interface
- `src/core/export`: Export abstraction interface
- `src/adapters/pwa`: PWA media input adapter
- `src/adapters/storage`: IndexedDB storage + asset resolver
- `src/adapters/export`: PWA MediaRecorder export renderer
- `src/rendering`: Canvas preview/common drawing
- `src/testdata`: generated local test media
- `src/tests`: model tests
- `public`: manifest, service worker, icons

## Project Model

9:16固定、Clip直列、BGM1曲。Project内には再現可能なmetadataのみを保持し、File/Blob/ObjectURLを直接埋め込まない。

## Media Abstraction

PWA File inputは`PwaMediaAdapter`に隔離。Assetは`AssetReference`でProjectと接続する。Native化時はAdapter/Resolverを交換する。

## Export Pipeline

工程1はFeature DetectionしたMediaRecorderを主経路とする。MP4/H.264/AACを優先し、ブラウザ名判定は禁止。ExportRenderer interfaceを固定し、WebCodecs / Native exportへ将来差替え可能にする。

## 実装順

1. PWA shell — 実装済み
2. 素材入力 — 実装済み
3. Project / Timeline — 実装済み
4. Preview — 実装済み
5. BGM — 実装済み
6. Export — 実装済み（実機Gate pending）
7. 保存 / 復元 — 実装済み
8. iPhone実機検証 — pending

工程2機能は混入させない。
