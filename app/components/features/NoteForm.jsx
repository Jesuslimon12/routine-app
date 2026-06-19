'use client'

import { useActionState, useState, useEffect } from 'react'
import { saveNote } from '@/app/lib/actions'
import { MoodSelector } from '@/app/components/ui/MoodSelector'
import { Button } from '@/app/components/ui/Button'

/**
 * NoteForm — daily mood and notes form.
 *
 * Props:
 *   initialNote  {object|null} Existing note: { mood_morning, mood_evening, note_text }
 *   date         {string} "YYYY-MM-DD"
 */
export function NoteForm({ initialNote, date }) {
  const [state, formAction, pending] = useActionState(saveNote, {
    status: 'idle',
    error: null,
  })
  const [moodMorning, setMoodMorning] = useState(initialNote?.mood_morning ?? null)
  const [moodEvening, setMoodEvening] = useState(initialNote?.mood_evening ?? null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Show brief success toast when save completes without error
  useEffect(() => {
    if (state.status === 'success' && !pending) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [state.status, pending])

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden date field */}
      <input type="hidden" name="date" value={date} />

      {/* Hidden mood fields — controlled via useState, submitted as hidden inputs */}
      <input type="hidden" name="mood_morning" value={moodMorning ?? ''} />
      <input type="hidden" name="mood_evening" value={moodEvening ?? ''} />

      {/* Mood morning */}
      <MoodSelector
        label="¿Cómo amaneciste?"
        value={moodMorning}
        onChange={setMoodMorning}
        disabled={pending}
      />

      {/* Mood evening */}
      <MoodSelector
        label="¿Cómo terminó tu día?"
        value={moodEvening}
        onChange={setMoodEvening}
        disabled={pending}
      />

      {/* Free note */}
      <div className="space-y-2">
        <label
          htmlFor="note_text"
          className="block text-sm font-semibold text-text-primary"
        >
          Nota libre
        </label>
        <textarea
          id="note_text"
          name="note_text"
          rows={4}
          maxLength={5000}
          defaultValue={initialNote?.note_text ?? ''}
          placeholder="¿Qué quieres recordar de hoy?"
          disabled={pending}
          className="min-h-32 w-full resize-y rounded-xl border border-border-default bg-surface-card px-4 py-3 text-base text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus:border-brand-400 focus:outline-2 focus:outline-brand-500 focus:outline-offset-0 disabled:opacity-50"
        />
      </div>

      {/* Error */}
      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-error-light px-3 py-2 text-sm text-error"
        >
          {state.error}
        </p>
      )}

      {/* Success */}
      {showSuccess && (
        <p
          role="status"
          className="rounded-lg bg-success-light px-3 py-2 text-sm text-success"
          style={{ animation: 'fade-in var(--duration-normal) ease-out' }}
        >
          Nota guardada correctamente
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        loading={pending}
        disabled={pending}
      >
        Guardar nota
      </Button>
    </form>
  )
}

export default NoteForm
