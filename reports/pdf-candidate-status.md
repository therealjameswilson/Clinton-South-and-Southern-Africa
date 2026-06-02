# Selection Candidate PDF Extraction Status

Six-record dashboard for deciding where the compiler should spend close-reading time first.

This status layer is generated from the page map and range review queue. It summarizes released/context pages, withdrawal/control pages, first readable range, and the next extraction action for each include-candidate PDF.

Generated from 6 candidate PDFs, 395 PDF pages, 166 page-role ranges, and 6 candidate status rows.

Companion files: [`reports/pdf-page-map.md`](pdf-page-map.md), [`reports/pdf-range-review.md`](pdf-range-review.md), and [`data/pdf-candidate-status.csv`](../data/pdf-candidate-status.csv).

## Status Dashboard

| Record | PDF pages | Released/context pages | Withheld/control pages | Read-first ranges | First read | Status | Next action |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| clinton-v27-005 | 3 | 0 | 3 | 0 | Replacement/onsite review | Withheld/control only | Log the administrative and withdrawal pages, then queue replacement search or onsite review before promotion. |
| clinton-v27-022 | 6 | 4 | 2 | 3 | [2](https://clinton.presidentiallibraries.us/files/original/df4bb9956a0cbbcb0c924a11c321abd7.pdf#page=2) | Mixed released/withheld | Read released Zimbabwe ranges first, then log withheld briefing/correspondence controls for replacement searches. |
| clinton-v27-023 | 157 | 142 | 15 | 38 | [3](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=3) | Mixed released/withheld | Read released Zimbabwe ranges first, then log withheld briefing/correspondence controls for replacement searches. |
| clinton-v27-030 | 61 | 39 | 22 | 15 | [16-17](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=16) | Mixed released/withheld | Read released AIDS-diplomacy ranges first, then attach withdrawal accounting to any candidate source note. |
| clinton-v27-029 | 70 | 54 | 16 | 36 | [7-8](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=7) | Mixed released/withheld | Read released AIDS-diplomacy ranges first, then attach withdrawal accounting to any candidate source note. |
| clinton-v27-038 | 98 | 98 | 0 | 31 | [1](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=1) | Released text dominant | Start with released-document ranges and extract Angola/UNITA sanctions plus South Africa enforcement strategy spans. |

## Working Notes

- `Withheld/control only` means no released/context text layer was detected; the item may still matter as a withdrawal or replacement-search lead.
- `Mixed released/withheld` means extraction can begin from released pages, but the source note needs explicit withdrawal/exemption accounting.
- `Released text dominant` means the public PDF has no detected withdrawal/control pages in this first-pass map.
- Treat these counts as triage signals. Final FRUS selection still requires human document-boundary review, markings, page spans, and declassification verification.