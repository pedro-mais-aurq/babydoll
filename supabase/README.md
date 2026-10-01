# Acervo Babydoll

`migrations/` é a única fonte versionada do schema. A migration inicial reproduz
as quatro tabelas do SQL anterior, com os mesmos tipos, nulabilidade e defaults,
em acordo com `src/services/supabase/types.ts`. Não contém dados, políticas ou grants.

## Reprodução

Em um banco PostgreSQL vazio, execute a migration SQL com `psql`, usando
`-v ON_ERROR_STOP=1 -f supabase/migrations/20261001013842_babydoll_content.sql`.
Com o ambiente local Supabase já inicializado, use `supabase migration up`.
O repositório ainda não contém `supabase/config.toml` nem configuração de um
projeto remoto; provisionar esse ambiente não faz parte desta rodada.

## RLS e acesso

O projeto não define um modelo de autorização suficiente para determinar RLS,
policies ou grants. Se já existirem controles no projeto remoto, eles devem ser
exportados e versionados em uma migration própria. Esses controles estão fora do escopo desta migration de
estrutura e precisam ser definidos antes de expor o acervo pela API em produção.
A migration não habilita RLS nem concede acesso e não declara o banco pronto
para exposição pública. Permissões padrão do ambiente continuam valendo.

`CREATE TABLE IF NOT EXISTS` foi preservado do SQL original. Em bancos existentes,
isso não valida nem reconcilia estruturas divergentes: confira o schema e o
histórico de migrations antes de adotar esta migration nesses ambientes.
