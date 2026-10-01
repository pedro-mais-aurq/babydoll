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
| 03 | `next-memory` | **A próxima lembrança** | — reservada (`cinematic: null`) |

`Moment.cinematic` aceita `null` e `isMomentReady()` decide se o momento abre. A célula reservada
aparece no coração dessaturada, com cadeado e "em breve", sem ser `<button>`; a lista do hub mostra
um `<span>` em vez de botão; e `/moments/next-memory` responde com uma tela "em breve" + link de
volta (rota válida, nada quebrado).

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
diálogo, aproximação por scroll, um beat por clique, pausa, bloqueio de scroll no diálogo, blips e
resiliência do áudio.
