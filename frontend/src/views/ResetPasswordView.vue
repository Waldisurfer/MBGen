<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router  = useRouter();
const auth    = useAuthStore();

const password  = ref('');
const password2 = ref('');
const loading   = ref(false);
const message   = ref('');
const ready     = ref(false);

onMounted(async () => {
  // Ensure auth is initialized (handles ?code= exchange or #access_token= hash)
  if (auth.isLoading) await auth.init();
  ready.value = true;
});

async function submit() {
  if (password.value !== password2.value) {
    message.value = 'Passwords do not match.';
    return;
  }
  if (password.value.length < 6) {
    message.value = 'Password must be at least 6 characters.';
    return;
  }
  loading.value = true;
  message.value = '';
  try {
    await auth.updatePassword(password.value);
    router.push('/dashboard');
  } catch (err) {
    message.value = (err as Error).message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 mb-2">
          <div class="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 17l8 5 8-5" />
            </svg>
          </div>
          <span class="text-xl font-bold text-gray-900">MBGen</span>
        </div>
        <p class="text-sm text-gray-500">AI Marketing Studio</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-1">Set new password</h2>
        <p class="text-sm text-gray-500 mb-5">Choose a new password for your account.</p>

        <!-- Invalid/expired link -->
        <div v-if="ready && !auth.isPasswordRecovery && !auth.isAuthenticated" class="text-sm bg-red-50 text-red-600 rounded-lg px-3 py-2 mb-4">
          This link is invalid or has expired. <button class="underline" @click="$router.push('/login')">Request a new one.</button>
        </div>

        <form v-else @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              v-model="password"
              type="password"
              required
              autocomplete="new-password"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input
              v-model="password2"
              type="password"
              required
              autocomplete="new-password"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>

          <p v-if="message" class="text-xs bg-red-50 text-red-600 rounded-lg px-3 py-2">{{ message }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {{ loading ? 'Updating…' : 'Update password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
