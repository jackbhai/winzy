import React, { useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Slots() {
  const { profile, updateBalance } = useAuth()
  const [bet, setBet] = useState('10')
  const [reels, setReels] = useState(['🍒','🍋','🔔'])
  const [result, setResult] = useState<any>(null)
  const [spinning, setSpinning] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const symbols=["🍒","🍋","🔔","💎","7️⃣","🍀"]

  const play = async ()=>{
    const b=Number(bet)
    if(!b){ showToast('Bet required'); return }
    if(profile && Number(profile.balance)<b){ showToast('Insufficient'); return }
    setSpinning(true); setResult(null)
    // animate reels
    let count=0
    const int=setInterval(()=>{
      setReels([ symbols[Math.floor(Math.random()*symbols.length)], symbols[Math.floor(Math.random()*symbols.length)], symbols[Math.floor(Math.random()*symbols.length)] ])
      count++; if(count>15) clearInterval(int)
    },80)
    try{
      const res=await callEdge('/games/slots', { bet_amount:b })
      if(!res.ok) throw new Error(res.error)
      setTimeout(()=>{
        setReels(res.result.reels)
        setResult(res.result)
        if(res.balance!==undefined) updateBalance(res.balance)
        showToast(res.result.win?`🎰 JACKPOT ${res.result.multiplier}x • ₹${res.result.win_amount}`:`🎰 ${res.result.reels.join(' ')}`)
        setSpinning(false)
      }, 1200)
    }catch(e:any){ clearInterval(int); showToast(e.message); setSpinning(false) }
  }

  return (
    <PageWrap>
      <TopBar title="SLOTS • PREMIUM" />
      <div className="p16 flex col gap16">
        <div className="card p12 flex between center"><div><div style={{ fontSize:10, color:'#666', fontWeight:800 }}>LIVE BALANCE</div><div style={{ fontWeight:900, fontSize:18, color:'#00ff88' }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div></div><div style={{ fontSize:10, color:'#666' }}>JACKPOT 50x</div></div>

        <div className="card2 p20 flex col center gap16" style={{ background:'radial-gradient(circle at 50% 0%, #1a160a 0%, #000 100%)', border:'1px solid #222' }}>
          <div style={{ display:'flex', gap:10, padding:16, background:'#000', border:'2px solid #222', borderRadius:16, boxShadow:'inset 0 0 20px rgba(0,0,0,0.8), 0 0 20px rgba(255,204,0,0.1)' }}>
            {reels.map((r,i)=>(
              <div key={i} style={{ width:80, height:80, background: spinning ? '#111' : '#0a0a0a', border:'1px solid #1a1a1a', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, transform: spinning ? `translateY(${Math.sin(Date.now()/100 + i)*4}px)` : 'none', transition:'transform 0.1s' }}>{r}</div>
            ))}
          </div>

          <div className="flex gap6" style={{ flexWrap:'wrap', justifyContent:'center' }}>
            {[
              { s:'7️⃣7️⃣7️⃣', m:'50x', c:'#ffcc00' },
              { s:'💎💎💎', m:'20x', c:'#00ff88' },
              { s:'🔔🔔🔔', m:'10x', c:'#0a84ff' },
              { s:'Any 3 same', m:'5x', c:'#fff' },
            ].map(p=>(
              <div key={p.s} style={{ padding:'4px 8px', background:'#111', border:'1px solid #1a1a1a', borderRadius:999, fontSize:10, fontWeight:800, color:p.c }}>{p.s} {p.m}</div>
            ))}
          </div>

          {result && (
            <div className="card p12 w100" style={{ textAlign:'center', background: result.win ? 'linear-gradient(135deg, #1a160a 0%, #000 100%)' : '#0a0a0a', border: result.win ? '1px solid #ffcc0030' : '1px solid #1a1a1a' }}>
              <div style={{ fontWeight:900, fontSize:20, color: result.win ? '#ffcc00' : '#666' }}>{result.reels.join(' ')} • {result.win ? `+₹${result.win_amount} ${result.multiplier}x` : 'TRY AGAIN'}</div>
              <div style={{ fontSize:11, color:'#777' }} className="mono">Instant • Balance ₹{Number(profile?.balance||0).toFixed(2)}</div>
            </div>
          )}

          <div className="flex col gap8 w100">
            <div className="flex gap8">
              {[10,50,100,500].map(v=>(
                <button key={v} onClick={()=>setBet(String(v))} className="btn" style={{ flex:1, background: bet==String(v)?'#ffcc00':'#111', color: bet==String(v)?'#000':'#666', padding:'8px', fontSize:11, fontWeight:800 }}>₹{v}</button>
              ))}
            </div>
            <div className="flex gap8">
              <input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} placeholder="Bet ₹" style={{ flex:1 }} />
              <button className="btn btn-primary" disabled={spinning} onClick={play} style={{ flex:1, fontWeight:900, background: spinning ? '#222' : '#ffcc00', color:'#000' }}>{spinning ? 'SPINNING...' : 'SPIN 🎰'}</button>
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
