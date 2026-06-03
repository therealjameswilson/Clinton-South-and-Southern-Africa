# Source-Note Style Audit

The assist page now separates the public citation from the verification locator:

- `frusSourceNote` is the public-facing citation and should read like a published FRUS source note.
- `sourceNote` remains the working locator for Clinton Digital Library item IDs, NAIDs, PDF availability, and review caveats.

The public source note uses FRUS order:

1. Repository or public source
2. Collection, series, box, folder, and item title
3. Original classification, release status, handling markings, and page span
4. Transmission, meeting location, drafting, clearance, approval, marginalia, and withheld-material details

## Current Standard

Use `Source:` at the beginning of every public source note. Do not include Clinton Digital Library item IDs, NAIDs, "PDF available" language, or review caveats in `frusSourceNote`; put those in `sourceNote` or `sourceNoteAddendum`.

Do not promote a finding-aid lead as a document record until the actual source item has been inspected.

## Current Seed Status

- All structured records now include a `frusSourceNote` with repository, collection or series, box/folder/item title when available, and a FRUS-style `Source:` lead.
- The older `sourceNote` field still carries item ID, case number, NAID, PDF availability, and review-status context for auditability.
- Released packets are still seed records until page spans, internal document titles, markings, and withdrawal-sheet relationships are extracted.
- Finding aids remain source leads when the Clinton Digital Library says scans are not available online.

## Known Draft-Level Fields

- Clinton Digital Library item pages often expose a public item citation but not the full FRUS source-note trail.
- Finding aids identify useful collection scope but usually lack item-level dates, page spans, and markings.
- FOIA packets must be split into individual candidate records before a final chronology can be drafted; the Zimbabwe packets now have first-pass splits, but exact page spans still need extraction.
- Public statements and audio are context records unless they illuminate the public framing of a selected policy document.

## Required Promotion Fields

- `date`
- `washingtonTime` for memcons and telcons where available
- `source.path` or collection/series/box/folder fields
- `documentMarkings`
- `declassificationStatus`
- `pageCount` or `sourcePages`
- `selectionDecision`
- `annotationStatus`
- `indexTerms`
