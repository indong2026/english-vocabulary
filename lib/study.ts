import passages from './vocabulary.json';

export type Word = {id:string;q:number|string;topic:string;en:string;ko:string;pos:string;excerpt:string;note?:string};
export type Status = 'known'|'review';
export type Learning = Record<string,Status>;
const notes:Record<string,string> = {
 '30-4':'출제 주의 · 원문에서는 문맥상 틀린 낱말이에요. reluctant는 “꺼리는”이라는 뜻이며, 글의 흐름에는 willing(기꺼이 하는)이 맞아요.',
 '31-6':'빈칸 앞에 쓰인 부사예요. 정답을 넣으면 permanently settle(영구적으로 정착하다)이 돼요.',
 '35-6':'이 지문에서 property는 “재산”이 아니라 물체의 “속성”이라는 뜻이에요.',
 '40-7':'for its own sake는 보상이나 평판 때문이 아니라, 그 일 자체를 위해 한다는 뜻이에요.',
 'lesson-1-10':'이 본문에서 contract는 “계약하다”가 아니라 “병에 걸리다”라는 동사예요.',
 'lesson-1-25':'bacteria는 복수형이고 단수형은 bacterium이에요.',
 'lesson-1-32':'subject는 여기서 “주제”나 “과목”이 아니라 백신 시험의 “실험 대상자”예요.',
 'lesson-1-39':'secure는 이 표현에서 “안전한”이라는 형용사가 아니라 자금을 “확보하다”라는 동사예요.',
 'lesson-3-13':'matter는 여기서 “문제”라는 명사가 아니라 “중요하다”라는 동사예요.',
 'lesson-3-15':'AV 방식의 첫 투표에서 이기려면 정확히 50%가 아니라 50%를 초과하는 표가 필요해요.',
 'lesson-3-31':'weigh는 여기서 무게를 재는 것이 아니라 장단점을 “신중히 따져 보다”라는 뜻이에요.',
};
export const words:Word[] = passages.flatMap(p=>p.words.map(([en,ko,pos,excerpt,wordNote],i)=>({id:`${p.q}-${i}`,q:p.q,topic:p.topic,en,ko,pos,excerpt,note:notes[`${p.q}-${i}`]??wordNote??('note' in p && typeof p.note==='string'?p.note:undefined)})));
export const validIds = new Set(words.map(w=>w.id));
export { passages };
export const STORAGE_KEY = 'english-ii-vocab-2026-09-v1';
export function readLearning(raw:string|null):Learning {
  if(!raw)return {};
  try {const data=JSON.parse(raw); if(!data||data.version!==1||!data.words||typeof data.words!=='object'||Array.isArray(data.words))return {};
    return Object.fromEntries(Object.entries(data.words).filter(([id,s])=>validIds.has(id)&&(s==='known'||s==='review'))) as Learning;
  }catch{return {}}
}
export function shuffle<T>(items:readonly T[],random:()=>number=Math.random):T[]{const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
export const suneungUnits=[...new Set(passages.filter(p=>String(p.q).startsWith('suneung-')).map(p=>String(p.q).split('-')[1]))];
export function sourceLabel(q:number|string):string{const match=String(q).match(/^suneung-(\d+)-(\d+)$/);return match?`수특 ${match[1]}강 ${match[2]}번`:q==='lesson-1'?'교과서 1과':q==='lesson-3'?'교과서 3과':`모의고사 ${q}번`}
export function scopeLabel(q:string):string{const unit=q.match(/^suneung-unit-(\d+)$/);return unit?`수특 ${unit[1]}강 전체`:q==='all'?'전체 범위':q==='textbook'?'교과서 전체':q==='exam'?'모의고사 전체':q==='suneung'?'수능특강 전체':sourceLabel(q)}
export function scopeWords(q:string):Word[]{const unit=q.match(/^suneung-unit-(\d+)$/);return unit?words.filter(w=>String(w.q).startsWith(`suneung-${unit[1]}-`)):q==='all'?words:q==='textbook'?words.filter(w=>String(w.q).startsWith('lesson-')):q==='exam'?words.filter(w=>typeof w.q==='number'):q==='suneung'?words.filter(w=>String(w.q).startsWith('suneung-')):words.filter(w=>String(w.q)===q)}
export type Question={word:Word;options:string[]};
export function makeQuiz(pool:Word[],random:()=>number=Math.random):Question[]{
 const seen=new Set<string>();
 return shuffle(pool,random).filter(word=>{if(seen.has(word.en))return false;seen.add(word.en);return true}).slice(0,10).map(word=>{
   const others=shuffle(words.filter(w=>w.id!==word.id&&w.en!==word.en&&w.ko!==word.ko),random);
   const same=others.filter(w=>w.pos===word.pos),rest=others.filter(w=>w.pos!==word.pos);
   const distractors=[...new Set([...same,...rest].map(w=>w.ko))].slice(0,3);
   return {word,options:shuffle([word.ko,...distractors],random)};
 });
}
