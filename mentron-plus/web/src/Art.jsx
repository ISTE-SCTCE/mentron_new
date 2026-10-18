import React from 'react';

export function HeroArt({campus=false}) {
 return <svg className="hero-art" viewBox="0 0 500 360" fill="none" aria-hidden="true">
  <defs><linearGradient id="book" x1="180" y1="110" x2="370" y2="310" gradientUnits="userSpaceOnUse"><stop stopColor={campus?'#F5B78F':'#ABA5FF'}/><stop offset="1" stopColor={campus?'#D97D55':'#7B70E8'}/></linearGradient><linearGradient id="page" x1="100" y1="100" x2="300" y2="300"><stop stopColor="#FFFEF2"/><stop offset="1" stopColor="#DDD9F2"/></linearGradient><filter id="shadow"><feGaussianBlur stdDeviation="13"/></filter></defs>
  <ellipse cx="270" cy="306" rx="150" ry="18" fill={campus?'#365E7B':'#5644AD'} opacity=".12" filter="url(#shadow)"/>
  <circle cx="273" cy="166" r="140" stroke={campus?'#8AA8BC':'#ADA5E3'} strokeOpacity=".4"/>
  <ellipse cx="273" cy="166" rx="190" ry="65" transform="rotate(-26 273 166)" stroke={campus?'#8AA8BC':'#ADA5E3'} strokeOpacity=".5" strokeDasharray="4 8"/>
  <g className="art-float"><path d="m125 202 146-71 130 87-151 88z" fill={campus?'#A7CACB':'#B9B2E8'}/><path d="m125 190 146-71 130 87-151 88z" fill="#F5F0E1"/><path d="m125 180 146-71 130 87-151 88z" fill="url(#book)"/>
  <path d="m142 171 120-57 121 77-125 71z" fill="#D6D1FF" opacity=".34"/>
  <path d="m161 141 105-51 116 72-117 61z" fill="url(#page)"/>
  <path d="m161 132 105-51 116 72-117 61z" fill="#FFFEF4"/><path d="m161 132 104 82v9l-104-82z" fill="#DAD7E5"/>
  <path d="m265 214 117-61v9l-117 61z" fill="#E9E5EB"/>
  <path d="m266 81-1 133" stroke="#DFD9EC" strokeWidth="2"/>
  <path d="m179 131 65-32m-53 43 53-26m47-13 60 37m-62-21 46 28" stroke="#CAC2DB" strokeWidth="3" strokeLinecap="round"/>
  <path d="m301 179 17-9 0 45-9-2-8 13z" fill="#FF8C69"/>
  </g>
  <g transform="translate(102 78) rotate(-14)"><rect width="62" height="77" rx="12" fill="#4ECDC4"/><rect x="12" y="15" width="38" height="6" rx="3" fill="#F0FFED"/><path d="m15 43 9 9 20-20" stroke="#F0FFED" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></g>
  <g transform="translate(371 85) rotate(13)"><rect width="57" height="64" rx="12" fill="#FFF1B2"/><path d="M16 19h25M16 29h25M16 39h14" stroke="#B59843" strokeWidth="3" strokeLinecap="round"/></g>
  <g transform="translate(385 241)"><circle r="28" fill="#FFAB89"/><path d="M-10 0h20M0-10v20" stroke="#FFF8EF" strokeWidth="4" strokeLinecap="round"/></g>
  <path d="m225 43 4 11 11 4-11 4-4 11-4-11-11-4 11-4z" fill="#8B80D8"/>
  <path d="m93 252 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#D89C77"/>
  <circle cx="333" cy="45" r="5" fill="#FF8C69"/><circle cx="121" cy="290" r="4" fill="#8B80D8"/>
  {campus&&<g transform="translate(232 54)"><path d="M0 0 25-18 50 0 25 18z" fill="#3B657E"/><path d="M10 8v17q15 12 30 0V8" fill="#5F85A2"/><path d="M49 0v31" stroke="#F5C842" strokeWidth="3"/></g>}
 </svg>;
}
export function CoverArt({kind='notes',index=0}) {
 return <svg className="cover-art" viewBox="0 0 240 150" fill="none" aria-hidden="true">
 {kind==='notes'?(index%3===0?<><path d="M10 90c30-110 50 110 80 0s50 110 80 0 50 90 75-15" stroke="currentColor" strokeWidth="3"/><path d="M5 110h230M40 20v110" stroke="currentColor" strokeOpacity=".2"/><circle cx="90" cy="90" r="7" fill="currentColor"/></>:index%3===1?<><rect x="50" y="25" width="45" height="35" rx="8" stroke="currentColor" strokeWidth="2"/><rect x="145" y="90" width="45" height="35" rx="8" stroke="currentColor" strokeWidth="2"/><rect x="45" y="90" width="45" height="35" rx="8" fill="currentColor" fillOpacity=".15"/><path d="M73 60v15h95v15M73 75v15" stroke="currentColor" strokeWidth="2"/><circle cx="168" cy="43" r="10" stroke="currentColor" strokeWidth="2"/></>:<><path d="M40 40h55l10-10 10 20 10-20 10 20 10-10h55v75H40z" stroke="currentColor" strokeWidth="2"/><circle cx="40" cy="80" r="15" fill="var(--cover-bg)" stroke="currentColor" strokeWidth="2"/><path d="M32 80h16M40 72v16M175 103v24M182 108v14" stroke="currentColor" strokeWidth="2"/><circle cx="95" cy="40" r="4" fill="currentColor"/></>):kind==='calculator'?<g transform="translate(85 7) rotate(10 35 65)"><rect width="76" height="130" rx="12" fill="#45405D"/><rect x="9" y="12" width="58" height="30" rx="5" fill="#C8D7BD"/><text x="59" y="34" textAnchor="end" fontSize="15" fill="#45405D" fontFamily="monospace">991.0</text>{Array.from({length:20},(_,i)=><rect key={i} x={10+i%4*15} y={54+Math.floor(i/4)*13} width="10" height="8" rx="2" fill={i>15?'#FFAD8B':'#C8C3E1'}/>)}</g>:kind==='chip'?<g transform="translate(60 35) rotate(-10 60 40)"><rect width="120" height="80" rx="9" fill="#378B7F"/><rect x="45" y="23" width="38" height="34" rx="3" fill="#253B3F"/><rect x="-6" y="27" width="25" height="25" rx="3" fill="#C8D0D1"/>{Array.from({length:8},(_,i)=><circle key={i} cx={25+i*11} cy="10" r="3" fill="#E6DCA8"/>)}<path d="M30 23v35h10M90 25h17v30H90" stroke="#B0D5BA" strokeWidth="2"/></g>:<><path d="m65 115 100-10 20 14-100 10z" fill="#7D6FB5"/><path d="m65 100 100-10v15L65 115z" fill="#FFF9EB"/><path d="m65 95 100-10 20 14-100 10z" fill="#A89BCF"/><path d="m75 80 100-10v15L75 95z" fill="#FFF9EB"/><path d="m75 75 100-10 20 14-100 10z" fill="#EC977A"/><path d="m85 60 100-10v15L85 75z" fill="#FFF9EB"/><path d="m85 55 100-10 20 14-100 10z" fill="#76B3A8"/></>}
 </svg>;
}
