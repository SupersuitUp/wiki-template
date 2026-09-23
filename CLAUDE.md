# Working in a wiki built on wiki-template

This file ships with the template, so every fork carries it. It holds what an agent has to
know BEFORE it edits anything here, not a description of the project.

## Read the ledger before you edit

**Run `pnpm template:version` first, then read `UPGRADE-LEDGER.md` from the version it reports
forward.** Every entry between that version and the newest is a change this wiki has not taken
yet, and each one names a DETECTOR (how to tell whether you already have it) and a REMEDY (what
to copy or edit).

The reason this is a rule rather than a suggestion: an edit written against the newest
template's shape, applied to a wiki several versions behind, is correct in the template and
broken here, and nothing fails at the time. It surfaces later as a build error or a page that
renders wrong, by which point the edit and the cause no longer look related.

**The fleet is not uniform on purpose.** Wikis with their own share systems, with Freedom-owned
middleware, or with no middleware at all deliberately sit back on older versions, so "behind"
is a question to answer rather than a defect to fix. Read what this wiki says about itself
before lifting it.

## Never prepend to the ledger

`scripts/check-template-version.mjs` reads the LAST heading as the newest version. Append only.
Prepending or reordering makes every instance in the fleet report the wrong version, and
nothing reports that it happened.
