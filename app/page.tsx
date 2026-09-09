'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight, RotateCcw, ArrowRight, Eye, Shuffle, Layers, CircleCheck, Sparkles, NotebookPen, CircleHelp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { words, passages, suneungUnits, sourceLabel, scopeLabel, scopeWords, shuffle, makeQuiz, readLearning, STORAGE_KEY, type Learning, type Status, type Question, type Word } from '@/lib/study';
import { documentContext, registerStudyTool } from '@/lib/webmcp';

type Mode='cards'|'quiz'|'review';
type Answer={id:string;chosen:string;correct:boolean};
const wordById=new Map(words.map(w=>[w.id,w]));

export default function Home(){
 const [mode,setMode]=useState<Mode>('cards');
 const [scope,setScope]=useState('all');
 const [learning,setLearning]=useState<Learning>({});
 const [ready,setReady]=useState(false);
 const [storageError,setStorageError]=useState(false);
 const [deck,setDeck]=useState(words.map(w=>w.id));
 const [index,setIndex]=useState(0);
 const [revealed,setRevealed]=useState(false);
 const [done,setDone]=useState(false);
 const [notice,setNotice]=useState('');
 const [quiz,setQuiz]=useState<Question[]|null>(null);
 const [quizIndex,setQuizIndex]=useState(0);
 const [answers,setAnswers]=useState<Answer[]>([]);
 const [quizDone,setQuizDone]=useState(false);
 const answerLock=useRef(false);
 const areaRef=useRef<HTMLElement>(null);
 const selected=useMemo(()=>scopeWords(scope),[scope]);
 const reviewWords=selected.filter(w=>learning[w.id]==='review');
 const known=selected.filter(w=>learning[w.id]==='known').length;
 const totalKnown=words.filter(w=>learning[w.id]==='known').length;
 const word=wordById.get(deck[index]);
 const question=quiz?.[quizIndex];
 const answer=answers[quizIndex];
 const correct=answers.filter(a=>a.correct).length;
 const snapshot=useRef({scope,total:selected.length,known,review:reviewWords.length,currentWord:word?.en??null});
 snapshot.current={scope,total:selected.length,known,review:reviewWords.length,currentWord:word?.en??null};

 useEffect(()=>{try{setLearning(readLearning(localStorage.getItem(STORAGE_KEY)))}catch{setStorageError(true)}setReady(true)},[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,words:learning}));setStorageError(false)}catch{setStorageError(true)}},[learning,ready]);
 useEffect(()=>registerStudyTool(documentContext(),()=>snapshot.current),[]);

 function resetCards(ids:string[]){setDeck(ids);setIndex(0);setRevealed(false);setDone(false);setNotice('')}
 function switchMode(next:Mode){setMode(next);resetCards((next==='review'?reviewWords:selected).map(w=>w.id));}
 function changeScope(next:string){setScope(next);const pool=scopeWords(next);resetCards((mode==='review'?pool.filter(w=>learning[w.id]==='review'):pool).map(w=>w.id));setQuiz(null);setAnswers([]);setQuizDone(false)}
 function record(id:string,status:Status){if(!ready)return;setLearning(prev=>({...prev,[id]:status}))}
 function advance(){setRevealed(false);if(index+1>=deck.length)setDone(true);else setIndex(i=>i+1)}
 function mark(status:Status){if(!word||!revealed||!ready)return;record(word.id,status);setNotice(`${word.en} · ${status==='known'?'외운 단어로 표시했어요.':'복습 목록에 담았어요.'}`);advance()}
 function move(delta:number){setIndex(i=>Math.max(0,Math.min(deck.length-1,i+delta)));setRevealed(false);setNotice('')}
 function startQuiz(pool=selected){setQuiz(makeQuiz(pool));setQuizIndex(0);setAnswers([]);setQuizDone(false);answerLock.current=false;setMode('quiz');setNotice('')}
 function choose(value:string){if(!question||answerLock.current||answer||quizDone||!ready)return;answerLock.current=true;const isCorrect=value===question.word.ko;setAnswers(prev=>[...prev,{id:question.word.id,chosen:value,correct:isCorrect}]);record(question.word.id,isCorrect?'known':'review')}
 function nextQuestion(){if(!quiz||!answer)return;if(quizIndex+1===quiz.length)setQuizDone(true);else {setQuizIndex(i=>i+1);answerLock.current=false}}
 function shuffleCards(){resetCards(shuffle((mode==='review'?reviewWords:selected).map(w=>w.id)));setNotice('단어 순서를 섞었어요.')}

 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const target=e.target as HTMLElement; if(e.ctrlKey||e.altKey||e.metaKey||e.repeat||target.closest('button,input,select,textarea,[role="combobox"],[role="tab"],[data-slot="select-content"]'))return;
 if((mode==='cards'||mode==='review')&&word&&!done){if(e.code==='Space'){e.preventDefault();setRevealed(v=>!v)}else if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}else if(e.key==='ArrowRight'){e.preventDefault();move(1)}}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)});

 function Context({item}:{item:Word}){return <div className="context"><span className="eyebrow">지문 속 표현</span><p lang="en">{item.excerpt}</p>{item.note&&<p className="word-note"><CircleHelp size={16}/><span>{item.note}</span></p>}</div>}

 function Cards({review=false}:{review?:boolean}){
  if(!deck.length)return <Empty className="empty-state"><EmptyHeader><CircleCheck size={42}/><EmptyTitle className="empty-title">복습할 단어가 아직 없어요</EmptyTitle><EmptyDescription>암기 카드에서 ‘한 번 더’를 누르거나 퀴즈에서 틀리면 여기에 모여요.</EmptyDescription></EmptyHeader><button className="action primary" onClick={()=>switchMode('cards')}>암기 카드로 가기<ArrowRight size={18}/></button></Empty>;
  if(done)return <div className="completion"><span className="completion-icon"><CircleCheck size={36}/></span><p className="eyebrow">한 번의 복습, 한 걸음 더</p><h3>{deck.length}개 단어를 끝까지 봤어요.</h3><p>이 범위에서 외운 단어는 {known}개,<br/>다시 볼 단어는 {reviewWords.length}개예요.</p><div className="completion-actions"><button className="action secondary" onClick={()=>resetCards((review?reviewWords:selected).map(w=>w.id))}><RotateCcw size={18}/>{review?'남은 단어 복습':'처음부터 다시'}</button><button className="action primary" onClick={()=>startQuiz()}>퀴즈로 확인하기<ArrowRight size={18}/></button></div></div>;
  if(!word)return null;
  return <><div className="deck-tools"><span>{review?'다시 보면 내 단어가 돼요.':'뜻을 먼저 떠올려보세요.'}</span><button className="text-button" onClick={shuffleCards}><Shuffle size={15}/>순서 섞기</button></div><div className="study-card"><div className="card-meta"><span className="passage-badge">{sourceLabel(word.q)} · {word.topic}</span><span>{String(index+1).padStart(2,'0')} <span className="counter-divider">/ {deck.length}</span></span></div><button className="flip-surface" onClick={()=>setRevealed(v=>!v)} aria-label={`${word.en} 뜻 ${revealed?'가리기':'보기'}`} aria-expanded={revealed}><span className="part">{word.pos}</span><strong className="headword" lang="en">{word.en}</strong>{revealed?<span className="meaning">{word.ko}</span>:<span className="reveal-prompt"><Eye size={18}/>눌러서 뜻 확인하기</span>}</button><Context item={word}/></div><div className="card-actions"><button className="action secondary" disabled={!revealed||!ready} onClick={()=>mark('review')}><RotateCcw size={18}/>한 번 더</button><button className="action primary" disabled={!revealed||!ready} onClick={()=>mark('known')}><Check size={19}/>외웠어요</button></div><div className="card-nav"><button className="text-button" onClick={()=>move(-1)} disabled={index===0}><ChevronLeft size={18}/>이전</button><span className="keyboard-hint"><kbd>Space</kbd> 뜻 보기 <span>·</span> <kbd>←</kbd><kbd>→</kbd> 이동</span><button className="text-button" onClick={()=>{setNotice('');advance()}}>다음<ChevronRight size={18}/></button></div></>;
 }
 function Quiz(){
  if(!quiz)return <div className="quiz-intro"><span className="completion-icon"><NotebookPen size={32}/></span><p className="eyebrow">기억을 꺼내는 연습</p><h3>뜻을 얼마나 기억하고 있을까?</h3><p>선택한 지문에서 무작위 {Math.min(10,selected.length)}문제.<br/>틀린 단어는 복습 목록에 모아둘게요.</p><button className="action primary" disabled={!ready} onClick={()=>startQuiz()}>퀴즈 시작<ArrowRight size={18}/></button></div>;
  if(quizDone){const missed=answers.filter(a=>!a.correct).map(a=>wordById.get(a.id)!);return <div className="quiz-result"><div className="score-heading"><Sparkles size={25}/><p>이번 퀴즈 결과</p><h3>{correct}<span> / {quiz.length}</span></h3><p>{missed.length?`${missed.length}개만 한 번 더 보면 돼요.`:'모두 맞혔어요. 잘 기억하고 있네요!'}</p></div>{missed.length>0&&<div className="missed-words">{missed.map(w=><div key={w.id}><span><strong lang="en">{w.en}</strong><small>{sourceLabel(w.q)}</small></span><span>{w.ko}</span></div>)}</div>}<div className="completion-actions"><button className="action secondary" onClick={()=>startQuiz()}>새 퀴즈 풀기</button>{missed.length>0?<button className="action primary" onClick={()=>{setMode('review');resetCards(missed.map(w=>w.id))}}>틀린 단어 복습<ArrowRight size={18}/></button>:<button className="action primary" onClick={()=>switchMode('cards')}>암기 카드로 가기</button>}</div></div>}
  if(!question)return null;
  return <><div className="deck-tools"><span>{quizIndex+1} / {quiz.length}문제</span><span>정답 {correct}개</span></div><Progress value={(answers.length/quiz.length)*100} aria-label="퀴즈 진행률" className="quiz-progress"/><div className="quiz-question"><span className="passage-badge">{sourceLabel(question.word.q)} · {question.word.pos}</span><h3 className="headword" lang="en">{question.word.en}</h3><p>지문에서 쓰인 뜻을 골라주세요.</p></div><div className="options">{question.options.map((option,i)=><button key={option} disabled={Boolean(answer)||!ready} className={`quiz-option ${answer?(option===question.word.ko?'is-correct':option===answer.chosen?'is-wrong':'is-muted'):''}`} onClick={()=>choose(option)}><span className="option-number">{i+1}</span><span>{option}</span>{answer&&option===question.word.ko&&<Check size={19}/>}</button>)}</div>{answer&&<div className="answer-feedback" role="status"><p className={answer.correct?'correct-label':'wrong-label'}>{answer.correct?'정답이에요!':'다시 기억해두세요.'} <strong>{question.word.en} = {question.word.ko}</strong></p><Context item={question.word}/><button className="action primary" onClick={nextQuestion}>{quizIndex+1===quiz.length?'결과 보기':'다음 문제'}<ArrowRight size={18}/></button></div>}</>;
 }

 return <main className="site-shell"><header className="masthead"><a className="brand" href="./"><span className="brand-icon"><BookOpen size={21}/></span>단어 한 장<span className="brand-sub">영어Ⅱ</span></a><span className="edition">영어Ⅱ · 시험 대비</span></header>
  <div className="workspace"><aside className="passage-rail"><p className="eyebrow">MY STUDY NOTES</p><h1>지문에서 고른<br/>오늘의 단어.</h1><p className="rail-description">교과서 + 모의고사 + 수능특강<br/>{words.length}개 단어와 숙어</p><div className="range-picker"><label id="range-label">공부할 지문</label><Select value={scope} onValueChange={v=>{if(v)changeScope(String(v))}}><SelectTrigger className="range-trigger" aria-labelledby="range-label"><SelectValue>{scopeLabel(scope)}</SelectValue></SelectTrigger><SelectContent alignItemWithTrigger={false} className="range-content"><SelectItem value="all">전체 범위 · {words.length}개</SelectItem><SelectItem value="textbook">교과서 전체 · {scopeWords("textbook").length}개</SelectItem><SelectItem value="exam">모의고사 전체 · {scopeWords("exam").length}개</SelectItem><SelectItem value="suneung">수능특강 전체 · {scopeWords("suneung").length}개</SelectItem>{suneungUnits.map(unit=><SelectItem key={unit} value={`suneung-unit-${unit}`}>수특 {unit}강 전체 · {scopeWords(`suneung-unit-${unit}`).length}개</SelectItem>)}{passages.map(p=><SelectItem key={p.q} value={String(p.q)}>{sourceLabel(p.q)} · {p.words.length}개</SelectItem>)}</SelectContent></Select></div><div className="mastery-block"><div className="mastery-label"><span>전체 암기 현황</span><span><strong>{totalKnown}</strong> / {words.length}</span></div><Progress value={totalKnown/words.length*100} aria-label="전체 암기율"/><p>{totalKnown===words.length?`${words.length}개 모두 외웠어요!`:`아직 ${words.length-totalKnown}개, 한 장씩 채워가요.`}</p></div><div className="rail-callout"><Layers size={20}/><p>단어만 외우기보다<br/><strong>지문 속 표현</strong>을 함께 읽어요.</p></div><p className="scope-note">능률 오선영 영어Ⅱ 1·3과,<br/>모의고사와 수능특강 시험 범위.<br/>같은 단어도 출처별로 복습해요.</p></aside>
  <section className="study-area" ref={areaRef}><div className="section-top"><h2>{mode==='quiz'?'기억 확인하기':mode==='review'?'한 번 더, 복습':'단어 암기'}</h2><span className="subtle">{scopeLabel(scope)} · {selected.length}개</span></div><Tabs value={mode} onValueChange={v=>switchMode(v as Mode)}><TabsList className="mode-tabs" aria-label="학습 방식"><TabsTrigger value="cards"><Layers size={16}/>암기 카드</TabsTrigger><TabsTrigger value="quiz"><NotebookPen size={16}/>퀴즈</TabsTrigger><TabsTrigger value="review"><RotateCcw size={16}/>복습<span className="count-badge">{reviewWords.length}</span></TabsTrigger></TabsList><div className="scope-stats"><span><i className="dot known"/>외웠어요 <strong>{known}</strong></span><span><i className="dot review"/>한 번 더 <strong>{reviewWords.length}</strong></span><span><i className="dot unseen"/>아직 안 봄 <strong>{selected.length-known-reviewWords.length}</strong></span></div><TabsContent value="cards"><Cards/></TabsContent><TabsContent value="quiz"><Quiz/></TabsContent><TabsContent value="review"><Cards review/></TabsContent></Tabs><p className="notice" aria-live="polite">{notice}</p><p className={`storage-note ${storageError?'storage-warning':''}`}>{storageError?'이 브라우저에서 기록을 저장하지 못했어요. 지금 공부는 가능하지만 새로고침하면 기록이 사라질 수 있어요.':'학습 기록은 이 기기의 브라우저에 저장돼요.'}</p></section></div><footer className="page-footer"><span>내신 준비, 한 장씩.</span><span>영어Ⅱ · 나만의 단어장</span></footer></main>;
}
