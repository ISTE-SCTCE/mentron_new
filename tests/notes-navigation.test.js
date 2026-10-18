import test from 'node:test';
import assert from 'node:assert/strict';
import {notesHref,readNotesSelection,subjectDirectory,subjectVariants,visibleSubjectFolders,inNotesScope} from '../src/core/notes-navigation.js';
const scope={year:'1',semester:'S1',department:'A'};
const notes=[
 {id:'1',year:1,semester:'S1',department:'A',subject:'Mathematics – 1',folder_id:null},
 {id:'2',year:1,semester:'S1',department:'A',subject:'PYQ - Mathematics - 1',folder_id:null},
 {id:'3',year:1,semester:'S1',department:'B',subject:'Mathematics - 1',folder_id:'shared'},
 {id:'4',year:2,semester:'S3',department:'CSE',subject:'Algorithms',folder_id:null},
];
const folders=[
 {id:'root',...scope,subject:'ROOT',name:'Mathematics - 1'},
 {id:'empty',...scope,subject:'ROOT',name:'Physics'},
 {id:'custom',...scope,subject:'Mathematics – 1',name:'Module 1'},
 {id:'virtual',...scope,subject:'PYQ - Mathematics - 1',name:'Virtual Settings'},
 {id:'shared',...scope,subject:'Mathematics - 1',name:'Shared notes'},
];
test('library links round-trip subjects, virtual types and browser history parameters',()=>{
 const selected={...scope,subject:'Circuits & Systems / 1',type:'pyq',folder:'folder-id'};
 assert.deepEqual(readNotesSelection(notesHref(selected)),{...selected,view:''});
 assert.equal(notesHref({}),'#/notes');
});
test('invalid year or year/semester combinations cannot open another academic scope',()=>{
 assert.deepEqual(readNotesSelection('#/notes?year=9'),{});
 assert.deepEqual(readNotesSelection('#/notes?year=1&semester=S8'),{year:'1'});
 assert.equal(inNotesScope(notes[3],scope),false);
});
test('live root folders and note subjects merge dash variants, retain empty subjects and count PYQs once',()=>{
 const result=subjectDirectory(notes,folders,scope);
 assert.equal(result.length,2);
 assert.equal(result[0].count,2);
 assert.deepEqual(new Set(result[0].aliases),new Set(['Mathematics - 1','Mathematics – 1']));
 assert.equal(result[1].name,'Physics');assert.equal(result[1].count,0);
});
test('virtual subject queries use actual backend spelling without including another group',()=>{
 assert.deepEqual(subjectVariants(notes,folders,{...scope,subject:'Mathematics – 1',type:'pyq'}),['PYQ - Mathematics – 1','PYQ - Mathematics - 1']);
 const result=visibleSubjectFolders(notes,folders,{year:'1',semester:'S1',department:'B',subject:'Mathematics - 1'});
 assert.deepEqual(result.map(x=>x.id),['shared']);
 assert.ok(!visibleSubjectFolders(notes,folders,{...scope,subject:'Mathematics - 1',type:'pyq'}).some(x=>x.name==='Virtual Settings'));
});
