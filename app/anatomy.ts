import type {PoseState} from './pose';
export type {PoseState};
export type SystemId = 'skeletal'|'muscular'|'arterial'|'venous'|'nervous'|'digestive'|'respiratory'|'urinary'|'reproductive'|'lymphatic'|'endocrine'|'integumentary'|'connective'|'sensory'|'cardiac';
export const SYSTEMS: {id:SystemId;name:string;color:string;description:string}[] = [
 {id:'skeletal',name:'Skeleton',color:'#efe4c4',description:'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.'},
 {id:'muscular',name:'Muscles',color:'#c24e46',description:'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.'},
 {id:'cardiac',name:'Heart',color:'#8b2e36',description:'The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.'},
 {id:'sensory',name:'Sensory organs',color:'#c9d6dc',description:'These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.'},
 {id:'arterial',name:'Arteries',color:'#cc3333',description:'The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.'},
 {id:'venous',name:'Veins',color:'#2e5a8f',description:'Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.'},
 {id:'nervous',name:'Nervous system',color:'#e6c04a',description:'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.'},
 {id:'respiratory',name:'Respiratory',color:'#d9a8b0',description:'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.'},
 {id:'digestive',name:'Digestive',color:'#c4a070',description:'The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.'},
 {id:'urinary',name:'Urinary',color:'#c48b72',description:'The kidneys filter blood and regulate fluid, electrolyte, and acid-base balance. Urine travels through the ureters to the bladder and exits through the urethra.'},
 {id:'lymphatic',name:'Lymphatic',color:'#6f9a68',description:'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes are not modeled; spleen and thymus are the lymphoid organs in this atlas.'},
 {id:'endocrine',name:'Endocrine',color:'#c5a09a',description:'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.'},
 {id:'reproductive',name:'Reproductive',color:'#bda098',description:'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.'},
 {id:'integumentary',name:'Skin and hair',color:'#c4a07a',description:'Skin and hair meshes are omitted in this atlas so muscle, viscera, and bone can be studied directly.'},
 {id:'connective',name:'Connective tissue',color:'#c5d5ce',description:'Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.'},
];
export interface Part {id:string;name:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;elements:string[]}
export interface Atlas {version:string;sex?:'male';source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export type View = 'three-quarter'|'front'|'back'|'side';
export type ClipPlane='transverse'|'sagittal'|'coronal';
export type RegionId='full'|'head'|'thorax'|'abdomen'|'pelvis'|'arm'|'leg';
export interface SceneState {
 inspectorOpen?:boolean;
 visible:SystemId[];
 selected:string[];
 hidden:string[];
 isolate:boolean;
 view:View;
 rotate:boolean;
 reset:number;
 xray:boolean;
 clip:number;
 skin:number;
 plane:ClipPlane;
 labels:boolean;
 region:RegionId;
 pose:PoseState;
 dissect:boolean;
 extractNonce:number;
 returnNonce:number;
 returnAllNonce:number;
}
export const DEFAULT_VISIBLE:SystemId[] = ['sensory','skeletal','muscular','nervous','respiratory','digestive','urinary','lymphatic','endocrine','reproductive','connective','cardiac'];
export const EXPLANATIONS:Record<string,string> = {
 'heart':'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
 'liver':'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
 'brain':'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
 'stomach':'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
 'spleen':'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
 'pancreas':'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
 'urinary bladder':'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
 'trachea':'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
 'diaphragm':'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
 'left lung':'The left lung occupies the left side of the chest. It has two lobes and shares the thoracic cavity with the heart, which sits slightly to the left.',
 'right lung':'The right lung occupies the right side of the chest. It has three lobes and is the larger of the two lungs.',
 'left kidney':'The left kidney filters blood in the upper left abdomen. It produces urine and helps regulate fluid, electrolytes, and blood pressure.',
 'right kidney':'The right kidney filters blood in the upper right abdomen, sitting slightly lower than the left kidney because of the liver above it.',
 'kidney':'Paired retroperitoneal organs that filter blood, form urine, and help regulate fluid, electrolyte, and acid-base balance.',
 'aorta':'The largest artery. It receives blood from the left ventricle and distributes it to the systemic circulation.',
 'abdominal aorta':'The portion of the aorta that descends through the abdomen and gives off branches to digestive, renal, and pelvic structures.',
 'esophagus':'A muscular tube that carries swallowed food and liquid from the pharynx to the stomach.',
 'gallbladder':'A small sac beneath the liver that stores and concentrates bile, then releases it into the small intestine to help digest fats.',
 'prostate':'A gland surrounding the proximal urethra in the male pelvis. It contributes fluid to semen.',
 'femur':'The thigh bone, the longest bone in the body. It transmits weight from the hip to the knee.',
 'left femur':'The left thigh bone. It articulates with the hip bone above and the tibia and patella below.',
 'right femur':'The right thigh bone. It articulates with the hip bone above and the tibia and patella below.',
 'skull':'The bony case of the head. It protects the brain and forms the facial skeleton.',
 'spinal cord':'The cord of nervous tissue inside the vertebral canal. It carries signals between the brain and the body and mediates many reflexes.',
 'small intestine':'The long, coiled tube after the stomach. Most chemical digestion and nutrient absorption occur here.',
 'large intestine':'The distal bowel that absorbs water and electrolytes and forms feces. It includes the cecum, colon, and rectum.',
 'duodenum':'The first part of the small intestine. It receives chyme from the stomach plus bile and pancreatic secretions.',
 'jejunum':'The middle part of the small intestine, with a rich mucosal surface for absorbing nutrients.',
 'ileum':'The final part of the small intestine. It absorbs remaining nutrients, including bile salts and vitamin B12, before joining the cecum.',
 'cecum':'The pouch at the start of the large intestine, where the ileum empties. The appendix is attached to it.',
 'appendix':'A narrow tube attached to the cecum. It contains lymphoid tissue and is a common site of inflammation.',
 'ascending colon':'The right-sided segment of colon that carries contents upward from the cecum toward the liver.',
 'transverse colon':'The horizontal segment of colon crossing the upper abdomen from right to left.',
 'descending colon':'The left-sided segment of colon that carries contents downward toward the sigmoid region and rectum.',
 'rectum':'The distal reservoir of the large intestine that stores feces before defecation.',
 'urethra':'The canal that carries urine from the bladder to the exterior. In the male it also carries semen.',
 'left testis':'The left gonad in the scrotum. It produces sperm and testosterone.',
 'right testis':'The right gonad in the scrotum. It produces sperm and testosterone.',
 'left eye':'The left organ of vision, sitting in the orbit and connected to the brain by the optic nerve.',
 'right eye':'The right organ of vision, sitting in the orbit and connected to the brain by the optic nerve.',
 'cerebellum':'A hindbrain structure that helps coordinate movement, posture, and motor learning.',
 'vertebral column':'The stacked vertebrae from neck to pelvis. It protects the spinal cord and supports the trunk.',
 'left humerus':'The bone of the left upper arm, running from the shoulder to the elbow.',
 'right humerus':'The bone of the right upper arm, running from the shoulder to the elbow.',
 'left tibia':'The larger bone of the left leg, carrying most of the weight from the knee to the ankle.',
 'right tibia':'The larger bone of the right leg, carrying most of the weight from the knee to the ankle.',
 'sternum':'The breastbone in the midline of the chest, where many ribs and the clavicles attach.',
 'rib':'A curved thoracic bone that helps form the chest wall and protect the heart and lungs.',
 'sacrum':'A triangular bone at the base of the spine that transmits weight to the pelvic girdle.',
 'left clavicle':'The left collarbone, a strut between the sternum and the scapula.',
 'right clavicle':'The right collarbone, a strut between the sternum and the scapula.',
 'left scapula':'The left shoulder blade, a platform for shoulder muscles and the glenohumeral joint.',
 'right scapula':'The right shoulder blade, a platform for shoulder muscles and the glenohumeral joint.',
 'mandible':'The lower jawbone. It holds the lower teeth and articulates with the skull at the temporomandibular joints.',
 'maxilla':'The upper jaw. It holds the upper teeth and contributes to the orbit, nasal cavity, and hard palate.',
 'left atrium':'The left upper chamber of the heart. It receives oxygenated blood from the pulmonary veins.',
 'right atrium':'The right upper chamber of the heart. It receives venous blood from the body and the coronary sinus.',
 'left ventricle':'The left lower chamber of the heart. Its thick wall pumps blood into the aorta.',
 'right ventricle':'The right lower chamber of the heart. It pumps blood into the pulmonary trunk toward the lungs.',
 'aortic valve':'The valve between the left ventricle and the aorta. It prevents blood from returning to the ventricle in diastole.',
 'mitral valve':'The valve between the left atrium and left ventricle, also called the bicuspid valve.',
 'bronchus':'A cartilaginous airway branching from the trachea toward the lungs.',
 'left main bronchus':'The airway from the trachea into the left lung. It is longer and more horizontal than the right main bronchus.',
 'right main bronchus':'The airway from the trachea into the right lung. It is shorter and more vertical than the left, so inhaled objects more often enter it.',
 'superior vena cava':'A large vein that returns blood from the head, neck, and upper limbs to the right atrium.',
 'inferior vena cava':'A large vein that returns blood from the abdomen, pelvis, and lower limbs to the right atrium.',
 'pulmonary trunk':'The artery leaving the right ventricle. It divides into left and right pulmonary arteries bound for the lungs.',
 'adrenal gland':'Paired endocrine glands on the kidneys. They produce steroid hormones and catecholamines that regulate stress, metabolism, and blood pressure.',
 'left adrenal gland':'The left suprarenal gland, sitting on the upper pole of the left kidney.',
 'right adrenal gland':'The right suprarenal gland, sitting on the upper pole of the right kidney.',
 'skin':'The outer covering of the body. It is a barrier, a sensory surface, and a participant in temperature regulation.',
 'left hip bone':'The left pelvic bone, formed from ilium, ischium, and pubis. It articulates with the sacrum and the femur.',
 'right hip bone':'The right pelvic bone, formed from ilium, ischium, and pubis. It articulates with the sacrum and the femur.',
 'patella':'The kneecap, a sesamoid bone in the quadriceps tendon that improves leverage at the knee.',
 'left patella':'The left kneecap, embedded in the quadriceps tendon.',
 'right patella':'The right kneecap, embedded in the quadriceps tendon.',
};
export function explanation(name:string,system:SystemId){return EXPLANATIONS[name.toLowerCase()] ?? SYSTEMS.find(s=>s.id===system)?.description ?? '';}

export const LABEL_PARTS:{name:string;label:string}[]=[
 {name:'Wall of ventricle',label:'Heart'},
 {name:'Caudate lobe of liver',label:'Liver'},
 {name:'Cerebellum',label:'Cerebellum'},
 {name:'Stomach',label:'Stomach'},
 {name:'Spleen',label:'Spleen'},
 {name:'Left kidney',label:'Left kidney'},
 {name:'Right kidney',label:'Right kidney'},
 {name:'Urinary bladder',label:'Bladder'},
 {name:'Trachea',label:'Trachea'},
 {name:'Prostate',label:'Prostate'},
];

export function fmaUrl(id:string){
 const numeric=id.replace(/^FMA/i,'');
 return `https://www.ebi.ac.uk/ols4/ontologies/fma/classes/http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FFMA_${numeric}`;
}
