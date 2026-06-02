import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DATA_DIR = path.join(ROOT, "data");
const REPORTS_DIR = path.join(ROOT, "reports");
const PULLS_DIR = path.join(ROOT, "pulls");
const RECORDS_PATH = path.join(DATA_DIR, "records.json");
const CSV_PATH = path.join(DATA_DIR, "reading-room-pull-queue.csv");
const REPORT_PATH = path.join(REPORTS_DIR, "reading-room-pull-queue.md");
const HTML_PATH = path.join(PULLS_DIR, "index.html");

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

function attr(value) {
  return html(value).replaceAll("'", "&#39;");
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

function sourceIdentifier(record) {
  const source = record.source || {};
  return [
    source.documentId ? `item ${source.documentId}` : "",
    source.caseNumber ? `case ${source.caseNumber}` : "",
    record.naid && !/^sample$/i.test(record.naid) ? `NAID ${record.naid}` : "",
    source.box ? `Box ${source.box}` : "",
    source.folder ? `Folder ${source.folder}` : "",
    source.fileUnit || ""
  ]
    .filter(Boolean)
    .join("; ");
}

function sourcePath(record) {
  const source = record.source || {};
  return [
    source.name,
    source.collection,
    source.series,
    source.subseries,
    source.lotFile,
    source.fileUnit,
    source.box ? `Box ${source.box}` : "",
    source.folder ? `Folder ${source.folder}` : "",
    source.itemTitle,
    source.documentId ? `Item ${source.documentId}` : "",
    source.caseNumber ? `Case ${source.caseNumber}` : "",
    record.naid && !/^sample$/i.test(record.naid) ? `NAID ${record.naid}` : ""
  ]
    .filter(Boolean)
    .join(", ");
}

function isPullQueueRecord(record) {
  const text = [
    record.type,
    record.selectionDecision,
    record.releaseStatus,
    record.declassificationStatus,
    record.annotationStatus,
    record.withheldMaterial,
    record.sourceNote,
    record.sourceNoteAddendum
  ]
    .filter(Boolean)
    .join(" ");

  return /finding aid only|not scanned|reading-room|pull queue|withdrawal|withheld|partially|boundary review|replacement|document-level extraction|packet split completed/i.test(
    text
  );
}

function queue(record) {
  const title = `${record.title || ""} ${record.documentTitle || ""}`;
  const text = [
    title,
    record.type,
    record.selectionDecision,
    record.releaseStatus,
    record.declassificationStatus,
    record.withheldMaterial,
    record.sourceNoteAddendum
  ]
    .filter(Boolean)
    .join(" ");

  if (/South Africa - Collection|Thabo Mbeki's 1995 visit|Angola - Collection/i.test(title)) return "First Pull";
  if (/Finding Aid/i.test(record.type)) return "Reading-Room Pull";
  if (/Boundary review/i.test(record.selectionDecision || "")) return "Scope Decision";
  if (/withdrawal|withheld|partially|P1\/b\(1\)|P5|P6\/b\(6\)/i.test(text)) return "Replacement Search";
  return "Digital Extraction";
}

function priority(record) {
  const group = queue(record);
  if (group === "First Pull") return 1;
  if (group === "Replacement Search") return 2;
  if (group === "Reading-Room Pull") return 3;
  if (group === "Scope Decision") return 4;
  return 5;
}

function blocker(record) {
  const text = [record.releaseStatus, record.declassificationStatus, record.annotationStatus, record.withheldMaterial].filter(Boolean).join("; ");
  if (text) return text;
  if (/Finding Aid/i.test(record.type || "")) return "Finding-aid lead; request scans or reading-room pull before document selection.";
  return "Needs document-level extraction, page spans, source-note details, or disposition review.";
}

function requestText(record) {
  const title = record.documentTitle || record.title || record.id;
  if (/Finding Aid/i.test(record.type || "")) {
    return `Ask Clinton Library staff whether scans or pre-pull options are available for ${title}; request folders that match the listed source-note addendum and preserve folder titles, box/OA identifiers, and withdrawal sheets.`;
  }
  if (/Boundary review/i.test(record.selectionDecision || "")) {
    return `Review ${title} against the Volume XXVII scope; decide include, context, or drop before it enters the final chronology.`;
  }
  if (/withdrawal|withheld|partially/i.test(blocker(record))) {
    return `Log each withdrawal or withheld document in ${title}; search for released replacements by date, sender/recipient, subject, item ID, FOIA/MDR case, and exemption noted on the packet.`;
  }
  return `Extract document boundaries, page spans, markings, and source-note details for ${title}; keep only document-grade material in the selection queue.`;
}

function pdfLinks(record) {
  return recordPdfFiles(record).map((file) => file.url);
}

function byQueue(a, b) {
  return priority(a) - priority(b) || (a.sortDate || a.date || "9999-12-31").localeCompare(b.sortDate || b.date || "9999-12-31") || a.id.localeCompare(b.id);
}

function buildRows(records) {
  return records
    .filter(isPullQueueRecord)
    .sort(byQueue)
    .map((record, index) => ({
      order: index + 1,
      queue: queue(record),
      priority: priority(record),
      id: record.id,
      date: record.date || record.sortDate || "",
      display_date: formatDate(record.date || record.sortDate || ""),
      decision: record.selectionDecision || "",
      type: record.type || "",
      scope_area: record.topic?.name || "",
      title: record.documentTitle || record.title || "",
      countries: listValues(record.countries).join("; "),
      source_identifier: sourceIdentifier(record),
      source_path: sourcePath(record),
      blocker: blocker(record),
      request_text: requestText(record),
      catalog_url: record.catalogUrl || "",
      pdf_urls: pdfLinks(record).join(" "),
      source_note: record.sourceNote || "",
      source_note_addendum: record.sourceNoteAddendum || ""
    }));
}

function groupedRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.queue)) groups.set(row.queue, []);
    groups.get(row.queue).push(row);
  }
  return [...groups.entries()];
}

function buildReport(rows) {
  return [
    "# Reading-Room Pull and Replacement Queue",
    "",
    "Action queue for unresolved source-access, withholding, boundary-review, and document-extraction blockers in the FRUS 1993-2000, Volume XXVII, South Africa; Southern Africa assist site.",
    "",
    `Generated from ${rows.length} queue records in \`data/records.json\`. Machine-readable version: [\`data/reading-room-pull-queue.csv\`](../data/reading-room-pull-queue.csv).`,
    "",
    "Use this with the [declassified chronology desk](../chronology/) and [PDF desk](../pdfs/).",
    "",
    ...groupedRows(rows).flatMap(([group, entries]) => [
      `## ${group}`,
      "",
      "| ID | Record | Source / item | Blocker | Request or replacement action |",
      "| --- | --- | --- | --- | --- |",
      ...entries.map(
        (row) =>
          `| ${row.id} | ${md(row.title)} | ${md(row.source_identifier || row.source_path)} | ${md(row.blocker)} | ${md(row.request_text)} |`
      ),
      ""
    ]),
    "## Request Log Fields",
    "",
    "- Collection, series, box/OA, folder, item ID, case number, or NAID",
    "- Document title/date, sender/recipient/participants, and country scope",
    "- Original classification, handling markings, and declassification status",
    "- Page span, withdrawal/exemption note, scan status, and replacement-search terms",
    "- Disposition: include, context, drop, duplicate, replacement search, or follow-up"
  ].join("\n");
}

function groupSummary(rows) {
  return groupedRows(rows)
    .map(([group, entries]) => `${entries.length} ${group.toLowerCase()}`)
    .join(", ");
}

function buildHtml(rows) {
  const groupOptions = groupedRows(rows).map(([group]) => group);
  const cards = rows
    .map((row) => {
      const search = Object.values(row).join(" ").toLowerCase();
      const pdfActions = row.pdf_urls
        ? row.pdf_urls
            .split(/\s+/)
            .filter(Boolean)
            .map(
              (url, index) =>
                `<a class="button" href="${attr(url)}" rel="noreferrer">Open PDF${index ? ` ${index + 1}` : ""}</a><a class="button" href="${attr(
                  url
                )}" download>Download PDF${index ? ` ${index + 1}` : ""}</a>`
            )
            .join("")
        : "";

      return `
        <article class="queue-card" data-queue-card data-group="${attr(row.queue)}" data-search="${attr(search)}">
          <div class="queue-priority">
            <span>${html(String(row.priority))}</span>
            <strong>${html(row.queue)}</strong>
          </div>
          <div class="queue-main">
            <div class="queue-heading">
              <h2>${html(row.title)}</h2>
              <div class="badges">
                <span>${html(row.id)}</span>
                <span>${html(row.type)}</span>
                <span>${html(row.decision)}</span>
                ${row.scope_area ? `<span>${html(row.scope_area)}</span>` : ""}
              </div>
            </div>
            <dl>
              <div><dt>Date</dt><dd>${html(row.display_date)}</dd></div>
              <div><dt>Source</dt><dd>${html(row.source_identifier || row.source_path || "Pending")}</dd></div>
              <div><dt>Countries</dt><dd>${html(row.countries || "Pending")}</dd></div>
            </dl>
            <p class="blocker">${html(row.blocker)}</p>
            <p class="request">${html(row.request_text)}</p>
            <details>
              <summary>Source note</summary>
              <p>${html(row.source_note || "Source note pending.")}</p>
              ${row.source_note_addendum ? `<p>${html(row.source_note_addendum)}</p>` : ""}
            </details>
            <div class="actions">
              ${row.catalog_url ? `<a class="button primary" href="${attr(row.catalog_url)}" rel="noreferrer">Catalog item</a>` : ""}
              ${pdfActions}
            </div>
          </div>
        </article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FRUS Volume XXVII Reading-Room Pull Queue</title>
    <meta name="description" content="Action queue for Clinton Library pulls, replacement searches, and document-extraction blockers for FRUS Volume XXVII." />
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
      nav, .actions, .utility-row, .badges { display: flex; flex-wrap: wrap; gap: 8px; }
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
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 380px); gap: 24px; align-items: end; margin-bottom: 24px; }
      .kicker { margin: 0 0 10px; color: var(--rust); font-size: 0.78rem; font-weight: 950; letter-spacing: 0.14em; text-transform: uppercase; }
      h1 { margin: 0 0 12px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(2.4rem, 6vw, 5rem); line-height: 0.98; letter-spacing: 0; }
      h2 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(1.32rem, 2.4vw, 1.9rem); letter-spacing: 0; }
      .lede { max-width: 820px; margin: 0; color: #384550; font-size: 1.08rem; line-height: 1.6; }
      .stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .stat { padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      .stat strong { display: block; color: var(--navy); font-family: Georgia, "Times New Roman", serif; font-size: 2rem; line-height: 1; }
      .stat span { color: var(--muted); font-size: 0.82rem; font-weight: 850; }
      .toolbar { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(180px, 260px); gap: 10px; margin: 24px 0 14px; padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      label { display: grid; gap: 6px; color: var(--muted); font-size: 0.78rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
      input, select { min-height: 40px; width: 100%; border: 1px solid #c6d2cb; border-radius: 6px; padding: 0 10px; color: var(--ink); background: #fff; font: inherit; font-size: 0.96rem; }
      .utility-row { margin-bottom: 18px; }
      .result-summary { color: var(--muted); font-weight: 850; }
      .queue-list { display: grid; gap: 14px; }
      .queue-card { display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 16px; padding: 18px; border: 1px solid var(--line); border-left: 5px solid var(--rust); border-radius: 8px; background: var(--panel); }
      .queue-priority span { display: block; color: var(--gold); font-family: Georgia, "Times New Roman", serif; font-size: 2.1rem; font-weight: 900; line-height: 1; }
      .queue-priority strong { display: block; color: var(--muted); font-size: 0.82rem; line-height: 1.25; }
      .queue-heading { display: grid; gap: 8px; margin-bottom: 10px; }
      .badges span { display: inline-flex; align-items: center; min-height: 26px; border: 1px solid #dce4dd; border-radius: 6px; padding: 0 8px; color: var(--muted); background: #f8faf7; font-size: 0.78rem; font-weight: 850; }
      dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 0 0 12px; }
      dl div, details { border: 1px solid #e2e8e1; border-radius: 6px; background: #fbfcfa; }
      dl div { padding: 10px; }
      dt { color: var(--muted); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
      dd { margin: 4px 0 0; line-height: 1.42; }
      .blocker { margin: 0 0 10px; color: var(--rust); font-weight: 900; line-height: 1.45; }
      .request { margin: 0 0 12px; color: var(--navy); font-weight: 850; line-height: 1.5; }
      details { margin-bottom: 12px; padding: 10px 12px; }
      summary { color: var(--navy); font-weight: 900; cursor: pointer; }
      details p { margin: 10px 0 0; color: #3f4a52; line-height: 1.52; }
      .empty { display: none; padding: 24px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); color: var(--muted); font-weight: 850; }
      footer { width: min(1220px, calc(100% - 32px)); margin: 0 auto; padding: 0 0 32px; color: var(--muted); }
      @media (max-width: 820px) {
        .site-header, .hero, .toolbar, .queue-card, dl { grid-template-columns: 1fr; }
        .site-header { align-items: flex-start; flex-direction: column; }
        nav { justify-content: flex-start; }
      }
    </style>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="../" aria-label="Back to South and Southern Africa Assist">
        <span class="brand-mark">XXVII</span>
        <span>Pull Queue</span>
      </a>
      <nav aria-label="Pull queue navigation">
        <a href="../">Home</a>
        <a href="../chronology/">Chronology Desk</a>
        <a href="../pdfs/">PDF Desk</a>
        <a href="../data/reading-room-pull-queue.csv">CSV</a>
      </nav>
    </header>
    <main>
      <section class="hero" aria-labelledby="title">
        <div>
          <p class="kicker">Clinton Library Follow-Up</p>
          <h1 id="title">Reading-Room Pull Queue</h1>
          <p class="lede">
            A concrete action list for unresolved source-access blockers: unscanned collection leads, withheld packet material, boundary decisions, and document-extraction work that should happen before final FRUS selection.
          </p>
        </div>
        <div class="stats" aria-label="Queue counts">
          <div class="stat"><strong>${rows.length}</strong><span>queue records</span></div>
          <div class="stat"><strong>${rows.filter((row) => row.queue === "First Pull").length}</strong><span>first pulls</span></div>
          <div class="stat"><strong>${rows.filter((row) => row.queue === "Replacement Search").length}</strong><span>replacement searches</span></div>
          <div class="stat"><strong>${rows.filter((row) => row.queue === "Scope Decision").length}</strong><span>scope decisions</span></div>
        </div>
      </section>
      <section class="toolbar" aria-label="Pull queue filters">
        <label>
          Search
          <input id="search" type="search" placeholder="Mandela, Angola, P1/b(1), Mbeki, item 14571" />
        </label>
        <label>
          Queue
          <select id="group-filter">
            <option value="">All queues</option>
            ${groupOptions.map((group) => `<option value="${attr(group)}">${html(group)}</option>`).join("")}
          </select>
        </label>
      </section>
      <div class="utility-row" aria-label="Pull queue downloads">
        <a class="button primary" href="../data/reading-room-pull-queue.csv">Download pull queue CSV</a>
        <a class="button" href="../reports/reading-room-pull-queue.md">Open Markdown report</a>
        <a class="button" href="../reports/clinton-library-research-plan.md">Research plan</a>
        <a class="button" href="../reports/compiler-docket.md">Compiler docket</a>
      </div>
      <p id="result-summary" class="result-summary">${rows.length} queue records shown: ${html(groupSummary(rows))}.</p>
      <section class="queue-list" aria-label="Reading-room pull and replacement queue">
        ${cards}
      </section>
      <p id="empty-state" class="empty">No queue records match these filters.</p>
    </main>
    <footer>
      <p>Generated from <code>data/records.json</code> and <code>scripts/build-pull-queue.mjs</code>.</p>
    </footer>
    <script>
      (() => {
        const cards = [...document.querySelectorAll("[data-queue-card]")];
        const search = document.querySelector("#search");
        const group = document.querySelector("#group-filter");
        const summary = document.querySelector("#result-summary");
        const empty = document.querySelector("#empty-state");

        function applyFilters() {
          const query = search.value.trim().toLowerCase();
          const groupValue = group.value;
          let shown = 0;

          for (const card of cards) {
            const visible = (!query || card.dataset.search.includes(query)) && (!groupValue || card.dataset.group === groupValue);
            card.hidden = !visible;
            if (visible) shown += 1;
          }

          summary.textContent = shown === 1 ? "1 queue record shown." : shown + " queue records shown.";
          empty.style.display = shown ? "none" : "block";
        }

        search.addEventListener("input", applyFilters);
        group.addEventListener("change", applyFilters);
      })();
    </script>
  </body>
</html>`;
}

function build() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.mkdirSync(PULLS_DIR, { recursive: true });

  const records = JSON.parse(fs.readFileSync(RECORDS_PATH, "utf8"));
  const rows = buildRows(records);
  const header = [
    "order",
    "queue",
    "priority",
    "id",
    "date",
    "display_date",
    "decision",
    "type",
    "scope_area",
    "title",
    "countries",
    "source_identifier",
    "source_path",
    "blocker",
    "request_text",
    "catalog_url",
    "pdf_urls",
    "source_note",
    "source_note_addendum"
  ];

  fs.writeFileSync(CSV_PATH, [header, ...rows.map((row) => header.map((key) => csv(row[key])).join(","))].join("\n") + "\n");
  fs.writeFileSync(REPORT_PATH, buildReport(rows));
  fs.writeFileSync(HTML_PATH, buildHtml(rows).replace(/[ \t]+$/gm, ""));

  console.log(`Wrote ${rows.length} pull queue rows to ${path.relative(ROOT, CSV_PATH)}`);
  console.log(`Wrote report to ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`Wrote pull queue page to ${path.relative(ROOT, HTML_PATH)}`);
}

build();
