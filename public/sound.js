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
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!ctx){ctx=new Audio();master=ctx.createGain();master.gain.value=.16;master.connect(ctx.destination)}if(ctx.state!=='running')return ctx.resume().catch(()=>{})}catch{}
}
export function setSound(on){initPreference();enabled=!!on;try{localStorage.setItem('rmpix-sound',enabled?'on':'off')}catch{}if(master&&ctx)master.gain.setValueAtTime(enabled?.16:0,ctx.currentTime);if(enabled)return unlockSound()}
export function playSound(name){
 if(!soundEnabled()||!ctx||ctx.state!=='running'||document.hidden||!CUES[name])return false;
 try{const start=ctx.currentTime+.008;for(const [hz,duration,offset,type,vol,endHz] of CUES[name]){
 const osc=ctx.createOscillator(),gain=ctx.createGain(),at=start+offset;osc.type=type;osc.frequency.setValueAtTime(hz,at);if(endHz)osc.frequency.exponentialRampToValueAtTime(endHz,at+duration);
 gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.001,vol*.45),at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);gain.connect(master);osc.start(at);osc.stop(at+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect()};
 }return true}catch{return false}
}
