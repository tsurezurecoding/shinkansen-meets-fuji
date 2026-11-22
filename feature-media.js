// Editorial videos keep one official player and its thumbnail in the same frame.
(() => {
  'use strict';
  const words = JSON.parse(document.getElementById('mado-feature-media-copy')?.textContent || '{}');
  const margin = 160;
  const nearby = new Set();
  const attempted = new WeakSet();
  let active;
  let widgetsRequest;

  function closePlayer() {
    active?.close();
    active = null;
  }

  function getWidgets() {
    if (window.twttr?.widgets) return Promise.resolve(window.twttr.widgets);
    if (!widgetsRequest) {
      widgetsRequest = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        const timer = setTimeout(fail, 10000);
        function fail() {
          clearTimeout(timer);
          script.remove();
          reject(new Error('X widgets unavailable'));
        }
        script.onload = () => {
          clearTimeout(timer);
          if (window.twttr?.widgets) resolve(window.twttr.widgets);
          else fail();
        };
        script.onerror = fail;
        document.head.append(script);
      }).catch(error => {
        widgetsRequest = null;
        throw error;
      });
    }
    return widgetsRequest;
  }

  function openMedia(preview, loadPlayer, automatic = false) {
    const frame = preview.parentElement;
    if (active?.frame === frame) {
      if (!automatic) active.showProgress?.();
      return;
    }
    closePlayer();
    frame.querySelector('.feature-media-status')?.remove();
    const mount = document.createElement('div');
    mount.className = 'feature-post-mount';
    mount.inert = true;
    const status = document.createElement('span');
    status.className = 'feature-media-status';
    status.setAttribute('role', 'status');
    status.textContent = words.loading;
    const request = new AbortController();
    const state = {frame, close, showProgress};
    active = state;
    frame.append(mount);
    if (!automatic) showProgress();
    const timer = setTimeout(showError, 15000);

    function showProgress() {
      if (!mount.classList.contains('is-ready')) frame.append(status);
    }

    function close() {
      clearTimeout(timer);
      request.abort();
      mount.remove();
      status.remove();
      preview.hidden = false;
    }

    function showError() {
      if (active !== state) return;
      closePlayer();
      status.textContent = words.failure;
      frame.append(status);
    }

    loadPlayer(mount, request.signal).then(player => {
      if (active !== state) return;
      if (!player) { showError(); return; }
      clearTimeout(timer);
      status.remove();
      const moveFocus = preview.matches(':focus-visible');
      mount.classList.add('is-ready');
      mount.inert = false;
      preview.hidden = true;
      if (moveFocus) player.focus({preventScroll:true});
    }).catch(showError);
  }

  function openPost(link, automatic = false) {
    const template = link.parentElement.querySelector('template');
    if (!template) return;
    openMedia(link, async (mount, signal) => {
      const widgets = await getWidgets();
      if (!mount.isConnected) return null;
      return new Promise(resolve => {
        const observe = new MutationObserver(() => {
          const iframe = mount.querySelector('iframe');
          // X inserts a 0–2px placeholder before reporting the rendered frame size.
          if (!iframe || iframe.style.visibility !== 'visible' || !(Number.parseFloat(iframe.style.height) > 2)) return;
          observe.disconnect();
          resolve(iframe);
        });
        observe.observe(mount, {childList:true, subtree:true, attributeFilter:['style']});
        signal.addEventListener('abort', () => {
          observe.disconnect();
          resolve(null);
        }, {once:true});
        mount.append(template.content.cloneNode(true));
        widgets.load(mount);
      });
    }, automatic);
  }

  function prepareNearbyPost() {
    if (active) {
      // Leave manually selected YouTube playback under the reader's control.
      if (!active.frame.hasAttribute('data-feature-x-video')) return;
      const bounds = active.frame.getBoundingClientRect();
      if (bounds.bottom > -margin && bounds.top < innerHeight + margin) return;
      closePlayer();
    }
    let best;
    let shortest = Infinity;
    for (const frame of nearby) {
      if (attempted.has(frame)) continue;
      const {top, bottom} = frame.getBoundingClientRect();
      if (bottom <= -margin || top >= innerHeight + margin) continue;
      const distance = Math.abs((top + bottom - innerHeight) / 2);
      if (distance < shortest) {
        best = frame;
        shortest = distance;
      }
    }
    if (!best) return;
    attempted.add(best);
    openPost(best.querySelector('.feature-post-open'), true);
  }

  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    for (const {target, isIntersecting} of entries) {
      if (isIntersecting) nearby.add(target);
      else {
        nearby.delete(target);
        attempted.delete(target);
      }
    }
    prepareNearbyPost();
  }, {rootMargin: margin + 'px 0px'}) : null;

  function primaryClick(event) {
    return !(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0);
  }

  for (const link of document.querySelectorAll('[data-feature-x-video] > .feature-post-open')) {
    observer?.observe(link.parentElement);
    link.addEventListener('click', event => {
      if (!primaryClick(event)) return;
      event.preventDefault();
      openPost(link);
    });
  }

  for (const button of document.querySelectorAll('.hb-facade, .wm-facade button')) {
    button.addEventListener('click', () => {
      const card = button.closest('[data-video-id]');
      if (!card) return;
      openMedia(button, (mount, signal) => new Promise((resolve, reject) => {
        const player = document.createElement('iframe');
        player.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(card.dataset.videoId) + '?autoplay=1&playsinline=1';
        player.title = card.dataset.videoTitle || button.getAttribute('aria-label') || words.youtube;
        player.referrerPolicy = 'strict-origin-when-cross-origin';
        player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        player.allowFullscreen = true;
        player.onload = () => resolve(player);
        player.onerror = reject;
        signal.addEventListener('abort', () => resolve(null), {once:true});
        mount.append(player);
      }));
    });
  }

  for (const frame of document.querySelectorAll('iframe[srcdoc][src^="https://www.youtube-nocookie.com/embed/"]')) {
    const preview = frame.srcdoc;
    const embed = frame.src;
    function bindPreview() {
      if (!frame.hasAttribute('srcdoc')) return;
      const link = frame.contentDocument?.querySelector('a');
      if (!link || link.dataset.bound) return;
      link.dataset.bound = 'true';
      link.addEventListener('click', event => {
        if (!primaryClick(event)) return;
        event.preventDefault();
        closePlayer();
        frame.src = link.href;
        frame.removeAttribute('srcdoc');
        active = {frame:frame.parentElement, close:() => {
          frame.srcdoc = preview;
          frame.src = embed;
        }};
        frame.focus({preventScroll:true});
      });
    }
    frame.addEventListener('load', bindPreview);
    bindPreview();
  }
})();
