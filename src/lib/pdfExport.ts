import { jsPDF } from "jspdf";
import { Inputs, Outputs, ORDER } from "./cypher";
import { SECTION_TITLES, slugify } from "./export";

const GREEN_START: [number, number, number] = [61, 181, 52]; // #3db534
const GREEN_END: [number, number, number] = [21, 101, 52]; // dark green

function lerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export interface Word {
  text: string;
  bold: boolean;
  link?: string;
}

// Pure, no PDF/browser APIs, splits a line of markdown into ordered words
// with their bold/link attributes preserved. Exported so it's directly
// unit-testable.
export function tokenizeToWords(line: string): Word[] {
  const words: Word[] = [];
  const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match[1] !== undefined) {
      for (const w of match[1].split(/\s+/).filter(Boolean)) {
        words.push({ text: w, bold: true });
      }
    } else if (match[2] !== undefined) {
      for (const w of match[2].split(/\s+/).filter(Boolean)) {
        words.push({ text: w, bold: false, link: match[3] });
      }
    } else if (match[4] !== undefined) {
      words.push({ text: match[4], bold: false });
    }
  }
  return words;
}

// Generates and downloads a real PDF file. Browser-only (jsPDF's .save()
// triggers a download), not unit tested directly, tokenizeToWords above is
// where the parsing logic actually lives and is tested.
export function generateSessionPdf(inputs: Inputs, outputs: Outputs): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 18;
  const marginTop = 20;
  const marginBottom = 20;
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = doc.internal.pageSize.getWidth() - marginX * 2;

  const cursor = { y: marginTop };

  const ensureSpace = (needed: number) => {
    if (cursor.y + needed > pageHeight - marginBottom) {
      doc.addPage();
      cursor.y = marginTop;
    }
  };

  const gradientBar = (width: number, height: number) => {
    const steps = 40;
    const sliceW = width / steps;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const [r, g, b] = lerp(GREEN_START, GREEN_END, t);
      doc.setFillColor(r, g, b);
      doc.rect(marginX + i * sliceW, cursor.y, sliceW + 0.4, height, "F");
    }
    cursor.y += height + 4;
  };

  const renderWrapped = (words: Word[], x: number, maxWidth: number, lineHeight: number, fontSize: number) => {
    doc.setFontSize(fontSize);
    let curX = x;
    for (const word of words) {
      doc.setFont("helvetica", word.bold ? "bold" : "normal");
      const w = doc.getTextWidth(word.text);

      if (curX > x && curX + w > x + maxWidth) {
        curX = x;
        cursor.y += lineHeight;
        ensureSpace(lineHeight);
      }

      if (word.link) {
        doc.setTextColor(37, 99, 235);
        doc.textWithLink(word.text, curX, cursor.y, { url: word.link });
      } else {
        doc.setTextColor(35, 35, 35);
        doc.text(word.text, curX, cursor.y);
      }

      curX += w + doc.getTextWidth(" ");
    }
    cursor.y += lineHeight;
  };

  // ── Title block ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 15, 15);
  doc.text("CYPHER Study Session", marginX, cursor.y);
  cursor.y += 3;
  gradientBar(40, 1.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  const generatedOn = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Topic: ${inputs.topic}`, marginX, cursor.y);
  cursor.y += 5;
  doc.text(`Level: ${inputs.level}     Time: ${inputs.time}     Generated: ${generatedOn}`, marginX, cursor.y);
  cursor.y += 5;
  renderWrapped(tokenizeToWords(`Goal: ${inputs.goal}`), marginX, contentWidth, 5, 9.5);
  cursor.y += 5;

  // ── Sections ──
  let isFirstSection = true;
  for (const key of ORDER) {
    const content = outputs[key]?.trim();
    if (!content) continue;

    if (isFirstSection) {
      ensureSpace(18);
      isFirstSection = false;
    } else {
      // Every section after the first starts on its own fresh page,
      // never partway down a page the previous section already filled.
      doc.addPage();
      cursor.y = marginTop;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 15, 15);
    doc.text(SECTION_TITLES[key], marginX, cursor.y);
    cursor.y += 2.4;
    gradientBar(22, 1.3);
    cursor.y += 1;

    const lines = content.split("\n");
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) {
        cursor.y += 2;
        continue;
      }

      if (line === "---") {
        ensureSpace(6);
        doc.setDrawColor(225, 225, 225);
        doc.setLineWidth(0.25);
        doc.line(marginX, cursor.y, marginX + contentWidth, cursor.y);
        cursor.y += 5;
        continue;
      }

      if (line.startsWith("### ")) {
        ensureSpace(9);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11.5);
        doc.setTextColor(22, 101, 52);
        doc.text(line.replace(/^###\s+/, ""), marginX, cursor.y);
        cursor.y += 6.5;
        continue;
      }

      if (line.startsWith("## ")) {
        ensureSpace(9);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12.5);
        doc.setTextColor(22, 101, 52);
        doc.text(line.replace(/^##\s+/, ""), marginX, cursor.y);
        cursor.y += 7;
        continue;
      }

      let indent = 0;
      let bodyText = line;
      const bulletMatch = line.match(/^-\s+(.*)/);
      const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);

      ensureSpace(6);

      if (bulletMatch) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(61, 181, 52);
        doc.text("\u2022", marginX, cursor.y);
        bodyText = bulletMatch[1];
        indent = 5;
      } else if (numberedMatch) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(61, 181, 52);
        doc.text(`${numberedMatch[1]}.`, marginX, cursor.y);
        bodyText = numberedMatch[2];
        indent = 6;
      }

      renderWrapped(tokenizeToWords(bodyText), marginX + indent, contentWidth - indent, 5.2, 10);
    }

    cursor.y += 6;
  }

  doc.save(`cypher-${slugify(inputs.topic)}.pdf`);
}
