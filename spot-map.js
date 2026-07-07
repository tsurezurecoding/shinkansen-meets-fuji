/* Spot detail map mode switcher */
(function () {
  "use strict";

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-mini-map-mode]");
    if (!button) return;
    var wrapper = button.closest(".spot-static-map");
    var frame = wrapper && wrapper.querySelector(".spot-google-map-frame");
    var src = button.getAttribute("data-map-src");
    if (!frame || !src) return;
    if (frame.getAttribute("src") !== src) frame.setAttribute("src", src);
    wrapper.querySelectorAll("[data-mini-map-mode]").forEach(function (item) {
      var active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", active ? "true" : "false");
    });
  });
})();
