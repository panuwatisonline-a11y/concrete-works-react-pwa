import { cstMixStrengthText, type CstListMix } from '@/lib/cstListRow'

export function CstMixCodeCell({ mix }: { mix: CstListMix | null }) {
  const strength = cstMixStrengthText(mix)

  if (!mix?.mixcode?.trim()) {
    const supplierOnly = mix?.supplier?.trim()
    if (!supplierOnly && !strength) return <>-</>
    const sub = [supplierOnly, strength].filter(Boolean).join(' · ')
    return <span>{sub}</span>
  }

  const supplier = mix.supplier?.trim()
  const sub = [supplier, strength].filter(Boolean).join(' · ')

  return (
    <>
      <span>{mix.mixcode.trim()}</span>
      {sub ? (
        <span className="mt-px block text-[10px] leading-tight text-pour-muted">{sub}</span>
      ) : null}
    </>
  )
}
