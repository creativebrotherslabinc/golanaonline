import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { ToolLayout } from '@/components/shared/ToolLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up pdf.js worker via unpkg to avoid vite worker setup headaches
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Helper for downloading files
const downloadFile = (data: Uint8Array | string | Blob, filename: string, type: string) => {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export function PdfMerger() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({ title: "Error", description: "Please upload at least 2 PDF files.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedPdfFile = await mergedPdf.save();
      downloadFile(mergedPdfFile, "merged.pdf", "application/pdf");
      toast({ title: "Success", description: "PDFs merged successfully!" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to merge PDFs.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <Shell>
      <ToolLayout title="PDF Merger" description="Combine multiple PDF files into one." category="PDF Tools" categoryPath="/#pdf">
        <div className="space-y-6 max-w-lg mx-auto">
          <div>
            <Label>Upload PDF Files</Label>
            <Input type="file" accept=".pdf" multiple onChange={e => setFiles(Array.from(e.target.files || []))} className="mt-2" />
          </div>
          {files.length > 0 && (
            <ul className="text-sm space-y-1 bg-muted p-4 rounded-md">
              {files.map((f, i) => <li key={i}>{i + 1}. {f.name}</li>)}
            </ul>
          )}
          <Button onClick={handleMerge} disabled={isProcessing || files.length < 2} className="w-full">
            {isProcessing ? "Merging..." : "Merge PDFs"}
          </Button>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [range, setRange] = useState("1-2");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      const totalPages = pdf.getPageCount();
      const [startStr, endStr] = range.split("-");
      const start = Math.max(1, parseInt(startStr) || 1);
      const end = Math.min(totalPages, parseInt(endStr) || totalPages);

      if (start > end || start > totalPages) throw new Error("Invalid range");

      // getPageIndices is 0-based
      const indicesToCopy = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
      const copiedPages = await newPdf.copyPages(pdf, indicesToCopy);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const savedPdf = await newPdf.save();
      downloadFile(savedPdf, `split_${start}-${end}.pdf`, "application/pdf");
      toast({ title: "Success", description: "PDF split successfully!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to split PDF.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <Shell>
      <ToolLayout title="PDF Splitter" description="Extract specific pages from a PDF." category="PDF Tools" categoryPath="/#pdf">
        <div className="space-y-6 max-w-lg mx-auto">
          <div>
            <Label>Upload PDF</Label>
            <Input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2" />
          </div>
          <div>
            <Label>Page Range (e.g. 1-3)</Label>
            <Input placeholder="1-3" value={range} onChange={e => setRange(e.target.value)} className="mt-2" />
          </div>
          <Button onClick={handleSplit} disabled={isProcessing || !file} className="w-full">
            {isProcessing ? "Splitting..." : "Split PDF"}
          </Button>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    // Note: True compression requires a backend like Ghostscript. We will just rewrite the PDF with pdf-lib which strips some metadata and unreferenced objects.
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const savedPdf = await pdf.save({ useObjectStreams: false }); // simple re-save
      downloadFile(savedPdf, `compressed_${file.name}`, "application/pdf");
      toast({ title: "Note", description: "True deep compression requires a server. File re-exported with basic optimization." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to process.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <Shell>
      <ToolLayout title="PDF Compressor" description="Basic PDF optimization (browser-only)." category="PDF Tools" categoryPath="/#pdf">
        <div className="space-y-6 max-w-lg mx-auto">
          <div>
            <Label>Upload PDF</Label>
            <Input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2" />
          </div>
          <Button onClick={handleCompress} disabled={isProcessing || !file} className="w-full">
            {isProcessing ? "Compressing..." : "Compress PDF"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Browser-based compression only performs structural optimizations. For significant size reduction, server-side tools are usually required.
          </p>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function PdfToDocx() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
      }
      downloadFile(text, `${file.name}.txt`, "text/plain");
      toast({ title: "Success", description: "Text extracted! Saved as .txt (Browser limitation)." });
    } catch (e) {
      toast({ title: "Error", description: "Extraction failed.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <Shell>
      <ToolLayout title="PDF to DOCX (Text)" description="Extract text from a PDF." category="PDF Tools" categoryPath="/#pdf">
        <div className="space-y-6 max-w-lg mx-auto">
          <div>
            <Label>Upload PDF</Label>
            <Input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2" />
          </div>
          <Button onClick={handleConvert} disabled={isProcessing || !file} className="w-full">
            {isProcessing ? "Extracting..." : "Extract Text"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Due to browser limits, true DOCX generation isn't possible here. We extract the raw text and provide a .txt download.
          </p>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function DocxToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      const pdf = await PDFDocument.create();
      let page = pdf.addPage();
      const { width, height } = page.getSize();
      
      // Super naive text wrapping for PDF
      const fontSize = 12;
      const margin = 50;
      let y = height - margin;
      
      const lines = result.value.split('\n');
      for (const line of lines) {
        if (y < margin) {
          page = pdf.addPage();
          y = height - margin;
        }
        page.drawText(line.substring(0, 80), { x: margin, y, size: fontSize });
        y -= fontSize * 1.5;
      }
      
      const savedPdf = await pdf.save();
      downloadFile(savedPdf, `${file.name}.pdf`, "application/pdf");
      toast({ title: "Success", description: "Simple text PDF created." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to convert.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <Shell>
      <ToolLayout title="DOCX to PDF" description="Convert DOCX text to PDF." category="PDF Tools" categoryPath="/#pdf">
        <div className="space-y-6 max-w-lg mx-auto">
          <div>
            <Label>Upload DOCX</Label>
            <Input type="file" accept=".docx" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2" />
          </div>
          <Button onClick={handleConvert} disabled={isProcessing || !file} className="w-full">
            {isProcessing ? "Converting..." : "Convert to PDF"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Extracts raw text only (no formatting/images) and places it into a basic PDF.
          </p>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function TxtToPdf() {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const pdf = await PDFDocument.create();
      let page = pdf.addPage();
      const { width, height } = page.getSize();
      const fontSize = 12;
      const margin = 40;
      let y = height - margin;
      
      const lines = text.split('\n');
      for (const line of lines) {
        if (y < margin) {
          page = pdf.addPage();
          y = height - margin;
        }
        page.drawText(line.substring(0, 90), { x: margin, y, size: fontSize });
        y -= fontSize * 1.5;
      }
      
      const savedPdf = await pdf.save();
      downloadFile(savedPdf, "document.pdf", "application/pdf");
      toast({ title: "Success", description: "PDF generated successfully!" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <Shell>
      <ToolLayout title="TXT to PDF" description="Create a PDF from raw text." category="PDF Tools" categoryPath="/#pdf">
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <Label>Paste Text</Label>
            <Textarea 
              className="mt-2 min-h-[300px]" 
              placeholder="Enter your text here..." 
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerate} disabled={isProcessing || !text.trim()} className="w-full">
            {isProcessing ? "Generating..." : "Generate PDF"}
          </Button>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function ImgToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const pdf = await PDFDocument.create();
      
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdf.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
          image = await pdf.embedPng(arrayBuffer);
        } else {
          continue;
        }
        
        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      
      const savedPdf = await pdf.save();
      downloadFile(savedPdf, "images.pdf", "application/pdf");
      toast({ title: "Success", description: "Images converted to PDF!" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to convert images.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <Shell>
      <ToolLayout title="Images to PDF" description="Convert JPG/PNG images into a single PDF." category="PDF Tools" categoryPath="/#pdf">
        <div className="space-y-6 max-w-lg mx-auto">
          <div>
            <Label>Upload Images (JPG, PNG)</Label>
            <Input type="file" accept="image/jpeg, image/png" multiple onChange={e => setFiles(Array.from(e.target.files || []))} className="mt-2" />
          </div>
          {files.length > 0 && (
            <div className="text-sm text-muted-foreground">{files.length} images selected</div>
          )}
          <Button onClick={handleConvert} disabled={isProcessing || files.length === 0} className="w-full">
            {isProcessing ? "Converting..." : "Convert to PDF"}
          </Button>
        </div>
      </ToolLayout>
    </Shell>
  );
}

export function PdfToImg() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Just extract the first page to keep it simple for the user
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error("No canvas context");
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      canvas.toBlob((blob) => {
        if (blob) downloadFile(blob, `${file.name}_page1.png`, "image/png");
      }, 'image/png');
      
      toast({ title: "Success", description: "First page converted to PNG!" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to convert.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <Shell>
      <ToolLayout title="PDF to Images" description="Convert the first page of a PDF to PNG." category="PDF Tools" categoryPath="/#pdf">
        <div className="space-y-6 max-w-lg mx-auto">
          <div>
            <Label>Upload PDF</Label>
            <Input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2" />
          </div>
          <Button onClick={handleConvert} disabled={isProcessing || !file} className="w-full">
            {isProcessing ? "Converting..." : "Convert First Page to PNG"}
          </Button>
        </div>
      </ToolLayout>
    </Shell>
  );
}
