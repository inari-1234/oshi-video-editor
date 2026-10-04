# KNOWN_LIMITATIONS — Stage 1

- 工程1のPWA exportはMediaRecorderベースのため、基本的に動画尺と同程度の実時間が必要です。
- MP4/H.264/AAC可否は端末の`MediaRecorder.isTypeSupported()`結果に依存します。MP4不可環境では開発確認用にWebM fallbackとなります。
- 大きい素材はIndexedDBへ永続化しません。1素材64MiB超またはsoft budget超過時はsession-onlyとなり、再起動後に再選択が必要です。
- iOS/WebKitのstorageはquotaやevictionの影響を受けるため、PWA内保存を永久保管とみなしません。
- Preview / Exportは工程1の単純直列Timelineのみです。トランジション、多段track、装飾、文字アニメーション等は対象外です。
- 動画の回転metadata、HDR、可変フレームレート、特殊codecは素材によってブラウザdecoder依存です。
- BGMは1曲のみです。
- 工程1のexportでは素材動画の元音声は混合せず、映像＋BGMのみを出力します。元音声mixは後工程候補です。
- 本工程ではSNS直接取得・投稿、DRMサービス連携、AI処理は実装しません。
- iPhone実機でのMP4再生Gateが完了するまで工程1全体はPASSではありません。
