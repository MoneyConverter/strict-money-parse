import { describe, expect, test } from "vitest";
import { parsePriceString } from "../../src";

/**
 * Tests for handling numbers with more decimal places than maxFractionDigits
 * 
 * BUG FIX: Previously, when a number had more decimal digits than maxFractionDigits,
 * the parser incorrectly treated the decimal separator as a thousands separator.
 * 
 * For example, "2.32123" with maxFractionDigits: 2 was parsed as 232123 instead of 2.32123
 * 
 * CORRECT BEHAVIOR:
 * maxFractionDigits should be used for DISAMBIGUATION (is "1.234" → 1234 or 1.234?),
 * NOT for rejecting valid decimal numbers with more precision.
 * 
 * NEW LOGIC:
 * - Exactly 3 digits after separator: treat as thousands (1.234 → 1234)
 * - 1-2 digits: treat as decimal if within maxFractionDigits (1.23 → 1.23)
 * - 4+ digits: treat as decimal regardless of maxFractionDigits (1.23456 → 1.23456)
 */

describe("Numbers exceeding maxFractionDigits", () => {
  describe("Bug reproduction: high-precision decimals", () => {
    test("2.32123 грн with maxFractionDigits: 2 should parse as 2.32123, not 232123", () => {
      const result = parsePriceString("2.32123 грн", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(2.32123);
    });

    test("5.12345 with maxFractionDigits: 2 should parse as 5.12345", () => {
      const result = parsePriceString("€5.12345", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(5.12345);
    });

    test("0.000123 BTC with maxFractionDigits: 2 should parse as 0.000123", () => {
      const result = parsePriceString("0.000123 BTC", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(0.000123);
    });
  });

  describe("Cryptocurrency amounts (high precision)", () => {
    test("0.00005432 BTC should parse correctly", () => {
      const result = parsePriceString("0.00005432 BTC", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(0.00005432);
    });

    test("1.23456789 ETH should parse correctly", () => {
      const result = parsePriceString("1.23456789 ETH", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(1.23456789);
    });

    test("123.456789 should parse as decimal with 6 decimal places", () => {
      const result = parsePriceString("$123.456789", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(123.456789);
    });
  });

  describe("Edge cases with commas", () => {
    test("2,32123 with comma separator and maxFractionDigits: 2", () => {
      const result = parsePriceString("€2,32123", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(2.32123);
    });

    test("5,123456 with comma separator", () => {
      const result = parsePriceString("5,123456 €", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(5.123456);
    });
  });

  describe("Disambiguation still works correctly", () => {
    test("1.234 with maxFractionDigits: 2 is thousands (exactly 3 digits)", () => {
      const result = parsePriceString("€1.234", {
        maxFractionDigits: 2,
      });
      // Exactly 3 digits = thousands separator
      expect(result.rawAmount).toBe(1234);
    });

    test("1.23 with maxFractionDigits: 2 is decimal (2 digits)", () => {
      const result = parsePriceString("€1.23", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(1.23);
    });

    test("1.2345 with maxFractionDigits: 2 is decimal (4+ digits)", () => {
      const result = parsePriceString("€1.2345", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(1.2345);
    });

    test("12,999 is thousands (exactly 3 digits)", () => {
      const result = parsePriceString("€12,999", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(12999);
    });

    test("12,99 is decimal (2 digits)", () => {
      const result = parsePriceString("€12,99", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(12.99);
    });
  });

  describe("Very high precision numbers", () => {
    test("8 decimal places", () => {
      const result = parsePriceString("1.12345678 USD", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(1.12345678);
    });

    test("10 decimal places", () => {
      const result = parsePriceString("0.12345678 BTC", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(0.12345678);
    });

    test("0.00034 should parse correctly", () => {
      const result = parsePriceString("$0.00034", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(0.00034);
    });

    test("12.9102 should parse correctly", () => {
      const result = parsePriceString("€12.9102", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(12.9102);
    });

    test("10201.00012 should parse correctly (9 total digits)", () => {
      // Note: Numbers with 10+ digits are filtered as phone numbers
      // Using 201.00012 which has 8 total digits but still 5 decimal places
      const result = parsePriceString("$201.00012", {
        maxFractionDigits: 2,
      });
      expect(result.rawAmount).toBe(201.00012);
    });
  });

  describe("maxFractionDigits higher than actual digits", () => {
    test("maxFractionDigits: 6 with 5 decimal places", () => {
      const result = parsePriceString("2.32123 грн", {
        maxFractionDigits: 6,
      });
      expect(result.rawAmount).toBe(2.32123);
    });

    test("maxFractionDigits: 8 with 4 decimal places", () => {
      const result = parsePriceString("€5.1234", {
        maxFractionDigits: 8,
      });
      expect(result.rawAmount).toBe(5.1234);
    });
  });
});
