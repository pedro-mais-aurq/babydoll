# Babydoll — spec vivo

Experiência cinematográfica íntima para duas pessoas (Pedro e Mabel), em português.

## Fluxo

`/` (Entry) → `/moments` (MomentsHub) → `/moments/:momentId` (CinematicStage + cinemática).
Cada destino é uma rota real (`frontend/src/App.tsx`, react-router-dom) — deep link e refresh funcionam.

- **Entry** (`src/app/interface/Entry`): pergunta "Qual é minha data de nascimento?".
  Resposta correta: **08/11/2009**. Qualquer outra resposta mostra "tem certeza, amor?".
- **MomentsHub** (`src/app/interface/MomentsHub`): coração de fotografias (7x6, `heartLayout.ts`);
  o zoom-out é controlado por scroll (CSS var `--reveal`). Ao chegar a 100% a lista de momentos
  aparece e as células de momento ficam clicáveis.
- **CinematicStage** (`src/app/interface/CinematicStage`): wrapper puramente estrutural
  (`width/min-height`), sem background/overflow/cor — cada cinemática é dona da própria aparência.

## Catálogo de momentos

`src/moments/moments.ts` é o único registro. Ordem = ordem narrativa.

| # | id | título visível | componente |
|---|---|---|---|
| 01 | `stars-collide` | **As estrelas colidem** | `cinematics/as-estrelas-colidem/AsEstrelasColidem.tsx` |
| 02 | `first-day-five` | **Quando nos entrelaçamos** | `cinematics/today/TodayCinematic.tsx` |
| 03 | `sete-de-dezembro` | **Sete de dezembro** | `cinematics/sete-de-dezembro/SeteDeDezembro.tsx` |

`Moment.cinematic` ainda aceita `null` e `isMomentReady()` decide se o momento abre — o mecanismo de
lembrança reservada continua disponível (célula com cadeado + rota "em breve"), mas nenhum momento
está reservado hoje.

`first-day-five` era exibido como "Nosso primeiro dia 5"; só o título mudou — id, cenas,
conteúdo e comportamento permanecem intactos. Sua resposta final é **"ida e volta"**.

## As estrelas colidem (como a amizade começou)

Duas fases, estado React local, nenhuma abstração global.

- **Fase A — aproximação:** a página tem 340vh; o progresso do scroll vira `--p` (e `data-progress`)
  no elemento raiz, e o CSS deriva `left`, `bottom`, `scale`, bob e tilt de Pedro. Em
  `prefers-reduced-motion` a aproximação já começa concluída.
- **Encontro:** `--p >= 0.995` → `data-phase="dialogue"`; wheel/touchmove/teclas de scroll passam a
  ser bloqueados, então scroll nunca avança fala.
- **Fase B — diálogo:** um clique/toque (ou Enter/Space) = um beat, com trava de 320ms contra
  duplo avanço. Beats em `content.ts`: Oi (Pedro) → Oi (Mabel) → **pausa** (estado próprio, sem
  texto na tela) → "Você gosta do Drummond?" → "Nem um pouco" → "Eu também não, aquele assediador
  filho da puta" → "jurooo" → outro.
- **Fala datilografada:** `useTypewriter` (local, dentro de `AsEstrelasColidem.tsx`) revela letra por
  letra a 34ms/caractere e emite um blip "tick" a cada 3 caracteres, então o som acompanha o ritmo do
  texto. Clique no meio da digitação **completa a fala** sem avançar o beat (padrão retrô); o clique
  seguinte avança. Em `prefers-reduced-motion` o texto aparece inteiro de uma vez.
- **Áudio:** `audio.ts`, Web Audio API crua com um único AudioContext compartilhado, retomado dentro
  do gesto do usuário. Blip de entrada: Pedro 300Hz / Mabel 420Hz, ~70ms, volume 0.05; blip "tick" da
  digitação é mais curto e mais baixo (0.022). A pausa não emite som; falha de áudio é silenciosa.
- **Ambiência do pátio:** `startPatioAmbience()` sintetiza ruído avermelhado filtrado (lowpass 820Hz +
  highpass 110Hz) com uma respiração lenta de 0.07Hz, entra em fade de 2.6s durante a aproximação e
  silencia em fade de 1.4s no encontro. Sem asset, sem controle na tela, sem loop de trilha.
- **Encerramento:** o clique depois de "jurooo" dispara fragmentos de conversa, fade do cenário e,
  isolada, a frase **"Assim nós viramos amigos"** (sem blip) antes de `onComplete`.
- **PNGs recortados:** Pedro e Mabel têm o corpo cortado pelo enquadramento do arquivo. A própria
  fotografia do pátio, ampliada e desfocada, forma o primeiro plano (`.foreground`) com copas de
  arbusto quebrando a linha do topo; os personagens afundam 24% da própria altura atrás dele em
  qualquer escala/viewport.

## Backend

Nenhuma rota de app foi adicionada: a experiência é inteira no frontend. O backend FastAPI segue
com o `/api/status` do template. Conteúdo remoto opcional via Supabase (`src/services/supabase`) —
sem `VITE_TODAY_IMAGE_*_ID` configurado, "Quando nos entrelaçamos" usa as imagens locais.

## Testes

`cd /app/frontend && yarn test` (vitest + jsdom): arquitetura, registro/ordem, conteúdo literal do
diálogo, aproximação por scroll, um beat por clique, pausa, bloqueio de scroll no diálogo, blips,
resiliência do áudio, base path de produção e — para a C3 — integridade da fonte canônica, posição
da fotografia sem timestamp, monotonia do reveal e peso do intervalo presencial.
E2E Playwright em `/app/tests/e2e`.

## Sete de dezembro (C3 — a conversa de 07/12/2025)

Hierarquia inviolável: **a experiência é cinematográfica, a conversa não.** Scroll, ritmo, silêncios
e plano de fundo são linguagem do Babydoll; a interface das mensagens é WhatsApp padrão (tema
escuro) e não é redesenhada — header com avatar e nome, chip de data, balões #202c33 (recebida) e
#005c4b (enviada) com rabinho na primeira de cada bloco, horário HH:MM, tique duplo nas enviadas,
balão de mídia e barra inferior do composer.

- **Fonte canônica** (`conversation.ts`): 200 mensagens literais + 1 fotografia. Nada inferido,
  nada reescrito. Pedro = enviada (direita), Mabel = recebida (esquerda). Contato: `Mabel 🌹`.
- **Fotografia canônica**: única mídia, posicionada entre `11:22:48 Já cheguei` e
  `21:10:10 Oiii meu amoorr`. **Sem timestamp** — o evento é `{ kind: "photo" }`, sem `time`, porque
  o horário real não foi estabelecido. Sem legenda, sem filtro, sem recorte: proporção original 3:4
  preservada dentro de um balão de mídia padrão (largura limitada a ~250px).
- **Ritmo** (`pacing.ts`): cada evento tem um peso derivado do intervalo real até o anterior, então
  rajadas passam rápido e silêncios custam scroll. O intervalo presencial (quase dez horas) recebe
  peso 58 antes e depois da fotografia — ~12% de todo o percurso em silêncio, com a foto surgindo no
  meio do caminho e mais passagem de tempo antes das 21:10. Scroll total: 1500vh.
- **Luz do dia** (`sky.ts`): o segundo do dia do último evento revelado define um gradiente em
  `soft-light` sobre o `plano-de-fundo.jpg` — manhã, meio-dia, dourado, anoitecer, noite. Durante o
  intervalo presencial o valor é interpolado pelo scroll, então a tarde inteira passa no céu sem
  nenhuma mensagem acontecer. É assim que a passagem de tempo é comunicada: sem texto, sem evento
  inventado.
- **Montagem**: as mensagens são ancoradas na borda de baixo (`position: absolute; bottom: 0`) e
  crescem para cima, com janela de 26 eventos montados. `overflow-x: clip` no root para não quebrar
  o `sticky` da cena.
- **Encerramento**: os últimos 5,5% do scroll apagam a cena e disparam `onComplete`. Nenhuma frase
  final foi inventada.
