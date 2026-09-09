import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconRefresh, IconWallet, IconBolt } from '../../lib/icons'

export default function AdminWithdrawals() {
  const [list, setList] = useState<any[]>([])
  const [filter, setFilter] = useState<'all'|'paid'|'pending'>('all')
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3500) }

  const load = async ()=>{
    const { data } = await supabase.from('withdrawals').select('*, profiles(username,email,balance)').order('created_at',{ascending:false}).limit(100)
    if (data) setList(data)
  }
  useEffect(()=>{ load() },[])

  const check = async (key:string)=>{
    try {
      const res = await callEdge('/admin/gateway/payout_status', { idempotency_key: key })
      showToast(res.ok ? `✅ Status ${res.status} ₹${res.amount}` : `❌ ${res.error}`)
    } catch(e:any){ showToast(e.message) }
  }

  const filtered = filter==='all' ? list : list.filter((w:any)=>w.status===filter)

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div>
          <div style={{ fontWeight:900, fontSize:20 }} className="flex gap8 center"><IconWallet size={20}/> Payouts / Withdrawals • 100X</div>
          <div style={{ fontSize:11, color:'#666' }}>{filtered.length} payouts • from merchant unsettled pool • idempotent</div>
        </div>
        <div className="flex gap8">
          <div className="flex gap4">
            {(['all','paid','pending'] as const).map(f=>(
              <button key={f} onClick={()=>setFilter(f)} className="btn" style={{ background: filter===f?'#fff':'#111', color: filter===f?'#000':'#666', padding:'6px 12px', fontSize:11 }}>{f.toUpperCase()}</button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/></button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:12 }}>
        {filtered.map((w:any)=>(
          <div key={w.id} className="card p14" style={{ border:'1px solid #1a1a1a', background:'#0a0a0a' }}>
            <div className="flex between">
              <div style={{ fontWeight:800, fontSize:12 }} className="mono">{w.idempotency_key}</div>
              <div style={{ padding:'3px 10px', borderRadius:999, background: w.status==='paid'?'#00ff8815':'#111', color: w.status==='paid'?'#00ff88':'#777', fontSize:11, fontWeight:800 }}>{w.status.toUpperCase()}</div>
            </div>
            <div className="flex gap8 mt10">
              <div style={{ width:32, height:32, background:'#111', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>{(w.profiles?.username||'U')[0].toUpperCase()}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:12 }}>{w.profiles?.username} • <span style={{ color:'#ff453a' }}>₹{Number(w.amount).toFixed(2)}</span></div>
                <div style={{ fontSize:10, color:'#666' }} className="mono">Target: {w.order_ref_target} • Bal ₹{Number(w.profiles?.balance||0).toFixed(2)}</div>
                <div style={{ fontSize:10, color:'#555' }}>{new Date(w.created_at).toLocaleString()} • payout_id {w.payout_id?.slice(0,8)}</div>
              </div>
            </div>
            <button className="btn btn-ghost w100 mt12" style={{ padding:'8px', fontSize:11 }} onClick={()=>check(w.idempotency_key)}>Live Payout Status (Jack Bank)</button>
          </div>
        ))}
      </div>

      {filtered.length===0 && <div className="card p20" style={{ color:'#555', textAlign:'center' }}>No {filter} payouts</div>}

      <div className="card p14" style={{ border:'1px dashed #222' }}>
        <div className="flex gap8 center" style={{ fontSize:11, fontWeight:800, color:'#666' }}><IconBolt size={12}/> PAYOUT RULES</div>
        <div style={{ fontSize:11, color:'#777', marginTop:6, lineHeight:1.5 }}>
          Payout target = payer of PAID deposit order_ref. Economics: merchant settlement pool (deposits - fee) must have enough. Same (merchant, idempotency_key) never double-pays. Wagering rule checked before payout.
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
