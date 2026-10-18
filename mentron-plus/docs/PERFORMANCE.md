# Performance status

No physical-device performance measurements have been collected. The target remains build/raster <8ms, jank <1%, and cold start <2 seconds on a named mid-range Android device. These are targets, not results.

Foundation measures: lazy Flutter tabs, inactive ticker suppression, shared skeleton animation, animation builders with stable children, sliver collections, local fonts and vector artwork. A profile-screen performance-overlay switch is included for future device measurements.

The Phase 1 web production bundle is approximately 254 KB JavaScript (79 KB gzip), excluding locally bundled fonts. Flutter web compilation succeeds. Neither build output nor widget tests establish runtime frame performance.

Phase 6 must record device/OS, build mode, cold-start timing, frame percentiles, jank percentage and memory before/after five minutes of navigation. Compare the original applications on the same device. Browser and native results must be reported separately.
