import React,{useEffect,useRef} from 'react';
import './depth.css';

// Pointer movement stays on a decorative surface; text and form controls remain still.
export default function DepthScene({children,className='',strength=2.4}){
 const root=useRef(null);const frame=useRef(0);const allowed=useRef(false);
 useEffect(()=>{
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const pointer=matchMedia('(hover: hover) and (pointer: fine)');
  const update=()=>{allowed.current=!motion.matches&&pointer.matches;reset();};
  const visibility=()=>{if(document.hidden)reset();};
  update();motion.addEventListener('change',update);pointer.addEventListener('change',update);document.addEventListener('visibilitychange',visibility);
  return()=>{cancelAnimationFrame(frame.current);motion.removeEventListener('change',update);pointer.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 function reset(){cancelAnimationFrame(frame.current);if(root.current){root.current.style.setProperty('--depth-rx','0deg');root.current.style.setProperty('--depth-ry','0deg');root.current.removeAttribute('data-moving');}}
 function move(event){
  if(!allowed.current||event.pointerType==='touch')return;
  const box=event.currentTarget.getBoundingClientRect();if(!box.width||!box.height)return;
  const x=Math.max(-1,Math.min(1,(event.clientX-box.left)/box.width*2-1));
  const y=Math.max(-1,Math.min(1,(event.clientY-box.top)/box.height*2-1));
  cancelAnimationFrame(frame.current);
  frame.current=requestAnimationFrame(()=>{if(!root.current)return;root.current.style.setProperty('--depth-rx',`${(-y*strength).toFixed(2)}deg`);root.current.style.setProperty('--depth-ry',`${(x*strength).toFixed(2)}deg`);root.current.dataset.moving='true';});
 }
 return <div ref={root} className={`depth-scene ${className}`} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}><div className="depth-surface">{children}</div></div>;
}
