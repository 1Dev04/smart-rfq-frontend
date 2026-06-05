import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRFQDrawerStore = defineStore('rfqDrawer', () => {
  const showDrawer = ref(false)
  const drawerRole = ref('user') 

  function openDrawer(role = 'user') {
    drawerRole.value = role
    showDrawer.value = true
  }

  function closeDrawer() {
    showDrawer.value = false
  }

  return { showDrawer, drawerRole, openDrawer, closeDrawer }
})