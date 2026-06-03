# Source Note Provenance Audit

This audit checks whether the public `frusSourceNote` field follows published FRUS source-note provenance practice. It does not certify final document-level source notes where the underlying PDF or reading-room folder still needs page-span, marking, or withdrawal-sheet extraction.

## Reference Standard

- FRUS 1993-2000, Volume XXVII is still marked by the Office of the Historian as `Being Researched`: https://history.state.gov/historicaldocuments/frus1993-00v27
- Published FRUS source notes begin with `Source:`, cite repository and archival path first, then add classification, handling, action/transmission, approval, marginalia, omitted-material, or related-document details when those details are present in the selected record.
- Published comparison examples used for this audit: FRUS 1989-1992, Volume XXXI, Document 73; FRUS 1969-1976, Volume XXVIII, Southern Africa, Document 81; FRUS 1969-1976, Volume X, Document 290; FRUS 1969-1976, Volume E-9, Part 1, Document 75.
- Repeatable machine check: [`frus-source-note-provenance-audit.json`](frus-source-note-provenance-audit.json).

## Applied Rule For This Site

- Use the formal repository and records lead `William J. Clinton Presidential Library, Clinton Presidential Records` in public source-note provenance.
- Preserve `Clinton Presidential Records` and the best available collection/series/box/folder/item-title trail after the repository name.
- Exclude Clinton Digital Library item numbers, NAIDs, `PDF available` language, and review caveats from `frusSourceNote`; keep those in `sourceNote` or `working_source_note`.
- Do not invent classification, distribution, drafting, clearance, approval, marginalia, or page-span claims before the record itself has been read.

## Results

| Check | Result |
| --- | --- |
| Records audited | 42 |
| Formal repository name in public provenance | 42/42 |
| Clinton Presidential Records layer in public provenance | 42/42 |
| Catalog/PDF/NAID language in public provenance | 0 flagged |
| Include candidates needing final document-level source-note extraction | 6 |
| Boundary-review candidates needing disposition/page-span work | 3 |
| Source leads/finding aids with provisional provenance | 13 |
| Public statement/audio context records | 22 |
| Machine-audit provenance failures | 0 |

## Include-Candidate Follow-Up

| ID | Record | Provenance status |
| --- | --- | --- |
| clinton-v27-005 | Soderberg notes from Bosnia and Angola PC meeting | Public provenance normalized; final FRUS source note still needs PDF page span, markings, and omitted-material accounting. |
| clinton-v27-022 | Zimbabwe 1995 and Zimbabwe 1997 FOIA release packet | Public provenance normalized; final FRUS source note still needs PDF page span, markings, and omitted-material accounting. |
| clinton-v27-023 | Mugabe visit briefing packet and talking points | Public provenance normalized; final FRUS source note still needs PDF page span, markings, and omitted-material accounting. |
| clinton-v27-029 | Mbeki AIDS controversy packet, part 1 | Public provenance normalized; final FRUS source note still needs PDF page span, markings, and omitted-material accounting. |
| clinton-v27-030 | Mbeki AIDS controversy packet, part 2 | Public provenance normalized; final FRUS source note still needs PDF page span, markings, and omitted-material accounting. |
| clinton-v27-038 | MDR packet on Victor Butt/Bout arms trafficking and sub-Saharan Africa | Public provenance normalized; final FRUS source note still needs PDF page span, markings, and omitted-material accounting. |

## Known Limits

- Finding aids and source leads are not final FRUS document citations; they are kept in the chronology only as pull or replacement-search controls.
- Release packets should be split into selected document records before final publication if individual memoranda, cables, or briefing papers are promoted.
- Public statements and audio controls can support annotation or chronology, but should not substitute for internal policy records unless the selected FRUS item requires public-context documentation.
