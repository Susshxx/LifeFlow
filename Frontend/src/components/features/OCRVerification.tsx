// import React, { useState } from 'react';
// import { createWorker } from 'tesseract.js';
// import {
//   UploadIcon,
//   CheckCircleIcon,
//   XCircleIcon,
//   AlertCircleIcon,
//   FileTextIcon,
//   Loader2Icon,
// } from 'lucide-react';
// import { Button } from '../ui/Button';
// import { Alert } from '../ui/Alert';
// import { Card } from '../ui/Card';

// interface OCRVerificationProps {
//   userType: 'user' | 'hospital' | 'admin';
//   onVerificationComplete: (data: OCRVerificationData) => void;
//   expectedAdminName?: string;
// }

// const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// export interface OCRVerificationData {
//   documentType: string;
//   fullName: string;
//   documentNumber: string;
//   dateOfBirth: {
//     year: string;
//     month: string;
//     day: string;
//   };
//   isVerified: boolean;
//   confidence: number;
//   documentPhotoBase64: string;
// }

// // ── Constants ─────────────────────────────────────────────────────────────────
// const MONTH_MAP: Record<string, string> = {
//   jan: '1', feb: '2', mar: '3', apr: '4', may: '5', jun: '6',
//   jul: '7', aug: '8', sep: '9', oct: '10', nov: '11', dec: '12',
//   january: '1', february: '2', march: '3', april: '4',
//   june: '6', july: '7', august: '8', september: '9',
//   october: '10', november: '11', december: '12',
// };

// const MONTH_NAMES = [
//   '', 'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December',
// ];

// // ── Helpers ───────────────────────────────────────────────────────────────────
// function devanagariToArabic(str: string): string {
//   return str.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)));
// }

// function cleanLine(line: string): string {
//   return line.replace(/\s{2,}/g, ' ').trim();
// }

// function looksLikeEnglishName(text: string): boolean {
//   const words = text.trim().split(/\s+/);
//   if (words.length < 2 || words.length > 6) return false;
//   return words.every((w) => /^[A-Z][A-Za-z'-]{1,}$/.test(w));
// }

// /**
//  * Normalise a line for number matching:
//  * - em/en dashes → hyphen
//  * - spaces around hyphens removed
//  * - OCR letter/digit confusion: O→0, l→1 between digits
//  */
// function normaliseLine(line: string): string {
//   return line
//     .replace(/[–—]/g, '-')
//     .replace(/\s*-\s*/g, '-')
//     .replace(/(?<=[\d-])O(?=[\d-])/g, '0')
//     .replace(/(?<=[\d-])l(?=[\d-])/g, '1');
// }

// // ── Certificate number extraction ─────────────────────────────────────────────
// //
// // Two formats on Nepali citizenship certificates:
// //   Format A:  44-01-77-05535   (4 groups, 2-digit segments)
// //   Format B:  2155-5195        (2 groups, 4-digit segments)
// //
// // Critical fix: use \b and minimum 4 digits for Format B groups
// // so "155" cannot be matched from inside "2155".
// //
// function extractCertificateNumber(lines: string[]): string {
//   // ── Strategy 1: label + number on SAME LINE ───────────────────────────────
//   for (const rawLine of lines) {
//     const line = normaliseLine(rawLine);

//     // Format A: XX-XX-XX-XXXXX  (e.g. 44-01-77-05535)
//     const mA = line.match(
//       /Certif\w*\s+No[^a-z\d]{0,6}(\d{2,4}-\d{2,4}-\d{2,4}-\d{4,6})\b/i
//     );
//     if (mA) return mA[1];

//     // Format B: XXXX-XXXX  (e.g. 2155-5195)
//     // \b on both ends and minimum 4 digits prevents partial matches like 155-5195
//     const mB = line.match(
//       /Certif\w*\s+No[^a-z\d]{0,6}\b(\d{4,6}-\d{4,6})\b/i
//     );
//     if (mB) return mB[1];
//   }

//   // ── Strategy 2: label on one line, number on the NEXT line ───────────────
//   for (let i = 0; i < lines.length - 1; i++) {
//     const labelLine = normaliseLine(lines[i]);
//     if (/Certif\w+\s+No[^a-z\d]{0,6}\s*$/i.test(labelLine)) {
//       const next = normaliseLine(lines[i + 1]);
//       const mA = next.match(/^(\d{2,4}-\d{2,4}-\d{2,4}-\d{4,6})\b/);
//       if (mA) return mA[1];
//       const mB = next.match(/^\b(\d{4,6}-\d{4,6})\b/);
//       if (mB) return mB[1];
//     }
//   }

//   // ── Strategy 3: bare Format A pattern anywhere (no label needed) ──────────
//   for (const rawLine of lines) {
//     const line = normaliseLine(rawLine);
//     const mA = line.match(/\b(\d{2,4}-\d{2,4}-\d{2,4}-\d{4,6})\b/);
//     if (mA) return mA[1];
//   }

//   // ── Strategy 4: bare Format B — only when line contains "No" context ──────
//   for (const rawLine of lines) {
//     const line = normaliseLine(rawLine);
//     if (/No[^a-z]/i.test(line)) {
//       const mB = line.match(/\b(\d{4,6}-\d{4,6})\b/);
//       if (mB) return mB[1];
//     }
//   }

//   // ── Strategy 5: Devanagari digit conversion fallback ─────────────────────
//   for (const rawLine of lines) {
//     const line = normaliseLine(devanagariToArabic(rawLine));
//     const mA = line.match(/\b(\d{2,4}-\d{2,4}-\d{2,4}-\d{4,6})\b/);
//     if (mA) return mA[1];
//     if (/No[^a-z]/i.test(line)) {
//       const mB = line.match(/\b(\d{4,6}-\d{4,6})\b/);
//       if (mB) return mB[1];
//     }
//   }

//   return '';
// }

// // ── Full name extraction ──────────────────────────────────────────────────────
// function extractFullName(lines: string[]): string {
//   // Strategy 1: "Full Name.:" value on same line
//   for (const line of lines) {
//     const m = line.match(/Full\s*Name[\s.\-:]+([A-Z][A-Za-z\s'\-]{3,})/i);
//     if (m) {
//       const candidate = m[1].trim();
//       if (candidate.split(' ').length >= 2) return candidate;
//     }
//   }
//   // Strategy 2: plain "Name:" on same line
//   for (const line of lines) {
//     const m = line.match(/^Name\s*[.:\-]+\s*([A-Z][A-Za-z\s'\-]{3,})/i);
//     if (m) {
//       const candidate = m[1].trim();
//       if (candidate.split(' ').length >= 2) return candidate;
//     }
//   }
//   // Strategy 3: name on next line after label-only line
//   for (let i = 0; i < lines.length - 1; i++) {
//     if (/^(Full\s*)?Name[\s.:]*$/i.test(lines[i])) {
//       const candidate = lines[i + 1].trim();
//       if (looksLikeEnglishName(candidate)) return candidate;
//     }
//   }
//   // Strategy 4: longest ALL-CAPS line that looks like a name
//   let best = '';
//   for (const line of lines) {
//     if (
//       looksLikeEnglishName(line) &&
//       line === line.toUpperCase() &&
//       line.length > best.length
//     ) best = line;
//   }
//   if (best) return best;
//   // Strategy 5: any line that looks like an English name
//   for (const line of lines) {
//     if (looksLikeEnglishName(line) && line.length > best.length) best = line;
//   }
//   return best || 'UNREADABLE';
// }

// // ── Date of birth extraction ──────────────────────────────────────────────────
// interface DOB { year: string; month: string; day: string }

// function resolveMonth(raw: string): string {
//   const lower = raw.toLowerCase();
//   // Try full word match first, then 3-char prefix
//   return MONTH_MAP[lower] ?? MONTH_MAP[lower.substring(0, 3)] ?? (
//     isNaN(Number(raw)) ? '' : String(Number(raw))
//   );
// }

// function extractDateOfBirth(lines: string[]): DOB {
//   let year = '', month = '', day = '';

//   // Pass 1: full DOB line "Date of Birth (AD): Year:2003 Month:SEP Day:25"
//   for (const line of lines) {
//     if (/Date\s*of\s*Birth/i.test(line)) {
//       const y = line.match(/Year\s*[:\-]?\s*(\d{4})/i);
//       if (y) year = y[1];
//       const m = line.match(/Month\s*[:\-]?\s*([A-Za-z]{2,}|\d{1,2})\b/i);
//       if (m) month = resolveMonth(m[1]);
//       const d = line.match(/Day\s*[:\-]?\s*(\d{1,2})\b/i);
//       if (d) day = String(Number(d[1]));
//       if (year && month && day) return { year, month, day };
//     }
//   }

//   // Pass 2: scan every line for Year / Month / Day labels
//   for (const line of lines) {
//     if (!year) {
//       const y = line.match(/\bYear\s*[:\-]?\s*(\d{4})\b/i);
//       if (y) year = y[1];
//     }
//     if (!month) {
//       const m = line.match(/\bMonth\s*[:\-]?\s*([A-Za-z]{2,}|\d{1,2})\b/i);
//       if (m) month = resolveMonth(m[1]);
//     }
//     if (!day) {
//       const d = line.match(/\bDay\s*[:\-]?\s*(\d{1,2})\b/i);
//       if (d) day = String(Number(d[1]));
//     }
//   }

//   // Pass 3: Devanagari side "साल: २०६० महिना: ०६ गते: ०८"
//   if (!year || !month || !day) {
//     for (const line of lines) {
//       const c = devanagariToArabic(line);
//       if (!year) {
//         const y = c.match(/(?:साल|Year)\s*[:\-]?\s*(\d{4})/i);
//         if (y) year = y[1];
//       }
//       if (!month) {
//         const m = c.match(/(?:महिना|Month)\s*[:\-]?\s*(\d{1,2})/i);
//         if (m) month = String(Number(m[1]));
//       }
//       if (!day) {
//         const d = c.match(/(?:गते|Day)\s*[:\-]?\s*(\d{1,2})/i);
//         if (d) day = String(Number(d[1]));
//       }
//     }
//   }

//   // Pass 4: generic date formats ISO / DMY (last resort)
//   if (!year || !month || !day) {
//     for (const line of lines) {
//       const iso = line.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
//       if (iso) {
//         year  = year  || iso[1];
//         month = month || String(Number(iso[2]));
//         day   = day   || String(Number(iso[3]));
//         break;
//       }
//       const dmy = line.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
//       if (dmy) {
//         day   = day   || String(Number(dmy[1]));
//         month = month || String(Number(dmy[2]));
//         year  = year  || dmy[3];
//         break;
//       }
//     }
//   }

//   return { year, month, day };
// }

// // ── Main OCR runner ───────────────────────────────────────────────────────────
// async function extractFromCitizenship(
//   file: File,
//   onProgress: (msg: string) => void
// ): Promise<{ name: string; certificateNumber: string; dob: DOB }> {
//   onProgress('Loading OCR engine…');

//   const worker = await createWorker('eng', 1, {
//     logger: (m) => {
//       if (m.status === 'recognizing text') {
//         onProgress(`Scanning… ${Math.round(m.progress * 100)}%`);
//       }
//     },
//   });

//   try {
//     await worker.setParameters({
//       tessedit_pageseg_mode: '6' as any,
//       tessedit_char_whitelist:
//         'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz 0123456789.,:;-/()',
//     });

//     onProgress('Reading document…');
//     const { data } = await worker.recognize(file);

//     const lines = data.text
//       .split('\n')
//       .map(cleanLine)
//       .filter((l) => l.length > 1);

//     const name              = extractFullName(lines);
//     const certificateNumber = extractCertificateNumber(lines);
//     const dob               = extractDateOfBirth(lines);

//     return { name, certificateNumber, dob };
//   } finally {
//     await worker.terminate();
//   }
// }

// function monthName(m: string): string {
//   const n = Number(m);
//   return n >= 1 && n <= 12 ? MONTH_NAMES[n] : m;
// }

// // ── Component ─────────────────────────────────────────────────────────────────
// export function OCRVerification({
//   userType,
//   onVerificationComplete,
//   expectedAdminName = 'Sushanta Marahatta',
// }: OCRVerificationProps) {
//   const [selectedFile, setSelectedFile]             = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl]                 = useState<string | null>(null);
//   const [previewBase64, setPreviewBase64]           = useState<string>('');
//   const [isProcessing, setIsProcessing]             = useState(false);
//   const [progressMsg, setProgressMsg]               = useState('');
//   const [verificationResult, setVerificationResult] = useState<OCRVerificationData | null>(null);
//   const [error, setError]                           = useState<string | null>(null);
//   const [editedName, setEditedName]                 = useState<string>('');
//   const [isEditingName, setIsEditingName]           = useState(false);

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (!file.type.startsWith('image/')) {
//       setError('Please upload an image file (JPG, PNG, etc.)');
//       return;
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       setError('File size must be less than 5MB');
//       return;
//     }
//     setSelectedFile(file);
//     setError(null);
//     setVerificationResult(null);

//     const reader = new FileReader();
//     reader.onloadend = () => {
//       const dataUrl = reader.result as string;
//       setPreviewUrl(dataUrl);
//       setPreviewBase64(dataUrl);
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleVerify = async () => {
//     if (!selectedFile || !previewBase64) return;
//     setIsProcessing(true);
//     setError(null);
//     setProgressMsg('Starting…');

//     try {
//       const { name, certificateNumber, dob } = await extractFromCitizenship(
//         selectedFile,
//         setProgressMsg
//       );

//       if (name === 'UNREADABLE') {
//         setError(
//           'Could not read the name from the document. Please upload the English side of the certificate — ensure it is well-lit, flat, and in focus.'
//         );
//         return;
//       }

//       // For hospitals, check for duplicates before proceeding
//       if (userType === 'hospital') {
//         setProgressMsg('Checking for duplicate registrations…');
//         try {
//           const checkRes = await fetch(`${API}/api/auth/check-hospital-duplicate`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               hospitalName: name,
//               certificateNumber: certificateNumber,
//               documentPhoto: previewBase64
//             })
//           });

//           const checkData = await checkRes.json();

//           if (!checkRes.ok) {
//             // Duplicate found
//             setError(checkData.error || 'This hospital is already registered in our system.');
//             setIsProcessing(false);
//             setProgressMsg('');
//             return;
//           }
//         } catch (err: any) {
//           console.error('Duplicate check error:', err);
//           setError('Failed to verify hospital registration. Please try again.');
//           setIsProcessing(false);
//           setProgressMsg('');
//           return;
//         }
//       }

//       const isVerified =
//         userType === 'admin'
//           ? name.toLowerCase().trim() === expectedAdminName.toLowerCase().trim()
//           : true;

//       const docNumber =
//         certificateNumber || 'CC-' + Math.floor(Math.random() * 900000 + 100000);

//       const formattedName = name
//         .split(' ')
//         .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
//         .join(' ');

//       const result: OCRVerificationData = {
//         documentType:
//           userType === 'hospital'
//             ? 'Hospital Registration Certificate'
//             : 'Citizenship Certificate',
//         fullName:            formattedName,
//         documentNumber:      docNumber,
//         dateOfBirth:         dob,
//         isVerified,
//         confidence:          0.92,
//         documentPhotoBase64: previewBase64,
//       };

//       setVerificationResult(result);
//       if (result.isVerified) {
//         setEditedName(formattedName); // Initialize edited name with OCR result
//         onVerificationComplete(result);
//       }
//     } catch (err: any) {
//       console.error('OCR error:', err);
//       setError(err?.message ?? 'Failed to process document. Please try again.');
//     } finally {
//       setIsProcessing(false);
//       setProgressMsg('');
//     }
//   };

//   const handleReset = () => {
//     setPreviewUrl(null);
//     setPreviewBase64('');
//     setSelectedFile(null);
//     setVerificationResult(null);
//     setError(null);
//     setProgressMsg('');
//     setEditedName('');
//     setIsEditingName(false);
//   };

//   const handleNameEdit = () => {
//     setIsEditingName(true);
//   };

//   const handleNameSave = async () => {
//     if (!editedName.trim()) {
//       setError('Hospital name cannot be empty.');
//       return;
//     }

//     if (!verificationResult) return;

//     // For hospitals, check for duplicates with the new name
//     if (userType === 'hospital') {
//       setIsProcessing(true);
//       setError(null);
//       try {
//         const checkRes = await fetch(`${API}/api/auth/check-hospital-duplicate`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             hospitalName: editedName.trim(),
//             certificateNumber: verificationResult.documentNumber,
//             documentPhoto: previewBase64
//           })
//         });

//         const checkData = await checkRes.json();

//         if (!checkRes.ok) {
//           setError(checkData.error || 'This hospital is already registered in our system.');
//           setIsProcessing(false);
//           return;
//         }
//       } catch (err: any) {
//         console.error('Duplicate check error:', err);
//         setError('Failed to verify hospital registration. Please try again.');
//         setIsProcessing(false);
//         return;
//       } finally {
//         setIsProcessing(false);
//       }
//     }

//     // Update the verification result with edited name
//     const updatedResult = {
//       ...verificationResult,
//       fullName: editedName.trim()
//     };
    
//     setVerificationResult(updatedResult);
//     setIsEditingName(false);
//     onVerificationComplete(updatedResult);
//   };

//   const handleNameCancel = () => {
//     setEditedName(verificationResult?.fullName || '');
//     setIsEditingName(false);
//     setError(null);
//   };

//   const getDocumentTypeLabel = () => {
//     switch (userType) {
//       case 'hospital': return 'Hospital Registration Certificate';
//       case 'admin':    return 'Admin Authorization Document';
//       default:         return 'Citizenship Certificate (English side)';
//     }
//   };

//   const getInstructions = () => {
//     switch (userType) {
//       case 'hospital':
//         return 'Upload a clear photo of your hospital registration certificate.';
//       case 'admin':
//         return `Upload the English side of your citizenship certificate. The system will verify your identity as ${expectedAdminName}.`;
//       default:
//         return 'Upload the English side of your citizenship certificate. Your name, certificate number, and date of birth will be extracted automatically.';
//     }
//   };

//   const dob = verificationResult?.dateOfBirth;
//   const dobDisplay =
//     dob && (dob.year || dob.month || dob.day)
//       ? [
//           dob.day   ? `Day ${dob.day}`     : null,
//           dob.month ? monthName(dob.month)  : null,
//           dob.year  || null,
//         ].filter(Boolean).join(' ')
//       : 'Not detected';

//   return (
//     <div className="space-y-6">
//       <Alert variant="info">
//         <div className="flex items-start gap-2">
//           <AlertCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
//           <div>
//             <p className="font-medium">Document Verification Required</p>
//             <p className="text-sm mt-1">{getInstructions()}</p>
//           </div>
//         </div>
//       </Alert>

//       {/* Upload area */}
//       {!previewUrl && (
//         <Card className="border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
//           <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
//             <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
//             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
//               <UploadIcon className="w-8 h-8 text-primary" />
//             </div>
//             <p className="text-lg font-medium text-gray-900 mb-1">
//               Upload {getDocumentTypeLabel()}
//             </p>
//             <p className="text-sm text-gray-500 mb-2">Click to browse or drag and drop</p>
//             <p className="text-xs text-gray-400">Supported: JPG, PNG · Max 5MB</p>
//           </label>
//         </Card>
//       )}

//       {/* Preview + processing + result */}
//       {previewUrl && (
//         <Card>
//           <div className="space-y-4">
//             {/* Preview */}
//             <div className="relative">
//               <img
//                 src={previewUrl}
//                 alt="Document preview"
//                 className="w-full h-64 object-contain bg-gray-50 rounded-lg"
//               />
//               {!verificationResult && !isProcessing && (
//                 <button
//                   onClick={handleReset}
//                   className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
//                   aria-label="Remove document"
//                 >
//                   <XCircleIcon className="w-5 h-5 text-gray-600" />
//                 </button>
//               )}
//             </div>

//             {/* Processing */}
//             {isProcessing && (
//               <div className="flex items-center justify-center gap-3 py-8">
//                 <Loader2Icon className="w-6 h-6 text-primary animate-spin" />
//                 <div className="text-center">
//                   <p className="font-medium text-gray-900">Reading Document…</p>
//                   <p className="text-sm text-gray-500 mt-1">{progressMsg}</p>
//                 </div>
//               </div>
//             )}

//             {/* Result */}
//             {verificationResult && !isProcessing && (
//               <div className="space-y-4">
//                 {verificationResult.isVerified ? (
//                   <Alert variant="success">
//                     <div className="flex items-start gap-2">
//                       <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
//                       <div>
//                         <p className="font-medium">Document Read Successfully</p>
//                         <p className="text-sm mt-1">
//                           Please confirm the details below are correct, then fill in your blood group and address.
//                         </p>
//                       </div>
//                     </div>
//                   </Alert>
//                 ) : (
//                   <Alert variant="error">
//                     <div className="flex items-start gap-2">
//                       <XCircleIcon className="w-5 h-5 flex-shrink-0" />
//                       <div>
//                         <p className="font-medium">Verification Failed</p>
//                         <p className="text-sm mt-1">
//                           {userType === 'admin'
//                             ? `Expected: ${expectedAdminName}. The name on the document did not match.`
//                             : 'Could not verify. Please upload a clearer image and try again.'}
//                         </p>
//                       </div>
//                     </div>
//                   </Alert>
//                 )}

//                 {/* Extracted info */}
//                 <div className="bg-gray-50 rounded-lg p-4 space-y-3">
//                   <h4 className="font-semibold text-gray-900 flex items-center gap-2">
//                     <FileTextIcon className="w-4 h-4" /> Extracted from Document
//                   </h4>
//                   <div className="grid grid-cols-2 gap-3 text-sm">
//                     <div>
//                       <p className="text-gray-500">Document Type</p>
//                       <p className="font-medium text-gray-900">{verificationResult.documentType}</p>
//                     </div>
//                     <div>
//                       <p className="text-gray-500">Certificate Number</p>
//                       <p className="font-medium text-gray-900">{verificationResult.documentNumber}</p>
//                     </div>
//                     <div className="col-span-2">
//                       <div className="flex items-center justify-between mb-1">
//                         <p className="text-gray-500">Full Name</p>
//                         {userType === 'hospital' && editedName !== verificationResult.fullName && !isEditingName && (
//                           <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
//                             Edited
//                           </span>
//                         )}
//                       </div>
//                       {userType === 'hospital' && !isEditingName ? (
//                         <div className="flex items-center gap-2">
//                           <p className="font-medium text-gray-900 text-base flex-1">{editedName || verificationResult.fullName}</p>
//                           <button
//                             type="button"
//                             onClick={handleNameEdit}
//                             className="text-sm text-primary hover:text-primary-dark font-medium px-2 py-1 rounded hover:bg-primary/5"
//                           >
//                             Edit
//                           </button>
//                         </div>
//                       ) : userType === 'hospital' && isEditingName ? (
//                         <div className="space-y-2">
//                           <input
//                             type="text"
//                             value={editedName}
//                             onChange={(e) => setEditedName(e.target.value)}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
//                             placeholder="Enter correct hospital name"
//                             autoFocus
//                           />
//                           <div className="flex gap-2">
//                             <button
//                               type="button"
//                               onClick={handleNameSave}
//                               disabled={isProcessing}
//                               className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
//                             >
//                               {isProcessing ? 'Checking...' : 'Save'}
//                             </button>
//                             <button
//                               type="button"
//                               onClick={handleNameCancel}
//                               disabled={isProcessing}
//                               className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
//                             >
//                               Cancel
//                             </button>
//                           </div>
//                         </div>
//                       ) : (
//                         <p className="font-medium text-gray-900 text-base">{verificationResult.fullName}</p>
//                       )}
//                     </div>
//                     {userType !== 'hospital' && (
//                       <>
//                         <div className="col-span-2">
//                           <p className="text-gray-500">Date of Birth</p>
//                           <p className="font-medium text-gray-900">{dobDisplay}</p>
//                         </div>
//                         {dob?.year && dob?.month && dob?.day && (
//                           <>
//                             <div>
//                               <p className="text-gray-500">Year</p>
//                               <p className="font-medium text-gray-900">{dob.year}</p>
//                             </div>
//                             <div>
//                               <p className="text-gray-500">Month</p>
//                               <p className="font-medium text-gray-900">{monthName(dob.month)}</p>
//                             </div>
//                             <div>
//                               <p className="text-gray-500">Day</p>
//                               <p className="font-medium text-gray-900">{dob.day}</p>
//                             </div>
//                           </>
//                         )}
//                       </>
//                     )}
//                   </div>
//                   {verificationResult.isVerified && (
//                     <div className="space-y-2">
//                       <p className="text-xs text-blue-600 flex items-center gap-1">
//                         <AlertCircleIcon className="w-3 h-3 flex-shrink-0" />
//                         {userType === 'hospital' 
//                           ? 'Please verify the hospital name is correct. You can edit it if OCR made a mistake.'
//                           : 'Blood group and address are not extracted — please fill them in below.'}
//                       </p>
//                       {userType === 'hospital' && (
//                         <p className="text-xs text-gray-500">
//                           If the extracted name is incorrect, click "Edit" to correct it before proceeding.
//                         </p>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {!verificationResult.isVerified && (
//                   <Button variant="outline" fullWidth onClick={handleReset}>
//                     Try Again
//                   </Button>
//                 )}
//               </div>
//             )}

//             {/* Verify button */}
//             {!isProcessing && !verificationResult && (
//               <Button
//                 fullWidth
//                 size="lg"
//                 onClick={handleVerify}
//                 leftIcon={<CheckCircleIcon className="w-5 h-5" />}
//               >
//                 Verify Document
//               </Button>
//             )}
//           </div>
//         </Card>
//       )}

//       {error && <Alert variant="error">{error}</Alert>}
//     </div>
//   );
// }


import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import {
  UploadIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  FileTextIcon,
  Loader2Icon,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';

interface OCRVerificationProps {
  userType: 'user' | 'hospital' | 'admin';
  onVerificationComplete: (data: OCRVerificationData) => void;
  expectedAdminName?: string;
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface OCRVerificationData {
  documentType: string;
  fullName: string;
  documentNumber: string;
  certificateNumber: string; // NEW: Certificate number extracted from document
  dateOfBirth: {
    year: string;
    month: string;
    day: string;
  };
  isVerified: boolean;
  confidence: number;
  documentPhotoBase64: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTH_MAP: Record<string, string> = {
  jan: '1', feb: '2', mar: '3', apr: '4', may: '5', jun: '6',
  jul: '7', aug: '8', sep: '9', oct: '10', nov: '11', dec: '12',
  january: '1', february: '2', march: '3', april: '4',
  june: '6', july: '7', august: '8', september: '9',
  october: '10', november: '11', december: '12',
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function devanagariToArabic(str: string): string {
  return str.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)));
}

function cleanLine(line: string): string {
  return line.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Accepts names with single-letter initials, e.g. "Ram B Shrestha"
 */
function looksLikeEnglishName(text: string): boolean {
  const words = text.trim().split(/\s+/);
  if (words.length < 2 || words.length > 6) return false;
  return words.every((w) => /^[A-Z][A-Za-z'-]*$/.test(w));
}

/**
 * Normalise a line for number matching:
 * - em/en dashes → hyphen
 * - spaces around hyphens removed
 * - OCR letter/digit confusion: O→0, l→1, I→1 between digits
 */
function normaliseLine(line: string): string {
  return line
    .replace(/[–—]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/(?<=[\d-])O(?=[\d-])/g, '0')
    .replace(/(?<=[\d-])l(?=[\d-])/g, '1')
    .replace(/(?<=[\d-])I(?=[\d-])/g, '1'); // capital I → 1
}

// ── Certificate number extraction ─────────────────────────────────────────────
function extractCertificateNumber(lines: string[]): string {
  // Strategy 1: label + number on SAME LINE
  for (const rawLine of lines) {
    const line = normaliseLine(rawLine);
    const mA = line.match(/Certif\w*\s+No[^a-z\d]{0,6}(\d{2,4}-\d{2,4}-\d{2,4}-\d{4,6})\b/i);
    if (mA) return mA[1];
    const mB = line.match(/Certif\w*\s+No[^a-z\d]{0,6}\b(\d{4,6}-\d{4,6})\b/i);
    if (mB) return mB[1];
  }

  // Strategy 2: label on one line, number on the NEXT line
  for (let i = 0; i < lines.length - 1; i++) {
    const labelLine = normaliseLine(lines[i]);
    if (/Certif\w+\s+No[^a-z\d]{0,6}\s*$/i.test(labelLine)) {
      const next = normaliseLine(lines[i + 1]);
      const mA = next.match(/^(\d{2,4}-\d{2,4}-\d{2,4}-\d{4,6})\b/);
      if (mA) return mA[1];
      const mB = next.match(/^\b(\d{4,6}-\d{4,6})\b/);
      if (mB) return mB[1];
    }
  }

  // Strategy 3: bare Format A anywhere
  for (const rawLine of lines) {
    const line = normaliseLine(rawLine);
    const mA = line.match(/\b(\d{2,4}-\d{2,4}-\d{2,4}-\d{4,6})\b/);
    if (mA) return mA[1];
  }

  // Strategy 4: bare Format B — only when "No" context exists
  for (const rawLine of lines) {
    const line = normaliseLine(rawLine);
    if (/No[^a-z]/i.test(line)) {
      const mB = line.match(/\b(\d{4,6}-\d{4,6})\b/);
      if (mB) return mB[1];
    }
  }

  // Strategy 5: Devanagari digit conversion fallback
  for (const rawLine of lines) {
    const line = normaliseLine(devanagariToArabic(rawLine));
    const mA = line.match(/\b(\d{2,4}-\d{2,4}-\d{2,4}-\d{4,6})\b/);
    if (mA) return mA[1];
    if (/No[^a-z]/i.test(line)) {
      const mB = line.match(/\b(\d{4,6}-\d{4,6})\b/);
      if (mB) return mB[1];
    }
  }

  // Strategy 6: Reg. No / Registration No variants
  for (const rawLine of lines) {
    const line = normaliseLine(rawLine);
    const mA = line.match(/Reg(?:istration)?\s*\.?\s*No[^a-z\d]{0,6}(\d{2,4}-\d{2,4}-\d{2,4}-\d{4,6})\b/i);
    if (mA) return mA[1];
    const mB = line.match(/Reg(?:istration)?\s*\.?\s*No[^a-z\d]{0,6}\b(\d{4,6}-\d{4,6})\b/i);
    if (mB) return mB[1];
  }

  return '';
}

// ── Full name extraction ──────────────────────────────────────────────────────
function extractFullName(lines: string[]): string {
  // Strategy 1: "Full Name.:" value on same line
  for (const line of lines) {
    const m = line.match(/Full\s*Name[\s.\-:]+([A-Z][A-Za-z\s'\-]{3,})/i);
    if (m) {
      const candidate = m[1].trim();
      if (candidate.split(' ').length >= 2) return candidate;
    }
  }
  // Strategy 2: plain "Name:" on same line
  for (const line of lines) {
    const m = line.match(/^Name\s*[.:\-]+\s*([A-Z][A-Za-z\s'\-]{3,})/i);
    if (m) {
      const candidate = m[1].trim();
      if (candidate.split(' ').length >= 2) return candidate;
    }
  }
  // Strategy 3: name on next line after label-only line
  for (let i = 0; i < lines.length - 1; i++) {
    if (/^(Full\s*)?Name[\s.:]*$/i.test(lines[i])) {
      const candidate = lines[i + 1].trim();
      if (looksLikeEnglishName(candidate)) return candidate;
    }
  }
  // Strategy 4: longest ALL-CAPS line that looks like a name
  let best = '';
  for (const line of lines) {
    if (
      looksLikeEnglishName(line) &&
      line === line.toUpperCase() &&
      line.length > best.length
    ) best = line;
  }
  if (best) return best;
  // Strategy 5: any line that looks like an English name
  for (const line of lines) {
    if (looksLikeEnglishName(line) && line.length > best.length) best = line;
  }
  // Strategy 6: looser match — lines after "Name" label within 2 lines
  for (let i = 0; i < lines.length - 2; i++) {
    if (/name/i.test(lines[i])) {
      for (let j = i + 1; j <= i + 2; j++) {
        const candidate = lines[j]?.trim() || '';
        if (looksLikeEnglishName(candidate)) return candidate;
      }
    }
  }
  return best || 'UNREADABLE';
}

// ── Date of birth extraction ──────────────────────────────────────────────────
interface DOB { year: string; month: string; day: string }

function resolveMonth(raw: string): string {
  const lower = raw.toLowerCase();
  return MONTH_MAP[lower] ?? MONTH_MAP[lower.substring(0, 3)] ?? (
    isNaN(Number(raw)) ? '' : String(Number(raw))
  );
}

function extractDateOfBirth(lines: string[]): DOB {
  let year = '', month = '', day = '';

  // Pass 1: full DOB line "Date of Birth (AD): Year:2003 Month:SEP Day:25"
  for (const line of lines) {
    if (/Date\s*of\s*Birth/i.test(line)) {
      const y = line.match(/Year\s*[:\-]?\s*(\d{4})/i);
      if (y) year = y[1];
      const m = line.match(/Month\s*[:\-]?\s*([A-Za-z]{2,}|\d{1,2})\b/i);
      if (m) month = resolveMonth(m[1]);
      const d = line.match(/Day\s*[:\-]?\s*(\d{1,2})\b/i);
      if (d) day = String(Number(d[1]));
      if (year && month && day) return { year, month, day };
    }
  }

  // Pass 2: scan every line for Year / Month / Day labels
  for (const line of lines) {
    if (!year) {
      const y = line.match(/\bYear\s*[:\-]?\s*(\d{4})\b/i);
      if (y) year = y[1];
    }
    if (!month) {
      const m = line.match(/\bMonth\s*[:\-]?\s*([A-Za-z]{2,}|\d{1,2})\b/i);
      if (m) month = resolveMonth(m[1]);
    }
    if (!day) {
      const d = line.match(/\bDay\s*[:\-]?\s*(\d{1,2})\b/i);
      if (d) day = String(Number(d[1]));
    }
  }

  // Pass 3: Devanagari side "साल: २०६० महिना: ०६ गते: ०८"
  if (!year || !month || !day) {
    for (const line of lines) {
      const c = devanagariToArabic(line);
      if (!year) {
        const y = c.match(/(?:साल|Year)\s*[:\-]?\s*(\d{4})/i);
        if (y) year = y[1];
      }
      if (!month) {
        const m = c.match(/(?:महिना|Month)\s*[:\-]?\s*(\d{1,2})/i);
        if (m) month = String(Number(m[1]));
      }
      if (!day) {
        const d = c.match(/(?:गते|Day)\s*[:\-]?\s*(\d{1,2})/i);
        if (d) day = String(Number(d[1]));
      }
    }
  }

  // Pass 4: generic date formats ISO / DMY (last resort)
  if (!year || !month || !day) {
    for (const line of lines) {
      const iso = line.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
      if (iso) {
        year  = year  || iso[1];
        month = month || String(Number(iso[2]));
        day   = day   || String(Number(iso[3]));
        break;
      }
      const dmy = line.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
      if (dmy) {
        day   = day   || String(Number(dmy[1]));
        month = month || String(Number(dmy[2]));
        year  = year  || dmy[3];
        break;
      }
    }
  }

  // Pass 5: looser — any 4-digit year between 1950–2010 near DOB context
  if (!year) {
    for (const line of lines) {
      if (/birth|born|dob|साल/i.test(line)) {
        const y = line.match(/\b(19[5-9]\d|200\d|201[0-5])\b/);
        if (y) { year = y[1]; break; }
      }
    }
  }

  return { year, month, day };
}

// ── Image preprocessing ───────────────────────────────────────────────────────
/**
 * Before Tesseract sees the image:
 *  1. Upscale to at least 2400px wide (small text needs this most)
 *  2. Convert to grayscale
 *  3. Contrast-stretch (remap actual min–max to 0–255)
 *  4. Apply sharpening bias (push pixels away from mid-gray)
 *  5. Output as lossless PNG
 */
async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const IDEAL_WIDTH = 2400;
      const scale = img.width < IDEAL_WIDTH ? IDEAL_WIDTH / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      // Step 1: Grayscale
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = gray;
      }

      // Step 2: Contrast stretch — find real min/max, remap to full 0–255 range
      let min = 255, max = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] < min) min = d[i];
        if (d[i] > max) max = d[i];
      }
      const range = max - min || 1;

      // Step 3: Sharpen — push bright pixels brighter, dark pixels darker
      for (let i = 0; i < d.length; i += 4) {
        const stretched = Math.round(((d[i] - min) / range) * 255);
        const sharpened = stretched < 128
          ? Math.max(0,   stretched - 25)
          : Math.min(255, stretched + 25);
        d[i] = d[i + 1] = d[i + 2] = sharpened;
      }

      ctx.putImageData(imageData, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/png', // lossless — much better for OCR than JPEG
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for preprocessing'));
    };
    img.src = url;
  });
}

// ── Tesseract worker factory ──────────────────────────────────────────────────
async function makeWorker(
  psm: string,
  onProgress?: (msg: string) => void,
): Promise<Awaited<ReturnType<typeof createWorker>>> {
  return createWorker('eng', 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(`Scanning… ${Math.round(m.progress * 100)}%`);
      }
    },
  }).then(async (worker) => {
    await worker.setParameters({
      tessedit_pageseg_mode: psm as any,
      // No character whitelist — whitelist was blocking valid chars
      preserve_interword_spaces: '1' as any,
    });
    return worker;
  });
}

// ── Main OCR runner ───────────────────────────────────────────────────────────
async function extractFromCitizenship(
  file: File,
  onProgress: (msg: string) => void,
): Promise<{ name: string; certificateNumber: string; dob: DOB }> {

  // ── Step 1: Preprocess ───────────────────────────────────────────────────
  onProgress('Preprocessing image…');
  const processedBlob = await preprocessImage(file);

  // ── Step 2: First pass — PSM 3 (auto page layout) ───────────────────────
  // PSM 3 handles mixed layouts (headings + tables + body text) better than PSM 6
  onProgress('Loading OCR engine…');
  const worker1 = await makeWorker('3', onProgress);

  let name = '';
  let certificateNumber = '';
  let dob: DOB = { year: '', month: '', day: '' };
  let pass1Lines: string[] = [];

  try {
    onProgress('Reading document (pass 1)…');
    const { data } = await worker1.recognize(processedBlob);
    pass1Lines = data.text.split('\n').map(cleanLine).filter((l) => l.length > 1);

    name              = extractFullName(pass1Lines);
    certificateNumber = extractCertificateNumber(pass1Lines);
    dob               = extractDateOfBirth(pass1Lines);
  } finally {
    await worker1.terminate();
  }

  // ── Step 3: Second pass — PSM 6 (uniform block) if fields still missing ─
  // PSM 6 works better for structured form-like layouts
  const needsSecondPass = !dob.year || !dob.month || !dob.day || !certificateNumber || name === 'UNREADABLE';

  if (needsSecondPass) {
    onProgress('Running second pass…');
    const worker2 = await makeWorker('6');

    try {
      const { data: data2 } = await worker2.recognize(processedBlob);
      const pass2Lines = data2.text.split('\n').map(cleanLine).filter((l) => l.length > 1);

      // Merge: only fill in fields that first pass missed
      if (!dob.year || !dob.month || !dob.day) {
        const dob2 = extractDateOfBirth(pass2Lines);
        if (!dob.year  && dob2.year)  dob.year  = dob2.year;
        if (!dob.month && dob2.month) dob.month = dob2.month;
        if (!dob.day   && dob2.day)   dob.day   = dob2.day;
      }

      if (!certificateNumber) {
        certificateNumber = extractCertificateNumber(pass2Lines);
      }

      if (!name || name === 'UNREADABLE') {
        name = extractFullName(pass2Lines);
      }
    } finally {
      await worker2.terminate();
    }
  }

  // ── Step 4: Third pass — PSM 11 (sparse text) for stubborn cert numbers ─
  // PSM 11 finds text anywhere on the page — good for stamps and margins
  if (!certificateNumber) {
    onProgress('Scanning for certificate number…');
    const worker3 = await makeWorker('11');

    try {
      const { data: data3 } = await worker3.recognize(processedBlob);
      const pass3Lines = data3.text.split('\n').map(cleanLine).filter((l) => l.length > 1);
      certificateNumber = extractCertificateNumber(pass3Lines);
    } finally {
      await worker3.terminate();
    }
  }

  return { name, certificateNumber, dob };
}

function monthName(m: string): string {
  const n = Number(m);
  return n >= 1 && n <= 12 ? MONTH_NAMES[n] : m;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function OCRVerification({
  userType,
  onVerificationComplete,
  expectedAdminName = 'Sushanta Marahatta',
}: OCRVerificationProps) {
  const [selectedFile, setSelectedFile]             = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]                 = useState<string | null>(null);
  const [previewBase64, setPreviewBase64]           = useState<string>('');
  const [isProcessing, setIsProcessing]             = useState(false);
  const [progressMsg, setProgressMsg]               = useState('');
  const [verificationResult, setVerificationResult] = useState<OCRVerificationData | null>(null);
  const [error, setError]                           = useState<string | null>(null);
  const [editedName, setEditedName]                 = useState<string>('');
  const [isEditingName, setIsEditingName]           = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    setSelectedFile(file);
    setError(null);
    setVerificationResult(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      setPreviewBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!selectedFile || !previewBase64) return;
    setIsProcessing(true);
    setError(null);
    setProgressMsg('Starting…');

    try {
      const { name, certificateNumber, dob } = await extractFromCitizenship(
        selectedFile,
        setProgressMsg,
      );

      if (name === 'UNREADABLE') {
        setError(
          'Could not read the name from the document. Please upload the English side of the certificate — ensure it is well-lit, flat, and in focus.',
        );
        return;
      }

      // For hospitals, check for duplicates before proceeding
      if (userType === 'hospital') {
        setProgressMsg('Checking for duplicate registrations…');
        try {
          const checkRes = await fetch(`${API}/api/auth/check-hospital-duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hospitalName: name,
              certificateNumber,
              documentPhoto: previewBase64,
            }),
          });

          const checkData = await checkRes.json();

          if (!checkRes.ok) {
            setError(checkData.error || 'This hospital is already registered in our system.');
            setIsProcessing(false);
            setProgressMsg('');
            return;
          }
        } catch (err: any) {
          console.error('Duplicate check error:', err);
          setError('Failed to verify hospital registration. Please try again.');
          setIsProcessing(false);
          setProgressMsg('');
          return;
        }
      }

      const isVerified =
        userType === 'admin'
          ? name.toLowerCase().trim() === expectedAdminName.toLowerCase().trim()
          : true;

      const docNumber =
        certificateNumber || 'CC-' + Math.floor(Math.random() * 900000 + 100000);

      const formattedName = name
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      const result: OCRVerificationData = {
        documentType:
          userType === 'hospital'
            ? 'Hospital Registration Certificate'
            : 'Citizenship Certificate',
        fullName:            formattedName,
        documentNumber:      docNumber,
        certificateNumber:   docNumber, // Use document number as certificate number
        dateOfBirth:         dob,
        isVerified,
        confidence:          0.92,
        documentPhotoBase64: previewBase64,
      };

      setVerificationResult(result);
      if (result.isVerified) {
        setEditedName(formattedName);
        onVerificationComplete(result);
      }
    } catch (err: any) {
      console.error('OCR error:', err);
      setError(err?.message ?? 'Failed to process document. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setPreviewBase64('');
    setSelectedFile(null);
    setVerificationResult(null);
    setError(null);
    setProgressMsg('');
    setEditedName('');
    setIsEditingName(false);
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      setError('Hospital name cannot be empty.');
      return;
    }

    if (!verificationResult) return;

    if (userType === 'hospital') {
      setIsProcessing(true);
      setError(null);
      try {
        const checkRes = await fetch(`${API}/api/auth/check-hospital-duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalName: editedName.trim(),
            certificateNumber: verificationResult.documentNumber,
            documentPhoto: previewBase64,
          }),
        });

        const checkData = await checkRes.json();

        if (!checkRes.ok) {
          setError(checkData.error || 'This hospital is already registered in our system.');
          setIsProcessing(false);
          return;
        }
      } catch (err: any) {
        console.error('Duplicate check error:', err);
        setError('Failed to verify hospital registration. Please try again.');
        setIsProcessing(false);
        return;
      } finally {
        setIsProcessing(false);
      }
    }

    const updatedResult = { ...verificationResult, fullName: editedName.trim() };
    setVerificationResult(updatedResult);
    setIsEditingName(false);
    onVerificationComplete(updatedResult);
  };

  const handleNameCancel = () => {
    setEditedName(verificationResult?.fullName || '');
    setIsEditingName(false);
    setError(null);
  };

  const getDocumentTypeLabel = () => {
    switch (userType) {
      case 'hospital': return 'Hospital Registration Certificate';
      case 'admin':    return 'Admin Authorization Document';
      default:         return 'Citizenship Certificate (English side)';
    }
  };

  const getInstructions = () => {
    switch (userType) {
      case 'hospital':
        return 'Upload a clear photo of your hospital registration certificate.';
      case 'admin':
        return `Upload the English side of your citizenship certificate. The system will verify your identity as ${expectedAdminName}.`;
      default:
        return 'Upload the English side of your citizenship certificate. Your name, certificate number, and date of birth will be extracted automatically.';
    }
  };

  const dob = verificationResult?.dateOfBirth;
  const dobDisplay =
    dob && (dob.year || dob.month || dob.day)
      ? [
          dob.day   ? `Day ${dob.day}`    : null,
          dob.month ? monthName(dob.month) : null,
          dob.year  || null,
        ].filter(Boolean).join(' ')
      : 'Not detected';

  return (
    <div className="space-y-6">
      <Alert variant="info">
        <div className="flex items-start gap-2">
          <AlertCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Document Verification Required</p>
            <p className="text-sm mt-1">{getInstructions()}</p>
          </div>
        </div>
      </Alert>

      {/* Upload area */}
      {!previewUrl && (
        <Card className="border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
          <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <UploadIcon className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">
              Upload {getDocumentTypeLabel()}
            </p>
            <p className="text-sm text-gray-500 mb-2">Click to browse or drag and drop</p>
            <p className="text-xs text-gray-400">Supported: JPG, PNG · Max 5MB</p>
          </label>
        </Card>
      )}

      {/* Preview + processing + result */}
      {previewUrl && (
        <Card>
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative">
              <img
                src={previewUrl}
                alt="Document preview"
                className="w-full h-64 object-contain bg-gray-50 rounded-lg"
              />
              {!verificationResult && !isProcessing && (
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
                  aria-label="Remove document"
                >
                  <XCircleIcon className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* Processing */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2Icon className="w-6 h-6 text-primary animate-spin" />
                <div className="text-center">
                  <p className="font-medium text-gray-900">Reading Document…</p>
                  <p className="text-sm text-gray-500 mt-1">{progressMsg}</p>
                </div>
              </div>
            )}

            {/* Result */}
            {verificationResult && !isProcessing && (
              <div className="space-y-4">
                {verificationResult.isVerified ? (
                  <Alert variant="success">
                    <div className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Document Read Successfully</p>
                        <p className="text-sm mt-1">
                          Please confirm the details below are correct, then fill in your blood group and address.
                        </p>
                      </div>
                    </div>
                  </Alert>
                ) : (
                  <Alert variant="error">
                    <div className="flex items-start gap-2">
                      <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Verification Failed</p>
                        <p className="text-sm mt-1">
                          {userType === 'admin'
                            ? `Expected: ${expectedAdminName}. The name on the document did not match.`
                            : 'Could not verify. Please upload a clearer image and try again.'}
                        </p>
                      </div>
                    </div>
                  </Alert>
                )}

                {/* Extracted info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileTextIcon className="w-4 h-4" /> Extracted from Document
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Document Type</p>
                      <p className="font-medium text-gray-900">{verificationResult.documentType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Certificate Number</p>
                      <p className="font-medium text-gray-900">{verificationResult.documentNumber}</p>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-gray-500">Full Name</p>
                        {userType === 'hospital' && editedName !== verificationResult.fullName && !isEditingName && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Edited
                          </span>
                        )}
                      </div>
                      {userType === 'hospital' && !isEditingName ? (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-base flex-1">{editedName || verificationResult.fullName}</p>
                          <button
                            type="button"
                            onClick={handleNameEdit}
                            className="text-sm text-primary hover:text-primary-dark font-medium px-2 py-1 rounded hover:bg-primary/5"
                          >
                            Edit
                          </button>
                        </div>
                      ) : userType === 'hospital' && isEditingName ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Enter correct hospital name"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleNameSave}
                              disabled={isProcessing}
                              className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isProcessing ? 'Checking...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={handleNameCancel}
                              disabled={isProcessing}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="font-medium text-gray-900 text-base">{verificationResult.fullName}</p>
                      )}
                    </div>
                    {userType !== 'hospital' && (
                      <>
                        <div className="col-span-2">
                          <p className="text-gray-500">Date of Birth</p>
                          <p className="font-medium text-gray-900">{dobDisplay}</p>
                        </div>
                        {dob?.year && dob?.month && dob?.day && (
                          <>
                            <div>
                              <p className="text-gray-500">Year</p>
                              <p className="font-medium text-gray-900">{dob.year}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Month</p>
                              <p className="font-medium text-gray-900">{monthName(dob.month)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Day</p>
                              <p className="font-medium text-gray-900">{dob.day}</p>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  {verificationResult.isVerified && (
                    <div className="space-y-2">
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <AlertCircleIcon className="w-3 h-3 flex-shrink-0" />
                        {userType === 'hospital'
                          ? 'Please verify the hospital name is correct. You can edit it if OCR made a mistake.'
                          : 'Blood group and address are not extracted — please fill them in below.'}
                      </p>
                      {userType === 'hospital' && (
                        <p className="text-xs text-gray-500">
                          If the extracted name is incorrect, click "Edit" to correct it before proceeding.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {!verificationResult.isVerified && (
                  <Button variant="outline" fullWidth onClick={handleReset}>
                    Try Again
                  </Button>
                )}
              </div>
            )}

            {/* Verify button */}
            {!isProcessing && !verificationResult && (
              <Button
                fullWidth
                size="lg"
                onClick={handleVerify}
                leftIcon={<CheckCircleIcon className="w-5 h-5" />}
              >
                Verify Document
              </Button>
            )}
          </div>
        </Card>
      )}

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}