import React, { useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function CoinFlip() {
  const { profile, updateBalance } = useAuth()
  const [bet, setBet] = useState('10')
  const [picked, setPicked] = useState<'heads'|'tails'>('heads')
  const [result, setResult] = useState<any>(null)
  const [flipping, setFlipping] = useState(false)
  const [rot, setRot] = useState(0)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const play = async ()=>{
    const b=Number(bet)
    if(!b){ showToast('Bet required'); return }
    if(profile && Number(profile.balance)<b){ showToast('Insufficient'); return }
    setFlipping(true); setResult(null)
    setRot(prev=> prev + 720 + Math.random()*360)
    try{
      const res=await callEdge('/games/coinflip', { bet_amount:b, picked })
      if(!res.ok) throw new Error(res.error)
      setTimeout(()=>{
        setResult(res.result)
        if(res.balance!==undefined) updateBalance(res.balance)
        showToast(res.result.win?`🪙 Won ₹${res.result.win_amount}`:`🪙 ${res.result.result_side} • Lost`)
        setFlipping(false)
      }, 1000)
    }catch(e:any){ showToast(e.message); setFlipping(false) }
  }

  return (
    <PageWrap>
      <TopBar title="COINFLIP • PREMIUM" />
      <div className="p16 flex col gap16">
        <div className="card p12 flex between center"><div><div style={{ fontSize:10, color:'#666', fontWeight:800 }}>LIVE BALANCE</div><div style={{ fontWeight:900, fontSize:18, color:'#00ff88' }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div></div><div style={{ fontSize:10, color:'#666' }}>1.95x PAYOUT</div></div>

        <div className="card2 p20 flex col center gap20" style={{ background:'radial-gradient(circle at 50% 0%, #111 0%, #000 100%)' }}>
          <div style={{ width:140, height:140, borderRadius:'50%', background: 'linear-gradient(135deg, #222 0%, #000 100%)', border:'3px solid #333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, fontWeight:900, transform:`rotateY(${rot}deg)`, transition: flipping ? 'transform 1s cubic-bezier(0.23,1,0.32,1)' : 'none', boxShadow:'0 0 30px rgba(255,255,255,0.1)', transformStyle:'preserve-3d' }}>
            {result ? (result.result_side==='heads' ? '👑' : '💰') : picked==='heads' ? '👑' : '💰'}
          </div>

          {result && (
            <div className="card p12 w100" style={{ textAlign:'center', background: result.win ? '#0a1a12' : '#1a0a0a', border:`1px solid ${result.win ? '#00ff8830' : '#ff453a30'}` }}>
              <div style={{ fontWeight:900, fontSize:20, color: result.win ? '#00ff88' : '#ff453a' }}>{result.result_side.toUpperCase()} • {result.win ? `+₹${result.win_amount}` : `-₹${bet}`}</div>
              <div style={{ fontSize:11, color:'#777' }} className="mono">You picked {picked} • Balance ₹{Number(profile?.balance||0).toFixed(2)}</div>
            </div>
          )}

          <div className="flex gap8 w100">
            <button onClick={()=>setPicked('heads')} className="btn" style={{ flex:1, background: picked==='heads' ? '#fff' : '#111', color: picked==='heads' ? '#000' : '#666', padding:'14px', fontWeight:900, border: picked==='heads' ? '1px solid #fff' : '1px solid #1a1a1a' }}>👑 HEADS</button>
            <button onClick={()=>setPicked('tails')} className="btn" style={{ flex:1, background: picked==='tails' ? '#fff' : '#111', color: picked==='tails' ? '#000' : '#666', padding:'14px', fontWeight:900, border: picked==='tails' ? '1px solid #fff' : '1px solid #1a1a1a' }}>💰 TAILS</button>
          </div>

          <div className="flex col gap8 w100">
            <input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} placeholder="Bet ₹" />
            <button className="btn btn-primary" disabled={flipping} onClick={play} style={{ fontWeight:900, background: flipping ? '#222' : '#fff', color:'#000' }}>{flipping ? 'FLIPPING...' : `FLIP ${picked.toUpperCase()} 🪙`}</button>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
