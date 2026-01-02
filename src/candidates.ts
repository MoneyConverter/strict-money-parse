// Multi-candidate extraction from text

import type { Candidate, ParseCandidatesOptions } from "./types";
import { parsePriceString } from "./parse";
import { buildCurrencyTables } from "./tables";

// Keywords that indicate price context
const PRICE_KEYWORDS = [
  "price",
  "cost",
  "total",
  "subtotal",
  "amount",
  "sum",
  "pay",
  "payment",
];

function scoreCandidate(
  candidate: Candidate,
  originalText: string,
  startIndex: number
): number {
  let score = 0;
  
  // Base score for having an amount
  if (candidate.rawAmount !== null) {
    score += 10;
  }
  
  // Status-based scoring
  if (candidate.status === "CONFIRMED") {
    score += 50;
  } else if (candidate.status === "AMBIGUOUS") {
    score += 20;
  }
  
  // Bonus for ISO evidence
  if (candidate.evidence.isoCodeFound) {
    score += 30;
  }
  
  // Bonus for nearby price keywords
  const windowStart = Math.max(0, startIndex - 50);
  const windowEnd = Math.min(originalText.length, startIndex + 100);
  const context = originalText.slice(windowStart, windowEnd).toLowerCase();
  
  for (const keyword of PRICE_KEYWORDS) {
    if (context.includes(keyword)) {
      score += 10;
      break;
    }
  }
  
  return score;
}

export function parsePriceCandidates(
  text: string,
  opts?: ParseCandidatesOptions
): Candidate[] {
  const options = {
    tables: opts?.tables || buildCurrencyTables(),
    domain: opts?.domain || "price",
    maxSymbolDistance: opts?.maxSymbolDistance ?? 6,
    ignorePercentages: opts?.ignorePercentages ?? true,
    maxFractionDigits: opts?.maxFractionDigits,
    maxCandidates: opts?.maxCandidates ?? 10,
  };
  
  const candidates: Candidate[] = [];
  
  // Find all numeric tokens
  const pattern = /\d[\d\s,.'"_]*/g;
  let match: RegExpExecArray | null;
  
  while ((match = pattern.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    
    // Extract context around this number for parsing
    const contextStart = Math.max(0, startIndex - options.maxSymbolDistance);
    const contextEnd = Math.min(text.length, endIndex + options.maxSymbolDistance);
    const contextText = text.slice(contextStart, contextEnd);
    
    // Parse this candidate
    const result = parsePriceString(contextText, {
      tables: options.tables,
      domain: options.domain,
      maxSymbolDistance: options.maxSymbolDistance,
      ignorePercentages: options.ignorePercentages,
      maxFractionDigits: options.maxFractionDigits,
    });
    
    // Create candidate
    const candidate: Candidate = {
      ...result,
      score: 0,
      indexStart: startIndex,
      indexEnd: endIndex,
    };
    
    // Score the candidate
    candidate.score = scoreCandidate(candidate, text, startIndex);
    
    // Only include candidates with a valid amount
    if (result.rawAmount !== null) {
      candidates.push(candidate);
    }
  }
  
  // Sort by score (descending) and limit
  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Stable sort: maintain order for ties
    return a.indexStart - b.indexStart;
  });
  
  return candidates.slice(0, options.maxCandidates);
}
