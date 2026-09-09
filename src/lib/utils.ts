export const fmt = (n: number) => {
  const v = Number(n || 0)
  return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
export const fmtCoin = (n: number) => Number(n||0).toFixed(2)
export const genRef = () => `WZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
export const sleep = (ms:number) => new Promise(r=>setTimeout(r,ms))
export const clamp = (v:number, lo:number, hi:number) => Math.min(hi, Math.max(lo, v))
