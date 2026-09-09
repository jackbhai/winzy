import React, { useEffect, useState, useRef } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { IconRefresh, IconBolt } from '../lib/icons'

const SLICES = [
  { label:'0x', color:'#0a0a0a', border:'#1a1a1a', mult:0, prob:30 },
  { label:'1.2x', color:'#151515', border:'#222', mult:1.2, prob:25 },
  { label:'1.5x', color:'#1c1c1c', border:'#2a2a2a', mult:1.5, prob:20 },
  { label:'2x', color:'#222', border:'#333', mult:2, prob:15 },
  { label:'5x', color:'#fff', border:'#fff', mult:5, text:'#000', prob:8 },
  { label:'JACKPOT', color:'#ffcc00', border:'#ffcc00', mult:10, text:'#000', prob:2 },
]

export default function Spin() {
  const { profile, updateBalance } = useAuth()
  const [history, setHistory] = useState<any[]>([])
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [bet, setBet] = useState('10')
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''), 3500) }

  const load = async ()=>{
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data } = await supabase.from('spin_history').select('*').eq('user_id', uid).order('created_at',{ascending:false}).limit(20)
    if (data) setHistory(data)
  }
  useEffect(()=>{ load()
    supabase.auth.getUser().then(({data})=>{
      const id=data.user?.id
      if(!id) return
      const ch=supabase.channel(`spin-${id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'spin_history',filter:`user_id=eq.${id}`},()=>load()).subscribe()
      return ()=>supabase.removeChannel(ch)
    })
  },[])

  const doSpin = async ()=>{
    const b = Number(bet)
    if (!b || b<1) { showToast('Min bet ₹1'); return }
    if (profile && Number(profile.balance) < b) { showToast('Insufficient balance'); return }
    
    // INSTANT START — hand to hand on, no delay
    setSpinning(true)
    setResult(null)
    const startRot = rotation + 180 + Math.random()*60 // immediate 180deg kick
    setRotation(startRot)

    try {
      // Call API in parallel (server decides result in <200ms)
      const res = await callEdge('/games/spin', { bet_amount: b })
      if (!res.ok) throw new Error(res.error)
      
      const idx = res.result?.slice_index ?? 0
      // FIXED: exact target calculation — wheel 0deg = 3 o'clock, pointer at top = 270deg
      // slice center = idx*60+30, desired rotation = 270 - center = 240 - idx*60
      const desiredMod = (240 - idx*60 + 360) % 360
      const currentMod = startRot % 360
      const diff = (desiredMod - currentMod + 360) % 360
      // 1.6 sec premium spin: 3 full rotations + diff + tiny random for realism
      const finalRot = startRot + 1080 + diff + (Math.random()*6-3)
      
      // Update to final target with 1.6s cubic-bezier (instant start already done)
      setTimeout(()=>{ setRotation(finalRot) }, 50)

      setTimeout(()=>{
        setResult(res.result)
        if(res.balance!==undefined) updateBalance(res.balance)
        showToast(res.result.win_amount>0 ? `🎉 Won ₹${res.result.win_amount}! ${res.result.multiplier}x` : `💫 Landed ${res.result.multiplier}x`)
        setSpinning(false)
        load()
      }, 1650) // 1.6 sec delay total
    } catch(e:any){ showToast(e.message); setSpinning(false) }
  }

  return (
    <PageWrap>
      <TopBar title="SPIN & WIN • PREMIUM" />
      <div className="p16 flex col gap16">
        <div className="card p12 flex between center" style={{ background:'linear-gradient(135deg, #0a0a0a 0%, #000 100%)', border:'1px solid #1a1a1a' }}>
          <div><div style={{ fontSize:10, color:'#666', letterSpacing:'0.1em', fontWeight:800 }}>LIVE BALANCE</div><div style={{ fontWeight:900, fontSize:18, color:'#00ff88' }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div></div>
          <div className="flex gap8 center"><div style={{ width:8, height:8, background:'#00ff88', borderRadius:'50%', boxShadow:'0 0 10px #00ff88' }} /><span style={{ fontSize:10, color:'#666' }}>REALTIME</span></div>
        </div>

        <div className="card2 p20 flex col center gap16" style={{ background:'radial-gradient(circle at 50% 0%, #111 0%, #000 100%)', border:'1px solid #1a1a1a' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', zIndex:20, width:0, height:0, borderLeft:'12px solid transparent', borderRight:'12px solid transparent', borderTop:'18px solid #fff', filter:'drop-shadow(0 3px 10px rgba(255,255,255,0.6))' }} />
            <div style={{ width:280, height:280, borderRadius:'50%', position:'relative', background:'#000', border:'4px solid #111', boxShadow:'0 0 50px rgba(255,255,255,0.08), inset 0 0 30px rgba(0,0,0,0.9)', overflow:'hidden', transition: spinning ? 'transform 1.6s cubic-bezier(0.15, 0.8, 0.3, 1)' : 'none', transform:`rotate(${rotation}deg)` }}>
              <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%' }}>
                {SLICES.map((m,i)=>{
                  const angle = 60
                  const start = i*angle
                  const end = start+angle
                  const x1 = 50 + 50*Math.cos((start*Math.PI)/180)
                  const y1 = 50 + 50*Math.sin((start*Math.PI)/180)
                  const x2 = 50 + 50*Math.cos((end*Math.PI)/180)
                  const y2 = 50 + 50*Math.sin((end*Math.PI)/180)
                  const mid = start+angle/2
                  const tx = 50 + 32*Math.cos((mid*Math.PI)/180)
                  const ty = 50 + 32*Math.sin((mid*Math.PI)/180)
                  return <g key={i}>
                    <path d={`M50 50 L${x1} ${y1} A50 50 0 0 1 ${x2} ${y2} Z`} fill={m.color} stroke={m.border} strokeWidth={0.4} />
                    <text x={tx} y={ty} fill={m.text||'#fff'} fontSize="4.5" fontWeight="900" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid} ${tx} ${ty})`}>{m.label}</text>
                  </g>
                })}
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:72, height:72, background:'radial-gradient(circle, #fff 0%, #ddd 100%)', border:'3px solid #000', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:22, color:'#000', boxShadow:'0 4px 20px rgba(0,0,0,0.8)' }}>W</div>
              </div>
            </div>
          </div>

          <div className="flex gap6" style={{ flexWrap:'wrap', justifyContent:'center' }}>
            {SLICES.map(m=>(
              <div key={m.label} style={{ padding:'4px 10px', background:m.color, color:m.text||'#aaa', borderRadius:999, fontSize:10, fontWeight:800, border:`1px solid ${m.border}`, boxShadow: m.mult>=5?'0 0 10px rgba(255,255,255,0.2)':'' }}>{m.label} • {m.prob}%</div>
            ))}
          </div>

          {result && (
            <div className="card p16 w100" style={{ textAlign:'center', background: result.win_amount>0 ? 'linear-gradient(135deg, #0a1a12 0%, #000 100%)' : '#0a0a0a', border: result.win_amount>0 ? '1px solid #00ff8830' : '1px solid #1a1a1a', animation:'pop 0.3s ease' }}>
              <div style={{ fontWeight:900, fontSize:26, color: result.win_amount>0?'#00ff88':'#fff' }}>{result.multiplier}x {result.win_amount>0?`• +₹${result.win_amount}`:''}</div>
              <div style={{ fontSize:11, color:'#777', marginTop:4 }} className="mono">Slice #{result.slice_index} • {SLICES[result.slice_index]?.label} • Balance ₹{Number(profile?.balance||0).toFixed(2)}</div>
            </div>
          )}

          <div className="flex col gap8 w100">
            <div className="flex gap8">
              {[10,50,100,500].map(v=>(
                <button key={v} onClick={()=>setBet(String(v))} className="btn" style={{ flex:1, background: bet==String(v)?'#fff':'#111', color: bet==String(v)?'#000':'#666', padding:'8px', fontSize:12, fontWeight:800 }}>₹{v}</button>
              ))}
            </div>
            <div className="flex gap8 w100">
              <input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} placeholder="Bet ₹" style={{ flex:1, fontWeight:800 }} />
              <button className="btn btn-primary" disabled={spinning} onClick={doSpin} style={{ flex:1, fontWeight:900, fontSize:14, background: spinning ? '#222' : '#fff', color: spinning ? '#666' : '#000' }}>{spinning?'SPINNING... 1.6s':'SPIN NOW ⚡'}</button>
            </div>
          </div>
        </div>

        <div className="card p16">
          <div className="flex between center mb12">
            <div style={{ fontWeight:800, fontSize:13 }} className="flex gap8 center"><IconBolt size={14}/> My Spins • Exact Match</div>
            <button className="btn btn-ghost" style={{ padding:'6px 10px' }} onClick={load}><IconRefresh size={14}/></button>
          </div>
          <div className="flex col gap8">
            {history.map((h:any)=>(
              <div key={h.id} className="flex between center" style={{ padding:'10px 12px', background:'#000', border:'1px solid #111', borderRadius:10, fontSize:12 }}>
                <span className="mono">Slice {h.result?.slice_index} • {SLICES[h.result?.slice_index||0]?.label} • ₹{Number(h.bet_amount).toFixed(0)} → <b style={{ color: SLICES[h.result?.slice_index||0]?.mult>=2?'#00ff88':'#fff' }}>{h.multiplier}x</b></span>
                <span style={{ fontWeight:800, color: Number(h.win_amount)>0?'#00ff88':'#555' }}>{Number(h.win_amount)>0?`+₹${Number(h.win_amount).toFixed(2)}`:`-₹${Number(h.bet_amount).toFixed(0)}`}</span>
              </div>
            ))}
            {history.length===0 && <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:12 }}>No spins yet • exact visual match</div>}
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
