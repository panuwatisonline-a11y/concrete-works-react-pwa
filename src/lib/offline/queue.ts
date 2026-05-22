import { idbDelete, idbGetAll, idbPut, STORES } from '@/lib/offline/db'
import type { OfflineMutation, OfflineMutationKind } from '@/lib/offline/types'
import { applyOptimisticToCachedRequest } from '@/lib/offline/optimistic'
import { useConnectivityStore } from '@/stores/connectivityStore'

function newId(): string {
  return crypto.randomUUID()
}

export async function refreshPendingMutationCount(): Promise<number> {
  const all = await idbGetAll<OfflineMutation>(STORES.mutations)
  const count = all.length
  useConnectivityStore.getState().setPendingMutationCount(count)
  return count
}

export async function enqueueOfflineMutation(opts: {
  kind: OfflineMutationKind
  requestId: string
  userId: string
  payload: Record<string, unknown>
}): Promise<OfflineMutation> {
  const mutation: OfflineMutation = {
    id: newId(),
    kind: opts.kind,
    createdAt: new Date().toISOString(),
    userId: opts.userId,
    requestId: opts.requestId,
    payload: opts.payload,
  }
  await idbPut(STORES.mutations, mutation)
  await applyOptimisticToCachedRequest(opts.requestId, mutation)
  await refreshPendingMutationCount()
  return mutation
}

export async function getPendingMutations(): Promise<OfflineMutation[]> {
  const all = await idbGetAll<OfflineMutation>(STORES.mutations)
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function removeMutation(id: string): Promise<void> {
  await idbDelete(STORES.mutations, id)
  await refreshPendingMutationCount()
}

export async function getPendingCountForRequest(requestId: string): Promise<number> {
  const all = await getPendingMutations()
  return all.filter((m) => m.requestId === requestId).length
}
