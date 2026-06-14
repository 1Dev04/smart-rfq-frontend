import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useRFQDrawerStore = defineStore('rfqDrawer', () => {
  const showDrawer = ref(false)
  const drawerRole = ref('user')
  const category   = ref(null)

function openDrawer(role = 'user', selectedCategory = null) {
    drawerRole.value = role
    category.value   = selectedCategory
    showDrawer.value = true
  }

  function closeDrawer() {
    showDrawer.value = false
    drawerRole.value = 'user'
    category.value   = null
  }

  return { showDrawer, drawerRole, category, openDrawer, closeDrawer }
})