# RM PIX

Banco fictício para jogos de tabuleiro. HTML/CSS/JS, Workers, Durable Object SQLite por partida e WebSocket com hibernação. Sem dinheiro real.

## Rodar
Node.js 22+ e npm: `npm install`, `npm run check`, `npm run dev`. Abra a URL informada por Wrangler.

## Cloudflare
Workers & Pages → Create application → Workers → Import a repository → singelo/rmpix. Nome rmpix, branch main, raiz /, deploy command `npx wrangler deploy`. Plano Workers Free, SQLite Durable Objects. Não use Pages nem crie D1 separado. Alternativa CLI: `npx wrangler login` e `npm run deploy`. Use apenas a URL exibida pelo deploy.

## Teste em dois celulares
Crie partida com saldo 2500000, compartilhe o link, entre com segundo nome, transfira 150000, confira os dois saldos e extrato, teste pagamento/recebimento bancário, feche/reabra, declare falência e encerre pelo criador. Teste também internet interrompida e reenvio.

## Regras desta versão
Saldo inteiro em $, até 12 jogadores. Cada jogador pode pagar e receber do banco (todos veem as operações); o criador encerra. Ranking por saldo, não por imóveis. O código da sala permite ver o painel, token local permite movimentar a própria carteira. Não há cadastro. Limpar dados do navegador perde o acesso. Salas persistem no SQLite; sem expiração automática nesta versão. Notificações em tempo real e Web Push para Pix, falência e encerramento. Toque em Ativar notificações e autorize. No iOS 16.4+, instale pela opção Adicionar à Tela de Início do Safari antes de ativar. Chaves VAPID geradas por sala e guardadas em SQLite, sem configuração externa; a entrega depende do navegador e sistema. Teste com a PWA fechada em Android e iOS. Uma inscrição por jogador; trocar de sala exige nova ativação. Não há garantia de latência zero; testar em rede real antes do jogo.

## v0.3
Peões SVG e cartões com oito cores propostas (edições físicas podem variar). Recordes são marcos de saldo alcançados pela primeira vez, não patrimônio; o saldo inicial não dispara conquista. O botão Testar push mostra o código HTTP e motivo retornado pelo provedor sem alterar saldo. HTTP 2xx significa aceitação, não entrega confirmada no aparelho. Sem descrição nas operações e sem botão de compartilhar; entre com o código da sala.

## v0.4 — Leilão
Saldo padrão $25.000; atalhos $500, $1.000, $2.000. Peão e cartão ficam imutáveis na entrada. Leilão opcional: 20s de preparação, 5s para o primeiro lance, mínimo inicial de 20% arredondado para cima, cada lance seguinte soma pelo menos os mesmos 20% do preço original ao maior lance. Cada lance reinicia o relógio em 5s. Um leilão por sala; somente imóveis dos jogadores; quem abre é o vendedor e não pode comprar a própria propriedade. Valor do líder reservado; encerramento automático por Durable Object Alarm, sem depender de navegador. Sem lance, sem venda. O título físico deve ser entregue manualmente; o aplicativo apenas movimenta dinheiro. Não altera saldos existentes. Web Push depende da entrega do provedor.

## v0.4.1
Ícone de leilão em SVG padronizado. Push usa redirect manual, sem seguir redirecionamentos, compatível com Cloudflare Workers. Leilões antigos do banco ainda ativos são cancelados sem movimentação na próxima operação ou alarme; histórico preservado.

## v0.4.2
Novos leilões cobram preço original + lance vencedor, integralmente reservado. 20s de preparação e 8s para primeiro lance e cada novo lance válido. Leilões antigos em andamento mantêm o preço acordado; próximos lances válidos passam a usar 8s. Cartão rachado e peão com X na falência. Push confirmado pelo usuário na versão anterior.

## v0.5 — Administração e vitória
Salas novas BR001, BR002... sequenciais, sem reutilização. Código de sala é convite, não senha. Painel somente leitura em /admin, ícone de cadeado no cabeçalho; configure ADMIN_CODE como Secret do Worker (mínimo 12 caracteres, escolha uma senha forte e exclusiva). Não grave no GitHub. O código fica em memória do painel, não em URL ou localStorage. CLI alternativa: npx wrangler secret put ADMIN_CODE. Migração v2 cria Directory SQLite sem alterar Room. Catálogo automático para novas salas; antigas são indexadas quando acessadas ou consultadas pelo código original. Não é possível enumerar automaticamente as salas antigas sem seus códigos. O balanço contabiliza pagamentos efetivos, não imóveis físicos. Último jogador não falido em partida com pelo menos dois jogadores encerra a sala automaticamente e recebe Mestre Supremo; encerramento manual não concede título. Push coletivo e comemoração. Retorno do painel mantém a carteira local.

## v0.5.1 — Sons e celebrações
Efeitos originais sintetizados por Web Audio, sem arquivos externos: Pix, banco, leilão aberto, início dos lances, lance aceito, últimos três segundos, vendido, sem venda, falência, conquistas e vitória. Som local, após interação do usuário, com preferência persistente e botão de teste. Não há áudio personalizado de push com a PWA fechada; vale o som do sistema. Coroa no peão campeão, destaque dourado e confetes; respeita redução de movimento. Sem migração ou dependências novas.

## v0.5.2 — Trilha de vitória
No painel /admin, configure um trecho MP3 autorizado de até 1 MiB. O arquivo fica no SQLite do Directory, fora do GitHub, e é acessado por jogadores autenticados. Decodificação local, duração entre 1 e 120s; recomenda-se um trecho curto de 8–12s. Reabre-se a aplicação para atualizar a trilha em todos os dispositivos. Vitória dura 24s, áudio em loop e botão Voltar ao jogo interrompe a reprodução local. Sem arquivo, fanfarra original repetida. Respeita som desativado, modo silencioso e restrições de reprodução do navegador; não toca com aplicativo fechado. Não inclui gravações comerciais.

## v0.5.3 — Reprodução móvel
Carregamento independente da liberação de áudio; revalidação na vitória e ao voltar à aplicação; desbloqueio por toque; botão Testar música reproduz a trilha cadastrada por 8s, com status do arquivo e do contexto de áudio. Botão Tocar música se autoplay bloqueado. Ganho dedicado à música. Não exige recadastrar MP3. Modo silencioso e autoplay continuam sob controle do dispositivo.

## v0.5.4 — Polimento
Trilha já em reprodução não reinicia após a resposta de preload. Celebração de 44,3s (aprox. duas voltas do trecho de 22,15s), fade final, sem replay automático repetido ao reabrir a mesma carteira. Som coletivo para clientes ativos, push para inscritos; sistema operacional não permite reproduzir MP3 automaticamente em PWA fechada. Cabeçalho reduzido, controles de ativação e aviso apenas de reconexão. Falência com impacto sintetizado e animação de choque. MP3 permanece no armazenamento existente, não no GitHub.

## v0.5.5 — Cartões personalizados
Nome do titular, paródias curtas de cartões distribuídas por ID sem repetir na sala, ilustração SVG de prédios, casas e hotel com variações por cor, código da sala no canto inferior direito. Carteiras antigas recebem títulos estáveis; novos jogadores mantêm os seus durante toda a partida. Rachadura e selo de falência, coroa e contorno dourado do campeão preservados. Sem migração, arquivos externos ou alterações de saldo.

## v0.5.6 — Peão no cartão
Peão colorido junto ao nome do titular dentro do cartão; removida a apresentação duplicada acima da carteira e o subtítulo redundante. Peão preserva X na falência e coroa na vitória. Ajustes para nomes longos e telas estreitas; fundo cinza de falência também nas cores com gradiente específico. Sem alterações de regras ou armazenamento.

## v0.5.7 — Cartão sem ruído
Removido o status permanente de saldo atualizado e o fundo branco do peão. Peça do cartão com iluminação e gradiente próprios, preservando cor, X e coroa. Avisos somente quando relevantes: reserva de leilão, encerramento ou campeão. Falência continua sinalizada pelo carimbo e rachadura. Sem alterações de regras ou armazenamento.

## v0.5.8 — Acabamento do peão
Removidas as sombras externas do peão no cartão, inclusive nos estados falido e campeão. Gradiente, coroa e X preservados.

## v0.6 — Rivalidade
19 conquistas por extrato completo, uma vez por jogador; alerta de miséria abaixo de 10%, recuperação, Pix, leilões e falências. Um aviso extra destacado por atualização; selos na classificação. Saldo animado 380ms, últimos lances e aviso de oferta superada, retrospectiva e Hall da Fama/Vergonha no admin. Apelidos iguais agrupados sem identidade verificada; somente salas catalogadas encerradas. Estatísticas de dinheiro, não patrimônio físico. Sem migração ou dependências.

O Hall também calcula o tempo acumulado abaixo de 10% do saldo inicial em partidas encerradas, usando os horários registrados das transações. Falência encerra a contagem; tempo após falir não conta.

## v0.6.2 — Títulos em disputa
Seis títulos exclusivos e recalculados pelo extrato durante a partida: Rei do Pix (maior Pix enviado), Agente do Caos (operações acumuladas, envio ou recebimento), Dono do Cofre (saldo atual de sobrevivente acima do inicial), Rei do Martelo (maior arrematação total), Corretor Mor (mais vendas) e Rei do Boleto (mais pagamentos ao banco). Empate preserva titular; primeiro registro usa ordem das operações e prefere pagador em empate inicial. Recordes históricos podem permanecer com falidos, saldo atual não. Selos pessoais permanentes separados; miséria é status temporário e aviso uma vez por sala. Histórico de trocas reconstruído inclusive em salas antigas. Sem mudança de saldo, migração ou novas dependências.
