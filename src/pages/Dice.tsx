import React, { useEffect, useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { IconDice, IconRefresh } from '../lib/icons'

export default function Dice() {
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
  useEffect(()=>{ load() },[])

  const payout = ()=>{
    const t = target
    const chance = over ? (100 - t) : t
    if (chance<=0 || chance>=100) return 0
    return Number((99 / chance).toFixed(2))
  }

  const roll = async ()=>{
    const b = Number(bet)
    if (!b || b<1) { showToast('Min ₹1'); return }
    setRolling(true)
    try {
      const res = await callEdge('/games/dice', { bet_amount: b, target, over })
      if (!res.ok) throw new Error(res.error)
      setResult(res.result)
      showToast(res.result.win ? `Won ₹${res.result.win_amount}` : `Rolled ${res.result.roll} — lost`)
      load()
    } catch(e:any){ showToast(e.message) } finally { setRolling(false) }
  }

  return (
    <PageWrap>
      <TopBar title="DICE ROLL" />
      <div className="p16 flex col gap16">
        <div className="card2 p20">
          <div className="flex between center mb16">
            <div style={{ fontWeight:700, fontSize:13 }}>ROLL {over?'OVER':'UNDER'} {target}</div>
            <div style={{ fontSize:11, background:'#111', border:'1px solid #222', borderRadius:999, padding:'4px 10px' }}>{payout()}x payout</div>
          </div>

          <div className="dice-box" style={{ background: result ? (result.win ? '#00ff88' : '#111') : '#0a0a0a', color: result?.win ? '#000' : '#fff', transition:'all 0.3s' }}>
            {rolling ? '...' : result ? result.roll.toFixed(2) : '--'}
          </div>

          {result && (
            <div style={{ textAlign:'center', marginTop:12, fontWeight:700, color: result.win ? '#00ff88' : '#ff453a' }}>
              {result.win ? `WIN +₹${result.win_amount}` : `LOSS • rolled ${result.roll.toFixed(2)}`}
            </div>
          )}

          <div className="flex gap8 mt16">
            <button className="btn" style={{ flex:1, background: over ? '#fff' : '#111', color: over ? '#000' : '#777' }} onClick={()=>setOver(true)}>OVER</button>
            <button className="btn" style={{ flex:1, background: !over ? '#fff' : '#111', color: !over ? '#000' : '#777' }} onClick={()=>setOver(false)}>UNDER</button>
          </div>

          <div style={{ marginTop:16 }}>
            <div className="flex between" style={{ fontSize:11, color:'#777' }}><span>1</span><span>Target: {target}</span><span>99</span></div>
            <input type="range" min={5} max={95} step={0.5} value={target} onChange={e=>setTarget(Number(e.target.value))} style={{ width:'100%', marginTop:8 }} />
          </div>

          <div className="flex gap8 mt16">
            <input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} placeholder="Bet ₹" />
            <button className="btn btn-primary" style={{ flex:1 }} disabled={rolling} onClick={roll}>{rolling?'Rolling...':'ROLL'}</button>
          </div>
        </div>

        <div className="card p16">
          <div className="flex between center mb12"><div style={{ fontWeight:700, fontSize:13 }}>History</div><button className="btn btn-ghost" style={{ padding:'6px 10px' }} onClick={load}><IconRefresh size={14}/></button></div>
          <div className="flex col gap8">
            {history.map((h:any)=>(
              <div key={h.id} className="flex between center" style={{ fontSize:12, padding:'8px 0', borderBottom:'1px solid #111' }}>
                <span className="mono">{h.over?'OVER':'UNDER'} {h.target} • roll {Number(h.roll).toFixed(2)}</span>
                <span style={{ fontWeight:700, color: Number(h.win_amount)>0?'#00ff88':'#777' }}>{Number(h.win_amount)>0?`+₹${Number(h.win_amount).toFixed(2)}`:'LOSS'}</span>
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
