import * as THREE from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {COURTS,getVenue} from './venues.mjs';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export class CourtEnvironment{
 constructor(scene){this.root=new THREE.Group();this.root.name='campus-court-environment';scene.add(this.root);this.loader=new GLTFLoader();this.cache=new Map();this.state='idle';this.revision=0;this.resources=[]}
 async select(id){
  const venue=getVenue(id);if(this.venue?.id===venue.id&&(this.state==='ready'||this.state==='loading'))return;
  this.venue=venue;this.state='loading';const revision=++this.revision;this.onChange?.(this.state,venue);
  try{let model=this.cache.get(venue.siteId);if(!model){const gltf=await this.loader.loadAsync(`./assets/venues/${venue.siteId}.glb`);model=gltf.scene;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(m.map)m.map.anisotropy=4;if(m.transparent){m.alphaTest=Math.max(m.alphaTest,.2);m.depthWrite=false}}}});this.cache.set(venue.siteId,model)}
   if(revision!==this.revision)return;
   for(const resource of this.resources)resource.dispose();this.resources=[];this.root.clear();model.position.set(-venue.offset.x,0,-venue.offset.z);this.root.add(model);this.root.userData={venue:venue.id,site:venue.siteId,sourceAnchor:venue.site.anchor,sourcePosition:{x:venue.x,z:venue.z}};
   if(venue.siteId==='athletic-oval'){this.floor(28.5,35,'#61886c',6.75-venue.offset.x,-.02,0);this.fence(-7.5-venue.offset.x,21-venue.offset.x,-17.5,17.5)}
   for(const other of COURTS.filter(c=>c.siteId===venue.siteId&&c.id!==venue.id)){const v=getVenue(other.id),x=v.offset.x-venue.offset.x,z=v.offset.z-venue.offset.z;this.net(x,z);if(venue.siteId==='athletic-oval')this.neighbourCourt(x,z)}
   this.state='ready';this.onChange?.(this.state,venue);
  }catch(error){if(revision!==this.revision)return;this.state='error';this.error=error;this.onChange?.(this.state,venue)}
 }
 mesh(geometry,color,parent=this.root){const material=new THREE.MeshStandardMaterial(typeof color==='string'?{color,roughness:.9}:color);const mesh=new THREE.Mesh(geometry,material);this.resources.push(geometry,material);parent.add(mesh);mesh.castShadow=mesh.receiveShadow=true;return mesh}
 floor(w,d,color,x,y,z){const m=this.mesh(new THREE.BoxGeometry(w,.02,d),color);m.position.set(x,y,z);m.castShadow=false;return m}
 rod(a,b,r,color){const delta=b.clone().sub(a),mesh=this.mesh(new THREE.CylinderGeometry(r,r,delta.length(),6),color);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());return mesh}
 net(x,z){for(const side of [-1,1])this.rod(V(x+side*6.05,0,z),V(x+side*6.05,1.07,z),.045,'#426254');const points=[];for(let u=-6;u<6.01;u+=.18)points.push(x+u,.1,z,x+u,.914+.15*u*u/36,z);for(let h=.1;h<1;h+=.12)points.push(x-6,h,z,x+6,h,z);const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3)),m=new THREE.LineBasicMaterial({color:'#253b35',transparent:true,opacity:.8});this.resources.push(g,m);this.root.add(new THREE.LineSegments(g,m));this.rod(V(x-6,.99,z),V(x+6,.99,z),.025,'#ecebdc')}
 neighbourCourt(x,z){this.floor(10.97,23.77,'#547fa4',x,.012,z);const line=(ax,az,bx,bz)=>{const m=this.floor(Math.abs(ax-bx)||.055,Math.abs(az-bz)||.055,'#f0f2e5',(ax+bx)/2,.029,(az+bz)/2)};for(const dx of [-5.485,-4.115,4.115,5.485])line(x+dx,z-11.885,x+dx,z+11.885);for(const dz of [-11.885,11.885])line(x-5.485,z+dz,x+5.485,z+dz);for(const dz of [-6.4,6.4])line(x-4.115,z+dz,x+4.115,z+dz);line(x,z-6.4,x,z+6.4)}
 fence(x0,x1,z0,z1){const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d');c.strokeStyle='rgba(170,180,174,.8)';c.lineWidth=2;c.beginPath();c.moveTo(0,32);c.lineTo(32,0);c.lineTo(64,32);c.lineTo(32,64);c.closePath();c.stroke();for(const [a,b]of [[V(x0,0,z0),V(x1,0,z0)],[V(x0,0,z1),V(x1,0,z1)],[V(x0,0,z0),V(x0,0,z1)],[V(x1,0,z0),V(x1,0,z1)]]){const length=a.distanceTo(b),texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(length*2,6);this.resources.push(texture);const wire=this.mesh(new THREE.PlaneGeometry(length,3),{map:texture,transparent:true,alphaTest:.15,side:THREE.DoubleSide,roughness:.9,depthWrite:false});wire.position.copy(a).add(b).multiplyScalar(.5);wire.position.y=1.5;wire.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);for(let i=0;i<=Math.ceil(length/3);i++){const p=a.clone().lerp(b,i/Math.ceil(length/3));this.rod(p,p.clone().setY(3),.04,'#b5bdb8')}this.rod(a.clone().setY(3),b.clone().setY(3),.03,'#b5bdb8')}}
}
