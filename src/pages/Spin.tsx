import React, { useEffect, useState, useRef } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { IconRefresh, IconBolt, IconCrown } from '../lib/icons'

const SLICES = [
  { label:'0x', color:'#0a0a0a', border:'#1a1a1a', mult:0, prob:30 },
  { label:'1.2x', color:'#111', border:'#222', mult:1.2, prob:25 },
  { label:'1.5x', color:'#1a1a1a', border:'#2a2a2a', mult:1.5, prob:20 },
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
  const wheelRef = useRef<HTMLDivElement>(null)
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''), 3500) }

  const load = async ()=>{
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data } = await supabase.from('spin_history').select('*').eq('user_id', uid).order('created_at',{ascending:false}).limit(20)
    if (data) setHistory(data)
  }
  useEffect(()=>{ load()
    const uid = supabase.auth.getUser().then(u=>u.data.user?.id).then(id=>{
      if(!id) return
      const ch = supabase.channel(`spin-${id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'spin_history',filter:`user_id=eq.${id}`},()=>load()).subscribe()
      return ()=>supabase.removeChannel(ch)
    })
  },[])

  const doSpin = async ()=>{
    const b = Number(bet)
    if (!b || b<1) { showToast('Min bet ₹1'); return }
    if (profile && Number(profile.balance) < b) { showToast('Insufficient balance'); return }
    setSpinning(true); setResult(null)
    try {
      const res = await callEdge('/games/spin', { bet_amount: b })
      if (!res.ok) throw new Error(res.error)
      const idx = res.result?.slice_index ?? 0
      const sliceAngle = 360 / SLICES.length
      // Premium spin: 4 full rotations + land on slice center
      const targetAngle = 360 - (idx * sliceAngle + sliceAngle/2)
      const extra = 1440 + targetAngle + (Math.random()*10-5)
      setRotation(prev=> prev + extra)
      // Instant result but with premium animation 1.8s (not 4s)
      setTimeout(()=>{
        setResult(res.result)
        if(res.balance!==undefined) updateBalance(res.balance)
        showToast(res.result.win_amount>0 ? `🎉 Won ₹${res.result.win_amount}! ${res.result.multiplier}x` : `💫 ${res.result.multiplier}x`)
        setSpinning(false)
        load()
      }, 1800)
    } catch(e:any){ showToast(e.message); setSpinning(false) }
  }

  return (
    <PageWrap>
      <TopBar title="SPIN & WIN • PREMIUM" />
      <div className="p16 flex col gap16">
        {/* Balance live */}
        <div className="card p12 flex between center" style={{ background:'linear-gradient(135deg, #0a0a0a 0%, #000 100%)', border:'1px solid #1a1a1a' }}>
          <div><div style={{ fontSize:10, color:'#666', letterSpacing:'0.1em', fontWeight:800 }}>LIVE BALANCE</div><div style={{ fontWeight:900, fontSize:18, color:'#00ff88' }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div></div>
          <div className="flex gap8 center"><div style={{ width:8, height:8, background:'#00ff88', borderRadius:'50%', boxShadow:'0 0 10px #00ff88' }} /><span style={{ fontSize:10, color:'#666' }}>REALTIME</span></div>
        </div>

        <div className="card2 p20 flex col center gap16" style={{ background:'radial-gradient(circle at 50% 0%, #111 0%, #000 100%)', border:'1px solid #1a1a1a' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', zIndex:10, width:0, height:0, borderLeft:'10px solid transparent', borderRight:'10px solid transparent', borderTop:'16px solid #fff', filter:'drop-shadow(0 2px 8px rgba(255,255,255,0.5))' }} />
            <div ref={wheelRef} style={{ width:260, height:260, borderRadius:'50%', position:'relative', background:'#000', border:'4px solid #111', boxShadow:'0 0 40px rgba(255,255,255,0.08), inset 0 0 20px rgba(0,0,0,0.8)', overflow:'hidden', transition: spinning ? 'transform 1.8s cubic-bezier(0.23, 1, 0.32, 1)' : 'none', transform:`rotate(${rotation}deg)` }}>
              <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
                {SLICES.map((m,i)=>{
                  const angle = 360/SLICES.length
                  const start = i*angle
                  const end = start+angle
                  const x1 = 50 + 50*Math.cos((start*Math.PI)/180)
                  const y1 = 50 + 50*Math.sin((start*Math.PI)/180)
                  const x2 = 50 + 50*Math.cos((end*Math.PI)/180)
                  const y2 = 50 + 50*Math.sin((end*Math.PI)/180)
                  return <g key={i}><path d={`M50 50 L${x1} ${y1} A50 50 0 0 1 ${x2} ${y2} Z`} fill={m.color} stroke={m.border} strokeWidth={0.3} /><text x={50 + 32*Math.cos(((start+angle/2)*Math.PI)/180)} y={50 + 32*Math.sin(((start+angle/2)*Math.PI)/180)} fill={m.text||'#fff'} fontSize="5" fontWeight="900" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${90+start+angle/2} ${50 + 32*Math.cos(((start+angle/2)*Math.PI)/180)} ${50 + 32*Math.sin(((start+angle/2)*Math.PI)/180)})`}>{m.label}</text></g>
                })}
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:70, height:70, background:'radial-gradient(circle, #fff 0%, #ddd 100%)', border:'3px solid #000', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:22, color:'#000', boxShadow:'0 4px 20px rgba(0,0,0,0.8)' }}>W</div>
              </div>
            </div>
            <div style={{ position:'absolute', inset:-10, borderRadius:'50%', background:'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.05), transparent)', pointerEvents:'none' }} />
          </div>

          <div className="flex gap6" style={{ flexWrap:'wrap', justifyContent:'center' }}>
            {SLICES.map(m=>(
              <div key={m.label} style={{ padding:'4px 10px', background:m.color, color:m.text||'#aaa', borderRadius:999, fontSize:10, fontWeight:800, border:`1px solid ${m.border}`, boxShadow: m.mult>=5?'0 0 10px rgba(255,255,255,0.2)':'' }}>{m.label} • {m.prob}%</div>
            ))}
          </div>

          {result && (
            <div className="card p16 w100" style={{ textAlign:'center', background: result.win_amount>0 ? 'linear-gradient(135deg, #0a1a12 0%, #000 100%)' : '#0a0a0a', border: result.win_amount>0 ? '1px solid #00ff8830' : '1px solid #1a1a1a', animation:'pop 0.3s ease' }}>
              <div style={{ fontWeight:900, fontSize:24, color: result.win_amount>0?'#00ff88':'#fff' }}>{result.multiplier}x {result.win_amount>0?`• +₹${result.win_amount}`:''}</div>
              <div style={{ fontSize:11, color:'#777', marginTop:4 }} className="mono">Instant • Fair • seed {result.seed?.slice(0,8)} • Balance ₹{Number(profile?.balance||0).toFixed(2)}</div>
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
              <button className="btn btn-primary" disabled={spinning} onClick={doSpin} style={{ flex:1, fontWeight:900, fontSize:14, background: spinning ? '#222' : '#fff', color: spinning ? '#666' : '#000' }}>{spinning?'SPINNING...':'SPIN NOW ⚡'}</button>
            </div>
          </div>
        </div>

        <div className="card p16">
          <div className="flex between center mb12">
            <div style={{ fontWeight:800, fontSize:13 }} className="flex gap8 center"><IconBolt size={14}/> My Spins • Instant</div>
            <button className="btn btn-ghost" style={{ padding:'6px 10px' }} onClick={load}><IconRefresh size={14}/></button>
          </div>
          <div className="flex col gap8">
            {history.map((h:any)=>(
              <div key={h.id} className="flex between center" style={{ padding:'10px 12px', background:'#000', border:'1px solid #111', borderRadius:10, fontSize:12 }}>
                <span className="mono">₹{Number(h.bet_amount).toFixed(0)} → <b style={{ color: SLICES[h.result?.slice_index||0]?.mult>=2?'#00ff88':'#fff' }}>{h.multiplier}x</b> • {new Date(h.created_at).toLocaleTimeString()}</span>
                <span style={{ fontWeight:800, color: Number(h.win_amount)>0?'#00ff88':'#555' }}>{Number(h.win_amount)>0?`+₹${Number(h.win_amount).toFixed(2)}`:`-₹${Number(h.bet_amount).toFixed(0)}`}</span>
              </div>
            ))}
            {history.length===0 && <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:12 }}>No spins yet • instant results</div>}
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
