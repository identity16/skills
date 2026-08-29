# skills

Agent skills for coding agents, installable with the [Skills CLI](https://github.com/vercel-labs/skills).

## Skills

None yet — add one under `skills/` (see below).

## Install

```bash
# See what's available
npx skills add identity16/skills --list

# Install every skill in this repo
npx skills add identity16/skills

# Install a specific skill
npx skills add identity16/skills --skill <name>

# Install globally (~/.claude/skills) for Claude Code, without prompts
npx skills add identity16/skills --skill <name> -g -a claude-code -y
```

## Adding a skill

Create `skills/<name>/SKILL.md` with YAML frontmatter. The directory name must match `name`.

```markdown
---
name: my-skill
description: What this skill does and when to use it
---

# My Skill

Instructions the agent follows when this skill is activated.
```

Then add it to the Skills table above, and verify it is discoverable before committing:

```bash
npx skills add . --list
```
