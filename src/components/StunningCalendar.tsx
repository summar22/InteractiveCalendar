'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Clock, Sun, Moon, Cloud, CloudRain, Wind, MapPin, Plus, X, Edit2, Trash2, Gift, Heart, Star, Sparkles, Palette, Zap, Target, TrendingUp, Users, Bell, Search, Filter, ChevronDown, Maximize2, Minimize2, RefreshCw, PartyPopper, TreePine, Flower2, Waves, Mountain, Trees } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'

interface Event {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  category: 'work' | 'personal' | 'meeting' | 'deadline' | 'social'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  color: string
  location?: string
}

interface Note {
  id: string
  content: string
  date: string
  dateRange?: { start: string; end: string }
  createdAt: string
  type: 'general' | 'date' | 'range'
}

interface Holiday {
  date: string
  name: string
  type: 'national' | 'cultural' | 'seasonal'
  icon: React.ReactNode
  color: string
}

const seasonalImages = [
  {
    month: 0, // January
    image: 'https://images.unsplash.com/photo-1483664852095-d6cc68707d47?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-blue-900 via-purple-900 to-pink-900',
    accent: 'from-blue-400 to-purple-600',
    particles: 'snow'
  },
  {
    month: 1, // February
    image: 'https://images.unsplash.com/photo-1519452575417-567c1a0162e6?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-pink-900 via-red-900 to-purple-900',
    accent: 'from-pink-400 to-red-600',
    particles: 'hearts'
  },
  {
    month: 2, // March
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-green-900 via-teal-900 to-blue-900',
    accent: 'from-green-400 to-teal-600',
    particles: 'flowers'
  },
  {
    month: 3, // April
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-pink-900 via-purple-900 to-indigo-900',
    accent: 'from-pink-400 to-purple-600',
    particles: 'petals'
  },
  {
    month: 4, // May
    image: 'https://images.unsplash.com/photo-1540206395-688085023072?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-green-900 via-emerald-900 to-teal-900',
    accent: 'from-green-400 to-emerald-600',
    particles: 'leaves'
  },
  {
    month: 5, // June
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-yellow-900 via-orange-900 to-red-900',
    accent: 'from-yellow-400 to-orange-600',
    particles: 'sun'
  },
  {
    month: 6, // July
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-blue-900 via-cyan-900 to-teal-900',
    accent: 'from-blue-400 to-cyan-600',
    particles: 'waves'
  },
  {
    month: 7, // August
    image: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-indigo-900 via-purple-900 to-pink-900',
    accent: 'from-indigo-400 to-purple-600',
    particles: 'stars'
  },
  {
    month: 8, // September
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-orange-900 via-red-900 to-yellow-900',
    accent: 'from-orange-400 to-red-600',
    particles: 'leaves'
  },
  {
    month: 9, // October
    image: 'https://images.unsplash.com/photo-1518684079-3c830dcef291?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-orange-900 via-amber-900 to-yellow-900',
    accent: 'from-orange-400 to-amber-600',
    particles: 'pumpkin'
  },
  {
    month: 10, // November
    image: 'https://images.unsplash.com/photo-1519922651849-5e29d4d47d51?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-gray-900 via-slate-900 to-zinc-900',
    accent: 'from-gray-400 to-slate-600',
    particles: 'snow'
  },
  {
    month: 11, // December
    image: 'https://images.unsplash.com/photo-1516992630524-2e6e17554311?w=1200&h=600&fit=crop&auto=format',
    gradient: 'from-red-900 via-green-900 to-red-900',
    accent: 'from-red-400 to-green-600',
    particles: 'snowflakes'
  }
]

const holidays: Holiday[] = [
  { date: '2024-01-01', name: "New Year's Day", type: 'national', icon: <PartyPopper className="w-4 h-4" />, color: 'text-yellow-500' },
  { date: '2024-01-15', name: "Martin Luther King Jr. Day", type: 'national', icon: <Star className="w-4 h-4" />, color: 'text-blue-500' },
  { date: '2024-02-14', name: "Valentine's Day", type: 'cultural', icon: <Heart className="w-4 h-4" />, color: 'text-pink-500' },
  { date: '2024-03-17', name: "St. Patrick's Day", type: 'cultural', icon: <Sparkles className="w-4 h-4" />, color: 'text-green-500' },
  { date: '2024-04-01', name: "April Fool's Day", type: 'cultural', icon: <Zap className="w-4 h-4" />, color: 'text-purple-500' },
  { date: '2024-05-27', name: "Memorial Day", type: 'national', icon: <Star className="w-4 h-4" />, color: 'text-red-500' },
  { date: '2024-07-04', name: "Independence Day", type: 'national', icon: <Star className="w-4 h-4" />, color: 'text-blue-500' },
  { date: '2024-09-02', name: "Labor Day", type: 'national', icon: <Star className="w-4 h-4" />, color: 'text-blue-500' },
  { date: '2024-10-31', name: "Halloween", type: 'cultural', icon: <Sparkles className="w-4 h-4" />, color: 'text-orange-500' },
  { date: '2024-11-28', name: "Thanksgiving", type: 'national', icon: <Heart className="w-4 h-4" />, color: 'text-orange-500' },
  { date: '2024-12-25', name: "Christmas Day", type: 'national', icon: <Gift className="w-4 h-4" />, color: 'text-red-500' },
  { date: '2024-12-31', name: "New Year's Eve", type: 'cultural', icon: <PartyPopper className="w-4 h-4" />, color: 'text-yellow-500' }
]

const categoryColors = {
  work: '#3B82F6',
  personal: '#10B981',
  meeting: '#8B5CF6',
  deadline: '#EF4444',
  social: '#F59E0B'
}

const priorityColors = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#DC2626'
}

export default function StunningCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState<'general' | 'date' | 'range'>('general')
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    category: 'work',
    priority: 'medium',
    color: categoryColors.work,
    location: ''
  })

  const currentSeason = seasonalImages[currentDate.getMonth()]
  const currentTime = new Date()

  useEffect(() => {
    const savedEvents = localStorage.getItem('stunning-calendar-events')
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents))
    }
    
    const savedNotes = localStorage.getItem('stunning-calendar-notes')
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
    
    const savedTheme = localStorage.getItem('stunning-calendar-theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('stunning-calendar-events', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem('stunning-calendar-notes', JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    localStorage.setItem('stunning-calendar-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return events.filter(event => event.date === dateStr)
  }

  const getHolidayForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return holidays.find(holiday => holiday.date === dateStr)
  }

  const addNote = () => {
    if (!newNote.trim()) return

    const note: Note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(currentDate, 'yyyy-MM-dd'),
      dateRange: selectedRange.start && selectedRange.end ? {
        start: format(selectedRange.start, 'yyyy-MM-dd'),
        end: format(selectedRange.end, 'yyyy-MM-dd')
      } : undefined,
      createdAt: new Date().toISOString(),
      type: noteType
    }

    setNotes([...notes, note])
    setNewNote('')
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id))
  }

  const getNotesForCurrentContext = () => {
    if (noteType === 'date' && selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      return notes.filter(note => note.date === dateStr && note.type === 'date')
    } else if (noteType === 'range' && selectedRange.start && selectedRange.end) {
      return notes.filter(note => 
        note.type === 'range' && 
        note.dateRange &&
        note.dateRange.start === format(selectedRange.start!, 'yyyy-MM-dd') &&
        note.dateRange.end === format(selectedRange.end!, 'yyyy-MM-dd')
      )
    } else {
      return notes.filter(note => note.type === 'general')
    }
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

  const createEvent = () => {
    if (!newEvent.title || !selectedDate) return

    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description || '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: newEvent.startTime || '09:00',
      endTime: newEvent.endTime || '10:00',
      category: newEvent.category as Event['category'],
      priority: newEvent.priority as Event['priority'],
      color: categoryColors[newEvent.category as Event['category']],
      location: newEvent.location || ''
    }

    setEvents([...events, event])
    setNewEvent({
      title: '',
      description: '',
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      category: 'work',
      priority: 'medium',
      color: categoryColors.work,
      location: ''
    })
    setShowEventModal(false)
  }

  const deleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id))
  }

  const updateEvent = (updatedEvent: Event) => {
    setEvents(events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ))
    setShowEventModal(false)
    setEditingEvent(null)
  }

  const isInRange = (date: Date) => {
    if (!selectedRange.start || !selectedRange.end) return false
    return date >= selectedRange.start && date <= selectedRange.end
  }

  const isStartOrEnd = (date: Date) => {
    return (selectedRange.start && isSameDay(date, selectedRange.start)) ||
           (selectedRange.end && isSameDay(date, selectedRange.end))
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart)
  const emptyDays = Array(startDayOfWeek).fill(null)

  const ParticleEffect = () => {
    const particles = useMemo(() => {
      const count = 20
      return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (i * 5) % 100,
        y: (i * 7) % 100,
        size: 2 + (i % 3),
        duration: 2 + (i % 2)
      }))
    }, [])

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, particle.x / 10, 0],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.id * 0.1
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSeason.gradient}`} />
      <ParticleEffect />
      
      {/* Glass Container */}
      <div className="relative min-h-screen backdrop-blur-xl">
        {/* Hero Section with Seasonal Image */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative h-96 overflow-hidden"
        >
          <div className="absolute inset-0">
            <img
              src={currentSeason.image}
              alt={format(currentDate, 'MMMM')}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${currentSeason.gradient} opacity-70`} />
          </div>
          
          <div className="relative z-10 h-full flex flex-col justify-between p-8">
            <div className="flex justify-between items-start">
              <div className="text-white">
                <motion.h1
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl font-bold mb-2 drop-shadow-2xl"
                >
                  {format(currentDate, 'MMMM yyyy')}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl opacity-90 drop-shadow-lg"
                >
                  {format(currentTime, 'EEEE, MMMM d, yyyy')}
                </motion.p>
              </div>
              
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-3 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-all duration-300"
              >
                {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </motion.button>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center space-x-8"
            >
              <div className="text-center text-white">
                <div className="text-3xl font-bold">{events.length}</div>
                <div className="text-sm opacity-75">Events</div>
              </div>
              <div className="text-center text-white">
                <div className="text-3xl font-bold">{holidays.filter(h => {
                  const holidayDate = new Date(h.date)
                  return holidayDate.getMonth() === currentDate.getMonth()
                }).length}</div>
                <div className="text-sm opacity-75">Holidays</div>
              </div>
              <div className="text-center text-white">
                <div className="text-3xl font-bold">{monthDays.length}</div>
                <div className="text-sm opacity-75">Days</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Calendar Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="container mx-auto px-4 py-8"
        >
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
              >
                <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowEventModal(true)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Event</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentDate(new Date())}
                    className="w-full py-3 px-4 bg-white/20 backdrop-blur-xl text-white rounded-xl font-medium hover:bg-white/30 transition-all duration-300"
                  >
                    Today
                  </motion.button>
                </div>
              </motion.div>

              {/* Mini Calendar */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
              >
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-white font-semibold">
                    {format(currentDate, 'MMM yyyy')}
                  </span>
                  <button
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={`${day}-${index}`} className="text-center text-white/60">
                      {day}
                    </div>
                  ))}
                  {eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).map(day => (
                    <button
                      key={day.toString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square rounded flex items-center justify-center text-xs text-white
                        ${isToday(day) ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}
                        ${selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-white' : ''}
                        ${!isToday(day) && !(selectedDate && isSameDay(day, selectedDate)) ? 'hover:bg-white/20' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Categories */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
              >
                <h3 className="text-white font-semibold mb-4">Categories</h3>
                <div className="space-y-2">
                  {Object.entries(categoryColors).map(([category, color]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-white capitalize">{category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-sm">
                          {events.filter(e => e.category === category).length}
                        </span>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Main Calendar Grid */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="lg:col-span-3"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                      className="p-3 text-white hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-3xl font-bold text-white">
                      {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <button
                      onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                      className="p-3 text-white hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Weekday Headers */}
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                    <div key={`${day}-${index}`} className="text-center text-white font-semibold py-3">
                      {day}
                    </div>
                  ))}
                  
                  {/* Empty Days */}
                  {emptyDays.map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                  ))}
                  
                  {/* Calendar Days */}
                  {monthDays.map((day, index) => {
                    const dayEvents = getEventsForDate(day)
                    const holiday = getHolidayForDate(day)
                    const isCurrentDay = isToday(day)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const inRange = isInRange(day)
                    const isStartEnd = isStartOrEnd(day)
                    const isHovered = hoveredDate && isSameDay(day, hoveredDate)

                    return (
                      <motion.div
                        key={day.toString()}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        whileHover={{ scale: 1.05, zIndex: 10 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDateClick(day)}
                        onMouseEnter={() => setHoveredDate(day)}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`
                          aspect-square rounded-xl p-2 cursor-pointer transition-all duration-300 relative
                          ${isCurrentDay ? 'ring-2 ring-white' : ''}
                          ${isSelected ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' : ''}
                          ${inRange && !isStartEnd ? 'bg-white/20 text-white' : ''}
                          ${!inRange && !isSelected ? 'bg-white/10 hover:bg-white/20 text-white' : ''}
                          ${isStartEnd ? 'ring-2 ring-yellow-400' : ''}
                          ${isHovered && !isSelected && !inRange ? 'bg-white/30' : ''}
                        `}
                      >
                        <div className="text-sm font-bold mb-1">
                          {format(day, 'd')}
                        </div>
                        
                        {/* Holiday Indicator */}
                        {holiday && (
                          <div className={`absolute top-1 right-1 ${holiday.color}`}>
                            {holiday.icon}
                          </div>
                        )}
                        
                        {/* Events */}
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event, i) => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded truncate text-white"
                              style={{ backgroundColor: event.color }}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-white/80">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>

                        {/* Hover Tooltip */}
                        {isHovered && (holiday || dayEvents.length > 0) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-900 text-white rounded-lg shadow-xl min-w-max"
                          >
                            {holiday && (
                              <div className="flex items-center space-x-2 mb-1">
                                {holiday.icon}
                                <span className="font-semibold">{holiday.name}</span>
                              </div>
                            )}
                            {dayEvents.map(event => (
                              <div key={event.id} className="text-xs">
                                {event.title}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Selected Range Info */}
                {selectedRange.start && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20"
                  >
                    <p className="text-white">
                      {selectedRange.end ? (
                        <>
                          Selected Range: <span className="font-bold">{format(selectedRange.start, 'MMM dd, yyyy')}</span> - <span className="font-bold">{format(selectedRange.end, 'MMM dd, yyyy')}</span>
                          <span className="ml-2">({Math.ceil((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} days)</span>
                        </>
                      ) : (
                        <>
                          Start Date: <span className="font-bold">{format(selectedRange.start, 'MMM dd, yyyy')}</span>
                          <span className="ml-2 opacity-75">Click an end date to complete the range</span>
                        </>
                      )}
                    </p>
                  </motion.div>
                )}

                {/* Integrated Notes Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-6 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-3">Notes</h3>
                    
                    {/* Note Type Selector */}
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={() => setNoteType('general')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          noteType === 'general' 
                            ? 'bg-white/30 text-white' 
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        General
                      </button>
                      <button
                        onClick={() => setNoteType('date')}
                        disabled={!selectedDate}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          noteType === 'date' 
                            ? 'bg-white/30 text-white' 
                            : selectedDate
                              ? 'bg-white/10 text-white/70 hover:bg-white/20'
                              : 'bg-white/5 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        Date Notes
                        {selectedDate && (
                          <span className="ml-1 text-xs">
                            ({format(selectedDate, 'MMM dd')})
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setNoteType('range')}
                        disabled={!selectedRange.start || !selectedRange.end}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          noteType === 'range' 
                            ? 'bg-white/30 text-white' 
                            : selectedRange.start && selectedRange.end
                              ? 'bg-white/10 text-white/70 hover:bg-white/20'
                              : 'bg-white/5 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        Range Notes
                        {selectedRange.start && selectedRange.end && (
                          <span className="ml-1 text-xs">
                            ({format(selectedRange.start, 'MMM dd')} - {format(selectedRange.end, 'MMM dd')})
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Add Note Input */}
                    <div className="flex space-x-2 mb-4">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNote()}
                        placeholder={
                          noteType === 'general' ? "Add a general note..." :
                          noteType === 'date' ? "Add a note for this date..." :
                          "Add a note for this date range..."
                        }
                        className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                      <button
                        onClick={addNote}
                        disabled={!newNote.trim()}
                        className="px-4 py-2 bg-white/20 backdrop-blur-xl text-white rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>

                    {/* Notes Display */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {getNotesForCurrentContext().length > 0 ? (
                        getNotesForCurrentContext().map(note => (
                          <motion.div
                            key={note.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20 group"
                          >
                            <div className="flex justify-between items-start">
                              <p className="text-white text-sm flex-1">{note.content}</p>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="ml-2 p-1 text-white/50 hover:text-white hover:bg-white/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-white/50 mt-1">
                              {note.type === 'general' ? 'General note' :
                               note.type === 'date' ? `Date: ${note.date}` :
                               `Range: ${note.dateRange?.start} - ${note.dateRange?.end}`}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-white/50">
                          <p className="text-sm">
                            {noteType === 'general' ? "No general notes yet. Add one above!" :
                             noteType === 'date' ? "No notes for this date yet. Select a date and add a note!" :
                             "No notes for this date range. Select a range and add a note!"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Event Modal */}
        <AnimatePresence>
          {showEventModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => {
                setShowEventModal(false)
                setEditingEvent(null)
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingEvent ? 'Edit Event' : 'Create Event'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowEventModal(false)
                      setEditingEvent(null)
                    }}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingEvent ? editingEvent.title : newEvent.title}
                      onChange={(e) => editingEvent 
                        ? setEditingEvent({...editingEvent, title: e.target.value})
                        : setNewEvent({...newEvent, title: e.target.value})
                      }
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="Event title"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingEvent ? editingEvent.description : newEvent.description}
                      onChange={(e) => editingEvent
                        ? setEditingEvent({...editingEvent, description: e.target.value})
                        : setNewEvent({...newEvent, description: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="Event description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={editingEvent ? editingEvent.date : (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : newEvent.date)}
                        onChange={(e) => editingEvent
                          ? setEditingEvent({...editingEvent, date: e.target.value})
                          : setNewEvent({...newEvent, date: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Category
                      </label>
                      <select
                        value={editingEvent ? editingEvent.category : newEvent.category}
                        onChange={(e) => editingEvent
                          ? setEditingEvent({...editingEvent, category: e.target.value as Event['category'], color: categoryColors[e.target.value as Event['category']]})
                          : setNewEvent({...newEvent, category: e.target.value as Event['category'], color: categoryColors[e.target.value as Event['category']]})}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                        <option value="meeting">Meeting</option>
                        <option value="deadline">Deadline</option>
                        <option value="social">Social</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={editingEvent ? editingEvent.startTime : newEvent.startTime}
                        onChange={(e) => editingEvent
                          ? setEditingEvent({...editingEvent, startTime: e.target.value})
                          : setNewEvent({...newEvent, startTime: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={editingEvent ? editingEvent.endTime : newEvent.endTime}
                        onChange={(e) => editingEvent
                          ? setEditingEvent({...editingEvent, endTime: e.target.value})
                          : setNewEvent({...newEvent, endTime: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Priority
                    </label>
                    <select
                      value={editingEvent ? editingEvent.priority : newEvent.priority}
                      onChange={(e) => editingEvent
                        ? setEditingEvent({...editingEvent, priority: e.target.value as Event['priority']})
                        : setNewEvent({...newEvent, priority: e.target.value as Event['priority']})}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editingEvent ? editingEvent.location || '' : newEvent.location}
                      onChange={(e) => editingEvent
                        ? setEditingEvent({...editingEvent, location: e.target.value})
                        : setNewEvent({...newEvent, location: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="Event location"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEventModal(false)
                      setEditingEvent(null)
                    }}
                    className="px-6 py-3 bg-white/10 backdrop-blur-xl text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => editingEvent ? updateEvent(editingEvent) : createEvent()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                  >
                    {editingEvent ? 'Update' : 'Create'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
