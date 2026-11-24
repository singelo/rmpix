export const COLORS={blue:{name:'Azul',light:'#4088f5',dark:'#153d93'},red:{name:'Vermelho',light:'#f35b64',dark:'#a51d3a'},green:{name:'Verde',light:'#34bd8b',dark:'#11694d'},yellow:{name:'Amarelo',light:'#f5c947',dark:'#926000'},orange:{name:'Laranja',light:'#f58a42',dark:'#a94719'},purple:{name:'Roxo',light:'#aa79ee',dark:'#5934a4'},pink:{name:'Rosa',light:'#ef78ba',dark:'#a42d73'},black:{name:'Preto',light:'#68758a',dark:'#202737'}};
export const MARKS=[1000000,2500000,5000000,10000000,20000000,50000000,100000000,250000000,500000000,1000000000,5000000000,10000000000,100000000000];
export function milestones(previous,next){return MARKS.filter(n=>n>previous&&n<=next)}
export function colorOf(value){return Object.hasOwn(COLORS,value)?value:'blue'}
