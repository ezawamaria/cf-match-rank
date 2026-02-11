<script setup lang="ts">
import type { PropType } from 'vue';

interface PlayerStat {
  id: number;
  name: string;
  score: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
}

const props = defineProps({
  groupName: { type: String, required: true },
  players: { type: Array as PropType<PlayerStat[]>, required: true }
});

const getRankEmoji = (index: number) => {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return null;
};
</script>

<template>
  <div class="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-white/20 transition-transform duration-300 hover:scale-[1.01]">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 border-b-4 border-orange-500">
      <h2 class="text-white font-black text-xl flex items-center gap-2">
        <span>🎾</span> {{ groupName }}
      </h2>
    </div>

    <!-- List -->
    <div class="divide-y divide-gray-100">
      <div 
        v-for="(player, idx) in players" 
        :key="player.id"
        class="group flex items-center justify-between p-4 hover:bg-yellow-50 transition-colors cursor-pointer"
        @click="navigateTo(`/player/${player.id}`)"
      >
        <div class="flex items-center gap-4">
          <!-- Rank Badge -->
          <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center font-bold text-lg">
            <span v-if="idx < 3" class="text-3xl filter drop-shadow-sm">{{ getRankEmoji(idx) }}</span>
            <span v-else class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-bold">
              {{ idx + 1 }}
            </span>
          </div>

          <!-- Player Info -->
          <div>
            <div class="font-black text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
              {{ player.name }}
            </div>
            <div class="text-xs font-bold text-gray-400 font-mono mt-0.5 flex gap-2">
              <span class="bg-gray-100 px-1.5 rounded">Matches: {{ player.matches }}</span>
              <span class="text-green-600">W:{{ player.wins }}</span>
              <span class="text-gray-500">D:{{ player.draws }}</span>
              <span class="text-red-500">L:{{ player.losses }}</span>
            </div>
          </div>
        </div>

        <!-- Score -->
        <div class="text-right">
          <div class="text-3xl font-black text-blue-600 tabular-nums tracking-tighter">
            {{ player.score }}
          </div>
          <div class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Points</div>
        </div>
      </div>
      
      <div v-if="players.length === 0" class="p-8 text-center text-gray-400 font-medium">
        No players in this group yet.
      </div>
    </div>
  </div>
</template>