import React, { useState, useEffect, useRef } from 'react';
import { Shell } from '@/components/layout/Shell';
import { ToolLayout } from '@/components/shared/ToolLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';

export function QrTool() {
  const [text, setText] = useState('https://golana.online');
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (text) {
      QRCode.toDataURL(text, { width: 300, margin: 2 }, (err, url) => {
        if (!err) setQrUrl(url);
      });
    } else {
      setQrUrl('');
    }
  }, [text]);

  return (
    <Shell>
      <ToolLayout title="QR Code Generator" description="Create a QR code from text or URL." category="Utilities" categoryPath="/#tools">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center max-w-3xl mx-auto">
          <div className="flex-1 w-full space-y-4">
            <Label>Content (URL or Text)</Label>
            <Textarea value={text} onChange={e => setText(e.target.value)} rows={4} className="resize-none" />
          </div>
          <div className="flex-shrink-0 flex flex-col items-center gap-4 p-6 border rounded-xl bg-muted/10">
            {qrUrl ? (
              <>
                <img src={qrUrl} alt="Generated QR Code" className="w-48 h-48 bg-white p-2 rounded-md shadow-sm" />
                <Button variant="outline" onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrUrl;
                  a.download = 'qrcode.png';
                  a.click();
                }}>Download PNG</Button>
              </>
            ) : (
              <div className="w-48 h-48 border-2 border-dashed flex items-center justify-center text-muted-foreground text-sm">No input</div>
            )}
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function PasswordTool() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true });
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const generate = () => {
    let chars = '';
    if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.numbers) chars += '0123456789';
    if (options.symbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    if (!chars) {
      setPassword('');
      return;
    }
    
    let pwd = '';
    for (let i = 0; i < length; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  useEffect(() => { generate(); }, [length, options]);

  return (
    <Shell>
      <ToolLayout title="Password Generator" description="Generate secure, random passwords." category="Utilities" categoryPath="/#tools">
        <div className="max-w-lg mx-auto space-y-8">
          <div className="relative">
            <Input value={password} readOnly className="text-xl font-mono text-center h-16 pr-24" />
            <Button size="sm" className="absolute right-2 top-3" onClick={() => {
              navigator.clipboard.writeText(password);
              toast({ title: "Copied to clipboard!" });
            }}>Copy</Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Length: {length}</Label>
              </div>
              <input type="range" min="8" max="64" value={length} onChange={e => setLength(parseInt(e.target.value))} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(options).map(([key, val]) => (
                <div key={key} className="flex items-center space-x-2 border p-3 rounded-md">
                  <Switch checked={val} onCheckedChange={(c) => setOptions({...options, [key]: c})} id={key} />
                  <Label htmlFor={key} className="capitalize cursor-pointer">{key}</Label>
                </div>
              ))}
            </div>
            <Button onClick={generate} variant="secondary" className="w-full">Generate New</Button>
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function UnitTool() {
  const [val, setVal] = useState('1');
  const v = parseFloat(val) || 0;

  return (
    <Shell>
      <ToolLayout title="Unit Converter" description="Convert between common measurements." category="Utilities" categoryPath="/#tools">
        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="length" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="length">Length</TabsTrigger>
              <TabsTrigger value="weight">Weight</TabsTrigger>
              <TabsTrigger value="temp">Temp</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
            </TabsList>
            <div className="mt-6 mb-8">
              <Label>Value to Convert</Label>
              <Input type="number" value={val} onChange={e => setVal(e.target.value)} className="text-lg h-12" />
            </div>
            <TabsContent value="length" className="space-y-4">
              <ConvertCard title="Meters (m) to Feet (ft)" v={v} mult={3.28084} />
              <ConvertCard title="Feet (ft) to Meters (m)" v={v} mult={0.3048} />
              <ConvertCard title="Kilometers (km) to Miles (mi)" v={v} mult={0.621371} />
              <ConvertCard title="Miles (mi) to Kilometers (km)" v={v} mult={1.60934} />
            </TabsContent>
            <TabsContent value="weight" className="space-y-4">
              <ConvertCard title="Kilograms (kg) to Pounds (lb)" v={v} mult={2.20462} />
              <ConvertCard title="Pounds (lb) to Kilograms (kg)" v={v} mult={0.453592} />
            </TabsContent>
            <TabsContent value="temp" className="space-y-4">
              <div className="flex justify-between p-4 border rounded-md items-center">
                <span className="font-medium">Celsius to Fahrenheit</span>
                <span className="text-xl font-bold bg-muted px-4 py-1 rounded-md">{((v * 9/5) + 32).toFixed(2)} °F</span>
              </div>
              <div className="flex justify-between p-4 border rounded-md items-center">
                <span className="font-medium">Fahrenheit to Celsius</span>
                <span className="text-xl font-bold bg-muted px-4 py-1 rounded-md">{((v - 32) * 5/9).toFixed(2)} °C</span>
              </div>
            </TabsContent>
            <TabsContent value="volume" className="space-y-4">
              <ConvertCard title="Liters (L) to Gallons (gal)" v={v} mult={0.264172} />
              <ConvertCard title="Gallons (gal) to Liters (L)" v={v} mult={3.78541} />
            </TabsContent>
          </Tabs>
        </div>
      </ToolLayout>
    </Shell>
  );
}

function ConvertCard({ title, v, mult }: { title: string, v: number, mult: number }) {
  return (
    <div className="flex justify-between p-4 border rounded-md items-center hover:bg-muted/30 transition-colors">
      <span className="font-medium text-muted-foreground">{title}</span>
      <span className="text-xl font-bold bg-muted px-4 py-1 rounded-md text-foreground">{(v * mult).toFixed(4)}</span>
    </div>
  );
}

export function AgeTool() {
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<any>(null);

  useEffect(() => {
    if (!dob) { setAge(null); return; }
    const birth = new Date(dob);
    const now = new Date();
    if (birth > now) return;
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    
    if (days < 0) {
      months -= 1;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    setAge({ years, months, days });
  }, [dob]);

  return (
    <Shell>
      <ToolLayout title="Age Calculator" description="Calculate exact age from date of birth." category="Utilities" categoryPath="/#tools">
        <div className="max-w-md mx-auto space-y-8">
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={dob} onChange={e => setDob(e.target.value)} className="mt-2" />
          </div>
          {age && (
            <div className="text-center space-y-4 p-8 bg-primary/5 rounded-xl border border-primary/20">
              <div className="text-sm text-primary font-medium uppercase tracking-wider">You are exactly</div>
              <div className="text-5xl font-black text-foreground">
                {age.years} <span className="text-xl text-muted-foreground font-normal">years</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {age.months} <span className="text-lg text-muted-foreground font-normal">months</span> {age.days} <span className="text-lg text-muted-foreground font-normal">days</span>
              </div>
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function BmiTool() {
  const [cm, setCm] = useState('175');
  const [kg, setKg] = useState('70');

  const h = parseFloat(cm) / 100;
  const w = parseFloat(kg);
  const bmi = h > 0 && w > 0 ? w / (h * h) : 0;
  
  let cat = 'Underweight', color = 'text-blue-500';
  if (bmi >= 18.5 && bmi < 25) { cat = 'Normal Weight'; color = 'text-green-500'; }
  else if (bmi >= 25 && bmi < 30) { cat = 'Overweight'; color = 'text-yellow-500'; }
  else if (bmi >= 30) { cat = 'Obese'; color = 'text-red-500'; }

  return (
    <Shell>
      <ToolLayout title="BMI Calculator" description="Calculate your Body Mass Index." category="Utilities" categoryPath="/#tools">
        <div className="max-w-md mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Height (cm)</Label><Input type="number" value={cm} onChange={e => setCm(e.target.value)} /></div>
            <div><Label>Weight (kg)</Label><Input type="number" value={kg} onChange={e => setKg(e.target.value)} /></div>
          </div>
          {bmi > 0 && (
            <div className="p-6 border rounded-xl text-center space-y-2 bg-card shadow-sm">
              <div className="text-muted-foreground">Your BMI</div>
              <div className="text-6xl font-black tracking-tighter">{bmi.toFixed(1)}</div>
              <div className={`text-xl font-bold uppercase ${color}`}>{cat}</div>
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function RandomTool() {
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [count, setCount] = useState('1');
  const [unique, setUnique] = useState(false);
  const [result, setResult] = useState<number[]>([]);

  const generate = () => {
    let m1 = parseInt(min), m2 = parseInt(max), c = parseInt(count);
    if (m1 > m2) [m1, m2] = [m2, m1];
    
    if (unique && c > (m2 - m1 + 1)) {
      alert("Cannot generate more unique numbers than the range allows.");
      return;
    }

    const nums: number[] = [];
    while (nums.length < c) {
      const r = Math.floor(Math.random() * (m2 - m1 + 1)) + m1;
      if (unique && nums.includes(r)) continue;
      nums.push(r);
    }
    setResult(nums);
  };

  return (
    <Shell>
      <ToolLayout title="Random Number Generator" description="Generate random numbers easily." category="Utilities" categoryPath="/#tools">
        <div className="max-w-md mx-auto space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Min</Label><Input type="number" value={min} onChange={e => setMin(e.target.value)} /></div>
            <div><Label>Max</Label><Input type="number" value={max} onChange={e => setMax(e.target.value)} /></div>
            <div><Label>Count</Label><Input type="number" value={count} onChange={e => setCount(e.target.value)} /></div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={unique} onCheckedChange={setUnique} id="uniq" />
            <Label htmlFor="uniq">No Duplicates</Label>
          </div>
          <Button onClick={generate} className="w-full">Generate</Button>
          
          {result.length > 0 && (
            <div className="p-4 border rounded-md bg-muted/30 font-mono text-lg text-center break-words">
              {result.join(', ')}
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function TextCaseTool() {
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog.');
  
  const conversions = {
    'UPPERCASE': text.toUpperCase(),
    'lowercase': text.toLowerCase(),
    'Title Case': text.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase()),
    'Sentence case': text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
    'camelCase': text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, ''),
    'snake_case': text.toLowerCase().replace(/\s+/g, '_'),
    'kebab-case': text.toLowerCase().replace(/\s+/g, '-')
  };

  return (
    <Shell>
      <ToolLayout title="Text Case Converter" description="Change the capitalization of your text instantly." category="Utilities" categoryPath="/#tools">
        <div className="space-y-6 max-w-4xl mx-auto">
          <Textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Type here..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(conversions).map(([label, val]) => (
              <div key={label} className="border p-4 rounded-xl hover:border-primary/50 transition-colors">
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{label}</div>
                <div className="font-mono text-sm break-all">{val || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function WordCountTool() {
  const [text, setText] = useState('');
  
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s+/g, '').length;
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;
  const readTime = Math.ceil(words / 200);

  return (
    <Shell>
      <ToolLayout title="Word Counter" description="Count words, characters, and reading time." category="Utilities" categoryPath="/#tools">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { l: 'Words', v: words },
              { l: 'Characters', v: chars },
              { l: 'No Spaces', v: charsNoSpaces },
              { l: 'Paragraphs', v: paragraphs },
              { l: 'Read Time', v: `${readTime}m` }
            ].map(s => (
              <div key={s.l} className="bg-primary/5 border border-primary/10 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-primary">{s.v}</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold mt-1">{s.l}</div>
              </div>
            ))}
          </div>
          <Textarea 
            value={text} 
            onChange={e => setText(e.target.value)} 
            rows={12} 
            className="text-lg leading-relaxed p-4" 
            placeholder="Start typing or paste your document here..." 
          />
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function TimerTool() {
  // Simple stopwatch
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<any>(null);

  const toggle = () => {
    if (running) {
      clearInterval(timerRef.current);
      setRunning(false);
    } else {
      setRunning(true);
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    }
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setRunning(false);
    setTime(0);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <Shell>
      <ToolLayout title="Timer & Stopwatch" description="Simple tracking for your tasks." category="Utilities" categoryPath="/#tools">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="text-8xl font-mono font-light tracking-tight mb-12 tabular-nums">
            {formatTime(time)}
          </div>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={toggle} variant={running ? "destructive" : "default"} className="w-32">
              {running ? "Stop" : "Start"}
            </Button>
            <Button size="lg" onClick={reset} variant="outline" className="w-32">
              Reset
            </Button>
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}
