<script setup>
import { ref, computed } from "vue";

// --- PROPS & EMITS ---
const props = defineProps({
  // The full list of options to search through.
  // Must be an array of objects with 'id' and 'text' keys.
  options: {
    type: Array,
    required: true,
    default: () => [],
  },
  // v-model value for the selected ID.
  modelValue: {
    type: [String, Number],
    default: "",
  },
  placeholder: {
    type: String,
    default: "Search...",
  },
});

const emit = defineEmits(["update:modelValue"]);

// --- INTERNAL STATE ---
const searchQuery = ref("");
const isOpen = ref(false);

// --- COMPUTED PROPERTIES ---
// The text of the currently selected option, used to display in the input.
const selectedOptionText = computed(() => {
  const selected = props.options.find((opt) => opt.id === props.modelValue);
  return selected ? selected.text : "";
});

// The core logic: filters the options list based on the user's search query.
const filteredOptions = computed(() => {
  if (!searchQuery.value) {
    return props.options;
  }
  return props.options.filter((opt) =>
    opt.text.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// --- METHODS ---
// When an option is clicked from the dropdown.
function selectOption(option) {
  emit("update:modelValue", option.id); // Update the parent's v-model
  searchQuery.value = ""; // Clear the search query
  isOpen.value = false; // Close the dropdown
}

// Opens the dropdown and sets the search query to the current selection.
function openDropdown() {
  searchQuery.value = selectedOptionText.value;
  isOpen.value = true;
}

// Closes the dropdown and resets the input text if nothing was selected.
function closeDropdown() {
  isOpen.value = false;
  searchQuery.value = ""; // Clear search on close
}
</script>

<template>
  <div class="search-select-container" v-click-outside="closeDropdown">
    <input
      type="text"
      class="form-input"
      :value="isOpen ? searchQuery : selectedOptionText"
      @input="searchQuery = $event.target.value"
      @focus="openDropdown"
      :placeholder="placeholder"
    />
    <Transition name="fade">
      <ul v-if="isOpen" class="options-list">
        <li v-if="filteredOptions.length === 0" class="no-results">
          No results found.
        </li>
        <li
          v-for="option in filteredOptions"
          :key="option.id"
          @click="selectOption(option)"
          class="option-item"
        >
          {{ option.text }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.search-select-container {
  position: relative;
}
.options-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--space-2);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-md);
  max-height: 250px;
  overflow-y: auto;
  z-index: var(--z-dropdown);
  list-style: none;
  padding: var(--space-2);
}
.option-item {
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  border-radius: var(--radius-base);
}
.option-item:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}
.no-results {
  padding: var(--space-3) var(--space-4);
  color: var(--text-secondary);
  font-style: italic;
}

/* Transition for the dropdown */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
