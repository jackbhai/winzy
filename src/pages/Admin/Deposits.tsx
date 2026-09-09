import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconRefresh, IconBank } from '../../lib/icons'

export default function AdminDeposits() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const load = async ()=>{
    setLoading(true)
    const { data } = await supabase.from('deposits').select('*, profiles(username,email)').order('created_at',{ascending:false}).limit(100)
    if (data) setList(data)
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const check = async (order_ref:string)=>{
    try {
      const res = await callEdge('/admin/gateway/verify', { order_ref })
      showToast(res.ok ? `Status ${res.status} ₹${res.amount}` : res.error)
      load()
    } catch(e:any){ showToast(e.message) }
  }

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div style={{ fontWeight:800, fontSize:20 }} className="flex gap8 center"><IconBank size={20}/> Deposits</div>
        <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
      </div>
      <div className="card p16" style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead><tr style={{ color:'#777', textAlign:'left' }}><th style={{ padding:'8px' }}>Time</th><th>User</th><th>Order Ref</th><th>Amount</th><th>Status</th><th>Pay URL</th><th>Check</th></tr></thead>
          <tbody>
            {list.map((d:any)=>(
              <tr key={d.id} style={{ borderTop:'1px solid #111' }}>
                <td style={{ padding:'8px' }} className="mono">{new Date(d.created_at).toLocaleString()}</td>
                <td>{d.profiles?.username||d.user_id.slice(0,6)}</td>
                <td className="mono">{d.order_ref}</td>
                <td>₹{Number(d.amount).toFixed(2)}</td>
                <td><span style={{ padding:'2px 8px', borderRadius:999, background: d.status==='paid'?'#00ff8815':'#111', color: d.status==='paid'?'#00ff88':'#777', border:'1px solid #222', fontSize:11 }}>{d.status}</span></td>
                <td>{d.pay_url ? <a href={d.pay_url} target="_blank" style={{ color:'#0a84ff' }}>open</a> : '-'}</td>
                <td><button className="btn btn-ghost" style={{ padding:'4px 8px', fontSize:11 }} onClick={()=>check(d.order_ref)}>Verify</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length===0 && <div style={{ color:'#555', textAlign:'center', padding:20 }}>No deposits</div>}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
