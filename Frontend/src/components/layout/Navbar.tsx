// // import { useState, useEffect } from 'react';
// // import { Link, useLocation, useNavigate } from 'react-router-dom';
// // import {
// //   MenuIcon, XIcon, HeartPulseIcon, SearchIcon, UserIcon,
// //   PhoneIcon, ChevronDownIcon, LogOutIcon, LayoutDashboardIcon,
// //   HeartIcon, DropletIcon,
// // } from 'lucide-react';
// // import { Button } from '../ui/Button';

// // interface StoredUser {
// //   id: string;
// //   name: string;
// //   email: string;
// //   role: 'user' | 'hospital' | 'admin';
// //   bloodGroup?: string;
// //   hospitalName?: string;
// // }

// // export function Navbar() {
// //   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
// //   const [isUserMenuOpen,   setIsUserMenuOpen]   = useState(false);
// //   const [currentUser,      setCurrentUser]      = useState<StoredUser | null>(null);
// //   const location = useLocation();
// //   const navigate = useNavigate();

// //   // ── Read session from localStorage on every mount/route change ──────────────
// //   useEffect(() => {
// //     try {
// //       const raw = localStorage.getItem('lf_user');
// //       if (raw) {
// //         setCurrentUser(JSON.parse(raw));
// //       } else {
// //         setCurrentUser(null);
// //       }
// //     } catch {
// //       setCurrentUser(null);
// //     }
// //   }, [location.pathname]); // re-check on every page navigation

// //   // ── Logout ──────────────────────────────────────────────────────────────────
// //   const handleLogout = () => {
// //     localStorage.removeItem('lf_token');
// //     localStorage.removeItem('lf_user');
// //     setCurrentUser(null);
// //     setIsUserMenuOpen(false);
// //     setIsMobileMenuOpen(false);
// //     navigate('/');
// //   };

// //   // ── Derived helpers ──────────────────────────────────────────────────────────
// //   const isLoggedIn = !!currentUser;

// //   const displayName = currentUser
// //     ? (currentUser.role === 'hospital'
// //         ? (currentUser.hospitalName || currentUser.name)
// //         : currentUser.name)
// //     : '';

// //   const roleLabel = currentUser?.role === 'hospital' ? 'Hospital' : currentUser?.role === 'admin' ? 'Admin' : 'Donor';

// //   const getDashboardLink = () => {
// //     switch (currentUser?.role) {
// //       case 'hospital': return '/hospital/dashboard';
// //       case 'admin':    return '/admin/dashboard';
// //       default:         return '/dashboard';
// //     }
// //   };

// //   const navLinks = [
// //     { href: '/',       label: 'Home'       },
// //     { href: '/search', label: 'Find Blood' },
// //     { href: '/contact', label: 'Contact'   },
// //     { href: '/faq',    label: 'FAQs'       },
// //   ];

// //   return (
// //     <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
// //       {/* Emergency Hotline Bar */}
// //       <div className="bg-primary text-white text-sm py-1.5">
// //         <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
// //           <PhoneIcon className="w-4 h-4" aria-hidden="true" />
// //           <span>
// //             Emergency Hotline:{' '}
// //             <a href="tel:1660-01-66666" className="font-semibold hover:underline">
// //               1660-01-66666
// //             </a>
// //           </span>
// //         </div>
// //       </div>

// //       <nav className="max-w-7xl mx-auto px-4" aria-label="Main navigation">
// //         <div className="flex items-center justify-between h-16">
// //           {/* Logo */}
// //           <Link to="/" className="flex items-center gap-2 group" aria-label="LifeFlow Home">
// //             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
// //               <HeartPulseIcon className="w-6 h-6 text-white" />
// //             </div>
// //             <span className="font-heading font-bold text-xl text-secondary">
// //               Life<span className="text-primary">Flow</span>
// //             </span>
// //           </Link>

// //           {/* Desktop Navigation */}
// //           <div className="hidden md:flex items-center gap-1">
// //             {navLinks.map(link => (
// //               <Link
// //                 key={link.href}
// //                 to={link.href}
// //                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
// //                   location.pathname === link.href
// //                     ? 'text-primary bg-primary/5'
// //                     : 'text-gray-600 hover:text-primary hover:bg-gray-50'
// //                 }`}
// //               >
// //                 {link.label}
// //               </Link>
// //             ))}
// //           </div>

// //           {/* Desktop Actions */}
// //           <div className="hidden md:flex items-center gap-3">
// //             <Link to="/search">
// //               <Button variant="ghost" size="sm" leftIcon={<SearchIcon className="w-4 h-4" />}>
// //                 Search
// //               </Button>
// //             </Link>

// //             {/* Donate Button */}
// //             <Link to="/donate">
// //               <Button
// //                 size="sm"
// //                 className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0 shadow-md shadow-red-500/30"
// //                 leftIcon={<HeartIcon className="w-4 h-4 fill-current" />}
// //               >
// //                 Donate
// //               </Button>
// //             </Link>

// //             {isLoggedIn ? (
// //               <div className="relative">
// //                 <button
// //                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
// //                   className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
// //                   aria-expanded={isUserMenuOpen}
// //                   aria-haspopup="true"
// //                 >
// //                   {/* User Avatar */}
// //                   <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
// //                     <UserIcon className="w-4 h-4 text-primary" />
// //                   </div>

// //                   {/* User Info */}
// //                   <div className="text-left">
// //                     <p className="text-sm font-semibold text-gray-800 leading-none">{displayName}</p>
// //                     <div className="flex items-center gap-1.5 mt-0.5">
// //                       {currentUser?.bloodGroup && currentUser.role === 'user' && (
// //                         <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
// //                           <DropletIcon className="w-3 h-3" />
// //                           {currentUser.bloodGroup}
// //                         </span>
// //                       )}
// //                       <span className="text-xs text-gray-500">{roleLabel}</span>
// //                     </div>
// //                   </div>

// //                   <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
// //                 </button>

// //                 {isUserMenuOpen && (
// //                   <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-slide-in">
// //                     {/* User details header */}
// //                     <div className="px-4 py-2 border-b border-gray-100 mb-1">
// //                       <p className="text-sm font-semibold text-gray-800">{displayName}</p>
// //                       <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
// //                       <div className="flex items-center gap-2 mt-1">
// //                         {currentUser?.bloodGroup && currentUser.role === 'user' && (
// //                           <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
// //                             <DropletIcon className="w-3 h-3" />
// //                             {currentUser.bloodGroup}
// //                           </span>
// //                         )}
// //                         <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded capitalize">
// //                           {roleLabel}
// //                         </span>
// //                       </div>
// //                     </div>

// //                     <Link
// //                       to={getDashboardLink()}
// //                       className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
// //                       onClick={() => setIsUserMenuOpen(false)}
// //                     >
// //                       <LayoutDashboardIcon className="w-4 h-4" />
// //                       Dashboard
// //                     </Link>

// //                     <hr className="my-2 border-gray-100" />

// //                     <button
// //                       className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 w-full hover:bg-red-50 transition-colors"
// //                       onClick={handleLogout}
// //                     >
// //                       <LogOutIcon className="w-4 h-4" />
// //                       Sign Out
// //                     </button>
// //                   </div>
// //                 )}
// //               </div>
// //             ) : (
// //               <>
// //                 <Link to="/login">
// //                   <Button variant="ghost" size="sm">Sign In</Button>
// //                 </Link>
// //                 <Link to="/signup">
// //                   <Button variant="primary" size="sm">Become a Donor</Button>
// //                 </Link>
// //               </>
// //             )}
// //           </div>

// //           {/* Mobile Menu Button */}
// //           <button
// //             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
// //             className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
// //             aria-expanded={isMobileMenuOpen}
// //             aria-label="Toggle menu"
// //           >
// //             {isMobileMenuOpen ? <XIcon className="w-6 h-6 text-gray-600" /> : <MenuIcon className="w-6 h-6 text-gray-600" />}
// //           </button>
// //         </div>

// //         {/* Mobile Menu */}
// //         {isMobileMenuOpen && (
// //           <div className="md:hidden py-4 border-t border-gray-100 animate-slide-in">
// //             <div className="flex flex-col gap-1">
// //               {navLinks.map(link => (
// //                 <Link
// //                   key={link.href}
// //                   to={link.href}
// //                   className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
// //                     location.pathname === link.href
// //                       ? 'text-primary bg-primary/5'
// //                       : 'text-gray-600 hover:text-primary hover:bg-gray-50'
// //                   }`}
// //                   onClick={() => setIsMobileMenuOpen(false)}
// //                 >
// //                   {link.label}
// //                 </Link>
// //               ))}
// //               <Link
// //                 to="/donate"
// //                 onClick={() => setIsMobileMenuOpen(false)}
// //                 className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50 transition-colors"
// //               >
// //                 <HeartIcon className="w-4 h-4 fill-current" />
// //                 Donate
// //               </Link>
// //             </div>

// //             <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
// //               {isLoggedIn ? (
// //                 <>
// //                   {/* Mobile user info */}
// //                   <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg mb-1">
// //                     <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
// //                       <UserIcon className="w-5 h-5 text-primary" />
// //                     </div>
// //                     <div>
// //                       <p className="text-sm font-semibold text-gray-800">{displayName}</p>
// //                       <div className="flex items-center gap-1.5 mt-0.5">
// //                         {currentUser?.bloodGroup && currentUser.role === 'user' && (
// //                           <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
// //                             <DropletIcon className="w-3 h-3" />
// //                             {currentUser.bloodGroup}
// //                           </span>
// //                         )}
// //                         <span className="text-xs text-gray-500">{roleLabel}</span>
// //                       </div>
// //                     </div>
// //                   </div>

// //                   <Link to={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
// //                     <Button variant="outline" fullWidth leftIcon={<LayoutDashboardIcon className="w-4 h-4" />}>
// //                       Dashboard
// //                     </Button>
// //                   </Link>
// //                   <Button
// //                     variant="ghost"
// //                     fullWidth
// //                     leftIcon={<LogOutIcon className="w-4 h-4" />}
// //                     onClick={handleLogout}
// //                     className="text-red-600 hover:bg-red-50"
// //                   >
// //                     Sign Out
// //                   </Button>
// //                 </>
// //               ) : (
// //                 <>
// //                   <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
// //                     <Button variant="outline" fullWidth>Sign In</Button>
// //                   </Link>
// //                   <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
// //                     <Button variant="primary" fullWidth>Become a Donor</Button>
// //                   </Link>
// //                 </>
// //               )}
// //             </div>
// //           </div>
// //         )}
// //       </nav>
// //     </header>
// //   );
// // }


// import { useState, useEffect } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import {
//   MenuIcon, XIcon, HeartPulseIcon, SearchIcon, UserIcon,
//   PhoneIcon, ChevronDownIcon, LogOutIcon, LayoutDashboardIcon,
//   HeartIcon, DropletIcon,
// } from 'lucide-react';
// import { Button } from '../ui/Button';

// interface StoredUser {
//   id: string;
//   name: string;
//   email: string;
//   role: 'user' | 'hospital' | 'admin';
//   bloodGroup?: string;
//   hospitalName?: string;
// }

// export function Navbar() {
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isUserMenuOpen,   setIsUserMenuOpen]   = useState(false);
//   const [currentUser,      setCurrentUser]      = useState<StoredUser | null>(null);
//   const location = useLocation();
//   const navigate = useNavigate();

//   // Read session on every route change
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem('lf_user');
//       setCurrentUser(raw ? JSON.parse(raw) : null);
//     } catch {
//       setCurrentUser(null);
//     }
//   }, [location.pathname]);

//   // Close menus when clicking outside
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       if (!target.closest('[data-user-menu]')) setIsUserMenuOpen(false);
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem('lf_token');
//     localStorage.removeItem('lf_user');
//     setCurrentUser(null);
//     setIsUserMenuOpen(false);
//     setIsMobileMenuOpen(false);
//     navigate('/');
//   };

//   const isLoggedIn = !!currentUser;

//   const displayName = currentUser
//     ? (currentUser.role === 'hospital'
//         ? (currentUser.hospitalName || currentUser.name)
//         : currentUser.name)
//     : '';

//   const roleLabel =
//     currentUser?.role === 'hospital' ? 'Hospital' :
//     currentUser?.role === 'admin'    ? 'Admin'    : 'Donor';

//   const getDashboardLink = () => {
//     switch (currentUser?.role) {
//       case 'hospital': return '/hospital/dashboard';
//       case 'admin':    return '/admin/dashboard';
//       default:         return '/dashboard';
//     }
//   };

//   const navLinks = [
//     { href: '/',       label: 'Home'       },
//     { href: '/search', label: 'Find Blood' },
//     { href: '/contact', label: 'Contact'   },
//     { href: '/faq',    label: 'FAQs'       },
//   ];

//   return (
//     <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
//       {/* Emergency bar */}
//       <div className="bg-primary text-white text-sm py-1.5">
//         <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
//           <PhoneIcon className="w-4 h-4" aria-hidden="true" />
//           <span>Emergency Hotline:{' '}
//             <a href="tel:1660-01-66666" className="font-semibold hover:underline">1660-01-66666</a>
//           </span>
//         </div>
//       </div>

//       <nav className="max-w-7xl mx-auto px-4" aria-label="Main navigation">
//         <div className="flex items-center justify-between h-16">

//           {/* Logo */}
//           <Link to="/" className="flex items-center gap-2 group" aria-label="LifeFlow Home">
//             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
//               <HeartPulseIcon className="w-6 h-6 text-white" />
//             </div>
//             <span className="font-heading font-bold text-xl text-secondary">
//               Life<span className="text-primary">Flow</span>
//             </span>
//           </Link>

//           {/* Desktop nav links */}
//           <div className="hidden md:flex items-center gap-1">
//             {navLinks.map(link => (
//               <Link key={link.href} to={link.href}
//                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                   location.pathname === link.href
//                     ? 'text-primary bg-primary/5'
//                     : 'text-gray-600 hover:text-primary hover:bg-gray-50'
//                 }`}>
//                 {link.label}
//               </Link>
//             ))}
//           </div>

//           {/* Desktop right side */}
//           <div className="hidden md:flex items-center gap-3">
//             <Link to="/search">
//               <Button variant="ghost" size="sm" leftIcon={<SearchIcon className="w-4 h-4" />}>Search</Button>
//             </Link>

//             {/* Donate button — always visible */}
//             <Link to="/donate">
//               <Button size="sm"
//                 className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0 shadow-md shadow-red-500/30"
//                 leftIcon={<HeartIcon className="w-4 h-4 fill-current" />}>
//                 Donate
//               </Button>
//             </Link>

//             {isLoggedIn ? (
//               // ── Logged-in user menu ──────────────────────────────────────
//               <div className="relative" data-user-menu>
//                 <button
//                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
//                   className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
//                   aria-expanded={isUserMenuOpen}
//                 >
//                   {/* Avatar */}
//                   <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
//                     {currentUser?.avatar
//                       ? <img src={currentUser.avatar} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
//                       : <UserIcon className="w-4 h-4 text-primary" />
//                     }
//                   </div>
//                   {/* Name + role */}
//                   <div className="text-left">
//                     <p className="text-sm font-semibold text-gray-800 leading-none">{displayName}</p>
//                     <div className="flex items-center gap-1.5 mt-0.5">
//                       {currentUser?.bloodGroup && currentUser.role === 'user' && (
//                         <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
//                           <DropletIcon className="w-3 h-3" />{currentUser.bloodGroup}
//                         </span>
//                       )}
//                       <span className="text-xs text-gray-500">{roleLabel}</span>
//                     </div>
//                   </div>
//                   <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
//                 </button>

//                 {isUserMenuOpen && (
//                   <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
//                     <div className="px-4 py-2 border-b border-gray-100 mb-1">
//                       <p className="text-sm font-semibold text-gray-800">{displayName}</p>
//                       <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
//                       <div className="flex items-center gap-2 mt-1">
//                         {currentUser?.bloodGroup && currentUser.role === 'user' && (
//                           <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
//                             <DropletIcon className="w-3 h-3" />{currentUser.bloodGroup}
//                           </span>
//                         )}
//                         <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{roleLabel}</span>
//                       </div>
//                     </div>
//                     <Link to={getDashboardLink()}
//                       className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                       onClick={() => setIsUserMenuOpen(false)}>
//                       <LayoutDashboardIcon className="w-4 h-4" /> Dashboard
//                     </Link>
//                     <hr className="my-2 border-gray-100" />
//                     <button onClick={handleLogout}
//                       className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 w-full hover:bg-red-50 transition-colors">
//                       <LogOutIcon className="w-4 h-4" /> Sign Out
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               // ── Not logged in — show Sign In + Become a Donor ────────────
//               <>
//                 <Link to="/login">
//                   <Button variant="ghost" size="sm">Sign In</Button>
//                 </Link>
//                 <Link to="/signup">
//                   <Button variant="primary" size="sm">Become a Donor</Button>
//                 </Link>
//               </>
//             )}
//           </div>

//           {/* Mobile menu toggle */}
//           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
//             aria-expanded={isMobileMenuOpen} aria-label="Toggle menu">
//             {isMobileMenuOpen
//               ? <XIcon className="w-6 h-6 text-gray-600" />
//               : <MenuIcon className="w-6 h-6 text-gray-600" />}
//           </button>
//         </div>

//         {/* Mobile menu */}
//         {isMobileMenuOpen && (
//           <div className="md:hidden py-4 border-t border-gray-100">
//             <div className="flex flex-col gap-1">
//               {navLinks.map(link => (
//                 <Link key={link.href} to={link.href}
//                   className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
//                     location.pathname === link.href
//                       ? 'text-primary bg-primary/5'
//                       : 'text-gray-600 hover:text-primary hover:bg-gray-50'
//                   }`}
//                   onClick={() => setIsMobileMenuOpen(false)}>
//                   {link.label}
//                 </Link>
//               ))}
//               <Link to="/donate" onClick={() => setIsMobileMenuOpen(false)}
//                 className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50 transition-colors">
//                 <HeartIcon className="w-4 h-4 fill-current" /> Donate
//               </Link>
//             </div>

//             <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
//               {isLoggedIn ? (
//                 <>
//                   {/* Mobile user info */}
//                   <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg mb-1">
//                     <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
//                       {currentUser?.avatar
//                         ? <img src={currentUser.avatar} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
//                         : <UserIcon className="w-5 h-5 text-primary" />
//                       }
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold text-gray-800">{displayName}</p>
//                       <div className="flex items-center gap-1.5 mt-0.5">
//                         {currentUser?.bloodGroup && currentUser.role === 'user' && (
//                           <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
//                             <DropletIcon className="w-3 h-3" />{currentUser.bloodGroup}
//                           </span>
//                         )}
//                         <span className="text-xs text-gray-500">{roleLabel}</span>
//                       </div>
//                     </div>
//                   </div>
//                   <Link to={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
//                     <Button variant="outline" fullWidth leftIcon={<LayoutDashboardIcon className="w-4 h-4" />}>Dashboard</Button>
//                   </Link>
//                   <Button variant="ghost" fullWidth leftIcon={<LogOutIcon className="w-4 h-4" />}
//                     onClick={handleLogout} className="text-red-600 hover:bg-red-50">
//                     Sign Out
//                   </Button>
//                 </>
//               ) : (
//                 <>
//                   <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
//                     <Button variant="outline" fullWidth>Sign In</Button>
//                   </Link>
//                   <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
//                     <Button variant="primary" fullWidth>Become a Donor</Button>
//                   </Link>
//                 </>
//               )}
//             </div>
//           </div>
//         )}
//       </nav>
//     </header>
//   );
// }


import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MenuIcon, XIcon, HeartPulseIcon, SearchIcon, UserIcon,
  PhoneIcon, ChevronDownIcon, LogOutIcon, LayoutDashboardIcon,
  HeartIcon, DropletIcon, SettingsIcon,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'hospital' | 'admin';
  bloodGroup?: string;
  hospitalName?: string;
  avatar?: string;
}

function UserAvatar({ user, size = 'sm' }: { user: StoredUser; size?: 'sm' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const icon = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className={`${dim} rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0`}>
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      ) : (
        <UserIcon className={`${icon} text-primary`} />
      )}
    </div>
  );
}

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen,   setIsUserMenuOpen]   = useState(false);
  const [currentUser,      setCurrentUser]      = useState<StoredUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const loadUser = () => {
    try {
      const raw = localStorage.getItem('lf_user');
      setCurrentUser(raw ? JSON.parse(raw) : null);
    } catch {
      setCurrentUser(null);
    }
  };

  // Re-read user on every route change
  useEffect(() => { loadUser(); }, [location.pathname]);

  // Listen for profile updates dispatched by SettingsPage
  useEffect(() => {
    window.addEventListener('lf_user_updated', loadUser);
    return () => window.removeEventListener('lf_user_updated', loadUser);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-user-menu]'))
        setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lf_token');
    localStorage.removeItem('lf_user');
    setCurrentUser(null);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const isLoggedIn = !!currentUser;

  const displayName = currentUser
    ? (currentUser.role === 'hospital'
        ? (currentUser.hospitalName || currentUser.name)
        : currentUser.name)
    : '';

  const roleLabel =
    currentUser?.role === 'hospital' ? 'Hospital' :
    currentUser?.role === 'admin'    ? 'Admin'    : 'Donor';

  const getDashboardLink = () => {
    switch (currentUser?.role) {
      case 'hospital': return '/hospital/dashboard';
      case 'admin':    return '/admin/dashboard';
      default:         return '/dashboard';
    }
  };

  const getSettingsLink = () => {
    switch (currentUser?.role) {
      case 'hospital': return '/hospital/settings';
      case 'admin':    return '/admin/settings';
      default:         return '/dashboard/settings';
    }
  };

  // Hide navbar links for hospitals - they should only access their dashboard
  const navLinks = currentUser?.role === 'hospital' ? [] : [
    { href: '/',        label: 'Home'       },
    { href: '/search',  label: 'Find Blood' },
    { href: '/contact', label: 'Contact'    },
    { href: '/faq',     label: 'FAQs'       },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      {/* Emergency bar */}
      <div className="bg-primary text-white text-sm py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
          <PhoneIcon className="w-4 h-4" />
          <span>Emergency Hotline:{' '}
            <a href="tel:1660-01-66666" className="font-semibold hover:underline">1660-01-66666</a>
          </span>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <HeartPulseIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-secondary">
              Life<span className="text-primary">Flow</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'text-primary bg-primary/5'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {/* Hide search and donate buttons for hospitals */}
            {currentUser?.role !== 'hospital' && (
              <>
                <Link to="/search">
                  <Button variant="ghost" size="sm" leftIcon={<SearchIcon className="w-4 h-4" />}>Search</Button>
                </Link>
                <Link to="/donate">
                  <Button size="sm"
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0 shadow-md shadow-red-500/30"
                    leftIcon={<HeartIcon className="w-4 h-4 fill-current" />}>
                    Donate
                  </Button>
                </Link>
              </>
            )}

            {isLoggedIn ? (
              <div className="relative" data-user-menu>
                {/* Trigger */}
                <button
                  onClick={() => setIsUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <UserAvatar user={currentUser!} size="sm" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-none">{displayName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {currentUser?.bloodGroup && currentUser.role === 'user' && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          <DropletIcon className="w-3 h-3" />{currentUser.bloodGroup}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{roleLabel}</span>
                    </div>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100 mb-1 flex items-center gap-3">
                      <UserAvatar user={currentUser!} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {currentUser?.bloodGroup && currentUser.role === 'user' && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                              <DropletIcon className="w-3 h-3" />{currentUser.bloodGroup}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{roleLabel}</span>
                        </div>
                      </div>
                    </div>

                    <Link to={getDashboardLink()}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}>
                      <LayoutDashboardIcon className="w-4 h-4 text-gray-400" /> Dashboard
                    </Link>

                    {/* ── Settings ── */}
                    <Link to={getSettingsLink()}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}>
                      <SettingsIcon className="w-4 h-4 text-gray-400" /> Settings
                    </Link>

                    <hr className="my-1.5 border-gray-100" />

                    <button onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 w-full hover:bg-red-50 transition-colors">
                      <LogOutIcon className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
                <Link to="/signup"><Button variant="primary" size="sm">Become a Donor</Button></Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setIsMobileMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            {isMobileMenuOpen
              ? <XIcon className="w-6 h-6 text-gray-600" />
              : <MenuIcon className="w-6 h-6 text-gray-600" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            {/* Only show nav links if not a hospital */}
            {navLinks.length > 0 && (
              <div className="flex flex-col gap-1">
                {navLinks.map(link => (
                  <Link key={link.href} to={link.href}
                    className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      location.pathname === link.href
                        ? 'text-primary bg-primary/5'
                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}>
                    {link.label}
                  </Link>
                ))}
                {currentUser?.role !== 'hospital' && (
                  <Link to="/donate" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50">
                    <HeartIcon className="w-4 h-4 fill-current" /> Donate
                  </Link>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg mb-1">
                    <UserAvatar user={currentUser!} size="lg" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {currentUser?.bloodGroup && currentUser.role === 'user' && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                            <DropletIcon className="w-3 h-3" />{currentUser.bloodGroup}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{roleLabel}</span>
                      </div>
                    </div>
                  </div>
                  <Link to={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth leftIcon={<LayoutDashboardIcon className="w-4 h-4" />}>Dashboard</Button>
                  </Link>
                  <Link to={getSettingsLink()} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth leftIcon={<SettingsIcon className="w-4 h-4" />}>Settings</Button>
                  </Link>
                  <Button variant="ghost" fullWidth leftIcon={<LogOutIcon className="w-4 h-4" />}
                    onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth>Sign In</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primary" fullWidth>Become a Donor</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}