# Clinton South and Southern Africa FRUS Assist

Static GitHub Pages workbench for source leads related to:

<https://history.state.gov/historicaldocuments/frus1993-00v27>

Official volume title:

**Foreign Relations of the United States, 1993-2000, Volume XXVII, South Africa; Southern Africa**

The Office of the Historian currently lists the volume as **Being Researched**, so this site treats records as compiler leads and working candidates rather than a final documentary chronology.

Public site:

<https://therealjameswilson.github.io/Clinton-South-and-Southern-Africa/>

## What Is Included

- Date-first chronology for released or public candidate records
- First-hour compiler workflow with live counts and direct actions
- Static declassified chronology report and CSV with 29 records and 32 direct PDF links
- Searchable chronology desk at `chronology/` with open/download PDF actions
- Deduplicated PDF download manifest at `downloads/`, with CSV exports and a bulk shell script
- Reading-room pull queue at `pulls/` with request actions, replacement searches, report, and CSV
- Browser-generated chronology CSV and Markdown worksheet exports
- PDF review desk with local extraction scratchpad and Markdown note exports
- First-pass page map for the 6 strongest candidate PDFs, with 395 page-level triage rows and direct page links
- Range-level PDF review queue with 166 consecutive page-role spans and suggested actions
- Candidate extraction status dashboard with released/withheld page counts and next actions
- Source-note finalization queue with CSV export
- Searchable source records with type, country/source metadata, and production-gap filters
- FRUS-style source-note and declassification quality gates
- Compiler gap analysis for being-researched volume risks
- Clinton Library pull strategy and reading-room priorities
- Primary source anchor list and ingest checklist
- Seed data in `data/records.json` and direct-file fallback data in `data/records.js`
- Reproducible declassified chronology generator in `scripts/build-declassified-chronology.mjs`
- Reproducible pull-queue generator in `scripts/build-pull-queue.mjs`
- Reproducible PDF page-map generator in `scripts/build-pdf-page-map.mjs`
- Reproducible PDF download manifest generator in `scripts/build-pdf-download-manifest.mjs`

## Local Preview

This is a static site. You can open `index.html` directly, or serve it locally:

```bash
python3 -m http.server 4174
```

Then open:

```text
http://127.0.0.1:4174
```

## Declassified Chronology

The static chronology is generated from `data/records.json` and includes released, declassified, and public document records. It excludes finding aids and audio-only controls.

```bash
node scripts/build-declassified-chronology.mjs
```

Outputs:

- `chronology/index.html`
- `reports/declassified-chronology.md`
- `data/declassified-chronology.csv`

## PDF Download Manifest

The PDF download manifest deduplicates direct PDF links from the chronology and emits one browser page, one unique-PDF CSV, one record-link CSV, and a shell script for bulk download.

```bash
node scripts/build-pdf-download-manifest.mjs
```

Outputs:

- `downloads/index.html`
- `reports/pdf-download-manifest.md`
- `data/pdf-download-manifest.csv`
- `data/pdf-record-links.csv`
- `scripts/download-source-pdfs.sh`

## Reading-Room Pull Queue

The pull queue is generated from `data/records.json` and captures unscanned collection leads, replacement searches, boundary decisions, and digital-extraction blockers.

```bash
node scripts/build-pull-queue.mjs
```

Outputs:

- `pulls/index.html`
- `reports/reading-room-pull-queue.md`
- `data/reading-room-pull-queue.csv`

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
