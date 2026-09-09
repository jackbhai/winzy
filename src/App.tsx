import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Games from './pages/Games'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import Lottery from './pages/Lottery'
import Spin from './pages/Spin'
import Dice from './pages/Dice'
import Guess from './pages/Guess'
import { BottomNav } from './components/Layout'
import { AdminSidebar } from './components/AdminSidebar'
import AdminDashboard from './pages/Admin/Dashboard'
import AdminDeposits from './pages/Admin/Deposits'
import AdminWithdrawals from './pages/Admin/Withdrawals'
import AdminUsers from './pages/Admin/Users'
import AdminLottery from './pages/Admin/LotteryControl'
import AdminSettings from './pages/Admin/Settings'
import AdminGateway from './pages/Admin/Gateway'
import AdminGames from './pages/Admin/Games'
import { IconMenu } from './lib/icons'

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}>Loading...</div>
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function AdminProtected({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}>Loading...</div>
  if (!user) return <Navigate to="/auth" replace />
  if (!profile?.is_admin) return <Navigate to="/" replace />
  return <>{children}</>
}

function UserApp() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Games />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/lottery" element={<Lottery />} />
        <Route path="/spin" element={<Spin />} />
        <Route path="/dice" element={<Dice />} />
        <Route path="/guess" element={<Guess />} />
      </Routes>
      <BottomNav />
    </>
  )
}

function AdminApp() {
  const [open, setOpen] = useState(false)
  return (
    <div className="admin-layout">
      <AdminSidebar open={open} onClose={()=>setOpen(false)} />
      <div className="admin-main">
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }} className="md:hidden">
          <button onClick={()=>setOpen(true)} style={{ background:'#111', border:'1px solid #222', borderRadius:10, padding:8 }}><IconMenu /></button>
          <div style={{ fontWeight:800 }}>WINZY ADMIN</div>
        </div>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/deposits" element={<AdminDeposits />} />
          <Route path="/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/lottery" element={<AdminLottery />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/gateway" element={<AdminGateway />} />
          <Route path="/games" element={<AdminGames />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/winzy/">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/*" element={<AdminProtected><AdminApp /></AdminProtected>} />
          <Route path="/*" element={<Protected><UserApp /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
