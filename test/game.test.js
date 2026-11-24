import test from 'node:test';import assert from 'node:assert/strict';import {addPlayer,move,snapshot} from '../src/game.js';
function setup(){const s={code:'ABCDEFGH',initial:100,host:'a',ended:false,revision:1,players:[],transactions:[]};addPlayer(s,'Ana','a','secret1');addPlayer(s,'Beto','b','secret2');return s}
const tx=(kind,amount,to='b',requestId='abcdefghijklmnop')=>({kind,amount,to,requestId});
test('Pix atômico e repetição idempotente',()=>{const s=setup();assert.equal(move(s,'a',tx('pix',30)),true);assert.deepEqual(s.players.map(p=>p.balance),[70,130]);assert.equal(move(s,'a',tx('pix',30)),false);assert.equal(s.transactions.length,1)});
test('saldo insuficiente não altera carteira',()=>{const s=setup();assert.throws(()=>move(s,'a',tx('pix',101)),/insuficiente/);assert.deepEqual(s.players.map(p=>p.balance),[100,100]);assert.equal(s.transactions.length,0)});
test('banco, falência e encerramento',()=>{const s=setup();move(s,'a',tx('receive',50));move(s,'b',tx('pay',20));move(s,'b',tx('bankrupt',0,'','bankrupt-12345678'));assert.equal(s.players[1].balance,0);assert.equal(s.winner.id,'a');assert.throws(()=>move(s,'b',tx('receive',20,'','bankrupt-87654321')),/encerrada/);assert.equal(s.ended,true);assert.throws(()=>move(s,'a',tx('receive',20,'','new-123456789012')),/encerrada/)});
test('snapshot não expõe credenciais',()=>{assert.equal(JSON.stringify(snapshot(setup())).includes('secret'),false)});

test('criador falido ainda encerra',()=>{const s=setup();addPlayer(s,'Caio','c','secret3');move(s,'a',tx('bankrupt',0));move(s,'a',tx('end',0,'','end-123456789012'));assert.equal(s.ended,true);assert.equal(s.winner,undefined)});

test('marco financeiro apenas na primeira passagem',()=>{const s=setup();s.initial=29000;s.players[0].balance=29000;s.players[0].peak=29000;move(s,'a',tx('receive',2000));assert.equal(s.transactions.at(-1).achievement.amount,30000);move(s,'a',tx('pay',2000,'','pay-123456789012'));move(s,'a',tx('receive',2000,'','receive-123456789'));assert.equal(s.transactions.at(-1).achievement,null)});

test('último sobrevivente coroado uma vez, sem movimentar saldo',()=>{const s=setup();addPlayer(s,'Caio','c','secret3');move(s,'a',tx('bankrupt',0));assert.equal(s.ended,false);move(s,'b',tx('bankrupt',0,'','bankrupt-12345678'));assert.equal(s.ended,true);assert.equal(s.winner.id,'c');assert.equal(s.winner.balance,100);assert.equal(s.transactions.filter(t=>t.kind==='victory').length,1);assert.equal(move(s,'b',tx('bankrupt',0,'','bankrupt-12345678')),false);assert.equal(s.transactions.filter(t=>t.kind==='victory').length,1)});
test('sala individual não recebe título automático',()=>{const s=setup();s.players.pop();move(s,'a',tx('bankrupt',0));assert.equal(s.winner,undefined)});
