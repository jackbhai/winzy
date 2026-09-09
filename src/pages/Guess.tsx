import React, { useEffect, useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { IconRefresh, IconTarget } from '../lib/icons'

export default function Guess() {
  const [pick, setPick] = useState(5)
  const [bet, setBet] = useState('10')
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''), 3000) }

  const load = async ()=>{
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data } = await supabase.from('guess_history').select('*').eq('user_id', uid).order('created_at',{ascending:false}).limit(20)
    if (data) setHistory(data)
  }
  useEffect(()=>{ load() },[])

  const play = async ()=>{
    const b = Number(bet)
    if (!b || b<1) { showToast('Min ₹1'); return }
    setLoading(true)
    try {
      const res = await callEdge('/games/guess', { bet_amount: b, number: pick })
      if (!res.ok) throw new Error(res.error)
      setResult(res.result)
      showToast(res.result.win ? `JACKPOT! Won ₹${res.result.win_amount}` : `Number was ${res.result.drawn} — try again`)
      load()
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  return (
    <PageWrap>
      <TopBar title="NUMBER GUESS" />
      <div className="p16 flex col gap16">
        <div className="card2 p20">
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:20 }}>Pick 1-10 • 8x payout</div>
            <div style={{ fontSize:12, color:'#777', marginTop:4 }}>Exact hit wins 8x. Server decides number.</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
            {Array.from({length:10},(_,i)=>i+1).map(n=>(
              <button key={n} onClick={()=>setPick(n)} style={{
                height:56, borderRadius:14, border:'1px solid #222', background: pick===n ? '#fff' : '#0a0a0a', color: pick===n ? '#000' : '#fff',
                fontWeight:800, fontSize:18, cursor:'pointer'
              }}>{n}</button>
            ))}
          </div>

          {result && (
            <div style={{ marginTop:16, padding:14, background: result.win ? '#00ff8815' : '#111', border:`1px solid ${result.win?'#00ff88':'#222'}`, borderRadius:14, textAlign:'center' }}>
              <div style={{ fontWeight:800, fontSize:16, color: result.win?'#00ff88':'#fff' }}>{result.win?`WIN! +₹${result.win_amount}`:`LOST • drawn ${result.drawn}`}</div>
              <div style={{ fontSize:11, color:'#777', marginTop:4 }} className="mono">seed {result.seed?.slice(0,8)} • provably fair</div>
            </div>
          )}

          <div className="flex gap8 mt16">
            <input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} placeholder="Bet ₹" />
            <button className="btn btn-primary" style={{ flex:1 }} disabled={loading} onClick={play}>{loading?'...':`GUESS ${pick}`}</button>
          </div>
        </div>

        <div className="card p16">
          <div className="flex between center mb12"><div style={{ fontWeight:700, fontSize:13 }}>History</div><button className="btn btn-ghost" style={{ padding:'6px 10px' }} onClick={load}><IconRefresh size={14}/></button></div>
          <div className="flex col gap8">
            {history.map((h:any)=>(
              <div key={h.id} className="flex between center" style={{ fontSize:12, padding:'8px 0', borderBottom:'1px solid #111' }}>
                <span className="mono">Pick {h.picked} • Draw {h.drawn}</span>
                <span style={{ fontWeight:700, color: Number(h.win_amount)>0?'#00ff88':'#777' }}>{Number(h.win_amount)>0?`+₹${Number(h.win_amount).toFixed(2)}`:'LOSS'}</span>
              </div>
            ))}
            {history.length===0 && <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:12 }}>No guesses yet</div>}
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
