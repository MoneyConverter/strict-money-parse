import { describe, it, expect } from "vitest";
import { parsePriceString } from "../../src/parse";

describe("parsePriceString - basic parsing", () => {
  it("should parse simple integer", () => {
    const result = parsePriceString("1234");
    expect(result.rawAmount).toBe(1234);
    expect(result.status).toBe("UNKNOWN");
  });

  it("should parse number with space thousand separator", () => {
    const result = parsePriceString("1 234,56");
    expect(result.rawAmount).toBe(1234.56);
  });

  it("should parse number with comma thousand and dot decimal", () => {
    const result = parsePriceString("1,234.56");
    expect(result.rawAmount).toBe(1234.56);
  });

  it("should parse number with dot thousand and comma decimal", () => {
    const result = parsePriceString("1.234,56");
    expect(result.rawAmount).toBe(1234.56);
  });

  it("should parse simple decimal with comma", () => {
    const result = parsePriceString("12,50");
    expect(result.rawAmount).toBe(12.5);
  });

  it("should parse simple decimal with dot", () => {
    const result = parsePriceString("12.50");
    expect(result.rawAmount).toBe(12.5);
  });

  it("should treat 12.500 as thousand separator (12500)", () => {
    const result = parsePriceString("12.500", { maxFractionDigits: 2 });
    expect(result.rawAmount).toBe(12500);
  });
});

describe("parsePriceString - currency detection", () => {
  it("should detect UAH with ₴ symbol as CONFIRMED", () => {
    const result = parsePriceString("138.75 ₴");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("UAH");
    expect(result.symbol).toBe("₴");
    expect(result.rawAmount).toBe(138.75);
  });

  it("should detect EUR with € symbol as CONFIRMED", () => {
    const result = parsePriceString("€99.99");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("EUR");
    expect(result.symbol).toBe("€");
    expect(result.rawAmount).toBe(99.99);
  });

  it("should detect USD with US$ as CONFIRMED", () => {
    const result = parsePriceString("US$ 1,299.00");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("USD");
    expect(result.rawAmount).toBe(1299);
  });

  it("should detect IDR with Rp as CONFIRMED", () => {
    const result = parsePriceString("Rp 15.000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("IDR");
    expect(result.symbol).toBe("Rp");
  });

  it("should detect ISO code USD as CONFIRMED", () => {
    const result = parsePriceString("1,299 USD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("USD");
    expect(result.rawAmount).toBe(1299);
  });

  it("should detect $ as AMBIGUOUS", () => {
    const result = parsePriceString("$1,299.00");
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.currency).toBeNull();
    expect(result.symbol).toBe("$");
    expect(result.currencyHints).toContain("USD");
    expect(result.currencyHints).toContain("CAD");
    expect(result.rawAmount).toBe(1299);
  });

  it("should detect kr as AMBIGUOUS", () => {
    const result = parsePriceString("kr 1.299,00");
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.symbol).toBe("kr");
    expect(result.currencyHints).toContain("DKK");
    expect(result.currencyHints).toContain("NOK");
    expect(result.currencyHints).toContain("SEK");
  });

  it("should detect ¥ as AMBIGUOUS", () => {
    const result = parsePriceString("¥1,000");
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.symbol).toBe("¥");
    expect(result.currencyHints).toContain("JPY");
    expect(result.currencyHints).toContain("CNY");
  });
});

describe("parsePriceString - false positive filtering", () => {
  it("should reject phone numbers", () => {
    const result = parsePriceString("+1 234 567 8900");
    expect(result.status).toBe("UNKNOWN");
    expect(result.rawAmount).toBeNull();
  });

  it("should reject dates", () => {
    const result = parsePriceString("2026-01-02");
    expect(result.status).toBe("UNKNOWN");
    expect(result.rawAmount).toBeNull();
  });

  it("should reject years", () => {
    const result = parsePriceString("2026");
    expect(result.status).toBe("UNKNOWN");
    expect(result.rawAmount).toBeNull();
  });

  it("should reject percentages by default", () => {
    const result = parsePriceString("15.5%");
    expect(result.status).toBe("UNKNOWN");
    expect(result.rawAmount).toBeNull();
  });

  it("should allow percentages when ignorePercentages=false", () => {
    const result = parsePriceString("15.5%", { ignorePercentages: false });
    expect(result.rawAmount).toBe(15.5);
  });

  it("should reject ranges", () => {
    const result = parsePriceString("100-200");
    expect(result.status).toBe("UNKNOWN");
    expect(result.rawAmount).toBeNull();
  });

  it("should reject sizes", () => {
    const result = parsePriceString("12x500");
    expect(result.status).toBe("UNKNOWN");
    expect(result.rawAmount).toBeNull();
  });
});

describe("parsePriceString - evidence tracking", () => {
  it("should track matched text", () => {
    const result = parsePriceString("Price: €99.99");
    expect(result.evidence.matchedText).toBe("Price: €99.99");
  });

  it("should track normalized text", () => {
    const result = parsePriceString("  Price:  €99.99  ");
    expect(result.evidence.normalizedText).toBe("Price: €99.99");
  });

  it("should track amount token", () => {
    const result = parsePriceString("€1,234.56");
    expect(result.evidence.amountToken).toContain("1");
  });

  it("should track ISO code when found", () => {
    const result = parsePriceString("100 USD");
    expect(result.evidence.isoCodeFound).toBe("USD");
  });

  it("should track symbol when found", () => {
    const result = parsePriceString("€50");
    expect(result.evidence.symbolFound).toBe("€");
  });
});

describe("parsePriceString - domain-specific fraction digits", () => {
  it("should use 2 fraction digits for price domain (default)", () => {
    const result = parsePriceString("12.500");
    expect(result.rawAmount).toBe(12500); // Treated as thousand separator
  });

  it("should use 4 fraction digits for fx domain", () => {
    const result = parsePriceString("1.2345", { domain: "fx" });
    expect(result.rawAmount).toBe(1.2345);
  });

  it("should use 8 fraction digits for crypto domain", () => {
    const result = parsePriceString("0.12345678", { domain: "crypto" });
    expect(result.rawAmount).toBe(0.12345678);
  });
});
