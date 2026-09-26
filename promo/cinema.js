/* Optional CINEMA presentation. The shared PV.render is still the only
 * renderer of scenes, photographs, captured product UI and text reveals. */
(function () {
  'use strict';
  const stage = document.getElementById('stage');
  if (!stage) return;
  const decor = document.createElement('div');
  decor.id = 'cinemaDecor';
  decor.setAttribute('aria-hidden', 'true');
  decor.innerHTML = '<div id="cinemaOpeningShade"></div>' +
    '<div id="cinemaOpeningRule"></div>' +
    '<div id="cinemaSideRail"><div id="cinemaRailDot"></div></div>' +
    '<div id="cinemaPayoffRule"></div>' +
    '<div id="cinemaEndArt"><svg viewBox="0 0 510 720" aria-hidden="true">' +
    '<path id="cinemaEndRoute" pathLength="1" d="M64 578H184Q216 578 238 552L350 418Q380 380 446 380"/>' +
    '<circle cx="64" cy="578" r="7"/><circle cx="446" cy="380" r="7"/>' +
    '</svg></div>';
  stage.insertBefore(decor, document.getElementById('s1eb'));
  const get = (id) => document.getElementById(id);
  const openingShade = get('cinemaOpeningShade');
  const openingRule = get('cinemaOpeningRule');
  const sideRail = get('cinemaSideRail');
  const railDot = get('cinemaRailDot');
  const payoffRule = get('cinemaPayoffRule');
  const endArt = get('cinemaEndArt');
  const endRoute = get('cinemaEndRoute');
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const progress = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (x) => window.PV ? PV.ease.reveal(x) : 1 - Math.pow(1 - x, 3);
  const fade = (t, a, b, c, d) => Math.min(progress(t, a, b), 1 - progress(t, c, d));
  const opacity = (el, value) => { el.style.opacity = String(value); };

  function render(t) {
    t = Math.max(0, Math.min(43, Number(t) || 0));
    opacity(openingShade, fade(t, 1.4, 2.15, 4.7, 5.2));
    opacity(openingRule, fade(t, .3, .8, 4.7, 5));
    openingRule.style.transform = 'scaleX(' + ease(progress(t, .3, 1.1)) + ')';

    const railVisibility = Math.max(
      fade(t, 5.5, 6.3, 9.7, 10),
      fade(t, 10.6, 11.1, 23.2, 23.5),
      fade(t, 33, 33.6, 36.2, 36.5)
    );
    opacity(sideRail, railVisibility);
    railDot.style.transform = 'translateY(' + (682 * progress(t, 5, 36.5)) + 'px)';
    stage.dataset.cinemaPaper = String((t >= 10 && t < 16) || (t >= 32.5 && t < 36.5));

    opacity(payoffRule, fade(t, 24, 24.7, 27.6, 28));
    payoffRule.style.transform = 'scaleX(' + ease(progress(t, 24, 25)) + ')';

    const finalProgress = ease(progress(t, 36.5, 37.5));
    const from = [246, 242, 233], to = [8, 21, 33];
    stage.dataset.cinemaFinale = String(t >= 36.5);
    stage.style.setProperty('--cinema-final-bg', 'rgb(' + from.map((v, i) =>
      Math.round(v + (to[i] - v) * finalProgress)).join(',') + ')');
    const artProgress = ease(progress(t, 37.15, 38.25));
    opacity(endArt, artProgress);
    endArt.style.transform = 'translateY(' + ((1 - artProgress) * 24) + 'px)';
    endRoute.style.strokeDasharray = '1';
    endRoute.style.strokeDashoffset = String(1 - ease(progress(t, 38, 39.6)));
  }
  window.PV_CINEMA = Object.freeze({ render });
  render(0);
})();
