# 推し動画編集アプリ — 工程1 PWA基盤＋動画編集コア

基準日: 2026-10-03

工程1の実装候補です。React + TypeScript + Viteで、写真・動画・BGMから9:16動画を構成し、Projectとして保存し、PWA上でプレビュー・書き出しする最小コアを実装しています。

## 起動

```bash
npm install
npm run dev
```

同一LANのiPhoneから確認する場合は、Viteを外部公開してHTTPSで配信してください。PWA / Service Worker / 一部Media APIはsecure contextが前提です。公開環境では静的ホスティングへ `npm run build` の `dist/` を配置します。

## 基本操作

1. 「追加」から写真・動画を選択。
2. タイムラインのクリップを選び、順番、削除、トリム、写真表示時間、cover/containを調整。
3. 「BGM」から端末内の音声を1曲指定し、開始位置と音量を設定。工程1のexportは素材動画の元音声を混ぜず、映像＋BGMを合成します。
4. プレビューの再生・シークで9:16表示を確認。
5. 「保存」でProject metadataと保存対象素材をIndexedDBへ保存。
6. 「復元」で最新Projectを読み込み。
7. 「書き出し」でFeature Detection済みのMediaRecorder経路から動画生成。

## PWA確認

- `manifest.webmanifest` と `sw.js` を同一originから配信します。
- iPhone SafariでURLを開き、「ホーム画面に追加」後に起動します。
- `display: standalone` を指定済みです。
- Service Workerはアプリシェルと同一originのGETを基本キャッシュします。工程1では全素材の完全オフライン保証は行いません。

## テスト素材

画面下部の「開発用テストProjectを生成」で、著作物を含まないプログラム生成素材を作ります。

- 写真 2枚
- 短い動画 2本
- WAV BGM 1本

テスト動画はCanvas + MediaRecorderで端末が対応する形式を実行時生成します。

## テスト

```bash
npm test
npm run build
```

自動テストはProject Model / Timelineの主要操作を対象にします。PWA install、MediaRecorder、iPhone再生、メモリ挙動は実機Gateです。詳細は `TEST_REPORT.md` を参照してください。

## iPhone実機Gate

工程1の最終PASSには以下を実機で確認してください。

- Safariからホーム画面追加しstandalone起動
- 写真 / 動画 / BGM読込
- テストProject保存→PWA終了→再起動→復元
- 720×1280 MP4書き出し
- 書き出しMP4をiPhone標準環境で再生
- 可能なら1080×1920書き出し
- 複数回の編集→書き出しで著しいメモリ増加がないこと

実機未確認の状態では工程1全体をPASS扱いにしません。

## GitHub正式配置 / Pages

工程1の正式リポジトリ名は `oshi-video-editor` を前提としています。

- `.github/workflows/pages.yml` を同梱済みです。
- `main` push時に `npm test` → `npm run build` を実行します。
- 検証PASS時だけ `dist/` をGitHub Pagesへdeployします。
- 想定公開URL: `https://inari-1234.github.io/oshi-video-editor/`
- GitHub側では Settings → Pages → Source を `GitHub Actions` に設定してください。

GitHubリポジトリ作成前でもコードのauthorityはこのパッケージで保持できますが、工程1の正式PASSにはPages公開後のiPhone実機Gateが必要です。
