Create a solid v1 test suite.

## Requirements
- Unit tests:
  - number parsing for common formats
  - currency resolution (unique symbols, ISO codes, ambiguous symbols)
  - false-positive rejections (phone/date/year/range/size/percent)
- Integration tests:
  - parsePriceCandidates returns multiple candidates with stable ordering

## Must-have cases
- "1 234,56 €" => CONFIRMED EUR 1234.56
- "US$ 1,299.00" => CONFIRMED USD
- "$1,299.00" => AMBIGUOUS with hints
- "kr 1.299,00" => AMBIGUOUS with hints
- "2026-01-02" => UNKNOWN rawAmount null
- "+1 234 567 8900" => UNKNOWN rawAmount null
- "1,299–1,499" => UNKNOWN rawAmount null

## Deliverable
Return test files under `test/` and ensure they pass.
