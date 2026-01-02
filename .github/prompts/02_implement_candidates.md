Implement `parsePriceCandidates(input, opts?) -> Candidate[]`.

## Constraints
- Reuse the same core logic as parsePriceString (do not fork heuristics)
- Deterministic output order:
  - primary: higher score
  - tie-breaker: lower indexStart
- Default `maxCandidates` = 10

## Candidate Scoring
- rawAmount != null => +10
- CONFIRMED => +50
- AMBIGUOUS => +20
- evidence.isoCodeFound => +30
- nearby keywords (price/total/subtotal/cost/amount) within ±40 chars => +10 (once)
- if false-positive pattern triggers => -100

## Extraction
- Find ALL numeric tokens in the input text, each token produces a candidate.
- Candidate must include indexStart/indexEnd referring to the matched token span.

## Deliverable
Return updated code for:
- `src/parse.ts` (or separate module)
- `src/types.ts` if needed
- Add/adjust tests in `test/integration/`
