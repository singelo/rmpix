import {DurableObject} from 'cloudflare:workers';
import {roomCode,ROOM_CODE} from './history.js';
import {readAudio} from './victory-audio.js';
export class Directory extends DurableObject{
 constructor(ctx,env){super(ctx,env);this.sql=ctx.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS rooms (seq INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE, registered INTEGER NOT NULL)');this.sql.exec('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, n INTEGER NOT NULL)');this.sql.exec('CREATE TABLE IF NOT EXISTS victory_audio (id INTEGER PRIMARY KEY, audio BLOB NOT NULL, updated INTEGER NOT NULL)');}
 async fetch(req){const path=new URL(req.url).pathname;
 if(path==='/audio'&&req.method==='GET'){const row=this.sql.exec('SELECT audio FROM victory_audio WHERE id=1').toArray()[0];return row?new Response(row.audio,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}}):new Response(null,{status:404});}
 if(path==='/audio-status'){const row=this.sql.exec('SELECT length(audio) AS size,updated FROM victory_audio WHERE id=1').toArray()[0];return Response.json({configured:!!row,size:row?.size??0,updated:row?.updated??null});}
 if(path==='/audio-remove'&&req.method==='POST'){this.sql.exec('DELETE FROM victory_audio WHERE id=1');return Response.json({ok:true});}
 if(path==='/audio'&&req.method==='POST'){const audio=await readAudio(req);if(!audio)return Response.json({error:'Envie um MP3 válido de até 1 MiB.'},{status:400});this.sql.exec('INSERT INTO victory_audio(id,audio,updated) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET audio=excluded.audio,updated=excluded.updated',audio.buffer,Date.now());return Response.json({ok:true,size:audio.byteLength});}
 if(path==='/allocate'&&req.method==='POST'){const row=this.sql.exec('INSERT INTO counter(id,n) VALUES(1,1) ON CONFLICT(id) DO UPDATE SET n=n+1 RETURNING n').one();const code=roomCode(row.n);this.sql.exec('INSERT INTO rooms(code,registered) VALUES(?,?)',code,Date.now());return Response.json({code});}
 if(path==='/register'&&req.method==='POST'){const {code}=await req.json();if(typeof code!=='string'||!ROOM_CODE.test(code))return Response.json({error:'Código inválido'},{status:400});this.sql.exec('INSERT OR IGNORE INTO rooms(code,registered) VALUES(?,?)',code,Date.now());return Response.json({ok:true});}
 if(path==='/list'){const raw=Number(new URL(req.url).searchParams.get('before')||Number.MAX_SAFE_INTEGER);const before=Number.isSafeInteger(raw)&&raw>0?raw:Number.MAX_SAFE_INTEGER;const rows=this.sql.exec('SELECT seq,code FROM rooms WHERE seq<? ORDER BY seq DESC LIMIT 16',before).toArray();return Response.json({rooms:rows.slice(0,15),next:rows.length>15?rows[14].seq:null});}
 return new Response(null,{status:404});}
}
