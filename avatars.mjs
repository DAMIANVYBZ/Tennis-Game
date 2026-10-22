import * as THREE from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {clone} from './vendor/utils/SkeletonUtils.js';
import {CATALOG} from './inventory.mjs';
const loader=new GLTFLoader(),templates=new Map();
export const characterStatus={state:'loading',error:null};
export async function loadCharacters(){
 try{await Promise.all(['female','male'].map(async sex=>{const asset=await loader.loadAsync(`./assets/characters/${sex}.glb`);templates.set(sex,asset.scene)}));characterStatus.state='ready'}
 catch(error){characterStatus.state='error';characterStatus.error=error;throw error}
}
const axis={x:new THREE.Vector3(1,0,0),y:new THREE.Vector3(0,1,0),z:new THREE.Vector3(0,0,1)};
const delta=new THREE.Quaternion();
const colorMaterial=color=>new THREE.MeshStandardMaterial({color,roughness:.7});
function mesh(geometry,color,parent){const o=new THREE.Mesh(geometry,colorMaterial(color));o.castShadow=true;parent.add(o);return o}
function enableKitTint(material){
 const tint={value:new THREE.Color('#ffffff')};material.userData.kitTint=tint;
 material.onBeforeCompile=shader=>{shader.uniforms.kitTint=tint;shader.fragmentShader='uniform vec3 kitTint;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat kitLuminance=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));\ndiffuseColor.rgb=kitTint*(0.45+0.9*kitLuminance);')};
 material.customProgramCacheKey=()=> 'ug-equipment-tint-v1';
}
function makeRacket(){
 const racket=new THREE.Group();racket.name='equipped-racket';
 const grip=mesh(new THREE.CylinderGeometry(.018,.021,.20,10),'#263f4b',racket);grip.rotation.x=Math.PI/2;grip.position.z=.055;
 const throat=mesh(new THREE.CylinderGeometry(.012,.018,.16,8),'#d6e7a8',racket);throat.rotation.x=Math.PI/2;throat.position.z=.20;
 const rim=mesh(new THREE.TorusGeometry(.17,.012,8,40),'#d6e7a8',racket);rim.scale.set(.85,1.18,1);rim.rotation.x=Math.PI/2;rim.position.z=.43;rim.name='racket-frame';
 const points=[];for(let x=-.12;x<=.121;x+=.03){const extent=.19*Math.sqrt(Math.max(0,1-x*x/(.145*.145)));points.push(x,0,.43-extent,x,0,.43+extent)}for(let z=-.15;z<=.151;z+=.03){const extent=.145*Math.sqrt(Math.max(0,1-z*z/(.20*.20)));points.push(-extent,0,.43+z,extent,0,.43+z)}
 const strings=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3)),new THREE.LineBasicMaterial({color:'#e8eddf',transparent:true,opacity:.75}));racket.add(strings);return racket;
}
function attachment(bone,point,build){
 const group=new THREE.Group();bone.add(group);group.position.copy(bone.worldToLocal(point.clone()));const rotation=bone.getWorldQuaternion(new THREE.Quaternion()).invert();group.quaternion.copy(rotation);const scale=bone.getWorldScale(new THREE.Vector3());group.scale.set(1/scale.x,1/scale.y,1/scale.z);build(group);return group;
}
export class Athlete{
 constructor(name,sex){this.root=new THREE.Group();this.root.name=name;this.root.userData.forward={x:0,y:0,z:1};this.sex=sex;this.instances=new Map();this.loaded=false}
 select(sex){
  this.sex=sex;if(!templates.has(sex))return false;
  if(this.current?.sex===sex)return true;
  let rig=this.instances.get(sex);if(!rig){rig=this.build(sex);this.instances.set(sex,rig)}
  this.root.clear();this.root.add(rig.visual);this.current=rig;this.loaded=true;this.cap=rig.cap;this.band=rig.band;this.racket=rig.racket;this.head=rig.bones.Head;this.root.userData.characterSex=sex;this.root.userData.rigged=true;this.root.userData.bones=rig.joints.size;return true;
 }
 build(sex){
  const character=clone(templates.get(sex)),visual=new THREE.Group();visual.name=`${sex}-rigged-character`;visual.add(character);visual.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(character),height=bounds.max.y-bounds.min.y,targetHeight=sex==='female'?1.76:1.84,scale=targetHeight/height;character.scale.multiplyScalar(scale);character.position.set(-(bounds.min.x+bounds.max.x)*.5*scale,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*.5*scale);visual.updateMatrixWorld(true);
  const bones={},joints=new Map(),outfits=[],shoes=[],materials=[];
  character.traverse(o=>{if(o.isBone)bones[o.name.replace(/^mixamorig[:_]?/,'')]=o;if(o.isMesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;const source=Array.isArray(o.material)?o.material:[o.material];const own=source.map(m=>{const material=m.clone();if(/hair/i.test(material.name)){material.transparent=false;material.alphaTest=.4;material.depthWrite=true;material.side=THREE.DoubleSide}materials.push(material);return material});o.material=Array.isArray(o.material)?own:own[0];const role=o.userData.equipmentRole;if(role==='outfit'){own.forEach(enableKitTint);outfits.push(...own)}if(role==='shoes'){own.forEach(enableKitTint);shoes.push(...own)}}});
  visual.updateMatrixWorld(true);
  for(const [name,bone] of Object.entries(bones)){const inverse=bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();joints.set(name,{bone,rest:bone.quaternion.clone(),position:bone.position.clone(),axes:Object.fromEntries(Object.entries(axis).map(([key,v])=>[key,v.clone().applyQuaternion(inverse)]))})}
  const headPoint=bones.Head.getWorldPosition(new THREE.Vector3()),handPoint=bones.RightHand.getWorldPosition(new THREE.Vector3());
  const face=new THREE.Object3D();face.name='face-direction';attachment(bones.Head,headPoint,g=>{g.add(face);face.position.z=.12});
  const band=attachment(bones.Head,headPoint.clone().add(new THREE.Vector3(0,.105,0)),g=>{const ring=mesh(new THREE.CylinderGeometry(.097,.097,.027,28),'#d9eaa9',g);ring.scale.z=.97});band.name='equipped-headband';
  const cap=attachment(bones.Head,headPoint.clone().add(new THREE.Vector3(0,.16,0)),g=>{const crown=mesh(new THREE.SphereGeometry(.112,24,16,0,Math.PI*2,0,Math.PI/2),'#f0ead9',g);crown.scale.set(1,1,1.08);const brim=mesh(new THREE.SphereGeometry(.13,20,12),'#f0ead9',g);brim.scale.set(.92,.07,.8);brim.position.set(0,0,.11)});cap.name='equipped-cap';cap.visible=false;
  const wristwear=['RightHand','LeftHand'].map(name=>attachment(bones[name],bones[name].getWorldPosition(new THREE.Vector3()),g=>{const wrist=mesh(new THREE.CylinderGeometry(.039,.039,.055,16),'#e9eee6',g);wrist.rotation.z=Math.PI/2}));
  const racket=attachment(bones.RightHand,handPoint.clone().add(new THREE.Vector3(-.045,0,0)),g=>g.add(makeRacket()));
  return {sex,visual,character,bones,joints,outfits,shoes,materials,band,cap,wristwear,racket,height:targetHeight,headPoint};
 }
 rotate(name,x=0,y=0,z=0){const j=this.current.joints.get(name);if(!j)return;for(const [key,value] of [['x',x],['y',y],['z',z]])if(value)j.bone.quaternion.premultiply(delta.setFromAxisAngle(j.axes[key],value))}
 equip(profile){
  const rig=this.current;if(!rig)return;const item=slot=>CATALOG.find(i=>i.id===profile.equipped[slot]);
  // Retain texture luminance so fabric detail survives both red and blue kit colours.
  for(const material of rig.outfits)material.userData.kitTint.value.set(item('outfit')?.color||'#cad5de');
  for(const material of rig.shoes)material.userData.kitTint.value.set(item('shoes')?.color||'#ffffff');
  rig.racket.traverse(o=>{if(o.name==='racket-frame')o.material.color.set(item('racket')?.color||'#d6e7a8')});
  rig.band.visible=item('headwear')?.id==='club-band';rig.cap.visible=item('headwear')?.id==='cap';rig.wristwear.forEach(o=>o.visible=!!item('wristwear'));
 }
 reachRacket(target,weight){
  const rig=this.current,rim=rig.racket.getObjectByName('racket-frame');if(!rim)return;
  const end=new THREE.Vector3(),joint=new THREE.Vector3(),from=new THREE.Vector3(),to=new THREE.Vector3(),world=new THREE.Quaternion(),parent=new THREE.Quaternion(),turn=new THREE.Quaternion(),identity=new THREE.Quaternion();
  for(let i=0;i<5;i++)for(const name of ['RightForeArm','RightArm']){const bone=rig.bones[name];rim.getWorldPosition(end);bone.getWorldPosition(joint);from.copy(end).sub(joint);to.copy(target).sub(joint);if(from.lengthSq()<1e-8||to.lengthSq()<1e-8)continue;turn.setFromUnitVectors(from.normalize(),to.normalize()).slerp(identity,1-weight*.8);bone.getWorldQuaternion(world);bone.parent.getWorldQuaternion(parent).invert();bone.quaternion.copy(parent.multiply(turn.multiply(world)));this.root.updateMatrixWorld(true)}
 }
 pose(p,opponent,{time=0,preparing=false,toss=0,reach=null,dive=null,diveTarget=null}={}){
  this.root.position.set(p.x,0,p.z);this.root.rotation.y=Math.atan2(opponent.x-p.x,opponent.z-p.z);const rig=this.current;if(!rig)return;rig.visual.quaternion.identity();
  for(const j of rig.joints.values()){j.bone.quaternion.copy(j.rest);j.bone.position.copy(j.position)}
  const stride=dive?0:Math.sin(p.step),run=dive?0:p.motion||0,swing=p.swing>0?Math.sin((1-p.swing)*Math.PI):0,side=p.side||1;
  // T-pose arms lower around character-space Z; elbows flex forward around Y.
  this.rotate('LeftArm',-.12-stride*run*.25,0,-1.05+swing*.18);
  this.rotate('RightArm',-.18+stride*run*.25-swing*.6,0,1.02-side*swing*.55);
  this.rotate('LeftForeArm',0,-.75,0);this.rotate('RightForeArm',0,.85-swing*.5,0);
  this.rotate('Spine',run*.22,side*swing*.4,Math.sin(time*2)*.009);
  this.rotate('Spine1',0,side*swing*.28,0);this.rotate('Head',0,-side*swing*.3,0);
  this.rotate('LeftUpLeg',stride*run*.55-.08,0,0);this.rotate('RightUpLeg',-stride*run*.55-.08,0,0);
  this.rotate('LeftLeg',Math.max(0,-stride)*run*.8+.12,0,0);this.rotate('RightLeg',Math.max(0,stride)*run*.8+.12,0,0);
  this.rotate('LeftFoot',-.05-Math.max(0,-stride)*run*.25,0,0);this.rotate('RightFoot',-.05-Math.max(0,stride)*run*.25,0,0);
  if(preparing){this.rotate('Spine1',0,-.3,0);this.rotate('RightArm',-.4,-.45,-.15)}
  if(toss>0){this.rotate('LeftArm',-toss*2.55,0,toss*.65);this.rotate('RightArm',-toss*2.5,0,-toss*.55);this.rotate('RightForeArm',0,toss*.35,0);this.rotate('Spine',-.12*toss,0,0)}
  for(const hand of ['Left','Right'])for(const finger of ['Index','Middle','Ring','Pinky'])for(let i=1;i<=3;i++)this.rotate(hand+'Hand'+finger+i,0,0,(hand==='Right'?1:-1)*.65);
  rig.visual.position.set(0,Math.abs(stride)*run*.025+Math.sin(time*3)*.003,0);
  if(!toss){this.rotate('LeftUpLeg',-.08,0,-.04);this.rotate('RightUpLeg',-.08,0,.04);this.rotate('LeftLeg',.12);this.rotate('RightLeg',.12);rig.visual.position.y-=.035;
   if(reach){const target=new THREE.Vector3(reach.target.x,reach.target.y,reach.target.z),local=this.root.worldToLocal(target.clone()),weight=reach.weight,stretch=Math.min(1,Math.hypot(local.x,local.z)/1.8)*weight,low=Math.max(0,1-reach.target.y)*weight,side=Math.sign(local.x)||1;
    this.rotate('Spine',Math.min(.35,Math.max(-.15,local.z*.2))*stretch,0,-side*.3*stretch);this.rotate('Spine1',.15*low,-side*.22*stretch,-side*.16*stretch);this.rotate('Head',-.1*low,side*.12*stretch,side*.12*stretch);
    this.rotate(side>0?'RightUpLeg':'LeftUpLeg',-.28*stretch-.25*low,0,side*.16*stretch);this.rotate(side>0?'RightLeg':'LeftLeg',.38*stretch+.4*low);this.rotate(side>0?'LeftUpLeg':'RightUpLeg',.16*stretch);rig.visual.position.y-=.11*stretch+.18*low;
    rig.visual.position.x=local.x*.12*stretch;rig.visual.position.z=Math.max(-.12,Math.min(.18,local.z*.1*stretch));
    this.root.updateMatrixWorld(true);this.reachRacket(target,weight);
   }
  }
  if(dive){const u=dive.phase==='air'?Math.min(1,dive.time/.5):dive.phase==='rising'?Math.min(1,dive.time/dive.rise):0,recover=dive.phase==='rising'?u*u*(3-2*u):0,tilt=dive.phase==='air'?1.43*Math.sin(u*Math.PI/2):1.43*(1-recover),dir=new THREE.Vector3(dive.dx,0,dive.dz).applyQuaternion(this.root.quaternion.clone().invert()),axis=new THREE.Vector3(dir.z,0,-dir.x),pivot=new THREE.Vector3(0,.9,0);
   rig.visual.quaternion.setFromAxisAngle(axis,tilt);const height=dive.phase==='air'?.9+Math.sin(u*Math.PI)*.28-u*.66:Math.max(.24+.66*recover,.9*Math.cos(tilt)+.015);rig.visual.position.copy(pivot).applyQuaternion(rig.visual.quaternion).multiplyScalar(-1);rig.visual.position.y+=height;
   if(dive.phase==='air'){this.rotate('LeftUpLeg',-.2);this.rotate('RightUpLeg',-.15);this.rotate('LeftLeg',.45);this.rotate('RightLeg',.35)}this.rotate('LeftArm',-.6,0,-.2);this.rotate('LeftForeArm',0,-.4,0);if(dive.phase!=='air'){this.rotate('LeftUpLeg',-.45*(1-recover));this.rotate('RightUpLeg',-.25*(1-recover));this.rotate('LeftLeg',.8*(1-recover));this.rotate('RightLeg',.65*(1-recover))}
   this.root.updateMatrixWorld(true);if(dive.phase==='air'&&diveTarget)this.reachRacket(diveTarget,1);
  }
  this.root.updateMatrixWorld(true);
 }
}
