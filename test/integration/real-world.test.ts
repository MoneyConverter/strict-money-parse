import { describe, it, expect } from "vitest";
import {
  parsePriceString,
  parsePriceCandidates,
  buildCurrencyTables,
} from "../../src/index";

describe("Integration - Real-world examples", () => {
  it("should parse Ukrainian price correctly", () => {
    const result = parsePriceString("Ціна: 138,75 ₴");
    
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("UAH");
    expect(result.rawAmount).toBe(138.75);
    expect(result.symbol).toBe("₴");
  });

  it("should handle e-commerce product page", () => {
    const html = `
      <div class="product">
        <h1>Product Name</h1>
        <span class="price">€49.99</span>
        <span class="shipping">Shipping: €5.00</span>
      </div>
    `;
    
    const candidates = parsePriceCandidates(html);
    
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].status).toBe("CONFIRMED");
    expect(candidates[0].currency).toBe("EUR");
    expect(candidates.some((c) => c.rawAmount === 49.99)).toBe(true);
    expect(candidates.some((c) => c.rawAmount === 5)).toBe(true);
  });

  it("should handle mixed currency page", () => {
    const text = "US price: $99.99, EU price: €89.99, UK price: £79.99";
    const candidates = parsePriceCandidates(text);
    
    // Should find prices
    expect(candidates.length).toBeGreaterThan(0);
    
    // Should have confirmed currencies for EUR
    expect(candidates.some((c) => c.currency === "EUR")).toBe(true);
    
    // Should detect ambiguous $ symbol
    expect(candidates.some((c) => c.status === "AMBIGUOUS" && c.symbol === "$")).toBe(true);
  });

  it("should handle forex rates", () => {
    const text = "EUR/USD: 1.0856";
    const result = parsePriceString(text, { domain: "fx" });
    
    expect(result.rawAmount).toBe(1.0856);
  });

  it("should handle crypto prices", () => {
    const text = "BTC: $42,150.75";
    const result = parsePriceString(text);
    
    expect(result.rawAmount).toBe(42150.75);
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.symbol).toBe("$");
  });

  it("should reject most false positives in real text", () => {
    const text = `
      Call us at +1 (555) 123-4567
      Posted on 2026-01-02
      Success rate: 95.5%
      Discount: 10-20% off
      Size: 10x20cm
    `;
    
    const candidates = parsePriceCandidates(text);
    
    // Should not detect phone numbers
    const hasPhone = candidates.some((c) => c.rawAmount && c.rawAmount > 1000000);
    expect(hasPhone).toBe(false);
    
    // All detected numbers should be reasonably small (not dates/phone numbers)
    for (const candidate of candidates) {
      expect(candidate.rawAmount).toBeLessThan(10000);
    }
  });

  it("should handle ambiguous dollars with hints", () => {
    const result = parsePriceString("$1,299.00");
    
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.currency).toBeNull();
    expect(result.rawAmount).toBe(1299);
    expect(result.currencyHints).toContain("USD");
    expect(result.currencyHints).toContain("CAD");
    expect(result.currencyHints).toContain("AUD");
  });

  it("should provide evidence trail", () => {
    const input = "  Total:  €1,234.56  ";
    const result = parsePriceString(input);
    
    expect(result.evidence.matchedText).toBe(input);
    expect(result.evidence.normalizedText).toBe("Total: €1,234.56");
    expect(result.evidence.amountToken).toBeTruthy();
    expect(result.evidence.symbolFound).toBe("€");
  });

  it("should allow custom currency tables", () => {
    const tables = buildCurrencyTables({
      uniqueSymbols: {
        "₿": "BTC",
      },
    });
    
    const result = parsePriceString("Price: ₿0.00123456", {
      tables,
      domain: "crypto",
    });
    
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BTC");
    expect(result.rawAmount).toBe(0.00123456);
  });

  it("should handle European number format", () => {
    const result = parsePriceString("1.234.567,89 €");
    
    expect(result.rawAmount).toBe(1234567.89);
    expect(result.currency).toBe("EUR");
  });

  it("should handle space-separated thousands", () => {
    const result = parsePriceString("1 234 567,89 ₽");
    
    expect(result.rawAmount).toBe(1234567.89);
    expect(result.currency).toBe("RUB");
  });

  it("should prioritize longer symbols", () => {
    const result = parsePriceString("US$ 100");
    
    // Should match "US$" not just "$"
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("USD");
  });
});

describe("Integration - Edge cases", () => {
  it("should handle very large numbers", () => {
    const result = parsePriceString("€9,999,999.99");
    expect(result.rawAmount).toBe(9999999.99);
  });

  it("should handle very small decimals", () => {
    const result = parsePriceString("₿0.00000001", { domain: "crypto" });
    expect(result.rawAmount).toBe(0.00000001);
  });

  it("should handle number at start", () => {
    const result = parsePriceString("1234 USD");
    expect(result.rawAmount).toBe(1234);
    expect(result.currency).toBe("USD");
  });

  it("should handle number at end", () => {
    const result = parsePriceString("EUR 1234");
    expect(result.rawAmount).toBe(1234);
    expect(result.currency).toBe("EUR");
  });

  it("should handle symbol before", () => {
    const result = parsePriceString("€1234");
    expect(result.rawAmount).toBe(1234);
    expect(result.currency).toBe("EUR");
  });

  it("should handle symbol after", () => {
    const result = parsePriceString("1234₴");
    expect(result.rawAmount).toBe(1234);
    expect(result.currency).toBe("UAH");
  });

  it("should handle symbol with space", () => {
    const result = parsePriceString("US $ 100");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("USD");
  });
});
