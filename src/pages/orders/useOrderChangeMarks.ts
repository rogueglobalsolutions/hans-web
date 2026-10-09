import { useEffect, useState } from 'react'
import type { AdminOrderSummary } from './shared'

const SEEN_KEY = 'hans_admin_seen_orders'

interface SeenStore {
  since: string
  statuses: Record<string, string>
}

export type ChangeMark = 'new' | 'updated' | null

function orderStateKey(order: Pick<AdminOrderSummary, 'status' | 'cancellationRequested'>) {
  return order.cancellationRequested ? `${order.status}:cancel-requested` : order.status
}

function readSeen(fallbackSince = new Date().toISOString()): SeenStore {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (raw) return JSON.parse(raw) as SeenStore
  } catch {
    // Storage unavailable: start fresh.
  }
  return { since: fallbackSince, statuses: {} }
}

function writeSeen(store: SeenStore) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(store))
  } catch {
    // Change marks are a convenience; ignore storage failures.
  }
}

/**
 * Orders that are new or changed status since this browser last opened them keep a mark
 * until opened. Orders older than the first visit are recorded silently so a fresh browser
 * does not flag the whole backlog.
 */
export function useOrderChangeMarks(orders: AdminOrderSummary[]) {
  const [store, setStore] = useState<SeenStore>(() => readSeen())

  useEffect(() => {
    if (orders.length === 0) return
    const current = readSeen(store.since)
    for (const order of orders) {
      if (current.statuses[order.id] === undefined && order.createdAt <= current.since) {
        current.statuses[order.id] = orderStateKey(order)
      }
    }
    writeSeen(current)
  }, [orders, store.since])

  const markFor = (order: AdminOrderSummary): ChangeMark => {
    const seen = store.statuses[order.id]
    if (seen === undefined) return order.createdAt > store.since ? 'new' : null
    return seen === orderStateKey(order) ? null : 'updated'
  }

  const markSeen = (order: AdminOrderSummary) => {
    const next = readSeen(store.since)
    next.statuses[order.id] = orderStateKey(order)
    writeSeen(next)
    setStore(next)
  }

  return { markFor, markSeen }
}
