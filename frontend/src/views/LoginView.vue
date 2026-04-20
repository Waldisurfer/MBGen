<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const auth   = useAuthStore();

const tab      = ref<'signin' | 'signup'>('signin');
const email    = ref('');
const password = ref('');
const loading  = ref(false);
const message  = ref('');
const pending  = ref(false);

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(msg)), ms)
    ),
  ]);
}

async function submit() {
  loading.value = true;
  message.value = '';
  pending.value = false;
  try {
    if (tab.value === 'signin') {
      await withTimeout(
        auth.signIn(email.value, password.value),
        20_000,
        'Sign-in timed out — please check your connection and try again.'
      );
    } else {
      await auth.signUp(email.value, password.value);
    }
    if (auth.isPending) {
      pending.value = true;
      await auth.signOut();
      return;
    }
    router.push('/dashboard');
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    console.error('[login] Sign-in failed:', msg);
    message.value = msg;
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

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

        <!-- Tabs -->
        <div class="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          <button
            v-for="t in (['signin', 'signup'] as const)"
            :key="t"
            :class="['flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
            @click="tab = t; message = ''"
          >
            {{ t === 'signin' ? 'Sign in' : 'Sign up' }}
          </button>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              required
              :autocomplete="tab === 'signin' ? 'current-password' : 'new-password'"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>

          <p v-if="pending" class="text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-700">
            Your account is pending approval. An admin will review your request.
          </p>
          <p v-else-if="message" class="text-xs rounded-lg px-3 py-2 bg-red-50 text-red-600">
            {{ message }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {{ loading ? 'Please wait…' : tab === 'signin' ? 'Sign in' : 'Create account' }}
          </button>
        </form>
      </div>

      <p class="text-center text-xs text-gray-400 mt-4">Internal tool — team access only</p>
    </div>
  </div>
</template>
