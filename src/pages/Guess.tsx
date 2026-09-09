import React, { useEffect, useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { IconRefresh, IconBolt } from '../lib/icons'

export default function Guess() {
  const { profile, updateBalance } = useAuth()
  const [bet, setBet] = useState('10')
  const [picked, setPicked] = useState<number|null>(null)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const load = async ()=>{
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data } = await supabase.from('guess_history').select('*').eq('user_id', uid).order('created_at',{ascending:false}).limit(20)
    if (data) setHistory(data)
  }
  useEffect(()=>{ load() },[])

  const play = async (num:number)=>{
    const b=Number(bet)
    if(!b){ showToast('Bet required'); return }
    if(profile && Number(profile.balance)<b){ showToast('Insufficient'); return }
    setPicked(num)
    try{
      const res=await callEdge('/games/guess', { bet_amount:b, number:num })
      if(!res.ok) throw new Error(res.error)
      setResult(res.result)
      if(res.balance!==undefined) updateBalance(res.balance)
      showToast(res.result.win ? `🎯 Won ₹${res.result.win_amount}!` : `🎯 Drawn ${res.result.drawn}`)
      load()
    }catch(e:any){ showToast(e.message) }
  }

  return (
    <PageWrap>
      <TopBar title="NUMBER GUESS • PREMIUM" />
      <div className="p16 flex col gap16">
        <div className="card p12 flex between center"><div><div style={{ fontSize:10, color:'#666', fontWeight:800 }}>LIVE BALANCE</div><div style={{ fontWeight:900, fontSize:18, color:'#00ff88' }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div></div><div style={{ fontSize:11, background:'#111', border:'1px solid #222', borderRadius:999, padding:'4px 10px', fontWeight:800 }}>8x PAYOUT</div></div>

        <div className="card2 p20 flex col gap16" style={{ background:'radial-gradient(circle at 50% 0%, #111 0%, #000 100%)' }}>
          <div style={{ fontWeight:800, fontSize:14 }} className="flex gap8 center"><IconBolt size={14}/> Pick 1-10 • Instant Result</div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
            {Array.from({length:10}).map((_,i)=>{
              const n=i+1
              const isPicked=picked===n
              const isResult=result && result.drawn===n
              const isWin=result?.win && result.drawn===n
              return (
                <button key={n} onClick={()=>play(n)} style={{
                  aspectRatio:'1', borderRadius:14, border:`2px solid ${isWin ? '#00ff88' : isPicked ? '#fff' : '#1a1a1a'}`,
                  background: isWin ? '#0a1a12' : isPicked ? '#fff' : '#0a0a0a',
                  color: isWin ? '#00ff88' : isPicked ? '#000' : '#fff',
                  fontWeight:900, fontSize:20, boxShadow: isWin ? '0 0 20px rgba(0,255,136,0.3)' : isResult ? '0 0 10px rgba(255,255,255,0.2)' : 'none',
                  transform: isPicked ? 'scale(0.95)' : 'scale(1)', transition:'all 0.15s'
                }}>{n}</button>
              )
            })}
          </div>

          {result && (
            <div className="card p12" style={{ textAlign:'center', background: result.win ? '#0a1a12' : '#1a0a0a', border:`1px solid ${result.win ? '#00ff8830' : '#ff453a30'}` }}>
              <div style={{ fontWeight:900, fontSize:20, color: result.win ? '#00ff88' : '#ff453a' }}>{result.win ? `WIN +₹${result.win_amount}` : `LOSS • Drawn ${result.drawn}`} • Picked {result.picked}</div>
              <div style={{ fontSize:11, color:'#777' }} className="mono">Instant • Balance ₹{Number(profile?.balance||0).toFixed(2)} • seed {result.seed?.slice(0,6)}</div>
            </div>
          )}

          <div className="flex col gap8">
            <div className="flex gap8">
              {[10,50,100].map(v=>(
                <button key={v} onClick={()=>setBet(String(v))} className="btn" style={{ flex:1, background: bet==String(v)?'#fff':'#111', color: bet==String(v)?'#000':'#666', padding:'8px', fontSize:11, fontWeight:800 }}>₹{v}</button>
              ))}
            </div>
            <input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} placeholder="Bet ₹" />
          </div>
        </div>

        <div className="card p16">
          <div className="flex between center mb12"><div style={{ fontWeight:800, fontSize:13 }}>History • Instant</div><button className="btn btn-ghost" style={{ padding:'6px 10px' }} onClick={load}><IconRefresh size={14}/></button></div>
          <div className="flex col gap8">
            {history.map((h:any)=>(
              <div key={h.id} className="flex between" style={{ padding:'10px 12px', background:'#000', border:'1px solid #111', borderRadius:10, fontSize:12 }}>
                <span className="mono">Picked {h.picked} • Drawn {h.drawn}</span>
                <span style={{ fontWeight:800, color: h.win ? '#00ff88' : '#777' }}>{h.win ? `+₹${Number(h.win_amount).toFixed(2)}` : 'LOSS'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
