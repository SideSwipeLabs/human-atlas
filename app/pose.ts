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

const arm= (cx:number):PoseGroupId=>cx>=0?1:2;
const leg= (cx:number):PoseGroupId=>cx>=0?3:4;

/**
 * Rigid compartments around anatomical joints, not a full musculoskeletal sim.
 * Glenohumeral pose moves the free upper limb (humerus through fingertips, cuff,
 * arm and forearm muscles). Scapula, clavicle, pecs, serratus, and trapezius stay
 * on the thorax (scapulothoracic rhythm is not modeled). Hip pose moves the free
 * lower limb. Named tokens always beat bounding-box fallbacks so hanging hands
 * never join the thighs.
 */
export function poseGroupOf(name:string,cx:number,cy:number):PoseGroupId{
 const n=name.toLowerCase();
 if(n==='skin'||n==='pubic hair'||n==='hair of head'||n==='eyebrow'||n==='lip')return 0;
 if(n.includes('tarsal plate')||n==='mandible'||n==='maxilla')return 5;
 if(/testis|scrotum|prostate|penis|perineum|coccygeus|iliococcygeus|pubococcygeus|puborectalis|anal sphincter/.test(n))return 0;

 if(/toe|hallux|plantar|metatarsal|calcane|tarsal bone| of (left|right) foot\b|interosseous membrane of .*leg|fibularis|peroneus|tibialis|gastrocnemius|soleus|plantaris|popliteus|iliotibial|flexor digitorum longus|flexor digitorum brevis|extensor digitorum longus|extensor digitorum brevis|flexor accessorius/.test(n))return leg(cx);
 if(/biceps femoris|semimembranosus|semitendinosus|vastus|gracilis|adductor|rectus femoris|sartorius|tensor fasciae latae/.test(n))return /adductor pollicis/.test(n)?arm(cx):leg(cx);

 if(/finger|thumb|pollicis|thenar|hypothenar|indicis| of (left|right) hand\b|metacarpal|palmar arch|palmar digital|palmar metacarpal|princeps pollicis|radialis indicis/.test(n)&&cy>0.5)return arm(cx);
 if(/\bscaphoid\b|\blunate\b|triquetral|triquetrum|pisiform|\bhamate\b|\bcapitate\b|trapezium|trapezoid|retinaculum of .*wrist|interosseous membrane of .*forearm/.test(n))return arm(cx);
 if(/carpi |palmaris|pronator|supinator|brachioradialis|anconeus|extensor digitorum|flexor digitorum|lumbrical of|interossei of .*hand/.test(n))return arm(cx);
 if(/(^| )(humerus|radius|ulna)\b/.test(n))return arm(cx);
 if(/deltoid|triceps|brachialis|coracobrachialis|supraspinatus|infraspinatus|teres minor|teres major|subscapularis/.test(n))return arm(cx);
 if(/\bbiceps brachii\b|\bbiceps\b/.test(n)&&!/femoris/.test(n))return arm(cx);
 if(/brachial artery|brachial vein|basilic|cephalic vein|antebrachial|circumflex humeral|deep brachial/.test(n)&&!/brachiocephalic/.test(n))return arm(cx);

 if(/scapula|clavicle|pectoralis|serratus|latissimus|subclavius|trapezius|rhomboid|levator scapulae/.test(n))return 0;
 if(/gluteus|iliacus|obturator|piriformis|gemellus|quadratus femoris|pectineus|psoas/.test(n))return 0;
 if(/rectus abdominis|oblique|quadratus lumborum|intercostal|diaphragm/.test(n))return 0;

 if(/(^| )(femur|tibia|fibula|patella)\b/.test(n))return leg(cx);

 if(cy>1.50)return 5;
 if(Math.abs(cx)>0.16&&cy>0.68&&cy<1.45)return arm(cx);
 if(cy<0.72&&Math.abs(cx)>0.04)return leg(cx);
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
