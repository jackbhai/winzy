import React, { useEffect, useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { IconRefresh, IconBolt } from '../lib/icons'

export default function Dice() {
  const { profile, updateBalance } = useAuth()
  const [target, setTarget] = useState(52.5)
  const [bet, setBet] = useState('10')
  const [over, setOver] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''), 3000) }

  const load = async ()=>{
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data } = await supabase.from('dice_history').select('*').eq('user_id', uid).order('created_at',{ascending:false}).limit(20)
    if (data) setHistory(data)
  }
  useEffect(()=>{ load()
    supabase.auth.getUser().then(({data})=>{
      const id=data.user?.id
      if(!id) return
      const ch=supabase.channel(`dice-${id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'dice_history',filter:`user_id=eq.${id}`},()=>load()).subscribe()
      return ()=>supabase.removeChannel(ch)
    })
  },[])

  const payout = ()=>{
    const t = target
    const chance = over ? (100 - t) : t
    if (chance<=0 || chance>=100) return 0
    return Number((99 / chance).toFixed(2))
  }

  const roll = async ()=>{
    const b = Number(bet)
    if (!b || b<1) { showToast('Min ₹1'); return }
    if(profile && Number(profile.balance)<b){ showToast('Insufficient'); return }
    setRolling(true)
    // instant animation 600ms
    let anim=0
    const int=setInterval(()=>{ anim+=1; setResult({ roll: (Math.random()*100).toFixed(2), win:false }) }, 60)
    try {
      const res = await callEdge('/games/dice', { bet_amount: b, target, over })
      if (!res.ok) throw new Error(res.error)
      setTimeout(()=>{
        clearInterval(int)
        setResult(res.result)
        if(res.balance!==undefined) updateBalance(res.balance)
        showToast(res.result.win ? `🎲 Won ₹${res.result.win_amount} • ${res.result.roll}` : `🎲 ${res.result.roll} — lost`)
        load()
        setRolling(false)
      }, 600)
    } catch(e:any){ clearInterval(int); showToast(e.message); setRolling(false) }
  }

  return (
    <PageWrap>
      <TopBar title="DICE ROLL • PREMIUM" />
      <div className="p16 flex col gap16">
        <div className="card p12 flex between center"><div><div style={{ fontSize:10, color:'#666', fontWeight:800 }}>LIVE BALANCE</div><div style={{ fontWeight:900, fontSize:18, color:'#00ff88' }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div></div><div style={{ fontSize:11, background:'#111', border:'1px solid #222', borderRadius:999, padding:'4px 10px', fontWeight:800 }}>{payout()}x</div></div>

        <div className="card2 p20 flex col gap16" style={{ background:'radial-gradient(circle at 50% 0%, #0a0a1a 0%, #000 100%)' }}>
          <div className="flex between center">
            <div style={{ fontWeight:800, fontSize:14 }} className="flex gap8 center"><IconBolt size={14}/> ROLL {over?'OVER':'UNDER'} {target}</div>
            <div style={{ fontSize:11, color:'#00ff88', fontWeight:800 }}>{result?.win ? 'WIN' : result ? 'LOSS' : 'READY'}</div>
          </div>

          <div style={{ height:100, background: result ? (result.win ? '#0a1a12' : '#1a0a0a') : '#000', border:`2px solid ${result?.win ? '#00ff8830' : '#1a1a1a'}`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:42, color: result?.win ? '#00ff88' : '#fff', transition:'all 0.2s', boxShadow: result?.win ? '0 0 30px rgba(0,255,136,0.2)' : 'none' }}>
            {rolling ? '...' : result ? Number(result.roll).toFixed(2) : '--'}
          </div>

          {result && (
            <div style={{ textAlign:'center', fontWeight:800, color: result.win ? '#00ff88' : '#ff453a' }}>
              {result.win ? `WIN +₹${result.win_amount} • ${result.multiplier}x` : `LOSS • rolled ${Number(result.roll).toFixed(2)} • target ${result.target} ${result.over?'OVER':'UNDER'}`}
            </div>
          )}

          <div className="flex gap8">
            <button className="btn" style={{ flex:1, background: over ? '#fff' : '#111', color: over ? '#000' : '#777', fontWeight:800 }} onClick={()=>setOver(true)}>OVER</button>
            <button className="btn" style={{ flex:1, background: !over ? '#fff' : '#111', color: !over ? '#000' : '#777', fontWeight:800 }} onClick={()=>setOver(false)}>UNDER</button>
          </div>

          <div>
            <div className="flex between" style={{ fontSize:11, color:'#777' }}><span>1</span><span>Target: {target}</span><span>99</span></div>
            <input type="range" min={5} max={95} step={0.5} value={target} onChange={e=>setTarget(Number(e.target.value))} style={{ width:'100%', marginTop:8, accentColor:'#fff' }} />
          </div>

          <div className="flex col gap8">
            <div className="flex gap8">
              {[10,50,100].map(v=>(
                <button key={v} onClick={()=>setBet(String(v))} className="btn" style={{ flex:1, background: bet==String(v)?'#fff':'#111', color: bet==String(v)?'#000':'#666', padding:'8px', fontSize:11, fontWeight:800 }}>₹{v}</button>
              ))}
            </div>
            <div className="flex gap8">
              <input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} placeholder="Bet ₹" style={{ flex:1 }} />
              <button className="btn btn-primary" style={{ flex:1, fontWeight:900, background: rolling ? '#222' : '#fff', color:'#000' }} disabled={rolling} onClick={roll}>{rolling?'ROLLING...':'ROLL 🎲'}</button>
            </div>
          </div>
        </div>

        <div className="card p16">
          <div className="flex between center mb12"><div style={{ fontWeight:800, fontSize:13 }}>History • Instant</div><button className="btn btn-ghost" style={{ padding:'6px 10px' }} onClick={load}><IconRefresh size={14}/></button></div>
          <div className="flex col gap8">
            {history.map((h:any)=>(
              <div key={h.id} className="flex between center" style={{ fontSize:12, padding:'10px 12px', background:'#000', border:'1px solid #111', borderRadius:10 }}>
                <span className="mono">{h.over?'OVER':'UNDER'} {h.target} • roll {Number(h.roll).toFixed(2)}</span>
                <span style={{ fontWeight:800, color: Number(h.win_amount)>0?'#00ff88':'#777' }}>{Number(h.win_amount)>0?`+₹${Number(h.win_amount).toFixed(2)}`:'LOSS'}</span>
              </div>
            ))}
            {history.length===0 && <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:12 }}>No rolls yet</div>}
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
