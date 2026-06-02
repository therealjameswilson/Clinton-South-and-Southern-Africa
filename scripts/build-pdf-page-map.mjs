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
const RANGE_CSV_PATH = path.join(DATA_DIR, "pdf-range-review.csv");
const REPORT_PATH = path.join(REPORTS_DIR, "pdf-page-map.md");
const RANGE_REPORT_PATH = path.join(REPORTS_DIR, "pdf-range-review.md");

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
      current = { role: row.page_role, start: row.pdf_page, end: row.pdf_page, signal: row.page_signal, pageUrl: row.page_url };
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

function roleLabel(role) {
  return (
    {
      administrative_marker: "Administrative marker",
      withdrawal_sheet: "Withdrawal sheet",
      withdrawal_marker: "Withdrawal marker",
      released_document_text: "Released document text",
      released_or_context_text: "Released/context text",
      blank_or_image_only: "Blank or image-only"
    }[role] || String(role || "").replaceAll("_", " ")
  );
}

function priorityForRole(role) {
  return (
    {
      released_document_text: 1,
      released_or_context_text: 2,
      withdrawal_sheet: 3,
      withdrawal_marker: 3,
      blank_or_image_only: 4,
      administrative_marker: 5
    }[role] || 5
  );
}

function actionForRole(role) {
  return (
    {
      released_document_text: "Read closely for possible document extraction; capture boundary, markings, page span, and selection rationale.",
      released_or_context_text: "Skim for document boundary, attachment, duplicate, or context; promote only if it carries decision-grade evidence.",
      withdrawal_sheet: "Record withheld-document metadata, exemptions, and dates; queue replacement search or onsite review if volume-relevant.",
      withdrawal_marker: "Record marker page and exemption context; pair with nearby withdrawal sheet or released surrounding pages.",
      blank_or_image_only: "Open the PDF image directly and verify whether the page is blank, a divider, or a scan without useful text.",
      administrative_marker: "Use for case/control metadata only; do not treat as a selectable FRUS document."
    }[role] || "Review manually and assign extraction disposition."
  );
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
        page_url: `${file.url}#page=${page}`,
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
    "page_url",
    "page_role",
    "date_signal",
    "page_signal",
    "extracted_text_chars"
  ];
  fs.writeFileSync(CSV_PATH, [header, ...rows.map((row) => header.map((key) => csv(row[key])).join(","))].join("\n") + "\n");

  const rangeRows = summaries.flatMap(({ record, file, ranges }) =>
    ranges.map((range) => ({
      record_id: record.id,
      record_date: record.date || record.sortDate || "",
      record_title: record.documentTitle || record.title || "",
      topic: record.topic?.name || "",
      catalog_url: record.catalogUrl || "",
      pdf_url: file.url,
      page_range: range.pages,
      first_page: range.start,
      last_page: range.end,
      page_count: range.end - range.start + 1,
      page_url: range.pageUrl,
      page_role: range.role,
      page_role_label: roleLabel(range.role),
      review_priority: priorityForRole(range.role),
      first_page_signal: range.signal,
      suggested_action: actionForRole(range.role)
    }))
  );

  const rangeHeader = [
    "record_id",
    "record_date",
    "record_title",
    "topic",
    "catalog_url",
    "pdf_url",
    "page_range",
    "first_page",
    "last_page",
    "page_count",
    "page_url",
    "page_role",
    "page_role_label",
    "review_priority",
    "first_page_signal",
    "suggested_action"
  ];
  fs.writeFileSync(
    RANGE_CSV_PATH,
    [rangeHeader, ...rangeRows.map((row) => rangeHeader.map((key) => csv(row[key])).join(","))].join("\n") + "\n"
  );

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
    "Range-level review queue: [`reports/pdf-range-review.md`](pdf-range-review.md) and [`data/pdf-range-review.csv`](../data/pdf-range-review.csv).",
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
      "| PDF pages | Open | First-pass role | First page signal |",
      "| --- | --- | --- | --- |",
      ...ranges.map((range) => `| ${range.pages} | [Open](${range.pageUrl}) | ${roleLabel(range.role)} | ${range.signal || "No text signal"} |`),
      ""
    ])
  ].join("\n");

  fs.writeFileSync(REPORT_PATH, report);

  const readFirstRows = rangeRows.filter((row) => row.review_priority <= 2);
  const controlRows = rangeRows.filter((row) => row.review_priority > 2);
  const rangeReport = [
    "# Selection Candidate PDF Range Review Queue",
    "",
    "A shorter, range-level queue generated from the page map for the six include-candidate PDFs.",
    "",
    "Use this when the compiler needs to decide what PDF span to read next. It does not replace the page-level map or final human document boundary work.",
    "",
    `Generated from ${summaries.length} candidate PDFs, ${rows.length} PDF pages, and ${rangeRows.length} consecutive page-role ranges.`,
    "",
    "Detailed page map: [`reports/pdf-page-map.md`](pdf-page-map.md). Machine-readable range queue: [`data/pdf-range-review.csv`](../data/pdf-range-review.csv).",
    "",
    "## Read First",
    "",
    "Released/context ranges are the highest-yield places to extract possible FRUS documents.",
    "",
    "| Record | Pages | Open | Role | First page signal | Suggested action |",
    "| --- | --- | --- | --- | --- | --- |",
    ...readFirstRows.map(
      (row) =>
        `| ${row.record_id} | ${row.page_range} | [Open](${row.page_url}) | ${row.page_role_label} | ${
          row.first_page_signal || "No text signal"
        } | ${row.suggested_action} |`
    ),
    "",
    "## Control, Withheld, And Image Ranges",
    "",
    "Use these ranges for declassification accounting, replacement searches, and source-note caveats.",
    "",
    "| Record | Pages | Open | Role | First page signal | Suggested action |",
    "| --- | --- | --- | --- | --- | --- |",
    ...controlRows.map(
      (row) =>
        `| ${row.record_id} | ${row.page_range} | [Open](${row.page_url}) | ${row.page_role_label} | ${
          row.first_page_signal || "No text signal"
        } | ${row.suggested_action} |`
    )
  ].join("\n");

  fs.writeFileSync(RANGE_REPORT_PATH, rangeReport);

  console.log(`Wrote ${rows.length} page rows to ${path.relative(ROOT, CSV_PATH)}`);
  console.log(`Wrote ${rangeRows.length} range rows to ${path.relative(ROOT, RANGE_CSV_PATH)}`);
  console.log(`Wrote report to ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`Wrote range report to ${path.relative(ROOT, RANGE_REPORT_PATH)}`);
}

build();
