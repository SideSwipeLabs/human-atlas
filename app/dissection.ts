import type {SystemId} from './anatomy';

export const ALL_SYSTEMS:SystemId[]=['sensory','skeletal','muscular','connective','cardiac','respiratory','digestive','urinary','lymphatic','endocrine','reproductive','arterial','venous','nervous'];

export const DISSECTION:{id:string;name:string;systems:SystemId[]}[]=[
 {id:'all',name:'Full',systems:ALL_SYSTEMS},
 {id:'muscle',name:'Muscle',systems:['skeletal','muscular','connective','sensory','cardiac']},
 {id:'organs',name:'Viscera',systems:['skeletal','cardiac','respiratory','digestive','urinary','endocrine','lymphatic','reproductive']},
 {id:'bone',name:'Bone',systems:['skeletal']},
 {id:'vessels',name:'Vessels',systems:['arterial','venous','nervous','skeletal']},
];

export type RegionId='full'|'head'|'thorax'|'abdomen'|'pelvis'|'arm'|'leg';
export const REGIONS:{id:RegionId;name:string;target:[number,number,number];distance:number}[]=[
 {id:'full',name:'Whole body',target:[0,.85,0],distance:4},
 {id:'head',name:'Head',target:[0,1.58,.04],distance:.55},
 {id:'thorax',name:'Thorax',target:[0,1.22,0],distance:.95},
 {id:'abdomen',name:'Abdomen',target:[0,1.05,0],distance:.9},
 {id:'pelvis',name:'Pelvis',target:[0,.88,0],distance:.75},
 {id:'arm',name:'Upper limb',target:[.18,1.18,0],distance:1.05},
 {id:'leg',name:'Lower limb',target:[.08,.42,0],distance:1.35},
];

export type ClipPlane='transverse'|'sagittal'|'coronal';
export const CLIP_PLANES:{id:ClipPlane;name:string}[]=[
 {id:'transverse',name:'Transverse'},
 {id:'sagittal',name:'Sagittal'},
 {id:'coronal',name:'Coronal'},
];

export function clipLimit(plane:ClipPlane,clip:number,_isolate:boolean){
 if(clip<0.002)return 8;
 if(plane==='sagittal')return .36-clip*.72;
 if(plane==='coronal')return .16-clip*.32;
 return 1.78-clip*1.76;
}

export function clipAxis(plane:ClipPlane){
 return plane==='sagittal'?1:plane==='coronal'?2:0;
}
