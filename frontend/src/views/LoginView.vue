<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const auth   = useAuthStore();

const tab      = ref<'signin' | 'signup' | 'forgot'>('signin');
const email    = ref('');
const password = ref('');
const loading  = ref(false);
const message  = ref('');

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
  try {
    if (tab.value === 'signin') {
      await withTimeout(
        auth.signIn(email.value, password.value),
        20_000,
        'Sign-in timed out — please check your connection and try again.'
      );
      router.push('/dashboard');
    } else if (tab.value === 'signup') {
      await auth.signUp(email.value, password.value);
      message.value = 'Check your email to confirm your account, then sign in.';
      tab.value = 'signin';
    } else {
      await auth.sendPasswordReset(email.value);
      message.value = 'Password reset email sent — check your inbox.';
      tab.value = 'signin';
    }
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

        <!-- Tabs (sign in / sign up only) -->
        <div v-if="tab !== 'forgot'" class="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          <button
            v-for="t in (['signin', 'signup'] as const)"
            :key="t"
            :class="['flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
            @click="tab = t; message = ''"
          >
            {{ t === 'signin' ? 'Sign in' : 'Sign up' }}
          </button>
        </div>

        <!-- Forgot password header -->
        <div v-else class="mb-6">
          <button class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3" @click="tab = 'signin'; message = ''">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Back to sign in
          </button>
          <p class="text-sm text-gray-600">Enter your email and we'll send a password reset link.</p>
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
          <div v-if="tab !== 'forgot'">
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

          <p v-if="message" :class="['text-xs rounded-lg px-3 py-2', message.includes('Check') || message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600']">
            {{ message }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {{ loading ? 'Please wait…' : tab === 'signin' ? 'Sign in' : tab === 'signup' ? 'Create account' : 'Send reset link' }}
          </button>

          <button
            v-if="tab === 'signin'"
            type="button"
            class="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
            @click="tab = 'forgot'; message = ''"
          >
            Forgot password?
          </button>
        </form>
      </div>

      <p class="text-center text-xs text-gray-400 mt-4">Internal tool — team access only</p>
    </div>
  </div>
</template>
