import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { ToolLayout } from '@/components/shared/ToolLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, RefreshCw, TrendingUp, TrendingDown, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt = (n: number, decimals = 2) =>
  isNaN(n) || !isFinite(n) ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtCurrency = (n: number) => `$${fmt(n)}`;

function ResultRow({ label, value, highlight = false, sub = false }: { label: string; value: string; highlight?: boolean; sub?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2 ${sub ? 'pl-4' : ''} ${highlight ? 'border-t mt-2 pt-3' : 'border-b border-border/50'}`}>
      <span className={`text-sm ${highlight ? 'font-bold text-base' : sub ? 'text-muted-foreground text-xs' : 'text-muted-foreground'}`}>{label}</span>
      <span className={`font-semibold ${highlight ? 'text-lg text-primary' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Card className="bg-muted/30 border">
      {title && <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle></CardHeader>}
      <CardContent className={`${title ? 'pt-0' : 'pt-4'} px-4 pb-4`}>{children}</CardContent>
    </Card>
  );
}

// ─── MORTGAGE CALCULATOR ──────────────────────────────────────────────────
type PayFreq = 'monthly' | 'biweekly' | 'weekly';

const FREQ_LABEL: Record<PayFreq, string> = { monthly: 'Monthly', biweekly: 'Bi-Weekly', weekly: 'Weekly' };
const FREQ_PER_YEAR: Record<PayFreq, number> = { monthly: 12, biweekly: 26, weekly: 52 };

export function MortgageCalc() {
  const [homePrice, setHomePrice] = useState('400000');
  const [downPct, setDownPct] = useState('20');
  const [downAmt, setDownAmt] = useState('80000');
  const [downMode, setDownMode] = useState<'pct' | 'amt'>('pct');
  const [rate, setRate] = useState('6.5');
  const [term, setTerm] = useState('30');
  const [freq, setFreq] = useState<PayFreq>('monthly');
  const [propTax, setPropTax] = useState('4800');
  const [insurance, setInsurance] = useState('1200');
  const [hoa, setHoa] = useState('0');
  const [pmiRate, setPmiRate] = useState('0.5');
  const [showAmort, setShowAmort] = useState(false);

  const price = parseFloat(homePrice) || 0;
  const dp = downMode === 'pct' ? price * (parseFloat(downPct) / 100) : parseFloat(downAmt) || 0;
  const dpPct = price > 0 ? (dp / price) * 100 : 0;
  const principal = price - dp;
  const annualRate = parseFloat(rate) / 100;
  const termYears = parseInt(term);
  const totalPeriods = termYears * FREQ_PER_YEAR[freq];
  const periodicRate = annualRate / FREQ_PER_YEAR[freq];

  const piPayment = useMemo(() => {
    if (principal <= 0 || periodicRate <= 0 || totalPeriods <= 0) return 0;
    return principal * periodicRate * Math.pow(1 + periodicRate, totalPeriods) / (Math.pow(1 + periodicRate, totalPeriods) - 1);
  }, [principal, periodicRate, totalPeriods]);

  const taxPerPeriod = (parseFloat(propTax) || 0) / FREQ_PER_YEAR[freq];
  const insPerPeriod = (parseFloat(insurance) || 0) / FREQ_PER_YEAR[freq];
  const hoaPerPeriod = (parseFloat(hoa) || 0) * (FREQ_PER_YEAR[freq] / 12);
  const pmi = dpPct < 20 ? (principal * (parseFloat(pmiRate) / 100)) / FREQ_PER_YEAR[freq] : 0;
  const totalPayment = piPayment + taxPerPeriod + insPerPeriod + hoaPerPeriod + pmi;
  const totalInterest = piPayment * totalPeriods - principal;
  const totalCost = principal + totalInterest + (parseFloat(propTax) || 0) * termYears + (parseFloat(insurance) || 0) * termYears + (parseFloat(hoa) || 0) * termYears * 12;

  // Amortization schedule (first 24 rows)
  const amortRows = useMemo(() => {
    const rows: { period: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    let bal = principal;
    for (let i = 1; i <= Math.min(totalPeriods, 24); i++) {
      const interest = bal * periodicRate;
      const princ = piPayment - interest;
      bal = Math.max(0, bal - princ);
      rows.push({ period: i, payment: piPayment, principal: princ, interest, balance: bal });
    }
    return rows;
  }, [principal, periodicRate, piPayment, totalPeriods]);

  return (
    <Shell>
      <ToolLayout title="Mortgage Calculator" description="Calculate your full mortgage payment including taxes, insurance, PMI, and HOA fees." category="Calculators" categoryPath="/#calc">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-5">
            <div>
              <Label className="font-semibold">Home Price</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" className="pl-7" value={homePrice} onChange={e => {
                  setHomePrice(e.target.value);
                  if (downMode === 'pct') setDownAmt(String((parseFloat(e.target.value) * parseFloat(downPct) / 100).toFixed(0)));
                }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="font-semibold">Down Payment</Label>
                <div className="flex rounded-md border overflow-hidden text-xs">
                  <button onClick={() => setDownMode('pct')} className={`px-3 py-1 ${downMode === 'pct' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>%</button>
                  <button onClick={() => setDownMode('amt')} className={`px-3 py-1 ${downMode === 'amt' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>$</button>
                </div>
              </div>
              <div className="flex gap-2">
                {downMode === 'pct' ? (
                  <div className="relative flex-1">
                    <Input type="number" value={downPct} onChange={e => { setDownPct(e.target.value); setDownAmt(String((price * parseFloat(e.target.value) / 100).toFixed(0))); }} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                ) : (
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input type="number" className="pl-7" value={downAmt} onChange={e => { setDownAmt(e.target.value); setDownPct(String((parseFloat(e.target.value) / price * 100).toFixed(1))); }} />
                  </div>
                )}
                <div className="text-sm text-muted-foreground flex items-center px-2 whitespace-nowrap">
                  {downMode === 'pct' ? `$${fmt(dp, 0)}` : `${dpPct.toFixed(1)}%`}
                </div>
              </div>
              {dpPct < 20 && dp > 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> PMI applies (down payment &lt; 20%)</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Loan Amount: <strong>{fmtCurrency(principal)}</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Interest Rate</Label>
                <div className="relative mt-1">
                  <Input type="number" step="0.05" value={rate} onChange={e => setRate(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Loan Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['10','15','20','25','30'].map(y => <SelectItem key={y} value={y}>{y} Years</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-semibold">Payment Frequency</Label>
              <div className="flex gap-2 mt-1">
                {(['monthly', 'biweekly', 'weekly'] as PayFreq[]).map(f => (
                  <button key={f} onClick={() => setFreq(f)} className={`flex-1 text-sm py-2 rounded-md border transition-colors ${freq === f ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'}`}>
                    {FREQ_LABEL[f]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Annual Property Tax</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input type="number" className="pl-7" value={propTax} onChange={e => setPropTax(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-sm">Annual Home Insurance</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input type="number" className="pl-7" value={insurance} onChange={e => setInsurance(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-sm">Monthly HOA Fees</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input type="number" className="pl-7" value={hoa} onChange={e => setHoa(e.target.value)} />
                </div>
              </div>
              {dpPct < 20 && dp > 0 && (
                <div>
                  <Label className="text-sm">PMI Rate (Annual)</Label>
                  <div className="relative mt-1">
                    <Input type="number" step="0.05" value={pmiRate} onChange={e => setPmiRate(e.target.value)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <SectionCard title={`${FREQ_LABEL[freq]} Payment Breakdown`}>
              <ResultRow label="Principal & Interest" value={fmtCurrency(piPayment)} />
              {taxPerPeriod > 0 && <ResultRow label="Property Tax" value={fmtCurrency(taxPerPeriod)} sub />}
              {insPerPeriod > 0 && <ResultRow label="Home Insurance" value={fmtCurrency(insPerPeriod)} sub />}
              {pmi > 0 && <ResultRow label="PMI" value={fmtCurrency(pmi)} sub />}
              {hoaPerPeriod > 0 && <ResultRow label="HOA Fees" value={fmtCurrency(hoaPerPeriod)} sub />}
              <ResultRow label={`Total ${FREQ_LABEL[freq]} Payment`} value={fmtCurrency(totalPayment)} highlight />
            </SectionCard>

            <SectionCard title="Loan Summary">
              <ResultRow label="Loan Amount" value={fmtCurrency(principal)} />
              <ResultRow label="Total Interest Paid" value={fmtCurrency(totalInterest)} />
              <ResultRow label="Total Principal + Interest" value={fmtCurrency(principal + totalInterest)} />
              <ResultRow label="Total Cost (incl. tax/ins/HOA)" value={fmtCurrency(totalCost)} highlight />
            </SectionCard>

            {/* Interest vs Principal bar */}
            {principal > 0 && (
              <SectionCard>
                <div className="text-xs text-muted-foreground mb-2 font-medium">INTEREST vs PRINCIPAL</div>
                <div className="h-4 rounded-full overflow-hidden flex">
                  <div className="bg-primary h-full transition-all" style={{ width: `${(principal / (principal + totalInterest)) * 100}%` }} />
                  <div className="bg-muted-foreground/30 h-full flex-1" />
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-primary font-medium">Principal {((principal / (principal + totalInterest)) * 100).toFixed(1)}%</span>
                  <span className="text-muted-foreground">Interest {((totalInterest / (principal + totalInterest)) * 100).toFixed(1)}%</span>
                </div>
              </SectionCard>
            )}
          </div>
        </div>

        {/* Amortization Table */}
        {principal > 0 && piPayment > 0 && (
          <div className="mt-8">
            <button onClick={() => setShowAmort(v => !v)} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              {showAmort ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAmort ? 'Hide' : 'Show'} Amortization Schedule (first 24 {FREQ_LABEL[freq].toLowerCase()} payments)
            </button>
            {showAmort && (
              <div className="mt-4 overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Payment</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Principal</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Interest</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortRows.map(r => (
                      <tr key={r.period} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground">{r.period}</td>
                        <td className="px-4 py-2 text-right">{fmtCurrency(r.payment)}</td>
                        <td className="px-4 py-2 text-right text-green-600">{fmtCurrency(r.principal)}</td>
                        <td className="px-4 py-2 text-right text-red-500">{fmtCurrency(r.interest)}</td>
                        <td className="px-4 py-2 text-right font-medium">{fmtCurrency(r.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </ToolLayout>
    </Shell>
  );
}

// ─── LOAN CALCULATOR ─────────────────────────────────────────────────────
const LOAN_TYPES = ['Personal Loan', 'Auto Loan', 'Student Loan', 'Business Loan', 'Home Equity'];

export function LoanCalc() {
  const [loanType, setLoanType] = useState('Personal Loan');
  const [amount, setAmount] = useState('25000');
  const [downPmt, setDownPmt] = useState('0');
  const [rate, setRate] = useState('7.5');
  const [termMonths, setTermMonths] = useState('60');
  const [extraPmt, setExtraPmt] = useState('0');
  const [freq, setFreq] = useState<PayFreq>('monthly');
  const [showAmort, setShowAmort] = useState(false);

  const principal = Math.max(0, (parseFloat(amount) || 0) - (parseFloat(downPmt) || 0));
  const annualRate = parseFloat(rate) / 100;
  const n = parseInt(termMonths);
  const periodsPerYear = FREQ_PER_YEAR[freq];
  const periodicRate = annualRate / periodsPerYear;
  const totalPeriods = Math.round(n * (periodsPerYear / 12));

  const basePayment = useMemo(() => {
    if (principal <= 0 || periodicRate <= 0 || totalPeriods <= 0) return 0;
    return principal * periodicRate * Math.pow(1 + periodicRate, totalPeriods) / (Math.pow(1 + periodicRate, totalPeriods) - 1);
  }, [principal, periodicRate, totalPeriods]);

  const extraPerPeriod = (parseFloat(extraPmt) || 0) * (periodsPerYear / 12);

  // Calculate payoff with extra payments
  const { periodsWithExtra, interestWithExtra } = useMemo(() => {
    let bal = principal;
    let periods = 0;
    let totalInterest = 0;
    while (bal > 0.01 && periods < totalPeriods * 2) {
      const interest = bal * periodicRate;
      const pay = Math.min(bal + interest, basePayment + extraPerPeriod);
      bal -= pay - interest;
      totalInterest += interest;
      periods++;
    }
    return { periodsWithExtra: periods, interestWithExtra: totalInterest };
  }, [principal, periodicRate, basePayment, extraPerPeriod, totalPeriods]);

  const standardInterest = basePayment * totalPeriods - principal;
  const interestSaved = standardInterest - interestWithExtra;
  const periodsSaved = totalPeriods - periodsWithExtra;

  const amortRows = useMemo(() => {
    const rows: any[] = [];
    let bal = principal;
    for (let i = 1; i <= Math.min(totalPeriods, 24) && bal > 0.01; i++) {
      const interest = bal * periodicRate;
      const princ = basePayment - interest;
      bal = Math.max(0, bal - princ);
      rows.push({ period: i, payment: basePayment, principal: princ, interest, balance: bal });
    }
    return rows;
  }, [principal, periodicRate, basePayment, totalPeriods]);

  return (
    <Shell>
      <ToolLayout title="Loan Calculator" description="Calculate payments, amortization, and interest savings for any loan type." category="Calculators" categoryPath="/#calc">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <Label className="font-semibold">Loan Type</Label>
              <Select value={loanType} onValueChange={setLoanType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{LOAN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Loan Amount</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" className="pl-7" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="font-semibold">Down Payment</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" className="pl-7" value={downPmt} onChange={e => setDownPmt(e.target.value)} />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-3">Financed Amount: <strong>{fmtCurrency(principal)}</strong></p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Interest Rate</Label>
                <div className="relative mt-1">
                  <Input type="number" step="0.05" value={rate} onChange={e => setRate(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Term (Months)</Label>
                <Select value={termMonths} onValueChange={setTermMonths}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[12,24,36,48,60,72,84,96,120,180,240,360].map(m => (
                      <SelectItem key={m} value={String(m)}>{m} months ({(m/12).toFixed(m % 12 === 0 ? 0 : 1)} yr)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-semibold">Payment Frequency</Label>
              <div className="flex gap-2 mt-1">
                {(['monthly', 'biweekly', 'weekly'] as PayFreq[]).map(f => (
                  <button key={f} onClick={() => setFreq(f)} className={`flex-1 text-sm py-2 rounded-md border transition-colors ${freq === f ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'}`}>
                    {FREQ_LABEL[f]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="font-semibold">Extra Monthly Payment <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" className="pl-7" value={extraPmt} onChange={e => setExtraPmt(e.target.value)} placeholder="0" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Adding extra payments reduces your interest and payoff time.</p>
            </div>
          </div>

          <div className="space-y-4">
            <SectionCard title={`${FREQ_LABEL[freq]} Payment`}>
              <div className="text-center py-2">
                <div className="text-5xl font-black text-primary">{fmtCurrency(basePayment)}</div>
                <div className="text-sm text-muted-foreground mt-1">{FREQ_LABEL[freq]} payment</div>
              </div>
            </SectionCard>

            <SectionCard title="Standard Loan Summary">
              <ResultRow label="Total of Payments" value={fmtCurrency(basePayment * totalPeriods)} />
              <ResultRow label="Total Interest Paid" value={fmtCurrency(standardInterest)} />
              <ResultRow label="Total Cost" value={fmtCurrency(principal + standardInterest)} highlight />
            </SectionCard>

            {extraPerPeriod > 0 && (
              <SectionCard title="With Extra Payments">
                <ResultRow label="Total Interest Paid" value={fmtCurrency(interestWithExtra)} />
                <ResultRow label="Interest Saved" value={`$${fmt(interestSaved)}`} />
                <ResultRow label={`Paid Off ${Math.round(periodsSaved / (periodsPerYear / 12))} months early`} value={`${periodsWithExtra} payments`} highlight />
              </SectionCard>
            )}
          </div>
        </div>

        {principal > 0 && basePayment > 0 && (
          <div className="mt-8">
            <button onClick={() => setShowAmort(v => !v)} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              {showAmort ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAmort ? 'Hide' : 'Show'} Amortization Schedule (first 24 payments)
            </button>
            {showAmort && (
              <div className="mt-4 overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Payment</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Principal</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Interest</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortRows.map(r => (
                      <tr key={r.period} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground">{r.period}</td>
                        <td className="px-4 py-2 text-right">{fmtCurrency(r.payment)}</td>
                        <td className="px-4 py-2 text-right text-green-600">{fmtCurrency(r.principal)}</td>
                        <td className="px-4 py-2 text-right text-red-500">{fmtCurrency(r.interest)}</td>
                        <td className="px-4 py-2 text-right font-medium">{fmtCurrency(r.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </ToolLayout>
    </Shell>
  );
}

// ─── INTEREST CALCULATOR ─────────────────────────────────────────────────
type CompFreq = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'continuous';
const COMP_OPTIONS: { value: CompFreq; label: string; n: number }[] = [
  { value: 'daily', label: 'Daily', n: 365 },
  { value: 'weekly', label: 'Weekly', n: 52 },
  { value: 'monthly', label: 'Monthly', n: 12 },
  { value: 'quarterly', label: 'Quarterly', n: 4 },
  { value: 'semiannual', label: 'Semi-Annual', n: 2 },
  { value: 'annual', label: 'Annual', n: 1 },
  { value: 'continuous', label: 'Continuous', n: Infinity },
];

export function InterestCalc() {
  const [principal, setPrincipal] = useState('10000');
  const [rate, setRate] = useState('5');
  const [years, setYears] = useState('10');
  const [compFreq, setCompFreq] = useState<CompFreq>('monthly');
  const [inflationRate, setInflationRate] = useState('2.5');
  const [showTable, setShowTable] = useState(false);

  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) / 100;
  const t = parseFloat(years) || 0;
  const inf = parseFloat(inflationRate) / 100;
  const compOption = COMP_OPTIONS.find(o => o.value === compFreq)!;

  const simpleInterest = p * r * t;
  const compoundTotal = compOption.n === Infinity
    ? p * Math.exp(r * t)
    : p * Math.pow(1 + r / compOption.n, compOption.n * t);
  const compoundInterest = compoundTotal - p;

  const realCompoundTotal = compoundTotal / Math.pow(1 + inf, t);
  const effectiveRate = compOption.n === Infinity
    ? (Math.exp(r) - 1) * 100
    : (Math.pow(1 + r / compOption.n, compOption.n) - 1) * 100;

  const yearlyRows = useMemo(() => {
    return Array.from({ length: Math.min(Math.ceil(t), 30) }, (_, i) => {
      const yr = i + 1;
      const compound = compOption.n === Infinity
        ? p * Math.exp(r * yr)
        : p * Math.pow(1 + r / compOption.n, compOption.n * yr);
      const simple = p + p * r * yr;
      const real = compound / Math.pow(1 + inf, yr);
      return { yr, compound, simple, real, interest: compound - p };
    });
  }, [p, r, t, compOption, inf]);

  return (
    <Shell>
      <ToolLayout title="Interest Calculator" description="Compare simple vs compound interest with inflation adjustment and compounding frequency options." category="Calculators" categoryPath="/#calc">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <Label className="font-semibold">Principal Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" className="pl-7" value={principal} onChange={e => setPrincipal(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Annual Interest Rate</Label>
                <div className="relative mt-1">
                  <Input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Time Period (Years)</Label>
                <Input type="number" className="mt-1" value={years} onChange={e => setYears(e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="font-semibold">Compounding Frequency</Label>
              <Select value={compFreq} onValueChange={v => setCompFreq(v as CompFreq)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMP_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-semibold">Inflation Rate <span className="text-muted-foreground font-normal">(for real value)</span></Label>
              <div className="relative mt-1">
                <Input type="number" step="0.1" value={inflationRate} onChange={e => setInflationRate(e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SectionCard title="Compound Interest">
              <ResultRow label="Future Value (Nominal)" value={fmtCurrency(compoundTotal)} />
              <ResultRow label="Interest Earned" value={fmtCurrency(compoundInterest)} />
              <ResultRow label="Effective Annual Rate (EAR)" value={`${effectiveRate.toFixed(4)}%`} />
              <ResultRow label="Future Value (Inflation-Adjusted)" value={fmtCurrency(realCompoundTotal)} highlight />
            </SectionCard>

            <SectionCard title="Simple Interest (for comparison)">
              <ResultRow label="Future Value" value={fmtCurrency(p + simpleInterest)} />
              <ResultRow label="Interest Earned" value={fmtCurrency(simpleInterest)} />
              <ResultRow label="You earn more with compound" value={fmtCurrency(compoundInterest - simpleInterest)} highlight />
            </SectionCard>

            <SectionCard>
              <div className="text-xs text-muted-foreground mb-2 font-medium">GROWTH COMPARISON</div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Simple</span>
                  <div className="flex-1 mx-3 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="bg-muted-foreground/50 h-full" style={{ width: `${Math.min(100, (simpleInterest / compoundInterest) * 100)}%` }} />
                  </div>
                  <span className="font-medium text-muted-foreground">{fmt(simpleInterest, 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary font-medium">Compound</span>
                  <div className="flex-1 mx-3 h-2 bg-primary/20 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-full" />
                  </div>
                  <span className="font-medium text-primary">{fmt(compoundInterest, 0)}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {t > 0 && p > 0 && (
          <div className="mt-8">
            <button onClick={() => setShowTable(v => !v)} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showTable ? 'Hide' : 'Show'} Year-by-Year Breakdown
            </button>
            {showTable && (
              <div className="mt-4 overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Year</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Compound Value</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Simple Value</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Real Value</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Interest Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyRows.map(r => (
                      <tr key={r.yr} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground">{r.yr}</td>
                        <td className="px-4 py-2 text-right font-medium text-primary">{fmtCurrency(r.compound)}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">{fmtCurrency(r.simple)}</td>
                        <td className="px-4 py-2 text-right text-amber-600">{fmtCurrency(r.real)}</td>
                        <td className="px-4 py-2 text-right text-green-600">{fmtCurrency(r.interest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </ToolLayout>
    </Shell>
  );
}

// ─── SAVINGS CALCULATOR ───────────────────────────────────────────────────
type ContribFreq = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
const CONTRIB_OPTIONS: { value: ContribFreq; label: string; perYear: number }[] = [
  { value: 'weekly', label: 'Weekly', perYear: 52 },
  { value: 'biweekly', label: 'Bi-Weekly', perYear: 26 },
  { value: 'monthly', label: 'Monthly', perYear: 12 },
  { value: 'quarterly', label: 'Quarterly', perYear: 4 },
  { value: 'annually', label: 'Annually', perYear: 1 },
];

export function SavingsCalc() {
  const [initial, setInitial] = useState('5000');
  const [contrib, setContrib] = useState('500');
  const [contribFreq, setContribFreq] = useState<ContribFreq>('monthly');
  const [rate, setRate] = useState('6');
  const [compFreq, setCompFreq] = useState<CompFreq>('monthly');
  const [years, setYears] = useState('20');
  const [inflationRate, setInflationRate] = useState('2.5');
  const [taxRate, setTaxRate] = useState('0');
  const [showTable, setShowTable] = useState(false);

  const p = parseFloat(initial) || 0;
  const pmt = parseFloat(contrib) || 0;
  const r = parseFloat(rate) / 100;
  const t = parseFloat(years) || 0;
  const inf = parseFloat(inflationRate) / 100;
  const tax = parseFloat(taxRate) / 100;
  const contribOption = CONTRIB_OPTIONS.find(o => o.value === contribFreq)!;
  const compOption = COMP_OPTIONS.find(o => o.value === compFreq)!;
  const n = compOption.n === Infinity ? 365 : compOption.n; // treat continuous as daily for savings

  const yearlyRows = useMemo(() => {
    const annualPmt = pmt * contribOption.perYear;
    const periodicRate = r / n;
    const rows: any[] = [];
    let bal = p;

    for (let yr = 1; yr <= Math.min(Math.ceil(t), 50); yr++) {
      const periodsThisYear = n;
      const pmtPerCompound = annualPmt / periodsThisYear;
      for (let i = 0; i < periodsThisYear; i++) {
        bal = bal * (1 + periodicRate) + pmtPerCompound;
      }
      const totalContributed = p + annualPmt * yr;
      const interest = bal - totalContributed;
      const afterTax = bal - interest * tax;
      const realValue = afterTax / Math.pow(1 + inf, yr);
      rows.push({ yr, balance: bal, contributed: totalContributed, interest, afterTax, realValue });
    }
    return rows;
  }, [p, pmt, contribOption, r, n, t, inf, tax]);

  const finalRow = yearlyRows[Math.ceil(t) - 1] || { balance: 0, contributed: 0, interest: 0, afterTax: 0, realValue: 0 };
  const annualContrib = pmt * contribOption.perYear;

  return (
    <Shell>
      <ToolLayout title="Savings Calculator" description="Project your savings growth with custom contributions, compounding frequency, inflation, and tax adjustments." category="Calculators" categoryPath="/#calc">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <Label className="font-semibold">Starting Balance</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" className="pl-7" value={initial} onChange={e => setInitial(e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="font-semibold">Regular Contribution</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" className="pl-7" value={contrib} onChange={e => setContrib(e.target.value)} />
                </div>
                <Select value={contribFreq} onValueChange={v => setContribFreq(v as ContribFreq)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTRIB_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-1">= {fmtCurrency(annualContrib)} per year</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Annual Return Rate</Label>
                <div className="relative mt-1">
                  <Input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Time (Years)</Label>
                <Input type="number" className="mt-1" value={years} onChange={e => setYears(e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="font-semibold">Compounding Frequency</Label>
              <Select value={compFreq} onValueChange={v => setCompFreq(v as CompFreq)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMP_OPTIONS.filter(o => o.value !== 'continuous').map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Inflation Rate</Label>
                <div className="relative mt-1">
                  <Input type="number" step="0.1" value={inflationRate} onChange={e => setInflationRate(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Tax on Interest</Label>
                <div className="relative mt-1">
                  <Input type="number" step="1" value={taxRate} onChange={e => setTaxRate(e.target.value)} placeholder="0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SectionCard title="Results After {years} Years">
              <div className="text-center py-3">
                <div className="text-5xl font-black text-primary">{fmtCurrency(finalRow.balance)}</div>
                <div className="text-sm text-muted-foreground mt-1">Future Value (Nominal)</div>
              </div>
            </SectionCard>

            <SectionCard title="Breakdown">
              <ResultRow label="Total Contributions" value={fmtCurrency(finalRow.contributed)} />
              <ResultRow label="Total Interest Earned" value={fmtCurrency(finalRow.interest)} />
              {tax > 0 && <ResultRow label="After-Tax Value" value={fmtCurrency(finalRow.afterTax)} />}
              <ResultRow label="Inflation-Adjusted Value" value={fmtCurrency(finalRow.realValue)} />
              <ResultRow label="Net Gain (Interest)" value={fmtCurrency(finalRow.interest)} highlight />
            </SectionCard>

            <SectionCard>
              <div className="text-xs text-muted-foreground mb-3 font-medium">YOUR MONEY COMPOSITION</div>
              <div className="h-4 rounded-full overflow-hidden flex">
                <div className="bg-blue-500 h-full" style={{ width: `${finalRow.balance > 0 ? (finalRow.contributed / finalRow.balance) * 100 : 0}%` }} />
                <div className="bg-primary h-full flex-1" />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-blue-600 font-medium">Contributed {finalRow.balance > 0 ? ((finalRow.contributed / finalRow.balance) * 100).toFixed(1) : 0}%</span>
                <span className="text-primary font-medium">Growth {finalRow.balance > 0 ? ((finalRow.interest / finalRow.balance) * 100).toFixed(1) : 0}%</span>
              </div>
            </SectionCard>
          </div>
        </div>

        {t > 0 && (
          <div className="mt-8">
            <button onClick={() => setShowTable(v => !v)} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showTable ? 'Hide' : 'Show'} Year-by-Year Growth Table
            </button>
            {showTable && (
              <div className="mt-4 overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Year</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Balance</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Contributed</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Interest</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Real Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyRows.map(r => (
                      <tr key={r.yr} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground">{r.yr}</td>
                        <td className="px-4 py-2 text-right font-semibold text-primary">{fmtCurrency(r.balance)}</td>
                        <td className="px-4 py-2 text-right text-blue-600">{fmtCurrency(r.contributed)}</td>
                        <td className="px-4 py-2 text-right text-green-600">{fmtCurrency(r.interest)}</td>
                        <td className="px-4 py-2 text-right text-amber-600">{fmtCurrency(r.realValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </ToolLayout>
    </Shell>
  );
}

// ─── CURRENCY CONVERTER ───────────────────────────────────────────────────
const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar', AUD: 'Australian Dollar', CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan', INR: 'Indian Rupee', BRL: 'Brazilian Real',
  MXN: 'Mexican Peso', KRW: 'South Korean Won', SGD: 'Singapore Dollar',
  HKD: 'Hong Kong Dollar', NOK: 'Norwegian Krone', SEK: 'Swedish Krona',
  DKK: 'Danish Krone', PLN: 'Polish Złoty', CZK: 'Czech Koruna',
  HUF: 'Hungarian Forint', TRY: 'Turkish Lira', ZAR: 'South African Rand',
  ILS: 'Israeli Shekel', THB: 'Thai Baht', IDR: 'Indonesian Rupiah',
  MYR: 'Malaysian Ringgit', PHP: 'Philippine Peso', AED: 'UAE Dirham',
  SAR: 'Saudi Riyal', NZD: 'New Zealand Dollar', RON: 'Romanian Leu',
  BGN: 'Bulgarian Lev',
};
const POPULAR = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'BRL', 'INR', 'CNY'];

export function CurrencyCalc() {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async (base: string) => {
    setLoading(true);
    setError(null);
    try {
      // In dev (Replit preview) use the local proxy to avoid iframe CORS issues.
      // In production (GitHub Pages, golana.online, etc.) call Frankfurter directly
      // — it returns Access-Control-Allow-Origin: * so no proxy is needed.
      const url = import.meta.env.DEV
        ? `/api/currency/latest?from=${base}`
        : `https://api.frankfurter.dev/v1/latest?from=${base}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch rates');
      const data = await res.json();
      setRates({ ...data.rates, [base]: 1 });
      setLastUpdated(data.date);
    } catch (e) {
      setError('Could not fetch live rates. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(from); }, [from]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const converted = rates && rates[to] ? (parseFloat(amount) || 0) * rates[to] : null;
  const rate1 = rates && rates[to] ? rates[to] : null;
  const rateBack = rates && rates[to] ? 1 / rates[to] : null;

  const currencies = Object.keys(CURRENCY_NAMES);

  return (
    <Shell>
      <ToolLayout title="Currency Converter" description="Live exchange rates powered by the European Central Bank via Frankfurter API." category="Calculators" categoryPath="/#calc">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Amount */}
          <div>
            <Label className="font-semibold">Amount</Label>
            <Input type="number" className="mt-1 text-xl h-12" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          {/* From / Swap / To */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="font-semibold">From</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="mt-1 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Popular</div>
                  {POPULAR.map(c => (
                    <SelectItem key={c} value={c}><span className="font-medium">{c}</span> <span className="text-muted-foreground text-xs ml-1">{CURRENCY_NAMES[c]}</span></SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1 border-t">All Currencies</div>
                  {currencies.filter(c => !POPULAR.includes(c)).map(c => (
                    <SelectItem key={c} value={c}><span className="font-medium">{c}</span> <span className="text-muted-foreground text-xs ml-1">{CURRENCY_NAMES[c]}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button onClick={swap} className="h-11 w-11 shrink-0 flex items-center justify-center rounded-full border hover:bg-primary hover:text-primary-foreground transition-colors mb-0.5">
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <div className="flex-1">
              <Label className="font-semibold">To</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="mt-1 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Popular</div>
                  {POPULAR.map(c => (
                    <SelectItem key={c} value={c}><span className="font-medium">{c}</span> <span className="text-muted-foreground text-xs ml-1">{CURRENCY_NAMES[c]}</span></SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1 border-t">All Currencies</div>
                  {currencies.filter(c => !POPULAR.includes(c)).map(c => (
                    <SelectItem key={c} value={c}><span className="font-medium">{c}</span> <span className="text-muted-foreground text-xs ml-1">{CURRENCY_NAMES[c]}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Fetching live rates...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            ) : converted !== null ? (
              <>
                <div className="text-muted-foreground text-sm">{fmt(parseFloat(amount) || 0)} {from} =</div>
                <div className="text-5xl font-black text-primary">{fmt(converted)}</div>
                <div className="text-xl font-semibold text-foreground">{to}</div>
                {rate1 !== null && (
                  <div className="text-sm text-muted-foreground pt-2 space-y-0.5">
                    <div>1 {from} = {fmt(rate1, 4)} {to}</div>
                    <div>1 {to} = {fmt(rateBack!, 4)} {from}</div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : error ? 'bg-red-400' : 'bg-green-500'}`} />
              {loading ? 'Updating...' : error ? 'Offline (cached)' : `Live rates · ECB via Frankfurter`}
            </div>
            {lastUpdated && !error && (
              <div>Updated: {lastUpdated}</div>
            )}
            <button onClick={() => fetchRates(from)} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {/* Quick conversion grid */}
          {rates && !error && (
            <div>
              <div className="text-sm font-semibold mb-3">Popular Conversions (1 {from})</div>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR.filter(c => c !== from).slice(0, 8).map(c => (
                  <div key={c} className="flex justify-between items-center px-3 py-2 bg-muted/40 rounded-lg text-sm cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => setTo(c)}>
                    <span className="font-medium">{c}</span>
                    <span className="text-muted-foreground">{rates[c] ? fmt(rates[c], 4) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

// ─── SALARY CALCULATOR ────────────────────────────────────────────────────
type FilingStatus = 'single' | 'married' | 'hoh';
type PayPeriod = 'annual' | 'monthly' | 'biweekly' | 'weekly' | 'daily' | 'hourly';

const PERIOD_LABEL: Record<PayPeriod, string> = {
  annual: 'Annual', monthly: 'Monthly', biweekly: 'Bi-Weekly', weekly: 'Weekly', daily: 'Daily', hourly: 'Hourly'
};
const PERIOD_MULTIPLIER: Record<PayPeriod, number> = {
  annual: 1, monthly: 12, biweekly: 26, weekly: 52, daily: 260, hourly: 2080
};

// 2024 Federal tax brackets (Single)
const FED_BRACKETS_SINGLE = [
  { min: 609350, rate: 0.37 }, { min: 243725, rate: 0.35 }, { min: 191950, rate: 0.32 },
  { min: 100525, rate: 0.24 }, { min: 47150, rate: 0.22 }, { min: 11600, rate: 0.12 }, { min: 0, rate: 0.10 }
];
const FED_BRACKETS_MARRIED = [
  { min: 731200, rate: 0.37 }, { min: 487450, rate: 0.35 }, { min: 383900, rate: 0.32 },
  { min: 201050, rate: 0.24 }, { min: 94300, rate: 0.22 }, { min: 23200, rate: 0.12 }, { min: 0, rate: 0.10 }
];
const FED_BRACKETS_HOH = [
  { min: 609350, rate: 0.37 }, { min: 243700, rate: 0.35 }, { min: 191950, rate: 0.32 },
  { min: 100500, rate: 0.24 }, { min: 63100, rate: 0.22 }, { min: 16550, rate: 0.12 }, { min: 0, rate: 0.10 }
];

function calcFedTax(income: number, status: FilingStatus): number {
  const brackets = status === 'married' ? FED_BRACKETS_MARRIED : status === 'hoh' ? FED_BRACKETS_HOH : FED_BRACKETS_SINGLE;
  let tax = 0;
  let remaining = income;
  for (let i = 0; i < brackets.length - 1; i++) {
    if (remaining > brackets[i].min) {
      tax += (remaining - brackets[i].min) * brackets[i].rate;
      remaining = brackets[i].min;
    }
  }
  tax += remaining * brackets[brackets.length - 1].rate;
  return tax;
}

export function SalaryCalc() {
  const [income, setIncome] = useState('75000');
  const [period, setPeriod] = useState<PayPeriod>('annual');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [status, setStatus] = useState<FilingStatus>('single');
  const [stateTax, setStateTax] = useState('5');
  const [contrib401k, setContrib401k] = useState('6');
  const [healthIns, setHealthIns] = useState('300');
  const [otherDeductions, setOtherDeductions] = useState('0');
  const [showBreakdown, setShowBreakdown] = useState(true);

  const multiplier = period === 'hourly'
    ? parseFloat(hoursPerWeek) * 52
    : PERIOD_MULTIPLIER[period];

  const grossAnnual = (parseFloat(income) || 0) * multiplier;
  const k401Annual = grossAnnual * ((parseFloat(contrib401k) || 0) / 100);
  const healthAnnual = (parseFloat(healthIns) || 0) * 12;
  const otherAnnual = (parseFloat(otherDeductions) || 0) * 12;
  const preTaxDeductions = k401Annual + healthAnnual + otherAnnual;
  const federalTaxableIncome = Math.max(0, grossAnnual - preTaxDeductions);

  const federalTax = calcFedTax(federalTaxableIncome, status);
  const stateTaxAmt = federalTaxableIncome * ((parseFloat(stateTax) || 0) / 100);
  const socialSecurity = Math.min(grossAnnual, 168600) * 0.062;
  const medicare = grossAnnual * 0.0145 + Math.max(0, grossAnnual - 200000) * 0.009;
  const ficaTotal = socialSecurity + medicare;

  const totalDeductions = federalTax + stateTaxAmt + ficaTotal + preTaxDeductions;
  const netAnnual = grossAnnual - totalDeductions;
  const effectiveFedRate = grossAnnual > 0 ? (federalTax / grossAnnual) * 100 : 0;

  const forPeriod = (annual: number) => {
    const divisors: Record<PayPeriod, number> = { annual: 1, monthly: 12, biweekly: 26, weekly: 52, daily: 260, hourly: 2080 };
    const div = period === 'hourly' ? parseFloat(hoursPerWeek) * 52 : divisors[period];
    return annual / div;
  };

  return (
    <Shell>
      <ToolLayout title="Salary & Tax Calculator" description="Estimate your federal taxes, Social Security, Medicare, and take-home pay with full bracket breakdown." category="Calculators" categoryPath="/#calc">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <Label className="font-semibold">Gross Income</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" className="pl-7" value={income} onChange={e => setIncome(e.target.value)} />
                </div>
                <Select value={period} onValueChange={v => setPeriod(v as PayPeriod)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(PERIOD_LABEL) as PayPeriod[]).map(p => <SelectItem key={p} value={p}>{PERIOD_LABEL[p]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {period === 'hourly' && (
                <div className="mt-2 flex items-center gap-2">
                  <Input type="number" value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} className="w-24" />
                  <span className="text-sm text-muted-foreground">hours/week</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Annual gross: <strong>{fmtCurrency(grossAnnual)}</strong></p>
            </div>

            <div>
              <Label className="font-semibold">Filing Status</Label>
              <div className="flex gap-2 mt-1">
                {[['single', 'Single'], ['married', 'Married (Joint)'], ['hoh', 'Head of Household']].map(([v, l]) => (
                  <button key={v} onClick={() => setStatus(v as FilingStatus)} className={`flex-1 text-xs py-2 rounded-md border transition-colors ${status === v ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'}`}>{l}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">State Income Tax</Label>
                <div className="relative mt-1">
                  <Input type="number" step="0.5" value={stateTax} onChange={e => setStateTax(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label className="font-semibold">401(k) Contribution</Label>
                <div className="relative mt-1">
                  <Input type="number" step="0.5" value={contrib401k} onChange={e => setContrib401k(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Health Insurance ($/mo)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" className="pl-7" value={healthIns} onChange={e => setHealthIns(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="font-semibold">Other Deductions ($/mo)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" className="pl-7" value={otherDeductions} onChange={e => setOtherDeductions(e.target.value)} />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
              Uses 2024 US Federal tax brackets. State tax is a flat rate for simplicity. This is an estimate — consult a tax professional for advice.
            </p>
          </div>

          <div className="space-y-4">
            <SectionCard>
              <div className="text-center py-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Estimated Take-Home</div>
                <div className="text-5xl font-black text-primary">{fmtCurrency(netAnnual)}</div>
                <div className="text-sm text-muted-foreground">per year / {fmtCurrency(forPeriod(netAnnual))} {PERIOD_LABEL[period].toLowerCase()}</div>
              </div>
            </SectionCard>

            <SectionCard title="Annual Breakdown">
              <ResultRow label="Gross Income" value={fmtCurrency(grossAnnual)} />
              <ResultRow label="401(k) Contribution" value={`-${fmtCurrency(k401Annual)}`} sub />
              <ResultRow label="Health Insurance" value={`-${fmtCurrency(healthAnnual)}`} sub />
              <ResultRow label="Federal Income Tax" value={`-${fmtCurrency(federalTax)}`} sub />
              <ResultRow label="State Income Tax" value={`-${fmtCurrency(stateTaxAmt)}`} sub />
              <ResultRow label="Social Security (6.2%)" value={`-${fmtCurrency(socialSecurity)}`} sub />
              <ResultRow label="Medicare (1.45%)" value={`-${fmtCurrency(medicare)}`} sub />
              <ResultRow label="Net Take-Home Pay" value={fmtCurrency(netAnnual)} highlight />
            </SectionCard>

            <SectionCard title="Tax Rates">
              <ResultRow label="Effective Federal Rate" value={`${effectiveFedRate.toFixed(2)}%`} />
              <ResultRow label="Marginal Federal Rate" value={grossAnnual > 609350 ? '37%' : grossAnnual > 243725 ? '35%' : grossAnnual > 191950 ? '32%' : grossAnnual > 100525 ? '24%' : grossAnnual > 47150 ? '22%' : grossAnnual > 11600 ? '12%' : '10%'} />
              <ResultRow label="Total Tax Burden" value={`${grossAnnual > 0 ? ((federalTax + stateTaxAmt + ficaTotal) / grossAnnual * 100).toFixed(1) : 0}%`} />
            </SectionCard>
          </div>
        </div>

        {/* Per-period breakdown table */}
        <div className="mt-8">
          <button onClick={() => setShowBreakdown(v => !v)} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showBreakdown ? 'Hide' : 'Show'} Pay Period Comparison Table
          </button>
          {showBreakdown && (
            <div className="mt-4 overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Annual</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Monthly</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Bi-Weekly</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Weekly</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Gross Pay', grossAnnual],
                    ['Federal Tax', federalTax],
                    ['State Tax', stateTaxAmt],
                    ['Social Security', socialSecurity],
                    ['Medicare', medicare],
                    ['401(k)', k401Annual],
                    ['Health Insurance', healthAnnual],
                    ['Net Pay', netAnnual],
                  ].map(([label, annual]) => (
                    <tr key={label as string} className={`border-t ${label === 'Net Pay' ? 'bg-primary/5 font-bold' : 'hover:bg-muted/30'}`}>
                      <td className={`px-4 py-2 ${label === 'Net Pay' ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{label as string}</td>
                      <td className="px-4 py-2 text-right">{fmtCurrency(annual as number)}</td>
                      <td className="px-4 py-2 text-right">{fmtCurrency((annual as number) / 12)}</td>
                      <td className="px-4 py-2 text-right">{fmtCurrency((annual as number) / 26)}</td>
                      <td className="px-4 py-2 text-right">{fmtCurrency((annual as number) / 52)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

// ─── ROI CALCULATOR ───────────────────────────────────────────────────────
export function RoiCalc() {
  const [mode, setMode] = useState<'finalValue' | 'netGain'>('finalValue');
  const [initialInvestment, setInitialInvestment] = useState('10000');
  const [finalValue, setFinalValue] = useState('14500');
  const [netGain, setNetGain] = useState('4500');
  const [termYears, setTermYears] = useState('3');
  const [termMonths, setTermMonths] = useState('0');
  const [dividends, setDividends] = useState('0');
  const [inflationRate, setInflationRate] = useState('2.5');

  const initial = parseFloat(initialInvestment) || 0;
  const annualDividends = parseFloat(dividends) || 0;
  const inf = parseFloat(inflationRate) / 100;
  const years = (parseFloat(termYears) || 0) + (parseFloat(termMonths) || 0) / 12;

  const fv = mode === 'finalValue'
    ? (parseFloat(finalValue) || 0)
    : initial + (parseFloat(netGain) || 0);

  const totalReturn = fv + annualDividends * years;
  const netProfit = totalReturn - initial;
  const roi = initial > 0 ? (netProfit / initial) * 100 : 0;
  const cagr = initial > 0 && years > 0 ? (Math.pow(totalReturn / initial, 1 / years) - 1) * 100 : 0;
  const realCagr = cagr - inf * 100;
  const multiple = initial > 0 ? totalReturn / initial : 0;
  const spComparison = initial * Math.pow(1.10, years); // historical S&P avg ~10%
  const inflComparison = initial * Math.pow(1 + inf, years);
  const isPositive = netProfit >= 0;

  return (
    <Shell>
      <ToolLayout title="ROI Calculator" description="Calculate return on investment, CAGR, real returns adjusted for inflation, and compare against benchmarks." category="Calculators" categoryPath="/#calc">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <Label className="font-semibold">Initial Investment</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" className="pl-7" value={initialInvestment} onChange={e => setInitialInvestment(e.target.value)} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="font-semibold">Return Input</Label>
                <div className="flex rounded-md border overflow-hidden text-xs">
                  <button onClick={() => setMode('finalValue')} className={`px-3 py-1 ${mode === 'finalValue' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>Final Value</button>
                  <button onClick={() => setMode('netGain')} className={`px-3 py-1 ${mode === 'netGain' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>Net Gain/Loss</button>
                </div>
              </div>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                {mode === 'finalValue' ? (
                  <Input type="number" className="pl-7" value={finalValue} onChange={e => setFinalValue(e.target.value)} placeholder="Final portfolio value" />
                ) : (
                  <Input type="number" className="pl-7" value={netGain} onChange={e => setNetGain(e.target.value)} placeholder="Profit (+) or loss (-)" />
                )}
              </div>
            </div>

            <div>
              <Label className="font-semibold">Investment Period</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex-1">
                  <Input type="number" value={termYears} onChange={e => setTermYears(e.target.value)} placeholder="Years" />
                  <span className="text-xs text-muted-foreground">Years</span>
                </div>
                <div className="flex-1">
                  <Input type="number" value={termMonths} onChange={e => setTermMonths(e.target.value)} min="0" max="11" placeholder="Months" />
                  <span className="text-xs text-muted-foreground">Months</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Annual Dividends / Income</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" className="pl-7" value={dividends} onChange={e => setDividends(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div>
                <Label className="font-semibold">Inflation Rate</Label>
                <div className="relative mt-1">
                  <Input type="number" step="0.1" value={inflationRate} onChange={e => setInflationRate(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SectionCard>
              <div className="text-center py-2">
                <div className={`text-6xl font-black ${isPositive ? 'text-green-600' : 'text-red-500'}`}>{roi.toFixed(2)}%</div>
                <div className="text-sm text-muted-foreground mt-1">Total ROI</div>
                <Badge className={`mt-2 ${isPositive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {isPositive ? 'Profit' : 'Loss'} {fmtCurrency(Math.abs(netProfit))}
                </Badge>
              </div>
            </SectionCard>

            <SectionCard title="Return Metrics">
              <ResultRow label="Net Profit / Loss" value={`${isPositive ? '+' : ''}${fmtCurrency(netProfit)}`} />
              <ResultRow label="Total Return" value={fmtCurrency(totalReturn)} />
              <ResultRow label="Return Multiple" value={`${multiple.toFixed(2)}x`} />
              <ResultRow label="CAGR (Annualized)" value={`${cagr.toFixed(2)}%`} />
              <ResultRow label="Real CAGR (After Inflation)" value={`${realCagr.toFixed(2)}%`} highlight />
            </SectionCard>

            <SectionCard title="Benchmark Comparison">
              <div className="text-xs text-muted-foreground mb-3">Your {fmtCurrency(initial)} over {years.toFixed(1)} year{years !== 1 ? 's' : ''}</div>
              {[
                { label: 'Your Investment', value: totalReturn, color: isPositive ? 'bg-green-500' : 'bg-red-500' },
                { label: 'S&P 500 (10% avg.)', value: spComparison, color: 'bg-blue-500' },
                { label: 'Inflation (purchasing power)', value: inflComparison, color: 'bg-amber-400' },
              ].map(item => (
                <div key={item.label} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{fmtCurrency(item.value)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full transition-all`} style={{ width: `${Math.min(100, (item.value / Math.max(totalReturn, spComparison, inflComparison)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </SectionCard>
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}

// ── Percentage Calculator ───────────────────────────────────────────────────
export function PercentageCalc() {
  const [a, setA] = React.useState('');
  const [b, setB] = React.useState('');

  const pctOf     = a && b ? ((+a / 100) * +b).toFixed(4) : '';
  const whatPct   = a && b ? ((+a / +b) * 100).toFixed(4) : '';
  const pctChange = a && b ? (((+b - +a) / +a) * 100).toFixed(4) : '';

  return (
    <Shell>
      <ToolLayout title="Percentage Calculator" description="Three common percentage calculations in one place." category="Calculators" categoryPath="/#calc">
        <div className="max-w-lg mx-auto space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Value A</label>
              <input type="number" value={a} onChange={e => setA(e.target.value)} placeholder="e.g. 25" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value B</label>
              <input type="number" value={b} onChange={e => setB(e.target.value)} placeholder="e.g. 200" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'A% of B', desc: `${a||'A'}% of ${b||'B'}`, value: pctOf },
              { label: 'A is what % of B', desc: `${a||'A'} is what % of ${b||'B'}`, value: whatPct ? `${whatPct}%` : '' },
              { label: '% change from A to B', desc: `Change from ${a||'A'} to ${b||'B'}`, value: pctChange ? `${pctChange}%` : '' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                <div>
                  <div className="font-semibold text-sm">{row.label}</div>
                  <div className="text-xs text-muted-foreground">{row.desc}</div>
                </div>
                <div className="text-2xl font-bold text-primary tabular-nums">{row.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}
