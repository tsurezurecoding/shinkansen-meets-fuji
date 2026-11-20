// Japanese editorial features load one official embed at a time.
(() => {
  'use strict';
  let closeActive;
  let widgetLoader;

  function closePlayer() {
    if (closeActive) closeActive();
    closeActive = null;
  }

  function getWidgets() {
    if (window.twttr?.widgets) return Promise.resolve(window.twttr.widgets);
    if (!widgetLoader) {
      widgetLoader = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://platform.twitter.com/widgets.js';
        script.onload = () => {
          if (window.twttr?.widgets) resolve(window.twttr.widgets);
          else { script.remove(); reject(new Error('X widgets unavailable')); }
        };
        script.onerror = () => { script.remove(); reject(new Error('X widgets unavailable')); };
        document.head.append(script);
      }).catch(error => { widgetLoader = null; throw error; });
    }
    return widgetLoader;
  }

  function openPost(link) {
    const frame = link.parentElement;
    const template = frame.querySelector('template');
    if (!template) return;
    closePlayer();
    const mount = document.createElement('div');
    mount.className = 'feature-post-mount';
    const status = link.cloneNode(true);
    status.className = 'feature-post-open';
    status.textContent = 'Xで元の投稿を見る';
    link.replaceWith(status);
    frame.append(mount);
    frame.setAttribute('aria-busy', 'true');
    frame.tabIndex = -1;
    frame.focus({ preventScroll: true });
    const close = () => {
      frame.replaceChildren(link, template);
      frame.removeAttribute('aria-busy');
      frame.removeAttribute('tabindex');
      frame.classList.remove('is-loaded');
    };
    closeActive = close;
    getWidgets().then(async widgets => {
      if (closeActive !== close) return;
      // createTweet renders just this ID and also signals a deleted/blocked post.
      const id = link.pathname.match(/\/status\/(\d+)/)[1];
      const tweet = await widgets.createTweet(id, mount, { dnt: true, align: 'center' });
      if (closeActive !== close) return;
      if (tweet) {
        status.remove();
        frame.classList.add('is-loaded');
      }
    }).catch(() => {
      // The original post and its separately credited link are still reachable.
    }).finally(() => { if (closeActive === close) frame.removeAttribute('aria-busy'); });
  }

  function playButton(button) {
    const card = button.closest('[data-video-id]');
    if (!card) return;
    closePlayer();
    const player = document.createElement('iframe');
    player.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(card.dataset.videoId) + '?autoplay=1&playsinline=1';
    player.title = card.dataset.videoTitle || button.getAttribute('aria-label') || 'YouTube動画';
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    player.allowFullscreen = true;
    button.replaceWith(player);
    closeActive = () => player.replaceWith(button);
    player.focus({ preventScroll: true });
  }

  for (const link of document.querySelectorAll('a.feature-post-open')) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      openPost(link);
    });
  }
  for (const button of document.querySelectorAll('.hb-facade, .wm-facade button')) {
    button.addEventListener('click', () => playButton(button));
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
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        closePlayer();
        frame.src = link.href;
        frame.removeAttribute('srcdoc');
        closeActive = () => { frame.srcdoc = preview; frame.src = embed; };
        frame.focus({ preventScroll: true });
      });
    }
    frame.addEventListener('load', bindPreview);
    bindPreview();
  }
})();
