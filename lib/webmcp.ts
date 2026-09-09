export type StudySnapshot = {scope:string;total:number;known:number;review:number;currentWord:string|null};
type Tool={name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type Context={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export function registerStudyTool(context:Context|undefined,snapshot:()=>StudySnapshot){
 if(!context?.registerTool)return ()=>{};
 const lifecycle=new AbortController();
 try{void Promise.resolve(context.registerTool({name:'get_vocabulary_study_progress',title:'단어 학습 현황 확인',description:'현재 지문 범위, 전체·암기·복습 단어 수와 보고 있는 단어를 읽습니다. 학습 기록은 변경하지 않습니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('빈 객체를 입력하세요.');return snapshot()}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
 return ()=>lifecycle.abort();
}
export function documentContext():Context|undefined{return typeof document==='undefined'?undefined:(document as Document & {modelContext?:Context}).modelContext}
