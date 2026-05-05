# Skill Registry

Generated: 2026-05-04
Project: `mytime`

## Project Status

- Project root scanned at `C:\Projects\mytime`
- Detected project files: none
- Project-level skills: none
- Project-level agent convention files: none
- Note: this registry currently includes only user-level shared skills because the repository is effectively empty

## Available Skills

| Skill | Source | Trigger / Use Case |
|---|---|---|
| `branch-pr` | `C:\Users\influ\.config\opencode\skills\branch-pr\SKILL.md` | Create pull requests or prepare branches for review |
| `conventional-commit` | `C:\Users\influ\.agents\skills\conventional-commit\SKILL.md` | Generate conventional commit messages |
| `find-skills` | `C:\Users\influ\.agents\skills\find-skills\SKILL.md` | Discover installable skills or extended capabilities |
| `git-workflow` | `C:\Users\influ\.config\opencode\skills\git-workflow\SKILL.md` | Safe Git branching, staging, syncing, recovery, and PR work |
| `go-testing` | `C:\Users\influ\.config\opencode\skills\go-testing\SKILL.md` | Write Go tests, including Bubbletea TUI and coverage work |
| `intro-item` | `C:\Users\influ\.config\opencode\skills\intro-item\SKILL.md` | Generate or fix course introductory item 1.1 |
| `issue-creation` | `C:\Users\influ\.config\opencode\skills\issue-creation\SKILL.md` | Create GitHub issues for bugs or features |
| `judgment-day` | `C:\Users\influ\.config\opencode\skills\judgment-day\SKILL.md` | Run dual adversarial reviews on implemented work |
| `react-curso` | `C:\Users\influ\.config\opencode\skills\react-curso\SKILL.md` | Follow React course-viewer frontend conventions |
| `skill-creator` | `C:\Users\influ\.config\opencode\skills\skill-creator\SKILL.md` | Create new AI agent skills and instruction packs |
| `sql-senior` | `C:\Users\influ\.config\opencode\skills\sql-senior\SKILL.md` | Analyze PostgreSQL queries, indexes, and performance |
| `syllabus-generator` | `C:\Users\influ\.config\opencode\skills\syllabus-generator\SKILL.md` | Generate the initial 3-file syllabus structure |
| `syllabus-to-course` | `C:\Users\influ\.config\opencode\skills\syllabus-to-course\SKILL.md` | Convert a syllabus into full course content |

## Excluded Skills

- All `sdd-*` skills were intentionally excluded from the registry listing
- `_shared` and `skill-registry` were intentionally excluded

## Detection Notes

- Deduplication rule: project-level skills would override user-level skills if present
- Because the repository has no application files yet, stack and testing detection must be treated as provisional until `package.json`, `angular.json`, and backend config files exist
