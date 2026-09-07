import {flushSync} from 'react-dom';
import {registerAtlasTools} from './agent-tools';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Activity,ArrowUpFromLine,ArrowUpRight,Copy,Eye,EyeOff,Focus,GraduationCap,Info,Layers3,Link2,Move,Pause,PersonStanding,RotateCcw,RotateCw,Scan,Search,Tag,Undo2,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Sheet,SheetContent,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Combobox,ComboboxInput,ComboboxContent,ComboboxList,ComboboxItem,ComboboxEmpty} from '@/components/ui/combobox';
import AnatomyScene from './scene';
import {DEFAULT_VISIBLE,SYSTEMS,fmaUrl,type Atlas,type Concept,type SceneState,type SystemId,type View} from './anatomy';
import {searchAnatomy,conceptSystem} from './search';
import {parseHash,serializeHash} from './url-state';
import {buildConceptIndex,relatedConcepts} from './related';
import {factFor,COVERAGE} from './knowledge';
import {DISSECTION,REGIONS,CLIP_PLANES} from './dissection';
import {POSE_PRESETS,REST_POSE,poseIsRest,type PoseState} from './pose';
import {displaySystem,focusElements,promoteConcept,VISCERAL_SYSTEMS} from './classify';
import {isCovering,tissueOf} from './tissue';
import {attachmentFor} from './attach';
import {pickQuiz,quizMatch,quizPool} from './quiz';

const initial:SceneState={visible:DEFAULT_VISIBLE,selected:[],hidden:[],isolate:false,view:'three-quarter',rotate:false,reset:0,xray:false,clip:0,skin:0,plane:'transverse',labels:false,region:'full',pose:{...REST_POSE},dissect:false,extractNonce:0,returnNonce:0,returnAllNonce:0};
type Drawer='layers'|'pose'|null;

function sliderValue(v:number|readonly number[]){return typeof v==='number'?v:v[0];}

export default function Home(){
 const detailTitle=useRef<HTMLHeadingElement>(null);
 const appliedHash=useRef(false);
 const [atlas,setAtlas]=useState<Atlas|null>(null),[state,setState]=useState(initial),[progress,setProgress]=useState(0),[error,setError]=useState(''),[drawer,setDrawer]=useState<Drawer>(null),[searchOpen,setSearchOpen]=useState(false),[details,setDetails]=useState(false),[about,setAbout]=useState(false),[query,setQuery]=useState(''),[chosen,setChosen]=useState<Concept|null>(null),[copied,setCopied]=useState(false),[pulled,setPulled]=useState(0);
 const [coach,setCoach]=useState(false);
 const [quiz,setQuiz]=useState<{name:string;ok:number;miss:number;seen:string[];note:string}|null>(null);
 useEffect(()=>{
  const abort=new AbortController();
  setProgress(0);setError('');setAtlas(null);setChosen(null);setDetails(false);appliedHash.current=false;
  fetch('/models/atlas.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('The anatomy catalogue could not be loaded.');return r.json();}).then(data=>{
   const next=data as Atlas;
   const parsed=parseHash(location.hash);
   const nextState:SceneState={
    ...initial,
    visible:parsed.systems??DEFAULT_VISIBLE,
    view:parsed.view??'three-quarter',
    xray:parsed.xray??false,
    clip:parsed.clip??0,
    isolate:parsed.isolate??false,
    plane:parsed.plane??'transverse',
    pose:parsed.pose?{...parsed.pose}:{...REST_POSE},
    region:parsed.region??'full',
    reset:parsed.view||parsed.region?1:0,
   };
   let nextChosen:Concept|null=null;
   if(parsed.concept){
    const concept=next.concepts.find(c=>c.id===parsed.concept);
    if(concept){nextChosen=concept;nextState.selected=focusElements(next,concept);}
   }else if(parsed.part){
    const part=next.parts.find(p=>p.id===parsed.part);
    if(part){nextChosen={id:part.conceptId,name:part.name,elements:[part.id]};nextState.selected=[part.id];}
   }
   appliedHash.current=true;
   setAtlas(next);setState(nextState);setChosen(nextChosen);if(nextChosen)setDetails(true);
  }).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
  return()=>abort.abort();
 },[]);
 const parts=useMemo(()=>new Map(atlas?.parts.map(p=>[p.id,p])),[atlas]);
 const conceptIndex=useMemo(()=>atlas?buildConceptIndex(atlas):new Map(),[atlas]);
 const counts=useMemo(()=>Object.fromEntries(SYSTEMS.map(s=>[s.id,atlas?.parts.filter(p=>displaySystem(p)===s.id).length??0])),[atlas]);
 const activeSystems=SYSTEMS.filter(s=>counts[s.id]>0);
 const selectedParts=state.selected.map(id=>parts.get(id)).filter(p=>!!p),selected=selectedParts[0],system=SYSTEMS.find(s=>s.id===(selected?displaySystem(selected):undefined));
 const visibleCount=atlas?.parts.filter(p=>isCovering(tissueOf(p))?false:state.hidden.includes(p.id)?false:state.isolate?state.selected.includes(p.id):state.visible.includes(displaySystem(p))||state.selected.includes(p.id)).length??0;
 const results=useMemo(()=>atlas?searchAnatomy(atlas,query):[],[atlas,query]);
 const related=useMemo(()=>relatedConcepts(conceptIndex,state.selected,chosen?.id),[conceptIndex,state.selected,chosen?.id]);
 const hiddenParts=state.hidden.map(id=>parts.get(id)).filter(p=>!!p);
 const hasSelection=state.selected.length>0;
 const attach=atlas&&selected?attachmentFor(atlas,selected):null;
 const choose=(c:Concept)=>{if(!atlas)return;const elements=focusElements(atlas,c);const buried=elements.some(id=>{const p=atlas.parts.find(part=>part.id===id);return !!p&&(VISCERAL_SYSTEMS.has(displaySystem(p))||displaySystem(p)==='nervous');});setChosen(c);setState(s=>({...s,selected:elements,isolate:false,rotate:false,xray:buried||s.xray}));setDetails(true);setSearchOpen(false);setDrawer(null);};
 useEffect(()=>{if(!atlas)return;return registerAtlasTools(atlas,c=>flushSync(()=>choose(c)));},[atlas]);
 useEffect(()=>{try{setCoach(!localStorage.getItem('atlas-coached'));}catch{/* ignore */}},[]);
 useEffect(()=>{if(!coach)return;const t=window.setTimeout(()=>{try{localStorage.setItem('atlas-coached','1');}catch{/* ignore */}setCoach(false);},14000);return()=>window.clearTimeout(t);},[coach]);
 const startQuiz=()=>{
  if(!atlas)return;
  const pool=quizPool(atlas,state.visible,state.hidden);
  const target=pickQuiz(pool,[]);
  if(!target)return;
  setQuiz({name:target.name,ok:0,miss:0,seen:[target.name],note:'Tap the named structure on the body.'});
  setDrawer(null);setSearchOpen(false);setDetails(false);setChosen(null);
  setState(s=>({...s,selected:[],isolate:false,rotate:false,dissect:false}));
 };
 const choosePart=(id:string)=>{
  const p=parts.get(id);if(!p||!atlas)return;
  if(quiz){
   const ok=quizMatch(quiz.name,p.name);
   const pool=quizPool(atlas,state.visible,state.hidden);
   const seen=ok?[...quiz.seen,p.name]:quiz.seen;
   const next=ok?pickQuiz(pool,seen):null;
   setQuiz(q=>q?{name:ok&&next?next.name:q.name,ok:q.ok+(ok?1:0),miss:q.miss+(ok?0:1),seen:ok&&next?[...seen,next.name]:seen,note:ok?`Correct. ${p.name}.`:`That is ${p.name}. Find ${q.name}.`}:q);
   if(ok){setDetails(false);setChosen(null);setState(s=>({...s,selected:[],isolate:false}));return;}
   setChosen({id:p.conceptId,name:p.name,elements:[id]});setState(s=>({...s,selected:[id],isolate:false,rotate:false}));setDetails(true);return;
  }
  const promoted=promoteConcept(atlas,p);if(promoted){choose(promoted);return;}
  const concept=atlas.concepts.find(c=>c.id===p.conceptId);
  if(concept&&concept.name.toLowerCase()===p.name.toLowerCase()&&concept.elements.length>1&&concept.elements.length<=24){choose(concept);return;}
  setChosen({id:p.conceptId,name:p.name,elements:[id]});setState(s=>({...s,selected:[id],isolate:false,rotate:false}));setDetails(true);setSearchOpen(false);
 };
 const toggle=(id:SystemId)=>{setDetails(false);setState(s=>({...s,selected:[],isolate:false,visible:s.visible.includes(id)?s.visible.filter(x=>x!==id):[...s.visible,id]}));};
 const reset=()=>{setState(s=>({...initial,visible:DEFAULT_VISIBLE,pose:{...REST_POSE},reset:s.reset+1,returnAllNonce:s.returnAllNonce+1}));setChosen(null);setDetails(false);setDrawer(null);setPulled(0);};
 const openDrawer=(next:Drawer)=>{setDetails(false);setSearchOpen(false);setDrawer(p=>p===next?null:next);};
 const copyLink=async()=>{
  const url=`${location.pathname}${location.search}${serializeHash({concept:chosen?.id,part:chosen?undefined:state.selected[0],state,defaultVisible:DEFAULT_VISIBLE})}`;
  try{await navigator.clipboard.writeText(`${location.origin}${url}`);setCopied(true);window.setTimeout(()=>setCopied(false),1600);}catch{/* ignore */}
 };
 const applyPose=(pose:PoseState)=>setState(s=>({...s,pose:{...pose},rotate:false}));
 const extract=()=>setState(s=>s.selected.length?{...s,extractNonce:s.extractNonce+1,rotate:false}:s);
 const hideSelected=()=>setState(s=>s.selected.length?{...s,hidden:[...new Set([...s.hidden,...s.selected])],selected:[],isolate:false}:s);
 const restoreHidden=(id?:string)=>setState(s=>({...s,hidden:id?s.hidden.filter(x=>x!==id):[]}));
 const returnAll=()=>setState(s=>({...s,returnAllNonce:s.returnAllNonce+1}));

 useEffect(()=>{
  if(!atlas||!appliedHash.current)return;
  const next=serializeHash({concept:chosen?.id,part:chosen?undefined:state.selected[0],state,defaultVisible:DEFAULT_VISIBLE});
  if(next!==location.hash)history.replaceState(null,'',next||`${location.pathname}${location.search}`);
 },[atlas,state,chosen]);

 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   const typing=(e.target instanceof HTMLInputElement&&e.target.type!=='range'&&e.target.type!=='hidden')||e.target instanceof HTMLTextAreaElement||(e.target instanceof HTMLElement&&e.target.isContentEditable);
   if(e.key==='/'&&!e.shiftKey&&!typing){e.preventDefault();setSearchOpen(true);setDetails(false);setAbout(false);setDrawer(null);return;}
   if(e.key==='Escape'){
    if(searchOpen){setSearchOpen(false);return;}
    if(drawer){setDrawer(null);return;}
    if(about){setAbout(false);return;}
    if(details){setDetails(false);return;}
    if(state.isolate){setState(s=>({...s,isolate:false}));return;}
    if(state.dissect){setState(s=>({...s,dissect:false}));return;}
    if(state.selected.length){setState(s=>({...s,selected:[],isolate:false}));setChosen(null);}
    return;
   }
   if(typing||e.metaKey||e.ctrlKey||e.altKey)return;
   if(e.key==='?'||(e.key==='/'&&e.shiftKey)){e.preventDefault();setAbout(true);setDrawer(null);return;}
   if(e.key==='d'||e.key==='D'){setState(s=>({...s,dissect:!s.dissect,rotate:false}));return;}
   if(e.key==='i'||e.key==='I'){setState(s=>s.selected.length?{...s,isolate:!s.isolate}:s);return;}
   if(e.key==='x'||e.key==='X'){setState(s=>({...s,xray:!s.xray}));return;}
   if(e.key==='e'||e.key==='E'){extract();return;}
   if(e.key==='h'||e.key==='H'){hideSelected();return;}
   if(e.key==='u'||e.key==='U'){returnAll();return;}
   if(e.key==='p'||e.key==='P'){openDrawer('pose');return;}
   if(e.key==='q'||e.key==='Q'){if(quiz)setQuiz(null);else startQuiz();return;}
   if(e.key==='l'||e.key==='L'){setState(s=>({...s,labels:!s.labels}));return;}
   if(e.key===' '&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();setState(s=>({...s,rotate:!s.rotate}));return;}
   if(e.key==='r'||e.key==='R'){reset();return;}
   if(e.key==='1')setState(s=>({...s,view:'three-quarter',reset:s.reset+1,rotate:false}));
   if(e.key==='2')setState(s=>({...s,view:'front',reset:s.reset+1,rotate:false}));
   if(e.key==='3')setState(s=>({...s,view:'side',reset:s.reset+1,rotate:false}));
   if(e.key==='4')setState(s=>({...s,view:'back',reset:s.reset+1,rotate:false}));
  };
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[drawer,searchOpen,about,details,state.isolate,state.dissect,state.selected.length,quiz,atlas,state.visible,state.hidden]);

 const fact=chosen&&selected?factFor(chosen.name,displaySystem(selected)):null;
 const hint=quiz?quiz.note:coach?'Drag to rotate. Search Heart. Pose opens the axilla. Identify tests what you see.':state.dissect?'Dissect: drag a named part to pull it out. Drag empty stage to rotate.':state.isolate?'Only the selection is shown':!poseIsRest(state.pose)?'Posed for study':state.xray?'Muscle wall faded':pulled?`${pulled} pulled out`:'Drag to rotate. Tap a structure for its name.';

 return <main className={`studio ${details&&selectedParts.length>0?'has-inspector':''} ${state.dissect?'is-dissect':''} ${searchOpen?'searching':''}`}>
  {atlas&&<AnatomyScene atlas={atlas} state={{...state,origins:attach?.originIds,insertions:attach?.insertionIds,inspectorOpen:details&&selectedParts.length>0}} onSelect={choosePart} onProgress={n=>{setProgress(n);if(n===100)setError('');}} onError={setError} onPulled={setPulled}/>}
  <header className="topbar">
   <div className="brand"><span className="brand-mark"/>Human Atlas</div>
   <button type="button" className={`topbar-search ${searchOpen?'on':''}`} onClick={()=>{setSearchOpen(o=>!o);setDrawer(null);setDetails(false);}} aria-label="Search anatomy"><Search size={16}/><span>Search</span><kbd>/</kbd></button>
   <button type="button" className="topbar-icon" aria-label="About this atlas" onClick={()=>{setAbout(true);setDrawer(null);setSearchOpen(false);}}><Info size={16}/></button>
  </header>
  <nav className="rail" aria-label="Study panels">
   <button type="button" className={drawer==='layers'?'on':''} onClick={()=>openDrawer('layers')} aria-pressed={drawer==='layers'} aria-label="Dissection layers"><Layers3 size={18}/><span>Layers</span></button>
   <button type="button" className={drawer==='pose'?'on':''} onClick={()=>openDrawer('pose')} aria-pressed={drawer==='pose'} aria-label="Body pose"><PersonStanding size={18}/><span>Pose</span></button>
   <button type="button" className={quiz?'on':''} onClick={()=>quiz?setQuiz(null):startQuiz()} aria-pressed={!!quiz} aria-label="Identify structures"><GraduationCap size={18}/><span>Identify</span></button>
  </nav>
  {drawer==='layers'&&<section className="drawer" aria-label="Dissection layers">
   <div className="drawer-head"><h2>Layers</h2><button type="button" onClick={()=>setDrawer(null)} aria-label="Close layers"><X size={16}/></button></div>
   <div className="chip-row">{DISSECTION.map(layer=><button type="button" key={layer.id} aria-pressed={layer.systems.length===state.visible.length&&layer.systems.every(id=>state.visible.includes(id))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,xray:false,visible:layer.systems}))}>{layer.name}</button>)}</div>
   <div className="chip-row wrap">{REGIONS.map(r=><button type="button" key={r.id} aria-pressed={state.region===r.id} className={state.region===r.id?'on':''} onClick={()=>{const preset=POSE_PRESETS.find(p=>p.id===r.pose);setState(s=>({...s,region:r.id,pose:preset?{...preset.pose}:s.pose,reset:s.reset+1,rotate:false,isolate:false}));}}>{r.name}</button>)}</div>
   <div className="system-list">{activeSystems.filter(s=>s.id!=='integumentary').map(s=><div className={`system-row ${state.visible.includes(s.id)?'enabled':''}`} key={s.id}><button type="button" className="system-name" onClick={()=>toggle(s.id)}><span className="system-dot" style={{background:s.color}}/>{s.name}<span className="system-count">{counts[s.id]}</span></button><Switch checked={state.visible.includes(s.id)} onCheckedChange={()=>toggle(s.id)} aria-label={`Show ${s.name.toLowerCase()}`}/></div>)}</div>
   <div className="field"><div className="field-label"><span>Section</span><output>{Math.round(state.clip*100)}%</output></div><div className="chip-row">{CLIP_PLANES.map(p=><button type="button" key={p.id} className={state.plane===p.id?'on':''} onClick={()=>setState(s=>({...s,plane:p.id}))}>{p.name}</button>)}</div><Slider aria-label="Cutting plane" min={0} max={100} step={1} value={[Math.round((1-state.clip)*100)]} onValueChange={v=>setState(s=>({...s,clip:1-sliderValue(v)/100}))}/></div>
   {hiddenParts.length>0&&<div className="hidden-list"><h3>Hidden {hiddenParts.length}</h3>{hiddenParts.slice(0,10).map(p=><button type="button" key={p.id} onClick={()=>restoreHidden(p.id)}><Eye size={12}/>{p.name}</button>)}<button type="button" className="restore-all" onClick={()=>restoreHidden()}>Show all hidden</button></div>}
   <div className="drawer-foot"><span>{visibleCount.toLocaleString()} visible</span><button type="button" onClick={()=>setState(s=>({...s,visible:[],selected:[],isolate:false}))}>Hide systems</button></div>
  </section>}
  {drawer==='pose'&&<section className="drawer" aria-label="Body pose">
   <div className="drawer-head"><h2>Pose</h2><button type="button" onClick={()=>setDrawer(null)} aria-label="Close pose"><X size={16}/></button></div>
   <p className="drawer-note">The free limb rotates at the shoulder or hip. Scapula, pecs, and serratus stay on the chest, so the axilla opens without tearing the thorax.</p>
   <div className="chip-row wrap">{POSE_PRESETS.map(p=><button type="button" key={p.id} title={p.hint} aria-pressed={state.pose.leftArm===p.pose.leftArm&&state.pose.rightArm===p.pose.rightArm&&state.pose.leftArmFwd===p.pose.leftArmFwd&&state.pose.rightArmFwd===p.pose.rightArmFwd&&state.pose.leftLeg===p.pose.leftLeg&&state.pose.rightLeg===p.pose.rightLeg} onClick={()=>applyPose(p.pose)}>{p.name}</button>)}</div>
   <details className="fine-tune"><summary>Fine tune</summary>
   <div className="field"><div className="field-label"><label id="pose-larm">Left arm raise</label><output>{Math.round(state.pose.leftArm*100)}</output></div><Slider aria-labelledby="pose-larm" min={0} max={100} step={1} value={[Math.round(state.pose.leftArm*100)]} onValueChange={v=>setState(s=>({...s,pose:{...s.pose,leftArm:sliderValue(v)/100},rotate:false}))}/></div>
   <div className="field"><div className="field-label"><label id="pose-rarm">Right arm raise</label><output>{Math.round(state.pose.rightArm*100)}</output></div><Slider aria-labelledby="pose-rarm" min={0} max={100} step={1} value={[Math.round(state.pose.rightArm*100)]} onValueChange={v=>setState(s=>({...s,pose:{...s.pose,rightArm:sliderValue(v)/100},rotate:false}))}/></div>
   <div className="field"><div className="field-label"><label id="pose-lfwd">Left arm forward</label><output>{Math.round(state.pose.leftArmFwd*100)}</output></div><Slider aria-labelledby="pose-lfwd" min={0} max={100} step={1} value={[Math.round(state.pose.leftArmFwd*100)]} onValueChange={v=>setState(s=>({...s,pose:{...s.pose,leftArmFwd:sliderValue(v)/100},rotate:false}))}/></div>
   <div className="field"><div className="field-label"><label id="pose-rfwd">Right arm forward</label><output>{Math.round(state.pose.rightArmFwd*100)}</output></div><Slider aria-labelledby="pose-rfwd" min={0} max={100} step={1} value={[Math.round(state.pose.rightArmFwd*100)]} onValueChange={v=>setState(s=>({...s,pose:{...s.pose,rightArmFwd:sliderValue(v)/100},rotate:false}))}/></div>
   <div className="field"><div className="field-label"><label id="pose-lleg">Left leg out</label><output>{Math.round(state.pose.leftLeg*100)}</output></div><Slider aria-labelledby="pose-lleg" min={0} max={100} step={1} value={[Math.round(state.pose.leftLeg*100)]} onValueChange={v=>setState(s=>({...s,pose:{...s.pose,leftLeg:sliderValue(v)/100},rotate:false}))}/></div>
   <div className="field"><div className="field-label"><label id="pose-rleg">Right leg out</label><output>{Math.round(state.pose.rightLeg*100)}</output></div><Slider aria-labelledby="pose-rleg" min={0} max={100} step={1} value={[Math.round(state.pose.rightLeg*100)]} onValueChange={v=>setState(s=>({...s,pose:{...s.pose,rightLeg:sliderValue(v)/100},rotate:false}))}/></div>
   </details>
  </section>}
  {quiz&&<div className="quiz-bar" role="status"><div><strong>Identify</strong><span>{quiz.name}</span></div><output>{quiz.ok} right · {quiz.miss} miss</output><button type="button" onClick={()=>{if(!atlas)return;const pool=quizPool(atlas,state.visible,state.hidden);const next=pickQuiz(pool,quiz.seen);if(!next)return;setQuiz(q=>q?{...q,name:next.name,seen:[...q.seen,next.name],note:'Tap the named structure on the body.'}:q);}}>Skip</button><button type="button" onClick={()=>setQuiz(null)}>End</button></div>}
  {searchOpen&&<section className="search-float" aria-label="Find anatomy"><div className="drawer-head"><h2>Search</h2><button type="button" onClick={()=>setSearchOpen(false)} aria-label="Close search"><X size={16}/></button></div><Combobox<Concept> items={results} value={null} onValueChange={value=>{if(value)choose(value);}} inputValue={query} onInputValueChange={setQuery} itemToStringLabel={c=>c.name} filter={null} open onOpenChange={open=>{if(!open)setSearchOpen(false);}}><ComboboxInput autoFocus placeholder="Heart, femur, axillary artery" aria-label="Search named anatomical structures" showTrigger={false}/><ComboboxContent className="anatomy-search-results"><ComboboxEmpty>No structures match.</ComboboxEmpty><ComboboxList>{(c:Concept)=><ComboboxItem key={c.id} value={c}><span className="system-dot" style={{background:SYSTEMS.find(s=>s.id===(atlas?conceptSystem(atlas,c):undefined))?.color??'#8a949e'}}/><span className="search-result-name">{c.name}</span><span className="small-number">{c.elements.length}</span></ComboboxItem>}</ComboboxList></ComboboxContent></Combobox></section>}
  {!searchOpen&&<nav className="views" aria-label="Camera">{(['three-quarter','front','side','back'] as View[]).map((v,i)=><button type="button" key={v} className={state.view===v?'on':''} aria-pressed={state.view===v} onClick={()=>setState(s=>({...s,view:v,reset:s.reset+1,rotate:false}))} aria-label={`${v} view`} title={v}>{['¾','F','S','B'][i]}</button>)}<i/><button type="button" className={state.labels?'on':''} aria-pressed={state.labels} aria-label="Labels" title="Labels (L)" onClick={()=>setState(s=>({...s,labels:!s.labels}))}><Tag size={15}/></button><button type="button" className={state.rotate?'on':''} aria-label="Auto rotate" title="Auto rotate (Space)" onClick={()=>setState(s=>({...s,rotate:!s.rotate}))}>{state.rotate?<Pause size={15}/>:<RotateCw size={15}/>}</button></nav>}
  <p className="hint">{hint}</p>
  <div className="dock" role="toolbar" aria-label="Study tools">
   <button type="button" className={!state.dissect?'on':''} aria-pressed={!state.dissect} onClick={()=>setState(s=>({...s,dissect:false}))} title="Look: drag to rotate"><Eye size={16}/><span>Look</span></button>
   <button type="button" className={state.dissect?'on':''} aria-pressed={state.dissect} onClick={()=>setState(s=>({...s,dissect:!s.dissect,rotate:false}))} title="Dissect (D)"><Move size={16}/><span>Dissect</span></button>
   {hasSelection&&<button type="button" onClick={extract} title="Pull out (E)"><ArrowUpFromLine size={16}/><span>Pull out</span></button>}
   {hasSelection&&<button type="button" onClick={hideSelected} title="Hide (H)"><EyeOff size={16}/><span>Hide</span></button>}
   {hasSelection&&<button type="button" className={state.isolate?'on':''} onClick={()=>setState(s=>s.selected.length?{...s,isolate:!s.isolate}:s)} title="Isolate (I)"><Focus size={16}/><span>{state.isolate?'Show rest':'Isolate'}</span></button>}
   {pulled>0&&<button type="button" onClick={returnAll} title="Return all (U)"><Undo2 size={16}/><span>Return</span></button>}
   <button type="button" className={state.xray?'on':''} aria-pressed={state.xray} onClick={()=>setState(s=>({...s,xray:!s.xray}))} title="Fade muscle (X)"><Scan size={16}/><span>Fade muscle</span></button>
   <button type="button" onClick={reset} title="Reset (R)"><RotateCcw size={16}/><span>Reset</span></button>
  </div>
  <footer className="credits"><button type="button" onClick={()=>setAbout(true)}>Source <ArrowUpRight size={12}/></button></footer>
  {progress<100&&!error&&<div className="loading glass" role="status"><Activity size={18}/><div><strong>Preparing the anatomy</strong><span>{progress}% · BodyParts3D 4.0</span><div className="loading-track"><i style={{width:`${progress}%`}}/></div></div></div>}
  {error&&<div className="loading glass error" role="alert"><p>{error}</p><Button variant="ghost" onClick={()=>location.reload()}>Reload viewer</Button></div>}
  <Sheet open={details&&selectedParts.length>0} modal={false} disablePointerDismissal onOpenChange={setDetails}><SheetContent initialFocus={detailTitle} className={`detail-sheet ${state.isolate?'is-isolated':''}`} showCloseButton={true}><div className="detail-header"><div className="detail-kicker">{fact?.kind??system?.name??'Anatomy'}{fact?.side&&fact.side!=='Unpaired'?` · ${fact.side}`:''}</div><SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{chosen?.name}</SheetTitle>{fact?.latin&&<div className="latin-name">{fact.latin}</div>}</div><div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`}><SheetDescription className="structure-description">{fact?.summary??''}</SheetDescription>{fact?.function&&<p className="fact-block"><strong>Function.</strong> {fact.function}</p>}{attach?.action&&<p className="fact-block"><strong>Action.</strong> {attach.action}</p>}{attach&&<div className="attach-pair"><div><h3>Origin</h3>{attach.originIds.length?attach.originIds.map(id=>{const p=parts.get(id);return p?<button type="button" key={id} onClick={()=>choosePart(id)}>{p.name}</button>:null;}):<span>{attach.origin}</span>}</div><div><h3>Insertion</h3>{attach.insertionIds.length?attach.insertionIds.map(id=>{const p=parts.get(id);return p?<button type="button" key={id} onClick={()=>choosePart(id)}>{p.name}</button>:null;}):<span>{attach.insertion}</span>}</div></div>}{fact?.relations&&<p className="fact-block"><strong>Relations.</strong> {fact.relations}</p>}{fact?.source&&<span className="context-note">{fact.source}</span>}<div className="structure-meta"><span>Atlas<strong>{chosen?.id}</strong></span><span>Pieces<strong>{state.selected.length.toLocaleString()}</strong></span></div>{related.length>0&&<div className="member-list"><h3>Also part of</h3>{related.map(c=><button type="button" key={c.id} onClick={()=>choose(c)}><span>{c.name}</span><span className="small-number">{c.elements.length}</span></button>)}</div>}<a className="source-link" href={chosen?fmaUrl(chosen.id):'https://lifesciencedb.jp/bp3d/'} target="_blank" rel="noreferrer">Open FMA record <ArrowUpRight size={14}/></a><button type="button" className="source-link copy-link" onClick={copyLink}>{copied?<><Copy size={14}/> Link copied</>:<><Link2 size={14}/> Copy view link</>}</button>{selectedParts.length>1&&<div className="member-list"><h3>Included structures</h3>{selectedParts.slice(0,40).map(p=><button type="button" key={p.id} onClick={()=>choosePart(p.id)}><span>{p.name}</span></button>)}</div>}</div><div className="detail-actions"><button type="button" className="act" onClick={extract}>Pull out as one piece</button><button type="button" className={`act ghost ${state.isolate?'on':''}`} onClick={()=>setState(s=>({...s,isolate:!s.isolate}))}>{state.isolate?'Show rest':'Isolate'}</button><button type="button" className="act ghost" onClick={hideSelected}>Hide</button></div></SheetContent></Sheet>
  <Sheet open={about} onOpenChange={setAbout}><SheetContent className="about-sheet"><div className="detail-kicker">Source</div><SheetTitle className="structure-title">Study the body by taking it apart.</SheetTitle><SheetDescription>Drag to rotate. Tap to inspect. Dissect lets you pull a structure aside. Pose the limbs to open the axilla and medial thigh.</SheetDescription><div className="about-copy"><p><strong>Male · BodyParts3D</strong><br/>2,234 meshes and 3,432 named concepts from an adult male reference anatomy. Educational use only, not a diagnostic tool.</p><p>Skin and hair are omitted so muscle, viscera, and bone can be studied directly. Heart search selects the cardiac core (walls, cavities, valves, papillary muscle), not every coronary twig. Brain ventricles are shown with the nervous system, not the heart. Isolate hides everything except the selection. Fade muscle hides the body wall so viscera can be read. Selecting a muscle paints its origin gold and its insertion cream when those bones exist in the dataset. Identify asks you to tap a named structure.</p><h3>Dataset limits</h3><ul className="coverage-list">{COVERAGE.map(item=><li key={item}>{item}</li>)}</ul><h3>Keys</h3><ul className="hotkey-list"><li><kbd>/</kbd> Search</li><li><kbd>D</kbd> Dissect</li><li><kbd>E</kbd> Pull out</li><li><kbd>H</kbd> Hide</li><li><kbd>I</kbd> Isolate</li><li><kbd>U</kbd> Return</li><li><kbd>P</kbd> Pose</li><li><kbd>Q</kbd> Identify</li><li><kbd>X</kbd> Fade muscle</li><li><kbd>L</kbd> Labels</li><li><kbd>Space</kbd> Rotate</li><li><kbd>1</kbd>-<kbd>4</kbd> Views</li><li><kbd>R</kbd> Reset</li></ul><h3>Source</h3><p>BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Dataset license <ArrowUpRight size={14}/></a></div></SheetContent></Sheet>
 </main>;
}
