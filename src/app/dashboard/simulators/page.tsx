'use client';

import { useState } from 'react';
import { Calculator, Home, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { simulateCompoundInterest, simulateLoan } from '@/lib/simulation';
import { formatCurrency } from '@/lib/utils';

type Tab = 'compound' | 'loan' | 'patrimony';

const tooltipStyle = {
  backgroundColor: 'rgba(20,20,22,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
};

export default function SimulatorsPage() {
  const [tab, setTab] = useState<Tab>('compound');

  const [ciCapital, setCiCapital] = useState(10000);
  const [ciMonthly, setCiMonthly] = useState(500);
  const [ciRate, setCiRate] = useState(7);
  const [ciYears, setCiYears] = useState(25);

  const [loanAmount, setLoanAmount] = useState(250000);
  const [loanRate, setLoanRate] = useState(3.5);
  const [loanYears, setLoanYears] = useState(20);

  const [patCapital, setPatCapital] = useState(396271);
  const [patMonthly, setPatMonthly] = useState(1500);
  const [patRate, setPatRate] = useState(5);
  const [patYears, setPatYears] = useState(30);

  const compoundData = simulateCompoundInterest(ciCapital, ciMonthly, ciRate, ciYears);
  const loanResult = simulateLoan(loanAmount, loanRate, loanYears);
  const patrimonyData = simulateCompoundInterest(patCapital, patMonthly, patRate, patYears);

  const tabs = [
    { id: 'compound' as Tab, label: 'Intérêts composés', icon: Calculator },
    { id: 'loan' as Tab, label: 'Prêt immobilier', icon: Home },
    { id: 'patrimony' as Tab, label: 'Projection patrimoine', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-in">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Simulateurs</h1>
        <p className="text-[#a0a0a6] text-sm mt-1">Outils de simulation financière</p>
      </div>

      <div className="flex gap-2 flex-wrap animate-in animate-in-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              tab === t.id
                ? 'bg-[#f4be7e]/15 text-[#f4be7e] border border-[#f4be7e]/25'
                : 'text-[#6b6b73] hover:text-[#f5f5f5] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'compound' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 animate-in animate-in-2">
            <CardHeader>
              <CardTitle>Intérêts composés</CardTitle>
              <div className="text-right">
                <p className="text-sm text-[#a0a0a6]">Capital final</p>
                <p className="text-xl font-bold text-[#f5f5f5]">{formatCurrency(compoundData[compoundData.length - 1]?.capital || 0)}</p>
              </div>
            </CardHeader>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={compoundData}>
                <XAxis dataKey="year" tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Années', position: 'insideBottomRight', fill: '#6b6b73', offset: -5 }} />
                <YAxis tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={50} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(Number(value)), '']} />
                <Legend />
                <Area type="monotone" dataKey="contributions" name="Versements" fill="#5682f2" fillOpacity={0.3} stroke="#5682f2" strokeWidth={2} stackId="1" />
                <Area type="monotone" dataKey="interest" name="Intérêts" fill="#f4be7e" fillOpacity={0.3} stroke="#f4be7e" strokeWidth={2} stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card className="animate-in animate-in-3">
            <CardHeader><CardTitle>Paramètres</CardTitle></CardHeader>
            <div className="space-y-4">
              <Input id="ci-capital" label="Capital initial (€)" type="number" value={ciCapital} onChange={(e) => setCiCapital(Number(e.target.value))} />
              <Input id="ci-monthly" label="Versement mensuel (€)" type="number" value={ciMonthly} onChange={(e) => setCiMonthly(Number(e.target.value))} />
              <Input id="ci-rate" label="Taux annuel (%)" type="number" step="0.1" value={ciRate} onChange={(e) => setCiRate(Number(e.target.value))} />
              <Input id="ci-years" label="Durée (années)" type="number" value={ciYears} onChange={(e) => setCiYears(Number(e.target.value))} />
              <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#a0a0a6]">Total versé</span><span className="text-[#f5f5f5]">{formatCurrency(compoundData[compoundData.length - 1]?.contributions || 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#a0a0a6]">Intérêts gagnés</span><span className="text-[#34d399]">{formatCurrency(compoundData[compoundData.length - 1]?.interest || 0)}</span></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'loan' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 animate-in animate-in-2">
            <CardHeader>
              <CardTitle>Tableau d&apos;amortissement</CardTitle>
              <div className="text-right">
                <p className="text-sm text-[#a0a0a6]">Mensualité</p>
                <p className="text-xl font-bold text-[#f5f5f5]">{formatCurrency(loanResult.monthlyPayment)}/mois</p>
              </div>
            </CardHeader>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={loanResult.amortization}>
                <XAxis dataKey="month" tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `M${v}`} />
                <YAxis tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(Number(value)), '']} />
                <Legend />
                <Bar dataKey="principal" name="Capital" fill="#f4be7e" stackId="a" />
                <Bar dataKey="interest" name="Intérêts" fill="#f87171" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="animate-in animate-in-3">
            <CardHeader><CardTitle>Paramètres</CardTitle></CardHeader>
            <div className="space-y-4">
              <Input id="loan-amount" label="Montant emprunté (€)" type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} />
              <Input id="loan-rate" label="Taux annuel (%)" type="number" step="0.1" value={loanRate} onChange={(e) => setLoanRate(Number(e.target.value))} />
              <Input id="loan-years" label="Durée (années)" type="number" value={loanYears} onChange={(e) => setLoanYears(Number(e.target.value))} />
              <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#a0a0a6]">Mensualité</span><span className="text-[#f5f5f5]">{formatCurrency(loanResult.monthlyPayment)}</span></div>
                <div className="flex justify-between"><span className="text-[#a0a0a6]">Coût total</span><span className="text-[#f5f5f5]">{formatCurrency(loanResult.totalCost)}</span></div>
                <div className="flex justify-between"><span className="text-[#a0a0a6]">Total intérêts</span><span className="text-[#f87171]">{formatCurrency(loanResult.totalInterest)}</span></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'patrimony' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 animate-in animate-in-2">
            <CardHeader>
              <CardTitle>Projection patrimoniale</CardTitle>
              <div className="text-right">
                <p className="text-sm text-[#a0a0a6]">Patrimoine à {patYears} ans</p>
                <p className="text-xl font-bold text-[#f5f5f5]">{formatCurrency(patrimonyData[patrimonyData.length - 1]?.capital || 0)}</p>
              </div>
            </CardHeader>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={patrimonyData}>
                <XAxis dataKey="year" tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Années', position: 'insideBottomRight', fill: '#6b6b73', offset: -5 }} />
                <YAxis tick={{ fill: '#6b6b73', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} width={50} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(Number(value)), '']} />
                <Area type="monotone" dataKey="capital" name="Patrimoine" fill="#f4be7e" fillOpacity={0.15} stroke="#f4be7e" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card className="animate-in animate-in-3">
            <CardHeader><CardTitle>Paramètres</CardTitle></CardHeader>
            <div className="space-y-4">
              <Input id="pat-capital" label="Patrimoine actuel (€)" type="number" value={patCapital} onChange={(e) => setPatCapital(Number(e.target.value))} />
              <Input id="pat-monthly" label="Épargne mensuelle (€)" type="number" value={patMonthly} onChange={(e) => setPatMonthly(Number(e.target.value))} />
              <Input id="pat-rate" label="Rendement annuel (%)" type="number" step="0.1" value={patRate} onChange={(e) => setPatRate(Number(e.target.value))} />
              <Input id="pat-years" label="Horizon (années)" type="number" value={patYears} onChange={(e) => setPatYears(Number(e.target.value))} />
              <Button variant="outline" className="w-full" onClick={() => { setPatCapital(396271); setPatMonthly(1500); setPatRate(5); setPatYears(30); }}>
                Réinitialiser
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
