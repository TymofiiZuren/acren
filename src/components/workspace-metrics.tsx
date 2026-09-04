type Metric = { label: string; value: number | string; detail?: string };

export function WorkspaceMetrics({ items }: { items: Metric[] }) {
  return <dl className="grid divide-y divide-stone-200 rounded-lg border border-stone-200 bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
    {items.map((item) => <div key={item.label} className="flex items-center justify-between gap-4 px-5 py-4 sm:block sm:space-y-2 sm:px-6">
      <dt className="text-sm text-stone-600">{item.label}</dt>
      <dd className="text-2xl font-medium tabular-nums tracking-tight">{item.value}</dd>
      {item.detail && <dd className="hidden text-xs leading-5 text-stone-500 sm:block">{item.detail}</dd>}
    </div>)}
  </dl>;
}
