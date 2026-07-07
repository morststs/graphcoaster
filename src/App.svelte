<script lang="ts">
  import GameCanvas from './components/GameCanvas.svelte';
  import StageInfo from './components/StageInfo.svelte';
  import FormulaPanel from './components/FormulaPanel.svelte';
  import Controls from './components/Controls.svelte';
  import ClearBanner from './components/ClearBanner.svelte';
</script>

<div class="min-h-screen bg-slate-950 text-slate-100">
  <div class="mx-auto flex max-w-5xl flex-col gap-4 p-4">
    <header>
      <h1 class="text-2xl font-bold">GraphCoaster</h1>
      <p class="text-sm text-slate-400">
        数式を入力して図形を描き、球を落として全ての通過点を通しましょう。
      </p>
    </header>

    <ClearBanner />

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
      <GameCanvas />
      <div class="flex flex-col gap-4">
        <StageInfo />
        <FormulaPanel />
        <Controls />
      </div>
    </div>
  </div>
</div>
