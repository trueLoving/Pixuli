---
name: ref-issue-pr
description: >-
  Works REF-* refactor issues into PRs and keeps PLANS.md in sync. Use when
  implementing GitHub Issues with REF- prefix, milestone M1–M6, or updating
  refactor tracking tables.
---

# REF Issue → PR

## Before coding

1. Read issue body on GitHub (`gh issue view <n>`) for **计划编号** (REF-xxx)
2. Open matching row in [PLANS.md](../../PLANS.md) — check **Depends on**,
   **Labels**, **建议顺序**
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
- [ ] pnpm run ci
- [ ] …

Fixes #<issue> # only if PR fully closes the issue Related: REF-<id>
```

- Title: `[M4] REF-414 …` or `fix(m3): … (REF-313)`
- Link milestone label if applicable (`m4`, `refactor`, etc.)

## After merge

1. Align with GitHub: issue should be `CLOSED` if `Fixes #n` merged
2. Update [PLANS.md](../../PLANS.md)：对应行 **状态** → ✅，或从「进行中」表移除
3. 更新 Plans 文首 **最近同步** 日期；必要时跑 `gh issue list --state open`
   核对 OPEN 条数
4. User-facing docs → `docs/01-product`；Agent/Skill → `AGENTS.md` /
   `.cursor/`（仅架构边界变更时）

## Add a new task

1. `gh issue create`（标题含 `[M4|M5|M6]`，label / milestone 齐全）
2. 把 `#number`、标题、REF-id 写入 [PLANS.md](../../PLANS.md) 对应里程碑表
3. 需要排期时写入「当前焦点」表
