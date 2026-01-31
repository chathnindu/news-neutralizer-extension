<script>
  let { source = {} } = $props();
  const url = source.url ?? '#';
  const title = source.title ?? 'Untitled';
  const sourceName = source.source ?? 'Unknown';
  const biasScore = source.biasScore;
  const biasDirection = source.biasDirection ?? '';
  const scoreLabel = biasScore != null ? (biasScore * 100).toFixed(0) + '%' : '—';
</script>

<a class="source-card" href={url} target="_blank" rel="noopener noreferrer">
  <span class="title">{title}</span>
  <span class="meta">
    {sourceName}
    {#if biasDirection}
      · <span class="bias">{biasDirection}</span> ({scoreLabel})
    {/if}
  </span>
</a>

<style>
  .source-card {
    display: block;
    padding: 10px 12px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    text-decoration: none;
    color: inherit;
  }
  .source-card:hover {
    border-color: #2563eb;
    background: #f8fafc;
  }
  .title {
    display: block;
    font-weight: 600;
    font-size: 13px;
    line-height: 1.3;
    margin-bottom: 4px;
  }
  .meta {
    font-size: 11px;
    color: #64748b;
  }
  .bias {
    font-style: italic;
  }
</style>
