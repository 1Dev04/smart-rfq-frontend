import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRFQDrawerStore = defineStore('rfqDrawer', () => {
  const showDrawer = ref(false)
  const drawerRole = ref('user') 
  const selectedCategory = ref(null)

  function openDrawer(category= null, role = 'user') {
    selectedCategory.value = category
    drawerRole.value = role
    showDrawer.value = true
  }

  function closeDrawer() {
    showDrawer.value = false
    selectedCategory.value = null
  }

  return { showDrawer, drawerRole, selectedCategory, openDrawer, closeDrawer }
})