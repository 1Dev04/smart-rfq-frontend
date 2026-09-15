<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import { apiFetch } from "../../utils/api";
import html2pdf from "html2pdf.js";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SARABUN_REGULAR_BASE64, SARABUN_BOLD_BASE64 } from "../../../assets/fonts/sarabunFont";

const drawer = useRFQDrawerStore();
const toast = useToast();
const BASE = `${import.meta.env.VITE_API_URL}`;

const isLoading = ref(false);
const isExportingPdf = ref(false);
const isExportingExcel = ref(false);
const doc = ref(null);
const activeItemIndex = ref(0);
const printAreaRef = ref(null); 
const LOGO_URL =
  "https://res.cloudinary.com/dxoiu2cn5/image/upload/v1782634393/image0_rjd86g.jpg";


const allSteps = [
  { id: "user_pending", label: "User\nPending" },
  { id: "purchase_accept", label: "Purchase\nAccept" },
  { id: "waiting_quotation", label: "Waiting\nQuotation" },
  { id: "purchase_compare", label: "Purchase\nCompare" },
  { id: "user_confirm", label: "User\nConfirm" },
  { id: "purchase_confirm", label: "Purchase\nConfirm" },
  { id: "finish", label: "Finish" },
];

function stepStatus(stepId) {
  if (!doc.value) return "pending";
  const raw = (doc.value.status ?? doc.value.Status ?? "")
    .toString()
    .trim()
    .toLowerCase();
  if (raw === "finish") return "done";
  return "pending";
}

async function fetchDetail() {
  if (!drawer.docRequestId) return;
  isLoading.value = true;
  try {
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    doc.value = await res.json();
    activeItemIndex.value = 0;
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "โหลดข้อมูลไม่สำเร็จ",
      detail: err.message,
      life: 4000,
    });
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => [drawer.docRequestId, drawer.showDrawer, drawer.drawerRole],
  async ([id, show, role]) => {
    await nextTick();
    if (id && show && role === "finish") {
      doc.value = null;
      await fetchDetail();
    }
  },
  { immediate: true },
);

const currentItem = computed(
  () => doc.value?.items?.[activeItemIndex.value] ?? null,
);
const currentVendorQuotes = computed(
  () => currentItem.value?.vendorQuotes ?? [],
);

function prevItem() {
  if (activeItemIndex.value > 0) activeItemIndex.value--;
}
function nextItem() {
  if (doc.value && activeItemIndex.value < doc.value.items.length - 1)
    activeItemIndex.value++;
}

// ── ราคาที่ใช้เทียบ: เอา Final Price (หลัง Cost Saving) ก่อนเสมอ ถ้าไม่มีค่อย fallback ไปราคาตั้งต้น ──
function effectivePrice(vq) {
  const p = vq.finalPrice ?? vq.price;
  return p != null && p !== "" ? Number(p) : null;
}

// ── Compared (1st vs 2nd): เทียบราคาแพงสุด vs ถูกสุด ข้าม 3 Vendor ──
function computeCompared(quotes) {
  const prices = quotes.map(effectivePrice).filter((p) => p != null);
  if (prices.length < 2) return { amount: null, percent: null };
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const amount = max - min;
  const percent = max !== 0 ? (amount / max) * 100 : null;
  return { amount, percent };
}

const compared = computed(() => computeCompared(currentVendorQuotes.value));

function fmtTHB(n) {
  if (n == null || Number.isNaN(n)) return "-";
  return Number(n).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
function fmtPercent(n) {
  if (n == null || Number.isNaN(n)) return "-";
  return `${n.toFixed(1)}%`;
}

// ── Export PDF: capture ตารางที่กำลังแสดงอยู่ ด้วย html2pdf.js ──
// ── PDF Export: วาดตารางจริงด้วย jspdf-autotable (ไม่ใช่ภาพ) ──────────
const showPdfPreview = ref(false);
const isGeneratingPreview = ref(false);
const pdfPreviewUrl = ref(null);
const pdfOptions = ref({
  paperSize: "a4",       // "a4" | "a3"
  orientation: "landscape", // "landscape" | "portrait"
  fontSize: 9,            // ขนาดฟอนต์ในตาราง
});

async function fetchLogoDataUrl() {
  const res = await fetch(LOGO_URL, { mode: "cors" });
  if (!res.ok) throw new Error("โหลดโลโก้ไม่สำเร็จ");
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function buildPdfDocument() {
  const item = currentItem.value;
  const quotes = currentVendorQuotes.value;
  const vendorCount = quotes.length;

  const pdfDoc = new jsPDF({
    orientation: pdfOptions.value.orientation,
    unit: "mm",
    format: pdfOptions.value.paperSize,
  });

    pdfDoc.addFileToVFS("Sarabun-Regular.ttf", SARABUN_REGULAR_BASE64);
  pdfDoc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  pdfDoc.addFileToVFS("Sarabun-Bold.ttf", SARABUN_BOLD_BASE64);
  pdfDoc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  pdfDoc.setFont("Sarabun", "normal");


  const pageWidth = pdfDoc.internal.pageSize.getWidth();
  const marginX = 12;
  let logoDataUrl = null;
  try {
    logoDataUrl = await fetchLogoDataUrl();
  } catch (e) {
    console.warn("โหลดโลโก้ไม่สำเร็จ:", e.message);
  }

  // ── โลโก้ + Meta info ──
  if (logoDataUrl) {
    pdfDoc.addImage(logoDataUrl, "JPEG", marginX, 10, 32, 18);
  }

  pdfDoc.setFontSize(11);
  pdfDoc.setFont("Sarabun", "bold");
  pdfDoc.text("Thai-Japan Gas Co.,Ltd.", marginX + 36, 16);
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("Sarabun", "normal");
  pdfDoc.text(`RFQ Compare — ${doc.value?.rfqNo ?? "-"}`, marginX + 36, 21);

  const metaRight = pageWidth - marginX;
  const metaLines = [
    [`RFQ No.`, doc.value?.rfqNo ?? "-"],
    [`Req date`, doc.value?.createdAt ?? "-"],
    [`Target PUR reply`, item?.targetPURreply ?? "-"],
  ];
  const metaLinesRight = [
    [`Project Name`, item?.projectName ?? "-"],
    [`GL Code`, item?.glCode ?? "-"],
    [`SAP item No.`, item?.sapItem ?? "-"],
  ];

  pdfDoc.setFontSize(8);
  let mY = 10;
  metaLines.forEach(([label, value]) => {
    pdfDoc.setFont("Sarabun", "bold");
    pdfDoc.text(`${label}:`, marginX + 90, mY);
    pdfDoc.setFont("Sarabun", "normal");
    pdfDoc.text(String(value), marginX + 125, mY);
    mY += 5;
  });
  mY = 10;
  metaLinesRight.forEach(([label, value]) => {
    pdfDoc.setFont("Sarabun", "bold");
    pdfDoc.text(`${label}:`, metaRight - 70, mY);
    pdfDoc.setFont("Sarabun", "normal");
    pdfDoc.text(String(value), metaRight - 40, mY);
    mY += 5;
  });

  pdfDoc.setDrawColor(43, 87, 154);
  pdfDoc.setLineWidth(0.6);
  pdfDoc.line(marginX, 32, pageWidth - marginX, 32);

  // ── หัวตาราง (2 แถว, มี colSpan สำหรับ Compared) ──
const head = [
  [
    {
      content: "",
      colSpan: 1 + vendorCount,
      styles: {
        lineWidth: 0.1,
        lineColor: [215, 221, 229],
        fillColor: [255, 255, 255],
      },
    },
    {
      content: "Compared (1st vs 2nd)",
      colSpan: 2,
      styles: {
        fillColor: [253, 232, 232],
        textColor: [180, 35, 24],
        lineWidth: 0.1,
        lineColor: [215, 221, 229],
        halign: "center",
        valign: "middle",
      },
    },
  ],
  [
    "Detail",
    ...quotes.map((_, vi) => `Vendor ${vi + 1}`),
    "Per Unit (THB) %",
    "Amount (THB)",
  ],
];

  // ── แถวข้อมูล ──
  const rows = [
    ["Item description", ...quotes.map((q) => q.itemDescription || "-"), "", ""],
    ["Specification / Part no.", ...quotes.map((q) => q.specPartNo || "-"), "", ""],
    ["Model", ...quotes.map((q) => q.model || "-"), "", ""],
    ["Picture", ...quotes.map(() => "-"), "", ""],
    ["Quantity", ...quotes.map(() => String(item?.quantity ?? "-")), "", ""],
    ["UOM", ...quotes.map(() => item?.uom || "-"), "", ""],
    [
      "Price",
      ...quotes.map((q) => `${fmtTHB(effectivePrice(q))} (THB)`),
      fmtPercent(compared.value.percent),
      fmtTHB(compared.value.amount),
    ],
    ["Discount", ...quotes.map((q) => fmtTHB(q.finalDiscount ?? q.discount)), "", ""],
    [
      "Quotation Files",
      ...quotes.map((q) =>
        q.finalQuotationFilePath || q.quotationFilePath ? "มีไฟล์แนบ (ดูในระบบ)" : "-",
      ),
      "",
      "",
    ],
    ["Reasons choices differ.", ...quotes.map((q) => q.userDiffReason || "-"), "", ""],
    ["* Remark Reasons From PUR *", ...quotes.map((q) => q.remark || "-"), "", ""],
    ["Cost Saving", ...quotes.map((q) => q.costSavingReason || "-"), "", ""],
  ];

  const priceRowIndex = 6;
  const remarkRowIndex = 10;

  autoTable(pdfDoc, {
    head,
    body: rows,
    startY: 36,
    theme: "grid",
    styles: {
      font: "Sarabun",   
      fontSize: pdfOptions.value.fontSize,
      cellPadding: 2.2,
      valign: "middle",
      overflow: "linebreak",
      lineWidth: 0.1,     
      lineColor: [215, 221, 229],
    },
    headStyles: {
      font: "Sarabun",   
      fillColor: [238, 241, 245],
      textColor: [58, 69, 83],
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.1,          
      lineColor: [215, 221, 229],
    },
   columnStyles: {
    0: { fontStyle: "bold", fillColor: [243, 245, 248], cellWidth: 32 },
  },
    // ── ทำซ้ำหัวตารางทุกหน้า + ไม่ตัดกลางแถวเด็ดขาด (ค่า default ของ autotable) ──
    showHead: "everyPage",
    didParseCell: (data) => {
      // ไฮไลต์แถว Price ที่มีค่า Compared
      if (data.section === "body" && data.row.index === priceRowIndex) {
        if (data.column.index >= 1 + vendorCount) {
          data.cell.styles.fillColor = [253, 243, 243];
          data.cell.styles.textColor = [180, 35, 24];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign = "right";
        }
      }
      // ไฮไลต์ label แถว Remark เป็นสีแดง
      if (
        data.section === "body" &&
        data.row.index === remarkRowIndex &&
        data.column.index === 0
      ) {
        data.cell.styles.textColor = [180, 35, 24];
      }
    },
  });

  return pdfDoc;
}

async function openPdfPreview() {
  if (!currentItem.value) return;
  showPdfPreview.value = true;
  await refreshPreview();
}

async function refreshPreview() {
  isGeneratingPreview.value = true;
  try {
    const pdfDoc = await buildPdfDocument();
    if (pdfPreviewUrl.value) URL.revokeObjectURL(pdfPreviewUrl.value);
    pdfPreviewUrl.value = pdfDoc.output("bloburl");
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "สร้างตัวอย่างไม่สำเร็จ",
      detail: err.message,
      life: 4000,
    });
  } finally {
    isGeneratingPreview.value = false;
  }
}

function closePdfPreview() {
  showPdfPreview.value = false;
  if (pdfPreviewUrl.value) {
    URL.revokeObjectURL(pdfPreviewUrl.value);
    pdfPreviewUrl.value = null;
  }
}

async function confirmExportPdf() {
  isExportingPdf.value = true;
  try {
    const pdfDoc = await buildPdfDocument();
    pdfDoc.save(
      `${doc.value?.rfqNo ?? "RFQ"}_Compare_Item${activeItemIndex.value + 1}.pdf`,
    );
    closePdfPreview();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Export PDF ไม่สำเร็จ",
      detail: err.message,
      life: 4500,
    });
  } finally {
    isExportingPdf.value = false;
  }
}
// ── Export Excel: สร้าง workbook จากทุก Item พร้อมคอลัมน์ Compared ──

// Load logo 
async function fetchLogoBuffer() {
  const res = await fetch(LOGO_URL, { mode: "cors" });
  if (!res.ok) throw new Error("โหลดโลโก้ไม่สำเร็จ");
  const blob = await res.blob();
  return await blob.arrayBuffer();
}

async function exportExcel() {
  if (!doc.value?.items?.length) return;
  isExportingExcel.value = true;
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TJG Purchase System";

  
    let logoImageId = null;
    try {
      const logoBuffer = await fetchLogoBuffer();
      logoImageId = workbook.addImage({
        buffer: logoBuffer,
        extension: "jpeg", // เปลี่ยนเป็น "png" ถ้าไฟล์เป็น .png
      });
    } catch (e) {
      console.warn("โหลดโลโก้ไม่สำเร็จ, จะสร้างไฟล์โดยไม่มีโลโก้:", e.message);
    }

    const HEADER_BLUE = "FF2B579A";
    const LABEL_BG = "FFEEF1F5";
    const COMPARE_HEAD_BG = "FFFDE8E8";
    const COMPARE_CELL_BG = "FFFDF3F3";
    const COMPARE_TEXT = "FFB42318";
    const BORDER_COLOR = "FFD7DDE5";
    const TEXT_DARK = "FF14181F";
    const LABEL_TEXT = "FF3A4553";

    const thinBorder = {
      top: { style: "thin", color: { argb: BORDER_COLOR } },
      left: { style: "thin", color: { argb: BORDER_COLOR } },
      bottom: { style: "thin", color: { argb: BORDER_COLOR } },
      right: { style: "thin", color: { argb: BORDER_COLOR } },
    };

    function styleDataRow(row, vendorCount, isPrice = false, isWarn = false) {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = thinBorder;
        cell.alignment = { vertical: "middle", wrapText: true, horizontal: "left" };
        if (colNumber === 1) {
          cell.font = { name: "Tahoma", bold: true, color: { argb: isWarn ? COMPARE_TEXT : LABEL_TEXT } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LABEL_BG } };
        } else if (colNumber > 1 + vendorCount) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isPrice ? COMPARE_CELL_BG : "FFFAFBFC" },
          };
          if (isPrice) {
            cell.font = { name: "Tahoma", bold: true, color: { argb: COMPARE_TEXT } };
            cell.alignment = { vertical: "middle", horizontal: "right" };
          }
        } else {
          cell.font = { name: "Tahoma", color: { argb: TEXT_DARK } };
        }
      });
      row.height = 26;
    }

    doc.value.items.forEach((item, idx) => {
      const quotes = item.vendorQuotes ?? [];
      if (!quotes.length) return;

      const { amount, percent } = computeCompared(quotes);
      const vendorCount = quotes.length;
      const totalCols = 1 + vendorCount + 2;

      const sheetName = `Item ${idx + 1}`.slice(0, 31);
      const ws = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: false }],
      });

      ws.getColumn(1).width = 26;
      for (let i = 0; i < vendorCount; i++) ws.getColumn(2 + i).width = 34;
      ws.getColumn(2 + vendorCount).width = 16;
      ws.getColumn(3 + vendorCount).width = 16;

      // ── แถวว่างด้านบนไว้วางโลโก้ (สูงพอสำหรับรูป) ──
      ws.getRow(1).height = 70;
      if (logoImageId != null) {
        ws.addImage(logoImageId, {
          tl: { col: 0, row: 0 },   // มุมบนซ้าย ที่คอลัมน์ A แถว 1 (0-indexed)
          ext: { width: 150, height: 65 }, // ขนาดรูปโดยประมาณ (px)
        });
      }

      // ── Title  ──
      ws.mergeCells(1, 2, 1, totalCols);
      const titleCell = ws.getCell(1, 2);
      titleCell.value = `Thai-Japan Gas Co.,Ltd. — Print Compare (${doc.value.rfqNo})`;
      titleCell.font = { name: "Tahoma", size: 14, bold: true, color: { argb: HEADER_BLUE } };
      titleCell.alignment = { vertical: "middle", horizontal: "left" };

      ws.addRow([]);

      // ── Meta info ──
      const metaRows = [
        ["RFQ No.", doc.value.rfqNo, "", "Project Name", item.projectName || "-"],
        ["Req date", doc.value.createdAt, "", "GL Code", item.glCode || "-"],
        ["Target PUR reply", item.targetPURreply ?? "-", "", "SAP item No.", item.sapItem || "-"],
        ["Actual date PUR Replied", doc.value.actualPurReplyDate ?? "-", "", "", ""],
      ];
      metaRows.forEach((rowData) => {
        const row = ws.addRow(rowData);
        row.getCell(1).font = { name: "Tahoma", bold: true, color: { argb: LABEL_TEXT } };
        row.getCell(2).font = { name: "Tahoma", color: { argb: TEXT_DARK } };
        row.getCell(4).font = { name: "Tahoma", bold: true, color: { argb: LABEL_TEXT } };
        row.getCell(5).font = { name: "Tahoma", color: { argb: TEXT_DARK } };
      });

      ws.addRow([]);

      // ──  header
      const dividerRowIdx = ws.rowCount + 1;
      ws.mergeCells(dividerRowIdx, 1, dividerRowIdx, totalCols);
      ws.getRow(dividerRowIdx).height = 3;
      ws.getCell(dividerRowIdx, 1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: HEADER_BLUE },
      };
      ws.addRow([]);

      // ── Table header ──
      const headerRow1Idx = ws.rowCount + 1;
      ws.mergeCells(headerRow1Idx, 1, headerRow1Idx, 1 + vendorCount);
      ws.mergeCells(headerRow1Idx, 2 + vendorCount, headerRow1Idx, 3 + vendorCount);
      const compareHeadCell = ws.getCell(headerRow1Idx, 2 + vendorCount);
      compareHeadCell.value = "Compared (1st vs 2nd)\n* เลือก Vendor ที่แพงที่สุด – ถูกที่สุด *";
      compareHeadCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      compareHeadCell.font = { name: "Tahoma", bold: true, color: { argb: COMPARE_TEXT }, size: 10 };
      compareHeadCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COMPARE_HEAD_BG } };
      ws.getRow(headerRow1Idx).height = 32;

      const headerRow2 = ws.addRow([
        "Detail",
        ...quotes.map((_, vi) => `Vendor ${vi + 1}`),
        "Per Unit (THB) %",
        "Amount (THB)",
      ]);
      headerRow2.eachCell((cell, colNumber) => {
        const isCompareCol = colNumber > 1 + vendorCount;
        cell.font = { name: "Tahoma", bold: true, color: { argb: isCompareCol ? COMPARE_TEXT : LABEL_TEXT } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: isCompareCol ? COMPARE_HEAD_BG : "FFEEF1F5" },
        };
        cell.border = thinBorder;
      });

      // ── Data rows ──
      const dataDefs = [
        { label: "Item description", get: (q) => q.itemDescription || "-" },
        { label: "Specification / Part no.", get: (q) => q.specPartNo || "-" },
        { label: "Model", get: (q) => q.model || "-" },
        { label: "Picture", get: () => "-" },
        { label: "Quantity", get: () => item.quantity ?? "-" },
        { label: "UOM", get: () => item.uom || "-" },
      ];
      dataDefs.forEach((def) => {
        const row = ws.addRow([def.label, ...quotes.map(def.get), "", ""]);
        styleDataRow(row, vendorCount);
      });

      // Price row
      const priceRow = ws.addRow([
        "Price",
        ...quotes.map((q) => effectivePrice(q) ?? "-"),
        percent != null ? Number((percent / 100).toFixed(4)) : "-",
        amount != null ? Number(amount.toFixed(2)) : "-",
      ]);
      styleDataRow(priceRow, vendorCount, true);
      priceRow.getCell(2 + vendorCount).numFmt = "0.0%";
      priceRow.getCell(3 + vendorCount).numFmt = "#,##0.00";
      for (let i = 0; i < vendorCount; i++) {
        priceRow.getCell(2 + i).numFmt = "#,##0.00";
        priceRow.getCell(2 + i).alignment = { vertical: "middle", horizontal: "right" };
      }

      const restDefs = [
        { label: "Discount", get: (q) => q.finalDiscount ?? q.discount ?? "-" },
        { label: "Quotation Files", get: (q) => q.finalQuotationFilePath || q.quotationFilePath || "-" },
        { label: "Reasons choices differ.", get: (q) => q.userDiffReason || "-" },
        { label: "* Remark Reasons From PUR *", get: (q) => q.remark || "-", warn: true },
        { label: "Cost Saving", get: (q) => q.costSavingReason || "-" },
      ];
      restDefs.forEach((def) => {
        const row = ws.addRow([def.label, ...quotes.map(def.get), "", ""]);
        styleDataRow(row, vendorCount, false, def.warn);
      });
    });

    if (workbook.worksheets.length === 0) {
      toast.add({
        severity: "warn",
        summary: "ไม่มีข้อมูล",
        detail: "ไม่มี Vendor Quote ให้ export",
        life: 3000,
      });
      return;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.value?.rfqNo ?? "RFQ"}_Compare.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Export Excel ไม่สำเร็จ",
      detail: err.message,
      life: 4500,
    });
  } finally {
    isExportingExcel.value = false;
  }
}

function closeDrawer() {
  drawer.showDrawer = false;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fin-fade">
      <div
        v-if="drawer.showDrawer && drawer.drawerRole === 'finish'"
        class="fin-overlay"
        @click.self="closeDrawer"
      >
        <Transition name="fin-slide" appear>
          <div class="fin-panel" role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="fin-header">
              <div class="fin-header-left">
                <div class="fin-badge">RFQ</div>
                <div>
                  <h2 class="fin-title">Print Compare</h2>
                  <span class="fin-sub">
                    {{ doc?.rfqNo }} · {{ doc?.revNo }} ·
                    {{ doc?.items?.length ?? 0 }} Items
                  </span>
                </div>
              </div>
              <button class="fin-close" @click="closeDrawer">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Pipeline -->
            <div class="fin-pipeline">
              <div class="fin-pipeline-track">
                <template v-for="(step, i) in allSteps" :key="step.id">
                  <div
                    class="fin-step"
                    :class="`fin-step--${stepStatus(step.id)}`"
                  >
                    <div class="fin-node">
                      <svg
                        v-if="stepStatus(step.id) === 'done'"
                        width="12"
                        height="12"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                      </svg>
                      <span v-else class="fin-num">{{ i + 1 }}</span>
                    </div>
                    <span class="fin-step-label">{{ step.label }}</span>
                  </div>
                  <div
                    v-if="i < allSteps.length - 1"
                    class="fin-arrow fin-arrow--done"
                  >
                    <svg width="14" height="10" viewBox="0 0 16 12" fill="none">
                      <path
                        d="M1 6H14M10 1l5 5-5 5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                </template>
              </div>
            </div>

            <div class="fin-body">
              <div v-if="isLoading" class="fin-loading">
                <i class="pi pi-spin pi-spinner"></i> กำลังโหลด...
              </div>

              <template v-else-if="doc && currentItem">
                <div ref="printAreaRef" class="fin-print-area">
                  <!-- ── หัวรายงาน: โลโก้ + meta 2 คอลัมน์ ── -->
                  <div class="fin-report-head">
                    <div class="fin-logo-block">
                     
                      

                      <img :src="LOGO_URL" alt="TJG Gas Logo" class="fin-logo"
                    </div>
                    <div class="fin-meta-grid">
                      <div class="fin-meta-col">
                        <div class="fin-meta-row">
                          <span>RFQ No.</span><strong>{{ doc.rfqNo }}</strong>
                        </div>
                        <div class="fin-meta-row">
                          <span>Req date</span
                          ><strong>{{ doc.createdAt }}</strong>
                        </div>
                        <div class="fin-meta-row">
                          <span>Target PUR reply</span
                          ><strong>{{
                            currentItem.targetPURreply ?? "-"
                          }}</strong>
                        </div>
                        <div class="fin-meta-row">
                          <span>Actual date PUR Replied</span
                          ><strong>{{
                            doc.actualPurReplyDate ?? "-"
                          }}</strong>
                        </div>
                      </div>
                      <div class="fin-meta-col">
                        <div class="fin-meta-row">
                          <span>Project Name</span
                          ><strong>{{
                            currentItem.projectName || "-"
                          }}</strong>
                        </div>
                        <div class="fin-meta-row">
                          <span>GL Code</span
                          ><strong>{{ currentItem.glCode || "-" }}</strong>
                        </div>
                        <div class="fin-meta-row">
                          <span>SAP item No.</span
                          ><strong>{{ currentItem.sapItem || "-" }}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ── ตารางเทียบ Vendor + Compared (1st vs 2nd) ── -->
                  <div v-if="currentVendorQuotes.length" class="fin-table-wrap">
                    <table class="fin-table">
                      <thead>
                        <tr>
                          <th :colspan="currentVendorQuotes.length + 1"></th>
                          <th colspan="2" class="fin-th-compared">
                            Compared (1st vs 2nd)
                            <span class="fin-compared-note"
                              >* เลือก Vendor ที่แพงที่สุด – ถูกที่สุด *</span
                            >
                          </th>
                        </tr>
                        <tr>
                          <th class="fin-th-detail">Detail</th>
                          <th
                            v-for="(vq, vi) in currentVendorQuotes"
                            :key="vi"
                            class="fin-th-vendor"
                          >
                            Vendor {{ vi + 1 }}
                          </th>
                          <th class="fin-th-compared-sub">Per Unit (THB) %</th>
                          <th class="fin-th-compared-sub">Amount (THB)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="fin-td-label">Item description</td>
                          <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                            <span class="fin-static">{{
                              vq.itemDescription || "-"
                            }}</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>
                        <tr>
                          <td class="fin-td-label">
                            Specification / Part no.
                          </td>
                          <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                            <span class="fin-static">{{
                              vq.specPartNo || "-"
                            }}</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>
                        <tr>
                          <td class="fin-td-label">Model</td>
                          <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                            <span class="fin-static">{{ vq.model || "-" }}</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>
                        <tr>
                          <td class="fin-td-label">Picture</td>
                          <td
                            v-for="(vq, vi) in currentVendorQuotes"
                            :key="vi"
                            class="fin-td-center"
                          >
                            <span class="fin-static">-</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>
                        <tr>
                          <td class="fin-td-label">Quantity</td>
                          <td
                            v-for="(vq, vi) in currentVendorQuotes"
                            :key="vi"
                            class="fin-td-center"
                          >
                            <span class="fin-static">{{
                              currentItem.quantity ?? "-"
                            }}</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>
                        <tr>
                          <td class="fin-td-label">UOM</td>
                          <td
                            v-for="(vq, vi) in currentVendorQuotes"
                            :key="vi"
                            class="fin-td-center"
                          >
                            <span class="fin-static">{{
                              currentItem.uom || "-"
                            }}</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>

                        <!-- Price: แถวเดียวที่มีค่า Compared -->
                        <tr class="fin-row-highlight">
                          <td class="fin-td-label">Price</td>
                          <td
                            v-for="(vq, vi) in currentVendorQuotes"
                            :key="vi"
                            class="fin-td-num"
                          >
                            <span class="fin-static"
                              >{{ fmtTHB(effectivePrice(vq)) }} (THB)</span
                            >
                          </td>
                          <td class="fin-td-num fin-td-compared">
                            {{ fmtPercent(compared.percent) }}
                          </td>
                          <td class="fin-td-num fin-td-compared">
                            {{ fmtTHB(compared.amount) }}
                          </td>
                        </tr>

                        <tr class="fin-row-highlight">
                          <td class="fin-td-label">Discount</td>
                          <td
                            v-for="(vq, vi) in currentVendorQuotes"
                            :key="vi"
                            class="fin-td-num"
                          >
                            <span class="fin-static">{{
                              fmtTHB(vq.finalDiscount ?? vq.discount)
                            }}</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>

                        <tr class="fin-row-highlight">
                          <td class="fin-td-label">Quotation Files</td>
                          <td
                            v-for="(vq, vi) in currentVendorQuotes"
                            :key="vi"
                            class="fin-td-center"
                          >
                            <a
                              v-if="
                                vq.finalQuotationFilePath ||
                                vq.quotationFilePath
                              "
                              :href="
                                vq.finalQuotationFilePath ||
                                vq.quotationFilePath
                              "
                              target="_blank"
                              class="fin-file-link"
                            >
                              <i class="pi pi-file-pdf"></i> ดูไฟล์
                            </a>
                            <span v-else class="fin-static">-</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>

                        <tr class="fin-row-highlight">
                          <td class="fin-td-label">Reasons choices differ.</td>
                          <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                            <span class="fin-static">{{
                              vq.userDiffReason || "-"
                            }}</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>

                        <tr class="fin-row-highlight">
                          <td class="fin-td-label fin-td-label--warn">
                            * Remark Reasons From PUR *
                          </td>
                          <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                            <span class="fin-static">{{
                              vq.remark || "-"
                            }}</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>

                        <tr class="fin-row-highlight">
                          <td class="fin-td-label">Cost Saving</td>
                          <td v-for="(vq, vi) in currentVendorQuotes" :key="vi">
                            <span class="fin-static">{{
                              vq.costSavingReason || "-"
                            }}</span>
                          </td>
                          <td class="fin-td-blank"></td>
                          <td class="fin-td-blank"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div v-else class="fin-empty">
                    ยังไม่มี Vendor Quote สำหรับ Item นี้
                  </div>
                </div>
                <!-- /fin-print-area -->

                <!-- Item navigator -->
                <div class="fin-item-nav">
                  <button
                    class="fin-nav-btn"
                    :disabled="activeItemIndex === 0"
                    @click="prevItem"
                  >
                    <i class="pi pi-chevron-left"></i>
                  </button>
                  <span class="fin-nav-label"
                    >Item {{ activeItemIndex + 1 }} /
                    {{ doc.items.length }}</span
                  >
                  <button
                    class="fin-nav-btn"
                    :disabled="activeItemIndex === doc.items.length - 1"
                    @click="nextItem"
                  >
                    <i class="pi pi-chevron-right"></i>
                  </button>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="fin-footer">
              <span class="fin-role-badge">✅ Finish</span>
              <div class="fin-footer-actions">
                <button class="fin-btn fin-btn--ghost" @click="closeDrawer">
                  Cancel
                </button>
                <button
                  class="fin-btn fin-btn--secondary"
                  :disabled="isExportingPdf"
                  @click="openPdfPreview"
                >
                  <i
                    :class="
                      isExportingPdf
                        ? 'pi pi-spin pi-spinner'
                        : 'pi pi-file-pdf'
                    "
                  ></i>
                  {{ isExportingPdf ? "กำลังสร้างไฟล์..." : "Export to PDF" }}
                </button>
                <button
                  class="fin-btn fin-btn--primary"
                  :disabled="isExportingExcel"
                  @click="exportExcel"
                >
                  <i
                    :class="
                      isExportingExcel
                        ? 'pi pi-spin pi-spinner'
                        : 'pi pi-file-excel'
                    "
                  ></i>
                  {{
                    isExportingExcel ? "กำลังสร้างไฟล์..." : "Export to Excel"
                  }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ PDF PREVIEW / CUSTOMIZE MODAL ══════════════════════════ -->
<Teleport to="body">
  <Transition name="pdfprev-fade">
    <div v-if="showPdfPreview" class="pdfprev-overlay" @click.self="closePdfPreview">
      <div class="pdfprev-panel" role="dialog" aria-modal="true">
        <div class="pdfprev-header">
          <h3 class="pdfprev-title">ตัวอย่างก่อนดาวน์โหลด PDF</h3>
          <button class="pdfprev-close" @click="closePdfPreview">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="pdfprev-body">
          <div class="pdfprev-options">
            <label class="pdfprev-field">
              <span>ขนาดกระดาษ</span>
              <select v-model="pdfOptions.paperSize" @change="refreshPreview">
                <option value="a4">A4</option>
                <option value="a3">A3 (ใหญ่กว่า)</option>
              </select>
            </label>
            <label class="pdfprev-field">
              <span>แนวกระดาษ</span>
              <select v-model="pdfOptions.orientation" @change="refreshPreview">
                <option value="landscape">แนวนอน</option>
                <option value="portrait">แนวตั้ง</option>
              </select>
            </label>
            <label class="pdfprev-field">
              <span>ขนาดฟอนต์</span>
              <select v-model.number="pdfOptions.fontSize" @change="refreshPreview">
                <option :value="7">เล็ก</option>
                <option :value="9">ปกติ</option>
                <option :value="11">ใหญ่</option>
              </select>
            </label>
          </div>

          <div class="pdfprev-preview">
            <div v-if="isGeneratingPreview" class="pdfprev-loading">
              <i class="pi pi-spin pi-spinner"></i> กำลังสร้างตัวอย่าง...
            </div>
            <iframe
              v-show="!isGeneratingPreview && pdfPreviewUrl"
              :src="pdfPreviewUrl"
              class="pdfprev-iframe"
            ></iframe>
          </div>
        </div>

        <div class="pdfprev-footer">
          <button class="fin-btn fin-btn--ghost" @click="closePdfPreview">ยกเลิก</button>
          <button
            class="fin-btn fin-btn--primary"
            :disabled="isExportingPdf"
            @click="confirmExportPdf"
          >
            <i :class="isExportingPdf ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
            {{ isExportingPdf ? "กำลังดาวน์โหลด..." : "ดาวน์โหลด PDF" }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap");

.fin-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
}
.fin-fade-enter-active { transition: opacity 0.25s ease; }
.fin-fade-leave-active { transition: opacity 0.28s ease; }
.fin-fade-enter-from,
.fin-fade-leave-to { opacity: 0; }
.fin-slide-enter-active { animation: finSlideIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both; }
.fin-slide-leave-active { animation: finSlideOut 0.28s cubic-bezier(0.4, 0, 1, 1) both; }
@keyframes finSlideIn {
  from { transform: translateX(100%); opacity: 0.6; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes finSlideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

.fin-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--bg-base) 84%, var(--orb-1) 16%);
  border-left: 1px solid var(--border-subtle);
  box-shadow: -24px 0 80px rgba(0, 0, 0, 0.45);
  font-family: "DM Sans", sans-serif;
  overflow: hidden;
}

.fin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
}
.fin-header-left { display: flex; align-items: center; gap: 12px; }
.fin-badge {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--accept-bg);
  border: 1px solid var(--accept-border);
  color: var(--accept);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Sora", sans-serif;
  font-size: 11px;
  font-weight: 700;
}
.fin-title {
  font-family: "Sora", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px;
}
.fin-sub { font-size: 11.5px; color: var(--text-muted); }
.fin-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.fin-close:hover {
  background: var(--resent-bg);
  color: var(--resent);
  border-color: var(--resent-border);
}

.fin-pipeline {
  padding: 14px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
  overflow-x: auto;
}
.fin-pipeline-track { display: flex; align-items: center; min-width: max-content; }
.fin-step { display: flex; flex-direction: column; align-items: center; gap: 5px; min-width: 76px; }
.fin-node {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.fin-step-label { font-size: 9.5px; font-weight: 500; text-align: center; line-height: 1.3; white-space: pre-line; }
.fin-num { font-size: 11px; font-weight: 700; }
.fin-step--done .fin-node {
  background: var(--accept-bg);
  border: 1.5px solid var(--accept-border);
  color: var(--accept);
}
.fin-step--done .fin-step-label { color: var(--accept); }
.fin-arrow {
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  color: var(--border-subtle);
  min-width: 18px;
  justify-content: center;
}
.fin-arrow--done { color: var(--accept-border); }

.fin-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px; }
.fin-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-muted);
}
.fin-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

/* ── หัวรายงาน: โลโก้ + meta ── */
.fin-print-area {
  background: #ffffff;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
}
.fin-report-head {
  display: flex;
  gap: 24px;
  align-items: stretch;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 2px solid #2b579a;
}
.fin-logo-block {
  flex-shrink: 0;
  width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.fin-logo {
  width: 100%;
  height: 84px;

  display: flex;
  align-items: center;
  justify-content: center;


}
.fin-meta-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.fin-meta-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}
.fin-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
  padding: 6px 10px;
  background: #f3f5f8;
  border-radius: 6px;
}
.fin-meta-row span { color: #5a6472; }
.fin-meta-row strong { color: #14181f; font-weight: 600; text-align: right; }

/* ── ตาราง ── */
.fin-table-wrap {
  overflow-x: auto;
  border: 1px solid #d7dde5;
  border-radius: 10px;
}
.fin-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.fin-table th,
.fin-table td {
  padding: 8px 12px;
  border: 1px solid #d7dde5;
  text-align: left;
  vertical-align: middle;
  line-height: 1.45;
}
.fin-table tbody tr:hover td {
  background: #eef4fb;
}
.fin-th-detail {
  background: #eef1f5;
  font-weight: 700;
  color: #3a4553;
  width: 190px;
}
.fin-th-vendor {
  background: #eef1f5;
  color: #3a4553;
  font-weight: 700;
  text-align: center;
  min-width: 150px;
}
.fin-th-compared {
  background: #fde8e8;
  color: #b42318;
  font-weight: 700;
  text-align: center;
}
.fin-compared-note {
  display: block;
  font-size: 10px;
  font-weight: 600;
  margin-top: 2px;
}
.fin-th-compared-sub {
  background: #fbeaea;
  color: #b42318;
  font-weight: 700;
  text-align: center;
  min-width: 110px;
}
.fin-td-label {
  background: #f3f5f8;
  font-weight: 600;
  color: #3a4553;
}
.fin-td-label--warn { color: #b42318; }
.fin-static { color: #14181f; }
.fin-td-num { text-align: right; font-variant-numeric: tabular-nums; }
.fin-td-center { text-align: center; }
.fin-td-blank { background: #fafbfc; }
.fin-td-compared {
  background: #fdf3f3;
  font-weight: 700;
  color: #b42318;
}
.fin-file-link {
  color: #2b579a;
  font-size: 12px;
  text-decoration: underline;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.fin-item-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 14px 0 4px;
}
.fin-nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
}
.fin-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.fin-nav-label { font-size: 12.5px; font-weight: 600; color: var(--text-primary); }

.fin-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
}
.fin-role-badge {
  font-size: 11.5px;
  font-weight: 600;
  background: var(--accept-bg);
  border: 1px solid var(--accept-border);
  color: var(--accept);
  padding: 3px 10px;
  border-radius: 6px;
}
.fin-footer-actions { display: flex; gap: 8px; }
.fin-btn {
  padding: 9px 18px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fin-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.fin-btn--ghost {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
.fin-btn--ghost:hover { background: var(--bg-elevated); }
.fin-btn--secondary {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
.fin-btn--secondary:not(:disabled):hover {
  background: var(--accent-dim);
  border-color: var(--accent-glow);
  color: var(--accent);
}
.fin-btn--primary {
  font-family: "Sora", sans-serif;
  font-weight: 700;
  border: none;
  color: var(--text-primary-help);
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
}
.fin-btn--primary:not(:disabled):hover { transform: translateY(-1px); }

/* ══ PDF Preview Modal ══ */
.pdfprev-fade-enter-active { transition: opacity 0.2s ease; }
.pdfprev-fade-leave-active { transition: opacity 0.18s ease; }
.pdfprev-fade-enter-from,
.pdfprev-fade-leave-to { opacity: 0; }

.pdfprev-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.pdfprev-panel {
  width: 100%;
  max-width: 920px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  font-family: "DM Sans", sans-serif;
  overflow: hidden;
}
.pdfprev-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle);
}
.pdfprev-title {
  font-family: "Sora", sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.pdfprev-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;  
  justify-content: center;
  
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
}
.pdfprev-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pdfprev-options {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px;
  padding: 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}
.pdfprev-iframe {
  width: 100%;
  height: 560px;
  border: none;
}
.pdfprev-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11.5px;
  color: var(--text-muted);
  font-weight: 600;
}
.pdfprev-field input,
.pdfprev-field select {
  padding: 7px 10px;
  border-radius: 7px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 12.5px;
  font-family: "DM Sans", sans-serif;
  min-width: 140px;
}
.pdfprev-refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: "DM Sans", sans-serif;
}
.pdfprev-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.pdfprev-preview {
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: #525659;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
}
.pdfprev-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
  font-size: 13px;
}
.pdfprev-img {
  max-width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border-radius: 4px;
}

.pdfprev-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
}
</style>

