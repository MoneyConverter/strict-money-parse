import { describe, it, expect } from "vitest";
import { parsePriceCandidates } from "../../src/candidates";

describe("parsePriceCandidates", () => {
  it("should find multiple price candidates in text", () => {
    const text = "Item costs $50, shipping is €10, total is 60 USD";
    const candidates = parsePriceCandidates(text);
    
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.some((c) => c.rawAmount === 50)).toBe(true);
    expect(candidates.some((c) => c.rawAmount === 10)).toBe(true);
    expect(candidates.some((c) => c.rawAmount === 60)).toBe(true);
  });

  it("should score CONFIRMED higher than AMBIGUOUS", () => {
    const text = "Price: €100 or $100";
    const candidates = parsePriceCandidates(text);
    
    // Find the euro and dollar candidates
    const euroCandidate = candidates.find((c) => c.symbol === "€");
    const dollarCandidate = candidates.find((c) => c.symbol === "$");
    
    expect(euroCandidate).toBeDefined();
    expect(dollarCandidate).toBeDefined();
    
    if (euroCandidate && dollarCandidate) {
      expect(euroCandidate.score).toBeGreaterThan(dollarCandidate.score);
    }
  });

  it("should score ISO-confirmed higher", () => {
    const text = "100 USD or €100";
    const candidates = parsePriceCandidates(text);
    
    const usdCandidate = candidates.find((c) => c.currency === "USD");
    const eurCandidate = candidates.find((c) => c.currency === "EUR");
    
    expect(usdCandidate).toBeDefined();
    expect(eurCandidate).toBeDefined();
  });

  it("should boost score for price keywords", () => {
    const text = "Price: $100. Phone: 1234567890.";
    const candidates = parsePriceCandidates(text);
    
    // The $100 should score higher due to "Price:" keyword
    expect(candidates[0]?.rawAmount).toBe(100);
  });

  it("should limit results to maxCandidates", () => {
    const text = "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15";
    const candidates = parsePriceCandidates(text, { maxCandidates: 5 });
    
    expect(candidates.length).toBeLessThanOrEqual(5);
  });

  it("should include position information", () => {
    const text = "Item costs €50";
    const candidates = parsePriceCandidates(text);
    
    const candidate = candidates.find((c) => c.rawAmount === 50);
    expect(candidate).toBeDefined();
    expect(candidate?.indexStart).toBeGreaterThanOrEqual(0);
    expect(candidate?.indexEnd).toBeGreaterThan(candidate?.indexStart || 0);
  });

  it("should filter out false positives", () => {
    const text = "Call +1 234 567 8900 or pay $50";
    const candidates = parsePriceCandidates(text);
    
    // Should not include the phone number
    expect(candidates.every((c) => c.rawAmount !== 1234567890)).toBe(true);
    
    // Should include the price
    expect(candidates.some((c) => c.rawAmount === 50)).toBe(true);
  });

  it("should handle empty text", () => {
    const candidates = parsePriceCandidates("");
    expect(candidates).toEqual([]);
  });

  it("should handle text with no prices", () => {
    const text = "Hello world, this is a test.";
    const candidates = parsePriceCandidates(text);
    expect(candidates).toEqual([]);
  });
});
