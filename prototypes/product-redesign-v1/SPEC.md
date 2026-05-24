# Product Redesign v1 Prototype

This prototype does not replace the GitHub Pages Version 0 app.

## Goal

Help a traveler find their actual train quickly, then show:

- Mt. Fuji viewing window
- which side to look at
- minutes until the view
- route timeline with scenic spots

## Scope

- Direction switch: westbound / eastbound
- Boarding station selector
- Search by station departure time as the primary path
- Search by train number as a separate secondary path
- Candidate list sorted by departure time at the selected station
- Result panel with Fuji window, side, boarding station, and route timeline
- Scenic spot rows with side information and inline detail expansion
- Approximate view windows for non-Fuji scenic spots
- Lightweight weather/visibility comment from a no-key weather API when available
- Existing timetable data only

## Out of Scope

- Production Web Push
- Backend
- Full weather reliability guarantees
- Sunrise/sunset calculation beyond a simple night-time guard
- More scenic spots
- User photo投稿
- GitHub Pages release

## Product Decisions

- Cover flow is not the main interaction.
- The main path is: direction -> boarding station -> departure time or train number -> select candidate.
- Time search and train-number search should not share one ambiguous button area.
- If a train does not stop at the selected boarding station, it is not shown in time search results.
- Time search uses a +/- 20 minute window in this prototype.
