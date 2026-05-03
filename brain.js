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

  async function _chatOpenAI(messages) {
    const key = Config.getApiKey();
    if (!key) return null;
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: Config.OPENAI_MODEL,
          messages,
          max_tokens: Config.MAX_TOKENS,
          temperature: Config.TEMPERATURE,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('OpenAI error:', err);
        return null;
      }
      const data = await res.json();
      return data.choices[0].message.content.trim();
    } catch (e) {
      console.error('OpenAI fetch error:', e);
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
    const reply = await _chatOpenAI(messages);
    if (reply) {
      _sessionHistory.push({ role: 'assistant', content: reply });
      return { response: reply, actionUrl: null };
    }

    return {
      response: "Apologies, sir. The cloud engine is unavailable right now. Check your API key in settings.",
      actionUrl: null,
    };
  }

  function clearHistory() {
    _sessionHistory = [];
  }

  return { respond, clearHistory };
})();
