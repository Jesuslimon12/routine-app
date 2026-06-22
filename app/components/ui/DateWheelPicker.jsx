'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import { cn } from '@/app/lib/cn'

const ITEM_HEIGHT = 40
const VISIBLE_ITEMS = 5
const PERSPECTIVE_ORIGIN = ITEM_HEIGHT * 2

const SIZE_CONFIG = {
  xs: {
    itemHeight: ITEM_HEIGHT * 0.7,
    fontSize: 'text-sm',
    gap: 'gap-1',
    visibleItems: 3,
  },
  sm: {
    itemHeight: ITEM_HEIGHT * 0.8,
    fontSize: 'text-sm',
    gap: 'gap-2',
    visibleItems: VISIBLE_ITEMS,
  },
  md: {
    itemHeight: ITEM_HEIGHT,
    fontSize: 'text-base',
    gap: 'gap-4',
    visibleItems: VISIBLE_ITEMS,
  },
  lg: {
    itemHeight: ITEM_HEIGHT * 1.2,
    fontSize: 'text-lg',
    gap: 'gap-6',
    visibleItems: VISIBLE_ITEMS,
  },
}

function getMonthNames(locale) {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long' })
  return Array.from({ length: 12 }, (_, index) => {
    const month = formatter.format(new Date(2000, index, 1))
    return month.charAt(0).toLocaleUpperCase(locale) + month.slice(1)
  })
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function wrapIndex(index, length) {
  return ((index % length) + length) % length
}

function WheelItem({
  item,
  index,
  y,
  itemHeight,
  visibleItems,
  centerOffset,
  isSelected,
  disabled,
  onClick,
}) {
  const itemY = useTransform(
    y,
    (latest) => index * itemHeight + latest + centerOffset
  )
  const rotateX = useTransform(
    itemY,
    [0, centerOffset, itemHeight * visibleItems],
    [45, 0, -45]
  )
  const scale = useTransform(
    itemY,
    [0, centerOffset, itemHeight * visibleItems],
    [0.8, 1, 0.8]
  )
  const opacity = useTransform(
    itemY,
    [
      0,
      centerOffset * 0.5,
      centerOffset,
      centerOffset * 1.5,
      itemHeight * visibleItems,
    ],
    [0.6, 0.8, 1, 0.8, 0.6]
  )

  return (
    <motion.div
      className="flex select-none items-center justify-center"
      style={{
        height: itemHeight,
        rotateX,
        scale,
        opacity,
        transformStyle: 'preserve-3d',
        transformOrigin: `center center -${PERSPECTIVE_ORIGIN}px`,
      }}
      onClick={() => !disabled && onClick()}
    >
      <span
        className={cn(
          'transition-colors',
          isSelected
            ? 'font-bold text-brand-700'
            : 'font-semibold text-text-secondary'
        )}
      >
        {item}
      </span>
    </motion.div>
  )
}

function WheelColumn({
  items,
  value,
  onChange,
  itemHeight,
  visibleItems,
  disabled,
  className,
  ariaLabel,
}) {
  const containerRef = useRef(null)
  const itemCount = items.length
  const initialVirtualIndex = itemCount + value
  const virtualIndexRef = useRef(initialVirtualIndex)
  const animationRef = useRef(null)
  const y = useMotionValue(-initialVirtualIndex * itemHeight)
  const centerOffset = Math.floor(visibleItems / 2) * itemHeight
  const prefersReducedMotion = useReducedMotion()
  const circularItems = useMemo(
    () =>
      Array.from({ length: 3 }, (_, copyIndex) =>
        items.map((item, itemIndex) => ({ item, itemIndex, copyIndex }))
      ).flat(),
    [items]
  )

  const selectVirtualIndex = useCallback(
    (nextVirtualIndex) => {
      animationRef.current?.stop()

      const boundedVirtualIndex = Math.max(
        0,
        Math.min(itemCount * 3 - 1, nextVirtualIndex)
      )
      const logicalIndex = wrapIndex(boundedVirtualIndex, itemCount)
      virtualIndexRef.current = boundedVirtualIndex
      onChange(logicalIndex)

      const recenter = () => {
        if (virtualIndexRef.current !== boundedVirtualIndex) return

        const centeredIndex = itemCount + logicalIndex
        virtualIndexRef.current = centeredIndex
        y.set(-centeredIndex * itemHeight)
      }

      if (prefersReducedMotion) {
        recenter()
        return
      }

      animationRef.current = animate(y, -boundedVirtualIndex * itemHeight, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        onComplete: recenter,
      })
    },
    [itemCount, itemHeight, onChange, prefersReducedMotion, y]
  )

  useEffect(() => {
    const currentLogicalIndex = wrapIndex(virtualIndexRef.current, itemCount)
    if (currentLogicalIndex === value) return

    animationRef.current?.stop()

    let distance = value - currentLogicalIndex
    if (distance > itemCount / 2) distance -= itemCount
    if (distance < -itemCount / 2) distance += itemCount

    const nextVirtualIndex = virtualIndexRef.current + distance
    virtualIndexRef.current = nextVirtualIndex
    y.set(-nextVirtualIndex * itemHeight)
  }, [itemCount, itemHeight, value, y])

  useEffect(() => {
    animationRef.current?.stop()

    const centeredIndex = itemCount + value
    virtualIndexRef.current = centeredIndex
    y.set(-centeredIndex * itemHeight)
  }, [itemCount, itemHeight, y])

  useEffect(() => {
    const container = containerRef.current
    if (!container || disabled) return

    function handleWheel(event) {
      event.preventDefault()
      event.stopPropagation()

      const direction = event.deltaY > 0 ? 1 : -1
      selectVirtualIndex(virtualIndexRef.current + direction)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [disabled, selectVirtualIndex])

  function handleDragEnd(_, info) {
    if (disabled) return

    const projectedY = y.get() + info.velocity.y * 0.2
    const nextVirtualIndex = Math.max(
      0,
      Math.min(itemCount * 3 - 1, Math.round(-projectedY / itemHeight))
    )
    selectVirtualIndex(nextVirtualIndex)
  }

  function handleKeyDown(event) {
    if (disabled) return

    let nextVirtualIndex = virtualIndexRef.current

    switch (event.key) {
      case 'ArrowUp':
        nextVirtualIndex -= 1
        break
      case 'ArrowDown':
        nextVirtualIndex += 1
        break
      case 'Home':
        nextVirtualIndex = itemCount
        break
      case 'End':
        nextVirtualIndex = itemCount * 2 - 1
        break
      case 'PageUp':
        nextVirtualIndex -= 5
        break
      case 'PageDown':
        nextVirtualIndex += 5
        break
      default:
        return
    }

    event.preventDefault()
    selectVirtualIndex(nextVirtualIndex)
  }

  const dragConstraints = useMemo(
    () => ({ top: -(itemCount * 3 - 1) * itemHeight, bottom: 0 }),
    [itemCount, itemHeight]
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-brand-500',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      style={{ height: itemHeight * visibleItems }}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={itemCount - 1}
      aria-valuetext={String(items[value])}
      aria-disabled={disabled}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-linear-to-b from-surface-card/70 to-transparent"
        style={{ height: centerOffset }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-surface-card/70 to-transparent"
        style={{ height: centerOffset }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 z-5 border-y border-brand-200 bg-brand-50/70"
        style={{ top: centerOffset, height: itemHeight }}
        aria-hidden="true"
      />

      <motion.div
        className="relative z-20 cursor-grab touch-none active:cursor-grabbing"
        style={{ y, paddingTop: centerOffset, paddingBottom: centerOffset }}
        drag={disabled ? false : 'y'}
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {circularItems.map(({ item, itemIndex, copyIndex }, virtualIndex) => (
          <WheelItem
            key={`${copyIndex}-${itemIndex}`}
            item={item}
            index={virtualIndex}
            y={y}
            itemHeight={itemHeight}
            visibleItems={visibleItems}
            centerOffset={centerOffset}
            isSelected={itemIndex === value}
            disabled={disabled}
            onClick={() => selectVirtualIndex(virtualIndex)}
          />
        ))}
      </motion.div>
    </div>
  )
}

export function DateWheelPicker({
  value = new Date(),
  onChange,
  minYear = new Date().getFullYear(),
  maxYear = new Date().getFullYear() + 10,
  size = 'md',
  disabled = false,
  locale = 'es-MX',
  className,
  ...props
}) {
  const config = SIZE_CONFIG[size] ?? SIZE_CONFIG.md
  const months = useMemo(() => getMonthNames(locale), [locale])
  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index),
    [maxYear, minYear]
  )
  const days = useMemo(
    () =>
      Array.from(
        { length: getDaysInMonth(value.getFullYear(), value.getMonth()) },
        (_, index) => index + 1
      ),
    [value]
  )
  const yearIndex = Math.max(0, years.indexOf(value.getFullYear()))

  function changeDate({ day = value.getDate(), month = value.getMonth(), year = value.getFullYear() }) {
    const adjustedDay = Math.min(day, getDaysInMonth(year, month))
    onChange(new Date(year, month, adjustedDay))
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        config.gap,
        config.fontSize,
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      style={{ perspective: '1000px' }}
      role="group"
      aria-label="Seleccionar fecha"
      {...props}
    >
      <WheelColumn
        items={days}
        value={value.getDate() - 1}
        onChange={(dayIndex) => changeDate({ day: dayIndex + 1 })}
        itemHeight={config.itemHeight}
        visibleItems={config.visibleItems}
        disabled={disabled}
        className="w-12 sm:w-16"
        ariaLabel="Seleccionar día"
      />
      <WheelColumn
        items={months}
        value={value.getMonth()}
        onChange={(month) => changeDate({ month })}
        itemHeight={config.itemHeight}
        visibleItems={config.visibleItems}
        disabled={disabled}
        className="w-28"
        ariaLabel="Seleccionar mes"
      />
      <WheelColumn
        items={years}
        value={yearIndex}
        onChange={(index) => changeDate({ year: years[index] })}
        itemHeight={config.itemHeight}
        visibleItems={config.visibleItems}
        disabled={disabled}
        className="w-16 sm:w-20"
        ariaLabel="Seleccionar año"
      />
    </div>
  )
}

export default DateWheelPicker
