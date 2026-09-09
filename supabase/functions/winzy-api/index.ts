// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function genRef() { return `WZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
function genIdem() { return `WD-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`; }
function cryptoRandom() { const arr = new Uint32Array(1); crypto.getRandomValues(arr); return arr[0] / 4294967295; }
function cryptoInt(min:number,max:number){ const range=max-min+1; const arr=new Uint32Array(1); crypto.getRandomValues(arr); return min + (arr[0] % range); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const path = url.pathname.replace("/winzy-api","").replace("/functions/v1/winzy-api","") || "/";

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const SUPABASE_DB_URL = Deno.env.get("SUPABASE_DB_URL") || "";

  const JB_URL_ENV = Deno.env.get("JACKBANK_URL") || "https://nksthsgrxudptwdbytoh.supabase.co";
  const JB_ANON_ENV = Deno.env.get("JACKBANK_ANON_KEY") || "";
  const JB_MERCHANT_KEY_ENV = Deno.env.get("JACKBANK_MERCHANT_API_KEY") || "";
  const JB_MERCHANT_SECRET_ENV = Deno.env.get("JACKBANK_MERCHANT_API_SECRET") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json({ ok:false, error:"Missing Supabase env" },500);

  const authHeader = req.headers.get("Authorization") || "";
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global:{ headers:{ Authorization: authHeader } } });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let user:any=null; let profile:any=null;
  if (authHeader) {
    const { data:{ user: u } } = await anonClient.auth.getUser();
    if (u) { user=u; const { data:p } = await serviceClient.from("profiles").select("*").eq("id",u.id).single(); if(p) profile=p; }
  }

  async function getGatewayConfig(){
    const { data } = await serviceClient.from("gateway_config").select("*").eq("id",1).single();
    const cfg=data||{};
    return { url: cfg.jackbank_url || cfg.base_url || JB_URL_ENV, anon_key: cfg.jackbank_anon_key || cfg.anon_key || JB_ANON_ENV, api_key: cfg.merchant_api_key || cfg.api_key || JB_MERCHANT_KEY_ENV, api_secret: cfg.merchant_api_secret || cfg.api_secret || JB_MERCHANT_SECRET_ENV, enabled: cfg.enabled ?? true };
  }
  async function getGameSettings(){ const { data } = await serviceClient.from("game_settings").select("*").eq("id",1).single(); return data||{}; }
  async function getPlayerSettings(userId:string){ const { data } = await serviceClient.from("player_settings").select("*").eq("user_id",userId).single(); return data||{}; }
  async function checkRateLimit(userId:string, action:string, limit:number, windowSec:number){
    const now=new Date(); const windowStart=new Date(now.getTime()-windowSec*1000);
    const { data: existing } = await serviceClient.from("rate_limits").select("*").eq("user_id",userId).eq("action",action).single();
    if(!existing){ await serviceClient.from("rate_limits").insert({ user_id:userId, action, count:1, window_start: now.toISOString() }); return true; }
    const ws=new Date(existing.window_start);
    if(ws < windowStart){ await serviceClient.from("rate_limits").update({ count:1, window_start: now.toISOString() }).eq("user_id",userId).eq("action",action); return true; }
    if(existing.count >= limit) return false;
    await serviceClient.from("rate_limits").update({ count: existing.count+1 }).eq("user_id",userId).eq("action",action); return true;
  }
  async function jbRpc(rpc:string, body:any, anonKey:string, baseUrl:string){
    const res=await fetch(`${baseUrl}/rest/v1/rpc/${rpc}`, { method:"POST", headers:{ "Content-Type":"application/json", apikey: anonKey, Authorization:`Bearer ${anonKey}` }, body: JSON.stringify(body) });
    const data=await res.json().catch(()=>({})); return { status: res.status, data };
  }

  let body:any={};
  if(req.method==="POST"){ try{ body=await req.json(); }catch{ body={}; } }

  if(path==="/" || path==="") return json({ ok:true, name:"WINZY API", version:"2.0 - 9 games" });
  if(!user) return json({ ok:false, error:"Unauthorized — login required" },401);
  const pSettings=await getPlayerSettings(user.id);
  if(pSettings.is_blocked) return json({ ok:false, error:"Account blocked by admin" },403);

  // DEPOSIT CREATE
  if(path==="/deposit/create" && req.method==="POST"){
    const amount=Number(body.amount); const settings=await getGameSettings(); const gw=await getGatewayConfig();
    if(!gw.enabled) return json({ ok:false, error:"Gateway disabled" },400);
    if(!amount || amount < (settings.wallet_min_deposit||10) || amount > (settings.wallet_max_deposit||10000)) return json({ ok:false, error:`Amount must be between ₹${settings.wallet_min_deposit||10} and ₹${settings.wallet_max_deposit||10000}` },400);
    if(!(await checkRateLimit(user.id,"deposit_create",10,60))) return json({ ok:false, error:"Rate limit" },429);
    if(!gw.anon_key || !gw.api_key || !gw.api_secret) return json({ ok:false, error:"Gateway not configured" },400);
    const order_ref=genRef();
    const { status, data } = await jbRpc("jb_gateway_create_order", { p_api_key: gw.api_key, p_api_secret: gw.api_secret, p_order_ref: order_ref, p_amount: amount, p_note:`WINZY deposit ${user.id.slice(0,6)}` }, gw.anon_key, gw.url);
    if(!data?.ok) return json({ ok:false, error: data?.error || `Gateway error HTTP ${status}`, raw:data },400);
    await serviceClient.from("deposits").insert({ user_id:user.id, order_ref, amount, status:"pending", pay_url: data.order?.pay_url, pay_token: data.order?.pay_token, jack_response: data });
    return json({ ok:true, order_ref, pay_url: data.order?.pay_url, pay_token: data.order?.pay_token });
  }
  if(path==="/deposit/verify" && req.method==="POST"){
    const order_ref=body.order_ref as string; if(!order_ref) return json({ ok:false, error:"order_ref required" },400);
    const gw=await getGatewayConfig();
    const { data: dep } = await serviceClient.from("deposits").select("*").eq("order_ref",order_ref).single();
    if(!dep) return json({ ok:false, error:"Deposit not found" },404);
    if(dep.user_id!==user.id && !profile?.is_admin) return json({ ok:false, error:"Not your deposit" },403);
    if(dep.status==="paid") return json({ ok:true, status:"paid", amount:dep.amount, already:true });
    const { status, data } = await jbRpc("jb_gateway_verify", { p_api_key: gw.api_key, p_api_secret: gw.api_secret, p_order_ref: order_ref }, gw.anon_key, gw.url);
    if(!data?.ok) return json({ ok:false, error: data?.error || `Verify failed HTTP ${status}`, status: data?.status||"pending" },400);
    if(data.status==="paid"){
      if(Number(data.amount) < Number(dep.amount)-0.01) return json({ ok:false, error:`Amount mismatch` },400);
      const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",dep.user_id).single();
      const newBalance=Number(prof.balance||0)+Number(dep.amount);
      const newLifetimeDeposits=Number(prof.lifetime_deposits||0)+Number(dep.amount);
      await serviceClient.from("profiles").update({ balance:newBalance, lifetime_deposits:newLifetimeDeposits }).eq("id",dep.user_id);
      await serviceClient.from("deposits").update({ status:"paid", verified_at:new Date().toISOString(), jack_response:data }).eq("id",dep.id);
      await serviceClient.from("wallet_ledger").insert({ user_id:dep.user_id, type:"deposit", amount:dep.amount, balance_after:newBalance, ref_id:order_ref, note:"Deposit via Jack Bank", metadata:data });
      return json({ ok:true, status:"paid", amount:dep.amount, balance:newBalance });
    } else {
      await serviceClient.from("deposits").update({ jack_response:data }).eq("id",dep.id);
      return json({ ok:true, status:data.status, amount:data.amount });
    }
  }
  if(path==="/deposit/reconcile" && req.method==="POST"){
    const gw=await getGatewayConfig();
    const { data: pending } = await serviceClient.from("deposits").select("*").eq("user_id",user.id).eq("status","pending").order("created_at",{ascending:false}).limit(5);
    let credited=0;
    for(const dep of pending||[]){
      const { data } = await jbRpc("jb_gateway_verify", { p_api_key: gw.api_key, p_api_secret: gw.api_secret, p_order_ref: dep.order_ref }, gw.anon_key, gw.url);
      if(data?.ok && data.status==="paid" && Number(data.amount) >= Number(dep.amount)-0.01){
        const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",dep.user_id).single();
        const newBalance=Number(prof.balance||0)+Number(dep.amount);
        const newLifetimeDeposits=Number(prof.lifetime_deposits||0)+Number(dep.amount);
        await serviceClient.from("profiles").update({ balance:newBalance, lifetime_deposits:newLifetimeDeposits }).eq("id",dep.user_id);
        await serviceClient.from("deposits").update({ status:"paid", verified_at:new Date().toISOString(), jack_response:data }).eq("id",dep.id);
        await serviceClient.from("wallet_ledger").insert({ user_id:dep.user_id, type:"deposit", amount:dep.amount, balance_after:newBalance, ref_id:dep.order_ref, note:"Auto-reconciled deposit", metadata:data });
        credited++;
      }
    }
    return json({ ok:true, reconciled: pending?.length||0, credited });
  }
  if(path==="/withdraw/create" && req.method==="POST"){
    const amount=Number(body.amount); const order_ref_target=body.order_ref_target as string;
    if(!amount || !order_ref_target) return json({ ok:false, error:"amount and order_ref_target required" },400);
    const settings=await getGameSettings(); const pSet=await getPlayerSettings(user.id);
    if(pSet.can_withdraw===false) return json({ ok:false, error:"Withdrawals disabled" },403);
    if(!(await checkRateLimit(user.id,"withdraw_create",5,60))) return json({ ok:false, error:"Rate limit" },429);
    const minW=pSet.max_withdraw_per_day?1:(settings.wallet_min_withdraw||50);
    const maxW=pSet.max_withdraw_per_day || settings.wallet_max_withdraw || 5000;
    if(amount < minW || amount > maxW) return json({ ok:false, error:`Withdraw amount must be between ₹${minW} and ₹${maxW}` },400);
    const today=new Date(); today.setHours(0,0,0,0);
    const { data: todayW } = await serviceClient.from("withdrawals").select("amount").eq("user_id",user.id).gte("created_at",today.toISOString());
    const todayTotal=(todayW||[]).reduce((a:any,b:any)=>a+Number(b.amount||0),0);
    const dailyLimit=pSet.max_withdraw_per_day || settings.wallet_daily_withdraw_limit || 10000;
    if(todayTotal + amount > dailyLimit) return json({ ok:false, error:`Daily withdraw limit ₹${dailyLimit} exceeded (today ₹${todayTotal})` },400);
    const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",user.id).single();
    const wagerMult=pSet.wager_multiplier_override ?? settings.wallet_wagering_multiplier ?? 1;
    if(Number(prof.lifetime_bets||0) < Number(prof.lifetime_deposits||0)*wagerMult -0.01) return json({ ok:false, error:`Wagering required: bets ₹${prof.lifetime_bets} < deposits ₹${prof.lifetime_deposits} * ${wagerMult}` },400);
    if(Number(prof.balance||0) < amount) return json({ ok:false, error:"Insufficient balance" },400);
    const { data: targetDep } = await serviceClient.from("deposits").select("*").eq("order_ref",order_ref_target).eq("user_id",user.id).single();
    if(!targetDep || targetDep.status!=="paid") return json({ ok:false, error:"Target deposit must be a PAID deposit of yours" },400);
    const gw=await getGatewayConfig();
    const idemKey=genIdem();
    const { status, data } = await jbRpc("jb_gateway_payout", { p_api_key: gw.api_key, p_api_secret: gw.api_secret, p_order_ref: order_ref_target, p_amount: amount, p_idempotency_key: idemKey, p_note:`WINZY withdraw ${user.id.slice(0,6)}` }, gw.anon_key, gw.url);
    if(!data?.ok) return json({ ok:false, error: data?.error || `Payout failed HTTP ${status}`, raw:data },400);
    const newBalance=Number(prof.balance)-amount;
    await serviceClient.from("profiles").update({ balance:newBalance }).eq("id",user.id);
    await serviceClient.from("withdrawals").insert({ user_id:user.id, amount, order_ref_target, idempotency_key:idemKey, status:"paid", payout_id:data.payout_id, jack_response:data });
    await serviceClient.from("wallet_ledger").insert({ user_id:user.id, type:"withdraw", amount:-amount, balance_after:newBalance, ref_id:idemKey, note:`Withdraw via ${order_ref_target}`, metadata:data });
    return json({ ok:true, amount, payout_id:data.payout_id, balance:newBalance, idempotency_key:idemKey });
  }

  // LOTTERY BUY
  if(path==="/games/lottery/buy" && req.method==="POST"){
    const { draw_id, numbers } = body;
    if(!draw_id || !Array.isArray(numbers) || numbers.length!==6) return json({ ok:false, error:"draw_id and 6 numbers required" },400);
    if(numbers.some((n:number)=> n<1 || n>49)) return json({ ok:false, error:"Numbers must be 1-49" },400);
    if(new Set(numbers).size!==6) return json({ ok:false, error:"Numbers must be unique" },400);
    const settings=await getGameSettings(); const pSet=await getPlayerSettings(user.id);
    if(pSet.can_play_lottery===false) return json({ ok:false, error:"Lottery disabled" },403);
    if(!(await checkRateLimit(user.id,"lottery_buy",20,60))) return json({ ok:false, error:"Rate limit" },429);
    const { data: draw } = await serviceClient.from("lottery_draws").select("*").eq("id",draw_id).single();
    if(!draw || draw.status!=="open") return json({ ok:false, error:"Draw not open" },400);
    const ticketPrice=Number(settings.lottery_ticket_price || draw.ticket_price || 10);
    const maxTickets=pSet.max_tickets_per_draw || settings.lottery_max_tickets_per_user || 10;
    const { count } = await serviceClient.from("lottery_tickets").select("*",{count:"exact", head:true}).eq("user_id",user.id).eq("draw_id",draw_id);
    if((count||0) >= maxTickets) return json({ ok:false, error:`Max ${maxTickets} tickets per draw` },400);
    const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",user.id).single();
    if(Number(prof.balance) < ticketPrice) return json({ ok:false, error:"Insufficient balance" },400);
    const newBalance=Number(prof.balance)-ticketPrice;
    await serviceClient.from("profiles").update({ balance:newBalance, lifetime_bets: Number(prof.lifetime_bets||0)+ticketPrice }).eq("id",user.id);
    const { data: ticket } = await serviceClient.from("lottery_tickets").insert({ user_id:user.id, draw_id, numbers: numbers.sort((a:number,b:number)=>a-b), amount:ticketPrice, status:"pending" }).select().single();
    await serviceClient.from("lottery_draws").update({ total_pot: Number(draw.total_pot||0)+ticketPrice, tickets_count:(draw.tickets_count||0)+1 }).eq("id",draw_id);
    await serviceClient.from("wallet_ledger").insert({ user_id:user.id, type:"bet", amount:-ticketPrice, balance_after:newBalance, ref_id:ticket.id, note:`Lottery ticket Draw #${draw.draw_number}`, game_type:"lottery", metadata:{ numbers } });
    return json({ ok:true, ticket, balance:newBalance });
  }

  // SPIN - instant result
  if(path==="/games/spin" && req.method==="POST"){
    const bet_amount=Number(body.bet_amount); if(!bet_amount || bet_amount<1) return json({ ok:false, error:"Invalid bet" },400);
    const settings=await getGameSettings(); const pSet=await getPlayerSettings(user.id);
    if(pSet.can_play_spin===false) return json({ ok:false, error:"Spin disabled" },403);
    if(!(await checkRateLimit(user.id,"spin",30,60))) return json({ ok:false, error:"Rate limit" },429);
    const minBet=pSet.min_bet_spin || settings.spin_cost || 1; const maxBet=pSet.max_bet_spin || settings.spin_max_win || 1000;
    if(bet_amount < minBet || bet_amount > maxBet) return json({ ok:false, error:`Bet must be ₹${minBet}-₹${maxBet}` },400);
    const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",user.id).single();
    if(Number(prof.balance) < bet_amount) return json({ ok:false, error:"Insufficient balance" },400);
    const weights=[
      { mult: settings.spin_multiplier_0 ?? 0, weight: settings.spin_weight_0 ?? 30 },
      { mult: settings.spin_multiplier_1_2 ?? 1.2, weight: settings.spin_weight_1_2 ?? 25 },
      { mult: settings.spin_multiplier_1_5 ?? 1.5, weight: settings.spin_weight_1_5 ?? 20 },
      { mult: settings.spin_multiplier_2 ?? 2, weight: settings.spin_weight_2 ?? 15 },
      { mult: settings.spin_multiplier_5 ?? 5, weight: settings.spin_weight_5 ?? 8 },
      { mult: settings.spin_multiplier_jackpot ?? 10, weight: settings.spin_weight_jackpot ?? 2 },
    ];
    const totalW=weights.reduce((a,b)=>a+b.weight,0); let r=cryptoRandom()*totalW; let chosenIdx=0;
    for(let i=0;i<weights.length;i++){ r-=weights[i].weight; if(r<=0){ chosenIdx=i; break; } }
    let multiplier=weights[chosenIdx].mult;
    if(pSet.custom_multiplier_spin) multiplier=Number(pSet.custom_multiplier_spin);
    // Apply house edge via admin win prob override
    const winProbOverride = settings.spin_win_probability ?? null;
    if(winProbOverride!==null){
      const shouldWin = cryptoRandom()*100 < Number(winProbOverride);
      if(!shouldWin){ multiplier=0; chosenIdx=0; }
    }
    const win_amount=Number((bet_amount*multiplier).toFixed(2));
    const newBalance=Number(prof.balance)-bet_amount+win_amount;
    await serviceClient.from("profiles").update({ balance:newBalance, lifetime_bets: Number(prof.lifetime_bets||0)+bet_amount, lifetime_wins: Number(prof.lifetime_wins||0)+(win_amount>0?win_amount:0) }).eq("id",user.id);
    await serviceClient.from("wallet_ledger").insert([
      { user_id:user.id, type:"bet", amount:-bet_amount, balance_after: Number(prof.balance)-bet_amount, note:`Spin bet`, game_type:"spin", metadata:{ multiplier, slice_index: chosenIdx } },
      ...(win_amount>0 ? [{ user_id:user.id, type:"win", amount:win_amount, balance_after:newBalance, note:`Spin win ${multiplier}x`, game_type:"spin", metadata:{ multiplier } }] : [])
    ]);
    const { data: hist } = await serviceClient.from("spin_history").insert({ user_id:user.id, bet_amount, multiplier, win_amount, result:{ slice_index: chosenIdx, multiplier, win_amount, seed: crypto.randomUUID() } }).select().single();
    return json({ ok:true, result:{ slice_index: chosenIdx, multiplier, win_amount, seed: hist.result.seed }, balance:newBalance });
  }

  // DICE - instant
  if(path==="/games/dice" && req.method==="POST"){
    const bet_amount=Number(body.bet_amount); const target=Number(body.target); const over=!!body.over;
    if(!bet_amount || isNaN(target)) return json({ ok:false, error:"bet and target required" },400);
    const settings=await getGameSettings(); const pSet=await getPlayerSettings(user.id);
    if(pSet.can_play_dice===false) return json({ ok:false, error:"Dice disabled" },403);
    if(!(await checkRateLimit(user.id,"dice",40,60))) return json({ ok:false, error:"Rate limit" },429);
    if(target < (settings.dice_min_target||5) || target > (settings.dice_max_target||95)) return json({ ok:false, error:"Target out of range" },400);
    const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",user.id).single();
    if(Number(prof.balance) < bet_amount) return json({ ok:false, error:"Insufficient balance" },400);
    const roll=Number((cryptoRandom()*100).toFixed(2));
    const winProb = settings.dice_win_probability ?? null;
    let win = over ? roll > target : roll < target;
    if(winProb!==null){
      win = cryptoRandom()*100 < Number(winProb);
    }
    const chance= over ? (100-target) : target;
    const houseEdge=(pSet.custom_house_edge_dice ?? settings.dice_house_edge ?? 2)/100;
    const multiplier= win ? Number(((99/chance)*(1-houseEdge)).toFixed(2)) : 0;
    const win_amount= win ? Number((bet_amount*multiplier).toFixed(2)) : 0;
    const newBalance=Number(prof.balance)-bet_amount+win_amount;
    await serviceClient.from("profiles").update({ balance:newBalance, lifetime_bets: Number(prof.lifetime_bets||0)+bet_amount, lifetime_wins: Number(prof.lifetime_wins||0)+win_amount }).eq("id",user.id);
    await serviceClient.from("wallet_ledger").insert([
      { user_id:user.id, type:"bet", amount:-bet_amount, balance_after: Number(prof.balance)-bet_amount, game_type:"dice", note:`Dice ${over?'OVER':'UNDER'} ${target}` },
      ...(win_amount>0 ? [{ user_id:user.id, type:"win", amount:win_amount, balance_after:newBalance, game_type:"dice", note:`Dice win roll ${roll}` }] : [])
    ]);
    await serviceClient.from("dice_history").insert({ user_id:user.id, bet_amount, target, over, roll, win, multiplier, win_amount, result:{ roll, win, multiplier, seed: crypto.randomUUID() } });
    return json({ ok:true, result:{ roll, win, multiplier, win_amount, target, over, seed: crypto.randomUUID() }, balance:newBalance });
  }

  // GUESS - instant
  if(path==="/games/guess" && req.method==="POST"){
    const bet_amount=Number(body.bet_amount); const number=Number(body.number);
    if(!bet_amount || !number || number<1 || number>10) return json({ ok:false, error:"bet and number 1-10 required" },400);
    const settings=await getGameSettings(); const pSet=await getPlayerSettings(user.id);
    if(pSet.can_play_guess===false) return json({ ok:false, error:"Guess disabled" },403);
    if(!(await checkRateLimit(user.id,"guess",40,60))) return json({ ok:false, error:"Rate limit" },429);
    const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",user.id).single();
    if(Number(prof.balance) < bet_amount) return json({ ok:false, error:"Insufficient balance" },400);
    const winProb = settings.guess_win_probability ?? null;
    let drawn=cryptoInt(1,10);
    let win=drawn===number;
    if(winProb!==null){
      win = cryptoRandom()*100 < Number(winProb);
      if(win) drawn=number; else { do{ drawn=cryptoInt(1,10); }while(drawn===number); }
    }
    const payoutMult=pSet.custom_payout_guess || settings.guess_payout_multiplier || 8;
    const win_amount= win ? Number((bet_amount*payoutMult).toFixed(2)) : 0;
    const newBalance=Number(prof.balance)-bet_amount+win_amount;
    await serviceClient.from("profiles").update({ balance:newBalance, lifetime_bets: Number(prof.lifetime_bets||0)+bet_amount, lifetime_wins: Number(prof.lifetime_wins||0)+win_amount }).eq("id",user.id);
    await serviceClient.from("wallet_ledger").insert([
      { user_id:user.id, type:"bet", amount:-bet_amount, balance_after: Number(prof.balance)-bet_amount, game_type:"guess", note:`Guess ${number}` },
      ...(win_amount>0 ? [{ user_id:user.id, type:"win", amount:win_amount, balance_after:newBalance, game_type:"guess", note:`Guess win ${drawn}` }] : [])
    ]);
    await serviceClient.from("guess_history").insert({ user_id:user.id, bet_amount, picked:number, drawn, win, win_amount, result:{ drawn, win, seed: crypto.randomUUID() } });
    return json({ ok:true, result:{ drawn, win, win_amount, picked:number, multiplier:payoutMult, seed: crypto.randomUUID() }, balance:newBalance });
  }

  // ========== NEW GAMES ==========

  // CRASH
  if(path==="/games/crash" && req.method==="POST"){
    const bet_amount=Number(body.bet_amount); const cashout_target=Number(body.cashout_target);
    if(!bet_amount || !cashout_target || cashout_target < 1.1) return json({ ok:false, error:"bet and cashout_target >=1.1 required" },400);
    const settings=await getGameSettings(); const pSet=await getPlayerSettings(user.id);
    if(pSet.can_play_crash===false) return json({ ok:false, error:"Crash disabled" },403);
    if(!(await checkRateLimit(user.id,"crash",30,60))) return json({ ok:false, error:"Rate limit" },429);
    const minBet=pSet.min_bet_crash || settings.crash_min_bet || 1; const maxBet=pSet.max_bet_crash || settings.crash_max_bet || 5000;
    if(bet_amount < minBet || bet_amount > maxBet) return json({ ok:false, error:`Bet must be ₹${minBet}-₹${maxBet}` },400);
    const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",user.id).single();
    if(Number(prof.balance) < bet_amount) return json({ ok:false, error:"Insufficient balance" },400);
    // Crash point generation with house edge and admin win prob
    const houseEdge=(pSet.custom_house_edge_crash ?? settings.crash_house_edge ?? 3)/100;
    const winProb=settings.crash_win_probability ?? 50;
    // Generate crash point: inverse transform, 99% / (1 - edge) distribution
    let crash_point;
    const r=cryptoRandom();
    // Simple: if r < houseEdge -> crash 1.0, else random
    if(r < houseEdge) crash_point=1.0;
    else {
      // Exponential distribution for crash
      const e = 0.01 / (1 - r);
      crash_point = Number((0.99 / e).toFixed(2));
      if(crash_point < 1) crash_point=1.0;
      if(crash_point > (settings.crash_max_multiplier||100)) crash_point=Number(settings.crash_max_multiplier||100);
    }
    // Admin override win probability
    const shouldWin = cryptoRandom()*100 < Number(winProb);
    if(!shouldWin && crash_point >= cashout_target) crash_point = Number((Math.random()*(cashout_target-1.01)+1.01).toFixed(2));
    if(shouldWin && crash_point < cashout_target) crash_point = Number((cashout_target + Math.random()*10).toFixed(2));

    const win = crash_point >= cashout_target;
    const multiplier = win ? cashout_target : 0;
    const win_amount = win ? Number((bet_amount*multiplier).toFixed(2)) : 0;
    const newBalance=Number(prof.balance)-bet_amount+win_amount;
    await serviceClient.from("profiles").update({ balance:newBalance, lifetime_bets: Number(prof.lifetime_bets||0)+bet_amount, lifetime_wins: Number(prof.lifetime_wins||0)+win_amount }).eq("id",user.id);
    await serviceClient.from("wallet_ledger").insert([
      { user_id:user.id, type:"bet", amount:-bet_amount, balance_after: Number(prof.balance)-bet_amount, game_type:"crash", note:`Crash target ${cashout_target}x` },
      ...(win_amount>0 ? [{ user_id:user.id, type:"win", amount:win_amount, balance_after:newBalance, game_type:"crash", note:`Crash win ${crash_point}x` }] : [])
    ]);
    try {
      await serviceClient.from("crash_history").insert({ user_id:user.id, bet_amount, cashout_target, crash_point, win, multiplier, win_amount, result:{ crash_point, win, seed: crypto.randomUUID() } });
    } catch(e){ /* table may not exist yet, ignore */ }
    return json({ ok:true, result:{ crash_point, win, multiplier, win_amount, cashout_target, seed: crypto.randomUUID() }, balance:newBalance });
  }

  // MINES
  if(path==="/games/mines" && req.method==="POST"){
    const bet_amount=Number(body.bet_amount); const mines_count=Number(body.mines_count)||5; const picks=body.picks as number[];
    if(!bet_amount || !Array.isArray(picks) || picks.length===0) return json({ ok:false, error:"bet and picks required" },400);
    const settings=await getGameSettings(); const pSet=await getPlayerSettings(user.id);
    if(pSet.can_play_mines===false) return json({ ok:false, error:"Mines disabled" },403);
    if(!(await checkRateLimit(user.id,"mines",30,60))) return json({ ok:false, error:"Rate limit" },429);
    const minBet=pSet.min_bet_mines || settings.mines_min_bet || 1; const maxBet=pSet.max_bet_mines || settings.mines_max_bet || 5000;
    if(bet_amount < minBet || bet_amount > maxBet) return json({ ok:false, error:`Bet must be ₹${minBet}-₹${maxBet}` },400);
    const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",user.id).single();
    if(Number(prof.balance) < bet_amount) return json({ ok:false, error:"Insufficient balance" },400);
    // Generate board 25 tiles
    const board=[]; for(let i=0;i<25;i++) board.push(0);
    const minePositions=new Set<number>(); while(minePositions.size < mines_count){ minePositions.add(cryptoInt(0,24)); }
    minePositions.forEach(pos=> board[pos]=1);
    const winProb=settings.mines_win_probability ?? 50;
    const shouldWin=cryptoRandom()*100 < Number(winProb);
    let win=true;
    for(const pick of picks){
      if(board[pick]===1){ win=false; break; }
    }
    if(!shouldWin && win){
      // force a mine in picks
      const randomPick=picks[cryptoInt(0,picks.length-1)];
      board[randomPick]=1;
      win=false;
    }
    if(shouldWin && !win){
      // remove mines from picks
      for(const pick of picks) board[pick]=0;
      win=true;
    }
    // multiplier based on revealed safe tiles
    const revealed=picks.length;
    const totalSafe=25-mines_count;
    const houseEdge=(pSet.custom_house_edge_mines ?? settings.mines_house_edge ?? 3)/100;
    let multiplier=0;
    if(win){
      // (totalSafe choose revealed) / (totalSafe - mines) ... simplified
      multiplier = Number(((1 + revealed*0.3) * (1-houseEdge)).toFixed(2));
      if(multiplier < 1) multiplier=1.1;
    }
    const win_amount= win ? Number((bet_amount*multiplier).toFixed(2)) : 0;
    const newBalance=Number(prof.balance)-bet_amount+win_amount;
    await serviceClient.from("profiles").update({ balance:newBalance, lifetime_bets: Number(prof.lifetime_bets||0)+bet_amount, lifetime_wins: Number(prof.lifetime_wins||0)+win_amount }).eq("id",user.id);
    await serviceClient.from("wallet_ledger").insert([
      { user_id:user.id, type:"bet", amount:-bet_amount, balance_after: Number(prof.balance)-bet_amount, game_type:"mines", note:`Mines ${mines_count} mines ${revealed} picks` },
      ...(win_amount>0 ? [{ user_id:user.id, type:"win", amount:win_amount, balance_after:newBalance, game_type:"mines", note:`Mines win ${multiplier}x` }] : [])
    ]);
    try {
      await serviceClient.from("mines_history").insert({ user_id:user.id, bet_amount, mines_count, revealed, win, multiplier, win_amount, board, picks, result:{ board, picks, win, seed: crypto.randomUUID() } });
    } catch(e){}
    return json({ ok:true, result:{ board, picks, win, multiplier, win_amount, revealed, seed: crypto.randomUUID() }, balance:newBalance });
  }

  // PLINKO
  if(path==="/games/plinko" && req.method==="POST"){
    const bet_amount=Number(body.bet_amount); const risk=body.risk||"medium";
    if(!bet_amount) return json({ ok:false, error:"bet required" },400);
    const settings=await getGameSettings(); const pSet=await getPlayerSettings(user.id);
    if(pSet.can_play_plinko===false) return json({ ok:false, error:"Plinko disabled" },403);
    if(!(await checkRateLimit(user.id,"plinko",30,60))) return json({ ok:false, error:"Rate limit" },429);
    const minBet=pSet.min_bet_plinko || settings.plinko_min_bet || 1; const maxBet=pSet.max_bet_plinko || settings.plinko_max_bet || 5000;
    if(bet_amount < minBet || bet_amount > maxBet) return json({ ok:false, error:`Bet must be ₹${minBet}-₹${maxBet}` },400);
    const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",user.id).single();
    if(Number(prof.balance) < bet_amount) return json({ ok:false, error:"Insufficient balance" },400);
    const multipliers = risk==="high" ? [0.2,0.5,1,2,5,10,100] : risk==="low" ? [0.5,0.8,1,1.2,1.5,2,3] : [0.3,0.7,1,1.5,2,5,20];
    const weights = risk==="high" ? [30,25,20,10,8,5,2] : risk==="low" ? [10,15,25,25,15,8,2] : [20,20,20,15,10,10,5];
    const totalW=weights.reduce((a,b)=>a+b,0); let r=cryptoRandom()*totalW; let idx=0;
    for(let i=0;i<weights.length;i++){ r-=weights[i]; if(r<=0){ idx=i; break; } }
    const winProb=settings.plinko_win_probability ?? 60;
    if(cryptoRandom()*100 >= Number(winProb)){
      idx=cryptoInt(0,2); // force low mult
    }
    const multiplier=multipliers[idx];
    const win_amount=Number((bet_amount*multiplier).toFixed(2));
    const newBalance=Number(prof.balance)-bet_amount+win_amount;
    await serviceClient.from("profiles").update({ balance:newBalance, lifetime_bets: Number(prof.lifetime_bets||0)+bet_amount, lifetime_wins: Number(prof.lifetime_wins||0)+win_amount }).eq("id",user.id);
    await serviceClient.from("wallet_ledger").insert([
      { user_id:user.id, type:"bet", amount:-bet_amount, balance_after: Number(prof.balance)-bet_amount, game_type:"plinko", note:`Plinko ${risk}` },
      { user_id:user.id, type:"win", amount:win_amount, balance_after:newBalance, game_type:"plinko", note:`Plinko ${multiplier}x` }
    ]);
    try {
      await serviceClient.from("plinko_history").insert({ user_id:user.id, bet_amount, risk, slot_index: idx, multiplier, win_amount, result:{ slot_index: idx, multiplier, seed: crypto.randomUUID() } });
    } catch(e){}
    return json({ ok:true, result:{ slot_index: idx, multiplier, win_amount, risk, seed: crypto.randomUUID() }, balance:newBalance });
  }

  // COINFLIP
  if(path==="/games/coinflip" && req.method==="POST"){
    const bet_amount=Number(body.bet_amount); const picked=body.picked as string;
    if(!bet_amount || !["heads","tails"].includes(picked)) return json({ ok:false, error:"bet and picked heads/tails required" },400);
    const settings=await getGameSettings(); const pSet=await getPlayerSettings(user.id);
    if(pSet.can_play_coinflip===false) return json({ ok:false, error:"Coinflip disabled" },403);
    if(!(await checkRateLimit(user.id,"coinflip",40,60))) return json({ ok:false, error:"Rate limit" },429);
    const minBet=pSet.min_bet_coinflip || settings.coinflip_min_bet || 1; const maxBet=pSet.max_bet_coinflip || settings.coinflip_max_bet || 5000;
    if(bet_amount < minBet || bet_amount > maxBet) return json({ ok:false, error:`Bet must be ₹${minBet}-₹${maxBet}` },400);
    const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",user.id).single();
    if(Number(prof.balance) < bet_amount) return json({ ok:false, error:"Insufficient balance" },400);
    const winProb=settings.coinflip_win_probability ?? 49;
    let result_side=cryptoRandom()<0.5?"heads":"tails";
    let win=result_side===picked;
    if(cryptoRandom()*100 < Number(winProb) && !win){ result_side=picked; win=true; }
    if(cryptoRandom()*100 >= Number(winProb) && win){ result_side= picked==="heads"?"tails":"heads"; win=false; }
    const payoutMult=pSet.custom_payout_guess || settings.coinflip_payout_multiplier || 1.95;
    const multiplier= win ? payoutMult : 0;
    const win_amount= win ? Number((bet_amount*multiplier).toFixed(2)) : 0;
    const newBalance=Number(prof.balance)-bet_amount+win_amount;
    await serviceClient.from("profiles").update({ balance:newBalance, lifetime_bets: Number(prof.lifetime_bets||0)+bet_amount, lifetime_wins: Number(prof.lifetime_wins||0)+win_amount }).eq("id",user.id);
    await serviceClient.from("wallet_ledger").insert([
      { user_id:user.id, type:"bet", amount:-bet_amount, balance_after: Number(prof.balance)-bet_amount, game_type:"coinflip", note:`Coinflip ${picked}` },
      ...(win_amount>0 ? [{ user_id:user.id, type:"win", amount:win_amount, balance_after:newBalance, game_type:"coinflip", note:`Coinflip win ${result_side}` }] : [])
    ]);
    try {
      await serviceClient.from("coinflip_history").insert({ user_id:user.id, bet_amount, picked, result_side, win, multiplier, win_amount, result:{ result_side, win, seed: crypto.randomUUID() } });
    } catch(e){}
    return json({ ok:true, result:{ result_side, win, multiplier, win_amount, picked, seed: crypto.randomUUID() }, balance:newBalance });
  }

  // SLOTS
  if(path==="/games/slots" && req.method==="POST"){
    const bet_amount=Number(body.bet_amount);
    if(!bet_amount) return json({ ok:false, error:"bet required" },400);
    const settings=await getGameSettings(); const pSet=await getPlayerSettings(user.id);
    if(pSet.can_play_slots===false) return json({ ok:false, error:"Slots disabled" },403);
    if(!(await checkRateLimit(user.id,"slots",30,60))) return json({ ok:false, error:"Rate limit" },429);
    const minBet=pSet.min_bet_slots || settings.slots_min_bet || 1; const maxBet=pSet.max_bet_slots || settings.slots_max_bet || 2000;
    if(bet_amount < minBet || bet_amount > maxBet) return json({ ok:false, error:`Bet must be ₹${minBet}-₹${maxBet}` },400);
    const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",user.id).single();
    if(Number(prof.balance) < bet_amount) return json({ ok:false, error:"Insufficient balance" },400);
    const symbols=["🍒","🍋","🔔","💎","7️⃣","🍀"];
    const reels=[ symbols[cryptoInt(0,symbols.length-1)], symbols[cryptoInt(0,symbols.length-1)], symbols[cryptoInt(0,symbols.length-1)] ];
    const winProb=settings.slots_win_probability ?? 30;
    let win=false; let multiplier=0;
    const shouldWin=cryptoRandom()*100 < Number(winProb);
    if(shouldWin){
      const winSymbol=symbols[cryptoInt(0,symbols.length-1)];
      reels[0]=winSymbol; reels[1]=winSymbol; reels[2]=winSymbol;
      win=true;
      if(winSymbol==="7️⃣") multiplier=settings.slots_jackpot_multiplier||50;
      else if(winSymbol==="💎") multiplier=20;
      else if(winSymbol==="🔔") multiplier=10;
      else multiplier=5;
    } else {
      // ensure not all same
      if(reels[0]===reels[1] && reels[1]===reels[2]){
        reels[2]=symbols[(symbols.indexOf(reels[2])+1)%symbols.length];
      }
      win=false; multiplier=0;
    }
    const win_amount= win ? Number((bet_amount*multiplier).toFixed(2)) : 0;
    const newBalance=Number(prof.balance)-bet_amount+win_amount;
    await serviceClient.from("profiles").update({ balance:newBalance, lifetime_bets: Number(prof.lifetime_bets||0)+bet_amount, lifetime_wins: Number(prof.lifetime_wins||0)+win_amount }).eq("id",user.id);
    await serviceClient.from("wallet_ledger").insert([
      { user_id:user.id, type:"bet", amount:-bet_amount, balance_after: Number(prof.balance)-bet_amount, game_type:"slots", note:`Slots ${reels.join("")}` },
      ...(win_amount>0 ? [{ user_id:user.id, type:"win", amount:win_amount, balance_after:newBalance, game_type:"slots", note:`Slots win ${multiplier}x` }] : [])
    ]);
    try {
      await serviceClient.from("slots_history").insert({ user_id:user.id, bet_amount, reels, win, multiplier, win_amount, result:{ reels, win, seed: crypto.randomUUID() } });
    } catch(e){}
    return json({ ok:true, result:{ reels, win, multiplier, win_amount, seed: crypto.randomUUID() }, balance:newBalance });
  }

  // ADMIN ROUTES
  if(path.startsWith("/admin")){
    if(!profile?.is_admin) return json({ ok:false, error:"Admin only" },403);

    if(path==="/admin/debug/env"){
      return json({ ok:true, has_db_url: !!SUPABASE_DB_URL, db_url_prefix: SUPABASE_DB_URL.slice(0,30), has_service_role: !!SUPABASE_SERVICE_ROLE_KEY });
    }

    if(path==="/admin/migrate/run" && req.method==="POST"){
      // Try to run migration using SUPABASE_DB_URL if available
      if(!SUPABASE_DB_URL) return json({ ok:false, error:"SUPABASE_DB_URL not available in edge env" },500);
      try {
        const { default: postgres } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
        const sql = postgres(SUPABASE_DB_URL);
        const migration = `
          alter table public.game_settings add column if not exists crash_min_bet numeric default 1;
          alter table public.game_settings add column if not exists crash_max_bet numeric default 5000;
          alter table public.game_settings add column if not exists crash_house_edge numeric default 3;
          alter table public.game_settings add column if not exists crash_max_multiplier numeric default 100;
          alter table public.game_settings add column if not exists crash_cooldown_sec int default 1;
          alter table public.game_settings add column if not exists crash_win_probability numeric default 50;
          alter table public.game_settings add column if not exists mines_min_bet numeric default 1;
          alter table public.game_settings add column if not exists mines_max_bet numeric default 5000;
          alter table public.game_settings add column if not exists mines_house_edge numeric default 3;
          alter table public.game_settings add column if not exists mines_grid_size int default 25;
          alter table public.game_settings add column if not exists mines_count int default 5;
          alter table public.game_settings add column if not exists mines_cooldown_sec int default 1;
          alter table public.game_settings add column if not exists mines_win_probability numeric default 50;
          alter table public.game_settings add column if not exists plinko_min_bet numeric default 1;
          alter table public.game_settings add column if not exists plinko_max_bet numeric default 5000;
          alter table public.game_settings add column if not exists plinko_house_edge numeric default 4;
          alter table public.game_settings add column if not exists plinko_max_multiplier numeric default 100;
          alter table public.game_settings add column if not exists plinko_cooldown_sec int default 1;
          alter table public.game_settings add column if not exists plinko_win_probability numeric default 60;
          alter table public.game_settings add column if not exists coinflip_min_bet numeric default 1;
          alter table public.game_settings add column if not exists coinflip_max_bet numeric default 5000;
          alter table public.game_settings add column if not exists coinflip_payout_multiplier numeric default 1.95;
          alter table public.game_settings add column if not exists coinflip_house_edge numeric default 2.5;
          alter table public.game_settings add column if not exists coinflip_cooldown_sec int default 1;
          alter table public.game_settings add column if not exists coinflip_win_probability numeric default 49;
          alter table public.game_settings add column if not exists slots_min_bet numeric default 1;
          alter table public.game_settings add column if not exists slots_max_bet numeric default 2000;
          alter table public.game_settings add column if not exists slots_house_edge numeric default 5;
          alter table public.game_settings add column if not exists slots_jackpot_multiplier numeric default 50;
          alter table public.game_settings add column if not exists slots_cooldown_sec int default 1;
          alter table public.game_settings add column if not exists slots_win_probability numeric default 30;
          alter table public.game_settings add column if not exists spin_win_probability numeric default 45;
          alter table public.game_settings add column if not exists dice_win_probability numeric default 49;
          alter table public.game_settings add column if not exists guess_win_probability numeric default 10;
          alter table public.game_settings add column if not exists lottery_win_probability numeric default 20;

          create table if not exists public.crash_history (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, bet_amount numeric not null, cashout_target numeric not null, crash_point numeric not null, win boolean not null, multiplier numeric not null, win_amount numeric not null, result jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
          alter table public.crash_history enable row level security; drop policy if exists "crash_own" on public.crash_history; create policy "crash_own" on public.crash_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
          create table if not exists public.mines_history (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, bet_amount numeric not null, mines_count int not null, revealed int not null, win boolean not null, multiplier numeric not null, win_amount numeric not null, board int[] not null, picks int[] not null, result jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
          alter table public.mines_history enable row level security; drop policy if exists "mines_own" on public.mines_history; create policy "mines_own" on public.mines_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
          create table if not exists public.plinko_history (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, bet_amount numeric not null, risk text not null default 'medium', slot_index int not null, multiplier numeric not null, win_amount numeric not null, result jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
          alter table public.plinko_history enable row level security; drop policy if exists "plinko_own" on public.plinko_history; create policy "plinko_own" on public.plinko_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
          create table if not exists public.coinflip_history (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, bet_amount numeric not null, picked text not null, result_side text not null, win boolean not null, multiplier numeric not null, win_amount numeric not null, result jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
          alter table public.coinflip_history enable row level security; drop policy if exists "coinflip_own" on public.coinflip_history; create policy "coinflip_own" on public.coinflip_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
          create table if not exists public.slots_history (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, bet_amount numeric not null, reels text[] not null, win boolean not null, multiplier numeric not null, win_amount numeric not null, result jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
          alter table public.slots_history enable row level security; drop policy if exists "slots_own" on public.slots_history; create policy "slots_own" on public.slots_history for select to authenticated using (user_id = auth.uid() or public.winzy_is_admin());
          alter table public.player_settings add column if not exists can_play_crash boolean default true;
          alter table public.player_settings add column if not exists can_play_mines boolean default true;
          alter table public.player_settings add column if not exists can_play_plinko boolean default true;
          alter table public.player_settings add column if not exists can_play_coinflip boolean default true;
          alter table public.player_settings add column if not exists can_play_slots boolean default true;
        `;
        const statements = migration.split(";").map(s=>s.trim()).filter(s=>s.length>0);
        let executed=0;
        for(const stmt of statements){
          try { await sql.unsafe(stmt); executed++; } catch(e){ console.log("stmt failed", stmt.slice(0,50), e.message); }
        }
        await sql.end();
        return json({ ok:true, executed, total: statements.length });
      } catch(e){ return json({ ok:false, error: e.message, stack: e.stack },500); }
    }

    if(path==="/admin/dashboard"){
      const { data: profiles } = await serviceClient.from("profiles").select("balance, lifetime_deposits, lifetime_bets, lifetime_wins");
      const totalBalance=profiles?.reduce((a:any,b:any)=>a+Number(b.balance||0),0)||0;
      const totalDep=profiles?.reduce((a:any,b:any)=>a+Number(b.lifetime_deposits||0),0)||0;
      const totalBets=profiles?.reduce((a:any,b:any)=>a+Number(b.lifetime_bets||0),0)||0;
      const totalWins=profiles?.reduce((a:any,b:any)=>a+Number(b.lifetime_wins||0),0)||0;
      const { count: depCount } = await serviceClient.from("deposits").select("*",{count:"exact", head:true});
      const { count: wdCount } = await serviceClient.from("withdrawals").select("*",{count:"exact", head:true});
      const { count: userCount } = await serviceClient.from("profiles").select("*",{count:"exact", head:true});
      return json({ ok:true, stats:{ totalBalance, totalDep, totalBets, totalWins, depCount, wdCount, userCount, houseEdge: totalBets>0 ? ((totalBets-totalWins)/totalBets*100).toFixed(2) : 0 } });
    }
    if(path==="/admin/lottery/create" && req.method==="POST"){
      const { data: last } = await serviceClient.from("lottery_draws").select("draw_number").order("draw_number",{ascending:false}).limit(1).single();
      const nextNum=(last?.draw_number||0)+1; const settings=await getGameSettings();
      const { data: draw, error } = await serviceClient.from("lottery_draws").insert({ draw_number: nextNum, status:"open", ticket_price: settings.lottery_ticket_price||10, total_pot:0, tickets_count:0 }).select().single();
      if(error) return json({ ok:false, error: error.message },400);
      return json({ ok:true, draw });
    }
    if(path==="/admin/lottery/draw" && req.method==="POST"){
      const { draw_id } = body; if(!draw_id) return json({ ok:false, error:"draw_id required" },400);
      const { data: draw } = await serviceClient.from("lottery_draws").select("*").eq("id",draw_id).single();
      if(!draw || draw.status!=="open") return json({ ok:false, error:"Draw not open" },400);
      const nums=new Set<number>(); while(nums.size<6) nums.add(cryptoInt(1,49)); const winning=Array.from(nums).sort((a,b)=>a-b);
      const { data: tickets } = await serviceClient.from("lottery_tickets").select("*").eq("draw_id",draw_id);
      const settings=await getGameSettings(); let winners_count=0; const winners:any[]=[];
      for(const t of tickets||[]){
        const match=t.numbers.filter((n:number)=> winning.includes(n)).length;
        let winPct=0;
        if(match===3) winPct=Number(settings.lottery_match3_pct||10);
        else if(match===4) winPct=Number(settings.lottery_match4_pct||15);
        else if(match===5) winPct=Number(settings.lottery_match5_pct||25);
        else if(match===6) winPct=Number(settings.lottery_match6_pct||50);
        if(winPct>0){
          const pot=Number(draw.total_pot||0); const winAmount=Number((pot*winPct/100).toFixed(2));
          const { data: prof } = await serviceClient.from("profiles").select("*").eq("id",t.user_id).single();
          const newBal=Number(prof.balance||0)+winAmount;
          await serviceClient.from("profiles").update({ balance:newBal, lifetime_wins: Number(prof.lifetime_wins||0)+winAmount }).eq("id",t.user_id);
          await serviceClient.from("lottery_tickets").update({ status:"won", win_amount:winAmount }).eq("id",t.id);
          await serviceClient.from("wallet_ledger").insert({ user_id:t.user_id, type:"win", amount:winAmount, balance_after:newBal, ref_id:t.id, note:`Lottery Draw #${draw.draw_number} match ${match}`, game_type:"lottery", metadata:{ winning_numbers: winning, match } });
          winners.push({ ticket_id:t.id, user_id:t.user_id, match, win_amount:winAmount }); winners_count++;
        } else { await serviceClient.from("lottery_tickets").update({ status:"lost" }).eq("id",t.id); }
      }
      await serviceClient.from("lottery_draws").update({ status:"completed", winning_numbers: winning, winners_count, winners, drawn_at: new Date().toISOString() }).eq("id",draw_id);
      return json({ ok:true, winning_numbers: winning, winners_count, winners });
    }
    if(path==="/admin/users/toggle_admin" && req.method==="POST"){
      const { user_id } = body; const { data: u } = await serviceClient.from("profiles").select("*").eq("id",user_id).single();
      if(!u) return json({ ok:false, error:"User not found" },404);
      await serviceClient.from("profiles").update({ is_admin: !u.is_admin }).eq("id",user_id);
      return json({ ok:true, is_admin: !u.is_admin });
    }
    if(path==="/admin/users/adjust_balance" && req.method==="POST"){
      const { user_id, delta } = body; const d=Number(delta); if(!d) return json({ ok:false, error:"delta required" },400);
      const { data: u } = await serviceClient.from("profiles").select("*").eq("id",user_id).single();
      const newBal=Number(u.balance||0)+d;
      await serviceClient.from("profiles").update({ balance:newBal }).eq("id",user_id);
      await serviceClient.from("wallet_ledger").insert({ user_id, type: d>0?"bonus":"adjustment", amount:d, balance_after:newBal, note:`Admin adjustment ${d}` });
      return json({ ok:true, new_balance:newBal });
    }
    if(path==="/admin/settings/save" && req.method==="POST"){
      const { settings } = body; if(!settings) return json({ ok:false, error:"settings required" },400);
      const { error } = await serviceClient.from("game_settings").update({ ...settings, updated_at: new Date().toISOString() }).eq("id",1);
      if(error) return json({ ok:false, error: error.message },400);
      return json({ ok:true });
    }
    if(path==="/admin/gateway/save" && req.method==="POST"){
      const { config } = body; if(!config) return json({ ok:false, error:"config required" },400);
      const { error } = await serviceClient.from("gateway_config").upsert({ id:1, ...config, updated_at: new Date().toISOString() }, { onConflict:"id" });
      if(error) return json({ ok:false, error: error.message },400);
      return json({ ok:true });
    }
    if(path==="/admin/gateway/test" && req.method==="POST"){
      const gw=await getGatewayConfig();
      if(!gw.anon_key || !gw.api_key || !gw.api_secret) return json({ ok:false, error:"Gateway keys missing" },400);
      const { data } = await jbRpc("jb_gateway_verify", { p_api_key: gw.api_key, p_api_secret: gw.api_secret, p_order_ref:"TEST-NOT-EXIST" }, gw.anon_key, gw.url);
      if(data?.error==="Invalid API credentials") return json({ ok:false, error:"Invalid API credentials" },400);
      return json({ ok:true, result:data, message:"Gateway reachable" });
    }
    if(path==="/admin/gateway/verify" && req.method==="POST"){
      const { order_ref } = body; const gw=await getGatewayConfig();
      const { data } = await jbRpc("jb_gateway_verify", { p_api_key: gw.api_key, p_api_secret: gw.api_secret, p_order_ref: order_ref }, gw.anon_key, gw.url);
      return json({ ok: !!data?.ok, ...data });
    }
    if(path==="/admin/gateway/payout_status" && req.method==="POST"){
      const { idempotency_key } = body; const gw=await getGatewayConfig();
      const { data } = await jbRpc("jb_gateway_payout_status", { p_api_key: gw.api_key, p_api_secret: gw.api_secret, p_idempotency_key: idempotency_key }, gw.anon_key, gw.url);
      return json({ ok: !!data?.ok, ...data });
    }
    return json({ ok:false, error:`Admin route not found: ${path}` },404);
  }
  return json({ ok:false, error:`Route not found: ${path}` },404);
});
