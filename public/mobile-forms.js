export function formatMoneyEdit(value,caret){
 const raw=String(value),digits=raw.replace(/\D/g,'').slice(0,12),before=raw.slice(0,Math.max(0,caret??raw.length)).replace(/\D/g,'').length;
 const text=digits?Number(digits).toLocaleString('pt-BR'):'';
 let pos=0,remaining=Math.max(0,Math.min(before,digits.length)-(digits.length-text.replace(/\D/g,'').length));
 while(pos<text.length&&remaining>0){if(/\d/.test(text[pos]))remaining--;pos++}
 return {text,caret:pos};
}
export function visibleFrame(height,top=0,layoutHeight=height){
 const h=Math.max(0,Math.round(height||layoutHeight)),y=Math.max(0,Math.round(top||0));
 return {height:h,top:y,bottom:Math.max(0,Math.round(layoutHeight-h-y))};
}
export function nextBidInput(current,minimum,editing,newAuction){
 return newAuction||!editing?String(minimum):String(current);
}
export function isPhoneLandscape(width,height,touch){
 return !!touch&&width>height&&Math.min(width,height)<600;
}
