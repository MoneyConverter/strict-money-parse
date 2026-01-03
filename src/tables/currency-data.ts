// Currency symbol data - manually curated and maintained
// Source: Unicode CLDR + real-world usage patterns

// Symbols that uniquely map to exactly one currency
export const UNIQUE_SYMBOLS: Record<string, string> = {
  // Single-char (highly distinctive)
  "€": "EUR",
  "₴": "UAH",
  "₸": "KZT",
  "₼": "AZN",
  "₾": "GEL",
  "₪": "ILS",
  "֏": "AMD",
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

  // Extra common unique symbols (optional but practical)
  "৳": "BDT", // Bangladeshi taka
  "៛": "KHR", // Cambodian riel
  "₭": "LAK", // Lao kip
  "₵": "GHS", // Ghanaian cedi

  // Arabic script
  "د.ك": "KWD", // Kuwaiti dinar

  // Letter-based (distinct in practice)
  "Rp": "IDR",
  "RM": "MYR",
  "KSh": "KES",
  "Kč": "CZK",
  "zł": "PLN",
  "Ft": "HUF",
  "лв": "BGN",
  "лв.": "BGN",
  "грн": "UAH",
  "грн.": "UAH",
  "TL": "TRY",
  "ALL": "ALL",
  "ر.س.": "SAR",
  "ر.س": "SAR",
  "DH": "MAD",
  "DA": "DZD",
  "DT": "TND",
  "KD": "KWD",
  "GH₵": "GHS",
  "so'm": "UZS",
  "so m": "UZS", // Normalized version (apostrophe becomes space)
  "sum": "UZS",
  "soʻm": "UZS", // Alternative apostrophe
  "Q": "GTQ",
  "RD$": "DOP",
  "RD $": "DOP",
  "S/": "PEN",
  "S /": "PEN",
  "$U": "UYU",
  "$ U": "UYU",
  "Bs": "BOB",
  "Bs.": "BOB",
  "K": "PGK",
  "VT": "VUV",
  "Rf": "MVR",
  "FJD$": "FJD",
  "FJD $": "FJD",
  "BDS$": "BBD",
  "BDS $": "BBD",

  // Disambiguated dollar forms (treat as unique)
  "US$": "USD",
  "US $": "USD",
  "CA$": "CAD",
  "CA $": "CAD",
  "AU$": "AUD",
  "AU $": "AUD",
  "A$": "AUD",
  "A $": "AUD",
  "NZ$": "NZD",
  "NZ $": "NZD",
  "S$": "SGD",
  "S $": "SGD",
  "HK$": "HKD",
  "HK $": "HKD",
  "NT$": "TWD",
  "NT $": "TWD",
  "EC$": "XCD",
  "EC $": "XCD",
  "R$": "BRL",
  "R $": "BRL",

  // Disambiguated pound forms (treat as unique)
  "E£": "EGP",
  "E £": "EGP",
  "£E": "EGP",
  "£ E": "EGP",
  "£S": "SYP",
  "£ S": "SYP",
  "S£": "SYP",
  "S £": "SYP",

  // Disambiguated yen/yuan forms (treat as unique)
  "JP¥": "JPY",
  "JP ¥": "JPY",
  "CN¥": "CNY",
  "CN ¥": "CNY",

  // CJK characters
  "円": "JPY", // Japanese yen
};

export const AMBIGUOUS_HINTS: Record<string, string[]> = {
  // Bare "$" is extremely ambiguous; keep a practical set of common "dollar-sign" currencies.
  "$": [
    "USD",
    "CAD",
    "AUD",
    "NZD",
    "SGD",
    "HKD",
    "MXN",
    "ARS",
    "CLP",
    "COP",
    "BBD",
    "BMD",
    "BND",
    "BZD",
    "FJD",
    "GYD",
    "KYD",
    "LRD",
    "NAD",
    "SRD",
    "TTD",
    "XCD",
    "BSD",
    "JMD",
    "SBD",
  ],

  // Yen/Yuan
  "¥": ["JPY", "CNY"],
  "￥": ["JPY", "CNY"],

  // Pound sign used across multiple "pound" currencies
  "£": ["GBP", "FKP", "GIP", "SHP", "LBP", "EGP", "SYP", "GGP", "IMP", "JEP"],

  // Krona/Krone
  "kr": ["DKK", "NOK", "SEK", "ISK"],

  // Lei used by Romania and Moldova
  "Lei": ["RON", "MDL"],

  "Leu": ["RON", "MDL"],

  // "C$" sometimes appears for Canada and Costa Rica in the wild
  "C$": ["CAD", "CRC"],

  // "R" is commonly Rand (but R$ already mapped to BRL as unique)
  "R": ["ZAR", "ZWL"],

  // Cyrillic "р." or "р" for rubles (Belarus/Russia)
  "р.": ["BYN", "RUB"],
  "р": ["BYN", "RUB"],

  // Franc/Rupee family — only if you decide to support them (they are noisy, but real).
  // Note: These can cause false positives, consider enabling with a strictness flag
  "Fr": ["CHF", "XAF", "XOF", "XPF", "DJF"],
  "₨": ["INR", "PKR", "LKR", "NPR", "SCR"],
  "Rs.": ["PKR", "INR", "LKR", "NPR", "SCR", "MUR"],
  "Rs": ["PKR", "INR", "LKR", "NPR", "SCR", "MUR"],
};

// Always derived => no drift
export const AMBIGUOUS_SYMBOLS = new Set(Object.keys(AMBIGUOUS_HINTS));
