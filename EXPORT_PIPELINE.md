# EXPORT_PIPELINE — Stage 1

## Stage 1の採用経路

1. `MediaRecorder` 存在確認
2. `HTMLCanvasElement.captureStream` 存在確認
3. Web Audio存在確認
4. `MediaRecorder.isTypeSupported()` でMIMEを実行時判定
5. Project時刻に従いCanvasへ逐次描画
6. BGMをWeb Audio `decodeAudioData()` でdecodeし、`MediaStreamDestination`へ出力
7. Canvas video track + BGM audio trackをMediaRecorderへ入力
8. Blobを生成し端末へ保存

工程1では素材動画の元音声はexportへ混合しません。必須要件である「映像＋BGM」を安定して成立させ、元音声mixは後工程の拡張点として残します。

MIME優先順位はMP4/H.264/AACを最優先とし、利用不可の場合のみWebMへfallbackします。Safari等のブラウザ名による固定判定は行いません。

## 720p / 1080p

工程1既定は720×1280 / 30fpsです。1080×1920は選択可能ですが、iPhone実機で負荷・メモリ・エンコード成功を確認するまで必須既定にはしません。

## メモリ方針

- 全動画をRGBA frame配列として保持しない。
- `<video>`を逐次再生し、必要フレームのみCanvasへ描画。
- export終了時にvideo/audioをpause。
- MediaStreamTrackをstop。
- AudioContextをclose。
- Object URLはStorage/Resolverの責務で明示解放可能。

## 将来の差替え

`ExportRenderer` interfaceを固定し、後工程で以下を候補にできます。

- WebCodecs + MP4 muxerによる非リアルタイム高速export
- Capacitor plugin経由のNative AVFoundation export

Project Modelを変えずRendererだけ差し替えます。
