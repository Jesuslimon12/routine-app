'use client'

import { useState, useTransition } from 'react'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { toggleActivityCheck } from '@/app/lib/actions'
import { Checkbox } from '@/app/components/ui/Checkbox'

/**
 * ActivityCheckItem — single activity row with optimistic toggle.
 *
 * Props:
 *   activity  {{ id: string, name: string, completed: boolean }}
 *   date      {string} "YYYY-MM-DD"
 *   isToday   {boolean}
 */
export function ActivityCheckItem({ activity, date, isToday }) {
  const [optimisticChecked, setOptimisticChecked] = useState(activity.completed)
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  async function handleChange(checked) {
    if (!isToday) return

    // Optimistic update
    setError(null)
    setOptimisticChecked(checked)

    startTransition(async () => {
      const result = await toggleActivityCheck(activity.id, date, checked)
      if (result?.error) {
        // Revert on error
        setOptimisticChecked(!checked)
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-2 group">
      <div className="flex-1 min-w-0">
        <Checkbox
          checked={optimisticChecked}
          onChange={handleChange}
          label={activity.name}
          disabled={!isToday || isPending}
        />
      </div>

      {/* Lock hint for non-today dates */}
      {!isToday && (
        <span
          className="shrink-0 text-text-tertiary opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
          aria-hidden="true"
          title="Solo puedes marcar actividades del día de hoy"
        >
          <LockClosedIcon className="w-3.5 h-3.5" />
        </span>
      )}
      {error && <span className="sr-only" role="alert">{error}</span>}
    </div>
  )
}

export default ActivityCheckItem
