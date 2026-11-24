import {gameStats,attachAwards} from './achievements.js';
import {colorOf,milestones,reservedAuction,cardTitlesFor} from '../public/theme.js';
export const MAX = 999999999999;
export function validAmount(n) { return Number.isSafeInteger(n) && n > 0 && n <= MAX; }
export function fail(message, status=400) { throw Object.assign(new Error(message), {status}); }
export function nameOf(n) { const s=typeof n==='string'?n.trim():''; if(!s||s.length>30) fail('Informe um nome de até 30 caracteres.'); return s; }
export function player(state,id) { const p=state.players.find(p=>p.id===id); if(!p) fail('Jogador não encontrado.',404); return p; }
export function addPlayer(state,name,id,token,profile={}) {
 if(state.ended) fail('Partida encerrada.');
 if(state.players.length>=12) fail('Sala cheia.');
 name=nameOf(name);
 if(state.players.some(p=>p.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))) fail('Este nome já está na partida.');
 const p={id,token,name,balance:state.initial,failed:false,card:colorOf(profile.card),pawn:colorOf(profile.pawn),peak:state.initial}; state.players.push(p);const titles=cardTitlesFor(state.players);for(const member of state.players)member.cardTitle=titles.get(member.id);return p;
}
export function snapshot(s) { const titles=cardTitlesFor(s.players);return {stats:gameStats(s),code:s.code,initial:s.initial,host:s.host,ended:s.ended,revision:s.revision,players:s.players.map(({token,...p})=>({...p,cardTitle:titles.get(p.id)})),auction:s.auction??null,winner:s.winner??null,endedAt:s.endedAt??null,serverNow:Date.now(),transactions:s.transactions.slice(-100).reverse()}; }
export function move(s,actor,b,now=Date.now()) {
 const p=player(s,actor);
 if(typeof b.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(b.requestId)) fail('Identificador inválido.');
 if(s.transactions.some(t=>t.actor===actor&&t.id===b.requestId)) return false;
 if(s.ended) fail('Partida encerrada.');
 if(p.failed && b.kind!=='end') fail('Jogador falido.');
 let from,to,amount=0,label;
 if(b.kind==='end') { if(s.auction?.status==='active') fail('Aguarde o leilão terminar.'); if(actor!==s.host) fail('Somente quem criou a partida pode encerrá-la.',403); s.ended=true;s.endedAt=now; label='Partida encerrada'; }
 else if(b.kind==='bankrupt') { if(s.auction?.status==='active'&&(s.auction.leader===p.id||s.auction.seller===p.id))fail('Aguarde o leilão terminar.'); from=p; amount=p.balance; p.balance=0; p.failed=true; label='Falência'; }
 else {
  amount=b.amount; if(!validAmount(amount)) fail('Valor inválido.');
  if(b.kind==='pix') { from=p; to=player(s,b.to); if(from===to) fail('Escolha outro jogador.'); label='Pix'; }
  else if(b.kind==='pay') { from=p; label='Pagamento ao banco'; }
  else if(b.kind==='receive') { to=p; label='Recebimento do banco'; }
  else fail('Operação inválida.');
  if(from&&from.balance-reservedAuction(s.auction,from.id)<amount) fail('Saldo insuficiente.');
  if(to&&(to.failed||to.balance+amount+(s.auction?.status==='active'&&s.auction.seller===to.id&&s.auction.leader?reservedAuction(s.auction,s.auction.leader):0)>MAX)) fail('Destinatário indisponível ou limite excedido.');
  if(from) from.balance-=amount;
  if(to) to.balance+=amount;
 }
 const previousPeak=to?Math.max(to.peak??s.initial,to.balance-amount):0;
 const achieved=to?milestones(previousPeak,to.balance):[];
 if(to)to.peak=Math.max(previousPeak,to.balance);
 const note='';
 s.transactions.push({id:b.requestId,actor,kind:b.kind,from:from?.id??'bank',to:to?.id??'bank',fromName:from?.name??'Banco',toName:to?.name??'Banco',amount,label,note,achievement:achieved.length?{player:to.id,name:to.name,pawn:to.pawn??'blue',amount:achieved.at(-1)}:null,at:now});
 const transaction=s.transactions.at(-1);if(b.kind==='bankrupt')crownSurvivor(s,now);attachAwards(s,transaction);if(s.transactions.at(-1)!==transaction)attachAwards(s,s.transactions.at(-1));s.revision++; return true;
}

export function crownSurvivor(s,now=Date.now()){
 if(s.ended||s.players.length<2)return null;
 const alive=s.players.filter(p=>!p.failed);if(alive.length!==1)return null;
 const p=alive[0];s.ended=true;s.endedAt=now;s.winner={id:p.id,name:p.name,pawn:p.pawn??'blue',balance:p.balance,title:'Mestre Supremo'};
 if(s.auction?.status==='active'){s.auction.status='unsold';s.auction.closedAt=now;}
 const t={id:'victory-'+s.code,actor:p.id,kind:'victory',from:p.id,to:p.id,fromName:p.name,toName:p.name,amount:0,label:'Mestre Supremo',winner:s.winner,at:now};
 s.transactions.push(t);return t;
}
