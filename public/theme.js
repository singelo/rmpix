export const COLORS={blue:{name:'Azul',light:'#4088f5',dark:'#153d93'},red:{name:'Vermelho',light:'#f35b64',dark:'#a51d3a'},green:{name:'Verde',light:'#34bd8b',dark:'#11694d'},yellow:{name:'Amarelo',light:'#f5c947',dark:'#926000'},orange:{name:'Laranja',light:'#f58a42',dark:'#a94719'},purple:{name:'Roxo',light:'#aa79ee',dark:'#5934a4'},pink:{name:'Rosa',light:'#ef78ba',dark:'#a42d73'},black:{name:'Preto',light:'#68758a',dark:'#202737'}};
export const MARKS=[30000,40000,50000,75000,100000,150000,250000,500000,1000000];
export const TITLES={30000:'Começou a lucrar',40000:'Investidor',50000:'Magnata',75000:'Tubarão dos negócios',100000:'Rei do tabuleiro',150000:'Lenda da partida',250000:'Império financeiro',500000:'Mestre dos negócios',1000000:'Milionário'};
export function milestones(previous,next){return MARKS.filter(n=>n>previous&&n<=next)}
export function colorOf(value){return Object.hasOwn(COLORS,value)?value:'blue'}
