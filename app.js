/**
 * ╔══════════════════════════════════════════╗
 * ║       JARVIS MOBILE — APP CONTROLLER    ║
 * ╚══════════════════════════════════════════╝
 * Main controller: wires up UI, voice, chat, panels.
 */

const App = (() => {
  // DOM refs
  let chatArea, inputBox, sendBtn, voiceBtn;
  let settingsOverlay, settingsPanel, memoryOverlay, memoryPanel;
  let toastEl;
  let welcomeScreen;

  // State
  let isListening = false;
  let recognition = null;
  let synthVoice = null;

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Cache DOM
    chatArea       = document.getElementById('chat-area');
    inputBox       = document.getElementById('input-box');
    sendBtn        = document.getElementById('send-btn');
    voiceBtn       = document.getElementById('voice-btn');
    settingsOverlay= document.getElementById('settings-overlay');
    settingsPanel  = document.getElementById('settings-panel');
    memoryOverlay  = document.getElementById('memory-overlay');
    memoryPanel    = document.getElementById('memory-panel');
    toastEl        = document.getElementById('toast');
    welcomeScreen  = document.getElementById('welcome-screen');

    // Init Memory
    Memory.init();

    // Setup TTS voice
    _initSynthVoice();

    // Setup Speech Recognition
    _initRecognition();

    // Event listeners
    sendBtn.addEventListener('click', _handleSend);
    inputBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _handleSend(); }
    });
    inputBox.addEventListener('input', _autoResize);
    voiceBtn.addEventListener('click', _toggleVoice);

    // Settings panel
    document.getElementById('btn-settings').addEventListener('click', () => _openPanel('settings'));
    document.getElementById('btn-memory').addEventListener('click', () => _openPanel('memory'));
    document.getElementById('settings-close').addEventListener('click', () => _closePanel('settings'));
    document.getElementById('memory-close').addEventListener('click', () => _closePanel('memory'));
    settingsOverlay.addEventListener('click', () => _closePanel('settings'));
    memoryOverlay.addEventListener('click', () => _closePanel('memory'));

    // Settings actions
    document.getElementById('save-api-key').addEventListener('click', _saveApiKey);
    document.getElementById('clear-history-btn').addEventListener('click', _clearHistory);
    document.getElementById('clear-memory-btn').addEventListener('click', _clearMemory);

    // API key prompt (welcome screen)
    const welcomeBtn = document.getElementById('welcome-save-key');
    if (welcomeBtn) welcomeBtn.addEventListener('click', _saveWelcomeKey);

    // Check if API key exists
    if (Config.hasApiKey()) {
      _hideWelcome();
      _addSystemMessage(`Online. Ready to assist you, ${Config.USER_NAME}.`);
    }

    // Load API key into settings input
    document.getElementById('api-key-input').value = Config.getApiKey();
  }

  // ─── Welcome screen ───────────────────────────────────────────────────────
  function _hideWelcome() {
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
  }

  function _saveWelcomeKey() {
    const input = document.getElementById('welcome-key-input');
    const key = input.value.trim();
    if (!key) { _toast('Please enter an API key'); return; }
    Config.setApiKey(key);
    document.getElementById('api-key-input').value = key;
    _hideWelcome();
    _addSystemMessage(`Online. Ready to assist you, ${Config.USER_NAME}.`);
    _toast('API key saved');
  }

  // ─── TTS (SpeechSynthesis) ─────────────────────────────────────────────────
  function _initSynthVoice() {
    if (!('speechSynthesis' in window)) return;

    const _pickVoice = () => {
      const voices = speechSynthesis.getVoices();
      // Prefer British male
      synthVoice = voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('male'))
        || voices.find(v => v.lang === 'en-GB')
        || voices.find(v => v.lang.startsWith('en'))
        || voices[0] || null;
    };

    _pickVoice();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = _pickVoice;
    }
  }

  function speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    if (synthVoice) utter.voice = synthVoice;
    utter.lang  = Config.TTS_LANG;
    utter.rate  = Config.TTS_RATE;
    utter.pitch = Config.TTS_PITCH;
    speechSynthesis.speak(utter);
  }

  // ─── STT (Web Speech API) ─────────────────────────────────────────────────
  function _initRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript.trim();
      if (text) {
        inputBox.value = text;
        _handleSend();
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        _toast(`Voice error: ${e.error}`);
      }
      _stopListening();
    };

    recognition.onend = () => {
      _stopListening();
    };
  }

  function _toggleVoice() {
    if (!recognition) { _toast('Voice not supported on this browser'); return; }
    if (isListening) {
      recognition.abort();
      _stopListening();
    } else {
      try {
        recognition.start();
        isListening = true;
        voiceBtn.classList.add('listening');
        _toast('Listening...');
      } catch (e) {
        _toast('Could not start voice input');
      }
    }
  }

  function _stopListening() {
    isListening = false;
    voiceBtn.classList.remove('listening');
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────
  async function _handleSend() {
    const text = inputBox.value.trim();
    if (!text) return;

    inputBox.value = '';
    _autoResize();

    // Check API key
    if (!Config.hasApiKey()) {
      _toast('Please set your Gemini API key in settings');
      return;
    }

    // Hide welcome
    _hideWelcome();

    // Show user message
    _addMessage(text, 'user');

    // Show typing indicator
    const typingEl = _showTyping();

    try {
      const result = await Brain.respond(text);

      // Remove typing
      if (typingEl && typingEl.parentNode) typingEl.remove();

      if (result) {
        _addMessage(result.response, 'jarvis', result.actionUrl);
        speak(result.response);

        // Auto-open action URL
        if (result.actionUrl) {
          setTimeout(() => { window.open(result.actionUrl, '_blank'); }, 800);
        }
      }
    } catch (err) {
      if (typingEl && typingEl.parentNode) typingEl.remove();
      _addMessage('A system error occurred, sir. Please try again.', 'jarvis');
      console.error(err);
    }
  }

  function _addMessage(text, type, actionUrl = null) {
    const div = document.createElement('div');
    div.className = `message ${type}`;

    const label = document.createElement('span');
    label.className = 'msg-label';
    label.textContent = type === 'user' ? Config.USER_NAME : Config.JARVIS_NAME;
    div.appendChild(label);

    const content = document.createElement('span');
    content.textContent = text;
    div.appendChild(content);

    if (actionUrl) {
      const link = document.createElement('a');
      link.className = 'action-link';
      link.href = actionUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.innerHTML = '↗ Open';
      div.appendChild(link);
    }

    chatArea.appendChild(div);
    _scrollToBottom();
  }

  function _addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'message system';
    div.textContent = text;
    chatArea.appendChild(div);
    _scrollToBottom();
  }

  function _showTyping() {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = 'typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    chatArea.appendChild(div);
    _scrollToBottom();
    return div;
  }

  function _scrollToBottom() {
    requestAnimationFrame(() => {
      chatArea.scrollTop = chatArea.scrollHeight;
    });
  }

  function _autoResize() {
    inputBox.style.height = 'auto';
    inputBox.style.height = Math.min(inputBox.scrollHeight, 120) + 'px';
  }

  // ─── Panels ───────────────────────────────────────────────────────────────
  function _openPanel(name) {
    if (name === 'settings') {
      settingsOverlay.classList.add('active');
      settingsPanel.classList.add('active');
    } else {
      memoryOverlay.classList.add('active');
      memoryPanel.classList.add('active');
      _renderMemoryList();
    }
  }

  function _closePanel(name) {
    if (name === 'settings') {
      settingsOverlay.classList.remove('active');
      settingsPanel.classList.remove('active');
    } else {
      memoryOverlay.classList.remove('active');
      memoryPanel.classList.remove('active');
    }
  }

  function _saveApiKey() {
    const input = document.getElementById('api-key-input');
    const key = input.value.trim();
    if (!key) { _toast('Please enter an API key'); return; }
    Config.setApiKey(key);
    _toast('API key saved');
    _closePanel('settings');
    _hideWelcome();
  }

  function _clearHistory() {
    Brain.clearHistory();
    chatArea.innerHTML = '';
    _addSystemMessage('Session history cleared.');
    _toast('History cleared');
    _closePanel('settings');
  }

  function _clearMemory() {
    if (confirm('Clear all stored memories?')) {
      Memory.clearAll();
      Memory.init();
      _toast('Memory cleared and reseeded');
      _renderMemoryList();
    }
  }

  function _renderMemoryList() {
    const list = document.getElementById('memory-list');
    if (!list) return;
    list.innerHTML = '';
    const facts = Memory.getAllFacts();
    if (facts.length === 0) {
      list.innerHTML = '<p style="color:var(--text-dim);font-size:12px;">No memories stored yet.</p>';
      return;
    }
    for (const f of facts) {
      const item = document.createElement('div');
      item.className = 'memory-item';
      item.innerHTML = `<span class="mem-cat">${f.category || 'general'}</span>${f.text}`;
      list.appendChild(item);
    }
  }

  // ─── Toast ────────────────────────────────────────────────────────────────
  function _toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2500);
  }

  return { init };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
