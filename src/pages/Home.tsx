import React, { useEffect, useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { IconTicket, IconSpin, IconDice, IconTarget, IconBolt, IconCrown, IconArrow, IconFire } from '../lib/icons'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { profile, refresh } = useAuth()
  const nav = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [draws, setDraws] = useState<any[]>([])
  const [recentWins, setRecentWins] = useState<any[]>([])

  useEffect(()=>{
    (async()=>{
      // auto-reconcile pending deposits
      try { await callEdge('/deposit/reconcile', {}) } catch {}
      const { data: d } = await supabase.from('lottery_draws').select('*').eq('status','open').order('created_at',{ascending:false}).limit(1)
      if (d) setDraws(d)
      const { data: w } = await supabase.from('wallet_ledger').select('*').eq('type','win').order('created_at',{ascending:false}).limit(6)
      if (w) setRecentWins(w)
      refresh()
      const { data: s } = await supabase.from('profiles').select('balance').limit(1) // dummy to keep
      setStats(s)
    })()
  },[])

  const games = [
    { id:'lottery', name:'LOTTERY', desc:'Pick 6 • Win big', icon: IconTicket, color:'#fff', path:'/lottery' },
    { id:'spin', name:'SPIN & WIN', desc:'Wheel of multipliers', icon: IconSpin, color:'#00ff88', path:'/spin' },
    { id:'dice', name:'DICE ROLL', desc:'Over/under • Instant', icon: IconDice, color:'#0a84ff', path:'/dice' },
    { id:'guess', name:'NUMBER GUESS', desc:'1-10 • 8x payout', icon: IconTarget, color:'#ffcc00', path:'/guess' },
  ]

  return (
    <PageWrap>
      <TopBar title="WINZY" />
      <div className="p16 flex col gap16">
        {/* Balance card */}
        <div className="card2 p20" style={{ background:'linear-gradient(135deg, #111 0%, #000 60%, #111 100%)', border:'1px solid #222', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:120, height:120, background:'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius:'50%' }} />
          <div style={{ fontSize:12, letterSpacing:'0.15em', color:'#666', fontWeight:700 }}>TOTAL BALANCE</div>
          <div style={{ fontSize:36, fontWeight:800, marginTop:6, letterSpacing:'-0.03em' }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div>
          <div className="flex gap8 mt12">
            <button className="btn btn-primary" style={{ flex:1 }} onClick={()=>nav('/wallet')}>Deposit</button>
            <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>nav('/wallet')}>Withdraw</button>
          </div>
          <div className="flex gap12 mt16" style={{ fontSize:11, color:'#555' }}>
            <span>Bets: ₹{Number(profile?.lifetime_bets||0).toFixed(0)}</span>
            <span>•</span>
            <span>Wins: ₹{Number(profile?.lifetime_wins||0).toFixed(0)}</span>
          </div>
        </div>

        {/* Active lottery */}
        {draws[0] && (
          <div className="card p16 flex between center" onClick={()=>nav('/lottery')} style={{ cursor:'pointer' }}>
            <div className="flex gap12 center">
              <div style={{ width:44, height:44, background:'#111', border:'1px solid #222', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}><IconCrown color="#ffcc00" /></div>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>Lottery Draw #{draws[0].draw_number}</div>
                <div style={{ fontSize:12, color:'#777' }}>Pot: ₹{Number(draws[0].total_pot||0).toFixed(2)} • {draws[0].tickets_count||0} tickets</div>
              </div>
            </div>
            <IconArrow color="#555" />
          </div>
        )}

        {/* Games grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {games.map(g=>(
            <div key={g.id} className="card p16" style={{ cursor:'pointer', border:'1px solid #1a1a1a', background:'#0a0a0a' }} onClick={()=>nav(g.path)}>
              <div style={{ width:40, height:40, background:'#111', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, border:'1px solid #222' }}>
                <g.icon color={g.color} size={20} />
              </div>
              <div style={{ fontWeight:800, fontSize:13, letterSpacing:'0.02em' }}>{g.name}</div>
              <div style={{ fontSize:11, color:'#666', marginTop:4 }}>{g.desc}</div>
            </div>
          ))}
        </div>

        {/* Recent wins ticker */}
        <div className="card p16">
          <div className="flex between center mb8">
            <div className="flex gap8 center" style={{ fontWeight:700, fontSize:13 }}><IconFire size={14} color="#ff453a" /> RECENT WINS</div>
            <div style={{ fontSize:11, color:'#555' }}>LIVE</div>
          </div>
          <div className="flex col gap8">
            {recentWins.length===0 ? <div style={{ color:'#555', fontSize:12 }}>No wins yet — be the first!</div> :
              recentWins.map((w:any,i)=>(
                <div key={i} className="flex between center" style={{ fontSize:12, padding:'8px 0', borderBottom: i<recentWins.length-1 ? '1px solid #111' : 'none' }}>
                  <span className="mono" style={{ color:'#888' }}>{w.user_id?.slice(0,6)}... won</span>
                  <span style={{ color:'#00ff88', fontWeight:700 }}>₹{Number(w.amount).toFixed(2)} • {w.game_type||'game'}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* How it works */}
        <div className="card p16" style={{ background:'#050505', border:'1px dashed #222' }}>
          <div className="flex gap8 center" style={{ fontWeight:700, fontSize:12, letterSpacing:'0.1em', color:'#777' }}><IconBolt size={12} /> FAIRNESS</div>
          <div style={{ fontSize:12, color:'#666', marginTop:8, lineHeight:1.5 }}>
            All outcomes decided server-side with crypto RNG. Client only animates result. No tampering via DevTools.
          </div>
        </div>
      </div>
    </PageWrap>
  )
}
