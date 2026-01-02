Implement currency tables with strict rules.

## Requirements
Create:
- `src/tables/currency-data.ts` exporting:
  - UNIQUE_SYMBOLS: Record<string, string>
  - AMBIGUOUS_HINTS: Record<string, string[]> (ONLY keys with 2+ currencies)
  - AMBIGUOUS_SYMBOLS: Set<string> derived from keys of AMBIGUOUS_HINTS
- `src/tables.ts` exporting:
  - buildCurrencyTables(custom?: Partial<CurrencyTables>): CurrencyTables

## Rules
- Anything unambiguous goes to UNIQUE_SYMBOLS (e.g., Rp, RM, HK$, NT$, R$, €, ₹, ₽).
- Ambiguous hints must contain only real ambiguity (2+ possible ISO codes).
- ambiguousSymbols must NOT be hand-maintained; derive from ambiguousHints keys.
- Prefer longer symbol matching first.

## Deliverable
Return the full contents of:
- `src/tables/currency-data.ts`
- `src/tables.ts`
- Any necessary updates to `src/parse.ts` to use these tables
- Add unit tests for symbol classification
