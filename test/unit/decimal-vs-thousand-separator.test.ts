import { describe, expect, test } from "vitest";
import { parsePriceString } from "../../src";

/**
 * Tests for distinguishing decimal separator from thousands separator
 * 
 * DETECTION ALGORITHM:
 * 
 * 1️⃣ If BOTH dot AND comma are present:
 *    → Last symbol = decimal separator
 *    → First symbol = thousands separator
 *    Examples:
 *    • "1,234.56" → 1234.56 (comma - thousands, dot - decimal)
 *    • "1.234,56" → 1234.56 (dot - thousands, comma - decimal)
 * 
 * 2️⃣ If only one separator (, or .):
 *    Look at the number of digits AFTER the separator:
 *    
 *    a) If digits ≤ maxFractionDigits (default 3) AND > 0:
 *       → This is a DECIMAL separator
 *       Examples:
 *       • "1,99" → 1.99 (2 digits after comma)
 *       • "45,5" → 45.5 (1 digit after comma)
 *       • "89.90" → 89.90 (2 digits after dot)
 *    
 *    b) If exactly 3 digits:
 *       ⚠️ IMPORTANT: Although 3 ≤ maxFractionDigits, the parser treats this as THOUSANDS!
 *       → This is a THOUSANDS separator (not decimal)
 *       Examples:
 *       • "1,999" → 1999 (not 1.999!)
 *       • "12.500" → 12500 (not 12.5!)
 *       • "123,456" → 123456 (not 123.456!)
 *    
 *    c) If digits > 3 or = 0:
 *       → This is a THOUSANDS separator
 *       Examples:
 *       • "1,9999" → 19999
 *       • "12,000" → 12000
 * 
 * 3️⃣ Space ALWAYS = thousands separator:
 *    • "2 499" → 2499
 *    • "1 234 567" → 1234567
 *    • "1 234,56" → 1234.56 (space - thousands, comma - decimal)
 * 
 * CONCLUSIONS:
 * ✅ 1-2 digits after separator → decimal
 * ⚠️ Exactly 3 digits → thousands separator!
 * ✅ Both separators present → last one = decimal
 * ✅ Space → always thousands
 */
describe("Decimal vs Thousand Separator Detection", () => {
  describe("Comma as decimal separator (≤2 digits after)", () => {
    test("1,99 → 1.99 (two digits after comma)", () => {
      const result = parsePriceString("€1,99");
      expect(result.rawAmount).toBe(1.99);
    });

    test("89,90 → 89.90 (two digits after comma)", () => {
      const result = parsePriceString("89,90 zł");
      expect(result.rawAmount).toBe(89.9);
    });

    test("45,5 → 45.5 (one digit after comma)", () => {
      const result = parsePriceString("€45,5");
      expect(result.rawAmount).toBe(45.5);
    });
  });

  describe("Comma as thousands separator (exactly 3 digits = thousands!)", () => {
    test("123,456 → 123456 (exactly 3 digits after = thousands, not decimal!)", () => {
      const result = parsePriceString("€123,456");
      expect(result.rawAmount).toBe(123456);
    });

    test("1,999 → 1999 (exactly 3 digits after = thousands)", () => {
      const result = parsePriceString("€1,999");
      expect(result.rawAmount).toBe(1999);
    });

    test("12,999 → 12999 (exactly 3 digits after = thousands)", () => {
      const result = parsePriceString("€12,999");
      expect(result.rawAmount).toBe(12999);
    });
  });

  describe("Dot as decimal separator", () => {
    test("1.99 → 1.99 (two digits after dot)", () => {
      const result = parsePriceString("$1.99");
      expect(result.rawAmount).toBe(1.99);
    });

    test("45.50 → 45.50", () => {
      const result = parsePriceString("$45.50");
      expect(result.rawAmount).toBe(45.5);
    });
  });

  describe("Dot as thousands separator (European format)", () => {
    test("1.234,56 → 1234.56 (dot thousands, comma decimal)", () => {
      const result = parsePriceString("€1.234,56");
      expect(result.rawAmount).toBe(1234.56);
    });

    test("12.500 → 12500 (exactly 3 digits after dot = thousands)", () => {
      const result = parsePriceString("€12.500");
      expect(result.rawAmount).toBe(12500);
    });

    test("12.999,50 → 12999.50 (dot thousands, comma decimal)", () => {
      const result = parsePriceString("€12.999,50");
      expect(result.rawAmount).toBe(12999.5);
    });
  });

  describe("Comma + dot = auto-detection", () => {
    test("1,234.56 → 1234.56 (US: comma thousands, dot decimal)", () => {
      const result = parsePriceString("$1,234.56");
      expect(result.rawAmount).toBe(1234.56);
    });

    test("1.234,56 → 1234.56 (European: dot thousands, comma decimal)", () => {
      const result = parsePriceString("€1.234,56");
      expect(result.rawAmount).toBe(1234.56);
    });

    test("123,456.78 → 123456.78 (multiple separators)", () => {
      const result = parsePriceString("$123,456.78");
      expect(result.rawAmount).toBe(123456.78);
    });
  });

  describe("Space as thousands separator", () => {
    test("2 499 → 2499 (space always thousands)", () => {
      const result = parsePriceString("2 499 CZK");
      expect(result.rawAmount).toBe(2499);
    });

    test("1 234 567 → 1234567", () => {
      const result = parsePriceString("€1 234 567");
      expect(result.rawAmount).toBe(1234567);
    });

    test("1 234,56 → 1234.56 (space thousands + comma decimal)", () => {
      const result = parsePriceString("€1 234,56");
      expect(result.rawAmount).toBe(1234.56);
    });
  });

  describe("Edge cases", () => {
    test("999 → 999 (no separators)", () => {
      const result = parsePriceString("€999");
      expect(result.rawAmount).toBe(999);
    });

    test("0,99 → 0.99", () => {
      const result = parsePriceString("€0,99");
      expect(result.rawAmount).toBe(0.99);
    });

    test("0.99 → 0.99", () => {
      const result = parsePriceString("$0.99");
      expect(result.rawAmount).toBe(0.99);
    });
  });
});
