import { supabase } from './supabase'

export async function getUserWallet(userId: string) {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as { user_id: string; balance: number } | null
}

export async function addCoins(
  userId: string,
  amount: number,
  type: 'earned' | 'referral' | 'bonus',
  description: string,
  orderId?: string
) {
  const wallet = await getUserWallet(userId)

  if (!wallet) {
    await supabase.from('wallets').insert({ user_id: userId, balance: amount })
  } else {
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
  }

  await (supabase as any).from('wallet_transactions').insert({
    user_id: userId,
    type,
    amount,
    order_id: orderId || null,
    description,
  })
}

export async function useCoins(
  userId: string,
  amount: number,
  orderId: string,
  description: string
) {
  const wallet = await getUserWallet(userId)

  if (!wallet || wallet.balance < amount) {
    throw new Error('Insufficient coins')
  }

  await supabase
    .from('wallets')
    .update({ balance: wallet.balance - amount, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  await (supabase as any).from('wallet_transactions').insert({
    user_id: userId,
    type: 'used',
    amount: -amount,
    order_id: orderId,
    description,
  })
}

export async function getWalletTransactions(userId: string, limit = 50) {
  const { data, error } = await (supabase as any)
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export function coinsToGBP(coins: number): number {
  return coins * 0.01
}

export function gbpToCoins(gbp: number): number {
  return Math.floor(gbp * 100)
}
