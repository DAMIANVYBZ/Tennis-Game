// Phone assistance adds actions to the player's chosen direction; it never steers.
export function assistPhoneInput(match,input){
 const p=match.you,b=match.ball,x=input.x||((input.targetX??p.x)-p.x),z=input.z||((input.targetZ??p.z)-p.z),len=Math.hypot(x,z);
 if(match.state!=='rally'||p.dive||len<.25)return input;
 const dx=x/len,dz=z/len,distance=Math.hypot(b.x-p.x,b.z-p.z);
 const result={...input,sprint:!!input.sprint||(p.stamina>.15&&len>.45&&(b.last==='ai'?distance>1.9:len>.8))};
 if(!b.alive||b.last!=='ai'||b.bounces>=2||(b.serve&&b.bounces===0)||p.stamina<.2||match.time<(p.diveCooldown||0)||distance<1.95||distance>5)return result;
 const toward=((b.x-p.x)*dx+(b.z-p.z)*dz)/(distance||1);if(toward<.35)return result;
 const velocity=match.feet.you,speed=Math.hypot(velocity.vx,velocity.vz),wrongFoot=speed>2&&(dx*velocity.vx+dz*velocity.vz)/speed<-.25;
 if(!wrongFoot&&b.z<p.z-.9)return result;
 // Attempt only an imminent, low save whose racket path can meet the ball.
 for(const t of [.08,.14,.20,.26,.32,.4]){
  let y=b.y+b.vy*t-.5*9.81*t*t;if(y<.075)continue;
  const travel=7*(t-.45*t*t),x=p.x+dx*(travel+1.05),z=p.z+dz*(travel+1.05),height=.32+Math.sin(t/.5*Math.PI)*.62;
  if(Math.hypot(b.x+b.vx*t-x,b.z+b.vz*t-z,y-height)<.55){result.dive=true;break}
 }
 return result;
}
