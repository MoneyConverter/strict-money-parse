Implement ISO 4217 snapshot generation.

## Requirements
- Create `scripts/update-iso4217.ts`:
  - Fetch SIX List One XML from an official URL
  - Extract all <Ccy>AAA</Ccy> values
  - Deduplicate, sort, write to `src/data/iso4217.json`
  - No external libraries (use node:https, node:fs, node:path)
  - Add a fallback URL list (2 entries) if the first fails
  - Set a reasonable User-Agent header

## Add npm script
- `update-iso4217`: uses `tsx scripts/update-iso4217.ts`

## Deliverable
Provide the full file + package.json script diff (full snippet is fine).
