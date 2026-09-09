import React from 'react'
import { IconHome, IconGame, IconWallet, IconUser, IconMenu } from '../lib/icons'
import { useAuth } from '../hooks/useAuth'
import { useLocation, useNavigate } from 'react-router-dom'

export function BottomNav() {
  const nav = useNavigate()
  const loc = useLocation()
  const isActive = (p:string) => loc.pathname === p || (p !== '/' && loc.pathname.startsWith(p))
  const tabs = [
    { path:'/', label:'Home', icon: IconHome },
    { path:'/games', label:'Games', icon: IconGame },
    { path:'/wallet', label:'Wallet', icon: IconWallet },
    { path:'/profile', label:'Me', icon: IconUser },
  ]
  return (
    <div className="bottom-nav">
      {tabs.map(t=>{
        const active = isActive(t.path)
        return (
          <button key={t.path} className={active?'active':''} onClick={()=>nav(t.path)}>
            <t.icon color={active?'#fff':'#555'} size={22} />
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function TopBar({ title, showMenu, onMenu }: { title:string; showMenu?:boolean; onMenu?:()=>void }) {
  const { profile } = useAuth()
  return (
    <div style={{ position:'sticky', top:0, zIndex:20, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid #111', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div className="flex center gap12">
        {showMenu && <button onClick={onMenu} style={{ background:'none', border:'none' }}><IconMenu /></button>}
        <div style={{ fontWeight:700, fontSize:18, letterSpacing:'-0.02em' }}>{title}</div>
      </div>
      <div className="flex center gap8">
        <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:999, padding:'6px 12px', fontSize:13, fontWeight:700 }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div>
      </div>
    </div>
  )
}

export function PageWrap({ children, noBottom }: { children: React.ReactNode; noBottom?:boolean }) {
  return (
    <div style={{ minHeight:'100vh', background:'#000', paddingBottom: noBottom ? 0 : 80 }}>
      {children}
    </div>
  )
}
