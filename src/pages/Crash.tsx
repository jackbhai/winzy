import React, { useState, useEffect } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { IconBolt, IconChart } from '../lib/icons'

export default function Crash() {
  const { profile, updateBalance } = useAuth()
  const [bet, setBet] = useState('10')
  const [target, setTarget] = useState('2')
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [animMult, setAnimMult] = useState(1)
  const [crashing, setCrashing] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const load = async ()=>{
    const uid = (await supabase.auth.getUser()).data.user?.id
    if(!uid) return
    const { data } = await supabase.from('wallet_ledger').select('*').eq('user_id',uid).eq('game_type','crash').order('created_at',{ascending:false}).limit(15)
    if(data) setHistory(data)
  }
  useEffect(()=>{ load() },[])

  const play = async ()=>{
    const b=Number(bet), t=Number(target)
    if(!b||t<1.1){ showToast('Bet and target >=1.1 required'); return }
    if(profile && Number(profile.balance)<b){ showToast('Insufficient balance'); return }
    setCrashing(true); setResult(null); setAnimMult(1)
    // Animate multiplier rising
    let cur=1
    const interval=setInterval(()=>{ cur+=0.05; setAnimMult(Number(cur.toFixed(2))); if(cur>=t+2) clearInterval(interval) },40)
    try{
      const res=await callEdge('/games/crash', { bet_amount:b, cashout_target:t })
      if(!res.ok) throw new Error(res.error)
      clearInterval(interval)
      // Animate to crash point
      const crash=res.result.crash_point
      let anim=cur
      const crashInt=setInterval(()=>{
        anim+=0.15
        setAnimMult(Number(anim.toFixed(2)))
        if(anim>=crash){ clearInterval(crashInt); setResult(res.result); if(res.balance!==undefined) updateBalance(res.balance); showToast(res.result.win?`💥 Won ₹${res.result.win_amount} at ${t}x`:`💥 Crashed at ${crash}x`); setCrashing(false); load() }
      },30)
    }catch(e:any){ clearInterval(interval); showToast(e.message); setCrashing(false) }
  }

  return (
    <PageWrap>
      <TopBar title="CRASH • PREMIUM" />
      <div className="p16 flex col gap16">
        <div className="card p12 flex between center"><div><div style={{ fontSize:10, color:'#666', fontWeight:800 }}>LIVE BALANCE</div><div style={{ fontWeight:900, fontSize:18, color:'#00ff88' }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div></div><div className="flex gap8 center"><div style={{ width:8, height:8, background:'#ff453a', borderRadius:'50%', boxShadow:'0 0 10px #ff453a', animation:'pulse 1s infinite' }} /><span style={{ fontSize:10, color:'#666' }}>LIVE</span></div></div>

        <div className="card2 p20 flex col center gap16" style={{ background:'radial-gradient(circle at 50% 0%, #1a0a0a 0%, #000 100%)' }}>
          <div style={{ width:'100%', height:180, background:'#000', border:'1px solid #1a1a1a', borderRadius:16, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 200 100" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
              <path d={`M0 90 Q 50 ${90 - Math.min(animMult*20,80)} 100 ${90 - Math.min(animMult*15,70)} T 200 ${90 - Math.min(animMult*10,60)}`} fill="none" stroke={result?.win ? '#00ff88' : crashing ? '#fff' : '#333'} strokeWidth="2" strokeDasharray={crashing?'4 4':'0'} />
              <circle cx={100} cy={90 - Math.min(animMult*15,70)} r="4" fill={result?.win ? '#00ff88' : '#fff'} />
            </svg>
            <div style={{ fontWeight:900, fontSize:48, color: result ? (result.win ? '#00ff88' : '#ff453a') : '#fff', textShadow: result?.win ? '0 0 20px #00ff88' : '0 0 20px #fff' }} className="mono">{animMult.toFixed(2)}x</div>
            {result && <div style={{ position:'absolute', bottom:12, fontWeight:800, fontSize:12, color: result.win ? '#00ff88' : '#ff453a' }}>{result.win ? `CASHED OUT ${result.cashout_target}x` : `CRASHED @ ${result.crash_point}x`}</div>}
          </div>

          {result && (
            <div className="card p12 w100" style={{ textAlign:'center', background: result.win ? '#0a1a12' : '#1a0a0a', border:`1px solid ${result.win ? '#00ff8830' : '#ff453a30'}` }}>
              <div style={{ fontWeight:900, fontSize:20, color: result.win ? '#00ff88' : '#ff453a' }}>{result.win ? `+₹${result.win_amount}` : `-₹${bet}`} • {result.crash_point}x</div>
              <div style={{ fontSize:11, color:'#777' }} className="mono">Target {result.cashout_target}x • Instant • Balance ₹{Number(profile?.balance||0).toFixed(2)}</div>
            </div>
          )}

          <div className="flex col gap8 w100">
            <div className="flex gap8">
              <div className="flex col gap4" style={{ flex:1 }}><label style={{ fontSize:10, color:'#666' }}>BET ₹</label><input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} /></div>
              <div className="flex col gap4" style={{ flex:1 }}><label style={{ fontSize:10, color:'#666' }}>CASHOUT X</label><input className="input" type="number" step="0.1" value={target} onChange={e=>setTarget(e.target.value)} /></div>
            </div>
            <div className="flex gap8">
              {[1.5,2,5,10].map(v=>(
                <button key={v} onClick={()=>setTarget(String(v))} className="btn" style={{ flex:1, background: target==String(v)?'#fff':'#111', color: target==String(v)?'#000':'#666', padding:'8px', fontSize:11, fontWeight:800 }}>{v}x</button>
              ))}
            </div>
            <button className="btn btn-primary" disabled={crashing} onClick={play} style={{ fontWeight:900, background: crashing ? '#222' : '#ff453a', color:'#fff' }}>{crashing ? 'FLYING...' : 'BET & FLY 🚀'}</button>
          </div>
        </div>

        <div className="card p16">
          <div style={{ fontWeight:800, fontSize:13, marginBottom:12 }} className="flex gap8 center"><IconChart size={14}/> Recent • Instant</div>
          <div className="flex col gap6">
            {history.map((h:any)=>(
              <div key={h.id} className="flex between" style={{ padding:'8px 10px', background:'#000', border:'1px solid #111', borderRadius:8, fontSize:11 }}><span className="mono">{new Date(h.created_at).toLocaleTimeString()} • {h.note}</span><span style={{ color: Number(h.amount)>0?'#00ff88':'#ff453a', fontWeight:800 }}>{Number(h.amount)>0?`+₹${Number(h.amount).toFixed(0)}`:`₹${Number(h.amount).toFixed(0)}`}</span></div>
            ))}
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
