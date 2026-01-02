# AI Prompts for strict-money-parse

Use these prompts when delegating work to an assistant/agent. Each prompt is designed to produce:
- Minimal, deterministic code
- No runtime dependencies
- Strict evidence-based currency resolution
- High test coverage

Rules for the assistant:
- Do not add runtime dependencies.
- Do not add GPL/AGPL/LGPL dependencies (dev or runtime).
- Keep implementation simple; prefer readable code over clever tricks.
- Output must be complete, compile, and pass tests.
- If you change a public type or API behavior, update README + tests.

Suggested workflow:
1) 01_implement_core_parser
2) 03_implement_tables_and_symbols
3) 02_implement_candidates
4) 04_implement_iso_update_script
5) 05_implement_tests_dataset
6) 06_code_review_gate
