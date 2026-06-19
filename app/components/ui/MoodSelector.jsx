'use client'

import { MOOD_OPTIONS } from '../design-system/tokens'

/**
 * MoodSelector — Mi Rutina Diaria
 *
 * Displays 4 mood options as pill buttons with emoji.
 *
 * Props:
 *   value    — currently selected mood value string or null
 *   onChange — (value: string) => void
 *   label    — string label rendered above pills (optional)
 */
export function MoodSelector({ value, onChange, label = 'Estado de ánimo', disabled = false }) {
  return (
    <fieldset className="space-y-3">
      {label && (
        <legend className="text-sm font-semibold text-text-primary">
          {label}
        </legend>
      )}
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {MOOD_OPTIONS.map((mood) => {
          const isSelected = value === mood.value
          return (
            <button
              key={mood.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(mood.value)}
              data-selected={isSelected ? 'true' : 'false'}
              className="mood-pill disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true" className="flex h-4 items-end gap-0.5">
                {[1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={`w-1 rounded-full ${level <= mood.level ? 'bg-current' : 'bg-neutral-300'}`}
                    style={{ height: `${4 + level * 2}px` }}
                  />
                ))}
              </span>
              <span>{mood.label}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default MoodSelector
