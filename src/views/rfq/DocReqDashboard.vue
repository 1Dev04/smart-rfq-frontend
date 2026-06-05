<script setup>
import { ref, computed, watch } from "vue";
import AppLayout      from "../../layouts/AppLayout.vue";
import RfqFilterBar   from "../../components/rfq/RfqFilterBar.vue";
import RfqTable       from "../../components/rfq/RfqTable.vue";
import RfqPagination  from "../../components/rfq/RfqPagination.vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const lang = computed({
  get: () => locale.value,
  set: (value) => {
    locale.value = value;
    localStorage.setItem("lang", value);
    document.documentElement.lang = value;
  },
});

const allRows = ref([
  { id:1,  rfqNo:"RFQ-yymmxxx", type:"Project Revenue (I/O)",          list:"AAAAAAAAAAAA",    qty:1,  uom:"(ea, pc)",    status:"Accept", requester:"user.a@itg.co.th", purchaser:"PurchaseA@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:1  },
  { id:2,  rfqNo:"RFQ-yymmxxx", type:"LPG 5Years&Yearly Insp",         list:"BBBBBBBBBB",     qty:3,  uom:"(set)",        status:"Waiting", requester:"user.b@itg.co.th", purchaser:"PurchaseB@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:2  },
  { id:3,  rfqNo:"RFQ-yymmxxx", type:"Calibration Gas Detector",       list:"CCCCCCCCCCCCCCC", qty:2,  uom:"(kg, ton)",    status:"Resent",  requester:"user.c@itg.co.th", purchaser:"PurchaseC@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:5  },
  { id:4,  rfqNo:"RFQ-yymmxxx", type:"Project Expense (I/O)",          list:"DDDDDDD",        qty:2,  uom:"(liter, m3)",  status:"Cancel",  requester:"user.d@itg.co.th", purchaser:"PurchaseD@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:8  },
  { id:5,  rfqNo:"RFQ-yymmxxx", type:"Gas",                            list:"FFFFFFFFFFF",    qty:5,  uom:"(liter, m3)",  status:"Accept", requester:"user.e@itg.co.th", purchaser:"PurchaseE@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:9  },
  { id:6,  rfqNo:"RFQ-yymmxxx", type:"Fix Asset Gas Cylinder",         list:"HHHHHHHHHHHHHH",  qty:8,  uom:"(liter, m3)",  status:"Waiting", requester:"user.f@itg.co.th", purchaser:"PurchaseF@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:10 },
  { id:7,  rfqNo:"RFQ-yymmxxx", type:"Expense",                        list:"IIIIIIIIIIIIIIII", qty:10, uom:"(liter, m3)",  status:"Resent",  requester:"user.g@itg.co.th", purchaser:"PurchaseG@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:6  },
  { id:8,  rfqNo:"RFQ-yymmxxx", type:"Spare parts & Equipment For Gas",list:"JJJJJJ",          qty:6,  uom:"(liter, m3)",  status:"Cancel",  requester:"user.h@itg.co.th", purchaser:"PurchaseH@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:8  },
  { id:9,  rfqNo:"RFQ-yymmxxx", type:"Fix Asset",                      list:"KKKKKKKKKKKKK",   qty:8,  uom:"(ea, pc)",     status:"Accept", requester:"user.i@itg.co.th", purchaser:"PurchaseI@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:11 },
  { id:10, rfqNo:"RFQ-yymmxxx", type:"Fix Asset Gas Nitogen",          list:"LLLLLLLLLLL",     qty:9,  uom:"(set)",        status:"Accept", requester:"user.j@itg.co.th", purchaser:"PurchaseJ@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:20 },
  { id:11, rfqNo:"RFQ-yymmxxx", type:"Instrument & Tools",             list:"MMMMMMMMMM",      qty:4,  uom:"(ea, pc)",     status:"Accept", requester:"user.k@itg.co.th", purchaser:"PurchaseK@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:3  },
  { id:12, rfqNo:"RFQ-yymmxxx", type:"Chemical",                       list:"NNNNNNNNNN",      qty:7,  uom:"(liter, m3)",  status:"Waiting", requester:"user.l@itg.co.th", purchaser:"PurchaseL@itg.co.th", created:"dd/mm/yy\ndatetime", updated:"dd/mm/yy\ndatetime", lt:14 },
]);


const filters = ref({
  rfqNo: "",
  type: "",
  list: "",
  status: "",
  contactUser: "",
});


const currentPage = ref(1);
const pageSize    = ref(10);


const filteredRows = computed(() =>
  allRows.value.filter((r) => {
    const f = filters.value;
    return (
      (!f.rfqNo       || r.rfqNo.toLowerCase().includes(f.rfqNo.toLowerCase())) &&
      (!f.type        || r.type.toLowerCase().includes(f.type.toLowerCase())) &&
      (!f.list        || r.list.toLowerCase().includes(f.list.toLowerCase())) &&
      (!f.status      || r.status === f.status) &&
      (!f.contactUser || r.requester.toLowerCase().includes(f.contactUser.toLowerCase()))
    );
  })
);

const totalPages = computed(() =>
  Math.ceil(filteredRows.value.length / pageSize.value) || 1
);

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows.value
    .slice(start, start + pageSize.value)
    .map((row, i) => ({ ...row, displayNo: start + i + 1 }));
});


watch([filteredRows, pageSize], () => { currentPage.value = 1; });
</script>

<template>
  <AppLayout
    :title="t('doc-req-dashboard.title')"
    role="User"
    email="user.a@itg.co.th"
  >
    
    <RfqFilterBar
      v-model:filters="filters"
      @search="currentPage = 1"
      @clear="currentPage = 1"
    />

   
    <RfqTable :rows="pagedRows" />

  
    <RfqPagination
      v-model:page="currentPage"
      v-model:pageSize="pageSize"
      :total="filteredRows.length"
    />
  </AppLayout>
</template>