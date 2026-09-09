import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconRefresh, IconBank, IconBolt } from '../../lib/icons'

export default function AdminDeposits() {
  const [list, setList] = useState<any[]>([])
  const [filter, setFilter] = useState<'all'|'pending'|'paid'>('all')
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3500) }

  const load = async ()=>{
    const { data } = await supabase.from('deposits').select('*, profiles(username,email,balance)').order('created_at',{ascending:false}).limit(100)
    if (data) setList(data)
  }
  useEffect(()=>{ load() },[])

  const check = async (order_ref:string)=>{
    try {
      const res = await callEdge('/admin/gateway/verify', { order_ref })
      showToast(res.ok ? `✅ Status ${res.status} ₹${res.amount}` : `❌ ${res.error}`)
      load()
    } catch(e:any){ showToast(e.message) }
  }

  const filtered = filter==='all' ? list : list.filter((d:any)=>d.status===filter)

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div>
          <div style={{ fontWeight:900, fontSize:20 }} className="flex gap8 center"><IconBank size={20}/> Deposits • 100X Live</div>
          <div style={{ fontSize:11, color:'#666' }}>{filtered.length} orders • real Jack Bank verify • auto-reconcile</div>
        </div>
        <div className="flex gap8">
          <div className="flex gap4">
            {(['all','pending','paid'] as const).map(f=>(
              <button key={f} onClick={()=>setFilter(f)} className="btn" style={{ background: filter===f?'#fff':'#111', color: filter===f?'#000':'#666', padding:'6px 12px', fontSize:11 }}>{f.toUpperCase()}</button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/></button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12 }}>
        {filtered.map((d:any)=>(
          <div key={d.id} className="card p14" style={{ border: d.status==='paid' ? '1px solid #00ff8830' : '1px solid #222', background: d.status==='paid' ? 'linear-gradient(135deg, #0a1a12 0%, #050505 100%)' : '#0a0a0a' }}>
            <div className="flex between">
              <div style={{ fontWeight:800, fontSize:13 }} className="mono">{d.order_ref}</div>
              <div style={{ padding:'3px 10px', borderRadius:999, background: d.status==='paid'?'#00ff8815':'#ffcc0015', color: d.status==='paid'?'#00ff88':'#ffcc00', fontSize:11, fontWeight:800, border:`1px solid ${d.status==='paid'?'#00ff8830':'#ffcc0030'}` }}>{d.status.toUpperCase()}</div>
            </div>
            <div className="flex gap8 mt10">
              <div style={{ width:32, height:32, background:'#111', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>{(d.profiles?.username||'U')[0].toUpperCase()}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:12 }}>{d.profiles?.username||d.user_id.slice(0,6)} • ₹{Number(d.amount).toFixed(2)}</div>
                <div style={{ fontSize:10, color:'#666' }} className="mono">{d.profiles?.email} • Bal ₹{Number(d.profiles?.balance||0).toFixed(2)}</div>
                <div style={{ fontSize:10, color:'#555' }}>{new Date(d.created_at).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex gap8 mt12">
              <button className="btn btn-ghost" style={{ flex:1, padding:'8px', fontSize:11 }} onClick={()=>check(d.order_ref)}>Live Verify Jack Bank</button>
              {d.pay_url && <a href={d.pay_url} target="_blank" className="btn btn-ghost" style={{ flex:1, padding:'8px', fontSize:11, textAlign:'center', textDecoration:'none', color:'#0a84ff' }}>Open Pay URL</a>}
            </div>
          </div>
        ))}
      </div>

      {filtered.length===0 && <div className="card p20" style={{ color:'#555', textAlign:'center' }}>No {filter} deposits</div>}

      <div className="card p14" style={{ border:'1px dashed #222' }}>
        <div className="flex gap8 center" style={{ fontSize:11, fontWeight:800, color:'#666' }}><IconBolt size={12}/> HOW IT WORKS</div>
        <div style={{ fontSize:11, color:'#777', marginTop:6, lineHeight:1.5 }}>
          Same (merchant, order_ref) UPSERTS to pending — fresh WZ- ref each time. Credit only when verify.status=paid AND amount ≥ deposit. Auto-reconcile on app open checks 5 pending orders.
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
