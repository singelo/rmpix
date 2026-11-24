import { DurableObject } from 'cloudflare:workers';
import {addPlayer,move,snapshot,validAmount,fail} from './game.js';
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
 const m=url.pathname.match(/^\/api\/([A-Z2-9]{8})\/(join|state|move|ws)$/);
 if(!m)return json({error:'Rota inválida.'},404);
 return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
}};
export class Room extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.sql=ctx.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');}
 load(){const rows=this.sql.exec('SELECT data FROM room WHERE id=1').toArray();return rows.length?JSON.parse(rows[0].data):null;}
 save(s){this.sql.exec('INSERT INTO room(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(s));}
 broadcast(s){const msg=JSON.stringify({type:'state',state:snapshot(s)});for(const ws of this.ctx.getWebSockets()){try{ws.send(msg)}catch{}}}
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
    addPlayer(s,b.name,id,token);this.save(s);return json({id,token,state:snapshot(s)});
   }
   if(!s)fail('Partida não encontrada.',404);
   if(action==='join'&&req.method==='POST'){
    const id=crypto.randomUUID(),token=crypto.randomUUID();
    addPlayer(s,b.name,id,token);s.revision++;this.save(s);this.broadcast(s);return json({id,token,state:snapshot(s)});
   }
   if(action==='ws'&&req.headers.get('Upgrade')?.toLowerCase()==='websocket'){
    const pair=new WebSocketPair();const [client,server]=Object.values(pair);
    this.ctx.acceptWebSocket(server);server.send(JSON.stringify({type:'state',state:snapshot(s)}));
    return new Response(null,{status:101,webSocket:client});
   }
   const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');
   const p=s.players.find(p=>p.token===token);if(!p)fail('Sessão inválida.',401);
   if(action==='state'&&req.method==='GET')return json({state:snapshot(s)});
   if(action==='move'&&req.method==='POST'){
    if(move(s,p.id,b)){this.save(s);this.broadcast(s);}
    return json({state:snapshot(s)});
   }
   fail('Operação inválida.',405);
  }catch(e){if(!e.status)console.error(e);return json({error:e.status?e.message:'Falha temporária. Tente novamente.'},e.status||500);}
 }
 webSocketMessage(ws,message){if(message==='ping')ws.send('pong');}
 webSocketClose(ws,code){try{ws.close(code,'Conexão encerrada')}catch{}}
 webSocketError(ws){try{ws.close(1011,'Reconecte')}catch{}}
}
