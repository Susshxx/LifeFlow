// // import emailjs from '@emailjs/browser';
// // import React, { useState, Fragment, useEffect } from 'react';
// // import { Link, useNavigate } from 'react-router-dom';
// // import {
// //   HeartPulseIcon, UserIcon, BuildingIcon, MailIcon,
// //   LockIcon, PhoneIcon, MapPinIcon, CheckCircleIcon,
// //   AlertCircleIcon, RefreshCwIcon,
// // } from 'lucide-react';
// // import { Button } from '../components/ui/Button';
// // import { Input } from '../components/ui/Input';
// // import { Select } from '../components/ui/Select';
// // import { Card } from '../components/ui/Card';
// // import { Alert } from '../components/ui/Alert';
// // import { OCRVerification, OCRVerificationData } from '../components/features/OCRVerification';

// // type UserType = 'user' | 'hospital';

// // const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// // const EMAILJS_SERVICE_ID  = 'service_hfrba86';
// // const EMAILJS_TEMPLATE_ID = 'template_qpv3f4t';
// // const EMAILJS_PUBLIC_KEY  = 'jf7SKwUj0GbF3OxLD';

// // const bloodGroups = [
// //   { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
// //   { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
// //   { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
// //   { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
// // ];

// // const provinces = [
// //   { value: 'koshi',         label: 'Koshi Province'         },
// //   { value: 'madhesh',       label: 'Madhesh Province'       },
// //   { value: 'bagmati',       label: 'Bagmati Province'       },
// //   { value: 'gandaki',       label: 'Gandaki Province'       },
// //   { value: 'lumbini',       label: 'Lumbini Province'       },
// //   { value: 'karnali',       label: 'Karnali Province'       },
// //   { value: 'sudurpashchim', label: 'Sudurpashchim Province' },
// // ];

// // const districtsByProvince: Record<string, { value: string; label: string }[]> = {
// //   koshi: [
// //     { value: 'taplejung', label: 'Taplejung' }, { value: 'panchthar', label: 'Panchthar' },
// //     { value: 'illam', label: 'Ilam' }, { value: 'jhapa', label: 'Jhapa' },
// //     { value: 'morang', label: 'Morang' }, { value: 'sunsari', label: 'Sunsari' },
// //     { value: 'dhankuta', label: 'Dhankuta' }, { value: 'terhathum', label: 'Terhathum' },
// //     { value: 'sankhuwasabha', label: 'Sankhuwasabha' }, { value: 'bhojpur', label: 'Bhojpur' },
// //     { value: 'solukhumbu', label: 'Solukhumbu' }, { value: 'okhaldhunga', label: 'Okhaldhunga' },
// //     { value: 'khotang', label: 'Khotang' }, { value: 'udayapur', label: 'Udayapur' },
// //   ],
// //   madhesh: [
// //     { value: 'saptari', label: 'Saptari' }, { value: 'sarlahi', label: 'Sarlahi' },
// //     { value: 'dhanusha', label: 'Dhanusha' }, { value: 'mahottari', label: 'Mahottari' },
// //     { value: 'siraha', label: 'Siraha' }, { value: 'rautahat', label: 'Rautahat' },
// //     { value: 'bara', label: 'Bara' }, { value: 'parsa', label: 'Parsa' },
// //   ],
// //   bagmati: [
// //     { value: 'kathmandu', label: 'Kathmandu' }, { value: 'lalitpur', label: 'Lalitpur' },
// //     { value: 'bhaktapur', label: 'Bhaktapur' }, { value: 'kavrepalanchok', label: 'Kavrepalanchok' },
// //     { value: 'sindhupalchok', label: 'Sindhupalchok' }, { value: 'nuwakot', label: 'Nuwakot' },
// //     { value: 'dhading', label: 'Dhading' }, { value: 'makwanpur', label: 'Makwanpur' },
// //     { value: 'chitwan', label: 'Chitwan' }, { value: 'ramechhap', label: 'Ramechhap' },
// //     { value: 'dolakha', label: 'Dolakha' }, { value: 'sindhuli', label: 'Sindhuli' },
// //     { value: 'rasuwa', label: 'Rasuwa' },
// //   ],
// //   gandaki: [
// //     { value: 'kaski', label: 'Kaski' }, { value: 'tanahun', label: 'Tanahun' },
// //     { value: 'syangja', label: 'Syangja' }, { value: 'lamjung', label: 'Lamjung' },
// //     { value: 'gorkha', label: 'Gorkha' }, { value: 'manang', label: 'Manang' },
// //     { value: 'mustang', label: 'Mustang' }, { value: 'myagdi', label: 'Myagdi' },
// //     { value: 'baglung', label: 'Baglung' }, { value: 'parbat', label: 'Parbat' },
// //     { value: 'nawalpur', label: 'Nawalpur' },
// //   ],
// //   lumbini: [
// //     { value: 'rupandehi', label: 'Rupandehi' }, { value: 'kapilvastu', label: 'Kapilvastu' },
// //     { value: 'arghakhanchi', label: 'Arghakhanchi' }, { value: 'gulmi', label: 'Gulmi' },
// //     { value: 'palpa', label: 'Palpa' }, { value: 'dang', label: 'Dang' },
// //     { value: 'pyuthan', label: 'Pyuthan' }, { value: 'rolpa', label: 'Rolpa' },
// //     { value: 'banke', label: 'Banke' }, { value: 'bardiya', label: 'Bardiya' },
// //   ],
// //   karnali: [
// //     { value: 'humla', label: 'Humla' }, { value: 'mugu', label: 'Mugu' },
// //     { value: 'dolpa', label: 'Dolpa' }, { value: 'jumla', label: 'Jumla' },
// //     { value: 'kalikot', label: 'Kalikot' }, { value: 'jajarkot', label: 'Jajarkot' },
// //     { value: 'surkhet', label: 'Surkhet' }, { value: 'salyan', label: 'Salyan' },
// //     { value: 'dailekh', label: 'Dailekh' },
// //   ],
// //   sudurpashchim: [
// //     { value: 'kailali', label: 'Kailali' }, { value: 'kanchanpur', label: 'Kanchanpur' },
// //     { value: 'doti', label: 'Doti' }, { value: 'dadeldhura', label: 'Dadeldhura' },
// //     { value: 'bajhang', label: 'Bajhang' }, { value: 'bajura', label: 'Bajura' },
// //     { value: 'baitadi', label: 'Baitadi' }, { value: 'darchula', label: 'Darchula' },
// //   ],
// // };

// // const days = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
// // const months = [
// //   { value: '1', label: 'January' }, { value: '2', label: 'February' },
// //   { value: '3', label: 'March' }, { value: '4', label: 'April' },
// //   { value: '5', label: 'May' }, { value: '6', label: 'June' },
// //   { value: '7', label: 'July' }, { value: '8', label: 'August' },
// //   { value: '9', label: 'September' }, { value: '10', label: 'October' },
// //   { value: '11', label: 'November' }, { value: '12', label: 'December' },
// // ];
// // const years = Array.from({ length: 50 }, (_, i) => {
// //   const year = new Date().getFullYear() - 18 - i;
// //   return { value: String(year), label: String(year) };
// // });

// // // For Google OAuth users: steps are Verification + Details only (no password/OTP)
// // // For regular users: Basic Info → Verification → Password → OTP
// // const REGULAR_STEPS = ['Basic Info', 'Verification', 'Password', 'Confirm Email'];
// // const GOOGLE_STEPS  = ['Verification', 'Details'];

// // const userTypeOptions = [
// //   { type: 'user' as const, icon: UserIcon, label: 'Blood Donor', description: 'Register to donate blood and save lives' },
// //   { type: 'hospital' as const, icon: BuildingIcon, label: 'Hospital', description: 'Register your hospital or blood bank' },
// // ];

// // function generateOTP(): string {
// //   return Math.floor(100000 + Math.random() * 900000).toString();
// // }

// // async function sendOTPEmail(email: string, otp: string): Promise<void> {
// //   emailjs.init(EMAILJS_PUBLIC_KEY);
// //   const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { user_email: email, otp }, EMAILJS_PUBLIC_KEY);
// //   if (result.status !== 200) throw new Error(`EmailJS error ${result.status}: ${result.text}`);
// // }

// // export function SignUpPage() {
// //   const navigate = useNavigate();

// //   // If already logged in, redirect to home
// //   useEffect(() => {
// //     const user = localStorage.getItem('lf_user');
// //     if (user) navigate('/', { replace: true });
// //   }, [navigate]);

// //   // Google OAuth user data (set when coming from Google callback)
// //   const [googleUser, setGoogleUser] = useState<{
// //     id: string; name: string; email: string; avatar: string; token: string;
// //   } | null>(null);

// //   // Detect Google OAuth callback params in URL (when user is redirected back from Google)
// //   useEffect(() => {
// //     const params = new URLSearchParams(window.location.search);
// //     const token = params.get('token');
// //     const userParam = params.get('user');
// //     if (token && userParam) {
// //       try {
// //         const u = JSON.parse(decodeURIComponent(userParam));
// //         setGoogleUser({ id: u.id, name: u.name, email: u.email, avatar: u.avatar || '', token });
// //         // Pre-fill name from Google
// //         const [firstName, ...lastParts] = u.name.split(' ');
// //         setFormData(prev => ({ ...prev, firstName: firstName || '', lastName: lastParts.join(' ') || '', email: u.email }));
// //         // Clear URL params
// //         window.history.replaceState({}, '', window.location.pathname);
// //       } catch { /* ignore */ }
// //     }
// //   }, []);

// //   const isGoogleFlow = !!googleUser;
// //   const stepLabels   = isGoogleFlow ? GOOGLE_STEPS : REGULAR_STEPS;
// //   const totalSteps   = stepLabels.length;

// //   const [userType,       setUserType]       = useState<UserType>('user');
// //   const [isLoading,      setIsLoading]      = useState(false);
// //   const [step,           setStep]           = useState(1);
// //   const [ocrData,        setOcrData]        = useState<OCRVerificationData | null>(null);
// //   const [submitError,    setSubmitError]    = useState('');

// //   const [generatedOTP,   setGeneratedOTP]   = useState('');
// //   const [otpInput,       setOtpInput]       = useState('');
// //   const [otpError,       setOtpError]       = useState('');
// //   const [otpVerified,    setOtpVerified]    = useState(false);
// //   const [resendCooldown, setResendCooldown] = useState(0);
// //   const [sendError,      setSendError]      = useState('');

// //   const [formData, setFormData] = useState({
// //     firstName: '', lastName: '', email: '', phone: '',
// //     dobDay: '', dobMonth: '', dobYear: '',
// //     bloodGroup: '', province: '', district: '', municipality: '',
// //     password: '', confirmPassword: '',
// //     hospitalName: '', hospitalRegNumber: '',
// //   });
// //   const [errors, setErrors] = useState<Record<string, string>>({});

// //   const availableDistricts = formData.province ? (districtsByProvince[formData.province] || []) : [];

// //   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
// //     const { name, value } = e.target;
// //     if (name === 'province') {
// //       setFormData(prev => ({ ...prev, province: value, district: '' }));
// //     } else {
// //       setFormData(prev => ({ ...prev, [name]: value }));
// //     }
// //     if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
// //   };

// //   const handleOCRComplete = (data: OCRVerificationData) => {
// //     setOcrData(data);
// //     if (userType === 'user') {
// //       const [firstName, ...lastParts] = data.fullName.split(' ');
// //       setFormData(prev => ({
// //         ...prev,
// //         firstName: firstName || prev.firstName,
// //         lastName:  lastParts.join(' ') || prev.lastName,
// //         dobYear:   data.dateOfBirth?.year  || prev.dobYear,
// //         dobMonth:  data.dateOfBirth?.month || prev.dobMonth,
// //         dobDay:    data.dateOfBirth?.day   || prev.dobDay,
// //       }));
// //     } else {
// //       setFormData(prev => ({
// //         ...prev,
// //         hospitalName:      data.fullName,
// //         hospitalRegNumber: data.documentNumber,
// //       }));
// //     }
// //   };

// //   // ── Validation ────────────────────────────────────────────────────────────
// //   const validateStep1 = () => {
// //     const e: Record<string, string> = {};
// //     if (userType === 'user') {
// //       if (!formData.firstName) e.firstName = 'First name is required';
// //       if (!formData.lastName)  e.lastName  = 'Last name is required';
// //     } else {
// //       if (!formData.hospitalName)      e.hospitalName      = 'Hospital name is required';
// //       if (!formData.hospitalRegNumber) e.hospitalRegNumber = 'Registration number is required';
// //     }
// //     if (!formData.email)                            e.email = 'Email is required';
// //     else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Please enter a valid email';
// //     if (!formData.phone)                            e.phone = 'Phone number is required';
// //     else if (!/^[0-9]{10}$/.test(formData.phone))  e.phone = 'Please enter a valid 10-digit phone number';
// //     setErrors(e);
// //     return Object.keys(e).length === 0;
// //   };

// //   const validateOCRStep = () => {
// //     const e: Record<string, string> = {};
// //     if (!ocrData?.isVerified) e.ocr = 'Document verification is required';
// //     setErrors(e);
// //     return Object.keys(e).length === 0;
// //   };

// //   const validateDetailsStep = () => {
// //     const e: Record<string, string> = {};
// //     if (userType === 'user') {
// //       if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) e.dob = 'Date of birth is required';
// //       if (!formData.bloodGroup) e.bloodGroup = 'Blood group is required';
// //     }
// //     if (!formData.province)     e.province     = 'Province is required';
// //     if (!formData.district)     e.district     = 'District is required';
// //     if (!formData.municipality) e.municipality = 'Municipality is required';
// //     setErrors(e);
// //     return Object.keys(e).length === 0;
// //   };

// //   const validateStep3 = () => {
// //     const e: Record<string, string> = {};
// //     if (!formData.password)                e.password = 'Password is required';
// //     else if (formData.password.length < 8) e.password = 'Password must be at least 8 characters';
// //     if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
// //     setErrors(e);
// //     return Object.keys(e).length === 0;
// //   };

// //   // ── OTP ───────────────────────────────────────────────────────────────────
// //   const startCooldown = () => {
// //     setResendCooldown(60);
// //     const timer = setInterval(() => {
// //       setResendCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
// //     }, 1000);
// //   };

// //   const handleSendOTP = async () => {
// //     const otp = generateOTP();
// //     setGeneratedOTP(otp);
// //     setOtpInput(''); setOtpError(''); setSendError('');
// //     setIsLoading(true);
// //     try {
// //       await sendOTPEmail(formData.email, otp);
// //       startCooldown();
// //     } catch (err: any) {
// //       setSendError(err?.text ?? err?.message ?? JSON.stringify(err));
// //     } finally { setIsLoading(false); }
// //   };

// //   const handleVerifyOTP = () => {
// //     if (otpInput.trim() === generatedOTP) { setOtpVerified(true); setOtpError(''); }
// //     else setOtpError('Invalid OTP. Please check and try again.');
// //   };

// //   // ── Navigation ────────────────────────────────────────────────────────────
// //   const handleNext = async () => {
// //     if (isGoogleFlow) {
// //       // Google flow: step 1 = OCR, step 2 = Details + submit
// //       if (step === 1 && validateOCRStep()) setStep(2);
// //       else if (step === 2 && validateDetailsStep()) await handleGoogleSubmit();
// //     } else {
// //       // Regular flow: step 1 = Basic, step 2 = OCR+Details, step 3 = Password, step 4 = OTP
// //       if      (step === 1 && validateStep1()) setStep(2);
// //       else if (step === 2 && validateOCRStep() && validateDetailsStep()) setStep(3);
// //       else if (step === 3 && validateStep3()) { setStep(4); await handleSendOTP(); }
// //     }
// //   };

// //   const handleBack = () => { if (step > 1) setStep(step - 1); };

// //   // ── Submit: regular user ──────────────────────────────────────────────────
// //   const handleSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!otpVerified) { setOtpError('Please verify the OTP first.'); return; }
// //     setIsLoading(true); setSubmitError('');

// //     try {
// //       const fullName = userType === 'user'
// //         ? `${formData.firstName} ${formData.lastName}`.trim()
// //         : formData.hospitalName;

// //       const rawPhoto = ocrData?.documentPhotoBase64 ?? '';
// //       const documentPhoto = rawPhoto.length <= 2_000_000 ? rawPhoto : '';

// //       const res = await fetch(`${API}/api/auth/register`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({
// //           name: fullName, email: formData.email, password: formData.password,
// //           role: userType, phone: formData.phone,
// //           bloodGroup: formData.bloodGroup, province: formData.province,
// //           district: formData.district, municipality: formData.municipality,
// //           dobDay: formData.dobDay, dobMonth: formData.dobMonth, dobYear: formData.dobYear,
// //           hospitalName: formData.hospitalName, hospitalRegNumber: formData.hospitalRegNumber,
// //           documentPhoto,
// //         }),
// //       });

// //       const data = await res.json();
// //       if (!res.ok) { setSubmitError(data.error || `Registration failed (${res.status}).`); return; }

// //       localStorage.setItem('lf_token', data.token);
// //       localStorage.setItem('lf_user',  JSON.stringify(data.user));
// //       navigate('/');
// //     } catch { setSubmitError('Could not connect to server. Please try again.'); }
// //     finally { setIsLoading(false); }
// //   };

// //   // ── Submit: Google OAuth user ─────────────────────────────────────────────
// //   const handleGoogleSubmit = async () => {
// //     if (!googleUser) return;
// //     setIsLoading(true); setSubmitError('');

// //     try {
// //       const rawPhoto = ocrData?.documentPhotoBase64 ?? '';
// //       const documentPhoto = rawPhoto.length <= 2_000_000 ? rawPhoto : '';

// //       const res = await fetch(`${API}/api/auth/register-google`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({
// //           googleId: googleUser.id, name: googleUser.name,
// //           email: googleUser.email, avatar: googleUser.avatar,
// //           phone: formData.phone, bloodGroup: formData.bloodGroup,
// //           province: formData.province, district: formData.district,
// //           municipality: formData.municipality,
// //           dobDay: formData.dobDay, dobMonth: formData.dobMonth, dobYear: formData.dobYear,
// //           documentPhoto,
// //         }),
// //       });

// //       const data = await res.json();
// //       if (!res.ok) { setSubmitError(data.error || 'Registration failed.'); return; }

// //       localStorage.setItem('lf_token', data.token);
// //       localStorage.setItem('lf_user',  JSON.stringify(data.user));
// //       navigate('/');
// //     } catch { setSubmitError('Could not connect to server. Please try again.'); }
// //     finally { setIsLoading(false); }
// //   };

// //   // ── OTP box handlers ──────────────────────────────────────────────────────
// //   const handleOtpBoxChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
// //     const val = e.target.value.replace(/\D/, '').slice(0, 1);
// //     const arr = Array.from({ length: 6 }, (_, idx) => otpInput[idx] ?? '');
// //     arr[i] = val;
// //     setOtpInput(arr.join(''));
// //     setOtpError('');
// //     if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
// //   };

// //   const handleOtpBoxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
// //     if (e.key === 'Backspace') {
// //       e.preventDefault();
// //       const arr = Array.from({ length: 6 }, (_, idx) => otpInput[idx] ?? '');
// //       if (arr[i]) { arr[i] = ''; setOtpInput(arr.join('')); }
// //       else if (i > 0) { arr[i - 1] = ''; setOtpInput(arr.join('')); document.getElementById(`otp-${i - 1}`)?.focus(); }
// //     }
// //   };

// //   // ── What step number maps to what content ─────────────────────────────────
// //   // Regular: 1=BasicInfo, 2=OCR+Details, 3=Password, 4=OTP
// //   // Google:  1=OCR,       2=Details+Submit
// //   const showBasicInfo    = !isGoogleFlow && step === 1;
// //   const showOCR          = isGoogleFlow ? step === 1 : step === 2;
// //   const showDetails      = isGoogleFlow ? step === 2 : step === 2;
// //   const showPassword     = !isGoogleFlow && step === 3;
// //   const showOTP          = !isGoogleFlow && step === 4;

// //   return (
// //     <div className="min-h-screen bg-gray-50 flex flex-col">
// //       <header className="py-6 px-4">
// //         <div className="max-w-7xl mx-auto">
// //           <Link to="/" className="inline-flex items-center gap-2">
// //             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
// //               <HeartPulseIcon className="w-6 h-6 text-white" />
// //             </div>
// //             <span className="font-heading font-bold text-xl text-secondary">
// //               Life<span className="text-primary">Flow</span>
// //             </span>
// //           </Link>
// //         </div>
// //       </header>

// //       <main className="flex-1 flex items-center justify-center px-4 py-12">
// //         <div className="w-full max-w-xl">
// //           <div className="text-center mb-8">
// //             <h1 className="text-3xl font-heading font-bold text-gray-900">Create Your Account</h1>
// //             <p className="mt-2 text-gray-600">
// //               {isGoogleFlow
// //                 ? `Welcome, ${googleUser?.name}! Complete your profile to continue.`
// //                 : "Join Nepal's largest blood donation network"}
// //             </p>
// //           </div>

// //           {/* Progress Steps */}
// //           <div className="flex items-center justify-center gap-1 mb-8">
// //             {stepLabels.map((label, idx) => {
// //               const s = idx + 1;
// //               return (
// //                 <Fragment key={s}>
// //                   <div className="flex flex-col items-center gap-1">
// //                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
// //                       step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
// //                     }`}>
// //                       {step > s ? <CheckCircleIcon className="w-5 h-5" /> : s}
// //                     </div>
// //                     <span className="text-xs text-gray-500 hidden sm:block">{label}</span>
// //                   </div>
// //                   {s < totalSteps && (
// //                     <div className={`w-10 h-1 rounded mb-4 transition-colors ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />
// //                   )}
// //                 </Fragment>
// //               );
// //             })}
// //           </div>

// //           <Card padding="lg">
// //             <form onSubmit={handleSubmit}>

// //               {/* ══ STEP: Basic Info (regular flow only) ══ */}
// //               {showBasicInfo && (
// //                 <div className="space-y-6">
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-3">I want to register as</label>
// //                     <div className="grid grid-cols-2 gap-3">
// //                       {userTypeOptions.map(option => (
// //                         <button key={option.type} type="button" onClick={() => setUserType(option.type)}
// //                           className={`p-4 rounded-xl border-2 text-center transition-all ${
// //                             userType === option.type ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
// //                           }`}>
// //                           <option.icon className={`w-6 h-6 mx-auto mb-2 ${userType === option.type ? 'text-primary' : 'text-gray-400'}`} />
// //                           <p className={`text-sm font-medium ${userType === option.type ? 'text-primary' : 'text-gray-700'}`}>{option.label}</p>
// //                           <p className="text-xs text-gray-500 mt-1">{option.description}</p>
// //                         </button>
// //                       ))}
// //                     </div>
// //                   </div>

// //                   {userType === 'user' && (
// //                     <div className="grid grid-cols-2 gap-4">
// //                       <Input label="First Name" name="firstName" placeholder="Enter first name"
// //                         value={formData.firstName} onChange={handleChange} error={errors.firstName} />
// //                       <Input label="Last Name" name="lastName" placeholder="Enter last name"
// //                         value={formData.lastName} onChange={handleChange} error={errors.lastName} />
// //                     </div>
// //                   )}
// //                   {userType === 'hospital' && (
// //                     <>
// //                       <Input label="Hospital Name" name="hospitalName" placeholder="Enter hospital name"
// //                         value={formData.hospitalName} onChange={handleChange} error={errors.hospitalName}
// //                         leftIcon={<BuildingIcon className="w-5 h-5" />} />
// //                       <Input label="Registration Number" name="hospitalRegNumber" placeholder="Enter registration number"
// //                         value={formData.hospitalRegNumber} onChange={handleChange} error={errors.hospitalRegNumber} />
// //                     </>
// //                   )}

// //                   <Input label="Email Address" type="email" name="email" placeholder="Enter your email"
// //                     value={formData.email} onChange={handleChange} error={errors.email}
// //                     leftIcon={<MailIcon className="w-5 h-5" />} />
// //                   <Input label="Phone Number" type="tel" name="phone" placeholder="98XXXXXXXX"
// //                     value={formData.phone} onChange={handleChange} error={errors.phone}
// //                     leftIcon={<PhoneIcon className="w-5 h-5" />} />
// //                 </div>
// //               )}

// //               {/* ══ STEP: OCR Verification ══ */}
// //               {showOCR && (
// //                 <div className="space-y-6">
// //                   <h3 className="text-lg font-semibold text-gray-900">Document Verification</h3>
// //                   <OCRVerification
// //                     userType={userType}
// //                     onVerificationComplete={handleOCRComplete}
// //                     expectedAdminName="Sushanta Marahatta"
// //                   />
// //                   {errors.ocr && (
// //                     <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
// //                       <AlertCircleIcon className="w-4 h-4" />{errors.ocr}
// //                     </p>
// //                   )}
// //                 </div>
// //               )}

// //               {/* ══ STEP: Details (shown after OCR, on same step for regular flow) ══ */}
// //               {showDetails && ocrData?.isVerified && (
// //                 <div className={`${showOCR ? 'border-t mt-6 pt-6' : ''} space-y-4`}>
// //                   {showOCR && <p className="text-sm font-semibold text-gray-700">Fill in your details below</p>}

// //                   {/* Phone (Google flow only — regular flow has it in step 1) */}
// //                   {isGoogleFlow && (
// //                     <Input label="Phone Number" type="tel" name="phone" placeholder="98XXXXXXXX"
// //                       value={formData.phone} onChange={handleChange} error={errors.phone}
// //                       leftIcon={<PhoneIcon className="w-5 h-5" />} />
// //                   )}

// //                   {userType === 'user' && (
// //                     <>
// //                       <div>
// //                         <label className="block text-sm font-medium text-gray-700 mb-1">
// //                           Date of Birth
// //                           {ocrData.dateOfBirth?.year && (
// //                             <span className="ml-2 text-xs text-green-600 font-normal">✓ Auto-filled from document</span>
// //                           )}
// //                         </label>
// //                         <div className="grid grid-cols-3 gap-3">
// //                           <Select options={days}   placeholder="Day"   name="dobDay"   value={formData.dobDay}   onChange={handleChange} />
// //                           <Select options={months} placeholder="Month" name="dobMonth" value={formData.dobMonth} onChange={handleChange} />
// //                           <Select options={years}  placeholder="Year"  name="dobYear"  value={formData.dobYear}  onChange={handleChange} />
// //                         </div>
// //                         {errors.dob && (
// //                           <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
// //                             <AlertCircleIcon className="w-4 h-4" />{errors.dob}
// //                           </p>
// //                         )}
// //                       </div>
// //                       <Select label="Blood Group" options={bloodGroups} placeholder="Select your blood group"
// //                         name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} error={errors.bloodGroup} />
// //                     </>
// //                   )}

// //                   <Select label="Province" options={provinces} placeholder="Select province"
// //                     name="province" value={formData.province} onChange={handleChange} error={errors.province} />
// //                   <Select label="District" options={availableDistricts}
// //                     placeholder={formData.province ? '-- Select District --' : 'Select province first'}
// //                     name="district" value={formData.district} onChange={handleChange}
// //                     error={errors.district} disabled={!formData.province} />
// //                   <Input label="Municipality / VDC / Rural Municipality" name="municipality"
// //                     placeholder="Enter your municipality / VDC / ward"
// //                     value={formData.municipality} onChange={handleChange} error={errors.municipality}
// //                     leftIcon={<MapPinIcon className="w-5 h-5" />} />

// //                   {submitError && (
// //                     <div className="p-3 rounded-lg bg-red-50 border border-red-200">
// //                       <p className="text-sm font-semibold text-red-700">Error</p>
// //                       <p className="text-sm text-red-600">{submitError}</p>
// //                     </div>
// //                   )}
// //                 </div>
// //               )}

// //               {/* ══ STEP: Password (regular flow only) ══ */}
// //               {showPassword && (
// //                 <div className="space-y-6">
// //                   <Input label="Password" type="password" name="password" placeholder="Create a strong password"
// //                     value={formData.password} onChange={handleChange} error={errors.password}
// //                     leftIcon={<LockIcon className="w-5 h-5" />} hint="At least 8 characters" />
// //                   <Input label="Confirm Password" type="password" name="confirmPassword" placeholder="Confirm your password"
// //                     value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
// //                     leftIcon={<LockIcon className="w-5 h-5" />} />
// //                   <Alert variant="info">
// //                     <div className="flex items-start gap-2">
// //                       <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
// //                       <div>
// //                         <p className="font-medium">Almost there!</p>
// //                         <p className="text-sm mt-1">We'll send a 6-digit OTP to verify your email.</p>
// //                       </div>
// //                     </div>
// //                   </Alert>
// //                   <label className="flex items-start gap-3 cursor-pointer">
// //                     <input type="checkbox" className="w-4 h-4 mt-1 text-primary rounded border-gray-300 focus:ring-primary" required />
// //                     <span className="text-sm text-gray-600">
// //                       I agree to the{' '}
// //                       <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
// //                       {' '}and{' '}
// //                       <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
// //                     </span>
// //                   </label>
// //                 </div>
// //               )}

// //               {/* ══ STEP: OTP (regular flow only) ══ */}
// //               {showOTP && (
// //                 <div className="space-y-6">
// //                   <div className="text-center">
// //                     <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
// //                       <MailIcon className="w-8 h-8 text-primary" />
// //                     </div>
// //                     <h3 className="text-lg font-semibold text-gray-900">Verify Your Email</h3>
// //                     <p className="text-sm text-gray-500 mt-2">
// //                       We've sent a 6-digit code to<br />
// //                       <span className="font-semibold text-gray-700">{formData.email}</span>
// //                     </p>
// //                   </div>

// //                   {submitError && (
// //                     <div className="p-4 rounded-lg bg-red-50 border border-red-200">
// //                       <p className="text-sm font-semibold text-red-700">Registration Failed</p>
// //                       <p className="text-sm text-red-600 mt-1">{submitError}</p>
// //                     </div>
// //                   )}
// //                   {sendError && (
// //                     <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2">
// //                       <p className="text-sm font-semibold text-red-700">Could not send OTP</p>
// //                       <p className="text-sm text-red-600">{sendError}</p>
// //                       <button type="button" onClick={handleSendOTP} disabled={isLoading}
// //                         className="text-sm text-red-700 font-medium underline disabled:opacity-50">Try again</button>
// //                     </div>
// //                   )}
// //                   {isLoading && !otpVerified && <p className="text-center text-sm text-gray-500 animate-pulse">Sending OTP…</p>}

// //                   {otpVerified ? (
// //                     <Alert variant="success">
// //                       <div className="flex items-center gap-2">
// //                         <CheckCircleIcon className="w-5 h-5 text-green-500" />
// //                         <p className="font-medium">Email verified! Creating your account…</p>
// //                       </div>
// //                     </Alert>
// //                   ) : !sendError && !isLoading && (
// //                     <>
// //                       <div>
// //                         <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter 6-digit OTP</label>
// //                         <div className="flex gap-2 justify-center">
// //                           {Array.from({ length: 6 }).map((_, i) => (
// //                             <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
// //                               value={otpInput[i] || ''}
// //                               onChange={e => handleOtpBoxChange(e, i)}
// //                               onKeyDown={e => handleOtpBoxKeyDown(e, i)}
// //                               className={`w-11 h-12 text-center text-lg font-bold border-2 rounded-lg focus:outline-none focus:border-primary transition-colors ${otpError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
// //                             />
// //                           ))}
// //                         </div>
// //                         {otpError && (
// //                           <p className="mt-2 text-sm text-red-600 text-center flex items-center justify-center gap-1">
// //                             <AlertCircleIcon className="w-4 h-4" />{otpError}
// //                           </p>
// //                         )}
// //                       </div>
// //                       <Button type="button" className="w-full" onClick={handleVerifyOTP}
// //                         disabled={otpInput.replace(/\s/g, '').length < 6 || isLoading}>
// //                         Verify OTP
// //                       </Button>
// //                       <div className="text-center">
// //                         <p className="text-sm text-gray-500">Didn't receive the code?</p>
// //                         {resendCooldown > 0
// //                           ? <p className="text-sm text-gray-400 mt-1">Resend in {resendCooldown}s</p>
// //                           : <button type="button" onClick={handleSendOTP} disabled={isLoading}
// //                               className="mt-1 text-sm text-primary font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-50">
// //                               <RefreshCwIcon className="w-3 h-3" /> Resend OTP
// //                             </button>
// //                         }
// //                       </div>
// //                     </>
// //                   )}
// //                 </div>
// //               )}

// //               {/* ══ Navigation buttons ══ */}
// //               <div className="flex gap-3 mt-8">
// //                 {step > 1 && !(showOTP && otpVerified) && (
// //                   <Button type="button" variant="outline" onClick={handleBack} className="flex-1">Back</Button>
// //                 )}

// //                 {/* Google flow: Continue / Complete Registration */}
// //                 {isGoogleFlow && step < totalSteps && (
// //                   <Button type="button" onClick={handleNext} className="flex-1">Continue</Button>
// //                 )}
// //                 {isGoogleFlow && step === totalSteps && ocrData?.isVerified && (
// //                   <Button type="button" onClick={handleNext} isLoading={isLoading} className="flex-1">
// //                     Complete Registration
// //                   </Button>
// //                 )}

// //                 {/* Regular flow */}
// //                 {!isGoogleFlow && step === 1 && (
// //                   <Button type="button" onClick={handleNext} className="flex-1">Continue</Button>
// //                 )}
// //                 {!isGoogleFlow && step === 2 && (
// //                   <Button type="button" onClick={handleNext} className="flex-1">Continue</Button>
// //                 )}
// //                 {!isGoogleFlow && step === 3 && (
// //                   <Button type="button" onClick={handleNext} isLoading={isLoading} className="flex-1">
// //                     Continue &amp; Send OTP
// //                   </Button>
// //                 )}
// //                 {!isGoogleFlow && step === 4 && otpVerified && (
// //                   <Button type="submit" isLoading={isLoading} className="w-full">Create Account</Button>
// //                 )}
// //               </div>
// //             </form>
// //           </Card>

// //           {/* Google OAuth button — only shown on step 1 of regular flow */}
// //           {!isGoogleFlow && step === 1 && (
// //             <Button variant="outline" fullWidth className="mb-3 mt-6"
// //               onClick={() => { window.location.href = `${API}/api/auth/google`; }}>
// //               <div className="flex items-center justify-center gap-2">
// //                 <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
// //                 <span>Continue with Google</span>
// //               </div>
// //             </Button>
// //           )}

// //           <p className="mt-6 text-center text-gray-600">
// //             Already have an account?{' '}
// //             <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
// //           </p>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // }

// import emailjs from '@emailjs/browser';
// import React, { useState, Fragment, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import {
//   HeartPulseIcon, UserIcon, BuildingIcon, MailIcon,
//   LockIcon, PhoneIcon, MapPinIcon, CheckCircleIcon,
//   AlertCircleIcon, RefreshCwIcon,
// } from 'lucide-react';
// import { Button }   from '../components/ui/Button';
// import { Input }    from '../components/ui/Input';
// import { Select }   from '../components/ui/Select';
// import { Card }     from '../components/ui/Card';
// import { Alert }    from '../components/ui/Alert';
// import { OCRVerification, OCRVerificationData } from '../components/features/OCRVerification';

// type UserType = 'user' | 'hospital';

// const API                 = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// const EMAILJS_SERVICE_ID  = 'service_hfrba86';
// const EMAILJS_TEMPLATE_ID = 'template_qpv3f4t';
// const EMAILJS_PUBLIC_KEY  = 'jf7SKwUj0GbF3OxLD';

// // ── Static data ───────────────────────────────────────────────────────────────
// const bloodGroups = [
//   { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
//   { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
//   { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
//   { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
// ];

// const provinces = [
//   { value: 'koshi',         label: 'Koshi Province' },
//   { value: 'madhesh',       label: 'Madhesh Province' },
//   { value: 'bagmati',       label: 'Bagmati Province' },
//   { value: 'gandaki',       label: 'Gandaki Province' },
//   { value: 'lumbini',       label: 'Lumbini Province' },
//   { value: 'karnali',       label: 'Karnali Province' },
//   { value: 'sudurpashchim', label: 'Sudurpashchim Province' },
// ];

// const districtsByProvince: Record<string, { value: string; label: string }[]> = {
//   koshi: [
//     { value: 'taplejung', label: 'Taplejung' }, { value: 'panchthar', label: 'Panchthar' },
//     { value: 'illam', label: 'Ilam' }, { value: 'jhapa', label: 'Jhapa' },
//     { value: 'morang', label: 'Morang' }, { value: 'sunsari', label: 'Sunsari' },
//     { value: 'dhankuta', label: 'Dhankuta' }, { value: 'terhathum', label: 'Terhathum' },
//     { value: 'sankhuwasabha', label: 'Sankhuwasabha' }, { value: 'bhojpur', label: 'Bhojpur' },
//     { value: 'solukhumbu', label: 'Solukhumbu' }, { value: 'okhaldhunga', label: 'Okhaldhunga' },
//     { value: 'khotang', label: 'Khotang' }, { value: 'udayapur', label: 'Udayapur' },
//   ],
//   madhesh: [
//     { value: 'saptari', label: 'Saptari' }, { value: 'sarlahi', label: 'Sarlahi' },
//     { value: 'dhanusha', label: 'Dhanusha' }, { value: 'mahottari', label: 'Mahottari' },
//     { value: 'siraha', label: 'Siraha' }, { value: 'rautahat', label: 'Rautahat' },
//     { value: 'bara', label: 'Bara' }, { value: 'parsa', label: 'Parsa' },
//   ],
//   bagmati: [
//     { value: 'kathmandu', label: 'Kathmandu' }, { value: 'lalitpur', label: 'Lalitpur' },
//     { value: 'bhaktapur', label: 'Bhaktapur' }, { value: 'kavrepalanchok', label: 'Kavrepalanchok' },
//     { value: 'sindhupalchok', label: 'Sindhupalchok' }, { value: 'nuwakot', label: 'Nuwakot' },
//     { value: 'dhading', label: 'Dhading' }, { value: 'makwanpur', label: 'Makwanpur' },
//     { value: 'chitwan', label: 'Chitwan' }, { value: 'ramechhap', label: 'Ramechhap' },
//     { value: 'dolakha', label: 'Dolakha' }, { value: 'sindhuli', label: 'Sindhuli' },
//     { value: 'rasuwa', label: 'Rasuwa' },
//   ],
//   gandaki: [
//     { value: 'kaski', label: 'Kaski' }, { value: 'tanahun', label: 'Tanahun' },
//     { value: 'syangja', label: 'Syangja' }, { value: 'lamjung', label: 'Lamjung' },
//     { value: 'gorkha', label: 'Gorkha' }, { value: 'manang', label: 'Manang' },
//     { value: 'mustang', label: 'Mustang' }, { value: 'myagdi', label: 'Myagdi' },
//     { value: 'baglung', label: 'Baglung' }, { value: 'parbat', label: 'Parbat' },
//     { value: 'nawalpur', label: 'Nawalpur' },
//   ],
//   lumbini: [
//     { value: 'rupandehi', label: 'Rupandehi' }, { value: 'kapilvastu', label: 'Kapilvastu' },
//     { value: 'arghakhanchi', label: 'Arghakhanchi' }, { value: 'gulmi', label: 'Gulmi' },
//     { value: 'palpa', label: 'Palpa' }, { value: 'dang', label: 'Dang' },
//     { value: 'pyuthan', label: 'Pyuthan' }, { value: 'rolpa', label: 'Rolpa' },
//     { value: 'banke', label: 'Banke' }, { value: 'bardiya', label: 'Bardiya' },
//   ],
//   karnali: [
//     { value: 'humla', label: 'Humla' }, { value: 'mugu', label: 'Mugu' },
//     { value: 'dolpa', label: 'Dolpa' }, { value: 'jumla', label: 'Jumla' },
//     { value: 'kalikot', label: 'Kalikot' }, { value: 'jajarkot', label: 'Jajarkot' },
//     { value: 'surkhet', label: 'Surkhet' }, { value: 'salyan', label: 'Salyan' },
//     { value: 'dailekh', label: 'Dailekh' },
//   ],
//   sudurpashchim: [
//     { value: 'kailali', label: 'Kailali' }, { value: 'kanchanpur', label: 'Kanchanpur' },
//     { value: 'doti', label: 'Doti' }, { value: 'dadeldhura', label: 'Dadeldhura' },
//     { value: 'bajhang', label: 'Bajhang' }, { value: 'bajura', label: 'Bajura' },
//     { value: 'baitadi', label: 'Baitadi' }, { value: 'darchula', label: 'Darchula' },
//   ],
// };

// const days   = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
// const months = [
//   { value: '1', label: 'January' }, { value: '2', label: 'February' },
//   { value: '3', label: 'March' }, { value: '4', label: 'April' },
//   { value: '5', label: 'May' }, { value: '6', label: 'June' },
//   { value: '7', label: 'July' }, { value: '8', label: 'August' },
//   { value: '9', label: 'September' }, { value: '10', label: 'October' },
//   { value: '11', label: 'November' }, { value: '12', label: 'December' },
// ];
// const years = Array.from({ length: 50 }, (_, i) => {
//   const year = new Date().getFullYear() - 18 - i;
//   return { value: String(year), label: String(year) };
// });

// const userTypeOptions = [
//   { type: 'user' as const, icon: UserIcon, label: 'Blood Donor', description: 'Register to donate blood and save lives' },
//   { type: 'hospital' as const, icon: BuildingIcon, label: 'Hospital', description: 'Register your hospital or blood bank' },
// ];

// function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

// async function sendOTPEmail(email: string, otp: string) {
//   emailjs.init(EMAILJS_PUBLIC_KEY);
//   const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { user_email: email, otp }, EMAILJS_PUBLIC_KEY);
//   if (result.status !== 200) throw new Error(`EmailJS error ${result.status}: ${result.text}`);
// }

// // ── Step labels ───────────────────────────────────────────────────────────────
// // Regular:  Basic Info → Document Verification → Password → Confirm Email
// // Google:   Document Verification → Your Details
// const REGULAR_STEPS = ['Basic Info', 'Verification', 'Password', 'Confirm Email'];
// const GOOGLE_STEPS  = ['Document', 'Details'];

// // ── Component ─────────────────────────────────────────────────────────────────
// export function SignUpPage() {
//   const navigate = useNavigate();

//   // ── Detect Google pending user from sessionStorage ──────────────────────
//   const [googlePending, setGooglePending] = useState<{
//     token: string;
//     user: { id: string; name: string; email: string; avatar: string };
//   } | null>(null);

//   useEffect(() => {
//     // Redirect if already fully logged in
//     if (localStorage.getItem('lf_user')) { navigate('/', { replace: true }); return; }

//     // Check for pending Google user
//     const raw = sessionStorage.getItem('google_pending');
//     if (raw) {
//       try {
//         const data = JSON.parse(raw);
//         setGooglePending(data);
//         // Pre-fill name from Google account
//         const [firstName, ...lastParts] = (data.user.name || '').split(' ');
//         setFormData(prev => ({
//           ...prev,
//           firstName: firstName || '',
//           lastName:  lastParts.join(' ') || '',
//           email:     data.user.email || '',
//         }));
//       } catch { /* ignore */ }
//     }
//   }, [navigate]);

//   const isGoogleFlow = !!googlePending;
//   const stepLabels   = isGoogleFlow ? GOOGLE_STEPS : REGULAR_STEPS;
//   const totalSteps   = stepLabels.length;

//   // ── State ─────────────────────────────────────────────────────────────────
//   const [userType,       setUserType]       = useState<UserType>('user');
//   const [isLoading,      setIsLoading]      = useState(false);
//   const [step,           setStep]           = useState(1);
//   const [ocrData,        setOcrData]        = useState<OCRVerificationData | null>(null);
//   const [submitError,    setSubmitError]    = useState('');

//   const [generatedOTP,   setGeneratedOTP]   = useState('');
//   const [otpInput,       setOtpInput]       = useState('');
//   const [otpError,       setOtpError]       = useState('');
//   const [otpVerified,    setOtpVerified]    = useState(false);
//   const [resendCooldown, setResendCooldown] = useState(0);
//   const [sendError,      setSendError]      = useState('');

//   const [formData, setFormData] = useState({
//     firstName: '', lastName: '', email: '', phone: '',
//     dobDay: '', dobMonth: '', dobYear: '',
//     bloodGroup: '', province: '', district: '', municipality: '',
//     password: '', confirmPassword: '',
//     hospitalName: '', hospitalRegNumber: '',
//   });
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const availableDistricts = formData.province ? (districtsByProvince[formData.province] || []) : [];

//   // ── Handlers ──────────────────────────────────────────────────────────────
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     if (name === 'province') {
//       setFormData(prev => ({ ...prev, province: value, district: '' }));
//     } else {
//       setFormData(prev => ({ ...prev, [name]: value }));
//     }
//     if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
//   };

//   const handleOCRComplete = (data: OCRVerificationData) => {
//     setOcrData(data);
//     if (userType === 'user') {
//       // Only auto-fill name if NOT a Google user (Google already provided the name)
//       if (!isGoogleFlow) {
//         const [firstName, ...lastParts] = data.fullName.split(' ');
//         setFormData(prev => ({
//           ...prev,
//           firstName: firstName || prev.firstName,
//           lastName:  lastParts.join(' ') || prev.lastName,
//           dobYear:   data.dateOfBirth?.year  || prev.dobYear,
//           dobMonth:  data.dateOfBirth?.month || prev.dobMonth,
//           dobDay:    data.dateOfBirth?.day   || prev.dobDay,
//         }));
//       } else {
//         // Google flow: only auto-fill DOB from document, keep Google name
//         setFormData(prev => ({
//           ...prev,
//           dobYear:  data.dateOfBirth?.year  || prev.dobYear,
//           dobMonth: data.dateOfBirth?.month || prev.dobMonth,
//           dobDay:   data.dateOfBirth?.day   || prev.dobDay,
//         }));
//       }
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         hospitalName:      data.fullName,
//         hospitalRegNumber: data.documentNumber,
//       }));
//     }
//   };

//   // ── Validation ────────────────────────────────────────────────────────────
//   const validateStep1Regular = () => {
//     const e: Record<string, string> = {};
//     if (userType === 'user') {
//       if (!formData.firstName) e.firstName = 'First name is required';
//       if (!formData.lastName)  e.lastName  = 'Last name is required';
//     } else {
//       if (!formData.hospitalName)      e.hospitalName      = 'Hospital name is required';
//       if (!formData.hospitalRegNumber) e.hospitalRegNumber = 'Registration number is required';
//     }
//     if (!formData.email)                            e.email = 'Email is required';
//     else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Please enter a valid email';
//     if (!formData.phone)                            e.phone = 'Phone number is required';
//     else if (!/^[0-9]{10}$/.test(formData.phone))  e.phone = 'Please enter a valid 10-digit phone number';
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const validateOCR = () => {
//     const e: Record<string, string> = {};
//     if (!ocrData?.isVerified) e.ocr = 'Document verification is required';
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const validateDetails = () => {
//     const e: Record<string, string> = {};
//     if (userType === 'user') {
//       if (!formData.dobDay || !formData.dobMonth || !formData.dobYear)
//         e.dob = 'Date of birth is required';
//       if (!formData.bloodGroup) e.bloodGroup = 'Blood group is required';
//     }
//     if (!formData.phone && isGoogleFlow) e.phone = 'Phone number is required';
//     else if (isGoogleFlow && !/^[0-9]{10}$/.test(formData.phone)) e.phone = 'Please enter a valid 10-digit phone number';
//     if (!formData.province)     e.province     = 'Province is required';
//     if (!formData.district)     e.district     = 'District is required';
//     if (!formData.municipality) e.municipality = 'Municipality is required';
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const validatePassword = () => {
//     const e: Record<string, string> = {};
//     if (!formData.password)                e.password = 'Password is required';
//     else if (formData.password.length < 8) e.password = 'Password must be at least 8 characters';
//     if (formData.password !== formData.confirmPassword)
//       e.confirmPassword = 'Passwords do not match';
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   // ── OTP ───────────────────────────────────────────────────────────────────
//   const startCooldown = () => {
//     setResendCooldown(60);
//     const timer = setInterval(() => {
//       setResendCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
//     }, 1000);
//   };

//   const handleSendOTP = async () => {
//     const otp = generateOTP();
//     setGeneratedOTP(otp); setOtpInput(''); setOtpError(''); setSendError('');
//     setIsLoading(true);
//     try { await sendOTPEmail(formData.email, otp); startCooldown(); }
//     catch (err: any) { setSendError(err?.text ?? err?.message ?? JSON.stringify(err)); }
//     finally { setIsLoading(false); }
//   };

//   const handleVerifyOTP = () => {
//     if (otpInput.trim() === generatedOTP) { setOtpVerified(true); setOtpError(''); }
//     else setOtpError('Invalid OTP. Please check and try again.');
//   };

//   // ── Navigation ────────────────────────────────────────────────────────────
//   const handleNext = async () => {
//     setSubmitError('');
//     if (isGoogleFlow) {
//       if (step === 1 && validateOCR()) setStep(2);
//       else if (step === 2 && validateDetails()) await handleGoogleSubmit();
//     } else {
//       if      (step === 1 && validateStep1Regular())                    setStep(2);
//       else if (step === 2 && validateOCR() && validateDetails())        setStep(3);
//       else if (step === 3 && validatePassword()) { setStep(4); await handleSendOTP(); }
//     }
//   };

//   const handleBack = () => { if (step > 1) setStep(step - 1); };

//   // ── Submit: Google user ───────────────────────────────────────────────────
//   const handleGoogleSubmit = async () => {
//     if (!googlePending) return;
//     setIsLoading(true); setSubmitError('');
//     try {
//       const rawPhoto      = ocrData?.documentPhotoBase64 ?? '';
//       const documentPhoto = rawPhoto.length <= 2_000_000 ? rawPhoto : '';

//       const res = await fetch(`${API}/api/auth/register-google`, {
//         method:  'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           googleId:     googlePending.user.id,
//           name:         googlePending.user.name,
//           email:        googlePending.user.email,
//           avatar:       googlePending.user.avatar,
//           phone:        formData.phone,
//           bloodGroup:   formData.bloodGroup,
//           province:     formData.province,
//           district:     formData.district,
//           municipality: formData.municipality,
//           dobDay:       formData.dobDay,
//           dobMonth:     formData.dobMonth,
//           dobYear:      formData.dobYear,
//           documentPhoto,
//         }),
//       });

//       const data = await res.json();
//       if (!res.ok) { setSubmitError(data.error || 'Registration failed.'); return; }

//       // Clear the pending google session data
//       sessionStorage.removeItem('google_pending');

//       localStorage.setItem('lf_token', data.token);
//       localStorage.setItem('lf_user',  JSON.stringify(data.user));
//       navigate('/');
//     } catch { setSubmitError('Could not connect to server. Please try again.'); }
//     finally { setIsLoading(false); }
//   };

//   // ── Submit: regular user ──────────────────────────────────────────────────
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!otpVerified) { setOtpError('Please verify the OTP first.'); return; }
//     setIsLoading(true); setSubmitError('');
//     try {
//       const fullName      = userType === 'user'
//         ? `${formData.firstName} ${formData.lastName}`.trim()
//         : formData.hospitalName;
//       const rawPhoto      = ocrData?.documentPhotoBase64 ?? '';
//       const documentPhoto = rawPhoto.length <= 2_000_000 ? rawPhoto : '';

//       const res = await fetch(`${API}/api/auth/register`, {
//         method:  'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           name: fullName, email: formData.email, password: formData.password,
//           role: userType, phone: formData.phone,
//           bloodGroup:   formData.bloodGroup,
//           province:     formData.province,
//           district:     formData.district,
//           municipality: formData.municipality,
//           dobDay:       formData.dobDay,
//           dobMonth:     formData.dobMonth,
//           dobYear:      formData.dobYear,
//           hospitalName:      formData.hospitalName,
//           hospitalRegNumber: formData.hospitalRegNumber,
//           documentPhoto,
//         }),
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         // ── Duplicate document detected ──────────────────────────────────
//         // The backend returns 409 with a specific message when it finds a user
//         // whose name + citizenship number already matches an existing record.
//         if (res.status === 409) {
//           setSubmitError(data.error || 'An account with this document already exists.');
//           setIsLoading(false);
//           return;
//         }
//         setSubmitError(data.error || `Registration failed (${res.status}).`);
//         return;
//       }

//       localStorage.setItem('lf_token', data.token);
//       localStorage.setItem('lf_user',  JSON.stringify(data.user));
//       navigate('/');
//     } catch { setSubmitError('Could not connect to server. Please try again.'); }
//     finally { setIsLoading(false); }
//   };

//   // ── OTP box handlers ──────────────────────────────────────────────────────
//   const handleOtpBoxChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
//     const val = e.target.value.replace(/\D/, '').slice(0, 1);
//     const arr = Array.from({ length: 6 }, (_, idx) => otpInput[idx] ?? '');
//     arr[i] = val; setOtpInput(arr.join('')); setOtpError('');
//     if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
//   };
//   const handleOtpBoxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
//     if (e.key === 'Backspace') {
//       e.preventDefault();
//       const arr = Array.from({ length: 6 }, (_, idx) => otpInput[idx] ?? '');
//       if (arr[i]) { arr[i] = ''; setOtpInput(arr.join('')); }
//       else if (i > 0) { arr[i - 1] = ''; setOtpInput(arr.join('')); document.getElementById(`otp-${i - 1}`)?.focus(); }
//     }
//   };

//   // ── Render ────────────────────────────────────────────────────────────────
//   // Regular: 1=BasicInfo  2=OCR+Details  3=Password   4=OTP
//   // Google:  1=OCR        2=Details+Submit
//   const showBasicInfo = !isGoogleFlow && step === 1;
//   const showOCR       = step === (isGoogleFlow ? 1 : 2);
//   const showDetails   = step === (isGoogleFlow ? 2 : 2);
//   const showPassword  = !isGoogleFlow && step === 3;
//   const showOTP       = !isGoogleFlow && step === 4;

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col">
//       <header className="py-6 px-4">
//         <div className="max-w-7xl mx-auto">
//           <Link to="/" className="inline-flex items-center gap-2">
//             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
//               <HeartPulseIcon className="w-6 h-6 text-white" />
//             </div>
//             <span className="font-heading font-bold text-xl text-secondary">
//               Life<span className="text-primary">Flow</span>
//             </span>
//           </Link>
//         </div>
//       </header>

//       <main className="flex-1 flex items-center justify-center px-4 py-12">
//         <div className="w-full max-w-xl">

//           <div className="text-center mb-8">
//             <h1 className="text-3xl font-heading font-bold text-gray-900">Create Your Account</h1>
//             <p className="mt-2 text-gray-600">
//               {isGoogleFlow
//                 ? `Welcome, ${googlePending?.user.name}! Please verify your document to continue.`
//                 : "Join Nepal's largest blood donation network"}
//             </p>
//           </div>

//           {/* Google user banner */}
//           {isGoogleFlow && (
//             <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
//               {googlePending?.user.avatar && (
//                 <img src={googlePending.user.avatar} alt="avatar"
//                   className="w-10 h-10 rounded-full border border-blue-200" />
//               )}
//               <div>
//                 <p className="text-sm font-semibold text-blue-800">{googlePending?.user.name}</p>
//                 <p className="text-xs text-blue-600">{googlePending?.user.email}</p>
//               </div>
//               <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
//                 Google Account
//               </span>
//             </div>
//           )}

//           {/* Progress steps */}
//           <div className="flex items-center justify-center gap-1 mb-8">
//             {stepLabels.map((label, idx) => {
//               const s = idx + 1;
//               return (
//                 <Fragment key={s}>
//                   <div className="flex flex-col items-center gap-1">
//                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
//                       step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
//                     }`}>
//                       {step > s ? <CheckCircleIcon className="w-5 h-5" /> : s}
//                     </div>
//                     <span className="text-xs text-gray-500 hidden sm:block">{label}</span>
//                   </div>
//                   {s < totalSteps && (
//                     <div className={`w-10 h-1 rounded mb-4 transition-colors ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />
//                   )}
//                 </Fragment>
//               );
//             })}
//           </div>

//           <Card padding="lg">
//             <form onSubmit={handleSubmit}>

//               {/* ══ Basic Info (regular only) ══ */}
//               {showBasicInfo && (
//                 <div className="space-y-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-3">I want to register as</label>
//                     <div className="grid grid-cols-2 gap-3">
//                       {userTypeOptions.map(option => (
//                         <button key={option.type} type="button" onClick={() => setUserType(option.type)}
//                           className={`p-4 rounded-xl border-2 text-center transition-all ${
//                             userType === option.type ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
//                           }`}>
//                           <option.icon className={`w-6 h-6 mx-auto mb-2 ${userType === option.type ? 'text-primary' : 'text-gray-400'}`} />
//                           <p className={`text-sm font-medium ${userType === option.type ? 'text-primary' : 'text-gray-700'}`}>{option.label}</p>
//                           <p className="text-xs text-gray-500 mt-1">{option.description}</p>
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                   {userType === 'user' ? (
//                     <div className="grid grid-cols-2 gap-4">
//                       <Input label="First Name" name="firstName" placeholder="Enter first name"
//                         value={formData.firstName} onChange={handleChange} error={errors.firstName} />
//                       <Input label="Last Name" name="lastName" placeholder="Enter last name"
//                         value={formData.lastName} onChange={handleChange} error={errors.lastName} />
//                     </div>
//                   ) : (
//                     <>
//                       <Input label="Hospital Name" name="hospitalName" placeholder="Enter hospital name"
//                         value={formData.hospitalName} onChange={handleChange} error={errors.hospitalName}
//                         leftIcon={<BuildingIcon className="w-5 h-5" />} />
//                       <Input label="Registration Number" name="hospitalRegNumber" placeholder="Enter registration number"
//                         value={formData.hospitalRegNumber} onChange={handleChange} error={errors.hospitalRegNumber} />
//                     </>
//                   )}
//                   <Input label="Email Address" type="email" name="email" placeholder="Enter your email"
//                     value={formData.email} onChange={handleChange} error={errors.email}
//                     leftIcon={<MailIcon className="w-5 h-5" />} />
//                   <Input label="Phone Number" type="tel" name="phone" placeholder="98XXXXXXXX"
//                     value={formData.phone} onChange={handleChange} error={errors.phone}
//                     leftIcon={<PhoneIcon className="w-5 h-5" />} />
//                 </div>
//               )}

//               {/* ══ OCR Verification ══ */}
//               {showOCR && (
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900">Document Verification</h3>
//                     <p className="text-sm text-gray-500 mt-1">
//                       Upload your citizenship card or passport to verify your identity.
//                     </p>
//                   </div>
//                   <OCRVerification
//                     userType={userType}
//                     onVerificationComplete={handleOCRComplete}
//                     expectedAdminName="Sushanta Marahatta"
//                   />
//                   {errors.ocr && (
//                     <p className="text-sm text-red-600 flex items-center gap-1">
//                       <AlertCircleIcon className="w-4 h-4" />{errors.ocr}
//                     </p>
//                   )}
//                 </div>
//               )}

//               {/* ══ Details (shown below OCR on same step) ══ */}
//               {showDetails && ocrData?.isVerified && (
//                 <div className={`${showOCR ? 'border-t mt-6 pt-6' : ''} space-y-4`}>
//                   {showOCR && (
//                     <p className="text-sm font-semibold text-gray-700">
//                       {isGoogleFlow ? 'Complete your profile' : 'Fill in your details below'}
//                     </p>
//                   )}

//                   {/* Phone — only shown in Google flow (regular flow has it in step 1) */}
//                   {isGoogleFlow && (
//                     <Input label="Phone Number" type="tel" name="phone" placeholder="98XXXXXXXX"
//                       value={formData.phone} onChange={handleChange} error={errors.phone}
//                       leftIcon={<PhoneIcon className="w-5 h-5" />} />
//                   )}

//                   {userType === 'user' && (
//                     <>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Date of Birth
//                           {ocrData.dateOfBirth?.year && (
//                             <span className="ml-2 text-xs text-green-600 font-normal">✓ Auto-filled from document</span>
//                           )}
//                         </label>
//                         <div className="grid grid-cols-3 gap-3">
//                           <Select options={days}   placeholder="Day"   name="dobDay"   value={formData.dobDay}   onChange={handleChange} />
//                           <Select options={months} placeholder="Month" name="dobMonth" value={formData.dobMonth} onChange={handleChange} />
//                           <Select options={years}  placeholder="Year"  name="dobYear"  value={formData.dobYear}  onChange={handleChange} />
//                         </div>
//                         {errors.dob && (
//                           <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
//                             <AlertCircleIcon className="w-4 h-4" />{errors.dob}
//                           </p>
//                         )}
//                       </div>
//                       <Select label="Blood Group" options={bloodGroups} placeholder="Select your blood group"
//                         name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} error={errors.bloodGroup} />
//                     </>
//                   )}

//                   <Select label="Province" options={provinces} placeholder="Select province"
//                     name="province" value={formData.province} onChange={handleChange} error={errors.province} />
//                   <Select label="District" options={availableDistricts}
//                     placeholder={formData.province ? '-- Select District --' : 'Select province first'}
//                     name="district" value={formData.district} onChange={handleChange}
//                     error={errors.district} disabled={!formData.province} />
//                   <Input label="Municipality / VDC / Rural Municipality" name="municipality"
//                     placeholder="Enter your municipality / VDC / ward"
//                     value={formData.municipality} onChange={handleChange} error={errors.municipality}
//                     leftIcon={<MapPinIcon className="w-5 h-5" />} />

//                   {submitError && (
//                     <div className="p-3 rounded-lg bg-red-50 border border-red-200">
//                       <p className="text-sm font-semibold text-red-700">Error</p>
//                       <p className="text-sm text-red-600 mt-1">{submitError}</p>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* ══ Password (regular only) ══ */}
//               {showPassword && (
//                 <div className="space-y-6">
//                   <Input label="Password" type="password" name="password" placeholder="Create a strong password"
//                     value={formData.password} onChange={handleChange} error={errors.password}
//                     leftIcon={<LockIcon className="w-5 h-5" />} hint="At least 8 characters" />
//                   <Input label="Confirm Password" type="password" name="confirmPassword" placeholder="Confirm your password"
//                     value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
//                     leftIcon={<LockIcon className="w-5 h-5" />} />
//                   <Alert variant="info">
//                     <div className="flex items-start gap-2">
//                       <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
//                       <div>
//                         <p className="font-medium">Almost there!</p>
//                         <p className="text-sm mt-1">We'll send a 6-digit OTP to verify your email.</p>
//                       </div>
//                     </div>
//                   </Alert>
//                   <label className="flex items-start gap-3 cursor-pointer">
//                     <input type="checkbox" className="w-4 h-4 mt-1 text-primary rounded border-gray-300 focus:ring-primary" required />
//                     <span className="text-sm text-gray-600">
//                       I agree to the{' '}
//                       <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
//                       {' '}and{' '}
//                       <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
//                     </span>
//                   </label>
//                 </div>
//               )}

//               {/* ══ OTP (regular only) ══ */}
//               {showOTP && (
//                 <div className="space-y-6">
//                   <div className="text-center">
//                     <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
//                       <MailIcon className="w-8 h-8 text-primary" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900">Verify Your Email</h3>
//                     <p className="text-sm text-gray-500 mt-2">
//                       We've sent a 6-digit code to<br />
//                       <span className="font-semibold text-gray-700">{formData.email}</span>
//                     </p>
//                   </div>
//                   {submitError && (
//                     <div className="p-4 rounded-lg bg-red-50 border border-red-200">
//                       <p className="text-sm font-semibold text-red-700">Registration Failed</p>
//                       <p className="text-sm text-red-600 mt-1">{submitError}</p>
//                     </div>
//                   )}
//                   {sendError && (
//                     <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2">
//                       <p className="text-sm font-semibold text-red-700">Could not send OTP</p>
//                       <p className="text-sm text-red-600">{sendError}</p>
//                       <button type="button" onClick={handleSendOTP} disabled={isLoading}
//                         className="text-sm text-red-700 font-medium underline disabled:opacity-50">Try again</button>
//                     </div>
//                   )}
//                   {isLoading && !otpVerified && (
//                     <p className="text-center text-sm text-gray-500 animate-pulse">Sending OTP…</p>
//                   )}
//                   {otpVerified ? (
//                     <Alert variant="success">
//                       <div className="flex items-center gap-2">
//                         <CheckCircleIcon className="w-5 h-5 text-green-500" />
//                         <p className="font-medium">Email verified! Creating your account…</p>
//                       </div>
//                     </Alert>
//                   ) : !sendError && !isLoading && (
//                     <>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter 6-digit OTP</label>
//                         <div className="flex gap-2 justify-center">
//                           {Array.from({ length: 6 }).map((_, i) => (
//                             <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
//                               value={otpInput[i] || ''}
//                               onChange={e => handleOtpBoxChange(e, i)}
//                               onKeyDown={e => handleOtpBoxKeyDown(e, i)}
//                               className={`w-11 h-12 text-center text-lg font-bold border-2 rounded-lg focus:outline-none focus:border-primary transition-colors ${otpError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
//                             />
//                           ))}
//                         </div>
//                         {otpError && (
//                           <p className="mt-2 text-sm text-red-600 text-center flex items-center justify-center gap-1">
//                             <AlertCircleIcon className="w-4 h-4" />{otpError}
//                           </p>
//                         )}
//                       </div>
//                       <Button type="button" className="w-full" onClick={handleVerifyOTP}
//                         disabled={otpInput.replace(/\s/g, '').length < 6 || isLoading}>
//                         Verify OTP
//                       </Button>
//                       <div className="text-center">
//                         <p className="text-sm text-gray-500">Didn't receive the code?</p>
//                         {resendCooldown > 0
//                           ? <p className="text-sm text-gray-400 mt-1">Resend in {resendCooldown}s</p>
//                           : <button type="button" onClick={handleSendOTP} disabled={isLoading}
//                               className="mt-1 text-sm text-primary font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-50">
//                               <RefreshCwIcon className="w-3 h-3" /> Resend OTP
//                             </button>
//                         }
//                       </div>
//                     </>
//                   )}
//                 </div>
//               )}

//               {/* ══ Navigation buttons ══ */}
//               <div className="flex gap-3 mt-8">
//                 {step > 1 && !(showOTP && otpVerified) && (
//                   <Button type="button" variant="outline" onClick={handleBack} className="flex-1">Back</Button>
//                 )}

//                 {/* Google flow */}
//                 {isGoogleFlow && step < totalSteps && (
//                   <Button type="button" onClick={handleNext} className="flex-1">Continue</Button>
//                 )}
//                 {isGoogleFlow && step === totalSteps && ocrData?.isVerified && (
//                   <Button type="button" onClick={handleNext} isLoading={isLoading} className="flex-1">
//                     Complete Registration
//                   </Button>
//                 )}

//                 {/* Regular flow */}
//                 {!isGoogleFlow && step === 1 && (
//                   <Button type="button" onClick={handleNext} className="flex-1">Continue</Button>
//                 )}
//                 {!isGoogleFlow && step === 2 && (
//                   <Button type="button" onClick={handleNext} className="flex-1">Continue</Button>
//                 )}
//                 {!isGoogleFlow && step === 3 && (
//                   <Button type="button" onClick={handleNext} isLoading={isLoading} className="flex-1">
//                     Continue &amp; Send OTP
//                   </Button>
//                 )}
//                 {!isGoogleFlow && step === 4 && otpVerified && (
//                   <Button type="submit" isLoading={isLoading} className="w-full">Create Account</Button>
//                 )}
//               </div>
//             </form>
//           </Card>

//           {/* Google sign-in button — only on step 1 of regular flow */}
//           {!isGoogleFlow && step === 1 && (
//             <Button variant="outline" fullWidth className="mb-3 mt-6"
//               onClick={() => { window.location.href = `${API}/api/auth/google`; }}>
//               <div className="flex items-center justify-center gap-2">
//                 <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
//                 <span>Continue with Google</span>
//               </div>
//             </Button>
//           )}

//           <p className="mt-6 text-center text-gray-600">
//             Already have an account?{' '}
//             <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
//           </p>
//         </div>
//       </main>
//     </div>
//   );
// }


import emailjs from '@emailjs/browser';
import React, { useState, Fragment, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulseIcon, UserIcon, BuildingIcon, MailIcon,
  LockIcon, PhoneIcon, MapPinIcon, CheckCircleIcon,
  AlertCircleIcon, RefreshCwIcon, LocateIcon,
} from 'lucide-react';
import { Button }   from '../components/ui/Button';
import { Input }    from '../components/ui/Input';
import { Select }   from '../components/ui/Select';
import { Card }     from '../components/ui/Card';
import { Alert }    from '../components/ui/Alert';
import { OCRVerification, OCRVerificationData } from '../components/features/OCRVerification';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type UserType = 'user' | 'hospital';

const API                 = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const EMAILJS_SERVICE_ID  = 'service_hfrba86';
const EMAILJS_TEMPLATE_ID = 'template_qpv3f4t';
const EMAILJS_PUBLIC_KEY  = 'jf7SKwUj0GbF3OxLD';

// ── Static data ───────────────────────────────────────────────────────────────
const bloodGroups = [
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
];
const provinces = [
  { value: 'koshi', label: 'Koshi Province' }, { value: 'madhesh', label: 'Madhesh Province' },
  { value: 'bagmati', label: 'Bagmati Province' }, { value: 'gandaki', label: 'Gandaki Province' },
  { value: 'lumbini', label: 'Lumbini Province' }, { value: 'karnali', label: 'Karnali Province' },
  { value: 'sudurpashchim', label: 'Sudurpashchim Province' },
];
const districtsByProvince: Record<string, { value: string; label: string }[]> = {
  koshi: [
    { value: 'taplejung', label: 'Taplejung' }, { value: 'panchthar', label: 'Panchthar' },
    { value: 'illam', label: 'Ilam' }, { value: 'jhapa', label: 'Jhapa' },
    { value: 'morang', label: 'Morang' }, { value: 'sunsari', label: 'Sunsari' },
    { value: 'dhankuta', label: 'Dhankuta' }, { value: 'terhathum', label: 'Terhathum' },
    { value: 'sankhuwasabha', label: 'Sankhuwasabha' }, { value: 'bhojpur', label: 'Bhojpur' },
    { value: 'solukhumbu', label: 'Solukhumbu' }, { value: 'okhaldhunga', label: 'Okhaldhunga' },
    { value: 'khotang', label: 'Khotang' }, { value: 'udayapur', label: 'Udayapur' },
  ],
  madhesh: [
    { value: 'saptari', label: 'Saptari' }, { value: 'sarlahi', label: 'Sarlahi' },
    { value: 'dhanusha', label: 'Dhanusha' }, { value: 'mahottari', label: 'Mahottari' },
    { value: 'siraha', label: 'Siraha' }, { value: 'rautahat', label: 'Rautahat' },
    { value: 'bara', label: 'Bara' }, { value: 'parsa', label: 'Parsa' },
  ],
  bagmati: [
    { value: 'kathmandu', label: 'Kathmandu' }, { value: 'lalitpur', label: 'Lalitpur' },
    { value: 'bhaktapur', label: 'Bhaktapur' }, { value: 'kavrepalanchok', label: 'Kavrepalanchok' },
    { value: 'sindhupalchok', label: 'Sindhupalchok' }, { value: 'nuwakot', label: 'Nuwakot' },
    { value: 'dhading', label: 'Dhading' }, { value: 'makwanpur', label: 'Makwanpur' },
    { value: 'chitwan', label: 'Chitwan' }, { value: 'ramechhap', label: 'Ramechhap' },
    { value: 'dolakha', label: 'Dolakha' }, { value: 'sindhuli', label: 'Sindhuli' },
    { value: 'rasuwa', label: 'Rasuwa' },
  ],
  gandaki: [
    { value: 'kaski', label: 'Kaski' }, { value: 'tanahun', label: 'Tanahun' },
    { value: 'syangja', label: 'Syangja' }, { value: 'lamjung', label: 'Lamjung' },
    { value: 'gorkha', label: 'Gorkha' }, { value: 'manang', label: 'Manang' },
    { value: 'mustang', label: 'Mustang' }, { value: 'myagdi', label: 'Myagdi' },
    { value: 'baglung', label: 'Baglung' }, { value: 'parbat', label: 'Parbat' },
    { value: 'nawalpur', label: 'Nawalpur' },
  ],
  lumbini: [
    { value: 'rupandehi', label: 'Rupandehi' }, { value: 'kapilvastu', label: 'Kapilvastu' },
    { value: 'arghakhanchi', label: 'Arghakhanchi' }, { value: 'gulmi', label: 'Gulmi' },
    { value: 'palpa', label: 'Palpa' }, { value: 'dang', label: 'Dang' },
    { value: 'pyuthan', label: 'Pyuthan' }, { value: 'rolpa', label: 'Rolpa' },
    { value: 'banke', label: 'Banke' }, { value: 'bardiya', label: 'Bardiya' },
  ],
  karnali: [
    { value: 'humla', label: 'Humla' }, { value: 'mugu', label: 'Mugu' },
    { value: 'dolpa', label: 'Dolpa' }, { value: 'jumla', label: 'Jumla' },
    { value: 'kalikot', label: 'Kalikot' }, { value: 'jajarkot', label: 'Jajarkot' },
    { value: 'surkhet', label: 'Surkhet' }, { value: 'salyan', label: 'Salyan' },
    { value: 'dailekh', label: 'Dailekh' },
  ],
  sudurpashchim: [
    { value: 'kailali', label: 'Kailali' }, { value: 'kanchanpur', label: 'Kanchanpur' },
    { value: 'doti', label: 'Doti' }, { value: 'dadeldhura', label: 'Dadeldhura' },
    { value: 'bajhang', label: 'Bajhang' }, { value: 'bajura', label: 'Bajura' },
    { value: 'baitadi', label: 'Baitadi' }, { value: 'darchula', label: 'Darchula' },
  ],
};
const days   = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const months = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];
const years = Array.from({ length: 50 }, (_, i) => {
  const year = new Date().getFullYear() - 18 - i;
  return { value: String(year), label: String(year) };
});

const userTypeOptions = [
  { type: 'user' as const, icon: UserIcon, label: 'Blood Donor', description: 'Register to donate blood and save lives' },
  { type: 'hospital' as const, icon: BuildingIcon, label: 'Hospital', description: 'Register your hospital or blood bank' },
];

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
async function sendOTPEmail(email: string, otp: string) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  const r = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { user_email: email, otp }, EMAILJS_PUBLIC_KEY);
  if (r.status !== 200) throw new Error(`EmailJS error ${r.status}: ${r.text}`);
}

// ── Step labels ───────────────────────────────────────────────────────────────
const REGULAR_STEPS = ['Basic Info', 'Document', 'Details', 'Password', 'Verify Email'];
const GOOGLE_STEPS  = ['Document', 'Details'];

// ── Location picker mini-map ──────────────────────────────────────────────────
interface TempLocation { lat: number; lng: number; label: string; }

function LocationPickerMap({ onSelect, initial }: {
  onSelect: (loc: TempLocation) => void;
  initial?: TempLocation | null;
}) {
  const mapRef        = useRef<HTMLDivElement>(null);
  const mapInst       = useRef<L.Map | null>(null);
  const markerRef     = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [label, setLabel]       = useState(initial?.label || '');

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const center: [number, number] = initial ? [initial.lat, initial.lng] : [27.7172, 85.3240];
    const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    mapInst.current = map;

    const yellowIcon = L.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;border-radius:50%;background:#EAB308;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9],
    });

    if (initial) {
      markerRef.current = L.marker([initial.lat, initial.lng], { icon: yellowIcon, draggable: true }).addTo(map);
      markerRef.current.on('dragend', (e) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        onSelect({ lat, lng, label });
      });
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: yellowIcon, draggable: true }).addTo(map);
        markerRef.current.on('dragend', (ev) => {
          const pos = (ev.target as L.Marker).getLatLng();
          onSelect({ lat: pos.lat, lng: pos.lng, label });
        });
      }
      onSelect({ lat, lng, label });
    });

    return () => { map.remove(); mapInst.current = null; markerRef.current = null; };
  }, []); // eslint-disable-line

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocating(false);
        const map = mapInst.current;
        if (!map) return;
        map.setView([lat, lng], 16, { animate: true });

        const yellowIcon = L.divIcon({
          className: '',
          html: `<div style="width:18px;height:18px;border-radius:50%;background:#EAB308;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>`,
          iconSize: [18, 18], iconAnchor: [9, 9],
        });

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: yellowIcon, draggable: true }).addTo(map);
          markerRef.current.on('dragend', (ev) => {
            const p = (ev.target as L.Marker).getLatLng();
            onSelect({ lat: p.lat, lng: p.lng, label });
          });
        }
        onSelect({ lat, lng, label });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
    if (markerRef.current) {
      const pos = markerRef.current.getLatLng();
      onSelect({ lat: pos.lat, lng: pos.lng, label: e.target.value });
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 260, position: 'relative', zIndex: 0 }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Label this location (e.g. Home, Work, Kathmandu)"
          value={label}
          onChange={handleLabelChange}
          leftIcon={<MapPinIcon className="w-4 h-4" />}
        />
        <Button type="button" variant="outline" onClick={useMyLocation} isLoading={locating}
          className="whitespace-nowrap flex-shrink-0">
          <LocateIcon className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <MapPinIcon className="w-3 h-3" />
        Click anywhere on the map to place your pin, or drag it to adjust. This sets your approximate location shown to other users.
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SignUpPage() {
  const navigate = useNavigate();

  // Google pending user
  const [googlePending, setGooglePending] = useState<{
    token: string;
    user: { id: string; name: string; email: string; avatar: string };
  } | null>(null);

  useEffect(() => {
    if (localStorage.getItem('lf_user')) { navigate('/', { replace: true }); return; }
    const raw = sessionStorage.getItem('google_pending');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        setGooglePending(data);
        const [firstName, ...lastParts] = (data.user.name || '').split(' ');
        setFormData(prev => ({
          ...prev,
          firstName: firstName || '',
          lastName:  lastParts.join(' ') || '',
          email:     data.user.email || '',
        }));
      } catch { /* ignore */ }
    }
  }, [navigate]);

  const isGoogleFlow = !!googlePending;
  const stepLabels   = isGoogleFlow ? GOOGLE_STEPS : REGULAR_STEPS;
  const totalSteps   = stepLabels.length;

  // ── State ─────────────────────────────────────────────────────────────────
  const [userType,       setUserType]       = useState<UserType>('user');
  const [isLoading,      setIsLoading]      = useState(false);
  const [step,           setStep]           = useState(1);
  const [ocrData,        setOcrData]        = useState<OCRVerificationData | null>(null);
  const [submitError,    setSubmitError]    = useState('');
  const [tempLocation,   setTempLocation]   = useState<TempLocation | null>(null);

  const [generatedOTP,   setGeneratedOTP]   = useState('');
  const [otpInput,       setOtpInput]       = useState('');
  const [otpError,       setOtpError]       = useState('');
  const [otpVerified,    setOtpVerified]    = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendError,      setSendError]      = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dobDay: '', dobMonth: '', dobYear: '',
    bloodGroup: '', province: '', district: '', municipality: '',
    password: '', confirmPassword: '',
    hospitalName: '', hospitalRegNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableDistricts = formData.province ? (districtsByProvince[formData.province] || []) : [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'province') {
      setFormData(prev => ({ ...prev, province: value, district: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOCRComplete = (data: OCRVerificationData) => {
    setOcrData(data);
    if (userType === 'user') {
      // ── KEY CHANGE: always use the citizenship name as the display name ──
      // This name will be saved to DB and shown in UI
      if (data.fullName) {
        const [firstName, ...lastParts] = data.fullName.split(' ');
        setFormData(prev => ({
          ...prev,
          // For Google users, we still override with the citizenship name
          firstName: firstName || prev.firstName,
          lastName:  lastParts.join(' ') || prev.lastName,
          dobYear:   data.dateOfBirth?.year  || prev.dobYear,
          dobMonth:  data.dateOfBirth?.month || prev.dobMonth,
          dobDay:    data.dateOfBirth?.day   || prev.dobDay,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          dobYear:  data.dateOfBirth?.year  || prev.dobYear,
          dobMonth: data.dateOfBirth?.month || prev.dobMonth,
          dobDay:   data.dateOfBirth?.day   || prev.dobDay,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        hospitalName:      data.fullName,
        hospitalRegNumber: data.documentNumber,
      }));
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (userType === 'user') {
      if (!formData.firstName) e.firstName = 'First name is required';
      if (!formData.lastName)  e.lastName  = 'Last name is required';
    } else {
      if (!formData.hospitalName)      e.hospitalName      = 'Hospital name is required';
      if (!formData.hospitalRegNumber) e.hospitalRegNumber = 'Registration number is required';
    }
    if (!formData.email)                            e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Please enter a valid email';
    if (!formData.phone)                            e.phone = 'Phone number is required';
    else if (!/^[0-9]{10}$/.test(formData.phone))  e.phone = 'Please enter a valid 10-digit phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateOCR = () => {
    const e: Record<string, string> = {};
    if (!ocrData?.isVerified) e.ocr = 'Document verification is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (userType === 'user') {
      if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) e.dob = 'Date of birth is required';
      if (!formData.bloodGroup) e.bloodGroup = 'Blood group is required';
    }
    if (isGoogleFlow) {
      if (!formData.phone)                           e.phone = 'Phone number is required';
      else if (!/^[0-9]{10}$/.test(formData.phone)) e.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.province)     e.province     = 'Province is required';
    if (!formData.district)     e.district     = 'District is required';
    if (!formData.municipality) e.municipality = 'Municipality is required';
    if (!tempLocation)          e.tempLocation = 'Please pin your location on the map';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePassword = () => {
    const e: Record<string, string> = {};
    if (!formData.password)                e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── OTP ───────────────────────────────────────────────────────────────────
  const startCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
    }, 1000);
  };
  const handleSendOTP = async () => {
    const otp = generateOTP();
    setGeneratedOTP(otp); setOtpInput(''); setOtpError(''); setSendError('');
    setIsLoading(true);
    try { await sendOTPEmail(formData.email, otp); startCooldown(); }
    catch (err: any) { setSendError(err?.text ?? err?.message ?? JSON.stringify(err)); }
    finally { setIsLoading(false); }
  };
  const handleVerifyOTP = () => {
    if (otpInput.trim() === generatedOTP) { setOtpVerified(true); setOtpError(''); }
    else setOtpError('Invalid OTP. Please check and try again.');
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  // Regular: 1=BasicInfo 2=OCR 3=Details 4=Password 5=OTP
  // Google:  1=OCR       2=Details+Submit
  const handleNext = async () => {
    setSubmitError('');
    if (isGoogleFlow) {
      if (step === 1 && validateOCR()) setStep(2);
      else if (step === 2 && validateDetails()) await handleGoogleSubmit();
    } else {
      if      (step === 1 && validateStep1())  setStep(2);
      else if (step === 2 && validateOCR())    setStep(3);
      else if (step === 3 && validateDetails()) setStep(4);
      else if (step === 4 && validatePassword()) { setStep(5); await handleSendOTP(); }
    }
  };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  // ── Submit: Google ────────────────────────────────────────────────────────
  const handleGoogleSubmit = async () => {
    if (!googlePending) return;
    setIsLoading(true); setSubmitError('');
    try {
      const rawPhoto      = ocrData?.documentPhotoBase64 ?? '';
      const documentPhoto = rawPhoto.length <= 2_000_000 ? rawPhoto : '';
      // Citizenship name overrides Google display name
      const citizenshipName = `${formData.firstName} ${formData.lastName}`.trim();

      const res = await fetch(`${API}/api/auth/register-google`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId:     googlePending.user.id,
          // Use citizenship name from OCR as the canonical name
          name:         citizenshipName || googlePending.user.name,
          email:        googlePending.user.email,
          // Google profile pic as initial avatar; document photo overrides it
          avatar:       documentPhoto ? documentPhoto : googlePending.user.avatar,
          phone:        formData.phone,
          bloodGroup:   formData.bloodGroup,
          province:     formData.province,
          district:     formData.district,
          municipality: formData.municipality,
          dobDay:       formData.dobDay,
          dobMonth:     formData.dobMonth,
          dobYear:      formData.dobYear,
          documentPhoto,
          tempLocation,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || 'Registration failed.'); return; }
      sessionStorage.removeItem('google_pending');
      localStorage.setItem('lf_token', data.token);
      localStorage.setItem('lf_user',  JSON.stringify(data.user));
      navigate('/');
    } catch { setSubmitError('Could not connect to server. Please try again.'); }
    finally { setIsLoading(false); }
  };

  // ── Submit: regular ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) { setOtpError('Please verify the OTP first.'); return; }
    setIsLoading(true); setSubmitError('');
    try {
      const fullName      = userType === 'user'
        ? `${formData.firstName} ${formData.lastName}`.trim()
        : formData.hospitalName;
      const rawPhoto      = ocrData?.documentPhotoBase64 ?? '';
      const documentPhoto = rawPhoto.length <= 2_000_000 ? rawPhoto : '';

      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName, email: formData.email, password: formData.password,
          role: userType, phone: formData.phone,
          bloodGroup: formData.bloodGroup, province: formData.province,
          district: formData.district, municipality: formData.municipality,
          dobDay: formData.dobDay, dobMonth: formData.dobMonth, dobYear: formData.dobYear,
          hospitalName: formData.hospitalName, hospitalRegNumber: formData.hospitalRegNumber,
          documentPhoto,
          tempLocation,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || `Registration failed (${res.status}).`); return; }
      localStorage.setItem('lf_token', data.token);
      localStorage.setItem('lf_user',  JSON.stringify(data.user));
      navigate('/');
    } catch { setSubmitError('Could not connect to server. Please try again.'); }
    finally { setIsLoading(false); }
  };

  // ── OTP box ───────────────────────────────────────────────────────────────
  const handleOtpBoxChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const val = e.target.value.replace(/\D/, '').slice(0, 1);
    const arr = Array.from({ length: 6 }, (_, idx) => otpInput[idx] ?? '');
    arr[i] = val; setOtpInput(arr.join('')); setOtpError('');
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };
  const handleOtpBoxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = Array.from({ length: 6 }, (_, idx) => otpInput[idx] ?? '');
      if (arr[i]) { arr[i] = ''; setOtpInput(arr.join('')); }
      else if (i > 0) { arr[i - 1] = ''; setOtpInput(arr.join('')); document.getElementById(`otp-${i - 1}`)?.focus(); }
    }
  };

  // ── Step visibility ───────────────────────────────────────────────────────
  // Regular: 1=BasicInfo 2=OCR 3=Details 4=Password 5=OTP
  // Google:  1=OCR       2=Details
  const showBasicInfo = !isGoogleFlow && step === 1;
  const showOCR       = isGoogleFlow ? step === 1 : step === 2;
  const showDetails   = isGoogleFlow ? step === 2 : step === 3;
  const showPassword  = !isGoogleFlow && step === 4;
  const showOTP       = !isGoogleFlow && step === 5;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <HeartPulseIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-secondary">
              Life<span className="text-primary">Flow</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">Create Your Account</h1>
            <p className="mt-2 text-gray-600">
              {isGoogleFlow
                ? `Welcome, ${googlePending?.user.name}! Verify your document to continue.`
                : "Join Nepal's largest blood donation network"}
            </p>
          </div>

          {/* Google banner */}
          {isGoogleFlow && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
              {googlePending?.user.avatar && (
                <img src={googlePending.user.avatar} alt="avatar"
                  className="w-10 h-10 rounded-full border border-blue-200" />
              )}
              <div>
                <p className="text-sm font-semibold text-blue-800">{googlePending?.user.name}</p>
                <p className="text-xs text-blue-600">{googlePending?.user.email}</p>
              </div>
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                Google Account
              </span>
            </div>
          )}

          {/* OCR name banner — shown after OCR completes to confirm name */}
          {ocrData?.isVerified && ocrData.fullName && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Identity verified as: <span className="text-green-700">{ocrData.fullName}</span>
                </p>
                <p className="text-xs text-green-600">This name will be used as your display name</p>
              </div>
            </div>
          )}

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-1 mb-8">
            {stepLabels.map((label, idx) => {
              const s = idx + 1;
              return (
                <Fragment key={s}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                      step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step > s ? <CheckCircleIcon className="w-5 h-5" /> : s}
                    </div>
                    <span className="text-xs text-gray-500 hidden sm:block">{label}</span>
                  </div>
                  {s < totalSteps && (
                    <div className={`w-10 h-1 rounded mb-4 transition-colors ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />
                  )}
                </Fragment>
              );
            })}
          </div>

          <Card padding="lg">
            <form onSubmit={handleSubmit}>

              {/* ══ Basic Info ══ */}
              {showBasicInfo && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">I want to register as</label>
                    <div className="grid grid-cols-2 gap-3">
                      {userTypeOptions.map(opt => (
                        <button key={opt.type} type="button" onClick={() => setUserType(opt.type)}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            userType === opt.type ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <opt.icon className={`w-6 h-6 mx-auto mb-2 ${userType === opt.type ? 'text-primary' : 'text-gray-400'}`} />
                          <p className={`text-sm font-medium ${userType === opt.type ? 'text-primary' : 'text-gray-700'}`}>{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {userType === 'user' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="First Name" name="firstName" placeholder="Enter first name"
                        value={formData.firstName} onChange={handleChange} error={errors.firstName} />
                      <Input label="Last Name" name="lastName" placeholder="Enter last name"
                        value={formData.lastName} onChange={handleChange} error={errors.lastName} />
                    </div>
                  ) : (
                    <>
                      <Input label="Hospital Name" name="hospitalName" placeholder="Enter hospital name"
                        value={formData.hospitalName} onChange={handleChange} error={errors.hospitalName}
                        leftIcon={<BuildingIcon className="w-5 h-5" />} />
                      <Input label="Registration Number" name="hospitalRegNumber" placeholder="Enter registration number"
                        value={formData.hospitalRegNumber} onChange={handleChange} error={errors.hospitalRegNumber} />
                    </>
                  )}
                  <Input label="Email Address" type="email" name="email" placeholder="Enter your email"
                    value={formData.email} onChange={handleChange} error={errors.email}
                    leftIcon={<MailIcon className="w-5 h-5" />} />
                  <Input label="Phone Number" type="tel" name="phone" placeholder="98XXXXXXXX"
                    value={formData.phone} onChange={handleChange} error={errors.phone}
                    leftIcon={<PhoneIcon className="w-5 h-5" />} />
                </div>
              )}

              {/* ══ OCR ══ */}
              {showOCR && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Document Verification</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Your citizenship name will be used as your display name on the platform.
                    </p>
                  </div>
                  <OCRVerification
                    userType={userType}
                    onVerificationComplete={handleOCRComplete}
                    expectedAdminName="Sushanta Marahatta"
                  />
                  {errors.ocr && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircleIcon className="w-4 h-4" />{errors.ocr}
                    </p>
                  )}
                </div>
              )}

              {/* ══ Details ══ */}
              {showDetails && ocrData?.isVerified && (
                <div className={`${showOCR ? 'border-t mt-6 pt-6' : ''} space-y-4`}>
                  {showOCR && (
                    <p className="text-sm font-semibold text-gray-700">
                      {isGoogleFlow ? 'Complete your profile' : 'Fill in your details'}
                    </p>
                  )}

                  {/* Phone — only in Google flow (regular already has it in step 1) */}
                  {isGoogleFlow && (
                    <Input label="Phone Number" type="tel" name="phone" placeholder="98XXXXXXXX"
                      value={formData.phone} onChange={handleChange} error={errors.phone}
                      leftIcon={<PhoneIcon className="w-5 h-5" />} />
                  )}

                  {userType === 'user' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                          {ocrData.dateOfBirth?.year && (
                            <span className="ml-2 text-xs text-green-600">✓ Auto-filled from document</span>
                          )}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <Select options={days}   placeholder="Day"   name="dobDay"   value={formData.dobDay}   onChange={handleChange} />
                          <Select options={months} placeholder="Month" name="dobMonth" value={formData.dobMonth} onChange={handleChange} />
                          <Select options={years}  placeholder="Year"  name="dobYear"  value={formData.dobYear}  onChange={handleChange} />
                        </div>
                        {errors.dob && (
                          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircleIcon className="w-4 h-4" />{errors.dob}
                          </p>
                        )}
                      </div>
                      <Select label="Blood Group" options={bloodGroups} placeholder="Select your blood group"
                        name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} error={errors.bloodGroup} />
                    </>
                  )}

                  <Select label="Province" options={provinces} placeholder="Select province"
                    name="province" value={formData.province} onChange={handleChange} error={errors.province} />
                  <Select label="District" options={availableDistricts}
                    placeholder={formData.province ? '-- Select District --' : 'Select province first'}
                    name="district" value={formData.district} onChange={handleChange}
                    error={errors.district} disabled={!formData.province} />
                  <Input label="Municipality / VDC / Rural Municipality" name="municipality"
                    placeholder="Enter your municipality / VDC / ward"
                    value={formData.municipality} onChange={handleChange} error={errors.municipality}
                    leftIcon={<MapPinIcon className="w-5 h-5" />} />

                  {/* ── Temporary location picker ── */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pin Your Temporary Location
                      <span className="ml-1 text-xs text-gray-400 font-normal">(shown on the search map)</span>
                    </label>
                    <LocationPickerMap onSelect={setTempLocation} initial={tempLocation} />
                    {tempLocation && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3" />
                        Location pinned: {tempLocation.label || `${tempLocation.lat.toFixed(4)}, ${tempLocation.lng.toFixed(4)}`}
                      </p>
                    )}
                    {errors.tempLocation && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />{errors.tempLocation}
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm font-semibold text-red-700">Error</p>
                      <p className="text-sm text-red-600 mt-1">{submitError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ══ Password ══ */}
              {showPassword && (
                <div className="space-y-6">
                  <Input label="Password" type="password" name="password" placeholder="Create a strong password"
                    value={formData.password} onChange={handleChange} error={errors.password}
                    leftIcon={<LockIcon className="w-5 h-5" />} hint="At least 8 characters" />
                  <Input label="Confirm Password" type="password" name="confirmPassword" placeholder="Confirm your password"
                    value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
                    leftIcon={<LockIcon className="w-5 h-5" />} />
                  <Alert variant="info">
                    <div className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Almost there!</p>
                        <p className="text-sm mt-1">We'll send a 6-digit OTP to verify your email.</p>
                      </div>
                    </div>
                  </Alert>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 mt-1 text-primary rounded border-gray-300 focus:ring-primary" required />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </span>
                  </label>
                </div>
              )}

              {/* ══ OTP ══ */}
              {showOTP && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MailIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Verify Your Email</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      We've sent a 6-digit code to<br />
                      <span className="font-semibold text-gray-700">{formData.email}</span>
                    </p>
                  </div>
                  {submitError && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm font-semibold text-red-700">Registration Failed</p>
                      <p className="text-sm text-red-600 mt-1">{submitError}</p>
                    </div>
                  )}
                  {sendError && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2">
                      <p className="text-sm font-semibold text-red-700">Could not send OTP</p>
                      <p className="text-sm text-red-600">{sendError}</p>
                      <button type="button" onClick={handleSendOTP} disabled={isLoading}
                        className="text-sm text-red-700 font-medium underline disabled:opacity-50">Try again</button>
                    </div>
                  )}
                  {isLoading && !otpVerified && <p className="text-center text-sm text-gray-500 animate-pulse">Sending OTP…</p>}
                  {otpVerified ? (
                    <Alert variant="success">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <p className="font-medium">Email verified! Creating your account…</p>
                      </div>
                    </Alert>
                  ) : !sendError && !isLoading && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter 6-digit OTP</label>
                        <div className="flex gap-2 justify-center">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                              value={otpInput[i] || ''}
                              onChange={e => handleOtpBoxChange(e, i)}
                              onKeyDown={e => handleOtpBoxKeyDown(e, i)}
                              className={`w-11 h-12 text-center text-lg font-bold border-2 rounded-lg focus:outline-none focus:border-primary transition-colors ${otpError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                            />
                          ))}
                        </div>
                        {otpError && (
                          <p className="mt-2 text-sm text-red-600 text-center flex items-center justify-center gap-1">
                            <AlertCircleIcon className="w-4 h-4" />{otpError}
                          </p>
                        )}
                      </div>
                      <Button type="button" className="w-full" onClick={handleVerifyOTP}
                        disabled={otpInput.replace(/\s/g, '').length < 6 || isLoading}>
                        Verify OTP
                      </Button>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Didn't receive the code?</p>
                        {resendCooldown > 0
                          ? <p className="text-sm text-gray-400 mt-1">Resend in {resendCooldown}s</p>
                          : <button type="button" onClick={handleSendOTP} disabled={isLoading}
                              className="mt-1 text-sm text-primary font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-50">
                              <RefreshCwIcon className="w-3 h-3" /> Resend OTP
                            </button>
                        }
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ══ Navigation ══ */}
              <div className="flex gap-3 mt-8">
                {step > 1 && !(showOTP && otpVerified) && (
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                )}

                {/* Google flow */}
                {isGoogleFlow && step < totalSteps && (
                  <Button type="button" onClick={handleNext} className="flex-1">Continue</Button>
                )}
                {isGoogleFlow && step === totalSteps && ocrData?.isVerified && (
                  <Button type="button" onClick={handleNext} isLoading={isLoading} className="flex-1">
                    Complete Registration
                  </Button>
                )}

                {/* Regular flow */}
                {!isGoogleFlow && step === 1 && (
                  <Button type="button" onClick={handleNext} className="flex-1">Continue</Button>
                )}
                {!isGoogleFlow && step === 2 && (
                  <Button type="button" onClick={handleNext} className="flex-1">Continue</Button>
                )}
                {!isGoogleFlow && step === 3 && (
                  <Button type="button" onClick={handleNext} className="flex-1">Continue</Button>
                )}
                {!isGoogleFlow && step === 4 && (
                  <Button type="button" onClick={handleNext} isLoading={isLoading} className="flex-1">
                    Continue &amp; Send OTP
                  </Button>
                )}
                {!isGoogleFlow && step === 5 && otpVerified && (
                  <Button type="submit" isLoading={isLoading} className="w-full">Create Account</Button>
                )}
              </div>
            </form>
          </Card>

          {!isGoogleFlow && step === 1 && (
            <Button variant="outline" fullWidth className="mb-3 mt-6"
              onClick={() => { window.location.href = `${API}/api/auth/google`; }}>
              <div className="flex items-center justify-center gap-2">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </div>
            </Button>
          )}

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </main>
    </div>
  );
}