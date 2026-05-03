/**
 * ╔══════════════════════════════════════════╗
 * ║       JARVIS MOBILE — BRAIN             ║
 * ╚══════════════════════════════════════════╝
 * Mirrors PC brain.py — direct OpenAI API calls from browser.
 * Same pipeline: command router → auto-learn → context → LLM.
 */

const Brain = (() => {
  let _sessionHistory = [];
  const MAX_HISTORY = 10;

  function _buildSystemPrompt(context) {
    const now = new Date();
    const dateStr = now.toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
      year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
    });
    return `${Config.SYSTEM_PERSONA}\n\nCurrent date/time: ${dateStr}\n\n${context}`;
  }

  function _trimHistory() {
    if (_sessionHistory.length > MAX_HISTORY * 2) {
      _sessionHistory = _sessionHistory.slice(-MAX_HISTORY * 2);
    }
  }

  async function _chatGemini(messages) {
    const key = Config.getApiKey();
    if (!key) return null;
    try {
      // Convert chat messages to Gemini format
      const systemMsg = messages.find(m => m.role === 'system');
      const chatMsgs = messages.filter(m => m.role !== 'system');

      const contents = chatMsgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const body = {
        contents,
        generationConfig: {
          maxOutputTokens: Config.MAX_TOKENS,
          temperature: Config.TEMPERATURE,
        },
      };

      // Inject system instruction if present
      if (systemMsg) {
        body.systemInstruction = { parts: [{ text: systemMsg.content }] };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${Config.GEMINI_MODEL}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Gemini error:', err);
        return null;
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch (e) {
      console.error('Gemini fetch error:', e);
      return null;
    }
  }

  async function respond(userInput) {
    // 1. Command router
    const cmdResult = await Commands.route(userInput);
    if (cmdResult) return cmdResult;

    // 2. Auto-learn
    Memory.autoLearn(userInput);

    // 3. Build context
    let context = Memory.personalInfo();
    const recalled = Memory.getContext(userInput);
    if (recalled) context += '\n\n' + recalled;

    // 4. Build messages
    const systemMsg = { role: 'system', content: _buildSystemPrompt(context) };
    _sessionHistory.push({ role: 'user', content: userInput });
    _trimHistory();
    const messages = [systemMsg, ..._sessionHistory];

    // 5. LLM call
    const reply = await _chatGemini(messages);
    if (reply) {
      _sessionHistory.push({ role: 'assistant', content: reply });
      return { response: reply, actionUrl: null };
    }

    return {
      response: "Apologies, sir. The Gemini engine is unavailable right now. Check your API key in settings.",
      actionUrl: null,
    };
  }

  function clearHistory() {
    _sessionHistory = [];
  }

  return { respond, clearHistory };
})();
