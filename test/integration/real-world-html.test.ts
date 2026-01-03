import { describe, expect, test } from "vitest";
import { parsePriceString } from "../../src/parse";
import { parsePriceCandidates } from "../../src/candidates";

/**
 * Real-world HTML examples from e-commerce sites
 * Testing robustness with HTML tags, entities, and various formats
 */
describe("Real-world HTML snippets", () => {
  test("Amazon EUR price with HTML span tags", () => {
    const html =
      '<span class="a-color-secondary">1 offer from <span><span class="p13n-sc-price">€18.99</span></span></span>';
    // parsePriceString takes first number (1), use parsePriceCandidates for complex HTML
    const candidates = parsePriceCandidates(html, { maxCandidates: 5 });

    const validPrice = candidates.find((c) => c.status === "CONFIRMED" && c.rawAmount === 18.99);
    expect(validPrice).toBeDefined();
    expect(validPrice?.currency).toBe("EUR");
  });

  test("Kuwait dinar with Arabic script", () => {
    // Simplified version without excessive HTML
    const result = parsePriceString("279,990 د.ك");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(279990);
    expect(result.currency).toBe("KWD");
  });

  test("Nigerian naira with thousands separators", () => {
    const html =
      '<div class="qa-advert-price-view-title b-alt-advert-price__text" itemprop="price" content="3200000"><span class="qa-advert-price-view-value">₦ 3,200,000</span><meta itemprop="priceCurrency" content="NGN"><!----></div>';
    // Complex HTML - use candidates
    const candidates = parsePriceCandidates(html, { maxCandidates: 5 });

    const validPrice = candidates.find((c) => c.status === "CONFIRMED" && c.rawAmount === 3200000);
    expect(validPrice).toBeDefined();
    expect(validPrice?.currency).toBe("NGN");
  });

  test("Romanian leu with German decimal format", () => {
    // Simplified version
    const result = parsePriceString("7.419,99 Lei");

    // Lei is ambiguous (RON/MDL), needs ISO code for confirmation
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(7419.99);
    expect(result.currencyHints).toContain("RON");
    expect(result.currencyHints).toContain("MDL");
  });

  test("Japanese yen with CJK character 円", () => {
    // Simplified version
    const result = parsePriceString("15,400円");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(15400);
    expect(result.currency).toBe("JPY");
  });

  test("Korean won in parentheses", () => {
    const html = '<div class="convers-price">(₩11,900)</div>';
    const result = parsePriceString(html);

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(11900);
    expect(result.currency).toBe("KRW");
  });

  test("Multiple prices in same HTML - extracts first", () => {
    const html = '<div>Price: €99.99 or $109.99</div>';
    const result = parsePriceString(html);

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(99.99);
    expect(result.currency).toBe("EUR");
  });

  test("HTML entities in price", () => {
    const html = "&euro;25.50";
    // HTML entity not decoded automatically
    const result = parsePriceString(html);

    // Without decoding, just finds number
    expect(result.rawAmount).toBe(25.5);
  });

  test("Price with HTML comments", () => {
    const html = "<!-- Original price -->€199.99<!-- /price -->";
    const result = parsePriceString(html);

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(199.99);
    expect(result.currency).toBe("EUR");
  });

  test("Price with nested HTML structure - simplified", () => {
    // Simplified: symbol and number closer
    const result = parsePriceString("₹1,234.56");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1234.56);
    expect(result.currency).toBe("INR");
  });
});

describe("Edge cases with HTML", () => {
  test("Price in data attribute", () => {
    const html = '<div data-price="€45.00">Click here</div>';
    const result = parsePriceString(html);

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(45);
    expect(result.currency).toBe("EUR");
  });

  test("Escaped HTML tags", () => {
    const html = "&lt;span&gt;$99.99&lt;/span&gt;";
    const result = parsePriceString(html);

    // Should still find the dollar amount
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(99.99);
    expect(result.currencyHints).toContain("USD");
  });

  test("Mixed scripts - Arabic with Latin numbers", () => {
    const html = "السعر: 500 د.ك فقط";
    const result = parsePriceString(html);

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(500);
    expect(result.currency).toBe("KWD");
  });

  test("Price with line breaks and tabs", () => {
    const html = "Price:\n\t\t€150.00\n\t";
    const result = parsePriceString(html);

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(150);
    expect(result.currency).toBe("EUR");
  });

  test("Armenian dram from online store", () => {
    // Simplified: clean text
    const result = parsePriceString("99,000 ֏");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(99000);
    expect(result.currency).toBe("AMD");
  });

  test("Israeli shekel from Zap store", () => {
    // Simplified: clean text
    const result = parsePriceString("3,595 ₪");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(3595);
    expect(result.currency).toBe("ILS");
  });

  test("Indonesian rupiah from Tokopedia", () => {
    // Simplified: clean text with discount price
    const result = parsePriceString("Rp58.500");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(58500);
    expect(result.currency).toBe("IDR");
  });

  test("Thai baht from Lazada", () => {
    // Simplified: clean text
    const result = parsePriceString("฿589.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(589);
    expect(result.currency).toBe("THB");
  });

  test("Indian rupee price per unit", () => {
    // Price per unit format with trailing slash
    const result = parsePriceString("₹ 53/");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(53);
    expect(result.currency).toBe("INR");
  });

  test("Polish zloty with comma decimal separator", () => {
    // Format: 59,90 zł (European decimal format)
    const result = parsePriceString("59,90 zł");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(59.9);
    expect(result.currency).toBe("PLN");
  });

  test("Kazakh tenge with space thousands separator", () => {
    // Format: 4 990 ₸ (space as thousands separator)
    const result = parsePriceString("4 990 ₸");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(4990);
    expect(result.currency).toBe("KZT");
  });

  test("Japanese yen with comma thousands separator and kanji", () => {
    // Format: 40,800円
    const result = parsePriceString("40,800円");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(40800);
    expect(result.currency).toBe("JPY");
  });

  test("Chinese yuan with bare yen symbol", () => {
    // ¥ is ambiguous (JPY/CNY)
    const result = parsePriceString("¥52.8");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(52.8);
    expect(result.currencyHints).toContain("CNY");
    expect(result.currencyHints).toContain("JPY");
  });

  test("Czech koruna with trailing comma dash format", () => {
    // Format: 229,- (Czech price format without haléř)
    const result = parsePriceString("229,-");

    // Parses as 229 (ignores trailing ,-)
    expect(result.rawAmount).toBe(229);
  });

  test("Czech koruna with space thousands separator", () => {
    // Format: 9 890 Kč
    const result = parsePriceString("9 890 Kč");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(9890);
    expect(result.currency).toBe("CZK");
  });

  test("British pound with decimal", () => {
    // £ is ambiguous (GBP, EGP, etc.)
    const result = parsePriceString("£59.99");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(59.99);
    expect(result.currencyHints).toContain("GBP");
  });

  test("Ghanaian cedi with thousands separator", () => {
    // Format: ₵4,699.00
    const result = parsePriceString("₵4,699.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(4699);
    expect(result.currency).toBe("GHS");
  });

  test("Kenyan shilling with KSh prefix", () => {
    // Format: KSh 358
    const result = parsePriceString("KSh 358");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(358);
    expect(result.currency).toBe("KES");
  });

  test("Azerbaijani manat with ISO code", () => {
    // Format: 8 500 AZN (space thousands separator + ISO code)
    const result = parsePriceString("8 500 AZN");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(8500);
    expect(result.currency).toBe("AZN");
  });

  test("Georgian lari with decimal", () => {
    // Format: 1.1 ₾
    const result = parsePriceString("1.1 ₾");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1.1);
    expect(result.currency).toBe("GEL");
  });

  test("Belarusian ruble with Cyrillic р.", () => {
    // Format: 750,00 р. (ambiguous BYN/RUB)
    const result = parsePriceString("750,00 р.");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(750);
    expect(result.currencyHints).toContain("BYN");
    expect(result.currencyHints).toContain("RUB");
  });

  test("Pakistani rupee with Rs. prefix", () => {
    // Format: Rs. 33,900 (ambiguous rupee family)
    const result = parsePriceString("Rs. 33,900");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(33900);
    expect(result.currencyHints).toContain("PKR");
    expect(result.currencyHints).toContain("INR");
  });

  test("Vietnamese dong with dot thousands separator", () => {
    // Format: 51.200₫ (dot as thousands separator)
    const result = parsePriceString("51.200₫");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(51200);
    expect(result.currency).toBe("VND");
  });

  test("Swedish krona with space thousands separator", () => {
    // Format: 3 099 kr (ambiguous SEK/NOK/DKK/ISK)
    const result = parsePriceString("3 099 kr");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(3099);
    expect(result.currencyHints).toContain("SEK");
    expect(result.currencyHints).toContain("NOK");
    expect(result.currencyHints).toContain("DKK");
  });

  test("Bulgarian lev with dot thousands and comma decimal", () => {
    // Format: 2.539,98 лв. (European format)
    const result = parsePriceString("2.539,98 лв.");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(2539.98);
    expect(result.currency).toBe("BGN");
  });

  test("Euro with dot thousands and comma decimal", () => {
    // Format: 1.298,67 € (European format)
    const result = parsePriceString("1.298,67 €");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1298.67);
    expect(result.currency).toBe("EUR");
  });

  test("Turkish lira with space separator", () => {
    // Format: 499 TL
    const result = parsePriceString("499 TL");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(499);
    expect(result.currency).toBe("TRY");
  });

  test("Czech koruna with dash for zero cents", () => {
    // Format: 1499.- Kč (European tradition: dash = .00)
    const result = parsePriceString("1499.- Kč");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1499);
    expect(result.currency).toBe("CZK");
  });

  test("Swiss franc with dash for zero cents", () => {
    // Format: 100.- CHF
    const result = parsePriceString("100.- CHF");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(100);
    expect(result.currency).toBe("CHF");
  });

  test("Danish krone with dash for zero cents", () => {
    // Format: 450.- kr (ambiguous DKK/SEK/NOK)
    const result = parsePriceString("450.- kr");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(450);
    expect(result.currencyHints).toContain("DKK");
    expect(result.currencyHints).toContain("SEK");
    expect(result.currencyHints).toContain("NOK");
  });

  test("Swiss franc with decimal cents", () => {
    // Format: 99.90 CHF (with actual cents)
    const result = parsePriceString("99.90 CHF");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(99.9);
    expect(result.currency).toBe("CHF");
  });

  test("Albanian lek with ISO code", () => {
    // Format: ALL 3727
    const result = parsePriceString("ALL 3727");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(3727);
    expect(result.currency).toBe("ALL");
  });

  test("Saudi riyal with comma thousands separator", () => {
    // Format: 1,499 ر.س.
    const result = parsePriceString("1,499 ر.س.");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1499);
    expect(result.currency).toBe("SAR");
  });

  test("Saudi riyal with ISO code prefix", () => {
    // Format: SAR 3,499
    const result = parsePriceString("SAR 3,499");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(3499);
    expect(result.currency).toBe("SAR");
  });

  test("Turkish lira with symbol prefix and comma decimal", () => {
    // Format: ₺459,99 (European decimal format)
    const result = parsePriceString("₺459,99");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(459.99);
    expect(result.currency).toBe("TRY");
  });

  test("Israeli shekel with symbol prefix, no space", () => {
    // Format: ₪1,890
    const result = parsePriceString("₪1,890");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1890);
    expect(result.currency).toBe("ILS");
  });

  test("Egyptian pound with ISO code prefix", () => {
    // Format: EGP 12,400.00
    const result = parsePriceString("EGP 12,400.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(12400);
    expect(result.currency).toBe("EGP");
  });

  test("Qatari riyal with ISO code prefix", () => {
    // Format: QAR 59.00
    const result = parsePriceString("QAR 59.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(59);
    expect(result.currency).toBe("QAR");
  });

  test("Kuwaiti dinar with three digits after dot", () => {
    // Format: 45.900 KD (dot separates thousands)
    const result = parsePriceString("45.900 KD");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(45900);
    expect(result.currency).toBe("KWD");
  });

  test("South African rand with R prefix", () => {
    // Format: R 4,999
    const result = parsePriceString("R 4,999");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(4999);
    expect(result.currencyHints).toContain("ZAR");
  });

  test("Nigerian naira with symbol prefix", () => {
    // Format: ₦ 15,500
    const result = parsePriceString("₦ 15,500");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(15500);
    expect(result.currency).toBe("NGN");
  });

  test("Kenyan shilling with KSh prefix", () => {
    // Format: KSh 2,150
    const result = parsePriceString("KSh 2,150");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(2150);
    expect(result.currency).toBe("KES");
  });

  test("Moroccan dirham with DH suffix", () => {
    // Format: 199.00 DH
    const result = parsePriceString("199.00 DH");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(199);
    expect(result.currency).toBe("MAD");
  });

  test("Algerian dinar with DA suffix, no cents", () => {
    // Format: 4500 DA
    const result = parsePriceString("4500 DA");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(4500);
    expect(result.currency).toBe("DZD");
  });

  test("Omani rial with three digits after dot", () => {
    // Format: OMR 120.500 (dot separates thousands, 500 are also thousands)
    const result = parsePriceString("OMR 120.500");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(120500);
    expect(result.currency).toBe("OMR");
  });

  test("Jordanian dinar with ISO suffix", () => {
    // Format: 15.00 JOD
    const result = parsePriceString("15.00 JOD");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(15);
    expect(result.currency).toBe("JOD");
  });

  test("Ghanaian cedi with GH₵ prefix", () => {
    // Format: GH₵ 85.00
    const result = parsePriceString("GH₵ 85.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(85);
    expect(result.currency).toBe("GHS");
  });

  test("Tunisian dinar with space thousands and comma thousands", () => {
    // Format: 1 250,000 DT (both space and comma as thousands separators = 1,250,000)
    const result = parsePriceString("1 250,000 DT");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1250000);
    expect(result.currency).toBe("TND");
  });

  test("Ethiopian birr with ISO suffix", () => {
    // Format: 450 ETB
    const result = parsePriceString("450 ETB");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(450);
    expect(result.currency).toBe("ETB");
  });

  test("Lebanese pound with ISO prefix and large amount", () => {
    // Format: LBP 1,500,000 (hyperinflation)
    const result = parsePriceString("LBP 1,500,000");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1500000);
    expect(result.currency).toBe("LBP");
  });

  test("German euro with comma decimal and symbol suffix", () => {
    // Format: 24,99 € (German/European format)
    const result = parsePriceString("24,99 €");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(24.99);
    expect(result.currency).toBe("EUR");
  });

  test("UK pound with symbol prefix", () => {
    // Format: £45.00 (UK format)
    const result = parsePriceString("£45.00");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(45);
    expect(result.currencyHints).toContain("GBP");
  });

  test("Czech koruna with dot thousands and comma-dash", () => {
    // Format: 1.299,- Kč (dot thousands, comma-dash for zero cents)
    const result = parsePriceString("1.299,- Kč");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1299);
    expect(result.currency).toBe("CZK");
  });

  test("Swiss franc with em dash for zero cents", () => {
    // Format: CHF 149.— (long em dash)
    const result = parsePriceString("CHF 149.—");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(149);
    expect(result.currency).toBe("CHF");
  });

  test("Polish zloty with comma decimal", () => {
    // Format: 89,90 zł (comma decimal, symbol suffix)
    const result = parsePriceString("89,90 zł");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(89.9);
    expect(result.currency).toBe("PLN");
  });

  test("Swedish krona with dot thousands and colon-dash", () => {
    // Format: 1.495:- (Swedish tradition: colon with dash)
    const result = parsePriceString("1.495:- kr");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(1495);
    expect(result.currencyHints).toContain("SEK");
    expect(result.currencyHints).toContain("DKK");
    expect(result.currencyHints).toContain("NOK");
  });

  test("Norwegian krone with comma and en dash", () => {
    // Format: 599,– (comma with en dash)
    const result = parsePriceString("599,– kr");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(599);
    expect(result.currencyHints).toContain("NOK");
    expect(result.currencyHints).toContain("SEK");
    expect(result.currencyHints).toContain("DKK");
  });

  test("Hungarian forint with space thousands", () => {
    // Format: 45 990 Ft (space thousands, no cents)
    const result = parsePriceString("45 990 Ft");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(45990);
    expect(result.currency).toBe("HUF");
  });

  test("Greek euro with comma decimal", () => {
    // Format: 19,90 € (Eurozone format)
    const result = parsePriceString("19,90 €");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(19.9);
    expect(result.currency).toBe("EUR");
  });

  test("Japanese yen with comma thousands", () => {
    // Format: ¥12,800 (ambiguous JPY/CNY)
    const result = parsePriceString("¥12,800");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(12800);
    expect(result.currencyHints).toContain("JPY");
    expect(result.currencyHints).toContain("CNY");
  });

  test("Chinese yuan with decimal cents", () => {
    // Format: ¥499.00 (ambiguous JPY/CNY)
    const result = parsePriceString("¥499.00");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(499);
    expect(result.currencyHints).toContain("CNY");
    expect(result.currencyHints).toContain("JPY");
  });

  test("South Korean won with comma thousands", () => {
    // Format: ₩25,600
    const result = parsePriceString("₩25,600");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(25600);
    expect(result.currency).toBe("KRW");
  });

  test("Indian rupee with comma thousands", () => {
    // Format: ₹1,499 (no space)
    const result = parsePriceString("₹1,499");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1499);
    expect(result.currency).toBe("INR");
  });

  test("Kazakh tenge with space thousands", () => {
    // Format: 150 000 ₸
    const result = parsePriceString("150 000 ₸");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(150000);
    expect(result.currency).toBe("KZT");
  });

  test("Vietnamese dong with dot thousands", () => {
    // Format: 250.000 ₫ (dots as thousands separator)
    const result = parsePriceString("250.000 ₫");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(250000);
    expect(result.currency).toBe("VND");
  });

  test("Indonesian rupiah with Rp prefix and dot thousands", () => {
    // Format: Rp 75.000
    const result = parsePriceString("Rp 75.000");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(75000);
    expect(result.currency).toBe("IDR");
  });

  test("Thai baht with symbol prefix and decimal", () => {
    // Format: ฿1,250.00
    const result = parsePriceString("฿1,250.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1250);
    expect(result.currency).toBe("THB");
  });

  test("Uzbek sum with space thousands and so'm suffix", () => {
    // Format: 1 250 000 so'm
    const result = parsePriceString("1 250 000 so'm");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1250000);
    expect(result.currency).toBe("UZS");
  });

  test("US dollar with dot decimal", () => {
    // Format: $29.99
    const result = parsePriceString("$29.99");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(29.99);
    expect(result.currencyHints).toContain("USD");
  });

  test("Canadian dollar with CDN prefix", () => {
    // Format: CA$ 15.97 or CDN$
    const result = parsePriceString("CA$ 15.97");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(15.97);
    expect(result.currency).toBe("CAD");
  });

  test("Mexican peso with dollar sign", () => {
    // Format: $1,299.00 (ambiguous with USD)
    const result = parsePriceString("$1,299.00");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(1299);
    expect(result.currencyHints).toContain("MXN");
    expect(result.currencyHints).toContain("USD");
  });

  test("Mexican peso with MXN code", () => {
    // Format: MXN 1,299.00
    const result = parsePriceString("MXN 1,299.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1299);
    expect(result.currency).toBe("MXN");
  });

  test("Costa Rican colon with unique symbol", () => {
    // Format: ₡155,000
    const result = parsePriceString("₡155,000");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(155000);
    expect(result.currency).toBe("CRC");
  });

  test("Panamanian balboa with dollar sign", () => {
    // Format: $450.00 (PAB is 1:1 with USD, ambiguous)
    const result = parsePriceString("$450.00");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(450);
    expect(result.currencyHints).toContain("USD");
  });

  test("Panamanian balboa with PAB code", () => {
    // Format: PAB 450.00
    const result = parsePriceString("PAB 450.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(450);
    expect(result.currency).toBe("PAB");
  });

  test("Guatemalan quetzal with Q prefix", () => {
    // Format: Q999.00
    const result = parsePriceString("Q999.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(999);
    expect(result.currency).toBe("GTQ");
  });

  test("Dominican peso with RD$ prefix", () => {
    // Format: RD$ 2,500
    const result = parsePriceString("RD$ 2,500");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(2500);
    expect(result.currency).toBe("DOP");
  });

  test("Brazilian real with R$ and comma decimal", () => {
    // Format: R$ 149,90 (comma as decimal separator)
    const result = parsePriceString("R$ 149,90");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(149.9);
    expect(result.currency).toBe("BRL");
  });

  test("Argentine peso with dot thousands", () => {
    // Format: $250.000 (dot as thousands separator, no cents due to inflation)
    const result = parsePriceString("$250.000");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(250000);
    expect(result.currencyHints).toContain("ARS");
  });

  test("Chilean peso with dot thousands", () => {
    // Format: $45.990 (dot as thousands separator)
    const result = parsePriceString("$45.990");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(45990);
    expect(result.currencyHints).toContain("CLP");
  });

  test("Colombian peso with dot thousands", () => {
    // Format: $1.299.900 (multiple dots as thousands separator)
    const result = parsePriceString("$1.299.900");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(1299900);
    expect(result.currencyHints).toContain("COP");
  });

  test("Peruvian sol with S/ prefix", () => {
    // Format: S/ 79.90
    const result = parsePriceString("S/ 79.90");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(79.9);
    expect(result.currency).toBe("PEN");
  });

  test("Uruguayan peso with $U prefix", () => {
    // Format: $U 1.250 (dot as thousands separator)
    const result = parsePriceString("$U 1.250");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1250);
    expect(result.currency).toBe("UYU");
  });

  test("Paraguayan guarani with symbol and dot thousands", () => {
    // Format: ₲ 1.550.000 (no cents)
    const result = parsePriceString("₲ 1.550.000");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1550000);
    expect(result.currency).toBe("PYG");
  });

  test("Bolivian boliviano with Bs prefix", () => {
    // Format: Bs 350
    const result = parsePriceString("Bs 350");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(350);
    expect(result.currency).toBe("BOB");
  });

  test("Australian dollar with AU$ prefix", () => {
    // Format: AU$ 49.00
    const result = parsePriceString("AU$ 49.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(49);
    expect(result.currency).toBe("AUD");
  });

  test("New Zealand dollar with NZ$ prefix", () => {
    // Format: NZ$ 12.50
    const result = parsePriceString("NZ$ 12.50");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(12.5);
    expect(result.currency).toBe("NZD");
  });

  test("Papua New Guinea kina with K prefix", () => {
    // Format: K150.00
    const result = parsePriceString("K150.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(150);
    expect(result.currency).toBe("PGK");
  });

  test("Fiji dollar with FJD$ prefix", () => {
    // Format: FJD$ 25.95
    const result = parsePriceString("FJD$ 25.95");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(25.95);
    expect(result.currency).toBe("FJD");
  });

  test("Vanuatu vatu with VT suffix, no cents", () => {
    // Format: 500 VT (no fractional part like yen)
    const result = parsePriceString("500 VT");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(500);
    expect(result.currency).toBe("VUV");
  });

  test("Jamaican dollar with comma thousands", () => {
    // Format: $12,500.00 (large numbers due to exchange rate)
    const result = parsePriceString("$12,500.00");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(12500);
    expect(result.currencyHints).toContain("JMD");
  });

  test("Bahamian dollar pegged 1:1 to USD", () => {
    // Format: $89.99
    const result = parsePriceString("$89.99");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(89.99);
    expect(result.currencyHints).toContain("BSD");
  });

  test("Mauritian rupee with Rs prefix", () => {
    // Format: Rs 14,990 (ambiguous with PKR, INR, etc.)
    const result = parsePriceString("Rs 14,990");

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.rawAmount).toBe(14990);
    expect(result.currencyHints).toContain("MUR");
  });

  test("Maldivian rufiyaa with Rf prefix", () => {
    // Format: Rf 1,200
    const result = parsePriceString("Rf 1,200");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1200);
    expect(result.currency).toBe("MVR");
  });

  test("Barbadian dollar with BDS$ prefix", () => {
    // Format: BDS$ 45.00
    const result = parsePriceString("BDS$ 45.00");

    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(45);
    expect(result.currency).toBe("BBD");
  });
});

describe("ISO 4217 Code Detection", () => {
  test("USD prefix with space", () => {
    const result = parsePriceString("USD 99.99");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(99.99);
    expect(result.currency).toBe("USD");
  });

  test("USD prefix without space", () => {
    const result = parsePriceString("USD99.99");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(99.99);
    expect(result.currency).toBe("USD");
  });

  test("USD suffix with space", () => {
    const result = parsePriceString("99.99 USD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(99.99);
    expect(result.currency).toBe("USD");
  });

  test("USD suffix without space", () => {
    const result = parsePriceString("99.99USD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(99.99);
    expect(result.currency).toBe("USD");
  });

  test("EUR prefix with space", () => {
    const result = parsePriceString("EUR 1,234.56");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1234.56);
    expect(result.currency).toBe("EUR");
  });

  test("EUR suffix with space", () => {
    const result = parsePriceString("1.234,56 EUR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1234.56);
    expect(result.currency).toBe("EUR");
  });

  test("GBP prefix with space", () => {
    const result = parsePriceString("GBP 500.00");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(500);
    expect(result.currency).toBe("GBP");
  });

  test("GBP suffix with space", () => {
    const result = parsePriceString("500.00 GBP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(500);
    expect(result.currency).toBe("GBP");
  });

  test("UAH prefix with space", () => {
    const result = parsePriceString("UAH 1500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1500);
    expect(result.currency).toBe("UAH");
  });

  test("UAH suffix with space", () => {
    const result = parsePriceString("1500 UAH");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1500);
    expect(result.currency).toBe("UAH");
  });

  test('UAH with "грн" symbol suffix', () => {
    const result = parsePriceString("2.30 грн");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(2.3);
    expect(result.currency).toBe("UAH");
  });

  test('UAH with "грн." symbol suffix (with dot)', () => {
    const result = parsePriceString("2.30 грн.");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(2.3);
    expect(result.currency).toBe("UAH");
  });

  test('UAH with "грн" symbol prefix', () => {
    const result = parsePriceString("грн 1500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1500);
    expect(result.currency).toBe("UAH");
  });

  test('UAH with "грн." symbol prefix (with dot)', () => {
    const result = parsePriceString("грн. 1500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1500);
    expect(result.currency).toBe("UAH");
  });

  test("JPY prefix with space", () => {
    const result = parsePriceString("JPY 15,800");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(15800);
    expect(result.currency).toBe("JPY");
  });

  test("JPY suffix with space", () => {
    const result = parsePriceString("15,800 JPY");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(15800);
    expect(result.currency).toBe("JPY");
  });

  test("CNY prefix with space", () => {
    const result = parsePriceString("CNY 399.00");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(399);
    expect(result.currency).toBe("CNY");
  });

  test("CNY suffix with space", () => {
    const result = parsePriceString("399.00 CNY");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(399);
    expect(result.currency).toBe("CNY");
  });

  test("QAR prefix with space", () => {
    const result = parsePriceString("QAR 250.00");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(250);
    expect(result.currency).toBe("QAR");
  });

  test("QAR suffix with space", () => {
    const result = parsePriceString("250.00 QAR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(250);
    expect(result.currency).toBe("QAR");
  });

  test("OMR prefix with space", () => {
    const result = parsePriceString("OMR 85.500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(85500);
    expect(result.currency).toBe("OMR");
  });

  test("OMR suffix with space", () => {
    const result = parsePriceString("85.500 OMR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(85500);
    expect(result.currency).toBe("OMR");
  });

  test("JOD prefix with space", () => {
    const result = parsePriceString("JOD 45.000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(45000);
    expect(result.currency).toBe("JOD");
  });

  test("JOD suffix with space", () => {
    const result = parsePriceString("45.000 JOD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(45000);
    expect(result.currency).toBe("JOD");
  });

  test("ETB prefix with space", () => {
    const result = parsePriceString("ETB 890");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(890);
    expect(result.currency).toBe("ETB");
  });

  test("ETB suffix with space", () => {
    const result = parsePriceString("890 ETB");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(890);
    expect(result.currency).toBe("ETB");
  });

  test("LBP prefix with space", () => {
    const result = parsePriceString("LBP 2,500,000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(2500000);
    expect(result.currency).toBe("LBP");
  });

  test("LBP suffix with space", () => {
    const result = parsePriceString("2,500,000 LBP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(2500000);
    expect(result.currency).toBe("LBP");
  });

  test("EGP prefix without space", () => {
    const result = parsePriceString("EGP8,900");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(8900);
    expect(result.currency).toBe("EGP");
  });

  test("EGP suffix without space", () => {
    const result = parsePriceString("8,900EGP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(8900);
    expect(result.currency).toBe("EGP");
  });

  test("PAB prefix with space", () => {
    const result = parsePriceString("PAB 125.00");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(125);
    expect(result.currency).toBe("PAB");
  });

  test("PAB suffix with space", () => {
    const result = parsePriceString("125.00 PAB");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(125);
    expect(result.currency).toBe("PAB");
  });

  test("MXN prefix with space", () => {
    const result = parsePriceString("MXN 599.00");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(599);
    expect(result.currency).toBe("MXN");
  });

  test("MXN suffix with space", () => {
    const result = parsePriceString("599.00 MXN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(599);
    expect(result.currency).toBe("MXN");
  });

  test("ARS prefix with space", () => {
    const result = parsePriceString("ARS 15.000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(15000);
    expect(result.currency).toBe("ARS");
  });

  test("ARS suffix with space", () => {
    const result = parsePriceString("15.000 ARS");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(15000);
    expect(result.currency).toBe("ARS");
  });

  test("CLP prefix with space", () => {
    const result = parsePriceString("CLP 25.990");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(25990);
    expect(result.currency).toBe("CLP");
  });

  test("CLP suffix with space", () => {
    const result = parsePriceString("25.990 CLP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(25990);
    expect(result.currency).toBe("CLP");
  });

  test("COP prefix with space", () => {
    const result = parsePriceString("COP 850.000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(850000);
    expect(result.currency).toBe("COP");
  });

  test("COP suffix with space", () => {
    const result = parsePriceString("850.000 COP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(850000);
    expect(result.currency).toBe("COP");
  });

  test("PEN prefix without space", () => {
    const result = parsePriceString("PEN129.90");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(129.9);
    expect(result.currency).toBe("PEN");
  });

  test("PEN suffix without space", () => {
    const result = parsePriceString("129.90PEN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(129.9);
    expect(result.currency).toBe("PEN");
  });

  test("UYU prefix with space", () => {
    const result = parsePriceString("UYU 3.500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(3500);
    expect(result.currency).toBe("UYU");
  });

  test("UYU suffix with space", () => {
    const result = parsePriceString("3.500 UYU");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(3500);
    expect(result.currency).toBe("UYU");
  });

  test("BOB prefix with space", () => {
    const result = parsePriceString("BOB 450");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(450);
    expect(result.currency).toBe("BOB");
  });

  test("BOB suffix with space", () => {
    const result = parsePriceString("450 BOB");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(450);
    expect(result.currency).toBe("BOB");
  });

  test("PGK prefix with space", () => {
    const result = parsePriceString("PGK 75.00");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(75);
    expect(result.currency).toBe("PGK");
  });

  test("PGK suffix with space", () => {
    const result = parsePriceString("75.00 PGK");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(75);
    expect(result.currency).toBe("PGK");
  });

  test("VUV prefix with space", () => {
    const result = parsePriceString("VUV 12000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(12000);
    expect(result.currency).toBe("VUV");
  });

  test("VUV suffix with space", () => {
    const result = parsePriceString("12000 VUV");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(12000);
    expect(result.currency).toBe("VUV");
  });

  test("MVR prefix with space", () => {
    const result = parsePriceString("MVR 850.00");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(850);
    expect(result.currency).toBe("MVR");
  });

  test("MVR suffix with space", () => {
    const result = parsePriceString("850.00 MVR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(850);
    expect(result.currency).toBe("MVR");
  });

  test("CHF prefix with space and comma decimal", () => {
    const result = parsePriceString("CHF 1.299,50");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1299.5);
    expect(result.currency).toBe("CHF");
  });

  test("CHF suffix with space and comma decimal", () => {
    const result = parsePriceString("1.299,50 CHF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(1299.5);
    expect(result.currency).toBe("CHF");
  });

  test("RUB prefix with space", () => {
    const result = parsePriceString("RUB 5 990");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(5990);
    expect(result.currency).toBe("RUB");
  });

  test("RUB suffix with space", () => {
    const result = parsePriceString("5 990 RUB");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(5990);
    expect(result.currency).toBe("RUB");
  });

  test("PLN prefix with space", () => {
    const result = parsePriceString("PLN 199,90");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(199.9);
    expect(result.currency).toBe("PLN");
  });

  test("PLN suffix with space", () => {
    const result = parsePriceString("199,90 PLN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(199.9);
    expect(result.currency).toBe("PLN");
  });

  test("CZK prefix with space", () => {
    const result = parsePriceString("CZK 2 499");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(2499);
    expect(result.currency).toBe("CZK");
  });

  test("CZK suffix with space", () => {
    const result = parsePriceString("2 499 CZK");
    expect(result.status).toBe("CONFIRMED");
    expect(result.rawAmount).toBe(2499);
    expect(result.currency).toBe("CZK");
  });

  // Additional comprehensive ISO code tests
  test("AED prefix", () => {
    const result = parsePriceString("AED 299");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AED");
  });

  test("AED suffix", () => {
    const result = parsePriceString("299 AED");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AED");
  });

  test("AFN prefix", () => {
    const result = parsePriceString("AFN 5000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AFN");
  });

  test("AFN suffix", () => {
    const result = parsePriceString("5000 AFN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AFN");
  });

  test("AMD prefix", () => {
    const result = parsePriceString("AMD 12000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AMD");
  });

  test("AMD suffix", () => {
    const result = parsePriceString("12000 AMD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AMD");
  });

  test("AOA prefix", () => {
    const result = parsePriceString("AOA 850");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AOA");
  });

  test("AOA suffix", () => {
    const result = parsePriceString("850 AOA");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AOA");
  });

  test("AWG prefix", () => {
    const result = parsePriceString("AWG 50");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AWG");
  });

  test("AWG suffix", () => {
    const result = parsePriceString("50 AWG");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AWG");
  });

  test("AZN prefix", () => {
    const result = parsePriceString("AZN 125");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AZN");
  });

  test("AZN suffix", () => {
    const result = parsePriceString("125 AZN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("AZN");
  });

  test("BAM prefix", () => {
    const result = parsePriceString("BAM 89.90");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BAM");
  });

  test("BAM suffix", () => {
    const result = parsePriceString("89.90 BAM");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BAM");
  });

  test("BDT prefix", () => {
    const result = parsePriceString("BDT 3500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BDT");
  });

  test("BDT suffix", () => {
    const result = parsePriceString("3500 BDT");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BDT");
  });

  test("BHD prefix", () => {
    const result = parsePriceString("BHD 25.500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BHD");
  });

  test("BHD suffix", () => {
    const result = parsePriceString("25.500 BHD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BHD");
  });

  test("BIF prefix", () => {
    const result = parsePriceString("BIF 5000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BIF");
  });

  test("BIF suffix", () => {
    const result = parsePriceString("5000 BIF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BIF");
  });

  test("BND prefix", () => {
    const result = parsePriceString("BND 12.50");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BND");
  });

  test("BND suffix", () => {
    const result = parsePriceString("12.50 BND");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BND");
  });

  test("BRL prefix", () => {
    const result = parsePriceString("BRL 89,90");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BRL");
  });

  test("BRL suffix", () => {
    const result = parsePriceString("89,90 BRL");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BRL");
  });

  test("BTN prefix", () => {
    const result = parsePriceString("BTN 450");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BTN");
  });

  test("BTN suffix", () => {
    const result = parsePriceString("450 BTN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BTN");
  });

  test("BWP prefix", () => {
    const result = parsePriceString("BWP 125");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BWP");
  });

  test("BWP suffix", () => {
    const result = parsePriceString("125 BWP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BWP");
  });

  test("BYN prefix", () => {
    const result = parsePriceString("BYN 85.50");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BYN");
  });

  test("BYN suffix", () => {
    const result = parsePriceString("85.50 BYN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BYN");
  });

  test("BZD prefix", () => {
    const result = parsePriceString("BZD 50");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BZD");
  });

  test("BZD suffix", () => {
    const result = parsePriceString("50 BZD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("BZD");
  });

  test("CDF prefix", () => {
    const result = parsePriceString("CDF 2500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("CDF");
  });

  test("CDF suffix", () => {
    const result = parsePriceString("2500 CDF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("CDF");
  });

  test("CUP prefix", () => {
    const result = parsePriceString("CUP 125");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("CUP");
  });

  test("CUP suffix", () => {
    const result = parsePriceString("125 CUP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("CUP");
  });

  test("CVE prefix", () => {
    const result = parsePriceString("CVE 850");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("CVE");
  });

  test("CVE suffix", () => {
    const result = parsePriceString("850 CVE");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("CVE");
  });

  test("DJF prefix", () => {
    const result = parsePriceString("DJF 1200");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("DJF");
  });

  test("DJF suffix", () => {
    const result = parsePriceString("1200 DJF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("DJF");
  });

  test("DKK prefix", () => {
    const result = parsePriceString("DKK 249");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("DKK");
  });

  test("DKK suffix", () => {
    const result = parsePriceString("249 DKK");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("DKK");
  });

  test("DOP prefix", () => {
    const result = parsePriceString("DOP 1500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("DOP");
  });

  test("DOP suffix", () => {
    const result = parsePriceString("1500 DOP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("DOP");
  });

  test("DZD prefix", () => {
    const result = parsePriceString("DZD 3500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("DZD");
  });

  test("DZD suffix", () => {
    const result = parsePriceString("3500 DZD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("DZD");
  });

  test("ERN prefix", () => {
    const result = parsePriceString("ERN 450");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ERN");
  });

  test("ERN suffix", () => {
    const result = parsePriceString("450 ERN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ERN");
  });

  test("FJD prefix", () => {
    const result = parsePriceString("FJD 89.50");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("FJD");
  });

  test("FJD suffix", () => {
    const result = parsePriceString("89.50 FJD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("FJD");
  });

  test("FKP prefix", () => {
    const result = parsePriceString("FKP 25");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("FKP");
  });

  test("FKP suffix", () => {
    const result = parsePriceString("25 FKP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("FKP");
  });

  test("GEL prefix", () => {
    const result = parsePriceString("GEL 125");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GEL");
  });

  test("GEL suffix", () => {
    const result = parsePriceString("125 GEL");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GEL");
  });

  test("GHS prefix", () => {
    const result = parsePriceString("GHS 550");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GHS");
  });

  test("GHS suffix", () => {
    const result = parsePriceString("550 GHS");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GHS");
  });

  test("GIP prefix", () => {
    const result = parsePriceString("GIP 45");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GIP");
  });

  test("GIP suffix", () => {
    const result = parsePriceString("45 GIP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GIP");
  });

  test("GMD prefix", () => {
    const result = parsePriceString("GMD 750");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GMD");
  });

  test("GMD suffix", () => {
    const result = parsePriceString("750 GMD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GMD");
  });

  test("GNF prefix", () => {
    const result = parsePriceString("GNF 9000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GNF");
  });

  test("GNF suffix", () => {
    const result = parsePriceString("9000 GNF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GNF");
  });

  test("GTQ prefix", () => {
    const result = parsePriceString("GTQ 550");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GTQ");
  });

  test("GTQ suffix", () => {
    const result = parsePriceString("550 GTQ");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GTQ");
  });

  test("GYD prefix", () => {
    const result = parsePriceString("GYD 1500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GYD");
  });

  test("GYD suffix", () => {
    const result = parsePriceString("1500 GYD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("GYD");
  });

  test("HKD prefix", () => {
    const result = parsePriceString("HKD 250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("HKD");
  });

  test("HKD suffix", () => {
    const result = parsePriceString("250 HKD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("HKD");
  });

  test("HNL prefix", () => {
    const result = parsePriceString("HNL 450");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("HNL");
  });

  test("HNL suffix", () => {
    const result = parsePriceString("450 HNL");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("HNL");
  });

  test("HTG prefix", () => {
    const result = parsePriceString("HTG 3500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("HTG");
  });

  test("HTG suffix", () => {
    const result = parsePriceString("3500 HTG");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("HTG");
  });

  test("HUF prefix", () => {
    const result = parsePriceString("HUF 12500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("HUF");
  });

  test("HUF suffix", () => {
    const result = parsePriceString("12500 HUF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("HUF");
  });

  test("IDR prefix", () => {
    const result = parsePriceString("IDR 125000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("IDR");
  });

  test("IDR suffix", () => {
    const result = parsePriceString("125000 IDR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("IDR");
  });

  test("ILS prefix", () => {
    const result = parsePriceString("ILS 350");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ILS");
  });

  test("ILS suffix", () => {
    const result = parsePriceString("350 ILS");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ILS");
  });

  test("INR prefix", () => {
    const result = parsePriceString("INR 2500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("INR");
  });

  test("INR suffix", () => {
    const result = parsePriceString("2500 INR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("INR");
  });

  test("IQD prefix", () => {
    const result = parsePriceString("IQD 45000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("IQD");
  });

  test("IQD suffix", () => {
    const result = parsePriceString("45000 IQD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("IQD");
  });

  test("IRR prefix", () => {
    const result = parsePriceString("IRR 250000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("IRR");
  });

  test("IRR suffix", () => {
    const result = parsePriceString("250000 IRR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("IRR");
  });

  test("ISK prefix", () => {
    const result = parsePriceString("ISK 12500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ISK");
  });

  test("ISK suffix", () => {
    const result = parsePriceString("12500 ISK");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ISK");
  });

  test("JMD prefix", () => {
    const result = parsePriceString("JMD 8500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("JMD");
  });

  test("JMD suffix", () => {
    const result = parsePriceString("8500 JMD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("JMD");
  });

  test("KES prefix", () => {
    const result = parsePriceString("KES 5500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KES");
  });

  test("KES suffix", () => {
    const result = parsePriceString("5500 KES");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KES");
  });

  test("KGS prefix", () => {
    const result = parsePriceString("KGS 1200");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KGS");
  });

  test("KGS suffix", () => {
    const result = parsePriceString("1200 KGS");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KGS");
  });

  test("KHR prefix", () => {
    const result = parsePriceString("KHR 125000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KHR");
  });

  test("KHR suffix", () => {
    const result = parsePriceString("125000 KHR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KHR");
  });

  test("KMF prefix", () => {
    const result = parsePriceString("KMF 12500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KMF");
  });

  test("KMF suffix", () => {
    const result = parsePriceString("12500 KMF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KMF");
  });

  test("KPW prefix", () => {
    const result = parsePriceString("KPW 5000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KPW");
  });

  test("KPW suffix", () => {
    const result = parsePriceString("5000 KPW");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KPW");
  });

  test("KRW prefix", () => {
    const result = parsePriceString("KRW 45000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KRW");
  });

  test("KRW suffix", () => {
    const result = parsePriceString("45000 KRW");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KRW");
  });

  test("KWD prefix", () => {
    const result = parsePriceString("KWD 125.500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KWD");
  });

  test("KWD suffix", () => {
    const result = parsePriceString("125.500 KWD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KWD");
  });

  test("KYD prefix", () => {
    const result = parsePriceString("KYD 85");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KYD");
  });

  test("KYD suffix", () => {
    const result = parsePriceString("85 KYD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KYD");
  });

  test("KZT prefix", () => {
    const result = parsePriceString("KZT 55000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KZT");
  });

  test("KZT suffix", () => {
    const result = parsePriceString("55000 KZT");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("KZT");
  });

  test("LAK prefix", () => {
    const result = parsePriceString("LAK 125000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("LAK");
  });

  test("LAK suffix", () => {
    const result = parsePriceString("125000 LAK");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("LAK");
  });

  test("LKR prefix", () => {
    const result = parsePriceString("LKR 12500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("LKR");
  });

  test("LKR suffix", () => {
    const result = parsePriceString("12500 LKR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("LKR");
  });

  test("LRD prefix", () => {
    const result = parsePriceString("LRD 550");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("LRD");
  });

  test("LRD suffix", () => {
    const result = parsePriceString("550 LRD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("LRD");
  });

  test("LSL prefix", () => {
    const result = parsePriceString("LSL 250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("LSL");
  });

  test("LSL suffix", () => {
    const result = parsePriceString("250 LSL");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("LSL");
  });

  test("LYD prefix", () => {
    const result = parsePriceString("LYD 450");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("LYD");
  });

  test("LYD suffix", () => {
    const result = parsePriceString("450 LYD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("LYD");
  });

  test("MAD prefix", () => {
    const result = parsePriceString("MAD 850");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MAD");
  });

  test("MAD suffix", () => {
    const result = parsePriceString("850 MAD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MAD");
  });

  test("MDL prefix", () => {
    const result = parsePriceString("MDL 550");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MDL");
  });

  test("MDL suffix", () => {
    const result = parsePriceString("550 MDL");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MDL");
  });

  test("MGA prefix", () => {
    const result = parsePriceString("MGA 125000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MGA");
  });

  test("MGA suffix", () => {
    const result = parsePriceString("125000 MGA");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MGA");
  });

  test("MKD prefix", () => {
    const result = parsePriceString("MKD 1200");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MKD");
  });

  test("MKD suffix", () => {
    const result = parsePriceString("1200 MKD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MKD");
  });

  test("MMK prefix", () => {
    const result = parsePriceString("MMK 55000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MMK");
  });

  test("MMK suffix", () => {
    const result = parsePriceString("55000 MMK");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MMK");
  });

  test("MNT prefix", () => {
    const result = parsePriceString("MNT 125000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MNT");
  });

  test("MNT suffix", () => {
    const result = parsePriceString("125000 MNT");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MNT");
  });

  test("MOP prefix", () => {
    const result = parsePriceString("MOP 250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MOP");
  });

  test("MOP suffix", () => {
    const result = parsePriceString("250 MOP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MOP");
  });

  test("MRU prefix", () => {
    const result = parsePriceString("MRU 850");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MRU");
  });

  test("MRU suffix", () => {
    const result = parsePriceString("850 MRU");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MRU");
  });

  test("MUR prefix", () => {
    const result = parsePriceString("MUR 12500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MUR");
  });

  test("MUR suffix", () => {
    const result = parsePriceString("12500 MUR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MUR");
  });

  test("MWK prefix", () => {
    const result = parsePriceString("MWK 25000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MWK");
  });

  test("MWK suffix", () => {
    const result = parsePriceString("25000 MWK");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MWK");
  });

  test("MYR prefix", () => {
    const result = parsePriceString("MYR 450");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MYR");
  });

  test("MYR suffix", () => {
    const result = parsePriceString("450 MYR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MYR");
  });

  test("MZN prefix", () => {
    const result = parsePriceString("MZN 1500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MZN");
  });

  test("MZN suffix", () => {
    const result = parsePriceString("1500 MZN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("MZN");
  });

  test("NAD prefix", () => {
    const result = parsePriceString("NAD 550");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("NAD");
  });

  test("NAD suffix", () => {
    const result = parsePriceString("550 NAD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("NAD");
  });

  test("NGN prefix", () => {
    const result = parsePriceString("NGN 25000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("NGN");
  });

  test("NGN suffix", () => {
    const result = parsePriceString("25000 NGN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("NGN");
  });

  test("NIO prefix", () => {
    const result = parsePriceString("NIO 850");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("NIO");
  });

  test("NIO suffix", () => {
    const result = parsePriceString("850 NIO");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("NIO");
  });

  test("NOK prefix", () => {
    const result = parsePriceString("NOK 1250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("NOK");
  });

  test("NOK suffix", () => {
    const result = parsePriceString("1250 NOK");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("NOK");
  });

  test("NPR prefix", () => {
    const result = parsePriceString("NPR 4500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("NPR");
  });

  test("NPR suffix", () => {
    const result = parsePriceString("4500 NPR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("NPR");
  });

  test("PHP prefix", () => {
    const result = parsePriceString("PHP 2500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("PHP");
  });

  test("PHP suffix", () => {
    const result = parsePriceString("2500 PHP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("PHP");
  });

  test("PKR prefix", () => {
    const result = parsePriceString("PKR 15000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("PKR");
  });

  test("PKR suffix", () => {
    const result = parsePriceString("15000 PKR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("PKR");
  });

  test("PYG prefix", () => {
    const result = parsePriceString("PYG 250000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("PYG");
  });

  test("PYG suffix", () => {
    const result = parsePriceString("250000 PYG");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("PYG");
  });

  test("RON prefix", () => {
    const result = parsePriceString("RON 450");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("RON");
  });

  test("RON suffix", () => {
    const result = parsePriceString("450 RON");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("RON");
  });

  test("RSD prefix", () => {
    const result = parsePriceString("RSD 12500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("RSD");
  });

  test("RSD suffix", () => {
    const result = parsePriceString("12500 RSD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("RSD");
  });

  test("RWF prefix", () => {
    const result = parsePriceString("RWF 8500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("RWF");
  });

  test("RWF suffix", () => {
    const result = parsePriceString("8500 RWF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("RWF");
  });

  test("SAR prefix", () => {
    const result = parsePriceString("SAR 1250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SAR");
  });

  test("SAR suffix", () => {
    const result = parsePriceString("1250 SAR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SAR");
  });

  test("SBD prefix", () => {
    const result = parsePriceString("SBD 85");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SBD");
  });

  test("SBD suffix", () => {
    const result = parsePriceString("85 SBD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SBD");
  });

  test("SCR prefix", () => {
    const result = parsePriceString("SCR 550");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SCR");
  });

  test("SCR suffix", () => {
    const result = parsePriceString("550 SCR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SCR");
  });

  test("SDG prefix", () => {
    const result = parsePriceString("SDG 2500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SDG");
  });

  test("SDG suffix", () => {
    const result = parsePriceString("2500 SDG");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SDG");
  });

  test("SEK prefix", () => {
    const result = parsePriceString("SEK 1250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SEK");
  });

  test("SEK suffix", () => {
    const result = parsePriceString("1250 SEK");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SEK");
  });

  test("SGD prefix", () => {
    const result = parsePriceString("SGD 125");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SGD");
  });

  test("SGD suffix", () => {
    const result = parsePriceString("125 SGD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SGD");
  });

  test("SHP prefix", () => {
    const result = parsePriceString("SHP 45");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SHP");
  });

  test("SHP suffix", () => {
    const result = parsePriceString("45 SHP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SHP");
  });

  test("SLE prefix", () => {
    const result = parsePriceString("SLE 5500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SLE");
  });

  test("SLE suffix", () => {
    const result = parsePriceString("5500 SLE");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SLE");
  });

  test("SOS prefix", () => {
    const result = parsePriceString("SOS 25000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SOS");
  });

  test("SOS suffix", () => {
    const result = parsePriceString("25000 SOS");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SOS");
  });

  test("SRD prefix", () => {
    const result = parsePriceString("SRD 350");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SRD");
  });

  test("SRD suffix", () => {
    const result = parsePriceString("350 SRD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SRD");
  });

  test("SSP prefix", () => {
    const result = parsePriceString("SSP 8500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SSP");
  });

  test("SSP suffix", () => {
    const result = parsePriceString("8500 SSP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SSP");
  });

  test("STN prefix", () => {
    const result = parsePriceString("STN 750");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("STN");
  });

  test("STN suffix", () => {
    const result = parsePriceString("750 STN");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("STN");
  });

  test("SVC prefix", () => {
    const result = parsePriceString("SVC 45");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SVC");
  });

  test("SVC suffix", () => {
    const result = parsePriceString("45 SVC");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SVC");
  });

  test("SYP prefix", () => {
    const result = parsePriceString("SYP 125000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SYP");
  });

  test("SYP suffix", () => {
    const result = parsePriceString("125000 SYP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SYP");
  });

  test("SZL prefix", () => {
    const result = parsePriceString("SZL 350");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SZL");
  });

  test("SZL suffix", () => {
    const result = parsePriceString("350 SZL");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("SZL");
  });

  test("THB prefix", () => {
    const result = parsePriceString("THB 1250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("THB");
  });

  test("THB suffix", () => {
    const result = parsePriceString("1250 THB");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("THB");
  });

  test("TJS prefix", () => {
    const result = parsePriceString("TJS 450");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TJS");
  });

  test("TJS suffix", () => {
    const result = parsePriceString("450 TJS");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TJS");
  });

  test("TMT prefix", () => {
    const result = parsePriceString("TMT 125");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TMT");
  });

  test("TMT suffix", () => {
    const result = parsePriceString("125 TMT");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TMT");
  });

  test("TND prefix", () => {
    const result = parsePriceString("TND 250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TND");
  });

  test("TND suffix", () => {
    const result = parsePriceString("250 TND");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TND");
  });

  test("TOP prefix", () => {
    const result = parsePriceString("TOP 85");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TOP");
  });

  test("TOP suffix", () => {
    const result = parsePriceString("85 TOP");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TOP");
  });

  test("TRY prefix", () => {
    const result = parsePriceString("TRY 850");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TRY");
  });

  test("TRY suffix", () => {
    const result = parsePriceString("850 TRY");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TRY");
  });

  test("TTD prefix", () => {
    const result = parsePriceString("TTD 250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TTD");
  });

  test("TTD suffix", () => {
    const result = parsePriceString("250 TTD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TTD");
  });

  test("TWD prefix", () => {
    const result = parsePriceString("TWD 1250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TWD");
  });

  test("TWD suffix", () => {
    const result = parsePriceString("1250 TWD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TWD");
  });

  test("TZS prefix", () => {
    const result = parsePriceString("TZS 125000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TZS");
  });

  test("TZS suffix", () => {
    const result = parsePriceString("125000 TZS");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("TZS");
  });

  test("UGX prefix", () => {
    const result = parsePriceString("UGX 125000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("UGX");
  });

  test("UGX suffix", () => {
    const result = parsePriceString("125000 UGX");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("UGX");
  });

  test("UZS prefix", () => {
    const result = parsePriceString("UZS 450000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("UZS");
  });

  test("UZS suffix", () => {
    const result = parsePriceString("450000 UZS");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("UZS");
  });

  test("VES prefix", () => {
    const result = parsePriceString("VES 1250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("VES");
  });

  test("VES suffix", () => {
    const result = parsePriceString("1250 VES");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("VES");
  });

  test("VND prefix", () => {
    const result = parsePriceString("VND 125000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("VND");
  });

  test("VND suffix", () => {
    const result = parsePriceString("125000 VND");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("VND");
  });

  test("WST prefix", () => {
    const result = parsePriceString("WST 125");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("WST");
  });

  test("WST suffix", () => {
    const result = parsePriceString("125 WST");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("WST");
  });

  test("XAF prefix", () => {
    const result = parsePriceString("XAF 25000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("XAF");
  });

  test("XAF suffix", () => {
    const result = parsePriceString("25000 XAF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("XAF");
  });

  test("XCD prefix", () => {
    const result = parsePriceString("XCD 125");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("XCD");
  });

  test("XCD suffix", () => {
    const result = parsePriceString("125 XCD");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("XCD");
  });

  test("XOF prefix", () => {
    const result = parsePriceString("XOF 25000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("XOF");
  });

  test("XOF suffix", () => {
    const result = parsePriceString("25000 XOF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("XOF");
  });

  test("XPF prefix", () => {
    const result = parsePriceString("XPF 12500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("XPF");
  });

  test("XPF suffix", () => {
    const result = parsePriceString("12500 XPF");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("XPF");
  });

  test("YER prefix", () => {
    const result = parsePriceString("YER 125000");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("YER");
  });

  test("YER suffix", () => {
    const result = parsePriceString("125000 YER");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("YER");
  });

  test("ZAR prefix", () => {
    const result = parsePriceString("ZAR 1250");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ZAR");
  });

  test("ZAR suffix", () => {
    const result = parsePriceString("1250 ZAR");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ZAR");
  });

  test("ZMW prefix", () => {
    const result = parsePriceString("ZMW 850");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ZMW");
  });

  test("ZMW suffix", () => {
    const result = parsePriceString("850 ZMW");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ZMW");
  });

  test("ZWG prefix", () => {
    const result = parsePriceString("ZWG 12500");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ZWG");
  });

  test("ZWG suffix", () => {
    const result = parsePriceString("12500 ZWG");
    expect(result.status).toBe("CONFIRMED");
    expect(result.currency).toBe("ZWG");
  });
});
