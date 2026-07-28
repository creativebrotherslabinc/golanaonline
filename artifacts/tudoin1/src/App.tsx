import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Home } from '@/pages/Home';

// PDF Tools
import { 
  PdfMerger, PdfSplitter, PdfCompressor, PdfToDocx, 
  DocxToPdf, TxtToPdf, ImgToPdf, PdfToImg 
} from '@/pages/pdf-tools';

// Calculators
import { 
  MortgageCalc, LoanCalc, InterestCalc, SavingsCalc, 
  CurrencyCalc, SalaryCalc, RoiCalc 
} from '@/pages/calc-tools';

// Utilities
import { 
  QrTool, PasswordTool, UnitTool, AgeTool, BmiTool, 
  RandomTool, TextCaseTool, WordCountTool, TimerTool 
} from '@/pages/utils-tools';

// AI Tools
import { 
  Summarizer, Paraphraser, NameGen, ResumeAI, JokeGen, StoryGen 
} from '@/pages/ai-tools';

// Dev Tools
import { 
  JsonTool, Base64Tool, MinifierTool, RegexTool, ColorTool, TextDiffTool
} from '@/pages/dev-tools';

// Media Tools
import {
  ImageCompressor, ImageConverter, VideoCompressor, VideoToMp3, AudioCutter
} from '@/pages/media-tools';

// Extra Calc + Utils
import { PercentageCalc } from '@/pages/calc-tools';
import { DateDiffCalc } from '@/pages/utils-tools';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* PDF Routes */}
      <Route path="/pdf/merger" component={PdfMerger} />
      <Route path="/pdf/splitter" component={PdfSplitter} />
      <Route path="/pdf/compressor" component={PdfCompressor} />
      <Route path="/pdf/to-docx" component={PdfToDocx} />
      <Route path="/pdf/docx-to-pdf" component={DocxToPdf} />
      <Route path="/pdf/txt-to-pdf" component={TxtToPdf} />
      <Route path="/pdf/img-to-pdf" component={ImgToPdf} />
      <Route path="/pdf/to-img" component={PdfToImg} />

      {/* Calc Routes */}
      <Route path="/calc/mortgage" component={MortgageCalc} />
      <Route path="/calc/loan" component={LoanCalc} />
      <Route path="/calc/interest" component={InterestCalc} />
      <Route path="/calc/savings" component={SavingsCalc} />
      <Route path="/calc/currency" component={CurrencyCalc} />
      <Route path="/calc/salary" component={SalaryCalc} />
      <Route path="/calc/roi" component={RoiCalc} />

      {/* Utils Routes */}
      <Route path="/tools/qr" component={QrTool} />
      <Route path="/tools/password" component={PasswordTool} />
      <Route path="/tools/unit" component={UnitTool} />
      <Route path="/tools/age" component={AgeTool} />
      <Route path="/tools/bmi" component={BmiTool} />
      <Route path="/tools/random" component={RandomTool} />
      <Route path="/tools/textcase" component={TextCaseTool} />
      <Route path="/tools/wordcount" component={WordCountTool} />
      <Route path="/tools/timer" component={TimerTool} />

      {/* AI Routes */}
      <Route path="/ai/summarizer" component={Summarizer} />
      <Route path="/ai/paraphraser" component={Paraphraser} />
      <Route path="/ai/namegen" component={NameGen} />
      <Route path="/ai/resume" component={ResumeAI} />
      <Route path="/ai/jokes" component={JokeGen} />
      <Route path="/ai/story" component={StoryGen} />

      {/* Dev Routes */}
      <Route path="/dev/json" component={JsonTool} />
      <Route path="/dev/base64" component={Base64Tool} />
      <Route path="/dev/minifier" component={MinifierTool} />
      <Route path="/dev/regex" component={RegexTool} />
      <Route path="/dev/color" component={ColorTool} />
      <Route path="/dev/diff" component={TextDiffTool} />

      {/* Media Routes */}
      <Route path="/media/img-compressor" component={ImageCompressor} />
      <Route path="/media/img-converter" component={ImageConverter} />
      <Route path="/media/video-compressor" component={VideoCompressor} />
      <Route path="/media/video-to-mp3" component={VideoToMp3} />
      <Route path="/media/audio-cutter" component={AudioCutter} />

      {/* Extra Calc + Utils */}
      <Route path="/calc/percentage" component={PercentageCalc} />
      <Route path="/tools/datediff" component={DateDiffCalc} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
