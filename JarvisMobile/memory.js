/**
 * ╔══════════════════════════════════════════╗
 * ║       JARVIS MOBILE — MEMORY SYSTEM     ║
 * ╚══════════════════════════════════════════╝
 * Mirrors PC memory.py — localStorage + keyword overlap search.
 */

const Memory = (() => {
  // ─── Category keywords (same as PC) ─────────────────────────────────────────
  const CATEGORY_KEYWORDS = {
    personal: ['my name', 'i am', 'i have', 'my', 'i live', 'my phone'],
    goal:     ['goal', 'target', 'want to', 'plan to', 'will', 'dream', 'aim'],
    event:    ['birthday', 'exam', 'meeting', 'appointment', 'tomorrow', 'next week'],
    family:   ['father', 'mother', 'sister', 'brother', 'family', 'crush', 'friend'],
    general:  [],
  };

  const IMPORTANCE_KEYWORDS = [
    'my', 'i am', 'i have', 'i will', 'birthday', 'exam',
    'goal', 'project', 'name', 'want', 'plan', 'crush',
    'friend', 'family', 'mother', 'father', 'sister', 'brother',
  ];

  let facts = [];

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init() {
    const stored = localStorage.getItem(Config.FACTS_STORAGE_KEY);
    if (stored) {
      try {
        facts = JSON.parse(stored);
      } catch {
        facts = [];
      }
    }

    // Seed facts on first launch
    if (facts.length === 0) {
      facts = [...Config.SEED_FACTS];
      _save();
    }

    // Add seed memories if not already present
    for (const mem of Config.SEED_MEMORIES) {
      if (!facts.some(f => f.text === mem)) {
        facts.push({ text: mem, category: 'personal', timestamp: Date.now() });
      }
    }
    _save();
  }

  // ─── Persistence ───────────────────────────────────────────────────────────
  function _save() {
    localStorage.setItem(Config.FACTS_STORAGE_KEY, JSON.stringify(facts));
  }

  // ─── Categorize ────────────────────────────────────────────────────────────
  function _categorize(text) {
    const t = text.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => t.includes(k))) return cat;
    }
    return 'general';
  }

  // ─── Importance check ──────────────────────────────────────────────────────
  function isImportant(text) {
    const t = text.toLowerCase();
    return IMPORTANCE_KEYWORDS.some(k => t.includes(k)) && text.split(/\s+/).length > 3;
  }

  // ─── Duplicate check (keyword overlap) ─────────────────────────────────────
  function _similarity(a, b) {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    let overlap = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) overlap++;
    }
    return overlap / Math.max(wordsA.size, wordsB.size, 1);
  }

  function isNearDuplicate(text, threshold = 0.85) {
    return facts.some(f => _similarity(f.text, text) >= threshold);
  }

  // ─── Store ─────────────────────────────────────────────────────────────────
  function store(text, category = null) {
    if (isNearDuplicate(text)) return;
    category = category || _categorize(text);
    facts.push({
      text,
      category,
      timestamp: Math.floor(Date.now() / 1000),
    });
    _save();
  }

  function autoLearn(text) {
    if (isImportant(text)) {
      store(text);
    }
  }

  // ─── Search (keyword overlap scoring) ──────────────────────────────────────
  function search(query, k = null) {
    k = k || Config.TOP_K_RECALL;
    if (facts.length === 0) return [];

    const scored = facts.map(f => ({
      text: f.text,
      score: _similarity(query, f.text),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored
      .filter(s => s.score > 0.15)
      .slice(0, k)
      .map(s => s.text);
  }

  // ─── Context builder ──────────────────────────────────────────────────────
  function getContext(query) {
    const memories = search(query);
    if (memories.length === 0) return '';
    const joined = memories.map(m => `• ${m}`).join('\n');
    return `[Recalled Memories]\n${joined}`;
  }

  function personalInfo() {
    return Config.PERSONAL_INFO;
  }

  // ─── Getters ───────────────────────────────────────────────────────────────
  function getAllFacts() {
    return [...facts];
  }

  function clearAll() {
    facts = [];
    _save();
  }

  return {
    init, store, autoLearn, search, getContext,
    personalInfo, isImportant, getAllFacts, clearAll,
  };
})();
