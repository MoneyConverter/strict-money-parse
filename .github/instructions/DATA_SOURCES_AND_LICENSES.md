# Data Sources & Licensing Rules

## ISO 4217 snapshot
- Source: SIX Financial Information (ISO 4217 maintenance agency / registration authority)
- We fetch the official “List One” XML and extract `<Ccy>` entries.
- File: `src/data/iso4217.json` is GENERATED and must not be edited manually.

Update:
- Run `npm run update-iso4217`
- Commit the updated JSON

## Currency symbols
- v1 ships a curated symbol table designed to minimize false positives.
- Do not import symbol datasets from unknown licenses.
- If adding data from Unicode CLDR, keep its license notice in THIRD_PARTY_NOTICES.md.

## Forbidden licenses
- Absolutely forbidden anywhere in the dependency tree:
  - GPL, AGPL, LGPL (any version)
- Allowed:
  - MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, Unicode-3.0

CI must fail on forbidden licenses.

## No copy/paste from GPL projects
Implementation must be original.
Algorithms described in documentation are fine; direct code copying is not.
