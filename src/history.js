export const ROOM_CODE=/^(?:BR[0-9]{3,12}|[A-Z2-9]{8})$/;
export function roomCode(n){if(!Number.isSafeInteger(n)||n<1)throw Error('Sequência inválida');return 'BR'+String(n).padStart(3,'0')}
export function summarize(s,detail=false){
 const financial=s.transactions.filter(t=>['pix','pay','receive','auction_sale'].includes(t.kind));
 const players=s.players.map(p=>({id:p.id,name:p.name,pawn:p.pawn,card:p.card,balance:p.balance,failed:p.failed,peak:p.peak??p.balance}));
 const result={code:s.code,createdAt:s.createdAt??null,endedAt:s.endedAt??(s.ended?s.transactions.at(-1)?.at??null:null),ended:!!s.ended,winner:s.winner??null,players:players.length,failed:players.filter(p=>p.failed).length,initial:s.initial,remaining:players.reduce((a,p)=>a+p.balance,0),operations:financial.length,volume:financial.reduce((a,t)=>a+t.amount,0),auctions:financial.filter(t=>t.kind==='auction_sale').length,bankPaid:financial.filter(t=>t.kind==='pay').reduce((a,t)=>a+t.amount,0),bankReceived:financial.filter(t=>t.kind==='receive').reduce((a,t)=>a+t.amount,0)};
 if(detail){result.ranking=players.sort((a,b)=>Number(a.failed)-Number(b.failed)||b.balance-a.balance);result.transactions=s.transactions.map(t=>({...t})).reverse();}
 return result;
}
