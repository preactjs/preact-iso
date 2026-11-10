---
"preact-iso": patch
---

Keep the previous route until the incoming route stops suspending, including routes that suspend more than once (e.g. `lazy()` code, then data). `onLoadEnd`, `onRouteChange` and the scroll to top now wait for it too.
