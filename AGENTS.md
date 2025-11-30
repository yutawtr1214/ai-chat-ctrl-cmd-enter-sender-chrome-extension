# Repository Guidelines

## プロジェクト構成
- ルート直下: 仕様説明の `README.md`。今後追加される想定の `manifest.json`（MV3 設定）と `content.js`（コンテンツスクリプト）も同階層に置く。  
- テスト/ビルド成果物はコミットしない（Chrome 拡張はソースをそのまま読み込む運用）。

## セットアップ / ビルド・開発
- 追加ツール不要。ビルド工程はなし。  
- 手元確認: `chrome://extensions` → デベロッパーモードを ON → 「パッケージ化されていない拡張機能を読み込む」で本ディレクトリを指定。  
- 配布用にまとめる場合の例: `zip -r dist.zip manifest.json content.js`.

## ローカル動作確認
- ChatGPT: 入力欄フォーカス中に Ctrl+Enter（Win）/Cmd+Enter（macOS）で送信されることを確認。  
- Gemini: `div.ql-editor[role="textbox"]` 内で Ctrl/Cmd+Enter が送信扱いになること。  
- Claude: `div.ProseMirror[role='textbox']` で Ctrl/Cmd+Enter が送信ボタンをクリックすること。  
- セレクタを意図的に外した場合でも Enter 既定動作が阻害されないか確認（`preventDefault` を早まって入れていないかのチェック）。

## コーディングスタイル
- 言語: JavaScript（ES2020 目安）。インデント 2 スペース、シングルクォート推奨、セミコロンは付ける/付けないをファイル内で統一。  
- 命名: lowerCamelCase（変数・関数）、UPPER_SNAKE_CASE（定数）。  
- ログは開発用の簡易 `console.log` のみに留め、リリース前に削減。

## テスト指針
- 現状自動テストなし。上記「ローカル動作確認」を回すことが最低ライン。  
- 将来の E2E 追加方針: Playwright 等で対象サイトに対しキーボードイベントを送出し、送信ボタンがクリックされることを検証する。

## コミット & PR
- コミットメッセージは `feat: ...`, `fix: ...`, `chore: ...` などプレフィックス + 簡潔な説明で統一。  
- PR には目的、主要変更点、確認手順（サイト別チェックリスト）、既知の制約を記載。UI/挙動変更があればスクリーンショットまたは短い動画/GIF を添付。

## セキュリティ・権限
- 外部通信禁止（fetch/XHR/WebSocket なし）。`permissions` は空を基本とし、`host_permissions` は対象ドメインのみに限定。  
- ユーザ入力や履歴を `chrome.storage` やローカルストレージへ保存しない。  
- 最小権限で動かない場合のみ、追加権限の理由を README か PR 説明に明記する。

## 使用MCP
- DeepWiki MCP
    - https://github.com/masachika-kamada/ChatGPT-Ctrl-Enter-Sender がすでに動作する参考リポジトリとして確認済み
- serena MCP