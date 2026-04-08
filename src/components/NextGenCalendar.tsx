'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isToday, startOfWeek, endOfWeek, eachWeekOfInterval, addDays, differenceInDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Clock, Cloud, Sun, Moon, CloudRain, Wind, MapPin, Settings, Download, Upload, BarChart3, Grid3x3, List, Plus, X, Edit2, Trash2, Save, Eye, EyeOff, Palette, Zap, Target, TrendingUp, Users, Bell, Search, Filter, ChevronDown, Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence, useDragControls, useMotionValue, useAnimation, PanInfo } from 'framer-motion'
import { useDndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useHotkeys } from 'react-hotkeys-hook'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import getHolidays from 'date-holidays'

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
  reminders: string[]
  attendees?: string[]
  location?: string
  isRecurring?: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

interface ViewMode {
  type: 'month' | 'week' | 'day' | 'agenda'
  label: string
  icon: React.ReactNode
}

interface WeatherData {
  temp: number
  condition: string
  humidity: number
  windSpeed: number
  location: string
}

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

const viewModes: ViewMode[] = [
  { type: 'month', label: 'Month', icon: <Grid3x3 className="w-4 h-4" /> },
  { type: 'week', label: 'Week', icon: <List className="w-4 h-4" /> },
  { type: 'day', label: 'Day', icon: <Calendar className="w-4 h-4" /> },
  { type: 'agenda', label: 'Agenda', icon: <BarChart3 className="w-4 h-4" /> }
]

const weatherConditions = {
  sunny: { icon: Sun, color: 'text-yellow-500' },
  cloudy: { icon: Cloud, color: 'text-gray-500' },
  rainy: { icon: CloudRain, color: 'text-blue-500' },
  windy: { icon: Wind, color: 'text-teal-500' }
}

export default function NextGenCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(viewModes[0])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [draggedDate, setDraggedDate] = useState<Date | null>(null)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    category: 'work',
    priority: 'medium',
    color: categoryColors.work,
    reminders: [],
    attendees: [],
    location: ''
  })

  const holidays = useMemo(() => {
    const hd = new getHolidays()
    hd.init('US')
    return hd.getHolidays(currentDate.getFullYear())
  }, [currentDate])

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load data from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('nextgen-calendar-events')
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents))
    }
    
    const savedTheme = localStorage.getItem('nextgen-calendar-theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
    }
  }, [])

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem('nextgen-calendar-events', JSON.stringify(events))
  }, [events])

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('nextgen-calendar-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // Mock weather data
  useEffect(() => {
    const mockWeather: WeatherData = {
      temp: 72,
      condition: 'sunny',
      humidity: 65,
      windSpeed: 8,
      location: 'San Francisco, CA'
    }
    setWeather(mockWeather)
  }, [])

  // Keyboard shortcuts
  useHotkeys('ctrl+n', () => {
    setShowEventModal(true)
    setEditingEvent(null)
  }, [setShowEventModal, setEditingEvent])

  useHotkeys('ctrl+d', () => {
    setIsDarkMode(!isDarkMode)
  }, [isDarkMode])

  useHotkeys('ctrl+f', () => {
    document.getElementById('search-input')?.focus()
  }, [])

  useHotkeys('escape', () => {
    setShowEventModal(false)
    setShowSettings(false)
    setShowAnalytics(false)
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const draggedEventId = active.id as string
    const targetDate = over.id as string

    setEvents(prev => prev.map(event => 
      event.id === draggedEventId 
        ? { ...event, date: targetDate }
        : event
    ))
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
      reminders: newEvent.reminders || [],
      attendees: newEvent.attendees || [],
      location: newEvent.location || '',
      isRecurring: false
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
      reminders: [],
      attendees: [],
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

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return events.filter(event => event.date === dateStr)
  }

  const getFilteredEvents = () => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = filterCategory === 'all' || event.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }

  const getAnalyticsData = () => {
    const categoryData = Object.entries(categoryColors).map(([category, color]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: events.filter(e => e.category === category).length,
      color
    }))

    const priorityData = Object.entries(priorityColors).map(([priority, color]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: events.filter(e => e.priority === priority).length,
      color
    }))

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthEvents = events.filter(e => {
        const eventDate = new Date(e.date)
        return eventDate.getMonth() === i && eventDate.getFullYear() === currentDate.getFullYear()
      })
      return {
        month: format(new Date(currentDate.getFullYear(), i, 1), 'MMM'),
        events: monthEvents.length
      }
    })

    return { categoryData, priorityData, monthlyData }
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDayOfWeek = getDay(monthStart)
    const emptyDays = Array(startDayOfWeek).fill(null)

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={`${day}-${index}`} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 p-2">
            {day}
          </div>
        ))}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {monthDays.map((day, index) => {
          const dayEvents = getEventsForDate(day)
          const isCurrentDay = isToday(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const hasHoliday = holidays.some(h => isSameDay(new Date(h.date), day))

          return (
            <motion.div
              key={day.toString()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.01 }}
              whileHover={{ scale: 1.02 }}
              className={`
                aspect-square p-1 rounded-lg border transition-all duration-200 cursor-pointer
                ${isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}
                ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                ${isSelected ? 'bg-blue-500 text-white' : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-900'}
              `}
              onClick={() => setSelectedDate(day)}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              {hasHoliday && (
                <div className="text-xs text-red-500">Holiday</div>
              )}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, i) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded truncate"
                    style={{ backgroundColor: event.color + '20', color: event.color }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return (
      <div className="grid grid-cols-8 gap-2">
        <div className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
          Time
        </div>
        {weekDays.map(day => (
          <div key={day.toString()} className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
            {format(day, 'EEE')}
            <div className={isToday(day) ? 'text-blue-500' : ''}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
        {Array.from({ length: 24 }, (_, hour) => (
          <React.Fragment key={hour}>
            <div className="text-xs text-gray-500 dark:text-gray-400 pr-2">
              {format(new Date().setHours(hour, 0), 'ha')}
            </div>
            {weekDays.map(day => {
              const dayEvents = getEventsForDate(day).filter(event => {
                const eventHour = parseInt(event.startTime.split(':')[0])
                return eventHour === hour
              })

              return (
                <div
                  key={`${day}-${hour}`}
                  className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} min-h-[60px] p-1`}
                >
                  {dayEvents.map(event => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs p-1 rounded mb-1 cursor-pointer"
                      style={{ backgroundColor: event.color + '20', color: event.color }}
                      onClick={() => {
                        setEditingEvent(event)
                        setShowEventModal(true)
                      }}
                    >
                      {event.title}
                    </motion.div>
                  ))}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate)

    return (
      <div className="space-y-2">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
          {isToday(currentDate) && <div className="text-blue-500">Today</div>}
        </div>
        {Array.from({ length: 24 }, (_, hour) => {
          const hourEvents = dayEvents.filter(event => {
            const eventHour = parseInt(event.startTime.split(':')[0])
            return eventHour === hour
          })

          return (
            <div key={hour} className={`flex border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} py-2`}>
              <div className="w-20 text-sm text-gray-500 dark:text-gray-400">
                {format(new Date().setHours(hour, 0), 'ha')}
              </div>
              <div className="flex-1 space-y-1">
                {hourEvents.map(event => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg cursor-pointer"
                    style={{ backgroundColor: event.color + '20', borderLeft: `4px solid ${event.color}` }}
                    onClick={() => {
                      setEditingEvent(event)
                      setShowEventModal(true)
                    }}
                  >
                    <div className="font-semibold">{event.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {event.startTime} - {event.endTime}
                    </div>
                    {event.description && (
                      <div className="text-sm mt-1">{event.description}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderAgendaView = () => {
    const sortedEvents = getFilteredEvents().sort((a, b) => 
      new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime()
    )

    return (
      <div className="space-y-2">
        {sortedEvents.map(event => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
            style={{ borderLeft: `4px solid ${event.color}` }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold text-lg">{event.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(event.date), 'MMM d, yyyy')} at {event.startTime} - {event.endTime}
                </div>
                {event.description && (
                  <div className="mt-2">{event.description}</div>
                )}
                {event.location && (
                  <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-1" />
                    {event.location}
                  </div>
                )}
                <div className="flex items-center mt-2 space-x-4">
                  <span className={`text-xs px-2 py-1 rounded`} style={{ backgroundColor: event.color + '20', color: event.color }}>
                    {event.category}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded`} style={{ backgroundColor: priorityColors[event.priority] + '20', color: priorityColors[event.priority] }}>
                    {event.priority}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingEvent(event)
                    setShowEventModal(true)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  const WeatherIcon = weatherConditions[weather?.condition as keyof typeof weatherConditions]?.icon || Sun
  const weatherColorClass = weatherConditions[weather?.condition as keyof typeof weatherConditions]?.color || 'text-yellow-500'

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      <div className={`backdrop-blur-xl ${isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'} min-h-screen`}>
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`sticky top-0 z-50 backdrop-blur-lg border-b ${isDarkMode ? 'border-gray-700 bg-gray-900/80' : 'border-gray-200 bg-white/80'}`}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Calendar className="w-8 h-8 text-blue-500" />
                </motion.div>
                <div>
                  <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    NextGen Calendar
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {format(currentTime, 'EEEE, MMMM d, yyyy - h:mm:ss a')}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Weather Widget */}
                {weather && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
                  >
                    <WeatherIcon className={`w-5 h-5 ${weatherColorClass}`} />
                    <div className="text-sm">
                      <div className="font-semibold">{weather.temp}°F</div>
                      <div className="text-xs text-gray-500">{weather.location}</div>
                    </div>
                  </motion.div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className={`pl-10 pr-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                {/* View Mode Selector */}
                <div className="flex space-x-1">
                  {viewModes.map(mode => (
                    <button
                      key={mode.type}
                      onClick={() => setViewMode(mode)}
                      className={`p-2 rounded-lg transition-colors ${viewMode.type === mode.type ? 'bg-blue-500 text-white' : isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      {mode.icon}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Event</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className={`container mx-auto px-4 py-6 ${isFullscreen ? 'max-w-full' : 'max-w-7xl'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-4"
            >
              {/* Mini Calendar */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur' : 'bg-white/50 backdrop-blur'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {format(currentDate, 'MMMM yyyy')}
                  </span>
                  <button
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-center text-gray-500">
                      {day}
                    </div>
                  ))}
                  {eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).map(day => (
                    <button
                      key={day.toString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square rounded flex items-center justify-center text-xs
                        ${isToday(day) ? 'bg-blue-500 text-white' : ''}
                        ${selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-blue-500' : ''}
                        ${!isToday(day) && !(selectedDate && isSameDay(day, selectedDate)) ? (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100') : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur' : 'bg-white/50 backdrop-blur'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Quick Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Events</span>
                    <span className="font-semibold">{events.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">This Week</span>
                    <span className="font-semibold">
                      {events.filter(e => {
                        const eventDate = new Date(e.date)
                        const weekStart = startOfWeek(currentDate)
                        const weekEnd = endOfWeek(currentDate)
                        return eventDate >= weekStart && eventDate <= weekEnd
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">High Priority</span>
                    <span className="font-semibold text-red-500">
                      {events.filter(e => e.priority === 'high' || e.priority === 'urgent').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur' : 'bg-white/50 backdrop-blur'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Categories
                </h3>
                <div className="space-y-2">
                  {Object.entries(categoryColors).map(([category, color]) => (
                    <button
                      key={category}
                      onClick={() => setFilterCategory(filterCategory === category ? 'all' : category)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        filterCategory === category ? 'bg-blue-500 text-white' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="capitalize">{category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {events.filter(e => e.category === category).length}
                        </span>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Main Calendar Area */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50 backdrop-blur' : 'bg-white/50 backdrop-blur'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                      className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <button
                      onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                      className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      Today
                    </button>
                  </div>
                </div>

                {/* Calendar View */}
                <div className="min-h-[600px]">
                  {viewMode.type === 'month' && renderMonthView()}
                  {viewMode.type === 'week' && renderWeekView()}
                  {viewMode.type === 'day' && renderDayView()}
                  {viewMode.type === 'agenda' && renderAgendaView()}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Analytics Modal */}
          <AnimatePresence>
            {showAnalytics && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={() => setShowAnalytics(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`w-full max-w-4xl max-h-[90vh] overflow-auto p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Analytics Dashboard
                    </h2>
                    <button
                      onClick={() => setShowAnalytics(false)}
                      className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Events by Category */}
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Events by Category
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={getAnalyticsData().categoryData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {getAnalyticsData().categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Events by Priority */}
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Events by Priority
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={getAnalyticsData().priorityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8">
                            {getAnalyticsData().priorityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Monthly Trends */}
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} md:col-span-2`}>
                      <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Monthly Trends
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={getAnalyticsData().monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="events" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Event Modal */}
          <AnimatePresence>
            {(showEventModal || editingEvent) && (
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
                  className={`w-full max-w-md p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {editingEvent ? 'Edit Event' : 'Create Event'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowEventModal(false)
                        setEditingEvent(null)
                      }}
                      className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={editingEvent ? editingEvent.title : newEvent.title}
                        onChange={(e) => editingEvent 
                          ? setEditingEvent({...editingEvent, title: e.target.value})
                          : setNewEvent({...newEvent, title: e.target.value})
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Event title"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description
                      </label>
                      <textarea
                        value={editingEvent ? editingEvent.description : newEvent.description}
                        onChange={(e) => editingEvent
                          ? setEditingEvent({...editingEvent, description: e.target.value})
                          : setNewEvent({...newEvent, description: e.target.value})
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Event description"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Date
                        </label>
                        <input
                          type="date"
                          value={editingEvent ? editingEvent.date : (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : newEvent.date)}
                          onChange={(e) => editingEvent
                            ? setEditingEvent({...editingEvent, date: e.target.value})
                            : setNewEvent({...newEvent, date: e.target.value})
                          }
                          className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Category
                        </label>
                        <select
                          value={editingEvent ? editingEvent.category : newEvent.category}
                          onChange={(e) => editingEvent
                            ? setEditingEvent({...editingEvent, category: e.target.value as Event['category'], color: categoryColors[e.target.value as Event['category']]})
                            : setNewEvent({...newEvent, category: e.target.value as Event['category'], color: categoryColors[e.target.value as Event['category']]})
                          }
                          className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={editingEvent ? editingEvent.startTime : newEvent.startTime}
                          onChange={(e) => editingEvent
                            ? setEditingEvent({...editingEvent, startTime: e.target.value})
                            : setNewEvent({...newEvent, startTime: e.target.value})
                          }
                          className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          End Time
                        </label>
                        <input
                          type="time"
                          value={editingEvent ? editingEvent.endTime : newEvent.endTime}
                          onChange={(e) => editingEvent
                            ? setEditingEvent({...editingEvent, endTime: e.target.value})
                            : setNewEvent({...newEvent, endTime: e.target.value})
                          }
                          className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Priority
                      </label>
                      <select
                        value={editingEvent ? editingEvent.priority : newEvent.priority}
                        onChange={(e) => editingEvent
                          ? setEditingEvent({...editingEvent, priority: e.target.value as Event['priority']})
                          : setNewEvent({...newEvent, priority: e.target.value as Event['priority']})
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Location
                      </label>
                      <input
                        type="text"
                        value={editingEvent ? editingEvent.location || '' : newEvent.location}
                        onChange={(e) => editingEvent
                          ? setEditingEvent({...editingEvent, location: e.target.value})
                          : setNewEvent({...newEvent, location: e.target.value})
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                      className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => editingEvent ? updateEvent(editingEvent) : createEvent()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {editingEvent ? 'Update' : 'Create'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
