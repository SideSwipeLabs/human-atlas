import type {ClipPlane,PoseState,SceneState,SystemId,View} from './anatomy';

const VIEWS=new Set<View>(['three-quarter','front','back','side']);
const SYSTEMS=new Set<SystemId>(['skeletal','muscular','arterial','venous','nervous','digestive','respiratory','urinary','reproductive','lymphatic','endocrine','integumentary','connective','sensory','cardiac']);
const REST:PoseState={leftArm:0,rightArm:0,leftArmFwd:0,rightArmFwd:0,leftLeg:0,rightLeg:0,head:0};
const PRESETS:Record<string,PoseState>={
 'arms-up':{...REST,leftArm:.72,rightArm:.72},
 'left-up':{...REST,leftArm:.82},
 'right-up':{...REST,rightArm:.82},
 'arms-fwd':{...REST,leftArmFwd:.78,rightArmFwd:.78},
 'legs-apart':{...REST,leftLeg:.48,rightLeg:.48},
};

export interface AtlasHash {
 concept?:string;
 part?:string;
 view?:View;
 xray?:boolean;
 clip?:number;
 isolate?:boolean;
 plane?:ClipPlane;
 systems?:SystemId[];
 pose?:PoseState;
}

function ratio(value:string|null){
 if(value==null||value==='')return undefined;
 const n=Number(value);
 if(!Number.isFinite(n))return undefined;
 return Math.min(1,Math.max(0,n/100));
}

function samePose(a:PoseState,b:PoseState){
 return a.leftArm===b.leftArm&&a.rightArm===b.rightArm&&a.leftArmFwd===b.leftArmFwd&&a.rightArmFwd===b.rightArmFwd&&a.leftLeg===b.leftLeg&&a.rightLeg===b.rightLeg&&a.head===b.head;
}

export function parseHash(hash:string):AtlasHash{
 const raw=hash.startsWith('#')?hash.slice(1):hash;
 if(!raw)return {};
 const params=new URLSearchParams(raw);
 const view=params.get('view');
 const systems=params.get('sys')?.split(',').filter((id):id is SystemId=>SYSTEMS.has(id as SystemId));
 const poseId=params.get('pose');
 return {
  concept:params.get('c')||undefined,
  part:params.get('p')||undefined,
  view:view&&VIEWS.has(view as View)?view as View:undefined,
  xray:params.get('xray')==='1'?true:undefined,
  clip:ratio(params.get('clip')),
  isolate:params.get('iso')==='1'?true:undefined,
  plane:params.get('plane')==='sagittal'||params.get('plane')==='coronal'?params.get('plane') as ClipPlane:undefined,
  systems:systems?.length?systems:undefined,
  pose:poseId&&PRESETS[poseId]?PRESETS[poseId]:undefined,
 };
}

export function serializeHash(input:{concept?:string|null;part?:string|null;state:Pick<SceneState,'view'|'xray'|'clip'|'isolate'|'visible'|'pose'|'plane'>;defaultVisible:SystemId[]}):string{
 const params=new URLSearchParams();
 if(input.concept)params.set('c',input.concept);
 else if(input.part)params.set('p',input.part);
 if(input.state.view!=='three-quarter')params.set('view',input.state.view);
 if(input.state.xray)params.set('xray','1');
 if(input.state.clip>0.005)params.set('clip',String(Math.round(input.state.clip*100)));
 if(input.state.isolate)params.set('iso','1');
 if(input.state.plane&&input.state.plane!=='transverse')params.set('plane',input.state.plane);
 const pose=input.state.pose??REST;
 const poseId=Object.keys(PRESETS).find(id=>samePose(PRESETS[id],pose));
 if(poseId)params.set('pose',poseId);
 const same=input.state.visible.length===input.defaultVisible.length&&input.defaultVisible.every(id=>input.state.visible.includes(id));
 if(!same)params.set('sys',input.state.visible.join(','));
 const query=params.toString();
 return query?`#${query}`:'';
}
