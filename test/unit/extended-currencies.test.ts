import { describe, it, expect } from "vitest";
import { parsePriceString } from "../../src/parse";

describe("parsePriceString - extended currency symbols", () => {
  describe("Asian currencies", () => {
    it("should detect Bangladeshi Taka ৳", () => {
      const result = parsePriceString("৳1,000");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("BDT");
      expect(result.symbol).toBe("৳");
      expect(result.rawAmount).toBe(1000);
    });

    it("should detect Cambodian Riel ៛", () => {
      const result = parsePriceString("៛15,000");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("KHR");
      expect(result.symbol).toBe("៛");
    });

    it("should detect Lao Kip ₭", () => {
      const result = parsePriceString("₭50,000");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("LAK");
      expect(result.symbol).toBe("₭");
    });
  });

  describe("European letter-based currencies", () => {
    it("should detect Czech Koruna Kč", () => {
      const result = parsePriceString("1.500 Kč");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("CZK");
      expect(result.symbol).toBe("Kč");
    });

    it("should detect Polish Zloty zł", () => {
      const result = parsePriceString("299 zł");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("PLN");
      expect(result.symbol).toBe("zł");
    });

    it("should detect Hungarian Forint Ft", () => {
      const result = parsePriceString("Ft 25.000");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("HUF");
      expect(result.symbol).toBe("Ft");
    });

    it("should detect Bulgarian Lev лв", () => {
      const result = parsePriceString("149 лв");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("BGN");
      expect(result.symbol).toBe("лв");
    });
  });

  describe("African currencies", () => {
    it("should detect Ghanaian Cedi ₵", () => {
      const result = parsePriceString("₵150.50");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("GHS");
      expect(result.symbol).toBe("₵");
    });
  });

  describe("Disambiguated dollar forms with spaces", () => {
    it("should detect US $ with space", () => {
      const result = parsePriceString("US $ 100");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("USD");
    });

    it("should detect CA $ with space", () => {
      const result = parsePriceString("CA $ 50");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("CAD");
    });

    it("should detect A $ (Australian)", () => {
      const result = parsePriceString("A$ 75");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("AUD");
    });

    it("should detect EC $ (East Caribbean)", () => {
      const result = parsePriceString("EC$ 25");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("XCD");
    });
  });

  describe("Disambiguated pound forms", () => {
    it("should detect Egyptian Pound E£", () => {
      const result = parsePriceString("E£ 500");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("EGP");
    });

    it("should detect Egyptian Pound £E", () => {
      const result = parsePriceString("£E 500");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("EGP");
    });

    it("should detect Syrian Pound £S", () => {
      const result = parsePriceString("£S 1000");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("SYP");
    });

    it("should detect Syrian Pound S£", () => {
      const result = parsePriceString("S£ 1000");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("SYP");
    });
  });

  describe("Disambiguated yen/yuan forms", () => {
    it("should detect Japanese Yen JP¥", () => {
      const result = parsePriceString("JP¥ 1,000");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("JPY");
    });

    it("should detect Chinese Yuan CN¥", () => {
      const result = parsePriceString("CN¥ 100");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("CNY");
    });
  });

  describe("New ambiguous symbols", () => {
    it("should detect Fr as ambiguous (Swiss Franc family)", () => {
      const result = parsePriceString("Fr 50");
      expect(result.status).toBe("AMBIGUOUS");
      expect(result.symbol).toBe("Fr");
      expect(result.currencyHints).toContain("CHF");
      expect(result.currencyHints).toContain("XAF");
    });

    it("should detect ₨ as ambiguous (Rupee family)", () => {
      const result = parsePriceString("₨ 500");
      expect(result.status).toBe("AMBIGUOUS");
      expect(result.symbol).toBe("₨");
      expect(result.currencyHints).toContain("INR");
      expect(result.currencyHints).toContain("PKR");
      expect(result.currencyHints).toContain("LKR");
    });
  });

  describe("Symbol priority - longer symbols first", () => {
    it("should match US$ before $", () => {
      const result = parsePriceString("US$100");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("USD");
      expect(result.symbol).not.toBe("$");
    });

    it("should match E£ before £", () => {
      const result = parsePriceString("E£500");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("EGP");
    });

    it("should match JP¥ before ¥", () => {
      const result = parsePriceString("JP¥1000");
      expect(result.status).toBe("CONFIRMED");
      expect(result.currency).toBe("JPY");
    });
  });
});
