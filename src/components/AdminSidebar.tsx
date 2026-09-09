import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconChart, IconWallet, IconTicket, IconUsers, IconSettings, IconBank, IconGame, IconShield, IconLogOut, IconBolt } from '../lib/icons'
import { useAuth } from '../hooks/useAuth'
import { ADMIN_BASE } from '../App'

export function AdminSidebar({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const nav = useNavigate()
  const loc = useLocation()
  const { signOut, profile } = useAuth()
  const items = [
    { path:`${ADMIN_BASE}`, label:'Dashboard', icon: IconChart, desc:'Coins, edge, live' },
    { path:`${ADMIN_BASE}/deposits`, label:'Deposits', icon: IconBank, desc:'Jack Bank verify' },
    { path:`${ADMIN_BASE}/withdrawals`, label:'Payouts', icon: IconWallet, desc:'Withdrawals' },
    { path:`${ADMIN_BASE}/lottery`, label:'Lottery', icon: IconTicket, desc:'Draw control' },
    { path:`${ADMIN_BASE}/users`, label:'Players', icon: IconUsers, desc:'50+ params each' },
    { path:`${ADMIN_BASE}/games`, label:'Games', icon: IconGame, desc:'Analytics' },
    { path:`${ADMIN_BASE}/settings`, label:'Game Config', icon: IconSettings, desc:'55+ global' },
    { path:`${ADMIN_BASE}/gateway`, label:'Gateway', icon: IconShield, desc:'Keys & test' },
  ]
  return (
    <>
      <div className={`admin-sidebar ${open?'open':''}`} style={{ background:'#050505', borderRight:'1px solid #111', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid #111' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, background:'#fff', color:'#000', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18 }}>W</div>
            <div>
              <div style={{ fontWeight:900, fontSize:16, letterSpacing:'-0.02em' }}>WINZY ADMIN</div>
              <div style={{ fontSize:10, color:'#555', letterSpacing:'0.15em', fontWeight:700 }}>HIDDEN • SECURE-777 • 100X</div>
            </div>
          </div>
          <div style={{ marginTop:14, padding:'10px 12px', background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:12, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, background:'#111', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12 }}>{(profile?.username||'A')[0].toUpperCase()}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:12 }}>{profile?.username||'Admin'}</div>
              <div style={{ fontSize:10, color:'#666' }} className="mono">{profile?.email?.slice(0,18)}</div>
            </div>
            <div style={{ width:8, height:8, background:'#00ff88', borderRadius:'50%', boxShadow:'0 0 10px #00ff88' }} />
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'12px' }} className="flex col gap4">
          {items.map(it=>{
            const active = loc.pathname === it.path
            return (
              <button key={it.path} onClick={()=>{ nav(it.path); onClose() }} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14, border:'1px solid '+(active?'#222':'transparent'),
                background: active ? 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)' : 'transparent',
                color: active ? '#fff' : '#666', fontWeight:600, fontSize:13, cursor:'pointer', textAlign:'left', width:'100%', transition:'all 0.15s'
              }}>
                <div style={{ width:32, height:32, background: active ? '#fff' : '#0a0a0a', border:'1px solid '+(active?'#fff':'#1a1a1a'), borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <it.icon color={active?'#000':'#777'} size={16} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:13 }}>{it.label}</div>
                  <div style={{ fontSize:10, color: active ? '#999' : '#444', marginTop:1 }}>{it.desc}</div>
                </div>
                {active && <div style={{ width:6, height:6, background:'#fff', borderRadius:'50%' }} />}
              </button>
            )
          })}
        </div>

        <div style={{ padding:12, borderTop:'1px solid #111' }}>
          <div style={{ padding:'10px 12px', background:'#0a0a0a', border:'1px dashed #222', borderRadius:12, marginBottom:10 }}>
            <div className="flex gap8 center" style={{ fontSize:10, fontWeight:800, letterSpacing:'0.1em', color:'#555' }}><IconBolt size={10}/> SECURITY</div>
            <div style={{ fontSize:10, color:'#444', marginTop:4, lineHeight:1.4 }}>Route hidden • /admin blocked • 7-tap gesture • is_admin RLS</div>
          </div>
          <button onClick={()=>{ nav('/'); onClose() }} style={{ width:'100%', display:'flex', gap:12, padding:'12px 14px', background:'transparent', border:'1px solid #111', borderRadius:12, color:'#777', fontWeight:600, cursor:'pointer', marginBottom:8 }}>
            <IconGame color="#666" size={16}/> User App
          </button>
          <button onClick={()=>{ signOut(); nav('/auth') }} style={{ width:'100%', display:'flex', gap:12, padding:'12px 14px', background:'#1a0a0a', border:'1px solid #2a1515', borderRadius:12, color:'#ff453a', fontWeight:700, cursor:'pointer' }}>
            <IconLogOut color="#ff453a" size={16}/> Logout
          </button>
        </div>
      </div>
      {open && <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:40 }} />}
    </>
  )
}
