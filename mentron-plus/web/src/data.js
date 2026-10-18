export const notes = [
 {id:'signals',title:'Signals, made simple.',subject:'Signals & Systems',department:'Electronics',semester:'Semester 4',author:'Niya K.',pages:24,color:'lavender',tag:'MOST LOVED',saved:248,description:'A clear, visual guide to continuous and discrete signals. Includes worked examples, transform pairs, and a quick revision sheet.'},
 {id:'algorithms',title:'Think in algorithms.',subject:'Data Structures',department:'Computer Science',semester:'Semester 4',author:'Arjun M.',pages:36,color:'peach',tag:'FRESH NOTES',saved:186,description:'From linked lists to trees, understand the idea before the code. Includes complexity notes and practice questions.'},
 {id:'circuits',title:'Connect the dots.',subject:'Network Theory',department:'Electronics',semester:'Semester 4',author:'Dev S.',pages:18,color:'mint',tag:'QUICK REVISION',saved:132,description:'Circuit analysis, theorems and two-port networks, arranged for a focused last-minute revision.'},
 {id:'maths',title:'Make sense of the maths.',subject:'Engineering Mathematics',department:'All departments',semester:'Semester 4',author:'Maya R.',pages:32,color:'butter',tag:'EXAM READY',saved:321,description:'A collection of worked problems in transforms, probability and numerical methods.'},
];
export const events = [
 {id:'build-week',title:'Build something that matters.',name:'Build Week ’26',type:'Hackathon',day:'24',month:'OCT',time:'9:00 AM',place:'Innovation Lab',color:'lavender',description:'Two days. One small idea. A whole lot of possibility. Find your people, build a prototype, and show the campus what you can make.',price:'Free for members',seats:'42 spots left'},
 {id:'design-jam',title:'Good ideas need good company.',name:'The Design Jam',type:'Workshop',day:'28',month:'OCT',time:'2:00 PM',place:'Studio 204',color:'peach',description:'An afternoon of sketching, testing, and making everyday campus life a little better. Bring curiosity. We’ll bring the sticky notes.',price:'₹99 for members',seats:'18 spots left'},
 {id:'open-mic',title:'A stage for your next idea.',name:'Campus Conversations',type:'Meetup',day:'30',month:'OCT',time:'4:30 PM',place:'The Courtyard',color:'mint',description:'Meet the makers, ask the questions, and leave with a new perspective. A relaxed evening with your campus community.',price:'Free entry',seats:'Open to everyone'},
];
export const projects = [
 {id:'garden',title:'A smarter campus garden',category:'IoT',description:'Help a little green go a long way. We’re building a sensor-based watering system.',roles:'Hardware · Flutter',people:3,color:'mint'},
 {id:'wayfinder',title:'Find your way, together',category:'App development',description:'An accessible campus map, made by the people who know it best.',roles:'Design · React',people:4,color:'lavender'},
 {id:'solar',title:'Small panels. Big potential.',category:'Sustainability',description:'Exploring a solar-powered charging station for our shared spaces.',roles:'Electrical · Research',people:2,color:'peach'},
];
export const market = [
 {id:'calculator',title:'Casio fx-991EX',category:'Electronics',price:850,condition:'Gently used',color:'lavender',art:'calculator'},
 {id:'books',title:'The semester starter pack',category:'Textbooks',price:450,condition:'Like new',color:'peach',art:'books'},
 {id:'arduino',title:'Arduino maker kit',category:'Components',price:650,condition:'Gently used',color:'mint',art:'chip'},
];
export const certificates = [{id:'web',title:'Web Development Bootcamp',date:'12 Sep 2026',category:'Workshop'},{id:'innovation',title:'Innovation Challenge',date:'28 Aug 2026',category:'Hackathon'},{id:'intro',title:'An Introduction to IoT',date:'16 Aug 2026',category:'Workshop'}];
export const notifications = [{id:1,title:'Your next idea has a place.',text:'Build Week registrations are open. Find a team and make something good.',time:'12 min ago',source:'mlynq'},{id:2,title:'A fresh set of Signals notes.',text:'Niya added 24 pages of clear explanations to your semester.',time:'1 hour ago',source:'Mentron'},{id:3,title:'Your certificate is ready.',text:'Your Web Development Bootcamp certificate is waiting for you.',time:'Yesterday',source:'mlynq'}];
export function readLocal(key,fallback){try{return JSON.parse(localStorage.getItem(`campus.preview.${key}`))??fallback;}catch{return fallback;}}
export function writeLocal(key,value){try{localStorage.setItem(`campus.preview.${key}`,JSON.stringify(value));}catch{/* Preview stays usable when storage is unavailable. */}}
