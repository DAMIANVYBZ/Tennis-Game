const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Keep visual recovery tied to the actual contact, rather than the outgoing ball.
export function reachPose(player,ball,who){
 if(player.contact&&player.swing>.05&&!player.contact.serve)return {target:player.contact,weight:clamp(player.swing*1.6,0,1)};
 if(!ball?.alive||ball.last===who||(ball.serve&&ball.bounces===0))return null;
 const target={x:ball.x+(ball.vx||0)*.07,y:ball.y,z:ball.z+(ball.vz||0)*.07},distance=Math.hypot(target.x-player.x,target.z-player.z);
 if(distance>3||target.y<.15||target.y>3.1||(who==='you'?target.z<.5:target.z>-.5))return null;
 return {target,weight:clamp((3-distance)/1.2,0,1)};
}
