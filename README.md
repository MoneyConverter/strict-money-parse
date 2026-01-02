# strict-money-parse

[![npm version](https://img.shields.io/npm/v/strict-money-parse.svg?style=flat-square)](https://www.npmjs.com/package/strict-money-parse)
[![npm downloads](https://img.shields.io/npm/dm/strict-money-parse.svg?style=flat-square)](https://www.npmjs.com/package/strict-money-parse)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/strict-money-parse?style=flat-square)](https://bundlephobia.com/package/strict-money-parse)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/MoneyConverter/strict-money-parse/ci.yml?style=flat-square)](https://github.com/MoneyConverter/strict-money-parse/actions)

Strict TypeScript library for parsing monetary values from strings with evidence-based currency detection.

Originally developed for [MoneyConvert.net](https://moneyconvert.net/).

## Table of contents

- [Installation](#installation)
- [🚀 Quick start](#-quick-start)
- [API](#api)
- [Options](#options)
- [Notes](#notes)
- [License](#license)

## Installation

```bash
npm install strict-money-parse
# or
yarn add strict-money-parse
# or
pnpm add strict-money-parse
# or
bun add strict-money-parse
```

Node.js >= 18 is required.

## 🚀 Quick Start

```ts
import { parsePriceString } from "strict-money-parse";

// Basic usage
parsePriceString("€1,234.56");
parsePriceString("1.234,56 €");
parsePriceString("USD 99.99");
parsePriceString("¥125,000");
```

## API

### `parsePriceString(input, options?)`

Parses a single price string and returns the best match.

**Parameters:**

- `input` (`string`): The string to parse (e.g., "$10.50", "1 200 RUB").
- `options` (`ParseOptions?`): Optional configuration object. See [Options](#options) below.

**Returns:** `ParseResult`

```ts
type CurrencyStatus = "CONFIRMED" | "AMBIGUOUS" | "UNKNOWN";

type ParseResult = {
  status: CurrencyStatus;       // Confidence level of the currency detection
  rawAmount: number | null;     // The parsed numeric value (e.g., 10.5)
  currency: string | null;      // ISO 4217 code (e.g., "USD") or symbol if unknown
  symbol: string | null;        // The detected currency symbol (e.g., "$")
  currencyHints: string[];      // List of potential currency codes if ambiguous
  evidence: {
    matchedText: string;        // The substring that was parsed
    normalizedText: string;     // Text after normalization
    amountToken?: string;       // The numeric part as a string
    isoCodeFound?: string;      // Detected ISO code
    symbolFound?: string;       // Detected symbol
  };
};
```

### `parsePriceCandidates(input, options?)`

Finds all potential price candidates in a string. Useful when the input might contain multiple prices or noise.

**Parameters:**

- `input` (`string`): The text to search.
- `options` (`ParseCandidatesOptions?`): Configuration object. Extends `ParseOptions` with:
   - `maxCandidates` (`number?`): Maximum number of candidates to return.

**Returns:** `Candidate[]` (Array of `ParseResult` with additional scoring info)

```ts
type Candidate = ParseResult & {
  score: number;       // Relevance score
  indexStart: number;  // Start index in the original string
  indexEnd: number;    // End index in the original string
};
```

### `buildCurrencyTables()`

Pre-builds currency data tables.

**Returns:** `CurrencyTables`

**Usage:**
If you are parsing thousands of strings, you can build the tables once and pass them to `parsePriceString` via options to improve performance.

```ts
import { buildCurrencyTables, parsePriceString } from "strict-money-parse";

const tables = buildCurrencyTables(); // Build once

// Reuse in loop
data.forEach(str => {
  parsePriceString(str, { tables });
});
```

## Options

The `options` object allows you to fine-tune the parsing behavior.

### `domain`

- **Type:** `"price" | "fx" | "crypto"`
- **Default:** `"price"`
- **Description:** Sets the default `maxFractionDigits` based on the expected domain.
   - `price`: 2 decimal places (standard retail prices).
   - `fx`: 4 decimal places (foreign exchange rates).
   - `crypto`: 8 decimal places (cryptocurrencies).

### `maxFractionDigits`

- **Type:** `number`
- **Default:** Depends on `domain` (2, 4, or 8).
- **Description:** Explicitly limits the number of decimal places allowed. If the number in the string has more decimal places than this, it might be split or parsed differently. Overrides the `domain` default.

### `maxSymbolDistance`

- **Type:** `number`
- **Default:** `6`
- **Description:** The maximum number of characters allowed between the currency symbol/code and the numeric value. Useful to avoid matching unrelated symbols far from the number.

### `ignorePercentages`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** If `true`, ignores numeric values followed immediately by a `%` sign (e.g., "50% off").

### `tables`

- **Type:** `CurrencyTables`
- **Default:** `undefined` (tables are built on the fly)
- **Description:** Pre-computed currency tables from `buildCurrencyTables()`. Pass this to avoid rebuilding tables for every call.

## Notes

- `domain` does not map website domains like `amazon.ca` to a currency. It only selects a precision profile (`price`/`fx`/`crypto`).
- ISO 4217 currency list (`src/data/iso4217.json`) last downloaded: 2026-01-02.
- Real-world HTML-based test notes: [`REAL_WORLD_HTML_TESTS.md`](REAL_WORLD_HTML_TESTS.md)
- Third-party notices: [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)

## License

MIT. See [`LICENSE`](LICENSE).
