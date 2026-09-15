<script setup>
import { ref, computed, watch } from "vue";
import { useAuthStore } from "../../stores/auth";
import AppLayout from "../../layouts/AppLayout.vue";
import AuditLogPagination from "../../components/audit/AuditLogPagination.vue";

const auth = useAuthStore();

// ── ข้อมูลวิดีโอ: จัดตามขั้นตอนจริงของ RFQ pipeline ในระบบ ─────────────
const CATEGORIES = [
  "ทั้งหมด",
  "เริ่มต้นใช้งาน",
  "สร้างคำขอ RFQ",
  "อนุมัติ & กำหนดเวลา",
  "ส่งใบเสนอราคา",
  "เปรียบเทียบราคา",
  "ยืนยันตัวเลือก",
  "Cost Saving",
  "ยืนยันการซื้อ",
  "รายงาน & Export",
];

const videos = ref([
  { id: 1, category: "เริ่มต้นใช้งาน", title: "ภาพรวมระบบ Smart RFQ", desc: "รู้จักหน้าจอหลักและขั้นตอนทั้งหมดของระบบ", duration: "2:40", wistiaId: "wistia_id_01" }

]);

const activeCategory = ref("ทั้งหมด");

const filteredVideos = computed(() =>
  activeCategory.value === "ทั้งหมด"
    ? videos.value
    : videos.value.filter((v) => v.category === activeCategory.value),
);

// ── Pagination (client-side, เหมือน Audit Log / Doc Request) ──────────────
const currentPage = ref(1);
const pageSize = ref(12); // 4 คอลัมน์ x 3 แถว ต่อหน้า

const totalRecords = computed(() => filteredVideos.value.length);

const pagedVideos = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredVideos.value.slice(start, start + pageSize.value);
});

// เปลี่ยนหมวดหมู่ → รีเซ็ตกลับหน้า 1 เสมอ
watch(activeCategory, () => {
  currentPage.value = 1;
});
watch(pageSize, () => {
  currentPage.value = 1;
});

const activeVideo = ref(null);

function openVideo(video) {
  activeVideo.value = video;
}
function closeVideo() {
  activeVideo.value = null;
}
</script>

<template>
  <AppLayout title="วิธีใช้งาน" role="user" :email="auth?.user?.email ?? ''">
    <div class="htu-wrap">
      <!-- Header -->
      <div class="group-header">
        <div class="htu-header">
        <h1 class="htu-title">วิธีใช้งาน Smart RFQ System</h1>
        <p class="htu-subtitle">
          วิดีโอสอนใช้งานทุกขั้นตอน ตั้งแต่สร้างคำขอจนถึงปิดการสั่งซื้อ
        </p>
      </div>

      <!-- Stat pill -->
      <div class="stat-pill">
        <span class="stat-num">{{ totalRecords }}</span>
        <span class="stat-label">Videos</span>
      </div>
      </div>

      <!-- Category filter -->
      <div class="htu-filter-row">
        <button
          v-for="cat in CATEGORIES"
          :key="cat"
          class="htu-filter-chip"
          :class="{ 'htu-filter-chip--active': activeCategory === cat }"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Body: Video grid — ไหลลงล่างปกติ ไม่มี horizontal scroll -->
      <div class="htu-grid">
        <button
          v-for="video in pagedVideos"
          :key="video.id"
          class="htu-card"
          @click="openVideo(video)"
        >
          <div class="htu-thumb">
            <span class="htu-play">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M5 3.5v13l11-6.5-11-6.5z" fill="currentColor" />
              </svg>
            </span>
            <span class="htu-duration">{{ video.duration }}</span>
          </div>
          <div class="htu-card-body">
            <span class="htu-card-category">{{ video.category }}</span>
            <h3 class="htu-card-title">{{ video.title }}</h3>
            <p class="htu-card-desc">{{ video.desc }}</p>
          </div>
        </button>
      </div>

      <div v-if="!pagedVideos.length" class="htu-empty">
        ยังไม่มีวิดีโอในหมวดนี้
      </div>

      <!-- Footer: Pagination (reuse component เดิมจากหน้า Audit Log) -->
      <AuditLogPagination
        :page="currentPage"
        :page-size="pageSize"
        :total="totalRecords"
        @update:page="currentPage = $event"
        @update:pageSize="pageSize = $event"
      />
    </div>
  </AppLayout>

  <!-- Player modal -->
  <Teleport to="body">
    <Transition name="htu-modal-fade">
      <div v-if="activeVideo" class="htu-modal-overlay" @click.self="closeVideo">
        <div class="htu-modal-panel" role="dialog" aria-modal="true">
          <button class="htu-modal-close" @click="closeVideo" title="ปิด">
            <i class="pi pi-times"></i>
          </button>
          <div class="htu-modal-player">
            <iframe
              :src="`https://fast.wistia.net/embed/iframe/${activeVideo.wistiaId}?videoFoam=true&autoPlay=true`"
              title="Wistia video player"
              allow="autoplay; fullscreen"
              allowfullscreen
              frameborder="0"
              scrolling="no"
            ></iframe>
          </div>
          <div class="htu-modal-info">
            <span class="htu-card-category">{{ activeVideo.category }}</span>
            <h3 class="htu-modal-title">{{ activeVideo.title }}</h3>
            <p class="htu-modal-desc">{{ activeVideo.desc }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Sora:wght@600;700&display=swap");

.htu-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
  font-family: "DM Sans", sans-serif;
}

/* ── Header ──────────────────────────────────────────────── */
.htu-header {
  margin: 4px 8px 0;
}
.htu-title {
  font-family: "Sora", sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
}
.htu-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

/* ── Stat pill (เหมือน Audit Log) ───────────────────────────── */
.stat-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 160px;
  margin: 4px 8px;
  justify-content: center;
  background: var(--accent-dim, rgba(56, 163, 245, 0.1));
  border: 1px solid var(--border-accent, rgba(56, 163, 245, 0.25));
  border-radius: 10px;
  padding: 8px 16px;
}
.stat-num {
  font-family: "Sora", sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--accent, #38a3f5);
}
.stat-label {
  font-size: 11px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
}

/* ── Category filter ────────────────────────────────────────── */
.htu-filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 0 8px 4px;
}
.htu-filter-chip {
  flex-shrink: 0;
  padding: 7px 16px;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 600;
  font-family: "DM Sans", sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.htu-filter-chip:hover {
  border-color: var(--accent-glow);
  color: var(--text-primary);
}
.htu-filter-chip--active {
  background: var(--accent-dim);
  border-color: var(--accent-glow);
  color: var(--accent);
}

/* ── Grid: ไหลลงล่างปกติ, ไม่มี horizontal scroll ─────────────── */
.htu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 4px 8px 8px;
}

@media (max-width: 1200px) {
  .htu-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 860px) {
  .htu-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .htu-grid {
    grid-template-columns: 1fr;
  }
}

.htu-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  padding: 0;
  font-family: "DM Sans", sans-serif;
  transition:
    border-color 0.15s,
    transform 0.15s;
}
.htu-card:hover {
  border-color: var(--accent-glow);
  transform: translateY(-2px);
}

.htu-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.htu-play {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.htu-card:hover .htu-play {
  background: var(--accent);
  color: var(--text-primary-help);
}
.htu-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 5px;
}

.htu-card-body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.htu-card-category {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
}
.htu-card-title {
  font-family: "Sora", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  --webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.htu-card-desc {
  font-size: 11.5px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.45;
  display: -webkit-box;
  --webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.htu-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

/* ── Player modal ────────────────────────────────────────────── */
.htu-modal-fade-enter-active {
  transition: opacity 0.2s ease;
}
.htu-modal-fade-leave-active {
  transition: opacity 0.18s ease;
}
.htu-modal-fade-enter-from,
.htu-modal-fade-leave-to {
  opacity: 0;
}

.htu-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.htu-modal-panel {
  position: relative;
  width: 100%;
  max-width: 860px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  font-family: "DM Sans", sans-serif;
}
.htu-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.htu-modal-player {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}
.htu-modal-player iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}
.htu-modal-info {
  padding: 18px 22px 22px;
}
.htu-modal-title {
  font-family: "Sora", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 4px 0 6px;
}
.htu-modal-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>