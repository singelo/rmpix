import {AWARDS,POOR_LINES} from '../public/awards.js';
export function gameStats(s){
 const initial=s.initial||0,people=new Map(),awards=[],seen=new Set();let volume=0,operations=0,auctions=0,firstFailure=null,firstPix=false,biggestPix=null;
 for(const p of s.players)people.set(p.id,{id:p.id,name:p.name,pawn:p.pawn,balance:initial,peak:initial,low:initial,failed:false,operations:0,sent:0,received:0,bankPaid:0,sales:0,buys:0,poorSince:null,poorMs:0,badges:[]});
 function grant(p,key,t){if(!p||seen.has(p.id+':'+key))return;const id=p.id+':'+key;seen.add(id);p.badges.push(key);awards.push({id,key,player:p.id,name:p.name,pawn:p.pawn,at:t.at,transaction:t.id,actor:t.actor,phrase:key==='poor'?POOR_LINES[Array.from(id).reduce((n,c)=>n+c.charCodeAt(0),0)%POOR_LINES.length]:AWARDS[key][2]})}
 for(const t of s.transactions){const from=people.get(t.from),to=people.get(t.to),amount=Number(t.amount)||0;
 if(t.kind==='bankrupt'&&from){if(from.poorSince!=null&&Number.isFinite(t.at)){from.poorMs+=Math.max(0,t.at-from.poorSince);from.poorSince=null}from.failed=true;from.balance=0;if(!firstFailure){firstFailure={id:from.id,name:from.name,at:t.at};grant(from,'firstFail',t)}continue}
 if(!['pix','pay','receive','auction_sale'].includes(t.kind))continue;
 volume+=amount;operations++;if(from){from.balance-=amount;from.operations++}if(to){to.balance+=amount;if(to!==from)to.operations++}
 if(t.kind==='pix'){if(from){from.sent++;if(!firstPix){firstPix=true;grant(from,'firstPix',t)}if(from.sent>=5)grant(from,'pix5',t);if(from.sent>=15)grant(from,'pix15',t);if(initial&&amount>=initial/2)grant(from,'bigPix',t)}if(to){to.received++;if(to.received>=5)grant(to,'received5',t)}if(!biggestPix||amount>biggestPix.amount)biggestPix={name:t.fromName,amount}}
 if(t.kind==='pay'&&from&&++from.bankPaid>=5)grant(from,'bank5',t);
 if(t.kind==='auction_sale'){auctions++;if(from){if(++from.buys>=3)grant(from,'buy3',t);if(t.propertyValue>0&&t.winningBid===Math.ceil(t.propertyValue/5))grant(from,'cheap',t);if(t.propertyValue>0&&amount>2*t.propertyValue)grant(from,'reckless',t)}if(to&&++to.sales>=3)grant(to,'sale3',t)}
 for(const p of new Set([from,to].filter(Boolean))){if(p.failed)continue;const priorLow=p.low;p.low=Math.min(p.low,p.balance);p.peak=Math.max(p.peak,p.balance);if(initial&&p.balance<=initial*.2)grant(p,'falling',t);if(initial&&p.balance<initial*.1){grant(p,'poor',t);if(p.poorSince==null&&Number.isFinite(t.at))p.poorSince=t.at}else if(p.poorSince!=null&&Number.isFinite(t.at)){p.poorMs+=Math.max(0,t.at-p.poorSince);p.poorSince=null}if(p.balance===0)grant(p,'zero',t);if(priorLow<1000&&initial>=1000&&p.balance>=initial)grant(p,'comeback',t);if(initial&&p.balance>=initial*2)grant(p,'double',t);if(initial&&p.balance>=initial*3)grant(p,'triple',t)}
 const rank=[...people.values()].filter(p=>!p.failed).sort((a,b)=>b.balance-a.balance);if(rank.length>=2&&rank[0].balance>initial&&rank[0].balance>rank[1].balance)grant(rank[0],'rich',t)
 }
 const rows=[...people.values()];const finishedAt=s.ended?(s.endedAt??s.transactions.at(-1)?.at):null;for(const p of rows){if(p.poorSince!=null&&Number.isFinite(finishedAt)){p.poorMs+=Math.max(0,finishedAt-p.poorSince);p.poorSince=null}const actual=s.players.find(x=>x.id===p.id);p.peak=Math.max(p.peak,actual.peak??actual.balance??0);p.balance=actual.balance;p.failed=!!actual.failed}
 if(s.ended){const max=Math.max(0,...rows.map(p=>p.operations)),last=s.transactions.at(-1);if(max&&last)for(const p of rows.filter(p=>p.operations===max))grant(p,'chaos',last)}
 const highest=[...rows].sort((a,b)=>b.peak-a.peak)[0],most=[...rows].sort((a,b)=>b.operations-a.operations)[0],end=s.endedAt??(s.ended?s.transactions.at(-1)?.at:null);
 return {players:rows,awards,summary:{operations,volume,auctions,failed:rows.filter(p=>p.failed).length,firstFailure,highest:highest?{name:highest.name,amount:highest.peak}:null,most:most?.operations?{name:most.name,operations:most.operations}:null,biggestPix,duration:s.createdAt!=null&&end!=null?Math.max(0,end-s.createdAt):null}}
}
export function attachAwards(s,t){const awards=gameStats(s).awards.filter(a=>a.transaction===t.id&&a.actor===t.actor);if(awards.length)t.awards=awards}
