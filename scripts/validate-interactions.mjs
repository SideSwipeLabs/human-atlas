import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createExplosionLayout} from '../app/explosion-layout.ts';
import {PointerTap} from '../app/pointer-tap.ts';
import {atlasTools} from '../app/agent-tools.ts';
import {searchAnatomy} from '../app/search.ts';
import {parseHash,serializeHash} from '../app/url-state.ts';
import {buildConceptIndex,relatedConcepts} from '../app/related.ts';
import {DEFAULT_VISIBLE} from '../app/anatomy.ts';
import {poseGroupOf,poseIsRest,poseQuaternions,REST_POSE} from '../app/pose.ts';
import {displaySystem,focusElements} from '../app/classify.ts';

for (const file of ['atlas.json']) {
  const atlas=JSON.parse(await readFile(new URL(`../public/models/${file}`,import.meta.url)));
  const groups=[atlas.parts,...[...new Set(atlas.parts.map(p=>p.system))].map(system=>atlas.parts.filter(p=>p.system===system))];
  for(const group of groups) for(const aspect of [.46,1,1.7]) {
    const layout=createExplosionLayout(group,aspect),cells=[...layout.cells.values()];
    assert.equal(cells.length,group.length);
    for(let i=0;i<cells.length;i++) {
      const a=cells[i];
      assert.ok(Math.abs(a.x)+a.width/2<=layout.width/2+1e-8);
      assert.ok(Math.abs(a.y)+a.height/2<=layout.height/2+1e-8);
      for(let j=i+1;j<cells.length;j++) {
        const b=cells[j];
        assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2-1e-8 || Math.abs(a.y-b.y)>=(a.height+b.height)/2-1e-8,'Exploded pieces overlap');
      }
    }
  }
  let selected=null;
  const [find,inspect]=atlasTools(atlas,c=>{selected=c;});
  const results=find.execute({query:'femur'});
  assert.ok(results.length>0);
  assert.equal(searchAnatomy(atlas,'heart')[0].name.toLowerCase(),'heart');
  assert.ok(searchAnatomy(atlas,'femur').some(c=>c.name.toLowerCase()==='femur'||c.name.toLowerCase().includes('femur')));
  const ranked=searchAnatomy(atlas,'left femur');
  assert.equal(ranked[0].name.toLowerCase(),'left femur');
  const hash=serializeHash({concept:'FMA7088',state:{view:'front',xray:true,clip:.4,isolate:true,visible:['skeletal'],pose:{leftArm:.72,rightArm:.72,leftArmFwd:0,rightArmFwd:0,leftLeg:0,rightLeg:0,head:0}},defaultVisible:DEFAULT_VISIBLE});
  const parsed=parseHash(hash);
  assert.equal(parsed.concept,'FMA7088');
  assert.equal(parsed.view,'front');
  assert.equal(parsed.xray,true);
  assert.equal(parsed.isolate,true);
  assert.equal(parsed.pose?.leftArm,.72);
  assert.deepEqual(parsed.systems,['skeletal']);
  assert.equal(parseHash('').concept,undefined);
  assert.equal(serializeHash({state:{view:'three-quarter',xray:false,clip:0,isolate:false,visible:DEFAULT_VISIBLE,pose:{leftArm:0,rightArm:0,leftArmFwd:0,rightArmFwd:0,leftLeg:0,rightLeg:0,head:0}},defaultVisible:DEFAULT_VISIBLE}),'');
  const named=Object.fromEntries(atlas.parts.map(p=>{const a=p.bounds[0],b=p.bounds[1];return [p.name.toLowerCase(),poseGroupOf(p.name,(a[0]+b[0])/2,(a[1]+b[1])/2)];}));
  assert.equal(named['left humerus'],1);
  assert.equal(named['right humerus'],2);
  assert.equal(named['left femur'],3);
  assert.equal(named['right femur'],4);
  assert.equal(named['mandible'],5);
  assert.equal(named['skin'],0);
  assert.equal(named['left clavicle'],0);
  assert.equal(named['left hip bone'],0);
  assert.equal(named['distal phalanx of left big toe'],3);
  assert.equal(named['distal phalanx of right little toe'],4);
  assert.equal(named['distal phalanx of left index finger'],1);
  assert.equal(named['distal phalanx of right ring finger'],2);
  assert.equal(named['proximal phalanx of left thumb'],1);
  assert.equal(named['long head of left biceps femoris'],3);
  assert.equal(named['first lumbrical of left foot'],3);
  assert.equal(named['left flexor digitorum longus'],3);
  const fib=atlas.parts.find(p=>/left fibularis longus/i.test(p.name));
  assert.equal(displaySystem(fib),'muscular');
  const tib=atlas.parts.find(p=>/left tibialis anterior/i.test(p.name));
  assert.equal(displaySystem(tib),'muscular');
  assert.equal(searchAnatomy(atlas,'skin').every(c=>c.name.toLowerCase()!=='skin'),true);
  assert.ok(named['acromial part of left deltoid']===1||named['left deltoid']===1||Object.entries(named).some(([k,g])=>k.includes('deltoid')&&k.includes('left')&&g===1));
  assert.equal(named['left scapula'],0);
  const lid=Object.entries(named).find(([k])=>k.includes('tarsal plate'));
  if(lid)assert.equal(lid[1],5);
  const third=atlas.parts.find(p=>p.name.toLowerCase()==='third ventricle');
  assert.equal(displaySystem(third),'nervous');
  const pap=atlas.parts.find(p=>/papillary muscle of left ventricle/i.test(p.name));
  assert.equal(displaySystem(pap),'cardiac');
  const ret=atlas.parts.find(p=>/flexor retinaculum of left wrist/i.test(p.name));
  if(ret)assert.equal(displaySystem(ret),'connective');
  const plexus=atlas.parts.find(p=>/choroid plexus/i.test(p.name));
  if(plexus)assert.equal(displaySystem(plexus),'nervous');
  const tfl=atlas.parts.find(p=>/tensor fasciae latae/i.test(p.name));
  if(tfl)assert.equal(displaySystem(tfl),'muscular');
  const lac=atlas.parts.find(p=>/lacrimal bone/i.test(p.name));
  if(lac)assert.equal(displaySystem(lac),'skeletal');
  const heart=atlas.concepts.find(c=>c.name.toLowerCase()==='heart');
  const core=focusElements(atlas,heart);
  assert.ok(core.length<heart.elements.length);
  assert.ok(core.length>=10);
  const leftHeart=atlas.concepts.find(c=>c.name.toLowerCase()==='left side of heart');
  if(leftHeart){
    const leftCore=focusElements(atlas,leftHeart);
    assert.ok(leftCore.length<core.length);
    assert.ok(leftCore.every(id=>{const n=atlas.parts.find(p=>p.id===id)?.name.toLowerCase()??'';return !n.includes('right')||n.includes('wall of ventricle')||n.includes('septal');}));
  }

  assert.ok(poseIsRest(REST_POSE));
  const raised=poseQuaternions({...REST_POSE,leftArm:1});
  assert.ok(Math.abs(raised[1].z)>0.4);
  assert.equal(raised[0].w,1);
  const index=buildConceptIndex(atlas);
  const femur=atlas.concepts.find(c=>c.name.toLowerCase()==='left femur');
  assert.ok(femur);
  const related=relatedConcepts(index,femur.elements,femur.id);
  assert.ok(related.some(c=>c.name.toLowerCase()==='femur'||c.elements.length>=femur.elements.length));
  inspect.execute({id:results[0].id});
  const previous=selected;
  assert.throws(()=>inspect.execute({id:'nonexistent-structure'}));
  assert.equal(selected,previous);
  assert.throws(()=>find.execute({query:' '}));
  console.log(`${file}: packing at desktop/mobile aspect ratios and search/inspection contracts passed.`);
}
const tap=new PointerTap();
tap.down(1,10,10,5);assert.equal(tap.up(1,12,11),true);
tap.down(1,10,10,5);tap.move(1,40,10);assert.equal(tap.up(1,10,10),false);
tap.down(1,10,10,12);tap.down(2,20,20,12);assert.equal(tap.up(2,20,20),false);assert.equal(tap.up(1,10,10),false);
tap.down(1,10,10,5);tap.cancel(1);assert.equal(tap.up(1,10,10),false);
tap.down(1,10,10,5);assert.equal(tap.up(1,10,10),true);
assert.equal(createExplosionLayout([]).cells.size,0);
console.log('Tap, drag, multitouch, cancellation, and empty-view checks passed.');
