<script lang="ts">
  import { Badge, Progressbar } from 'flowbite-svelte';
  import { getCurrentStage, game } from '../lib/gameState.svelte';

  let visitedCount = $derived(game.waypoints.filter((w) => w.visited).length);
  let total = $derived(game.waypoints.length);
  let progress = $derived(total === 0 ? 0 : Math.round((visitedCount / total) * 100));
  let stage = $derived(getCurrentStage());
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-bold text-slate-100">{stage.title}</h2>
    <span class="text-sm text-slate-400">{visitedCount} / {total} 通過</span>
  </div>
  <p class="text-sm text-slate-400">{stage.hint}</p>
  <div class="flex flex-wrap gap-2">
    {#each game.waypoints as wp, i (i)}
      <Badge color={wp.visited ? 'green' : 'yellow'} border>通過点{i + 1}</Badge>
    {/each}
  </div>
  <Progressbar progress={progress.toString()} color={progress === 100 ? 'green' : 'blue'} />
</div>
