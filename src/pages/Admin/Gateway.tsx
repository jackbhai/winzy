import React, { useEffect, useState } from 'react'
import { supabase, callEdge } from '../../lib/supabase'
import { IconShield, IconRefresh } from '../../lib/icons'

export default function AdminGateway() {
  const [cfg, setCfg] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),4000) }

  const load = async ()=>{
    const { data } = await supabase.from('gateway_config').select('*').eq('id',1).single()
    if (data) setCfg(data)
  }
  useEffect(()=>{ load() },[])

  const save = async ()=>{
    setLoading(true)
    try {
      const res = await callEdge('/admin/gateway/save', { config: cfg })
      if (!res.ok) throw new Error(res.error)
      showToast('Gateway config saved (server-side only)')
      load()
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  const test = async ()=>{
    setLoading(true)
    try {
      const res = await callEdge('/admin/gateway/test', {})
      if (!res.ok) throw new Error(res.error)
      showToast(`Test OK: ${JSON.stringify(res.result).slice(0,200)}`)
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="flex col gap16">
      <div className="flex between center">
        <div style={{ fontWeight:800, fontSize:20 }} className="flex gap8 center"><IconShield size={20}/> Gateway Settings</div>
        <button className="btn btn-ghost" onClick={load}><IconRefresh size={16}/> Refresh</button>
      </div>

      <div className="card p16 flex col gap12">
        <div style={{ fontWeight:700, fontSize:13 }}>Jack Bank Gateway (server-side secrets)</div>
        <div style={{ fontSize:11, color:'#777' }}>Base URL: https://nksthsgrxudptwdbytoh.supabase.co — secrets never exposed to frontend, stored in admin-only table + edge function env.</div>

        {[
          { key:'jackbank_url', label:'Jack Bank URL' },
          { key:'jackbank_anon_key', label:'Jack Bank Anon Key', type:'password' },
          { key:'merchant_api_key', label:'Merchant API Key' },
          { key:'merchant_api_secret', label:'Merchant API Secret', type:'password' },
          { key:'pay_url_base', label:'Pay URL Base (https://jackbhai.github.io/jack-bank/#/gateway/)' },
        ].map(f=>(
          <div key={f.key} className="flex col gap4">
            <label style={{ fontSize:11, color:'#777', fontWeight:700 }}>{f.label}</label>
            <input className="input" type={(f as any).type||'text'} value={cfg[f.key]||''} onChange={e=>setCfg({ ...cfg, [f.key]: e.target.value })} placeholder={f.label} />
          </div>
        ))}

        <div className="flex gap12">
          <label className="flex gap8 center" style={{ fontSize:13 }}><input type="checkbox" checked={!!cfg.enabled} onChange={e=>setCfg({ ...cfg, enabled: e.target.checked })} /> Enabled</label>
          <label className="flex gap8 center" style={{ fontSize:13 }}><input type="checkbox" checked={!!cfg.test_mode} onChange={e=>setCfg({ ...cfg, test_mode: e.target.checked })} /> Test Mode</label>
        </div>

        <div className="flex gap8">
          <button className="btn btn-primary" disabled={loading} onClick={save}>Save Config</button>
          <button className="btn btn-ghost" disabled={loading} onClick={test}>Test Gateway</button>
        </div>

        <div style={{ fontSize:11, color:'#666', marginTop:8, lineHeight:1.5 }}>
          - create_order UPSERTS on (merchant, order_ref) — always generate fresh WZ- ref.<br/>
          - verify credits only when status=paid and amount ≥ deposit.<br/>
          - payout uses idempotency key, pays from merchant unsettled pool.<br/>
          - If payout errors "migration15 not applied" tell user to apply it in Jack Bank DB.
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
