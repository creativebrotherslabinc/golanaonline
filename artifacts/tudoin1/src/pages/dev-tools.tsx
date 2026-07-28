import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { ToolLayout } from '@/components/shared/ToolLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export function JsonTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const format = () => {
    try {
      setOutput(JSON.stringify(JSON.parse(input), null, 2));
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const minify = () => {
    try {
      setOutput(JSON.stringify(JSON.parse(input)));
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Shell>
      <ToolLayout title="JSON Formatter & Validator" description="Format, minify, and validate JSON data." category="Developer Tools" categoryPath="/#dev">
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <div className="space-y-4">
            <Label>Input JSON</Label>
            <Textarea value={input} onChange={e => setInput(e.target.value)} className="font-mono h-[400px]" placeholder='{"key": "value"}' />
            <div className="flex gap-2">
              <Button onClick={format} className="flex-1">Format</Button>
              <Button onClick={minify} variant="secondary" className="flex-1">Minify</Button>
            </div>
          </div>
          <div className="space-y-4">
            <Label className="flex justify-between">
              <span>Output</span>
              {error ? <span className="text-destructive font-bold">Invalid JSON</span> : <span className="text-green-500 font-bold">Valid</span>}
            </Label>
            <Textarea value={error ? error : output} readOnly className={`font-mono h-[400px] ${error ? 'border-destructive text-destructive' : ''}`} />
            <Button onClick={() => { navigator.clipboard.writeText(output); toast({ title: "Copied!" })}} variant="outline" className="w-full" disabled={!!error || !output}>
              Copy Output
            </Button>
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function Base64Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const encode = () => setOutput(btoa(input));
  const decode = () => {
    try { setOutput(atob(input)); } catch { setOutput("Error: Invalid Base64 string"); }
  };

  return (
    <Shell>
      <ToolLayout title="Base64 Encoder/Decoder" description="Encode or decode strings via Base64." category="Developer Tools" categoryPath="/#dev">
        <div className="space-y-6 max-w-4xl mx-auto">
          <Textarea value={input} onChange={e => setInput(e.target.value)} rows={6} placeholder="Type text to encode or base64 to decode..." />
          <div className="flex gap-4">
            <Button onClick={encode} className="flex-1">Encode Base64</Button>
            <Button onClick={decode} variant="secondary" className="flex-1">Decode Base64</Button>
          </div>
          <Textarea value={output} readOnly rows={6} className="bg-muted font-mono" />
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function MinifierTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  // Very naive minifiers
  const minifyHtml = () => setOutput(input.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim());
  const minifyCss = () => setOutput(input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{:;,])\s*/g, '$1').trim());
  const minifyJs = () => setOutput(input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim());

  return (
    <Shell>
      <ToolLayout title="Code Minifier" description="Basic HTML/CSS/JS minifier." category="Developer Tools" categoryPath="/#dev">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="css" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="css">CSS</TabsTrigger>
              <TabsTrigger value="js">JS</TabsTrigger>
            </TabsList>
            
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <Textarea value={input} onChange={e => setInput(e.target.value)} className="font-mono h-[300px]" placeholder="Paste code here..." />
                <TabsContent value="html" className="mt-0"><Button onClick={minifyHtml} className="w-full">Minify HTML</Button></TabsContent>
                <TabsContent value="css" className="mt-0"><Button onClick={minifyCss} className="w-full">Minify CSS</Button></TabsContent>
                <TabsContent value="js" className="mt-0"><Button onClick={minifyJs} className="w-full">Minify JS</Button></TabsContent>
              </div>
              <Textarea value={output} readOnly className="font-mono h-[300px] bg-muted" />
            </div>
          </Tabs>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function RegexTool() {
  const [pattern, setPattern] = useState('[A-Z]\\w+');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('The Quick Brown Fox Jumps Over The Lazy Dog.');
  const [matches, setMatches] = useState<string[]>([]);
  const [error, setError] = useState('');

  React.useEffect(() => {
    try {
      const re = new RegExp(pattern, flags);
      const m = text.match(re);
      setMatches(m || []);
      setError('');
    } catch (e: any) {
      setError(e.message);
      setMatches([]);
    }
  }, [pattern, flags, text]);

  return (
    <Shell>
      <ToolLayout title="Regex Tester" description="Test regular expressions in JS format." category="Developer Tools" categoryPath="/#dev">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border rounded-md px-3 bg-card font-mono focus-within:ring-2 ring-primary">
              <span className="text-muted-foreground mr-1">/</span>
              <input value={pattern} onChange={e => setPattern(e.target.value)} className="w-full outline-none bg-transparent py-2" />
              <span className="text-muted-foreground ml-1">/</span>
            </div>
            <Input value={flags} onChange={e => setFlags(e.target.value)} className="w-20 font-mono" placeholder="flags" />
          </div>
          {error && <div className="text-destructive text-sm font-mono">{error}</div>}
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Test String</Label>
              <Textarea value={text} onChange={e => setText(e.target.value)} className="h-[200px] mt-2" />
            </div>
            <div className="border rounded-md p-4 bg-muted/30 overflow-auto h-[200px]">
              <Label className="mb-4 block">Matches ({matches.length})</Label>
              {matches.length > 0 ? (
                <ul className="space-y-2 font-mono text-sm">
                  {matches.map((m, i) => <li key={i} className="bg-primary/10 text-primary px-2 py-1 rounded">Match {i+1}: {m}</li>)}
                </ul>
              ) : (
                <div className="text-muted-foreground text-sm italic">No matches found.</div>
              )}
            </div>
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function ColorTool() {
  const [hex, setHex] = useState('#3B82F6');

  return (
    <Shell>
      <ToolLayout title="Color Picker & Converter" description="Select colors and get HEX/RGB values." category="Developer Tools" categoryPath="/#dev">
        <div className="max-w-md mx-auto space-y-8 flex flex-col items-center">
          <div 
            className="w-full h-48 rounded-xl shadow-inner border"
            style={{ backgroundColor: hex }}
          />
          <div className="w-full space-y-4">
            <div>
              <Label>Color Picker</Label>
              <input 
                type="color" 
                value={hex} 
                onChange={e => setHex(e.target.value)}
                className="w-full h-14 cursor-pointer mt-2"
              />
            </div>
            <div>
              <Label>HEX Value</Label>
              <div className="flex gap-2 mt-2">
                <Input value={hex.toUpperCase()} readOnly className="font-mono text-lg font-bold" />
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(hex.toUpperCase())}>Copy</Button>
              </div>
            </div>
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}
