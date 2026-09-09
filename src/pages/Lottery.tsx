import React, { useEffect, useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { IconTicket, IconRefresh, IconCrown } from '../lib/icons'

export default function Lottery() {
  const [draw, setDraw] = useState<any>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''), 3000) }

  const load = async ()=>{
    const { data: draws } = await supabase.from('lottery_draws').select('*').order('created_at',{ascending:false}).limit(5)
    if (draws && draws.length>0) {
      const open = draws.find((d:any)=>d.status==='open') || draws[0]
      setDraw(open)
      setHistory(draws)
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (uid) {
        const { data: t } = await supabase.from('lottery_tickets').select('*').eq('draw_id', open.id).eq('user_id', uid).order('created_at',{ascending:false})
        if (t) setTickets(t)
      }
    }
  }
  useEffect(()=>{ load() },[])

  const toggle = (n:number)=>{
    if (selected.includes(n)) setSelected(selected.filter(x=>x!==n))
    else {
      if (selected.length>=6) { showToast('Pick only 6 numbers'); return }
      setSelected([...selected, n].sort((a,b)=>a-b))
    }
  }

  const buy = async ()=>{
    if (selected.length!==6) { showToast('Select 6 numbers'); return }
    if (!draw) return
    setLoading(true)
    try {
      const res = await callEdge('/games/lottery/buy', { draw_id: draw.id, numbers: selected })
      if (!res.ok) throw new Error(res.error)
      showToast(`Ticket bought! ₹${res.ticket?.amount||''}`)
      setSelected([])
      load()
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  return (
    <PageWrap>
      <TopBar title="LOTTERY" />
      <div className="p16 flex col gap16">
        {draw ? (
          <div className="card2 p20">
            <div className="flex between center">
              <div style={{ fontWeight:800 }}>Draw #{draw.draw_number} • {draw.status.toUpperCase()}</div>
              <div style={{ fontSize:12, color:'#777' }}>Pot ₹{Number(draw.total_pot||0).toFixed(2)}</div>
            </div>
            {draw.winning_numbers && (
              <div className="flex gap8 mt12">
                {draw.winning_numbers.map((n:number)=><div key={n} className="ball winning">{n}</div>)}
              </div>
            )}
            <div style={{ fontSize:11, color:'#666', marginTop:12 }}>Ticket: ₹{Number(draw.ticket_price||10).toFixed(2)} • {draw.tickets_count||0} tickets sold</div>
          </div>
        ) : <div className="card p16">No active draw — admin will create.</div>}

        <div className="card p16">
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Pick 6 numbers (1-49)</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8 }}>
            {Array.from({length:49},(_,i)=>i+1).map(n=>(
              <button key={n} onClick={()=>toggle(n)} className={`ball ${selected.includes(n)?'selected':''}`} style={{ width:36, height:36, fontSize:13, cursor:'pointer', border:'1px solid #222' }}>{n}</button>
            ))}
          </div>
          <div className="flex gap8 mt16">
            <div className="flex gap8">
              {selected.map(n=><div key={n} className="ball selected" style={{ width:32, height:32, fontSize:12 }}>{n}</div>)}
              {selected.length===0 && <div style={{ color:'#555', fontSize:12 }}>No numbers selected</div>}
            </div>
          </div>
          <button className="btn btn-primary w100 mt16" disabled={loading || selected.length!==6} onClick={buy}>{loading?'Buying...':`Buy Ticket ₹${draw?Number(draw.ticket_price).toFixed(0):'10'}`}</button>
        </div>

        <div className="card p16">
          <div className="flex between center mb12">
            <div style={{ fontWeight:700, fontSize:13 }}>My Tickets — Draw #{draw?.draw_number}</div>
            <button className="btn btn-ghost" style={{ padding:'6px 10px' }} onClick={load}><IconRefresh size={14}/></button>
          </div>
          <div className="flex col gap8">
            {tickets.map((t:any)=>(
              <div key={t.id} className="flex between center" style={{ padding:'10px', background:'#000', border:'1px solid #111', borderRadius:10 }}>
                <div className="flex gap6">
                  {t.numbers.map((n:number)=><div key={n} className="ball" style={{ width:28, height:28, fontSize:11, background: t.status==='won' ? '#00ff88' : '#fff' }}>{n}</div>)}
                </div>
                <div style={{ fontSize:12, fontWeight:700, color: t.status==='won'?'#00ff88':'#777' }}>{t.status} {t.win_amount?`+₹${Number(t.win_amount).toFixed(2)}`:''}</div>
              </div>
            ))}
            {tickets.length===0 && <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:12 }}>No tickets yet</div>}
          </div>
        </div>

        <div className="card p16">
          <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Recent Draws (Public)</div>
          <div className="flex col gap8">
            {history.map((d:any)=>(
              <div key={d.id} style={{ padding:'10px', background:'#050505', border:'1px solid #111', borderRadius:10 }}>
                <div className="flex between"><span style={{ fontWeight:700, fontSize:12 }}>Draw #{d.draw_number} • {d.status}</span><span style={{ fontSize:11, color:'#777' }}>{new Date(d.created_at).toLocaleDateString()}</span></div>
                {d.winning_numbers && <div className="flex gap6 mt8">{d.winning_numbers.map((n:number)=><div key={n} className="ball winning" style={{ width:28, height:28, fontSize:11 }}>{n}</div>)}</div>}
                <div style={{ fontSize:11, color:'#666', marginTop:6 }}>Winners: {d.winners_count||0} • Pot ₹{Number(d.total_pot||0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
