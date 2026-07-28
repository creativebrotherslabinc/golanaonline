import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { ToolLayout } from '@/components/shared/ToolLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// MOCK AI HELPERS
const mockSummarize = (text: string) => {
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.slice(0, 2).join(' ') + " (In summary: This text discusses " + text.split(' ').slice(0, 5).join(' ') + "...)";
};

const mockParaphrase = (text: string) => {
  return text.split(' ').map(w => {
    if (w.toLowerCase() === 'good') return 'excellent';
    if (w.toLowerCase() === 'bad') return 'poor';
    if (w.toLowerCase() === 'happy') return 'joyful';
    if (w.toLowerCase() === 'sad') return 'sorrowful';
    return w;
  }).join(' ');
};

const mockNames = (keyword: string) => {
  const prefixes = ['Aero', 'Nova', 'Syn', 'Omni', 'Velo', 'Quantum'];
  const suffixes = ['Flow', 'Sync', 'Base', 'Sphere', 'Logic', 'Shift'];
  return Array.from({length: 5}).map(() => 
    prefixes[Math.floor(Math.random()*prefixes.length)] + 
    (keyword ? keyword.charAt(0).toUpperCase() + keyword.slice(1) : '') + 
    suffixes[Math.floor(Math.random()*suffixes.length)]
  );
};

const jokesList = {
  Programming: ["Why do programmers prefer dark mode? Because light attracts bugs.", "I've got a great UDP joke but I'm not sure you'd get it.", "There are 10 types of people in the world: those who understand binary, and those who don't."],
  Dad: ["Hi Hungry, I'm Dad.", "I only know 25 letters of the alphabet. I don't know y.", "Why did the scarecrow win an award? Because he was outstanding in his field."],
  General: ["Parallel lines have so much in common. It’s a shame they’ll never meet.", "I told my doctor that I broke my arm in two places. He told me to stop going to those places.", "Why don't skeletons fight each other? They don't have the guts."]
};

export function Summarizer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const process = () => {
    setLoading(true);
    setTimeout(() => { setResult(mockSummarize(text)); setLoading(false); }, 800);
  };

  return (
    <Shell>
      <ToolLayout title="AI Text Summarizer" description="Mock AI summarization tool." category="AI Tools" categoryPath="/#ai">
        <div className="space-y-6 max-w-4xl mx-auto">
          <Textarea placeholder="Paste long text here..." value={text} onChange={e => setText(e.target.value)} rows={6} />
          <Button onClick={process} disabled={!text || loading} className="w-full">
            {loading ? "Analyzing..." : "Summarize Text"}
          </Button>
          {result && (
            <div className="p-4 bg-muted/50 rounded-xl border border-primary/20">
              <Label className="text-primary mb-2 block">AI Summary:</Label>
              <p className="text-foreground leading-relaxed">{result}</p>
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function Paraphraser() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');

  const process = () => setResult(mockParaphrase(text));

  return (
    <Shell>
      <ToolLayout title="AI Paraphraser" description="Rewrite text with synonyms (Mock demo)." category="AI Tools" categoryPath="/#ai">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div>
            <Label className="mb-2 block">Original Text</Label>
            <Textarea value={text} onChange={e => setText(e.target.value)} rows={8} placeholder="Type something good..." />
            <Button onClick={process} className="w-full mt-4">Paraphrase</Button>
          </div>
          <div>
            <Label className="mb-2 block">Paraphrased Result</Label>
            <Textarea value={result} readOnly rows={8} className="bg-muted" />
          </div>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function NameGen() {
  const [keyword, setKeyword] = useState('');
  const [names, setNames] = useState<string[]>([]);

  const generate = () => setNames(mockNames(keyword));

  return (
    <Shell>
      <ToolLayout title="AI Name Generator" description="Generate startup and business names." category="AI Tools" categoryPath="/#ai">
        <div className="max-w-md mx-auto space-y-6">
          <Input placeholder="Enter a keyword (e.g. Cloud, Data)" value={keyword} onChange={e => setKeyword(e.target.value)} className="text-center text-lg h-14" />
          <Button onClick={generate} size="lg" className="w-full">Generate Names</Button>
          
          {names.length > 0 && (
            <div className="space-y-3 mt-8">
              {names.map((n, i) => (
                <div key={i} className="p-4 text-center font-bold text-xl border rounded-lg hover:border-primary cursor-default hover:text-primary transition-colors">
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function ResumeAI() {
  const [role, setRole] = useState('');
  const [task, setTask] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);

  const generate = () => {
    setBullets([
      `Spearheaded ${task.toLowerCase() || 'projects'} resulting in 40% increased efficiency for the ${role || 'team'} department.`,
      `Engineered scalable solutions for ${task.toLowerCase() || 'workflows'} that reduced operational overhead by 25%.`,
      `Collaborated cross-functionally as a ${role || 'professional'} to deliver ${task.toLowerCase() || 'milestones'} ahead of schedule.`
    ]);
  };

  return (
    <Shell>
      <ToolLayout title="AI Resume Bullets" description="Generate action-verb bullet points." category="AI Tools" categoryPath="/#ai">
        <div className="max-w-xl mx-auto space-y-6">
          <div><Label>Job Title</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Software Engineer" /></div>
          <div><Label>Core Task/Responsibility</Label><Input value={task} onChange={e => setTask(e.target.value)} placeholder="e.g. Built API endpoints" /></div>
          <Button onClick={generate} className="w-full">Generate Bullets</Button>
          
          {bullets.length > 0 && (
            <ul className="space-y-4 pt-4">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-3 items-start p-4 bg-muted/30 border rounded-md">
                  <div className="text-primary mt-1">•</div>
                  <div>{b}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function JokeGen() {
  const [cat, setCat] = useState<keyof typeof jokesList>('Programming');
  const [joke, setJoke] = useState('');

  const generate = () => {
    const list = jokesList[cat];
    setJoke(list[Math.floor(Math.random() * list.length)]);
  };

  return (
    <Shell>
      <ToolLayout title="AI Joke Generator" description="Lighten the mood with a quick joke." category="AI Tools" categoryPath="/#ai">
        <div className="max-w-md mx-auto text-center space-y-8 py-8">
          <div className="flex justify-center gap-2">
            {Object.keys(jokesList).map(c => (
              <Button key={c} variant={cat === c ? "default" : "outline"} onClick={() => setCat(c as any)}>{c}</Button>
            ))}
          </div>
          <Button size="lg" onClick={generate} className="w-full">Tell me a joke</Button>
          {joke && (
            <div className="p-8 text-2xl font-serif italic bg-card border rounded-xl shadow-sm leading-relaxed">
              "{joke}"
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function StoryGen() {
  const [genre, setGenre] = useState('Sci-Fi');
  const [char, setChar] = useState('');
  const [story, setStory] = useState('');

  const generate = () => {
    const name = char || 'Alex';
    if (genre === 'Sci-Fi') setStory(`In the neon-drenched streets of Neo-Tokyo, ${name} adjusted their cybernetic arm. The mainframe was heavily guarded, but ${name} had a codebreaker that could slice through quantum encryption like butter. It was time to initiate the sequence.`);
    else if (genre === 'Fantasy') setStory(`The ancient dragon scales shimmered under the moonlight as ${name} approached the cavern. Holding the Staff of Aethelgard, ${name} whispered the forgotten incantation, and the stone doors began to grind open.`);
    else setStory(`It was a quiet Tuesday when ${name} noticed the peculiar envelope on the desk. No stamp, no return address. Just a wax seal bearing an insignia ${name} hadn't seen since the incident in Paris ten years ago.`);
  };

  return (
    <Shell>
      <ToolLayout title="AI Story Generator" description="A mock micro-story generator." category="AI Tools" categoryPath="/#ai">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Genre</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={genre} onChange={e => setGenre(e.target.value)}>
                <option>Sci-Fi</option><option>Fantasy</option><option>Mystery</option>
              </select>
            </div>
            <div>
              <Label>Character Name</Label>
              <Input value={char} onChange={e => setChar(e.target.value)} placeholder="e.g. Ripley" />
            </div>
          </div>
          <Button onClick={generate} className="w-full">Write Story</Button>
          
          {story && (
            <div className="p-6 bg-muted rounded-xl leading-loose font-serif text-lg border">
              {story}
            </div>
          )}
        </div>
      </ToolLayout>
    </Shell>
  );
}
