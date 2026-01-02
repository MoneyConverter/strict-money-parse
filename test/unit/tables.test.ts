import { describe, it, expect } from "vitest";
import { buildCurrencyTables } from "../../src/tables";

describe("buildCurrencyTables", () => {
  it("should build default tables", () => {
    const tables = buildCurrencyTables();
    
    expect(tables.iso4217).toBeInstanceOf(Set);
    expect(tables.iso4217.has("USD")).toBe(true);
    expect(tables.iso4217.has("EUR")).toBe(true);
    expect(tables.iso4217.has("UAH")).toBe(true);
    
    expect(tables.uniqueSymbols["€"]).toBe("EUR");
    expect(tables.uniqueSymbols["₴"]).toBe("UAH");
    expect(tables.uniqueSymbols["US$"]).toBe("USD");
    
    expect(tables.ambiguousHints["$"]).toContain("USD");
    expect(tables.ambiguousHints["¥"]).toContain("JPY");
    expect(tables.ambiguousHints["¥"]).toContain("CNY");
    
    expect(tables.ambiguousSymbols.has("$")).toBe(true);
    expect(tables.ambiguousSymbols.has("¥")).toBe(true);
  });

  it("should allow custom unique symbols", () => {
    const tables = buildCurrencyTables({
      uniqueSymbols: {
        "TEST": "TST",
      },
    });
    
    // Should merge with defaults
    expect(tables.uniqueSymbols["€"]).toBe("EUR");
    expect(tables.uniqueSymbols["TEST"]).toBe("TST");
  });

  it("should allow custom ambiguous hints", () => {
    const tables = buildCurrencyTables({
      ambiguousHints: {
        "X": ["XAA", "XBB"],
      },
    });
    
    // Should merge with defaults
    expect(tables.ambiguousHints["$"]).toContain("USD");
    expect(tables.ambiguousHints["X"]).toContain("XAA");
    expect(tables.ambiguousHints["X"]).toContain("XBB");
    
    // AMBIGUOUS_SYMBOLS should be automatically updated
    expect(tables.ambiguousSymbols.has("X")).toBe(true);
  });

  it("should allow custom ISO codes", () => {
    const customIso = new Set(["AAA", "BBB", "CCC"]);
    const tables = buildCurrencyTables({
      iso4217: customIso,
    });
    
    expect(tables.iso4217).toBe(customIso);
    expect(tables.iso4217.has("AAA")).toBe(true);
  });

  it("ambiguousSymbols should always derive from ambiguousHints", () => {
    const tables = buildCurrencyTables({
      ambiguousHints: {
        "NEW": ["XYZ"],
      },
    });
    
    // The derived set should include both defaults and custom
    expect(tables.ambiguousSymbols.has("$")).toBe(true);
    expect(tables.ambiguousSymbols.has("NEW")).toBe(true);
  });

  it("should not have drift between ambiguousHints keys and ambiguousSymbols", () => {
    const tables = buildCurrencyTables();
    
    const hintsKeys = new Set(Object.keys(tables.ambiguousHints));
    
    // All symbols should have hints
    for (const symbol of tables.ambiguousSymbols) {
      expect(hintsKeys.has(symbol)).toBe(true);
    }
    
    // All hints should be in symbols
    for (const key of hintsKeys) {
      expect(tables.ambiguousSymbols.has(key)).toBe(true);
    }
  });
});
