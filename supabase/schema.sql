-- Esquema inicial do banco (Postgres / Supabase), a partir de docs/modelo-de-dados.md.
-- No Supabase: SQL Editor › colar e rodar. Os dados de exemplo estão em src/lib/dados-exemplo.ts.

create type selo as enum ('nenhum', 'novo', 'mais_vendido');
create type onde_aparece as enum ('ano_todo', 'so_campanhas');
create type tipo_campanha as enum (
  'natal', 'pascoa', 'dia_das_maes', 'dia_dos_namorados', 'dia_do_chocolate', 'dia_dos_pais', 'outra'
);

create table categorias (
  id text primary key,
  nome text not null,
  ordem int not null default 0
);

create table doces (
  id text primary key, -- também é o endereço da página: /doce/<id>
  categoria_id text not null references categorias (id),
  nome text not null,
  descricao text not null default '',
  preco_centavos int not null check (preco_centavos >= 0),
  unidade text not null default 'por unidade',
  contem_gluten boolean not null default true,
  contem_lactose boolean not null default true,
  composicao text not null default '',
  conservacao text not null default '',
  selo selo not null default 'nenhum',
  sob_encomenda boolean not null default false,
  prazo_dias int check (prazo_dias > 0),
  onde_aparece onde_aparece not null default 'ano_todo',
  destaque boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (not sob_encomenda or prazo_dias is not null)
);

-- Só um doce em destaque por vez.
create unique index doces_um_destaque on doces (destaque) where destaque;

create table sabores (
  id uuid primary key default gen_random_uuid(),
  doce_id text not null references doces (id) on delete cascade,
  nome text not null,
  preco_centavos int check (preco_centavos >= 0), -- vazio = preço do doce
  ordem int not null default 0
);

create table fotos (
  id uuid primary key default gen_random_uuid(),
  doce_id text not null references doces (id) on delete cascade,
  caminho text not null, -- arquivo no Storage (bucket "fotos-doces")
  ordem int not null default 0 -- a de menor ordem é a principal
);

-- Quantidade de cada doce por dia. Guarda o histórico da produção.
create table estoque_dia (
  doce_id text not null references doces (id) on delete cascade,
  data date not null default current_date,
  quantidade int not null default 0 check (quantidade >= 0),
  primary key (doce_id, data)
);

create table campanhas (
  id text primary key,
  tipo tipo_campanha not null,
  nome text not null,
  inicio date not null,
  fim date not null,
  limite_encomenda date,
  frase_banner text not null default '',
  cor text not null default '#3A1D13',
  pausada boolean not null default false,
  rascunho boolean not null default false,
  check (fim >= inicio)
);

-- Um doce pode estar em várias campanhas.
create table campanha_doces (
  campanha_id text not null references campanhas (id) on delete cascade,
  doce_id text not null references doces (id) on delete cascade,
  primary key (campanha_id, doce_id)
);

-- Segurança: qualquer visitante lê o cardápio; só quem está logado (a dona e a
-- equipe) altera. No Supabase, desligue o cadastro público em Authentication.
do $$
declare
  tabela text;
begin
  foreach tabela in array array['categorias', 'doces', 'sabores', 'fotos', 'estoque_dia', 'campanhas', 'campanha_doces']
  loop
    execute format('alter table %I enable row level security', tabela);
    execute format('create policy "leitura publica" on %I for select using (true)', tabela);
    execute format('create policy "equipe altera" on %I for all to authenticated using (true) with check (true)', tabela);
  end loop;
end $$;
