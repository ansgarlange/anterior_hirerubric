import { supabase } from './supabase';

function toRow(c) {
  return {
    id: c.id,
    name: c.name,
    function_id: c.functionId,
    visible: c.visible ?? true,
    scores: c.scores ?? {},
    notes: c.notes ?? {},
    created_by: c.createdBy ?? null,
    created_at: c.createdAt ?? new Date().toISOString(),
  };
}

function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    functionId: row.function_id,
    visible: row.visible,
    scores: row.scores ?? {},
    notes: row.notes ?? {},
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
  };
}

export async function loadState() {
  const [{ data: config }, { data: rows, error }] = await Promise.all([
    supabase.from('rubric_config').select('functions').eq('id', 'global').maybeSingle(),
    supabase.from('candidates').select('*').order('created_at'),
  ]);
  if (error) console.error('loadState candidates error:', error);
  return {
    functions: config?.functions ?? null,
    candidates: (rows ?? []).map(fromRow),
  };
}

export async function saveConfig(functions) {
  const { error } = await supabase.from('rubric_config').upsert({
    id: 'global',
    functions,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('saveConfig error:', error);
}

export async function insertCandidate(candidate) {
  const { error } = await supabase.from('candidates').insert(toRow(candidate));
  if (error) console.error('insertCandidate error:', error);
}

export async function upsertCandidate(candidate) {
  const { error } = await supabase.from('candidates').upsert(toRow(candidate));
  if (error) console.error('upsertCandidate error:', error);
}

export async function removeCandidate(id) {
  const { error } = await supabase.from('candidates').delete().eq('id', id);
  if (error) console.error('removeCandidate error:', error);
}
