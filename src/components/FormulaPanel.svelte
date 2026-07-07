<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import FormulaRow from './FormulaRow.svelte';
  import { game, addFormula } from '../lib/gameState.svelte';
</script>

<div class="flex flex-col gap-3">
  <h2 class="text-sm font-semibold text-slate-300">数式</h2>
  {#each game.formulas as slot (slot.id)}
    <FormulaRow {slot} />
  {/each}
  <Button
    color="light"
    size="sm"
    onclick={addFormula}
    disabled={game.formulas.length >= 6}
    class="self-start"
  >
    ＋ 数式を追加
  </Button>
</div>
