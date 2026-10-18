import React,{useEffect,useRef} from 'react';
import {ArrowUpRight,ArrowDown,BookOpen,Compass} from 'lucide-react';
import {SiteFooter} from './Brand';
import './common-journey.css';

// The page keeps native scrolling; only decorative layers follow its progress.
function usePaintScroll(ref,entry=false){
 useEffect(()=>{
  const node=ref.current;if(!node)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
  const draw=()=>{
   const bounds=node.getBoundingClientRect();
   const position=entry?(innerHeight-bounds.top)/(bounds.height+innerHeight):-bounds.top/Math.max(1,bounds.height-innerHeight);
   const p=preference.matches?1:Math.max(0,Math.min(1,position));
   node.style.setProperty('--paint-progress',String(p));
   node.style.setProperty('--can-x',`${(p-.5)*Math.min(node.clientWidth*.8,950)}px`);
   node.style.setProperty('--can-y',`${Math.sin(p*Math.PI)*8}px`);
   node.style.setProperty('--can-turn',`${-24+p*58}deg`);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});};
  draw();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);preference.addEventListener('change',schedule);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);preference.removeEventListener('change',schedule);};
 },[ref,entry]);
}

export function SprayCan({id='world'}){
 return <svg className="paint-can" viewBox="0 0 210 330" fill="none" aria-hidden="true">
  <defs>
   <linearGradient id={`${id}-metal`} x1="38" y1="0" x2="166" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#5d6159"/><stop offset=".25" stopColor="#f2f2dd"/><stop offset=".52" stopColor="#aeb5a1"/><stop offset=".78" stopColor="#f6f6e7"/><stop offset="1" stopColor="#73796a"/></linearGradient>
   <linearGradient id={`${id}-body`} x1="42" y1="0" x2="170" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#899d26"/><stop offset=".22" stopColor="#e2ff54"/><stop offset=".5" stopColor="#efffa4"/><stop offset=".72" stopColor="#dcff45"/><stop offset="1" stopColor="#98b32b"/></linearGradient>
   <radialGradient id={`${id}-mist`}><stop stopColor="#e2ff54" stopOpacity=".8"/><stop offset="1" stopColor="#e2ff54" stopOpacity="0"/></radialGradient>
  </defs>
  <ellipse className="paint-mist" cx="44" cy="43" rx="46" ry="29" fill={`url(#${id}-mist)`}/>
  <path d="M79 57V33Q79 26 86 26H109Q116 26 116 33V57" fill="#242920" stroke="#edf1da" strokeWidth="2"/>
  <path d="M79 35H91V44H79Z" fill="#f6f7de"/><circle cx="80" cy="39" r="2.5" fill="#12180d"/>
  <path d="M47 90Q49 63 78 57H117Q150 62 155 90" fill={`url(#${id}-metal)`} stroke="#505747" strokeWidth="2"/>
  <rect x="42" y="86" width="120" height="220" rx="15" fill={`url(#${id}-body)`} stroke="#37421e" strokeWidth="2"/>
  <path d="M49 99V290" stroke="#faffce" strokeWidth="5" opacity=".65"/>
  <path d="M45 277H160V298Q158 313 143 314H62Q45 313 45 298Z" fill={`url(#${id}-metal)`}/>
  <path d="M47 293H158M48 303H156" stroke="#575e50" strokeWidth="2"/>
  <path d="M55 139H152V244H55Z" fill="#1c2314"/>
  <text x="102" y="158" textAnchor="middle" fill="#e2ff54" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="7" letterSpacing="2">MENTRON+</text>
  <text x="102" y="193" textAnchor="middle" fill="#f3f4df" fontFamily="Anton,Impact,sans-serif" fontSize="30">TRIBE</text>
  <text x="102" y="223" textAnchor="middle" fill="#e2ff54" fontFamily="Anton,Impact,sans-serif" fontSize="30">COLOUR.</text>
  <path d="M64 256H137" stroke="#273317" strokeWidth="2"/>
  <text x="101" y="270" textAnchor="middle" fill="#273317" fontFamily="Inter,sans-serif" fontSize="6" letterSpacing="1">MADE TO LEAVE A MARK</text>
 </svg>;
}

export default function CommonJourney(){
 const stage=useRef(null);usePaintScroll(stage);
 return <>
  <div className="tribe-ticker" aria-label="Learn. Build. Connect. Belong."><span>Learn.</span><i>✳</i><span>Build.</span><i>✳</i><span>Connect.</span><i>✳</i><span>Belong.</span><i>✳</i></div>
  <section className="paint-world-stage" id="landing-worlds" ref={stage} aria-labelledby="paint-world-title">
   <div className="paint-world-sticky">
    <div className="paint-stage-heading"><span className="street-kicker">DIFFERENT DAYS. SAME YOU.</span><h2 id="paint-world-title">Two worlds.<br/><span>One tribe.</span></h2></div>
    <div className="paint-runway" aria-hidden="true"><div className="paint-trail"/><div className="paint-flecks"/><SprayCan/></div>
    <div className="street-worlds">
     <article><span className="street-world-label"><BookOpen size={20}/> 01 / LEARN. BUILD. GROW.</span><h3>Mentron</h3><p>Shared notes. Bold ideas. People who make learning feel less like going it alone.</p><a href="#/learn-landing">Step into Mentron <ArrowUpRight size={22}/></a></article>
     <article><span className="street-world-label"><Compass size={20}/> 02 / CONNECT. SHOW UP. BELONG.</span><h3>mlynq</h3><p>Find your people. Discover your next event. Keep the moments and milestones that matter.</p><a href="#/campus-landing">Step into mlynq <ArrowUpRight size={22}/></a></article>
    </div>
    <span className="paint-scroll-note">A LITTLE SCROLL. A LOT TO DISCOVER. <ArrowDown size={14}/></span>
   </div>
  </section>
  <section className="street-manifesto" aria-labelledby="street-manifesto-title"><span className="street-kicker">BEYOND YOUR TIMETABLE</span><h2 id="street-manifesto-title">Bring your ideas.<br/>Find your people.<br/><span>Leave your mark.</span></h2><p>What you learn becomes what you build. An event becomes a friendship. A question becomes your next idea. Make space for all of it.</p><div className="street-manifesto-links"><a href="#/learn-landing">Explore Mentron <ArrowUpRight size={19}/></a><a href="#/campus-landing">Explore mlynq <ArrowUpRight size={19}/></a></div><span className="street-scribble" aria-hidden="true">See you there ↗</span></section>
 </>;
}

export function CommonFooter(){
 const footer=useRef(null);usePaintScroll(footer,true);
 return <div className="common-street-footer" ref={footer}>
  <div className="footer-paint-line" aria-hidden="true"/>
  <div className="street-footer-callout"><span className="street-kicker">YOUR TRIBE IS HERE.</span><p>Make it<br/><span>your chapter.</span></p><a href="#/mentron-login">Come on in <ArrowUpRight size={30}/></a><div className="footer-can" aria-hidden="true"><SprayCan id="footer"/></div></div>
  <SiteFooter/>
 </div>;
}
