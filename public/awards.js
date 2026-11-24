export const AWARDS={
 firstPix:['ABERTURA DE CAPITAL','💸','Primeiro Pix da partida.'],
 rich:['REI DO PIX','👑','Maior Pix individual enviado até o momento.'],
 poor:['ALERTA DE MISÉRIA','🚨','Saldo abaixo de 10% do inicial.'],
 falling:['LADEIRA ABAIXO','📉','Perdeu 80% do saldo inicial.'],
 comeback:['IMORTAL','🛡️','Saiu de menos de $ 1.000 e recuperou o saldo inicial.'],
 cheap:['MÃO DE VACA','🤏','Arrematou pelo lance inicial mínimo.'],
 reckless:['SEM FREIO','🔥','Pagou mais que o dobro do valor do imóvel.'],
 firstFail:['CPF CANCELADO','💀','Primeira falência.'],
 pix5:['VICIADO EM PIX','⚡','Enviou cinco Pix.'],
 pix15:['AGIOTA DO BEM','💰','Enviou quinze Pix.'],
 received5:['CREDOR VIP','🧲','Recebeu cinco Pix.'],
 bank5:['PATROCINADOR DO BANCO','🏦','Pagou o banco cinco vezes.'],
 sale3:['CORRETOR SEM ESCRÚPULOS','🏘️','Vendeu três imóveis em leilão.'],
 buy3:['IMPÉRIO IMOBILIÁRIO','🏙️','Comprou três imóveis em leilão.'],
 bigPix:['PIX DE RESPEITO','💎','Enviou um Pix de metade do saldo inicial ou mais.'],
 double:['LUCRO ABUSIVO','🌳','Dobrou o saldo inicial.'],
 triple:['MAGNATA DE MENTIRINHA','🎩','Triplicou o saldo inicial.'],
 zero:['LISO PREMIUM','🪙','Zerou o saldo sem falir.'],
 chaos:['AGENTE DO CAOS','🌪️','Maior número acumulado de operações financeiras.'],
 vault:['DONO DO COFRE','💰','Maior saldo atual entre jogadores não falidos, acima do inicial.'],
 hammer:['REI DO MARTELO','🔨','Maior pagamento total de uma arrematação.'],
 broker:['BARÃO DOS NEGÓCIOS','🏘️','Maior número de imóveis vendidos em leilão.'],
 boleto:['SÓCIO DO PREJUÍZO','🧾','Maior número de pagamentos ao banco.'],
 heavy:['MÃO PESADA','💸','Maior valor acumulado em pagamentos e transferências efetuadas.'],
 shark:['TUBARÃO DO MERCADO','🦈','Maior número de imóveis comprados em leilão.'],
 bankVIP:['AMIGO DO GERENTE','🏦','Maior valor recebido diretamente do banco.'],
 magnet:['ÍMÃ DE PIX','🧲','Maior valor acumulado em Pix recebidos de jogadores.'],
 contacts:['INFLUÊNCIA S.A.','🤝','Recebeu Pix de três jogadores diferentes.'],
 patron:['MECENAS','🥂','Enviou Pix para três jogadores diferentes.'],
 rescue:['RECUPERAÇÃO JUDICIAL','📈','Após cair abaixo de 10% do saldo inicial, recuperou pelo menos metade dele.'],
 crash:['ROMBO NO CAIXA','🚨','Uma única saída consumiu pelo menos metade do saldo anterior e 25% do saldo inicial.']
};
export const POOR_LINES=['O banco recomenda procurar emprego.','O cartão está respirando por aparelhos.','O próximo aluguel pode ser o último.','Do luxo ao lixo.','O gerente já bloqueou seu número.','O saldo virou saudade.','Até o peão está procurando trabalho.'];
export function combineHall(rooms){const map=new Map();let completed=0,record=null;for(const room of rooms){if(!room.ended||!room.hall)continue;completed++;for(const p of room.hall){const key=p.name.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');if(!key)continue;const r=map.get(key)||{name:p.name,games:0,wins:0,failures:0,firstFailures:0,peak:0,poorMs:0};r.games++;r.wins+=Number(!!p.won);r.failures+=Number(!!p.failed);r.firstFailures+=Number(!!p.firstFailed);r.peak=Math.max(r.peak,p.peak);r.poorMs+=p.poorMs||0;map.set(key,r);if(!record||p.peak>record.peak)record={name:p.name,peak:p.peak,code:room.code}}}const rows=[...map.values()];const poorest=[...rows].filter(p=>p.poorMs>0).sort((a,b)=>b.poorMs-a.poorMs)[0]||null;return {completed,record,poorest,fame:rows.filter(p=>p.wins).sort((a,b)=>b.wins-a.wins||b.peak-a.peak),shame:rows.filter(p=>p.failures).sort((a,b)=>b.failures-a.failures||b.firstFailures-a.firstFailures)}}

export const TITLE_KEYS=Object.freeze(['rich','chaos','vault','hammer','broker','boleto','heavy','shark','bankVIP','magnet']);
export const awardType=key=>TITLE_KEYS.includes(key)?'title':['poor','rescue','crash'].includes(key)?'status':'personal';
export const titleValue=t=>['rich','vault','hammer','heavy','bankVIP','magnet'].includes(t.key)?'$ '+Number(t.value).toLocaleString('pt-BR'):t.value+' '+({chaos:'operações',broker:'vendas',boleto:'pagamentos',shark:'compras'}[t.key]||'');

export const ALERT_LINES=Object.freeze({
 poor:POOR_LINES,
 rescue:['O conselho de credores suspendeu o velório.','A recuperação judicial deu lucro. Inacreditável.','O gerente desbloqueou seu número.','O cartão saiu da UTI.'],
 crash:['O patrimônio pediu demissão.','O contador acabou de pedir férias.','O caixa tomou uma decisão questionável.','A diretoria exige explicações.']
});
// Um destaque extra por operação: os outros eventos permanecem no histórico.
export function featuredAward(events,active=()=>true){
 const e=(events||[]).filter(a=>AWARDS[a.key]&&active(a));
 return e.find(a=>a.key==='poor')||e.find(a=>a.key==='rescue')||e.find(a=>a.key==='crash')||e.find(a=>a.type==='title'&&a.key==='rich')||e.find(a=>a.type==='personal'&&!['falling','firstPix','firstFail'].includes(a.key))||e.find(a=>a.type==='title'&&a.previous)||e.find(a=>a.type==='personal'&&a.key!=='firstFail')||null;
}
