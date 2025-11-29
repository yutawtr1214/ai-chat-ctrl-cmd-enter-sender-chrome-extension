# 1. 目的・概要

## 1.1 目的

AIチャットサービス（ChatGPT, Gemini, Claude）の入力欄がフォーカスされている状態で、

* Windows: **Ctrl + Enter**
* macOS: **Command (⌘) + Enter**

でメッセージ送信を実行できるようにする Chrome 拡張機能を実装する。

**MVP 方針**

* UI なし（ポップアップ / オプションページ / トグルなし）
* 設定なし（キー割り当て固定）
* サポートサイトは ChatGPT / Gemini / Claude のみ
* 「Enter 単独の挙動（送信 or 改行）」は各サービス既定のまま。拡張機能は **Ctrl/Cmd+Enter の “送信追加” だけ** を行う。

既存の「ChatGPT Ctrl+Enter Sender」は多機能（トグル UI や複数サイト対応、i18n など）だが、ここでは必要最小限の機能だけを自前実装する。([Chrome Web Store][1])

---

# 2. 対象環境

## 2.1 ブラウザ / OS

* ブラウザ: Chromium ベース（Chrome / Edge 等）

  * Manifest V3 ベースの拡張機能として実装。([Chrome for Developers][2])
* OS:

  * Windows 10 / 11
  * macOS 12 以降を想定

## 2.2 対応サイト / URL パターン

manifest.json の `content_scripts.matches` および `host_permissions` に指定する。

* ChatGPT

  * `https://chatgpt.com/*`
  * `https://chat.openai.com/*`（古い URL 互換のため）
* Gemini

  * `https://gemini.google.com/*`
* Claude

  * `https://claude.ai/*`

---

# 3. 機能要件

## 3.1 キーボードショートカット

1. **送信ショートカット**

   * Windows: `Ctrl + Enter`
   * macOS: `Command(⌘) + Enter`

2. **IME との共存**

   * `KeyboardEvent.isComposing === true` の間はショートカットを発火させない
     （変換確定など IME 操作を邪魔しないため。Tampermonkey スクリプトでも同様の考慮が使われている）([basyura's blog][3])

3. **対象要素**

   * 各サービスの「メインのプロンプト入力欄」にフォーカスがある場合のみショートカットを有効にする。
   * 具体的な DOM セレクタは 5 章で定義。

## 3.2 サービス別挙動

1. **ChatGPT**

   * 入力欄（`#prompt-textarea`）にフォーカスがある状態で Ctrl/Cmd+Enter を押下すると、
   * 送信ボタン（`button[data-testid="send-button"]`）をクリックしたのと同等の処理を実行する。([basyura's blog][3])

2. **Gemini**

   * 入力欄（`div.ql-editor[role="textbox"]`）にフォーカスがある状態で Ctrl/Cmd+Enter を押下すると、
   * 送信ボタン（`.send-button-container.visible button`）をクリックしたのと同等の処理を実行する。([Executor][4])

3. **Claude**

   * 入力欄（`div.ProseMirror[role='textbox']`）にフォーカスがある状態で Ctrl/Cmd+Enter を押下すると、
   * 送信ボタン候補（`button[aria-label*="Send"]` / `button[type="submit"]` のいずれか）をクリックしたのと同等の処理を実行する。([Gist][5])

## 3.3 既存 Enter 挙動への影響

* プレーンな `Enter` / `Shift+Enter` の挙動は **変更しない**。
* つまり、

  * 送信タイミングが Enter か Ctrl/Cmd+Enter かは、元サイトの設定 + この拡張による送信追加の組み合わせとなる。
  * 「Enter ＝改行、Ctrl+Enter＝送信」に完全に強制するのは **MVP の範囲外**。

---

# 4. 非機能要件

## 4.1 セキュリティ / プライバシー

* 拡張機能から任意の外部サーバへの通信（fetch / XHR）は一切行わない。
* `permissions` は **空**。`content_scripts` 以外の特権 API を使用しない。([Chrome for Developers][6])
* `externally_connectable` や `web_accessible_resources` は定義しない。
* ログ出力はデバッグ用の `console.log` のみに留める（リリース時は削除可）。

## 4.2 パフォーマンス

* 1 ページあたり、

  * `window` に `keydown` リスナを 1 つだけ追加。
  * ポーリングや MutationObserver の常時監視は行わない（必要になれば将来の拡張で検討）。

## 4.3 メンテナンス性

* サービス別の DOM セレクタ定義を 1 か所に集約（オブジェクト/マップ）し、変更に備える。
* コンテンツスクリプトは単一ファイル（`content.js`）とし、ロジックは関数分割するのみ。

---

# 5. DOM セレクタ仕様（サイト別）

この辺が一番壊れやすいところ。将来 DOM が変わったらここだけ直せばよい構造にしておく。

## 5.1 サービス定義

`content.js` 内に以下のような構造体（擬似コード）を持つ。

```js
const SERVICES = [
  {
    id: 'chatgpt',
    hostIncludes: ['chatgpt.com', 'chat.openai.com'],
    inputSelector: '#prompt-textarea',
    sendButtonSelectors: ["button[data-testid='send-button']"],
  },
  {
    id: 'gemini',
    hostIncludes: ['gemini.google.com'],
    inputSelector: 'div.ql-editor[role="textbox"]',
    sendButtonSelectors: ['.send-button-container.visible button'],
  },
  {
    id: 'claude',
    hostIncludes: ['claude.ai'],
    inputSelector: "div.ProseMirror[role='textbox']",
    sendButtonSelectors: [
      "button[aria-label*='Send']",
      'button[type="submit"]',
    ],
  },
];
```

### 根拠（事実ベース）

* ChatGPT

  * 入力欄: `textarea#prompt-textarea` ([basyura's blog][3])
  * 送信ボタン: `button[data-testid='send-button']` ([basyura's blog][3])
* Gemini

  * 入力欄: Quill ベース `div.ql-editor[role="textbox"]` ([Gist][5])
  * 送信ボタン: `.send-button-container.visible button` として自動クリックしている自動化ツールの実例あり。([Executor][4])
* Claude

  * 入力欄: ProseMirror ベースで `div.ProseMirror[role='textbox']` として扱う例がある。([Gist][5])
  * 送信ボタン: `button[aria-label*="Send"]` / `button[type="submit"]` を用いて自動化しているコード例あり。([Greasy Fork][7])

※ aria-label は将来ローカライズで変わる可能性があるが、現状 Claude の UI は英語ラベルが多いため、この前提で割り切る。

---

# 6. アーキテクチャ / ファイル構成

MVP の構成は非常にシンプル。

```text
ai-chat-ctrl-enter/
  ├─ manifest.json
  └─ content.js
```

## 6.1 manifest.json 仕様

Manifest V3 の `content_scripts` を用いて対象ページに `content.js` を注入する。([Chrome for Developers][2])

**必須キー**

* `manifest_version`: `3`
* `name`: 拡張名（例: `"AI Chat Ctrl+Enter Sender (Local)"`）
* `version`: `"0.1.0"`
* `description`: 簡単な説明
* `content_scripts`:

  * `matches`: 対象 URL パターン（前述）
  * `js`: `["content.js"]`
  * `run_at`: `"document_idle"`（デフォルトでもよい）

**例（仕様サンプル）**

```json
{
  "manifest_version": 3,
  "name": "AI Chat Ctrl+Enter Sender (Local)",
  "version": "0.1.0",
  "description": "ChatGPT / Gemini / Claude で Ctrl/Cmd+Enter 送信を追加するだけの拡張機能。",
  "content_scripts": [
    {
      "matches": [
        "https://chatgpt.com/*",
        "https://chat.openai.com/*",
        "https://gemini.google.com/*",
        "https://claude.ai/*"
      ],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "permissions": [],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://gemini.google.com/*",
    "https://claude.ai/*"
  ]
}
```

* `host_permissions` は、将来 background/service worker から DOM に触る可能性まで考えるなら付けておく。現時点では content_scripts だけでも動作するが、明示しておいても害はない。([Chrome for Developers][2])
* アイコンやオプションページ、ポップアップ関連キーは **MVP では追加しない**。

## 6.2 content.js 仕様

### 6.2.1 初期化

* スクリプトロード時に以下を実行:

  1. 現在の `location.hostname` からサービス（ChatGPT / Gemini / Claude）を判定
  2. 対応するサービス定義を取得
  3. サービス定義があれば `window.addEventListener('keydown', handleKeyDown, { capture: true })` を登録

### 6.2.2 OS 判定 & ショートカット判定

* OS 判定（簡易）

  ```js
  const isMac = /Mac/i.test(navigator.platform || navigator.userAgent);
  ```

* 送信ショートカット判定関数（仕様イメージ）

  ```js
  function isSendShortcut(e) {
    if (e.key !== 'Enter') return false;
    if (e.isComposing) return false;  // IME 変換中は無視

    // Alt が混ざっている場合は無視（システムショートカットなど）
    if (e.altKey) return false;

    if (isMac) {
      // macOS: Cmd+Enter のみを対象（Ctrl+Enter は IME 等で使われがちなので避ける）
      return e.metaKey && !e.ctrlKey && !e.shiftKey;
    } else {
      // Windows: Ctrl+Enter
      return e.ctrlKey && !e.metaKey && !e.shiftKey;
    }
  }
  ```

### 6.2.3 入力欄判定

* 各サービス定義の `inputSelector` で要素を取得:

  ```js
  const inputRoot = document.querySelector(service.inputSelector);
  ```

* `keydown` イベント発生時に、

  ```js
  const target = e.target;
  const inPrompt =
    inputRoot &&
    (target === inputRoot || inputRoot.contains(target));

  if (!inPrompt) return;
  ```

* これにより、ページ内の別の入力欄（検索ボックスなど）で Ctrl/Cmd+Enter を押しても送信は走らない。

### 6.2.4 送信ボタンの特定

* サービス定義にある `sendButtonSelectors` を上から順に評価し、最初に見つかった有効なボタンを使用:

  ```js
  function findSendButton(service) {
    for (const selector of service.sendButtonSelectors) {
      const btn = document.querySelector(selector);
      if (!btn) continue;

      const disabled =
        btn.disabled ||
        btn.getAttribute('aria-disabled') === 'true';

      if (!disabled) return btn;
    }
    return null;
  }
  ```

### 6.2.5 キーハンドラ仕様

`handleKeyDown` の動作仕様（擬似コードレベル）:

```js
function handleKeyDown(e) {
  if (!isSendShortcut(e)) return;

  const service = currentService;       // 初期化時に決定済み
  if (!service) return;

  const inputRoot = document.querySelector(service.inputSelector);
  if (!inputRoot) return;

  const target = e.target;
  if (!(target === inputRoot || inputRoot.contains(target))) {
    return;  // 入力欄以外でのショートカットは無視
  }

  const sendButton = findSendButton(service);
  if (!sendButton) {
    // ボタンが見つからない場合はページ既定の動作に任せる（preventDefault しない）
    return;
  }

  // ここで初めて既定動作を抑止
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation?.();

  sendButton.click();
}
```

**ポイント**

* 送信ボタンが見つからない場合は `preventDefault` しない
  → DOM 変更でセレクタが壊れたときも、最低限サイト既定の挙動は残る。
* `capture: true` でリスナ登録しているので、ページ側のハンドラより先に処理される。

---

# 7. セキュリティ / プライバシー仕様

1. **外部通信禁止**

   * `fetch`, `XMLHttpRequest`, `WebSocket` 等による外部送信は行わない。
   * `permissions` に `storage` なども含めない（MVP では設定保存をしない）。

2. **データ保存なし**

   * ユーザの入力内容/履歴をローカルストレージや `chrome.storage.*` に保存しない。([DeepWiki][8])

3. **権限の可視性**

   * manifest の権限は `content_scripts` / `host_permissions` のみに限定し、Chrome の「この拡張は次のサイトのデータを読み取れます」という表示が正直な内容になるようにする。([Mozilla Add-ons][9])

---

# 8. インストール / 開発フロー

あなたには不要なくらい基本的な話だけど、一応仕様として。

1. ローカルでディレクトリ作成
   例: `~/dev/ai-chat-ctrl-enter/`

2. `manifest.json` と `content.js` を前述仕様に従って作成

3. Chrome で `chrome://extensions/` を開く

4. 右上で「デベロッパーモード」をオン

5. 「パッケージ化されていない拡張機能を読み込む」から作成したディレクトリを選択

6. ChatGPT / Gemini / Claude を開き、実際に `Ctrl+Enter` / `Cmd+Enter` を叩いて挙動を確認

---

# 9. テスト観点（簡易）

最低限このくらいは叩いておくと安心。

1. **ChatGPT**

   * 入力欄にフォーカスし、`Ctrl+Enter`（Win） / `Cmd+Enter`（Mac）で送信されること。
   * 日本語 IME 変換中（`isComposing` true の状況）でショートカットが発火しないこと。
   * 添付ボタンやマイクボタンなど別 UI にフォーカスがある状態でショートカットを押しても何も起きないこと。

2. **Gemini**

   * `div.ql-editor[role="textbox"]` にフォーカスがある状態で送信されること。([Gist][5])

3. **Claude**

   * `div.ProseMirror[role='textbox']` 内で Ctrl/Cmd+Enter を押したときに送信ボタン（`button[aria-label*="Send"]` or `button[type="submit"]`）がクリックされること。([Gist][5])

4. **壊れたときの挙動**

   * セレクタをわざと外してビルドし直し、ショートカットを押しても既定の Enter 挙動が保たれること（`preventDefault` されていないこと）。

---

# 10. 将来拡張候補（MVP外）

* オプションページで：

  * サイトごとの有効/無効切り替え
  * `Ctrl+Enter` / `Shift+Enter` / `Alt+Enter` など任意ショートカットの設定
* `Enter=改行、Ctrl/Cmd+Enter=送信` を強制するモード
  （既存の ChatGPT Ctrl+Enter Sender と同じ挙動に寄せる）([Chrome Web Store][1])


# 参考リポジトリ
- https://github.com/masachika-kamada/ChatGPT-Ctrl-Enter-Sender
    - **deepwiki mcpで参照すること**