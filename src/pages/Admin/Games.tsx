import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { IconGame, IconRefresh, IconBolt } from '../../lib/icons'

export default function AdminGames() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const load = async ()=>{
    setLoading(true)
    const tables = ['lottery_tickets','spin_history','dice_history','guess_history','crash_history','mines_history','plinko_history','coinflip_history','slots_history']
    const res:any = {}
    for (const t of tables) {
      try {
        const { count } = await supabase.from(t).select('*',{count:'exact', head:true})
        const { data } = await supabase.from(t).select('bet_amount, win_amount').limit(1000)
        const totalBet = data?.reduce((a:any,b:any)=>a+Number(b.bet_amount||b.amount||0),0)||0
        const totalWin = data?.reduce((a:any,b:any)=>a+Number(b.win_amount||0),0)||0
        res[t] = { count: count||0, totalBet, totalWin, edge: totalBet>0 ? ((totalBet-totalWin)/totalBet*100).toFixed(2) : 0 }
      } catch(e){
        res[t] = { count:0, totalBet:0, totalWin:0, edge:0, error:'table not migrated yet' }
      }
    }
    // wallet ledger for 9 games
    try {
      const { data: ledger } = await supabase.from('wallet_ledger').select('game_type, amount, type').eq('type','bet').limit(2000)
      const byGame:any={}
      ledger?.forEach((l:any)=>{
        const g=l.game_type||'unknown'
        byGame[g]=(byGame[g]||0)+Number(l.amount||0)
      })
      res['_ledger_by_game']=byGame
    } catch(e){}
    setStats(res)
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const gameMeta:any = {
    lottery_tickets:{ name:'LOTTERY', color:'#fff', icon:'🎟️' },
    spin_history:{ name:'SPIN & WIN', color:'#fff', icon:'🎡' },
    dice_history:{ name:'DICE ROLL', color:'#0a84ff', icon:'🎲' },
    guess_history:{ name:'NUMBER GUESS', color:'#00ff88', icon:'🎯' },
    crash_history:{ name:'CRASH', color:'#ff453a', icon:'🚀' },
    mines_history:{ name:'MINES', color:'#ffcc00', icon:'💎' },
    plinko_history:{ name:'PLINKO', color:'#0a84ff', icon:'🟢' },
    coinflip_history:{ name:'COINFLIP', color:'#fff', icon:'🪙' },
    slots_history:{ name:'SLOTS', color:'#ffcc00', icon:'🎰' },
  }

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div>
          <div style={{ fontWeight:900, fontSize:20 }} className="flex gap8 center"><IconGame size={20}/> Games Analytics • 9 Games • 100X</div>
          <div style={{ fontSize:11, color:'#666' }}>Instant results • live balance • win % controlled by admin</div>
        </div>
        <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
      </div>

      <div className="card p14" style={{ background:'#050505', border:'1px dashed #222' }}>
        <div className="flex gap8 center" style={{ fontWeight:800, fontSize:11, color:'#666', letterSpacing:'0.1em' }}><IconBolt size={12}/> HOW WIN % CONTROL WORKS</div>
        <div style={{ fontSize:11, color:'#777', marginTop:6, lineHeight:1.5 }}>
          Admin → Settings → Win Probability % per game (0-100). Server uses crypto.getRandomValues but if win prob 45% → 45% wins, 55% loss. Instant effect. No refresh needed for players — balance realtime via Supabase channel.
        </div>
      </div>

      {loading ? <div className="card p16">Loading...</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12 }}>
          {Object.entries(stats).filter(([k])=>!k.startsWith('_')).map(([k,v]:any)=>{
            const meta=gameMeta[k]||{ name:k, color:'#fff', icon:'🎮' }
            return (
              <div key={k} className="card p16" style={{ background:`linear-gradient(135deg, #0a0a0a 0%, #000 100%)`, border:'1px solid #1a1a1a', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-20, right:-20, width:60, height:60, background:`radial-gradient(circle, ${meta.color}15 0%, transparent 70%)`, borderRadius:'50%' }} />
                <div style={{ fontWeight:800, fontSize:12, letterSpacing:'0.08em', color:'#777' }} className="flex gap8 center">{meta.icon} {meta.name}</div>
                <div style={{ marginTop:10, fontSize:13 }} className="flex col gap4">
                  <div className="flex between"><span style={{ color:'#666' }}>Bets:</span><b>{v.count}</b></div>
                  <div className="flex between"><span style={{ color:'#666' }}>Total Bet:</span><span className="mono">₹{Number(v.totalBet).toFixed(0)}</span></div>
                  <div className="flex between"><span style={{ color:'#666' }}>Total Win:</span><span className="mono" style={{ color:'#00ff88' }}>₹{Number(v.totalWin).toFixed(0)}</span></div>
                  <div className="flex between"><span style={{ color:'#666' }}>Edge:</span><b style={{ color: Number(v.edge)>0 ? '#00ff88' : '#ff453a' }}>{v.edge}%</b></div>
                  {v.error && <div style={{ fontSize:10, color:'#ff453a', marginTop:4 }}>{v.error} — will work via ledger</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="card p16">
        <div style={{ fontWeight:800, marginBottom:8 }}>Ledger by Game (bets)</div>
        <div className="flex gap8" style={{ flexWrap:'wrap' }}>
          {stats._ledger_by_game && Object.entries(stats._ledger_by_game).map(([g,amt]:any)=>(
            <div key={g} style={{ padding:'6px 12px', background:'#111', border:'1px solid #1a1a1a', borderRadius:999, fontSize:11 }}><b>{g}</b> ₹{Number(Math.abs(Number(amt))).toFixed(0)}</div>
          ))}
        </div>
      </div>

      <div className="card p16">
        <div style={{ fontWeight:700, marginBottom:8 }}>Game Rules • Instant • Premium</div>
        <div style={{ fontSize:11, color:'#777', lineHeight:1.7, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            - Lottery: 6 numbers 1-49, tiers auto-credit.<br/>
            - Spin: premium wheel, 1.8s spin, weights + win % control.<br/>
            - Dice: instant 0.6s, roll 0-100, over/under, 99/chance.<br/>
            - Guess: 1-10 grid, instant, 8x exact.<br/>
            - Crash: multiplier rises, crash random, cashout before crash.
          </div>
          <div>
            - Mines: 5x5 grid, avoid mines, multiplier per safe tile.<br/>
            - Plinko: ball drop physics, pins, multiplier slots.<br/>
            - Coinflip: 3D flip, 1.95x, heads/tails.<br/>
            - Slots: 3 reels, jackpot 50x, premium animation.<br/>
            All server-side crypto RNG, rate-limited, realtime balance.
          </div>
        </div>
      </div>
    </div>
  )
}
