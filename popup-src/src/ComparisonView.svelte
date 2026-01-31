<script>
  let { result } = $props();
  const narrative = result?.narrative ?? null;
  const summary = result?.neutralSummary ?? null;
  const consensus = narrative?.commonPoints ?? summary?.consensusFacts ?? [];
  const differences = narrative?.differences ?? summary?.disputedPoints ?? [];
</script>

<div class="comparison-view">
  <h3>What sources agree on</h3>
  {#if consensus.length > 0}
    <ul>
      {#each consensus as item}
        <li>{typeof item === 'string' ? item : item?.claim ?? JSON.stringify(item)}</li>
      {/each}
    </ul>
  {:else}
    <p class="muted">No consensus points extracted.</p>
  {/if}

  <h3>Where they differ</h3>
  {#if differences.length > 0}
    <ul>
      {#each differences as item}
        <li>
          {#if typeof item === 'string'}
            {item}
          {:else if item?.aspect}
            <strong>{item.aspect}</strong>: {JSON.stringify(item.sourceViews ?? item.sources ?? '')}
          {:else if item?.claim}
            {item.claim}
          {:else}
            {JSON.stringify(item)}
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="muted">No major differences highlighted.</p>
  {/if}
</div>

<style>
  .comparison-view {
    margin-top: 12px;
    padding: 12px;
    background: #f1f5f9;
    border-radius: 8px;
    font-size: 13px;
  }
  .comparison-view h3 {
    margin: 0 0 6px;
    font-size: 11px;
    text-transform: uppercase;
    color: #64748b;
  }
  .comparison-view ul {
    margin: 0 0 12px;
    padding-left: 18px;
  }
  .comparison-view li {
    margin-bottom: 4px;
    line-height: 1.4;
  }
  .muted {
    margin: 0;
    color: #64748b;
    font-size: 12px;
  }
</style>
