import React, { useEffect, useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { IconSpin, IconRefresh } from '../lib/icons'

const MULTIPLIERS = [
  { label:'0x', color:'#1a1a1a', mult:0 },
  { label:'1.2x', color:'#222', mult:1.2 },
  { label:'1.5x', color:'#2a2a2a', mult:1.5 },
  { label:'2x', color:'#333', mult:2 },
  { label:'5x', color:'#fff', mult:5, text:'#000' },
  { label:'JACKPOT', color:'#ffcc00', mult:10, text:'#000' },
]

export default function Spin() {
  const [history, setHistory] = useState<any[]>([])
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [bet, setBet] = useState('10')
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''), 3000) }

  const load = async ()=>{
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data } = await supabase.from('spin_history').select('*').eq('user_id', uid).order('created_at',{ascending:false}).limit(20)
    if (data) setHistory(data)
  }
  useEffect(()=>{ load() },[])

  const doSpin = async ()=>{
    const b = Number(bet)
    if (!b || b<1) { showToast('Min bet ₹1'); return }
    setSpinning(true); setResult(null)
    try {
      const res = await callEdge('/games/spin', { bet_amount: b })
      if (!res.ok) throw new Error(res.error)
      // server returns slice index
      const idx = res.result?.slice_index ?? Math.floor(Math.random()*MULTIPLIERS.length)
      const extra = 360*5 + (360 - (idx * (360/MULTIPLIERS.length))) + Math.random()*20
      setRotation(prev=> prev + extra)
      setTimeout(()=>{
        setResult(res.result)
        showToast(res.result.win_amount>0 ? `Won ₹${res.result.win_amount}! ${res.result.multiplier}x` : `Landed ${res.result.multiplier}x`)
        setSpinning(false)
        load()
      }, 4000)
    } catch(e:any){ showToast(e.message); setSpinning(false) }
  }

  return (
    <PageWrap>
      <TopBar title="SPIN & WIN" />
      <div className="p16 flex col gap16">
        <div className="card2 p20 flex col center gap16">
          <div style={{ position:'relative' }}>
            <div className="wheel-pointer" />
            <div className="wheel-container">
              <div className="wheel" style={{ transform:`rotate(${rotation}deg)` }}>
                <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
                  {MULTIPLIERS.map((m,i)=>{
                    const angle = 360/MULTIPLIERS.length
                    const start = i*angle
                    const end = start+angle
                    const x1 = 50 + 50*Math.cos((start*Math.PI)/180)
                    const y1 = 50 + 50*Math.sin((start*Math.PI)/180)
                    const x2 = 50 + 50*Math.cos((end*Math.PI)/180)
                    const y2 = 50 + 50*Math.sin((end*Math.PI)/180)
                    return <path key={i} d={`M50 50 L${x1} ${y1} A50 50 0 0 1 ${x2} ${y2} Z`} fill={m.color} stroke="#000" strokeWidth={0.5} />
                  })}
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:60, height:60, background:'#000', border:'3px solid #fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>W</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap8" style={{ flexWrap:'wrap', justifyContent:'center' }}>
            {MULTIPLIERS.map(m=>(
              <div key={m.label} style={{ padding:'4px 10px', background:m.color, color:(m as any).text||'#fff', borderRadius:999, fontSize:11, fontWeight:800, border:'1px solid #222' }}>{m.label}</div>
            ))}
          </div>

          {result && (
            <div className="card p12 w100" style={{ textAlign:'center', background:'#111' }}>
              <div style={{ fontWeight:800, fontSize:18, color: result.win_amount>0?'#00ff88':'#fff' }}>{result.multiplier}x • {result.win_amount>0?`+₹${result.win_amount}`:'No win'}</div>
              <div style={{ fontSize:11, color:'#777', marginTop:4 }} className="mono">Provably fair • seed {result.seed?.slice(0,8)}</div>
            </div>
          )}

          <div className="flex gap8 w100">
            <input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} placeholder="Bet ₹" style={{ flex:1 }} />
            <button className="btn btn-primary" disabled={spinning} onClick={doSpin} style={{ flex:1 }}>{spinning?'Spinning...':'SPIN'}</button>
          </div>
        </div>

        <div className="card p16">
          <div className="flex between center mb12">
            <div style={{ fontWeight:700, fontSize:13 }}>My Spins</div>
            <button className="btn btn-ghost" style={{ padding:'6px 10px' }} onClick={load}><IconRefresh size={14}/></button>
          </div>
          <div className="flex col gap8">
            {history.map((h:any)=>(
              <div key={h.id} className="flex between center" style={{ padding:'8px 0', borderBottom:'1px solid #111', fontSize:12 }}>
                <span className="mono">Bet ₹{Number(h.bet_amount).toFixed(2)} → {h.multiplier}x</span>
                <span style={{ fontWeight:700, color: Number(h.win_amount)>0?'#00ff88':'#777' }}>{Number(h.win_amount)>0?`+₹${Number(h.win_amount).toFixed(2)}`:`₹0`}</span>
              </div>
            ))}
            {history.length===0 && <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:12 }}>No spins yet</div>}
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
