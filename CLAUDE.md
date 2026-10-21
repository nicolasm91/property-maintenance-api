# CLAUDE.md

## Code comments

- Do not comment every method, class, or field. Names and types should explain what the code does.
- Only comment non-obvious decisions or genuinely complex logic: explain **why**, not what.
  - Example worth commenting: catching a unique-constraint error because a partial index guards a concurrency case.
  - Not worth commenting: "Creates a property", "Returns the list of administrations", "Current administration, if any".
- No JSDoc on service, controller, or repository methods unless the method has a non-obvious contract.
- Keep comments short (one or two lines).
