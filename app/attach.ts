import type {Atlas,Part} from './anatomy';
import {laterality} from './tissue';

export interface Attachment {
 origin:string;
 insertion:string;
 originIds:string[];
 insertionIds:string[];
 action:string;
}

const RULES:{test:RegExp;origin:string[];insertion:string[];action:string}[]=[
 {test:/\bdeltoid\b/,origin:['clavicle','scapula'],insertion:['humerus'],action:'Abducts, flexes, and extends the arm at the shoulder.'},
 {test:/subscapularis/,origin:['scapula'],insertion:['humerus'],action:'Internally rotates the arm and seats the humeral head.'},
 {test:/supraspinatus/,origin:['scapula'],insertion:['humerus'],action:'Starts abduction of the arm (first 15 degrees).'},
 {test:/infraspinatus/,origin:['scapula'],insertion:['humerus'],action:'Externally rotates the arm.'},
 {test:/teres minor/,origin:['scapula'],insertion:['humerus'],action:'Externally rotates the arm.'},
 {test:/teres major/,origin:['scapula'],insertion:['humerus'],action:'Adducts and internally rotates the arm.'},
 {test:/biceps brachii/,origin:['scapula'],insertion:['radius'],action:'Flexes the elbow and supinates the forearm.'},
 {test:/triceps brachii/,origin:['scapula','humerus'],insertion:['ulna'],action:'Extends the elbow.'},
 {test:/brachialis/,origin:['humerus'],insertion:['ulna'],action:'Flexes the elbow.'},
 {test:/coracobrachialis/,origin:['scapula'],insertion:['humerus'],action:'Flexes and adducts the arm.'},
 {test:/brachioradialis/,origin:['humerus'],insertion:['radius'],action:'Flexes the elbow in mid-pronation.'},
 {test:/pectoralis major/,origin:['clavicle','sternum'],insertion:['humerus'],action:'Adducts and internally rotates the arm.'},
 {test:/pectoralis minor/,origin:['rib'],insertion:['scapula'],action:'Stabilizes the scapula against the chest wall.'},
 {test:/serratus anterior/,origin:['rib'],insertion:['scapula'],action:'Protracts and upwardly rotates the scapula.'},
 {test:/trapezius/,origin:['vertebra','skull'],insertion:['scapula','clavicle'],action:'Elevates, retracts, and rotates the scapula.'},
 {test:/levator scapulae/,origin:['vertebra'],insertion:['scapula'],action:'Elevates the scapula.'},
 {test:/rhomboid/,origin:['vertebra'],insertion:['scapula'],action:'Retracts the scapula.'},
 {test:/latissimus/,origin:['hip bone','vertebra'],insertion:['humerus'],action:'Extends, adducts, and internally rotates the arm.'},
 {test:/supinator/,origin:['humerus','ulna'],insertion:['radius'],action:'Supinates the forearm.'},
 {test:/pronator teres/,origin:['humerus','ulna'],insertion:['radius'],action:'Pronates the forearm and flexes the elbow.'},
 {test:/pronator quadratus/,origin:['ulna'],insertion:['radius'],action:'Pronates the forearm.'},
 {test:/flexor carpi radialis/,origin:['humerus'],insertion:['metacarpal'],action:'Flexes and abducts the wrist.'},
 {test:/flexor carpi ulnaris/,origin:['humerus','ulna'],insertion:['hamate','metacarpal'],action:'Flexes and adducts the wrist.'},
 {test:/extensor carpi radialis/,origin:['humerus'],insertion:['metacarpal'],action:'Extends and abducts the wrist.'},
 {test:/extensor carpi ulnaris/,origin:['humerus'],insertion:['metacarpal'],action:'Extends and adducts the wrist.'},
 {test:/gluteus maximus/,origin:['hip bone','sacrum'],insertion:['femur'],action:'Extends and laterally rotates the hip.'},
 {test:/gluteus medius|gluteus minimus/,origin:['hip bone'],insertion:['femur'],action:'Abducts the hip. Anterior fibers also internally rotate.'},
 {test:/iliacus|psoas/,origin:['hip bone','vertebra'],insertion:['femur'],action:'Flexes the hip.'},
 {test:/rectus femoris/,origin:['hip bone'],insertion:['patella','tibia'],action:'Flexes the hip and extends the knee.'},
 {test:/vastus/,origin:['femur'],insertion:['patella','tibia'],action:'Extends the knee.'},
 {test:/biceps femoris/,origin:['hip bone','femur'],insertion:['fibula'],action:'Extends the hip and flexes the knee.'},
 {test:/semimembranosus|semitendinosus/,origin:['hip bone'],insertion:['tibia'],action:'Extends the hip and flexes the knee.'},
 {test:/sartorius/,origin:['hip bone'],insertion:['tibia'],action:'Flexes, abducts, and externally rotates the hip; flexes the knee.'},
 {test:/gracilis/,origin:['hip bone'],insertion:['tibia'],action:'Adducts the hip and flexes the knee.'},
 {test:/adductor longus|adductor brevis|adductor magnus|adductor minimus/,origin:['hip bone'],insertion:['femur'],action:'Adducts the hip.'},
 {test:/gastrocnemius/,origin:['femur'],insertion:['calcaneus'],action:'Plantarflexes the ankle and flexes the knee.'},
 {test:/soleus/,origin:['tibia','fibula'],insertion:['calcaneus'],action:'Plantarflexes the ankle.'},
 {test:/tibialis anterior/,origin:['tibia'],insertion:['cuneiform','metatarsal'],action:'Dorsiflexes and inverts the foot.'},
 {test:/tibialis posterior/,origin:['tibia','fibula'],insertion:['navicular'],action:'Plantarflexes and inverts the foot.'},
 {test:/fibularis longus|fibularis brevis/,origin:['fibula'],insertion:['metatarsal'],action:'Everts the foot.'},
 {test:/diaphragm/,origin:['sternum','rib','vertebra'],insertion:['sternum'],action:'Primary muscle of inspiration.'},
];

function boneHits(atlas:Atlas,part:Part,token:string){
 const side=laterality(part.name).toLowerCase();
 const needle=token.toLowerCase();
 return atlas.parts.filter(p=>{
  const n=p.name.toLowerCase();
  if(/head of |disk|artery|vein|muscle|nerve|ligament/.test(n))return false;
  if(needle==='metacarpal'||needle==='metatarsal')return n.includes(needle)&&n.includes('bone')&&(side==='unpaired'||n.includes(side));
  if(needle==='rib')return /\brib\b/.test(n)&&(side==='unpaired'||n.includes(side));
  if(needle==='vertebra')return /vertebra$/.test(n);
  if(needle==='sternum')return n.includes('sternum');
  if(needle==='skull')return n==='skull'||n.includes('occipital');
  if(side==='left'||side==='right')return n===`${side} ${needle}`||n===`${side} ${needle} bone`;
  return n===needle||n.endsWith(' '+needle);
 }).slice(0,3);
}

export function attachmentFor(atlas:Atlas,part:Part):Attachment|null{
 const n=part.name.toLowerCase();
 const rule=RULES.find(r=>r.test.test(n));
 if(!rule)return null;
 const origins=rule.origin.flatMap(t=>boneHits(atlas,part,t));
 const insertions=rule.insertion.flatMap(t=>boneHits(atlas,part,t));
 const uniq=(list:Part[])=>[...new Map(list.map(p=>[p.id,p])).values()];
 const o=uniq(origins),i=uniq(insertions);
 if(!o.length&&!i.length)return {origin:rule.origin.join(', '),insertion:rule.insertion.join(', '),originIds:[],insertionIds:[],action:rule.action};
 return {
  origin:o.length?o.map(p=>p.name).join(', '):rule.origin.join(', '),
  insertion:i.length?i.map(p=>p.name).join(', '):rule.insertion.join(', '),
  originIds:o.map(p=>p.id),
  insertionIds:i.map(p=>p.id),
  action:rule.action,
 };
}
