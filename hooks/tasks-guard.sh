#!/bin/sh
# SDD commit guard (PreToolUse hook).
# Blocks `git commit` while any ACTIVE change in keel/changes/ has unchecked
# tasks in its tasks.md. Archived changes are ignored.
#
# Deliberate bypass — the token must appear IN THE COMMAND ITSELF, because the
# hook process cannot inherit an env prefix applied to the git subprocess:
#   SDD_ALLOW_COMMIT=1 git commit -m "wip: ..."
# (Exporting SDD_ALLOW_COMMIT=1 in the Claude Code parent process also works.)
#
# Exit codes: 0 = allow, 2 = block (stderr is shown to Claude).

input=$(cat)

# Process-env bypass (exported before launching Claude Code).
[ "${SDD_ALLOW_COMMIT}" = "1" ] && exit 0

# Only applies to projects initialized with SDD.
[ -d "keel/changes" ] || exit 0

# Extract the command field with jq when available (precise). Without jq fall
# back to a coarse substring scan of the raw JSON — it can false-positive on
# strings that merely mention "git commit"; acceptable, the bypass token clears it.
if command -v jq >/dev/null 2>&1; then
  cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
else
  cmd="$input"
fi

# Command-level bypass token.
case "$cmd" in
  *SDD_ALLOW_COMMIT=1*) exit 0 ;;
esac

# Detect a git commit invocation: `git commit`, `git -c k=v commit`,
# `git add -A && git commit`, `FOO=1 git commit`. Split on ; & | boundaries and
# anchor `git` at the start of a command segment so file arguments or prose that
# merely mentions "git commit" do not trigger the guard. (Shell aliases and
# command substitution can still evade this — the guard is friction, not a
# security boundary.)
if command -v jq >/dev/null 2>&1; then
  printf '%s\n' "$cmd" | sed 's/[;&|]/\n/g' | grep -qE \
    '^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]+[[:space:]]+)*git([[:space:]]+[^[:space:]]+)*[[:space:]]+commit([[:space:]]|$)' \
    || exit 0
else
  case "$cmd" in
    *"git commit"*) ;;
    *) exit 0 ;;
  esac
fi

offenders=""
for tasks in keel/changes/*/tasks.md; do
  [ -f "$tasks" ] || continue
  # Defense in depth: the single-level glob never descends into archive/,
  # but skip explicitly if the layout ever changes.
  case "$tasks" in
    keel/changes/archive/*) continue ;;
  esac
  pending=$(grep -c '^[[:space:]]*- \[ \]' "$tasks" 2>/dev/null)
  [ -n "$pending" ] || pending=0
  if [ "$pending" -gt 0 ]; then
    change=$(basename "$(dirname "$tasks")")
    offenders="${offenders}  - ${change}: ${pending} unchecked task(s) (${tasks})
"
  fi
done

if [ -n "$offenders" ]; then
  {
    printf '%s\n' "SDD commit guard: active change(s) still have unchecked tasks:"
    printf '%s' "$offenders"
    printf '\n%s\n' "Finish them (/sdd:apply), or bypass deliberately by prefixing the commit itself: SDD_ALLOW_COMMIT=1 git commit -m \"...\" (WIP commits, docs-only commits, chained-PR boundaries)."
  } >&2
  exit 2
fi

exit 0
