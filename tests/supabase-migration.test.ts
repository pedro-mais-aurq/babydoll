import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations')
const migrationFiles = readdirSync(migrationsDirectory).filter((file) => file.endsWith('.sql'))

function migrationSql(): string {
  expect(migrationFiles).toHaveLength(1)

  return readFileSync(join(migrationsDirectory, migrationFiles[0]), 'utf8')
}

function tableDefinition(sql: string, table: string): string {
  const definition = sql.match(new RegExp(`create table public\\.${table} \\(([\\s\\S]*?)\\n\\);`))

  expect(definition, `definição da tabela ${table}`).not.toBeNull()

  return definition?.[1] ?? ''
}

describe('migration inicial do acervo', () => {
  it('define somente as quatro tabelas de conteúdo com os campos esperados', () => {
    const sql = migrationSql()

    expect(tableDefinition(sql, 'images')).toContain('storage_path text not null')
    expect(tableDefinition(sql, 'images')).toContain('description text')

    const texts = tableDefinition(sql, 'texts')
    expect(texts).toContain('content text not null')
    expect(texts).toContain('author text not null')
    expect(texts).toContain('sent_at timestamptz not null')
    expect(texts).toContain('created_at timestamptz not null default now()')

    expect(tableDefinition(sql, 'videos')).toContain('storage_path text not null')
    expect(tableDefinition(sql, 'songs')).toContain('spotify_url text not null')

    expect(sql.match(/create table public\./g)).toHaveLength(4)
    expect(sql).not.toMatch(
      /\b(position_x|position_y|duration|animation|transition|scene|timeline|cinematic_id)\b/,
    )
  })

  it('habilita RLS e concede ao frontend apenas leitura anônima', () => {
    const sql = migrationSql()

    for (const table of ['images', 'texts', 'videos', 'songs']) {
      expect(sql).toContain(`alter table public.${table} enable row level security;`)
      expect(sql).toContain(`on public.${table}\nfor select\nto anon\nusing (true);`)
    }

    expect(sql).toContain('revoke all on table public.images, public.texts, public.videos, public.songs')
    expect(sql).toContain('grant select on table public.images, public.texts, public.videos, public.songs')
    expect(sql).not.toMatch(/grant\s+(insert|update|delete|all)\b[\s\S]*\bto anon\b/i)
  })
})
