You are implementing the core of the npm package `strict-money-parse`.

## Goal
Implement `parsePriceString(input, opts?) -> ParseResult` with strict evidence rules.

## Constraints
- TypeScript 5.7+
- Node 18+
- ZERO runtime dependencies
- Deterministic behavior (no randomness)
- Must compile and pass tests

## Required Files
- `src/types.ts`
- `src/parse.ts` (or equivalent) exporting `parsePriceString`
- `src/index.ts` exporting public API

## Parsing Rules
1) Normalize:
- trim
- replace NBSP/thin-space with space
- replace apostrophes with space
- collapse whitespace

2) Extract one numeric token from input:
Support:
- 1234
- 1 234
- 1,234
- 1.234
- 1 234,56
- 1,234.56
- 12,50
- 12.50

3) Determine decimal separator:
- if both '.' and ',' exist => last one is decimal separator
- else => treat as decimal only if digits after <= maxFractionDigits else thousand sep

Default maxFractionDigits:
- price: 2
- fx: 4
- crypto: 8

4) False-positive filters:
Return UNKNOWN (rawAmount null) for:
- phone numbers
- dates
- years-only (19xx/20xx)
- percentages (if ignorePercentages default true)
- ranges (100-200, 1,299–1,499)
- sizes (12x500)

5) Currency evidence (near amount, window default 6 chars):
- ISO code near amount (and present in tables.iso4217) => CONFIRMED
- unique symbol/token near amount => CONFIRMED
- ambiguous symbol near amount => AMBIGUOUS + currencyHints
- else UNKNOWN

## Output Requirements
- Provide full code for the required files.
- Add any helper functions inside the same module unless they are reused.
- Keep code small and readable.

## Deliverable
Return a patch-style response: list each file path and its full contents.
