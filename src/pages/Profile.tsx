import React, { useState } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { IconLogOut } from '../lib/icons'
import { ADMIN_BASE } from '../App'

export default function Profile() {
  const { profile, user, signOut } = useAuth()
  const nav = useNavigate()
  const [tap, setTap] = useState(0)
  const [showAdmin, setShowAdmin] = useState(false)

  const handleSecretTap = () => {
    const newTap = tap + 1
    setTap(newTap)
    if (newTap >= 7) {
      if (profile?.is_admin) {
        setShowAdmin(true)
      } else {
        // even non-admin tapping 7 times does nothing visible
      }
      setTap(0)
    }
    setTimeout(()=> setTap(0), 2000)
  }

  return (
    <PageWrap>
      <TopBar title="PROFILE" />
      <div className="p16 flex col gap16">
        <div className="card2 p20 flex gap16 center">
          <div style={{ width:56, height:56, background:'#fff', color:'#000', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:22 }}>{(profile?.username||'U')[0].toUpperCase()}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:18 }}>{profile?.username||'Player'}</div>
            <div style={{ fontSize:12, color:'#777', marginTop:2 }}>{user?.email}</div>
            <div style={{ fontSize:11, color:'#555', marginTop:4 }} className="mono">{profile?.id.slice(0,8)}...</div>
          </div>
        </div>

        <div className="card p16 flex col gap12">
          <div className="flex between"><span style={{ color:'#777', fontSize:13 }}>Balance</span><span className="mono" style={{ fontWeight:700 }}>₹{Number(profile?.balance||0).toFixed(2)}</span></div>
          <div className="flex between"><span style={{ color:'#777', fontSize:13 }}>Lifetime Deposits</span><span className="mono">₹{Number(profile?.lifetime_deposits||0).toFixed(2)}</span></div>
          <div className="flex between"><span style={{ color:'#777', fontSize:13 }}>Lifetime Bets</span><span className="mono">₹{Number(profile?.lifetime_bets||0).toFixed(2)}</span></div>
          <div className="flex between"><span style={{ color:'#777', fontSize:13 }}>Lifetime Wins</span><span className="mono" style={{ color:'#00ff88' }}>₹{Number(profile?.lifetime_wins||0).toFixed(2)}</span></div>
        </div>

        {/* Hidden admin access — only after 7 taps and if is_admin */}
        {showAdmin && profile?.is_admin && (
          <button className="btn btn-ghost w100" onClick={()=>nav(ADMIN_BASE)} style={{ border:'1px dashed #333' }}>Admin Panel (Hidden Access)</button>
        )}

        <button className="btn btn-danger w100" onClick={async()=>{ await signOut(); nav('/auth') }}><IconLogOut size={16}/> Logout</button>

        <div onClick={handleSecretTap} style={{ color:'#222', fontSize:10, textAlign:'center', marginTop:8, userSelect:'none', padding:12 }}>
          WINZY v1 • AMOLED • Fair • Virtual coins {tap>0 ? `• ${tap}/7` : ''}
        </div>
        <div style={{ color:'#111', fontSize:9, textAlign:'center' }}>Tap 7 times for admin (only admin accounts)</div>
      </div>
    </PageWrap>
  )
}
