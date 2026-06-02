# Clinton South and Southern Africa FRUS Assist

Static GitHub Pages workbench for source leads related to:

<https://history.state.gov/historicaldocuments/frus1993-00v27>

Official volume title:

**Foreign Relations of the United States, 1993-2000, Volume XXVII, South Africa; Southern Africa**

The Office of the Historian currently lists the volume as **Planned**, so this site treats records as compiler leads and working candidates rather than a final documentary chronology.

Public site:

<https://therealjameswilson.github.io/Clinton-South-and-Southern-Africa/>

## What Is Included

- Date-first chronology for released or public candidate records
- First-hour compiler workflow with live counts and direct actions
- Chronology CSV and Markdown worksheet exports
- PDF review desk with local extraction scratchpad and Markdown note exports
- First-pass page map for the 6 strongest candidate PDFs, with 395 page-level triage rows and direct page links
- Range-level PDF review queue with 166 consecutive page-role spans and suggested actions
- Candidate extraction status dashboard with released/withheld page counts and next actions
- Source-note finalization queue with CSV export
- Searchable source records with type, scope area, and production-gap filters
- FRUS-style source-note and declassification quality gates
- Compiler gap analysis for planned-volume risks
- Clinton Library pull strategy and reading-room priorities
- Primary source anchor list and ingest checklist
- Seed data in `data/records.json` and direct-file fallback data in `data/records.js`
- Reproducible PDF page-map generator in `scripts/build-pdf-page-map.mjs`

## Local Preview

This is a static site. You can open `index.html` directly, or serve it locally:

```bash
python3 -m http.server 4174
```

Then open:

```text
http://127.0.0.1:4174
```

## PDF Page Map

The page map is generated from the include-candidate PDFs listed in `data/records.json`.
It requires the Poppler command-line tools `pdfinfo` and `pdftotext`.

```bash
node scripts/build-pdf-page-map.mjs
```

Outputs:

- `reports/pdf-page-map.md`
- `data/pdf-page-map.csv`
- `reports/pdf-range-review.md`
- `data/pdf-range-review.csv`
- `reports/pdf-candidate-status.md`
- `data/pdf-candidate-status.csv`

## Source Base

- Official FRUS volume page: <https://history.state.gov/historicaldocuments/frus1993-00v27>
- Clinton Library research guide: <https://www.clintonlibrary.gov/research/guide>
- Clinton Digital Library finding aids: <https://clinton.presidentiallibraries.us/collections/show/82>
- Clinton Library memcons: <https://clinton.presidentiallibraries.us/collections/show/255>
- Clinton Library telcons: <https://clinton.presidentiallibraries.us/collections/show/256>
- State Department FOIA Virtual Reading Room: <https://foia.state.gov/>
- National Archives Catalog: <https://catalog.archives.gov/>
