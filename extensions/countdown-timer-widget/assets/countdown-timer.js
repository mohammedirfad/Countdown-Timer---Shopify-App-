// // // // /**
// // // //  * Helixo Countdown Timer Widget
// // // //  * Lightweight vanilla JS — target <30KB gzipped
// // // //  * Handles: fixed timers, evergreen (session-based) timers, urgency cues,
// // // //  *          graceful degradation on network failure, no CLS.
// // // //  */
// // // // (function () {
// // // //   'use strict';

// // // //   var URGENCY_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour = show urgency color

// // // //   document.addEventListener('DOMContentLoaded', function () {
// // // //     var root = document.getElementById('helixo-countdown-timer-root');
// // // //     if (!root) return;

// // // //     var productId = root.getAttribute('data-product-id');
// // // //     var shop = root.getAttribute('data-shop');
// // // //     if (!productId || !shop) return;

// // // //     // Reserve space immediately to avoid CLS
// // // //     root.style.minHeight = '80px';

// // // //     var apiUrl =
// // // //       '/apps/countdown/timers?shop=' +
// // // //       encodeURIComponent(shop) +
// // // //       '&productId=' +
// // // //       encodeURIComponent(productId);

// // // //     fetch(apiUrl)
// // // //       .then(function (res) {
// // // //         if (!res.ok) throw new Error('HTTP ' + res.status);
// // // //         return res.json();
// // // //       })
// // // //       .then(function (data) {
// // // //         if (!data.timers || data.timers.length === 0) {
// // // //           root.style.minHeight = '';
// // // //           return;
// // // //         }
// // // //         renderTimer(root, data.timers[0], shop);
// // // //       })
// // // //       .catch(function (err) {
// // // //         // Graceful degradation — never break the storefront
// // // //         console.warn('[Helixo Timer] Could not load timer:', err.message);
// // // //         root.style.minHeight = '';
// // // //       });
// // // //   });

// // // //   function renderTimer(root, config, shop) {
// // // //     var design = config.design || {};
// // // //     var bgColor = design.backgroundColor || '#000000';
// // // //     var fgColor = design.textColor || '#FFFFFF';
// // // //     var labelText = design.text || 'Offer ends in:';

// // // //     // Apply base styles
// // // //     root.style.backgroundColor = bgColor;
// // // //     root.style.color = fgColor;
// // // //     root.style.padding = '16px 24px';
// // // //     root.style.textAlign = 'center';
// // // //     root.style.borderRadius = '8px';
// // // //     root.style.marginBottom = '16px';
// // // //     root.style.fontFamily = 'sans-serif';
// // // //     root.style.transition = 'background-color 0.5s ease';
// // // //     root.style.minHeight = '';

// // // //     root.innerHTML =
// // // //       '<p style="margin:0;font-size:14px;opacity:0.85" id="helixo-timer-label">' +
// // // //       escapeHtml(labelText) +
// // // //       '</p>' +
// // // //       '<p style="margin:6px 0 0;font-size:28px;font-weight:bold" id="helixo-countdown-clock">--:--:--</p>';

// // // //     var clockEl = document.getElementById('helixo-countdown-clock');
// // // //     if (!clockEl) return;

// // // //     // Determine end time
// // // //     var endTime;
// // // //     if (config.type === 'evergreen') {
// // // //       var storageKey = 'helixo_timer_' + (config._id || 'default');
// // // //       var stored = null;
// // // //       try { stored = localStorage.getItem(storageKey); } catch (e) { }
// // // //       if (!stored) {
// // // //         stored = String(Date.now());
// // // //         try { localStorage.setItem(storageKey, stored); } catch (e) { }
// // // //       }
// // // //       // Default evergreen duration: 24 hours. Could be driven by config.duration in future.
// // // //       endTime = parseInt(stored, 10) + 24 * 60 * 60 * 1000;
// // // //     } else {
// // // //       if (!config.endDate) { root.style.minHeight = ''; root.innerHTML = ''; return; }
// // // //       endTime = new Date(config.endDate).getTime();
// // // //     }

// // // //     // Track impression (fire-and-forget)
// // // //     if (config._id) {
// // // //       fetch('/apps/countdown/timers/impression', {
// // // //         method: 'POST',
// // // //         headers: { 'Content-Type': 'application/json' },
// // // //         body: JSON.stringify({ timerId: config._id }),
// // // //       }).catch(function () { });
// // // //     }

// // // //     var urgencyApplied = false;

// // // //     var interval = setInterval(function () {
// // // //       var now = Date.now();
// // // //       var distance = endTime - now;

// // // //       if (distance <= 0) {
// // // //         clearInterval(interval);
// // // //         clockEl.textContent = 'EXPIRED';
// // // //         root.style.backgroundColor = '#555555';
// // // //         return;
// // // //       }

// // // //       // Urgency cue: flash red background when < 1 hour remaining
// // // //       if (distance < URGENCY_THRESHOLD_MS && !urgencyApplied) {
// // // //         urgencyApplied = true;
// // // //         root.style.backgroundColor = '#cc0000';
// // // //         root.style.color = '#ffffff';
// // // //         root.style.animation = 'helixo-pulse 1.5s ease-in-out infinite';
// // // //         injectPulseAnimation();
// // // //       }

// // // //       var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
// // // //       var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
// // // //       var seconds = Math.floor((distance % (1000 * 60)) / 1000);

// // // //       clockEl.textContent =
// // // //         pad(hours) + 'h ' + pad(minutes) + 'm ' + pad(seconds) + 's';
// // // //     }, 1000);
// // // //   }

// // // //   function pad(n) {
// // // //     return n < 10 ? '0' + n : String(n);
// // // //   }

// // // //   function escapeHtml(str) {
// // // //     return String(str)
// // // //       .replace(/&/g, '&amp;')
// // // //       .replace(/</g, '&lt;')
// // // //       .replace(/>/g, '&gt;')
// // // //       .replace(/"/g, '&quot;');
// // // //   }

// // // //   function injectPulseAnimation() {
// // // //     if (document.getElementById('helixo-pulse-style')) return;
// // // //     var style = document.createElement('style');
// // // //     style.id = 'helixo-pulse-style';
// // // //     style.textContent =
// // // //       '@keyframes helixo-pulse {' +
// // // //       '0%,100%{opacity:1}' +
// // // //       '50%{opacity:0.75}' +
// // // //       '}';
// // // //     document.head.appendChild(style);
// // // //   }
// // // // })();


// // // /**
// // //  * Helixo Countdown Timer Widget
// // //  * Lightweight vanilla JS — target <30KB gzipped
// // //  * Handles: fixed timers, evergreen (session-based) timers, urgency cues,
// // //  *          graceful degradation on network failure, no CLS.
// // //  */
// // // (function () {
// // //   'use strict';

// // //   var URGENCY_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour = show urgency color

// // //   document.addEventListener('DOMContentLoaded', function () {
// // //     var root = document.getElementById('helixo-countdown-timer-root');
// // //     if (!root) return;

// // //     var productId = root.getAttribute('data-product-id');
// // //     var shop = root.getAttribute('data-shop');
// // //     if (!productId || !shop) return;

// // //     // Reserve space immediately to avoid CLS
// // //     root.style.minHeight = '80px';

// // //     var apiUrl =
// // //       '/apps/countdown/api/storefront/timers?shop=' +
// // //       encodeURIComponent(shop) +
// // //       '&productId=' +
// // //       encodeURIComponent(productId);

// // //     fetch(apiUrl)
// // //       .then(function (res) {
// // //         if (!res.ok) throw new Error('HTTP ' + res.status);
// // //         return res.json();
// // //       })
// // //       .then(function (data) {
// // //         if (!data.timers || data.timers.length === 0) {
// // //           root.style.minHeight = '';
// // //           return;
// // //         }
// // //         renderTimer(root, data.timers[0], shop);
// // //       })
// // //       .catch(function (err) {
// // //         // Graceful degradation — never break the storefront
// // //         console.warn('[Helixo Timer] Could not load timer:', err.message);
// // //         root.style.minHeight = '';
// // //       });
// // //   });

// // //   function renderTimer(root, config, shop) {
// // //     var design = config.design || {};
// // //     var bgColor = design.backgroundColor || '#000000';
// // //     var fgColor = design.textColor || '#FFFFFF';
// // //     var labelText = design.text || 'Offer ends in:';

// // //     // Apply base styles
// // //     root.style.backgroundColor = bgColor;
// // //     root.style.color = fgColor;
// // //     root.style.padding = '16px 24px';
// // //     root.style.textAlign = 'center';
// // //     root.style.borderRadius = '8px';
// // //     root.style.marginBottom = '16px';
// // //     root.style.fontFamily = 'sans-serif';
// // //     root.style.transition = 'background-color 0.5s ease';
// // //     root.style.minHeight = '';

// // //     root.innerHTML =
// // //       '<p style="margin:0;font-size:14px;opacity:0.85" id="helixo-timer-label">' +
// // //       escapeHtml(labelText) +
// // //       '</p>' +
// // //       '<p style="margin:6px 0 0;font-size:28px;font-weight:bold" id="helixo-countdown-clock">--:--:--</p>';

// // //     var clockEl = document.getElementById('helixo-countdown-clock');
// // //     if (!clockEl) return;

// // //     // Determine end time
// // //     var endTime;
// // //     if (config.type === 'evergreen') {
// // //       var storageKey = 'helixo_timer_' + (config._id || 'default');
// // //       var stored = null;
// // //       try { stored = localStorage.getItem(storageKey); } catch (e) { }
// // //       if (!stored) {
// // //         stored = String(Date.now());
// // //         try { localStorage.setItem(storageKey, stored); } catch (e) { }
// // //       }
// // //       // Default evergreen duration: 24 hours. Could be driven by config.duration in future.
// // //       endTime = parseInt(stored, 10) + 24 * 60 * 60 * 1000;
// // //     } else {
// // //       if (!config.endDate) { root.style.minHeight = ''; root.innerHTML = ''; return; }
// // //       endTime = new Date(config.endDate).getTime();
// // //     }

// // //     // Track impression (fire-and-forget)
// // //     if (config._id) {
// // //       fetch('/apps/countdown/api/storefront/timers/impression', {
// // //         method: 'POST',
// // //         headers: { 'Content-Type': 'application/json' },
// // //         body: JSON.stringify({ timerId: config._id }),
// // //       }).catch(function () { });
// // //     }

// // //     var urgencyApplied = false;

// // //     var interval = setInterval(function () {
// // //       var now = Date.now();
// // //       var distance = endTime - now;

// // //       if (distance <= 0) {
// // //         clearInterval(interval);
// // //         clockEl.textContent = 'EXPIRED';
// // //         root.style.backgroundColor = '#555555';
// // //         return;
// // //       }

// // //       // Urgency cue: flash red background when < 1 hour remaining
// // //       if (distance < URGENCY_THRESHOLD_MS && !urgencyApplied) {
// // //         urgencyApplied = true;
// // //         root.style.backgroundColor = '#cc0000';
// // //         root.style.color = '#ffffff';
// // //         root.style.animation = 'helixo-pulse 1.5s ease-in-out infinite';
// // //         injectPulseAnimation();
// // //       }

// // //       var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
// // //       var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
// // //       var seconds = Math.floor((distance % (1000 * 60)) / 1000);

// // //       clockEl.textContent =
// // //         pad(hours) + 'h ' + pad(minutes) + 'm ' + pad(seconds) + 's';
// // //     }, 1000);
// // //   }

// // //   function pad(n) {
// // //     return n < 10 ? '0' + n : String(n);
// // //   }

// // //   function escapeHtml(str) {
// // //     return String(str)
// // //       .replace(/&/g, '&amp;')
// // //       .replace(/</g, '&lt;')
// // //       .replace(/>/g, '&gt;')
// // //       .replace(/"/g, '&quot;');
// // //   }

// // //   function injectPulseAnimation() {
// // //     if (document.getElementById('helixo-pulse-style')) return;
// // //     var style = document.createElement('style');
// // //     style.id = 'helixo-pulse-style';
// // //     style.textContent =
// // //       '@keyframes helixo-pulse {' +
// // //       '0%,100%{opacity:1}' +
// // //       '50%{opacity:0.75}' +
// // //       '}';
// // //     document.head.appendChild(style);
// // //   }
// // // })();


// // /**
// //  * Helixo Countdown Timer Widget
// //  */
// // (function () {
// //   'use strict';

// //   var URGENCY_THRESHOLD_MS = 60 * 60 * 1000;

// //   function init() {
// //     var root = document.getElementById('helixo-countdown-timer-root');
// //     if (!root) return;

// //     // Hide the editor placeholder now that JS is running
// //     var placeholder = document.getElementById('helixo-editor-placeholder');
// //     if (placeholder) placeholder.style.display = 'none';

// //     var rawProductId = root.getAttribute('data-product-id');
// //     var shop = root.getAttribute('data-shop');
// //     if (!rawProductId || !shop) return;

// //     // Normalize to full GID — backend stores "gid://shopify/Product/123"
// //     // but {{ product.id }} in Liquid outputs just the number "123"
// //     var productId = rawProductId.indexOf('gid://') === 0
// //       ? rawProductId
// //       : 'gid://shopify/Product/' + rawProductId;

// //     root.style.minHeight = '80px';

// //     // IMPORTANT: /apps/countdown → proxied by Shopify to → YOUR_HOST/api/storefront
// //     // So /apps/countdown/timers → YOUR_HOST/api/storefront/timers
// //     var apiUrl =
// //       '/apps/countdown/timers?shop=' +
// //       encodeURIComponent(shop) +
// //       '&productId=' +
// //       encodeURIComponent(productId);

// //     fetch(apiUrl)
// //       .then(function (res) {
// //         if (!res.ok) throw new Error('HTTP ' + res.status);
// //         return res.json();
// //       })
// //       .then(function (data) {
// //         if (!data.timers || data.timers.length === 0) {
// //           root.style.minHeight = '';
// //           return;
// //         }
// //         renderTimer(root, data.timers[0]);
// //       })
// //       .catch(function (err) {
// //         console.warn('[Helixo Timer] Could not load timer:', err.message);
// //         root.style.minHeight = '';
// //       });
// //   }

// //   // Safe init — works whether script runs before or after DOMContentLoaded
// //   if (document.readyState === 'loading') {
// //     document.addEventListener('DOMContentLoaded', init);
// //   } else {
// //     init();
// //   }

// //   function renderTimer(root, config) {
// //     var design = config.design || {};
// //     var bgColor = design.backgroundColor || '#1a1a2e';
// //     var fgColor = design.textColor || '#FFFFFF';
// //     var labelText = design.text || 'Offer ends in:';

// //     root.style.minHeight = '';
// //     root.style.display = 'block';

// //     var clockId = 'helixo-clock-' + Date.now();
// //     root.innerHTML =
// //       '<div style="' +
// //       'background:' + bgColor + ';' +
// //       'color:' + fgColor + ';' +
// //       'padding:16px 24px;' +
// //       'text-align:center;' +
// //       'border-radius:8px;' +
// //       'margin-bottom:16px;' +
// //       'font-family:sans-serif;' +
// //       'transition:background-color 0.5s ease;' +
// //       '">' +
// //       '<p style="margin:0 0 6px 0;font-size:14px;opacity:0.85;">' + escapeHtml(labelText) + '</p>' +
// //       '<p id="' + clockId + '" style="margin:0;font-size:32px;font-weight:bold;letter-spacing:2px;">--h --m --s</p>' +
// //       '</div>';

// //     var clockEl = document.getElementById(clockId);
// //     if (!clockEl) return;

// //     var endTime;
// //     if (config.type === 'evergreen') {
// //       var storageKey = 'helixo_timer_' + (config._id || 'default');
// //       var stored = null;
// //       try { stored = localStorage.getItem(storageKey); } catch (e) { }
// //       if (!stored) {
// //         stored = String(Date.now());
// //         try { localStorage.setItem(storageKey, stored); } catch (e) { }
// //       }
// //       endTime = parseInt(stored, 10) + 24 * 60 * 60 * 1000;
// //     } else {
// //       if (!config.endDate) { root.innerHTML = ''; return; }
// //       endTime = new Date(config.endDate).getTime();
// //     }

// //     if (config._id) {
// //       fetch('/apps/countdown/timers/impression', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ timerId: config._id }),
// //       }).catch(function () { });
// //     }

// //     var urgencyApplied = false;
// //     var timerDiv = clockEl.parentElement;

// //     var interval = setInterval(function () {
// //       var distance = endTime - Date.now();
// //       if (distance <= 0) {
// //         clearInterval(interval);
// //         clockEl.textContent = 'EXPIRED';
// //         if (timerDiv) timerDiv.style.backgroundColor = '#555';
// //         return;
// //       }
// //       if (distance < URGENCY_THRESHOLD_MS && !urgencyApplied) {
// //         urgencyApplied = true;
// //         if (timerDiv) {
// //           timerDiv.style.backgroundColor = '#cc0000';
// //           timerDiv.style.color = '#fff';
// //           injectPulseAnimation();
// //           timerDiv.style.animation = 'helixo-pulse 1.5s ease-in-out infinite';
// //         }
// //       }
// //       var h = Math.floor((distance % 86400000) / 3600000);
// //       var m = Math.floor((distance % 3600000) / 60000);
// //       var s = Math.floor((distance % 60000) / 1000);
// //       clockEl.textContent = pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
// //     }, 1000);
// //   }

// //   function pad(n) { return n < 10 ? '0' + n : String(n); }

// //   function escapeHtml(str) {
// //     return String(str)
// //       .replace(/&/g, '&amp;').replace(/</g, '&lt;')
// //       .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// //   }

// //   function injectPulseAnimation() {
// //     if (document.getElementById('helixo-pulse-style')) return;
// //     var s = document.createElement('style');
// //     s.id = 'helixo-pulse-style';
// //     s.textContent = '@keyframes helixo-pulse{0%,100%{opacity:1}50%{opacity:.75}}';
// //     document.head.appendChild(s);
// //   }
// // })();

// /**
//  * Helixo Countdown Timer Widget  v2
//  * - Reads all design fields: size, urgencyType, urgencyColor, urgencyThresholdMinutes
//  * - Evergreen uses configurable session duration (evergreenDuration hours)
//  * - Safe init: works before or after DOMContentLoaded
//  * - Graceful degradation: never throws, never breaks the storefront
//  */
// (function () {
//   'use strict';

//   var SIZE_STYLES = {
//     small:  { padding: '10px 16px', fontSize: '20px', labelSize: '12px' },
//     medium: { padding: '16px 24px', fontSize: '28px', labelSize: '14px' },
//     large:  { padding: '20px 32px', fontSize: '38px', labelSize: '16px' },
//   };

//   function init() {
//     var root = document.getElementById('helixo-countdown-timer-root');
//     if (!root) return;

//     // Hide the static editor placeholder
//     var placeholder = document.getElementById('helixo-editor-placeholder');
//     if (placeholder) placeholder.style.display = 'none';

//     var rawProductId = root.getAttribute('data-product-id');
//     var shop = root.getAttribute('data-shop');
//     if (!rawProductId || !shop) return;

//     // Normalize to GID for backend query
//     var productId = rawProductId.indexOf('gid://') === 0
//       ? rawProductId
//       : 'gid://shopify/Product/' + rawProductId;

//     root.style.minHeight = '72px'; // reserve space — prevents CLS

//     // /apps/countdown/timers → proxied to HOST/api/storefront/timers
//     var apiUrl =
//       '/apps/countdown/timers?shop=' + encodeURIComponent(shop) +
//       '&productId=' + encodeURIComponent(productId);

//     fetch(apiUrl)
//       .then(function (res) {
//         if (!res.ok) throw new Error('HTTP ' + res.status);
//         return res.json();
//       })
//       .then(function (data) {
//         root.style.minHeight = '';
//         if (!data.timers || data.timers.length === 0) return;
//         renderTimer(root, data.timers[0]);
//       })
//       .catch(function (err) {
//         console.warn('[Helixo Timer] Could not load timer:', err.message);
//         root.style.minHeight = '';
//       });
//   }

//   // Safe init regardless of when script loads
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', init);
//   } else {
//     init();
//   }

//   function renderTimer(root, config) {
//     var design   = config.design || {};
//     var bgColor  = design.backgroundColor || '#1a1a2e';
//     var fgColor  = design.textColor       || '#ffffff';
//     var label    = design.text            || 'Offer ends in:';
//     var size     = SIZE_STYLES[design.size] || SIZE_STYLES.medium;

//     var urgencyType       = design.urgencyType              || 'color_pulse';
//     var urgencyColor      = design.urgencyColor             || '#cc0000';
//     var urgencyThresholdMs = (design.urgencyThresholdMinutes || 60) * 60 * 1000;

//     // Unique IDs so multiple timers on one page don't conflict
//     var uid      = 'helixo-' + Math.random().toString(36).slice(2, 7);
//     var clockId  = uid + '-clock';
//     var wrapperId = uid + '-wrap';

//     root.innerHTML =
//       '<div id="' + wrapperId + '" style="' +
//         'background:' + bgColor + ';' +
//         'color:' + fgColor + ';' +
//         'padding:' + size.padding + ';' +
//         'text-align:center;border-radius:8px;margin-bottom:16px;' +
//         'font-family:sans-serif;transition:background 0.4s,color 0.4s;' +
//       '">' +
//         '<p style="margin:0 0 5px;font-size:' + size.labelSize + ';opacity:0.85;">' +
//           escapeHtml(label) +
//         '</p>' +
//         '<p id="' + clockId + '" style="margin:0;font-size:' + size.fontSize + ';font-weight:bold;letter-spacing:2px;">--h --m --s</p>' +
//       '</div>';

//     var clockEl   = document.getElementById(clockId);
//     var wrapperEl = document.getElementById(wrapperId);
//     if (!clockEl || !wrapperEl) return;

//     // ── Determine end time ────────────────────────────────────────────────
//     var endTime;
//     if (config.type === 'evergreen') {
//       var durationMs  = (config.evergreenDuration || 24) * 60 * 60 * 1000;
//       var storageKey  = 'helixo_ev_' + (config._id || 'default');
//       var stored      = null;
//       try { stored = localStorage.getItem(storageKey); } catch (e) {}
//       if (!stored) {
//         stored = String(Date.now());
//         try { localStorage.setItem(storageKey, stored); } catch (e) {}
//       }
//       endTime = parseInt(stored, 10) + durationMs;
//     } else {
//       if (!config.endDate) { root.innerHTML = ''; return; }
//       endTime = new Date(config.endDate).getTime();
//     }

//     // Fire-and-forget impression ping
//     if (config._id) {
//       fetch('/apps/countdown/timers/impression', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ timerId: config._id }),
//       }).catch(function () {});
//     }

//     // ── Tick function ─────────────────────────────────────────────────────
//     var urgencyApplied = false;

//     var interval = setInterval(function () {
//       var distance = endTime - Date.now();

//       if (distance <= 0) {
//         clearInterval(interval);
//         clockEl.textContent = 'EXPIRED';
//         wrapperEl.style.background = '#555555';
//         wrapperEl.style.animation  = 'none';
//         return;
//       }

//       // Urgency trigger
//       if (distance < urgencyThresholdMs && !urgencyApplied && urgencyType !== 'none') {
//         urgencyApplied = true;
//         wrapperEl.style.background = urgencyColor;
//         wrapperEl.style.color      = '#ffffff';
//         if (urgencyType === 'color_pulse') {
//           injectPulseAnimation();
//           wrapperEl.style.animation = 'helixo-pulse 1.5s ease-in-out infinite';
//         }
//       }

//       var h = Math.floor((distance % 86400000) / 3600000);
//       var m = Math.floor((distance % 3600000)  / 60000);
//       var s = Math.floor((distance % 60000)    / 1000);
//       clockEl.textContent = pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
//     }, 1000);
//   }

//   function pad(n) { return n < 10 ? '0' + n : String(n); }

//   function escapeHtml(str) {
//     return String(str)
//       .replace(/&/g, '&amp;').replace(/</g, '&lt;')
//       .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
//   }

//   function injectPulseAnimation() {
//     if (document.getElementById('helixo-pulse-style')) return;
//     var s = document.createElement('style');
//     s.id = 'helixo-pulse-style';
//     s.textContent = '@keyframes helixo-pulse{0%,100%{opacity:1}50%{opacity:0.7}}';
//     document.head.appendChild(s);
//   }

// })();

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