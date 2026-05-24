# Product Redesign v1 Prototype

This prototype does not replace the GitHub Pages Version 0 app.

## Goal

Help a traveler find their actual train quickly, then show:

- Mt. Fuji viewing window
- which side to look at
- minutes until the view
- notification affordance

## Scope

- Direction switch: westbound / eastbound
- Boarding station selector
- Search by station departure time
- Search by train number
- Candidate list sorted by departure time at the selected station
- Result panel with Fuji window, side, and notification placeholders
- Existing timetable data only

## Out of Scope

- Production Web Push
- Backend
- Weather API
- Sunrise/sunset calculation
- More scenic spots
- User photo投稿
- GitHub Pages release

## Product Decisions

- Cover flow is not the main interaction.
- The main path is: direction -> boarding station -> departure time or train number -> select candidate.
- If a train does not stop at the selected boarding station, it is not shown in time search results.
- Time search uses a +/- 20 minute window in this prototype.
