# Source-Note Style Audit

The assist page uses draft source notes in FRUS order:

1. Repository or public source
2. Collection, series, box, folder, item title, item ID, case number, or NAID
3. Original classification, release status, handling markings, and page span
4. Transmission, meeting location, drafting, clearance, approval, marginalia, and withheld-material details

## Current Standard

Use `Source:` at the beginning of every source note. Do not promote a finding-aid lead as a document record until the actual source item has been inspected.

## Known Draft-Level Fields

- Clinton Digital Library item pages often expose a public item citation but not the full FRUS source-note trail.
- Finding aids identify useful collection scope but usually lack item-level dates, page spans, and markings.
- FOIA packets must be split into individual candidate records before a final chronology can be drafted.
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
