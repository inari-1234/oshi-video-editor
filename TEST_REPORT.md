# TEST_REPORT — Stage 1

基準日: 2026-10-04

## 現在の判定

**IMPLEMENTATION CANDIDATE — FINAL PASS PENDING REAL iPHONE GATE**

Project/Timelineのsmoke testと、依存なしで可能なTypeScript整合確認はPASS済みです。正式な依存解決後の `npm test` / `npm run build` はGitHub ActionsをGateとします。

## 必須テスト

A 写真1枚: model covered
B 動画1本: model covered
C 写真＋動画: model covered
D 並べ替え: model covered
E 動画トリム: model covered
F 写真表示時間: model covered
G BGMなし書き出し: iPhone Gate pending
H BGMあり書き出し: iPhone Gate pending
I 9:16プレビュー: implemented / device pending
J 720×1280: implemented / device pending
K 1080×1920: optional device gate
L iPhone再生: pending
M Project保存: implemented / device pending
N Project再読込: implemented / device pending
O Timeline一致: device pending
P 不正素材エラー処理: implemented
Q 書き出し失敗表示: implemented
R メモリ回帰: device pending

## Repository / Pages

- Repository: `inari-1234/oshi-video-editor` (Public)
- Workflow: `.github/workflows/pages.yml`
- Deploy gate: `npm test` → `npm run build` → Pages deploy
- Vite base: `/oshi-video-editor/`
- ローカル `npm install`: network timeoutのため、依存解決済み検証はGitHub Actionsへ移管

工程1は、Pages公開後のiPhone実機で保存→復元→720p書き出し→再生まで通るまではPASSにしません。
