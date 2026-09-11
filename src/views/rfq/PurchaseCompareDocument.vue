<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useToast } from "primevue/usetoast";
import { useRFQDrawerStore } from "../../stores/rfqDrawer";
import { apiFetch } from "../../utils/api";

const drawer = useRFQDrawerStore();
const toast = useToast();
const BASE = `${import.meta.env.VITE_API_URL}`;

const isLoading = ref(false);
const isSaving = ref(false);
const isFinishing = ref(false);
const doc = ref(null);
const activeItemIndex = ref(0);
const showFinishConfirm = ref(false);
const aiLoading = ref({});
const hintLoading = ref(false);
const hintResult = ref(null);

const allSteps = [
  { id: "user_pending", label: "User\nPending" },
  { id: "purchase_accept", label: "Purchase\nAccept" },
  { id: "waiting_quotation", label: "Waiting\nQuotation" },
  { id: "purchase_compare", label: "Purchase\nCompare" },
  { id: "user_confirm", label: "User\nConfirm" },
  { id: "cost_saving", label: "Cost\nSaving" },
  { id: "purchase_confirm", label: "Purchase\nConfirm" },
  { id: "finish", label: "Finish" },
];

function stepStatus(stepId) {
  if (!doc.value) return "pending";
  const order = allSteps.map((s) => s.id);

  const rawStatus = (doc.value.status ?? doc.value.Status ?? "")
    .toString()
    .trim()
    .toLowerCase();
  const cur = order.indexOf(rawStatus);
  const idx = order.indexOf(stepId);
  if (cur === -1) return "pending";
  if (idx < cur) return "done";
  if (idx === cur) return "active";
  return "pending";
}

const DETAIL_FIELDS = [
  { key: "itemDescription", label: "Item description" },
  { key: "specPartNo", label: "Specification / Part no." },
  { key: "model", label: "Model" },
];

async function fetchDetail() {
  if (!drawer.docRequestId) return;
  isLoading.value = true;
  try {
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    data.items = data.items.map((it) => ({
      ...it,
      vendorQuotes: it.vendorQuotes?.length
        ? it.vendorQuotes.map((v) => ({
            ...emptyVendorQuote(),
            ...v,
            newFile: null,
          }))
        : [emptyVendorQuote(), emptyVendorQuote(), emptyVendorQuote()],
    }));

    doc.value = data;
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

function emptyVendorQuote() {
  return {
    id: null,
    vendorName: "",
    itemDescription: "",
    specPartNo: "",
    model: "",
    buyerEmail: "",
    remark: "",
    price: null,
    discount: null,
    quotationFilePath: null,
    isRecommended: false,
    newFile: null,
  };
}

watch(
  () => [drawer.docRequestId, drawer.showDrawer, drawer.drawerRole],
  async ([id, show, role]) => {
    await nextTick();
    if (id && show && role === "compare") {
      doc.value = null;
      await fetchDetail();
    }
  },
  { immediate: true },
);

const currentItem = computed(
  () => doc.value?.items?.[activeItemIndex.value] ?? null,
);

function prevItem() {
  if (activeItemIndex.value > 0) activeItemIndex.value--;
}
function nextItem() {
  if (doc.value && activeItemIndex.value < doc.value.items.length - 1)
    activeItemIndex.value++;
}

// FIX: renamed to match template"
function setRecommendedQuote(vqIndex) {
  currentItem.value.vendorQuotes.forEach((vq, i) => {
    vq.isRecommended = i === vqIndex;
  });
}

// FIX: now receives the index (vi) instead of the vq object, and writes
// into currentItem.vendorQuotes[vqIndex] correctly
function onQuotationFileChange(event, vqIndex) {
  const file = event.target.files[0] ?? null;
  currentItem.value.vendorQuotes[vqIndex].newFile = file;
}

async function saveCurrentItem() {
  if (!currentItem.value) return;

  // FIX: ป้องกัน vendor ที่กด Recommended ไว้แต่ยังไม่กรอกชื่อ —
  const recommendedVq = currentItem.value.vendorQuotes.find(
    (vq) => vq.isRecommended,
  );
  if (recommendedVq && !recommendedVq.vendorName?.trim()) {
    toast.add({
      severity: "warn",
      summary: "ข้อมูลไม่ครบ",
      detail: "Vendor ที่เลือก Recommended ต้องกรอกชื่อ Vendor ก่อน",
      life: 3500,
    });
    return false;
  }

  const filled = currentItem.value.vendorQuotes.filter((vq) =>
    vq.vendorName?.trim(),
  );
  if (!filled.length) {
    toast.add({
      severity: "warn",
      summary: "กรุณากรอก Vendor",
      detail: "ต้องมีอย่างน้อย 1 Vendor พร้อมชื่อ",
      life: 3500,
    });
    return false;
  }

  isSaving.value = true;
  try {
    const formData = new FormData();
    filled.forEach((vq, i) => {
      if (vq.id) formData.append(`[${i}].Id`, vq.id);
      formData.append(`[${i}].VendorName`, vq.vendorName ?? "");
      formData.append(`[${i}].ItemDescription`, vq.itemDescription ?? "");
      formData.append(`[${i}].SpecPartNo`, vq.specPartNo ?? "");
      formData.append(`[${i}].Model`, vq.model ?? "");
      formData.append(`[${i}].BuyerEmail`, vq.buyerEmail ?? "");
      formData.append(`[${i}].Remark`, vq.remark ?? "");
      if (vq.price != null && vq.price !== "")
        formData.append(`[${i}].Price`, vq.price);
      if (vq.discount != null && vq.discount !== "")
        formData.append(`[${i}].Discount`, vq.discount);
      formData.append(
        `[${i}].IsRecommended`,
        vq.isRecommended ? "true" : "false",
      );
      if (vq.newFile) formData.append(`[${i}].QuotationFile`, vq.newFile);
    });

    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/items/${currentItem.value.id}/vendor-quotes`,
      { method: "PUT", body: formData },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }
    toast.add({
      severity: "success",
      summary: "บันทึกแล้ว",
      detail: `Item ${activeItemIndex.value + 1} บันทึก Vendor Quotes สำเร็จ`,
      life: 2500,
    });
    return true; 
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "บันทึกไม่สำเร็จ",
      detail: err.message,
      life: 4500,
    });
    return false;
  } finally {
    isSaving.value = false;
  }
}


async function requestFinish() {
  if (!doc.value?.items?.length) return;

  isFinishing.value = true;
  const originalIndex = activeItemIndex.value;

  try {

    for (let i = 0; i < doc.value.items.length; i++) {
      activeItemIndex.value = i;
      await nextTick();

      const ok = await saveCurrentItem();
      if (!ok) {
        activeItemIndex.value = i;
        return;
      }
    }

    await fetchDetail();

    const missingItems = doc.value.items.filter(
      (it) => !it.vendorQuotes.some((vq) => vq.isRecommended),
    );
    if (missingItems.length) {
      toast.add({
        severity: "warn",
        summary: "ยังไม่ครบ",
        detail: `กรุณาเลือก Recommended ให้ครบทุก Item (ขาด ${missingItems.length} Item)`,
        life: 4000,
      });
      return;
    }

    showFinishConfirm.value = true;
  } finally {
    isFinishing.value = false;
    if (!showFinishConfirm.value) activeItemIndex.value = originalIndex;
  }
}

async function confirmFinish() {
  isFinishing.value = true;
  try {
    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/finish-compare`,
      { method: "POST" },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }
    toast.add({
      severity: "success",
      summary: "Compare เสร็จสิ้น",
      detail: "ส่งต่อให้ User Confirm แล้ว",
      life: 4000,
    });
    showFinishConfirm.value = false;
    await fetchDetail();
    closeDrawer();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Finish ไม่สำเร็จ",
      detail: err.message,
      life: 4500,
    });
  } finally {
    isFinishing.value = false;
  }
}

// AI Extract
async function askAi(vqIndex) {
  if (!currentItem.value) return;
  const vq = currentItem.value.vendorQuotes[vqIndex];

  const hasNewFile = !!vq?.newFile;
  const hasSavedFile = !!vq?.quotationFilePath;

  if (!hasNewFile && !hasSavedFile) {
    toast.add({
      severity: "warn",
      summary: "กรุณาแนบไฟล์ก่อน",
      detail: "เลือกไฟล์ PDF ใบเสนอราคาก่อนกด Ask AI",
      life: 3000,
    });
    return;
  }

  if (hasNewFile && vq.newFile?.type !== "application/pdf") {
    toast.add({
      severity: "warn",
      summary: "รองรับเฉพาะ PDF",
      detail: "AI Extract อ่านได้เฉพาะไฟล์ .pdf",
      life: 3000,
    });
    return;
  }

  aiLoading.value = { ...aiLoading.value, [vqIndex]: true };
  try {
    const formData = new FormData();

    if (hasNewFile) {
      formData.append("quotationFile", vq.newFile);
    } else {
      formData.append("existingQuotationFilePath", vq.quotationFilePath);
    }

    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/items/${currentItem.value.id}/vendor-quotes/ai-extract`,
      { method: "POST", body: formData },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }

    const result = await res.json();

    if (result.vendorName && !vq.vendorName) vq.vendorName = result.vendorName;
    if (result.itemDescription) vq.itemDescription = result.itemDescription;
    if (result.specPartNo) vq.specPartNo = result.specPartNo;
    if (result.model) vq.model = result.model;
    if (result.price != null) vq.price = result.price;
    if (result.remark) vq.remark = result.remark;

    toast.add({
      severity: "success",
      summary: "AI กรอกข้อมูลให้แล้ว",
      detail: "กรุณาตรวจสอบความถูกต้องก่อนกด Save Item",
      life: 4000,
    });
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "AI Extract ไม่สำเร็จ",
      detail: err.message,
      life: 5000,
    });
  } finally {
    aiLoading.value = { ...aiLoading.value, [vqIndex]: false };
  }
}

// Hint / summary AI (uses vendor files or existing paths)
async function askAiHint() {
  if (!currentItem.value) return;
  hintLoading.value = true;
  try {
    const formData = new FormData();
    currentItem.value.vendorQuotes.forEach((vq, i) => {
      if (vq?.newFile) formData.append(`vendors[${i}].File`, vq.newFile);
      if (vq?.quotationFilePath)
        formData.append(`vendors[${i}].ExistingFilePath`, vq.quotationFilePath);
      if (vq?.vendorName)
        formData.append(`vendors[${i}].VendorName`, vq.vendorName);
    });

    const res = await apiFetch(
      `${BASE}/api/doc-request/${drawer.docRequestId}/items/${currentItem.value.id}/vendor-quotes/ai-hint`,
      { method: "POST", body: formData },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }

    hintResult.value = await res.json();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "AI Hint ไม่สำเร็จ",
      detail: err.message,
      life: 5000,
    });
    hintResult.value = null;
  } finally {
    hintLoading.value = false;
  }
}

function closeDrawer() {
  drawer.showDrawer = false;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pc-fade">
      <div
        v-if="drawer.showDrawer && drawer.drawerRole === 'compare'"
        class="pc-overlay"
        @click.self="closeDrawer"
      >
        <Transition name="pc-slide" appear>
          <div class="pc-panel" role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="pc-header">
              <div class="pc-header-left">
                <div class="pc-badge">RFQ</div>
                <div>
                  <h2 class="pc-title">Purchase Compare</h2>
                  <span class="pc-sub">
                    {{ doc?.rfqNo }} · {{ doc?.revNo }} ·
                    {{ doc?.items?.length ?? 0 }} Items
                  </span>
                </div>
              </div>
              <button class="pc-close" @click="closeDrawer">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Pipeline -->
            <div class="pc-pipeline">
              <div class="pc-pipeline-track">
                <template v-for="(step, i) in allSteps" :key="step.id">
                  <div
                    class="pc-step"
                    :class="`pc-step--${stepStatus(step.id)}`"
                  >
                    <div class="pc-node">
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
                      <span
                        v-else-if="stepStatus(step.id) === 'active'"
                        class="pc-pulse"
                      />
                      <span v-else class="pc-num">{{ i + 1 }}</span>
                    </div>
                    <span class="pc-step-label">{{ step.label }}</span>
                  </div>
                  <div
                    v-if="i < allSteps.length - 1"
                    class="pc-arrow"
                    :class="{
                      'pc-arrow--done': stepStatus(step.id) === 'done',
                    }"
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

            <div class="pc-body">
              <div v-if="isLoading" class="pc-loading">
                <i class="pi pi-spin pi-spinner"></i> กำลังโหลด...
              </div>

              <template v-else-if="doc && currentItem">
                <!-- Document meta -->
                <div class="pc-meta-grid">
                  <div class="pc-meta-cell">
                    <span>RFQ No.</span><strong>{{ doc.rfqNo }}</strong>
                  </div>
                  <div class="pc-meta-cell">
                    <span>Req Date</span><strong>{{ doc.createdAt }}</strong>
                  </div>
                  <div class="pc-meta-cell">
                    <span>Target PUR Reply</span
                    ><strong>{{ currentItem.targetPURreply ?? "-" }}</strong>
                  </div>
                  <div class="pc-meta-cell">
                    <span>Actual Date PUR Replied</span
                    ><strong>{{ doc.actualPurReplyDate ?? "-" }}</strong>
                  </div>
                  <div class="pc-meta-cell">
                    <span>Project Name</span
                    ><strong>{{ currentItem.projectName || "-" }}</strong>
                  </div>
                  <div class="pc-meta-cell">
                    <span>GL Code</span
                    ><strong>{{ currentItem.glCode || "-" }}</strong>
                  </div>
                  <div class="pc-meta-cell">
                    <span>SAP Item No.</span
                    ><strong>{{ currentItem.sapItem || "-" }}</strong>
                  </div>
                  <div class="pc-meta-cell">
                    <span>User / Engineer / Sale</span
                    ><strong>{{ doc.requesterEmail }}</strong>
                  </div>
                </div>

                <!-- Compare table -->
                <div class="pc-table-wrap">
                  <table class="pc-table">
                    <!--
                      FIX: previous thead nested <th> inside <div> inside <th>
                      (invalid HTML) which desynced column count from tbody
                      and broke every border line. Now: one Detail header +
                      one <th> per vendor, matching tbody column count exactly.
                    -->
                    <thead>
                      <tr>
                        <th class="pc-th-detail">Detail</th>
                        <th
                          v-for="(vq, vi) in currentItem.vendorQuotes"
                          :key="vi"
                          class="pc-th-vendor"
                        >
                          Vendor {{ vi + 1 }}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <!--
                        FIX: Item description / Spec / Model / Buyer / Remark
                        are now independent PER VENDOR COLUMN — each <input>
                        is v-modeled to vq[f.key] / vq.buyerEmail / vq.remark
                        (that vendor quote's own copy), so typing in one
                        column no longer overwrites the others. Empty value
                        shows as a blank input, not "-".
                      -->
                      <tr v-for="f in DETAIL_FIELDS" :key="f.key">
                        <td class="pc-td-label">{{ f.label }}</td>
                        <td
                          v-for="(vq, vi) in currentItem.vendorQuotes"
                          :key="vi"
                        >
                          <input
                            v-model="vq[f.key]"
                            type="text"
                            class="pc-input"
                            placeholder=""
                          />
                        </td>
                      </tr>

                      <!-- Buyer -->
                      <tr>
                        <td class="pc-td-label">Buyer / Purchaser</td>
                        <td
                          v-for="(vq, vi) in currentItem.vendorQuotes"
                          :key="vi"
                        >
                          <input
                            v-model="vq.buyerEmail"
                            type="text"
                            class="pc-input"
                            placeholder=""
                          />
                        </td>
                      </tr>

                      <!-- Remark Reasons From PUR (present in wireframe, was missing before) -->
                      <tr>
                        <td class="pc-td-label pc-td-label--warn">
                          Remark Reasons From PUR
                        </td>
                        <td
                          v-for="(vq, vi) in currentItem.vendorQuotes"
                          :key="vi"
                        >
                          <input
                            v-model="vq.remark"
                            type="text"
                            class="pc-input"
                            placeholder=""
                          />
                        </td>
                      </tr>

                      <!-- Price (editable) -->
                      <tr class="pc-row-editable">
                        <td class="pc-td-label">Price</td>
                        <td
                          v-for="(vq, vi) in currentItem.vendorQuotes"
                          :key="vi"
                        >
                          <input
                            v-model="vq.price"
                            type="number"
                            step="0.01"
                            class="pc-input"
                            placeholder="0.00"
                          />
                        </td>
                      </tr>

                      <!-- Quotation Files (editable) -->
                      <tr class="pc-row-editable">
                        <td class="pc-td-label">Quotation Files</td>
                        <td
                          v-for="(vq, vi) in currentItem.vendorQuotes"
                          :key="vi"
                        >
                          <div class="pc-file-cell">
                            <a
                              v-if="vq.quotationFilePath && !vq.newFile"
                              :href="vq.quotationFilePath"
                              target="_blank"
                              class="pc-file-link"
                            >
                              <i class="pi pi-file-pdf"></i> ดูไฟล์เดิม
                            </a>

                            <div class="pc-file-row">
                              <label class="pc-file-upload-btn">
                                <i class="pi pi-upload"></i>
                                {{
                                  vq.newFile ? vq.newFile.name : "แนบไฟล์ใหม่"
                                }}
                                <input
                                  type="file"
                                  class="pc-file-hidden"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  @change="onQuotationFileChange($event, vi)"
                                />
                              </label>

                              <button
                                class="pc-ai-btn"
                                :disabled="
                                  (!vq.newFile && !vq.quotationFilePath) ||
                                  aiLoading[vi]
                                "
                                :title="
                                  !vq.newFile && !vq.quotationFilePath
                                    ? 'แนบไฟล์ PDF ก่อน'
                                    : 'ให้ AI อ่านและกรอกข้อมูลให้'
                                "
                                @click="askAi(vi)"
                              >
                                <i
                                  :class="
                                    aiLoading[vi]
                                      ? 'pi pi-spin pi-spinner'
                                      : 'pi pi-sparkles'
                                  "
                                ></i>
                                {{
                                  aiLoading[vi] ? "กำลังวิเคราะห์..." : "Ask AI"
                                }}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      <!-- Purchase Compare / Recommended (editable) -->
                      <tr class="pc-row-editable pc-row-recommend">
                        <td class="pc-td-label">Purchase Compare</td>
                        <td
                          v-for="(vq, vi) in currentItem.vendorQuotes"
                          :key="vi"
                        >
                          <button
                            class="pc-recommend-btn"
                            :class="{
                              'pc-recommend-btn--active': vq.isRecommended,
                            }"
                            @click="setRecommendedQuote(vi)"
                          >
                            <i
                              class="pi"
                              :class="
                                vq.isRecommended
                                  ? 'pi-check-circle'
                                  : 'pi-circle'
                              "
                            ></i>
                            Recommended
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="pc-hint-box">
                  <div class="pc-hint-title">Hint Message</div>

                  <button
                    class="pc-ai-btn"
                    :disabled="hintLoading"
                    @click="askAiHint()"
                  >
                    <i
                      :class="
                        hintLoading ? 'pi pi-spin pi-spinner' : 'pi pi-sparkles'
                      "
                    ></i>
                    {{ hintLoading ? "กำลังวิเคราะห์..." : "Ask AI" }}
                  </button>

                  <div v-if="hintResult" class="pc-hint-result">
                    <ul>
                      <li v-for="v in hintResult.vendors" :key="v.vendorIndex">
                        <strong
                          >Vendor {{ v.vendorIndex
                          }}{{
                            v.vendorName ? ` (${v.vendorName})` : ""
                          }}:</strong
                        >
                        <span v-if="v.dataFound">
                          ราคา {{ v.price ?? "-" }} ·
                          {{ v.paymentTerm || "ไม่ระบุเงื่อนไขชำระเงิน" }} ·
                          {{ v.deliveryTerm || "ไม่ระบุเดลิเวอรี" }}
                        </span>
                        <span v-else class="pc-hint-nodata"
                          >ไม่มีข้อมูล / ไม่มีไฟล์แนบ</span
                        >
                      </li>
                    </ul>

                    <p
                      v-if="hintResult.recommendedVendorIndex"
                      class="pc-hint-reco"
                    >
                      🏆 แนะนำ Vendor {{ hintResult.recommendedVendorIndex }} —
                      {{ hintResult.recommendationReason }}
                    </p>
                    <p v-else class="pc-hint-reco pc-hint-reco--none">
                      ยังสรุปแนะนำไม่ได้ —
                      {{
                        hintResult.recommendationReason || "ข้อมูลไม่เพียงพอ"
                      }}
                    </p>

                    <ul
                      v-if="hintResult.warnings?.length"
                      class="pc-hint-warnings"
                    >
                      <li v-for="(w, i) in hintResult.warnings" :key="i">
                        ⚠ {{ w }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Item navigator -->
                <div class="pc-item-nav">
                  <button
                    class="pc-nav-btn"
                    :disabled="activeItemIndex === 0"
                    @click="prevItem"
                  >
                    <i class="pi pi-chevron-left"></i>
                  </button>
                  <span class="pc-nav-label"
                    >Item {{ activeItemIndex + 1 }} /
                    {{ doc.items.length }}</span
                  >
                  <button
                    class="pc-nav-btn"
                    :disabled="activeItemIndex === doc.items.length - 1"
                    @click="nextItem"
                  >
                    <i class="pi pi-chevron-right"></i>
                  </button>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="pc-footer">
              <span class="pc-role-badge">🏢 Purchase Compare</span>
              <div class="pc-footer-actions">
                <button class="pc-btn pc-btn--ghost" @click="closeDrawer">
                  Cancel
                </button>
                <button
                  class="pc-btn pc-btn--secondary"
                  :disabled="isSaving"
                  @click="saveCurrentItem"
                >
                  <i
                    :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"
                  ></i>
                  {{ isSaving ? "กำลังบันทึก..." : "Save Item" }}
                </button>
                <button
                  class="pc-btn pc-btn--primary"
                  :disabled="isFinishing || isSaving"
                  @click="requestFinish"
                >
                  <i
                    :class="
                      isFinishing ? 'pi pi-spin pi-spinner' : 'pi pi-flag'
                    "
                  ></i>
                  {{ isFinishing ? "กำลังตรวจสอบ..." : "Finish" }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Finish Confirm Popup (ตาม remark ในรูป) -->
  <Teleport to="body">
    <Transition name="pc-confirm-fade">
      <div v-if="showFinishConfirm" class="pc-confirm-overlay">
        <div class="pc-confirm-box" role="alertdialog" aria-modal="true">
          <p class="pc-confirm-msg">
            ยืนยันการ Finish Compare? หลังจากนี้จะส่งต่อให้ User Confirm
            ราคาที่เลือกไว้
          </p>
          <div class="pc-confirm-actions">
            <button
              class="pc-btn pc-btn--ghost"
              @click="showFinishConfirm = false"
            >
              Cancel
            </button>
            <button
              class="pc-btn pc-btn--primary"
              :disabled="isFinishing"
              @click="confirmFinish"
            >
              {{ isFinishing ? "กำลังส่ง..." : "Confirm" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap");

.pc-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
}
.pc-fade-enter-active {
  transition: opacity 0.25s ease;
}
.pc-fade-leave-active {
  transition: opacity 0.28s ease;
}
.pc-fade-enter-from,
.pc-fade-leave-to {
  opacity: 0;
}
.pc-slide-enter-active {
  animation: pcSlideIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.pc-slide-leave-active {
  animation: pcSlideOut 0.28s cubic-bezier(0.4, 0, 1, 1) both;
}
@keyframes pcSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0.6;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes pcSlideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.pc-panel {
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

.pc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
}
.pc-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pc-badge {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Sora", sans-serif;
  font-size: 11px;
  font-weight: 700;
}
.pc-title {
  font-family: "Sora", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px;
}
.pc-sub {
  font-size: 11.5px;
  color: var(--text-muted);
}
.pc-close {
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
.pc-close:hover {
  background: var(--resent-bg);
  color: var(--resent);
  border-color: var(--resent-border);
}

.pc-pipeline {
  padding: 14px 24px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
  overflow-x: auto;
}
.pc-pipeline-track {
  display: flex;
  align-items: center;
  min-width: max-content;
}
.pc-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 76px;
}
.pc-node {
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
.pc-step-label {
  font-size: 9.5px;
  font-weight: 500;
  text-align: center;
  line-height: 1.3;
  white-space: pre-line;
}
.pc-num {
  font-size: 11px;
  font-weight: 700;
}
.pc-step--done .pc-node {
  background: var(--accept-bg);
  border: 1.5px solid var(--accept-border);
  color: var(--accept);
}
.pc-step--done .pc-step-label {
  color: var(--accept);
}
.pc-step--active .pc-node {
  background: var(--accent-dim);
  border: 2px solid var(--accent);
  color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-dim);
}
.pc-step--active .pc-step-label {
  color: var(--accent);
  font-weight: 700;
}
.pc-step--pending .pc-node {
  background: var(--bg-elevated);
  border: 1.5px solid var(--border-subtle);
  color: var(--text-muted);
}
.pc-step--pending .pc-step-label {
  color: var(--text-muted);
}
.pc-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pcPulse 1.6s ease-in-out infinite;
}
@keyframes pcPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.7;
  }
}
.pc-arrow {
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  color: var(--border-subtle);
  min-width: 18px;
  justify-content: center;
}
.pc-arrow--done {
  color: var(--accept-border);
}

.pc-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
}
.pc-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.pc-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.pc-meta-cell {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pc-meta-cell span {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pc-meta-cell strong {
  font-size: 12.5px;
  color: var(--text-primary);
  font-weight: 500;
}

/* ===== Table: rebuilt border model =====
   FIX: previously border-right on th/td plus border on inner inputs
   created doubled/misaligned lines, and the broken thead markup desynced
   columns from tbody. Now header + body share the exact same column
   count (Detail + N vendors) and a single collapsed border owns every line. */
.pc-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  margin-bottom: 16px;
}
.pc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.pc-table th,
.pc-table td {
  padding: 8px 12px;
  border: 1px solid var(--border-subtle);
  text-align: left;
  vertical-align: middle;
}
.pc-table tr > *:first-child {
  border-left: none;
}
.pc-table tr > *:last-child {
  border-right: none;
}
.pc-table thead tr > * {
  border-top: none;
}
.pc-table tbody tr:last-child > * {
  border-bottom: none;
}
.pc-th-detail {
  background: var(--bg-elevated);
  font-weight: 700;
  color: var(--text-secondary);
  width: 180px;
}
.pc-th-vendor {
  background: var(--accent-dim);
  color: var(--accent);
  font-weight: 700;
  text-align: center;
  min-width: 180px;
}
.pc-td-label {
  background: var(--bg-elevated);
  font-weight: 600;
  color: var(--text-secondary);
}
.pc-td-label--warn {
  color: var(--resent, #ef4444);
}
.pc-td-static {
  color: var(--text-primary);
}
.pc-row-editable td:not(.pc-td-label) {
  background: color-mix(in srgb, var(--accent-dim) 40%, transparent);
}
.pc-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  padding: 6px 8px;
  font-size: 12.5px;
  box-sizing: border-box;
}
.pc-input:focus {
  outline: none;
  border-color: var(--accent);
}
.pc-file-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pc-file-link {
  color: var(--accent);
  font-size: 11.5px;
  text-decoration: underline;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
}
.pc-file-upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px dashed var(--border-subtle);
  font-size: 11.5px;
  color: var(--text-secondary);
  cursor: pointer;
}
.pc-file-hidden {
  display: none;
}
.pc-recommend-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  justify-content: center;
}
.pc-recommend-btn--active {
  background: var(--accept-bg);
  border-color: var(--accept-border);
  color: var(--accept);
}

.pc-hint-box {
  background: var(--bg-elevated);
  border: 1px dashed var(--border-subtle);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.pc-hint-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 6px;
  text-decoration: underline;
}
.pc-hint-box ul {
  margin: 0;
  padding-left: 18px;
  font-size: 11.5px;
  color: var(--text-muted);
  line-height: 1.6;
}

.pc-item-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px 0;
}
.pc-nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
}
.pc-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.pc-nav-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.pc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-surface);
}
.pc-role-badge {
  font-size: 11.5px;
  font-weight: 600;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  padding: 3px 10px;
  border-radius: 6px;
}
.pc-footer-actions {
  display: flex;
  gap: 8px;
}
.pc-btn {
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
.pc-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pc-btn--ghost {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
.pc-btn--ghost:hover {
  background: var(--bg-elevated);
}
.pc-btn--secondary {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
.pc-btn--secondary:not(:disabled):hover {
  background: var(--accent-dim);
  border-color: var(--accent-glow);
  color: var(--accent);
}
.pc-btn--primary {
  font-family: "Sora", sans-serif;
  font-weight: 700;
  border: none;
  color: var(--text-primary-help);
  background: linear-gradient(135deg, var(--orb-1), var(--accent));
  box-shadow: 0 4px 14px var(--accent-glow);
}
.pc-btn--primary:not(:disabled):hover {
  transform: translateY(-1px);
}

.pc-confirm-fade-enter-active {
  transition: opacity 0.18s ease;
}
.pc-confirm-fade-leave-active {
  transition: opacity 0.16s ease;
}
.pc-confirm-fade-enter-from,
.pc-confirm-fade-leave-to {
  opacity: 0;
}
.pc-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.pc-confirm-box {
  width: 100%;
  max-width: 400px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.pc-confirm-msg {
  font-size: 13.5px;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0 0 18px;
  text-align: center;
}
.pc-confirm-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.pc-file-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pc-ai-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--accent-glow);
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.pc-ai-btn:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
}
.pc-ai-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
