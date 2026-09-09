import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconSettings, IconRefresh } from '../../lib/icons'

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
      showToast('Settings saved')
      load()
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  // 50+ fields grouped
  const groups: { title:string; fields:{key:string; label:string; type?:string}[] }[] = [
    { title:'Lottery', fields:[
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
    { title:'Spin & Win', fields:[
      {key:'spin_cost', label:'Cost Per Spin'},
      {key:'spin_multiplier_0', label:'Mult 0x'},
      {key:'spin_multiplier_1_2', label:'Mult 1.2x'},
      {key:'spin_multiplier_1_5', label:'Mult 1.5x'},
      {key:'spin_multiplier_2', label:'Mult 2x'},
      {key:'spin_multiplier_5', label:'Mult 5x'},
      {key:'spin_multiplier_jackpot', label:'Mult Jackpot'},
      {key:'spin_weight_0', label:'Weight 0x'},
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
    ]},
    { title:'Number Guess', fields:[
      {key:'guess_cost', label:'Cost'},
      {key:'guess_payout_multiplier', label:'Payout Multiplier'},
      {key:'guess_min_bet', label:'Min Bet'},
      {key:'guess_max_bet', label:'Max Bet'},
      {key:'guess_house_edge', label:'House Edge %'},
      {key:'guess_cooldown_sec', label:'Cooldown sec'},
    ]},
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
    ]},
  ]

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div style={{ fontWeight:800, fontSize:20 }} className="flex gap8 center"><IconSettings size={20}/> Game Settings (50+ params)</div>
        <div className="flex gap8">
          <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
          <button className="btn btn-primary" disabled={loading} onClick={save}>Save All</button>
        </div>
      </div>

      {groups.map(g=>(
        <div key={g.title} className="card p16">
          <div style={{ fontWeight:800, fontSize:14, marginBottom:12, letterSpacing:'0.05em' }}>{g.title.toUpperCase()}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
            {g.fields.map(f=>(
              <div key={f.key} className="flex col gap4">
                <label style={{ fontSize:11, color:'#777', fontWeight:700 }}>{f.label}</label>
                {f.type==='bool' ? (
                  <select className="input" value={cfg[f.key] ? 'true' : 'false'} onChange={e=>setCfg({ ...cfg, [f.key]: e.target.value==='true' })}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input className="input" type="number" step="any" value={cfg[f.key] ?? ''} onChange={e=>setCfg({ ...cfg, [f.key]: e.target.value==='' ? null : Number(e.target.value) })} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card p16">
        <div style={{ fontWeight:700, marginBottom:8 }}>How fairness works</div>
        <div style={{ fontSize:12, color:'#777', lineHeight:1.6 }}>
          - Spin weights control probability server-side.<br/>
          - Dice payout = 99 / chance * (1 - house_edge).<br/>
          - Guess exact 1-10 pays 8x (configurable).<br/>
          - Lottery tiers % of pot distributed to match 3/4/5/6.<br/>
          - All RNG uses crypto.getRandomValues in edge function.
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
