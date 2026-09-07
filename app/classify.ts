import type {Atlas,Concept,Part,SystemId} from './anatomy';

const BRAIN_VENTRICLE=/^(third ventricle|fourth ventricle|left lateral ventricle|right lateral ventricle|interventricular foramen)$/;
const HEART_PAPILLARY=/papillary muscle/;
const BRAIN_CORE=/thalamus|caudate nucle|putamen|globus pallidus|amygdala|fornix|corpus callosum|pons|medulla oblongata|midbrain|hypothalamus/;
const VESSEL=/artery|vein|duct|nerve|plexus/;
export const VISCERAL_SYSTEMS=new Set<SystemId>(['cardiac','digestive','urinary','respiratory','lymphatic','endocrine','reproductive']);

/** Correct source mis-tags so systems match what a student expects to see. */
export function displaySystem(part:Part):SystemId{
 const n=part.name.toLowerCase();
 if(BRAIN_VENTRICLE.test(n)||n.includes('choroid plexus'))return 'nervous';
 if(HEART_PAPILLARY.test(n)&&n.includes('ventricle'))return 'cardiac';
 if(n.includes('retinaculum')||n.includes('tendinous ring')||n.includes('tentorium'))return 'connective';
 if(n.includes('subscapularis')||n.includes('tensor fasciae latae')||n.includes('fibularis')||n.includes('peroneus')||n.includes('tibialis anterior')||n.includes('tibialis posterior')||n.includes('levator scapulae')||n.includes('pharyngeal constrictor')||n.includes('palatopharyngeus')||n.includes('salpingopharyngeus')||n.includes('stylopharyngeus'))return 'muscular';
 if(n.includes('lacrimal bone')||n.includes('inferior nasal concha'))return 'skeletal';
 if(n.includes('gingiva'))return 'connective';
 return part.system;
}

export function organLook(name:string,system?:SystemId):{color:number;roughness:number}|null{
 if(system==='arterial'||system==='venous')return null;
 const n=name.toLowerCase();
 if(VESSEL.test(n)&&!n.includes('ventricle')&&!n.includes('atrium'))return null;
 if(/\bliver\b/.test(n))return {color:0x8a4f32,roughness:.58};
 if(/\bkidney\b/.test(n)||(/\brenal\b/.test(n)&&!/gland|adrenal/.test(n)))return {color:0xa05a52,roughness:.55};
 if(n.includes('spleen'))return {color:0x8a3d52,roughness:.5};
 if(/cusp|leaflet of/.test(n))return {color:0xe8dcc8,roughness:.45};
 if(n.includes('pancreas'))return {color:0xd2b48c,roughness:.62};
 if(n==='stomach'||n.startsWith('stomach '))return {color:0xc9a07a,roughness:.55};
 if(n.includes('urinary bladder')||n==='bladder')return {color:0xd8c4a0,roughness:.5};
 if(n.includes('gallbladder'))return {color:0x6b9a5a,roughness:.48};
 if(n.includes('prostate'))return {color:0xc4a090,roughness:.55};
 if(n.includes('gingiva'))return {color:0xc9a090,roughness:.62};
 if(n.includes('cerebell'))return {color:0xd4a8b0,roughness:.58};
 if((BRAIN_CORE.test(n)||n.includes('cerebr')||n.includes('gyrus')||n.includes('sulcus of'))&&(!system||system==='nervous'))return {color:0xdeb6b6,roughness:.6};
 if((n.includes('wall of ventricle')||n.includes('wall of left atrium')||n.includes('wall of right atrium')||n.includes('myocardium')||n.includes('papillary muscle'))&&!n.includes('cavity'))return {color:0x8b2e36,roughness:.48};
 if(/cavity of (left|right) (ventricle|atrium)/.test(n))return {color:0x5c1820,roughness:.4};
 return null;
}

function idsNamed(atlas:Atlas,test:(p:Part)=>boolean){
 return atlas.parts.filter(test).map(p=>p.id);
}

/** Large FMA concepts keep the organ a student means, not every twig. */
export function focusElements(atlas:Atlas,concept:Concept){
 const name=concept.name.toLowerCase();
 const byId=new Map(atlas.parts.map(p=>[p.id,p]));
 if(name==='heart'){
  return idsNamed(atlas,p=>{
   const n=p.name.toLowerCase();
   return displaySystem(p)==='cardiac'||n==='wall of ventricle'||(n.includes('papillary muscle')&&n.includes('ventricle'));
  });
 }
 if(name.endsWith(' side of heart')){
  const left=name.includes('left');
  const pool=new Set(concept.elements);
  return idsNamed(atlas,p=>{
   const n=p.name.toLowerCase();
   if(!(pool.has(p.id)||displaySystem(p)==='cardiac'))return false;
   if(!(displaySystem(p)==='cardiac'||n.includes('papillary muscle')))return false;
   if(n.includes('left'))return left;
   if(n.includes('right'))return !left;
   return n.includes('wall of ventricle')||n.includes('septal');
  });
 }
 if(name==='brain'){
  const ids=new Set(concept.elements);
  for(const p of atlas.parts)if(BRAIN_CORE.test(p.name.toLowerCase())||BRAIN_VENTRICLE.test(p.name.toLowerCase()))ids.add(p.id);
  return [...ids];
 }
 if(name.includes('liver')){
  const core=concept.elements.filter(id=>{const p=byId.get(id);return p&&displaySystem(p)==='digestive';});
  return core.length?core:concept.elements;
 }
 if(name.includes('lung')){
  const core=concept.elements.filter(id=>{const p=byId.get(id);return p&&displaySystem(p)==='respiratory';});
  return core.length?core:concept.elements;
 }
 if(name.includes('kidney')){
  const core=concept.elements.filter(id=>{const p=byId.get(id);return p&&(displaySystem(p)==='urinary'||nIncludes(p,'kidney'));});
  return core.length?core:concept.elements;
 }
 if(concept.elements.length<=16)return concept.elements;
 const parts=concept.elements.map(id=>byId.get(id)).filter((p):p is Part=>!!p);
 const counts=new Map<SystemId,number>();
 for(const p of parts)counts.set(displaySystem(p),(counts.get(displaySystem(p))??0)+1);
 let primary:SystemId=displaySystem(parts[0]),best=0;
 counts.forEach((n,id)=>{if(n>best){best=n;primary=id;}});
 const core=parts.filter(p=>displaySystem(p)===primary);
 return core.length>=3&&core.length<parts.length?core.map(p=>p.id):concept.elements;
}

function nIncludes(p:Part,s:string){return p.name.toLowerCase().includes(s);}

/** Clicking a wall or lobe should open the organ a student means. */
export function promoteConcept(atlas:Atlas,part:Part):Concept|undefined{
 const n=part.name.toLowerCase();
 const named=(name:string)=>atlas.concepts.find(c=>c.name.toLowerCase()===name);
 if(/wall of ventricle|wall of (left|right) atrium|cavity of (left|right) (ventricle|atrium)|cusp of|leaflet of|papillary muscle of/.test(n))return named('heart');
 if(/lobe of liver|caudate lobe of liver/.test(n))return named('liver');
 return undefined;
}
