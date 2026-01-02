Act as a strict reviewer for a PR implementing strict-money-parse.

## Review checklist
1) No runtime deps were added.
2) No forbidden licenses in dependency tree.
3) ISO snapshot is generated, not edited manually.
4) Strict evidence model enforced:
   - no CONFIRMED for $, ¥, £, kr without ISO or unique token
5) Ambiguous symbols derived from ambiguousHints keys.
6) Deterministic output:
   - stable sorting for candidates
7) Tests cover:
   - number formats
   - unique/ambiguous currency detection
   - false-positive filters
8) Build outputs:
   - ESM + CJS + types
   - exports map correct
9) README includes usage examples.

## Output format
- Summary (pass/fail)
- Blocking issues (must fix)
- Non-blocking suggestions
- Security/legal notes
