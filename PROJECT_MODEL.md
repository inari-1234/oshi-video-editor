# PROJECT_MODEL — Stage 1

## Project

- `schemaVersion: 1`
- `id`
- `title`
- `aspectRatio: "9:16"`
- `canvasWidth: 720 | 1080`
- `canvasHeight: 1280 | 1920`
- `duration`
- `music`
- `clips[]`
- `createdAt / updatedAt`

`duration`はTimeline正規化時にclipsから再計算します。

## Clip

- `id`
- `mediaType: image | video`
- `source: AssetReference`
- `timelineStart`
- `timelineDuration`
- `sourceStart?`
- `sourceDuration?`
- `fitMode: contain | cover`
- `position: {x,y}` 0..1基準
- `scale`

工程1ではClipを直列配置します。多段trackは導入しません。

## MusicTrack

- `source`
- `timelineStart`
- `sourceStart`
- `volume`

工程1は1曲のみです。

## AssetReference

Projectは素材本体やObject URLを保持せず、次の参照情報を保持します。

- `assetId`
- `kind`
- `name`
- `mimeType`
- `size`
- `duration?`
- `persistence: indexeddb | ephemeral`
- `requiresRelink?`

これによりWebのBlob storageからNativeのasset identifierへ移行してもProject / Timeline Modelを維持できます。
