'use client'

import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Pencil, Sun, Moon, Sparkles, Gift, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Note {
  id: string
  date: string
  content: string
  createdAt: string
}

interface Holiday {
  date: string
  name: string
  type: 'national' | 'cultural' | 'personal'
}

const holidays: Holiday[] = [
  { date: '2024-01-01', name: "New Year's Day", type: 'national' },
  { date: '2024-02-14', name: "Valentine's Day", type: 'cultural' },
  { date: '2024-07-04', name: "Independence Day", type: 'national' },
  { date: '2024-12-25', name: "Christmas Day", type: 'national' },
]

const monthImages = [
  'https://images.unsplash.com/photo-150690595346-21bda4d32df4?w=800&h=400&fit=crop', // January - Winter mountains
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=400&fit=crop', // February - Winter forest
  'https://images.unsplash.com/photo-1520969315666-1ba6e1b55007?w=800&h=400&fit=crop', // March - Spring flowers
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop', // April - Spring landscape
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=400&fit=crop', // May - Spring meadow
  'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&h=400&fit=crop', // June - Summer beach
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop', // July - Summer mountains
  'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=800&h=400&fit=crop', // August - Summer lake
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop', // September - Autumn forest
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=400&fit=crop', // October - Autumn leaves
  'https://images.unsplash.com/photo-1517524285299-d3c5b3cfaa5b?w=800&h=400&fit=crop', // November - Autumn path
  'https://images.unsplash.com/photo-1516992630524-2e6e17554311?w=800&h=400&fit=crop', // December - Winter wonderland
]

export default function InteractiveCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    const savedNotes = localStorage.getItem('calendar-notes')
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
    
    const savedTheme = localStorage.getItem('calendar-theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('calendar-notes', JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    localStorage.setItem('calendar-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart)
  const emptyDays = Array(startDayOfWeek).fill(null)

  const handlePrevMonth = () => {
    setIsFlipping(true)
    setTimeout(() => {
      setCurrentDate(subMonths(currentDate, 1))
      setIsFlipping(false)
    }, 300)
  }

  const handleNextMonth = () => {
    setIsFlipping(true)
    setTimeout(() => {
      setCurrentDate(addMonths(currentDate, 1))
      setIsFlipping(false)
    }, 300)
  }

  const handleDateClick = (date: Date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date, end: null })
      setSelectedDate(date)
    } else if (selectedRange.start && !selectedRange.end) {
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start })
      } else {
        setSelectedRange({ start: selectedRange.start, end: date })
      }
      setSelectedDate(null)
    }
  }

  const handleDateHover = (date: Date) => {
    setHoveredDate(date)
  }

  const isInRange = (date: Date) => {
    if (!selectedRange.start || !selectedRange.end) return false
    return date >= selectedRange.start && date <= selectedRange.end
  }

  const isStartOrEnd = (date: Date) => {
    return (selectedRange.start && isSameDay(date, selectedRange.start)) ||
           (selectedRange.end && isSameDay(date, selectedRange.end))
  }

  const isHoverInRange = (date: Date) => {
    if (!selectedRange.start || selectedRange.end || !hoveredDate) return false
    return date >= selectedRange.start && date <= hoveredDate
  }

  const addNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(currentDate, 'yyyy-MM-dd'),
        content: newNote.trim(),
        createdAt: new Date().toISOString()
      }
      setNotes([...notes, note])
      setNewNote('')
    }
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id))
  }

  const getNotesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return notes.filter(note => note.date === dateStr)
  }

  const getHolidayForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return holidays.find(holiday => holiday.date === dateStr)
  }

  const getMonthImage = () => {
    return monthImages[currentDate.getMonth()]
  }

  const getHolidayIcon = (type: string) => {
    switch (type) {
      case 'national': return <Gift className="w-3 h-3" />
      case 'cultural': return <Heart className="w-3 h-3" />
      default: return <Sparkles className="w-3 h-3" />
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Calendar className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Interactive Wall Calendar
            </h1>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' : 'bg-gray-800 text-yellow-400 hover:bg-gray-700'}`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Main Calendar Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Hero Image Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl shadow-2xl"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentDate.getMonth()}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  src={getMonthImage()}
                  alt={format(currentDate, 'MMMM')}
                  className="w-full h-64 object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
                <p className="text-sm opacity-90">Click dates to select a range</p>
              </div>
            </motion.div>

            {/* Notes Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`mt-6 p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Pencil className="w-5 h-5 mr-2" />
                  Notes
                </h3>
                {selectedDate && (
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {format(selectedDate, 'MMM dd, yyyy')}
                  </span>
                )}
              </div>
              
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {notes
                  .filter(note => !selectedDate || note.date === format(selectedDate, 'yyyy-MM-dd'))
                  .map(note => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} group`}
                    >
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{note.content}</p>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}
                        >
                          ×
                        </button>
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {note.date}
                      </p>
                    </motion.div>
                  ))}
                {notes.filter(note => !selectedDate || note.date === format(selectedDate, 'yyyy-MM-dd')).length === 0 && (
                  <p className={`text-center py-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    No notes yet. Add one below!
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNote()}
                  placeholder="Add a note..."
                  className={`flex-1 px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  onClick={addNote}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </motion.div>
          </div>

          {/* Calendar Grid */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`lg:col-span-2 p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevMonth}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button
                onClick={handleNextMonth}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className={`text-center text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty Days */}
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}
              
              {/* Month Days */}
              {monthDays.map((day, index) => {
                const notes = getNotesForDate(day)
                const holiday = getHolidayForDate(day)
                const isSelected = isStartOrEnd(day)
                const inRange = isInRange(day)
                const hoverInRange = isHoverInRange(day)
                const isCurrentDay = isToday(day)
                
                return (
                  <motion.button
                    key={day.toString()}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDateClick(day)}
                    onMouseEnter={() => handleDateHover(day)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`
                      aspect-square rounded-lg p-2 relative transition-all duration-200
                      ${isSelected ? 'bg-blue-500 text-white shadow-lg' : ''}
                      ${inRange && !isSelected ? 'bg-blue-100 text-blue-800' : ''}
                      ${hoverInRange && !inRange && !isSelected ? 'bg-blue-50' : ''}
                      ${!inRange && !hoverInRange && !isSelected ? (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700') : ''}
                      ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}
                      ${isCurrentDay && !isSelected ? 'ring-2 ring-blue-400' : ''}
                    `}
                  >
                    <div className="text-sm font-medium">
                      {format(day, 'd')}
                    </div>
                    
                    {/* Holiday Indicator */}
                    {holiday && (
                      <div className={`absolute top-1 right-1 ${holiday.type === 'national' ? 'text-red-500' : holiday.type === 'cultural' ? 'text-pink-500' : 'text-purple-500'}`}>
                        {getHolidayIcon(holiday.type)}
                      </div>
                    )}
                    
                    {/* Notes Indicator */}
                    {notes.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {notes.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-yellow-400 rounded-full" />
                        ))}
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Selected Range Info */}
            {selectedRange.start && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}
              >
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedRange.end ? (
                    <>
                      Selected Range: <span className="font-semibold">{format(selectedRange.start, 'MMM dd, yyyy')}</span> - <span className="font-semibold">{format(selectedRange.end, 'MMM dd, yyyy')}</span>
                      <span className="ml-2">({Math.ceil((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} days)</span>
                    </>
                  ) : (
                    <>
                      Start Date: <span className="font-semibold">{format(selectedRange.start, 'MMM dd, yyyy')}</span>
                      <span className="ml-2 text-gray-500">Click an end date to complete the range</span>
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
