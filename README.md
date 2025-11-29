# AI Chat Ctrl/Cmd+Enter Sender Chrome Extension

拡張機能をストアから使うと情報漏洩のリスクがあって怖いですよね。

そこで自分でローカルから追加すればほかの人にチャットへチャットの内容が通ることなく使え安心できると思い、自分で用意したい人向けのChrome拡張機能です。

コードの安全性はChatGPTにぶん投げるなりしてご自身でご確認ください。

## 特徴
- 対応サイト: 
    - ChatGPT (`chatgpt.com` / `chat.openai.com`), 
    - Gemini (`gemini.google.com`), 
    - Claude (`claude.ai`)
- ショートカット: Windows/Linux は `Ctrl + Enter`、macOS は `⌘ + Enter` で送信
- Enter は常に改行（Gemini も含めて改行を挿入）

## 動作要件
- ブラウザ: Chrome
- OS: Windows 11, macOS 12+(これからテスト)

## インストール（開発者モード）
1. リポジトリをクローンするか、[リリースページ](https://github.com/yutawtr1214/ai-chat-ctrl-cmd-enter-sender-chrome-extension/releases/tag/v0.1)から ZIP をダウンロードして展開し、`chrome_ext/` ディレクトリを取得してください。
2. Chrome で `chrome://extensions/` を開き、「デベロッパーモード」を ON。  
3. 「パッケージ化されていない拡張機能を読み込む」で `chrome_ext` ディレクトリを指定。  
4. 対応サイトを開き、入力欄にフォーカスして動作を確認します。

## 使い方と挙動
- `Ctrl/Cmd + Enter` → 送信ボタンをクリックしたのと同等に送信  
- `Enter` → 改行（既定の送信を抑止）  

## ディレクトリ構成
```
chrome_ext/
  manifest.json   # MV3 設定（content_scripts と host_permissions のみ）
  content.js      # サービス判定・ショートカット処理の本体
AGENTS.md         # Codex向け
```

## ライセンス
このリポジトリ内のコードは MIT ライセンスを想定しています。
