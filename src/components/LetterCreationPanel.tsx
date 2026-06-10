import { useState, useMemo, useRef, useEffect, useCallback } from 'react'

interface LetterCreationPanelProps {
  onSave: (letter: { recipient: string; content: string; unlockDate: string }) => void
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate()
}

function toISO(month: number, day: number, year: number) {
  return new Date(year, month - 1, day, 12, 0, 0).toISOString()
}

function WheelColumn({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const ITEM_H = 36
  const VISIBLE = 5
  const CONTAINER_H = VISIBLE * ITEM_H
  const PAD_H = (CONTAINER_H - ITEM_H) / 2

  useEffect(() => {
    if (!listRef.current || !value) return
    const idx = options.findIndex(o => o.value === value)
    if (idx >= 0) listRef.current.scrollTop = idx * ITEM_H
  }, [options, value])

  const handleScroll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!listRef.current) return
      const idx = Math.round(listRef.current.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(idx, options.length - 1))
      const opt = options[clamped]
      if (opt && opt.value !== value) onChange(opt.value)
    }, 80)
  }, [options, value, onChange])

  return (
    <div className="flex-1 relative overflow-hidden" style={{ height: CONTAINER_H }}>
      <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-9 bg-accent/5 rounded z-10 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 z-10 pointer-events-none" style={{ height: PAD_H, background: 'linear-gradient(to bottom, #F7F4EF 0%, transparent 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ height: PAD_H, background: 'linear-gradient(to top, #F7F4EF 0%, transparent 100%)' }} />
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ height: PAD_H }} />
        {options.map(o => (
          <div key={o.value} className="h-9 snap-center flex items-center justify-center px-1">
            <span className="text-sm text-accent truncate leading-none">{o.label}</span>
          </div>
        ))}
        <div style={{ height: PAD_H }} />
      </div>
    </div>
  )
}

export default function LetterCreationPanel({ onSave }: LetterCreationPanelProps) {
  const [recipient, setRecipient] = useState('')
  const [content, setContent] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')
  const [pickMode, setPickMode] = useState<'date' | 'time'>('date')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')

  const currentYear = new Date().getFullYear()
  const years = useMemo(() => Array.from({ length: 11 }, (_, i) => currentYear + i), [currentYear])

  const m = Number(month)
  const y = Number(year)
  const maxDay = month && year ? daysInMonth(m, y) : 31
  const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay])

  const monthOptions = useMemo(
    () => MONTHS.map((name, i) => ({ value: String(i + 1), label: name })),
    [],
  )
  const dayOptions = useMemo(
    () => days.map(d => ({ value: String(d), label: String(d).padStart(2, '0') })),
    [days],
  )
  const yearOptions = useMemo(
    () => years.map(y => ({ value: String(y), label: String(y) })),
    [years],
  )

  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: String(i).padStart(2, '0') })),
    [],
  )
  const minuteOptions = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({ value: String(i), label: String(i).padStart(2, '0') })),
    [],
  )

  const charCount = content.length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!recipient.trim() || !content.trim()) {
      setError('All fields are required.')
      return
    }

    if (pickMode === 'date') {
      if (!month || !day || !year) {
        setError('All fields are required.')
        return
      }

      const mNum = Number(month)
      const dNum = Number(day)
      const yNum = Number(year)
      const selected = new Date(yNum, mNum - 1, dNum)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selected <= today) {
        setError('Unlock date must be in the future.')
        return
      }

      onSave({
        recipient: recipient.trim(),
        content: content.trim(),
        unlockDate: toISO(mNum, dNum, yNum),
      })
    } else {
      if (!hours || !minutes) {
        setError('All fields are required.')
        return
      }

      const hNum = Number(hours)
      const minNum = Number(minutes)
      if (hNum === 0 && minNum === 0) {
        setError('Unlock time must be at least 1 minute in the future.')
        return
      }

      onSave({
        recipient: recipient.trim(),
        content: content.trim(),
        unlockDate: new Date(Date.now() + hNum * 3600000 + minNum * 60000).toISOString(),
      })
    }

    setRecipient('')
    setContent('')
    setMonth('')
    setDay('')
    setYear('')
    setHours('')
    setMinutes('')
  }

  const handleMonthChange = (v: string) => { setMonth(v); setDay('') }
  const handleYearChange = (v: string) => { setYear(v); setDay('') }

  return (
    <div className="paper-card rounded-lg p-6 md:p-8">
      <h2 className="font-heading text-2xl text-accent mb-6">Write a Letter</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Recipient */}
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-text-secondary mb-1.5">
            To
          </label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Dear future me..."
            className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition-all"
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-text-secondary mb-1.5">
            Message
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="To Sarah on her birthday..."
            rows={6}
            className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm placeholder:text-text-secondary/30 resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition-all"
          />
          <div className="text-xs text-text-secondary/40 mt-1 text-right">{charCount} characters</div>
        </div>

        {/* Unlock */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Unlocks
          </label>

          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border mb-3">
            <button
              type="button"
              onClick={() => { setPickMode('date'); setHours(''); setMinutes('') }}
              className={`flex-1 py-2 text-xs font-medium tracking-wide transition-colors ${
                pickMode === 'date'
                  ? 'bg-accent text-[#F7F4EF]'
                  : 'bg-bg text-text-secondary hover:text-accent'
              }`}
            >
              Date
            </button>
            <button
              type="button"
              onClick={() => { setPickMode('time'); setMonth(''); setDay(''); setYear('') }}
              className={`flex-1 py-2 text-xs font-medium tracking-wide transition-colors ${
                pickMode === 'time'
                  ? 'bg-accent text-[#F7F4EF]'
                  : 'bg-bg text-text-secondary hover:text-accent'
              }`}
            >
              Time
            </button>
          </div>

          {/* Mobile: iOS-style wheel picker */}
          <div className="md:hidden border border-border rounded-lg overflow-hidden bg-bg">
            {pickMode === 'date' ? (
              <div className="flex">
                <WheelColumn options={monthOptions} value={month} onChange={handleMonthChange} />
                <div className="w-px bg-border shrink-0" />
                <WheelColumn options={dayOptions} value={day} onChange={setDay} />
                <div className="w-px bg-border shrink-0" />
                <WheelColumn options={yearOptions} value={year} onChange={handleYearChange} />
              </div>
            ) : (
              <div className="flex">
                <WheelColumn options={hourOptions} value={hours} onChange={setHours} />
                <div className="w-px bg-border shrink-0" />
                <WheelColumn options={minuteOptions} value={minutes} onChange={setMinutes} />
              </div>
            )}
          </div>

          {/* Desktop: native selects styled to match theme */}
          <div className="hidden md:flex gap-0 border border-border rounded-lg overflow-hidden bg-bg">
            {pickMode === 'date' ? (
              <>
                <select
                  value={month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-3 text-sm text-accent bg-transparent border-r border-border appearance-none text-center focus:outline-none focus:bg-accent/5 transition-colors cursor-pointer"
                >
                  <option value="" disabled>Month</option>
                  {monthOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-16 px-1 py-3 text-sm text-accent bg-transparent border-r border-border appearance-none text-center focus:outline-none focus:bg-accent/5 transition-colors cursor-pointer"
                >
                  <option value="" disabled>Day</option>
                  {dayOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-3 text-sm text-accent bg-transparent appearance-none text-center focus:outline-none focus:bg-accent/5 transition-colors cursor-pointer"
                >
                  <option value="" disabled>Year</option>
                  {yearOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <select
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-3 text-sm text-accent bg-transparent border-r border-border appearance-none text-center focus:outline-none focus:bg-accent/5 transition-colors cursor-pointer"
                >
                  <option value="" disabled>Hours</option>
                  {hourOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-3 text-sm text-accent bg-transparent appearance-none text-center focus:outline-none focus:bg-accent/5 transition-colors cursor-pointer"
                >
                  <option value="" disabled>Minutes</option>
                  {minuteOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-error text-sm">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 bg-accent text-[#F7F4EF] rounded-lg text-sm font-medium tracking-wide hover:bg-accent-hover transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          Save Letter
        </button>
      </form>
    </div>
  )
}
