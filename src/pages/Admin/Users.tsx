import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconRefresh, IconUsers, IconSettings } from '../../lib/icons'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [overrides, setOverrides] = useState<any>({})
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const load = async ()=>{
    const { data } = await supabase.from('profiles').select('*').order('created_at',{ascending:false}).limit(200)
    if (data) setUsers(data)
  }
  useEffect(()=>{ load() },[])

  const openUser = async (u:any)=>{
    setSelected(u)
    const { data } = await supabase.from('player_settings').select('*').eq('user_id', u.id).single()
    if (data) setOverrides(data)
    else setOverrides({ user_id: u.id })
  }

  const saveOverrides = async ()=>{
    try {
      const payload = { ...overrides, user_id: selected.id, updated_at: new Date().toISOString() }
      const { error } = await supabase.from('player_settings').upsert(payload, { onConflict:'user_id' })
      if (error) throw error
      showToast('Player settings saved')
    } catch(e:any){ showToast(e.message) }
  }

  const toggleAdmin = async (u:any)=>{
    try {
      const res = await callEdge('/admin/users/toggle_admin', { user_id: u.id })
      if (!res.ok) throw new Error(res.error)
      showToast(res.is_admin ? 'Made admin' : 'Removed admin')
      load()
    } catch(e:any){ showToast(e.message) }
  }

  const adjustBalance = async (u:any, delta:number)=>{
    if (!confirm(`Adjust balance by ${delta}?`)) return
    try {
      const res = await callEdge('/admin/users/adjust_balance', { user_id: u.id, delta })
      if (!res.ok) throw new Error(res.error)
      showToast(`Balance adjusted: ${res.new_balance}`)
      load()
    } catch(e:any){ showToast(e.message) }
  }

  // 50+ params definition
  const fields = [
    { key:'max_bet_lottery', label:'Max Bet Lottery', type:'number' },
    { key:'max_bet_spin', label:'Max Bet Spin', type:'number' },
    { key:'max_bet_dice', label:'Max Bet Dice', type:'number' },
    { key:'max_bet_guess', label:'Max Bet Guess', type:'number' },
    { key:'min_bet_lottery', label:'Min Bet Lottery', type:'number' },
    { key:'min_bet_spin', label:'Min Bet Spin', type:'number' },
    { key:'min_bet_dice', label:'Min Bet Dice', type:'number' },
    { key:'min_bet_guess', label:'Min Bet Guess', type:'number' },
    { key:'daily_loss_limit', label:'Daily Loss Limit', type:'number' },
    { key:'daily_win_limit', label:'Daily Win Limit', type:'number' },
    { key:'daily_bet_limit', label:'Daily Bet Limit', type:'number' },
    { key:'max_deposit_per_day', label:'Max Deposit/Day', type:'number' },
    { key:'max_withdraw_per_day', label:'Max Withdraw/Day', type:'number' },
    { key:'cooldown_spin_sec', label:'Spin Cooldown sec', type:'number' },
    { key:'cooldown_dice_sec', label:'Dice Cooldown sec', type:'number' },
    { key:'cooldown_guess_sec', label:'Guess Cooldown sec', type:'number' },
    { key:'cooldown_lottery_sec', label:'Lottery Cooldown sec', type:'number' },
    { key:'custom_house_edge_spin', label:'Custom House Edge Spin %', type:'number' },
    { key:'custom_house_edge_dice', label:'Custom House Edge Dice %', type:'number' },
    { key:'custom_house_edge_guess', label:'Custom House Edge Guess %', type:'number' },
    { key:'custom_house_edge_lottery', label:'Custom House Edge Lottery %', type:'number' },
    { key:'jackpot_eligible', label:'Jackpot Eligible', type:'bool' },
    { key:'bonus_eligible', label:'Bonus Eligible', type:'bool' },
    { key:'is_blocked', label:'Blocked', type:'bool' },
    { key:'is_verified', label:'Verified', type:'bool' },
    { key:'can_withdraw', label:'Can Withdraw', type:'bool' },
    { key:'can_deposit', label:'Can Deposit', type:'bool' },
    { key:'can_play_lottery', label:'Can Play Lottery', type:'bool' },
    { key:'can_play_spin', label:'Can Play Spin', type:'bool' },
    { key:'can_play_dice', label:'Can Play Dice', type:'bool' },
    { key:'can_play_guess', label:'Can Play Guess', type:'bool' },
    { key:'wager_multiplier_override', label:'Wager Multiplier Override', type:'number' },
    { key:'withdraw_fee_pct', label:'Withdraw Fee %', type:'number' },
    { key:'deposit_bonus_pct', label:'Deposit Bonus %', type:'number' },
    { key:'referral_bonus_pct', label:'Referral Bonus %', type:'number' },
    { key:'max_tickets_per_draw', label:'Max Tickets/Draw', type:'number' },
    { key:'max_spins_per_day', label:'Max Spins/Day', type:'number' },
    { key:'max_dice_per_day', label:'Max Dice/Day', type:'number' },
    { key:'max_guess_per_day', label:'Max Guess/Day', type:'number' },
    { key:'risk_score', label:'Risk Score (0-100)', type:'number' },
    { key:'trust_score', label:'Trust Score (0-100)', type:'number' },
    { key:'notes', label:'Admin Notes', type:'text' },
    { key:'tags', label:'Tags (comma)', type:'text' },
    { key:'custom_multiplier_spin', label:'Custom Spin Multiplier Override', type:'number' },
    { key:'custom_payout_guess', label:'Custom Guess Payout', type:'number' },
    { key:'lottery_discount_pct', label:'Lottery Discount %', type:'number' },
    { key:'spin_discount_pct', label:'Spin Discount %', type:'number' },
    { key:'vip_level', label:'VIP Level (0-10)', type:'number' },
    { key:'vip_cashback_pct', label:'VIP Cashback %', type:'number' },
    { key:'allow_high_roller', label:'Allow High Roller', type:'bool' },
    { key:'require_2fa_withdraw', label:'Require 2FA Withdraw', type:'bool' },
    { key:'auto_flag_suspicious', label:'Auto Flag Suspicious', type:'bool' },
  ]

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div style={{ fontWeight:800, fontSize:20 }} className="flex gap8 center"><IconUsers size={20}/> Players ({users.length})</div>
        <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
      </div>

      <div className="card p16" style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead><tr style={{ color:'#777', textAlign:'left' }}><th style={{ padding:'8px' }}>User</th><th>Email</th><th>Balance</th><th>Bets/Wins</th><th>Admin</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((u:any)=>(
              <tr key={u.id} style={{ borderTop:'1px solid #111' }}>
                <td style={{ padding:'8px' }}><div style={{ fontWeight:700 }}>{u.username}</div><div className="mono" style={{ fontSize:10, color:'#666' }}>{u.id.slice(0,8)}</div></td>
                <td className="mono" style={{ fontSize:11 }}>{u.email}</td>
                <td className="mono">₹{Number(u.balance||0).toFixed(2)}</td>
                <td className="mono">₹{Number(u.lifetime_bets||0).toFixed(0)}/₹{Number(u.lifetime_wins||0).toFixed(0)}</td>
                <td>{u.is_admin?'Yes':'No'}</td>
                <td className="flex gap4">
                  <button className="btn btn-ghost" style={{ padding:'4px 8px', fontSize:11 }} onClick={()=>openUser(u)}>50+ Params</button>
                  <button className="btn btn-ghost" style={{ padding:'4px 8px', fontSize:11 }} onClick={()=>toggleAdmin(u)}>{u.is_admin?'Demote':'Make Admin'}</button>
                  <button className="btn btn-ghost" style={{ padding:'4px 8px', fontSize:11 }} onClick={()=>adjustBalance(u, 100)}>+100</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card p16">
          <div className="flex between center mb16">
            <div style={{ fontWeight:800 }} className="flex gap8 center"><IconSettings size={16}/> Player Settings: {selected.username} (50+ params)</div>
            <button className="btn btn-ghost" onClick={()=>setSelected(null)}>Close</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
            {fields.map(f=>(
              <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:11, color:'#777', fontWeight:700, letterSpacing:'0.05em' }}>{f.label.toUpperCase()}</label>
                {f.type==='bool' ? (
                  <select className="input" value={overrides[f.key] ? 'true' : 'false'} onChange={e=>setOverrides({ ...overrides, [f.key]: e.target.value==='true' })}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : f.type==='text' ? (
                  <input className="input" value={overrides[f.key]||''} onChange={e=>setOverrides({ ...overrides, [f.key]: e.target.value })} placeholder={f.label} />
                ) : (
                  <input className="input" type="number" step="any" value={overrides[f.key] ?? ''} onChange={e=>setOverrides({ ...overrides, [f.key]: e.target.value==='' ? null : Number(e.target.value) })} placeholder="0" />
                )}
              </div>
            ))}
          </div>
          <button className="btn btn-primary w100 mt16" onClick={saveOverrides}>Save All 50+ Params</button>
          <div style={{ fontSize:11, color:'#666', marginTop:8 }}>These override global game settings per player. Server checks them on every bet/withdraw.</div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
