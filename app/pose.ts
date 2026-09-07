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

/** Joint pivots: torso, GH, hip, C0-C1, then ST near the superior-medial scapula. */
export const POSE_PIVOTS:[number,number,number][]=[
 [0,0,0],
 [.16,1.37,-.02],
 [-.16,1.37,-.02],
 [.088,.92,.01],
 [-.088,.92,.01],
 [0,1.52,.02],
 [.05,1.428,.02],
 [-.05,1.428,.02],
];

export type PoseGroupId=0|1|2|3|4|5|6|7;

const arm= (cx:number):PoseGroupId=>cx>=0?1:2;
const leg= (cx:number):PoseGroupId=>cx>=0?3:4;
const scap=(cx:number):PoseGroupId=>cx>=0?6:7;

/**
 * Rigid compartments around anatomical joints. Glenohumeral pose moves the free
 * upper limb, parented through scapulothoracic upward rotation at about 2:1 GH:ST.
 * Cuff bones ride the scapula. Crossing muscles are two-bone skinned so origins
 * stay and insertions follow. Hip pose moves the free lower limb.
 */
export function poseGroupOf(name:string,cx:number,cy:number):PoseGroupId{
 const n=name.toLowerCase();
 if(n==='skin'||n==='pubic hair'||n==='hair of head'||n==='eyebrow'||n==='lip')return 0;
 if(n.includes('tarsal plate')||n==='mandible'||n==='maxilla')return 5;
 if(/testis|scrotum|prostate|penis|perineum|coccygeus|iliococcygeus|pubococcygeus|puborectalis|anal sphincter/.test(n))return 0;

 if(/toe|hallux|plantar|metatarsal|calcane|tarsal bone| of (left|right) foot\b|interosseous membrane of .*leg|fibularis|peroneus|tibialis|gastrocnemius|soleus|plantaris|popliteus|iliotibial|flexor digitorum longus|flexor digitorum brevis|extensor digitorum longus|extensor digitorum brevis|flexor accessorius/.test(n))return leg(cx);
 if(/biceps femoris|semimembranosus|semitendinosus|vastus|gracilis|adductor|rectus femoris|sartorius|tensor fasciae latae/.test(n))return /adductor pollicis/.test(n)?arm(cx):leg(cx);

 if(/subscapularis|supraspinatus|infraspinatus|teres minor|teres major|circumflex scapular|subscapular artery|subscapular vein|suprascapular/.test(n))return scap(cx);
 if(/\bscapula\b/.test(n))return scap(cx);
 if(/clavicle|pectoralis|serratus|latissimus|subclavius|trapezius|rhomboid|levator scapulae/.test(n))return 0;

 if(/finger|thumb|pollicis|thenar|hypothenar|indicis| of (left|right) hand\b|metacarpal|palmar arch|palmar digital|palmar metacarpal|princeps pollicis|radialis indicis/.test(n)&&cy>0.5)return arm(cx);
 if(/\bscaphoid\b|\blunate\b|triquetral|triquetrum|pisiform|\bhamate\b|\bcapitate\b|trapezium|trapezoid|retinaculum of .*wrist|interosseous membrane of .*forearm/.test(n))return arm(cx);
 if(/carpi |palmaris|pronator|supinator|brachioradialis|anconeus|extensor digitorum|flexor digitorum|lumbrical of|interossei of .*hand/.test(n))return arm(cx);
 if(/(^| )(humerus|radius|ulna)\b/.test(n))return arm(cx);
 if(/deltoid branch/.test(n))return 0;
 if(/part of .*deltoid|\bdeltoid$|triceps|brachialis|coracobrachialis/.test(n))return arm(cx);
 if(/\bbiceps brachii\b|\bbiceps\b/.test(n)&&!/femoris/.test(n))return arm(cx);
 if(/brachial artery|brachial vein|basilic|cephalic vein|antebrachial|circumflex humeral|deep brachial/.test(n)&&!/brachiocephalic/.test(n))return arm(cx);

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

export function poseEquals(a:PoseState,b:PoseState){
 return Math.abs(a.leftArm-b.leftArm)<.02&&Math.abs(a.rightArm-b.rightArm)<.02&&Math.abs(a.leftArmFwd-b.leftArmFwd)<.02&&Math.abs(a.rightArmFwd-b.rightArmFwd)<.02&&Math.abs(a.leftLeg-b.leftLeg)<.02&&Math.abs(a.rightLeg-b.rightLeg)<.02&&Math.abs(a.head-b.head)<.02;
}

/** Second pose group plus a vertex axis used to blend toward insertion or origin. */
export function skinningOf(name:string,cx:number):{extra:PoseGroupId;axis:0|1;a:number;b:number}|null{
 const n=name.toLowerCase();
 if(/pectoralis major/.test(n))return {extra:arm(cx),axis:0,a:.025,b:.155};
 if(/pectoralis minor/.test(n))return {extra:scap(cx),axis:1,a:1.27,b:1.39};
 if(/serratus anterior/.test(n))return {extra:scap(cx),axis:0,a:.14,b:.06};
 if(/\bdeltoid\b/.test(n)&&!/branch|artery|vein/.test(n))return {extra:scap(cx),axis:1,a:1.28,b:1.415};
 if(/biceps brachii|coracobrachialis/.test(n))return {extra:scap(cx),axis:1,a:1.26,b:1.40};
 if(/long head of .*triceps/.test(n))return {extra:scap(cx),axis:1,a:1.26,b:1.40};
 if(/trapezius/.test(n))return {extra:scap(cx),axis:0,a:.03,b:.12};
 if(/\bclavicle\b/.test(n))return {extra:scap(cx),axis:0,a:.02,b:.12};
 if(/subclavius/.test(n))return {extra:scap(cx),axis:0,a:.04,b:.10};
 if(/rhomboid/.test(n))return {extra:scap(cx),axis:0,a:.015,b:.075};
 if(/levator scapulae/.test(n))return {extra:scap(cx),axis:1,a:1.53,b:1.40};
 if(/subscapularis/.test(n))return {extra:arm(cx),axis:0,a:.14,b:.165};
 if(/supraspinatus|infraspinatus/.test(n))return {extra:arm(cx),axis:0,a:.15,b:.185};
 if(/teres minor/.test(n))return {extra:arm(cx),axis:0,a:.16,b:.19};
 if(/teres major/.test(n))return {extra:arm(cx),axis:0,a:.14,b:.17};
 if(/adductor/.test(n)&&!/hallucis|pollicis/.test(n))return {extra:0,axis:0,a:.09,b:.022};
 if(/\bgracilis\b/.test(n))return {extra:0,axis:1,a:.42,b:.84};
 if(/pectineus/.test(n))return {extra:leg(cx),axis:0,a:.03,b:.09};
 if(/\bpsoas\b/.test(n))return {extra:leg(cx),axis:0,a:.02,b:.10};
 if(/iliacus/.test(n))return {extra:leg(cx),axis:1,a:1.02,b:.83};
 return null;
}

export function skinWeight(axisValue:number,a:number,b:number){
 const t=Math.min(1,Math.max(0,(axisValue-a)/(b-a||1)));
 return t*t*(3-2*t);
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

/** Eight world-space quaternions: torso, arms, legs, head, L/R scapula. GH:ST about 2:1. */
export function poseQuaternions(pose:PoseState):Quat[]{
 const ghAbd=2.094,ghFlex=1.35,stUp=1.047,stTilt=0.12,stFlex=0.28,stPro=0.32;
 const lArm=qmul(qaxis(1,0,0,-pose.leftArmFwd*ghFlex),qaxis(0,0,1,pose.leftArm*ghAbd));
 const rArm=qmul(qaxis(1,0,0,-pose.rightArmFwd*ghFlex),qaxis(0,0,1,-pose.rightArm*ghAbd));
 const lLeg=qaxis(0,0,1,pose.leftLeg*0.7);
 const rLeg=qaxis(0,0,1,-pose.rightLeg*0.7);
 const head=qaxis(0,1,0,pose.head*0.9);
 const lScap=qmul(qaxis(1,0,0,-pose.leftArmFwd*stFlex-pose.leftArm*stTilt),qmul(qaxis(0,1,0,pose.leftArmFwd*stPro),qaxis(0,0,1,pose.leftArm*stUp)));
 const rScap=qmul(qaxis(1,0,0,-pose.rightArmFwd*stFlex-pose.rightArm*stTilt),qmul(qaxis(0,1,0,-pose.rightArmFwd*stPro),qaxis(0,0,1,-pose.rightArm*stUp)));
 return [I,lArm,rArm,lLeg,rLeg,head,lScap,rScap];
}
