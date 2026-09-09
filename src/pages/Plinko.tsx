import React, { useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Plinko() {
  const { profile, updateBalance } = useAuth()
  const [bet, setBet] = useState('10')
  const [risk, setRisk] = useState<'low'|'medium'|'high'>('medium')
  const [result, setResult] = useState<any>(null)
  const [dropping, setDropping] = useState(false)
  const [ballPos, setBallPos] = useState({ x:50, y:0 })
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const play = async ()=>{
    const b=Number(bet)
    if(!b){ showToast('Bet required'); return }
    if(profile && Number(profile.balance)<b){ showToast('Insufficient'); return }
    setDropping(true); setResult(null)
    setBallPos({ x:50, y:0 })
    // animate ball dropping
    let y=0
    const int=setInterval(()=>{ y+=8; const x=50 + (Math.random()-0.5)*30; setBallPos({ x, y: Math.min(y, 85) }); if(y>=85) clearInterval(int) },30)
    try{
      const res=await callEdge('/games/plinko', { bet_amount:b, risk })
      if(!res.ok) throw new Error(res.error)
      setTimeout(()=>{
        setResult(res.result)
        if(res.balance!==undefined) updateBalance(res.balance)
        showToast(`🟢 ${res.result.multiplier}x • ₹${res.result.win_amount}`)
        setDropping(false)
      }, 900)
    }catch(e:any){ clearInterval(int); showToast(e.message); setDropping(false) }
  }

  const mults = risk==='high' ? [0.2,0.5,1,2,5,10,100] : risk==='low' ? [0.5,0.8,1,1.2,1.5,2,3] : [0.3,0.7,1,1.5,2,5,20]

  return (
    <PageWrap>
      <TopBar title="PLINKO • PREMIUM" />
      <div className="p16 flex col gap16">
        <div className="card p12 flex between center"><div><div style={{ fontSize:10, color:'#666', fontWeight:800 }}>LIVE BALANCE</div><div style={{ fontWeight:900, fontSize:18, color:'#00ff88' }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div></div><div style={{ fontSize:10, color:'#666' }}>{risk.toUpperCase()} RISK</div></div>

        <div className="card2 p16 flex col gap12" style={{ background:'radial-gradient(circle at 50% 0%, #0a0a1a 0%, #000 100%)' }}>
          <div style={{ width:'100%', height:260, background:'#000', border:'1px solid #1a1a1a', borderRadius:16, position:'relative', overflow:'hidden' }}>
            {/* pins */}
            {Array.from({length:6}).map((_,row)=>(
              <div key={row} style={{ position:'absolute', top: 20 + row*28, left:0, right:0, display:'flex', justifyContent:'center', gap:18 }}>
                {Array.from({length: row+3}).map((_,col)=>(
                  <div key={col} style={{ width:6, height:6, background:'#222', borderRadius:'50%', border:'1px solid #333' }} />
                ))}
              </div>
            ))}
            {/* ball */}
            {(dropping || result) && <div style={{ position:'absolute', left:`${ballPos.x}%`, top:`${ballPos.y}%`, width:14, height:14, background:'#fff', borderRadius:'50%', boxShadow:'0 0 12px #fff', transform:'translate(-50%, -50%)', transition: dropping ? 'none' : 'all 0.2s' }} />}
            {/* slots */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, display:'flex', gap:4, padding:6 }}>
              {mults.map((m,i)=>(
                <div key={i} style={{ flex:1, padding:'6px 2px', background: result?.slot_index===i ? (m>=1 ? '#00ff88' : '#ff453a') : '#111', color: result?.slot_index===i ? '#000' : '#777', borderRadius:8, textAlign:'center', fontSize:10, fontWeight:900, border: result?.slot_index===i ? '1px solid #fff' : '1px solid #1a1a1a', transform: result?.slot_index===i ? 'scale(1.1)' : 'scale(1)', transition:'all 0.2s' }}>{m}x</div>
              ))}
            </div>
          </div>

          {result && (
            <div className="card p12" style={{ textAlign:'center', background: result.multiplier>=1 ? '#0a1a12' : '#1a0a0a', border:`1px solid ${result.multiplier>=1 ? '#00ff8830' : '#ff453a30'}` }}>
              <div style={{ fontWeight:900, fontSize:22, color: result.multiplier>=1 ? '#00ff88' : '#ff453a' }}>{result.multiplier}x • ₹{result.win_amount}</div>
              <div style={{ fontSize:11, color:'#777' }} className="mono">{risk} risk • Balance ₹{Number(profile?.balance||0).toFixed(2)}</div>
            </div>
          )}

          <div className="flex col gap8">
            <div className="flex gap8">
              <div className="flex col gap4" style={{ flex:1 }}><label style={{ fontSize:10, color:'#666' }}>BET ₹</label><input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} /></div>
              <div className="flex col gap4" style={{ flex:1 }}><label style={{ fontSize:10, color:'#666' }}>RISK</label><select className="input" value={risk} onChange={e=>setRisk(e.target.value as any)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            </div>
            <button className="btn btn-primary" disabled={dropping} onClick={play} style={{ fontWeight:900, background: dropping ? '#222' : '#fff', color:'#000' }}>{dropping ? 'DROPPING...' : 'DROP BALL 🟢'}</button>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
