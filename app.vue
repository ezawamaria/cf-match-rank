<template>
  <div class="font-sans antialiased text-gray-900 bg-[#e6f5e6] min-h-screen selection:bg-orange-200 selection:text-orange-900">
    <NuxtLoadingIndicator color="#f97316" />
    <UiToast />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap');

body {
  font-family: 'Fredoka', sans-serif;
  background-color: #e6f5e6;
  min-height: 100vh;
  padding: 1rem;
  color: #374151;
}

.rank-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
  gap: 1.25rem;
  justify-content: center;
  align-items: start;
}

@media (max-width: 640px) {
  body {
    padding: 0.5rem;
  }
  .rank-grid {
    gap: 0.75rem;
  }
}
</style>
