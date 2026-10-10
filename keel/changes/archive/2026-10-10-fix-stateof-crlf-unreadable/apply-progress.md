# Apply: Harden stateOf and activeChanges

External contribution (PR #30, closes #23) by Tiyatrotist. `stateOf` tolerates CRLF line
endings and strips surrounding quotes from values instead of silently misreading them;
`stateOf` and `activeChanges` return an empty result on any read error (unreadable file,
state.yaml as a directory, missing dir) instead of throwing. `bin/sdd` now exports both
for direct testing. Covered by two new tests in `test/store.test.js`.

Maintainer cleanup before merge: dropped a redundant `trimEnd()` (the CRLF split already
removes it), removed an inner try/catch in `activeChanges` that could never fire now that
`stateOf` never throws, corrected the comment on `readStateStrict` (it no longer shares
`stateOf`'s CRLF/quote tolerance), and added the missing CHANGELOG entry.
