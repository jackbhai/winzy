import React from 'react'
import { TopBar, PageWrap } from '../components/Layout'
import { IconTicket, IconSpin, IconDice, IconTarget, IconArrow, IconBolt, IconChart, IconGame } from '../lib/icons'
import { useNavigate } from 'react-router-dom'

export default function Games() {
  const nav = useNavigate()
  const list = [
    { id:'lottery', title:'LOTTERY', sub:'Pick 6 numbers (1-49)', desc:'Scheduled draws, tiers, auto-credit. Provably fair.', icon: IconTicket, path:'/lottery', pot:'Jackpot rolls', color:'#fff', bg:'#111' },
    { id:'spin', title:'SPIN & WIN', sub:'Premium wheel • Instant', desc:'0x / 1.2x / 1.5x / 2x / 5x + jackpot. Premium visuals.', icon: IconSpin, path:'/spin', pot:'Up to 10x • 1.8s spin', color:'#fff', bg:'#0a0a0a' },
    { id:'dice', title:'DICE ROLL', sub:'Roll over/under • Instant', desc:'Pick target, instant crypto RNG. Live balance.', icon: IconDice, path:'/dice', pot:'Up to 9x • 0.6s', color:'#0a84ff', bg:'#0a121a' },
    { id:'guess', title:'NUMBER GUESS', sub:'Pick 1-10 exact hit', desc:'Exact hit pays 8x. Simple, fast, instant.', icon: IconTarget, path:'/guess', pot:'8x payout • instant', color:'#00ff88', bg:'#0a1a12' },
    { id:'crash', title:'CRASH', sub:'Fly & cashout before crash', desc:'Multiplier rises, crash random. Cashout in time!', icon: IconChart, path:'/crash', pot:'Up to 100x • instant', color:'#ff453a', bg:'#1a0a0a' },
    { id:'mines', title:'MINES', sub:'Find gems, avoid mines', desc:'5x5 grid, pick safe tiles. Each gem increases multiplier.', icon: IconTarget, path:'/mines', pot:'Up to 5x • premium', color:'#ffcc00', bg:'#1a160a' },
    { id:'plinko', title:'PLINKO', sub:'Drop ball, win multiplier', desc:'Ball bounces through pins, lands in multiplier slot.', icon: IconBolt, path:'/plinko', pot:'Up to 100x • physics', color:'#0a84ff', bg:'#0a0a1a' },
    { id:'coinflip', title:'COINFLIP', sub:'Heads or Tails • 1.95x', desc:'50/50 flip, instant result. Premium coin animation.', icon: IconGame, path:'/coinflip', pot:'1.95x • 1s flip', color:'#fff', bg:'#111' },
    { id:'slots', title:'SLOTS', sub:'3 reels jackpot', desc:'Match 3 symbols, win jackpot. Premium slot machine.', icon: IconGame, path:'/slots', pot:'50x jackpot', color:'#ffcc00', bg:'#1a160a' },
  ]
  return (
    <PageWrap>
      <TopBar title="GAMES • 9 PREMIUM" />
      <div className="p16 flex col gap12">
        <div className="card p12" style={{ background:'#050505', border:'1px dashed #222' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#666', letterSpacing:'0.1em' }} className="flex gap8 center"><IconBolt size={12}/> INSTANT RESULTS • LIVE BALANCE • NO REFRESH</div>
          <div style={{ fontSize:11, color:'#777', marginTop:4 }}>All games server-side crypto RNG, client only animates. Balance updates realtime via Supabase channel.</div>
        </div>
        {list.map(g=>(
          <div key={g.id} className="card2 p16" style={{ cursor:'pointer', background:`linear-gradient(135deg, ${g.bg} 0%, #000 100%)`, border:'1px solid #1a1a1a', position:'relative', overflow:'hidden' }} onClick={()=>nav(g.path)}>
            <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, background:`radial-gradient(circle, ${g.color}15 0%, transparent 70%)`, borderRadius:'50%' }} />
            <div className="flex between">
              <div className="flex gap12 center">
                <div style={{ width:48, height:48, background:'#000', border:`1px solid ${g.color}30`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 20px ${g.color}15` }}><g.icon size={22} color={g.color} /></div>
                <div>
                  <div style={{ fontWeight:900, fontSize:15, letterSpacing:'-0.02em' }}>{g.title}</div>
                  <div style={{ fontSize:11, color:'#777', marginTop:2 }}>{g.sub}</div>
                </div>
              </div>
              <IconArrow color="#444" />
            </div>
            <div style={{ fontSize:11, color:'#888', marginTop:10, lineHeight:1.4 }}>{g.desc}</div>
            <div style={{ marginTop:10, display:'inline-flex', background:'#000', border:'1px solid #1a1a1a', borderRadius:999, padding:'4px 10px', fontSize:10, fontWeight:800, color:g.color }}>{g.pot}</div>
          </div>
        ))}
      </div>
    </PageWrap>
  )
}
