const recordsRoot = document.querySelector("#records-root");
const chronologyRoot = document.querySelector("#chronology-root");
const chronologySummary = document.querySelector("#chronology-summary");
const docketRoot = document.querySelector("#docket-root");
const docketSummary = document.querySelector("#docket-summary");
const finalizationRoot = document.querySelector("#finalization-root");
const finalizationSummary = document.querySelector("#finalization-summary");
const chronologyCsvButton = document.querySelector("#download-chronology-csv");
const chronologyWorksheetButton = document.querySelector("#download-chronology-worksheet");
const finalizationCsvButton = document.querySelector("#download-finalization-csv");
const totalRecords = document.querySelector("#total-records");
const decisionReady = document.querySelector("#decision-ready");
const provenanceGaps = document.querySelector("#provenance-gaps");
const declassWatch = document.querySelector("#declass-watch");
const searchInput = document.querySelector("#record-search");
const filterButtons = [...document.querySelectorAll("[data-record-filter]")];
const issueButtons = [...document.querySelectorAll("[data-issue-filter]")];

let allRecords = [];
let activeFilter = "all";
let activeIssueFilter = "all";

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

function chronologyRecords(records = allRecords) {
  return records.filter(isDeclassifiedChronologyRecord).sort(byChronology);
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
    hasPdf(record) ||
    ["Memcon", "Telcon", "Release Packet", "Public Statement"].includes(record.type) ||
    /\b(FOIA|MDR|released|declassified|unclassified|public|Presidential Daily Diary|item page with PDF)\b/i.test(statusText)
  );
}

function hasValue(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function listValues(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function joinValues(value) {
  return listValues(value).join(", ");
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

function recordPdfUrls(record) {
  return recordPdfFiles(record).map((file) => file.url);
}

function hasPdf(record) {
  return recordPdfFiles(record).length > 0;
}

function sourcePathParts(record) {
  const source = record.source || {};
  const explicitPath = listValues(source.path);

  if (explicitPath.length) {
    return [source.name, ...explicitPath].filter(Boolean);
  }

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
  ].filter(Boolean);
}

function sourceMarkings(record) {
  const markings = [
    record.originalClassification || record.classification,
    ...listValues(record.documentMarkings),
    record.telegramPrecedence || record.communication?.precedence,
    ...listValues(record.handlingMarkings)
  ].filter(Boolean);
  return markings.join("; ");
}

function sourceTransmission(record) {
  const communication = record.communication || {};
  const notes = [];

  if (communication.sentTo) {
    const precedence = communication.precedence ? `${communication.precedence} ` : "";
    notes.push(`Sent ${precedence}to ${communication.sentTo}`);
  }

  if (hasValue(communication.sentForInfo)) {
    const verb = communication.sentTo ? "Also sent" : "Sent";
    notes.push(`${verb} for information to ${joinValues(communication.sentForInfo)}`);
  }

  if (communication.channel) {
    notes.push(`Sent via the ${communication.channel} channel`);
  }

  const location = record.meetingLocation || record.venue;
  if (location) notes.push(`The meeting took place in ${location}`);

  return notes.map((note) => (note.endsWith(".") ? note : `${note}.`)).join(" ");
}

function sourceClearance(record) {
  const clearance = record.clearance || {};
  const clauses = listValues(record.draftingInfo).map((value) => value.replace(/\.$/, ""));
  if (hasValue(clearance.draftedBy)) clauses.push(`Drafted by ${joinValues(clearance.draftedBy)}`);
  if (hasValue(clearance.clearedBy)) clauses.push(`cleared by ${joinValues(clearance.clearedBy)}`);
  if (hasValue(clearance.approvedBy)) clauses.push(`approved by ${joinValues(clearance.approvedBy)}`);
  return clauses.length ? `${clauses.join("; ")}.` : "";
}

function createSourceNoteDraft(record) {
  if (record.sourceNote) return record.sourceNote;

  const path = sourcePathParts(record);
  if (!path.length) return "Source: Citation pending.";

  const sentences = [`Source: ${path.join(", ")}.`];
  const markings = sourceMarkings(record);
  const transmission = sourceTransmission(record);
  const clearance = sourceClearance(record);

  if (markings) sentences.push(`${markings}.`);
  if (transmission) sentences.push(transmission);
  if (clearance) sentences.push(clearance);
  if (record.sourcePages || record.sourcePdfPages) sentences.push(`Source pages: ${record.sourcePages || record.sourcePdfPages}.`);
  return sentences.join(" ").replace(/\s+/g, " ").trim();
}

function hasSourceCitation(record) {
  const note = [record.sourceNote, record.sourceNoteAddendum].filter(Boolean).join(" ");
  const noteLooksComplete = /^Source:\s+\S/i.test(note) && !/pending|sample only|replace|\[[^\]]+\]/i.test(note);
  const pathLooksComplete = sourcePathParts(record).length >= 2;
  const hasMarkings = Boolean(noteLooksComplete || sourceMarkings(record));

  return (noteLooksComplete || pathLooksComplete) && hasMarkings;
}

function getProductionIssues(record) {
  if (Array.isArray(record.productionIssues)) return record.productionIssues;

  const issues = [];
  const selectionDecision = record.selectionDecision || record.compilerDecision;
  const annotation = record.annotation || {};

  if (!selectionDecision || selectionDecision === "Pending") issues.push("needs-selection");

  if (!hasSourceCitation(record)) issues.push("needs-source");

  if (!record.sortDate || !record.dateLine || ((record.type === "Memcon" || record.type === "Telcon") && !record.washingtonTime)) {
    issues.push("needs-chronology");
  }

  if (
    (!record.declassificationStatus && (!record.releaseStatus || record.releaseStatus === "Unknown")) ||
    (/partial|mixed|withheld|missing|not scanned|finding aid only/i.test(record.releaseStatus || "") && !record.withheldMaterial)
  ) {
    issues.push("needs-declass");
  }

  if (!record.annotationStatus && !hasValue(annotation.firstFootnote) && !hasValue(annotation.relatedDocuments)) {
    issues.push("needs-annotation");
  }

  if (!hasValue(record.indexTerms) && !hasValue(record.persons) && !hasValue(record.frusTopics)) {
    issues.push("needs-index");
  }

  return [...new Set(issues)];
}

function isReadyForSelection(record) {
  const decision = record.selectionDecision || record.compilerDecision;
  const issues = getProductionIssues(record);
  return (
    ["Include candidate", "Context candidate", "Ready for editor"].includes(decision) &&
    !issues.some((issue) => ["needs-source", "needs-chronology", "needs-declass"].includes(issue))
  );
}

function setDashboardCounts(records) {
  totalRecords.textContent = records.length.toString();
  decisionReady.textContent = records.filter(isReadyForSelection).length.toString();
  provenanceGaps.textContent = records.filter((record) => getProductionIssues(record).includes("needs-source")).length.toString();
  declassWatch.textContent = records
    .filter((record) => {
      const status = record.declassificationStatus || record.releaseStatus || "";
      return getProductionIssues(record).includes("needs-declass") || /pending|excised|withheld|partial|mixed|missing|not scanned/i.test(status);
    })
    .length.toString();
}

function createMeta(record) {
  const meta = document.createElement("div");
  meta.className = "record-meta";

  const countries = record.countries?.filter((country) => country !== "United States").join(", ");
  const sourceId = record.naid
    ? record.naid.match(/^\d+$/)
      ? `NAID ${record.naid}`
      : record.naid
    : record.source?.caseNumber || record.source?.documentId;
  const extent = record.pageCount
    ? `${record.pageCount} pages`
    : record.digitalObjects
      ? `${record.digitalObjects} digital objects`
      : "Extent pending";

  for (const value of [
    record.type,
    record.selectionDecision,
    record.topic?.name ? `Topic: ${record.topic.name}` : "",
    countries,
    extent,
    sourceId,
    record.declassificationStatus || record.releaseStatus
  ]) {
    if (!value) continue;
    const item = document.createElement("span");
    item.textContent = value;
    meta.append(item);
  }

  return meta;
}

function createParagraph(className, text) {
  const paragraph = document.createElement("p");
  paragraph.className = className;
  paragraph.textContent = text || "";
  return paragraph;
}

function csv(value) {
  return `"${String(value ?? "").replaceAll('"', '""').replace(/\s+/g, " ").trim()}"`;
}

function downloadTextFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function chronologyExportRows(records = chronologyRecords()) {
  return records.map((record, index) => [
    index + 1,
    record.id,
    record.date || record.sortDate || "",
    record.washingtonTime || "",
    record.type || "",
    record.selectionDecision || "",
    record.topic?.name || "",
    record.documentTitle || record.title || "",
    record.dateLine || "",
    record.subjectLine || "",
    record.countries?.join("; ") || "",
    record.pageCount || record.sourcePages || "",
    recordPdfUrls(record).join(" "),
    record.catalogUrl || "",
    record.releaseStatus || "",
    record.declassificationStatus || "",
    sourceMarkings(record),
    record.sourceNote || "",
    record.sourceNoteAddendum || "",
    record.annotationStatus || ""
  ]);
}

function buildChronologyCsv(records = chronologyRecords()) {
  const header = [
    "order",
    "id",
    "date",
    "washington_time",
    "type",
    "decision",
    "topic",
    "title",
    "date_line",
    "subject",
    "countries",
    "pages_or_source_pages",
    "pdf_urls",
    "catalog_url",
    "release_status",
    "declassification_status",
    "markings",
    "source_note",
    "source_note_addendum",
    "annotation_status"
  ];
  return [header, ...chronologyExportRows(records)].map((row) => row.map(csv).join(",")).join("\n") + "\n";
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- Pending";
}

function chronologyWorksheetSection(record, index) {
  const pdfUrls = recordPdfUrls(record);
  return [
    `## ${index + 1}. ${formatDate(record.date)} - ${record.documentTitle || record.title}`,
    "",
    `- Record ID: \`${record.id}\``,
    `- Type: ${record.type || "Pending"}`,
    `- Decision: ${record.selectionDecision || "Pending"}`,
    `- Topic: ${record.topic?.name || "Pending"}`,
    `- Catalog item: ${record.catalogUrl || "Pending"}`,
    "- PDF links:",
    markdownList(pdfUrls),
    `- Current source note: ${record.sourceNote || "Pending"}`,
    record.sourceNoteAddendum ? `- Source-note addendum: ${record.sourceNoteAddendum}` : "",
    record.declassificationStatus ? `- Declassification: ${record.declassificationStatus}` : "",
    "",
    "| Field | Compiler notes |",
    "| --- | --- |",
    "| Document boundary and page span |  |",
    "| Final heading/date line |  |",
    "| Participants, sender/recipient, distribution |  |",
    "| Original markings and declassification status |  |",
    "| Core policy substance |  |",
    "| Selection decision and rationale |  |",
    "| Omitted material/exemptions |  |",
    "| Annotation/index hooks |  |",
    "| Final source note text |  |",
    "| Disposition |  |"
  ]
    .filter(Boolean)
    .join("\n");
}

function buildChronologyWorksheet(records = chronologyRecords()) {
  return [
    "# Chronology Extraction Worksheet",
    "",
    "FRUS 1993-2000, Volume XXVII, South Africa; Southern Africa.",
    "",
    `Generated from ${records.length} released or declassified chronology records in \`data/records.json\`.`,
    "",
    records.map(chronologyWorksheetSection).join("\n\n")
  ].join("\n");
}

function needsDocumentPageMap(record) {
  return (
    record.selectionDecision === "Include candidate" ||
    record.selectionDecision === "Boundary review" ||
    record.type === "Release Packet"
  );
}

function finalizationIssues(record) {
  const issues = [];
  if (!record.sourceNote) issues.push("Draft source note");
  if (!record.date || /^\d{4}$/.test(record.date)) issues.push("Exact date");
  if (needsDocumentPageMap(record)) issues.push("Document page spans");
  if (!sourceMarkings(record) && !/public|unclassified/i.test([record.originalClassification, record.declassificationStatus, record.releaseStatus].filter(Boolean).join(" "))) {
    issues.push("Markings");
  }
  if (!record.declassificationStatus && !record.releaseStatus) issues.push("Declassification status");
  if (record.withheldMaterial || /withheld|withdrawal|excised|partial|mixed/i.test([record.declassificationStatus, record.releaseStatus, record.sourceNoteAddendum].filter(Boolean).join(" "))) {
    issues.push("Omitted-material accounting");
  }
  if (!record.selectionDecision) issues.push("Disposition");
  if (!record.annotationStatus) issues.push("Annotation status");
  if (!record.indexTerms?.length) issues.push("Index terms");
  if (record.type === "Source Lead" && hasPdf(record)) issues.push("Promote or keep as source lead");
  return [...new Set(issues)];
}

function finalizationPriority(record) {
  if (record.selectionDecision === "Include candidate") return 1;
  if (record.selectionDecision === "Boundary review") return 2;
  if (record.type === "Release Packet") return 3;
  if (record.type === "Source Lead" && hasPdf(record)) return 4;
  return 9;
}

function isFinalizationRecord(record) {
  return finalizationPriority(record) < 9;
}

function finalizationRecords(records = allRecords) {
  return records.filter(isFinalizationRecord).sort((a, b) => finalizationPriority(a) - finalizationPriority(b) || byChronology(a, b));
}

function finalizationAction(record) {
  if (record.selectionDecision === "Include candidate") {
    return "Finish page-map, markings, omitted-material accounting, and final source note before any selection call.";
  }
  if (record.selectionDecision === "Boundary review") {
    return "Make the include/context/drop decision and record the volume-scope rationale.";
  }
  if (record.type === "Release Packet") {
    return "Split the packet into document-level entries or keep it as contextual release evidence.";
  }
  if (record.type === "Source Lead" && hasPdf(record)) {
    return "Inspect the PDF and decide whether it becomes a document record, context control, or replacement-search lead.";
  }
  return "Review source-note and declassification fields.";
}

function finalizationCsv(records = finalizationRecords()) {
  const header = [
    "priority",
    "id",
    "date",
    "decision",
    "type",
    "topic",
    "title",
    "finalization_items",
    "next_action",
    "pdf_urls",
    "catalog_url",
    "source_note"
  ];
  const rows = records.map((record) => [
    finalizationPriority(record),
    record.id,
    record.date || record.sortDate || "",
    record.selectionDecision || "",
    record.type || "",
    record.topic?.name || "",
    record.documentTitle || record.title || "",
    finalizationIssues(record).join("; "),
    finalizationAction(record),
    recordPdfUrls(record).join(" "),
    record.catalogUrl || "",
    record.sourceNote || ""
  ]);
  return [header, ...rows].map((row) => row.map(csv).join(",")).join("\n") + "\n";
}

function createRecordRow(record) {
  const row = document.createElement("article");
  row.className = "record-row";

  const date = document.createElement("time");
  date.className = "record-date";
  if (record.date) date.dateTime = record.date;
  date.textContent = formatDate(record.date);

  const body = document.createElement("div");
  const pdfFiles = recordPdfFiles(record);
  const titleUrl = record.catalogUrl || pdfFiles[0]?.url;
  const title = document.createElement(titleUrl ? "a" : "span");
  title.className = "record-title";
  if (titleUrl) {
    title.href = titleUrl;
    title.rel = "noreferrer";
  }
  title.textContent = record.documentTitle || record.title;

  body.append(
    title,
    createParagraph("record-date-line", record.dateLine || formatDate(record.date)),
    createParagraph("record-subject", record.subjectLine || record.title),
    createMeta(record),
    createParagraph("record-source-note", createSourceNoteDraft(record))
  );

  if (record.sourceNoteAddendum) {
    body.append(createParagraph("record-extraction-note", `Source-note review: ${record.sourceNoteAddendum}`));
  }

  body.append(createProductionBlock(record));

  if (record.extractionStatus) {
    body.append(createParagraph("record-extraction-note", `Extraction: ${record.extractionStatus}`));
  }

  const links = document.createElement("div");
  links.className = "record-links";

  if (record.catalogUrl) {
    const source = document.createElement("a");
    source.href = record.catalogUrl;
    source.rel = "noreferrer";
    source.textContent = record.source?.name?.includes("Clinton") ? "Clinton item" : "Source record";
    links.append(source);
  }

  for (const [index, file] of pdfFiles.entries()) {
    const label = pdfFiles.length === 1 ? "PDF" : `PDF ${index + 1}`;
    links.append(createExternalLink(`Open ${label}`, file.url, { className: "primary-record-link" }));
    links.append(createExternalLink(`Download ${label}`, file.url, { download: true }));
  }

  if (record.transcriptionUrl) {
    const transcript = document.createElement("a");
    transcript.href = record.transcriptionUrl;
    transcript.rel = "noreferrer";
    transcript.textContent = "Transcript";
    links.append(transcript);
  }

  row.append(date, body, links);
  return row;
}

function createProductionBlock(record) {
  const block = document.createElement("div");
  block.className = "production-block";

  const issues = getProductionIssues(record);
  const gate = document.createElement("div");
  gate.className = issues.length ? "gate-status has-gaps" : "gate-status ready";
  gate.textContent = issues.length
    ? `Production gaps: ${issues.map(formatIssue).join(", ")}`
    : "Production gates ready";
  block.append(gate);

  const items = [
    ["Decision", record.selectionDecision || record.compilerDecision || "Pending"],
    ["Washington time", record.washingtonTime || "Pending"],
    ["Archival path", sourcePathParts(record).join(" / ") || "Pending"],
    ["Document ID", record.source?.documentId || record.source?.caseNumber || record.naid || "Pending"],
    ["Markings", sourceMarkings(record) || "Pending"],
    ["Transmission", sourceTransmission(record) || record.distribution || "Pending"],
    ["Draft/clear/approve", sourceClearance(record) || "Pending"],
    ["Read by", joinValues(record.readBy) || "Pending"],
    ["Declass", record.declassificationStatus || record.releaseStatus || "Pending"],
    ["Index terms", Array.isArray(record.indexTerms) ? record.indexTerms.join(", ") : record.indexTerms || "Pending"]
  ];

  const list = document.createElement("dl");
  list.className = "production-list";
  for (const [term, value] of items) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value;
    row.append(dt, dd);
    list.append(row);
  }
  block.append(list);

  if (record.withheldMaterial) {
    const note = document.createElement("p");
    note.className = "record-extraction-note";
    if (typeof record.withheldMaterial === "string") {
      note.textContent = `Withheld material: ${record.withheldMaterial}`;
    } else {
      const omitted = [
        record.withheldMaterial.omittedPages ? `${record.withheldMaterial.omittedPages} pages` : "",
        record.withheldMaterial.omittedLines ? `${record.withheldMaterial.omittedLines} lines` : ""
      ]
        .filter(Boolean)
        .join(" / ");
      note.textContent = `Withheld material: ${record.withheldMaterial.status || "noted"}${omitted ? `, ${omitted}` : ""}. ${
        record.withheldMaterial.description || ""
      }`;
    }
    block.append(note);
  }

  return block;
}

function formatIssue(issue) {
  return {
    "needs-selection": "selection",
    "needs-source": "source note",
    "needs-chronology": "chronology",
    "needs-declass": "declass",
    "needs-annotation": "annotation",
    "needs-index": "index terms"
  }[issue] || issue;
}

function createExternalLink(label, url, options = {}) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noreferrer";
  link.target = "_blank";
  link.textContent = label;
  if (options.download) link.setAttribute("download", "");
  if (options.className) link.className = options.className;
  return link;
}

function isExtractionBlocker(record) {
  const withheldText =
    typeof record.withheldMaterial === "string"
      ? record.withheldMaterial
      : Object.values(record.withheldMaterial || {}).join(" ");
  const status = [record.releaseStatus, record.declassificationStatus, record.sourceNoteAddendum, withheldText]
    .filter(Boolean)
    .join(" ");
  return record.type === "Finding Aid" || /not scanned|finding aid only|partial|withheld|withdrawal|pull required/i.test(status);
}

function docketAction(record) {
  if (record.selectionDecision === "Include candidate") {
    return hasPdf(record)
      ? "Extract text, page spans, markings, and omitted-material notes for final selection review."
      : "Open the source item, verify the scan path, then extract text and source-note details.";
  }
  if (record.selectionDecision === "Boundary review") {
    return "Make an include/context/exclude decision and record the volume-scope rationale.";
  }
  if (record.type === "Finding Aid") {
    return "Pre-pull the collection or request scans, then create document-level records from useful folders.";
  }
  if (isExtractionBlocker(record)) {
    return "Map packet pages, withdrawal sheets, and replacement-search targets before promotion.";
  }
  return "Review as context or control after the policy records are settled.";
}

function docketGroups(records) {
  const selection = records
    .filter((record) => record.selectionDecision === "Include candidate")
    .sort(byChronology);
  const boundary = records
    .filter((record) => record.selectionDecision === "Boundary review")
    .sort(byChronology);
  const seen = new Set([...selection, ...boundary].map((record) => record.id));
  const blockers = records
    .filter((record) => !seen.has(record.id) && isExtractionBlocker(record))
    .sort(byChronology);

  return [
    {
      title: "Selection Candidates",
      description: "Records closest to FRUS inclusion after extraction and source-note verification.",
      records: selection
    },
    {
      title: "Scope Decisions",
      description: "Records that need a clear include, context, or exclude call.",
      records: boundary
    },
    {
      title: "Pull and Extraction Blockers",
      description: "Unscanned collections, partial packets, and source-access work that unlocks later selection.",
      records: blockers
    }
  ];
}

function createDocketItem(record) {
  const item = document.createElement("article");
  item.className = "docket-item";

  const date = document.createElement("time");
  date.className = "docket-date";
  if (record.date) date.dateTime = record.date;
  date.textContent = formatDate(record.date);

  const heading = document.createElement("h3");
  heading.textContent = record.documentTitle || record.title;

  const meta = document.createElement("div");
  meta.className = "record-meta";
  for (const value of [record.selectionDecision, record.type, record.topic?.name ? `Topic: ${record.topic.name}` : ""]) {
    if (!value) continue;
    const badge = document.createElement("span");
    badge.textContent = value;
    meta.append(badge);
  }

  const action = createParagraph("docket-action", docketAction(record));

  const links = document.createElement("div");
  links.className = "record-links docket-item-links";
  if (record.catalogUrl) {
    links.append(createExternalLink("Open item", record.catalogUrl));
  }
  const pdfFiles = recordPdfFiles(record);
  for (const [index, file] of pdfFiles.entries()) {
    const label = pdfFiles.length === 1 ? "PDF" : `PDF ${index + 1}`;
    links.append(createExternalLink(`Open ${label}`, file.url, { className: "primary-record-link" }));
    links.append(createExternalLink(`Download ${label}`, file.url, { download: true }));
  }

  item.append(date, heading, meta, action);
  if (links.children.length) item.append(links);
  return item;
}

function renderDocket(records) {
  if (!docketRoot) return;

  const groups = docketGroups(records);
  const docketCount = groups.reduce((sum, group) => sum + group.records.length, 0);
  if (docketSummary) {
    docketSummary.textContent = `${docketCount} docket records: ${groups
      .map((group) => `${group.records.length} ${group.title.toLowerCase()}`)
      .join(", ")}.`;
  }

  docketRoot.replaceChildren();
  for (const group of groups) {
    const section = document.createElement("section");
    section.className = "docket-panel";

    const heading = document.createElement("h3");
    heading.textContent = group.title;
    const description = createParagraph("docket-description", group.description);
    const list = document.createElement("div");
    list.className = "docket-list";

    if (group.records.length) {
      for (const record of group.records) list.append(createDocketItem(record));
    } else {
      list.append(createParagraph("empty-state", "No records in this queue."));
    }

    section.append(heading, description, list);
    docketRoot.append(section);
  }
}

function createFinalizationItem(record) {
  const item = document.createElement("article");
  item.className = finalizationPriority(record) <= 2 ? "finalization-item high-priority" : "finalization-item";

  const date = document.createElement("time");
  date.className = "docket-date";
  if (record.date) date.dateTime = record.date;
  date.textContent = formatDate(record.date);

  const heading = document.createElement("h3");
  heading.textContent = record.documentTitle || record.title;

  const meta = document.createElement("div");
  meta.className = "record-meta";
  for (const value of [
    `Priority ${finalizationPriority(record)}`,
    record.selectionDecision,
    record.type,
    record.topic?.name ? `Topic: ${record.topic.name}` : ""
  ].filter(Boolean)) {
    const badge = document.createElement("span");
    badge.textContent = value;
    meta.append(badge);
  }

  const issues = document.createElement("ul");
  issues.className = "finalization-issues";
  for (const issue of finalizationIssues(record)) {
    const entry = document.createElement("li");
    entry.textContent = issue;
    issues.append(entry);
  }

  const action = createParagraph("finalization-action", finalizationAction(record));

  const links = document.createElement("div");
  links.className = "record-links docket-item-links";
  if (record.catalogUrl) links.append(createExternalLink("Open item", record.catalogUrl));
  for (const [index, file] of recordPdfFiles(record).entries()) {
    const label = recordPdfFiles(record).length === 1 ? "PDF" : `PDF ${index + 1}`;
    links.append(createExternalLink(`Open ${label}`, file.url, { className: "primary-record-link" }));
  }

  item.append(date, heading, meta, issues, action);
  if (links.children.length) item.append(links);
  return item;
}

function renderFinalizationQueue(records) {
  if (!finalizationRoot) return;

  const queue = finalizationRecords(records);
  const includeCount = queue.filter((record) => record.selectionDecision === "Include candidate").length;
  const boundaryCount = queue.filter((record) => record.selectionDecision === "Boundary review").length;
  const pageMapCount = queue.filter(needsDocumentPageMap).length;

  if (finalizationSummary) {
    finalizationSummary.textContent = `${queue.length} records in the finalization queue: ${includeCount} include candidates, ${boundaryCount} boundary decisions, ${pageMapCount} page-map checks.`;
  }

  finalizationRoot.replaceChildren();
  if (!queue.length) {
    finalizationRoot.innerHTML = '<p class="empty-state">No finalization records found.</p>';
    return;
  }

  for (const record of queue) finalizationRoot.append(createFinalizationItem(record));
}

function renderEmptyState() {
  recordsRoot.innerHTML = `
    <div class="empty-state">
      <h3>No compiler records yet</h3>
      <p>Add verified entries to <code>data/records.json</code>, then refresh <code>data/records.js</code> for direct-file viewing.</p>
      <div class="empty-grid" aria-label="Recommended first fields">
        <span>selectionDecision</span>
        <span>washingtonTime</span>
        <span>sourceNote</span>
        <span>source.path</span>
        <span>documentMarkings</span>
        <span>handlingMarkings</span>
        <span>clearance</span>
        <span>communication</span>
        <span>declassificationStatus</span>
        <span>indexTerms</span>
      </div>
    </div>
  `;
}

function renderRecords(records) {
  const sorted = [...records].sort(byChronology);
  recordsRoot.replaceChildren();

  if (!sorted.length) {
    renderEmptyState();
    return;
  }

  const section = document.createElement("section");
  section.className = "record-group source-records";

  const header = document.createElement("div");
  header.className = "record-group-header";

  const heading = document.createElement("h3");
  heading.textContent = "All Source Records";

  const count = document.createElement("p");
  count.className = "record-count";
  const pdfLinks = sorted.reduce((sum, record) => sum + recordPdfFiles(record).length, 0);
  count.textContent = `${sorted.length} records in date order / ${pdfLinks} direct PDF links`;
  header.append(heading, count);

  const list = document.createElement("div");
  list.className = "record-list";
  for (const record of sorted) list.append(createRecordRow(record));

  section.append(header, list);
  recordsRoot.append(section);
}

function renderChronology(records) {
  if (!chronologyRoot) return;

  const sorted = chronologyRecords(records);
  const directFiles = sorted.reduce((sum, record) => sum + recordPdfFiles(record).length, 0);
  const packetCount = sorted.filter((record) => record.type === "Release Packet").length;

  if (chronologySummary) {
    chronologySummary.textContent = `${sorted.length} released or declassified document records, including ${packetCount} release packets and ${directFiles} direct PDF links.`;
  }

  chronologyRoot.replaceChildren();

  if (!sorted.length) {
    chronologyRoot.innerHTML = `
      <div class="empty-state">
        <h3>No released documents in the chronology yet</h3>
        <p>Promote source leads into document-level records with dates, page spans, and source notes.</p>
      </div>
    `;
    return;
  }

  const section = document.createElement("section");
  section.className = "record-group chronology-all";

  const header = document.createElement("div");
  header.className = "record-group-header";

  const heading = document.createElement("h3");
  heading.textContent = "All Released Document Records";

  const count = document.createElement("p");
  count.className = "record-count";
  count.textContent = `${sorted.length} records in date order`;
  header.append(heading, count);

  const list = document.createElement("div");
  list.className = "record-list chronology-list";
  for (const record of sorted) list.append(createRecordRow(record));

  section.append(header, list);
  chronologyRoot.append(section);
}

function enableChronologyExports() {
  const records = chronologyRecords();
  if (chronologyCsvButton) {
    chronologyCsvButton.disabled = !records.length;
    chronologyCsvButton.addEventListener("click", () => {
      downloadTextFile("frus-v27-released-document-chronology.csv", buildChronologyCsv(), "text/csv;charset=utf-8");
    });
  }
  if (chronologyWorksheetButton) {
    chronologyWorksheetButton.disabled = !records.length;
    chronologyWorksheetButton.addEventListener("click", () => {
      downloadTextFile(
        "frus-v27-released-document-chronology-worksheet.md",
        buildChronologyWorksheet(),
        "text/markdown;charset=utf-8"
      );
    });
  }
}

function enableFinalizationExport() {
  const records = finalizationRecords();
  if (!finalizationCsvButton) return;
  finalizationCsvButton.disabled = !records.length;
  finalizationCsvButton.addEventListener("click", () => {
    downloadTextFile("frus-v27-source-note-finalization-queue.csv", finalizationCsv(), "text/csv;charset=utf-8");
  });
}

function filterRecords() {
  const query = searchInput?.value.trim().toLowerCase() || "";
  const records = allRecords.filter((record) => {
    const matchesFilter = activeFilter === "all" || record.type === activeFilter;
    const matchesIssue = activeIssueFilter === "all" || getProductionIssues(record).includes(activeIssueFilter);
    const haystack = JSON.stringify(record).toLowerCase();
    return matchesFilter && matchesIssue && (!query || haystack.includes(query));
  });
  renderRecords(records);
}

function enableFilters() {
  searchInput?.addEventListener("input", filterRecords);

  for (const button of filterButtons) {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.recordFilter;
      for (const item of filterButtons) {
        item.setAttribute("aria-pressed", String(item === button));
      }
      filterRecords();
    });
  }

  for (const button of issueButtons) {
    button.addEventListener("click", () => {
      activeIssueFilter = button.dataset.issueFilter;
      for (const item of issueButtons) {
        item.setAttribute("aria-pressed", String(item === button));
      }
      filterRecords();
    });
  }
}

async function loadRecords() {
  const response = await fetch("data/records.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load records: ${response.status}`);
  return response.json();
}

async function init() {
  try {
    try {
      allRecords = await loadRecords();
    } catch (error) {
      allRecords = window.COMPILER_RECORDS || [];
      if (!allRecords.length) throw error;
    }
    setDashboardCounts(allRecords);
    renderChronology(allRecords);
    renderDocket(allRecords);
    renderFinalizationQueue(allRecords);
    renderRecords(allRecords);
    enableFilters();
    enableChronologyExports();
    enableFinalizationExport();
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
  } catch (error) {
    recordsRoot.innerHTML =
      '<p class="error">The compiler records could not be loaded. Try opening this site through a local server or GitHub Pages.</p>';
    if (chronologyRoot) chronologyRoot.innerHTML = recordsRoot.innerHTML;
  }
}

init();
