import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RECORDS_PATH = path.join(ROOT, "data", "records.json");
const REPORT_PATH = path.join(ROOT, "reports", "frus-source-note-provenance-audit.json");

const OFFICIAL_STANDARD_BASIS = [
  {
    label: "FRUS 1993-2000, Volume XXVII",
    url: "https://history.state.gov/historicaldocuments/frus1993-00v27",
    use: "The target volume is still marked Being Researched, so this site should present candidates and source-note leads rather than final publication claims."
  },
  {
    label: "FRUS 1989-1992, Volume XXXI, About the Series",
    url: "https://history.state.gov/historicaldocuments/frus1989-92v31/abouttheseries",
    use: "The first footnote should identify the document source, original classification, distribution, drafting information, background, and read-status evidence when known."
  },
  {
    label: "FRUS 1989-1992, Volume XXXI, Document 73",
    url: "https://history.state.gov/historicaldocuments/frus1989-92v31/d73",
    use: "A published Presidential Library example leads with repository, presidential records, collection, file path, and control locator before classification and editorial notes."
  },
  {
    label: "FRUS 1969-1976, Volume XXVIII, Southern Africa, Document 81",
    url: "https://history.state.gov/historicaldocuments/frus1969-76v28/d81",
    use: "A published Southern Africa example leads with repository, collection, box, and folder before classification and handling notes."
  }
];

function compact(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function readRecords() {
  return JSON.parse(fs.readFileSync(RECORDS_PATH, "utf8"));
}

function noteFor(record) {
  return compact(record.frusSourceNote || "");
}

function sourceLocatorFor(record) {
  return compact(record.sourceNote || "");
}

function isSourceLead(record) {
  return record.selectionDecision === "Source lead" || ["Finding Aid", "Source Lead"].includes(record.type);
}

function isContextRecord(record) {
  return record.selectionDecision === "Context candidate" || ["Audio/Visual", "Public Statement"].includes(record.type);
}

function isPacketRecord(record) {
  return record.type === "Release Packet";
}

function isFinalizableCandidate(record) {
  return record.selectionDecision === "Include candidate" || record.selectionDecision === "Boundary review";
}

function failedCheckNames(checks) {
  return Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
}

function auditRecord(record) {
  const note = noteFor(record);
  const locator = sourceLocatorFor(record);
  const publicContext = isContextRecord(record);
  const sourceLead = isSourceLead(record);
  const packet = isPacketRecord(record);
  const provisional = publicContext || sourceLead || packet;

  const checks = {
    sourcePrefix: /^Source:\s+\S/i.test(note),
    formalRepository: /^Source:\s+William J\. Clinton Presidential Library\b/.test(note),
    presidentialRecordsLayer: /William J\. Clinton Presidential Library,\s+Clinton Presidential Records\b/.test(note),
    noRawUrls: !/https?:\/\//i.test(note),
    noDigitalCatalogSource: !/\bClinton Digital Library\b/i.test(note),
    noItemNumbers: !/\bitem\s+\d+\b/i.test(note),
    noNaidNumbers: !/\bNAID\s+\d+\b/i.test(note),
    noPdfAvailabilityText: !/\bPDF available|online PDF|item page\b/i.test(note),
    noReviewCaveats: !/\breview for|requires PDF review|need[s]? PDF|not scanned online\b/i.test(note),
    workingLocatorPreserved: provisional || locator.length > note.length
  };

  return {
    id: record.id,
    date: record.date || record.sortDate || "",
    title: record.documentTitle || record.title || "",
    type: record.type || "",
    decision: record.selectionDecision || "",
    provisional,
    finalizableCandidate: isFinalizableCandidate(record),
    checks,
    pass: failedCheckNames(checks).length === 0,
    sourceNote: note,
    workingSourceLocator: locator
  };
}

function count(records, predicate) {
  return records.filter(predicate).length;
}

function summarize(records) {
  return {
    totalRecords: records.length,
    formalRepositoryPass: count(records, (record) => record.checks.formalRepository),
    presidentialRecordsLayerPass: count(records, (record) => record.checks.presidentialRecordsLayer),
    sourcePrefixPass: count(records, (record) => record.checks.sourcePrefix),
    noDigitalCatalogSourcePass: count(records, (record) => record.checks.noDigitalCatalogSource),
    noCatalogOrPdfLocatorTextPass: count(records, (record) =>
      record.checks.noItemNumbers &&
      record.checks.noNaidNumbers &&
      record.checks.noPdfAvailabilityText &&
      record.checks.noReviewCaveats &&
      record.checks.noRawUrls
    ),
    sourceLeadsAndFindingAids: count(records, (record) => record.decision === "Source lead" || ["Finding Aid", "Source Lead"].includes(record.type)),
    releasePackets: count(records, (record) => record.type === "Release Packet"),
    publicContextRecords: count(records, (record) => record.decision === "Context candidate" || ["Audio/Visual", "Public Statement"].includes(record.type)),
    includeCandidates: count(records, (record) => record.decision === "Include candidate"),
    boundaryReviewCandidates: count(records, (record) => record.decision === "Boundary review"),
    finalizableCandidates: count(records, (record) => record.finalizableCandidate),
    publicationReadySourceNotes: count(records, (record) => record.pass && !record.provisional && !record.finalizableCandidate),
    provisionalOrNeedsExtraction: count(records, (record) => record.provisional || record.finalizableCandidate),
    provenanceFailures: count(records, (record) => !record.pass)
  };
}

function unresolved(records) {
  return records
    .filter((record) => !record.pass || record.provisional || record.finalizableCandidate)
    .map((record) => ({
      id: record.id,
      date: record.date,
      title: record.title,
      type: record.type,
      decision: record.decision,
      status: record.finalizableCandidate
          ? "candidate needs page-span, markings, and omitted-material extraction"
          : record.provisional
            ? "provisional lead/context, not a final FRUS source note"
          : "provenance check failed",
      failedChecks: failedCheckNames(record.checks)
    }));
}

function main() {
  const audited = readRecords().map(auditRecord);
  const report = {
    generatedAt: new Date().toISOString(),
    missionBoundary:
      "This audit checks whether public frusSourceNote provenance follows published FRUS first-footnote order. It does not certify final document-level source notes where page spans, markings, or withdrawal-sheet accounting remain unextracted.",
    publishedFrusOrder:
      "Repository and collection/file locator first; original classification and handling status next; then distribution, drafting/clearance, place/time, read-status, attachments, annotations, excisions, and related-document evidence as verified from the record.",
    officialStandardBasis: OFFICIAL_STANDARD_BASIS,
    summary: summarize(audited),
    unresolvedRecords: unresolved(audited),
    records: audited
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Wrote ${path.relative(ROOT, REPORT_PATH)}: ${report.summary.formalRepositoryPass}/${report.summary.totalRecords} formal repository, ${report.summary.provenanceFailures} failures.`
  );

  if (report.summary.provenanceFailures > 0) {
    process.exitCode = 1;
  }
}

main();
