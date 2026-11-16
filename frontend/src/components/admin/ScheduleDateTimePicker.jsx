import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, ChevronDown, Check, RotateCw } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const pad2 = (n) => String(n).padStart(2, '0');

const parseIsoLocal = (val) => {
  if (!val || typeof val !== 'string' || !val.includes('T')) {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now;
  }
  const [datePart, timePart] = val.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = (timePart || '12:00').split(':').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
  return isNaN(dt.getTime()) ? new Date() : dt;
};

const toIsoLocal = (dt) => {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
};

export default function ScheduleDateTimePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [timerMode, setTimerMode] = useState('dial'); /* 'dial' | 'wheel' */
  const [dialFocus, setDialFocus] = useState('hour'); /* 'hour' | 'minute' */
  const containerRef = useRef(null);

  const selectedDate = parseIsoLocal(value);
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  useEffect(() => {
    const dt = parseIsoLocal(value);
    setViewYear(dt.getFullYear());
    setViewMonth(dt.getMonth());
  }, [value]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const hours24 = selectedDate.getHours();
  const minutes = selectedDate.getMinutes();
  const isPm = hours24 >= 12;
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  const commitDate = (nextDt) => {
    if (onChange) onChange(toIsoLocal(nextDt));
  };

  const handleSelectDay = (day) => {
    const next = new Date(selectedDate);
    next.setFullYear(viewYear, viewMonth, day);
    commitDate(next);
  };

  const handleSetHour12 = (h12) => {
    const next = new Date(selectedDate);
    let h24 = h12 % 12;
    if (isPm) h24 += 12;
    next.setHours(h24);
    commitDate(next);
  };

  const handleSetMinute = (min) => {
    const next = new Date(selectedDate);
    next.setMinutes((min + 60) % 60);
    commitDate(next);
  };

  const handleToggleAmPm = (targetPm) => {
    if (targetPm === isPm) return;
    const next = new Date(selectedDate);
    const currentH = next.getHours();
    next.setHours(targetPm ? (currentH + 12) % 24 : (currentH + 12) % 24);
    commitDate(next);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  /* Build Calendar Days */
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const today = new Date();
  const formattedTrigger = `${selectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })} • ${pad2(hour12)}:${pad2(minutes)} ${isPm ? 'PM' : 'AM'}`;

  /* Rotary Clock Dial Geometry */
  const dialValues = dialFocus === 'hour'
    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const activeAngleDeg = dialFocus === 'hour'
    ? (hour12 % 12) * 30
    : minutes * 6;

  return (
    <div ref={containerRef} className="relative">
      {/* Main Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-white text-xs flex items-center justify-between transition ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
            : 'border-slate-800 hover:border-indigo-500/60'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold tracking-wide text-slate-100">{formattedTrigger}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-indigo-400">
          <Clock className="w-3.5 h-3.5" />
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Pop-Out Interactive Calendar & Rotating Dial Timer */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-full sm:w-[500px] p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-2xl shadow-black/70 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                Interactive Date &amp; Rotary Timer
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setTimerMode('dial')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                  timerMode === 'dial' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Rotary Dial
              </button>
              <button
                type="button"
                onClick={() => setTimerMode('wheel')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                  timerMode === 'wheel' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Spinner Wheel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
            {/* Left 6 Cols: Interactive Month Calendar */}
            <div className="sm:col-span-6 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-white">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((wd) => (
                  <span key={wd} className="text-[10px] font-bold text-slate-500 py-0.5">
                    {wd}
                  </span>
                ))}
                {calendarCells.map((day, idx) => {
                  if (!day) return <span key={`empty_${idx}`} />;
                  const isSelected =
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === viewMonth &&
                    selectedDate.getFullYear() === viewYear;
                  const isToday =
                    today.getDate() === day &&
                    today.getMonth() === viewMonth &&
                    today.getFullYear() === viewYear;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`h-7 rounded-lg text-[11px] font-semibold transition flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/40'
                          : isToday
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Quick Date Shortcuts */}
              <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const n = new Date();
                    n.setHours(hours24, minutes, 0, 0);
                    commitDate(n);
                  }}
                  className="flex-1 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-indigo-300 transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const n = new Date();
                    n.setDate(n.getDate() + 1);
                    n.setHours(hours24, minutes, 0, 0);
                    commitDate(n);
                  }}
                  className="flex-1 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-indigo-300 transition"
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* Right 6 Cols: Rotating Analog Clock / Spinner Wheel */}
            <div className="sm:col-span-6 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              {/* Digital Readout & Hour/Minute Focus + AM/PM */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1 font-mono">
                  <button
                    type="button"
                    onClick={() => setDialFocus('hour')}
                    className={`px-2 py-1 rounded-lg text-sm font-black transition ${
                      dialFocus === 'hour'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-300 hover:text-white'
                    }`}
                  >
                    {pad2(hour12)}
                  </button>
                  <span className="text-slate-500 font-bold">:</span>
                  <button
                    type="button"
                    onClick={() => setDialFocus('minute')}
                    className={`px-2 py-1 rounded-lg text-sm font-black transition ${
                      dialFocus === 'minute'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-300 hover:text-white'
                    }`}
                  >
                    {pad2(minutes)}
                  </button>
                </div>

                <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleToggleAmPm(false)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                      !isPm ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAmPm(true)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                      isPm ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {timerMode === 'dial' ? (
                /* Interactive Rotating Analog Clock Face */
                <div className="relative w-44 h-44 mx-auto rounded-full bg-slate-900 border border-slate-800 shadow-inner flex items-center justify-center select-none">
                  {/* Rotating Clock Hand */}
                  <div
                    className="absolute left-1/2 bottom-1/2 w-0.5 h-[62px] bg-indigo-500 origin-bottom transition-transform duration-300 rounded-full pointer-events-none"
                    style={{ transform: `translateX(-50%) rotate(${activeAngleDeg}deg)` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 border-2 border-white -ml-1 -mt-1 shadow-md shadow-indigo-500/50" />
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 z-10 pointer-events-none" />

                  {/* 12 Circular Tick Buttons */}
                  {dialValues.map((val, idx) => {
                    const angleRad = ((idx * 30 - 90) * Math.PI) / 180;
                    const radius = 66;
                    const x = Math.cos(angleRad) * radius;
                    const y = Math.sin(angleRad) * radius;
                    const isSelectedVal =
                      dialFocus === 'hour' ? hour12 === val : minutes === val;

                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          if (dialFocus === 'hour') {
                            handleSetHour12(val);
                            setDialFocus('minute');
                          } else {
                            handleSetMinute(val);
                          }
                        }}
                        style={{
                          transform: `translate(${x}px, ${y}px)`
                        }}
                        className={`absolute w-7 h-7 rounded-full text-[11px] font-mono font-bold flex items-center justify-center transition ${
                          isSelectedVal
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110 z-20'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {dialFocus === 'hour' ? val : pad2(val)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Scrollable / Rotary Spinner Wheel Controls */
                <div className="grid grid-cols-2 gap-2 py-2">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Hour</span>
                    <button
                      type="button"
                      onClick={() => handleSetHour12(hour12 === 12 ? 1 : hour12 + 1)}
                      className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                    >
                      +
                    </button>
                    <span className="text-lg font-black font-mono text-indigo-300">{pad2(hour12)}</span>
                    <button
                      type="button"
                      onClick={() => handleSetHour12(hour12 === 1 ? 12 : hour12 - 1)}
                      className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                    >
                      -
                    </button>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Minute</span>
                    <button
                      type="button"
                      onClick={() => handleSetMinute(minutes + 5)}
                      className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                    >
                      +5
                    </button>
                    <span className="text-lg font-black font-mono text-indigo-300">{pad2(minutes)}</span>
                    <button
                      type="button"
                      onClick={() => handleSetMinute(minutes - 5)}
                      className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                    >
                      -5
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Time Presets */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                {[
                  { label: '10 AM', h: 10, m: 0 },
                  { label: '3 PM', h: 15, m: 0 },
                  { label: '9 PM', h: 21, m: 0 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const n = new Date(selectedDate);
                      n.setHours(preset.h, preset.m, 0, 0);
                      commitDate(n);
                    }}
                    className="py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Set Schedule Time</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

