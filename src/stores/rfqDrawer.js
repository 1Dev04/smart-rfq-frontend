import { defineStore } from "pinia";
import { ref } from "vue";

export const useRFQDrawerStore = defineStore("rfqDrawer", () => {
  const showDrawer = ref(false);
  const drawerRole = ref("user");
  const category = ref(null);
  const rfqNo = ref("");
  const revNo = ref("Rev.00");
  const docRequestId = ref(null);
  const docStatus = ref(null);
  const refreshTick = ref(0);

  // ── เพิ่ม status เป็น parameter ที่ 4 ──────────────────────
  function openDrawer(role = "user", rfq = null, id = null, status = null) {
    drawerRole.value = role;
    rfqNo.value = rfq?.rfqNo ?? "";
    revNo.value = rfq?.revNo ?? "Rev.00";
    docRequestId.value = id;
    docStatus.value = status; 
    showDrawer.value = true;
  }

  function closeDrawer() {
    showDrawer.value = false;
    rfqNo.value = "";
    revNo.value = "Rev.00";
    docRequestId.value = null;
    docStatus.value = null;
  }

  function triggerRefresh() {
    refreshTick.value++;
  }

  return {
    showDrawer,
    drawerRole,
    category,
    rfqNo,
    revNo,
    refreshTick,
    docRequestId,
    docStatus,
    openDrawer,
    closeDrawer,
    triggerRefresh,
  };
});