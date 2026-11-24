import { DurableObject } from 'cloudflare:workers';
import {ROOM_CODE,summarize} from './history.js';
import {AUDIO_LIMIT} from './victory-audio.js';
export {Directory} from './directory.js';
import {addPlayer,move,snapshot,validAmount,fail} from './game.js';
import {openAuction,bid,finishAuction} from './auction.js';
import {generateVapid,validSubscription,sendPush,pushEvent} from './push.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const directory=env=>env.DIRECTORY.get(env.DIRECTORY.idFromName('global'));
const dir=(env,path,b)=>directory(env).fetch('https://directory.internal'+path,b===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
const room=(env,code)=>env.ROOMS.get(env.ROOMS.idFromName(code));
async function authorized(req,env){const secret=env.ADMIN_CODE;if(typeof secret!=='string'||secret.length<12)return false;const given=req.headers.get('X-Admin-Code')||'';if(given.length>256)return false;const enc=new TextEncoder();const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',enc.encode(secret)),crypto.subtle.digest('SHA-256',enc.encode(given))]);const x=new Uint8Array(a),y=new Uint8Array(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;}
async function body(req){try{return await req.json()}catch{fail('Dados inválidos.')}}
export default {async fetch(req,env){
 const url=new URL(req.url);
 if(url.pathname==='/admin')return env.ASSETS.fetch(new Request(new URL('/admin.html',url),req));
 if(!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
 if(req.method==='POST'&&req.headers.get('Origin')!==url.origin) return json({error:'Origem inválida.'},403);
 if(url.pathname.startsWith('/api/admin/')){
  if(req.method!=='POST')return json({error:'Método inválido.'},405);
  if(!env.ADMIN_CODE||env.ADMIN_CODE.length<12)return json({error:'Configure ADMIN_CODE (mínimo 12 caracteres) na Cloudflare.'},503);
  if(!await authorized(req,env))return json({error:'Código administrativo incorreto.'},401);
  try{if(url.pathname==='/api/admin/victory-audio'){if(Number(req.headers.get('Content-Length'))>AUDIO_LIMIT)return json({error:'MP3 acima de 1 MiB.'},413);return directory(env).fetch('https://directory.internal/audio',{method:'POST',body:req.body});}
   if(url.pathname==='/api/admin/victory-audio-status')return dir(env,'/audio-status');
   if(url.pathname==='/api/admin/victory-audio-remove')return dir(env,'/audio-remove',{});
   const b=await body(req);
   if(url.pathname==='/api/admin/list'){const d=await (await dir(env,'/list?before='+encodeURIComponent(b.before??''))).json();const items=await Promise.all(d.rooms.map(async x=>{try{const r=await room(env,x.code).fetch('https://room.internal/internal/summary');return r.ok?await r.json():null}catch{return {code:x.code,unavailable:true}}}));return json({rooms:items.filter(Boolean),next:d.next});}
   if(url.pathname==='/api/admin/detail'){const code=typeof b.code==='string'?b.code.trim().toUpperCase():'';if(!ROOM_CODE.test(code))return json({error:'Código de sala inválido.'},400);const r=await room(env,code).fetch('https://room.internal/internal/detail');if(!r.ok)return json({error:'Partida não encontrada.'},404);await dir(env,'/register',{code});return json(await r.json());}
   return json({error:'Rota inválida.'},404);
  }catch(e){return json({error:'Não foi possível consultar o histórico.'},e.status||503);}
 }
 if(req.method==='POST'&&url.pathname==='/api/create'){
  const b=await body(req).catch(()=>null);if(!b||!validAmount(b.initial)||typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>30)return json({error:'Informe nome e saldo inicial válidos.'},400);
  const allocation=await dir(env,'/allocate',{});if(!allocation.ok)return json({error:'Não foi possível gerar a sala.'},503);const {code:key}=await allocation.json();return room(env,key).fetch(new Request(new URL('/api/'+key+'/create',url),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}));
 }
 const m=url.pathname.match(/^\/api\/(BR[0-9]{3,12}|[A-Z2-9]{8})\/(join|state|move|ws|push-key|subscribe|push-test|auction-open|auction-bid|victory-audio)$/);
 if(!m)return json({error:'Rota inválida.'},404);
 return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
}};
export class Room extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');this.sql.exec('CREATE TABLE IF NOT EXISTS push_keys (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');this.sql.exec('CREATE TABLE IF NOT EXISTS subscriptions (player TEXT PRIMARY KEY, data TEXT NOT NULL)');}
 load(){const rows=this.sql.exec('SELECT data FROM room WHERE id=1').toArray();return rows.length?JSON.parse(rows[0].data):null;}
 save(s){this.sql.exec('INSERT INTO room(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(s));}
 broadcast(s){const msg=JSON.stringify({type:'state',state:snapshot(s)});for(const ws of this.ctx.getWebSockets()){try{ws.send(msg)}catch{}}}
 async vapid(){const read=()=>this.sql.exec('SELECT data FROM push_keys WHERE id=1').toArray()[0];const old=read();if(old)return JSON.parse(old.data);const candidate=await generateVapid();this.sql.exec('INSERT OR IGNORE INTO push_keys(id,data) VALUES(1,?)',JSON.stringify(candidate));return JSON.parse(read().data)}
 async notify(t,origin){const rows=this.sql.exec('SELECT player,data FROM subscriptions').toArray();if(!rows.length)return;const vapid=await this.vapid();await Promise.allSettled(rows.map(async row=>{const body=pushEvent(t,row.player);if(!body)return;try{const r=await sendPush(JSON.parse(row.data),vapid,{body,tag:t.actor+':'+t.id},origin);if(r.status===404||r.status===410)this.sql.exec('DELETE FROM subscriptions WHERE player=? AND data=?',row.player,row.data);else if(!r.ok)console.warn('Web Push status',r.status,(await r.text()).slice(0,180));else console.log('Web Push accepted',r.status);if(!r.bodyUsed)await r.body?.cancel()}catch(e){console.warn('Web Push delivery failed',e.message)}}))}
 async alarm(){const s=this.load();if(!s||s.auction?.status!=='active')return;const t=finishAuction(s);if(t){this.save(s);this.broadcast(s);await this.notify(t,s.origin)}else await this.ctx.storage.setAlarm(s.auction.deadline);}
 schedule(s){return this.ctx.storage.setAlarm(s.auction.deadline)}
 async registerLegacy(s){if(/^BR[0-9]+$/.test(s.code)||this.sql.exec('SELECT data FROM room WHERE id=2').toArray().length)return;const r=await dir(this.env,'/register',{code:s.code});if(r.ok)this.sql.exec('INSERT OR IGNORE INTO room(id,data) VALUES(2,?)','registered');}
 async fetch(req){
  try{
   const internal=new URL(req.url).pathname;if(internal==='/internal/summary'||internal==='/internal/detail'){const saved=this.load();return saved?json(summarize(saved,internal.endsWith('detail'))):json({error:'Não encontrada.'},404);}
   const [, ,code,action]=new URL(req.url).pathname.split('/');
   const b=req.method==='POST'?await body(req):null;
   // No await between loading and saving: one serialized Durable Object turn.
   let s=this.load();
   if(action==='create'&&req.method==='POST'){
    if(s)fail('Código ocupado. Tente novamente.',409);
    if(!validAmount(b.initial))fail('Saldo inicial inválido.');
    const id=crypto.randomUUID(),token=crypto.randomUUID();
    s={code,initial:b.initial,host:id,ended:false,createdAt:Date.now(),revision:1,players:[],transactions:[]};
    addPlayer(s,b.name,id,token,b);this.save(s);return json({id,token,state:snapshot(s)});
   }
   if(!s)fail('Partida não encontrada.',404);
   if(!/^BR[0-9]+$/.test(s.code))this.ctx.waitUntil(this.registerLegacy(s).catch(e=>console.warn('Histórico legado',e.message)));
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
   if(action==='victory-audio'&&req.method==='GET')return dir(this.env,'/audio');
   if(action==='auction-open'&&req.method==='POST'){if(openAuction(s,p.id,b)){s.origin=origin;this.save(s);this.broadcast(s);await this.schedule(s);this.ctx.waitUntil(this.notify({kind:'auction_open',id:s.auction.id,actor:p.id,property:s.auction.property},origin));}return json({state:snapshot(s)});}
   if(action==='auction-bid'&&req.method==='POST'){if(bid(s,p.id,b)){this.save(s);this.broadcast(s);await this.schedule(s);}return json({state:snapshot(s)});}
   if(action==='push-test'&&req.method==='POST'){const row=this.sql.exec('SELECT data FROM subscriptions WHERE player=?',p.id).toArray()[0];if(!row)fail('Ative as notificações primeiro.');try{const r=await sendPush(JSON.parse(row.data),await this.vapid(),{body:'Teste RM PIX: notificações funcionando!',tag:crypto.randomUUID()},new URL(req.url).origin);const reason=r.ok?'Aceito pelo serviço de push':r.status>=300&&r.status<400?'Redirecionamento recusado pelo RM PIX (não seguido).':(await r.text()).slice(0,180)||r.statusText;if(r.ok)await r.body?.cancel();return json({accepted:r.ok,status:r.status,reason})}catch(e){return json({accepted:false,status:0,reason:String(e.message).slice(0,180)})}}
   if(action==='push-key'&&req.method==='GET')return json({key:(await this.vapid()).key});
   if(action==='subscribe'&&req.method==='POST'){if(b.subscription===null)this.sql.exec('DELETE FROM subscriptions WHERE player=?',p.id);else{if(!validSubscription(b.subscription))fail('Inscrição de push inválida.');this.sql.exec('INSERT INTO subscriptions(player,data) VALUES(?,?) ON CONFLICT(player) DO UPDATE SET data=excluded.data',p.id,JSON.stringify(b.subscription));}return json({ok:true});}
   if(action==='state'&&req.method==='GET')return json({state:snapshot(s)});
   if(action==='move'&&req.method==='POST'){
    const previous=s.transactions.length;if(move(s,p.id,b)){this.save(s);this.broadcast(s);const events=s.transactions.slice(previous);this.ctx.waitUntil((async()=>{for(const t of events)await this.notify(t,origin)})());}
    return json({state:snapshot(s)});
   }
   fail('Operação inválida.',405);
  }catch(e){if(!e.status)console.error(e);return json({error:e.status?e.message:'Falha temporária. Tente novamente.'},e.status||500);}
 }
 webSocketMessage(ws,message){if(message==='ping')ws.send('pong');}
 webSocketClose(ws,code){try{ws.close(code,'Conexão encerrada')}catch{}}
 webSocketError(ws){try{ws.close(1011,'Reconecte')}catch{}}
}
