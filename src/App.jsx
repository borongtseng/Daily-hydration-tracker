import { useEffect, useMemo, useState } from 'react'
import WaterGlass from './WaterGlass.jsx'
import './App.css'

const STORAGE_KEY = 'hydrate.v1'
const DEFAULT_GOAL = 2000
const STEP = 50
const MIN_SLIDER = 50
const MAX_SLIDER = 1000

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function dateKey(year, month1, day) {
  return `${year}-${String(month1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { goal: DEFAULT_GOAL, days: {}, reminderMinutes: 0 }
    return JSON.parse(raw)
  } catch {
    return { goal: DEFAULT_GOAL, days: {}, reminderMinutes: 0 }
  }
}

/* ── Calendar sub-component with month navigation ── */
function CalendarPage({ state, streak }) {
  const today = new Date()
  const [offset, setOffset] = useState(0)   // 0 = current month, -1 = prev, etc.

  const viewDate  = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const year      = viewDate.getFullYear()
  const month     = viewDate.getMonth()     // 0-indexed
  const month1    = month + 1              // 1-indexed
  const monthName = viewDate.toLocaleString('default', { month: 'long' })

  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const todayKey_ = todayKey()
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth()

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const canGoForward = offset < 0

  return (
    <div className="layout">
      <section className="card">
        {/* Month navigation header */}
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={() => setOffset(o => o - 1)}>‹</button>
          <div className="cal-header-center">
            <h2 className="cal-month-title">{monthName} {year}</h2>
            {streak > 0 && isCurrentMonth && (
              <p className="streak-banner">🔥 {streak} day{streak > 1 ? 's' : ''} in a row</p>
            )}
          </div>
          <button
            className="cal-nav-btn"
            onClick={() => setOffset(o => o + 1)}
            style={{ visibility: canGoForward ? 'visible' : 'hidden' }}
          >›</button>
        </div>

        <div className="cal-grid">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <span key={i} className="cal-dow">{d}</span>
          ))}

          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="cal-day empty" />
            const k      = dateKey(year, month1, day)
            const amount = state.days[k] || 0
            const met    = amount >= state.goal
            const isToday = k === todayKey_
            return (
              <div key={k}
                className={`cal-day${met ? ' met' : ''}${isToday ? ' today' : ''}`}
              >
                <span className="cal-date">{day}</span>
                {amount > 0 && (
                  <span className="cal-amount">
                    {amount >= 1000 ? `${(amount/1000).toFixed(1)}L` : `${amount}`}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="cal-legend">
          <span>
            <span className="legend-dot"
              style={{ background: 'rgba(0,174,204,0.25)', border: '1px solid rgba(0,174,204,0.4)' }} />
            Goal reached
          </span>
          <span>
            <span className="legend-dot"
              style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.7)' }} />
            Partial
          </span>
        </div>
      </section>
    </div>
  )
}

/* ── Main app ── */
export default function App() {
  const [state, setState]   = useState(loadState)
  const [slider, setSlider] = useState(250)
  const [page, setPage]     = useState(0)
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  )

  const key       = todayKey()
  const total     = state.days[key] || 0
  const goal      = state.goal
  const percent   = goal > 0 ? total / goal : 0
  const remaining = Math.max(0, goal - total)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (!state.reminderMinutes || notifPermission !== 'granted') return
    const id = setInterval(() => {
      const t = todayKey()
      const have = state.days[t] || 0
      if (have < state.goal) {
        new Notification('Time to hydrate 💧', {
          body: `You're at ${have}ml of your ${state.goal}ml goal.`,
          icon: '/icon-192.png',
        })
      }
    }, state.reminderMinutes * 60 * 1000)
    return () => clearInterval(id)
  }, [state.reminderMinutes, state.goal, state.days, notifPermission])

  function addWater(amount) {
    setState(prev => {
      const t = todayKey()
      return { ...prev, days: { ...prev.days, [t]: (prev.days[t] || 0) + amount } }
    })
  }

  function undoLast() {
    setState(prev => {
      const t = todayKey()
      return { ...prev, days: { ...prev.days, [t]: Math.max(0, (prev.days[t] || 0) - slider) } }
    })
  }

  function requestNotifications() {
    if (typeof Notification === 'undefined') return
    Notification.requestPermission().then(setNotifPermission)
  }

  const streak = useMemo(() => {
    let count = 0
    const d = new Date()
    while (true) {
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      if ((state.days[k] || 0) >= state.goal) {
        count++
        d.setDate(d.getDate() - 1)
      } else break
    }
    return count
  }, [state.days, state.goal])

  const sliderFill = ((slider - MIN_SLIDER) / (MAX_SLIDER - MIN_SLIDER)) * 100
  const sliderBg = `linear-gradient(90deg, var(--aqua) ${sliderFill}%, rgba(0,130,160,0.15) ${sliderFill}%)`

  return (
    <div className="page">
      {/* ── App icon + header ── */}
      <header className="page-header">
        <div className="app-icon-wrap">
          <img src="/icon-192.png" alt="Hydrate icon" className="app-icon" />
        </div>
        <div className="page-header-text">
          <span className="eyebrow">Daily tracker</span>
          <h1>Hydrate 💧</h1>
        </div>
      </header>

      {/* Apple-style segmented control */}
      <div className="seg-wrap">
        <div className={`seg-indicator${page === 1 ? ' right' : ''}`} />
        <button className={`seg-btn${page === 0 ? ' active' : ''}`} onClick={() => setPage(0)}>
          Today
        </button>
        <button className={`seg-btn${page === 1 ? ' active' : ''}`} onClick={() => setPage(1)}>
          Calendar
        </button>
      </div>

      {/* ── TODAY PAGE ── */}
      {page === 0 && (
        <div className="layout">
          <section className="card glass-panel">
            <WaterGlass percent={percent} />
            <div className="totals">
              <span className="total-number">{total}</span>
              <span className="total-unit">ml</span>
            </div>
            <p className="goal-line">
              of {goal}ml goal · {remaining > 0 ? `${remaining}ml to go` : '🎉 goal reached!'}
            </p>
            {streak > 0 && (
              <p className="streak-badge">🔥 {streak} day{streak > 1 ? 's' : ''} in a row</p>
            )}
          </section>

          <section className="card input-panel">
            <label htmlFor="amount-slider" className="slider-label">
              Add water
              <span className="slider-value">{slider}ml</span>
            </label>
            <input
              id="amount-slider"
              type="range"
              min={MIN_SLIDER}
              max={MAX_SLIDER}
              step={STEP}
              value={slider}
              style={{ background: sliderBg }}
              onChange={e => setSlider(Number(e.target.value))}
            />
            <div className="quick-row">
              {[100, 250, 500].map(v => (
                <button
                  key={v}
                  type="button"
                  className={`quick-chip${slider === v ? ' active' : ''}`}
                  onClick={() => setSlider(v)}
                >
                  {v}ml
                </button>
              ))}
            </div>
            <button type="button" className="submit-btn" onClick={() => addWater(slider)}>
              Log {slider}ml
            </button>
            <button type="button" className="undo-btn" onClick={undoLast}>
              Undo last
            </button>
          </section>

          <section className="card settings-panel">
            <details>
              <summary>Settings</summary>
              <div className="settings-body">
                <label className="settings-row">
                  Daily goal (ml)
                  <input
                    type="number"
                    min={500}
                    step={50}
                    value={goal}
                    onChange={e => setState(p => ({ ...p, goal: Number(e.target.value) }))}
                  />
                </label>
                <label className="settings-row">
                  Reminder while app is open
                  <select
                    value={state.reminderMinutes}
                    onChange={e => setState(p => ({ ...p, reminderMinutes: Number(e.target.value) }))}
                  >
                    <option value={0}>Off</option>
                    <option value={30}>Every 30 min</option>
                    <option value={60}>Every hour</option>
                    <option value={120}>Every 2 hours</option>
                  </select>
                </label>
                {notifPermission !== 'granted' && (
                  <button type="button" className="permission-btn" onClick={requestNotifications}>
                    Allow notifications
                  </button>
                )}
                <p className="fine-print">
                  Reminder only fires while this app is open (iOS limitation for web apps).
                  For background alerts, use iOS Shortcuts or ask about adding a push backend.
                </p>
              </div>
            </details>
          </section>
        </div>
      )}

      {/* ── CALENDAR PAGE ── */}
      {page === 1 && <CalendarPage state={state} streak={streak} />}
    </div>
  )
}
