import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {BLOCK_SITES} from './src/game/sites.ts';
import {isDiasporaHall} from './src/game/halls.ts';
import {groundHeight,applyRelief} from './src/game/relief.ts';
import {buildBuildings} from './src/game/facades.ts';
import {BUILDINGS,ROADS,NODE_XZ} from './src/game/campusmap.ts';
import {terrainGrass} from './src/game/soilground.ts';
import {buildScrubLands} from './src/game/ghlandscape.ts';
import {EARTH_ROADS} from './src/game/ghlplan.ts';
export const PLANS={
 'athletic-oval':{x:-77.5,y:.07,z:376,yaw:0,radius:150,site:'Athletic Oval',courts:[{x:-77.5,z:376},{x:-64,z:376}]},
 'commonwealth-west':{x:-630.5,y:6.2,z:-73,yaw:0,radius:165,site:'Commonwealth west tennis complex',courts:[{x:-630.5,z:-73},{x:-613.625,z:-73},{x:-595.875,z:-73}]},
 'sports-stadium':{x:538,y:.06,z:1434.5,yaw:0,radius:230,site:'University of Ghana Swimming Pool and Tennis Courts',courts:[{x:538,z:1434.5},{x:558.5,z:1434.5}]},
};
const box=new THREE.Box3(),p=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
const mats=new Map();
function material(source){if(mats.has(source))return mats.get(source);const m=source.clone();m.emissiveMap=null;m.emissiveIntensity=0;mats.set(source,m);return m}
function inRadius(x,z,plan,extra=0){return (x-plan.x)**2+(z-plan.z)**2<(plan.radius+extra)**2}
function dropFace(x,y,z,plan){
 // Replace all tennis nets with the simulation's actual net and matching neighbouring nets.
 for(const c of plan.courts){let dx=x-c.x,dz=z-c.z;const co=Math.cos(plan.yaw),si=Math.sin(plan.yaw),lx=co*dx+si*dz,lz=-si*dx+co*dz;if(Math.abs(lx)<6.9&&Math.abs(lz)<.35&&y>plan.y-.08&&y<plan.y+1.4)return true}
 // The Oval map used a short schematic tennis enclosure. Replace it with safe regulation run-offs.
 if(plan.site==='Athletic Oval'&&x>-85.3&&x<-56.2&&z>364.2&&z<387.8&&y<3.7)return true;
 return false;
}
function extractMesh(o,plan,output,frame){
 if(!o.isMesh||!o.visible)return;
 if(o.isInstancedMesh){
  const instances=[],colors=[],m=new THREE.Matrix4(),v=new THREE.Vector3();
  for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);m.premultiply(o.matrixWorld);v.setFromMatrixPosition(m);if(!inRadius(v.x,v.z,plan,8))continue;m.premultiply(frame);instances.push(m.clone());if(o.instanceColor){const c=new THREE.Color();o.getColorAt(i,c);colors.push(c)}}
  if(!instances.length)return;const mesh=new THREE.InstancedMesh(o.geometry,material(o.material),instances.length);instances.forEach((m,i)=>{mesh.setMatrixAt(i,m);if(colors[i])mesh.setColorAt(i,colors[i])});mesh.name=o.name||'campus-vegetation';mesh.castShadow=mesh.receiveShadow=true;output.add(mesh);return;
 }
 const source=o.geometry;if(!source.attributes.position)return;
 box.setFromBufferAttribute(source.attributes.position).applyMatrix4(o.matrixWorld);if(box.max.x<plan.x-plan.radius||box.min.x>plan.x+plan.radius||box.max.z<plan.z-plan.radius||box.min.z>plan.z+plan.radius)return;
 const attributes=Object.fromEntries(Object.entries(source.attributes).filter(([k])=>['position','normal','uv','uv1','color'].includes(k)).map(([k,a])=>[k,{source:a,values:[]}])) ;
 const pos=source.attributes.position,index=source.index,indices=[],mapped=new Map(),matrix=frame.clone().multiply(o.matrixWorld);normalMatrix.getNormalMatrix(matrix);
 const worldPositions=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);worldPositions.set([p.x,p.y,p.z],i*3)}
 const groups=source.groups.length?source.groups:[{start:0,count:index?index.count:pos.count,materialIndex:0}],geometry=new THREE.BufferGeometry();
 for(const group of groups){const begin=indices.length;for(let at=group.start;at<group.start+group.count;at+=3){const tri=[0,1,2].map(i=>index?index.getX(at+i):at+i);let x=0,y=0,z=0;for(const i of tri){x+=worldPositions[i*3]/3;y+=worldPositions[i*3+1]/3;z+=worldPositions[i*3+2]/3}if(!inRadius(x,z,plan,8)||dropFace(x,y,z,plan))continue;for(const i of tri){let dest=mapped.get(i);if(dest===undefined){dest=mapped.size;mapped.set(i,dest);for(const [key,a]of Object.entries(attributes)){const src=a.source;if(key==='position'){p.fromBufferAttribute(src,i).applyMatrix4(matrix);a.values.push(p.x,p.y,p.z)}else if(key==='normal'){p.fromBufferAttribute(src,i).applyMatrix3(normalMatrix).normalize();a.values.push(p.x,p.y,p.z)}else for(let j=0;j<src.itemSize;j++)a.values.push(src.getComponent(i,j))}}indices.push(dest)}}if(indices.length>begin)geometry.addGroup(begin,indices.length-begin,group.materialIndex)}
 if(!indices.length)return;for(const [key,a]of Object.entries(attributes))geometry.setAttribute(key,new THREE.Float32BufferAttribute(a.values,a.source.itemSize));geometry.setIndex(indices);if(!geometry.attributes.normal)geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,Array.isArray(o.material)?o.material.map(material):material(o.material));mesh.name=o.name||o.parent?.name||'campus-detail';mesh.castShadow=o.castShadow;mesh.receiveShadow=true;output.add(mesh);
}
function copySource(root,plan,output,frame){root.updateMatrixWorld(true);const visit=o=>{if(o.isLOD){const distance=Math.hypot(o.position.x-plan.x,o.position.z-plan.z);const level=distance>75?o.levels.at(-1):o.levels[0];if(level)visit(level.object);return}extractMesh(o,plan,output,frame);for(const c of o.children)visit(c)};visit(root)}
function terrain(plan,output,frame){
 const size=plan.radius*2,steps=Math.ceil(size/4),geo=new THREE.PlaneGeometry(size,size,steps,steps).rotateX(-Math.PI/2),position=geo.attributes.position,uv=geo.attributes.uv;
 for(let i=0;i<position.count;i++){const x=position.getX(i)+plan.x,z=position.getZ(i)+plan.z;p.set(x,groundHeight(x,z)-.09,z).applyMatrix4(frame);position.setXYZ(i,p.x,p.y,p.z);uv.setXY(i,x/200,-z/200)}geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material(terrainGrass()));mesh.name='source-campus-terrain';mesh.receiveShadow=true;output.add(mesh);
 // The mapped roads and paths, with the main game's class widths and unsealed service-road list.
 const earth=new Set(EARTH_ROADS),roadData={asphalt:[],path:[],earth:[]};for(let ri=0;ri<ROADS.length;ri++){const r=ROADS[ri],kind=earth.has(ri)||r.surface==='trail'?'earth':r.cls===4?'path':'asphalt',width=[7.6,6.8,5.8,4.8,1.8][r.cls]||4.8;for(let j=1;j<r.nodes.length;j++){const ax=NODE_XZ[r.nodes[j-1]*2],az=NODE_XZ[r.nodes[j-1]*2+1],bx=NODE_XZ[r.nodes[j]*2],bz=NODE_XZ[r.nodes[j]*2+1],len=Math.hypot(bx-ax,bz-az);if(!inRadius((ax+bx)/2,(az+bz)/2,plan,len/2))continue;const n=Math.max(1,Math.ceil(len/3)),dx=-(bz-az)/(len||1)*width/2,dz=(bx-ax)/(len||1)*width/2;for(let k=0;k<n;k++){const a=k/n,b=(k+1)/n,vertices=[[ax+(bx-ax)*a+dx,az+(bz-az)*a+dz],[ax+(bx-ax)*b+dx,az+(bz-az)*b+dz],[ax+(bx-ax)*b-dx,az+(bz-az)*b-dz],[ax+(bx-ax)*a-dx,az+(bz-az)*a-dz]];for(const index of [0,1,2,0,2,3]){const [x,z]=vertices[index];p.set(x,groundHeight(x,z)+.005,z).applyMatrix4(frame);roadData[kind].push(p.x,p.y,p.z)}}}}
 for(const [kind,vertices]of Object.entries(roadData)){if(!vertices.length)continue;const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:kind==='asphalt'?'#676968':kind==='earth'?'#a77852':'#c6c0ae',roughness:1,side:THREE.DoubleSide}));m.name='mapped-'+kind+'-roads';m.receiveShadow=true;output.add(m)}
}
export async function buildVenue(id){
 const plan=PLANS[id],output=new THREE.Group();output.name=id+'-campus-environment';mats.clear();const frame=new THREE.Matrix4().makeRotationY(plan.yaw).multiply(new THREE.Matrix4().makeTranslation(-plan.x,-plan.y,-plan.z));
 terrain(plan,output,frame);const selected=[];
 for(const site of BLOCK_SITES){if(!site.frames().some(f=>inRadius(f.cx,f.cz,plan,25)||f.name===plan.site))continue;selected.push(...site.frames().filter(f=>inRadius(f.cx,f.cz,plan,25)||f.name===plan.site).map(f=>f.name));const root=site.build();applyRelief(root);copySource(root,plan,output,frame);await new Promise(r=>setTimeout(r,0))}
 const generic=BUILDINGS.filter(b=>inRadius((b.minX+b.maxX)/2,(b.minZ+b.maxZ)/2,plan,10)&&!isDiasporaHall(b)&&!BLOCK_SITES.some(s=>s.replaces(b)));const buildings=buildBuildings(generic,()=>({wall:'#f7f6f2',roof:'#b4532e',plinth:'#963e32',plinthH:1}));applyRelief(buildings);copySource(buildings,plan,output,frame);
 if(id==='commonwealth-west'){copySource(buildScrubLands(),plan,output,frame)}
 output.updateMatrixWorld(true);let triangles=0;output.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1)});
 output.userData={sourceRepository:'DAMIANVYBZ/Legon-world-Test',sourceCommit:'dc022c169a40514d783a494743cdabdebff4034b',sourceAnchor:[plan.x,plan.y,plan.z],sourceYaw:plan.yaw,sourceModels:selected,triangles};window.sceneRoot=output;return {selected,triangles,meshes:output.children.length,anchor:[plan.x,plan.y,plan.z],yaw:plan.yaw};
}
export async function exportVenue(){return new GLTFExporter().parseAsync(window.sceneRoot,{binary:true,onlyVisible:true,maxTextureSize:1024})}
window.exporter={buildVenue,exportVenue,PLANS,THREE};window.ready=true;
