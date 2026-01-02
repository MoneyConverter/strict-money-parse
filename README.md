# strict-money-parse

[![npm version](https://img.shields.io/npm/v/strict-money-parse.svg?style=flat-square)](https://www.npmjs.com/package/strict-money-parse)
[![npm downloads](https://img.shields.io/npm/dm/strict-money-parse.svg?style=flat-square)](https://www.npmjs.com/package/strict-money-parse)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/strict-money-parse?style=flat-square)](https://bundlephobia.com/package/strict-money-parse)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-99.2%25-brightgreen?style=flat-square)](https://github.com/MoneyConverter/strict-money-parse)
[![Build Status](https://img.shields.io/github/actions/workflow/status/MoneyConverter/strict-money-parse/ci.yml?style=flat-square)](https://github.com/MoneyConverter/strict-money-parse/actions)

**A production-ready TypeScript library for parsing monetary values from real-world strings with evidence-based currency detection.**

_Originally developed for [MoneyConvert.net](https://moneyconvert.net/) — a currency conversion service._

Zero runtime dependencies • Fully typed • Extensively tested against real e-commerce data from 40+ countries • Only **3.82 kB gzipped** (ESM) / **2.92 kB** (CJS)

## 📑 Table of Contents

- [🌍 Battle-Tested with Real-World Data](#-battle-tested-with-real-world-data)
- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [📖 API Reference](#-api-reference)
- [💡 Usage Examples](#-usage-examples)
   - [European Number Formats](#european-number-formats)
   - [Asian Currencies](#asian-currencies)
   - [Handling Ambiguous Symbols](#handling-ambiguous-symbols)
   - [ISO 4217 Code Detection](#iso-4217-code-detection)
   - [False Positive Prevention](#false-positive-prevention)
   - [HTML Content Parsing](#html-content-parsing)

- [🔍 Advanced API](#-advanced-api)
- [🧮 Number Format Detection](#-number-format-detection)
- [🗂️ Project Structure](#️-project-structure)
- [🧪 Testing Methodology](#-testing-methodology)
- [📊 Data Sources & Methodology](#-data-sources--methodology)
- [�� Design Principles](#-design-principles)
- [📈 Performance](#-performance)
- [🛠️ Development](#️-development)
- [📝 License](#-license)
- [🤝 Contributing](#-contributing)
- [🙏 Acknowledgments](#-acknowledgments)
- [📞 Support](#-support)
- [🗺️ Roadmap](#️-roadmap)

---

---

## 🌍 Battle-Tested with Real-World Data

We've conducted **extensive testing** with actual HTML snippets and price formats from e-commerce sites across **40+ countries**, including:

- 🇺🇸 **Americas:** USA, Canada, Mexico, Brazil, Argentina, Chile, Colombia, Peru, Uruguay, Bolivia, Guatemala, Dominican Republic, Jamaica, Bahamas, Barbados
- 🇪🇺 **Europe:** Germany, UK, France, Spain, Italy, Poland, Czech Republic, Switzerland, Sweden, Norway, Denmark, Hungary, Romania, Bulgaria, Greece, Albania
- 🇦🇸 **Asia:** Japan, China, South Korea, India, Indonesia, Thailand, Vietnam, Kazakhstan, Uzbekistan, Armenia, Israel, Georgia, Azerbaijan, Pakistan
- 🇿🇦 **Africa:** South Africa, Nigeria, Kenya, Ghana, Morocco, Algeria, Tunisia, Ethiopia
- 🇦🇺 **Oceania:** Australia, New Zealand, Papua New Guinea, Fiji, Vanuatu, Maldives

**540+ test cases** covering edge cases, ambiguous symbols, regional formatting, and all 181 ISO 4217 currency codes.

---

## ✨ Features

- ✅ **Zero Dependencies** – No external runtime dependencies, minimal bundle size
- ✅ **Evidence-Based Detection** – Provides proof of currency detection with confidence levels
- ✅ **Global Format Support** – Handles comma/dot decimals, space separators, European formats (\`.-\`, \`—\`, \`:-\`)
- ✅ **181 ISO 4217 Codes** – Complete support for all official currency codes
- ✅ **75+ Currency Symbols** – Including Unicode symbols (€, ₴, ₸, ₪, ฿, ₫, Rp, KSh, Kč, zł, TL, etc.)
- ✅ **Ambiguity Resolution** – Smart handling of \`$\`, \`£\`, \`¥\`, \`kr\`, \`Lei\`, \`Rs\`, \`р.\`, \`Fr\` symbols
- ✅ **False Positive Prevention** – Filters out phone numbers, dates, years, percentages, ranges, dimensions
- ✅ **Fully Typed** – Complete TypeScript support with strict types
- ✅ **Production-Ready** – 99.2% test coverage, extensively validated against real-world data

---

## 📦 Installation

```bash
npm install strict-money-parse
```

```bash
yarn add strict-money-parse
```

```bash
pnpm add strict-money-parse

```bash
bun add strict-money-parse
```

```groovy

**Requirements:** Node.js ≥18.0.0

---

## 🚀 Quick Start

```typescript
import { parsePriceString } from 'strict-money-parse';

// Basic usage
const result = parsePriceString('€1,234.56');
console.log(result);
// {
//   status: 'CONFIRMED',
//   rawAmount: 1234.56,
//   currency: 'EUR',
//   symbol: '€',
//   currencyHints: [],
//   evidence: { ... }
// }

// Works with various formats
parsePriceString('$1,999.99');           // US format
parsePriceString('1.234,56 €');         // European format
parsePriceString('2 499 Kč');           // Czech format with space separator
parsePriceString('¥125,000');           // Japanese yen
parsePriceString('₴5,678.90');          // Ukrainian hryvnia
parsePriceString('USD 99.99');          // ISO code
parsePriceString('12.500,00 TL');       // Turkish lira
```

---

## 📖 API Reference

### \`parsePriceString(input: string, options?: ParseOptions): ParseResult\`

Parses a monetary value from a string with automatic currency detection.

#### Parameters

- **\`input\`** (string) – The string containing a price/monetary value
- **\`options\`** (ParseOptions, optional):
   - \`domain?: string\` – Domain/URL hint for ambiguous currency resolution
   - \`ignorePercentages?: boolean\` – Whether to ignore percentages (default: \`false\`)
   - \`maxFractionDigits?: number\` – Maximum decimal places (default: \`3\`)

#### Returns: \`ParseResult\`

```typescript
interface ParseResult {
  status: 'CONFIRMED' | 'AMBIGUOUS' | 'UNKNOWN';
  rawAmount: number | null;           // Parsed numeric value
  currency: string | null;            // ISO 4217 code or null
  symbol: string | null;              // Original currency symbol
  currencyHints: string[];            // Possible currencies (when ambiguous)
  evidence: Evidence;                 // Detection metadata
}
```

#### Status Values

- **\`CONFIRMED\`** – Currency definitively identified with high confidence
- **\`AMBIGUOUS\`** – Multiple currencies possible (e.g., \`$\` could be USD, CAD, AUD, etc.)
- **\`UNKNOWN\`** – No currency detected or false positive filtered out

---

## 💡 Usage Examples

### European Number Formats

```typescript
// German format (dot thousands, comma decimal)
parsePriceString('1.234,56 €');
// → { status: 'CONFIRMED', rawAmount: 1234.56, currency: 'EUR' }

// Swiss format (apostrophe thousands)
parsePriceString("CHF 1'234.56");
// → { status: 'CONFIRMED', rawAmount: 1234.56, currency: 'CHF' }

// Czech "dash for zero cents" format
parsePriceString('1 234,— Kč');
// → { status: 'CONFIRMED', rawAmount: 1234, currency: 'CZK' }
```

### Handling Ambiguous Symbols

```typescript
// Dollar sign without additional context
const result = parsePriceString('$99.99');
console.log(result);
// {
//   status: 'AMBIGUOUS',
//   rawAmount: 99.99,
//   currency: 'USD',  // Default assumption
//   currencyHints: ['USD', 'CAD', 'AUD', 'NZD', ...] // All 26 possibilities
// }

// Use explicit ISO codes when currency is known
parsePriceString('CAD 99.99');
// → { status: 'CONFIRMED', rawAmount: 99.99, currency: 'CAD' }

parsePriceString('99.99 AUD');
// → { status: 'CONFIRMED', rawAmount: 99.99, currency: 'AUD' }

// Or use unambiguous prefixed symbols
parsePriceString('CA$ 99.99');
// → { status: 'CONFIRMED', rawAmount: 99.99, currency: 'CAD' }
```

### Asian Currencies

```typescript
// Japanese yen with kanji
parsePriceString('¥1,234 円');
// → { status: 'CONFIRMED', rawAmount: 1234, currency: 'JPY' }

// Indian rupee with lakh separator
parsePriceString('₹12,34,567.00');
// → { status: 'CONFIRMED', rawAmount: 1234567, currency: 'INR' }

// Indonesian rupiah
parsePriceString('Rp 125.000');
// → { status: 'CONFIRMED', rawAmount: 125000, currency: 'IDR' }
```

