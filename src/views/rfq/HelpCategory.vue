<script setup>
import { computed, ref } from "vue";
import AppLayout from "../../layouts/AppLayout.vue";
import CategoryCard from "../../components/help/CategoryCard.vue";
import CategoryModal from "../../components/help/CategoryModal.vue";
import { supportedLocales, setLocale } from "../../i18n";
import { useI18n } from "vue-i18n";
import { useThemeStore, themes } from "../../stores/useThemeStore.js";

const theme = useThemeStore();

const { t, locale } = useI18n();
const langOptions = supportedLocales;

const lang = computed({
  get: () => locale.value,
  set: (value) => {
    setLocale(value);
  },
});


const selected = ref(null);

/* ── Category data ── */
const categories = ref([
  {
    id: "project-revenue",
    name: { en: "Project Revenue (I/O)", th: "โครงการรายได้ (I/O)", ja: "プロジェクト収益 (I/O)" },
    codes: [
      {
        code: "PS",
        desc: {
          en: "Project Revenue IO (Engineering, Sale dept.)",
          th: "โครงการวิศวกรรมและฝ่ายขาย",
          ja: "エンジニアリング・営業部門"
        }
      }
    ]
  },
  {
    id: "lpg",
    name: { en: "LPG 5Years & Yearly Insp", th: "LPG ตรวจสอบ 5 ปี/ประจำปี", ja: "LPG 5年・年次検査" },
    codes: [
      {
        code: "PS",
        desc: {
          en: "Project Revenue IO (Engineering, Sale dept.)",
          th: "โครงการวิศวกรรมและฝ่ายขาย",
          ja: "エンジニアリング・営業部門"
        }
      }
    ]
  },
  {
    id: "calibration",
    name: { en: "Calibration Gas Detector", th: "สอบเทียบเครื่องตรวจจับก๊าซ", ja: "ガス検知器校正" },
    codes: [
      {
        code: "SE",
        desc: {
          en: "Service Charge, Rental",
          th: "ค่าบริการและค่าเช่า",
          ja: "サービス料・レンタル"
        }
      }
    ]
  },
  {
    id: "project-expense",
    name: { en: "Project Expense (I/O)", th: "ค่าใช้จ่ายโครงการ (I/O)", ja: "プロジェクト経費 (I/O)" },
    codes: [
      {
        code: "SE",
        desc: {
          en: "Service Charge, Rental",
          th: "ค่าบริการและค่าเช่า",
          ja: "サービス料・レンタル"
        }
      },
      {
        code: "PM",
        desc: {
          en: "Project Expense IO (Preventive Maintenance CAR, MACHINE)",
          th: "งานซ่อมบำรุงและเครื่องจักร โครงการค่าใช้จ่าย",
          ja: "予防保全（車両・機械）"
        }
      }
    ]
  },
  {
    id: "trading-cylinder",
    name: { en: "Trading Gas Cylinder, Trading other", th: "ซื้อขายถังก๊าซและสินค้าอื่น", ja: "ガスシリンダー取引・その他" },
    codes: [
      {
        code: "TC",
        desc: {
          en: "Trading Gas Cylinder, Trading others",
          th: "ถังก๊าซและสินค้าอื่นเพื่อการค้า",
          ja: "ガスシリンダー・その他取引"
        }
      }
    ]
  },
  {
    id: "trading-bulk",
    name: { en: "Trading Gas Bulk", th: "ซื้อขายก๊าซ Bulk", ja: "バルクガス取引" },
    codes: [
      {
        code: "TB",
        desc: {
          en: "Trading Gas Bulk",
          th: "แก๊สเทกองเพื่อการค้า",
          ja: "バルクガス取引"
        }
      }
    ]
  },
  {
    id: "fix-asset-cylinder",
    name: { en: "Fix Asset Gas Cylinder", th: "สินทรัพย์ถาวร ถังก๊าซ", ja: "固定資産ガスシリンダー" },
    codes: [
      {
        code: "AC",
        desc: {
          en: "Fixed Asset Gas Cylinder",
          th: "ถังก๊าซสินทรัพย์ถาวร",
          ja: "固定資産ガスシリンダー"
        }
      }
    ]
  },
  {
    id: "expense",
    name: { en: "Expense", th: "ค่าใช้จ่าย", ja: "経費" },
    codes: [
      {
        code: "SE",
        desc: {
          en: "Service Charge, Rental",
          th: "ค่าบริการและค่าเช่า",
          ja: "サービス料・レンタル"
        }
      },
      {
        code: "EX",
        desc: {
          en: "Expense (General expense)",
          th: "ค่าใช้จ่ายทั่วไป",
          ja: "一般経費"
        }
      }
    ]
  },
  {
    id: "spare-parts",
    name: { en: "Spare parts & Equipment For Gas", th: "อะไหล่และอุปกรณ์สำหรับก๊าซ", ja: "ガス用スペアパーツ・機器" },
    codes: [
      {
        code: "CS",
        desc: {
          en: "Central Store",
          th: "คลังสินค้าส่วนกลาง",
          ja: "セントラルストア"
        }
      }
    ]
  },
  {
    id: "fix-asset",
    name: { en: "Fix Asset", th: "สินทรัพย์ถาวร", ja: "固定資産" },
    codes: [
      {
        code: "FA",
        desc: {
          en: "Fixed Asset (Specified number from Account)",
          th: "สินทรัพย์ถาวร - ระบุเลขบัญชี",
          ja: "固定資産（勘定科目指定番号）"
        }
      }
    ]
  },
]);

</script>

<template>
  <AppLayout :title="t('help.title')" role="User" email="user.a@itg.co.th">

    <div class="hc-page">

    
      <div class="page-header">
        <div class="header-text">
          <p class="header-hint">{{ t('help.hint') }}</p>
          <h2 class="header-title">{{ t('help.subtitle') }}</h2>
        </div>

      
      </div>

      <div class="cat-grid">
        <CategoryCard
          v-for="cat in categories"
          :key="cat.id"
          :category="cat"
          :lang="lang"
          @select="selected = $event"
        />
      </div>

    </div>

    <CategoryModal
      :category="selected"
      :lang="lang"
      @close="selected = null"
    />

  </AppLayout>
 
</template>

<style scoped>

.hc-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 28px 32px;
  overflow-y: auto;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.header-text { display: flex; flex-direction: column; gap: 4px; }
.header-hint {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted, rgba(255,255,255,0.35));
  margin: 0;
  font-family: "DM Sans", sans-serif;
}
.header-title {
  font-family: "Sora", sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0;
  letter-spacing: 0.01em;
}


.lang-opt {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 7px;
  border: none;
  background: none;
  color: var(--text-secondary, rgba(255,255,255,0.65));
  font-size: 12px;
  font-weight: 600;
  font-family: "DM Sans", sans-serif;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  letter-spacing: 0.04em;
}
.lang-opt:hover {
  background: var(--bg-surface, rgba(255,255,255,0.04));
  color: var(--text-primary, #fff);
}
.lang-opt.active {
  background: var(--accent-dim, rgba(56,163,245,0.15));
  color: var(--accent, #38a3f5);
}


.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
</style>