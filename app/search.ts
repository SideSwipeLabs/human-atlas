import type {Atlas,Concept,SystemId} from './anatomy';

const STOP = new Set(['of','the','and','left','right']);
const COVERING_NAMES=new Set(['skin','hair of head','eyebrow','lip','pubic hair']);
const ALIAS:Record<string,string>={
 mitral:'mitral valve',bicuspid:'mitral valve',windpipe:'trachea','shoulder blade':'scapula',
 'thigh bone':'femur',ivc:'inferior vena cava',gullet:'esophagus',womb:'uterus',
};

export function searchAnatomy(atlas:Atlas,query:string,limit=80):Concept[]{
 const term=(ALIAS[query.toLowerCase().trim()]??query).toLowerCase().trim();
 if(!term){
  const names=['heart','brain','liver','stomach','spleen','pancreas','urinary bladder','trachea','left femur','left kidney','aorta','left lung','diaphragm','cerebellum','left eye'];
  return names.map(name=>atlas.concepts.find(c=>c.name.toLowerCase()===name)).filter((c):c is Concept=>!!c);
 }
 const scored: {c:Concept;score:number}[]=[];
 for(const c of atlas.concepts){
  if(COVERING_NAMES.has(c.name.toLowerCase()))continue;
  const name=c.name.toLowerCase();
  const id=c.id.toLowerCase();
  let score=Infinity;
  if(name===term||id===term)score=0;
  else if(id.replace(/^fma/,'')===term.replace(/^fma/,''))score=1;
  else if(name.split(/[\s,/-]+/).includes(term))score=8+Math.min(c.name.length,80)*0.02;
  else if(name.startsWith(term))score=10+Math.min(c.name.length,80)*0.02;
  else if(name.split(/[\s,/-]+/).some(word=>word.startsWith(term)&&!STOP.has(word)))score=20+Math.min(c.name.length,80)*0.02;
  else if(name.includes(term))score=40+Math.min(c.name.length,120)*0.03;
  else if(id.includes(term))score=55;
  if(!Number.isFinite(score))continue;
  if(/artery|vein|nerve|branch of/.test(name)&&score>1)score+=28;
  if(c.elements.length>120&&score>1)score+=40;
  else if(c.elements.length>24&&score>1)score+=Math.log2(c.elements.length);
  scored.push({c,score});
 }
 scored.sort((a,b)=>a.score-b.score||a.c.name.length-b.c.name.length||a.c.name.localeCompare(b.c.name));
 return scored.slice(0,limit).map(s=>s.c);
}

export function conceptSystem(atlas:Atlas,concept:Concept):SystemId|undefined{
 const first=atlas.parts.find(p=>p.id===concept.elements[0]);
 return first?.system;
}


