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
Saldo padrão $25.000; atalhos $500, $1.000, $2.000. Peão e cartão ficam imutáveis na entrada. Leilão opcional: 20s de preparação, 5s para o primeiro lance, mínimo inicial de 20% arredondado para cima, próximos lances acima do líder em pelo menos $1. Cada lance reinicia o relógio em 5s. Um leilão por sala; banco ou vendedor jogador, que não pode comprar a própria propriedade. Valor do líder reservado; encerramento automático por Durable Object Alarm, sem depender de navegador. Sem lance, sem venda. O título físico deve ser entregue manualmente; o aplicativo apenas movimenta dinheiro. Não altera saldos existentes. Web Push depende da entrega do provedor.
