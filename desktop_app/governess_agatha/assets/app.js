const STORAGE_KEY = "governess-agatha-desktop-app";

const fields = {
  title: document.getElementById("project-title"),
  genre: document.getElementById("genre"),
  claimType: document.getElementById("claim-type"),
  venue: document.getElementById("venue"),
  citationStyle: document.getElementById("citation-style"),
  wordTarget: document.getElementById("word-target"),
  abstractTarget: document.getElementById("abstract-target"),
  lockedTerms: document.getElementById("locked-terms"),
  methodMaterial: document.getElementById("method-material"),
  sourceNotes: document.getElementById("source-notes"),
  governessMode: document.getElementById("governess-mode"),
  strictReview: document.getElementById("strict-review"),
};

const outputs = {
  pipeline: document.getElementById("output-pipeline"),
  skeleton: document.getElementById("output-skeleton"),
  matrix: document.getElementById("output-matrix"),
  review: document.getElementById("output-review"),
  prompt: document.getElementById("output-prompt"),
};

const counters = {
  claims: document.getElementById("claim-count"),
  keywords: document.getElementById("keyword-count"),
  risks: document.getElementById("risk-count"),
};

const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));

const stopwords = new Set([
  "about", "after", "against", "also", "among", "because", "between", "could",
  "every", "first", "from", "have", "into", "notes", "other", "paper", "should",
  "since", "still", "their", "there", "these", "those", "through", "under",
  "using", "where", "which", "while", "with", "would", "that", "this", "they",
  "them", "your", "what", "when", "were", "been", "being", "over", "than", "then",
  "very", "more", "less", "many", "such", "across", "however", "therefore", "argue",
  "study", "analysis", "method", "methods", "result", "results", "discussion"
]);

function getData() {
  return {
    title: fields.title.value.trim() || "Untitled Governess Agatha Project",
    genre: fields.genre.value,
    claimType: fields.claimType.value,
    venue: fields.venue.value.trim() || "Standard journal or committee review",
    citationStyle: fields.citationStyle.value.trim() || "Style not yet locked",
    wordTarget: fields.wordTarget.value.trim() || "Target not yet set",
    abstractTarget: fields.abstractTarget.value.trim() || "Abstract target not yet set",
    lockedTerms: fields.lockedTerms.value.trim() || "No locked vocabulary entered yet",
    methodMaterial: fields.methodMaterial.value.trim() || "Method or material not yet specified",
    sourceNotes: fields.sourceNotes.value.trim(),
    governessMode: fields.governessMode.checked,
    strictReview: fields.strictReview.checked,
  };
}

function splitLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s*-]+/, "").trim())
    .filter(Boolean);
}

function extractKeywords(text) {
  const counts = new Map();
  const matches = (text.toLowerCase().match(/[a-z]{4,}/g) || []);

  matches.forEach((word) => {
    if (stopwords.has(word)) {
      return;
    }
    counts.set(word, (counts.get(word) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([word]) => word);
}

function clampClaimVerb(claimType) {
  switch (claimType) {
    case "Descriptive":
      return "documents and characterizes";
    case "Associational":
      return "argues that X is associated with Y";
    case "Causal":
      return "claims causal force only where design support exists";
    case "Normative":
      return "argues for a bounded normative position";
    default:
      return "matches the evidence it can actually carry";
  }
}

function buildTitleOptions(data, keywords) {
  const joined = keywords.slice(0, 3).join(", ");
  return [
    `${data.title}`,
    `${data.claimType} Boundaries in ${data.title}`,
    `${data.title}: Evidence, Scope, and Consequence`,
    joined ? `${data.title}: ${joined}` : `${data.title}: A Governess Agatha build`,
  ];
}

function buildPipeline(data, claims, keywords) {
  const risks = inferRisks(data, claims);
  const keywordLine = keywords.length ? keywords.join(", ") : "No strong keywords extracted yet";
  const claimPreview = claims.slice(0, 5).map((claim, index) => `${index + 1}. ${claim}`).join("\n") || "1. Add notes or reviewer comments in the intake panel.";
  const supportLine = data.governessMode
    ? "Governess support register is on: the app will keep the critique warm, paced, and cognitively scaffolded."
    : "Governess support register is off: the app will stay fully analytic unless you ask for softer pacing.";
  const strictLine = data.strictReview
    ? "Strict Reviewer #2 pressure is on: major comments stay adversarial until claim and evidence align."
    : "Strict Reviewer #2 pressure is off: the review pack will stay rigorous but less punishing.";

  return `# ${data.title}

## Governess Agatha pipeline

### 0. Intake and lock
- Title: ${data.title}
- Genre: ${data.genre}
- Claim type: ${data.claimType}
- Venue: ${data.venue}
- Citation style: ${data.citationStyle}
- Word target: ${data.wordTarget}
- Abstract target: ${data.abstractTarget}
- Locked vocabulary: ${data.lockedTerms}
- Method or material: ${data.methodMaterial}
- Working keywords: ${keywordLine}

### 1. Preflight clamp
Purpose: stop the manuscript from promising more than the evidence can carry.
App action: clamps the argument to ${data.claimType.toLowerCase()} scope and reminds you to write the abstract last.
Current guardrail: ${clampClaimVerb(data.claimType)}.

### 2. Evidence build
Purpose: turn raw notes into traceable working claims before drafting.
Input lines now:
${claimPreview}

### 3. Spine draft
Purpose: build the paper in low-rework order.
Order:
1. Background and context
2. Literature review
3. Conceptual framework
4. Methods and materials
5. Analysis and results
6. Discussion
7. Conclusion
8. Title, abstract, and introduction last

### 4. Coupling and coherence
Purpose: make sure the paper links claims, mechanisms, anchors, and consequence rather than reading like pasted fragments.
App rule: if abstraction spikes, add one concrete anchor instead of generic smoothing.

### 5. Review pressure
Purpose: pressure-test the draft before submission.
Sequence:
1. Supportive but rigorous reviewer
2. Cold methodological reviewer
3. Harsh Reviewer #2
${data.strictReview ? "4. Strict Reviewer #2 remains active until the major risks are answered" : "4. Strict Reviewer #2 can be turned back on when you want a harsher pass"}

### 6. Verification gates
Purpose: catch rejection triggers before polishing.
Current risk count: ${risks.length}
Checks:
- Term-lock sweep
- Claim-to-evidence map
- Overclaim scan
- Citation containment
- Cadence pass with plain punctuation

### 7. Export
Purpose: produce reusable outputs from the same intake.
Exports:
- Pipeline
- Skeleton
- Evidence Map
- Reviewer Pack
- Prompt Deck

## Mode status

- ${supportLine}
- ${strictLine}

## Fast reading of this project

The app currently sees ${claims.length} working claim lines, ${keywords.length} extracted keywords, and ${risks.length} review risks. If you want the strongest output, tighten the locked vocabulary first, then make sure each note can be tied to a source, scene, quote, date, or method.
`;
}

function buildSkeleton(data, claims, keywords) {
  const titles = buildTitleOptions(data, keywords);
  const keywordLine = keywords.length ? keywords.join(", ") : "No strong keywords extracted yet";
  const notesPreview = claims.slice(0, 6).map((claim, index) => `${index + 1}. ${claim}`).join("\n") || "1. Add notes in the intake panel to generate section anchors.";

  return `# ${data.title}

## Preflight lock

- Genre: ${data.genre}
- Claim type: ${data.claimType}
- Claim verb guardrail: ${clampClaimVerb(data.claimType)}
- Venue or class: ${data.venue}
- Citation style: ${data.citationStyle}
- Word target: ${data.wordTarget}
- Abstract target: ${data.abstractTarget}
- Locked vocabulary: ${data.lockedTerms}
- Method or material: ${data.methodMaterial}
- Working keywords: ${keywordLine}

## Title set

${titles.map((title, index) => `${index + 1}. ${title}`).join("\n")}

## Abstract guardrail

Write the abstract only after the body is stable. Open with the real object of study, state the claim at ${data.claimType.toLowerCase()} level, name the material or method, give one concrete finding, and end with consequence rather than inflated novelty.

## Section order

### 1. Background and context
Function: establish the problem space, boundary conditions, and stakes without promising more than the archive or design can support.
Must answer: why this topic, why now, why this field, why this object.
Anchor notes:
${notesPreview}

### 2. Literature review
Function: position the paper against the key camps, then show what remains unresolved.
Must answer: what this paper adds that prior work does not already settle.
Move: cite competing explanations before announcing novelty.

### 3. Conceptual framework
Function: define the locked terms plainly and show how they relate.
Must answer: what each key term does analytically and what it does not mean.
Locked vocabulary set: ${data.lockedTerms}

### 4. Methods and materials
Function: explain what the paper can know, from which materials, under which limitations.
Must answer: source base, sampling logic, interpretation rules, exclusions, and reliability risks.
Current method note: ${data.methodMaterial}

### 5. Analysis and results
Function: present the claim early, then walk the mechanism, the anchor, and the consequence.
Must answer: what exactly happened, how you know, and where inference should stop.
Cadence rule: if the paragraph turns abstract, add one concrete anchor instead of smoothing the prose.

### 6. Discussion
Function: translate the findings into broader stakes without changing the claim type.
Must answer: what the results imply, for whom, and under what boundary conditions.

### 7. Conclusion
Function: restate the governing claim in disciplined form, then name the payoff and the limit.
Must answer: what should a reviewer remember after one week.

### 8. Title, abstract, introduction
Function: write last so the front matter mirrors the finished paper rather than a fantasy draft.

## Verification gates

- Term-lock sweep completed.
- Claim-to-evidence map completed.
- Reviewer #2 overclaim check completed.
- Citation containment checked for direct quotations.
- Cadence pass completed with punctuation kept plain.

## Cadence reminders

- Put the governing claim by sentence one or two.
- Split breathless clause stacks.
- Use mechanism verbs instead of generic filler.
- Name the consequence domain for major claims.
- Do not begin sentences with "And" and do not use em dashes.
`;
}

function buildMatrix(data, claims) {
  const rows = claims.length
    ? claims.map((claim, index) => {
        const sourceHint = data.methodMaterial === "Method or material not yet specified"
          ? "Add source or method"
          : data.methodMaterial;
        const claimRisk = data.claimType === "Causal"
          ? "Check causal language and alternative explanations"
          : data.claimType === "Normative"
            ? "State value criteria and boundary conditions"
            : "Check scope and evidence fit";
        return `| C${String(index + 1).padStart(2, "0")} | ${claim} | ${sourceHint} | Add page, note, quote, or example | ${claimRisk} | Tighten to evidence level |`;
      }).join("\n")
    : "| C01 | Add intake notes to generate claim rows | Add source or method | Add location | Scope unclear | Tighten after evidence review |";

  return `# ${data.title}

| ID | Working claim or note | Evidence source | Location | Reviewer risk | Repair move |
| --- | --- | --- | --- | --- | --- |
${rows}

## Audit rules

- Every contested claim gets evidence, a method basis, or a limitation note.
- Every quotation needs a sentence before and after it.
- Any claim that outruns the archive gets narrowed or removed.
- If a key term mutates across sections, log the change or restore the lock.
`;
}

function inferRisks(data, claims) {
  const risks = [];

  if (!claims.length) {
    risks.push("No usable notes yet. The draft will overgeneralize if you start writing from memory alone.");
  }
  if (data.claimType === "Causal") {
    risks.push("Causal language is high risk. Verify design support, confounding controls, and alternative explanations before using force verbs.");
  }
  if (data.claimType === "Normative") {
    risks.push("Normative argument needs explicit evaluative criteria. State the values or framework doing the judging.");
  }
  if (data.methodMaterial === "Method or material not yet specified") {
    risks.push("Methods section is under-specified. Reviewers will ask what the material actually is and why it supports the claim.");
  }
  if (!data.lockedTerms || data.lockedTerms === "No locked vocabulary entered yet") {
    risks.push("Term lock is missing. Concept drift will creep in during revision unless you freeze the core words now.");
  }
  if (claims.some((claim) => claim.length > 180)) {
    risks.push("At least one source note is overloaded. Break long claims into mechanism plus evidence before drafting.");
  }

  return risks;
}

function buildReviewPack(data, claims) {
  const risks = inferRisks(data, claims);
  const topClaims = claims.slice(0, 5).map((claim, index) => `${index + 1}. ${claim}`).join("\n") || "1. Add project notes to generate claim-specific review pressure.";
  const strictBlock = data.strictReview
    ? `## Reviewer #2 strict mode

- Recommendation: Major Revision until each major claim is mapped to evidence and scope.
- Top deal-breakers:
  1. Any mismatch between claim type and evidentiary support.
  2. Any methods section that names material without explaining selection and limits.
  3. Any conceptual term that shifts meaning across sections.`
    : "## Reviewer #2 strict mode\n\nStrict mode is off. Turn it on when you want maximum pre-submission pressure.";

  return `# ${data.title}

## Summary judgment

The project has clear promise if it keeps the claim at ${data.claimType.toLowerCase()} level and ties each argumentative turn to a visible evidence base. The main risk is that reviewers will punish scope drift before they reward the core insight.

## Supportive but rigorous reviewer

- Contribution signal: make the precise object of study visible in the first paragraph.
- Strengthening move: show the paper's distinct mechanism rather than only its theme.
- Safe revision: add one sentence naming the consequence domain for each major section.

## Cold methodological reviewer

- Ask what counts as evidence here and why this material can bear the paper's central claim.
- Ask where the inference stops and what rival explanation still remains.
- Ask how the source base was selected, filtered, or interpreted.
- Ask whether the vocabulary has been operationalized or is only gestured toward.

${strictBlock}

## Major comments

${risks.map((risk, index) => `${index + 1}. Risk: ${risk}\nMinimal fix: revise the relevant section so the claim, method, and limit are named in the same paragraph.\nFallback fix: add a limitation sentence that narrows the scope and removes unsupported force language.`).join("\n\n") || "1. Risk: Notes are not populated yet.\nMinimal fix: add at least five source lines or claims.\nFallback fix: start with a section skeleton and build the map before prose."}

## Claims under review

${topClaims}

## Author action checklist

- Freeze the key terms before full drafting.
- Build the claim-to-evidence table before polishing.
- Check every title and abstract verb against the claim type.
- Run one cadence pass after the review fixes, not before.
`;
}

function buildPromptDeck(data, keywords) {
  const supportMode = data.governessMode
    ? "Use the Governess support register when the user is overloaded, fragmented, or explicitly asks for grounding."
    : "Keep the tone fully analytic unless the user explicitly requests support mode.";

  return `HENRY / Governess Agatha project prompt

Project: ${data.title}
Genre: ${data.genre}
Claim type: ${data.claimType}
Venue: ${data.venue}
Citation style: ${data.citationStyle}
Word target: ${data.wordTarget}
Abstract target: ${data.abstractTarget}
Locked vocabulary: ${data.lockedTerms}
Method or material: ${data.methodMaterial}
Project keywords: ${keywords.join(", ") || "none yet"}

Instructions:

You are HENRY operating through the Governess Agatha paper-builder app. Your job is to make the manuscript survive peer review because every claim is traceable, appropriately bounded, and stated at the level the evidence can support.

Apply these rules:
- Put the governing claim by sentence one or two.
- Preserve texture while improving clarity.
- Never fabricate citations, evidence, or data.
- Every citation must do a job: position, operationalize, or turn.
- Every quote needs one sentence before and one sentence after it.
- Do not begin sentences with "And".
- Do not use em dashes.
- Use stronger mechanism verbs and plain term definitions.
- If abstraction spikes, add one concrete anchor.
- Tighten titles, abstracts, and conclusions to match ${data.claimType.toLowerCase()} scope.

Workflow:
1. Lock genre, claim type, and section order.
2. Build or update the quote-and-claim bank.
3. Draft the spine in low-rework order.
4. Run signposting, reference, and formatting passes.
5. Run claim-to-evidence verification and term-lock sweep.
6. Run layered review pressure before final polishing.

Reviewer sequence:
1. Supportive but rigorous reviewer.
2. Cold methodological reviewer.
3. Harsh Reviewer #2.
${data.strictReview ? "4. Keep strict Reviewer #2 pressure active until all major risks are answered." : "4. Strict Reviewer #2 pressure is optional for this session."}

Support mode:
${supportMode}

Starter context from the user:
${data.sourceNotes || "No notes entered yet."}
`;
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getActiveTabName() {
  const activeButton = document.querySelector(".tab-button.is-active");
  return activeButton ? activeButton.dataset.tab : "pipeline";
}

function saveState() {
  const data = {
    title: fields.title.value,
    genre: fields.genre.value,
    claimType: fields.claimType.value,
    venue: fields.venue.value,
    citationStyle: fields.citationStyle.value,
    wordTarget: fields.wordTarget.value,
    abstractTarget: fields.abstractTarget.value,
    lockedTerms: fields.lockedTerms.value,
    methodMaterial: fields.methodMaterial.value,
    sourceNotes: fields.sourceNotes.value,
    governessMode: fields.governessMode.checked,
    strictReview: fields.strictReview.checked,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const saved = JSON.parse(raw);
    fields.title.value = saved.title || "";
    fields.genre.value = saved.genre || fields.genre.value;
    fields.claimType.value = saved.claimType || fields.claimType.value;
    fields.venue.value = saved.venue || "";
    fields.citationStyle.value = saved.citationStyle || "";
    fields.wordTarget.value = saved.wordTarget || "";
    fields.abstractTarget.value = saved.abstractTarget || "";
    fields.lockedTerms.value = saved.lockedTerms || "";
    fields.methodMaterial.value = saved.methodMaterial || "";
    fields.sourceNotes.value = saved.sourceNotes || "";
    fields.governessMode.checked = saved.governessMode !== false;
    fields.strictReview.checked = saved.strictReview !== false;
  } catch (error) {
    console.warn("Could not restore saved state", error);
  }
}

function buildAll() {
  const data = getData();
  const claims = splitLines(data.sourceNotes);
  const keywords = extractKeywords(data.sourceNotes);
  const risks = inferRisks(data, claims);

  outputs.pipeline.value = buildPipeline(data, claims, keywords);
  outputs.skeleton.value = buildSkeleton(data, claims, keywords);
  outputs.matrix.value = buildMatrix(data, claims);
  outputs.review.value = buildReviewPack(data, claims);
  outputs.prompt.value = buildPromptDeck(data, keywords);

  counters.claims.textContent = String(claims.length);
  counters.keywords.textContent = String(keywords.length);
  counters.risks.textContent = String(risks.length);

  saveState();
}

function clearForm() {
  fields.title.value = "";
  fields.genre.value = "Empirical IMRaD";
  fields.claimType.value = "Descriptive";
  fields.venue.value = "";
  fields.citationStyle.value = "";
  fields.wordTarget.value = "";
  fields.abstractTarget.value = "";
  fields.lockedTerms.value = "";
  fields.methodMaterial.value = "";
  fields.sourceNotes.value = "";
  fields.governessMode.checked = true;
  fields.strictReview.checked = true;
  buildAll();
}

function loadSample() {
  fields.title.value = "Governing Suspicion in Platform Medicine";
  fields.genre.value = "Mixed methods / policy";
  fields.claimType.value = "Associational";
  fields.venue.value = "Journal article";
  fields.citationStyle.value = "APA 7";
  fields.wordTarget.value = "7000 words";
  fields.abstractTarget.value = "250 words";
  fields.lockedTerms.value = "suspicion, seam, audit trail, legitimacy";
  fields.methodMaterial.value = "Policy corpus, platform documentation, interview notes";
  fields.sourceNotes.value = [
    "Clinicians describe AI triage as efficient but harder to trust when the escalation logic is hidden.",
    "Platform dashboards flatten uncertainty into confidence scores that travel as if they were neutral facts.",
    "Audit language appears strongest where accountability is actually delegated across vendor, hospital, and regulator.",
    "Interview notes suggest suspicion spikes when users cannot see who can overrule an automated recommendation.",
    "The paper should separate descriptive platform behavior from normative claims about what hospitals ought to do.",
    "Need one example where the interface design changes how a risk judgment becomes legible."
  ].join("\n");
  buildAll();
}

function switchTab(name) {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === name);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === name);
  });
}

async function copyCurrentTab() {
  const active = getActiveTabName();
  const content = outputs[active].value;
  try {
    await navigator.clipboard.writeText(content);
  } catch (error) {
    console.warn("Clipboard copy failed", error);
  }
}

function downloadCurrentTab() {
  const active = getActiveTabName();
  const baseName = (fields.title.value.trim() || "governess-agatha-project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const extension = active === "prompt" ? "txt" : "md";
  downloadText(`${baseName}-${active}.${extension}`, outputs[active].value);
}

function downloadFullPack() {
  const data = getData();
  const content = [
    outputs.pipeline.value,
    "",
    outputs.skeleton.value,
    "",
    outputs.matrix.value,
    "",
    outputs.review.value,
    "",
    outputs.prompt.value,
    "",
    `Project intake snapshot`,
    `Title: ${data.title}`,
    `Genre: ${data.genre}`,
    `Claim type: ${data.claimType}`,
    `Venue: ${data.venue}`,
    `Citation style: ${data.citationStyle}`,
    `Word target: ${data.wordTarget}`,
    `Abstract target: ${data.abstractTarget}`,
    `Locked vocabulary: ${data.lockedTerms}`,
    `Method or material: ${data.methodMaterial}`,
    "",
    "Notes:",
    data.sourceNotes || "No notes entered yet."
  ].join("\n");

  const baseName = (data.title || "governess-agatha-project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  downloadText(`${baseName}-full-pack.txt`, content);
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

Object.values(fields).forEach((element) => {
  element.addEventListener("input", buildAll);
  element.addEventListener("change", buildAll);
});

document.getElementById("build-pack").addEventListener("click", buildAll);
document.getElementById("download-pack").addEventListener("click", downloadFullPack);
document.getElementById("copy-current").addEventListener("click", copyCurrentTab);
document.getElementById("download-current").addEventListener("click", downloadCurrentTab);
document.getElementById("load-sample").addEventListener("click", loadSample);
document.getElementById("clear-form").addEventListener("click", clearForm);

restoreState();
buildAll();
