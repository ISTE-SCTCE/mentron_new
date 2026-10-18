export const years=[['1','1st year','S1 & S2'],['2','2nd year','S3 & S4'],['3','3rd year','S5 & S6'],['4','4th year','S7 & S8']];
export const groups={A:['Group A','CS / IT streams'],B:['Group B','EEE / ECE streams'],C:['Group C','Mechanical / Civil streams'],D:['Group D','Biotech / Food Tech streams']};
export const departments={CSE:['Computer Science & Engineering','CSE'],ECE:['Electronics & Communication Engineering','ECE'],ME:['Mechanical Engineering','ME'],MEA:['Mechanical Engineering (Automobile)','MEA'],BT:['Biotechnology','BT']};
export const normalizeSubject=value=>String(value||'').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim().toLocaleLowerCase();
export const baseSubject=value=>String(value||'').replace(/^(PYQ|Video)\s*[-–—]\s*/i,'');
export function notesHref(selection={}){const q=new URLSearchParams();for(const key of ['year','semester','department','subject','type','folder','view'])if(selection[key])q.set(key,selection[key]);return '#/notes'+(q.size?'?'+q.toString():'');}
export function readNotesSelection(hash){
 const q=new URLSearchParams(hash.split('?')[1]||'');const year=q.get('year')||'';const semester=q.get('semester')||'';
 if(year&&!years.some(y=>y[0]===year))return {};
 if(semester&&(!year||![`S${Number(year)*2-1}`,`S${Number(year)*2}`].includes(semester)))return {year};
 return Object.fromEntries(['year','semester','department','subject','type','folder','view'].map(k=>[k,q.get(k)||'']));
}
export function inNotesScope(row,selection){return (!selection.year||String(row.year)===selection.year)&&(!selection.semester||row.semester===selection.semester)&&(!selection.department||row.department===selection.department);}
export function subjectDirectory(notes,folders,selection){
 const subjects=new Map();
 const add=name=>{if(!name)return;const base=baseSubject(name);const key=normalizeSubject(base);if(!subjects.has(key))subjects.set(key,{name:base,aliases:new Set([base]),count:0});return subjects.get(key);};
 folders.filter(f=>inNotesScope(f,selection)&&f.subject==='ROOT').forEach(f=>add(f.name));
 notes.filter(n=>inNotesScope(n,selection)).forEach(n=>{const item=add(n.subject);if(item){item.count++;item.aliases.add(baseSubject(n.subject));}});
 // Preserve exact stored spellings for the backend IN query while grouping dash variants.
 return [...subjects.values()].map(s=>({...s,aliases:[...s.aliases]})).sort((a,b)=>a.name.localeCompare(b.name));
}
export function subjectVariants(notes,folders,selection){
 const prefix=selection.type==='pyq'?'PYQ - ':selection.type==='video'?'Video - ':'';
 const wanted=normalizeSubject(prefix+(selection.subject||''));
 const values=[prefix+(selection.subject||'')];
 for(const row of [...notes,...folders])if(inNotesScope(row,selection)&&normalizeSubject(row.subject)===wanted)values.push(row.subject);
 return [...new Set(values)];
}
export function visibleSubjectFolders(notes,folders,selection){
 const wanted=normalizeSubject((selection.type==='pyq'?'PYQ - ':selection.type==='video'?'Video - ':'')+selection.subject);
 const linked=new Set(notes.filter(n=>inNotesScope(n,selection)&&normalizeSubject(n.subject)===wanted).map(n=>n.folder_id).filter(Boolean));
 return folders.filter(f=>f.subject!=='ROOT'&&f.name!=='Virtual Settings'&&((inNotesScope(f,selection)&&normalizeSubject(f.subject)===wanted)||linked.has(f.id))).sort((a,b)=>a.name.localeCompare(b.name));
}
