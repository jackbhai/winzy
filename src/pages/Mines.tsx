import React, { useState, useEffect } from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { supabase, callEdge } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Mines() {
  const { profile, updateBalance } = useAuth()
  const [bet, setBet] = useState('10')
  const [minesCount, setMinesCount] = useState(5)
  const [selected, setSelected] = useState<number[]>([])
  const [revealedBoard, setRevealedBoard] = useState<number[]|null>(null)
  const [result, setResult] = useState<any>(null)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const togglePick = (idx:number)=>{
    if(result) return
    if(selected.includes(idx)) setSelected(selected.filter(s=>s!==idx))
    else if(selected.length < 10) setSelected([...selected, idx])
  }

  const play = async ()=>{
    const b=Number(bet)
    if(!b||selected.length===0){ showToast('Bet and pick tiles'); return }
    if(profile && Number(profile.balance)<b){ showToast('Insufficient balance'); return }
    try{
      const res=await callEdge('/games/mines', { bet_amount:b, mines_count:minesCount, picks:selected })
      if(!res.ok) throw new Error(res.error)
      setRevealedBoard(res.result.board)
      setResult(res.result)
      if(res.balance!==undefined) updateBalance(res.balance)
      showToast(res.result.win?`💎 Won ₹${res.result.win_amount} ${res.result.multiplier}x`:`💣 Mine hit!`)
    }catch(e:any){ showToast(e.message) }
  }

  const reset = ()=>{ setSelected([]); setRevealedBoard(null); setResult(null) }

  return (
    <PageWrap>
      <TopBar title="MINES • PREMIUM" />
      <div className="p16 flex col gap16">
        <div className="card p12 flex between center"><div><div style={{ fontSize:10, color:'#666', fontWeight:800 }}>LIVE BALANCE</div><div style={{ fontWeight:900, fontSize:18, color:'#00ff88' }} className="mono">₹{Number(profile?.balance||0).toFixed(2)}</div></div><div style={{ fontSize:10, color:'#666' }}>{selected.length} tiles picked</div></div>

        <div className="card2 p16 flex col gap12" style={{ background:'#000' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
            {Array.from({length:25}).map((_,i)=>{
              const isSelected=selected.includes(i)
              const isRevealed=revealedBoard!==null
              const isMine=isRevealed && revealedBoard && revealedBoard[i]===1
              const isSafe=isRevealed && revealedBoard && revealedBoard[i]===0 && isSelected
              return (
                <button key={i} onClick={()=>togglePick(i)} disabled={!!revealedBoard} style={{
                  aspectRatio:'1', borderRadius:12, border:`1px solid ${isMine?'#ff453a': isSafe?'#00ff88': isSelected?'#fff':'#1a1a1a'}`,
                  background: isMine ? '#1a0a0a' : isSafe ? '#0a1a12' : isSelected ? '#111' : '#0a0a0a',
                  color:'#fff', fontWeight:800, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
                  transform: isSelected ? 'scale(0.95)' : 'scale(1)', transition:'all 0.1s'
                }}>
                  {isRevealed ? (isMine ? '💣' : isSelected ? '💎' : '') : (isSelected ? '💎' : '')}
                </button>
              )
            })}
          </div>

          {result && (
            <div className="card p12" style={{ textAlign:'center', background: result.win ? '#0a1a12' : '#1a0a0a', border:`1px solid ${result.win ? '#00ff8830' : '#ff453a30'}` }}>
              <div style={{ fontWeight:900, fontSize:20, color: result.win ? '#00ff88' : '#ff453a' }}>{result.win ? `+₹${result.win_amount} • ${result.multiplier}x` : `BOOM! -₹${bet}`}</div>
              <div style={{ fontSize:11, color:'#777' }} className="mono">{result.revealed} safe • {minesCount} mines • Balance ₹{Number(profile?.balance||0).toFixed(2)}</div>
            </div>
          )}

          <div className="flex col gap8">
            <div className="flex gap8">
              <div className="flex col gap4" style={{ flex:1 }}><label style={{ fontSize:10, color:'#666' }}>BET ₹</label><input className="input" type="number" value={bet} onChange={e=>setBet(e.target.value)} /></div>
              <div className="flex col gap4" style={{ flex:1 }}><label style={{ fontSize:10, color:'#666' }}>MINES</label><select className="input" value={minesCount} onChange={e=>setMinesCount(Number(e.target.value))}><option value={3}>3 mines</option><option value={5}>5 mines</option><option value={8}>8 mines</option><option value={12}>12 mines</option></select></div>
            </div>
            <div className="flex gap8">
              <button className="btn btn-ghost" onClick={reset} style={{ flex:1 }}>Reset</button>
              <button className="btn btn-primary" onClick={play} disabled={selected.length===0} style={{ flex:2, fontWeight:900, background: result?.win ? '#00ff88' : '#fff', color:'#000' }}>{result ? 'PLAY AGAIN 💎' : `BET ${selected.length} TILES`}</button>
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </PageWrap>
  )
}
