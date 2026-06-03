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
const CHRONOLOGY_DIR = path.join(ROOT, "chronology");
const HTML_PATH = path.join(CHRONOLOGY_DIR, "index.html");

function compact(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function csv(value) {
  return `"${compact(value).replaceAll('"', '""')}"`;
}

function md(value) {
  return compact(value).replaceAll("|", "\\|") || "";
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

function firstReadHtml(record, pdfStatus) {
  if (pdfStatus?.first_read_url) {
    return `<a class="button primary" href="${attr(pdfStatus.first_read_url)}" rel="noreferrer">${html(
      pdfStatus.first_read_range ? `Open first-read pages ${pdfStatus.first_read_range}` : "Open first-read pages"
    )}</a>`;
  }
  if (pdfStatus) return `<span class="button muted">Replacement/onsite review</span>`;
  const [file] = recordPdfFiles(record);
  return file?.url ? `<a class="button primary" href="${attr(file.url)}" rel="noreferrer">Open PDF</a>` : `<span class="button muted">No direct PDF</span>`;
}

function pdfActionsHtml(record) {
  const files = recordPdfFiles(record);
  if (!files.length) return "";
  return files
    .map((file, index) => {
      const label = files.length === 1 ? "PDF" : `PDF ${index + 1}`;
      const pageLabel = file.pages ? ` (${file.pages} pages)` : "";
      return [
        `<a class="button" href="${attr(file.url)}" rel="noreferrer">Open ${html(label)}${html(pageLabel)}</a>`,
        `<a class="button" href="${attr(file.url)}" download>Download ${html(label)}</a>`
      ].join("");
    })
    .join("");
}

function buildChronologyHtml(chronology, pdfStatuses, counts) {
  const decisionOptions = [...new Set(chronology.map((record) => record.selectionDecision).filter(Boolean))].sort();
  const typeOptions = [...new Set(chronology.map((record) => record.type).filter(Boolean))].sort();

  const cards = chronology
    .map((record, index) => {
      const pdfStatus = pdfStatuses.get(record.id);
      const searchText = [
        record.id,
        record.date,
        record.documentTitle,
        record.title,
        record.subjectLine,
        record.selectionDecision,
        record.type,
        listValues(record.countries).join(" "),
        listValues(record.persons).join(" "),
        listValues(record.indexTerms).join(" "),
        record.sourceNote,
        record.sourceNoteAddendum
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return `
        <article
          class="chronology-card"
          data-record-card
          data-decision="${attr(record.selectionDecision || "")}"
          data-type="${attr(record.type || "")}"
          data-search="${attr(searchText)}"
        >
          <div class="card-date">
            <span>${html(String(index + 1).padStart(2, "0"))}</span>
            <time datetime="${attr(record.date || record.sortDate || "")}">${html(formatDate(record.date || record.sortDate || ""))}</time>
          </div>
          <div class="card-main">
            <div class="card-heading">
              <h2>${html(record.documentTitle || record.title)}</h2>
              <div class="badges" aria-label="Record metadata">
                <span>${html(record.id)}</span>
                <span>${html(record.selectionDecision || "Decision pending")}</span>
                <span>${html(record.type || "Type pending")}</span>
                ${pdfStatus?.status ? `<span>${html(pdfStatus.status)}</span>` : ""}
              </div>
            </div>
            ${record.subjectLine ? `<p class="subject">${html(record.subjectLine)}</p>` : ""}
            <dl class="record-facts">
              <div><dt>Countries</dt><dd>${html(listValues(record.countries).join(", ") || "Pending")}</dd></div>
              <div><dt>People</dt><dd>${html(listValues(record.persons).join(", ") || "Pending")}</dd></div>
              <div><dt>Release</dt><dd>${html(record.releaseStatus || record.declassificationStatus || "Pending")}</dd></div>
            </dl>
            <p class="action-note">${html(chronologyAction(record, pdfStatus))}</p>
            <details>
              <summary>Source note</summary>
              <p>${html(record.sourceNote || "Source note pending.")}</p>
              ${record.sourceNoteAddendum ? `<p>${html(record.sourceNoteAddendum)}</p>` : ""}
              ${record.withheldMaterial ? `<p><strong>Withheld material:</strong> ${html(record.withheldMaterial)}</p>` : ""}
            </details>
            <div class="card-actions">
              ${record.catalogUrl ? `<a class="button" href="${attr(record.catalogUrl)}" rel="noreferrer">Catalog item</a>` : ""}
              ${firstReadHtml(record, pdfStatus)}
              ${pdfActionsHtml(record)}
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
    <title>FRUS Volume XXVII Declassified Chronology</title>
    <meta
      name="description"
      content="Open, search, and download released and declassified document records for FRUS 1993-2000, Volume XXVII, South Africa; Southern Africa."
    />
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
      body {
        margin: 0;
        color: var(--ink);
        background: linear-gradient(180deg, #eef3ee 0%, var(--paper) 52%, #e5ece9 100%);
      }
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
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--ink);
        font-weight: 900;
        text-decoration: none;
      }
      .brand-mark {
        display: grid;
        min-width: 56px;
        min-height: 38px;
        place-items: center;
        color: white;
        background: var(--navy);
        border-radius: 6px;
      }
      nav {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }
      nav a,
      .button {
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
      .button.primary {
        color: white;
        border-color: var(--navy);
        background: var(--navy);
      }
      .button.muted {
        color: var(--muted);
        background: #f7f8f5;
      }
      main {
        width: min(1220px, calc(100% - 32px));
        margin: 0 auto;
        padding: 34px 0 52px;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 24px;
        align-items: end;
        margin-bottom: 24px;
      }
      .kicker {
        margin: 0 0 10px;
        color: var(--rust);
        font-size: 0.78rem;
        font-weight: 950;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0 0 12px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(2.4rem, 6vw, 5rem);
        line-height: 0.98;
        letter-spacing: 0;
      }
      .lede {
        max-width: 860px;
        margin: 0;
        color: #384550;
        font-size: 1.08rem;
        line-height: 1.6;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(120px, 1fr));
        gap: 10px;
      }
      .stat {
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
      }
      .stat strong {
        display: block;
        color: var(--navy);
        font-family: Georgia, "Times New Roman", serif;
        font-size: 2rem;
        line-height: 1;
      }
      .stat span {
        color: var(--muted);
        font-size: 0.82rem;
        font-weight: 850;
      }
      .toolbar {
        display: grid;
        grid-template-columns: minmax(220px, 1fr) repeat(2, minmax(160px, 220px));
        gap: 10px;
        margin: 24px 0 18px;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
      }
      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      input,
      select {
        min-height: 40px;
        width: 100%;
        border: 1px solid #c6d2cb;
        border-radius: 6px;
        padding: 0 10px;
        color: var(--ink);
        background: #fff;
        font: inherit;
        font-size: 0.96rem;
      }
      .utility-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 18px;
      }
      .result-summary {
        color: var(--muted);
        font-weight: 850;
      }
      .chronology-list {
        display: grid;
        gap: 14px;
      }
      .chronology-card {
        display: grid;
        grid-template-columns: 132px minmax(0, 1fr);
        gap: 16px;
        padding: 18px;
        border: 1px solid var(--line);
        border-left: 5px solid var(--teal);
        border-radius: 8px;
        background: var(--panel);
      }
      .card-date span {
        display: block;
        color: var(--gold);
        font-family: Georgia, "Times New Roman", serif;
        font-size: 2.1rem;
        font-weight: 900;
        line-height: 1;
      }
      .card-date time {
        color: var(--muted);
        font-size: 0.86rem;
        font-weight: 900;
      }
      .card-heading {
        display: grid;
        gap: 8px;
        margin-bottom: 10px;
      }
      h2 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(1.35rem, 2.5vw, 2rem);
        letter-spacing: 0;
      }
      .badges,
      .card-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }
      .badges span {
        display: inline-flex;
        align-items: center;
        min-height: 26px;
        border: 1px solid #dce4dd;
        border-radius: 6px;
        padding: 0 8px;
        color: var(--muted);
        background: #f8faf7;
        font-size: 0.78rem;
        font-weight: 850;
      }
      .subject {
        margin: 0 0 12px;
        color: #384550;
        line-height: 1.5;
      }
      .record-facts {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 0 0 12px;
      }
      .record-facts div {
        padding: 10px;
        border: 1px solid #e2e8e1;
        border-radius: 6px;
        background: #fbfcfa;
      }
      dt {
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      dd {
        margin: 4px 0 0;
        line-height: 1.42;
      }
      .action-note {
        margin: 0 0 12px;
        color: var(--navy);
        font-weight: 850;
        line-height: 1.5;
      }
      details {
        margin-bottom: 12px;
        border: 1px solid #e2e8e1;
        border-radius: 6px;
        padding: 10px 12px;
        background: #fbfcfa;
      }
      summary {
        color: var(--navy);
        font-weight: 900;
        cursor: pointer;
      }
      details p {
        margin: 10px 0 0;
        color: #3f4a52;
        line-height: 1.52;
      }
      .empty {
        display: none;
        padding: 24px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        color: var(--muted);
        font-weight: 850;
      }
      footer {
        width: min(1220px, calc(100% - 32px));
        margin: 0 auto;
        padding: 0 0 32px;
        color: var(--muted);
      }
      @media (max-width: 820px) {
        .hero,
        .toolbar,
        .chronology-card,
        .record-facts {
          grid-template-columns: 1fr;
        }
        .stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .site-header {
          align-items: flex-start;
          flex-direction: column;
        }
        nav {
          justify-content: flex-start;
        }
      }
    </style>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="../" aria-label="Back to South and Southern Africa Assist">
        <span class="brand-mark">XXVII</span>
        <span>Declassified Chronology</span>
      </a>
      <nav aria-label="Chronology navigation">
        <a href="../">Home</a>
        <a href="../pdfs/">PDF Desk</a>
        <a href="../downloads/">Downloads</a>
        <a href="../reports/declassified-chronology.md">Markdown</a>
        <a href="../data/declassified-chronology.csv">CSV</a>
      </nav>
    </header>
    <main>
      <section class="hero" aria-labelledby="title">
        <div>
          <p class="kicker">FRUS 1993-2000, Volume XXVII</p>
          <h1 id="title">Declassified Document Chronology</h1>
          <p class="lede">
            One date-ordered working chronology for released, declassified, and public document records pertaining to South Africa and Southern Africa. Each record keeps the catalog item, direct PDF actions, source note, and compiler next step together.
          </p>
        </div>
        <div class="stats" aria-label="Chronology counts">
          <div class="stat"><strong>${counts.chronology}</strong><span>chronology records</span></div>
          <div class="stat"><strong>${counts.pdfs}</strong><span>direct PDF links</span></div>
          <div class="stat"><strong>${counts.include}</strong><span>include candidates</span></div>
          <div class="stat"><strong>${counts.boundary}</strong><span>boundary reviews</span></div>
        </div>
      </section>
      <section class="toolbar" aria-label="Chronology filters">
        <label>
          Search
          <input id="search" type="search" placeholder="Mbeki, Angola, landmines, item ID, AIDS" />
        </label>
        <label>
          Decision
          <select id="decision-filter">
            <option value="">All decisions</option>
            ${decisionOptions.map((value) => `<option value="${attr(value)}">${html(value)}</option>`).join("")}
          </select>
        </label>
        <label>
          Type
          <select id="type-filter">
            <option value="">All types</option>
            ${typeOptions.map((value) => `<option value="${attr(value)}">${html(value)}</option>`).join("")}
          </select>
        </label>
      </section>
      <div class="utility-row" aria-label="Chronology downloads">
        <a class="button primary" href="../data/declassified-chronology.csv">Download chronology CSV</a>
        <a class="button primary" href="../downloads/">Download source PDFs</a>
        <a class="button" href="../reports/declassified-chronology.md">Open Markdown report</a>
        <a class="button" href="../data/records.json">Structured records JSON</a>
        <a class="button" href="../reports/pdf-candidate-status.md">PDF status dashboard</a>
        <a class="button" href="../scripts/download-source-pdfs.sh">Bulk shell script</a>
      </div>
      <p id="result-summary" class="result-summary">${counts.chronology} records shown.</p>
      <section class="chronology-list" aria-label="Declassified chronology records">
        ${cards}
      </section>
      <p id="empty-state" class="empty">No chronology records match these filters.</p>
    </main>
    <footer>
      <p>Generated from <code>data/records.json</code>, <code>data/pdf-candidate-status.csv</code>, and <code>scripts/build-declassified-chronology.mjs</code>.</p>
    </footer>
    <script>
      (() => {
        const cards = [...document.querySelectorAll("[data-record-card]")];
        const search = document.querySelector("#search");
        const decision = document.querySelector("#decision-filter");
        const type = document.querySelector("#type-filter");
        const summary = document.querySelector("#result-summary");
        const empty = document.querySelector("#empty-state");

        function applyFilters() {
          const query = search.value.trim().toLowerCase();
          const decisionValue = decision.value;
          const typeValue = type.value;
          let shown = 0;

          for (const card of cards) {
            const matchesQuery = !query || card.dataset.search.includes(query);
            const matchesDecision = !decisionValue || card.dataset.decision === decisionValue;
            const matchesType = !typeValue || card.dataset.type === typeValue;
            const visible = matchesQuery && matchesDecision && matchesType;
            card.hidden = !visible;
            if (visible) shown += 1;
          }

          summary.textContent = shown === 1 ? "1 record shown." : shown + " records shown.";
          empty.style.display = shown ? "none" : "block";
        }

        search.addEventListener("input", applyFilters);
        decision.addEventListener("change", applyFilters);
        type.addEventListener("change", applyFilters);
      })();
    </script>
  </body>
</html>
`;
}

function build() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.mkdirSync(CHRONOLOGY_DIR, { recursive: true });

  const records = JSON.parse(fs.readFileSync(RECORDS_PATH, "utf8"));
  const pdfStatuses = fs.existsSync(STATUS_CSV_PATH)
    ? new Map(parseCsv(fs.readFileSync(STATUS_CSV_PATH, "utf8")).map((row) => [row.record_id, row]))
    : new Map();

  const chronology = records.filter(isDeclassifiedChronologyRecord).sort(byChronology);
  const directPdfLinks = chronology.reduce((sum, record) => sum + recordPdfFiles(record).length, 0);
  const releasePackets = chronology.filter((record) => record.type === "Release Packet").length;
  const includeCandidates = chronology.filter((record) => record.selectionDecision === "Include candidate").length;
  const boundaryReviews = chronology.filter((record) => record.selectionDecision === "Boundary review").length;
  const counts = {
    chronology: chronology.length,
    pdfs: directPdfLinks,
    releasePackets,
    include: includeCandidates,
    boundary: boundaryReviews
  };

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
    "| Date | Record | Decision | Type | PDF / first read | Compiler action |",
    "| --- | --- | --- | --- | --- | --- |",
    ...chronology.map((record) => {
      const pdfStatus = pdfStatuses.get(record.id);
      return `| ${md(formatDate(record.date || record.sortDate || ""))} | [${md(record.documentTitle || record.title)}](${
        record.catalogUrl || "#"
      })<br><code>${record.id}</code> | ${md(record.selectionDecision || "")} | ${md(record.type || "")} | ${firstReadLabel(
        record,
        pdfStatus
      )} | ${md(chronologyAction(record, pdfStatus))} |`;
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
        `- Countries: ${listValues(record.countries).join(", ") || "Pending"}`,
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
  fs.writeFileSync(HTML_PATH, buildChronologyHtml(chronology, pdfStatuses, counts).replace(/[ \t]+$/gm, ""));

  console.log(`Wrote ${rows.length} chronology rows to ${path.relative(ROOT, CSV_PATH)}`);
  console.log(`Wrote report to ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`Wrote chronology page to ${path.relative(ROOT, HTML_PATH)}`);
}

build();
