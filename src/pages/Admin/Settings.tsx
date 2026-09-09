import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconSettings, IconRefresh, IconBolt } from '../../lib/icons'

export default function AdminSettings() {
  const [cfg, setCfg] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const load = async ()=>{
    const { data } = await supabase.from('game_settings').select('*').eq('id',1).single()
    if (data) setCfg(data)
  }
  useEffect(()=>{ load() },[])

  const save = async ()=>{
    setLoading(true)
    try {
      const res = await callEdge('/admin/settings/save', { settings: cfg })
      if (!res.ok) throw new Error(res.error)
      showToast('✅ Settings saved • win prob live')
      load()
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  const groups: { title:string; desc:string; fields:{key:string; label:string; type?:string; hint?:string}[] }[] = [
    { title:'🎯 Win Probability Control • 100X (Admin can set win %)', desc:'Set win % per game — 0-100. Server uses crypto RNG but respects this % for house control. Instant effect.', fields:[
      {key:'spin_win_probability', label:'Spin Win %', hint:'0-100, e.g. 45 means 45% players win'},
      {key:'dice_win_probability', label:'Dice Win %', hint:'49 default'},
      {key:'guess_win_probability', label:'Guess Win %', hint:'10 default (1/10)'},
      {key:'crash_win_probability', label:'Crash Win %', hint:'50 default'},
      {key:'mines_win_probability', label:'Mines Win %', hint:'50 default'},
      {key:'plinko_win_probability', label:'Plinko Win %', hint:'60 default'},
      {key:'coinflip_win_probability', label:'Coinflip Win %', hint:'49 default'},
      {key:'slots_win_probability', label:'Slots Win %', hint:'30 default'},
      {key:'lottery_win_probability', label:'Lottery Win %', hint:'informational'},
    ]},
    { title:'Lottery', desc:'Ticket price, tiers, pot', fields:[
      {key:'lottery_ticket_price', label:'Ticket Price'},
      {key:'lottery_max_tickets_per_user', label:'Max Tickets/User'},
      {key:'lottery_match3_pct', label:'Match3 Payout %'},
      {key:'lottery_match4_pct', label:'Match4 %'},
      {key:'lottery_match5_pct', label:'Match5 %'},
      {key:'lottery_match6_pct', label:'Match6 %'},
      {key:'lottery_house_edge', label:'House Edge %'},
      {key:'lottery_draw_interval_hours', label:'Draw Interval Hours'},
      {key:'lottery_min_pot', label:'Min Pot'},
      {key:'lottery_max_pot', label:'Max Pot'},
    ]},
    { title:'Spin & Win • Premium', desc:'Multipliers and weights control slice probability', fields:[
      {key:'spin_cost', label:'Cost Per Spin'},
      {key:'spin_multiplier_0', label:'Mult 0x'},
      {key:'spin_multiplier_1_2', label:'Mult 1.2x'},
      {key:'spin_multiplier_1_5', label:'Mult 1.5x'},
      {key:'spin_multiplier_2', label:'Mult 2x'},
      {key:'spin_multiplier_5', label:'Mult 5x'},
      {key:'spin_multiplier_jackpot', label:'Mult Jackpot'},
      {key:'spin_weight_0', label:'Weight 0x (prob)'},
      {key:'spin_weight_1_2', label:'Weight 1.2x'},
      {key:'spin_weight_1_5', label:'Weight 1.5x'},
      {key:'spin_weight_2', label:'Weight 2x'},
      {key:'spin_weight_5', label:'Weight 5x'},
      {key:'spin_weight_jackpot', label:'Weight Jackpot'},
      {key:'spin_house_edge', label:'House Edge %'},
      {key:'spin_max_win', label:'Max Win'},
      {key:'spin_cooldown_sec', label:'Cooldown sec'},
      {key:'spin_daily_limit', label:'Daily Limit'},
    ]},
    { title:'Dice', fields:[
      {key:'dice_min_bet', label:'Min Bet'},
      {key:'dice_max_bet', label:'Max Bet'},
      {key:'dice_min_target', label:'Min Target'},
      {key:'dice_max_target', label:'Max Target'},
      {key:'dice_house_edge', label:'House Edge %'},
      {key:'dice_max_multiplier', label:'Max Multiplier'},
      {key:'dice_cooldown_sec', label:'Cooldown sec'},
    ], desc:''},
    { title:'Number Guess', fields:[
      {key:'guess_cost', label:'Cost'},
      {key:'guess_payout_multiplier', label:'Payout Multiplier'},
      {key:'guess_min_bet', label:'Min Bet'},
      {key:'guess_max_bet', label:'Max Bet'},
      {key:'guess_house_edge', label:'House Edge %'},
      {key:'guess_cooldown_sec', label:'Cooldown sec'},
    ], desc:''},
    { title:'Crash • New', fields:[
      {key:'crash_min_bet', label:'Min Bet'},
      {key:'crash_max_bet', label:'Max Bet'},
      {key:'crash_house_edge', label:'House Edge %'},
      {key:'crash_max_multiplier', label:'Max Multiplier'},
      {key:'crash_cooldown_sec', label:'Cooldown sec'},
    ], desc:''},
    { title:'Mines • New', fields:[
      {key:'mines_min_bet', label:'Min Bet'},
      {key:'mines_max_bet', label:'Max Bet'},
      {key:'mines_house_edge', label:'House Edge %'},
      {key:'mines_grid_size', label:'Grid Size'},
      {key:'mines_count', label:'Default Mines'},
      {key:'mines_cooldown_sec', label:'Cooldown sec'},
    ], desc:''},
    { title:'Plinko • New', fields:[
      {key:'plinko_min_bet', label:'Min Bet'},
      {key:'plinko_max_bet', label:'Max Bet'},
      {key:'plinko_house_edge', label:'House Edge %'},
      {key:'plinko_max_multiplier', label:'Max Multiplier'},
      {key:'plinko_cooldown_sec', label:'Cooldown sec'},
    ], desc:''},
    { title:'Coinflip • New', fields:[
      {key:'coinflip_min_bet', label:'Min Bet'},
      {key:'coinflip_max_bet', label:'Max Bet'},
      {key:'coinflip_payout_multiplier', label:'Payout Multiplier'},
      {key:'coinflip_house_edge', label:'House Edge %'},
      {key:'coinflip_cooldown_sec', label:'Cooldown sec'},
    ], desc:''},
    { title:'Slots • New', fields:[
      {key:'slots_min_bet', label:'Min Bet'},
      {key:'slots_max_bet', label:'Max Bet'},
      {key:'slots_house_edge', label:'House Edge %'},
      {key:'slots_jackpot_multiplier', label:'Jackpot Multiplier'},
      {key:'slots_cooldown_sec', label:'Cooldown sec'},
    ], desc:''},
    { title:'Wallet & Risk', fields:[
      {key:'wallet_min_deposit', label:'Min Deposit'},
      {key:'wallet_max_deposit', label:'Max Deposit'},
      {key:'wallet_min_withdraw', label:'Min Withdraw'},
      {key:'wallet_max_withdraw', label:'Max Withdraw'},
      {key:'wallet_daily_withdraw_limit', label:'Daily Withdraw Limit'},
      {key:'wallet_daily_deposit_limit', label:'Daily Deposit Limit'},
      {key:'wallet_wagering_multiplier', label:'Wagering Multiplier'},
      {key:'wallet_withdraw_cooldown_sec', label:'Withdraw Cooldown sec'},
      {key:'wallet_deposit_bonus_pct', label:'Deposit Bonus %'},
      {key:'wallet_referral_bonus', label:'Referral Bonus'},
      {key:'gateway_fee_pct', label:'Gateway Fee %'},
      {key:'site_maintenance', label:'Maintenance Mode', type:'bool'},
    ], desc:''},
  ]

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div>
          <div style={{ fontWeight:900, fontSize:20 }} className="flex gap8 center"><IconSettings size={20}/> Game Settings • 100X • 9 Games</div>
          <div style={{ fontSize:11, color:'#666' }}>Win % control • instant results • premium visuals • live balance</div>
        </div>
        <div className="flex gap8">
          <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
          <button className="btn btn-primary" disabled={loading} onClick={save}>Save All</button>
        </div>
      </div>

      <div className="card p14" style={{ background:'linear-gradient(135deg, #0a1a12 0%, #000 100%)', border:'1px solid #00ff8830' }}>
        <div className="flex gap8 center" style={{ fontWeight:800, fontSize:12, color:'#00ff88' }}><IconBolt size={14}/> ADMIN WIN PROBABILITY • HOW IT WORKS • 100X</div>
        <div style={{ fontSize:11, color:'#aaa', marginTop:8, lineHeight:1.6 }}>
          Har game me <b style={{ color:'#fff' }}>Win Probability %</b> set kar sakte ho (0-100). Server side <b style={{ color:'#fff' }}>crypto.getRandomValues</b> se RNG hota hai, lekin agar aap 45% set karoge to 45% players ko win milega, 55% ko loss — instant effect, no restart needed.<br/>
          <b style={{ color:'#fff' }}>Spin weights</b> bhi slice probability control karte hai — weight 30 = 30% chance. Dono milke house edge control hota hai. All results instant (0.6s - 1.8s animation), balance realtime Supabase channel se update hota hai, no refresh needed.
        </div>
      </div>

      {groups.map(g=>(
        <div key={g.title} className="card p16">
          <div style={{ fontWeight:900, fontSize:14, letterSpacing:'-0.02em' }}>{g.title.toUpperCase()}</div>
          {g.desc && <div style={{ fontSize:11, color:'#777', marginTop:4, marginBottom:12 }}>{g.desc}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12, marginTop: g.desc ? 0 : 12 }}>
            {g.fields.map(f=>(
              <div key={f.key} className="flex col gap4">
                <label style={{ fontSize:11, color:'#777', fontWeight:700 }}>{f.label}</label>
                {f.type==='bool' ? (
                  <select className="input" value={cfg[f.key] ? 'true' : 'false'} onChange={e=>setCfg({ ...cfg, [f.key]: e.target.value==='true' })}>
                    <option value="true">True</option><option value="false">False</option>
                  </select>
                ) : (
                  <input className="input" type="number" step="any" value={cfg[f.key] ?? ''} onChange={e=>setCfg({ ...cfg, [f.key]: e.target.value==='' ? null : Number(e.target.value) })} />
                )}
                {f.hint && <div style={{ fontSize:10, color:'#555' }}>{f.hint}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card p16">
        <div style={{ fontWeight:700, marginBottom:8 }}>Fairness • Instant • Live</div>
        <div style={{ fontSize:12, color:'#777', lineHeight:1.6 }}>
          - All games: server-side crypto RNG, instant response &lt;200ms, client animates 0.6-1.8s premium.<br/>
          - Balance: realtime via Supabase postgres_changes channel on profiles table, no refresh.<br/>
          - History: realtime INSERT subscription, auto-reload.<br/>
          - Admin: win % controls override RNG for house management, 100% configurable.
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
