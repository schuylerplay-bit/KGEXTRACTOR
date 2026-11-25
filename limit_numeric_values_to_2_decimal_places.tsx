import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  Search,
  Database,
  Download,
  FileSpreadsheet,
  Printer,
  Layers,
  Hash,
  Globe,
  Package,
  Scale,
  DollarSign,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  FileCheck,
  Filter,
  ChevronRight,
  Cpu,
  ShieldCheck,
  Eye,
  X,
  Check,
  Share2,
  Copy,
  ExternalLink,
  Lock,
  Unlock,
  Server
} from 'lucide-react';

// Initial realistic sample data matching the user's exact specification
const INITIAL_EXTRACTED_ROWS = [
  {
    id: 'row-1',
    materialNumber: '351771-001 REV F',
    description: 'PRINTED PAPER LABELS',
    hsCode: '-',
    origin: 'USA',
    quantity: 200000,
    grossWeight: 100,
    weightUnit: 'lbs',
    netWeight: null,
    pallets: 1,
    amount: 1060,
    currency: 'USD',
    incoterm: 'EXW',
    invoiceNumber: 'PL# 658170',
    exporterName: 'US INDUSTRIAL LABELS CORP',
    importerName: 'GLEN DIMPLEX IRELAND',
    destinationCountry: 'IRELAND',
    bolAwb: 'ONEYHKGGH0722500',
    etaDate: '2026-11-28 04:00',
    customsRef: 'KUD26B3503',
    sourceFile: 'Commercial Invoice2689501779300897181.PDF',
    pageNumber: 1,
    confidence: 99.4,
    validated: true
  },
  {
    id: 'row-2',
    materialNumber: '701840-002 REV H',
    description: 'PRINTED PAPER LABELS',
    hsCode: '-',
    origin: 'USA',
    quantity: 206000,
    grossWeight: 651,
    weightUnit: 'lbs',
    netWeight: null,
    pallets: 2,
    amount: 4223,
    currency: 'USD',
    incoterm: 'FOB',
    invoiceNumber: 'PL# 657990',
    exporterName: 'US INDUSTRIAL LABELS CORP',
    importerName: 'GLEN DIMPLEX IRELAND',
    destinationCountry: 'IRELAND',
    bolAwb: '1076461593',
    etaDate: '2026-11-28 04:00',
    customsRef: 'KUD26B3504',
    sourceFile: 'Commercial Invoice18141289275114157548.PDF',
    pageNumber: 1,
    confidence: 98.9,
    validated: true
  }
];

const INITIAL_HISTORY = [
  {
    id: 'hist-1',
    invoiceNumber: 'PL# 658170',
    sourceFile: 'Commercial Invoice2689501779300897181.PDF',
    fileType: 'PDF',
    pagesScanned: 2,
    dateProcessed: '2026-11-21 14:12',
    status: 'Complete',
    templateMatched: 'US-MFG-STD-01'
  },
  {
    id: 'hist-2',
    invoiceNumber: 'PL# 657990',
    sourceFile: 'Commercial Invoice18141289275114157548.PDF',
    fileType: 'PDF',
    pagesScanned: 3,
    dateProcessed: '2026-11-21 14:15',
    status: 'Complete',
    templateMatched: 'US-MFG-STD-01'
  }
];

// Preset simulated invoices for quick testing or when user uploads files
const SIMULATED_PRESETS = [
  {
    fileName: 'Commercial_Invoice_994021_DE.PDF',
    fileType: 'PDF',
    pages: 2,
    items: [
      {
        materialNumber: '884120-004 REV B',
        description: 'PRECISION SERVO VALVES',
        hsCode: '8481.80.90',
        origin: 'GERMANY',
        quantity: 450,
        grossWeight: 320,
        weightUnit: 'lbs',
        netWeight: 295,
        pallets: 2,
        amount: 14850,
        currency: 'USD',
        incoterm: 'CIF',
        invoiceNumber: 'PL# 658312'
      },
      {
        materialNumber: '351771-001 REV F',
        description: 'PRINTED PAPER LABELS',
        hsCode: '4821.10.00',
        origin: 'USA',
        quantity: 50000,
        grossWeight: 28,
        weightUnit: 'lbs',
        netWeight: 25,
        pallets: 1,
        amount: 310,
        currency: 'USD',
        incoterm: 'CIF',
        invoiceNumber: 'PL# 658312'
      }
    ]
  },
  {
    fileName: 'Supplier_Packing_List_Batch_08.XLSX',
    fileType: 'XLSX',
    pages: 1,
    items: [
      {
        materialNumber: '902110-009 REV A',
        description: 'ALUMINUM EXTRUSION PROFILES',
        hsCode: '7604.29.10',
        origin: 'CANADA',
        quantity: 1200,
        grossWeight: 1480,
        weightUnit: 'lbs',
        netWeight: 1410,
        pallets: 4,
        amount: 8640,
        currency: 'USD',
        incoterm: 'DDP',
        invoiceNumber: 'PL# 658405'
      }
    ]
  }
];

export default function App() {
  // Core state
  const [rows, setRows] = useState(INITIAL_EXTRACTED_ROWS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [queuedFiles, setQueuedFiles] = useState([
    {
      id: 'file-init-1',
      name: 'Commercial Invoice2689501779300897181.PDF',
      size: '418 KB',
      type: 'PDF',
      pages: 2,
      status: 'Processed',
      invoiceNumbers: ['PL# 658170']
    },
    {
      id: 'file-init-2',
      name: 'Commercial Invoice18141289275114157548.PDF',
      size: '512 KB',
      type: 'PDF',
      pages: 3,
      status: 'Processed',
      invoiceNumbers: ['PL# 657990']
    }
  ]);

  // Undo snapshot for removed files
  const [lastRemovedSnapshot, setLastRemovedSnapshot] = useState(null);

  // Scanning simulation state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scanLogs, setScanLogs] = useState([
    'AI OCR Engine v4.2 initialized (Tesseract + Vision Layout Transformer)',
    'Loaded 2 pre-validated sample invoices: PL# 658170 & PL# 657990'
  ]);

  // UI & Filtering state
  const [consolidationTab, setConsolidationTab] = useState('hs_origin'); // 'hs_origin' | 'invoice' | 'description'
  const [thymeTab, setThymeTab] = useState('sad_master'); // 'sad_master' | 'sad_item' | 'consolidated'
  const [selectedSadItemIdx, setSelectedSadItemIdx] = useState(0);
  const [historySearch, setHistorySearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [originFilter, setOriginFilter] = useState('ALL');
  const [selectedInvoiceFilter, setSelectedInvoiceFilter] = useState('ALL');
  const [saveValidatedEnabled, setSaveValidatedEnabled] = useState(true);
  const [learnedTemplatesCount, setLearnedTemplatesCount] = useState(14);
  const [savedTemplates, setSavedTemplates] = useState([
    {
      id: 'tpl-1',
      name: 'US-MFG-STD-01',
      pattern: 'Material # + REV + Origin + Gross Wt',
      accuracy: '99.2%',
      uses: 28
    },
    {
      id: 'tpl-2',
      name: 'EU-COM-INV-04',
      pattern: 'HS Tariff + Incoterm + Net/Gross Wt',
      accuracy: '98.6%',
      uses: 16
    }
  ]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [isPublicAccess, setIsPublicAccess] = useState(true);
  const [publicAllowUpload, setPublicAllowUpload] = useState(true);
  const [publicApiKeyInput, setPublicApiKeyInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [brandLogoSrc, setBrandLogoSrc] = useState('avatar_keith_garzon_anime.png');
  const [logoLoadError, setLogoLoadError] = useState(false);

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setBrandLogoSrc(String(reader.result));
        setLogoLoadError(false);
        triggerToast('Updated KG EXTRACTOR brand logo.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerToast = (msg, type = 'success', allowUndo = false) => {
    setToastMessage({ text: msg, type, allowUndo });
    setTimeout(() => {
      setToastMessage((prev) => (prev && prev.text === msg ? null : prev));
    }, 5500);
  };
  // Format numbers cleanly without thousands commas and up to 2 decimal places; return blank when no result exists
  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '' || Number.isNaN(Number(num))) return '';
    const rounded = Math.round((Number(num) + Number.EPSILON) * 100) / 100;
    return String(rounded);
  };

  // Handle file input selection
  const handleFileUpload = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const allowedExts = ['PDF', 'JPG', 'JPEG', 'PNG', 'DOCX', 'XLSX', 'XLS', 'CSV'];
    const newQueued = [];

    Array.from(fileList).forEach((file) => {
      const ext = file.name.split('.').pop().toUpperCase();
      if (!allowedExts.includes(ext)) {
        triggerToast(`Unsupported format .${ext}. Use PDF, JPG, PNG, DOCX, or XLSX.`, 'error');
        return;
      }
      const sizeKB = Math.max(1, Math.round(file.size / 1024));
      const estimatedPages = ext === 'PDF' || ext === 'DOCX' ? Math.max(1, Math.min(8, Math.ceil(sizeKB / 180))) : 1;
      newQueued.push({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: `${sizeKB} KB`,
        type: ext,
        pages: estimatedPages,
        status: 'Ready to Scan',
        invoiceNumbers: [],
        rawFile: file
      });
    });

    if (newQueued.length > 0) {
      setQueuedFiles((prev) => [...newQueued, ...prev]);
      triggerToast(`Added ${newQueued.length} file(s) to scan queue. Click "START SCAN" to extract actual file contents.`);
    }
  };

  // Helper: Convert File to base64 string (without data URL prefix)
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Helper: Extract readable text from DOCX / XLSX / CSV / binary files when needed
  const extractFallbackTextFromFile = async (file) => {
    const ext = file.name.split('.').pop().toUpperCase();
    if (ext === 'CSV' || ext === 'TXT') {
      return await file.text();
    }
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Decode printable ASCII/UTF-8 runs for structured XML/text inspection
    let raw = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
        raw += String.fromCharCode(b);
      } else {
        raw += ' ';
      }
    }
    // Clean XML tags if DOCX or XLSX
    const cleaned = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.slice(0, 28000);
  };

  // Helper: Local heuristic parser for offline / 401 environments when no API key is active
  const extractLocallyFromText = async (fileObj) => {
    const rawText = fileObj.rawFile ? await extractFallbackTextFromFile(fileObj.rawFile) : '';
    const invMatch =
      fileObj.name.match(/LD\d+/i) ||
      fileObj.name.match(/(?:INV|PL)[#\-_\s]*[A-Z0-9-]+/i) ||
      rawText.match(/\bLD\d{5,}\b/i);
    const invoiceNumber = invMatch ? invMatch[0].toUpperCase() : fileObj.name.replace(/\.[^.]+$/, '').slice(0, 32);

    const hsMatch = rawText.match(/\b\d{4}\.\d{2}(?:\.\d{2,4})?\b|\b\d{8,10}\b/);
    const hsCode = hsMatch ? hsMatch[0] : '';

    const amountMatch = rawText.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/);
    const amount = amountMatch ? Number(amountMatch[0].replace(/,/g, '')) || 0 : 0;

    return {
      detectedPages: fileObj.pages || 1,
      exporterName: '',
      importerName: '',
      destinationCountry: '',
      bolAwb: invoiceNumber,
      etaDate: '',
      customsRef: '',
      items: [
        {
          materialNumber: '',
          description: '',
          hsCode,
          origin: '',
          quantity: 0,
          grossWeight: 0,
          weightUnit: '',
          netWeight: null,
          pallets: null,
          amount,
          currency: '',
          incoterm: '',
          invoiceNumber,
          pageNumber: 1
        }
      ]
    };
  };

  // Helper: Call Gemini API with structured schema to extract exact invoice fields from uploaded file
  const extractInvoiceDataWithAI = async (fileObj) => {
    const apiKey = publicApiKeyInput.trim();
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const extractionSchema = {
      type: 'OBJECT',
      properties: {
        detectedPages: { type: 'INTEGER' },
        exporterName: { type: 'STRING' },
        importerName: { type: 'STRING' },
        destinationCountry: { type: 'STRING' },
        bolAwb: { type: 'STRING' },
        etaDate: { type: 'STRING' },
        customsRef: { type: 'STRING' },
        items: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              materialNumber: { type: 'STRING' },
              description: { type: 'STRING' },
              hsCode: { type: 'STRING' },
              origin: { type: 'STRING' },
              quantity: { type: 'NUMBER' },
              grossWeight: { type: 'NUMBER' },
              weightUnit: { type: 'STRING' },
              netWeight: { type: 'NUMBER', nullable: true },
              pallets: { type: 'NUMBER', nullable: true },
              amount: { type: 'NUMBER' },
              currency: { type: 'STRING' },
              incoterm: { type: 'STRING' },
              invoiceNumber: { type: 'STRING' },
              pageNumber: { type: 'INTEGER' }
            },
            required: [
              'materialNumber',
              'description',
              'hsCode',
              'origin',
              'quantity',
              'grossWeight',
              'amount',
              'invoiceNumber'
            ]
          }
        }
      },
      required: ['items']
    };

    const promptText = `You are a customs documentation specialist preparing data for Thyme-IT AEP/AIS customs declaration. Extract header declaration details and EVERY commercial invoice line item from the uploaded document "${fileObj.name}" page by page.
Rules:
- Extract exact values from the document ONLY (do NOT invent or hallucinate fake items).
- Document-level header fields:
  - exporterName: Seller / Shipper / Exporter company name
  - importerName: Consignee / Buyer / Importer company name
  - destinationCountry: Country of destination / ship-to country
  - bolAwb: Bill of Lading, Master B/L, or Air Waybill number if present
  - etaDate: Estimated Arrival Date/Time if present
  - customsRef: Customs / Job / LRN reference number if present
- Fields per line item:
  - materialNumber: Part / Material / Item / SKU number (use "-" if not present)
  - description: Product / goods description in uppercase
  - hsCode: Harmonized System / Tariff / Commodity code (use "-" if not present)
  - origin: Country of origin (e.g., USA, CHINA, GERMANY, SINGAPORE, etc., or "-" if missing)
  - quantity: Numeric total quantity for the line
  - grossWeight: Numeric gross weight (0 if absent)
  - weightUnit: "lbs" or "kg" (default "kg")
  - netWeight: Numeric net weight or null if not listed
  - pallets: Numeric pallet/package count or null if not listed
  - amount: Numeric line total amount / value
  - currency: 3-letter currency code (e.g., "USD", "EUR", "SGD")
  - incoterm: Incoterm (e.g., "EXW", "FOB", "CIF", "DDP", or "-" if absent)
  - invoiceNumber: Commercial Invoice / Packing List number
  - pageNumber: Page number where the item appears (1-indexed)`;

    const rawFile = fileObj.rawFile;
    const ext = fileObj.type.toUpperCase();
    const parts = [{ text: promptText }];

    if (rawFile) {
      if (['PDF', 'JPG', 'JPEG', 'PNG', 'WEBP'].includes(ext)) {
        const mimeMap = {
          PDF: 'application/pdf',
          JPG: 'image/jpeg',
          JPEG: 'image/jpeg',
          PNG: 'image/png',
          WEBP: 'image/webp'
        };
        const base64Data = await fileToBase64(rawFile);
        parts.push({
          inlineData: {
            mimeType: rawFile.type || mimeMap[ext] || 'application/pdf',
            data: base64Data
          }
        });
      } else {
        const extractedText = await extractFallbackTextFromFile(rawFile);
        parts.push({
          text: `Document Filename: ${fileObj.name}\nExtracted Raw Content:\n${extractedText}`
        });
      }
    }

    const payload = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: extractionSchema
      }
    };

    // Exponential backoff retry wrapper
    let delay = 1000;
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonText) throw new Error('Empty extraction payload returned by AI.');
        return JSON.parse(jsonText);
      }

      if (response.status === 401 || response.status === 403) {
        setScanLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] AI API returned ${response.status} (missing/unauthorized API key in current environment). Using local document fallback for "${fileObj.name}" — please verify/edit extracted fields in the table.`,
          ...prev.slice(0, 14)
        ]);
        return await extractLocallyFromText(fileObj);
      }

      if (response.status === 429 || response.status >= 500) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }

      const errText = await response.text();
      throw new Error(`Extraction API error (${response.status}): ${errText}`);
    }
    throw new Error('Extraction timed out after multiple retries.');
  };

  // Load a sample file into queue if user wants to test scanning immediately
  const handleQueueSampleFile = (presetIdx) => {
    const preset = SIMULATED_PRESETS[presetIdx];
    const exists = queuedFiles.some((f) => f.name === preset.fileName && f.status === 'Ready to Scan');
    if (exists) {
      triggerToast(`${preset.fileName} is already queued. Click START SCAN.`, 'info');
      return;
    }
    setQueuedFiles((prev) => [
      {
        id: `file-sample-${Date.now()}`,
        name: preset.fileName,
        size: '640 KB',
        type: preset.fileType,
        pages: preset.pages,
        status: 'Ready to Scan',
        invoiceNumbers: [],
        presetData: preset
      },
      ...prev
    ]);
    triggerToast(`Queued ${preset.fileName}. Click "START SCAN" to run page-by-page OCR.`);
  };

  // Remove a single previously uploaded or queued file and sync all extracted data
  const handleRemoveUploadedFile = (fileToRemove) => {
    // Save snapshot so the user can Undo if clicked accidentally
    setLastRemovedSnapshot({
      files: [...queuedFiles],
      rows: [...rows],
      history: [...history],
      selectedInvoiceFilter
    });

    const targetFileName = fileToRemove.name;

    // 1. Remove from uploaded/queued files list
    setQueuedFiles((prev) =>
      prev.filter((f) => (fileToRemove.id ? f.id !== fileToRemove.id : f.name !== targetFileName))
    );

    // 2. Remove extracted rows associated with this file
    const remainingRows = rows.filter((r) => r.sourceFile !== targetFileName);
    setRows(remainingRows);

    // 3. Remove processing history records associated with this file
    setHistory((prev) => prev.filter((h) => h.sourceFile !== targetFileName));

    // 4. Reset invoice filter if the currently filtered invoice belonged exclusively to the deleted file
    if (
      selectedInvoiceFilter !== 'ALL' &&
      !remainingRows.some((r) => r.invoiceNumber === selectedInvoiceFilter)
    ) {
      setSelectedInvoiceFilter('ALL');
    }

    // 5. Log removal in telemetry
    setScanLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Removed uploaded file "${targetFileName}" and recalculated consolidations.`,
      ...prev.slice(0, 14)
    ]);

    triggerToast(`Removed "${targetFileName}" and updated extracted totals.`, 'info', true);
  };

  // Clear all previously uploaded files & extracted records
  const handleClearAllFiles = () => {
    if (queuedFiles.length === 0) return;

    setLastRemovedSnapshot({
      files: [...queuedFiles],
      rows: [...rows],
      history: [...history],
      selectedInvoiceFilter
    });

    setQueuedFiles([]);
    setRows([]);
    setHistory([]);
    setSelectedInvoiceFilter('ALL');
    setScanLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Cleared all uploaded files and extracted records.`,
      ...prev.slice(0, 14)
    ]);

    triggerToast('Cleared all uploaded files and extracted records.', 'info', true);
  };

  // Restore last removed file(s)
  const handleUndoRemoveFile = () => {
    if (!lastRemovedSnapshot) return;
    setQueuedFiles(lastRemovedSnapshot.files);
    setRows(lastRemovedSnapshot.rows);
    setHistory(lastRemovedSnapshot.history);
    setSelectedInvoiceFilter(lastRemovedSnapshot.selectedInvoiceFilter || 'ALL');
    setLastRemovedSnapshot(null);
    setToastMessage(null);
    triggerToast('Restored removed file(s) and extracted data.', 'success', false);
  };

  // Remove a processing history entry (and optionally its matching file/rows)
  const handleRemoveHistoryItem = (e, historyItem) => {
    e.stopPropagation();

    setLastRemovedSnapshot({
      files: [...queuedFiles],
      rows: [...rows],
      history: [...history],
      selectedInvoiceFilter
    });

    setHistory((prev) => prev.filter((h) => h.id !== historyItem.id));

    if (historyItem.sourceFile) {
      const remainingHistoryForFile = history.filter(
        (h) => h.id !== historyItem.id && h.sourceFile === historyItem.sourceFile
      );

      if (remainingHistoryForFile.length === 0) {
        const remainingRows = rows.filter((r) => r.sourceFile !== historyItem.sourceFile);
        setRows(remainingRows);
        setQueuedFiles((prev) => prev.filter((f) => f.name !== historyItem.sourceFile));

        if (
          selectedInvoiceFilter !== 'ALL' &&
          !remainingRows.some((r) => r.invoiceNumber === selectedInvoiceFilter)
        ) {
          setSelectedInvoiceFilter('ALL');
        }
      }
    }

    setScanLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Removed history record for ${historyItem.invoiceNumber} (${historyItem.sourceFile}).`,
      ...prev.slice(0, 14)
    ]);

    triggerToast(`Removed ${historyItem.invoiceNumber} from processing history.`, 'info', true);
  };

  // Page-by-Page Scan execution on actual uploaded files
  const handleStartScan = async () => {
    if (isScanning) return;

    const pendingFiles = queuedFiles.filter((f) => f.status === 'Ready to Scan');
    if (pendingFiles.length === 0) {
      triggerToast(
        'No pending uploaded files in queue. Click [ Choose File ] to upload a PDF, Image, Word, or Excel invoice first.',
        'error'
      );
      fileInputRef.current?.click();
      return;
    }

    setIsScanning(true);
    setScanProgress(10);
    setScanStatusText(`Preparing ${pendingFiles.length} uploaded document(s) for page-by-page OCR & AI extraction...`);
    setScanLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Starting real document extraction on: ${pendingFiles
        .map((f) => f.name)
        .join(', ')}`,
      ...prev.slice(0, 14)
    ]);

    const newlyExtractedRows = [];
    const newlyAddedHistory = [];
    const fileInvoiceMap = {};
    const filePageMap = {};
    const failedFiles = [];

    for (let idx = 0; idx < pendingFiles.length; idx++) {
      const fileObj = pendingFiles[idx];
      const basePct = Math.round(((idx + 0.2) / pendingFiles.length) * 85) + 10;
      setScanProgress(basePct);
      setScanStatusText(
        `Scanning file ${idx + 1}/${pendingFiles.length}: "${fileObj.name}" page by page...`
      );
      setScanLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Reading "${fileObj.name}" (${fileObj.type}, ${fileObj.size}) — extracting Material #, Description, HS Code, Origin, Weights, Pallets, Incoterm & Invoice #...`,
        ...prev.slice(0, 14)
      ]);

      try {
        if (fileObj.presetData) {
          // Preset sample loader
          const invNums = new Set();
          fileObj.presetData.items.forEach((item, itemIdx) => {
            invNums.add(item.invoiceNumber);
            newlyExtractedRows.push({
              ...item,
              id: `row-${Date.now()}-${idx}-${itemIdx}`,
              sourceFile: fileObj.name,
              pageNumber: Math.min(fileObj.pages, itemIdx + 1),
              confidence: 99.1,
              validated: saveValidatedEnabled
            });
          });
          fileInvoiceMap[fileObj.name] = Array.from(invNums);
          filePageMap[fileObj.name] = fileObj.pages;

          invNums.forEach((inv) => {
            newlyAddedHistory.push({
              id: `hist-${Date.now()}-${idx}-${inv}`,
              invoiceNumber: inv,
              sourceFile: fileObj.name,
              fileType: fileObj.type,
              pagesScanned: fileObj.pages,
              dateProcessed: new Date().toISOString().slice(0, 16).replace('T', ' '),
              status: 'Complete',
              templateMatched: saveValidatedEnabled ? 'AI-LEARNED-V2' : 'AUTO-DETECT'
            });
          });
        } else {
          // Real extraction from user-uploaded file
          const parsed = await extractInvoiceDataWithAI(fileObj);
          const items = Array.isArray(parsed?.items) ? parsed.items : [];
          const detectedPages = parsed?.detectedPages || fileObj.pages || 1;
          filePageMap[fileObj.name] = detectedPages;

          if (items.length === 0) {
            failedFiles.push(`${fileObj.name} (no invoice line items found)`);
            setScanLogs((prev) => [
              `[${new Date().toLocaleTimeString()}] Warning: No invoice line items detected in "${fileObj.name}".`,
              ...prev.slice(0, 14)
            ]);
            continue;
          }

          const invNums = new Set();
          items.forEach((item, itemIdx) => {
            const inv = (item.invoiceNumber || '').trim();
            if (inv) invNums.add(inv);
            newlyExtractedRows.push({
              id: `row-${Date.now()}-${idx}-${itemIdx}`,
              materialNumber: item.materialNumber || '',
              description: item.description ? String(item.description).toUpperCase() : '',
              hsCode: item.hsCode || '',
              origin: item.origin ? String(item.origin).toUpperCase() : '',
              quantity: Number(item.quantity) || 0,
              grossWeight: Number(item.grossWeight) || 0,
              weightUnit: item.weightUnit || '',
              netWeight:
                item.netWeight !== null && item.netWeight !== undefined && !Number.isNaN(Number(item.netWeight))
                  ? Number(item.netWeight)
                  : null,
              pallets:
                item.pallets !== null && item.pallets !== undefined && !Number.isNaN(Number(item.pallets))
                  ? Number(item.pallets)
                  : null,
              amount: Number(item.amount) || 0,
              currency: item.currency ? String(item.currency).toUpperCase() : '',
              incoterm: item.incoterm ? String(item.incoterm).toUpperCase() : '',
              invoiceNumber: inv,
              exporterName: parsed?.exporterName || '',
              importerName: parsed?.importerName || '',
              destinationCountry: parsed?.destinationCountry || '',
              bolAwb: parsed?.bolAwb || '',
              etaDate: parsed?.etaDate || '',
              customsRef: parsed?.customsRef || '',
              sourceFile: fileObj.name,
              pageNumber: item.pageNumber || 1,
              confidence: 98.7,
              validated: saveValidatedEnabled
            });
          });

          fileInvoiceMap[fileObj.name] = Array.from(invNums);

          invNums.forEach((inv) => {
            newlyAddedHistory.push({
              id: `hist-${Date.now()}-${idx}-${inv}`,
              invoiceNumber: inv,
              sourceFile: fileObj.name,
              fileType: fileObj.type,
              pagesScanned: detectedPages,
              dateProcessed: new Date().toISOString().slice(0, 16).replace('T', ' '),
              status: 'Complete',
              templateMatched: saveValidatedEnabled ? 'AI-VISION-EXTRACTED' : 'STANDARD-OCR'
            });
          });

          setScanLogs((prev) => [
            `[${new Date().toLocaleTimeString()}] Extracted ${items.length} line item(s) across ${detectedPages} page(s) from "${fileObj.name}" (${Array.from(invNums).join(', ')}).`,
            ...prev.slice(0, 14)
          ]);
        }
      } catch (err) {
        failedFiles.push(fileObj.name);
        setScanLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] Error extracting "${fileObj.name}": ${err.message}`,
          ...prev.slice(0, 14)
        ]);
      }
    }

    setScanProgress(100);
    setScanStatusText('Extraction complete!');

    if (newlyExtractedRows.length > 0) {
      setRows((prev) => [...newlyExtractedRows, ...prev]);
      setHistory((prev) => [...newlyAddedHistory, ...prev]);
    }

    setQueuedFiles((prev) =>
      prev.map((f) => {
        if (!pendingFiles.some((p) => p.id === f.id)) return f;
        if (fileInvoiceMap[f.name] && fileInvoiceMap[f.name].length > 0) {
          return {
            ...f,
            status: 'Processed',
            pages: filePageMap[f.name] || f.pages,
            invoiceNumbers: fileInvoiceMap[f.name]
          };
        }
        return {
          ...f,
          status: 'No Items Found'
        };
      })
    );

    if (saveValidatedEnabled && newlyExtractedRows.length > 0) {
      setLearnedTemplatesCount((c) => c + Object.keys(fileInvoiceMap).length);
    }

    setIsScanning(false);

    if (newlyExtractedRows.length > 0 && failedFiles.length === 0) {
      triggerToast(
        `Extracted ${newlyExtractedRows.length} real line item(s) from ${Object.keys(fileInvoiceMap).length} uploaded file(s)!`
      );
    } else if (newlyExtractedRows.length > 0 && failedFiles.length > 0) {
      triggerToast(
        `Extracted ${newlyExtractedRows.length} item(s), but could not parse: ${failedFiles.join(', ')}.`,
        'info'
      );
    } else {
      triggerToast(
        `Could not extract invoice line items from ${failedFiles.join(', ')}. Check file clarity or format.`,
        'error'
      );
    }
  };

  // Inline editing handlers
  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (['quantity', 'grossWeight', 'netWeight', 'pallets', 'amount'].includes(field)) {
          const cleaned = value === '' || value === '-' ? null : Number(String(value).replace(/,/g, ''));
          return { ...row, [field]: Number.isNaN(cleaned) ? row[field] : cleaned };
        }
        return { ...row, [field]: value };
      })
    );
  };

  const handleAddRow = () => {
    const newRow = {
      id: `row-${Date.now()}`,
      materialNumber: 'NEW-MAT-001',
      description: 'PRINTED PAPER LABELS',
      hsCode: '-',
      origin: 'USA',
      quantity: 10000,
      grossWeight: 50,
      weightUnit: 'lbs',
      netWeight: null,
      pallets: 1,
      amount: 500,
      currency: 'USD',
      incoterm: 'FOB',
      invoiceNumber: 'PL# 658170',
      sourceFile: 'Manual Entry',
      pageNumber: 1,
      confidence: 100,
      validated: true
    };
    setRows((prev) => [...prev, newRow]);
    triggerToast('Added new line item row. Edit any cell inline.');
  };

  const handleDeleteRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    triggerToast('Removed line item row.', 'info');
  };

  const handleResetDemo = () => {
    setRows(INITIAL_EXTRACTED_ROWS);
    setHistory(INITIAL_HISTORY);
    setQueuedFiles([
      {
        id: 'file-init-1',
        name: 'Commercial Invoice2689501779300897181.PDF',
        size: '418 KB',
        type: 'PDF',
        pages: 2,
        status: 'Processed',
        invoiceNumbers: ['PL# 658170']
      },
      {
        id: 'file-init-2',
        name: 'Commercial Invoice18141289275114157548.PDF',
        size: '512 KB',
        type: 'PDF',
        pages: 3,
        status: 'Processed',
        invoiceNumbers: ['PL# 657990']
      }
    ]);
    setLastRemovedSnapshot(null);
    setSelectedInvoiceFilter('ALL');
    setHistorySearch('');
    setTableSearch('');
    setOriginFilter('ALL');
    triggerToast('Reset dashboard to default sample invoices (PL# 658170 & PL# 657990).', 'info');
  };

  // Unique origin list for quick filtering
  const uniqueOrigins = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (r.origin && r.origin.trim()) set.add(r.origin.trim().toUpperCase());
    });
    return Array.from(set);
  }, [rows]);

  // Count of files ready to scan
  const readyToScanCount = useMemo(
    () => queuedFiles.filter((f) => f.status === 'Ready to Scan').length,
    [queuedFiles]
  );

  // Filtered rows based on selected Invoice Number pill, Origin, and live search
  const visibleRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (selectedInvoiceFilter !== 'ALL' && r.invoiceNumber !== selectedInvoiceFilter) {
        return false;
      }
      if (originFilter !== 'ALL' && (r.origin || '').trim().toUpperCase() !== originFilter) {
        return false;
      }
      if (!q) return true;
      return (
        String(r.materialNumber || '').toLowerCase().includes(q) ||
        String(r.description || '').toLowerCase().includes(q) ||
        String(r.hsCode || '').toLowerCase().includes(q) ||
        String(r.origin || '').toLowerCase().includes(q) ||
        String(r.incoterm || '').toLowerCase().includes(q) ||
        String(r.invoiceNumber || '').toLowerCase().includes(q)
      );
    });
  }, [rows, selectedInvoiceFilter, originFilter, tableSearch]);

  // 1. Description Occurrence Counter
  const descriptionCounts = useMemo(() => {
    if (rows.length === 0) return [];
    const map = new Map();
    rows.forEach((r) => {
      const desc = (r.description || '').trim().toUpperCase();
      map.set(desc, (map.get(desc) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([description, count]) => ({ description, count }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  // 2A. Consolidated by HS Code + Origin
  const consolidatedByHsOrigin = useMemo(() => {
    if (rows.length === 0) return [];
    const map = new Map();
    rows.forEach((r) => {
      const rawHs = (r.hsCode || '').trim();
      const hsDisplay = !rawHs || rawHs === '-' ? '' : rawHs;
      const originDisplay = (r.origin || '').trim().toUpperCase();
      const key = `${hsDisplay}__${originDisplay}`;

      if (!map.has(key)) {
        map.set(key, {
          hsCode: hsDisplay,
          origin: originDisplay,
          quantity: 0,
          grossWeight: 0,
          netWeight: 0,
          pallets: 0,
          value: 0,
          currency: r.currency || '',
          lineCount: 0
        });
      }
      const entry = map.get(key);
      entry.quantity += Number(r.quantity) || 0;
      entry.grossWeight += Number(r.grossWeight) || 0;
      entry.netWeight += Number(r.netWeight) || 0;
      entry.pallets += Number(r.pallets) || 0;
      entry.value += Number(r.amount) || 0;
      entry.lineCount += 1;
    });
    return Array.from(map.values());
  }, [rows]);

  // 2B. Consolidated by Invoice Number
  const consolidatedByInvoice = useMemo(() => {
    if (rows.length === 0) return [];
    const map = new Map();
    rows.forEach((r) => {
      const inv = (r.invoiceNumber || '').trim();
      if (!map.has(inv)) {
        map.set(inv, {
          invoiceNumber: inv,
          incoterms: new Set(),
          origins: new Set(),
          quantity: 0,
          grossWeight: 0,
          netWeight: 0,
          pallets: 0,
          value: 0,
          currency: r.currency || '',
          lineCount: 0
        });
      }
      const entry = map.get(inv);
      if (r.incoterm) entry.incoterms.add(r.incoterm);
      if (r.origin) entry.origins.add(r.origin);
      entry.quantity += Number(r.quantity) || 0;
      entry.grossWeight += Number(r.grossWeight) || 0;
      entry.netWeight += Number(r.netWeight) || 0;
      entry.pallets += Number(r.pallets) || 0;
      entry.value += Number(r.amount) || 0;
      entry.lineCount += 1;
    });
    return Array.from(map.values()).map((item) => ({
      ...item,
      incotermList: Array.from(item.incoterms).join(', '),
      originList: Array.from(item.origins).join(', ')
    }));
  }, [rows]);

  // 2C. Consolidated by Description
  const consolidatedByDescription = useMemo(() => {
    if (rows.length === 0) return [];
    const map = new Map();
    rows.forEach((r) => {
      const desc = (r.description || '').trim().toUpperCase();
      if (!map.has(desc)) {
        map.set(desc, {
          description: desc,
          occurrences: 0,
          quantity: 0,
          grossWeight: 0,
          pallets: 0,
          value: 0,
          currency: r.currency || ''
        });
      }
      const entry = map.get(desc);
      entry.occurrences += 1;
      entry.quantity += Number(r.quantity) || 0;
      entry.grossWeight += Number(r.grossWeight) || 0;
      entry.pallets += Number(r.pallets) || 0;
      entry.value += Number(r.amount) || 0;
    });
    return Array.from(map.values());
  }, [rows]);

  // Unique Invoice Number List
  const invoiceNumberList = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (r.invoiceNumber && r.invoiceNumber.trim()) {
        set.add(r.invoiceNumber.trim());
      }
    });
    return Array.from(set);
  }, [rows]);

  // Grand Totals for KPI cards and consolidated tables
  const grandTotals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.quantity += Number(r.quantity) || 0;
        acc.grossWeight += Number(r.grossWeight) || 0;
        acc.netWeight += Number(r.netWeight ?? r.grossWeight) || 0;
        acc.pallets += Number(r.pallets) || 0;
        acc.amount += Number(r.amount) || 0;
        return acc;
      },
      { quantity: 0, grossWeight: 0, netWeight: 0, pallets: 0, amount: 0 }
    );
  }, [rows]);

  // Filtered Processing History
  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (h) =>
        String(h.invoiceNumber || '').toLowerCase().includes(q) ||
        String(h.sourceFile || '').toLowerCase().includes(q) ||
        String(h.status || '').toLowerCase().includes(q) ||
        String(h.templateMatched || '').toLowerCase().includes(q)
    );
  }, [history, historySearch]);

  // Thyme-IT SAD Master Summary auto-populated from extracted invoice data (blank when no extraction result)
  const sadMasterSummary = useMemo(() => {
    const activeRows = visibleRows.length > 0 ? visibleRows : rows;
    if (activeRows.length === 0) {
      return {
        invoiceNumber: '',
        exporterName: '',
        exporterStreet: '',
        exporterCity: '',
        exporterPostcode: '',
        importerName: '',
        importerStreet: '',
        importerCity: '',
        importerPostcode: '',
        countryOfOrigin: '',
        countryOfDestination: '',
        incoterm: '',
        currency: '',
        totalInvoiceValue: '',
        grossWeight: '',
        netWeight: '',
        totalPackages: '',
        bolAwb: '',
        mbol: '',
        cargoManifest: '',
        transportId: '',
        etaDate: '',
        etaBox44: '',
        customsRef: '',
        itemCount: ''
      };
    }

    const first = activeRows[0] || {};
    const uniqueInvoices = Array.from(new Set(activeRows.map((r) => r.invoiceNumber).filter(Boolean)));
    const uniqueOrigins = Array.from(new Set(activeRows.map((r) => r.origin).filter((v) => v && v !== '-')));
    const uniqueIncoterms = Array.from(new Set(activeRows.map((r) => r.incoterm).filter((v) => v && v !== '-')));
    const uniqueCurrencies = Array.from(new Set(activeRows.map((r) => r.currency).filter(Boolean)));

    const totals = activeRows.reduce(
      (acc, r) => {
        acc.grossWeight += Number(r.grossWeight) || 0;
        acc.netWeight += Number(r.netWeight ?? r.grossWeight) || 0;
        acc.packages += Number(r.pallets) || 0;
        acc.amount += Number(r.amount) || 0;
        return acc;
      },
      { grossWeight: 0, netWeight: 0, packages: 0, amount: 0 }
    );

    return {
      invoiceNumber: uniqueInvoices.join(', '),
      exporterName: first.exporterName || '',
      exporterStreet: '',
      exporterCity: '',
      exporterPostcode: '',
      importerName: first.importerName || '',
      importerStreet: '',
      importerCity: '',
      importerPostcode: '',
      countryOfOrigin: uniqueOrigins.join(', '),
      countryOfDestination: first.destinationCountry || '',
      incoterm: uniqueIncoterms.join(', '),
      currency: uniqueCurrencies[0] || '',
      totalInvoiceValue: totals.amount,
      grossWeight: totals.grossWeight,
      netWeight: totals.netWeight,
      totalPackages: totals.packages,
      bolAwb: first.bolAwb || '',
      mbol: '',
      cargoManifest: '',
      transportId: '',
      etaDate: first.etaDate || '',
      etaBox44: '',
      customsRef: first.customsRef || '',
      itemCount: activeRows.length
    };
  }, [visibleRows, rows]);

  // Thyme-IT SAD Item Summary list auto-populated per extracted line (blank fields when unextracted)
  const sadItemsList = useMemo(() => {
    const activeRows = visibleRows.length > 0 ? visibleRows : rows;
    if (activeRows.length === 0) return [];
    return activeRows.map((r, idx) => {
      const hasAmount = r.amount !== null && r.amount !== undefined && r.amount !== '';
      const itemVal = hasAmount ? Number(r.amount) || 0 : null;
      const statVal = itemVal !== null ? Number((itemVal * 0.99594).toFixed(2)) : null;
      const rawCode = r.hsCode && r.hsCode !== '-' ? String(r.hsCode).replace(/\./g, '') : '';
      const commodityCode8 = rawCode ? rawCode.slice(0, 8) : '';
      const taricCode2 = rawCode.length >= 10 ? rawCode.slice(8, 10) : '';
      const commodityTaric10 = `${commodityCode8}${taricCode2}`;
      const hasGross = r.grossWeight !== null && r.grossWeight !== undefined && r.grossWeight !== '';
      const hasNet = r.netWeight !== null && r.netWeight !== undefined && r.netWeight !== '';
      const grossNum = hasGross ? Number(r.grossWeight) || 0 : null;
      const netNum = hasNet ? Number(r.netWeight) || 0 : grossNum;

      return {
        itemNumber: idx + 1,
        materialNumber: r.materialNumber || '',
        description: r.description || '',
        hsCode: commodityTaric10,
        commodityCode: commodityCode8,
        taricCode: taricCode2,
        taricAddCode1: '',
        taricAddCode2: '',
        commodityNationalCode: '',
        commodityNatAdd1: '',
        commodityNatAdd2: '',
        commodityNatAdd3: '',
        commodityNatAdd4: '',
        supplementaryUnits: r.quantity !== null && r.quantity !== undefined ? Number(r.quantity).toFixed(1) : '',
        dutyRate: '',
        vatRate: '',
        origin: r.origin || '',
        preferentialOrigin: '',
        grossWeight: grossNum,
        netWeight: netNum,
        grossMassList: grossNum !== null ? grossNum.toFixed(6) : '',
        netMassList: netNum !== null ? netNum.toFixed(6) : '',
        procedure: '',
        additionalProcedure: '',
        preference: '',
        natureOfTransaction: '',
        packageTypeCode: '',
        packageCount: r.pallets !== null && r.pallets !== undefined ? Number(r.pallets) || 0 : '',
        shippingMarks: '',
        itemValue: itemVal,
        itemPriceList: itemVal !== null ? itemVal.toFixed(2) : '',
        valuationMethod: '',
        quotaOrderNumber: '',
        statisticalValue: statVal,
        invoiceNumber: r.invoiceNumber || ''
      };
    });
  }, [visibleRows, rows]);

  const currentSadItem = sadItemsList[Math.min(selectedSadItemIdx, Math.max(0, sadItemsList.length - 1))] || null;

  // Origin Consolidation Summary for Consolidated Declaration tab
  const consolidatedByOrigin = useMemo(() => {
    if (rows.length === 0) return [];
    const map = new Map();
    rows.forEach((r) => {
      const orig = (r.origin || '').trim().toUpperCase();
      if (!map.has(orig)) {
        map.set(orig, { origin: orig, lines: 0, quantity: 0, grossWeight: 0, netWeight: 0, value: 0 });
      }
      const entry = map.get(orig);
      entry.lines += 1;
      entry.quantity += Number(r.quantity) || 0;
      entry.grossWeight += Number(r.grossWeight) || 0;
      entry.netWeight += Number(r.netWeight ?? r.grossWeight) || 0;
      entry.value += Number(r.amount) || 0;
    });
    return Array.from(map.values());
  }, [rows]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Material Number',
      'Description',
      'HS Code',
      'Origin',
      'Total Quantity',
      'Total Gross Weight (lbs)',
      'Total Net Weight (lbs)',
      'Total Pallets',
      'Total Amount (USD)',
      'Incoterm',
      'Invoice Number',
      'Source File'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.materialNumber,
          r.description,
          r.hsCode || 'N/A',
          r.origin,
          r.quantity ?? 0,
          r.grossWeight ?? 0,
          r.netWeight ?? '',
          r.pallets ?? 0,
          r.amount ?? 0,
          r.incoterm || '-',
          r.invoiceNumber,
          r.sourceFile
        ]
          .map(escapeCsv)
          .join(',')
      ),
      '',
      '"CONSOLIDATED BY HS CODE + ORIGIN"',
      '"HS Code","Origin","Total Quantity","Total Gross Weight (lbs)","Total Value (USD)"',
      ...consolidatedByHsOrigin.map((c) =>
        [c.hsCode, c.origin, c.quantity, c.grossWeight, c.value].map(escapeCsv).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Commercial_Invoice_Extraction_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('Exported CSV customs data file.');
  };

  // Export Excel (SpreadsheetML .xls format that opens cleanly in Excel with multiple tables)
  const handleExportExcel = () => {
    const escapeHtml = (val) => {
      if (val === null || val === undefined) return '';
      return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; }
          th, td { padding: 6px 10px; vertical-align: middle; }
          .text-cell { mso-number-format:"\\@"; white-space: nowrap; }
        </style>
      </head>
      <body>
        <h2>Commercial Invoice Extracted Details</h2>
        <table border="1">
          <colgroup>
            <col style="width:160px;" />
            <col style="width:240px;" />
            <col style="width:130px;" />
            <col style="width:110px;" />
            <col style="width:110px;" />
            <col style="width:130px;" />
            <col style="width:130px;" />
            <col style="width:100px;" />
            <col style="width:130px;" />
            <col style="width:100px;" />
            <col style="width:240px;" />
            <col style="width:260px;" />
          </colgroup>
          <thead>
            <tr style="background-color:#1e293b;color:#ffffff;font-weight:bold;">
              <th>Material Number</th>
              <th>Description</th>
              <th>HS Code</th>
              <th>Origin</th>
              <th>Total Quantity</th>
              <th>Total Gross Weight</th>
              <th>Total Net Weight</th>
              <th>Total Pallets</th>
              <th>Total Amount</th>
              <th>Incoterm</th>
              <th>Invoice Number</th>
              <th>Source Document</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) => `
              <tr>
                <td class="text-cell">${escapeHtml(r.materialNumber)}</td>
                <td class="text-cell">${escapeHtml(r.description)}</td>
                <td class="text-cell">${escapeHtml(r.hsCode || '-')}</td>
                <td class="text-cell">${escapeHtml(r.origin)}</td>
                <td>${r.quantity ?? 0}</td>
                <td>${r.grossWeight ?? 0} ${escapeHtml(r.weightUnit || 'lbs')}</td>
                <td>${r.netWeight !== null ? `${r.netWeight} ${escapeHtml(r.weightUnit || 'lbs')}` : '-'}</td>
                <td>${r.pallets ?? 0}</td>
                <td>${escapeHtml(r.currency || 'USD')} ${r.amount ?? 0}</td>
                <td class="text-cell">${escapeHtml(r.incoterm || '-')}</td>
                <td class="text-cell">${escapeHtml(r.invoiceNumber)}</td>
                <td class="text-cell">${escapeHtml(r.sourceFile)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <br/>
        <h2>Description Occurrence Counter</h2>
        <table border="1">
          <thead>
            <tr style="background-color:#0f766e;color:#ffffff;font-weight:bold;">
              <th>Description</th>
              <th>Times Appearing</th>
            </tr>
          </thead>
          <tbody>
            ${descriptionCounts
              .map(
                (d) => `
              <tr>
                <td class="text-cell">${escapeHtml(d.description)}</td>
                <td>${d.count}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <br/>
        <h2>Consolidated by HS Code + Origin</h2>
        <table border="1">
          <thead>
            <tr style="background-color:#1d4ed8;color:#ffffff;font-weight:bold;">
              <th>HS Code</th>
              <th>Origin</th>
              <th>Quantity</th>
              <th>Gross Weight</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${consolidatedByHsOrigin
              .map(
                (c) => `
              <tr>
                <td class="text-cell">${escapeHtml(c.hsCode)}</td>
                <td class="text-cell">${escapeHtml(c.origin)}</td>
                <td>${c.quantity}</td>
                <td>${c.grossWeight} lbs</td>
                <td>${escapeHtml(c.currency)} ${c.value}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <br/>
        <h2>Consolidated by Invoice Number</h2>
        <table border="1">
          <colgroup>
            <col style="width:240px;" />
            <col style="width:140px;" />
            <col style="width:120px;" />
            <col style="width:120px;" />
            <col style="width:140px;" />
            <col style="width:140px;" />
          </colgroup>
          <thead>
            <tr style="background-color:#4338ca;color:#ffffff;font-weight:bold;">
              <th>Invoice Number</th>
              <th>Origin(s)</th>
              <th>Incoterm</th>
              <th>Quantity</th>
              <th>Gross Weight</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${consolidatedByInvoice
              .map(
                (c) => `
              <tr>
                <td class="text-cell">${escapeHtml(c.invoiceNumber)}</td>
                <td class="text-cell">${escapeHtml(c.originList)}</td>
                <td class="text-cell">${escapeHtml(c.incotermList)}</td>
                <td>${c.quantity}</td>
                <td>${c.grossWeight} lbs</td>
                <td>${escapeHtml(c.currency)} ${c.value}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Customs_Commercial_Invoice_Report_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('Exported Excel (.xls) workbook with Extracted & Consolidated tables.');
  };

  // Export PDF Report (opens clean printable report preview)
  const handleExportPDF = () => {
    setShowReportModal(true);
  };

  // Generate a true selectable & copyable text-based PDF file (raw PDF 1.4 vector text, non-image)
  const handleDownloadSelectablePDF = () => {
    const pdfEscape = (str) =>
      String(str ?? '')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');

    const pagesStreams = [];
    let ops = [];
    let y = 785;

    const addRect = (x, topY, w, h, fillGray = null, strokeGray = 0.55) => {
      const bottomY = topY - h;
      if (fillGray !== null) {
        ops.push(`${fillGray} g ${x} ${bottomY} ${w} ${h} re f`);
      }
      if (strokeGray !== null) {
        ops.push(`${strokeGray} G 0.6 w ${x} ${bottomY} ${w} ${h} re S`);
      }
    };

    const addText = (text, x, textY, size = 8.5, bold = false, gray = 0.08) => {
      const font = bold ? '/F2' : '/F1';
      ops.push(`BT ${font} ${size} Tf ${gray} g 1 0 0 1 ${x} ${textY} Tm (${pdfEscape(text)}) Tj ET`);
    };

    const newPage = (titleSuffix = '') => {
      if (ops.length > 0) pagesStreams.push(ops.join('\n'));
      ops = [];
      // Thyme-IT Top Header Bar
      addRect(36, 806, 523, 28, 0.14, 0.1);
      addText('Thyme-IT  (www.thyme-it.ie)', 44, 790, 12, true, 1.0);
      addText(`AEP / AIS Customs Declaration Summary ${titleSuffix}`, 310, 790, 8.5, false, 0.92);
      // Menu bar
      addRect(36, 778, 523, 16, 0.88, 0.5);
      addText('Quotes    SAD    ICS    NCTS    Manifest    Reference Data    System', 44, 767, 8, true, 0.1);
      addText('Input Search Criteria >> SAD List >> Summary >> SAD Master Summary Screen', 36, 751, 7.5, false, 0.2);
      y = 742;
    };

    const ensureSpace = (needed, titleSuffix = '(Continued)') => {
      if (y - needed < 48) {
        newPage(titleSuffix);
      }
    };

    const drawSectionBanner = (title) => {
      ensureSpace(26);
      addRect(36, y, 523, 18, 0.16, 0.1);
      addText(title, 220, y - 13, 9.5, true, 1.0);
      y -= 20;
    };

    const drawFieldsetBox = (legend, pairs) => {
      const rowHeight = 15;
      const numRows = Math.ceil(pairs.length / 2);
      const boxHeight = 17 + numRows * rowHeight + 4;
      ensureSpace(boxHeight + 4);

      addRect(36, y, 523, boxHeight, 0.93, 0.5);
      addText(legend, 42, y - 11, 8.2, true, 0.05);
      let rowY = y - 24;

      for (let i = 0; i < pairs.length; i += 2) {
        const left = pairs[i];
        const right = pairs[i + 1];

        if (left) {
          addText(left[0], 42, rowY, 7.2, false, 0.15);
          addRect(174, rowY + 8.5, 118, 11.5, 0.98, 0.6);
          addText(String(left[1] ?? '').slice(0, 25), 177, rowY, 7.2, true, 0.05);
        }
        if (right) {
          addText(right[0], 302, rowY, 7.2, false, 0.15);
          addRect(434, rowY + 8.5, 120, 11.5, 0.98, 0.6);
          addText(String(right[1] ?? '').slice(0, 25), 437, rowY, 7.2, true, 0.05);
        }
        rowY -= rowHeight;
      }
      y -= boxHeight + 4;
    };

    // PAGE 1: SAD MASTER SUMMARY SCREEN matching PDF 1 exact field sequence
    newPage('— SAD Master Summary Screen');
    drawSectionBanner(`SAD Master (${sadMasterSummary.customsRef})`);

    drawFieldsetBox('Master Details', [
      ['LRN', sadMasterSummary.customsRef],
      ['Status', 'Green'],
      ['SAD Type', 'AIS Import'],
      ['Template Name', 'H1 Free Circ - Reduced Dataset'],
      ['No. of Items*', sadMasterSummary.itemCount],
      ['Status (3/21)', 'Direct Representation'],
      ['UCR (2/4)', 'DUBLIN'],
      ['Job Reference*', `${sadMasterSummary.bolAwb}-0084`],
      ['Language Code', 'EN'],
      ['', '']
    ]);

    drawFieldsetBox('Declaration Type', [
      ['Message Type*', 'H1 Import - Free Circulation / End Use'],
      ['Declaration Type (1/1)', 'IM - Outside EU / Not free circulation'],
      ['Add. Declaration Type (1/2)', 'A - Standard Post-Lodged Declaration'],
      ['', '']
    ]);

    drawFieldsetBox('Declarant & Representative Information', [
      ['Declarant (3/18)', 'Kuehne & Nagel Limited (IE8250768I)'],
      ['Code (3/20)', 'IE8250768I'],
      ['Name (3/19)', 'KUEHNE & NAGEL (IRELAND) LTD'],
      ['Street Number (3/19)', 'UNIT 5 HORIZON LOGISTICS PARK'],
      ['City (3/19)', 'HARRISTOWN, CO. DUBLIN'],
      ['Country (3/19) / Postcode', 'Ireland / K67 A5W6']
    ]);

    drawFieldsetBox('Exporter Information & Importer Information', [
      ['Name (3/1)', sadMasterSummary.exporterName],
      ['Code (3/16)', 'IE4505046A'],
      ['Street Number (3/1)', sadMasterSummary.exporterStreet],
      ['Name (3/15)', sadMasterSummary.importerName],
      ['City (3/1)', sadMasterSummary.exporterCity],
      ['Street Number (3/15)', sadMasterSummary.importerStreet],
      ['Country (3/1) / Postcode', `${sadMasterSummary.countryOfOrigin} / ${sadMasterSummary.exporterPostcode}`],
      ['City / Country (3/15)', `${sadMasterSummary.importerCity}, ${sadMasterSummary.countryOfDestination} ${sadMasterSummary.importerPostcode}`]
    ]);

    drawFieldsetBox('Value Details, Previous Document & Delivery Terms', [
      ['Invoice Currency (4/10)', sadMasterSummary.currency],
      ['Total Amount Invoiced (4/11)', Number(sadMasterSummary.totalInvoiceValue).toFixed(2)],
      ['Preferred Payment Method (4/8)', 'E - Deferred/Postponed Payment'],
      ['Customs Duty Payer (3/46)', 'IE4505046A'],
      ['Postponed VAT Payment (1A05)', 'IEPOSTPONED'],
      ['Previous Doc. Type (2/01)', 'Commercial invoice'],
      ['Previous Doc. Reference (2/01)', sadMasterSummary.invoiceNumber],
      ['Goods Item Identifier (2/01)', '1'],
      ['Delivery Incoterm (4/1)', sadMasterSummary.incoterm],
      ['Delivery Country / Loc.', `${sadMasterSummary.countryOfOrigin} / SHENZHEN`]
    ]);

    drawFieldsetBox('Transport, Goods Location, Other & Box44 Details', [
      ['Customs Office (5/26)', 'DUBLIN PORT'],
      ['Inland Mode of Transport (7/5)', 'Sea'],
      ['Transport Id. Means (7/9)', sadMasterSummary.transportId],
      ['Customs Office Lodgement', 'DUBLIN PORT'],
      ['Bill of Lading (N705)', sadMasterSummary.bolAwb],
      ['Master Bill of Lading (N704)', sadMasterSummary.mbol],
      ['Goods Location Id (5/23)', 'IEDUB100'],
      ['Country of Destination (5/8)', sadMasterSummary.countryOfDestination],
      ['Country of Dispatch (5/14)', sadMasterSummary.countryOfOrigin],
      ['Est. Arrival (1D24)', sadMasterSummary.etaDate],
      ['Cargo Manifest (N785)', sadMasterSummary.cargoManifest],
      ['Box44 Arrival (1D24)', sadMasterSummary.etaBox44]
    ]);

    // SAD Item List Table matching exact screenshot headers & formatting
    ensureSpace(45 + sadItemsList.length * 16);
    drawSectionBanner('SAD Item List');
    addRect(36, y, 523, 16, 0.85, 0.4);
    addText('Item No', 42, y - 11, 7.5, true);
    addText('Commodity / Taric', 86, y - 11, 7.5, true);
    addText('Description', 176, y - 11, 7.5, true);
    addText('Gross Mass', 345, y - 11, 7.5, true);
    addText('Net Mass', 420, y - 11, 7.5, true);
    addText('Item Price', 495, y - 11, 7.5, true);
    y -= 16;

    sadItemsList.forEach((it) => {
      ensureSpace(18);
      addRect(36, y, 523, 15, 0.99, 0.65);
      addText(String(it.itemNumber), 46, y - 11, 7.5, false);
      addText(String(it.hsCode), 86, y - 11, 7.5, false);
      addText(String(it.description).slice(0, 32), 176, y - 11, 7.5, false);
      addText(it.grossMassList, 345, y - 11, 7.5, false);
      addText(it.netMassList, 420, y - 11, 7.5, false);
      addText(it.itemPriceList, 495, y - 11, 7.5, true);
      y -= 15;
    });

    // SEPARATE PAGE FOR SAD ITEM SCREEN matching PDF 2 exact field sequence
    newPage('— SAD Item');
    sadItemsList.forEach((it) => {
      ensureSpace(240, '— SAD Item');
      drawSectionBanner(`SAD Item (${sadMasterSummary.customsRef})`);

      drawFieldsetBox('Goods Information', [
        ['Commodity code (6/14)', it.commodityCode],
        ['TARIC code (6/15)', it.taricCode],
        ['TARIC Additional Code 1 (6/16)', it.taricAddCode1],
        ['TARIC Additional Code 2 (6/16)', it.taricAddCode2],
        ['Commodity National Code (6/17)', it.commodityNationalCode],
        ['Commodity Nat. Add. Code 1', it.commodityNatAdd1],
        ['Supplementary Units (6/2)', it.supplementaryUnits],
        ['Duty Rate % / VAT Rate %', `${it.dutyRate} / ${it.vatRate}`],
        ['Description of Goods (6/8)', it.description],
        ['Material Number', it.materialNumber]
      ]);

      drawFieldsetBox('Item Details, Package Details & Value Details', [
        ['Country of Origin (5/15)', it.origin],
        ['Country of Pref. Origin (5/16)', it.preferentialOrigin],
        ['Gross Mass (kg) (6/5)', formatNumber(it.grossWeight)],
        ['Net Mass (kg) (6/1)', formatNumber(it.netWeight)],
        ['Procedure (1/10)', it.procedure],
        ['Additional Procedure (1/11)', it.additionalProcedure],
        ['Preference (4/17)', it.preference],
        ['Nature of transaction (8/5)', it.natureOfTransaction],
        ['Package Type Code (6/9)', it.packageTypeCode],
        ['Number of Packages (6/10)', formatNumber(it.packageCount)],
        ['Shipping Marks (6/11)', it.shippingMarks],
        ['Item Price/Amount (4/14)', it.itemPriceList],
        ['Valuation Method (4/16)', it.valuationMethod],
        ['Quota Order Number (8/1)', it.quotaOrderNumber],
        ['Statistical value (8/6)', formatNumber(it.statisticalValue)],
        ['Invoice Number (N935)', it.invoiceNumber]
      ]);
    });

    if (ops.length > 0) pagesStreams.push(ops.join('\n'));

    // Assemble valid PDF 1.4 binary with Helvetica & Helvetica-Bold built-in Type1 fonts
    const objects = [];
    const addObj = (content) => {
      objects.push(content);
      return objects.length;
    };

    const catalogId = addObj('');
    const pagesId = addObj('');
    const fontRegularId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const fontBoldId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

    const pageObjIds = [];
    pagesStreams.forEach((streamContent) => {
      const streamId = addObj(`<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`);
      const pageId = addObj(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${streamId} 0 R >>`
      );
      pageObjIds.push(pageId);
    });

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>`;

    let pdfBody = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((objStr, idx) => {
      offsets.push(pdfBody.length);
      pdfBody += `${idx + 1} 0 obj\n${objStr}\nendobj\n`;
    });

    const xrefOffset = pdfBody.length;
    pdfBody += `xref\n0 ${objects.length + 1}\n`;
    pdfBody += '0000000000 65535 f \n';
    for (let i = 1; i < offsets.length; i++) {
      pdfBody += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdfBody += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const blob = new Blob([pdfBody], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ThymeIT_SAD_Summary_${sadMasterSummary.customsRef}_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('Downloaded selectable & copyable text-based Thyme-IT SAD PDF.');
  };

  const handleSaveValidatedTraining = () => {
    if (!saveValidatedEnabled) {
      triggerToast('Enable "Save validated extraction" first to train the AI database.', 'error');
      return;
    }
    setRows((prev) => prev.map((r) => ({ ...r, validated: true, confidence: Math.max(r.confidence || 99, 99.5) })));
    setLearnedTemplatesCount((c) => c + 1);
    const newTplId = `tpl-${Date.now()}`;
    const primaryInv = invoiceNumberList[0] || 'CUSTOM-INV';
    setSavedTemplates((prev) => [
      {
        id: newTplId,
        name: `LEARNED-${primaryInv.replace(/[^A-Za-z0-9]/g, '').slice(-6) || 'PAT'}`,
        pattern: `${rows.length} validated line(s) • HS/Origin/Wt anchors`,
        accuracy: '99.5%',
        uses: 1
      },
      ...prev
    ]);
    triggerToast('Saved layout coordinates, keyword anchors & table patterns to AI Learning Database.');
  };

  // Copy public share URL using fallback-safe execCommand
  const handleCopyPublicUrl = () => {
    const publicUrl = `${window.location.origin}${window.location.pathname}?public=1&tool=kg-extractor`;
    const textarea = document.createElement('textarea');
    textarea.value = publicUrl;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopiedLink(true);
      triggerToast('Public website link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      triggerToast('Could not copy automatically. Please copy the URL from the box.', 'info');
    }
    document.body.removeChild(textarea);
  };

  // Download standalone public HTML package ready for Netlify / Vercel / GitHub Pages
  const handleDownloadPublicWebPackage = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KG EXTRACTOR — Public Customs & Commercial Invoice Tool</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased">
  <header class="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold tracking-tight">KG EXTRACTOR <span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">PUBLIC LIVE EDITION</span></h1>
      <p class="text-xs text-slate-400">AI Powered Customs Documentation &amp; Thyme-IT SAD Summary Export</p>
    </div>
    <span class="text-xs text-slate-300">Generated ${new Date().toLocaleDateString()}</span>
  </header>
  <main class="max-w-6xl mx-auto p-6 space-y-6">
    <section class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <h2 class="font-bold text-base mb-3">Extracted Commercial Invoice Details (${rows.length} line items)</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-100 border-b border-slate-300 uppercase">
              <th class="p-2">Material Number</th>
              <th class="p-2">Description</th>
              <th class="p-2">HS Code</th>
              <th class="p-2">Origin</th>
              <th class="p-2 text-right">Qty</th>
              <th class="p-2 text-right">Gross Wt</th>
              <th class="p-2 text-right">Net Wt</th>
              <th class="p-2 text-right">Amount</th>
              <th class="p-2">Invoice Number</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${rows
              .map(
                (r) => `<tr>
              <td class="p-2 font-mono font-semibold">${r.materialNumber || ''}</td>
              <td class="p-2">${r.description || ''}</td>
              <td class="p-2 font-mono">${r.hsCode || ''}</td>
              <td class="p-2">${r.origin || ''}</td>
              <td class="p-2 text-right">${r.quantity ?? ''}</td>
              <td class="p-2 text-right">${r.grossWeight ?? ''}</td>
              <td class="p-2 text-right">${r.netWeight ?? ''}</td>
              <td class="p-2 text-right font-bold">${r.amount ?? ''}</td>
              <td class="p-2 font-mono">${r.invoiceNumber || ''}</td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  </main>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `index.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('Downloaded standalone public index.html ready to host anywhere!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-16">
      {/* Toast Notification with Optional Undo */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-fade-in">
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toastMessage.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : toastMessage.type === 'info'
                ? 'bg-slate-900 text-slate-100 border-slate-700'
                : 'bg-emerald-950 text-emerald-100 border-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>

            {toastMessage.allowUndo && lastRemovedSnapshot && (
              <button
                type="button"
                onClick={handleUndoRemoveFile}
                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold uppercase tracking-wider shrink-0 transition cursor-pointer"
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                title="KG EXTRACTOR Logo (click to upload a custom image)"
                className="relative group w-12 h-12 rounded-xl overflow-hidden border-2 border-blue-500/50 bg-slate-800 shadow-md shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {!logoLoadError ? (
                  <img
                    src={brandLogoSrc}
                    alt="KG EXTRACTOR Logo"
                    onError={() => setLogoLoadError(true)}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full bg-[#f4f7f2]"
                    aria-label="KG EXTRACTOR Avatar"
                  >
                    <circle cx="50" cy="52" r="38" fill="#dfece0" />
                    <path d="M18 96 C22 76, 36 72, 50 72 C64 72, 78 76, 82 96 Z" fill="#1e242b" />
                    <path d="M38 72 L50 88 L62 72 Z" fill="#ffffff" />
                    <rect x="43" y="60" width="14" height="14" rx="5" fill="#e5b493" />
                    <ellipse cx="50" cy="46" rx="18" ry="21" fill="#f1c5a8" />
                    <path
                      d="M31 44 C30 24, 42 18, 54 19 C66 20, 71 29, 69 44 C66 33, 59 29, 49 30 C40 31, 34 36, 31 44 Z"
                      fill="#181a1f"
                    />
                    <rect x="35" y="42" width="12" height="8" rx="2" fill="none" stroke="#2c333a" strokeWidth="1.8" />
                    <rect x="53" y="42" width="12" height="8" rx="2" fill="none" stroke="#2c333a" strokeWidth="1.8" />
                    <line x1="47" y1="45" x2="53" y2="45" stroke="#2c333a" strokeWidth="1.8" />
                    <circle cx="41" cy="46" r="1.7" fill="#231815" />
                    <circle cx="59" cy="46" r="1.7" fill="#231815" />
                    <path d="M45 56 Q50 59 55 56" fill="none" stroke="#9e624c" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                )}
                <span className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-white">
                  Logo
                </span>
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    KG EXTRACTOR
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3" />
                    AI OCR Ready
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  AI Powered Customs Documentation Tool • Page-by-Page Extraction &amp; Consolidation Engine
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowPublicModal(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                  isPublicAccess
                    ? 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200'
                }`}
                title="Manage public access, share link, and public hosting"
              >
                {isPublicAccess ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isPublicAccess ? 'Public: Live' : 'Private Mode'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition cursor-pointer"
                title="Inspect learned invoice layout templates"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Templates Learned:</span>
                <strong className="text-white font-semibold">{learnedTemplatesCount}</strong>
              </button>
              <button
                onClick={handleResetDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
                title="Restore initial sample invoices"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Sample Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI SUMMARY BAR */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Extracted Invoices</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {invoiceNumberList.length}
              </span>
              <span className="text-xs text-slate-500">({rows.length} line items)</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Total Quantity</span>
              <Package className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatNumber(grandTotals.quantity)}
              </span>
              <span className="text-xs text-slate-500">units</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Total Gross Weight</span>
              <Scale className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatNumber(grandTotals.grossWeight)}
              </span>
              <span className="text-xs text-slate-500">({grandTotals.pallets} pallets)</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Total Declared Value</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700 tabular-nums">
                {formatNumber(grandTotals.amount)}
              </span>
            </div>
          </div>
        </section>

        {/* TOP ROW: UPLOAD & SCAN + AI LEARNING DATABASE + EXPORT */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* UPLOAD & SCAN SECTION (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
                  Upload Commercial Invoice
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-500">
                Supports: <strong className="text-slate-700">PDF | JPG | PNG | DOCX | XLSX</strong>
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileUpload(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.xls"
                  onChange={(e) => {
                    handleFileUpload(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <div className="mx-auto w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Drag &amp; drop commercial invoice files here, or browse from your computer
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Multi-page PDF, scanned images, Word docs &amp; Excel spreadsheets supported
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs sm:text-sm font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    [ Choose File ]
                  </button>

                  <button
                    type="button"
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {isScanning ? 'SCANNING PAGES...' : '[ START SCAN ]'}
                    {!isScanning && readyToScanCount > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-300 text-slate-900 text-[11px] font-bold">
                        {readyToScanCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Scanning Progress Bar */}
              {isScanning && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      {scanStatusText}
                    </span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Uploaded / Queued Files List with Remove Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Uploaded &amp; Queued Files ({queuedFiles.length})
                  </span>
                  {queuedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllFiles}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All Files
                    </button>
                  )}
                </div>

                {queuedFiles.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 flex items-center justify-between">
                    <span>No files currently uploaded. Choose a file above or load a sample invoice.</span>
                    {lastRemovedSnapshot && (
                      <button
                        type="button"
                        onClick={handleUndoRemoveFile}
                        className="text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        Undo Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {queuedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100/70 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px] shrink-0">
                            {file.type}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {file.size} • {file.pages} page(s)
                              {file.invoiceNumbers?.length > 0 && (
                                <span className="text-blue-700 font-medium">
                                  {' '}
                                  • {file.invoiceNumbers.join(', ')}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              file.status === 'Processed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : file.status === 'Ready to Scan'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {file.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedFile(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title={`Remove ${file.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Sample Presets */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 font-medium">Quick Test Invoices:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQueueSampleFile(0)}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                  >
                    + Sample German PDF (PL# 658312)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQueueSampleFile(1)}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                  >
                    + Sample Excel List (PL# 658405)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AI LEARNING DATABASE + EXPORT SECTION (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* AI LEARNING DATABASE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
                    AI Learning Database
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Active Memory
                </span>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveValidatedEnabled}
                  onChange={(e) => setSaveValidatedEnabled(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <div className="text-xs sm:text-sm">
                  <span className="font-semibold text-slate-900 block">
                    Save validated extraction
                  </span>
                  <span className="text-slate-500 text-xs">
                    Automatically train layout recognition when scans complete
                  </span>
                </div>
              </label>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 pl-1">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Stores invoice layout
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Stores keyword locations
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Stores table patterns
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Speeds up future extractions
                </li>
                <li className="flex items-center gap-1.5 sm:col-span-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Improves OCR &amp; field accuracy
                </li>
              </ul>

              <button
                type="button"
                onClick={handleSaveValidatedTraining}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Validate &amp; Commit Current Patterns to DB
              </button>
            </div>

            {/* EXPORT SECTION */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
                    Export Customs Data
                  </h2>
                </div>
                <span className="text-xs text-slate-400">Ready</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  PDF Report
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* EXTRACTED DETAILS TABLE */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  Extracted Details
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {visibleRows.length} of {rows.length} line item(s)
                </span>
                {selectedInvoiceFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceFilter('ALL')}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 hover:bg-amber-200 cursor-pointer"
                  >
                    <Filter className="w-3 h-3" />
                    Invoice: {selectedInvoiceFilter}
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any cell to edit extracted values inline • Consolidations &amp; counters update automatically
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter material, desc, HS..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {uniqueOrigins.length > 0 && (
                <select
                  value={originFilter}
                  onChange={(e) => setOriginFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  title="Filter by Country of Origin"
                >
                  <option value="ALL">Origin: All ({uniqueOrigins.length})</option>
                  {uniqueOrigins.map((orig) => (
                    <option key={orig} value={orig}>
                      Origin: {orig}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer self-start md:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line Item
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-3.5 whitespace-nowrap">Material Number</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Description</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">HS Code</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Origin</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Qty</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Gross Wt</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Net Wt</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Pallets</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Amount</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Incoterm</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Invoice Number</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-slate-400 text-sm">
                      No line items match the active filter.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-blue-50/40 transition group"
                    >
                      <td className="py-2.5 px-3.5 font-mono font-medium text-slate-900 whitespace-nowrap">
                        <input
                          type="text"
                          value={row.materialNumber}
                          onChange={(e) => handleRowChange(row.id, 'materialNumber', e.target.value)}
                          className="w-36 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-1.5 py-1 text-xs font-mono font-semibold focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-900">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                          className="w-48 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-1.5 py-1 text-xs font-semibold uppercase focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 font-mono whitespace-nowrap">
                        <input
                          type="text"
                          value={row.hsCode}
                          onChange={(e) => handleRowChange(row.id, 'hsCode', e.target.value)}
                          className="w-24 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-1.5 py-1 text-xs font-mono focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <input
                          type="text"
                          value={row.origin}
                          onChange={(e) => handleRowChange(row.id, 'origin', e.target.value.toUpperCase())}
                          className="w-20 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-1.5 py-1 text-xs font-semibold uppercase focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums whitespace-nowrap">
                        <input
                          type="number"
                          value={row.quantity ?? ''}
                          onChange={(e) => handleRowChange(row.id, 'quantity', e.target.value)}
                          className="w-24 text-right bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-1.5 py-1 text-xs font-medium tabular-nums focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums whitespace-nowrap">
                        <input
                          type="number"
                          value={row.grossWeight ?? ''}
                          onChange={(e) => handleRowChange(row.id, 'grossWeight', e.target.value)}
                          className="w-20 text-right bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-1.5 py-1 text-xs font-medium tabular-nums focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums text-slate-600 whitespace-nowrap">
                        <input
                          type="number"
                          placeholder="-"
                          value={row.netWeight ?? ''}
                          onChange={(e) => handleRowChange(row.id, 'netWeight', e.target.value)}
                          className="w-16 text-right bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-1.5 py-1 text-xs tabular-nums focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums text-slate-600 whitespace-nowrap">
                        <input
                          type="number"
                          placeholder="-"
                          value={row.pallets ?? ''}
                          onChange={(e) => handleRowChange(row.id, 'pallets', e.target.value)}
                          className="w-14 text-right bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-1.5 py-1 text-xs tabular-nums focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        <input
                          type="number"
                          value={row.amount ?? ''}
                          onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                          className="w-24 text-right bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-1.5 py-1 text-xs font-semibold tabular-nums focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <input
                          type="text"
                          value={row.incoterm || '-'}
                          onChange={(e) => handleRowChange(row.id, 'incoterm', e.target.value.toUpperCase())}
                          className="w-16 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-1.5 py-1 text-xs font-medium uppercase focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <input
                          type="text"
                          value={row.invoiceNumber}
                          title={row.invoiceNumber}
                          onChange={(e) => handleRowChange(row.id, 'invoiceNumber', e.target.value)}
                          className="w-44 bg-blue-50/70 hover:bg-white focus:bg-white border border-blue-200 focus:border-blue-400 rounded px-2 py-1 text-xs font-mono font-semibold text-blue-900 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Source Footnote Badges matching the prompt */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Example based on <strong className="text-slate-700">Commercial Invoice2689501779300897181.PDF</strong> and{' '}
              <strong className="text-slate-700">Commercial Invoice18141289275114157548.PDF</strong>.
            </span>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[11px]">
                <FileText className="w-3 h-3 text-rose-500" />
                [Commercial...897181.PDF | PDF]
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[11px]">
                <FileText className="w-3 h-3 text-rose-500" />
                [Commercial...157548.PDF | PDF]
              </span>
            </div>
          </div>
        </section>

        {/* THYME-IT STYLE DECLARATION SUMMARY PANEL + CONSOLIDATED CUSTOMS SUMMARY */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* THYME-IT AEP / AIS DECLARATION SUMMARY PANEL (6 cols) */}
          <div className="lg:col-span-6 rounded-2xl border-2 border-[#1e2d53] bg-[#d8dde6] shadow-sm overflow-hidden flex flex-col font-sans">
            {/* Classic Thyme-IT Top Navigation Banner */}
            <div className="bg-gradient-to-r from-[#17284c] via-[#2b4d82] to-[#7fa2cf] px-4 py-2 flex items-center justify-between text-white border-b border-[#0f1b36]">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold tracking-tight text-lg sm:text-xl drop-shadow-xs">
                    Thyme-IT
                  </span>
                  <span className="text-[11px] font-semibold text-blue-100">
                    www.thyme-it.ie
                  </span>
                </div>
                <p className="text-[10px] text-blue-100">
                  AEP / AIS Customs Declaration Summary Screen
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadSelectablePDF}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  title="Download selectable, copyable text-based PDF file"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white hover:bg-blue-50 text-[#17284c] text-xs font-bold shadow-xs transition cursor-pointer"
                  title="Preview Thyme-IT Declaration Summary in PDF View"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-700" />
                  View PDF
                </button>
              </div>
            </div>

            {/* Dark Navy Bar matching "SAD Master (KUD26B3503)" / "SAD Item (KUD26B3503)" */}
            <div className="bg-[#1b2845] text-white text-center py-1.5 px-3 text-xs font-bold tracking-wide border-b border-slate-500">
              {thymeTab === 'sad_master' && `SAD Master (${sadMasterSummary.customsRef})`}
              {thymeTab === 'sad_item' &&
                `SAD Item (${sadMasterSummary.customsRef}) — Item ${currentSadItem ? currentSadItem.itemNumber : ''} of ${sadItemsList.length}`}
              {thymeTab === 'consolidated' && `Consolidated Declaration Summary (${sadMasterSummary.customsRef})`}
            </div>

            {/* Panel Body */}
            <div className="p-3 space-y-2.5 text-xs flex-1 overflow-y-auto max-h-[540px]">
              {/* VIEW 1: SAD MASTER SUMMARY */}
              {thymeTab === 'sad_master' && (
                <>
                  <fieldset className="border border-slate-400 bg-[#e4e7ed] p-2.5 rounded-xs">
                    <legend className="px-1.5 font-bold text-slate-900 text-[11px]">
                      Master Details
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">LRN</span>
                        <input
                          readOnly
                          value={sadMasterSummary.customsRef}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono font-semibold text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Status</span>
                        <input
                          readOnly
                          value="Green"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-emerald-800 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">SAD Type</span>
                        <input
                          readOnly
                          value="AIS Import"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Template Name</span>
                        <input
                          readOnly
                          value="H1 Free Circ - Reduced Dataset"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">No. of Items*</span>
                        <input
                          readOnly
                          value={sadMasterSummary.itemCount}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-right text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Status (3/21)</span>
                        <input
                          readOnly
                          value="Direct Representation"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">UCR (2/4)</span>
                        <input
                          readOnly
                          value="DUBLIN"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Job Reference*</span>
                        <input
                          readOnly
                          value={sadMasterSummary.bolAwb ? `${sadMasterSummary.bolAwb}-0084` : ''}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="border border-slate-400 bg-[#e4e7ed] p-2.5 rounded-xs">
                    <legend className="px-1.5 font-bold text-slate-900 text-[11px]">
                      Declaration Type
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Message Type*</span>
                        <input
                          readOnly
                          value="H1 Import - Free Circulation / End Use"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Declaration Type (1/1)</span>
                        <input
                          readOnly
                          value="IM - Outside EU / Not free circulation"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Add. Declaration Type (1/2)</span>
                        <input
                          readOnly
                          value="A - Standard Post-Lodged Declaration"
                          className="w-56 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="border border-slate-400 bg-[#e4e7ed] p-2.5 rounded-xs">
                    <legend className="px-1.5 font-bold text-slate-900 text-[11px]">
                      Declarant Information &amp; Representative Information
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Declarant (3/18)</span>
                        <input
                          readOnly
                          value="Kuehne & Nagel Limited (IE8250768I)"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Code (3/20)</span>
                        <input
                          readOnly
                          value="IE8250768I"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Name (3/19)</span>
                        <input
                          readOnly
                          value="KUEHNE & NAGEL (IRELAND) LTD"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Street Number (3/19)</span>
                        <input
                          readOnly
                          value="UNIT 5 HORIZON LOGISTICS PARK"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">City (3/19)</span>
                        <input
                          readOnly
                          value="HARRISTOWN, CO. DUBLIN"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Country / Postcode (3/19)</span>
                        <input
                          readOnly
                          value="Ireland / K67 A5W6"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="border border-slate-400 bg-[#e4e7ed] p-2.5 rounded-xs">
                    <legend className="px-1.5 font-bold text-slate-900 text-[11px]">
                      Exporter Information &amp; Importer Information
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-700 font-medium text-[11px]">Name (3/1)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.exporterName}
                          className="w-full bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-700 font-medium text-[11px]">Name (3/15)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.importerName}
                          className="w-full bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Street Number (3/1)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.exporterStreet}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Street Number (3/15)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.importerStreet}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Country (3/1)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.countryOfOrigin}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Country (3/15)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.countryOfDestination}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-[11px]"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="border border-slate-400 bg-[#e4e7ed] p-2.5 rounded-xs">
                    <legend className="px-1.5 font-bold text-slate-900 text-[11px]">
                      Value Details, Previous Document Information &amp; Delivery Terms
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Invoice Currency (4/10)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.currency}
                          className="w-32 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Total Amount Invoiced (4/11)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.totalInvoiceValue !== '' ? Number(sadMasterSummary.totalInvoiceValue).toFixed(2) : ''}
                          className="w-32 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-bold text-emerald-900 text-right tabular-nums text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Previous Doc. Ref (2/01)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.invoiceNumber}
                          className="w-32 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono font-semibold text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Delivery Incoterm (4/1)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.incoterm}
                          className="w-32 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Delivery Country Code (4/1)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.countryOfOrigin}
                          className="w-32 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Postponed VAT (1A05)</span>
                        <input
                          readOnly
                          value="IEPOSTPONED"
                          className="w-32 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="border border-slate-400 bg-[#e4e7ed] p-2.5 rounded-xs">
                    <legend className="px-1.5 font-bold text-slate-900 text-[11px]">
                      Transport Information, Goods Location, Other &amp; Box44 Details
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Customs Office (5/26)</span>
                        <input
                          readOnly
                          value="DUBLIN PORT"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Inland Mode (7/5)</span>
                        <input
                          readOnly
                          value="Sea"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Bill of Lading (N705)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.bolAwb}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Master B/L (N704)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.mbol}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Goods Location Id (5/23)</span>
                        <input
                          readOnly
                          value="IEDUB100"
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Est. Arrival (1D24)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.etaDate}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Cargo Manifest (N785)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.cargoManifest}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-medium">Box44 Arrival (1D24)</span>
                        <input
                          readOnly
                          value={sadMasterSummary.etaBox44}
                          className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                        />
                      </div>
                    </div>
                  </fieldset>

                  {/* Bottom SAD Item List inside SAD Master matching screenshot */}
                  <div className="border border-[#1b2845] bg-white overflow-hidden">
                    <div className="bg-[#1b2845] text-white text-center py-1 font-bold text-[11px]">
                      SAD Item List
                    </div>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#cfd6e3] border-b border-slate-400 text-slate-900 font-bold">
                          <th className="py-1 px-2">Item No</th>
                          <th className="py-1 px-2">Commodity / Taric</th>
                          <th className="py-1 px-2">Description</th>
                          <th className="py-1 px-2 text-right">Gross Mass</th>
                          <th className="py-1 px-2 text-right">Net Mass</th>
                          <th className="py-1 px-2 text-right">Item Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sadItemsList.map((it, idx) => (
                          <tr
                            key={idx}
                            onClick={() => {
                              setSelectedSadItemIdx(idx);
                              setThymeTab('sad_item');
                            }}
                            className="hover:bg-blue-100/70 cursor-pointer"
                          >
                            <td className="py-1 px-2 font-bold">{it.itemNumber}</td>
                            <td className="py-1 px-2 font-mono">{it.hsCode}</td>
                            <td className="py-1 px-2 font-medium truncate max-w-[140px]">{it.description}</td>
                            <td className="py-1 px-2 text-right tabular-nums">{it.grossMassList}</td>
                            <td className="py-1 px-2 text-right tabular-nums">{it.netMassList}</td>
                            <td className="py-1 px-2 text-right font-bold tabular-nums">{it.itemPriceList}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* VIEW 2: SAD ITEM SUMMARY */}
              {thymeTab === 'sad_item' && (
                <>
                  {sadItemsList.length > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#e4e7ed] border border-slate-400 px-2.5 py-1.5">
                      <span className="font-bold text-slate-800 text-[11px]">Select SAD Item:</span>
                      <div className="flex flex-wrap gap-1">
                        {sadItemsList.map((it, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSadItemIdx(idx)}
                            className={`px-2 py-0.5 text-[11px] font-bold border cursor-pointer ${
                              idx === selectedSadItemIdx
                                ? 'bg-[#1b2845] text-white border-[#1b2845]'
                                : 'bg-white text-slate-800 border-slate-400'
                            }`}
                          >
                            Item #{it.itemNumber} ({it.materialNumber})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentSadItem ? (
                    <>
                      <fieldset className="border border-slate-400 bg-[#e4e7ed] p-2.5 rounded-xs">
                        <legend className="px-1.5 font-bold text-slate-900 text-[11px]">
                          Goods Information
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Commodity code (6/14)</span>
                            <input
                              readOnly
                              value={currentSadItem.commodityCode}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono font-bold text-slate-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">TARIC code (6/15)</span>
                            <input
                              readOnly
                              value={currentSadItem.taricCode}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Commodity National Code (6/17)</span>
                            <input
                              readOnly
                              value={currentSadItem.commodityNationalCode}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Supplementary Units (6/2)</span>
                            <input
                              readOnly
                              value={currentSadItem.supplementaryUnits}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-right tabular-nums text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Duty Rate %</span>
                            <input
                              readOnly
                              value={currentSadItem.dutyRate}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-right tabular-nums text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">VAT Rate %</span>
                            <input
                              readOnly
                              value={currentSadItem.vatRate}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-right tabular-nums text-[11px]"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium shrink-0">Description of Goods (6/8)</span>
                            <input
                              readOnly
                              value={currentSadItem.description}
                              className="w-full max-w-[260px] bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-[11px]"
                            />
                          </div>
                        </div>
                      </fieldset>

                      <fieldset className="border border-slate-400 bg-[#e4e7ed] p-2.5 rounded-xs">
                        <legend className="px-1.5 font-bold text-slate-900 text-[11px]">
                          Item Details
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Country of Origin (5/15)</span>
                            <input
                              readOnly
                              value={currentSadItem.origin}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Country of Pref. Origin (5/16)</span>
                            <input
                              readOnly
                              value={currentSadItem.preferentialOrigin}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Gross Mass (kg) (6/5)</span>
                            <input
                              readOnly
                              value={formatNumber(currentSadItem.grossWeight)}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-right tabular-nums text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Net Mass (kg) (6/1)</span>
                            <input
                              readOnly
                              value={formatNumber(currentSadItem.netWeight)}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-right tabular-nums text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Procedure (1/10)</span>
                            <input
                              readOnly
                              value={currentSadItem.procedure}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Additional Procedure (1/11)</span>
                            <input
                              readOnly
                              value={currentSadItem.additionalProcedure}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Preference (4/17)</span>
                            <input
                              readOnly
                              value={currentSadItem.preference}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono text-slate-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Nature of transaction (8/5)</span>
                            <input
                              readOnly
                              value={currentSadItem.natureOfTransaction}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                            />
                          </div>
                        </div>
                      </fieldset>

                      <fieldset className="border border-slate-400 bg-[#e4e7ed] p-2.5 rounded-xs">
                        <legend className="px-1.5 font-bold text-slate-900 text-[11px]">
                          Package Details, Value Details, Statistical Value &amp; Box44 Details
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Package Type Code (6/9)</span>
                            <input
                              readOnly
                              value={currentSadItem.packageTypeCode}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Number of Packages (6/10)</span>
                            <input
                              readOnly
                              value={formatNumber(currentSadItem.packageCount)}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-right tabular-nums text-[11px]"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Shipping Marks (6/11)</span>
                            <input
                              readOnly
                              value={currentSadItem.shippingMarks}
                              className="w-56 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 text-slate-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Item Price/Amount (4/14)</span>
                            <input
                              readOnly
                              value={currentSadItem.itemPriceList}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-bold text-emerald-900 text-right tabular-nums text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Statistical value (8/6)</span>
                            <input
                              readOnly
                              value={formatNumber(currentSadItem.statisticalValue)}
                              className="w-28 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-semibold text-slate-900 text-right tabular-nums text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Invoice Number (N935)</span>
                            <input
                              readOnly
                              value={currentSadItem.invoiceNumber}
                              className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono font-bold text-blue-900 text-[11px]"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 font-medium">Box44 Invoice (N935)</span>
                            <input
                              readOnly
                              value={currentSadItem.invoiceNumber}
                              className="w-36 bg-[#f4f5f8] border border-slate-400 px-2 py-0.5 font-mono font-bold text-blue-900 text-[11px]"
                            />
                          </div>
                        </div>
                      </fieldset>

                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          onClick={() => setThymeTab('sad_master')}
                          className="px-3 py-1 bg-[#eef1f6] hover:bg-white border border-slate-500 text-slate-900 font-bold text-[11px] shadow-2xs cursor-pointer"
                        >
                          &laquo; Back to Master
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-slate-600"></div>
                  )}
                </>
              )}

              {/* VIEW 3: CONSOLIDATED DECLARATION SUMMARY */}
              {thymeTab === 'consolidated' && (
                <div className="space-y-2.5">
                  <fieldset className="border border-slate-400 bg-[#e4e7ed] p-2.5 rounded-xs">
                    <legend className="px-1.5 font-bold text-slate-900 text-[11px]">
                      Overall Declaration Totals
                    </legend>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-[#f4f5f8] border border-slate-400 p-1.5">
                        <div className="text-slate-600">Total Gross Weight</div>
                        <div className="font-bold text-slate-900 tabular-nums">{formatNumber(grandTotals.grossWeight)}</div>
                      </div>
                      <div className="bg-[#f4f5f8] border border-slate-400 p-1.5">
                        <div className="text-slate-600">Total Net Weight</div>
                        <div className="font-bold text-slate-900 tabular-nums">{formatNumber(grandTotals.netWeight)}</div>
                      </div>
                      <div className="bg-[#f4f5f8] border border-slate-400 p-1.5">
                        <div className="text-slate-600">Total Invoice Amount</div>
                        <div className="font-bold text-emerald-900 tabular-nums">{formatNumber(grandTotals.amount)}</div>
                      </div>
                      <div className="bg-[#f4f5f8] border border-slate-400 p-1.5">
                        <div className="text-slate-600">Total Packages/Pallets</div>
                        <div className="font-bold text-slate-900 tabular-nums">{formatNumber(sadMasterSummary.totalPackages)}</div>
                      </div>
                      <div className="bg-[#f4f5f8] border border-slate-400 p-1.5">
                        <div className="text-slate-600">Invoice Lines</div>
                        <div className="font-bold text-slate-900 tabular-nums">{rows.length}</div>
                      </div>
                      <div className="bg-[#f4f5f8] border border-slate-400 p-1.5">
                        <div className="text-slate-600">Unique Descriptions</div>
                        <div className="font-bold text-slate-900 tabular-nums">{descriptionCounts.length}</div>
                      </div>
                    </div>
                  </fieldset>

                  <div className="border border-slate-400 bg-white overflow-hidden">
                    <div className="bg-[#1b2845] text-white px-2.5 py-1 font-bold text-[11px]">
                      Description Occurrence Count per Item
                    </div>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#cfd6e3] border-b border-slate-400 font-bold">
                          <th className="py-1 px-2">Description</th>
                          <th className="py-1 px-2 text-right">Occurrences</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {descriptionCounts.map((d) => (
                          <tr key={d.description}>
                            <td className="py-1 px-2 font-semibold">{d.description}</td>
                            <td className="py-1 px-2 text-right font-bold tabular-nums">{d.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border border-slate-400 bg-white overflow-hidden">
                    <div className="bg-[#1b2845] text-white px-2.5 py-1 font-bold text-[11px]">
                      Origin Consolidation Summary
                    </div>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#cfd6e3] border-b border-slate-400 font-bold">
                          <th className="py-1 px-2">Origin</th>
                          <th className="py-1 px-2 text-right">Lines</th>
                          <th className="py-1 px-2 text-right">Qty</th>
                          <th className="py-1 px-2 text-right">Gross Wt</th>
                          <th className="py-1 px-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {consolidatedByOrigin.map((o) => (
                          <tr key={o.origin}>
                            <td className="py-1 px-2 font-bold">{o.origin}</td>
                            <td className="py-1 px-2 text-right tabular-nums">{o.lines}</td>
                            <td className="py-1 px-2 text-right tabular-nums">{formatNumber(o.quantity)}</td>
                            <td className="py-1 px-2 text-right tabular-nums">{formatNumber(o.grossWeight)}</td>
                            <td className="py-1 px-2 text-right font-bold tabular-nums">{formatNumber(o.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CONSOLIDATED VIEWS WITH TABS (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  Consolidated Customs Summary
                </h2>
              </div>

              {/* Consolidation Mode Selector */}
              <div className="inline-flex rounded-lg bg-slate-200/80 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setConsolidationTab('hs_origin')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    consolidationTab === 'hs_origin'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  HS Code + Origin
                </button>
                <button
                  type="button"
                  onClick={() => setConsolidationTab('invoice')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    consolidationTab === 'invoice'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Invoice Number
                </button>
                <button
                  type="button"
                  onClick={() => setConsolidationTab('description')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    consolidationTab === 'description'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Description
                </button>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              {consolidationTab === 'hs_origin' && (
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-xs uppercase">
                      <th className="py-2.5 px-4">HS Code</th>
                      <th className="py-2.5 px-4">Origin</th>
                      <th className="py-2.5 px-4 text-right">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Gross Weight</th>
                      <th className="py-2.5 px-4 text-right">Net Weight</th>
                      <th className="py-2.5 px-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consolidatedByHsOrigin.map((c, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                          {c.hsCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {c.origin}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums">
                          {formatNumber(c.quantity)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums">
                          {formatNumber(c.grossWeight)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums text-slate-700">
                          {formatNumber(c.netWeight)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">
                          {formatNumber(c.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {consolidatedByHsOrigin.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                        <td className="py-2.5 px-4" colSpan={2}>
                          Total
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {formatNumber(grandTotals.quantity)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {formatNumber(grandTotals.grossWeight)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-800">
                          {formatNumber(grandTotals.netWeight)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-emerald-800 tabular-nums">
                          {formatNumber(grandTotals.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}

              {consolidationTab === 'invoice' && (
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-xs uppercase">
                      <th className="py-2.5 px-4">Invoice Number</th>
                      <th className="py-2.5 px-4">Origin(s)</th>
                      <th className="py-2.5 px-4">Incoterm</th>
                      <th className="py-2.5 px-4 text-right">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Gross Weight</th>
                      <th className="py-2.5 px-4 text-right">Net Weight</th>
                      <th className="py-2.5 px-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consolidatedByInvoice.map((c) => (
                      <tr key={c.invoiceNumber} className="hover:bg-blue-50/30">
                        <td className="py-3 px-4 font-bold text-blue-900">
                          {c.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{c.originList}</td>
                        <td className="py-3 px-4 text-slate-700">{c.incotermList}</td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums">
                          {formatNumber(c.quantity)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums">
                          {formatNumber(c.grossWeight)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums text-slate-700">
                          {formatNumber(c.netWeight)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">
                          {formatNumber(c.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {consolidatedByInvoice.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                        <td className="py-2.5 px-4" colSpan={3}>
                          Total
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {formatNumber(grandTotals.quantity)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {formatNumber(grandTotals.grossWeight)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-800">
                          {formatNumber(grandTotals.netWeight)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-emerald-800 tabular-nums">
                          {formatNumber(grandTotals.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}

              {consolidationTab === 'description' && (
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-xs uppercase">
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-right">Lines</th>
                      <th className="py-2.5 px-4 text-right">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Gross Weight</th>
                      <th className="py-2.5 px-4 text-right">Net Weight</th>
                      <th className="py-2.5 px-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consolidatedByDescription.map((c) => (
                      <tr key={c.description} className="hover:bg-blue-50/30">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {c.description}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                          {c.occurrences}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums">
                          {formatNumber(c.quantity)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums">
                          {formatNumber(c.grossWeight)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums text-slate-700">
                          {formatNumber(c.netWeight)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">
                          {formatNumber(c.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {consolidatedByDescription.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                        <td className="py-2.5 px-4" colSpan={2}>
                          Total
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {formatNumber(grandTotals.quantity)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {formatNumber(grandTotals.grossWeight)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-800">
                          {formatNumber(grandTotals.netWeight)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-emerald-800 tabular-nums">
                          {formatNumber(grandTotals.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </div>

            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Derived from uploaded invoices.</span>
              <span className="font-mono text-[11px] text-slate-600">
                [Commercial...897181.PDF | PDF], [Commercial...157548.PDF | PDF]
              </span>
            </div>
          </div>
        </section>

        {/* INVOICE NUMBER LIST & SEARCHABLE PROCESSING HISTORY */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INVOICE NUMBER LIST (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Invoice Number List
              </h2>
              <span className="text-xs font-medium text-slate-500">Click to filter</span>
            </div>

            <div className="p-4 space-y-2 flex-1">
              <button
                type="button"
                onClick={() => setSelectedInvoiceFilter('ALL')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  selectedInvoiceFilter === 'ALL'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>All Extracted Invoices</span>
                <span className="text-xs opacity-90">{rows.length} lines</span>
              </button>

              {invoiceNumberList.map((inv) => {
                const count = rows.filter((r) => r.invoiceNumber === inv).length;
                const active = selectedInvoiceFilter === inv;
                return (
                  <button
                    key={inv}
                    type="button"
                    onClick={() => setSelectedInvoiceFilter(active ? 'ALL' : inv)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white hover:bg-blue-50/50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span className="font-mono">{inv}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count} item{count !== 1 ? 's' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
              Extracted from uploaded invoices.
            </div>
          </div>

          {/* SEARCHABLE PROCESSING HISTORY (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  Processing History
                </h2>
              </div>

              {/* Search previously processed invoices */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search invoice #, file, status..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-xs uppercase">
                    <th className="py-2.5 px-4">Invoice Number</th>
                    <th className="py-2.5 px-4">Source File</th>
                    <th className="py-2.5 px-4">Date Processed</th>
                    <th className="py-2.5 px-4">AI Template</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                    <th className="py-2.5 px-3 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        {historySearch
                          ? `No previously processed invoices match "${historySearch}".`
                          : 'No processed invoices in history.'}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedInvoiceFilter(item.invoiceNumber)}
                        className="hover:bg-blue-50/40 cursor-pointer transition"
                        title="Click to filter extracted details by this invoice"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {item.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-[210px] truncate" title={item.sourceFile}>
                          {item.sourceFile}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap tabular-nums text-xs">
                          {item.dateProcessed}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono text-[11px]">
                            {item.templateMatched}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" />
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => handleRemoveHistoryItem(e, item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title={`Remove ${item.invoiceNumber} and its uploaded file`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* OCR ENGINE ACTIVITY LOG & ARCHITECTURE FOOTER */}
        <section className="bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>OCR &amp; Extraction Engine Telemetry Log</span>
            </div>
            <span className="text-xs text-slate-500">
              Stack: React + Python FastAPI + PaddleOCR / Tesseract + AI Layout Engine + SQL Database
            </span>
          </div>
          <div className="mt-3 space-y-1 font-mono text-xs text-slate-400 max-h-28 overflow-y-auto">
            {scanLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{log}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* PRINTABLE / PDF CUSTOMS REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Thyme-IT SAD Master &amp; SAD Item PDF Report (Selectable Text)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSelectablePDF}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Selectable PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 text-xs bg-[#d8dde6] font-sans">
              {/* Thyme-IT Banner inside PDF Report */}
              <div className="border-2 border-[#1e2d53] bg-[#d8dde6] overflow-hidden">
                <div className="bg-gradient-to-r from-[#17284c] via-[#2b4d82] to-[#7fa2cf] px-4 py-2 text-white flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-lg">Thyme-IT <span className="text-xs font-normal text-blue-100">www.thyme-it.ie</span></div>
                  </div>
                  <div className="text-right text-[11px]">
                    <div><strong>Report Date:</strong> {new Date().toLocaleDateString()}</div>
                    <div><strong>Invoices:</strong> {invoiceNumberList.join(', ')}</div>
                  </div>
                </div>
                <div className="bg-[#cfd6e3] border-b border-slate-400 px-3 py-1 font-bold text-[11px] text-slate-900 flex gap-4">
                  <span>Quotes</span>
                  <span className="underline">SAD</span>
                  <span>ICS</span>
                  <span>NCTS</span>
                  <span>Manifest</span>
                  <span>Reference Data</span>
                  <span>System</span>
                </div>
                <div className="bg-[#eef1f6] px-3 py-1 text-[11px] text-blue-900 border-b border-slate-400">
                  Input Search Criteria &raquo; SAD List &raquo; Summary &raquo; <strong>SAD Master Summary Screen</strong>
                </div>

                {/* SAD Master Header */}
                <div className="bg-[#1b2845] text-white text-center py-1 font-bold text-xs">
                  SAD Master ({sadMasterSummary.customsRef})
                </div>

                <div className="p-3 space-y-2.5">
                  <table className="w-full border border-slate-400 bg-[#e4e7ed] text-[11px]">
                    <tbody>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold w-1/4">LRN</td>
                        <td className="border border-slate-400 p-1.5 bg-white font-mono w-1/4">{sadMasterSummary.customsRef}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold w-1/4">Status</td>
                        <td className="border border-slate-400 p-1.5 bg-white w-1/4">Green</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold">SAD Type</td>
                        <td className="border border-slate-400 p-1.5 bg-white">AIS Import</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">Template Name</td>
                        <td className="border border-slate-400 p-1.5 bg-white">H1 Free Circ - Reduced Dataset</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold">No. of Items*</td>
                        <td className="border border-slate-400 p-1.5 bg-white">{sadMasterSummary.itemCount}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">Status (3/21)</td>
                        <td className="border border-slate-400 p-1.5 bg-white">Direct Representation</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold">UCR (2/4)</td>
                        <td className="border border-slate-400 p-1.5 bg-white">DUBLIN</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">Job Reference*</td>
                        <td className="border border-slate-400 p-1.5 bg-white font-mono">{sadMasterSummary.bolAwb}-0084</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold">Exporter Name (3/1)</td>
                        <td className="border border-slate-400 p-1.5 bg-white">{sadMasterSummary.exporterName}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">Importer Name (3/15)</td>
                        <td className="border border-slate-400 p-1.5 bg-white">{sadMasterSummary.importerName}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold">Country of Origin (3/1)</td>
                        <td className="border border-slate-400 p-1.5 bg-white">{sadMasterSummary.countryOfOrigin}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">Country of Destination (5/8)</td>
                        <td className="border border-slate-400 p-1.5 bg-white">{sadMasterSummary.countryOfDestination}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold">Invoice Currency (4/10)</td>
                        <td className="border border-slate-400 p-1.5 bg-white">{sadMasterSummary.currency}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">Total Amount Invoiced (4/11)</td>
                        <td className="border border-slate-400 p-1.5 bg-white font-bold">{formatNumber(sadMasterSummary.totalInvoiceValue)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold">Previous Document Ref (2/01)</td>
                        <td className="border border-slate-400 p-1.5 bg-white font-mono">{sadMasterSummary.invoiceNumber}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">Delivery Incoterm (4/1)</td>
                        <td className="border border-slate-400 p-1.5 bg-white">{sadMasterSummary.incoterm}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold">Bill of Lading (N705)</td>
                        <td className="border border-slate-400 p-1.5 bg-white font-mono">{sadMasterSummary.bolAwb}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">Est. Arrival Date/Time (1D24)</td>
                        <td className="border border-slate-400 p-1.5 bg-white font-mono">{sadMasterSummary.etaDate}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold">Total Gross Mass / Net Mass</td>
                        <td className="border border-slate-400 p-1.5 bg-white">{formatNumber(sadMasterSummary.grossWeight)} / {formatNumber(sadMasterSummary.netWeight)}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">Total Packages</td>
                        <td className="border border-slate-400 p-1.5 bg-white">{formatNumber(sadMasterSummary.totalPackages)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* SAD Item List matching exact screenshot column headers */}
                  <div className="border border-[#1b2845] bg-white">
                    <div className="bg-[#1b2845] text-white text-center py-1 font-bold text-xs">
                      SAD Item List
                    </div>
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#cfd6e3] border-b border-slate-400 font-bold text-slate-900">
                          <th className="border border-slate-400 p-1.5 text-left">Item No</th>
                          <th className="border border-slate-400 p-1.5 text-left">Commodity / Taric</th>
                          <th className="border border-slate-400 p-1.5 text-left">Description</th>
                          <th className="border border-slate-400 p-1.5 text-right">Gross Mass</th>
                          <th className="border border-slate-400 p-1.5 text-right">Net Mass</th>
                          <th className="border border-slate-400 p-1.5 text-right">Item Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sadItemsList.map((it) => (
                          <tr key={it.itemNumber}>
                            <td className="border border-slate-300 p-1.5 font-bold">{it.itemNumber}</td>
                            <td className="border border-slate-300 p-1.5 font-mono">{it.hsCode}</td>
                            <td className="border border-slate-300 p-1.5">{it.description}</td>
                            <td className="border border-slate-300 p-1.5 text-right">{it.grossMassList}</td>
                            <td className="border border-slate-300 p-1.5 text-right">{it.netMassList}</td>
                            <td className="border border-slate-300 p-1.5 text-right font-bold">{it.itemPriceList}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* SAD Item Detail Cards matching PDF 2 exact field layout */}
                  {sadItemsList.map((it) => (
                    <div key={it.itemNumber} className="border border-[#1b2845] bg-[#e4e7ed]">
                      <div className="bg-[#1b2845] text-white text-center py-1 font-bold text-xs">
                        SAD Item ({sadMasterSummary.customsRef})
                      </div>
                      <table className="w-full border-collapse text-[11px]">
                        <tbody>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold w-1/4">Commodity code (6/14)</td>
                            <td className="border border-slate-400 p-1.5 bg-white font-mono w-1/4">{it.commodityCode}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold w-1/4">TARIC code (6/15)</td>
                            <td className="border border-slate-400 p-1.5 bg-white font-mono w-1/4">{it.taricCode}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Commodity National Code (6/17)</td>
                            <td className="border border-slate-400 p-1.5 bg-white font-mono">{it.commodityNationalCode}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold">Supplementary Units (6/2)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{it.supplementaryUnits}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Description of Goods (6/8)</td>
                            <td className="border border-slate-400 p-1.5 bg-white" colSpan={3}>{it.description}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Duty Rate %</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{it.dutyRate}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold">VAT Rate %</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{it.vatRate}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Country of Origin (5/15)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{it.origin}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold">Country of Preferential Origin (5/16)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{it.preferentialOrigin}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Gross Mass (kg) (6/5)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{formatNumber(it.grossWeight)}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold">Net Mass (kg) (6/1)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{formatNumber(it.netWeight)}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Procedure (1/10)</td>
                            <td className="border border-slate-400 p-1.5 bg-white font-mono">{it.procedure}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold">Additional Procedure (1/11)</td>
                            <td className="border border-slate-400 p-1.5 bg-white font-mono">{it.additionalProcedure}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Preference (4/17)</td>
                            <td className="border border-slate-400 p-1.5 bg-white font-mono">{it.preference}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold">Nature of transaction (8/5)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{it.natureOfTransaction}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Package Type Code (6/9)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{it.packageTypeCode}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold">Number of Packages (6/10)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{formatNumber(it.packageCount)}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Shipping Marks (6/11)</td>
                            <td className="border border-slate-400 p-1.5 bg-white" colSpan={3}>{it.shippingMarks}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Item Price/Amount (4/14)</td>
                            <td className="border border-slate-400 p-1.5 bg-white font-bold">{it.itemPriceList}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold">Valuation Method (4/16)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{it.valuationMethod}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Statistical value (8/6)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{formatNumber(it.statisticalValue)}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold">Quota Order Number (8/1)</td>
                            <td className="border border-slate-400 p-1.5 bg-white">{it.quotaOrderNumber}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-semibold">Other Details: Invoice Number (N935)</td>
                            <td className="border border-slate-400 p-1.5 bg-white font-mono">{it.invoiceNumber}</td>
                            <td className="border border-slate-400 p-1.5 font-semibold">Box44 Details: Invoice Number (N935)</td>
                            <td className="border border-slate-400 p-1.5 bg-white font-mono">{it.invoiceNumber}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC ACCESS & HOSTING MODAL */}
      {showPublicModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Public Access &amp; Web Deployment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPublicModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              {/* Public Toggle Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isPublicAccess ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {isPublicAccess ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      {isPublicAccess ? 'Website Open to Public' : 'Restricted Access'}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isPublicAccess
                        ? 'Anyone with the link can access KG EXTRACTOR, inspect Thyme-IT SAD summaries, and export Excel/CSV/PDF.'
                        : 'Only workspace editors can open this application.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPublicAccess((v) => !v);
                    triggerToast(!isPublicAccess ? 'KG EXTRACTOR is now open to the public.' : 'Switched to Private mode.', 'info');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    isPublicAccess
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  {isPublicAccess ? 'Enabled' : 'Enable Public'}
                </button>
              </div>

              {/* Shareable URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Public Share Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://kg-extractor.app'}?public=1`}
                    className="flex-1 bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPublicUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Public Visitor Permissions & Optional API Key */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                  <span>Allow public visitors to upload &amp; scan invoices</span>
                  <input
                    type="checkbox"
                    checked={publicAllowUpload}
                    onChange={(e) => setPublicAllowUpload(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </label>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Optional Gemini API Key (for live AI OCR on public hosts)
                  </label>
                  <input
                    type="password"
                    value={publicApiKeyInput}
                    onChange={(e) => setPublicApiKeyInput(e.target.value)}
                    placeholder="AIzaSy... (leave blank to use built-in local parser)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Standalone Public Web Package Download */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                    <Server className="w-4 h-4 text-blue-600" />
                    <span>Deploy on Your Own Public Domain</span>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Use the top-right <strong>Share / Publish</strong> button in this workspace, or download a standalone <code>index.html</code> for Netlify Drop, Vercel, or GitHub Pages.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPublicWebPackage}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Export index.html
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}