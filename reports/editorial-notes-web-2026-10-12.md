# Locale-specific window stories

Seven approved themes produce nine locale/spot pairs and eleven placements: German Himeji/Neuschwanstein; simplified and traditional Chinese Toji/Tang Chang'an; German Fuji/Berlin blue; French Fuji/Rivière; Korean Pocari/Fukuroi; German Fujitec/Reichstag; simplified and traditional Chinese Fujitec/Wangjing SOHO.

Source records and checked dates are in `scripts/locales/editorial-notes.json`, separate from source translation dictionaries. Fact paragraphs require primary-source attribution; the conditional Korean familiarity paragraph is explicitly classified as an inference. Existing photos, credits, common calculations and audio stay intact. The static article generator and utility payload generator preserve these explicit additions on rebuild. Unknown editions/spots cannot receive notes.

Independent reviews checked German and Korean copy and all 405 edition/spot isolation combinations. Feedback corrected pigment terminology, the distinction between Big Wing's tower and the whole site, and the Korean company spelling. Historic lift counts remain attributed to the 1999 corporate specification, and Toji exhibition dates remain undetermined. No Korea ranking or export-source assertion is included.

Browser QA used a localhost HTML wrapper that sets analytics opt-out before product scripts and blocks external connections; product files themselves were not altered for QA. All eleven placements at 320, 390 and 1440 px (33 views) displayed the correct edition, citations and date with no document or note horizontal overflow. Modal styling was visibly checked, including Korean word wrapping. Four editorial generator tests passed after synchronized regeneration.

Parity and metadata review fixes are separate earlier commits (`0ff60333`, `30d03696`). PR96/main integration and the final complete verification are recorded in the release report. Cultural drinks/foods/beer expansion, independent translations of every spot article, Arabic expansion, new audio and Android publication remain outside this batch.
