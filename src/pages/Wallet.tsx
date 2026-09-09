import React, { useEffect, useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { IconPlus, IconRefresh, IconBolt } from '../lib/icons'

export default function Wallet() {
  const { profile, refresh, updateBalance } = useAuth()
  const [ledger, setLedger] = useState<any[]>([])
  const [deposits, setDeposits] = useState<any[]>([])
  const [withdraws, setWithdraws] = useState<any[]>([])
  const [tab, setTab] = useState<'all'|'deposits'|'withdraws'>('all')
  const [amount, setAmount] = useState('')
  const [wAmount, setWAmount] = useState('')
  const [wTarget, setWTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [polling, setPolling] = useState<string|null>(null)

  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''), 3500) }

  const load = async ()=>{
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data: led } = await supabase.from('wallet_ledger').select('*').eq('user_id', uid).order('created_at',{ascending:false}).limit(50)
    if (led) setLedger(led)
    const { data: dep } = await supabase.from('deposits').select('*').eq('user_id', uid).order('created_at',{ascending:false}).limit(20)
    if (dep) { setDeposits(dep); if (dep.length>0 && !wTarget) setWTarget(dep.find((d:any)=>d.status==='paid')?.order_ref || '') }
    const { data: wd } = await supabase.from('withdrawals').select('*').eq('user_id', uid).order('created_at',{ascending:false}).limit(20)
    if (wd) setWithdraws(wd)
  }

  useEffect(()=>{
    load()
    // Auto-reconcile on open + realtime subscriptions
    callEdge('/deposit/reconcile', {}).then((r:any)=>{ if(r.credited>0){ showToast(`Auto-credited ${r.credited} deposits`); load() } })
    supabase.auth.getUser().then(({data})=>{
      const id=data.user?.id
      if(!id) return
      const ch1=supabase.channel(`ledger-${id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'wallet_ledger',filter:`user_id=eq.${id}`},(payload:any)=>{
        setLedger(prev=>[payload.new, ...prev].slice(0,50))
        if(payload.new?.balance_after) updateBalance(Number(payload.new.balance_after))
      }).subscribe()
      const ch2=supabase.channel(`deposits-${id}`).on('postgres_changes',{event:'*',schema:'public',table:'deposits',filter:`user_id=eq.${id}`},()=>load()).subscribe()
      return ()=>{ supabase.removeChannel(ch1); supabase.removeChannel(ch2) }
    })
  },[])

  useEffect(()=>{
    if (!polling) return
    const iv = setInterval(async()=>{
      try {
        const res = await callEdge('/deposit/verify', { order_ref: polling })
        if (res.ok && res.status==='paid') {
          showToast(`✅ Deposit credited: ₹${res.amount} • instant`)
          setPolling(null)
          load()
          if(res.balance) updateBalance(res.balance)
        }
      } catch {}
    }, 4000)
    return ()=> clearInterval(iv)
  },[polling])

  const doDeposit = async ()=>{
    const amt = Number(amount)
    if (!amt || amt < 10) { showToast('Min deposit ₹10'); return }
    setLoading(true)
    try {
      const res = await callEdge('/deposit/create', { amount: amt })
      if (!res.ok) throw new Error(res.error||'Failed')
      showToast('Order created, opening Jack Bank...')
      if (res.pay_url) window.open(res.pay_url, '_blank')
      setPolling(res.order_ref)
      setAmount('')
      load()
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  const checkNow = async (ref:string)=>{
    setLoading(true)
    try {
      const res = await callEdge('/deposit/verify', { order_ref: ref })
      if (res.ok && res.status==='paid') {
        showToast(`✅ Paid! ₹${res.amount} credited • instant`)
        setPolling(null)
        if(res.balance) updateBalance(res.balance)
      } else {
        showToast(`Status: ${res.status||res.error}`)
      }
      load()
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  const doWithdraw = async ()=>{
    const amt = Number(wAmount)
    if (!amt || amt < 1) { showToast('Enter amount'); return }
    if (!wTarget) { showToast('Select a paid deposit order_ref'); return }
    setLoading(true)
    try {
      const res = await callEdge('/withdraw/create', { amount: amt, order_ref_target: wTarget })
      if (!res.ok) throw new Error(res.error||'Failed')
      showToast(`✅ Withdrawal paid: ₹${res.amount} • instant`)
      setWAmount('')
      load()
      if(res.balance) updateBalance(res.balance)
    } catch(e:any){ showToast(e.message) } finally { setLoading(false) }
  }

  return (
    <PageWrap>
      <TopBar title="WALLET • LIVE" />
      <div className="p16 flex col gap16">
        <div className="card2 p20" style={{ background:'radial-gradient(circle at 50% 0%, #0a1a12 0%, #000 100%)', border:'1px solid #00ff8830' }}>
          <div className="flex between center">
            <div style={{ fontSize:11, letterSpacing:'0.15em', color:'#666', fontWeight:800 }} className="flex gap8 center"><div style={{ width:8, height:8, background:'#00ff88', borderRadius:'50%', boxShadow:'0 0 10px #00ff88' }} /> LIVE BALANCE • REALTIME</div>
            <div style={{ fontSize:10, color:'#666' }}>NO REFRESH NEEDED</div>
          </div>
          <div style={{ fontSize:36, fontWeight:900, marginTop:8 }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div>
          <div style={{ marginTop:12, padding:'10px 12px', background:'#000', border:'1px solid #111', borderRadius:12, fontSize:11, color:'#777' }}>
            Coins are virtual and have no cash value
          </div>
          <div className="flex gap12 mt12" style={{ fontSize:11, color:'#555' }}>
            <span>Deposits: ₹{Number(profile?.lifetime_deposits||0).toFixed(0)}</span>
            <span>Bets: ₹{Number(profile?.lifetime_bets||0).toFixed(0)}</span>
            <span>Wins: ₹{Number(profile?.lifetime_wins||0).toFixed(0)}</span>
          </div>
        </div>

        <div className="card p16">
          <div style={{ fontWeight:800, fontSize:14, marginBottom:12 }} className="flex gap8 center"><IconBolt size={14}/> Deposit via Jack Bank • Instant Verify</div>
          <div className="flex gap8">
            <input className="input" placeholder="Amount ₹" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
            <button className="btn btn-primary" onClick={doDeposit} disabled={loading} style={{ fontWeight:900 }}><IconPlus size={16}/> Add</button>
          </div>
          <div className="flex gap8 mt8">
            {[100,500,1000].map(v=>(
              <button key={v} onClick={()=>setAmount(String(v))} className="btn" style={{ flex:1, background: amount==String(v)?'#fff':'#111', color: amount==String(v)?'#000':'#666', padding:'8px', fontSize:11, fontWeight:800 }}>₹{v}</button>
            ))}
          </div>
          <div style={{ fontSize:11, color:'#555', marginTop:8 }}>Real gateway • fresh order_ref • auto-reconcile on open • polling every 4s + realtime</div>
          {polling && (
            <div style={{ marginTop:12, padding:12, background:'#0a0a0a', border:'1px solid #ffcc0030', borderRadius:12 }} className="flex between center">
              <div style={{ fontSize:12 }}><span style={{ color:'#ffcc00' }}>●</span> Polling {polling.slice(0,14)}... instant</div>
              <button className="btn btn-ghost" style={{ padding:'6px 12px', fontSize:12 }} onClick={()=>checkNow(polling)}><IconRefresh size={14}/> Check now</button>
            </div>
          )}
          {deposits.length>0 && (
            <div className="flex col gap8 mt12">
              {deposits.slice(0,5).map((d:any)=>(
                <div key={d.id} className="flex between center" style={{ fontSize:12, padding:'10px 12px', background:'#000', border:`1px solid ${d.status==='paid' ? '#00ff8830' : '#1a1a1a'}`, borderRadius:10 }}>
                  <span className="mono">{d.order_ref.slice(0,16)} • ₹{d.amount} • <b style={{ color: d.status==='paid'?'#00ff88':'#ffcc00' }}>{d.status}</b></span>
                  <button className="btn btn-ghost" style={{ padding:'4px 8px', fontSize:11 }} onClick={()=>checkNow(d.order_ref)}>Verify</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p16">
          <div style={{ fontWeight:800, fontSize:14, marginBottom:12 }}>Withdraw • Instant • From Merchant Pool</div>
          <div className="flex col gap8">
            <input className="input" placeholder="Amount to withdraw" type="number" value={wAmount} onChange={e=>setWAmount(e.target.value)} />
            <select className="input" value={wTarget} onChange={e=>setWTarget(e.target.value)}>
              <option value="">Select paid deposit to target</option>
              {deposits.filter((d:any)=>d.status==='paid').map((d:any)=><option key={d.id} value={d.order_ref}>{d.order_ref.slice(0,20)} • ₹{d.amount}</option>)}
            </select>
            <button className="btn btn-primary w100" onClick={doWithdraw} disabled={loading} style={{ fontWeight:900 }}>Withdraw Instant</button>
          </div>
          <div style={{ fontSize:11, color:'#666', marginTop:8, lineHeight:1.4 }}>
            Wagering: bets ≥ deposits. Payout from merchant unsettled pool. Idempotent key prevents double pay. Instant balance update.
          </div>
        </div>

        <div className="card p16">
          <div className="flex gap8 mb12">
            {(['all','deposits','withdraws'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} className="btn" style={{ background: tab===t ? '#fff' : '#111', color: tab===t ? '#000' : '#777', padding:'8px 12px', fontSize:12, fontWeight:800 }}>{t.toUpperCase()}</button>
            ))}
            <button className="btn btn-ghost" style={{ marginLeft:'auto', padding:'8px 10px' }} onClick={load}><IconRefresh size={14}/></button>
          </div>
          <div className="flex col gap8">
            {(tab==='all'?ledger: tab==='deposits'?deposits:withdraws).map((r:any)=>(
              <div key={r.id} className="flex between center" style={{ padding:'12px', background:'#000', border:'1px solid #111', borderRadius:12 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{r.type || r.status} {r.game_type?`• ${r.game_type}`:''}</div>
                  <div style={{ fontSize:11, color:'#666', marginTop:2 }} className="mono">{new Date(r.created_at).toLocaleTimeString()} {r.order_ref?`• ${r.order_ref.slice(0,12)}`:''} {r.note?`• ${r.note.slice(0,30)}`:''}</div>
                </div>
                <div style={{ fontWeight:800, color: (r.amount>0 || r.type==='deposit' || r.type==='win' || r.type==='bonus') ? '#00ff88' : '#fff' }} className="mono">
                  {r.amount ? `${Number(r.amount)>0?'+':''}₹${Number(r.amount).toFixed(2)}` : `₹${Number(r.amount||0).toFixed(2)}`}
                </div>
              </div>
            ))}
            {ledger.length===0 && <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:20 }}>No transactions yet • realtime</div>}
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
