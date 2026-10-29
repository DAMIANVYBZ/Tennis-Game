const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function diveRacket(p){const d=p.dive;if(!d)return null;const u=clamp(d.time/.5,0,1);return {x:p.x+d.dx*1.05,z:p.z+d.dz*1.05,y:.32+Math.sin(u*Math.PI)*.62}}
// How far a dive has carried the player after t seconds in the air (speed 7 m/s easing to 3.85 m/s over 0.5 s).
const DIVE_AIR=.5,DIVE_REACH=1.3,REACH_LOW=.05,REACH_HIGH=2.3;
const diveTravel=t=>7*t-3.15*t*t;
// Follow the ball for the dive's flight (gravity and bounces as the match plays them) and return the direction to the
// earliest point the diving player can reach, or null when no dive can get there.
export function diveIntercept(p,ball){if(!ball.alive||ball.last!=='ai'||(ball.serve&&ball.bounces===0)||ball.vx===undefined)return null;
 let x=ball.x,y=ball.y,z=ball.z,vx=ball.vx,vy=ball.vy,vz=ball.vz,bounces=ball.bounces||0;const dt=1/120;
 for(let t=dt;t<=DIVE_AIR+1e-9;t+=dt){x+=vx*dt;z+=vz*dt;y+=vy*dt-.5*9.81*dt*dt;vy-=9.81*dt;
  if(y<=.075&&vy<0){y=.075;bounces++;if(bounces>=2)return null;vy=-vy*(ball.bounce??.7);vz*=ball.type==='slice'?.89:.94;vx*=.94}
  if(t<.04||z<.4||y<REACH_LOW||y>REACH_HIGH)continue;const gx=x-p.x,gz=z-p.z,gap=Math.hypot(gx,gz);
  if(gap<=diveTravel(t)+DIVE_REACH)return gap<.1?null:{dx:gx/gap,dz:gz/gap,t}}
 return null}
export function beginDive(p,ball,input,now,velocity={vx:0,vz:0}){
 if(p.dive||now<(p.diveCooldown||0)||p.stamina<.12||!ball.alive||ball.last!=='ai')return false;
 let x=input.x||0,z=input.z||0;if(Math.hypot(x,z)<.1&&input.targetX!==undefined){x=input.targetX-p.x;z=(input.targetZ??p.z)-p.z}if(Math.hypot(x,z)<.1){x=ball.x-p.x;z=ball.z-p.z}const len=Math.hypot(x,z);if(len<.1)return false;
 x/=len;z/=len;
 // Diving at a ball you can reach always gets the racket on it: the dive heads for the point where it meets the ball.
 const intercept=diveIntercept(p,ball);if(intercept){x=intercept.dx;z=intercept.dz}
 const speed=Math.hypot(velocity.vx,velocity.vz),wrongFoot=speed>2&&(x*velocity.vx+z*velocity.vz)/speed<-.25;
 const fatigue=1-p.stamina,distance=Math.hypot(ball.x-p.x,ball.z-p.z),effort=clamp((distance-2)/3,0,1);
 p.dive={phase:'air',time:0,dx:x,dz:z,hit:false,reachable:!!intercept,down:.22+fatigue*.55+(wrongFoot?.22:0)+effort*.18,rise:.38+fatigue*.55+(wrongFoot?.18:0),wrongFoot};p.dive.previous=diveRacket(p);p.stamina=clamp(p.stamina-.18-(wrongFoot?.07:0),0,1);return true;
}
export function advanceDive(p,dt,now){const d=p.dive;if(!d)return;d.previous=diveRacket(p);d.time+=dt;
 if(d.phase==='air'){const speed=7*(1-.45*clamp(d.time/.5,0,1));p.x+=d.dx*speed*dt;p.z+=d.dz*speed*dt;if(d.time>=.5){d.phase='down';d.time=0}}
 else if(d.phase==='down'&&d.time>=d.down){d.phase='rising';d.time=0}
 else if(d.phase==='rising'&&d.time>=d.rise){p.dive=null;p.diveCooldown=now+.3}
}
export function diveMovement(p){if(!p.dive)return 1;if(p.dive.phase!=='rising')return 0;return .25*clamp(p.dive.time/p.dive.rise,0,1)}
export function diveContact(p,b,previousBall){const d=p.dive;if(!d||d.phase!=='air'||d.time<.04||d.hit||b.bounces>=2||!b.alive||b.last!=='ai'||(b.serve&&b.bounces===0)||b.z<.4)return false;
 const r=diveRacket(p),a=d.previous||r,old=previousBall||b,ax=old.x-a.x,ay=old.y-a.y,az=old.z-a.z,dx=(b.x-r.x)-ax,dy=(b.y-r.y)-ay,dz=(b.z-r.z)-az,den=dx*dx+dy*dy+dz*dz,t=den?clamp(-(ax*dx+ay*dy+az*dz)/den,0,1):0;
 if(Math.hypot(ax+dx*t,ay+dy*t,az+dz*t)<=.30)return true;
 // Contact is automatic once the ball is within the diving player's reach.
 return b.y>=REACH_LOW&&b.y<=REACH_HIGH&&Math.hypot(b.x-p.x,b.z-p.z)<=DIVE_REACH;
}
