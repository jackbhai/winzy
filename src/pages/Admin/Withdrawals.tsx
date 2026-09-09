import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconRefresh, IconWallet } from '../../lib/icons'

export default function AdminWithdrawals() {
  const [list, setList] = useState<any[]>([])
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const load = async ()=>{
    const { data } = await supabase.from('withdrawals').select('*, profiles(username)').order('created_at',{ascending:false}).limit(100)
    if (data) setList(data)
  }
  useEffect(()=>{ load() },[])

  const check = async (key:string)=>{
    try {
      const res = await callEdge('/admin/gateway/payout_status', { idempotency_key: key })
      showToast(res.ok ? `Status ${res.status} ₹${res.amount}` : res.error)
    } catch(e:any){ showToast(e.message) }
  }

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div style={{ fontWeight:800, fontSize:20 }} className="flex gap8 center"><IconWallet size={20}/> Withdrawals / Payouts</div>
        <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
      </div>
      <div className="card p16" style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead><tr style={{ color:'#777', textAlign:'left' }}><th style={{ padding:'8px' }}>Time</th><th>User</th><th>Amount</th><th>Target Order</th><th>Idem Key</th><th>Status</th><th>Check</th></tr></thead>
          <tbody>
            {list.map((w:any)=>(
              <tr key={w.id} style={{ borderTop:'1px solid #111' }}>
                <td style={{ padding:'8px' }} className="mono">{new Date(w.created_at).toLocaleString()}</td>
                <td>{w.profiles?.username||w.user_id.slice(0,6)}</td>
                <td>₹{Number(w.amount).toFixed(2)}</td>
                <td className="mono">{w.order_ref_target}</td>
                <td className="mono" style={{ fontSize:10 }}>{w.idempotency_key.slice(0,12)}...</td>
                <td><span style={{ padding:'2px 8px', borderRadius:999, background: w.status==='paid'?'#00ff8815':'#111', color: w.status==='paid'?'#00ff88':'#777', border:'1px solid #222', fontSize:11 }}>{w.status}</span></td>
                <td><button className="btn btn-ghost" style={{ padding:'4px 8px', fontSize:11 }} onClick={()=>check(w.idempotency_key)}>Status</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length===0 && <div style={{ color:'#555', textAlign:'center', padding:20 }}>No withdrawals</div>}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
