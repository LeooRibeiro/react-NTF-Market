# Lighthouse - median results

Generated: 2026-10-27T19:17:41.7802541-03:00
Lighthouse 13.6.0; Node v24.22.0; npm 11.19.1; Edge 156.0.4314.42.
Environment: Microsoft Windows 11 Pro, AMD Ryzen 5 4600G with Radeon Graphics. Production build served at http://127.0.0.1:4173, default mock scenario, simulated Lighthouse throttling.

| Page | Profile | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | mobile | 96 | 100 | 96 | 100 | 804.5 | 0 | 218.6 |
| home | desktop | 100 | 100 | 96 | 100 | 261.7 | 0 | 5.5 |
| detail | mobile | 90 | 100 | 96 | 100 | 3502 | 0 | 95 |
| detail | desktop | 99 | 100 | 96 | 100 | 850.7 | 0 | 0 |

Individual runs and HTML/JSON artifacts are in this directory. Targets: Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO >= 90.

## Findings

- Home mobile CLS fell from 0.325 to 0 after reserving the hero image aspect ratio; its median Performance is now 96.
- NFT detail mobile meets the Performance target at 90, with median LCP of 3502 ms. Lighthouse says the main artwork is not discoverable in the initial HTML because NFT data is fetched before the route renders. Avoid a global preload without measuring its cost on the home route.
- Lighthouse reports 134 KiB of unused JavaScript on detail. Route-level splitting or separating the browser mock worker is a follow-up if mobile performance regresses below target.
