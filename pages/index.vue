<script setup lang="ts">
// Fetch data using the SWR endpoint. 
// Nuxt will hydrate this automatically on client side.
const { data, refresh } = await useFetch('/api/ranking');

// Auto-refresh every minute on client side to keep data fresh without reload
if (process.client) {
  useIntervalFn(() => {
    refresh();
  }, 60000);
}
</script>

<template>
  <div class="min-h-screen pb-20">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <!-- Hero Section -->
      <header class="text-center mb-12 animate-fade-in-down">
        <h1 class="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 mb-4 tracking-tight">
          TennisRank
        </h1>
        <div class="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-6 py-2 rounded-full font-bold text-sm shadow-sm border border-yellow-200 transform -rotate-1 hover:rotate-0 transition-transform cursor-default">
          <span>📢</span>
          <span>Friendship first, competition second!</span>
        </div>
      </header>

      <!-- Skeleton Loading -->
      <div v-if="!data" class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div v-for="i in 2" :key="i" class="h-64 bg-gray-200 rounded-3xl animate-pulse"></div>
      </div>

      <!-- Rankings Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        <RankingLeaderboardCard 
          v-for="group in data.groups" 
          :key="group"
          :group-name="group"
          :players="data.standings[group]"
          class="h-full"
        />
      </div>

      <!-- Footer Action -->
      <div class="text-center mt-16">
        <NuxtLink 
          to="/admin" 
          class="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white transition-all duration-200 bg-gray-900 rounded-xl hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5"
        >
          Manage Tournament
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style>
/* Simple utility animation */
@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-down {
  animation: fade-in-down 0.6s ease-out;
}
</style>