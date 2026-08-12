(function () {
  "use strict";

  document.querySelectorAll("[data-spot-media-gallery]").forEach(function (gallery) {
    var image = gallery.querySelector("[data-gallery-image]");
    var imageLink = gallery.querySelector("[data-gallery-image-link]");
    var note = gallery.querySelector("[data-gallery-note-output]");
    var credit = gallery.querySelector("[data-gallery-credit-output]");
    var date = gallery.querySelector("[data-gallery-date-output]");
    var source = gallery.querySelector("[data-gallery-source-output]");
    var buttons = Array.from(gallery.querySelectorAll("[data-gallery-thumb]"));
    if (!image || !note || !credit || !date || !buttons.length) return;

    var pageId = document.body.getAttribute("data-spot-page-shared-id") || "";

    function photoIndexFromHash(hash) {
      var value = String(hash || window.location.hash || "");
      var match = value.match(/^#photo-(\d+)$/);
      if (match) return Number(match[1]) - 1;

      match = value.match(/^#spot-([^/]+)(?:\/photo-(\d+))?$/);
      if (!match || match[1] !== pageId) return null;
      return match[2] ? Number(match[2]) - 1 : 0;
    }

    function hashForPhoto(index) {
      var spotHash = pageId ? "#spot-" + pageId : "";
      return index > 0 ? spotHash + "/photo-" + (index + 1) : spotHash;
    }

    function updatePhotoHash(index) {
      var nextHash = hashForPhoto(index);
      if (window.location.hash === nextHash) return;
      var url = new URL(window.location.href);
      url.hash = nextHash;
      window.history.pushState({ photoIndex: index }, "", url);
    }

    function selectPhoto(button, index, options) {
      var src = button.getAttribute("data-gallery-src");
      if (!src) return;
      options = options || {};

      image.src = src;
      image.alt = button.getAttribute("data-gallery-alt") || "";
      var sourceHref = button.getAttribute("data-gallery-credit-href") || "";
      if (imageLink) {
        if (sourceHref) {
          imageLink.href = sourceHref;
          imageLink.target = "_blank";
          imageLink.rel = "noopener noreferrer";
          imageLink.removeAttribute("aria-hidden");
          imageLink.removeAttribute("tabindex");
        } else {
          imageLink.removeAttribute("href");
          imageLink.removeAttribute("target");
          imageLink.removeAttribute("rel");
          imageLink.setAttribute("aria-hidden", "true");
          imageLink.tabIndex = -1;
        }
      }
      note.textContent = button.getAttribute("data-gallery-note") || "";
      date.textContent = button.getAttribute("data-gallery-date") || "";

      var creditText = button.getAttribute("data-gallery-credit") || "";
      credit.replaceChildren();
      if (sourceHref) {
        var link = document.createElement("a");
        link.href = sourceHref;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = creditText;
        credit.appendChild(link);
      } else {
        credit.textContent = creditText;
      }
      if (source) {
        if (sourceHref) {
          source.hidden = false;
          source.href = sourceHref;
          source.textContent = document.documentElement.lang.toLowerCase().indexOf("en") === 0 ? "View original post" : "元の投稿を見る";
          source.target = "_blank";
          source.rel = "noopener noreferrer";
        } else {
          source.hidden = true;
          source.removeAttribute("href");
          source.textContent = "";
        }
      }

      buttons.forEach(function (candidate) {
        var isActive = candidate === button;
        candidate.classList.toggle("active", isActive);
        candidate.setAttribute("aria-pressed", String(isActive));
      });
      if (options.updateUrl !== false) updatePhotoHash(index);

      if (options.trackSelection !== false && typeof window.gtag === "function") {
        window.gtag("event", "spot_photo_selected", {
          spot_id: pageId,
          photo_index: index,
          source: "spot_page_hero"
        });
      }
    }

    buttons.forEach(function (button, index) {
      button.addEventListener("click", function () {
        selectPhoto(button, index);
      });
    });

    var initialIndex = photoIndexFromHash();
    if (Number.isInteger(initialIndex) && initialIndex >= 0 && initialIndex < buttons.length) {
      selectPhoto(buttons[initialIndex], initialIndex, { updateUrl: false, trackSelection: false });
    }

    function syncPhotoFromHash() {
      var index = photoIndexFromHash();
      if (index === null && !window.location.hash) index = 0;
      if (!Number.isInteger(index) || index < 0 || index >= buttons.length) return;
      selectPhoto(buttons[index], index, { updateUrl: false, trackSelection: false });
    }

    window.addEventListener("hashchange", syncPhotoFromHash);
    window.addEventListener("popstate", syncPhotoFromHash);
  });
})();
