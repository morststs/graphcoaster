<script lang="ts">
  import { Input, Button, Helper } from 'flowbite-svelte';
  import type { FormulaSlot } from '../lib/gameState.svelte';
  import { game, updateFormulaText, removeFormula } from '../lib/gameState.svelte';

  let { slot }: { slot: FormulaSlot } = $props();

  function handleInput(e: Event) {
    updateFormulaText(slot.id, (e.currentTarget as HTMLInputElement).value);
  }
</script>

<div class="flex flex-col gap-1">
  <div class="flex items-center gap-2">
    <span class="h-4 w-4 shrink-0 rounded-full" style={`background:${slot.color}`}></span>
    <Input
      value={slot.text}
      oninput={handleInput}
      placeholder="例: y = x^2 または x^2+y^2=25"
      class="font-mono"
    />
    <Button
      color="alternative"
      size="sm"
      onclick={() => removeFormula(slot.id)}
      disabled={game.formulas.length <= 1}
    >
      削除
    </Button>
  </div>
  {#if slot.error}
    <Helper color="red">{slot.error}</Helper>
  {/if}
</div>
