/**
 * ╔══════════════════════════════════════════╗
 * ║     JARVIS MOBILE — COMMAND ROUTER      ║
 * ╚══════════════════════════════════════════╝
 * Mirrors PC commands.py — same routing logic,
 * returns { response, actionUrl } for mobile.
 */

const Commands = (() => {
  const _rw = ['sir', 'boss', 'mister kishore'];
  const _p = () => _rw[Math.floor(Math.random() * _rw.length)];

  function playOnYoutube(q) {
    return { response: `Opening YouTube for '${q}', ${_p()}.`, actionUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` };
  }

  function getTime() {
    const n = new Date();
    const t = n.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const d = n.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    return { response: `It's ${t} on ${d}, ${_p()}.`, actionUrl: null };
  }

  async function getWeather(city = 'Dharapuram') {
    try {
      const r = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
      return { response: (await r.text()).trim(), actionUrl: null };
    } catch { return { response: `Couldn't fetch weather for ${city}, ${_p()}.`, actionUrl: null }; }
  }

  function searchWeb(q) {
    return { response: `Searching Google for '${q}', ${_p()}.`, actionUrl: `https://www.google.com/search?q=${encodeURIComponent(q)}` };
  }

  function _routeWhatsapp(lower) {
    let tail = lower.replace('whatsapp', '').trim();
    if (!tail || tail === 'open') return Social.whatsappOpen();
    if (tail === 'status') return Social.whatsappStatus();
    if (tail.startsWith('call ')) return Social.whatsappCall(tail.slice(5).trim());
    for (const pfx of ['message ', 'msg ', 'send ']) {
      if (tail.startsWith(pfx)) { tail = tail.slice(pfx.length); break; }
    }
    const parts = tail.split(/\s+/);
    if (parts.length >= 2) return Social.whatsappSendMessage(parts[0], parts.slice(1).join(' '));
    if (parts.length === 1 && parts[0]) return Social.whatsappSendMessage(parts[0], '');
    return Social.whatsappOpen();
  }

  function _routeInstagram(lower) {
    let tail = lower.replace('instagram', '').trim();
    if (!tail || tail === 'open') return Social.instagramOpen();
    if (tail === 'reels') return Social.instagramReels();
    if (tail === 'explore') return Social.instagramExplore();
    if (tail.startsWith('profile ')) return Social.instagramProfile(tail.slice(8).trim());
    for (const pfx of ['dm ', 'message ']) { if (tail.startsWith(pfx)) return Social.instagramDm(tail.slice(pfx.length).trim()); }
    if (tail.startsWith('search ')) return Social.instagramSearch(tail.slice(7).trim());
    return null;
  }

  function _routeCall(lower) {
    for (const pfx of ['phone call ', 'call ']) {
      if (lower.startsWith(pfx)) { const t = lower.slice(pfx.length).trim(); if (t) return Social.makeCall(t); }
    }
    return null;
  }

  async function route(text) {
    const lower = text.toLowerCase().trim();
    if (lower.includes('whatsapp')) { const r = _routeWhatsapp(lower); if (r) return r; }
    if (lower.includes('instagram')) { const r = _routeInstagram(lower); if (r) return r; }
    if (lower.startsWith('call ') || lower.startsWith('phone call ')) { const r = _routeCall(lower); if (r) return r; }

    const triggers = [
      { words: ['play', 'youtube'], fn: (r) => playOnYoutube(r), rem: true },
      { words: ['time', 'what time'], fn: () => getTime(), rem: false },
      { words: ['weather'], fn: (r) => getWeather(r || 'Dharapuram'), rem: true, isAsync: true },
      { words: ['search', 'google'], fn: (r) => searchWeb(r), rem: true },
    ];

    for (const trig of triggers) {
      for (const w of trig.words) {
        if (lower.startsWith(w) || (` ${lower} `).includes(` ${w} `)) {
          let remainder = lower;
          for (const tw of trig.words) remainder = remainder.replace(tw, '').trim();
          if (trig.isAsync) return await trig.fn(remainder);
          return trig.rem ? trig.fn(remainder) : trig.fn();
        }
      }
    }
    return null;
  }

  return { route };
})();
