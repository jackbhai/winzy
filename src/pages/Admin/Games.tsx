import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { IconGame, IconRefresh } from '../../lib/icons'

export default function AdminGames() {
  const [stats, setStats] = useState<any>({})

  const load = async ()=>{
    const tables = ['lottery_tickets','spin_history','dice_history','guess_history']
    const res:any = {}
    for (const t of tables) {
      const { count } = await supabase.from(t).select('*',{count:'exact', head:true})
      const { data } = await supabase.from(t).select('bet_amount, win_amount').limit(1000)
      const totalBet = data?.reduce((a:any,b:any)=>a+Number(b.bet_amount||b.amount||0),0)||0
      const totalWin = data?.reduce((a:any,b:any)=>a+Number(b.win_amount||0),0)||0
      res[t] = { count, totalBet, totalWin, edge: totalBet>0 ? ((totalBet-totalWin)/totalBet*100).toFixed(2) : 0 }
    }
    setStats(res)
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div style={{ fontWeight:800, fontSize:20 }} className="flex gap8 center"><IconGame size={20}/> Games Analytics</div>
        <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
        {Object.entries(stats).map(([k,v]:any)=>(
          <div key={k} className="card p16">
            <div style={{ fontWeight:800, fontSize:12, letterSpacing:'0.08em', color:'#777' }}>{k.toUpperCase()}</div>
            <div style={{ marginTop:8, fontSize:13 }} className="flex col gap4">
              <div>Count: <b>{v.count}</b></div>
              <div>Bet: ₹{Number(v.totalBet).toFixed(2)}</div>
              <div>Win: ₹{Number(v.totalWin).toFixed(2)}</div>
              <div>Edge: <b style={{ color: Number(v.edge)>0 ? '#00ff88' : '#ff453a' }}>{v.edge}%</b></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p16">
        <div style={{ fontWeight:700, marginBottom:8 }}>Game Rules (server-side)</div>
        <div style={{ fontSize:12, color:'#777', lineHeight:1.6 }}>
          - Lottery: 6 numbers 1-49, tiers auto-credit.<br/>
          - Spin: weights → slice, multiplier applied.<br/>
          - Dice: roll 0-100, over/under, payout 99/chance.<br/>
          - Guess: 1-10 random, 8x exact.<br/>
          All validated server-side, rate-limited.
        </div>
      </div>
    </div>
  )
}
