export const COLORS={blue:{name:'Azul',light:'#4088f5',dark:'#153d93'},red:{name:'Vermelho',light:'#f35b64',dark:'#a51d3a'},green:{name:'Verde',light:'#34bd8b',dark:'#11694d'},yellow:{name:'Amarelo',light:'#f5c947',dark:'#926000'},orange:{name:'Laranja',light:'#f58a42',dark:'#a94719'},purple:{name:'Roxo',light:'#aa79ee',dark:'#5934a4'},pink:{name:'Rosa',light:'#ef78ba',dark:'#a42d73'},black:{name:'Preto',light:'#68758a',dark:'#202737'},white:{name:'Branco',light:'#ffffff',dark:'#9ba8bc'},darkblue:{name:'Azul escuro',light:'#294b9c',dark:'#14254e'},brown:{name:'Marrom',light:'#a16a42',dark:'#56301e'},wine:{name:'Vinho',light:'#a43d5c',dark:'#50172f'}};
export const PAWN_COLORS=Object.freeze(['white','black','red','yellow','darkblue','green']);
export const CARD_COLORS=Object.freeze(['black','brown','wine','green','purple','blue']);
export const MAX_PLAYERS=6;
// O azul antigo continua visível como era, mas reserva o azul escuro na entrada.
export const pawnSlot=value=>value==='blue'?'darkblue':value;

export const MARKS=[30000,40000,50000,75000,100000,150000,250000,500000,1000000];
export const TITLES={30000:'Começou a lucrar',40000:'Investidor',50000:'Magnata',75000:'Tubarão dos negócios',100000:'Rei do tabuleiro',150000:'Lenda da partida',250000:'Império financeiro',500000:'Mestre dos negócios',1000000:'Milionário'};
export function milestones(previous,next){return MARKS.filter(n=>n>previous&&n<=next)}
export function colorOf(value){return Object.hasOwn(COLORS,value)?value:'blue'}

// O valor do próximo lance é o total atual mais 20% do preço original.
export function nextBid(auction){return (auction.highest||0)+Math.ceil(auction.value/5)}

export const AUCTION_PREP_MS=20000, AUCTION_BID_MS=8000;
// Existing auctions keep their agreed price; new auctions include the property base.
export function auctionTotal(a,bid=a.highest){return (a.pricing==='base-plus-bid'?a.value:0)+bid}
export function reservedAuction(a,id){return a?.status==='active'&&a.leader===id?auctionTotal(a):0}

// Cinco bandeiras fictícias, independentes da cor exclusiva do cartão.
export const CARD_TITLES=Object.freeze([
 'VISA SEM LIMITE','AMERICAN DEPRESS','MASTERCALOTE','PLATINUM SERASA','BLACK LISO'
]);
export function cardTitlesFor(players){
 const counts=new Map(CARD_TITLES.map(t=>[t,0])),result=new Map();
 for(const p of players){
  const min=Math.min(...counts.values());
  let title=p.cardTitle;
  if(!counts.has(title)||counts.get(title)!==min){
   let hash=2166136261;
   for(const ch of String(p.id))hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
   for(let i=0;i<CARD_TITLES.length;i++){
    const candidate=CARD_TITLES[(hash+i)%CARD_TITLES.length];
    if(counts.get(candidate)===min){title=candidate;break}
   }
  }
  counts.set(title,counts.get(title)+1);result.set(p.id,title);
 }
 return result;
}
