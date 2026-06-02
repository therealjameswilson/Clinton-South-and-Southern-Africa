import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DATA_DIR = path.join(ROOT, "data");
const REPORTS_DIR = path.join(ROOT, "reports");
const RECORDS_PATH = path.join(DATA_DIR, "records.json");
const STATUS_CSV_PATH = path.join(DATA_DIR, "pdf-candidate-status.csv");
const CSV_PATH = path.join(DATA_DIR, "declassified-chronology.csv");
const REPORT_PATH = path.join(REPORTS_DIR, "declassified-chronology.md");

function compact(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function csv(value) {
  return `"${compact(value).replaceAll('"', '""')}"`;
}

function md(value) {
  return compact(value).replaceAll("|", "\\|") || "";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header = [], ...body] = rows.filter((entry) => entry.length && entry.some((value) => value !== ""));
  return body.map((entry) => Object.fromEntries(header.map((key, index) => [key, entry[index] || ""])));
}

function formatDate(dateString) {
  if (!dateString) return "Date pending";
  if (/^\d{4}$/.test(dateString)) return dateString;
  const date = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function byChronology(a, b) {
  return (
    (a.sortDate || a.date || "9999-12-31").localeCompare(b.sortDate || b.date || "9999-12-31") ||
    (a.washingtonTime || "").localeCompare(b.washingtonTime || "") ||
    (a.title || "").localeCompare(b.title || "")
  );
}

function listValues(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
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

function isDeclassifiedChronologyRecord(record) {
  if (["Finding Aid", "Audio/Visual"].includes(record.type)) return false;

  const statusText = [
    record.type,
    record.releaseStatus,
    record.declassificationStatus,
    record.originalClassification,
    record.source?.name,
    record.source?.collection,
    record.sourceNote
  ]
    .filter(Boolean)
    .join(" ");

  return (
    recordPdfFiles(record).length > 0 ||
    ["Memcon", "Telcon", "Release Packet", "Public Statement"].includes(record.type) ||
    /\b(FOIA|MDR|released|declassified|unclassified|public|Presidential Daily Diary|item page with PDF)\b/i.test(statusText)
  );
}

function chronologyAction(record, pdfStatus) {
  if (pdfStatus?.next_action) return pdfStatus.next_action;
  if (record.selectionDecision === "Boundary review") {
    return "Make the include/context/drop decision and record the volume-scope rationale before promotion.";
  }
  if (record.selectionDecision === "Include candidate") {
    return "Open the PDF, confirm document boundaries, and draft final source-note/page-span details.";
  }
  if (record.type === "Release Packet") {
    return "Use as released evidence, then split any document-grade pages into final candidate records.";
  }
  if (record.type === "Source Lead") {
    return "Inspect the PDF and decide whether it becomes a document record, context control, or replacement-search lead.";
  }
  if (record.type === "Public Statement") {
    return "Use for public context and annotation support unless it directly explains a selected policy document.";
  }
  return "Review for chronology placement, source-note sufficiency, and final disposition.";
}

function primaryPdfLabel(record) {
  const files = recordPdfFiles(record);
  if (!files.length) return "No direct PDF";
  const [file] = files;
  const pageLabel = file.pages ? `, ${file.pages} pages` : "";
  return `[Open PDF](${file.url})${pageLabel}`;
}

function firstReadLabel(record, pdfStatus) {
  if (pdfStatus?.first_read_url) return `[${pdfStatus.first_read_range || "First read"}](${pdfStatus.first_read_url})`;
  if (pdfStatus) return "Replacement/onsite review";
  const [file] = recordPdfFiles(record);
  return file?.url ? `[Open PDF](${file.url})` : "No direct PDF";
}

function build() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const records = JSON.parse(fs.readFileSync(RECORDS_PATH, "utf8"));
  const pdfStatuses = fs.existsSync(STATUS_CSV_PATH)
    ? new Map(parseCsv(fs.readFileSync(STATUS_CSV_PATH, "utf8")).map((row) => [row.record_id, row]))
    : new Map();

  const chronology = records.filter(isDeclassifiedChronologyRecord).sort(byChronology);
  const directPdfLinks = chronology.reduce((sum, record) => sum + recordPdfFiles(record).length, 0);
  const releasePackets = chronology.filter((record) => record.type === "Release Packet").length;
  const includeCandidates = chronology.filter((record) => record.selectionDecision === "Include candidate").length;
  const boundaryReviews = chronology.filter((record) => record.selectionDecision === "Boundary review").length;

  const rows = chronology.map((record, index) => {
    const files = recordPdfFiles(record);
    const pdfStatus = pdfStatuses.get(record.id);
    return {
      order: index + 1,
      id: record.id,
      date: record.date || record.sortDate || "",
      display_date: formatDate(record.date || record.sortDate || ""),
      washington_time: record.washingtonTime || "",
      type: record.type || "",
      decision: record.selectionDecision || "",
      scope_area: record.topic?.name || "",
      title: record.documentTitle || record.title || "",
      date_line: record.dateLine || "",
      subject: record.subjectLine || "",
      countries: listValues(record.countries).join("; "),
      people: listValues(record.persons).join("; "),
      page_count: record.pageCount || "",
      pdf_count: files.length,
      pdf_urls: files.map((file) => file.url).join(" "),
      catalog_url: record.catalogUrl || "",
      release_status: record.releaseStatus || "",
      declassification_status: record.declassificationStatus || "",
      pdf_extraction_status: pdfStatus?.status || "",
      first_read_range: pdfStatus?.first_read_range || "",
      first_read_url: pdfStatus?.first_read_url || files[0]?.url || "",
      next_action: chronologyAction(record, pdfStatus),
      withheld_material: record.withheldMaterial || "",
      source_note: record.sourceNote || "",
      source_note_addendum: record.sourceNoteAddendum || "",
      index_terms: listValues(record.indexTerms).join("; ")
    };
  });

  const header = [
    "order",
    "id",
    "date",
    "display_date",
    "washington_time",
    "type",
    "decision",
    "scope_area",
    "title",
    "date_line",
    "subject",
    "countries",
    "people",
    "page_count",
    "pdf_count",
    "pdf_urls",
    "catalog_url",
    "release_status",
    "declassification_status",
    "pdf_extraction_status",
    "first_read_range",
    "first_read_url",
    "next_action",
    "withheld_material",
    "source_note",
    "source_note_addendum",
    "index_terms"
  ];
  fs.writeFileSync(CSV_PATH, [header, ...rows.map((row) => header.map((key) => csv(row[key])).join(","))].join("\n") + "\n");

  const report = [
    "# Declassified Document Chronology",
    "",
    "One date-ordered chronology of released, declassified, and public document records pertaining to FRUS 1993-2000, Volume XXVII, South Africa; Southern Africa.",
    "",
    "This report excludes finding aids and audio-only controls. It keeps source leads in the chronology only when the record has a direct public PDF or release path.",
    "",
    `Generated from ${chronology.length} chronology records in \`data/records.json\`: ${releasePackets} release packets, ${includeCandidates} include candidates, ${boundaryReviews} boundary-review records, and ${directPdfLinks} direct PDF links.`,
    "",
    "Machine-readable download: [`data/declassified-chronology.csv`](../data/declassified-chronology.csv).",
    "",
    "Related work surfaces: [`reports/pdf-candidate-status.md`](pdf-candidate-status.md), [`reports/pdf-page-map.md`](pdf-page-map.md), [`reports/pdf-range-review.md`](pdf-range-review.md), and [`pdfs/`](../pdfs/).",
    "",
    "## Chronology",
    "",
    "| Date | Record | Decision | Type | Scope area | PDF / first read | Compiler action |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...chronology.map((record) => {
      const pdfStatus = pdfStatuses.get(record.id);
      return `| ${md(formatDate(record.date || record.sortDate || ""))} | [${md(record.documentTitle || record.title)}](${
        record.catalogUrl || "#"
      })<br><code>${record.id}</code> | ${md(record.selectionDecision || "")} | ${md(record.type || "")} | ${md(
        record.topic?.name || ""
      )} | ${firstReadLabel(record, pdfStatus)} | ${md(chronologyAction(record, pdfStatus))} |`;
    }),
    "",
    "## Record Details",
    "",
    ...chronology.flatMap((record, index) => {
      const files = recordPdfFiles(record);
      const pdfStatus = pdfStatuses.get(record.id);
      return [
        `### ${index + 1}. ${record.documentTitle || record.title}`,
        "",
        `- Record ID: \`${record.id}\``,
        `- Date: ${formatDate(record.date || record.sortDate || "")}`,
        `- Decision: ${record.selectionDecision || "Pending"}`,
        `- Type: ${record.type || "Pending"}`,
        `- Scope area: ${record.topic?.name || "Pending"}`,
        `- Catalog item: ${record.catalogUrl || "Pending"}`,
        `- PDF links: ${files.length ? files.map((file) => `[${file.label || "PDF"}](${file.url})`).join("; ") : "No direct PDF"}`,
        `- First read: ${firstReadLabel(record, pdfStatus)}`,
        pdfStatus?.status ? `- PDF extraction status: ${pdfStatus.status}` : null,
        record.releaseStatus ? `- Release status: ${record.releaseStatus}` : null,
        record.declassificationStatus ? `- Declassification: ${record.declassificationStatus}` : null,
        record.withheldMaterial ? `- Withheld material: ${record.withheldMaterial}` : null,
        `- Compiler action: ${chronologyAction(record, pdfStatus)}`,
        `- Source note: ${record.sourceNote || "Pending."}`,
        record.sourceNoteAddendum ? `- Source-note addendum: ${record.sourceNoteAddendum}` : null,
        ""
      ].filter((line) => line !== null);
    }),
    "## Method",
    "",
    "- Included records are public/declassified chronology records with a direct PDF, release packet status, public-statement status, or equivalent release/declassification language.",
    "- Finding aids and audio-only records are excluded from this document chronology but remain available in the full source-record browser.",
    "- PDF first-read links come from `data/pdf-candidate-status.csv` when page-map data exists; otherwise the first direct PDF link is used."
  ].join("\n");

  fs.writeFileSync(REPORT_PATH, report);

  console.log(`Wrote ${rows.length} chronology rows to ${path.relative(ROOT, CSV_PATH)}`);
  console.log(`Wrote report to ${path.relative(ROOT, REPORT_PATH)}`);
}

build();
