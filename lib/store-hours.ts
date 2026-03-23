import type { StoreHours } from '@/lib/types'

const DAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

type Day = (typeof DAYS)[number]

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return { hours, minutes }
}

function toMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr)
  return hours * 60 + minutes
}

export function isStoreOpen(storeHours: StoreHours): boolean {
  const now = new Date()
  const day = DAYS[now.getDay()] as Day
  const dayHours = storeHours[day as keyof StoreHours]

  if (!dayHours) return false

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = toMinutes(dayHours.open)
  const closeMinutes = toMinutes(dayHours.close)

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes
}

export function getNextOpenTime(storeHours: StoreHours): string {
  const now = new Date()
  const todayIndex = now.getDay() // 0 = Sunday

  // Check up to 7 days ahead
  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = (todayIndex + offset) % 7
    const day = DAYS[dayIndex] as Day
    const dayHours = storeHours[day as keyof StoreHours]

    if (!dayHours) continue

    const openMinutes = toMinutes(dayHours.open)
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    // If today, only count if open time is still in the future
    if (offset === 0 && currentMinutes >= openMinutes) continue

    const { hours, minutes } = parseTime(dayHours.open)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHour = hours % 12 === 0 ? 12 : hours % 12
    const displayMinutes = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`
    const timeStr = `${displayHour}${displayMinutes} ${period}`

    if (offset === 0) {
      return `Opens today at ${timeStr}`
    }

    if (offset === 1) {
      return `Opens tomorrow at ${timeStr}`
    }

    const dayLabel = day.charAt(0).toUpperCase() + day.slice(1)
    return `Opens ${dayLabel} at ${timeStr}`
  }

  return 'Currently closed'
}
