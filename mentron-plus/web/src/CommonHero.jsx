import React,{useEffect,useRef} from 'react';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
import {Brand,IsteCredit} from './Brand';
import DepthScene from './DepthScene';
import './common-hero.css';

function scrollToWorlds(event){
 event?.preventDefault();
 document.getElementById('landing-worlds')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
export function CommonHeader({navigate}){
 const header=useRef(null);
 useEffect(()=>{
  let frame=0;
  const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(header.current)header.current.dataset.scrolled=String(window.scrollY>60);});};
  update();window.addEventListener('scroll',update,{passive:true});
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',update);};
 },[]);
 return <header ref={header} className="common-nav">
  <a className="common-brand" href="#/landing" aria-label="Mentron+ home"><Brand/></a>
  <nav aria-label="Explore Mentron+">
   <a href="#/learn-landing">Mentron</a>
   <a href="#/campus-landing">mlynq</a>
   <a href="#landing-worlds" onClick={scrollToWorlds}>The tribe</a>
   <button onClick={()=>navigate('mentron-login')}>Log in <ArrowUpRight size={20}/></button>
  </nav>
  <IsteCredit/>
 </header>;
}
function TribeGraffiti(){
 return <svg className="common-graffiti" viewBox="0 0 600 230" fill="none" aria-hidden="true">
  <defs><filter id="tribe-spray" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".075" numOctaves="2" seed="8" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter></defs>
  <g stroke="#f4f2e8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" filter="url(#tribe-spray)">
   <path d="M26 80 122 58M82 72 58 178M128 171 153 66C216 41 231 107 151 117L201 175M242 63 270 59M255 61 238 178M219 182 266 176M292 178 319 55C393 31 405 105 307 116 413 81 405 191 292 178M447 57 418 179 502 164M435 121 491 108M449 57 524 39"/>
   <path d="M24 202Q266 179 549 191" strokeWidth="7"/>
  </g>
 </svg>;
}
export default function CommonHero(){
 return <section className="common-hero" aria-labelledby="common-hero-title">
  <link rel="preload" href="/fonts/Anton-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/>
  <div className="common-paint-band" aria-hidden="true"/>
  <img className="common-tire-tracks" src="/brand/street-treads.svg" alt="" aria-hidden="true" width="260" height="1200" fetchPriority="low"/>
  <TribeGraffiti/>
  <div className="common-hero-content">
   <h1 className="common-title" id="common-hero-title" aria-label="We are Mentron plus"><span>We are</span><span>Mentron<span className="common-title-plus">+</span></span></h1>
   <p className="common-manifesto">Find your tribe.<br/>Build your next chapter.</p>
   <div className="common-world-actions" aria-label="Choose your world">
    <a href="#/learn-landing"><span>Mentron</span><ArrowUpRight size={25}/><small>Learn. Build. Grow.</small></a>
    <a href="#/campus-landing"><span>mlynq</span><ArrowUpRight size={25}/><small>Connect. Show up. Belong.</small></a>
   </div>
  </div>
  <DepthScene className="common-sticker-depth" strength={1.3}><div className="common-sticker" aria-hidden="true"><span>A LITTLE REMINDER</span><strong>Better<br/>together.</strong><svg viewBox="0 0 72 35" fill="none"><path d="M5 5C22 32 48 32 65 5M17 3v6M53 3v6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg><small>YOUR TRIBE IS HERE ↗</small></div></DepthScene>
  <div className="common-hero-bottom"><span>STUDY. CONNECT. GROW.</span><a href="#landing-worlds" onClick={scrollToWorlds}>Meet your two worlds <ArrowDown size={16}/></a><span>AN INITIATIVE BY ISTE SCTCE</span></div>
 </section>;
}
