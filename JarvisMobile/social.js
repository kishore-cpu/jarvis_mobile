/**
 * ╔══════════════════════════════════════════╗
 * ║    JARVIS MOBILE — SOCIAL CONTROLLER    ║
 * ╚══════════════════════════════════════════╝
 * Mirrors PC social.py — uses mobile deep links instead of
 * pywhatkit/webbrowser/subprocess.
 */

const Social = (() => {
  const _respectWords = ['sir', 'boss', 'mister kishore'];
  const _pick = () => _respectWords[Math.floor(Math.random() * _respectWords.length)];

  // ─── CONTACTS (same as PC) ────────────────────────────────────────────────
  const CONTACTS = {
    'mom':  '+919999999991',
    'dad':  '+919999999992',
    'home': '+919999999993',
  };

  function _resolveContact(nameOrNumber) {
    const key = nameOrNumber.trim().toLowerCase();
    if (CONTACTS[key]) return CONTACTS[key];
    return nameOrNumber.replace(/[\s-]/g, '');
  }

  function _ensurePlus(number) {
    return number.startsWith('+') ? number : '+' + number;
  }

  // ─── WHATSAPP ─────────────────────────────────────────────────────────────
  function whatsappOpen() {
    return {
      response: `Opening WhatsApp, ${_pick()}.`,
      actionUrl: 'https://wa.me/',
    };
  }

  function whatsappSendMessage(numberOrName, message) {
    const number = _ensurePlus(_resolveContact(numberOrName));
    const clean = number.replace('+', '');
    const encoded = encodeURIComponent(message);
    return {
      response: `Sending WhatsApp message to ${number}, ${_pick()}.`,
      actionUrl: `https://wa.me/${clean}?text=${encoded}`,
    };
  }

  function whatsappCall(numberOrName) {
    const number = _ensurePlus(_resolveContact(numberOrName));
    const clean = number.replace('+', '');
    return {
      response: `Opening WhatsApp chat with ${number} — initiate the call from there, ${_pick()}.`,
      actionUrl: `https://wa.me/${clean}`,
    };
  }

  function whatsappStatus() {
    return {
      response: `Opening WhatsApp — check your status from there, ${_pick()}.`,
      actionUrl: 'https://web.whatsapp.com',
    };
  }

  // ─── PHONE CALLS ──────────────────────────────────────────────────────────
  function makeCall(numberOrName) {
    const number = _ensurePlus(_resolveContact(numberOrName));
    return {
      response: `Calling ${number} now, ${_pick()}.`,
      actionUrl: `tel:${number}`,
    };
  }

  // ─── INSTAGRAM ────────────────────────────────────────────────────────────
  function instagramOpen() {
    return {
      response: `Opening Instagram, ${_pick()}.`,
      actionUrl: 'https://www.instagram.com',
    };
  }

  function instagramProfile(username) {
    username = username.trim().replace(/^@/, '');
    if (!username) {
      return { response: `Please provide an Instagram username, ${_pick()}.`, actionUrl: null };
    }
    return {
      response: `Opening Instagram profile of @${username}, ${_pick()}.`,
      actionUrl: `https://www.instagram.com/${username}/`,
    };
  }

  function instagramSearch(query) {
    const encoded = encodeURIComponent(query + ' site:instagram.com');
    return {
      response: `Searching Instagram for '${query}', ${_pick()}.`,
      actionUrl: `https://www.google.com/search?q=${encoded}`,
    };
  }

  function instagramDm(username) {
    username = username.trim().replace(/^@/, '');
    if (!username) {
      return { response: `Please provide a username to DM, ${_pick()}.`, actionUrl: null };
    }
    return {
      response: `Opening Instagram DM with @${username}, ${_pick()}.`,
      actionUrl: `https://www.instagram.com/direct/new/?username=${username}`,
    };
  }

  function instagramReels() {
    return {
      response: `Opening Instagram Reels, ${_pick()}.`,
      actionUrl: 'https://www.instagram.com/reels/',
    };
  }

  function instagramExplore() {
    return {
      response: `Opening Instagram Explore, ${_pick()}.`,
      actionUrl: 'https://www.instagram.com/explore/',
    };
  }

  return {
    whatsappOpen, whatsappSendMessage, whatsappCall, whatsappStatus,
    makeCall,
    instagramOpen, instagramProfile, instagramSearch,
    instagramDm, instagramReels, instagramExplore,
    CONTACTS,
  };
})();
