import React from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { IconTicket, IconSpin, IconDice, IconTarget, IconArrow } from '../lib/icons'
import { useNavigate } from 'react-router-dom'

export default function Games() {
  const nav = useNavigate()
  const list = [
    { id:'lottery', title:'LOTTERY', sub:'Pick 6 numbers (1-49)', desc:'Scheduled draws, tiers, auto-credit winnings. Provably fair.', icon: IconTicket, path:'/lottery', pot:'Jackpot rolls' },
    { id:'spin', title:'SPIN & WIN', sub:'Big wheel multipliers', desc:'0x / 1.2x / 1.5x / 2x / 5x + jackpot. Server decides slice.', icon: IconSpin, path:'/spin', pot:'Up to 5x + jackpot' },
    { id:'dice', title:'DICE ROLL', sub:'Roll over target', desc:'Pick target, instant crypto RNG result. Choose risk.', icon: IconDice, path:'/dice', pot:'Up to 9x' },
    { id:'guess', title:'NUMBER GUESS', sub:'Pick 1-10 exact hit', desc:'Exact hit pays 8x. Simple, fast, fair.', icon: IconTarget, path:'/guess', pot:'8x payout' },
  ]
  return (
    <PageWrap>
      <TopBar title="GAMES" />
      <div className="p16 flex col gap12">
        {list.map(g=>(
          <div key={g.id} className="card2 p20" style={{ cursor:'pointer' }} onClick={()=>nav(g.path)}>
            <div className="flex between">
              <div className="flex gap12">
                <div style={{ width:48, height:48, background:'#000', border:'1px solid #222', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center' }}><g.icon size={22} /></div>
                <div>
                  <div style={{ fontWeight:800, fontSize:16, letterSpacing:'-0.01em' }}>{g.title}</div>
                  <div style={{ fontSize:12, color:'#777', marginTop:2 }}>{g.sub}</div>
                </div>
              </div>
              <IconArrow color="#444" />
            </div>
            <div style={{ fontSize:12, color:'#666', marginTop:12, lineHeight:1.4 }}>{g.desc}</div>
            <div style={{ marginTop:12, display:'inline-flex', background:'#111', border:'1px solid #1a1a1a', borderRadius:999, padding:'4px 10px', fontSize:11, fontWeight:700, letterSpacing:'0.05em' }}>{g.pot}</div>
          </div>
        ))}
      </div>
    </PageWrap>
  )
}
