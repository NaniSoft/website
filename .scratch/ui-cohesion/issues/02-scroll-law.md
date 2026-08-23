# 02 — Scroll law

Type: grilling
Status: resolved
Blocked by: —

## Question
How strict is "no left-to-right movement"?

## Answer
The PAGE never scrolls horizontally on either app, 320–1920px, landscape
included. Sole exception granted: direct-touch panning inside the hero flow
if it cannot fit after scaling (same story on every device). Later narrowed
during Task 4 design: the new hero restacks vertically on narrow screens, so
no pan remains anywhere. DoD: automated scrollWidth check at the full
viewport matrix. Confirmed 2026-08-23.
