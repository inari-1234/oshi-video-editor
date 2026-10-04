# PWA_SETUP — Stage 1

## 構成

- Manifest: `public/manifest.webmanifest`
- Service Worker: `public/sw.js`
- 登録: `src/main.tsx`
- Icons: 192 / 512 PNG
- `display: standalone`

## iPhoneでの实機確認

1. HTTPS公開環境からアプリを開く。
2. Safariの共有メニューから「ホーム画面に追加」。
- Pages公開窻の前に、 Settings → Pages → Build and deployment → Source を `GitHub Actions` にする。
3. アイコンが格子状に表示されること、開始晢にブラウザUIが非表示になることを確認。
4. 峖叫ブロジェクトを作成し、 「保存」。
 5. PWAを終了→再起哕し、 「復元」で同じTimelineが戻ること。
6. 720×1280書き出しを実行する。
7. 生成MP4�cZiPhoneで再生する。

## オフライン

工程1ではアプリシェル ↔ アプリシェルシェル����}�-をキャッシュします。大容叡材を含む完全オフライン編集は保証しません。

## GitHub Pagesへ配置する場合

- 正式リポジトリ名は `oshi-video-editor` です。
- GitHubに `inari-1234/oshi-video-editor` を作成する。
3. Repository Settings → Pages → Build and deployment → Source を `GitHub Actions` にする。
4. `.ithub/workflows/pages.yml` が `npm test` → `npm run build` を実行し、丨誕PASSした場合だけ `dist/` をQ���ώᑕ����g�
/�(Ը����Z/UI0�������輽���ɤ����й��ѡՈ�����͡��٥�������ѽȽ���
I�A�����M���ɧ���Z/�������}�ї�
K��3��()�٥є���������̀�������͕��������͡��٥�������ѽȽ�����n떺k��#�����g����w�
�#���B7�
K��'�#�
/��ӖB#���B3�f����'�nӎ_���?���W��(