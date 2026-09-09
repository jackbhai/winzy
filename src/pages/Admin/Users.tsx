import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconRefresh, IconUsers, IconSettings, IconWallet, IconShield, IconBolt, IconChart, IconTicket, IconGame, IconBank } from '../../lib/icons'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all'|'admin'|'blocked'|'high'>('all')
  const [selected, setSelected] = useState<any>(null)
  const [tab, setTab] = useState<'overview'|'ledger'|'deposits'|'games'|'settings'|'risk'>('overview')
  const [overrides, setOverrides] = useState<any>({})
  const [ledger, setLedger] = useState<any[]>([])
  const [deposits, setDeposits] = useState<any[]>([])
  const [games, setGames] = useState<any>({ spin:[], dice:[], guess:[], lottery:[] })
  const [toast, setToast] = useState('')
  const [creditAmt, setCreditAmt] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3500) }

  const load = async ()=>{
    const { data } = await supabase.from('profiles').select('*').order('created_at',{ascending:false}).limit(200)
    if (data) { setUsers(data); setFiltered(data) }
  }
  useEffect(()=>{ load() },[])

  useEffect(()=>{
    let f = [...users]
    if (search) f = f.filter(u=> (u.email?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase())))
    if (filter==='admin') f = f.filter(u=>u.is_admin)
    if (filter==='blocked') f = f.filter(u=>u.is_blocked || false) // will check player_settings later
    if (filter==='high') f = f.filter(u=>Number(u.balance||0)>1000)
    setFiltered(f)
  },[search, filter, users])

  const openUser = async (u:any)=>{
    setSelected(u)
    setTab('overview')
    const { data } = await supabase.from('player_settings').select('*').eq('user_id', u.id).single()
    setOverrides(data || { user_id: u.id })
    // load ledger
    const { data: led } = await supabase.from('wallet_ledger').select('*').eq('user_id', u.id).order('created_at',{ascending:false}).limit(30)
    if (led) setLedger(led)
    const { data: dep } = await supabase.from('deposits').select('*').eq('user_id', u.id).order('created_at',{ascending:false}).limit(20)
    if (dep) setDeposits(dep)
    const { data: spin } = await supabase.from('spin_history').select('*').eq('user_id', u.id).order('created_at',{ascending:false}).limit(10)
    const { data: dice } = await supabase.from('dice_history').select('*').eq('user_id', u.id).order('created_at',{ascending:false}).limit(10)
    const { data: guess } = await supabase.from('guess_history').select('*').eq('user_id', u.id).order('created_at',{ascending:false}).limit(10)
    const { data: lottery } = await supabase.from('lottery_tickets').select('*, lottery_draws(draw_number)').eq('user_id', u.id).order('created_at',{ascending:false}).limit(10)
    setGames({ spin: spin||[], dice: dice||[], guess: guess||[], lottery: lottery||[] })
  }

  const saveOverrides = async ()=>{
    try {
      const payload = { ...overrides, user_id: selected.id, updated_at: new Date().toISOString() }
      const { error } = await supabase.from('player_settings').upsert(payload, { onConflict:'user_id' })
      if (error) throw error
      showToast('✅ Player 50+ params saved')
    } catch(e:any){ showToast(e.message) }
  }

  const toggleAdmin = async (u:any)=>{
    try {
      const res = await callEdge('/admin/users/toggle_admin', { user_id: u.id })
      if (!res.ok) throw new Error(res.error)
      showToast(res.is_admin ? '👑 Made admin' : 'Removed admin')
      load()
    } catch(e:any){ showToast(e.message) }
  }

  const adjustBalance = async (delta:number)=>{
    if (!creditAmt && delta!==0) return
    const d = delta!==0 ? delta : Number(creditAmt)
    if (!d) { showToast('Enter amount'); return }
    if (!confirm(`${d>0?'+':''}${d} coins ${d>0?'add':'subtract'} for ${selected.username}?`)) return
    try {
      const res = await callEdge('/admin/users/adjust_balance', { user_id: selected.id, delta: d })
      if (!res.ok) throw new Error(res.error)
      showToast(`💰 Balance ${d>0?'+':''}${d} → ₹${res.new_balance}`)
      openUser({ ...selected, balance: res.new_balance })
      load()
    } catch(e:any){ showToast(e.message) }
  }

  const toggleBlock = async ()=>{
    const newVal = !overrides.is_blocked
    setOverrides({ ...overrides, is_blocked: newVal })
    try {
      await supabase.from('player_settings').upsert({ user_id: selected.id, is_blocked: newVal, updated_at: new Date().toISOString() }, { onConflict:'user_id' })
      showToast(newVal ? '🚫 User blocked' : '✅ User unblocked')
    } catch(e:any){ showToast(e.message) }
  }

  const fields = [
    { key:'max_bet_lottery', label:'Max Bet Lottery', type:'number', group:'Bets' },
    { key:'max_bet_spin', label:'Max Bet Spin', type:'number', group:'Bets' },
    { key:'max_bet_dice', label:'Max Bet Dice', type:'number', group:'Bets' },
    { key:'max_bet_guess', label:'Max Bet Guess', type:'number', group:'Bets' },
    { key:'min_bet_lottery', label:'Min Bet Lottery', type:'number', group:'Bets' },
    { key:'min_bet_spin', label:'Min Bet Spin', type:'number', group:'Bets' },
    { key:'min_bet_dice', label:'Min Bet Dice', type:'number', group:'Bets' },
    { key:'min_bet_guess', label:'Min Bet Guess', type:'number', group:'Bets' },
    { key:'daily_loss_limit', label:'Daily Loss Limit', type:'number', group:'Limits' },
    { key:'daily_win_limit', label:'Daily Win Limit', type:'number', group:'Limits' },
    { key:'daily_bet_limit', label:'Daily Bet Limit', type:'number', group:'Limits' },
    { key:'max_deposit_per_day', label:'Max Deposit/Day', type:'number', group:'Limits' },
    { key:'max_withdraw_per_day', label:'Max Withdraw/Day', type:'number', group:'Limits' },
    { key:'cooldown_spin_sec', label:'Spin Cooldown sec', type:'number', group:'Cooldown' },
    { key:'cooldown_dice_sec', label:'Dice Cooldown sec', type:'number', group:'Cooldown' },
    { key:'cooldown_guess_sec', label:'Guess Cooldown sec', type:'number', group:'Cooldown' },
    { key:'cooldown_lottery_sec', label:'Lottery Cooldown sec', type:'number', group:'Cooldown' },
    { key:'custom_house_edge_spin', label:'House Edge Spin %', type:'number', group:'House Edge' },
    { key:'custom_house_edge_dice', label:'House Edge Dice %', type:'number', group:'House Edge' },
    { key:'custom_house_edge_guess', label:'House Edge Guess %', type:'number', group:'House Edge' },
    { key:'custom_house_edge_lottery', label:'House Edge Lottery %', type:'number', group:'House Edge' },
    { key:'jackpot_eligible', label:'Jackpot Eligible', type:'bool', group:'Flags' },
    { key:'bonus_eligible', label:'Bonus Eligible', type:'bool', group:'Flags' },
    { key:'is_blocked', label:'Blocked', type:'bool', group:'Flags' },
    { key:'is_verified', label:'Verified', type:'bool', group:'Flags' },
    { key:'can_withdraw', label:'Can Withdraw', type:'bool', group:'Flags' },
    { key:'can_deposit', label:'Can Deposit', type:'bool', group:'Flags' },
    { key:'can_play_lottery', label:'Can Play Lottery', type:'bool', group:'Flags' },
    { key:'can_play_spin', label:'Can Play Spin', type:'bool', group:'Flags' },
    { key:'can_play_dice', label:'Can Play Dice', type:'bool', group:'Flags' },
    { key:'can_play_guess', label:'Can Play Guess', type:'bool', group:'Flags' },
    { key:'wager_multiplier_override', label:'Wager Multiplier Override', type:'number', group:'Risk' },
    { key:'withdraw_fee_pct', label:'Withdraw Fee %', type:'number', group:'Risk' },
    { key:'deposit_bonus_pct', label:'Deposit Bonus %', type:'number', group:'Bonus' },
    { key:'referral_bonus_pct', label:'Referral Bonus %', type:'number', group:'Bonus' },
    { key:'max_tickets_per_draw', label:'Max Tickets/Draw', type:'number', group:'Limits' },
    { key:'max_spins_per_day', label:'Max Spins/Day', type:'number', group:'Limits' },
    { key:'max_dice_per_day', label:'Max Dice/Day', type:'number', group:'Limits' },
    { key:'max_guess_per_day', label:'Max Guess/Day', type:'number', group:'Limits' },
    { key:'risk_score', label:'Risk Score 0-100', type:'number', group:'Risk' },
    { key:'trust_score', label:'Trust Score 0-100', type:'number', group:'Risk' },
    { key:'notes', label:'Admin Notes', type:'text', group:'Meta' },
    { key:'tags', label:'Tags (comma)', type:'text', group:'Meta' },
    { key:'custom_multiplier_spin', label:'Custom Spin Multiplier', type:'number', group:'House Edge' },
    { key:'custom_payout_guess', label:'Custom Guess Payout', type:'number', group:'House Edge' },
    { key:'lottery_discount_pct', label:'Lottery Discount %', type:'number', group:'Bonus' },
    { key:'spin_discount_pct', label:'Spin Discount %', type:'number', group:'Bonus' },
    { key:'vip_level', label:'VIP Level 0-10', type:'number', group:'VIP' },
    { key:'vip_cashback_pct', label:'VIP Cashback %', type:'number', group:'VIP' },
    { key:'allow_high_roller', label:'Allow High Roller', type:'bool', group:'VIP' },
    { key:'require_2fa_withdraw', label:'Require 2FA Withdraw', type:'bool', group:'Risk' },
    { key:'auto_flag_suspicious', label:'Auto Flag Suspicious', type:'bool', group:'Risk' },
  ]

  const grouped = fields.reduce((acc:any,f:any)=>{ (acc[f.group]=acc[f.group]||[]).push(f); return acc },{})

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div>
          <div style={{ fontWeight:900, fontSize:22 }} className="flex gap8 center"><IconUsers size={20}/> Players • 100X Deep Check</div>
          <div style={{ fontSize:11, color:'#666', marginTop:2 }}>{filtered.length} players • search + 50+ controls each • ban/add credit</div>
        </div>
        <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
      </div>

      <div className="card p12 flex gap8" style={{ background:'#050505' }}>
        <input className="input" placeholder="Search email / username..." value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1 }} />
        <div className="flex gap4">
          {(['all','admin','blocked','high'] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className="btn" style={{ background: filter===f?'#fff':'#111', color: filter===f?'#000':'#666', padding:'8px 12px', fontSize:11 }}>{f.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
        {filtered.map((u:any)=>(
          <div key={u.id} className="card p14" style={{ cursor:'pointer', border: u.is_admin ? '1px solid #fff' : '1px solid #1a1a1a', background: u.is_admin ? 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)' : '#0a0a0a' }} onClick={()=>openUser(u)}>
            <div className="flex between">
              <div className="flex gap10 center">
                <div style={{ width:40, height:40, background: u.is_admin ? '#fff' : '#111', color: u.is_admin ? '#000' : '#fff', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>{(u.username||'U')[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:13 }}>{u.username||u.email?.split('@')[0]} {u.is_admin?'👑':''}</div>
                  <div style={{ fontSize:10, color:'#666' }} className="mono">{u.email?.slice(0,22)}</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:800, fontSize:13, color:'#00ff88' }} className="mono">₹{Number(u.balance||0).toFixed(2)}</div>
                <div style={{ fontSize:10, color:'#555' }}>Bets ₹{Number(u.lifetime_bets||0).toFixed(0)}</div>
              </div>
            </div>
            <div className="flex gap6 mt10">
              <span style={{ padding:'2px 8px', borderRadius:999, background:'#111', border:'1px solid #1a1a1a', fontSize:10, color:'#777' }}>Dep ₹{Number(u.lifetime_deposits||0).toFixed(0)}</span>
              <span style={{ padding:'2px 8px', borderRadius:999, background:'#111', border:'1px solid #1a1a1a', fontSize:10, color:'#777' }}>Win ₹{Number(u.lifetime_wins||0).toFixed(0)}</span>
              <span style={{ padding:'2px 8px', borderRadius:999, background: u.is_admin ? '#fff' : '#111', color: u.is_admin ? '#000' : '#555', fontSize:10, fontWeight:700 }}>{u.is_admin?'ADMIN':'PLAYER'}</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', backdropFilter:'blur(10px)', zIndex:100, overflowY:'auto', padding:16 }}>
          <div className="card2 p20" style={{ maxWidth:900, margin:'0 auto', borderRadius:20 }}>
            <div className="flex between center mb16">
              <div className="flex gap12 center">
                <div style={{ width:48, height:48, background:'#fff', color:'#000', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18 }}>{(selected.username||'U')[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight:900, fontSize:18 }}>{selected.username} {selected.is_admin?'👑 ADMIN':''}</div>
                  <div style={{ fontSize:11, color:'#777' }} className="mono">{selected.email} • {selected.id.slice(0,8)} • ₹{Number(selected.balance||0).toFixed(2)}</div>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={()=>setSelected(null)}>Close</button>
            </div>

            <div className="flex gap6 mb16" style={{ overflowX:'auto' }}>
              {(['overview','ledger','deposits','games','settings','risk'] as const).map(t=>(
                <button key={t} onClick={()=>setTab(t)} className="btn" style={{ background: tab===t?'#fff':'#111', color: tab===t?'#000':'#666', padding:'8px 14px', fontSize:12, whiteSpace:'nowrap' }}>{t.toUpperCase()}</button>
              ))}
            </div>

            {tab==='overview' && (
              <div className="flex col gap12">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
                  <div className="card p12"><div style={{ fontSize:10, color:'#666' }}>BALANCE</div><div style={{ fontWeight:800, fontSize:16, color:'#00ff88' }} className="mono">₹{Number(selected.balance||0).toFixed(2)}</div></div>
                  <div className="card p12"><div style={{ fontSize:10, color:'#666' }}>DEPOSITS</div><div style={{ fontWeight:800, fontSize:16 }} className="mono">₹{Number(selected.lifetime_deposits||0).toFixed(2)}</div></div>
                  <div className="card p12"><div style={{ fontSize:10, color:'#666' }}>BETS / WINS</div><div style={{ fontWeight:800, fontSize:14 }} className="mono">₹{Number(selected.lifetime_bets||0).toFixed(0)} / ₹{Number(selected.lifetime_wins||0).toFixed(0)}</div></div>
                </div>

                <div className="card p14">
                  <div style={{ fontWeight:800, fontSize:13, marginBottom:12 }} className="flex gap8 center"><IconBolt size={14}/> Quick Actions • 100X</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div className="flex gap8">
                      <input className="input" placeholder="Amount e.g. 100 or -50" value={creditAmt} onChange={e=>setCreditAmt(e.target.value)} />
                      <button className="btn btn-primary" onClick={()=>adjustBalance(0)}>Apply</button>
                    </div>
                    <div className="flex gap8">
                      <button className="btn btn-ghost" onClick={()=>adjustBalance(100)}>+100</button>
                      <button className="btn btn-ghost" onClick={()=>adjustBalance(500)}>+500</button>
                      <button className="btn btn-danger" onClick={()=>adjustBalance(-100)}>-100</button>
                    </div>
                    <button className="btn btn-ghost" onClick={()=>toggleAdmin(selected)}>{selected.is_admin?'Demote from Admin':'Make Admin 👑'}</button>
                    <button className="btn" style={{ background: overrides.is_blocked ? '#00ff8815' : '#ff453a15', color: overrides.is_blocked ? '#00ff88' : '#ff453a', border:`1px solid ${overrides.is_blocked ? '#00ff8830' : '#ff453a30'}` }} onClick={toggleBlock}>{overrides.is_blocked ? 'Unblock User ✅' : 'Ban User 🚫'}</button>
                  </div>
                  <div style={{ fontSize:11, color:'#666', marginTop:8 }}>Add credit = bonus ledger, subtract = adjustment. Ban sets is_blocked in player_settings — user cannot bet/withdraw.</div>
                </div>

                <div className="card p14">
                  <div style={{ fontWeight:700, fontSize:12, marginBottom:8 }}>Player Info Deep</div>
                  <div style={{ fontSize:12, color:'#777', lineHeight:1.8 }} className="mono">
                    ID: {selected.id}<br/>
                    Email: {selected.email}<br/>
                    Username: {selected.username}<br/>
                    Created: {new Date(selected.created_at).toLocaleString()}<br/>
                    Role: {selected.role} • Status: {selected.status}<br/>
                    Referral: {selected.referral_code||'none'} • Referred by: {selected.referred_by||'none'}<br/>
                    Risk: {overrides.risk_score||0}/100 • Trust: {overrides.trust_score||0}/100 • VIP: {overrides.vip_level||0}
                  </div>
                </div>
              </div>
            )}

            {tab==='ledger' && (
              <div className="flex col gap8">
                {ledger.map((l:any)=>(
                  <div key={l.id} className="flex between center" style={{ padding:'10px', background:'#000', border:'1px solid #111', borderRadius:10 }}>
                    <div><div style={{ fontWeight:700, fontSize:12 }}>{l.type} {l.game_type?`• ${l.game_type}`:''}</div><div style={{ fontSize:10, color:'#666' }} className="mono">{new Date(l.created_at).toLocaleString()} • {l.note}</div></div>
                    <div style={{ fontWeight:800, color: Number(l.amount)>0?'#00ff88':'#fff' }} className="mono">{Number(l.amount)>0?'+':''}₹{Number(l.amount).toFixed(2)}</div>
                  </div>
                ))}
                {ledger.length===0 && <div style={{ color:'#555', textAlign:'center', padding:20 }}>No ledger</div>}
              </div>
            )}

            {tab==='deposits' && (
              <div className="flex col gap8">
                {deposits.map((d:any)=>(
                  <div key={d.id} className="flex between center" style={{ padding:'10px', background:'#000', border:'1px solid #111', borderRadius:10 }}>
                    <div><div style={{ fontWeight:700, fontSize:12 }} className="mono">{d.order_ref} • ₹{Number(d.amount).toFixed(2)}</div><div style={{ fontSize:10, color:'#666' }}>{new Date(d.created_at).toLocaleString()} • {d.status}</div></div>
                    <a href={d.pay_url} target="_blank" style={{ color:'#0a84ff', fontSize:11 }}>pay_url</a>
                  </div>
                ))}
                {deposits.length===0 && <div style={{ color:'#555', textAlign:'center', padding:20 }}>No deposits</div>}
              </div>
            )}

            {tab==='games' && (
              <div className="flex col gap12">
                {[
                  { k:'spin', label:'Spin History', icon: IconGame },
                  { k:'dice', label:'Dice History', icon: IconChart },
                  { k:'guess', label:'Guess History', icon: IconTicket },
                  { k:'lottery', label:'Lottery Tickets', icon: IconTicket },
                ].map(g=>(
                  <div key={g.k} className="card p12">
                    <div style={{ fontWeight:700, fontSize:12, marginBottom:8 }} className="flex gap8 center"><g.icon size={12}/> {g.label} ({(games as any)[g.k].length})</div>
                    <div className="flex col gap6">
                      {(games as any)[g.k].slice(0,5).map((h:any)=>(
                        <div key={h.id} style={{ fontSize:11, padding:'6px 8px', background:'#000', border:'1px solid #111', borderRadius:8 }} className="mono flex between">
                          <span>{JSON.stringify(h).slice(0,80)}...</span>
                          <span style={{ color: Number(h.win_amount)>0?'#00ff88':'#777' }}>₹{Number(h.win_amount||0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab==='settings' && (
              <div className="flex col gap16">
                <div style={{ fontWeight:800, fontSize:14 }}>50+ Params Per Player • Grouped</div>
                {Object.entries(grouped).map(([group, flds]:any)=>(
                  <div key={group} className="card p14">
                    <div style={{ fontWeight:800, fontSize:12, letterSpacing:'0.08em', color:'#777', marginBottom:10 }}>{group.toUpperCase()}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
                      {flds.map((f:any)=>(
                        <div key={f.key} className="flex col gap4">
                          <label style={{ fontSize:10, color:'#666', fontWeight:700 }}>{f.label}</label>
                          {f.type==='bool' ? (
                            <select className="input" value={overrides[f.key] ? 'true' : 'false'} onChange={e=>setOverrides({ ...overrides, [f.key]: e.target.value==='true' })}>
                              <option value="true">True</option><option value="false">False</option>
                            </select>
                          ) : f.type==='text' ? (
                            <input className="input" value={overrides[f.key]||''} onChange={e=>setOverrides({ ...overrides, [f.key]: e.target.value })} />
                          ) : (
                            <input className="input" type="number" step="any" value={overrides[f.key] ?? ''} onChange={e=>setOverrides({ ...overrides, [f.key]: e.target.value==='' ? null : Number(e.target.value) })} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button className="btn btn-primary w100" onClick={saveOverrides}>Save All 50+ Params</button>
              </div>
            )}

            {tab==='risk' && (
              <div className="flex col gap12">
                <div className="card p14">
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }} className="flex gap8 center"><IconShield size={14}/> Risk & Trust</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div><label style={{ fontSize:10, color:'#666' }}>Risk Score</label><input className="input" type="number" value={overrides.risk_score||0} onChange={e=>setOverrides({ ...overrides, risk_score: Number(e.target.value) })} /></div>
                    <div><label style={{ fontSize:10, color:'#666' }}>Trust Score</label><input className="input" type="number" value={overrides.trust_score||0} onChange={e=>setOverrides({ ...overrides, trust_score: Number(e.target.value) })} /></div>
                    <div><label style={{ fontSize:10, color:'#666' }}>VIP Level</label><input className="input" type="number" value={overrides.vip_level||0} onChange={e=>setOverrides({ ...overrides, vip_level: Number(e.target.value) })} /></div>
                    <div><label style={{ fontSize:10, color:'#666' }}>VIP Cashback %</label><input className="input" type="number" value={overrides.vip_cashback_pct||0} onChange={e=>setOverrides({ ...overrides, vip_cashback_pct: Number(e.target.value) })} /></div>
                  </div>
                  <div className="flex col gap8 mt12">
                    <label style={{ fontSize:11, color:'#777' }}>Admin Notes</label>
                    <textarea className="input" style={{ minHeight:80 }} value={overrides.notes||''} onChange={e=>setOverrides({ ...overrides, notes: e.target.value })} placeholder="Suspicious activity, etc." />
                    <label style={{ fontSize:11, color:'#777' }}>Tags</label>
                    <input className="input" value={overrides.tags||''} onChange={e=>setOverrides({ ...overrides, tags: e.target.value })} placeholder="high-roller, flagged, vip" />
                  </div>
                  <button className="btn btn-primary w100 mt12" onClick={saveOverrides}>Save Risk & Notes</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
