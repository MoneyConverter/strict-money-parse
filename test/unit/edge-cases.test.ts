import { describe, expect, test } from "vitest";
import { parsePriceString } from "../../src";

/**
 * Tests for edge cases and error handling
 * Covers uncovered lines in parse.ts
 */
describe("Edge Cases and Error Handling", () => {
  describe("Strings without numeric tokens", () => {
    test("Empty string returns UNKNOWN", () => {
      const result = parsePriceString("");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
      expect(result.currency).toBe(null);
    });

    test("Only letters without digits", () => {
      const result = parsePriceString("USD EUR GBP");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Only currency symbols without digits", () => {
      const result = parsePriceString("€ $ £ ¥");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Only spaces and symbols", () => {
      const result = parsePriceString("   ---   ");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });
  });

  describe("Invalid numeric tokens", () => {
    test("Only separators without digits", () => {
      const result = parsePriceString("€.,.,.,");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Incorrect number format (multiple consecutive dots)", () => {
      const result = parsePriceString("€...123...");
      // May parse or not, depending on logic
      // Check that it doesn't crash
      expect(result).toBeDefined();
    });

    test("Token that doesn't parse to a number (NaN)", () => {
      // String with letters inside number may create invalid token
      const result = parsePriceString("€abc");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });
  });

  describe("False positives", () => {
    test("Phone number (10+ consecutive digits) is ignored", () => {
      const result = parsePriceString("+1-234-567-8900");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Date in YYYY-MM-DD format is ignored", () => {
      const result = parsePriceString("2024-12-25");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Date in DD/MM/YYYY format is ignored", () => {
      const result = parsePriceString("25/12/2024");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Date in MM-DD-YY format is ignored", () => {
      const result = parsePriceString("12-25-24");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Year (1900-2099) is ignored", () => {
      const result = parsePriceString("2024");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Percentage is ignored with ignorePercentages option", () => {
      const result = parsePriceString("25%", { ignorePercentages: true });
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Percentage is recognized without ignorePercentages option", () => {
      const result = parsePriceString("25%", { ignorePercentages: false });
      expect(result.rawAmount).toBe(25);
    });

    test("Number range is ignored", () => {
      const result = parsePriceString("100-200");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Range with em-dash is ignored", () => {
      const result = parsePriceString("100—200");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Dimensions (x) are ignored", () => {
      const result = parsePriceString("1920x1080");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });

    test("Dimensions (×) are ignored", () => {
      const result = parsePriceString("1920×1080");
      expect(result.status).toBe("UNKNOWN");
      expect(result.rawAmount).toBe(null);
    });
  });

  describe("Complex edge cases", () => {
    test("Price with phone - extracts first number (phone)", () => {
      // Parser extracts the FIRST number encountered
      const result = parsePriceString("€99.99 Call: +1-234-567-8900");
      // But phone (10+ digits) is false positive, so UNKNOWN
      expect(result.status).toBe("UNKNOWN");
    });

    test("Date with price - extracts first number (part of date)", () => {
      const result = parsePriceString("€99.99 on 2024-12-25");
      // Date is false positive
      expect(result.status).toBe("UNKNOWN");
    });

    test("Percentage and price - extracts first number (price)", () => {
      const result = parsePriceString("€99.99 (25% off)", { ignorePercentages: true });
      // Percentage comes after price, so price should parse
      // But percentage in the same string makes it false positive
      expect(result.status).toBe("UNKNOWN");
    });

    test("Price before false positive works", () => {
      // If separated - works
      const result = parsePriceString("€99.99");
      expect(result.status).toBe("CONFIRMED");
      expect(result.rawAmount).toBe(99.99);
    });
  });

  describe("Incorrect numeric formats", () => {
    test("Only commas without digits between them", () => {
      const result = parsePriceString("€,,,");
      expect(result.status).toBe("UNKNOWN");
    });

    test("Multiple dots without valid digits", () => {
      const result = parsePriceString("€...");
      expect(result.status).toBe("UNKNOWN");
    });

    test("Mixed separators without logic", () => {
      const result = parsePriceString("€1.2.3.4.5");
      // May be UNKNOWN or unexpected result
      expect(result).toBeDefined();
    });
  });

  describe("Special characters and whitespace", () => {
    test("Non-breaking space (NBSP) is normalized", () => {
      const result = parsePriceString("€\u00A099.99");
      expect(result.status).toBe("CONFIRMED");
      expect(result.rawAmount).toBe(99.99);
    });

    test("Thin space is normalized", () => {
      const result = parsePriceString("€\u200999.99");
      expect(result.status).toBe("CONFIRMED");
      expect(result.rawAmount).toBe(99.99);
    });

    test("Apostrophes as separators", () => {
      const result = parsePriceString("€1'234.56");
      expect(result.status).toBe("CONFIRMED");
      expect(result.rawAmount).toBe(1234.56);
    });

    test("Underscores as separators", () => {
      const result = parsePriceString("€1_234.56");
      expect(result.status).toBe("CONFIRMED");
      expect(result.rawAmount).toBe(1234.56);
    });
  });

  describe("Very large and small numbers", () => {
    test("Large number with two thousand separators", () => {
      const result = parsePriceString("€123,456.78");
      expect(result.status).toBe("CONFIRMED");
      expect(result.rawAmount).toBe(123456.78);
    });

    test("Very small number", () => {
      const result = parsePriceString("€0.01");
      expect(result.status).toBe("CONFIRMED");
      expect(result.rawAmount).toBe(0.01);
    });

    test("Zero", () => {
      const result = parsePriceString("€0");
      expect(result.status).toBe("CONFIRMED");
      expect(result.rawAmount).toBe(0);
    });

    test("Zero with decimals", () => {
      const result = parsePriceString("€0.00");
      expect(result.status).toBe("CONFIRMED");
      expect(result.rawAmount).toBe(0);
    });
  });

  describe("maxFractionDigits options", () => {
    test("Default maxFractionDigits=3 (but 3 digits = thousands!)", () => {
      // Although maxFractionDigits=3, exactly 3 digits after separator = thousands
      const result = parsePriceString("€1.234");
      expect(result.rawAmount).toBe(1234);
    });

    test("Override maxFractionDigits=2", () => {
      const result = parsePriceString("€1.234", { maxFractionDigits: 2 });
      // If 3 digits after separator and max=2, this may be thousands
      expect(result.rawAmount).toBe(1234);
    });

    test("Override maxFractionDigits=4", () => {
      const result = parsePriceString("€1.2345", { maxFractionDigits: 4 });
      expect(result.rawAmount).toBe(1.2345);
    });
  });
});
