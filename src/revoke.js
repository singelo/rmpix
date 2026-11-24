import {MAX,fail,validAmount} from './game.js';
import {milestones} from '../public/theme.js';
import {canRevoke} from '../public/revocation.js';
const copy=s=>JSON.parse(JSON.stringify(s));
function replay(s){
 const people=new Map(s.players.map(p=>[p.id,p]));
 for(const p of s.players){p.balance=s.initial;p.failed=false;p.peak=s.initial}
 s.ended=false;delete s.endedAt;delete s.winner;
 const conflict=t=>fail('Revogue primeiro a operação dependente: '+(t.label||t.kind)+' · '+(t.fromName||'Banco')+' → '+(t.toName||'Banco')+'.',409);
 for(const t of s.transactions){
  if(t.revoked||['victory','revoke','auction_unsold'].includes(t.kind))continue;
  if(s.ended)conflict(t);
  if(t.kind==='end'){s.ended=true;s.endedAt=t.at;continue}
  const from=people.get(t.from),to=people.get(t.to);
  if(t.kind==='bankrupt'){
   if(!from||from.failed)conflict(t);
   if(t.amount!==from.balance){if(t.originalAmount===undefined)t.originalAmount=t.amount;t.amount=from.balance}
   from.balance=0;from.failed=true;continue;
  }
  if(!['pix','pay','receive','auction_sale'].includes(t.kind)||!validAmount(t.amount))conflict(t);
  if(t.kind==='pix'&&(!from||!to||from===to)||t.kind==='pay'&&(!from||t.to!=='bank')||t.kind==='receive'&&(t.from!=='bank'||!to)||t.kind==='auction_sale'&&(!from||(!to&&t.to!=='bank')||from===to))conflict(t);
  if(from&&(from.failed||from.balance<t.amount)||to&&(to.failed||to.balance+t.amount>MAX))conflict(t);
  if(from)from.balance-=t.amount;
  let achievement=null;
  if(to){const before=to.peak;to.balance+=t.amount;const marks=milestones(before,to.balance);to.peak=Math.max(before,to.balance);if(marks.length)achievement={player:to.id,name:to.name,pawn:to.pawn??'blue',amount:marks.at(-1)}}
  if(JSON.stringify(t.achievement??null)!==JSON.stringify(achievement)){if(!Object.hasOwn(t,'originalAchievement'))t.originalAchievement=t.achievement??null;t.achievement=achievement}
 }
}
export function revoke(s,actor,b,now=Date.now()){
 if(actor!==s.host)fail('Somente o criador da partida pode revogar operações.',403);
 if(typeof b?.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(b.requestId)||typeof b.transactionId!=='string'||typeof b.transactionActor!=='string')fail('Identificador inválido.');
 const duplicate=s.transactions.find(t=>t.actor===actor&&t.id===b.requestId);
 if(duplicate){if(duplicate.kind==='revoke'&&duplicate.targetId===b.transactionId&&duplicate.targetActor===b.transactionActor)return false;fail('Identificador já utilizado.',409)}
 const target=s.transactions.find(t=>t.id===b.transactionId&&t.actor===b.transactionActor);
 if(!target)fail('Operação não encontrada.',404);
 if(!canRevoke(target))fail('Esta operação já foi revogada ou não pode ser revogada diretamente.',409);
 if(s.auction?.status==='active')fail('Aguarde o leilão terminar antes de revogar uma operação.',409);
 const baseline=copy(s);replay(baseline);
 if(baseline.players.some((p,i)=>p.balance!==s.players[i].balance||p.failed!==!!s.players[i].failed))fail('O histórico desta partida não permite uma recomposição segura dos saldos.',409);
 const draft=copy(s),t=draft.transactions.find(t=>t.id===target.id&&t.actor===target.actor);
 const meta={at:now,by:actor,name:s.players.find(p=>p.id===actor)?.name||'Criador',requestId:b.requestId};
 t.revoked=meta;replay(draft);
 if(draft.auction&&['auction_sale','auction_unsold'].includes(t.kind)&&t.id==='auction-'+draft.auction.id)draft.auction.status='revoked';
 const alive=draft.players.filter(p=>!p.failed),winner=!draft.ended&&draft.players.length>=2&&alive.length===1?alive[0]:null;
 const previous=draft.transactions.findLast(x=>x.kind==='victory'&&!x.revoked);
 const keep=winner&&previous&&previous.winner?.id===winner.id;
 for(const x of draft.transactions)if(x.kind==='victory'&&!x.revoked&&(!keep||x!==previous))x.revoked={...meta,automatic:true};
 draft.transactions.push({id:b.requestId,actor,kind:'revoke',from:'bank',to:'bank',fromName:meta.name,toName:'Partida',amount:0,label:'Operação revogada',targetId:t.id,targetActor:t.actor,targetKind:t.kind,targetLabel:t.label,targetFromName:t.fromName,targetToName:t.toName,targetProperty:t.property,targetAmount:t.amount,at:now});
 if(winner){
  const eventId=keep?previous.winner.eventId:'victory-'+draft.code+'-'+(s.revision+1);
  draft.ended=true;draft.endedAt=keep?(previous.at??now):now;
  draft.winner={id:winner.id,name:winner.name,pawn:winner.pawn??'blue',balance:winner.balance,title:'Mestre Supremo',...(eventId?{eventId}:{})};
  if(keep)previous.winner={...draft.winner};
  else draft.transactions.push({id:eventId,actor:winner.id,kind:'victory',from:winner.id,to:winner.id,fromName:winner.name,toName:winner.name,amount:0,label:'Mestre Supremo',winner:{...draft.winner},at:now});
 }
 draft.revision=s.revision+1;
 Object.assign(s,draft);if(!draft.ended){delete s.endedAt;delete s.winner}else if(!draft.winner)delete s.winner;
 return true;
}
