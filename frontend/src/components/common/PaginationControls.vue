<!-- src/components/common/PaginationControls.vue -->
<template>
  <div class="pagination-controls glass-container">
    <button
      class="pagination-btn"
      :disabled="pagination.currentPage === 1"
      @click="pagination.prevPage"
    >
      <i class="fas fa-chevron-left"></i> 上一页
    </button>
    <span class="pagination-info">
      第 {{ pagination.currentPage }} 页 / 共 {{ pagination.totalPages }} 页
    </span>
    <button
      class="pagination-btn"
      :disabled="pagination.currentPage === pagination.totalPages"
      @click="pagination.nextPage"
    >
      下一页 <i class="fas fa-chevron-right"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import '@/styles/pagination.css'

interface Pagination {
  currentPage: number
  totalPages: number
  prevPage: () => void
  nextPage: () => void
}

defineProps<{
  // 直接接收 useSearchAndSort 返回的整个 pagination 对象
  pagination: Pagination
}>()
</script>
