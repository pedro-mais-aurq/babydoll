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
- **Áudio:** `retroBlip.ts`, Web Audio API crua, criada dentro do gesto do usuário. Pedro 300Hz,
  Mabel 420Hz, ~70ms, volume 0.05. A pausa não emite som; falha de áudio é silenciosa.
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
