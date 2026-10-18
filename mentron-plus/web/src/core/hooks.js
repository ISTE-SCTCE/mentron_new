import {useCallback,useEffect,useRef,useState} from 'react';
export function useResource(load,dependencies=[]){
 const loader=useRef(load);loader.current=load;
 const refresh=useRef(()=>{});const [state,setState]=useState({loading:true,refreshing:false,data:null,error:null});
 useEffect(()=>{
  let alive=true;let running=false;let queued=false;
  async function run(background=false){
   if(!alive)return;if(running){queued=true;return;}
   running=true;
   setState(s=>background?{...s,refreshing:true}:{loading:true,refreshing:false,data:null,error:null});
   try{const data=await loader.current();if(alive)setState({loading:false,refreshing:false,data,error:null});}
   catch(error){if(alive)setState({loading:false,refreshing:false,data:null,error:error.message||'Unable to load. Try again.'});}
   finally{running=false;if(alive&&queued){queued=false;run(true);}}
  }
  const resume=()=>{if(document.visibilityState==='visible'&&navigator.onLine)run(true);};
  refresh.current=()=>run(true);run();
  const timer=setInterval(resume,60000);
  document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);window.addEventListener('mentron:data-change',resume);
  return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);window.removeEventListener('mentron:data-change',resume);};
 },dependencies);
 return {...state,reload:useCallback(()=>refresh.current(),[])};
}
export function useDebounce(value,delay=300){const [result,setResult]=useState(value);useEffect(()=>{const timer=setTimeout(()=>setResult(value),delay);return()=>clearTimeout(timer);},[value,delay]);return result;}
