// Currency tables builder

import type { CurrencyTables } from "./types";
import ISO from "./data/iso4217.json";
import {
  UNIQUE_SYMBOLS,
  AMBIGUOUS_HINTS,
  AMBIGUOUS_SYMBOLS,
} from "./tables/currency-data";

export function buildCurrencyTables(
  custom?: Partial<CurrencyTables>
): CurrencyTables {
  const base: CurrencyTables = {
    iso4217: new Set(ISO),
    uniqueSymbols: { ...UNIQUE_SYMBOLS },
    ambiguousHints: { ...AMBIGUOUS_HINTS },
    ambiguousSymbols: new Set(AMBIGUOUS_SYMBOLS),
  };

  // Safe merge
  if (!custom) return base;

  return {
    iso4217: custom.iso4217 ?? base.iso4217,
    uniqueSymbols: { ...base.uniqueSymbols, ...(custom.uniqueSymbols ?? {}) },
    ambiguousHints: { ...base.ambiguousHints, ...(custom.ambiguousHints ?? {}) },
    ambiguousSymbols: new Set(
      Object.keys({
        ...base.ambiguousHints,
        ...(custom.ambiguousHints ?? {}),
      })
    ),
  };
}
