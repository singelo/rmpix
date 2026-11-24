import {DurableObject} from 'cloudflare:workers';
import {roomCode,ROOM_CODE} from './history.js';
export class Directory extends DurableObject{
 constructor(ctx,env){super(ctx,env);this.sql=ctx.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS rooms (seq INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE, registered INTEGER NOT NULL)');this.sql.exec('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, n INTEGER NOT NULL)');}
 async fetch(req){const path=new URL(req.url).pathname;
 if(path==='/allocate'&&req.method==='POST'){const row=this.sql.exec('INSERT INTO counter(id,n) VALUES(1,1) ON CONFLICT(id) DO UPDATE SET n=n+1 RETURNING n').one();const code=roomCode(row.n);this.sql.exec('INSERT INTO rooms(code,registered) VALUES(?,?)',code,Date.now());return Response.json({code});}
 if(path==='/register'&&req.method==='POST'){const {code}=await req.json();if(typeof code!=='string'||!ROOM_CODE.test(code))return Response.json({error:'Código inválido'},{status:400});this.sql.exec('INSERT OR IGNORE INTO rooms(code,registered) VALUES(?,?)',code,Date.now());return Response.json({ok:true});}
 if(path==='/list'){const raw=Number(new URL(req.url).searchParams.get('before')||Number.MAX_SAFE_INTEGER);const before=Number.isSafeInteger(raw)&&raw>0?raw:Number.MAX_SAFE_INTEGER;const rows=this.sql.exec('SELECT seq,code FROM rooms WHERE seq<? ORDER BY seq DESC LIMIT 16',before).toArray();return Response.json({rooms:rows.slice(0,15),next:rows.length>15?rows[14].seq:null});}
 return new Response(null,{status:404});}
}
