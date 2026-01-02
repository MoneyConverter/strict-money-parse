# Project Instructions (strict-money-parse)

This repository ships a strict money/price parser for strings (DOM text). The core goals are:
- Deterministic parsing (no heuristics that behave differently across environments)
- Zero runtime dependencies
- No GPL/AGPL/LGPL in the dependency graph (dev-only deps must be permissive too)
- ISO 4217 codes are generated from an official source (SIX List One), not hand-edited

## Principles
1. **Strict evidence model**
   - `CONFIRMED` only if we can prove currency via:
     - an ISO code near the amount AND present in ISO 4217 snapshot, OR
     - a unique currency symbol/token near the amount
   - `AMBIGUOUS` only if an ambiguous symbol is detected and we provide `currencyHints`
   - `UNKNOWN` otherwise

2. **No silent guessing**
   - Bare `$`, `¥`, `£`, `kr` are never `CONFIRMED` by themselves.
   - If ambiguous, return hints and let the caller decide.

3. **Simple + safe heuristics**
   - Prefer “cheap” false-positive filters (phone/date/percent/year/range/size).
   - Avoid noisy letter tokens unless they are practically unambiguous.

4. **Generated ISO snapshot**
   - `src/data/iso4217.json` is GENERATED. Do not edit manually.
   - Update it via `npm run update-iso4217`.

## Repo Commands
- `npm test` — run unit/integration tests
- `npm run test:coverage` — coverage
- `npm run lint` — lint
- `npm run build` — build (ESM+CJS) + types
- `npm run update-iso4217` — fetch and regenerate ISO snapshot
- `npm run check-licenses` — fail if forbidden licenses are present

## What belongs where
- `src/parse.ts` — public parsing logic (`parsePriceString`, `parsePriceCandidates`)
- `src/tables.ts` — table builder (`buildCurrencyTables`)
- `src/tables/currency-data.ts` — symbol and ambiguity data (v1)
- `scripts/update-iso4217.ts` — fetch ISO snapshot from SIX
- `test/` — tests and datasets

## Non-goals (v1)
- Full locale-aware formatting support for every edge case
- Currency inference from country/language
- Heavy scoring/ML ranking

Keep v1 small and reliable.
