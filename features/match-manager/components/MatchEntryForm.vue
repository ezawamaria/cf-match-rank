<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';

// In a real app, these types would be imported from a shared file
interface Player { id: number; name: string; groups: string[] }

const props = defineProps<{
  groups: string[];
  players: Player[];
}>();

const emit = defineEmits(['saved']);

const isLoading = ref(false);
const formData = reactive({
  date: new Date().toISOString().split('T')[0],
  group: '',
  p1Id: '' as string | number,
  p2Id: '' as string | number,
  s1: 0,
  s2: 0
});

// Computed players based on selected group
const availablePlayers = computed(() => {
  if (!formData.group) return [];
  return props.players.filter(p => p.groups.includes(formData.group));
});

const isValid = computed(() => {
  return formData.group && formData.p1Id && formData.p2Id && formData.p1Id !== formData.p2Id;
});

async function submit() {
  if (!isValid.value) return;
  isLoading.value = true;
  
  try {
    await $fetch('/api/admin/match', {
      method: 'POST',
      body: { ...formData }
    });
    
    // Reset scores but keep config for rapid entry
    formData.s1 = 0;
    formData.s2 = 0;
    
    emit('saved');
    // We could use a global toast store here
  } catch (err) {
    alert('Error saving match');
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <h2 class="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
      📝 Record Match
    </h2>
    
    <form @submit.prevent="submit" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Date -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Date</label>
          <input 
            v-model="formData.date"
            type="date" 
            class="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2.5 font-bold text-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
          >
        </div>

        <!-- Group -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Group</label>
          <select 
            v-model="formData.group"
            class="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2.5 font-bold text-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="" disabled>Select Group</option>
            <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
      </div>

      <!-- Scoreboard Input -->
      <div class="bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <div class="flex flex-col md:flex-row items-center gap-4 justify-between">
          
          <!-- Player 1 -->
          <div class="flex-1 w-full space-y-2">
            <select 
              v-model="formData.p1Id"
              :disabled="!formData.group"
              class="w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-3 font-bold text-gray-800 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled>Player 1</option>
              <option v-for="p in availablePlayers" :key="p.id" :value="p.id" :disabled="p.id === formData.p2Id">
                {{ p.name }}
              </option>
            </select>
            <input 
              v-model.number="formData.s1"
              type="number" 
              class="w-full text-center text-3xl font-black text-blue-600 bg-white border-2 border-gray-200 rounded-xl py-2 focus:border-blue-500 focus:outline-none"
            >
          </div>

          <div class="text-gray-400 font-black text-2xl hidden md:block">VS</div>

          <!-- Player 2 -->
          <div class="flex-1 w-full space-y-2">
            <select 
              v-model="formData.p2Id"
              :disabled="!formData.group"
              class="w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-3 font-bold text-gray-800 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled>Player 2</option>
              <option v-for="p in availablePlayers" :key="p.id" :value="p.id" :disabled="p.id === formData.p1Id">
                {{ p.name }}
              </option>
            </select>
            <input 
              v-model.number="formData.s2"
              type="number" 
              class="w-full text-center text-3xl font-black text-red-500 bg-white border-2 border-gray-200 rounded-xl py-2 focus:border-blue-500 focus:outline-none"
            >
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        :disabled="!isValid || isLoading"
        class="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        <Loader2 v-if="isLoading" class="animate-spin w-5 h-5" />
        <span v-else>Save Match Result</span>
      </button>
    </form>
  </div>
</template>