import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { ToolLayout } from '@/components/shared/ToolLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MortgageCalc() {
  const [amount, setAmount] = useState('300000');
  const [rate, setRate] = useState('5.5');
  const [years, setYears] = useState('30');
  const [result, setResult] = useState<{monthly: number, total: number, interest: number} | null>(null);

  const calculate = () => {
    const p = parseFloat(amount);
    const r = parseFloat(rate) / 100 / 12;
    const n = parseFloat(years) * 12;
    
    if (p > 0 && r > 0 && n > 0) {
      const monthly = p * r * (Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const total = monthly * n;
      const interest = total - p;
      setResult({ monthly, total, interest });
    }
  };

  return (
    <Shell>
      <ToolLayout title="Mortgage Calculator" description="Estimate your monthly mortgage payments." category="Calculators" categoryPath="/#calc">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <Label>Loan Amount ($)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Interest Rate (%)</Label>
              <Input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} />
            </div>
            <div>
              <Label>Loan Term (Years)</Label>
              <Input type="number" value={years} onChange={e => setYears(e.target.value)} />
            </div>
            <Button onClick={calculate} className="w-full">Calculate</Button>
          </div>
          
          <Card className="bg-muted/50 border-none">
            <CardContent className="pt-6">
              {result ? (
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Monthly Payment</div>
                    <div className="text-4xl font-bold text-primary">${result.monthly.toFixed(2)}</div>
                  </div>
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Principal Paid</span>
                      <span className="font-medium">${parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Interest Paid</span>
                      <span className="font-medium">${result.interest.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-2 border-t">
                      <span>Total Cost of Loan</span>
                      <span>${result.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Enter values and calculate to see results.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function LoanCalc() {
  return (
    <Shell>
      <ToolLayout title="Loan Calculator" description="Calculate generic personal or auto loans." category="Calculators" categoryPath="/#calc">
        <p className="text-center text-muted-foreground mb-6">Same underlying math as a mortgage calculator, optimized for shorter terms.</p>
        {/* Reusing logic from mortgage to keep it simple, just styling differently if needed, but here we just render a simplified form */}
        <div className="max-w-xl mx-auto">
          <MortgageCalcBody />
        </div>
      </ToolLayout>
    </Shell>
  );
}

function MortgageCalcBody() {
  // A helper component to reuse the mortgage logic inside LoanCalc
  const [amount, setAmount] = useState('25000');
  const [rate, setRate] = useState('7.0');
  const [months, setMonths] = useState('60');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const p = parseFloat(amount);
    const r = parseFloat(rate) / 100 / 12;
    const n = parseFloat(months);
    if (p > 0 && r > 0 && n > 0) {
      const monthly = p * r * (Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setResult({ monthly, total: monthly * n, interest: (monthly * n) - p });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div><Label>Amount</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        <div><Label>Rate %</Label><Input type="number" value={rate} onChange={e => setRate(e.target.value)} /></div>
        <div><Label>Months</Label><Input type="number" value={months} onChange={e => setMonths(e.target.value)} /></div>
      </div>
      <Button onClick={calculate} className="w-full">Calculate Loan</Button>
      {result && (
        <div className="p-4 bg-primary/10 rounded-md text-center text-primary font-bold text-xl">
          Monthly Payment: ${result.monthly.toFixed(2)}
        </div>
      )}
    </div>
  );
}

export function InterestCalc() {
  const [principal, setPrincipal] = useState('1000');
  const [rate, setRate] = useState('5');
  const [time, setTime] = useState('5');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseFloat(time);
    
    if (p > 0 && r > 0 && t > 0) {
      const simple = p * r * t;
      const compound = p * Math.pow((1 + r), t) - p;
      setResult({ simple, compound, totalSimple: p + simple, totalCompound: p + compound });
    }
  };

  return (
    <Shell>
      <ToolLayout title="Interest Calculator" description="Compare simple vs compound interest." category="Calculators" categoryPath="/#calc">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div><Label>Principal Amount ($)</Label><Input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} /></div>
            <div><Label>Annual Rate (%)</Label><Input type="number" value={rate} onChange={e => setRate(e.target.value)} /></div>
            <div><Label>Time (Years)</Label><Input type="number" value={time} onChange={e => setTime(e.target.value)} /></div>
            <Button onClick={calculate} className="w-full">Calculate Interest</Button>
          </div>
          
          {result && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">Simple Interest</div>
                  <div className="text-2xl font-bold">${result.simple.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total: ${result.totalSimple.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-primary">Compound Interest (Annually)</div>
                  <div className="text-2xl font-bold text-primary">${result.compound.toFixed(2)}</div>
                  <div className="text-sm text-primary/80 mt-1">Total: ${result.totalCompound.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function SavingsCalc() {
  const [initial, setInitial] = useState('1000');
  const [monthly, setMonthly] = useState('200');
  const [rate, setRate] = useState('5');
  const [years, setYears] = useState('10');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const p = parseFloat(initial);
    const pmt = parseFloat(monthly);
    const r = parseFloat(rate) / 100 / 12;
    const n = parseFloat(years) * 12;
    
    if (n > 0) {
      // Future value of initial principal
      const fv1 = p * Math.pow(1 + r, n);
      // Future value of series
      const fv2 = pmt * ((Math.pow(1 + r, n) - 1) / r);
      setResult(fv1 + fv2);
    }
  };

  return (
    <Shell>
      <ToolLayout title="Savings Calculator" description="See how your money grows over time." category="Calculators" categoryPath="/#calc">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Initial Deposit</Label><Input type="number" value={initial} onChange={e => setInitial(e.target.value)} /></div>
            <div><Label>Monthly Contribution</Label><Input type="number" value={monthly} onChange={e => setMonthly(e.target.value)} /></div>
            <div><Label>Annual Rate (%)</Label><Input type="number" value={rate} onChange={e => setRate(e.target.value)} /></div>
            <div><Label>Years to Grow</Label><Input type="number" value={years} onChange={e => setYears(e.target.value)} /></div>
          </div>
          <Button onClick={calculate} className="w-full">Calculate Future Value</Button>
          
          {result && (
            <div className="p-8 bg-card border rounded-xl text-center space-y-2">
              <div className="text-muted-foreground font-medium">Future Value</div>
              <div className="text-5xl font-black text-primary">${result.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function CurrencyCalc() {
  const rates: Record<string, number> = {
    USD: 1, EUR: 0.92, BRL: 5.05, GBP: 0.79, JPY: 151.3, CAD: 1.36, AUD: 1.52, CHF: 0.90
  };
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');

  const result = (parseFloat(amount) / rates[from]) * rates[to] || 0;

  return (
    <Shell>
      <ToolLayout title="Currency Converter" description="Quick illustrative currency conversions." category="Calculators" categoryPath="/#calc">
        <div className="max-w-md mx-auto space-y-6 bg-muted/30 p-6 rounded-xl border">
          <div><Label>Amount</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>From</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={from} onChange={e => setFrom(e.target.value)}>
                {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <Label>To</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={to} onChange={e => setTo(e.target.value)}>
                {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-4 border-t text-center">
            <div className="text-3xl font-bold text-foreground">
              {result.toFixed(2)} <span className="text-xl text-muted-foreground">{to}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Note: Exchange rates are illustrative and not real-time.</div>
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function SalaryCalc() {
  const [gross, setGross] = useState('75000');
  
  // Illustrative simple tax brackets
  const calculateNet = (g: number) => {
    let tax = 0;
    if (g > 100000) tax = g * 0.30;
    else if (g > 50000) tax = g * 0.22;
    else if (g > 20000) tax = g * 0.12;
    else tax = g * 0.05;
    return { tax, net: g - tax };
  };

  const { tax, net } = calculateNet(parseFloat(gross) || 0);

  return (
    <Shell>
      <ToolLayout title="Salary Calculator" description="Illustrative income tax estimator." category="Calculators" categoryPath="/#calc">
        <div className="max-w-md mx-auto space-y-6">
          <div>
            <Label>Annual Gross Salary ($)</Label>
            <Input type="number" value={gross} onChange={e => setGross(e.target.value)} className="text-lg py-6" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-muted rounded-md text-sm">
              <span className="text-muted-foreground">Estimated Tax</span>
              <span className="font-semibold text-destructive">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-4 bg-primary/10 border-primary/20 border rounded-md text-lg">
              <span className="font-medium text-primary">Estimated Net Salary</span>
              <span className="font-bold text-primary">${net.toFixed(2)}</span>
            </div>
            <p className="text-xs text-center text-muted-foreground pt-4">Taxes are highly localized. This tool uses a simplified illustrative tax bracket for demonstration.</p>
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function RoiCalc() {
  const [investment, setInvestment] = useState('10000');
  const [returned, setReturned] = useState('12500');
  const [years, setYears] = useState('2');

  const i = parseFloat(investment);
  const r = parseFloat(returned);
  const y = parseFloat(years);

  const roi = i > 0 ? ((r - i) / i) * 100 : 0;
  const annualized = (i > 0 && y > 0) ? (Math.pow(r / i, 1 / y) - 1) * 100 : 0;

  return (
    <Shell>
      <ToolLayout title="ROI Calculator" description="Calculate Return on Investment." category="Calculators" categoryPath="/#calc">
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-4">
            <div><Label>Amount Invested ($)</Label><Input type="number" value={investment} onChange={e => setInvestment(e.target.value)} /></div>
            <div><Label>Amount Returned ($)</Label><Input type="number" value={returned} onChange={e => setReturned(e.target.value)} /></div>
            <div><Label>Investment Length (Years)</Label><Input type="number" value={years} onChange={e => setYears(e.target.value)} /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Total ROI</div>
                <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{roi.toFixed(2)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground">Annualized ROI</div>
                <div className={`text-2xl font-bold ${annualized >= 0 ? 'text-green-600' : 'text-red-600'}`}>{annualized.toFixed(2)}%</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}
