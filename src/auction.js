import {MAX,fail,player,validAmount} from './game.js';
import {milestones} from '../public/theme.js';
export const PREP=20000, BID=5000;
export function openAuction(s,actor,b,now=Date.now()){
 const p=player(s,actor);if(s.ended||p.failed)fail('Você não pode abrir um leilão.');
 if(typeof b.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(b.requestId))fail('Identificador inválido.');
 if(s.auction?.id===b.requestId&&s.auction.creator===actor)return false;
 if(s.auction?.status==='active')fail('Já existe um leilão aberto.');
 const name=typeof b.name==='string'?b.name.trim():'';
 if(!name||name.length>60||!validAmount(b.value))fail('Informe a propriedade e seu valor no tabuleiro.');
 if(!['bank','self'].includes(b.seller))fail('Escolha o vendedor.');
 const startAt=now+PREP;
 s.auction={id:b.requestId,creator:actor,property:name,value:b.value,minimum:Math.ceil(b.value/5),seller:b.seller==='self'?actor:'bank',sellerName:b.seller==='self'?p.name:'Banco',startAt,deadline:startAt+BID,highest:0,leader:null,leaderName:null,status:'active',bids:[]};
 s.revision++;return true;
}
export function bid(s,actor,b,now=Date.now()){
 const a=s.auction,p=player(s,actor);if(!a||a.id!==b.auctionId)fail('Leilão não encontrado.');
 if(typeof b.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(b.requestId))fail('Identificador inválido.');
 if(a.bids.some(x=>x.id===b.requestId&&x.player===actor))return false;
 if(a.status!=='active'||s.ended||now>=a.deadline)fail('Leilão encerrado.');
 if(now<a.startAt)fail('Aguarde a abertura dos lances.');
 if(p.failed||actor===a.seller||actor===a.leader)fail('Você não pode dar este lance.');
 if(!validAmount(b.amount)||b.amount<Math.max(a.minimum,a.highest+1))fail('Lance abaixo do mínimo.');
 if(p.balance<b.amount)fail('Saldo insuficiente para o lance.');
 if(a.seller!=='bank'&&player(s,a.seller).balance+b.amount>MAX)fail('Saldo do vendedor excederia o limite.');
 a.highest=b.amount;a.leader=actor;a.leaderName=p.name;a.deadline=now+BID;a.bids.push({id:b.requestId,player:actor,name:p.name,amount:b.amount,at:now});s.revision++;return true;
}
export function finishAuction(s,now=Date.now()){
 const a=s.auction;if(!a||a.status!=='active'||now<a.deadline)return null;
 const buyer=a.leader?player(s,a.leader):null,seller=a.seller==='bank'?null:player(s,a.seller);
 let achievement=null;
 if(buyer&&!buyer.failed&&buyer.balance>=a.highest&&(!seller||(!seller.failed&&seller.balance+a.highest<=MAX))){
  buyer.balance-=a.highest;if(seller){const previous=Math.max(seller.peak??s.initial,seller.balance);seller.balance+=a.highest;const marks=milestones(previous,seller.balance);seller.peak=Math.max(previous,seller.balance);if(marks.length)achievement={player:seller.id,name:seller.name,pawn:seller.pawn??'blue',amount:marks.at(-1)}}
  a.status='sold';
 }else a.status='unsold';
 a.closedAt=now;
 const sold=a.status==='sold';
 const t={id:'auction-'+a.id,actor:a.creator,kind:sold?'auction_sale':'auction_unsold',from:sold?buyer.id:'bank',to:a.seller,fromName:sold?buyer.name:'Sem vencedor',toName:a.sellerName,amount:sold?a.highest:0,label:sold?'Leilão · '+a.property:'Sem venda · '+a.property,note:'',property:a.property,achievement,at:now};
 s.transactions.push(t);s.revision++;return t;
}
