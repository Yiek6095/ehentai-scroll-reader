# Changelog

## 2.0.15

- Align toolbar controls into responsive rows for split-screen windows.
- Add width minus/plus buttons in 10 px steps, with saved preferences and boundary handling.
- Keep both loading modes unchanged.
- Verify English/Chinese layouts from 390 to 1920 px and reading-position restoration.

## 2.0.14

- Keep two modes: **Load 10 pages at a time** (default) and **Load all pages**.
- Remove page-by-page loading from the UI and loading logic.
- Fall back to 10-page mode if an older saved mode is no longer supported.
- Update English and Chinese descriptions.
- Include MIT license attributed to KenLim0912 and publication documentation.
- Retain the underlying v2.0.9 loading behavior; experimental B/C/D optimizations are not included.

## 2.0.13

- Move 10-page loading to the first option and make it the default.

## 2.0.9 baseline

- Save settings-panel mode and language together when applying.
- Cancel or close discards unapplied settings; toolbar language selection remains immediate.

This log summarizes the releases relevant to this package, not every historical build.
