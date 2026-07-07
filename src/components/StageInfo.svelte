<script lang="ts">
  import { Badge, Progressbar, Select } from 'flowbite-svelte';
  import { getCurrentStage, game, selectStage } from '../lib/gameState.svelte';
  import { STAGES } from '../lib/stages';

  let visitedCount = $derived(game.waypoints.filter((w) => w.visited).length);
  let total = $derived(game.waypoints.length);
  let progress = $derived(total === 0 ? 0 : Math.round((visitedCount / total) * 100));
  let stage = $derived(getCurrentStage());
  let stageItems = STAGES.map((s, i) => ({ name: s.title, value: i }));

  function handleStageChange(e: Event) {
    selectStage(Number((e.currentTarget as HTMLSelectElement).value));
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center justify-between gap-2">
    <h2 class="text-lg font-bold text-slate-100">{stage.title}</h2>
    <span class="shrink-0 text-sm text-slate-400">{visitedCount} / {total} 通過</span>
  </div>
  <Select items={stageItems} value={game.stageIndex} onchange={handleStageChange} class="w-full" />
  <p class="text-sm text-slate-400">{stage.hint}</p>
  <div class="flex flex-wrap gap-2">
    {#each game.waypoints as wp, i (i)}
      <Badge color={wp.visited ? 'green' : 'yellow'} border>通過点{i + 1}</Badge>
    {/each}
  </div>
  <Progressbar progress={progress.toString()} color={progress === 100 ? 'green' : 'blue'} />
</div>
