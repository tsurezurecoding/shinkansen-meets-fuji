import { englishSnapshot, textNodes, TRANSLATABLE_ATTRIBUTES } from './castle-localization.mjs';
export const SPARKLING_ROUTE = 'sparkling-dreams.html';
export { translated as SPARKLING_LOCALES } from './locales.mjs';
export const SPARKLING_EXTRA = [
 'Enable JavaScript to use the calculator. The A/B/C patterns and official links below are still available without it.',
 'Pattern {0}', 'E-seat side', 'A-seat side', 'Westbound (Tokyo → Shin-Osaka)', 'Eastbound (Shin-Osaka → Tokyo)',
 '<h3>That date is outside the operating period</h3><p>{0} is outside the published operating period, June 19, 2026 to March 15, 2027. Please check official information for the latest dates.</p>',
 '<h3>The pattern for this date is not confirmed</h3><p>The operating pattern for {0} has not been published yet. Please check the official schedule when it is available.</p>',
 '<h3>Please choose a date and train</h3><p>Check your date and direction, then try again.</p>',
 '<h3>Your selected train is the special train</h3><p>{0} is part of {1} on {2}. It is the Sparkling Dreams Shinkansen itself, so there is no passing encounter to estimate.</p>',
 '<h3>No likely passing encounter was found</h3><p>{0} and the opposite-direction special train in {1} do not appear to cross within the calculated route. Please still check official information, as the plan can change.</p>',
 '<li><strong>Around {0}</strong><span>{1} between {2} and {3}</span></li>',
 '<h3>Likely passing estimate</h3><p class="sd-result-lead">Your {0} {1} may pass the special train at the following time and place on {2} ({3}).</p><ul class="sd-result-list">{4}</ul><p class="sd-seat-note"><strong>Watch from the {5}</strong> and start looking out about ±5 minutes early. Station stops, delays, speed, and operating changes can shift the actual moment.</p>',
];
export const SPARKLING_ATTRS = [...TRANSLATABLE_ATTRIBUTES, 'data-placeholder', 'placeholder'];
export const SPARKLING_EXCLUDE = '.brand-mark,iframe,blockquote,.sd-post-credit,figcaption,.show-credit,.lang-switch,.guide-lang-menu';
export function sparklingSnapshot(root) { return englishSnapshot(root, SPARKLING_ROUTE); }
export function collectSparklingEnglish(root) {
 const dom = sparklingSnapshot(root), doc = dom.window.document;
 const keys = new Set(SPARKLING_EXTRA);
 const add = value => { if (typeof value === 'string' && value.trim() && /[A-Za-z]/.test(value) && !/^(?:https?:|mailto:|@)/.test(value.trim())) keys.add(value.trim()); };
 for (const node of textNodes(doc)) if (!node.parentElement.closest(SPARKLING_EXCLUDE)) add(node.textContent);
 for (const el of doc.querySelectorAll('*')) if (!el.closest(SPARKLING_EXCLUDE)) for (const attr of SPARKLING_ATTRS) add(el.getAttribute(attr));
 add(doc.title);
 for (const el of doc.querySelectorAll('meta')) if (/(?:description|title|image:alt)$/.test(el.name || el.getAttribute('property') || '')) add(el.content);
 const result = [...keys].sort(); dom.window.close(); return result;
}
