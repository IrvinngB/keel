# Security Policy

## Supported versions

Only the latest release receives fixes.

## Reporting a vulnerability

Please do not open a public issue. Use
[GitHub private vulnerability reporting](https://github.com/IrvinngB/keel/security/advisories/new)
and include the affected version, steps to reproduce, and the impact.

You can expect an acknowledgement within 7 days. Once a fix is released, the advisory
is published with credit to the reporter unless you ask otherwise.

## Scope

Relevant areas include anything `sdd install` writes outside its declared paths
(path traversal via `--context-file`, symlink escapes), changes to user content
outside the `keel:begin/end` markers, and the git hooks in `hooks/`.
