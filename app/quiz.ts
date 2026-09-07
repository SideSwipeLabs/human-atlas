import type {Atlas,Part,SystemId} from './anatomy';
import {displaySystem} from './classify';
import {isCovering,tissueOf} from './tissue';

const SKIP=/branch of|tributary|set of |twig|proper palmar|dorsal digital|segmental/;

export function quizPool(atlas:Atlas,visible:SystemId[],hidden:string[]){
 const hide=new Set(hidden);
 return atlas.parts.filter(p=>{
  if(hide.has(p.id)||isCovering(tissueOf(p)))return false;
  if(!visible.includes(displaySystem(p)))return false;
  if(p.vertexCount<120)return false;
  return !SKIP.test(p.name.toLowerCase());
 });
}

export function pickQuiz(pool:Part[],seen:string[]){
 const avoid=new Set(seen);
 const fresh=pool.filter(p=>!avoid.has(p.name));
 const list=fresh.length?fresh:pool;
 if(!list.length)return null;
 return list[Math.floor(Math.random()*list.length)];
}

export function quizMatch(target:string,hit:string){
 const a=target.toLowerCase(),b=hit.toLowerCase();
 if(a===b)return true;
 const strip=(s:string)=>s.replace(/^(left|right)\s+/,'');
 return strip(a)===strip(b);
}
