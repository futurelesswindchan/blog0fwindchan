<!-- src/components/common/FilterBar.vue -->
<template>
  <div class="filter-bar glass-container">
    <input
      :value="searchText"
      @input="$emit('update:searchText', ($event.target as HTMLInputElement).value)"
      type="text"
      :placeholder="placeholder"
      class="search-input"
    />
    <button v-if="sortButton" class="sort-button" @click="sortButton.toggle">
      <i :class="['fas', sortButton.icon]"></i>
      {{ sortButton.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import '@/styles/searchBar.css'

interface SortButton {
  icon: string
  label: string
  toggle: () => void
}

defineProps<{
  searchText: string
  placeholder?: string
  sortButton?: SortButton
}>()

defineEmits<{
  (e: 'update:searchText', value: string): void
}>()
</script>
