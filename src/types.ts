// Core type definitions for strict-money-parse

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
  ambiguousSymbols: Set<string>;
};

export type Domain = "price" | "fx" | "crypto";

export type ParseOptions = {
  tables?: CurrencyTables;
  domain?: Domain;
  maxFractionDigits?: number;
  maxSymbolDistance?: number;
  ignorePercentages?: boolean;
};

export type ParseCandidatesOptions = ParseOptions & {
  maxCandidates?: number;
};
