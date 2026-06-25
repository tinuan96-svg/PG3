import { supabase } from './supabase'

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error) return null
  return data?.value || null
}

export async function getSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')

  if (error) return {}

  const settings: Record<string, string> = {}
  data.forEach((item) => {
    settings[item.key] = item.value
  })

  return settings
}

export async function updateSetting(key: string, value: string) {
  const { error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) throw error
}

export function getDeliveryCharge(subtotal: number, settings: Record<string, string>): number {
  const threshold = parseFloat(settings.free_delivery_threshold || '40')
  const charge = parseFloat(settings.delivery_charge || '4.99')

  return subtotal >= threshold ? 0 : charge
}

export function canOrderForNextDay(): boolean {
  const now = new Date()
  const hours = now.getHours()
  return hours < 16
}

export function getNextDeliveryDate(): string {
  const now = new Date()
  const deliveryDate = new Date(now)

  if (now.getHours() >= 16) {
    deliveryDate.setDate(deliveryDate.getDate() + 2)
  } else {
    deliveryDate.setDate(deliveryDate.getDate() + 1)
  }

  return deliveryDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
