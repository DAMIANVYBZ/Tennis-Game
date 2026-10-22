// Arrival animation is presentation only: match positions and clocks stay untouched.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=t=>t*t*(3-2*t);
export class CourtArrival{
 constructor(){this.active=false;this.elapsed=0;this.duration=8}
 begin(){this.active=true;this.elapsed=0}
 skip(){this.active=false;this.elapsed=this.duration}
 tick(dt){if(this.active){this.elapsed=Math.min(this.duration,this.elapsed+dt);if(this.elapsed>=this.duration)this.active=false}}
 get progress(){return clamp(this.elapsed/this.duration,0,1)}
 get cameraBlend(){return ease(clamp((this.progress-.15)/.85,0,1))}
 player(player,side){const t=ease(this.progress),corner={x:-6.65,z:side*12.6},start={x:-6.65,z:side*.9};let x,z;
 if(t<.6){const u=t/.6;x=start.x;z=start.z+(corner.z-start.z)*u}else{const u=(t-.6)/.4;x=corner.x+(player.x-corner.x)*u;z=corner.z+(player.z-corner.z)*u}
 return {...player,x,z,heading:t<.6?(side>0?0:Math.PI):Math.atan2(player.x-corner.x,player.z-corner.z),motion:this.active?.4:0,step:this.elapsed*7,swing:0};
 }
}
