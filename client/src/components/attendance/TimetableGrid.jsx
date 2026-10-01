import { FaClock } from 'react-icons/fa'

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const slots = Array.from({ length: 8 }, (_, index) => index + 1)

export default function TimetableGrid({ entries = [], title = 'Weekly routine', compact = false }) {
  const periods = entries.length
    ? [...new Set(entries.map(item => Number(item.period)).filter(Boolean))].sort((a, b) => a - b)
    : slots
  const bySlot = (day, period) => entries.find(item =>
    Number(item.dayOfWeek) === day && Number(item.period) === period
  )

  return <div className="card overflow-hidden">
    {title && <div className="p-4 border-b dark:border-gray-700"><h2 className="font-bold">{title}</h2><p className="text-xs text-gray-500 mt-1">Weekly subject, teacher, and room assignments</p></div>}
    <div className="overflow-x-auto">
      <div className={`min-w-[860px] grid grid-cols-[86px_repeat(7,minmax(110px,1fr))] ${compact ? 'text-xs' : 'text-sm'}`}>
        <div className="p-3 bg-slate-50 dark:bg-gray-800/60 border-b border-r dark:border-gray-700 font-semibold">Period</div>
        {DAYS.map(day => <div key={day} className="p-3 bg-slate-50 dark:bg-gray-800/60 border-b dark:border-gray-700 font-semibold text-center">{day.slice(0, 3)}<span className="hidden sm:inline">{day.slice(3)}</span></div>)}
        {periods.map(period => <div key={period} className="contents">
          <div className="min-h-[92px] p-3 border-b border-r dark:border-gray-700 font-semibold text-gray-500">P{period}</div>
          {DAYS.map((day, dayIndex) => {
            const item = bySlot(dayIndex, period)
            return <div key={`${day}-${period}`} className="min-h-[92px] p-2 border-b dark:border-gray-700">
              {item ? <div className="h-full rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 p-2">
                <p className="font-bold text-primary-700 dark:text-primary-300 truncate">{item.subject}</p>
                <p className="text-gray-600 dark:text-gray-300 truncate">{item.academicClass?.name || 'Class'}{item.section ? ` · ${item.section}` : ''}</p>
                <p className="text-gray-500 truncate">{item.teacher?.name || 'Teacher'}</p>
                {item.date && <p className="text-[11px] text-gray-400 truncate">{new Date(item.date).toLocaleDateString()}</p>}
                {(item.startsAt || item.room) && <p className="text-[11px] text-gray-400 mt-1 flex gap-1 items-center truncate"><FaClock size={9}/>{item.startsAt && `${item.startsAt}-${item.endsAt}`}{item.room && ` · ${item.room}`}</p>}
              </div> : <span className="text-gray-300 dark:text-gray-600">—</span>}
            </div>
          })}
        </div>)}
      </div>
    </div>
    {!entries.length && <p className="p-8 text-center text-sm text-gray-400">No timetable entries found for this view.</p>}
  </div>
}
