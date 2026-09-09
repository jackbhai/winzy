import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { IconBolt } from '../lib/icons'

export default function Auth() {
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const nav = useNavigate()

  const submit = async (e:React.FormEvent)=>{
    e.preventDefault()
    setLoading(true); setMsg('')
    try {
      if (mode==='signup') {
        if (!username.trim()) throw new Error('Username required')
        const { data, error } = await supabase.auth.signUp({ email, password: pass })
        if (error) throw error
        if (data.user) {
          // profile created via trigger; update username
          await supabase.from('profiles').update({ username }).eq('id', data.user.id)
          setMsg('Account created! Check email if confirmation required.')
          setTimeout(()=> nav('/'), 800)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) throw error
        nav('/')
      }
    } catch (err:any) {
      setMsg(err.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', flexDirection:'column', padding:24 }}>
      <div style={{ marginTop:40, marginBottom:32 }}>
        <div style={{ width:56, height:56, background:'#fff', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:28, color:'#000' }}>W</div>
        <div style={{ fontSize:32, fontWeight:800, marginTop:16, letterSpacing:'-0.03em' }}>WINZY</div>
        <div style={{ color:'#777', marginTop:6, fontSize:14 }}>AMOLED gaming — lottery, spin, dice, guess</div>
      </div>

      <div className="card2 p24" style={{ borderRadius:24 }}>
        <div style={{ display:'flex', background:'#000', borderRadius:999, padding:4, border:'1px solid #111', marginBottom:20 }}>
          {(['login','signup'] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)} className="btn" style={{ flex:1, background: mode===m ? '#fff' : 'transparent', color: mode===m ? '#000' : '#666', padding:'10px' }}>{m==='login'?'Login':'Sign up'}</button>
          ))}
        </div>

        <form onSubmit={submit} className="flex col gap12">
          {mode==='signup' && <input className="input" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />}
          <input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password (min 6)" value={pass} onChange={e=>setPass(e.target.value)} required minLength={6} />
          <button className="btn btn-primary w100 mt8" disabled={loading} type="submit">{loading?'Please wait...': mode==='login'?'Login':'Create account'}</button>
        </form>

        {msg && <div style={{ marginTop:16, padding:12, background:'#111', border:'1px solid #222', borderRadius:12, fontSize:13, color: msg.includes('created')?'#00ff88':'#ffcc00' }}>{msg}</div>}

        <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:8, color:'#555', fontSize:12 }}>
          <IconBolt size={14} color="#555" /> Secure • Server-side fairness • Virtual coins
        </div>
      </div>

      <div style={{ marginTop:'auto', paddingTop:24, color:'#444', fontSize:11, textAlign:'center' }}>
        By continuing you agree virtual coins have no cash value.
      </div>
    </div>
  )
}
