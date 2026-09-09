import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconRefresh, IconTicket, IconCrown } from '../../lib/icons'

export default function LotteryControl() {
  const [draws, setDraws] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const load = async ()=>{
    const { data } = await supabase.from('lottery_draws').select('*').order('created_at',{ascending:false}).limit(20)
    if (data) setDraws(data)
  }
  useEffect(()=>{ load() },[])

  const createDraw = async ()=>{
    setLoading(true)
    try {
      const res = await callEdge('/admin/lottery/create', {})
      if (!res.ok) throw new Error(res.error)
      showToast(`Draw #${res.draw.draw_number} created`)
      load()
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  const runDraw = async (id:string)=>{
    if (!confirm('Run draw? This will generate winning numbers and auto-credit winners.')) return
    setLoading(true)
    try {
      const res = await callEdge('/admin/lottery/draw', { draw_id: id })
      if (!res.ok) throw new Error(res.error)
      showToast(`Draw completed! Winners: ${res.winners_count} • Winning: ${res.winning_numbers.join(',')}`)
      load()
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div style={{ fontWeight:800, fontSize:20 }} className="flex gap8 center"><IconTicket size={20}/> Lottery Control</div>
        <div className="flex gap8">
          <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
          <button className="btn btn-primary" onClick={createDraw} disabled={loading}>New Draw</button>
        </div>
      </div>

      <div className="flex col gap12">
        {draws.map((d:any)=>(
          <div key={d.id} className="card p16">
            <div className="flex between center">
              <div style={{ fontWeight:800 }}>Draw #{d.draw_number} • {d.status.toUpperCase()}</div>
              <div style={{ fontSize:12, color:'#777' }}>Pot ₹{Number(d.total_pot||0).toFixed(2)} • {d.tickets_count||0} tickets</div>
            </div>
            {d.winning_numbers && (
              <div className="flex gap6 mt12">
                {d.winning_numbers.map((n:number)=><div key={n} className="ball winning" style={{ width:32, height:32, fontSize:12 }}>{n}</div>)}
              </div>
            )}
            <div className="flex gap8 mt12">
              {d.status==='open' && <button className="btn btn-primary" disabled={loading} onClick={()=>runDraw(d.id)}><IconCrown size={14}/> Run Draw & Publish</button>}
              <div style={{ fontSize:11, color:'#666' }} className="mono">ID {d.id.slice(0,8)} • {new Date(d.created_at).toLocaleString()}</div>
            </div>
            {d.winners && <div style={{ fontSize:11, color:'#777', marginTop:8 }}>Winners: {JSON.stringify(d.winners).slice(0,200)}...</div>}
          </div>
        ))}
        {draws.length===0 && <div className="card p16" style={{ color:'#555', textAlign:'center' }}>No draws yet — create one</div>}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
