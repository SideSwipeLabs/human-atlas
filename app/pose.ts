export interface PoseState {
 leftArm:number;
 rightArm:number;
 leftArmFwd:number;
 rightArmFwd:number;
 leftLeg:number;
 rightLeg:number;
 head:number;
}

export const REST_POSE:PoseState={leftArm:0,rightArm:0,leftArmFwd:0,rightArmFwd:0,leftLeg:0,rightLeg:0,head:0};

export const POSE_PRESETS:{id:string;name:string;hint:string;pose:PoseState}[]=[
 {id:'rest',name:'Rest',hint:'Standing anatomical position',pose:{...REST_POSE}},
 {id:'arms-up',name:'Arms raised',hint:'Abduct both arms to open the axilla',pose:{...REST_POSE,leftArm:.72,rightArm:.72}},
 {id:'left-up',name:'Left arm up',hint:'Open the left axilla and lateral chest',pose:{...REST_POSE,leftArm:.82}},
 {id:'right-up',name:'Right arm up',hint:'Open the right axilla and lateral chest',pose:{...REST_POSE,rightArm:.82}},
 {id:'arms-fwd',name:'Arms forward',hint:'Flex the shoulders to see the back of the arms',pose:{...REST_POSE,leftArmFwd:.78,rightArmFwd:.78}},
 {id:'legs-apart',name:'Legs apart',hint:'Abduct the thighs to study the medial thigh and perineum',pose:{...REST_POSE,leftLeg:.48,rightLeg:.48}},
];

/** Joint pivots in atlas metres: torso unused, glenohumeral, hip, C0–C1. */
export const POSE_PIVOTS:[number,number,number][]=[
 [0,0,0],
 [.155,1.35,-.02],
 [-.155,1.35,-.02],
 [.088,.92,.01],
 [-.088,.92,.01],
 [0,1.52,.02],
];

export type PoseGroupId=0|1|2|3|4|5;

export function poseGroupOf(name:string,cx:number,cy:number):PoseGroupId{
 const n=name.toLowerCase();
 if(n==='skin'||n==='pubic hair'||n==='hair of head'||n==='eyebrow'||n==='lip')return 0;
 if(n.includes('tarsal plate')||n==='mandible'||n==='maxilla'||cy>1.50)return 5;
 if(/testis|scrotum|prostate|penis|perineum/.test(n))return 0;
 if(/toe|hallux|plantar| of (left|right) foot\b|interosseous membrane of .*leg|flexor digitorum longus|flexor digitorum brevis|extensor digitorum longus|extensor hallucis|flexor hallucis/.test(n))return cx>=0?3:4;
 if(/biceps femoris/.test(n))return cx>=0?3:4;
 if(/finger|thumb|thenar|hypothenar|pollicis|palmaris| of (left|right) hand\b/.test(n))return cx>=0?1:2;
 if(/lumbrical|interosse|flexor digitorum|extensor digitorum/.test(n))return cx>=0?1:2;
 if(/tensor fasciae latae|iliotibial|sartorius/.test(n))return 0;
 if(/scapula|clavicle|pectoralis|serratus|latissimus|subscapularis/.test(n))return 0;
 if(/(^| )(humerus|radius|ulna)\b/.test(n)&&cy>0.7)return cx>=0?1:2;
 if(/deltoid|biceps|triceps|brachialis|brachioradialis|coracobrachialis|anconeus|supraspinatus|infraspinatus|teres minor|teres major/.test(n))return cx>=0?1:2;
 if(/(^| )(femur|tibia|fibula|patella)\b/.test(n))return cx>=0?3:4;
 if(/gluteus|iliacus|obturator|piriformis|gemellus|quadratus femoris/.test(n))return 0;
 if(/vastus|gracilis|adductor|semimembranosus|semitendinosus|rectus femoris/.test(n))return cx>=0?3:4;
 if(/rectus abdominis|oblique|quadratus lumborum/.test(n))return 0;
 if(/metacarpal|carpal bone|\bscaphoid\b|\blunate\b|triquetrum|pisiform|\bhamate\b|\bcapitate\b|trapezium|trapezoid/.test(n)&&cy>0.55)return cx>=0?1:2;
 if(/metatarsal|calcane|tarsal bone|plantar/.test(n)||cy<0.48)return cx>=0?3:4;
 if(cy>0.88&&cy<1.42&&Math.abs(cx)>0.13)return cx>0?1:2;
 if(cy<0.78&&Math.abs(cx)>0.045)return cx>0?3:4;
 return 0;
}

export function poseIsRest(pose:PoseState){
 return pose.leftArm+pose.rightArm+pose.leftArmFwd+pose.rightArmFwd+pose.leftLeg+pose.rightLeg+Math.abs(pose.head)<0.02;
}

interface Quat {x:number;y:number;z:number;w:number}
const I:Quat={x:0,y:0,z:0,w:1};

function qaxis(x:number,y:number,z:number,rad:number):Quat{
 const s=Math.sin(rad/2),c=Math.cos(rad/2);
 return {x:x*s,y:y*s,z:z*s,w:c};
}
function qmul(a:Quat,b:Quat):Quat{
 return {
  x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,
  y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,
  z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w,
  w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z,
 };
}

/** Six world-space quaternions, group order torso / L arm / R arm / L leg / R leg / head. */
export function poseQuaternions(pose:PoseState):Quat[]{
 const lArm=qmul(qaxis(1,0,0,-pose.leftArmFwd*1.45),qaxis(0,0,1,pose.leftArm*2.65));
 const rArm=qmul(qaxis(1,0,0,-pose.rightArmFwd*1.45),qaxis(0,0,1,-pose.rightArm*2.65));
 const lLeg=qaxis(0,0,1,pose.leftLeg*0.7);
 const rLeg=qaxis(0,0,1,-pose.rightLeg*0.7);
 const head=qaxis(0,1,0,pose.head*0.9);
 return [I,lArm,rArm,lLeg,rLeg,head];
}
