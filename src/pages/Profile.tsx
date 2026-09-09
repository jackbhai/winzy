import React from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { IconUser, IconLogOut, IconSettings } from '../lib/icons'

export default function Profile() {
  const { profile, user, signOut } = useAuth()
  const nav = useNavigate()
  return (
    <PageWrap>
      <TopBar title="PROFILE" />
      <div className="p16 flex col gap16">
        <div className="card2 p20 flex gap16 center">
          <div style={{ width:56, height:56, background:'#fff', color:'#000', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:22 }}>{(profile?.username||'U')[0].toUpperCase()}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:18 }}>{profile?.username||'Player'}</div>
            <div style={{ fontSize:12, color:'#777', marginTop:2 }}>{user?.email}</div>
            <div style={{ fontSize:11, color:'#555', marginTop:4 }} className="mono">{profile?.id.slice(0,8)}... {profile?.is_admin?'• ADMIN':''}</div>
          </div>
        </div>

        <div className="card p16 flex col gap12">
          <div className="flex between"><span style={{ color:'#777', fontSize:13 }}>Balance</span><span className="mono" style={{ fontWeight:700 }}>₹{Number(profile?.balance||0).toFixed(2)}</span></div>
          <div className="flex between"><span style={{ color:'#777', fontSize:13 }}>Lifetime Deposits</span><span className="mono">₹{Number(profile?.lifetime_deposits||0).toFixed(2)}</span></div>
          <div className="flex between"><span style={{ color:'#777', fontSize:13 }}>Lifetime Bets</span><span className="mono">₹{Number(profile?.lifetime_bets||0).toFixed(2)}</span></div>
          <div className="flex between"><span style={{ color:'#777', fontSize:13 }}>Lifetime Wins</span><span className="mono" style={{ color:'#00ff88' }}>₹{Number(profile?.lifetime_wins||0).toFixed(2)}</span></div>
        </div>

        {profile?.is_admin && (
          <button className="btn btn-ghost w100" onClick={()=>nav('/admin')}><IconSettings size={16}/> Open Admin Panel</button>
        )}

        <button className="btn btn-danger w100" onClick={async()=>{ await signOut(); nav('/auth') }}><IconLogOut size={16}/> Logout</button>

        <div style={{ color:'#333', fontSize:11, textAlign:'center', marginTop:8 }}>WINZY v1 • AMOLED • Fair • Virtual coins</div>
      </div>
    </PageWrap>
  )
}
