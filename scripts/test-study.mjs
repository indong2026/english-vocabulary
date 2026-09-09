import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

async function loadTs(path){let source=await readFile(new URL(path,import.meta.url),'utf8');if(path.endsWith('study.ts'))source=source.replace("import passages from './vocabulary.json';",`const passages=${await readFile(new URL('../lib/vocabulary.json',import.meta.url),'utf8')};`);const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)}
const {words,passages,makeQuiz,readLearning,scopeWords,sourceLabel,scopeLabel,suneungUnits}=await loadTs('../lib/study.ts');
assert.equal(words.length,424);assert.equal(new Set(words.map(w=>w.id)).size,424);assert.equal(new Set(words.map(w=>`${w.q}:${w.en}`)).size,424);
assert.deepEqual(passages.slice(0,18).map(p=>p.q),[21,22,23,24,29,30,31,32,33,34,35,36,37,38,39,40,'lesson-1','lesson-3']);
assert.equal(passages.length,45);assert.deepEqual(suneungUnits,['1','13','15','21','23','26','27','29']);
for(const p of passages)assert.equal(scopeWords(String(p.q)).length,p.words.length);
assert.equal(scopeWords('exam').length,128);assert.equal(scopeWords('textbook').length,80);assert.equal(scopeWords('lesson-1').length,48);assert.equal(scopeWords('lesson-3').length,32);
assert.equal(scopeWords('suneung').length,216);assert.equal(scopeWords('suneung-unit-1').length,32);assert.equal(scopeWords('suneung-unit-13').length,32);assert.equal(scopeWords('suneung-unit-29').length,24);assert.equal(scopeWords('suneung-13-1').length,8);
assert.equal(sourceLabel('suneung-13-1'),'수특 13강 1번');assert.equal(scopeLabel('suneung-unit-13'),'수특 13강 전체');
for(const scope of ['all','exam','textbook','suneung',...suneungUnits.map(u=>`suneung-unit-${u}`),...passages.map(p=>String(p.q))])for(let n=0;n<3;n++){const pool=scopeWords(scope),quiz=makeQuiz(pool);assert.equal(quiz.length,Math.min(10,pool.length));assert.equal(new Set(quiz.map(q=>q.word.id)).size,quiz.length);assert.equal(new Set(quiz.map(q=>q.word.en)).size,quiz.length);for(const q of quiz){assert.ok(pool.some(w=>w.id===q.word.id));assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.options.filter(x=>x===q.word.ko).length,1)}}
assert.deepEqual(makeQuiz([]),[]);
for(const raw of [null,'{bad','null','[]','{"version":2,"words":{}}'])assert.deepEqual(readLearning(raw),{});
assert.deepEqual(readLearning(JSON.stringify({version:1,words:{'21-0':'known','30-4':'review','bad-id':'known','21-1':'invalid'}})),{'21-0':'known','30-4':'review'});
const saved={'21-0':'known','39-2':'review'};assert.deepEqual(readLearning(JSON.stringify({version:1,words:saved})),saved);
const mixed={...saved,'lesson-1-10':'review','lesson-3-31':'known','suneung-13-1-6':'known','suneung-27-2-5':'review'};assert.deepEqual(readLearning(JSON.stringify({version:1,words:mixed})),mixed);
assert.match(words.find(w=>w.id==='suneung-27-2-5').note,/문맥 교정/);assert.match(words.find(w=>w.id==='suneung-26-3-0').note,/보기가 누락/);assert.match(words.find(w=>w.id==='suneung-13-1-6').note,/④ purposefulness/);
const {registerStudyTool}=await loadTs('../lib/webmcp.ts');let tool,signal;const snapshot={scope:'all',total:128,known:1,review:1,currentWord:'flexible'};
const cleanup=registerStudyTool({registerTool(t,o){tool=t;signal=o.signal}},()=>snapshot);
assert.equal(tool.name,'get_vocabulary_study_progress');assert.equal(tool.annotations.readOnlyHint,true);assert.deepEqual(tool.execute({}),snapshot);assert.throws(()=>tool.execute({unexpected:true}));cleanup();assert.equal(signal.aborted,true);registerStudyTool(undefined,()=>snapshot)();
console.log('PASS: 424 entries; 45 passage scopes; textbook, exam and Suneung groups isolated; 8 Suneung units; 171 randomized quizzes; old/new learning records preserved; correction and missing-source notes retained.');
