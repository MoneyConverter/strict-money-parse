Ниже — **обновлённый файл имплементации (v1)**: проще, без лишних сущностей, без ручного ведения ISO, без рассинхрона `ambiguousSymbols`, и с аккуратной моделью данных для символов.

Ключевые правки относительно твоего текста:

* **ISO 4217 не хранится “вручную”**: `src/data/iso4217.json` — только **генерируемый снапшот** из официального списка SIX (maintenance agency ISO 4217). ([iso.org][1])
* **ambiguousHints содержит только символы с 2+ валютами**, а `AMBIGUOUS_SYMBOLS` **генерируется** из ключей.
* Всё “однозначное” (`Rp`, `RM`, `R$`, `HK$`, `NT$`, `₹`, `₽`, `€`…) — в **unique**.
* Убраны тяжёлые/сомнительные “вариации” (типа `Fr`, `₨`) — они сильно повышают FP в реальном веб-тексте.
* Упрощена сборка: **без vite-plugin-dts**, декларации делает `tsc --emitDeclarationOnly`.

---

## strict-money-parse — Implementation Plan (v1, simplified)

### Цель

Библиотека TypeScript для строгого парсинга “денежных” значений из строки (DOM-text), возвращает:

* `rawAmount` (число)
* `status`: `CONFIRMED | AMBIGUOUS | UNKNOWN`
* `currency` (ISO, если доказано)
* `symbol` (что нашли рядом)
* `currencyHints` (если неоднозначно)

Никаких runtime-зависимостей. Никакого GPL.

---

## Публичный API

```ts
// parse one string (best-effort)
export function parsePriceString(input: string, opts?: ParseOptions): ParseResult;

// extract multiple candidates from a larger text (DOM text, snippets)
export function parsePriceCandidates(input: string, opts?: ParseCandidatesOptions): Candidate[];

// build default tables (loads ISO snapshot + symbol tables)
export function buildCurrencyTables(custom?: Partial<CurrencyTables>): CurrencyTables;
```

---

## Минимальная структура проекта

```
strict-money-parse/
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── parse.ts              # parsePriceString + parsePriceCandidates
│   ├── tables.ts             # buildCurrencyTables + defaults
│   ├── data/
│   │   └── iso4217.json      # GENERATED snapshot (do not edit)
│   └── tables/
│       └── currency-data.ts  # UNIQUE_SYMBOLS + AMBIGUOUS_HINTS (+ derived set)
├── scripts/
│   ├── update-iso4217.ts     # fetch SIX List One (XML) -> iso4217.json
│   └── check-licenses.ts     # optional: hard-fail on forbidden licenses
├── test/
│   ├── unit/*.test.ts
│   └── integration/*.test.ts
├── package.json
├── tsconfig.json
├── tsconfig.types.json       # emit declarations only
├── vite.config.ts
├── vitest.config.ts
├── README.md
├── THIRD_PARTY_NOTICES.md
└── LICENSE
```

---

## Данные валют (v1)

### src/tables/currency-data.ts

```ts
// src/tables/currency-data.ts

export const UNIQUE_SYMBOLS: Record<string, string> = {
  // Truly distinctive currency signs
  "€": "EUR",
  "₴": "UAH",
  "₸": "KZT",
  "₼": "AZN",
  "₾": "GEL",
  "₪": "ILS",
  "฿": "THB",
  "₫": "VND",
  "₱": "PHP",
  "₲": "PYG",
  "₡": "CRC",
  "₮": "MNT",
  "₦": "NGN",
  "₩": "KRW",
  "₺": "TRY",
  "₹": "INR",
  "₽": "RUB",

  // Unambiguous letter tokens (commonly used as currency markers)
  "Rp": "IDR",
  "RM": "MYR",

  // Disambiguated dollar forms (unambiguous in practice)
  "US$": "USD",
  "CA$": "CAD",
  "AU$": "AUD",
  "NZ$": "NZD",
  "HK$": "HKD",
  "NT$": "TWD",
  "S$": "SGD",
  "R$": "BRL",

  // Common variants with optional space are handled by matcher normalization,
  // so you do NOT need duplicates like "US $" here.
};

// Only symbols with 2+ possible currencies live here:
export const AMBIGUOUS_HINTS: Record<string, string[]> = {
  "$": [
    "USD", "CAD", "AUD", "NZD", "SGD", "HKD",
    "BBD", "BMD", "BND", "BZD", "FJD", "GYD", "KYD", "LRD", "NAD", "SRD", "TTD", "XCD",
    "BSD", "JMD", "SBD",
  ],
  "¥": ["JPY", "CNY"],
  "￥": ["JPY", "CNY"],
  "£": ["GBP", "FKP", "GIP", "SHP", "LBP", "EGP", "SYP", "GGP", "IMP", "JEP"],
  "kr": ["DKK", "NOK", "SEK", "ISK"],

  // Sometimes appears for both Canada + Costa Rica
  "C$": ["CAD", "CRC"],

  // Keep "R" ambiguous by design (also appears outside money, so we treat it cautiously)
  "R": ["ZAR", "ZWL"],
};

// Always derived => no drift
export const AMBIGUOUS_SYMBOLS = new Set(Object.keys(AMBIGUOUS_HINTS));
```

**Почему так:**

* “Rp / RM / R$ / HK$ / NT$ / S$ / ₹ / ₽ / €” — **не ambiguity**, у них 1 ISO (в твоей модели).
* “Fr / ₨” — реально встречаются, но слишком шумные для строгого веб-парсинга (FP растёт заметно). Их можно добавить позже флагом.

---

## Типы (src/types.ts)

```ts
export type CurrencyStatus = "CONFIRMED" | "AMBIGUOUS" | "UNKNOWN";

export type Evidence = {
  matchedText: string;
  normalizedText: string;
  amountToken?: string;
  isoCodeFound?: string;
  symbolFound?: string;
};

export type ParseResult = {
  status: CurrencyStatus;
  rawAmount: number | null;
  currency: string | null;
  symbol: string | null;
  currencyHints: string[];
  evidence: Evidence;
};

export type Candidate = ParseResult & {
  score: number;
  indexStart: number;
  indexEnd: number;
};

export type CurrencyTables = {
  iso4217: Set<string>;
  uniqueSymbols: Record<string, string>;
  ambiguousHints: Record<string, string[]>;
  ambiguousSymbols: Set<string>; // derived, but stored for speed
};

export type Domain = "price" | "fx" | "crypto";

export type ParseOptions = {
  tables?: CurrencyTables;
  domain?: Domain;               // affects default maxFractionDigits
  maxFractionDigits?: number;    // override
  maxSymbolDistance?: number;    // default 6
  ignorePercentages?: boolean;   // default true
};

export type ParseCandidatesOptions = ParseOptions & {
  maxCandidates?: number;        // default 10
};
```

---

## Core logic (src/parse.ts) — правила (без лишнего)

### Нормализация текста

* trim
* NBSP/thin space → space
* `’`/`'` → space
* collapse spaces
* **не делаем “умный” lowercasing** (валютные маркеры чувствительны к регистру)

```ts
function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/[\u00A0\u2009]/g, " ")
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ");
}
```

### Извлечение числового токена

Берём **первое** похоже-на-число “окно” (для `parsePriceString`) и **все** (для candidates):

* допускаем `1 234`, `1,234`, `1.234`, `1 234,56`, `1,234.56`, `12.50`, `12,50`
* не пытаемся поддерживать экзотику вроде “1 234 567,89” отдельно — это покрывает нормализация + правило пробелов

### Определение десятичного разделителя (упрощённо, но надёжно)

* если есть и `,` и `.` → **последний** из них десятичный
* если только один из них → десятичный **только если** цифр после него `<= maxFractionDigits`, иначе считаем тысячным

`maxFractionDigits` по умолчанию:

* `price`: 2
* `fx`: 4
* `crypto`: 8

### Фильтры ложных совпадений (оставляем только “дешёвые и полезные”)

* телефоны (много цифр)
* даты `YYYY-MM-DD`, `DD/MM/YYYY`
* проценты (если `ignorePercentages`)
* “год” (19xx/20xx) если строка целиком — год
* диапазоны `100-200` или `1,299–1,499`
* размеры `12x500`

Без скоринга на уровне `parsePriceString`: если это FP — возвращаем `UNKNOWN`.

### Валюта

Порядок доказательств:

1. ISO-код рядом с числом (только если есть в iso4217) → `CONFIRMED`
2. уникальный символ/токен рядом → `CONFIRMED`
3. ambiguous symbol рядом → `AMBIGUOUS` + `currencyHints`
4. иначе `UNKNOWN`

**Важно:** matcher для символов ищет **длинные токены первыми** (например `HK$` раньше `$`) и учитывает пробелы типа `US $` через нормализацию “удалить пробелы внутри символа при сравнении”.

---

## Таблицы (src/tables.ts)

```ts
import ISO from "./data/iso4217.json";
import { UNIQUE_SYMBOLS, AMBIGUOUS_HINTS, AMBIGUOUS_SYMBOLS } from "./tables/currency-data";

export function buildCurrencyTables(custom?: Partial<CurrencyTables>): CurrencyTables {
  const base: CurrencyTables = {
    iso4217: new Set(ISO),
    uniqueSymbols: { ...UNIQUE_SYMBOLS },
    ambiguousHints: { ...AMBIGUOUS_HINTS },
    ambiguousSymbols: new Set(AMBIGUOUS_SYMBOLS),
  };

  // Safe merge
  if (!custom) return base;

  return {
    iso4217: custom.iso4217 ?? base.iso4217,
    uniqueSymbols: { ...base.uniqueSymbols, ...(custom.uniqueSymbols ?? {}) },
    ambiguousHints: { ...base.ambiguousHints, ...(custom.ambiguousHints ?? {}) },
    ambiguousSymbols: new Set(Object.keys({ ...base.ambiguousHints, ...(custom.ambiguousHints ?? {}) })),
  };
}
```

---

## Генерация ISO 4217 (scripts/update-iso4217.ts)

SIX — maintenance agency ISO 4217 (официальная роль на сайте ISO). ([iso.org][1])
Снапшот берём из **SIX List One XML** (как рекомендуемый источник для кодов). ([cldr.unicode.org][2])

```ts
// scripts/update-iso4217.ts
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const URLS = [
  // Current (seen in CLDR guidance / real-world links)
  "https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/amendments/lists/list_one.xml",
  // Fallback (older)
  "https://www.six-group.com/dam/download/financial-information/data-center/iso-currency/lists/list-one.xml",
];

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "user-agent": "strict-money-parse/1.0 (+https://npmjs.com/package/strict-money-parse)",
          accept: "application/xml,text/xml,*/*",
        },
      },
      (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        let data = "";
        res.setEncoding("utf-8");
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
  });
}

function extractCcyCodes(xml: string): string[] {
  const re = /<Ccy>([A-Z]{3})<\/Ccy>/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return Array.from(new Set(out)).sort();
}

async function main() {
  let xml: string | null = null;
  let lastErr: unknown = null;

  for (const url of URLS) {
    try {
      xml = await fetchText(url);
      break;
    } catch (e) {
      lastErr = e;
    }
  }

  if (!xml) throw lastErr;

  const codes = extractCcyCodes(xml);
  const outPath = path.resolve("src/data/iso4217.json");
  fs.writeFileSync(outPath, JSON.stringify(codes, null, 2) + "\n", "utf-8");

  console.log(`ISO 4217 updated: ${codes.length} codes -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**Политика проекта:** `src/data/iso4217.json` **не редактируется руками**. Любые изменения — только через `npm run update-iso4217`.

---

## Лицензии и third-party

* Unicode CLDR данные имеют SPDX `Unicode-3.0` (Unicode License v3). ([npm][3])
* ISO 4217 коды поддерживаются SIX (maintenance agency). ([iso.org][1])

### THIRD_PARTY_NOTICES.md (коротко)

Оставь как у тебя, но лучше добавить **SPDX-строку** и ссылку на источник лицензии; CLDR на npm явно помечает `Unicode-3.0`. ([npm][3])

---

## Сборка (без лишнего)

### tsconfig.types.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### vite.config.ts

```ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "StrictMoneyParse",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
    },
  },
});
```

### package.json (важные моменты)

* `build` = vite + types
* `check-licenses` можно через script (надёжнее, чем зависеть от тонкостей CLI-флагов)
* никаких runtime deps

```json
{
  "scripts": {
    "build": "vite build && tsc -p tsconfig.types.json",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src scripts test --max-warnings=0",
    "format": "prettier --write \"src/**/*.{ts,js}\" \"scripts/**/*.{ts,js}\" \"test/**/*.{ts,js}\"",
    "update-iso4217": "tsx scripts/update-iso4217.ts",
    "check-licenses": "tsx scripts/check-licenses.ts",
    "prepublishOnly": "npm run build && npm run check-licenses && npm run test"
  }
}
```

---

## parsePriceCandidates (упрощённо)

Без “умного” ML-скоринга. Только:

* кандидаты = все числовые токены
* score = `CONFIRMED > AMBIGUOUS > UNKNOWN`, плюс небольшой бонус за слова `price/total/subtotal`
* отрезаем до `maxCandidates`

Это даст стабильное поведение и мало сюрпризов.

---

## Acceptance Criteria (v1)

Оставь твои метрики, но **сделай их измеримыми**:

* фиксированный датасет строк (200–500 примеров)
* отчёт `precision/recall` в тестах (vitest) хотя бы как “ожидаемое число FP/FN”

---

## Что я бы ещё жёстко поправил в твоём исходнике

1. **Не храни `ambiguousSymbols` руками** — только `new Set(Object.keys(AMBIGUOUS_HINTS))` (ты это уже верно сформулировал).
2. **Убери “единичные ambiguity”** — они логически ломают модель.
3. **Не добавляй буквенные “символы валют” широким списком** (`Ft`, `Fr`, и т.п.) без отдельного флага strictness — это почти гарант FP.

