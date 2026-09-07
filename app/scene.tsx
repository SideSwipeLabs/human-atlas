import {useEffect,useRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {decodeModelResponse} from './model-download';
import {PointerTap} from './pointer-tap';
import {LABEL_PARTS,SYSTEMS,type Atlas,type SceneState} from './anatomy';
import {clipAxis,clipLimit,REGIONS} from './dissection';
import {POSE_PIVOTS,poseGroupOf,poseQuaternions} from './pose';
import {displaySystem,organLook} from './classify';
import {isCovering,tissueOf,uniqueMesh} from './tissue';

interface Props {
 atlas:Atlas;
 state:SceneState;
 onSelect:(id:string)=>void;
 onProgress:(n:number)=>void;
 onError:(s:string)=>void;
 onPulled:(n:number)=>void;
}

export default function AnatomyScene({atlas,state,onSelect,onProgress,onError,onPulled}:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(state),select=useRef(onSelect),pulled=useRef(onPulled);
 latest.current=state;select.current=onSelect;pulled.current=onPulled;
 useEffect(()=>{
  const el=host.current!;let disposed=false,frame=0,dirty=true,ready=false,lastView='',lastReset=-1,lastIsolate='',lastRegion='full',hoverIndex=-1,lastHover=-1,hoverPending=false,hoverX=0,hoverY=0,lastClip=-1;
  let lastState:SceneState|null=null,lastExtract=0,lastReturn=0,lastReturnAll=0,lastPulled=-1,pointers=0;
  const abort=new AbortController();
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{onError('This browser could not start the 3D viewer. Please try a browser with WebGL enabled.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<768?1.5:2));renderer.setClearColor('#8a8680');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;el.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Interactive human anatomy. Drag to rotate. Tap a structure to inspect it. Turn on Dissect to pull parts out.');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.005,100);
  const orbit=new OrbitControls(camera,renderer.domElement);
  camera.position.set(1.4,1.05,3.6);orbit.target.set(0,.85,0);orbit.enableDamping=true;orbit.dampingFactor=.085;orbit.minDistance=.07;orbit.maxDistance=40;orbit.maxPolarAngle=Math.PI*.96;orbit.zoomToCursor=true;orbit.addEventListener('change',()=>{dirty=true;});
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight(0xf2f0ea,0x6a5e58,.4));
  const key=new T.DirectionalLight(0xfff1e4,1.35);key.position.set(-3.2,2.4,1.1);scene.add(key);
  const rim=new T.DirectionalLight(0xdde6f4,.55);rim.position.set(2.2,1.6,-2.4);scene.add(rim);
  const fill=new T.DirectionalLight(0xf2f3f5,.18);fill.position.set(.4,.6,3.2);scene.add(fill);
  const clipYUniform={value:8},clipAxisUniform={value:0};
  const poseQs=POSE_PIVOTS.map(()=>new T.Vector4(0,0,0,1));
  const posePs=POSE_PIVOTS.map(p=>new T.Vector3(p[0],p[1],p[2]));
  const width=T.MathUtils.ceilPowerOfTwo(atlas.parts.length),data=new Float32Array(width*4),partTexture=new T.DataTexture(data,width,1,T.RGBAFormat,T.FloatType);partTexture.needsUpdate=true;
  const selectedData=new Uint8Array(width*4),selectionTexture=new T.DataTexture(selectedData,width,1);selectionTexture.needsUpdate=true;
  const materials:T.Material[]=[],geometries:T.BufferGeometry[]=[],pickers:(T.Mesh|undefined)[]=[],centers=atlas.parts.map(p=>new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(.5));
  const bounds=atlas.parts.map(p=>new T.Box3(new T.Vector3().fromArray(p.bounds[0]),new T.Vector3().fromArray(p.bounds[1])));
  const groups=atlas.parts.map((p,i)=>poseGroupOf(p.name,centers[i].x,centers[i].y));
  atlas.parts.forEach((_,i)=>{selectedData[i*4+3]=groups[i];});
  const nParts=atlas.parts.length;
  const userOff=new Float32Array(nParts*3),dispOff=new Float32Array(nParts*3);
  const hover=document.createElement('div');hover.className='part-hover';hover.setAttribute('role','tooltip');hover.hidden=true;el.appendChild(hover);
  const labelRoot=document.createElement('div');labelRoot.className='anatomy-labels';el.appendChild(labelRoot);
  const labelNodes=LABEL_PARTS.map(spec=>{
   const index=atlas.parts.findIndex(p=>p.name===spec.name);
   const node=document.createElement('span');node.className='anatomy-label';node.textContent=spec.label;node.hidden=true;labelRoot.appendChild(node);
   return {index,node};
  }).filter(l=>l.index>=0);
  const projected=new T.Vector3();
  const pickerQ=new T.Quaternion(),pickerM=new T.Matrix4(),pickerR=new T.Matrix4(),pickerNeg=new T.Matrix4();
  const camRight=new T.Vector3(),camUp=new T.Vector3(),radial=new T.Vector3();
  type Drag={id:number;indices:number[];x:number;y:number;moved:boolean};
  let drag:Drag|null=null;
  const attachAtlas=(m:T.MeshStandardMaterial,kind:'iris'|'clear'|''='',irisCenter?:T.Vector3)=>{
   m.onBeforeCompile=shader=>{
    shader.uniforms.partState={value:partTexture};shader.uniforms.selectionState={value:selectionTexture};shader.uniforms.stateWidth={value:width};shader.uniforms.clipY=clipYUniform;shader.uniforms.clipAxis=clipAxisUniform;
    shader.uniforms.irisCenter={value:irisCenter??new T.Vector3()};
    shader.uniforms.poseQ0={value:poseQs[0]};shader.uniforms.poseQ1={value:poseQs[1]};shader.uniforms.poseQ2={value:poseQs[2]};shader.uniforms.poseQ3={value:poseQs[3]};shader.uniforms.poseQ4={value:poseQs[4]};shader.uniforms.poseQ5={value:poseQs[5]};
    shader.uniforms.poseP0={value:posePs[0]};shader.uniforms.poseP1={value:posePs[1]};shader.uniforms.poseP2={value:posePs[2]};shader.uniforms.poseP3={value:posePs[3]};shader.uniforms.poseP4={value:posePs[4]};shader.uniforms.poseP5={value:posePs[5]};
    shader.vertexShader=`attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; uniform vec4 poseQ0; uniform vec4 poseQ1; uniform vec4 poseQ2; uniform vec4 poseQ3; uniform vec4 poseQ4; uniform vec4 poseQ5; uniform vec3 poseP0; uniform vec3 poseP1; uniform vec3 poseP2; uniform vec3 poseP3; uniform vec3 poseP4; uniform vec3 poseP5; varying float partVisible; varying float partSelected; varying float partHovered; varying float partDimmed; varying vec3 atlasPos; varying vec3 atlasRest;
vec4 poseQ(float g){ if (g < 0.5) return poseQ0; if (g < 1.5) return poseQ1; if (g < 2.5) return poseQ2; if (g < 3.5) return poseQ3; if (g < 4.5) return poseQ4; return poseQ5; }
vec3 poseP(float g){ if (g < 0.5) return poseP0; if (g < 1.5) return poseP1; if (g < 2.5) return poseP2; if (g < 3.5) return poseP3; if (g < 4.5) return poseP4; return poseP5; }
vec3 qrot(vec4 q, vec3 v){ return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
`+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvec2 poseUv = vec2((partIndex + 0.5) / stateWidth, 0.5); float poseGroup = texture2D(selectionState, poseUv).a * 255.0; objectNormal = qrot(poseQ(poseGroup), objectNormal);');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); atlasRest = transformed; float g = texture2D(selectionState, stateUv).a * 255.0; vec3 pivot = poseP(g); transformed = qrot(poseQ(g), transformed - pivot) + pivot; transformed += state.xyz; atlasPos = transformed; partVisible = state.w; vec4 selectSample = texture2D(selectionState, stateUv); partSelected = selectSample.r; partHovered = selectSample.g; partDimmed = selectSample.b;');
    shader.fragmentShader='uniform float clipY; uniform float clipAxis; uniform vec3 irisCenter; varying float partVisible; varying float partSelected; varying float partHovered; varying float partDimmed; varying vec3 atlasPos; varying vec3 atlasRest;\n'+shader.fragmentShader;
    let clip='if (partVisible < 0.5) discard;\nif (clipY < 4.0) { float coord = mix(mix(atlasPos.y, atlasPos.x, step(0.5, clipAxis)), atlasPos.z, step(1.5, clipAxis)); if (coord > clipY) discard; }';
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n'+clip);
    let color='\nif (!gl_FrontFacing) diffuseColor.rgb *= 0.48;\nif (clipY < 4.0) { float capCoord = mix(mix(atlasPos.y, atlasPos.x, step(0.5, clipAxis)), atlasPos.z, step(1.5, clipAxis)); if (abs(capCoord - clipY) < 0.004) diffuseColor.rgb *= 0.55; }\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.80, 0.82), partDimmed * 0.55);\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.62, 0.28), partHovered * (1.0 - partSelected) * 0.45);\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.22, 0.71, 0.64), partSelected * 0.28);';
    if(kind==='iris')color+='\nvec3 irisDelta = atlasRest - irisCenter; irisDelta.z *= 0.2; if (length(irisDelta) < 0.0022) diffuseColor.rgb = vec3(0.03, 0.02, 0.02);';
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>'+color);
   };
   m.envMapIntensity=.22;m.userData.kind=kind;materials.push(m);return m;
  };
  const materialFor=(system:string)=>{
   const tube=system==='arterial'||system==='venous'||system==='nervous';
   const roughness=system==='muscular'?.86:system==='skeletal'?.78:system==='cardiac'?.62:system==='connective'?.7:tube?.4:.52;
   const mat=attachAtlas(new T.MeshStandardMaterial({color:SYSTEMS.find(s=>s.id===system)?.color??'#aebbb8',metalness:0,roughness,side:tube?T.DoubleSide:T.FrontSide}));
   if(system==='muscular'||system==='cardiac')mat.envMapIntensity=.12;
   return mat;
  };
  const mats=new Map(SYSTEMS.map(s=>[s.id,materialFor(s.id)]));
  const lookMats=new Map<string,T.MeshStandardMaterial>();
  const lookMaterial=(look:{color:number;roughness:number})=>{
   const key=look.color+':'+look.roughness;
   let mat=lookMats.get(key);
   if(!mat){mat=attachAtlas(new T.MeshStandardMaterial({color:look.color,roughness:look.roughness,metalness:0,side:T.FrontSide}));lookMats.set(key,mat);}
   return mat;
  };
  const tissueMaterial=(tissue:ReturnType<typeof tissueOf>,center:T.Vector3)=>{
   if(tissue==='eyelid')return attachAtlas(new T.MeshStandardMaterial({color:0xd9d4c8,roughness:.7,metalness:0,side:T.FrontSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
   if(tissue==='cornea')return attachAtlas(new T.MeshPhysicalMaterial({color:0xffffff,roughness:.04,metalness:0,transmission:.85,thickness:.0005,ior:1.376,transparent:true,opacity:1,clearcoat:.8,clearcoatRoughness:.06,side:T.FrontSide,depthWrite:false}) as T.MeshStandardMaterial,'clear');
   if(tissue==='cartilage'||tissue==='ear')return attachAtlas(new T.MeshStandardMaterial({color:0xc5dbe3,roughness:.45,metalness:0,side:T.FrontSide}));
   if(tissue==='csf')return attachAtlas(new T.MeshStandardMaterial({color:0xb7d4e6,roughness:.2,metalness:0,transparent:true,opacity:.55,side:T.FrontSide,depthWrite:false}));
   if(tissue==='lacrimal')return attachAtlas(new T.MeshStandardMaterial({color:0xe8b8b0,roughness:.58,metalness:0,side:T.FrontSide}));
   if(tissue==='iris')return attachAtlas(new T.MeshStandardMaterial({color:0x5a3a1c,roughness:.38,metalness:0,side:T.FrontSide,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),'iris',center);
   if(tissue==='sclera')return attachAtlas(new T.MeshStandardMaterial({color:0xeef2f4,roughness:.7,metalness:0,side:T.FrontSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));
   if(tissue==='lens')return attachAtlas(new T.MeshPhysicalMaterial({color:0xfff6e8,roughness:.08,metalness:0,transmission:.55,thickness:.004,ior:1.41,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}) as T.MeshStandardMaterial,'clear');
   if(tissue==='vitreous')return attachAtlas(new T.MeshPhysicalMaterial({color:0xe7f3f6,roughness:.04,metalness:0,transmission:.8,transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false}) as T.MeshStandardMaterial,'clear');
   if(tissue==='retina')return attachAtlas(new T.MeshStandardMaterial({color:0x7a3038,roughness:.6,metalness:0,side:T.DoubleSide}));
   if(tissue==='choroid')return attachAtlas(new T.MeshStandardMaterial({color:0x3d1520,roughness:.55,metalness:0,side:T.DoubleSide}));
   if(tissue==='aqueous')return attachAtlas(new T.MeshStandardMaterial({color:0xeef6fa,roughness:.05,metalness:0,transparent:true,opacity:.08,side:T.DoubleSide,depthWrite:false}));
   return materialFor('sensory');
  };
  let loaded=0;
  const loadChunk=async(ci:number)=>{
   const chunk=atlas.chunks[ci],compressed=!!chunk.gzip&&typeof DecompressionStream!=='undefined';const response=await fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal});const buffer=await decodeModelResponse(response,chunk.bytes,compressed);if(disposed)return;
   const groupsBySystem=new Map<string,T.BufferGeometry[]>();
   const groupsByLook=new Map<string,T.BufferGeometry[]>();
   atlas.parts.forEach((p,i)=>{
    if(p.chunk!==ci||isCovering(tissueOf(p)))return;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,p.positions,p.vertexCount*3),3));
    g.setAttribute('normal',new T.BufferAttribute(new Int16Array(buffer,p.normals,p.vertexCount*3),3,true));g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,p.indices,p.indexCount),1));
    g.computeBoundingBox();if(g.boundingBox)bounds[i].copy(g.boundingBox);
    g.computeBoundingSphere();const pick=new T.Mesh(g);pick.matrixAutoUpdate=false;pickers[i]=pick;geometries.push(g);
    g.setAttribute('partIndex',new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i),1));
    const tissue=tissueOf(p);
    const look=organLook(p.name,displaySystem(p));
    if(uniqueMesh(tissue)){
     const center=g.boundingSphere?.center.clone()??new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(.5);
     const mesh=new T.Mesh(g,tissueMaterial(tissue,center));mesh.frustumCulled=false;
     if(tissue==='cornea')mesh.renderOrder=3;else if(tissue==='aqueous'||tissue==='lens')mesh.renderOrder=2;else if(tissue==='vitreous')mesh.renderOrder=1;else if(tissue==='eyelid')mesh.renderOrder=2;
     scene.add(mesh);
    }else if(look){
     const key=look.color+':'+look.roughness;const list=groupsByLook.get(key)??[];list.push(g);groupsByLook.set(key,list);
    }else{
     const sys=displaySystem(p);const list=groupsBySystem.get(sys)??[];list.push(g);groupsBySystem.set(sys,list);
    }
   });
   groupsByLook.forEach((gs,key)=>{const geometry=mergeGeometries(gs,false);if(!geometry)throw new Error('Could not assemble anatomy geometry.');geometries.push(geometry);const [color,roughness]=key.split(':').map(Number);const mesh=new T.Mesh(geometry,lookMaterial({color,roughness}));mesh.frustumCulled=false;scene.add(mesh);});
   groupsBySystem.forEach((gs,system)=>{const geometry=mergeGeometries(gs,false);if(!geometry)throw new Error('Could not assemble anatomy geometry.');geometries.push(geometry);const mesh=new T.Mesh(geometry,mats.get(system as never));mesh.frustumCulled=false;scene.add(mesh);});
   lastState=null;loaded++;onProgress(Math.round(loaded/atlas.chunks.length*100));dirty=true;
  };
  (async()=>{try{let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<atlas.chunks.length){const i=cursor++;await loadChunk(i);}}));if(!disposed){ready=true;dirty=true;}}catch(e){if(!disposed)onError(e instanceof Error?e.message:'Could not load the anatomy.');}})();
  const viewDir=(view:string)=>view==='front'?new T.Vector3(0,.02,1):view==='back'?new T.Vector3(0,.02,-1):view==='side'?new T.Vector3(1,.02,0):new T.Vector3(.35,.06,1).normalize();
  const fit=(view:string)=>{
   const mobile=el.clientWidth<768,distance=mobile?Math.max(3.2,1.35*el.clientHeight/Math.max(160,el.clientHeight-220)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))):2.7;
   orbit.target.set(0,mobile?.92:1.02,0);camera.position.copy(orbit.target).addScaledVector(viewDir(view),distance);orbit.update();dirty=true;
  };
  const frameRegion=(id:string,view:string)=>{
   const region=REGIONS.find(r=>r.id===id);if(!region||region.id==='full'){fit(view);return;}
   orbit.target.fromArray(region.target);camera.position.copy(orbit.target).addScaledVector(viewDir(view),region.distance);orbit.update();dirty=true;
  };
  const resize=()=>{lastState=null;renderer.setPixelRatio(Math.min(devicePixelRatio,el.clientWidth<768||el.clientHeight<600?1.5:2));camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);dirty=true;};const observer=new ResizeObserver(resize);observer.observe(el);
  const raycaster=new T.Raycaster(),pointer=new T.Vector2(),tap=new PointerTap(),worldBox=new T.Box3(),hitPoint=new T.Vector3();
  const clipY=()=>{const s=latest.current;return clipLimit(s.plane??'transverse',s.clip??0,!!s.isolate);};
  const writePicker=(i:number)=>{
   const mesh=pickers[i];if(!mesh)return;
   const g=groups[i],q=poseQs[g],p=posePs[g];
   pickerQ.set(q.x,q.y,q.z,q.w);
   pickerM.makeTranslation(p.x+dispOff[i*3],p.y+dispOff[i*3+1],p.z+dispOff[i*3+2]);
   pickerR.makeRotationFromQuaternion(pickerQ);
   pickerM.multiply(pickerR);
   pickerNeg.makeTranslation(-p.x,-p.y,-p.z);
   pickerM.multiply(pickerNeg);
   mesh.matrix.copy(pickerM);mesh.matrixWorld.copy(pickerM);
  };
  const pickAt=(clientX:number,clientY:number)=>{
   const rect=renderer.domElement.getBoundingClientRect();
   pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
   let nearest=Infinity,found=-1,point:T.Vector3|undefined;const yLimit=clipY();
   const plane=latest.current.plane??'transverse';
   const clipped=(p:T.Vector3)=>{if(yLimit>=4)return false;const coord=plane==='sagittal'?p.x:plane==='coronal'?p.z:p.y;return coord>yLimit;};
   pickers.forEach((mesh,i)=>{if(!mesh||data[i*4+3]<.5)return;worldBox.copy(bounds[i]).applyMatrix4(mesh.matrix);if(yLimit<4){if(plane==='transverse'&&worldBox.min.y>yLimit)return;if(plane==='sagittal'&&worldBox.min.x>yLimit)return;if(plane==='coronal'&&worldBox.min.z>yLimit)return;}if(!raycaster.ray.intersectBox(worldBox,hitPoint))return;const hits=raycaster.intersectObject(mesh,false);const hit=hits[0];if(hit&&!clipped(hit.point)&&hit.distance<nearest){nearest=hit.distance;found=i;point=hit.point;}});
   return {found,x:clientX-rect.left,y:clientY-rect.top,point};
  };
  const showHover=(index:number,x:number,y:number)=>{
   hoverIndex=index;
   if(drag){hover.hidden=true;renderer.domElement.style.cursor='grabbing';return;}
   if(index<0){hover.hidden=true;renderer.domElement.style.cursor=latest.current.dissect?'crosshair':'grab';return;}
   hover.hidden=false;hover.textContent=atlas.parts[index].name;hover.style.left=`${Math.max(8,Math.min(x+14,el.clientWidth-260))}px`;hover.style.top=`${Math.max(8,Math.min(y+18,el.clientHeight-55))}px`;renderer.domElement.style.cursor=latest.current.dissect?'grab':'pointer';
  };
  const reportPulled=()=>{
   let n=0;for(let i=0;i<nParts;i++)if(userOff[i*3]*userOff[i*3]+userOff[i*3+1]*userOff[i*3+1]+userOff[i*3+2]*userOff[i*3+2]>1e-8)n++;
   if(n!==lastPulled){lastPulled=n;pulled.current(n);}
  };
  const extractSelected=()=>{
   const sel=new Set(latest.current.selected);
   camRight.setFromMatrixColumn(camera.matrixWorld,0);
   const idxs:number[]=[];atlas.parts.forEach((p,i)=>{if(sel.has(p.id))idxs.push(i);});
   if(!idxs.length)return;
   radial.set(0,0,0);for(const i of idxs)radial.add(centers[i]);radial.multiplyScalar(1/idxs.length);
   radial.set(radial.x,(radial.y-.85)*.35,radial.z);
   if(radial.lengthSq()<0.002)radial.copy(camRight);
   radial.normalize().multiplyScalar(.22);
   for(const i of idxs){userOff[i*3]+=radial.x;userOff[i*3+1]+=radial.y;userOff[i*3+2]+=radial.z;dispOff[i*3]=userOff[i*3];dispOff[i*3+1]=userOff[i*3+1];dispOff[i*3+2]=userOff[i*3+2];}
   reportPulled();lastState=null;dirty=true;
  };
  const returnParts=(all:boolean)=>{
   const sel=new Set(latest.current.selected);
   for(let i=0;i<nParts;i++){
    if(!all&&!sel.has(atlas.parts[i].id))continue;
    userOff[i*3]=0;userOff[i*3+1]=0;userOff[i*3+2]=0;
   }
   reportPulled();lastState=null;dirty=true;
  };
  const endDrag=()=>{
   if(!drag)return;
   drag=null;orbit.enabled=true;renderer.domElement.style.cursor='grab';reportPulled();
  };
  const down=(e:PointerEvent)=>{
   hover.hidden=true;pointers++;tap.down(e.pointerId,e.clientX,e.clientY,e.pointerType==='touch'?12:5);
   if(pointers>1){if(drag)endDrag();orbit.enabled=true;return;}
   if(e.button!==0||e.altKey||!ready)return;
   if(!latest.current.dissect)return;
   const hit=pickAt(e.clientX,e.clientY);
   if(hit.found<0)return;
   const s=latest.current,id=atlas.parts[hit.found].id;
   const indices=s.selected.includes(id)&&s.selected.length>1?atlas.parts.map((p,i)=>s.selected.includes(p.id)?i:-1).filter(i=>i>=0):[hit.found];
   drag={id:e.pointerId,indices,x:e.clientX,y:e.clientY,moved:false};
  };
  const move=(e:PointerEvent)=>{
   tap.move(e.pointerId,e.clientX,e.clientY);
   if(drag&&drag.id===e.pointerId){
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<(e.pointerType==='touch'?12:5))return;
    if(!drag.moved){orbit.enabled=false;try{renderer.domElement.setPointerCapture(e.pointerId);}catch{/* ignore */}}
    drag.moved=true;
    const dist=camera.position.distanceTo(orbit.target);
    const worldH=2*dist*Math.tan(T.MathUtils.degToRad(camera.fov/2));
    const worldW=worldH*camera.aspect;
    camRight.setFromMatrixColumn(camera.matrixWorld,0);
    camUp.setFromMatrixColumn(camera.matrixWorld,1);
    const sx=dx/Math.max(1,el.clientWidth)*worldW,sy=-dy/Math.max(1,el.clientHeight)*worldH;
    for(const i of drag.indices){
     userOff[i*3]+=camRight.x*sx+camUp.x*sy;
     userOff[i*3+1]+=camRight.y*sx+camUp.y*sy;
     userOff[i*3+2]+=camRight.z*sx+camUp.z*sy;
     dispOff[i*3]=userOff[i*3];dispOff[i*3+1]=userOff[i*3+1];dispOff[i*3+2]=userOff[i*3+2];
    }
    drag.x=e.clientX;drag.y=e.clientY;lastState=null;dirty=true;showHover(-1,0,0);return;
   }
   if(e.buttons||e.pointerType==='touch'){showHover(-1,0,0);return;}
   hoverX=e.clientX;hoverY=e.clientY;hoverPending=true;
  };
  const cancel=(e:PointerEvent)=>{tap.cancel(e.pointerId);if(drag&&drag.id===e.pointerId)endDrag();pointers=Math.max(0,pointers-1);};
  const up=(e:PointerEvent)=>{
   const validTap=tap.up(e.pointerId,e.clientX,e.clientY);
   const wasDrag=drag&&drag.id===e.pointerId;const moved=!!wasDrag&&drag!.moved;
   if(wasDrag)endDrag();
   pointers=Math.max(0,pointers-1);
   if(!validTap||!ready||moved)return;
   const {found}=pickAt(e.clientX,e.clientY);
   if(found>=0){hover.hidden=true;select.current(atlas.parts[found].id);}
  };
  const leave=()=>showHover(-1,0,0);
  const onWinUp=(e:PointerEvent)=>{if(drag&&drag.id===e.pointerId)up(e);};
  renderer.domElement.addEventListener('pointerdown',down,true);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);renderer.domElement.addEventListener('pointerleave',leave);
  window.addEventListener('pointerup',onWinUp);window.addEventListener('pointercancel',onWinUp);
  const clock=new T.Clock();
  const animate=()=>{
   if(disposed)return;frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),s=latest.current;
   const yLimit=clipY();const axis=clipAxis(s.plane??'transverse');if(yLimit!==lastClip||clipAxisUniform.value!==axis){clipYUniform.value=yLimit;clipAxisUniform.value=axis;lastClip=yLimit;dirty=true;}
   const qs=poseQuaternions(s.pose);
   for(let g=0;g<6;g++){if(poseQs[g].x!==qs[g].x||poseQs[g].y!==qs[g].y||poseQs[g].z!==qs[g].z||poseQs[g].w!==qs[g].w){poseQs[g].set(qs[g].x,qs[g].y,qs[g].z,qs[g].w);dirty=true;lastState=null;}}
   if(s.extractNonce!==lastExtract){lastExtract=s.extractNonce;if(s.extractNonce)extractSelected();}
   if(s.returnNonce!==lastReturn){lastReturn=s.returnNonce;if(s.returnNonce)returnParts(false);}
   if(s.returnAllNonce!==lastReturnAll){lastReturnAll=s.returnAllNonce;if(s.returnAllNonce)returnParts(true);}
   let settling=false;
   for(let i=0;i<nParts;i++){
    const tx=userOff[i*3],ty=userOff[i*3+1],tz=userOff[i*3+2];
    const dx=tx-dispOff[i*3],dy=ty-dispOff[i*3+1],dz=tz-dispOff[i*3+2];
    if(dx*dx+dy*dy+dz*dz<1e-10){dispOff[i*3]=tx;dispOff[i*3+1]=ty;dispOff[i*3+2]=tz;continue;}
    dispOff[i*3]=T.MathUtils.damp(dispOff[i*3],tx,10,dt);
    dispOff[i*3+1]=T.MathUtils.damp(dispOff[i*3+1],ty,10,dt);
    dispOff[i*3+2]=T.MathUtils.damp(dispOff[i*3+2],tz,10,dt);
    settling=true;
   }
   if(settling){lastState=null;dirty=true;}
   if(hoverPending&&ready){hoverPending=false;const hit=pickAt(hoverX,hoverY);showHover(hit.found,hit.x,hit.y);}
   if(s.labels!==lastState?.labels)dirty=true;
   const changed=lastState?.visible!==s.visible||lastState?.selected!==s.selected||lastState?.isolate!==s.isolate||lastState?.xray!==s.xray||lastState?.skin!==s.skin||lastState?.hidden!==s.hidden||lastState?.pose!==s.pose||settling||lastState===null;
   if(changed){
    const visible=new Set(s.visible),selection=new Set(s.selected),hidden=new Set(s.hidden);
    atlas.parts.forEach((p,i)=>{
     const tissue=tissueOf(p),sys=displaySystem(p);
     const selected=selection.has(p.id);const shown=visible.has(sys)||selected;
     const hideCovering=isCovering(tissue)||(!!s.xray&&!selected&&(sys==='muscular'||sys==='connective'))||hidden.has(p.id)||(!!s.isolate&&!selected);
     const dim=false;
     data.set([dispOff[i*3],dispOff[i*3+1],dispOff[i*3+2],shown&&!hideCovering?1:0],i*4);
     selectedData[i*4]=selected&&!s.isolate?255:0;selectedData[i*4+1]=i===hoverIndex?255:0;selectedData[i*4+2]=dim?255:0;selectedData[i*4+3]=groups[i];
     writePicker(i);
    });partTexture.needsUpdate=true;selectionTexture.needsUpdate=true;lastState=s;lastHover=hoverIndex;dirty=true;
   }else if(hoverIndex!==lastHover){
    atlas.parts.forEach((_,i)=>{selectedData[i*4+1]=i===hoverIndex?255:0;});selectionTexture.needsUpdate=true;lastHover=hoverIndex;dirty=true;
   }
   if(s.view!==lastView||s.reset!==lastReset){
    if(!s.isolate){if(s.region&&s.region!=='full')frameRegion(s.region,s.view);else fit(s.view);lastRegion=s.region||'full';}
    lastView=s.view;lastReset=s.reset;
   }else if(s.region&&s.region!==lastRegion&&!s.isolate){
    lastRegion=s.region;frameRegion(s.region,s.view);
   }
   const isolateKey=s.isolate?s.selected.join(',')+':'+s.reset+':'+s.inspectorOpen+':'+camera.aspect+':'+loaded:'';
   if(isolateKey!==lastIsolate){
    if(s.isolate){const box=new T.Box3();atlas.parts.forEach((p,i)=>{if(s.selected.includes(p.id)&&pickers[i]){worldBox.copy(bounds[i]).applyMatrix4(pickers[i]!.matrix);box.union(worldBox);}});
     if(!box.isEmpty()){const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());const w=el.clientWidth,h=el.clientHeight,mobile=w<768;const topbar=document.querySelector('.topbar')?.getBoundingClientRect(),dock=document.querySelector('.dock')?.getBoundingClientRect(),sheet=document.querySelector('.detail-sheet')?.getBoundingClientRect();let left=20,right=w-20,top=(topbar?.bottom??56)+12,bottom=(dock?.top??h-80)-12;if(s.inspectorOpen&&sheet){if(mobile)bottom=Math.min(bottom,sheet.top-12);else right=Math.min(right,sheet.left-12);}const availableWidth=Math.max(150,right-left),availableHeight=Math.max(40,bottom-top);camera.setViewOffset(w,h,w/2-(left+right)/2,h/2-(top+bottom)/2,w,h);const distance=Math.max(.07,Math.max(size.y*h/availableHeight,size.x*w/availableWidth/camera.aspect,size.z)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*1.35);orbit.maxDistance=Math.max(40,distance*2);orbit.target.copy(center);camera.position.copy(center).add(viewDir(s.view).multiplyScalar(distance));orbit.update();dirty=true;lastIsolate=isolateKey;}
    }else if(lastIsolate){camera.clearViewOffset();if(s.region&&s.region!=='full')frameRegion(s.region,s.view);else fit(s.view);lastIsolate='';}
   }
   orbit.autoRotate=s.rotate&&!s.isolate&&!drag;orbit.autoRotateSpeed=.65;orbit.update();if(orbit.autoRotate)dirty=true;
   if(dirty){renderer.render(scene,camera);
    const showLabels=!!s.labels;labelNodes.forEach(l=>{if(!showLabels||data[l.index*4+3]<.5){l.node.hidden=true;return;}projected.copy(centers[l.index]).add(new T.Vector3(data[l.index*4],data[l.index*4+1],data[l.index*4+2])).project(camera);if(projected.z<-1||projected.z>1){l.node.hidden=true;return;}l.node.hidden=false;l.node.style.left=`${(projected.x+1)*el.clientWidth/2}px`;l.node.style.top=`${(1-projected.y)*el.clientHeight/2}px`;});
    dirty=false;}
  };animate();
  const contextLost=(e:Event)=>{e.preventDefault();onError('The 3D session was paused by your device. Reload to continue.');};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',down,true);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('pointerleave',leave);window.removeEventListener('pointerup',onWinUp);window.removeEventListener('pointercancel',onWinUp);renderer.domElement.removeEventListener('webglcontextlost',contextLost);orbit.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.traverse(o=>{if(o instanceof T.Mesh&&!geometries.includes(o.geometry)){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});env.dispose();partTexture.dispose();selectionTexture.dispose();hover.remove();labelRoot.remove();renderer.dispose();renderer.domElement.remove();};
 },[atlas]);
 return <div className="scene" ref={host}/>;
}
