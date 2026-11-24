// Original synthesized game cues; no recordings, external libraries or network requests.
// [frequency Hz, duration seconds, offset seconds, waveform, relative volume, end Hz?]
export const CUES=Object.freeze({
 receive:[[660,.09,0,'sine',.6],[880,.09,.075,'triangle',.55],[1175,.22,.15,'sine',.6]],
 send:[[550,.09,0,'triangle',.55],[440,.14,.09,'sine',.5]],
 bank:[[440,.08,0,'triangle',.6],[660,.14,.09,'sine',.5]],
 auctionOpen:[[392,.12,0,'triangle',.65],[523,.12,.13,'triangle',.65],[784,.2,.26,'sine',.65]],
 auctionStart:[[660,.09,0,'triangle',.6],[990,.2,.12,'triangle',.65]],
 bid:[[800,.065,0,'triangle',.55],[1100,.1,.065,'sine',.5]],
 tick:[[740,.055,0,'sine',.45]],
 finalTick:[[1040,.09,0,'triangle',.5]],
 sold:[[180,.12,0,'triangle',.8,70],[523,.09,.13,'triangle',.5],[784,.2,.23,'sine',.6]],
 unsold:[[440,.12,0,'sine',.45],[330,.18,.12,'sine',.5]],
 bankrupt:[[140,.35,0,'sawtooth',.35,48],[220,.16,.07,'triangle',.5,80],[100,.27,.31,'triangle',.5,45]],
 achievement:[[523,.11,0,'triangle',.55],[659,.11,.11,'triangle',.55],[784,.12,.22,'triangle',.6],[1047,.3,.34,'sine',.65]],
 victory:[[392,.14,0,'triangle',.6],[523,.14,.15,'triangle',.6],[659,.14,.30,'triangle',.65],[784,.15,.45,'triangle',.65],[1047,.48,.62,'triangle',.65],[523,.48,.62,'sine',.35],[659,.48,.62,'sine',.35]],
 end:[[523,.12,0,'sine',.5],[392,.2,.12,'sine',.5]]
});
export function auctionCue(previous,a,now){
 if(!a||a.status!=='active')return {key:null,cue:null};
 const waiting=now<a.startAt, remaining=(waiting?a.startAt:a.deadline)-now;
 if(remaining<=0)return {key:a.id+':expired:'+a.deadline,cue:null};
 const second=Math.ceil(remaining/1000);
 const phase=waiting?'prep':'bid';
 const key=a.id+':'+phase+':'+a.deadline+':'+second;
 if(previous===key)return {key,cue:null};
 if(!waiting&&previous?.startsWith(a.id+':prep:'))return {key,cue:'auctionStart'};
 return {key,cue:second===1?'finalTick':second<=3?'tick':null};
}
let ctx=null, master=null, enabled=true, initialized=false;
function initPreference(){if(initialized)return;initialized=true;try{enabled=localStorage.getItem('rmpix-sound')!=='off'}catch{}}
export function soundEnabled(){initPreference();return enabled}
export function unlockSound(){
 initPreference();if(!enabled)return;
 try{const ac=ensureContext();if(!ac)return;if(ac.state!=='running')return ac.resume().catch(()=>{})}catch{}
}
export function setSound(on){initPreference();enabled=!!on;try{localStorage.setItem('rmpix-sound',enabled?'on':'off')}catch{}if(master&&ctx)master.gain.setValueAtTime(enabled?.16:0,ctx.currentTime);if(!enabled)stopVictory();if(enabled)return unlockSound()}
export function playSound(name){
 if(!soundEnabled()||!ctx||ctx.state!=='running'||document.hidden||!CUES[name])return false;
 try{const start=ctx.currentTime+.008;for(const [hz,duration,offset,type,vol,endHz] of CUES[name]){
 const osc=ctx.createOscillator(),gain=ctx.createGain(),at=start+offset;osc.type=type;osc.frequency.setValueAtTime(hz,at);if(endHz)osc.frequency.exponentialRampToValueAtTime(endHz,at+duration);
 gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.001,vol*.45),at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);gain.connect(master);osc.start(at);osc.stop(at+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect()};
 }return true}catch{return false}
}

let clip=null,clipSession=null,loading=null,checkedAt=0,clipStatus='not-loaded';
let source=null,musicGain=null,fallbackTimer=null,endTimer=null,until=0,run=0;
export const VICTORY_DURATION=24000;
export const audioStatus=()=>({state:ctx?.state??'not-started',clip:clipStatus,enabled:soundEnabled()});
function ensureContext(){
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;
 if(!ctx){ctx=new Audio();master=ctx.createGain();master.gain.value=soundEnabled()?.16:0;master.connect(ctx.destination)}return ctx;
}
export function preloadVictory(code,token,{force=false}={}){
 if(!code||!token)return Promise.resolve('not-loaded');
 const key=code+':'+token;
 if(clipSession!==key){stopVictory();clipSession=key;clip=null;loading=null;checkedAt=0;clipStatus='not-loaded'}
 if(loading)return loading;
 if(!force&&checkedAt&&Date.now()-checkedAt<60000)return Promise.resolve(clipStatus);
 clipStatus='loading';
 const job=Promise.resolve().then(async()=>{
 try{const r=await fetch('/api/'+encodeURIComponent(code)+'/victory-audio',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
 if(clipSession!==key)return 'not-loaded';
 if(r.status===404){clip=null;return clipStatus='not-configured'}if(!r.ok)throw Error('HTTP '+r.status);
 const bytes=await r.arrayBuffer();if(bytes.byteLength>1048576)throw Error('Arquivo acima de 1 MiB');
 const ac=ensureContext();if(!ac)throw Error('Áudio indisponível');const decoded=await ac.decodeAudioData(bytes);
 if(clipSession!==key)return 'not-loaded';if(decoded.duration<1||decoded.duration>120)throw Error('Duração inválida');
 clip=decoded;return clipStatus='ready';
 }catch(e){if(clipSession===key){clipStatus='error: '+e.message;return clipStatus}return 'not-loaded'}
 }).finally(()=>{if(clipSession===key&&loading===job){loading=null;checkedAt=Date.now()}});
 loading=job;return job;
}
function clearPlayback(){clearInterval(fallbackTimer);fallbackTimer=null;if(source){try{source.stop()}catch{}try{source.disconnect()}catch{}source=null}if(musicGain){try{musicGain.disconnect()}catch{}musicGain=null}}
export function stopVictory(){run++;until=0;clearTimeout(endTimer);endTimer=null;clearPlayback()}
function startClip(ms){if(!clip||!ctx||ctx.state!=='running')return false;try{clearPlayback();source=ctx.createBufferSource();musicGain=ctx.createGain();musicGain.gain.value=.7;source.buffer=clip;source.loop=true;source.connect(musicGain);musicGain.connect(ctx.destination);source.start();source.stop(ctx.currentTime+ms/1000);return true}catch{clearPlayback();return false}}
function fallback(){if(fallbackTimer)return;playSound('victory');fallbackTimer=setInterval(()=>{if(Date.now()>=until||!soundEnabled()||document.hidden){stopVictory();return}playSound('victory')},1800)}
export function resumeVictory(){const remaining=until-Date.now();if(remaining<=0||!soundEnabled()||!ctx||ctx.state!=='running'||document.hidden)return false;if(source)return true;if(!startClip(remaining))fallback();return true}
export function playVictory(duration=VICTORY_DURATION,code,token){
 // Resolve a new session before starting a timed celebration.
 if(code&&token&&clipSession!==code+':'+token)void preloadVictory(code,token);
 stopVictory();if(!soundEnabled()||document.hidden)return false;until=Date.now()+duration;const id=run;endTimer=setTimeout(()=>{if(run===id)stopVictory()},duration);
 if(code&&token)preloadVictory(code,token,{force:true}).then(status=>{if(run!==id||until<=Date.now()||!soundEnabled()||document.hidden)return;if(status==='ready'&&ctx?.state==='running')startClip(until-Date.now())});
 return resumeVictory();
}
