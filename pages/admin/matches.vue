<script setup lang="ts">
// In a real app, use middleware to check cookies/session
// definePageMeta({ middleware: 'auth' })

const { data: playersData } = await useFetch('/api/admin/players'); // Needs backend impl
// Mock data for display if API not ready in this slice
const groups = ['U8 Red Ball', 'U10 Orange Ball'];
const players = [
  { id: 1, name: 'Tom', groups: ['U10 Orange Ball'] },
  { id: 2, name: 'Jerry', groups: ['U10 Orange Ball', 'U8 Red Ball'] }
];

const handleSaved = () => {
  // Refresh match history list
  refreshNuxtData('admin-matches');
};
</script>

<template>
  <div class="min-h-screen bg-gray-50/50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      
      <!-- Nav -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors">
            ← Back
          </NuxtLink>
          <h1 class="text-2xl font-black text-gray-900">Admin Dashboard</h1>
        </div>
      </div>

      <!-- Feature: Match Entry -->
      <section class="mb-8">
        <MatchEntryForm 
          :groups="groups" 
          :players="players"
          @saved="handleSaved" 
        />
      </section>

      <!-- Feature: Recent Matches (Mockup for slice architecture) -->
      <section class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 class="font-bold text-lg text-gray-800">Recent History</h3>
          <button class="text-sm font-bold text-blue-600 hover:underline">View All</button>
        </div>
        <div class="p-8 text-center text-gray-400 font-medium bg-gray-50/50">
          History list component would go here...
        </div>
      </section>

    </div>
  </div>
</template>