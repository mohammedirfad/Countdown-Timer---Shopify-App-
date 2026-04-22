

/**
 * Helixo Countdown Timer Widget  v3
 *
 * Fixes vs v2:
 *  - Hides widget completely when expired (no "EXPIRED" text shown to shoppers)
 *  - Checks startDate: widget stays hidden until the timer's start date/time is reached
 *  - Reads evergreenDuration from config (not hardcoded 24h)
 *  - All urgency settings (urgencyType, urgencyColor, urgencyThresholdMinutes) from config
 *  - Graceful degradation: any error = silent fail, storefront never breaks
 *  - No CLS: minHeight reserved before fetch, cleared after
 *  - Target <30KB gzipped (vanilla JS only, zero deps)
 */
(function () {
  'use strict';

  var SIZE_STYLES = {
    small: { padding: '10px 16px', fontSize: '20px', labelSize: '12px' },
    medium: { padding: '16px 24px', fontSize: '28px', labelSize: '14px' },
    large: { padding: '20px 32px', fontSize: '38px', labelSize: '16px' },
  };

  // ── Entry point — safe whether script runs before or after DOMContentLoaded ──
  function init() {
    var root = document.getElementById('helixo-countdown-timer-root');
    if (!root) return;

    // Hide any static editor placeholder
    var placeholder = document.getElementById('helixo-editor-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    var rawProductId = root.getAttribute('data-product-id');
    var shop = root.getAttribute('data-shop');
    if (!rawProductId || !shop) return;

    // Normalize to full GID — backend stores gid://shopify/Product/NNN
    // but {{ product.id }} in Liquid emits just the number
    var productId = rawProductId.indexOf('gid://') === 0
      ? rawProductId
      : 'gid://shopify/Product/' + rawProductId;

    // Reserve height before fetch to prevent CLS
    root.style.minHeight = '72px';

    // /apps/countdown/timers → Shopify App Proxy → HOST/api/storefront/timers
    var apiUrl =
      '/apps/countdown/timers?shop=' + encodeURIComponent(shop) +
      '&productId=' + encodeURIComponent(productId);

    fetch(apiUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        root.style.minHeight = '';
        if (!data.timers || data.timers.length === 0) return;
        renderTimer(root, data.timers[0]);
      })
      .catch(function (err) {
        // Graceful degradation — never break the storefront
        console.warn('[Helixo Timer] Could not load timer:', err.message);
        root.style.minHeight = '';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Main render function ────────────────────────────────────────────────────
  function renderTimer(root, config) {
    var design = config.design || {};
    var bgColor = design.backgroundColor || '#1a1a2e';
    var fgColor = design.textColor || '#ffffff';
    var label = design.text || 'Offer ends in:';
    var size = SIZE_STYLES[design.size] || SIZE_STYLES.medium;
    var urgencyType = design.urgencyType || 'color_pulse';
    var urgencyColor = design.urgencyColor || '#cc0000';
    var urgencyMs = (design.urgencyThresholdMinutes != null
      ? design.urgencyThresholdMinutes
      : 60) * 60 * 1000;

    // ── FIX 1: Check startDate — do not show before timer start ──────────────
    var now = Date.now();
    if (config.startDate) {
      var startMs = new Date(config.startDate).getTime();
      if (now < startMs) {
        // Not started yet — hide silently and poll until start
        root.style.minHeight = '';
        var delay = Math.min(startMs - now, 60000); // check again in max 60s
        setTimeout(function () { renderTimer(root, config); }, delay);
        return;
      }
    }

    // ── Determine end time ────────────────────────────────────────────────────
    var endTime;
    if (config.type === 'evergreen') {
      var durationMs = (config.evergreenDuration || 24) * 60 * 60 * 1000;
      var storageKey = 'helixo_ev_' + (config._id || 'default');
      var stored = null;
      try { stored = localStorage.getItem(storageKey); } catch (e) { }
      if (!stored) {
        stored = String(Date.now());
        try { localStorage.setItem(storageKey, stored); } catch (e) { }
      }
      endTime = parseInt(stored, 10) + durationMs;
    } else {
      if (!config.endDate) { root.style.minHeight = ''; return; }
      endTime = new Date(config.endDate).getTime();
    }

    // ── FIX 2: Already expired before render — hide silently, show nothing ────
    if (endTime <= now) {
      root.style.minHeight = '';
      root.innerHTML = '';
      return;
    }

    // ── Build DOM ─────────────────────────────────────────────────────────────
    // Use unique IDs so multiple timers on same page don't collide
    var uid = 'helixo-' + Math.random().toString(36).slice(2, 7);
    var clockId = uid + '-clock';
    var wrapperId = uid + '-wrap';

    root.innerHTML =
      '<div id="' + wrapperId + '" style="' +
      'background:' + bgColor + ';' +
      'color:' + fgColor + ';' +
      'padding:' + size.padding + ';' +
      'text-align:center;' +
      'border-radius:8px;' +
      'margin-bottom:16px;' +
      'font-family:sans-serif;' +
      'transition:background 0.4s ease,color 0.4s ease;' +
      '">' +
      '<p style="margin:0 0 5px;font-size:' + size.labelSize + ';opacity:0.85;">' +
      escapeHtml(label) +
      '</p>' +
      '<p id="' + clockId + '" style="margin:0;font-size:' + size.fontSize + ';font-weight:bold;letter-spacing:2px;">--h --m --s</p>' +
      '</div>';

    var clockEl = document.getElementById(clockId);
    var wrapperEl = document.getElementById(wrapperId);
    if (!clockEl || !wrapperEl) return;

    // ── Fire-and-forget impression ping ──────────────────────────────────────
    if (config._id) {
      fetch('/apps/countdown/timers/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timerId: config._id }),
      }).catch(function () { });
    }

    // ── Countdown tick ────────────────────────────────────────────────────────
    var urgencyApplied = false;

    var interval = setInterval(function () {
      var distance = endTime - Date.now();

      // ── FIX 2 (runtime): When expired, hide the widget entirely ─────────────
      if (distance <= 0) {
        clearInterval(interval);
        root.innerHTML = '';          // hide completely — no "EXPIRED" text
        root.style.minHeight = '';
        return;
      }

      // ── Urgency cue ───────────────────────────────────────────────────────
      if (distance < urgencyMs && !urgencyApplied && urgencyType !== 'none') {
        urgencyApplied = true;
        wrapperEl.style.background = urgencyColor;
        wrapperEl.style.color = '#ffffff';
        if (urgencyType === 'color_pulse') {
          injectPulseAnimation();
          wrapperEl.style.animation = 'helixo-pulse 1.5s ease-in-out infinite';
        }
      }

      var h = Math.floor((distance % 86400000) / 3600000);
      var m = Math.floor((distance % 3600000) / 60000);
      var s = Math.floor((distance % 60000) / 1000);
      clockEl.textContent = pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
    }, 1000);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function injectPulseAnimation() {
    if (document.getElementById('helixo-pulse-style')) return;
    var s = document.createElement('style');
    s.id = 'helixo-pulse-style';
    s.textContent = '@keyframes helixo-pulse{0%,100%{opacity:1}50%{opacity:0.65}}';
    document.head.appendChild(s);
  }

})();