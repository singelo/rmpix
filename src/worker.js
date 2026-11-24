import { DurableObject } from 'cloudflare:workers';
import {addPlayer,move,snapshot,validAmount,fail} from './game.js';
import {openAuction,bid,finishAuction} from './auction.js';
import {generateVapid,validSubscription,sendPush,pushEvent} from './push.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
function code(){const a=new Uint8Array(8);crypto.getRandomValues(a);return Array.from(a,b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('');}
async function body(req){try{return await req.json()}catch{fail('Dados inválidos.')}}
export default {async fetch(req,env){
 const url=new URL(req.url);
 if(!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
 if(req.method==='POST'&&req.headers.get('Origin')!==url.origin) return json({error:'Origem inválida.'},403);
 if(req.method==='POST'&&url.pathname==='/api/create'){
  const key=code();return env.ROOMS.get(env.ROOMS.idFromName(key)).fetch(new Request(new URL('/api/'+key+'/create',url),req));
 }
 const m=url.pathname.match(/^\/api\/([A-Z2-9]{8})\/(join|state|move|ws|push-key|subscribe|push-test|auction-open|auction-bid)$/);
 if(!m)return json({error:'Rota inválida.'},404);
 return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
}};
export class Room extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.sql=ctx.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');this.sql.exec('CREATE TABLE IF NOT EXISTS push_keys (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');this.sql.exec('CREATE TABLE IF NOT EXISTS subscriptions (player TEXT PRIMARY KEY, data TEXT NOT NULL)');}
 load(){const rows=this.sql.exec('SELECT data FROM room WHERE id=1').toArray();return rows.length?JSON.parse(rows[0].data):null;}
 save(s){this.sql.exec('INSERT INTO room(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(s));}
 broadcast(s){const msg=JSON.stringify({type:'state',state:snapshot(s)});for(const ws of this.ctx.getWebSockets()){try{ws.send(msg)}catch{}}}
 async vapid(){const read=()=>this.sql.exec('SELECT data FROM push_keys WHERE id=1').toArray()[0];const old=read();if(old)return JSON.parse(old.data);const candidate=await generateVapid();this.sql.exec('INSERT OR IGNORE INTO push_keys(id,data) VALUES(1,?)',JSON.stringify(candidate));return JSON.parse(read().data)}
 async notify(t,origin){const rows=this.sql.exec('SELECT player,data FROM subscriptions').toArray();if(!rows.length)return;const vapid=await this.vapid();await Promise.allSettled(rows.map(async row=>{const body=pushEvent(t,row.player);if(!body)return;try{const r=await sendPush(JSON.parse(row.data),vapid,{body,tag:t.actor+':'+t.id},origin);if(r.status===404||r.status===410)this.sql.exec('DELETE FROM subscriptions WHERE player=? AND data=?',row.player,row.data);else if(!r.ok)console.warn('Web Push status',r.status,(await r.text()).slice(0,180));else console.log('Web Push accepted',r.status);if(!r.bodyUsed)await r.body?.cancel()}catch(e){console.warn('Web Push delivery failed',e.message)}}))}
 async alarm(){const s=this.load();if(!s||s.auction?.status!=='active')return;const t=finishAuction(s);if(t){this.save(s);this.broadcast(s);await this.notify(t,s.origin)}else await this.ctx.storage.setAlarm(s.auction.deadline);}
 schedule(s){return this.ctx.storage.setAlarm(s.auction.deadline)}
 async fetch(req){
  try{
   const [, ,code,action]=new URL(req.url).pathname.split('/');
   const b=req.method==='POST'?await body(req):null;
   // No await between loading and saving: one serialized Durable Object turn.
   let s=this.load();
   if(action==='create'&&req.method==='POST'){
    if(s)fail('Código ocupado. Tente novamente.',409);
    if(!validAmount(b.initial))fail('Saldo inicial inválido.');
    const id=crypto.randomUUID(),token=crypto.randomUUID();
    s={code,initial:b.initial,host:id,ended:false,revision:1,players:[],transactions:[]};
    addPlayer(s,b.name,id,token,b);this.save(s);return json({id,token,state:snapshot(s)});
   }
   if(!s)fail('Partida não encontrada.',404);
   const origin=new URL(req.url).origin;const closed=finishAuction(s);if(closed){this.save(s);this.broadcast(s);this.ctx.waitUntil(this.notify(closed,s.origin??origin));}
   if(action==='join'&&req.method==='POST'){
    const id=crypto.randomUUID(),token=crypto.randomUUID();
    addPlayer(s,b.name,id,token,b);s.revision++;this.save(s);this.broadcast(s);return json({id,token,state:snapshot(s)});
   }
   if(action==='ws'&&req.headers.get('Upgrade')?.toLowerCase()==='websocket'){
    const pair=new WebSocketPair();const [client,server]=Object.values(pair);
    this.ctx.acceptWebSocket(server);server.send(JSON.stringify({type:'state',state:snapshot(s)}));
    return new Response(null,{status:101,webSocket:client});
   }
   const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');
   const p=s.players.find(p=>p.token===token);if(!p)fail('Sessão inválida.',401);
   if(action==='auction-open'&&req.method==='POST'){if(openAuction(s,p.id,b)){s.origin=origin;this.save(s);this.broadcast(s);await this.schedule(s);this.ctx.waitUntil(this.notify({kind:'auction_open',id:s.auction.id,actor:p.id,property:s.auction.property},origin));}return json({state:snapshot(s)});}
   if(action==='auction-bid'&&req.method==='POST'){if(bid(s,p.id,b)){this.save(s);this.broadcast(s);await this.schedule(s);}return json({state:snapshot(s)});}
   if(action==='push-test'&&req.method==='POST'){const row=this.sql.exec('SELECT data FROM subscriptions WHERE player=?',p.id).toArray()[0];if(!row)fail('Ative as notificações primeiro.');try{const r=await sendPush(JSON.parse(row.data),await this.vapid(),{body:'Teste RM PIX: notificações funcionando!',tag:crypto.randomUUID()},new URL(req.url).origin);const reason=r.ok?'Aceito pelo serviço de push':(await r.text()).slice(0,180)||r.statusText;if(r.ok)await r.body?.cancel();return json({accepted:r.ok,status:r.status,reason})}catch(e){return json({accepted:false,status:0,reason:String(e.message).slice(0,180)})}}
   if(action==='push-key'&&req.method==='GET')return json({key:(await this.vapid()).key});
   if(action==='subscribe'&&req.method==='POST'){if(b.subscription===null)this.sql.exec('DELETE FROM subscriptions WHERE player=?',p.id);else{if(!validSubscription(b.subscription))fail('Inscrição de push inválida.');this.sql.exec('INSERT INTO subscriptions(player,data) VALUES(?,?) ON CONFLICT(player) DO UPDATE SET data=excluded.data',p.id,JSON.stringify(b.subscription));}return json({ok:true});}
   if(action==='state'&&req.method==='GET')return json({state:snapshot(s)});
   if(action==='move'&&req.method==='POST'){
    if(move(s,p.id,b)){this.save(s);this.broadcast(s);this.ctx.waitUntil(this.notify(s.transactions.at(-1),new URL(req.url).origin));}
    return json({state:snapshot(s)});
   }
   fail('Operação inválida.',405);
  }catch(e){if(!e.status)console.error(e);return json({error:e.status?e.message:'Falha temporária. Tente novamente.'},e.status||500);}
 }
 webSocketMessage(ws,message){if(message==='ping')ws.send('pong');}
 webSocketClose(ws,code){try{ws.close(code,'Conexão encerrada')}catch{}}
 webSocketError(ws){try{ws.close(1011,'Reconecte')}catch{}}
}
