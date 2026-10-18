import React,{useEffect,useState,useRef,lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import ErrorBoundary from './ErrorBoundary';
import {ArrowUpRight,Bell,BookOpen,CalendarDays,Compass,Home,Lightbulb,Menu,MessagesSquare,ShoppingBag,ScanLine,Award,User,X,LogOut} from 'lucide-react';
import {AuthProvider,useAuth} from './core/Auth';
import {collection,own,markRead} from './core/repository';
import {useResource} from './core/hooks';
import {backend} from './core/backend';
import {startWorkspaceSync} from './core/live-sync';
import {Brand} from './Brand';
import Landing from './Landing';
import Login from './Login';
import Dashboard,{ResourceState} from './live/Dashboard';
import CollectionPage,{Intro} from './live/CollectionPage';
import NotesPage from './live/NotesPage';
import {PersonalPage,Profile,RecentResources} from './live/PersonalPages';
import CheckIn from './live/CheckIn';
import {Modal,SignatureLoader,EmptyState} from './components';
import './styles.css';import './readability.css';import './branding.css';import './live/product.css';
const Admin=lazy(()=>import('./live/Admin'));
const publicRoutes=['landing','learn-landing','campus-landing','mentron-login','mlynq-login','update-password'];
const protectedRoutes=['home','notes','projects','market','me','events','qr','certificates','attendance','explore','forum','downloads','gate','applications','orders','notifications','admin'];
const readRoute=()=>{const r=location.hash.slice(2).split('?')[0];return [...publicRoutes,...protectedRoutes].includes(r)?r:'landing';};
const navs={learn:[['home','Home',Home],['notes','Notes',BookOpen],['projects','Projects',Lightbulb],['market','Market',ShoppingBag],['me','Me',User]],campus:[['home','Home',Home],['events','Events',CalendarDays],['qr','My QR',ScanLine],['certificates','Certificates',Award],['me','Me',User]]};
function App(){
 const mainRef=useRef(null);const auth=useAuth();const [route,setRoute]=useState(readRoute);const [world,setWorld]=useState(()=>new URL(location.href).searchParams.get('world')==='campus'||localStorage.getItem('mentron.world')==='campus'?'campus':'learn');
 function navigate(next){location.hash=`/${next}`;setRoute(next);}
 function enter(next,page='home'){setWorld(next);localStorage.setItem('mentron.world',next);navigate(page);}
 useEffect(()=>{const listener=()=>setRoute(readRoute());window.addEventListener('hashchange',listener);return()=>window.removeEventListener('hashchange',listener);},[]);
 useEffect(()=>{document.documentElement.dataset.world=world;localStorage.setItem('mentron.world',world);},[world]);
 useEffect(()=>{if(route==='campus-landing'||route==='mlynq-login')setWorld('campus');if(route==='learn-landing'||route==='mentron-login')setWorld('learn');window.scrollTo(0,0);mainRef.current?.focus({preventScroll:true});document.title=route.includes('login')?`Log in to ${route==='mlynq-login'?'mlynq':'Mentron'}`:'Mentron+ · Find your tribe';},[route]);
 useEffect(()=>{if(auth.recovery||new URL(location.href).searchParams.get('flow')==='recovery'&&auth.user)navigate('update-password');},[auth.recovery,auth.user?.id]);
 useEffect(()=>{if(!publicRoutes.includes(route))sessionStorage.setItem('mentron.next',route);},[route]);
 useEffect(()=>{if(!auth.loading&&auth.user&&route.endsWith('login'))navigate('home');},[auth.loading,auth.user?.id,route]);
 function signedIn(){const next=sessionStorage.getItem('mentron.next');navigate(protectedRoutes.includes(next)?next:'home');}
 if(['landing','learn-landing','campus-landing'].includes(route))return <Landing mainRef={mainRef} mode={route==='landing'?'all':route==='learn-landing'?'learn':'campus'} navigate={navigate} onWorld={next=>enter(next,`${next}-landing`)} enter={enter}/>;
 if(auth.loading)return <div className="auth-loading" role="status"><SignatureLoader/><p>Connecting to your account…</p></div>;
 if(route==='update-password')return <Login mainRef={mainRef} world={world} navigate={navigate} initialMode="password" onSuccess={signedIn}/>;
 if(!auth.user)return <Login mainRef={mainRef} key={world} world={world} navigate={navigate} onSuccess={signedIn}/>;
 if(route.endsWith('login'))return <Workspace world={world} setWorld={setWorld} route="home" navigate={navigate}/>;
 return <Workspace world={world} setWorld={setWorld} route={route} navigate={navigate}/>;
}
function Workspace({world,setWorld,route,navigate}){
 const auth=useAuth();const [search,setSearch]=useState('');const [menu,setMenu]=useState(false);const [toast,setToast]=useState('');const [enrolled,setEnrolled]=useState(false);const [enrollmentError,setEnrollmentError]=useState('');
 useEffect(()=>{let active=true;setEnrolled(false);setEnrollmentError('');auth.enroll(world).then(()=>{if(active)setEnrolled(true);}).catch(e=>{if(active)setEnrollmentError(e.message);});return()=>{active=false;};},[world,auth.user.id]);
 useEffect(()=>{if(enrolled)return startWorkspaceSync(backend(),auth.user.id,()=>window.dispatchEvent(new Event('mentron:data-change')));},[enrolled,auth.user.id]);
 useEffect(()=>{setMenu(false);},[route]);useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(timer);},[toast]);
 function switchWorld(next){setSearch('');setWorld(next);navigate('home');}
 const name=auth.profile.name;const nav=navs[world];const exec=['forum_execcom','core_execcom','vice_chairman','chairman'].includes(auth.profile.role);
 let page;if(!enrolled)page=enrollmentError?<div className="empty-state" role="alert"><h1>Unable to open your workspace.</h1><p>{enrollmentError}</p><button className="primary-button" onClick={()=>auth.signOut()}>Log out</button></div>:<div className="empty-state" role="status"><SignatureLoader/><p>Preparing your workspace…</p></div>;
 else if(route==='home')page=<Dashboard world={world} navigate={navigate}/>;
 else if(route==='notes')page=<NotesPage search={search} notify={setToast}/>;
 else if(['events','projects','market','forum'].includes(route))page=<CollectionPage key={route} kind={route} search={search} notify={setToast}/>;
 else if(route==='gate')page=<><Intro title="GATE library" text="Resources for your next step."/><EmptyState title="No GATE resources available yet." text="Explore the study library while new resources are prepared."/><button className="primary-button" onClick={()=>navigate('notes')}>Browse study resources</button></>;
 else if(['certificates','attendance','applications','orders'].includes(route))page=<PersonalPage key={route} kind={route} notify={setToast}/>;
 else if(route==='me')page=<Profile navigate={navigate} notify={setToast}/>;
 else if(route==='qr')page=<CheckIn/>;
 else if(route==='downloads')page=<RecentResources navigate={navigate}/>;
 else if(route==='notifications')page=<Notifications/>;
 else if(route==='admin')page=exec?<Suspense fallback={<SignatureLoader/>}><Admin/></Suspense>:<div className="empty-state"><h1>Access restricted</h1><p>This area is for authorised ISTE coordinators.</p></div>;
 else page=<><Intro title="Explore Mentron+" text="Your resources, community, and achievements."/><div className="explore-grid">{[...navs.learn,...navs.campus,['forum','Community',MessagesSquare],['applications','Applications',Lightbulb],['orders','Orders',ShoppingBag],['attendance','Attendance',CalendarDays]].filter((r,i,a)=>a.findIndex(x=>x[0]===r[0])===i).map(([id,label,Icon],i)=><button className={['lavender','peach','mint','butter'][i%4]} key={id} onClick={()=>navigate(id)}><Icon size={26}/><h2>{label}</h2><ArrowUpRight size={18}/></button>)}</div></>;
 return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a>{menu&&<button className="menu-scrim" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}<aside className={`sidebar ${menu?'open':''}`} aria-label="Main navigation"><button className="brand" onClick={()=>navigate('landing')}><Brand mode={world}/></button><div className="sidebar-intro"><span>YOUR STUDENT TRIBE</span><p>Study. Connect. Grow.</p></div><div className="world-toggle">{['learn','campus'].map(w=><button key={w} aria-pressed={w===world} onClick={()=>switchWorld(w)}>{w==='learn'?'Mentron':'mlynq'}</button>)}</div><span className="nav-caption">YOUR WORKSPACE</span><nav className="primary-nav">{nav.map(([id,label,Icon])=><a href={`#/${id}`} key={id} className={route===id?'active':''} aria-current={route===id?'page':undefined}><Icon size={20}/><span>{label}</span></a>)}</nav><div className="nav-divider"/><nav className="secondary-nav">{[['explore','Explore'],['forum','Community'],['attendance','Attendance'],['applications','Applications'],['orders','Orders'],...(exec?[['admin','ISTE management']]:[])].map(([id,label])=><a key={id} href={`#/${id}`}>{label}</a>)}</nav><div className="sidebar-bottom"><button className="sidebar-profile" onClick={()=>navigate('me')}><span className="user-avatar">{name[0]}</span><strong>{name}</strong></button><button className="logout-control" onClick={async()=>{try{await auth.signOut();navigate('landing');}catch(e){setToast(e.message);}}}><LogOut size={16}/>Log out</button></div></aside><div className="workspace"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={()=>setMenu(true)}><Menu size={22}/></button><span className="breadcrumb">{world==='learn'?'Mentron':'mlynq'}<span>/</span><strong>{route==='home'?'Your home':route}</strong></span></div><div className="topbar-actions"><label className="search-box"><input aria-label="Search resources" placeholder="Search your workspace" value={search} onChange={e=>{setSearch(e.target.value);if(!['notes','projects','events','market','forum'].includes(route))navigate(world==='learn'?'notes':'events');}}/></label><button className="icon-button" aria-label="Notifications" onClick={()=>navigate('notifications')}><Bell size={20}/></button><button className="header-avatar" aria-label="Your profile" onClick={()=>navigate('me')}>{name[0]}</button></div></header><div className="mobile-world-row"><button className="mobile-brand" onClick={()=>navigate('landing')}><Brand mode={world}/></button><div className="world-toggle">{['learn','campus'].map(w=><button key={w} aria-pressed={w===world} onClick={()=>switchWorld(w)}>{w==='learn'?'Mentron':'mlynq'}</button>)}</div></div><main id="main-content" className="main-content" tabIndex={-1}>{page}</main><footer className="workspace-footer">Mentron+ · Built by ISTE SCTCE</footer></div><nav className="mobile-bottom-nav" aria-label="Main tabs">{nav.map(([id,label,Icon])=><a href={`#/${id}`} key={id} className={route===id?'active':''} aria-current={route===id?'page':undefined}><span><Icon size={21}/></span><small>{label}</small></a>)}</nav>{toast&&<div className="toast visible" role="status">{toast}<button aria-label="Dismiss notification" onClick={()=>setToast('')}><X size={16}/></button></div>}</div>;
}
function Notifications(){const {user}=useAuth();const state=useResource(()=>own('notifications',user.id),[user.id]);return <><Intro title="Notifications" text="Updates from your community."/><ResourceState state={state}>{state.data?.length?<div className="live-list">{state.data.map(n=><button key={n.id} onClick={async()=>{await markRead(n.id,user.id);state.reload();}}><strong>{n.title}{!n.is_read?' · New':''}</strong><p>{n.message}</p></button>)}</div>:<p>You’re up to date.</p>}</ResourceState></>;}
createRoot(document.getElementById('root')).render(<ErrorBoundary><AuthProvider><App/></AuthProvider></ErrorBoundary>);
