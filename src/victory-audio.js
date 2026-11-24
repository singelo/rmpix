export const AUDIO_LIMIT=1024*1024;
export const CELEBRATION_MS=24000;
export function isMp3(bytes){return bytes.length>=4&&(bytes[0]===73&&bytes[1]===68&&bytes[2]===51||bytes[0]===255&&(bytes[1]&224)===224)}
export async function readAudio(req){const len=Number(req.headers.get('Content-Length'));if(len>AUDIO_LIMIT)return null;const reader=req.body?.getReader();if(!reader)return null;const parts=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>AUDIO_LIMIT){await reader.cancel();return null}parts.push(value)}}finally{reader.releaseLock()}const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.byteLength}return isMp3(bytes)?bytes:null}
