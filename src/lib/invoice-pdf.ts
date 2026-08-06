import PDFDocument from "pdfkit";
import type { PlanId } from "@/lib/plans";
import { formatUsdFromCents, planLabel } from "@/lib/plans";

export type InvoicePdfInput = {
  dealershipName: string;
  invoiceNumber: string;
  planId: PlanId;
  amountCents: number;
  periodLabel: string;
  note?: string | null;
  addressLines: string[];
  recipientEmail?: string;
};

const BRAND = "#023441";
const MUTED = "#3a5c66";
const LINE = "#efbb92";

function collectPdfBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

/** Build a printable SalesTower subscription invoice PDF. */
export async function buildInvoicePdf(
  input: InvoicePdfInput
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    info: {
      Title: `Invoice ${input.invoiceNumber}`,
      Author: "SalesTower",
      Subject: `Subscription invoice for ${input.dealershipName}`,
    },
  });

  const done = collectPdfBuffer(doc);
  const amount = formatUsdFromCents(input.amountCents);
  const issued = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("SalesTower", { continued: false });

  doc
    .moveDown(0.2)
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(10)
    .text("Subscription invoice")
    .text("info@salestower.io");

  doc.moveDown(1.2);
  doc
    .strokeColor(LINE)
    .lineWidth(2)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();

  doc.moveDown(1.2);
  const metaTop = doc.y;
  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Invoice", doc.page.margins.left, metaTop);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(MUTED)
    .text(`Number: ${input.invoiceNumber}`)
    .text(`Issued: ${issued}`)
    .text(`Billing period: ${input.periodLabel}`);

  const billX = 320;
  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Bill to", billX, metaTop, { width: 230 });
  doc.font("Helvetica").fontSize(10).fillColor(MUTED);
  for (const line of input.addressLines) {
    doc.text(line, billX, doc.y, { width: 230 });
  }
  if (input.recipientEmail) {
    doc.text(input.recipientEmail, billX, doc.y, { width: 230 });
  }

  doc.y = Math.max(doc.y, metaTop + 90);
  doc.moveDown(1.5);

  const tableTop = doc.y;
  const colDesc = doc.page.margins.left;
  const colPlan = 280;
  const colAmount = 430;
  const tableWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .rect(colDesc, tableTop, tableWidth, 22)
    .fill(BRAND);

  doc
    .fillColor("#ffe0c0")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("DESCRIPTION", colDesc + 10, tableTop + 7, { width: 240 })
    .text("PLAN", colPlan, tableTop + 7, { width: 120 })
    .text("AMOUNT", colAmount, tableTop + 7, { width: 100, align: "right" });

  const rowTop = tableTop + 28;
  doc
    .fillColor(BRAND)
    .font("Helvetica")
    .fontSize(10)
    .text(
      `SalesTower monthly subscription — ${input.periodLabel}`,
      colDesc + 10,
      rowTop,
      { width: 240 }
    )
    .text(planLabel(input.planId), colPlan, rowTop, { width: 120 })
    .font("Helvetica-Bold")
    .text(amount, colAmount, rowTop, { width: 100, align: "right" });

  doc
    .strokeColor(LINE)
    .lineWidth(1)
    .moveTo(colDesc, rowTop + 28)
    .lineTo(colDesc + tableWidth, rowTop + 28)
    .stroke();

  doc.y = rowTop + 48;
  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(`Amount due: ${amount}`, { align: "right" });

  doc.moveDown(1.5);
  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Payment instructions");
  doc
    .moveDown(0.3)
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(10)
    .text(
      "Please remit the amount due by ACH or check for this monthly subscription. Reply to this email if you need bank / ACH details or have billing questions."
    );

  if (input.note?.trim()) {
    doc.moveDown(1);
    doc
      .fillColor(BRAND)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Note from SalesTower");
    doc
      .moveDown(0.3)
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(10)
      .text(input.note.trim());
  }

  doc.moveDown(2);
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(9)
    .text("Thank you for your business.", { align: "left" })
    .text("SalesTower Billing · info@salestower.io");

  doc.end();
  return done;
}

export function invoicePdfFilename(invoiceNumber: string): string {
  const safe = invoiceNumber.replace(/[^A-Za-z0-9-_]+/g, "_");
  return `${safe}.pdf`;
}
