---
name: ref-issue-pr
description: >-
  Works REF-* refactor issues into PRs and keeps REFACTOR_PLAN.md in sync. Use
  when implementing GitHub Issues with REF- prefix, milestone M1–M6, or updating
  refactor tracking tables.
---

# REF Issue → PR

## Before coding

1. Read issue body on GitHub (`gh issue view <n>`) for **计划编号** (REF-xxx)
2. Open matching row in [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md) — check
   **Depends on**, **Labels**, **建议顺序**
3. Read linked docs under `docs/` (not `.local/` unless available)

## Implementation

- Smallest correct diff; match monorepo conventions
  ([AGENTS.md](../../AGENTS.md))
- Run `pnpm test`; add tests for provider/core changes
- Do not commit unless user asks

## PR

```markdown
## Summary

- …

## Test plan

- [ ] pnpm test
- [ ] …

Fixes #<issue> # only if PR fully closes the issue Related: REF-<id>
```

- Title: `[M4] REF-414 …` or `fix(m3): … (REF-313)`
- Link milestone label if applicable (`m4`, `refactor`, etc.)

## After merge

1. Set REFACTOR_PLAN table **状态** to ✅ for completed REF-xxx
2. Ensure **GitHub #** column has issue link (create issue first if 「待建」)
3. Update §六进度表 counts if closing milestone items
4. User-facing docs → `docs/01-product` / Wiki source; **Agent/Skill** →
   `AGENTS.md` / `.cursor/` when architecture boundaries change

## Issue creation (batch)

```bash
gh issue create \
  --title "[M6] …" \
  --label "refactor,m6,area:product,priority:P1" \
  --milestone "M6-产品体验与能力边界" \
  --body "$(cat <<'EOF'
## 计划编号
REF-xxx
…
EOF
)"
```

Then paste `#number` into REFACTOR_PLAN mapping tables.
