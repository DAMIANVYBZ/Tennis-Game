// Phone assistance adds actions to the player's chosen direction; it never steers.
export function assistPhoneInput(match,input){
 const p=match.you,b=match.ball,x=input.x||((input.targetX??p.x)-p.x),z=input.z||((input.targetZ??p.z)-p.z),len=Math.hypot(x,z);
 if(match.state!=='rally'||p.dive||len<.25)return input;
 const dx=x/len,dz=z/len,distance=Math.hypot(b.x-p.x,b.z-p.z);
 const result={...input,sprint:!!input.sprint||(p.stamina>.30&&len>.45&&(b.last==='ai'?distance>1.9:len>.8))};
 if(!b.alive||b.last!=='ai'||b.bounces>=2||(b.serve&&b.bounces===0)||p.stamina<.2||match.time<(p.diveCooldown||0)||distance<1.95||distance>5)return result;
 const toward=((b.x-p.x)*dx+(b.z-p.z)*dz)/(distance||1);if(toward<.35)return result;
 // Predict across the full dive window instead of waiting until the ball passes the baseline.
 // Use fine steps so a fast moving return cannot cross between coarse prediction samples.
 const step=1/120,forecast={...b};
 for(let t=step;t<=.5;t+=step){
  const oldY=forecast.y,oldVY=forecast.vy;
  forecast.x+=forecast.vx*step;forecast.z+=forecast.vz*step;forecast.y+=forecast.vy*step-.5*9.81*step*step;forecast.vy-=9.81*step;
  if(forecast.y<=.075&&forecast.vy<0){forecast.bounces++;if(forecast.bounces>=2)break;
   // A planned out does not justify a desperate save.
   if(Math.abs(forecast.x)>4.18||forecast.z>11.95||forecast.z<0)break;
   const impact=Math.max(0,Math.min(step,(oldVY+Math.sqrt(Math.max(0,oldVY*oldVY+2*9.81*(oldY-.075))))/9.81));forecast.y=.075;forecast.vy=-(oldVY-9.81*impact)*(b.bounce??.7);forecast.vx*=.94;forecast.vz*=b.type==='slice'?.89:.94;
  }
  if(t<.04||forecast.z<.4)continue;
  const travel=7*(t-.45*t*t),x=Math.max(-6.3,Math.min(6.3,p.x+dx*travel))+dx*1.05,z=Math.max(1.5,Math.min(13.5,p.z+dz*travel))+dz*1.05,height=.32+Math.sin(t/.5*Math.PI)*.62;
  if(Math.hypot(forecast.x-x,forecast.z-z,forecast.y-height)<.27){result.dive=true;break}
 }
 return result;
}
