<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  { variant: 'primary', size: 'md', loading: false, disabled: false, type: 'button' }
);
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 cursor-pointer',
      size === 'sm' && 'px-3 py-1.5 text-sm',
      size === 'md' && 'px-4 py-2 text-sm',
      size === 'lg' && 'px-6 py-3 text-base',
      variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
      variant === 'secondary' && 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100',
      variant === 'ghost' && 'text-gray-600 hover:bg-gray-100 active:bg-gray-200',
      variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
      (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
    ]"
  >
    <svg
      v-if="loading"
      class="w-4 h-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>
