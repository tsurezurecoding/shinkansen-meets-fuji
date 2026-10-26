(function (root) {
  'use strict';
  function renderComponent(payload, config, mount) {
    var template = payload.components[mount.component];
    if (typeof template !== 'string') throw new Error('Unknown shared UI component: ' + mount.component);
    var menu = mount.menu ? payload.menus[mount.menu] : '';
    if (mount.menu && typeof menu !== 'string') throw new Error('Unknown shared UI menu');
    // Anchor indices describe the shared shell, excluding its per-route menu.
    var html = template.replace('<!--SITE_CHROME_CURRENT-->', mount.currentHTML || '');
    function attribute(value) { return String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
    if (mount.brandLabel) html=html.replace(/<a\b[^>]*class="brand"[^>]*>/,function(tag){return tag.replace(/>$/,' aria-label="'+attribute(mount.brandLabel)+'">');});
    if (mount.brandMarkHidden) html=html.replace(/<span\b[^>]*class="brand-mark"[^>]*>/,function(tag){return tag.replace(/>$/,' aria-hidden="'+attribute(mount.brandMarkHidden)+'">');});
    var mainLinkIndex=0;
    html=html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g,function(link){
      var index=mainLinkIndex++,delta=(mount.mainLinks||[]).find(function(item){return item.index===index;});if(!delta)return link;
      if(delta.href!==undefined)link=link.replace(/\bhref="[^"]*"/,function(){return 'href="'+attribute(delta.href)+'"';});
      if(delta.text!==undefined)link=link.replace(/>[\s\S]*<\/a>$/,function(){return '>'+attribute(delta.text)+'</a>';});
      return link;
    });
    html = html.replace(/<li\b[^>]*\bdata-site-chrome-item="([^"]*)"[^>]*>[\s\S]*?<\/li>/g, function (row, route) {
      row = row.replace(/ data-site-chrome-item="[^"]*"/, '');
      if (route !== mount.currentRoute) return row;
      return row.replace(/class="([^"]*)"/, 'class="$1 is-current"').replace(/<a\b/, '<a aria-current="page"');
    });
    var anchorIndex = 0;
    html = html.replace(/<a\b[^>]*>/g, function (tag) {
      var index = anchorIndex++;
      (mount.currentAnchors || []).forEach(function(entry) { if(entry.index===index) tag=tag.replace(/>$/,' aria-current="'+attribute(entry.value)+'">'); });
      (mount.tracking || []).forEach(function (entry) {
        if (entry.index !== index) return;
        Object.keys(entry.attributes).forEach(function (name) {
          if (!/^data-[a-z0-9-]+$/.test(name)) throw new Error('Invalid shared UI tracking attribute');
          var value = String(entry.attributes[name]).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
          tag = tag.replace(/>$/, ' ' + name + '="' + value + '">');
        });
      });
      return tag;
    });
    return html.replace('<!--SITE_CHROME_MENU-->', menu || '')
      .split('__MADO_MENU_ROUTE__').join(mount.menuRoute || config.route || '')
      .split('__MADO_ROOT__').join(config.root || '');
  }
  root.MADO_SITE_CHROME_RENDER = renderComponent;
  if (typeof document === 'undefined') return;
  var node = document.getElementById('mado-shared-ui-config');
  if (!node) return;
  try {
    var config = JSON.parse(node.textContent), payload = root.MADO_SHARED_UI;
    if (!payload || payload.version !== 1 || !Array.isArray(config.mounts) || !/^(?:\.\/)?(?:\.\.\/)*$/.test(config.root || '')) throw new Error('Invalid shared UI configuration');
    var fragments = config.mounts.map(function (mount) {
      var host = document.querySelector('[data-site-chrome-host="' + mount.host + '"]');
      if (!host) throw new Error('Shared UI host is missing: ' + mount.host);
      return { host: host, html: root.MADO_EMBEDDED_WEB && mount.kind !== 'collection' ? '' : renderComponent(payload, config, mount) };
    });
    fragments.forEach(function (fragment) { fragment.host.outerHTML = fragment.html; });
    root.MADO_SHARED_UI_RENDERED = true;
    document.dispatchEvent(new root.Event('mado:shared-ui-ready'));
  } catch (error) {
    root.MADO_SHARED_UI_RENDERED = false;
    if (root.console) root.console.error('[site-chrome] ' + error.message);
  }
}(typeof window !== 'undefined' ? window : globalThis));
