/* Consumed before the existing GA initializer; never overrides invite eligibility. */
(function () {
  'use strict';
  function stopSavedOptOut() {
    try {
      if (window.localStorage.getItem('mado-ga-optout') !== '1') return;
      window.MADO_ANALYTICS_DISABLED = true;
      window['ga-disable-G-C2ESB694FV'] = true;
    } catch (error) { /* Preserve the existing initializer's storage semantics. */ }
  }
  window.addEventListener('storage', event => {
    if (event.key === 'mado-ga-optout' || event.key === 'mado-android-app-invite-v2' || event.key === null) stopSavedOptOut();
  });
  window.addEventListener('pageshow', stopSavedOptOut);
  window.addEventListener('focus', stopSavedOptOut, true);
  document.addEventListener('visibilitychange', stopSavedOptOut);
  stopSavedOptOut();
  const url = new URL(window.location.href);
  const reset = url.searchParams.getAll('android_invite_reset');
  const ga = url.searchParams.getAll('ga');
  if (reset.length !== 1 || reset[0] !== '1' || ga.length !== 1 || ga[0] !== 'off'
      || url.searchParams.getAll('ga_optout').includes('0')) return;
  // Keep this test page excluded even when storage is unavailable.
  window.MADO_ANDROID_INVITE_TEST_GA_DISABLED = true;
  url.searchParams.delete('android_invite_reset');
  try { window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash); }
  catch (error) { return; } // Do not reset unless the reload trigger was consumed.
  try {
    // Other tabs must see opt-out before the shared dismissal disappears.
    window.localStorage.setItem('mado-ga-optout', '1');
    if (window.localStorage.getItem('mado-ga-optout') !== '1') return;
    window.localStorage.removeItem('mado-android-app-invite-v2');
  }
  catch (error) { /* The normal invitation storage guard remains in force. */ }
})();
