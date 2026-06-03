import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DATA_DIR = path.join(ROOT, "data");
const REPORTS_DIR = path.join(ROOT, "reports");
const DOWNLOADS_DIR = path.join(ROOT, "downloads");
const RECORDS_PATH = path.join(DATA_DIR, "records.json");
const MANIFEST_CSV_PATH = path.join(DATA_DIR, "pdf-download-manifest.csv");
const RECORD_LINKS_CSV_PATH = path.join(DATA_DIR, "pdf-record-links.csv");
const REPORT_PATH = path.join(REPORTS_DIR, "pdf-download-manifest.md");
const HTML_PATH = path.join(DOWNLOADS_DIR, "index.html");
const DOWNLOAD_SCRIPT_PATH = path.join(ROOT, "scripts", "download-source-pdfs.sh");

function compact(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function csv(value) {
  return `"${compact(value).replaceAll('"', '""')}"`;
}

function md(value) {
  return compact(value).replaceAll("|", "\\|");
}

function html(value) {
  return compact(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function htmlPreserve(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function attr(value) {
  return html(value).replaceAll("'", "&#39;");
}

function shellSingleQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function slug(value, maxLength = 72) {
  return compact(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
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

function byChronology(a, b) {
  return (
    (a.sortDate || a.date || "9999-12-31").localeCompare(b.sortDate || b.date || "9999-12-31") ||
    (a.washingtonTime || "").localeCompare(b.washingtonTime || "") ||
    (a.title || "").localeCompare(b.title || "")
  );
}

function isChronologyRecord(record) {
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

function recordSummary(record) {
  return {
    id: record.id,
    date: record.date || record.sortDate || "",
    displayDate: formatDate(record.date || record.sortDate || ""),
    title: record.documentTitle || record.title || "",
    decision: record.selectionDecision || "",
    type: record.type || "",
    catalogUrl: record.catalogUrl || "",
    countries: listValues(record.countries).join("; ")
  };
}

function filenameFor(index, item) {
  const first = item.records[0];
  const pdfSuffix = first.pdfIndex > 1 ? `-${slug(first.pdfLabel || `pdf-${first.pdfIndex}`, 16)}` : "";
  return `${String(index + 1).padStart(3, "0")}-${first.id}-${slug(first.title || "source-pdf")}${pdfSuffix}.pdf`;
}

function buildPdfItems(records) {
  const chronology = records.filter(isChronologyRecord).sort(byChronology);
  const recordLinks = [];
  const pdfMap = new Map();

  for (const record of chronology) {
    const summary = recordSummary(record);
    for (const [fileIndex, file] of recordPdfFiles(record).entries()) {
      const link = {
        ...summary,
        pdfLabel: file.label || (recordPdfFiles(record).length > 1 ? `PDF ${fileIndex + 1}` : "PDF"),
        pdfIndex: fileIndex + 1,
        pdfUrl: file.url,
        pages: file.pages || record.pageCount || ""
      };
      recordLinks.push(link);
      if (!pdfMap.has(file.url)) {
        pdfMap.set(file.url, {
          url: file.url,
          pages: file.pages || record.pageCount || "",
          records: []
        });
      }
      pdfMap.get(file.url).records.push(link);
      if (!pdfMap.get(file.url).pages && (file.pages || record.pageCount)) {
        pdfMap.get(file.url).pages = file.pages || record.pageCount;
      }
    }
  }

  const pdfItems = [...pdfMap.values()].map((item, index) => ({
    ...item,
    order: index + 1,
    filename: filenameFor(index, item),
    recordCount: item.records.length,
    recordIds: item.records.map((record) => record.id).join("; "),
    recordTitles: [...new Set(item.records.map((record) => record.title))].join("; "),
    firstDate: item.records[0]?.date || "",
    displayDate: item.records[0]?.displayDate || "",
    decisions: [...new Set(item.records.map((record) => record.decision).filter(Boolean))].join("; "),
    types: [...new Set(item.records.map((record) => record.type).filter(Boolean))].join("; "),
    catalogUrls: [...new Set(item.records.map((record) => record.catalogUrl).filter(Boolean))].join(" "),
    countries: [...new Set(item.records.flatMap((record) => record.countries.split("; ").filter(Boolean)))].join("; ")
  }));

  return { chronology, recordLinks, pdfItems };
}

function curlCommand(item) {
  return `curl -L --fail --retry 3 -o ${shellSingleQuote(item.filename)} ${shellSingleQuote(item.url)}`;
}

function buildDownloadScript(pdfItems) {
  return [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    "",
    "mkdir -p frus-v27-pdfs",
    "cd frus-v27-pdfs",
    "",
    ...pdfItems.flatMap((item) => [
      `# ${item.recordIds} - ${item.recordTitles}`,
      curlCommand(item),
      ""
    ])
  ].join("\n");
}

function writeCsvs(pdfItems, recordLinks) {
  const manifestHeader = [
    "order",
    "filename",
    "pdf_url",
    "pages",
    "record_count",
    "record_ids",
    "record_titles",
    "first_date",
    "display_date",
    "decisions",
    "types",
    "countries",
    "catalog_urls",
    "curl_command"
  ];
  const manifestRows = pdfItems.map((item) => ({
    order: item.order,
    filename: item.filename,
    pdf_url: item.url,
    pages: item.pages,
    record_count: item.recordCount,
    record_ids: item.recordIds,
    record_titles: item.recordTitles,
    first_date: item.firstDate,
    display_date: item.displayDate,
    decisions: item.decisions,
    types: item.types,
    countries: item.countries,
    catalog_urls: item.catalogUrls,
    curl_command: curlCommand(item)
  }));
  fs.writeFileSync(
    MANIFEST_CSV_PATH,
    [manifestHeader, ...manifestRows.map((row) => manifestHeader.map((key) => csv(row[key])).join(","))].join("\n") + "\n"
  );

  const linkHeader = [
    "record_id",
    "record_date",
    "record_title",
    "decision",
    "type",
    "pdf_label",
    "pdf_index",
    "pages",
    "pdf_url",
    "catalog_url"
  ];
  fs.writeFileSync(
    RECORD_LINKS_CSV_PATH,
    [
      linkHeader,
      ...recordLinks.map((row) =>
        linkHeader
          .map((key) =>
            csv(
              {
                record_id: row.id,
                record_date: row.date,
                record_title: row.title,
                decision: row.decision,
                type: row.type,
                pdf_label: row.pdfLabel,
                pdf_index: row.pdfIndex,
                pages: row.pages,
                pdf_url: row.pdfUrl,
                catalog_url: row.catalogUrl
              }[key]
            )
          )
          .join(",")
      )
    ].join("\n") + "\n"
  );
}

function buildReport(pdfItems, recordLinks, chronologyCount) {
  const duplicateGroups = pdfItems.filter((item) => item.recordCount > 1);
  const script = buildDownloadScript(pdfItems);
  return [
    "# PDF Download Manifest",
    "",
    "Deduplicated source-PDF manifest for the released/declassified chronology in FRUS 1993-2000, Volume XXVII, South Africa; Southern Africa.",
    "",
    `Generated from ${chronologyCount} chronology records, ${recordLinks.length} record-level PDF links, and ${pdfItems.length} unique PDF files.`,
    "",
    "Files:",
    "",
    "- [`data/pdf-download-manifest.csv`](../data/pdf-download-manifest.csv) has one row per unique PDF file.",
    "- [`data/pdf-record-links.csv`](../data/pdf-record-links.csv) has one row per record-to-PDF relationship.",
    "- [`scripts/download-source-pdfs.sh`](../scripts/download-source-pdfs.sh) downloads all unique PDFs into `frus-v27-pdfs/`.",
    "- [`downloads/`](../downloads/) is the public browser view.",
    "",
    "## Bulk Download Script",
    "",
    "```bash",
    script,
    "```",
    "",
    "## Unique PDF Files",
    "",
    "| # | Filename | Records | Pages | PDF |",
    "| ---: | --- | --- | ---: | --- |",
    ...pdfItems.map(
      (item) =>
        `| ${item.order} | \`${md(item.filename)}\` | ${md(item.recordIds)} | ${md(item.pages || "")} | [Open PDF](${item.url}) |`
    ),
    "",
    "## Duplicate PDF Groups",
    "",
    duplicateGroups.length
      ? duplicateGroups.map((item) => `- \`${item.filename}\`: ${item.recordCount} records -> ${md(item.recordIds)}`).join("\n")
      : "- No duplicate PDF URLs found.",
    "",
    "## Method",
    "",
    "- Includes direct PDF links from released, declassified, and public document records in the chronology.",
    "- Deduplicates by exact PDF URL, preserving all record IDs and titles that point to each file.",
    "- Excludes finding aids and audio-only controls from the chronology download set."
  ].join("\n");
}

function buildHtml(pdfItems, recordLinks, chronologyCount) {
  const script = buildDownloadScript(pdfItems);
  const cards = pdfItems
    .map((item) => {
      const search = [item.filename, item.recordIds, item.recordTitles, item.decisions, item.types, item.countries].join(" ").toLowerCase();
      return `
        <article class="download-card" data-download-card data-search="${attr(search)}">
          <div class="download-number">
            <span>${html(String(item.order).padStart(2, "0"))}</span>
            <strong>${html(item.recordCount === 1 ? "single record" : `${item.recordCount} records`)}</strong>
          </div>
          <div class="download-main">
            <h2>${html(item.filename)}</h2>
            <p class="record-title">${html(item.recordTitles)}</p>
            <dl>
              <div><dt>Records</dt><dd>${html(item.recordIds)}</dd></div>
              <div><dt>Pages</dt><dd>${html(item.pages || "Pending")}</dd></div>
              <div><dt>Countries</dt><dd>${html(item.countries || "Pending")}</dd></div>
            </dl>
            <div class="actions">
              <a class="button primary" href="${attr(item.url)}" rel="noreferrer">Open PDF</a>
              <a class="button" href="${attr(item.url)}" download>Download PDF</a>
              ${item.catalogUrls
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 3)
                .map((url, index) => `<a class="button" href="${attr(url)}" rel="noreferrer">Catalog ${index + 1}</a>`)
                .join("")}
            </div>
            <code>${html(curlCommand(item))}</code>
          </div>
        </article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FRUS Volume XXVII PDF Downloads</title>
    <meta name="description" content="Deduplicated PDF download manifest for FRUS 1993-2000, Volume XXVII, South Africa; Southern Africa." />
    <style>
      :root {
        color-scheme: light;
        --ink: #172331;
        --muted: #63707b;
        --paper: #f5f7f2;
        --panel: #ffffff;
        --line: #d8ded3;
        --navy: #24344c;
        --rust: #8f3f34;
        --teal: #2f6a66;
        --gold: #b58c39;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: linear-gradient(180deg, #eef3ee 0%, var(--paper) 55%, #e5ece9 100%); }
      a { color: inherit; }
      .site-header {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 14px clamp(18px, 4vw, 48px);
        background: rgba(245, 247, 242, 0.96);
        border-bottom: 1px solid var(--line);
        backdrop-filter: blur(14px);
      }
      .brand { display: inline-flex; align-items: center; gap: 10px; color: var(--ink); font-weight: 900; text-decoration: none; }
      .brand-mark { display: grid; min-width: 56px; min-height: 38px; place-items: center; color: white; background: var(--navy); border-radius: 6px; }
      nav, .actions, .utility-row { display: flex; flex-wrap: wrap; gap: 8px; }
      nav { justify-content: flex-end; }
      nav a, .button {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        border: 1px solid #c6d2cb;
        border-radius: 6px;
        padding: 0 10px;
        color: var(--navy);
        background: #fff;
        font-size: 0.86rem;
        font-weight: 850;
        text-decoration: none;
      }
      .button.primary { color: white; border-color: var(--navy); background: var(--navy); }
      main { width: min(1220px, calc(100% - 32px)); margin: 0 auto; padding: 34px 0 52px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 420px); gap: 24px; align-items: end; margin-bottom: 24px; }
      .kicker { margin: 0 0 10px; color: var(--rust); font-size: 0.78rem; font-weight: 950; letter-spacing: 0.14em; text-transform: uppercase; }
      h1 { margin: 0 0 12px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(2.4rem, 6vw, 5rem); line-height: 0.98; letter-spacing: 0; }
      h2 { margin: 0 0 8px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(1.2rem, 2vw, 1.65rem); letter-spacing: 0; overflow-wrap: anywhere; }
      .lede { max-width: 840px; margin: 0; color: #384550; font-size: 1.08rem; line-height: 1.6; }
      .stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .stat { padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      .stat strong { display: block; color: var(--navy); font-family: Georgia, "Times New Roman", serif; font-size: 2rem; line-height: 1; }
      .stat span { color: var(--muted); font-size: 0.82rem; font-weight: 850; }
      .toolbar { margin: 24px 0 14px; padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      label { display: grid; gap: 6px; color: var(--muted); font-size: 0.78rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
      input { min-height: 40px; width: 100%; border: 1px solid #c6d2cb; border-radius: 6px; padding: 0 10px; color: var(--ink); background: #fff; font: inherit; font-size: 0.96rem; }
      .utility-row { margin-bottom: 18px; }
      .result-summary { color: var(--muted); font-weight: 850; }
      .script-box { width: 100%; min-height: 220px; margin-bottom: 18px; border: 1px solid #c6d2cb; border-radius: 8px; padding: 12px; font: 0.84rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; color: #263544; background: #fff; }
      .download-list { display: grid; gap: 14px; }
      .download-card { display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 16px; padding: 18px; border: 1px solid var(--line); border-left: 5px solid var(--teal); border-radius: 8px; background: var(--panel); }
      .download-number span { display: block; color: var(--gold); font-family: Georgia, "Times New Roman", serif; font-size: 2.1rem; font-weight: 900; line-height: 1; }
      .download-number strong { display: block; color: var(--muted); font-size: 0.82rem; line-height: 1.25; }
      .record-title { margin: 0 0 12px; color: #384550; line-height: 1.5; }
      dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 0 0 12px; }
      dl div { padding: 10px; border: 1px solid #e2e8e1; border-radius: 6px; background: #fbfcfa; }
      dt { color: var(--muted); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
      dd { margin: 4px 0 0; line-height: 1.42; }
      code { display: block; margin-top: 12px; border: 1px solid #e2e8e1; border-radius: 6px; padding: 10px; overflow-wrap: anywhere; color: #263544; background: #fbfcfa; font: 0.8rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
      .empty { display: none; padding: 24px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); color: var(--muted); font-weight: 850; }
      footer { width: min(1220px, calc(100% - 32px)); margin: 0 auto; padding: 0 0 32px; color: var(--muted); }
      @media (max-width: 820px) {
        .site-header, .hero, .download-card, dl { grid-template-columns: 1fr; }
        .site-header { align-items: flex-start; flex-direction: column; }
        nav { justify-content: flex-start; }
      }
    </style>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="../" aria-label="Back to South and Southern Africa Assist">
        <span class="brand-mark">XXVII</span>
        <span>PDF Downloads</span>
      </a>
      <nav aria-label="PDF download navigation">
        <a href="../">Home</a>
        <a href="../chronology/">Chronology Desk</a>
        <a href="../pdfs/">PDF Desk</a>
        <a href="../data/pdf-download-manifest.csv">CSV</a>
      </nav>
    </header>
    <main>
      <section class="hero" aria-labelledby="title">
        <div>
          <p class="kicker">Source PDF Collection</p>
          <h1 id="title">PDF Download Manifest</h1>
          <p class="lede">
            A deduplicated download page for the source PDFs behind the released/declassified chronology. Use the CSV for audit work, the script for bulk download, or the cards for one-at-a-time inspection.
          </p>
        </div>
        <div class="stats" aria-label="PDF counts">
          <div class="stat"><strong>${pdfItems.length}</strong><span>unique PDF files</span></div>
          <div class="stat"><strong>${recordLinks.length}</strong><span>record PDF links</span></div>
          <div class="stat"><strong>${chronologyCount}</strong><span>chronology records</span></div>
          <div class="stat"><strong>${pdfItems.filter((item) => item.recordCount > 1).length}</strong><span>shared PDFs</span></div>
        </div>
      </section>
      <section class="toolbar" aria-label="Download filters">
        <label>
          Search
          <input id="search" type="search" placeholder="Mbeki, Zimbabwe, clinton-v27-023, AIDS, Bout" />
        </label>
      </section>
      <div class="utility-row" aria-label="Download files">
        <a class="button primary" href="../scripts/download-source-pdfs.sh">Download shell script</a>
        <a class="button" href="../data/pdf-download-manifest.csv">Manifest CSV</a>
        <a class="button" href="../data/pdf-record-links.csv">Record-link CSV</a>
        <a class="button" href="../reports/pdf-download-manifest.md">Markdown report</a>
      </div>
      <textarea class="script-box" readonly aria-label="Bulk PDF download shell script">${htmlPreserve(script)}</textarea>
      <p id="result-summary" class="result-summary">${pdfItems.length} unique PDFs shown.</p>
      <section class="download-list" aria-label="Unique source PDFs">
        ${cards}
      </section>
      <p id="empty-state" class="empty">No PDF files match this search.</p>
    </main>
    <footer>
      <p>Generated from <code>data/records.json</code> and <code>scripts/build-pdf-download-manifest.mjs</code>.</p>
    </footer>
    <script>
      (() => {
        const cards = [...document.querySelectorAll("[data-download-card]")];
        const search = document.querySelector("#search");
        const summary = document.querySelector("#result-summary");
        const empty = document.querySelector("#empty-state");

        function applyFilters() {
          const query = search.value.trim().toLowerCase();
          let shown = 0;

          for (const card of cards) {
            const visible = !query || card.dataset.search.includes(query);
            card.hidden = !visible;
            if (visible) shown += 1;
          }

          summary.textContent = shown === 1 ? "1 unique PDF shown." : shown + " unique PDFs shown.";
          empty.style.display = shown ? "none" : "block";
        }

        search.addEventListener("input", applyFilters);
      })();
    </script>
  </body>
</html>`;
}

function build() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

  const records = JSON.parse(fs.readFileSync(RECORDS_PATH, "utf8"));
  const { chronology, recordLinks, pdfItems } = buildPdfItems(records);
  writeCsvs(pdfItems, recordLinks);
  fs.writeFileSync(REPORT_PATH, buildReport(pdfItems, recordLinks, chronology.length));
  fs.writeFileSync(HTML_PATH, buildHtml(pdfItems, recordLinks, chronology.length).replace(/[ \t]+$/gm, ""));
  fs.writeFileSync(DOWNLOAD_SCRIPT_PATH, buildDownloadScript(pdfItems));
  fs.chmodSync(DOWNLOAD_SCRIPT_PATH, 0o755);

  console.log(`Wrote ${pdfItems.length} unique PDF rows to ${path.relative(ROOT, MANIFEST_CSV_PATH)}`);
  console.log(`Wrote ${recordLinks.length} record-link rows to ${path.relative(ROOT, RECORD_LINKS_CSV_PATH)}`);
  console.log(`Wrote report to ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`Wrote downloads page to ${path.relative(ROOT, HTML_PATH)}`);
  console.log(`Wrote bulk download script to ${path.relative(ROOT, DOWNLOAD_SCRIPT_PATH)}`);
}

build();
