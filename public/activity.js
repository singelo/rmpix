import {AWARDS,titleValue} from './awards.js?v=7.3';
const money=n=>'$ '+Number(n).toLocaleString('pt-BR');
export function transactionDisplay(t){
 const from=t.fromName||'Banco',to=t.toName||'Banco';
 const base={icon:'↔',label:t.label||'Movimentação',route:from+' → '+to,detail:'',value:money(t.amount),tone:'',at:t.at};
 switch(t.kind){
 case 'pix':return {...base,icon:'↗',label:'Pix',detail:t.note||''};
 case 'pay':return {...base,icon:'↗',label:'Pagamento ao banco',detail:t.note||''};
 case 'receive':return {...base,icon:'↙',label:'Recebimento do banco',tone:'green',detail:t.note||''};
 case 'auction_sale':return {...base,icon:'🔨',label:'Compra em leilão',detail:[t.property||t.label,t.pricing==='base-plus-bid'&&t.propertyValue>0&&t.winningBid>0?'Imóvel '+money(t.propertyValue)+' + lance '+money(t.winningBid):''].filter(Boolean).join(' · ')};
 case 'auction_unsold':return {...base,icon:'🔨',label:'Leilão sem venda',route:'Vendedor: '+to,detail:t.property||t.label,value:''};
 case 'bankrupt':return {...base,icon:'!',label:'Falência',route:from+' declarou falência',detail:'Saldo baixado, sem transferência',tone:'danger'};
 case 'victory':return {...base,icon:'🏆',label:'Partida decidida',route:(t.winner?.name||from)+' venceu a partida',value:''};
 case 'end':return {...base,icon:'✓',label:'Partida encerrada',route:'Encerrada pelo criador',value:''};
 default:return base;
 }
}
// O índice por operação evita reexaminar todas as conquistas para cada Pix.
export function awardHistory(transactions,stats){
 const key=(actor,id)=>JSON.stringify([actor??null,id]);
 const index=new Map(),useStats=stats?.version>=2&&Array.isArray(stats.awards);
 if(useStats)for(const a of stats.awards){const k=key(a.actor,a.transaction);if(!index.has(k))index.set(k,[]);index.get(k).push(a)}
 return transactions.flatMap(t=>{
  const awards=useStats?index.get(key(t.actor,t.id))||[]:t.awards||[];
  const rows=awards.filter(a=>AWARDS[a.key]).map(a=>({icon:AWARDS[a.key][1],label:AWARDS[a.key][0],route:a.name,detail:a.phrase||AWARDS[a.key][2],value:a.type==='title'?titleValue(a):'',tone:a.type==='title'?'gold':a.type==='status'?'alert':'',at:a.at??t.at}));
  if(t.achievement)rows.push({icon:'🏆',label:'Marco financeiro',route:t.achievement.name,detail:'Novo recorde pessoal de saldo',value:money(t.achievement.amount),tone:'green',at:t.at});
  return rows;
 });
}
export function activityTime(at,now=Date.now()){
 if(at==null||!Number.isFinite(Number(at)))return '';
 const d=new Date(at),n=new Date(now);if(!Number.isFinite(d.getTime()))return '';
 const time=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
 return d.toDateString()===n.toDateString()?time:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' · '+time;
}
