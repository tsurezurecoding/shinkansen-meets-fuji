(function () {
  "use strict";

  document.querySelectorAll("[data-spot-media-gallery]").forEach(function (gallery) {
    var image = gallery.querySelector("[data-gallery-image]");
    var note = gallery.querySelector("[data-gallery-note-output]");
    var credit = gallery.querySelector("[data-gallery-credit-output]");
    var date = gallery.querySelector("[data-gallery-date-output]");
    var buttons = Array.from(gallery.querySelectorAll("[data-gallery-thumb]"));
    if (!image || !note || !credit || !date || !buttons.length) return;

    function selectPhoto(button, index) {
      var src = button.getAttribute("data-gallery-src");
      if (!src) return;

      image.src = src;
      image.alt = button.getAttribute("data-gallery-alt") || "";
      note.textContent = button.getAttribute("data-gallery-note") || "";
      date.textContent = button.getAttribute("data-gallery-date") || "";

      var creditText = button.getAttribute("data-gallery-credit") || "";
      var creditHref = button.getAttribute("data-gallery-credit-href") || "";
      credit.replaceChildren();
      if (creditHref) {
        var link = document.createElement("a");
        link.href = creditHref;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = creditText;
        credit.appendChild(link);
      } else {
        credit.textContent = creditText;
      }

      buttons.forEach(function (candidate) {
        var isActive = candidate === button;
        candidate.classList.toggle("active", isActive);
        candidate.setAttribute("aria-pressed", String(isActive));
      });

      if (typeof window.gtag === "function") {
        window.gtag("event", "spot_photo_selected", {
          spot_id: document.body.getAttribute("data-spot-page-shared-id") || "",
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
  });
})();
