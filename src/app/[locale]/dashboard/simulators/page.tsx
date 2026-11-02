'use client';

import ClientOnly from '@/components/ui/ClientOnly';
import { PageSkeleton } from '@/components/ui/kit';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Calculator, Home, RotateCcw, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  { id: 'compound', icon: Calculator },
  { id: 'loan', icon: Home },
  { id: 'patrimony', icon: TrendingUp },
] as const;
type Tab = (typeof TABS)[number]['id'];

const BLUE = 'var(--c2)';
const ORANGE = 'var(--c5)';
const MAX_YEARS = 80;

function Field({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <Input id={id} label={label} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/-/g, ''))} autoComplete="off" />
      {hint && <p className="text-xs text-subtle mt-1">{hint}</p>}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="flex justify-between gap-3"><span className="text-muted">{label}</span><span className="tabular-nums whitespace-nowrap" style={{ color: tone ?? 'var(--ink)' }}>{value}</span></div>;
}

function Panel({ children, onReset, summary }: { children: React.ReactNode; onReset: () => void; summary?: React.ReactNode }) {
  const t = useTranslations('simulators');
  return (
    <Card className="min-w-0 lg:order-2">
      <CardHeader><CardTitle>{t('settings')}</CardTitle></CardHeader>
      <div className="space-y-4">
        {children}
        {summary && <div className="pt-3 border-t border-line space-y-2 text-sm">{summary}</div>}
        <Button variant="outline" className="w-full" onClick={onReset}><RotateCcw size={14} className="me-2" />{t('reset')}</Button>
      </div>
    </Card>
  );
}


function Compound({ currency }: { currency: string }) {
  const t = useTranslations('simulators');
  const tc = useTranslations('charts');
  const yearsHint = (text: string) => (toNumber(text) > MAX_YEARS ? t('maxYears', { max: MAX_YEARS }) : undefined);
  const initial = { capital: '10000', monthly: '500', rate: '7', years: '25' };
  const [f, setF] = useState(initial);
  const data = simulateCompoundInterest(toNumber(f.capital), toNumber(f.monthly), toNumber(f.rate, 100), toNumber(f.years, MAX_YEARS));
  const last = data[data.length - 1];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
      <Panel onReset={() => setF(initial)} summary={<><Row label={t('compound.totalPaid')} value={formatCurrency(last.contributions, currency)} /><Row label={t('compound.earned')} value={formatCurrency(last.interest, currency)} tone="var(--pos)" /></>}>
        <Field id="ci-capital" label={t('compound.initial', { currency })} value={f.capital} onChange={(capital) => setF({ ...f, capital })} />
        <Field id="ci-monthly" label={t('compound.monthly', { currency })} value={f.monthly} onChange={(monthly) => setF({ ...f, monthly })} />
        <Field id="ci-rate" label={t('compound.rate')} value={f.rate} onChange={(rate) => setF({ ...f, rate })} />
        <Field id="ci-years" label={t('compound.years')} value={f.years} onChange={(years) => setF({ ...f, years })} hint={yearsHint(f.years)} />
      </Panel>
      <Card className="lg:col-span-3 min-w-0 lg:order-1">
        <CardHeader className="flex-wrap gap-2"><CardTitle>{t('compound.growth')}</CardTitle><div className="text-end"><p className="text-xs text-muted">{t('compound.final')}</p><p data-testid="ci-final" className="text-xl font-semibold tracking-tight tabular-nums text-ink">{formatCurrency(last.capital, currency)}</p></div></CardHeader>
        <ChartOrTable
          label={t('compound.label')}
          chart={
            <div>
              <div role="img" aria-label={t('compound.aria', { amount: formatCurrency(last.capital, currency) })}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} tickFormatter={(y) => tc('yearShort', { count: y })} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                    <Tooltip {...tooltipProps} labelFormatter={(y) => tc('yearLabel', { year: String(y) })} formatter={(v, n) => [formatCurrency(Number(v), currency), String(n)]} />
                    <Area type="monotone" dataKey="contributions" name={t('contributions')} stackId="1" stroke={BLUE} fill={BLUE} fillOpacity={0.3} strokeWidth={2} {...CHART_ANIM} />
                    <Area type="monotone" dataKey="interest" name={t('interest')} stackId="1" stroke={GOLD} fill={GOLD} fillOpacity={0.3} strokeWidth={2} {...CHART_ANIM} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Legend items={[{ name: t('contributions'), color: BLUE }, { name: t('interest'), color: GOLD }]} />
            </div>
          }
          table={<YearTable rows={data.map((d) => ({ key: d.year, cells: [`${d.year}`, formatCurrency(d.contributions, currency), formatCurrency(d.interest, currency), formatCurrency(d.capital, currency)] }))} head={[t('year'), t('contributions'), t('interest'), t('capital')]} />}
        />
      </Card>
    </div>
  );
}

function YearTable({ head, rows }: { head: string[]; rows: { key: number; cells: string[] }[] }) {
  return (
    <div className="max-h-[300px] overflow-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-subtle">{head.map((h, i) => <th key={h} className={`pb-2 font-medium ${i ? 'text-end' : 'text-start'}`}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.key} className="border-t border-line tabular-nums text-ink">{r.cells.map((c, i) => <td key={i} className={`py-2 whitespace-nowrap ${i ? 'text-end ps-3' : 'text-muted'}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Loan({ currency }: { currency: string }) {
  const t = useTranslations('simulators');
  const tc = useTranslations('charts');
  const yearsHint = (text: string) => (toNumber(text) > MAX_YEARS ? t('maxYears', { max: MAX_YEARS }) : undefined);
  const initial = { amount: '250000', rate: toField(3.5), years: '20' };
  const [f, setF] = useState(initial);
  const r = simulateLoan(toNumber(f.amount), toNumber(f.rate, 100), toNumber(f.years, MAX_YEARS));
  const data = r.amortization.map((a) => ({ ...a, year: a.month / 12 }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
      <Panel onReset={() => setF(initial)} summary={<><Row label={t('loan.payment')} value={formatCurrency(r.monthlyPayment, currency)} /><Row label={t('loan.totalCost')} value={formatCurrency(r.totalCost, currency)} /><Row label={t('loan.totalInterest')} value={formatCurrency(r.totalInterest, currency)} tone="var(--neg)" /></>}>
        <Field id="loan-amount" label={t('loan.amount', { currency })} value={f.amount} onChange={(amount) => setF({ ...f, amount })} />
        <Field id="loan-rate" label={t('loan.rate')} value={f.rate} onChange={(rate) => setF({ ...f, rate })} />
        <Field id="loan-years" label={t('loan.years')} value={f.years} onChange={(years) => setF({ ...f, years })} hint={yearsHint(f.years)} />
      </Panel>
      <Card className="lg:col-span-3 min-w-0 lg:order-1">
        <CardHeader className="flex-wrap gap-2"><CardTitle>{t('loan.byYear')}</CardTitle><div className="text-end"><p className="text-xs text-muted">{t('loan.payment')}</p><p data-testid="loan-monthly" className="text-xl font-semibold tracking-tight tabular-nums text-ink">{t('loan.perMonth', { amount: formatCurrency(r.monthlyPayment, currency) })}</p></div></CardHeader>
        {data.length === 0 ? <p className="text-sm text-muted py-16 text-center">{t('loan.empty')}</p> : (
          <ChartOrTable
            label={t('loan.label')}
            chart={
              <div>
                <div role="img" aria-label={t('loan.aria', { payment: formatCurrency(r.monthlyPayment, currency), interest: formatCurrency(r.totalInterest, currency) })}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid vertical={false} stroke={gridStroke} />
                      <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} minTickGap={16} tickFormatter={(y) => tc('yearShort', { count: y })} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                      <Tooltip {...tooltipProps} labelFormatter={(y) => tc('yearLabel', { year: String(y) })} formatter={(v, n) => [formatCurrency(Number(v), currency), String(n)]} />
                      <Bar dataKey="principal" name={t('capital')} stackId="a" fill={GOLD} maxBarSize={22} {...CHART_ANIM} />
                      <Bar dataKey="interest" name={t('interest')} stackId="a" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={22} {...CHART_ANIM} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Legend items={[{ name: t('capital'), color: GOLD }, { name: t('interest'), color: ORANGE }]} />
              </div>
            }
            table={<YearTable head={[t('year'), t('capital'), t('interest'), t('loan.remaining')]} rows={data.map((d) => ({ key: d.year, cells: [`${d.year}`, formatCurrency(d.principal, currency), formatCurrency(d.interest, currency), formatCurrency(d.remaining, currency)] }))} />}
          />
        )}
      </Card>
    </div>
  );
}

function Patrimony({ currency, netWorth }: { currency: string; netWorth: number | undefined }) {
  const t = useTranslations('simulators');
  const tc = useTranslations('charts');
  const yearsHint = (text: string) => (toNumber(text) > MAX_YEARS ? t('maxYears', { max: MAX_YEARS }) : undefined);
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
        <Field id="pat-capital" label={t('patrimony.start', { currency })} value={f.capital} onChange={(capital) => set({ capital })} />
        <Field id="pat-monthly" label={t('patrimony.monthly', { currency })} value={f.monthly} onChange={(monthly) => set({ monthly })} />
        <Field id="pat-rate" label={t('patrimony.rate')} value={f.rate} onChange={(rate) => set({ rate })} />
        <Field id="pat-years" label={t('patrimony.years')} value={f.years} onChange={(years) => set({ years })} hint={yearsHint(f.years)} />
      </Panel>
      <Card className="lg:col-span-3 min-w-0 lg:order-1">
        <CardHeader className="flex-wrap gap-2"><CardTitle>{t('patrimony.title')}</CardTitle><div className="text-end"><p className="text-xs text-muted">{tc('inYears', { count: last.year })}</p><p data-testid="pat-final" className="text-xl font-semibold tracking-tight tabular-nums text-ink">{formatCurrency(last.capital, currency)}</p></div></CardHeader>
        <ChartOrTable
          label={t('patrimony.label')}
          chart={
            <div role="img" aria-label={t('patrimony.aria', { amount: formatCurrency(last.capital, currency), count: last.year })}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} tickFormatter={(y) => tc('yearShort', { count: y })} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                  <Tooltip {...tooltipProps} labelFormatter={(y) => tc('yearLabel', { year: String(y) })} formatter={(v) => [formatCurrency(Number(v), currency), t('patrimony.wealth')]} />
                  <Area type="monotone" dataKey="capital" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={2} {...CHART_ANIM} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          }
          table={<YearTable head={[t('year'), t('patrimony.wealth')]} rows={data.map((d) => ({ key: d.year, cells: [`${d.year}`, formatCurrency(d.capital, currency)] }))} />}
        />
      </Card>
    </div>
  );
}

function SimulatorsPageContent() {
  const t = useTranslations('simulators');
  const [tab, setTab] = useState<Tab>('compound');
  const summary = useSummary();
  const currency = summary.data?.currency ?? 'EUR';

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TABS.findIndex((item) => item.id === tab);
    // The tabs run right to left in Arabic, and so do the arrows.
    const forward = (e.key === 'ArrowRight') === (document.documentElement.dir !== 'rtl');
    const next = TABS[(i + (forward ? 1 : TABS.length - 1)) % TABS.length];
    setTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <div role="tablist" aria-label={t('title')} onKeyDown={onKey} className="flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 px-4 min-h-11 shrink-0 rounded-[10px] text-sm font-medium whitespace-nowrap transition-colors ${tab === item.id ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink bg-surface'}`}
          >
            <item.icon size={16} />{t(`tab.${item.id}`)}
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

export default function SimulatorsPage() {
  return <ClientOnly fallback={<PageSkeleton />}><SimulatorsPageContent /></ClientOnly>;
}
