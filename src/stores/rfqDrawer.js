import { defineStore } from "pinia";
import { ref } from "vue";

export const useRFQDrawerStore = defineStore("rfqDrawer", () => {
  const showDrawer = ref(false);
  const drawerRole = ref("user");
  const category   = ref(null);
  const rfqNo      = ref("");
  const revNo      = ref("Rev.00");

  function openDrawer(role = "user", rfq = null) { 
    drawerRole.value = role;
    rfqNo.value      = rfq?.rfqNo ?? "";
    revNo.value      = rfq?.revNo ?? "Rev.00";
    showDrawer.value = true;
  }

  function closeDrawer() {
    showDrawer.value = false;
    rfqNo.value      = "";
    revNo.value      = "Rev.00";
  }

  return { showDrawer, drawerRole, category, rfqNo, revNo, openDrawer, closeDrawer };
});