'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Calculator, Home, RotateCcw, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/kit';
import { CHART_ANIM, ChartOrTable, GOLD, Legend, axisTick, gridStroke, tooltipProps } from '@/components/charts/kit';
import { toField, toNumber } from '@/components/forms/numbers';
import { useSummary } from '@/hooks/data';
import { simulateCompoundInterest, simulateLoan } from '@/lib/simulation';
import { formatCompact, formatCurrency } from '@/lib/utils';

const TABS = [
  { id: 'compound', label: 'Intérêts composés', icon: Calculator },
  { id: 'loan', label: 'Prêt immobilier', icon: Home },
  { id: 'patrimony', label: 'Projection du patrimoine', icon: TrendingUp },
] as const;
type Tab = (typeof TABS)[number]['id'];

const BLUE = '#5b86f0';
const ORANGE = '#d95f20';
const MAX_YEARS = 80;

function Field({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <Input id={id} label={label} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/-/g, ''))} autoComplete="off" />
      {hint && <p className="text-xs text-[#8e8e98] mt-1">{hint}</p>}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="flex justify-between gap-3"><span className="text-[#a0a0a6]">{label}</span><span className="tabular-nums whitespace-nowrap" style={{ color: tone ?? '#f5f5f5' }}>{value}</span></div>;
}

function Panel({ children, onReset, summary }: { children: React.ReactNode; onReset: () => void; summary?: React.ReactNode }) {
  return (
    <Card className="min-w-0 lg:order-2">
      <CardHeader><CardTitle>Paramètres</CardTitle></CardHeader>
      <div className="space-y-4">
        {children}
        {summary && <div className="pt-3 border-t border-white/[0.05] space-y-2 text-sm">{summary}</div>}
        <Button variant="outline" className="w-full" onClick={onReset}><RotateCcw size={14} className="mr-2" />Réinitialiser</Button>
      </div>
    </Card>
  );
}

const yearsHint = (text: string) => (toNumber(text) > MAX_YEARS ? `Durée limitée à ${MAX_YEARS} ans.` : undefined);

function Compound({ currency }: { currency: string }) {
  const initial = { capital: '10000', monthly: '500', rate: '7', years: '25' };
  const [f, setF] = useState(initial);
  const data = simulateCompoundInterest(toNumber(f.capital), toNumber(f.monthly), toNumber(f.rate, 100), toNumber(f.years, MAX_YEARS));
  const last = data[data.length - 1];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
      <Panel onReset={() => setF(initial)} summary={<><Row label="Total versé" value={formatCurrency(last.contributions, currency)} /><Row label="Intérêts gagnés" value={formatCurrency(last.interest, currency)} tone="#34d399" /></>}>
        <Field id="ci-capital" label={`Capital initial (${currency})`} value={f.capital} onChange={(capital) => setF({ ...f, capital })} />
        <Field id="ci-monthly" label={`Versement mensuel (${currency})`} value={f.monthly} onChange={(monthly) => setF({ ...f, monthly })} />
        <Field id="ci-rate" label="Taux annuel (%)" value={f.rate} onChange={(rate) => setF({ ...f, rate })} />
        <Field id="ci-years" label="Durée (années)" value={f.years} onChange={(years) => setF({ ...f, years })} hint={yearsHint(f.years)} />
      </Panel>
      <Card className="lg:col-span-3 min-w-0 lg:order-1">
        <CardHeader className="flex-wrap gap-2"><CardTitle>Croissance du capital</CardTitle><div className="text-right"><p className="text-xs text-[#a0a0a6]">Capital final</p><p data-testid="ci-final" className="text-xl font-bold tabular-nums text-[#f5f5f5]">{formatCurrency(last.capital, currency)}</p></div></CardHeader>
        <ChartOrTable
          label="intérêts composés"
          chart={
            <div>
              <div role="img" aria-label={`Capital final de ${formatCurrency(last.capital, currency)}`}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} tickFormatter={(y) => `${y} a`} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                    <Tooltip {...tooltipProps} labelFormatter={(y) => `Année ${y}`} formatter={(v, n) => [formatCurrency(Number(v), currency), String(n)]} />
                    <Area type="monotone" dataKey="contributions" name="Versements" stackId="1" stroke={BLUE} fill={BLUE} fillOpacity={0.3} strokeWidth={2} {...CHART_ANIM} />
                    <Area type="monotone" dataKey="interest" name="Intérêts" stackId="1" stroke={GOLD} fill={GOLD} fillOpacity={0.3} strokeWidth={2} {...CHART_ANIM} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Legend items={[{ name: 'Versements', color: BLUE }, { name: 'Intérêts', color: GOLD }]} />
            </div>
          }
          table={<YearTable rows={data.map((d) => ({ key: d.year, cells: [`${d.year}`, formatCurrency(d.contributions, currency), formatCurrency(d.interest, currency), formatCurrency(d.capital, currency)] }))} head={['Année', 'Versements', 'Intérêts', 'Capital']} />}
        />
      </Card>
    </div>
  );
}

function YearTable({ head, rows }: { head: string[]; rows: { key: number; cells: string[] }[] }) {
  return (
    <div className="max-h-[300px] overflow-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-[#8e8e98]">{head.map((h, i) => <th key={h} className={`pb-2 font-medium ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.key} className="border-t border-white/[0.05] tabular-nums text-[#f5f5f5]">{r.cells.map((c, i) => <td key={i} className={`py-2 whitespace-nowrap ${i ? 'text-right pl-3' : 'text-[#a0a0a6]'}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Loan({ currency }: { currency: string }) {
  const initial = { amount: '250000', rate: '3,5', years: '20' };
  const [f, setF] = useState(initial);
  const r = simulateLoan(toNumber(f.amount), toNumber(f.rate, 100), toNumber(f.years, MAX_YEARS));
  const data = r.amortization.map((a) => ({ ...a, year: a.month / 12 }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
      <Panel onReset={() => setF(initial)} summary={<><Row label="Mensualité" value={formatCurrency(r.monthlyPayment, currency)} /><Row label="Coût total" value={formatCurrency(r.totalCost, currency)} /><Row label="Total des intérêts" value={formatCurrency(r.totalInterest, currency)} tone="#f87171" /></>}>
        <Field id="loan-amount" label={`Montant emprunté (${currency})`} value={f.amount} onChange={(amount) => setF({ ...f, amount })} />
        <Field id="loan-rate" label="Taux annuel (%)" value={f.rate} onChange={(rate) => setF({ ...f, rate })} />
        <Field id="loan-years" label="Durée (années)" value={f.years} onChange={(years) => setF({ ...f, years })} hint={yearsHint(f.years)} />
      </Panel>
      <Card className="lg:col-span-3 min-w-0 lg:order-1">
        <CardHeader className="flex-wrap gap-2"><CardTitle>Remboursement par année</CardTitle><div className="text-right"><p className="text-xs text-[#a0a0a6]">Mensualité</p><p data-testid="loan-monthly" className="text-xl font-bold tabular-nums text-[#f5f5f5]">{formatCurrency(r.monthlyPayment, currency)}/mois</p></div></CardHeader>
        {data.length === 0 ? <p className="text-sm text-[#a0a0a6] py-16 text-center">Indiquez un montant et une durée pour voir le remboursement.</p> : (
          <ChartOrTable
            label="remboursement du prêt"
            chart={
              <div>
                <div role="img" aria-label={`Mensualité de ${formatCurrency(r.monthlyPayment, currency)}, ${formatCurrency(r.totalInterest, currency)} d'intérêts au total`}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid vertical={false} stroke={gridStroke} />
                      <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} minTickGap={16} tickFormatter={(y) => `${y} a`} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                      <Tooltip {...tooltipProps} labelFormatter={(y) => `Année ${y}`} formatter={(v, n) => [formatCurrency(Number(v), currency), String(n)]} />
                      <Bar dataKey="principal" name="Capital" stackId="a" fill={GOLD} maxBarSize={22} {...CHART_ANIM} />
                      <Bar dataKey="interest" name="Intérêts" stackId="a" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={22} {...CHART_ANIM} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Legend items={[{ name: 'Capital', color: GOLD }, { name: 'Intérêts', color: ORANGE }]} />
              </div>
            }
            table={<YearTable head={['Année', 'Capital', 'Intérêts', 'Restant dû']} rows={data.map((d) => ({ key: d.year, cells: [`${d.year}`, formatCurrency(d.principal, currency), formatCurrency(d.interest, currency), formatCurrency(d.remaining, currency)] }))} />}
          />
        )}
      </Card>
    </div>
  );
}

function Patrimony({ currency, netWorth }: { currency: string; netWorth: number | undefined }) {
  const start = () => ({ capital: netWorth === undefined ? '0' : toField(Math.max(0, Math.round(netWorth))), monthly: '500', rate: '5', years: '30' });
  const [f, setF] = useState(start);
  const touched = useRef(false);
  // The net worth arrives after first paint: fill it in unless the user already typed.
  useEffect(() => {
    if (!touched.current && netWorth !== undefined) setF((x) => ({ ...x, capital: toField(Math.max(0, Math.round(netWorth))) }));
  }, [netWorth]);
  const set = (patch: Partial<typeof f>) => { touched.current = true; setF({ ...f, ...patch }); };
  const data = simulateCompoundInterest(toNumber(f.capital), toNumber(f.monthly), toNumber(f.rate, 100), toNumber(f.years, MAX_YEARS));
  const last = data[data.length - 1];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
      <Panel onReset={() => { touched.current = false; setF(start()); }}>
        <Field id="pat-capital" label={`Patrimoine de départ (${currency})`} value={f.capital} onChange={(capital) => set({ capital })} />
        <Field id="pat-monthly" label={`Épargne mensuelle (${currency})`} value={f.monthly} onChange={(monthly) => set({ monthly })} />
        <Field id="pat-rate" label="Rendement annuel (%)" value={f.rate} onChange={(rate) => set({ rate })} />
        <Field id="pat-years" label="Horizon (années)" value={f.years} onChange={(years) => set({ years })} hint={yearsHint(f.years)} />
      </Panel>
      <Card className="lg:col-span-3 min-w-0 lg:order-1">
        <CardHeader className="flex-wrap gap-2"><CardTitle>Projection du patrimoine</CardTitle><div className="text-right"><p className="text-xs text-[#a0a0a6]">Dans {last.year} ans</p><p data-testid="pat-final" className="text-xl font-bold tabular-nums text-[#f5f5f5]">{formatCurrency(last.capital, currency)}</p></div></CardHeader>
        <ChartOrTable
          label="projection du patrimoine"
          chart={
            <div role="img" aria-label={`Patrimoine projeté de ${formatCurrency(last.capital, currency)} dans ${last.year} ans`}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} tickFormatter={(y) => `${y} a`} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                  <Tooltip {...tooltipProps} labelFormatter={(y) => `Année ${y}`} formatter={(v) => [formatCurrency(Number(v), currency), 'Patrimoine']} />
                  <Area type="monotone" dataKey="capital" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={2} {...CHART_ANIM} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          }
          table={<YearTable head={['Année', 'Patrimoine']} rows={data.map((d) => ({ key: d.year, cells: [`${d.year}`, formatCurrency(d.capital, currency)] }))} />}
        />
      </Card>
    </div>
  );
}

export default function SimulatorsPage() {
  const [tab, setTab] = useState<Tab>('compound');
  const summary = useSummary();
  const currency = summary.data?.currency ?? 'EUR';

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TABS.findIndex((t) => t.id === tab);
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    setTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Simulateurs" subtitle="Testez vos hypothèses : rien n'est enregistré sur vos comptes" />
      <div role="tablist" aria-label="Simulateurs" onKeyDown={onKey} className="flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 min-h-11 shrink-0 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${tab === t.id ? 'bg-[#f4be7e]/15 text-[#f4be7e] border-[#f4be7e]/25' : 'text-[#a0a0a6] hover:text-[#f5f5f5] bg-white/[0.04] border-white/[0.06]'}`}
          >
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'compound' && <Compound currency={currency} />}
        {tab === 'loan' && <Loan currency={currency} />}
        {tab === 'patrimony' && <Patrimony currency={currency} netWorth={summary.data?.netWorth} />}
      </div>
    </div>
  );
}
