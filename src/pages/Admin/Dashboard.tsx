import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconChart, IconWallet, IconUsers, IconTicket, IconRefresh } from '../../lib/icons'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const load = async ()=>{
    setLoading(true)
    try {
      const res = await callEdge('/admin/dashboard', {}, 'POST')
      if (res.ok) setStats(res.stats)
      else {
        // fallback via direct queries
        const { data: profiles } = await supabase.from('profiles').select('balance, lifetime_deposits, lifetime_bets, lifetime_wins')
        const totalBalance = profiles?.reduce((a:any,b:any)=>a+Number(b.balance||0),0)||0
        const totalDep = profiles?.reduce((a:any,b:any)=>a+Number(b.lifetime_deposits||0),0)||0
        const totalBets = profiles?.reduce((a:any,b:any)=>a+Number(b.lifetime_bets||0),0)||0
        const totalWins = profiles?.reduce((a:any,b:any)=>a+Number(b.lifetime_wins||0),0)||0
        const { count: depCount } = await supabase.from('deposits').select('*',{count:'exact', head:true})
        const { count: wdCount } = await supabase.from('withdrawals').select('*',{count:'exact', head:true})
        const { count: userCount } = await supabase.from('profiles').select('*',{count:'exact', head:true})
        setStats({ totalBalance, totalDep, totalBets, totalWins, depCount, wdCount, userCount, houseEdge: totalBets>0 ? ((totalBets-totalWins)/totalBets*100).toFixed(2) : 0 })
      }
    } catch(e){ console.error(e) }
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const cards = [
    { label:'Total Users', value: stats.userCount||0, icon: IconUsers },
    { label:'Total Balance', value: `₹${Number(stats.totalBalance||0).toFixed(2)}`, icon: IconWallet },
    { label:'Deposits (lifetime)', value: `₹${Number(stats.totalDep||0).toFixed(2)} (${stats.depCount||0})`, icon: IconChart },
    { label:'Bets / Wins', value: `₹${Number(stats.totalBets||0).toFixed(0)} / ₹${Number(stats.totalWins||0).toFixed(0)}`, icon: IconTicket },
    { label:'House Edge', value: `${stats.houseEdge||0}%`, icon: IconChart },
    { label:'Withdrawals', value: `${stats.wdCount||0}`, icon: IconWallet },
  ]

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div style={{ fontWeight:800, fontSize:20 }}>Dashboard</div>
        <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
      </div>
      {loading ? <div className="card p16">Loading...</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
          {cards.map((c:any,i)=>(
            <div key={i} className="card p16">
              <div className="flex gap8 center" style={{ color:'#777', fontSize:12, fontWeight:700, letterSpacing:'0.08em' }}><c.icon size={14} color="#777"/> {c.label.toUpperCase()}</div>
              <div style={{ fontWeight:800, fontSize:18, marginTop:8 }} className="mono">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card p16">
        <div style={{ fontWeight:700, marginBottom:8 }}>Economics</div>
        <div style={{ fontSize:12, color:'#777', lineHeight:1.6 }}>
          - Payouts come from merchant unsettled pool (deposits minus gateway fee).<br/>
          - WINZY can never pay more than it earned.<br/>
          - All game outcomes server-side crypto RNG.<br/>
          - Rate-limit on all money ops.
        </div>
      </div>
    </div>
  )
}
