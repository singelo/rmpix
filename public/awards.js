export const AWARDS={
 firstPix:['PIX SEM VERGONHA','💸','Primeiro Pix da partida.'],
 rich:['REI DO PIX','👑','Liderou sozinho acima do saldo inicial.'],
 poor:['ALERTA DE MISÉRIA','🚨','Saldo abaixo de 10% do inicial.'],
 falling:['LADEIRA ABAIXO','📉','Perdeu 80% do saldo inicial.'],
 comeback:['IMORTAL','🛡️','Saiu de menos de $ 1.000 e recuperou o saldo inicial.'],
 cheap:['MÃO DE VACA','🤏','Arrematou pelo lance inicial mínimo.'],
 reckless:['SEM FREIO','🔥','Pagou mais que o dobro do valor do imóvel.'],
 firstFail:['CPF CANCELADO','💀','Primeira falência.'],
 pix5:['PIX COMPULSIVO','⚡','Enviou cinco Pix.'],
 pix15:['AGIOTA DO BEM','💰','Enviou quinze Pix.'],
 received5:['ÍMÃ DE DINHEIRO','🧲','Recebeu cinco Pix.'],
 bank5:['CLIENTE DO MÊS','🏦','Pagou o banco cinco vezes.'],
 sale3:['CORRETOR SAFADO','🏘️','Vendeu três imóveis em leilão.'],
 buy3:['DONO DA RUA','🏙️','Comprou três imóveis em leilão.'],
 bigPix:['PATRÃO DO PIX','💎','Enviou um Pix de metade do saldo inicial ou mais.'],
 double:['DINHEIRO DÁ EM ÁRVORE','🌳','Dobrou o saldo inicial.'],
 triple:['MAGNATA DE PLÁSTICO','🎩','Triplicou o saldo inicial.'],
 zero:['LISO PREMIUM','🪙','Zerou o saldo sem falir.'],
 chaos:['AGENTE DO CAOS','🌪️','Mais operações financeiras na partida encerrada.']
};
export const POOR_LINES=['O banco recomenda procurar emprego.','O cartão está respirando por aparelhos.','O próximo aluguel pode ser o último.','Do luxo ao lixo.','O gerente já bloqueou seu número.','O saldo virou saudade.','Até o peão está procurando trabalho.'];
export function combineHall(rooms){const map=new Map();let completed=0,record=null;for(const room of rooms){if(!room.ended||!room.hall)continue;completed++;for(const p of room.hall){const key=p.name.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');if(!key)continue;const r=map.get(key)||{name:p.name,games:0,wins:0,failures:0,firstFailures:0,peak:0};r.games++;r.wins+=Number(!!p.won);r.failures+=Number(!!p.failed);r.firstFailures+=Number(!!p.firstFailed);r.peak=Math.max(r.peak,p.peak);map.set(key,r);if(!record||p.peak>record.peak)record={name:p.name,peak:p.peak,code:room.code}}}const rows=[...map.values()];return {completed,record,fame:rows.filter(p=>p.wins).sort((a,b)=>b.wins-a.wins||b.peak-a.peak),shame:rows.filter(p=>p.failures).sort((a,b)=>b.failures-a.failures||b.firstFailures-a.firstFailures)}}
