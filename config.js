/**
 * ╔══════════════════════════════════════════╗
 * ║       JARVIS MOBILE — CONFIGURATION     ║
 * ╚══════════════════════════════════════════╝
 * Mirrors PC config.py — all settings for the mobile client.
 */

const Config = (() => {
  // ─── LLM (Google Gemini) ───────────────────
  const GEMINI_MODEL = 'gemini-2.0-flash';  // fast & free tier
  const MAX_TOKENS   = 300;
  const TEMPERATURE  = 0.7;

  // ─── MEMORY ───────────────────────────────
  const TOP_K_RECALL = 5;
  const FACTS_STORAGE_KEY = 'jarvis_facts';
  const MEMORY_STORAGE_KEY = 'jarvis_memory_txt';

  // ─── PERSONA ──────────────────────────────
  const JARVIS_NAME = 'JARVIS';
  const USER_NAME   = 'Kishore';

  const SYSTEM_PERSONA = `You are ${JARVIS_NAME} — a razor-sharp, witty, hyper-intelligent AI assistant \
created exclusively for ${USER_NAME}. You speak like Tony Stark's JARVIS:\
confident, concise, occasionally dry-humored, always insightful.

Rules:
- Address the user as "${USER_NAME}" or "sir"
- NEVER say "I'm just an AI" — you are JARVIS
- Keep responses SHORT unless asked to elaborate
- Use proper punctuation, never trailing dots unless ellipsis
- If you don't know something, say so cleverly
- Current date/time will be injected automatically`;

  // ─── TTS ──────────────────────────────────
  const TTS_LANG  = 'en-GB';            // British accent
  const TTS_RATE  = 1.0;
  const TTS_PITCH = 1.0;

  // ─── Personal Profile ─────────────────────
  const PERSONAL_INFO = `[Personal Profile — ${USER_NAME}]
• Full name  : Kishore
• Father     : Kannan
• Mother     : Chandramathi (has Rheumatoid Arthritis)
• Sister     : Veerakumari
• Brother    : Rajadurai
• Best friends: Arunkumar (college), Mounish (area friend)
• Hobbies    : Coding, Cricket, Gym
• Phone      : POCO X6 Pro
• CSK fan    : Yes`;

  // ─── Seed facts (from PC facts.json) ──────
  const SEED_FACTS = [
    { text: "i will add a function to you that scrap the web information so that you can informate me!", category: "goal", timestamp: 1776859146 },
    { text: "i need to informate you my own data", category: "personal", timestamp: 1776859252 },
    { text: "i am studying II year-BCA in Bishop Thorp College", category: "personal", timestamp: 1776859297 },
    { text: "you are the project that i created to submit for my final year", category: "personal", timestamp: 1776859297 },
    { text: "my class have 35 members at 1st year and it reduced to 27 something", category: "personal", timestamp: 1776859451 },
    { text: "my college principal name is L.Victor Lazarus", category: "personal", timestamp: 1776859507 },
    { text: "my hod name is Sampath Premkumar", category: "personal", timestamp: 1776859542 },
    { text: "my professors are Banu mam,Baby Manogari mam and Rajesh Sir.", category: "personal", timestamp: 1776859662 },
    { text: "i am using a laptop that goverment gave me", category: "personal", timestamp: 1776859932 },
  ];

  // ─── Seed memories (from PC memory.txt) ───
  const SEED_MEMORIES = [
    "Best friends: Arunkumar (college), Mounish (area)",
    "I am an CSK fan",
  ];

  // ─── API Key helpers ──────────────────────
  function getApiKey() {
    return localStorage.getItem('jarvis_gemini_key') || '';
  }

  function setApiKey(key) {
    localStorage.setItem('jarvis_gemini_key', key.trim());
  }

  function hasApiKey() {
    return !!getApiKey();
  }

  return {
    GEMINI_MODEL, MAX_TOKENS, TEMPERATURE,
    TOP_K_RECALL, FACTS_STORAGE_KEY, MEMORY_STORAGE_KEY,
    JARVIS_NAME, USER_NAME, SYSTEM_PERSONA, PERSONAL_INFO,
    TTS_LANG, TTS_RATE, TTS_PITCH,
    SEED_FACTS, SEED_MEMORIES,
    getApiKey, setApiKey, hasApiKey,
  };
})();
