// Minimal Ctrl/Cmd+Enter sender for ChatGPT, Gemini, Claude.
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
      "button[type='submit']",
    ],
  },
];

const isMac = /Mac/i.test(navigator.platform || navigator.userAgent);

const currentService = SERVICES.find(service =>
  service.hostIncludes.some(host => location.hostname.includes(host)),
);

function isPlainEnter(e) {
  if (e.key !== 'Enter') return false;
  if (!e.isTrusted) return false;
  if (e.isComposing) return false;
  return !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
}

function isSendShortcut(e) {
  if (e.key !== 'Enter') return false;
  if (!e.isTrusted) return false;
  if (e.isComposing) return false;
  if (e.altKey) return false;

  if (isMac) return e.metaKey && !e.ctrlKey && !e.shiftKey;
  return e.ctrlKey && !e.metaKey && !e.shiftKey;
}

function getInputRoot() {
  if (!currentService) return null;
  return document.querySelector(currentService.inputSelector);
}

function inPromptArea(target) {
  const inputRoot = getInputRoot();
  if (!inputRoot) return false;
  return target === inputRoot || inputRoot.contains(target);
}

function findSendButton() {
  if (!currentService) return null;
  for (const selector of currentService.sendButtonSelectors) {
    const btn = document.querySelector(selector);
    if (!btn) continue;
    const disabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
    if (!disabled) return btn;
  }
  return null;
}

function handleKeyDown(e) {
  if (!currentService) return;
  if (!inPromptArea(e.target)) return;

  if (isPlainEnter(e)) {
    // Keep Enter as newline to avoid unintended send.
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();

    // Gemini のエディタは contenteditable なので、信頼されない Shift+Enter 合成より
    // execCommand で改行を挿入した方が安定する。
    if (currentService.id === 'gemini') {
      const inserted =
        (typeof document.execCommand === 'function' &&
          (document.execCommand('insertLineBreak') ||
            document.execCommand('insertText', false, '\n')));

      if (!inserted) {
        // execCommand が無効な場合のフォールバック: <br> を挿入し、カーソルを直後へ。
        const sel = window.getSelection?.();
        if (sel && sel.rangeCount) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const br = document.createElement('br');
          range.insertNode(br);
          range.setStartAfter(br);
          range.setEndAfter(br);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      return;
    }

    // ChatGPT / Claude (textarea系 or ProseMirror) は Shift+Enter 合成で改行を維持。
    const synthetic = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    e.target.dispatchEvent(synthetic);
    return;
  }

  if (!isSendShortcut(e)) return;

  const sendButton = findSendButton();
  if (!sendButton) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation?.();
  sendButton.click();
}

if (currentService) {
  window.addEventListener('keydown', handleKeyDown, { capture: true });
}
