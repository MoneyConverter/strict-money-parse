# Real-World HTML Tests

This document describes the comprehensive real-world testing conducted for `strict-money-parse`.

## Table of Contents

- [Overview](#overview)
- [Testing Methodology](#testing-methodology)
  - [Data Collection](#data-collection)
  - [Test Coverage](#test-coverage)
- [Test Structure](#test-structure)
  - [Real-World Examples (105 tests)](#real-world-examples-105-tests)
  - [ISO 4217 Comprehensive Tests (292 tests)](#iso-4217-comprehensive-tests-292-tests)
- [Example Test Cases](#example-test-cases)
  - [European Formats](#european-formats)
  - [Asian Formats](#asian-formats)
  - [Latin American Formats](#latin-american-formats)
  - [African Formats](#african-formats)
- [HTML Parsing Examples](#html-parsing-examples)
- [Special Cases Tested](#special-cases-tested)
- [Known Limitations](#known-limitations)
- [Test Statistics](#test-statistics)
- [Running Tests](#running-tests)
- [Contributing Test Cases](#contributing-test-cases)
- [Data Sources](#data-sources)

---

## Overview

The `test/integration/real-world-html.test.ts` file contains **397 test cases** derived from actual HTML snippets and price formats collected from e-commerce websites across **40+ countries**. These tests ensure that the parser accurately handles real-world variations in price presentation.

---

## Testing Methodology

### Data Collection

Real price formats were manually collected from:
- **E-commerce platforms:** Amazon (10+ regions), eBay, AliExpress, Mercado Libre, Flipkart, Tokopedia, Lazada, Shopee
- **Regional retailers:** Otto.de, Zalando, Allegro.pl, eMag.ro, Jumia, Noon.com
- **Time period:** 2024-2025
- **Method:** Manual inspection of HTML source code and rendered prices

### Test Coverage

#### Geographic Coverage (40+ Countries)

**Americas (15 countries)**
- USA, Canada, Mexico, Brazil, Argentina, Chile, Colombia, Peru, Uruguay, Bolivia, Guatemala, Dominican Republic, Jamaica, Bahamas, Barbados

**Europe (12 countries)**
- Germany, UK, France, Spain, Italy, Poland, Czech Republic, Switzerland, Sweden, Norway, Denmark, Hungary, Romania, Bulgaria, Greece, Albania

**Asia (13 countries)**
- Japan, China, South Korea, India, Indonesia, Thailand, Vietnam, Kazakhstan, Uzbekistan, Armenia, Israel, Georgia, Azerbaijan, Pakistan

**Africa (8 countries)**
- South Africa, Nigeria, Kenya, Ghana, Morocco, Algeria, Tunisia, Ethiopia

**Oceania (6 countries)**
- Australia, New Zealand, Papua New Guinea, Fiji, Vanuatu, Maldives

#### Format Coverage

✅ **Number Formats**
- US format: `1,234.56` (comma thousands, dot decimal)
- EU format: `1.234,56` (dot thousands, comma decimal)
- Space format: `1 234,56` (space thousands)
- Swiss format: `1'234.56` (apostrophe thousands)
- Czech special: `1 234,—` (dash for zero cents)
- Danish special: `1 234:-` (colon-dash for zero)

✅ **Currency Symbols**
- 75+ unique currency symbols
- Unicode symbols: €, £, $, ¥, ₴, ₸, ₹, ₽, ₪, ฿, ₫, ₱, ₩, ₺, etc.
- ASCII variants: Rp, RM, KSh, Kč, zł, Ft, лв, TL, Q, S/, etc.
- Prefixed forms: US$, CA$, AU$, HK$, NT$, R$, etc.

✅ **ISO 4217 Codes**
- All 181 active currency codes
- Prefix position: `USD 99.99`
- Suffix position: `99.99 EUR`
- With/without spaces: `USD99.99` vs `USD 99.99`

✅ **HTML Variations**
- Plain text: `€99.99`
- HTML entities: `&euro;99.99`
- Nested tags: `<span>€</span>99.99`
- Attributes: `<span class="price">€99.99</span>`
- Complex nesting: `<div><strong>Price: <em>€99.99</em></strong></div>`

---

## Test Structure

### Real-World Examples (105 tests)

These tests use actual HTML snippets from real websites:

```typescript
test("Germany - Amazon.de", () => {
  const result = parsePriceString('<span class="price">1.234,56 €</span>');
  expect(result.status).toBe("CONFIRMED");
  expect(result.rawAmount).toBe(1234.56);
  expect(result.currency).toBe("EUR");
});
```

**Categories:**
- Basic prices: Simple currency + amount patterns
- HTML tags: Prices wrapped in various HTML elements
- Complex formats: Multiple separators, special characters
- Regional variants: Country-specific formatting conventions

### ISO 4217 Comprehensive Tests (292 tests)

All 181 ISO currency codes tested in both positions:

```typescript
test("AED (United Arab Emirates Dirham) - prefix", () => {
  const result = parsePriceString("AED 1234.56");
  expect(result.currency).toBe("AED");
  expect(result.rawAmount).toBe(1234.56);
});

test("AED (United Arab Emirates Dirham) - suffix", () => {
  const result = parsePriceString("1234.56 AED");
  expect(result.currency).toBe("AED");
  expect(result.rawAmount).toBe(1234.56);
});
```

**Tested codes include:**
- Major currencies: USD, EUR, GBP, JPY, CNY, CHF, CAD, AUD
- Regional currencies: XAF, XOF, XPF (African/Pacific CFA francs)
- Commodity codes: XAU (Gold), XAG (Silver), XPT (Platinum), XPD (Palladium)
- Special codes: XDR (IMF Special Drawing Rights)
- All 181 official ISO 4217 codes

---

## Example Test Cases

### European Formats

```typescript
// German (dot thousands, comma decimal)
parsePriceString("1.234,56 €") → 1234.56 EUR

// Swiss (apostrophe thousands)
parsePriceString("CHF 1'234.56") → 1234.56 CHF

// Czech (dash for zero cents)
parsePriceString("1 234,— Kč") → 1234 CZK

// Danish (colon-dash for zero)
parsePriceString("1.234,- kr") → 1234 DKK
```

### Asian Formats

```typescript
// Japanese (yen with kanji)
parsePriceString("¥1,234 円") → 1234 JPY

// Indian (lakh separator)
parsePriceString("₹12,34,567.00") → 1234567 INR

// Indonesian (dot thousands)
parsePriceString("Rp 125.000") → 125000 IDR

// Thai (baht symbol)
parsePriceString("฿1,234.56") → 1234.56 THB
```

### Latin American Formats

```typescript
// Brazilian (R$ prefix)
parsePriceString("R$ 1.234,56") → 1234.56 BRL

// Mexican (dollar sign)
parsePriceString("$1,234.56 MXN") → 1234.56 MXN

// Argentine (dollar sign, EU format)
parsePriceString("$1.234,56 ARS") → 1234.56 ARS

// Chilean (CLP with dot separator)
parsePriceString("$123.456 CLP") → 123456 CLP
```

### African Formats

```typescript
// South African (Rand)
parsePriceString("R 1,234.56") → 1234.56 ZAR

// Kenyan (KSh prefix)
parsePriceString("KSh 1,234.56") → 1234.56 KES

// Nigerian (Naira symbol)
parsePriceString("₦1,234.56") → 1234.56 NGN

// Moroccan (DH suffix)
parsePriceString("1.234,56 DH") → 1234.56 MAD
```

---

## HTML Parsing Examples

### Simple HTML

```typescript
parsePriceString('<span class="price">€99.99</span>')
// → { status: 'CONFIRMED', rawAmount: 99.99, currency: 'EUR' }
```

### Nested HTML

```typescript
parsePriceString('<div>Price: <strong>$1,234.56</strong></div>')
// → { status: 'CONFIRMED', rawAmount: 1234.56, currency: 'USD' }
```

### HTML Entities

```typescript
parsePriceString('&euro;1.234,56')
// → { status: 'CONFIRMED', rawAmount: 1234.56, currency: 'EUR' }
```

### Complex Nesting

```typescript
parsePriceString('<span class="currency">€</span><span class="amount">1.234,56</span>')
// → { status: 'CONFIRMED', rawAmount: 1234.56, currency: 'EUR' }
```

---

## Special Cases Tested

### Ambiguous Symbols

```typescript
// Dollar without context → AMBIGUOUS
parsePriceString("$99.99")
// → { status: 'AMBIGUOUS', currencyHints: ['USD', 'CAD', 'AUD', ...] }

// Prefixed dollar → CONFIRMED
parsePriceString("CA$ 99.99")
// → { status: 'CONFIRMED', currency: 'CAD' }
```

### Zero Cents Representations

```typescript
// Czech dash
parsePriceString("1 234,— Kč") → 1234 CZK

// Danish colon-dash
parsePriceString("1.234,- kr") → 1234 DKK

// Norwegian em-dash
parsePriceString("1 234— kr") → 1234 NOK
```

### Large Numbers

```typescript
parsePriceString("€123,456,789.12") → 123456789.12 EUR
parsePriceString("1.234.567,89 €") → 1234567.89 EUR
```

### Small Numbers

```typescript
parsePriceString("€0.01") → 0.01 EUR
parsePriceString("0,99 €") → 0.99 EUR
```

---

## Known Limitations

### Not Covered (Intentional Scope Limits)

❌ **Historical currencies** (pre-Euro: DEM, FRF, ITL, etc.)
❌ **Cryptocurrency symbols** (₿, Ξ, Ɖ)
❌ **Multiple prices in one string** (extracts first match only)
❌ **Price ranges** ("$10-$20" filtered as false positive)
❌ **Text-based amounts** ("ten dollars")
❌ **RTL languages** (Arabic/Hebrew formatting)

### Edge Cases

⚠️ **Three-digit ambiguity:** `1.234` or `1,234` treated as thousands (1234), not decimals (1.234)
⚠️ **Ambiguous symbols:** `$`, `£`, `¥`, `kr` without context return AMBIGUOUS status
⚠️ **False positives:** Phone numbers, dates, years, percentages actively filtered

---

## Test Statistics

- **Total tests:** 397 in real-world-html.test.ts
- **Real-world examples:** 105 tests
- **ISO 4217 coverage:** 292 tests (181 codes × 2 positions, except BGN)
- **Geographic coverage:** 40+ countries
- **Currency symbols:** 75+ unique symbols
- **Number formats:** 10+ regional variations
- **HTML patterns:** 20+ different structures

---

## Running Tests

### With npm/yarn/pnpm

```bash
# Run all real-world tests
npm test test/integration/real-world-html.test.ts
npx vitest run test/integration/real-world-html.test.ts

# Run with coverage
npm run test:coverage test/integration/real-world-html.test.ts
npx vitest run --coverage test/integration/real-world-html.test.ts

# Watch mode
npx vitest watch test/integration/real-world-html.test.ts
```

### With Bun

```bash
# Run all real-world tests
bun test test/integration/real-world-html.test.ts

# Run with coverage
bun test --coverage test/integration/real-world-html.test.ts

# Watch mode
bun test --watch test/integration/real-world-html.test.ts
```

---

## Contributing Test Cases

To add new real-world test cases:

1. **Collect price HTML** from a public website
2. **Verify the format** manually
3. **Add test case** to `test/integration/real-world-html.test.ts`
4. **Document source** in comments

Example:

```typescript
test("New Country - Website.com", () => {
  // Source: https://example.com/product/123 (2025-01-02)
  const html = '<span class="price">1.234,56 €</span>';
  const result = parsePriceString(html);
  expect(result.status).toBe("CONFIRMED");
  expect(result.rawAmount).toBe(1234.56);
  expect(result.currency).toBe("EUR");
});
```

---

## Data Sources

All test data collected from publicly accessible websites during 2024-2025. No proprietary or private data is included. Only price format patterns are used for testing purposes under fair use doctrine.

---

**Last Updated:** January 2, 2026
