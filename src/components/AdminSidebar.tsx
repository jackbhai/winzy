import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconChart, IconWallet, IconTicket, IconUsers, IconSettings, IconBank, IconGame, IconShield, IconLogOut } from '../lib/icons'
import { useAuth } from '../hooks/useAuth'
import { ADMIN_BASE } from '../App'

export function AdminSidebar({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const nav = useNavigate()
  const loc = useLocation()
  const { signOut } = useAuth()
  const items = [
    { path:`${ADMIN_BASE}`, label:'Dashboard', icon: IconChart },
    { path:`${ADMIN_BASE}/deposits`, label:'Deposits', icon: IconBank },
    { path:`${ADMIN_BASE}/withdrawals`, label:'Withdrawals', icon: IconWallet },
    { path:`${ADMIN_BASE}/lottery`, label:'Lottery Draw', icon: IconTicket },
    { path:`${ADMIN_BASE}/users`, label:'Players', icon: IconUsers },
    { path:`${ADMIN_BASE}/games`, label:'Games', icon: IconGame },
    { path:`${ADMIN_BASE}/settings`, label:'Settings (50+)', icon: IconSettings },
    { path:`${ADMIN_BASE}/gateway`, label:'Gateway', icon: IconShield },
  ]
  return (
    <>
      <div className={`admin-sidebar ${open?'open':''}`}>
        <div style={{ fontWeight:800, fontSize:20, letterSpacing:'-0.02em', marginBottom:24, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, background:'#fff', color:'#000', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>W</div>
          WINZY ADMIN
        </div>
        <div style={{ fontSize:10, color:'#333', marginBottom:12, letterSpacing:'0.1em' }}>HIDDEN • SECURE-777</div>
        <div className="flex col gap4">
          {items.map(it=>{
            const active = loc.pathname === it.path
            return (
              <button key={it.path} onClick={()=>{ nav(it.path); onClose() }} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, border:'none',
                background: active ? '#111' : 'transparent', color: active ? '#fff' : '#777', fontWeight:600, fontSize:14, cursor:'pointer', textAlign:'left'
              }}>
                <it.icon color={active?'#fff':'#666'} size={18} /> {it.label}
              </button>
            )
          })}
        </div>
        <div style={{ marginTop:24, borderTop:'1px solid #111', paddingTop:16 }}>
          <button onClick={()=>{ nav('/'); onClose() }} style={{ width:'100%', display:'flex', gap:12, padding:'12px 14px', background:'transparent', border:'none', color:'#777', fontWeight:600, cursor:'pointer' }}>
            <IconGame color="#666" size={18}/> User App
          </button>
          <button onClick={()=>{ signOut(); nav('/auth') }} style={{ width:'100%', display:'flex', gap:12, padding:'12px 14px', background:'transparent', border:'none', color:'#ff453a', fontWeight:600, cursor:'pointer' }}>
            <IconLogOut color="#ff453a" size={18}/> Logout
          </button>
        </div>
      </div>
      {open && <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:40 }} />}
    </>
  )
}
