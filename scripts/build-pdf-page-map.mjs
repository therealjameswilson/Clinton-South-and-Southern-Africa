import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TMP_DIR = path.join(ROOT, ".tmp-pdf-map");
const DATA_DIR = path.join(ROOT, "data");
const REPORTS_DIR = path.join(ROOT, "reports");
const RECORDS_PATH = path.join(DATA_DIR, "records.json");
const CSV_PATH = path.join(DATA_DIR, "pdf-page-map.csv");
const REPORT_PATH = path.join(REPORTS_DIR, "pdf-page-map.md");

function sh(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      maxBuffer: 50_000_000,
      ...options
    });
  } catch (error) {
    const detail = error.stderr?.toString?.().trim();
    throw new Error(`${command} failed${detail ? `: ${detail}` : ""}`);
  }
}

function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function csv(value) {
  return `"${compact(value).replaceAll('"', '""')}"`;
}

function recordPdfFiles(record) {
  const files = Array.isArray(record.pdfFiles) ? [...record.pdfFiles] : [];
  if (record.pdfUrl && !files.some((file) => file.url === record.pdfUrl)) {
    files.unshift({
      label: record.pdfLabel || "PDF",
      url: record.pdfUrl,
      pages: record.pageCount
    });
  }
  return files.filter((file) => file?.url);
}

function pageCount(pdfPath) {
  const info = sh("pdfinfo", [pdfPath]);
  return Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
}

function pageText(pdfPath, page) {
  return sh("pdftotext", ["-f", String(page), "-l", String(page), "-layout", pdfPath, "-"]);
}

function pageRole(text) {
  const body = compact(text);
  if (body.length < 20) return "blank_or_image_only";
  if (/FOIA MARKER/i.test(body)) return "administrative_marker";
  if (/Withdrawal\/Redaction Marker/i.test(body)) return "withdrawal_marker";
  if (/Withdrawal\/Redaction Sheet/i.test(body) || /DOCUMENT NO\..*RESTRICTION/i.test(body)) return "withdrawal_sheet";
  if (/DECLASSIFIED|SECRET|CONFIDENTIAL|UNCLASSIFIED|LIMITED OFFICIAL USE|MEMORANDUM|TO:|FROM:/i.test(body)) {
    return "released_document_text";
  }
  return "released_or_context_text";
}

function firstSignal(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => compact(line))
    .filter((line) => line.length > 0);
  const useful = lines.find((line) => !/^\d+$/.test(line) && !/^page \d+/i.test(line)) || lines[0] || "";
  return useful.slice(0, 180);
}

function dateSignal(text) {
  const body = compact(text);
  const match = body.match(
    /\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z.]*\s+\d{1,2},?\s+\d{4}|\d{4})\b/i
  );
  return match?.[0] || "";
}

function roleCounts(rows) {
  const counts = {};
  for (const row of rows) counts[row.page_role] = (counts[row.page_role] || 0) + 1;
  return counts;
}

function roleRanges(rows) {
  const ranges = [];
  let current = null;
  for (const row of rows) {
    if (!current || current.role !== row.page_role) {
      current = { role: row.page_role, start: row.pdf_page, end: row.pdf_page, signal: row.page_signal };
      ranges.push(current);
    } else {
      current.end = row.pdf_page;
    }
  }
  return ranges.map((range) => ({
    ...range,
    pages: range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`
  }));
}

function downloadPdf(url, pdfPath) {
  if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 1000) return;
  execFileSync("curl", ["-L", "--fail", "--silent", "--show-error", url, "-o", pdfPath], { stdio: "inherit" });
}

function build() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const records = JSON.parse(fs.readFileSync(RECORDS_PATH, "utf8"));
  const candidates = records
    .filter((record) => record.selectionDecision === "Include candidate" && recordPdfFiles(record).length)
    .sort((a, b) => (a.sortDate || a.date || "").localeCompare(b.sortDate || b.date || ""));

  const rows = [];
  const summaries = [];

  for (const record of candidates) {
    const [file] = recordPdfFiles(record);
    const pdfPath = path.join(TMP_DIR, `${record.id}.pdf`);
    downloadPdf(file.url, pdfPath);

    const pages = pageCount(pdfPath);
    const recordRows = [];
    for (let page = 1; page <= pages; page += 1) {
      const text = pageText(pdfPath, page);
      const row = {
        record_id: record.id,
        record_date: record.date || record.sortDate || "",
        record_title: record.documentTitle || record.title || "",
        topic: record.topic?.name || "",
        catalog_url: record.catalogUrl || "",
        pdf_url: file.url,
        pdf_page: page,
        page_role: pageRole(text),
        date_signal: dateSignal(text),
        page_signal: firstSignal(text),
        extracted_text_chars: compact(text).length
      };
      rows.push(row);
      recordRows.push(row);
    }

    summaries.push({
      record,
      file,
      pages,
      counts: roleCounts(recordRows),
      ranges: roleRanges(recordRows)
    });
  }

  const header = [
    "record_id",
    "record_date",
    "record_title",
    "topic",
    "catalog_url",
    "pdf_url",
    "pdf_page",
    "page_role",
    "date_signal",
    "page_signal",
    "extracted_text_chars"
  ];
  fs.writeFileSync(CSV_PATH, [header, ...rows.map((row) => header.map((key) => csv(row[key])).join(","))].join("\n") + "\n");

  const report = [
    "# Selection Candidate PDF Page Map",
    "",
    "First-pass page map for the six include-candidate PDFs in `data/records.json`.",
    "",
    "This is a triage aid, not a final FRUS source note. Page roles are inferred from OCR/text-layer signals and must be verified against the PDF before final selection, citation, or declassification accounting.",
    "",
    `Generated from ${summaries.length} candidate PDFs and ${rows.length} PDF pages.`,
    "",
    "Machine-readable page map: [`data/pdf-page-map.csv`](../data/pdf-page-map.csv).",
    "",
    "Companion work surfaces: [`pdfs/`](../pdfs/) and [`reports/extraction-worksheet.md`](extraction-worksheet.md).",
    "",
    "## Summary",
    "",
    "| Record | Pages | Administrative markers | Withdrawal sheets | Withdrawal markers | Released/context pages | First action |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ...summaries.map(({ record, pages, counts }) => {
      const released = (counts.released_document_text || 0) + (counts.released_or_context_text || 0);
      const action =
        record.id === "clinton-v27-005"
          ? "Confirm whether the notes themselves are withheld or available only through markers."
          : record.id === "clinton-v27-023"
            ? "Use the CSV to separate released briefing pages from withdrawal sheets."
            : record.id === "clinton-v27-038"
              ? "Start with released-document pages and flag Angola/UNITA/South Africa enforcement spans."
              : "Map released pages, withdrawal sheets, and candidate document boundaries.";
      return `| ${record.id} | ${pages} | ${counts.administrative_marker || 0} | ${counts.withdrawal_sheet || 0} | ${
        counts.withdrawal_marker || 0
      } | ${released} | ${action} |`;
    }),
    "",
    "## Page-Role Legend",
    "",
    "- `administrative_marker`: Clinton Library or FOIA administrative cover/marker page.",
    "- `withdrawal_sheet`: withdrawal/redaction sheet listing withheld or partially withheld documents.",
    "- `withdrawal_marker`: marker page standing in for a restricted or withdrawn document.",
    "- `released_document_text`: page with strong document-text signals such as classification, memorandum, sender/recipient, or declassification marks.",
    "- `released_or_context_text`: OCR/text present, but the page needs human review to determine whether it is a released document, context page, duplicate, or attachment.",
    "- `blank_or_image_only`: no useful text layer detected by `pdftotext`.",
    "",
    "## Record Page Ranges",
    "",
    ...summaries.flatMap(({ record, file, pages, ranges }) => [
      `### ${record.id} - ${record.documentTitle || record.title}`,
      "",
      `- Date: ${record.date || record.sortDate || "Date pending"}`,
      `- Topic: ${record.topic?.name || "Topic pending"}`,
      `- Catalog item: ${record.catalogUrl || "Pending"}`,
      `- Direct PDF: ${file.url}`,
      `- PDF pages: ${pages}`,
      "",
      "| PDF pages | First-pass role | First page signal |",
      "| --- | --- | --- |",
      ...ranges.map((range) => `| ${range.pages} | ${range.role} | ${range.signal || "No text signal"} |`),
      ""
    ])
  ].join("\n");

  fs.writeFileSync(REPORT_PATH, report);

  console.log(`Wrote ${rows.length} page rows to ${path.relative(ROOT, CSV_PATH)}`);
  console.log(`Wrote report to ${path.relative(ROOT, REPORT_PATH)}`);
}

build();
