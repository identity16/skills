# loops

Skills that delegate a recurring judgment through a feedback loop: the agent proposes, the user approves or corrects with a reason, and corrections become rules.

- **[make-loop](./make-loop/SKILL.md)**: Defines a loop: item and its key, source and cursor, enrichment, proposal shape, gate, review surface, sink, verification.
- **[maintain-loop](./maintain-loop/SKILL.md)**: Runs a cycle: propose, review what needs the user, learn from corrections, apply, verify, report.
- **[cheaper-trust](./cheaper-trust/SKILL.md)**: Finds trust held by an expensive layer (human review, prose rules) that a cheaper one (code structure, lint, tests, CI) could hold, ranked by running cost saved.
