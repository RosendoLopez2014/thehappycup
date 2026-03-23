'use client'

import { useState } from 'react'
import type { Customer } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowUpDown } from 'lucide-react'

export type CustomerWithStats = Customer & {
  order_count: number
  total_spent: number
}

type SortKey = 'name' | 'email' | 'order_count' | 'total_spent' | 'points_balance'
type SortDir = 'asc' | 'desc'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

interface AdjustPointsDialogProps {
  customer: CustomerWithStats
  open: boolean
  onClose: () => void
  onSuccess: (customerId: string, newBalance: number) => void
}

function AdjustPointsDialog({ customer, open, onClose, onSuccess }: AdjustPointsDialogProps) {
  const [points, setPoints] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setPoints('')
    setDescription('')
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const pointsNum = parseInt(points, 10)
    if (isNaN(pointsNum)) {
      setError('Points must be a valid integer')
      return
    }
    if (!description.trim()) {
      setError('Description is required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pointsNum, description: description.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to adjust points')
        return
      }

      onSuccess(customer.id, json.data.points_balance)
      handleClose()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust Points — {customer.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="points-amount">
              Points (positive to add, negative to remove)
            </Label>
            <Input
              id="points-amount"
              type="number"
              placeholder="e.g. 50 or -25"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Current balance: {customer.points_balance} pts
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="points-description">Reason</Label>
            <Input
              id="points-description"
              type="text"
              placeholder="e.g. Loyalty bonus, correction"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface CustomerTableProps {
  initialCustomers: CustomerWithStats[]
}

export function CustomerTable({ initialCustomers }: CustomerTableProps) {
  const [customers, setCustomers] = useState<CustomerWithStats[]>(initialCustomers)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [adjustTarget, setAdjustTarget] = useState<CustomerWithStats | null>(null)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function handlePointsSuccess(customerId: string, newBalance: number) {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId ? { ...c, points_balance: newBalance } : c
      )
    )
  }

  const sorted = [...customers].sort((a, b) => {
    let valA: string | number = a[sortKey]
    let valB: string | number = b[sortKey]
    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()
    if (valA < valB) return sortDir === 'asc' ? -1 : 1
    if (valA > valB) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function SortButton({ label, colKey }: { label: string; colKey: SortKey }) {
    return (
      <button
        onClick={() => handleSort(colKey)}
        className="flex items-center gap-1 hover:text-warm-800 transition-colors"
      >
        {label}
        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
      </button>
    )
  }

  return (
    <>
      <div className="rounded-xl border border-warm-200 overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="bg-warm-50">
              <TableHead className="w-[25%]"><SortButton label="Name" colKey="name" /></TableHead>
              <TableHead className="w-[25%]"><SortButton label="Email" colKey="email" /></TableHead>
              <TableHead className="w-[12%] text-right">
                <div className="flex items-center justify-end"><SortButton label="Orders" colKey="order_count" /></div>
              </TableHead>
              <TableHead className="w-[15%] text-right">
                <div className="flex items-center justify-end"><SortButton label="Total Spent" colKey="total_spent" /></div>
              </TableHead>
              <TableHead className="w-[12%] text-right">
                <div className="flex items-center justify-end"><SortButton label="Points" colKey="points_balance" /></div>
              </TableHead>
              <TableHead className="w-[11%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-warm-400 py-10">
                  No customers yet
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-warm-50/50">
                  <TableCell className="font-medium text-warm-700">{customer.name}</TableCell>
                  <TableCell className="text-warm-500">{customer.email}</TableCell>
                  <TableCell className="text-right text-warm-600">{customer.order_count}</TableCell>
                  <TableCell className="text-right text-warm-600">
                    {formatCurrency(customer.total_spent)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 text-warm-600 font-medium">
                      {customer.points_balance}
                      <span className="text-xs text-warm-400">pts</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAdjustTarget(customer)}
                      className="text-xs h-7 px-2.5"
                    >
                      Adjust Points
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {adjustTarget && (
        <AdjustPointsDialog
          customer={adjustTarget}
          open={true}
          onClose={() => setAdjustTarget(null)}
          onSuccess={handlePointsSuccess}
        />
      )}
    </>
  )
}
