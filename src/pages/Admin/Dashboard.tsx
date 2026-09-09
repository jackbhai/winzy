import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconChart, IconWallet, IconUsers, IconTicket, IconRefresh, IconBolt, IconBank, IconGame, IconFire, IconCrown } from '../../lib/icons'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({})
  const [recentDep, setRecentDep] = useState<any[]>([])
  const [recentWd, setRecentWd] = useState<any[]>([])
  const [topPlayers, setTopPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async ()=>{
    setLoading(true)
    try {
      const res = await callEdge('/admin/dashboard', {}, 'POST')
      if (res.ok) setStats(res.stats)
      const { data: dep } = await supabase.from('deposits').select('*, profiles(username)').order('created_at',{ascending:false}).limit(5)
      if (dep) setRecentDep(dep)
      const { data: wd } = await supabase.from('withdrawals').select('*, profiles(username)').order('created_at',{ascending:false}).limit(5)
      if (wd) setRecentWd(wd)
      const { data: top } = await supabase.from('profiles').select('*').order('balance',{ascending:false}).limit(6)
      if (top) setTopPlayers(top)
      // fallback stats if edge fails
      if (!res?.ok) {
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
    { label:'Total Players', value: stats.userCount||0, sub:`${stats.depCount||0} deposits`, icon: IconUsers, color:'#fff', bg:'#111' },
    { label:'Total Balance', value: `₹${Number(stats.totalBalance||0).toFixed(2)}`, sub:'All users coins', icon: IconWallet, color:'#00ff88', bg:'#0a1a12' },
    { label:'Lifetime Deposits', value: `₹${Number(stats.totalDep||0).toFixed(2)}`, sub:`${stats.depCount||0} orders`, icon: IconBank, color:'#0a84ff', bg:'#0a121a' },
    { label:'Bets vs Wins', value: `₹${Number(stats.totalBets||0).toFixed(0)} / ₹${Number(stats.totalWins||0).toFixed(0)}`, sub:`Edge ${stats.houseEdge||0}%`, icon: IconGame, color:'#ffcc00', bg:'#1a160a' },
    { label:'Withdrawals', value: `${stats.wdCount||0}`, sub:`₹${Number(stats.totalBets ? stats.totalBets - stats.totalWins : 0).toFixed(0)} house profit`, icon: IconWallet, color:'#ff453a', bg:'#1a0a0a' },
    { label:'Active Lottery', value: 'Live', sub:'Draw control ready', icon: IconTicket, color:'#fff', bg:'#111' },
  ]

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div>
          <div style={{ fontWeight:900, fontSize:22, letterSpacing:'-0.03em' }}>Dashboard • 100X</div>
          <div style={{ fontSize:11, color:'#666', marginTop:2, letterSpacing:'0.08em' }}>AMOLED • REAL DATA • SERVER-SIDE FAIRNESS</div>
        </div>
        <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
      </div>

      {loading ? <div className="card p16">Loading real stats...</div> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12 }}>
            {cards.map((c:any,i)=>(
              <div key={i} className="card p16" style={{ background:`linear-gradient(135deg, ${c.bg} 0%, #050505 100%)`, border:'1px solid #1a1a1a', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, background:`radial-gradient(circle, ${c.color}15 0%, transparent 70%)`, borderRadius:'50%' }} />
                <div className="flex between center">
                  <div style={{ width:36, height:36, background:'#000', border:'1px solid #222', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <c.icon size={16} color={c.color}/>
                  </div>
                  <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.1em', color:'#555' }}>{c.label.toUpperCase()}</div>
                </div>
                <div style={{ fontWeight:900, fontSize:20, marginTop:12 }} className="mono">{c.value}</div>
                <div style={{ fontSize:11, color:'#777', marginTop:4 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="card p16">
              <div className="flex between center mb12">
                <div style={{ fontWeight:800, fontSize:13 }} className="flex gap8 center"><IconBank size={14}/> Recent Deposits</div>
                <div style={{ fontSize:10, color:'#555' }}>LIVE</div>
              </div>
              <div className="flex col gap8">
                {recentDep.map((d:any)=>(
                  <div key={d.id} className="flex between center" style={{ padding:'8px 10px', background:'#000', border:'1px solid #111', borderRadius:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:12 }}>{d.profiles?.username||d.user_id.slice(0,6)} • ₹{Number(d.amount).toFixed(0)}</div>
                      <div style={{ fontSize:10, color:'#666' }} className="mono">{d.order_ref.slice(0,14)} • {new Date(d.created_at).toLocaleTimeString()}</div>
                    </div>
                    <div style={{ padding:'2px 8px', borderRadius:999, background: d.status==='paid'?'#00ff8815':'#111', color: d.status==='paid'?'#00ff88':'#777', fontSize:10, fontWeight:700 }}>{d.status}</div>
                  </div>
                ))}
                {recentDep.length===0 && <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:20 }}>No deposits yet</div>}
              </div>
            </div>

            <div className="card p16">
              <div className="flex between center mb12">
                <div style={{ fontWeight:800, fontSize:13 }} className="flex gap8 center"><IconWallet size={14}/> Recent Payouts</div>
                <div style={{ fontSize:10, color:'#555' }}>LIVE</div>
              </div>
              <div className="flex col gap8">
                {recentWd.map((w:any)=>(
                  <div key={w.id} className="flex between center" style={{ padding:'8px 10px', background:'#000', border:'1px solid #111', borderRadius:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:12 }}>{w.profiles?.username||w.user_id.slice(0,6)} • ₹{Number(w.amount).toFixed(0)}</div>
                      <div style={{ fontSize:10, color:'#666' }} className="mono">{w.order_ref_target.slice(0,14)} • {new Date(w.created_at).toLocaleTimeString()}</div>
                    </div>
                    <div style={{ padding:'2px 8px', borderRadius:999, background: w.status==='paid'?'#00ff8815':'#111', color: w.status==='paid'?'#00ff88':'#777', fontSize:10, fontWeight:700 }}>{w.status}</div>
                  </div>
                ))}
                {recentWd.length===0 && <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:20 }}>No payouts yet</div>}
              </div>
            </div>
          </div>

          <div className="card p16">
            <div style={{ fontWeight:800, fontSize:13, marginBottom:12 }} className="flex gap8 center"><IconCrown size={14}/> Top Players (by balance)</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10 }}>
              {topPlayers.map((p:any)=>(
                <div key={p.id} style={{ padding:'12px', background:'#000', border:'1px solid #111', borderRadius:12, display:'flex', gap:10, alignItems:'center' }}>
                  <div style={{ width:36, height:36, background:'#111', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>{(p.username||'U')[0].toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:12 }}>{p.username||p.email?.split('@')[0]}</div>
                    <div style={{ fontSize:11, color:'#00ff88' }} className="mono">₹{Number(p.balance||0).toFixed(2)}</div>
                    <div style={{ fontSize:10, color:'#555' }}>Bets ₹{Number(p.lifetime_bets||0).toFixed(0)} • {p.is_admin?'ADMIN':''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p16" style={{ background:'#050505', border:'1px dashed #222' }}>
            <div className="flex gap8 center" style={{ fontWeight:800, fontSize:11, letterSpacing:'0.12em', color:'#666' }}><IconBolt size={12}/> SECURITY & ECONOMICS • 100X</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
              <div style={{ fontSize:11, color:'#777', lineHeight:1.6 }}>
                <b style={{ color:'#fff' }}>Gateway:</b> Payouts from merchant unsettled pool only. Never overdraw.<br/>
                <b style={{ color:'#fff' }}>Fairness:</b> crypto.getRandomValues server-side, client only animates.<br/>
                <b style={{ color:'#fff' }}>Wagering:</b> bets ≥ deposits * multiplier, anti-abuse.
              </div>
              <div style={{ fontSize:11, color:'#777', lineHeight:1.6 }}>
                <b style={{ color:'#fff' }}>Rate-limit:</b> 10 deposits/min, 5 withdrawals/min, 30 spins/min.<br/>
                <b style={{ color:'#fff' }}>RLS:</b> winzy_is_admin() on all tables, service_role bypass for edge.<br/>
                <b style={{ color:'#fff' }}>Hidden Admin:</b> /admin blocked, secret route + 7-tap gesture.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
