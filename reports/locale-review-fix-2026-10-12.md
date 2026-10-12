# Locale review corrections

Separate follow-up to the 25-page locale baseline `0ff60333`.

The German, Spanish, simplified Chinese and Korean guide descriptions promised a date selector that the train UI does not provide. The hand-authored description, Open Graph, Twitter and JSON-LD copies now consistently describe selecting direction, boarding station and departure time, with timetable estimates.

Simplified Chinese time prose now uses 出发后. The same correction is applied to all occurrences in the three simplified dictionaries (castle73, utility60, sparkling56 entries) to keep overlapping translations consistent, while preserving original proper names, quotations and source credits. Generated simplified HTML and payloads are rebuilt from those dictionaries. No shared train, seat, geography, clock or narration data changes.

Validation: build, all edition language validators, calculator/forecast parity, metadata consistency, live sitemap, content manifest and whitespace checks. The independent review's cultural stories are handled in a subsequent separate commit.
