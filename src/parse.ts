// Core parsing logic for strict-money-parse

import type {
  ParseResult,
  ParseOptions,
  CurrencyTables,
  Evidence,
  CurrencyStatus,
} from "./types";
import { buildCurrencyTables } from "./tables";

// Normalization helpers
function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/[\u00A0\u2009]/g, " ") // NBSP and thin space -> regular space
    .replace(/['']/g, " ") // Apostrophes -> space
    .replace(/\s+/g, " "); // Collapse whitespace
}

// Extract numeric tokens with separators
function extractNumericToken(text: string): { token: string; index: number } | null {
  // Pattern: digits with optional separators (space, comma, dot, apostrophe, underscore)
  const pattern = /\d[\d\s,.'"_]*/g;
  const match = pattern.exec(text);
  
  if (!match) return null;
  
  return {
    token: match[0].trim(),
    index: match.index,
  };
}

// Determine if a separator is decimal or thousand
function parseNumericToken(
  token: string,
  maxFractionDigits: number
): number | null {
  // Find all occurrences of . and ,
  const lastDot = token.lastIndexOf(".");
  const lastComma = token.lastIndexOf(",");
  
  let cleanToken = token;
  
  // If both exist, the last one is decimal separator
  if (lastDot !== -1 && lastComma !== -1) {
    const decimalSep = lastDot > lastComma ? "." : ",";
    const thousandSep = decimalSep === "." ? "," : ".";
    
    // Remove thousand separators and spaces
    cleanToken = cleanToken
      .replace(new RegExp(`[${thousandSep}\\s'"_]`, "g"), "")
      .replace(decimalSep, ".");
  } else if (lastDot !== -1 || lastComma !== -1) {
    // Only one separator
    const sep = lastDot !== -1 ? "." : ",";
    const sepIndex = lastDot !== -1 ? lastDot : lastComma;
    const digitsAfter = token.slice(sepIndex + 1).replace(/\D/g, "").length;
    
    // If digits after separator <= maxFractionDigits, treat as decimal
    if (digitsAfter <= maxFractionDigits && digitsAfter > 0) {
      cleanToken = cleanToken.replace(/[\s'"_,.](?=.*[,.])/g, "").replace(",", ".");
    } else {
      // Otherwise, treat as thousand separator
      cleanToken = cleanToken.replace(/[\s'"_,.]/g, "");
    }
  } else {
    // No separators, just remove any spaces
    cleanToken = cleanToken.replace(/[\s'"_]/g, "");
  }
  
  const num = parseFloat(cleanToken);
  return isNaN(num) ? null : num;
}

// False positive filters
function isFalsePositive(
  text: string,
  token: string,
  ignorePercentages: boolean
): boolean {
  const digitsOnly = token.replace(/\D/g, "");
  
  // Phone numbers (10+ digits)
  if (digitsOnly.length >= 10) return true;
  
  // Dates
  if (/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/.test(text)) return true;
  if (/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/.test(text)) return true;
  
  // Years only (1900-2099)
  if (/^\s*(19|20)\d{2}\s*$/.test(text)) return true;
  
  // Percentages
  if (ignorePercentages && /%/.test(text)) return true;
  
  // Ranges
  if (/\d+\s*[-–—]\s*\d+/.test(text)) return true;
  
  // Sizes
  if (/\d+\s*[x×]\s*\d+/i.test(text)) return true;
  
  return false;
}

// Find currency evidence near amount
function findCurrencyEvidence(
  text: string,
  tokenIndex: number,
  tokenLength: number,
  tables: CurrencyTables,
  maxDistance: number
): {
  status: CurrencyStatus;
  currency: string | null;
  symbol: string | null;
  hints: string[];
} {
  const leftStart = Math.max(0, tokenIndex - maxDistance);
  const rightEnd = Math.min(text.length, tokenIndex + tokenLength + maxDistance);
  
  const leftWindow = text.slice(leftStart, tokenIndex);
  const rightWindow = text.slice(tokenIndex + tokenLength, rightEnd);
  const searchWindow = leftWindow + rightWindow;
  
  // 1. Check for ISO code (3 uppercase letters)
  const isoMatch = searchWindow.match(/\b([A-Z]{3})\b/);
  if (isoMatch && tables.iso4217.has(isoMatch[1])) {
    return {
      status: "CONFIRMED",
      currency: isoMatch[1],
      symbol: null,
      hints: [],
    };
  }
  
  // 2. Check for unique symbols (longer ones first)
  const uniqueSymbols = Object.keys(tables.uniqueSymbols).sort(
    (a, b) => b.length - a.length
  );
  
  for (const symbol of uniqueSymbols) {
    const normalizedSymbol = symbol.replace(/\s+/g, "");
    const normalizedWindow = searchWindow.replace(/\s+/g, "");
    
    if (normalizedWindow.includes(normalizedSymbol)) {
      return {
        status: "CONFIRMED",
        currency: tables.uniqueSymbols[symbol],
        symbol,
        hints: [],
      };
    }
  }
  
  // 3. Check for ambiguous symbols
  const ambiguousSymbols = Array.from(tables.ambiguousSymbols).sort(
    (a, b) => b.length - a.length
  );
  
  for (const symbol of ambiguousSymbols) {
    const normalizedSymbol = symbol.replace(/\s+/g, "");
    const normalizedWindow = searchWindow.replace(/\s+/g, "");
    
    if (normalizedWindow.includes(normalizedSymbol)) {
      return {
        status: "AMBIGUOUS",
        currency: null,
        symbol,
        hints: tables.ambiguousHints[symbol] || [],
      };
    }
  }
  
  // No evidence found
  return {
    status: "UNKNOWN",
    currency: null,
    symbol: null,
    hints: [],
  };
}

export function parsePriceString(
  input: string,
  opts?: ParseOptions
): ParseResult {
  // Set defaults
  const options = {
    tables: opts?.tables || buildCurrencyTables(),
    domain: opts?.domain || "price",
    maxSymbolDistance: opts?.maxSymbolDistance ?? 6,
    ignorePercentages: opts?.ignorePercentages ?? true,
    maxFractionDigits: opts?.maxFractionDigits,
  };
  
  // Determine maxFractionDigits based on domain
  const maxFractionDigits =
    options.maxFractionDigits ??
    (options.domain === "crypto" ? 8 : options.domain === "fx" ? 4 : 2);
  
  // Normalize input
  const normalized = normalizeText(input);
  
  // Create evidence object
  const evidence: Evidence = {
    matchedText: input,
    normalizedText: normalized,
  };
  
  // Extract numeric token
  const numericMatch = extractNumericToken(normalized);
  
  if (!numericMatch) {
    return {
      status: "UNKNOWN",
      rawAmount: null,
      currency: null,
      symbol: null,
      currencyHints: [],
      evidence,
    };
  }
  
  evidence.amountToken = numericMatch.token;
  
  // Check for false positives
  if (isFalsePositive(normalized, numericMatch.token, options.ignorePercentages)) {
    return {
      status: "UNKNOWN",
      rawAmount: null,
      currency: null,
      symbol: null,
      currencyHints: [],
      evidence,
    };
  }
  
  // Parse amount
  const rawAmount = parseNumericToken(numericMatch.token, maxFractionDigits);
  
  if (rawAmount === null) {
    return {
      status: "UNKNOWN",
      rawAmount: null,
      currency: null,
      symbol: null,
      currencyHints: [],
      evidence,
    };
  }
  
  // Find currency evidence
  const currencyEvidence = findCurrencyEvidence(
    normalized,
    numericMatch.index,
    numericMatch.token.length,
    options.tables,
    options.maxSymbolDistance
  );
  
  if (currencyEvidence.currency) {
    evidence.isoCodeFound = currencyEvidence.currency;
  }
  if (currencyEvidence.symbol) {
    evidence.symbolFound = currencyEvidence.symbol;
  }
  
  return {
    status: currencyEvidence.status,
    rawAmount,
    currency: currencyEvidence.currency,
    symbol: currencyEvidence.symbol,
    currencyHints: currencyEvidence.hints,
    evidence,
  };
}
