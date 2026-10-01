create table if not exists public.resofit_personalized_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_key text not null,
  source_product text not null,
  plan_version text not null default 'canva-consolidated-v1',
  intake jsonb not null default '{}'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entitlement_key, source_product)
);
create index if not exists idx_resofit_personalized_plans_user on public.resofit_personalized_plans(user_id, updated_at desc);
alter table public.resofit_personalized_plans enable row level security;
drop policy if exists "personalized plans own select" on public.resofit_personalized_plans;
create policy "personalized plans own select" on public.resofit_personalized_plans for select to authenticated using (auth.uid() = user_id);
drop policy if exists "personalized plans own insert" on public.resofit_personalized_plans;
create policy "personalized plans own insert" on public.resofit_personalized_plans for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "personalized plans own update" on public.resofit_personalized_plans;
create policy "personalized plans own update" on public.resofit_personalized_plans for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create or replace function private.resolve_resofit_entitlements()
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare r record; v_new_status text; v_new_access text; v_grace_end timestamptz; v_action_url text; v_count integer := 0;
begin
  for r in
    select s.*, c.grace_days, c.trial_days, c.paid_term_days, p.handle
    from public.resofit_entitlement_states s
    join public.resofit_entitlement_product_config c on c.product_sku = s.source_product
    left join public.products p on p.sku = s.source_product
    where (s.status = 'TRIAL' and s.end_at is not null and s.end_at <= now())
       or (s.status = 'ACTIVE' and s.end_at is not null and s.end_at <= now())
       or (s.status = 'GRACE' and s.grace_end_at is not null and s.grace_end_at <= now())
  loop
    v_new_status := r.status; v_new_access := r.access; v_grace_end := r.grace_end_at;
    v_action_url := case when r.handle is not null then 'https://resofit.fit/product/' || r.handle else null end;
    if r.status = 'TRIAL' then
      if coalesce(r.grace_days,0) > 0 then v_new_status := 'GRACE'; v_new_access := 'active'; v_grace_end := r.end_at + make_interval(days => r.grace_days);
      else v_new_status := 'EXPIRED'; v_new_access := 'inactive'; v_grace_end := null; end if;
    elsif r.status = 'ACTIVE' then
      if coalesce(r.grace_days,0) > 0 then v_new_status := 'GRACE'; v_new_access := 'active'; v_grace_end := r.end_at + make_interval(days => r.grace_days);
      else v_new_status := 'PAST_DUE'; v_new_access := 'restricted'; v_grace_end := null; end if;
    elsif r.status = 'GRACE' then v_new_status := 'PAST_DUE'; v_new_access := 'restricted'; v_grace_end := null; end if;
    update public.resofit_entitlement_states set status=v_new_status,access=v_new_access,grace_end_at=v_grace_end,commerce_action_url=v_action_url,updated_at=now() where id=r.id;
    insert into public.resofit_entitlement_events(entitlement_state_id,from_status,to_status,from_access,to_access,reason,source_reference,metadata)
    values(r.id,r.status,v_new_status,r.access,v_new_access,
      case when r.status='TRIAL' then 'trial_ended' when r.status='ACTIVE' then 'paid_term_ended' when r.status='GRACE' then 'grace_ended' else 'entitlement_reconciled' end,
      r.source_payment_reference,jsonb_build_object('resolved_at',now(),'source_product',r.source_product,'grace_days',coalesce(r.grace_days,0)));
    v_count := v_count + 1;
  end loop;
  return jsonb_build_object('ok',true,'updated',v_count,'resolved_at',now());
end; $$;
revoke all on function private.resolve_resofit_entitlements() from public, anon, authenticated;
select cron.schedule('resofit-entitlement-reconciliation','*/15 * * * *',$$select private.resolve_resofit_entitlements();$$)
where not exists (select 1 from cron.job where jobname='resofit-entitlement-reconciliation');