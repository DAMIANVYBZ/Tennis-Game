import {OPPONENT_LEVELS,opponentShot} from './opponent.mjs';
// Original arcade-tennis simulation. Court dimensions are in metres.
export const COURT={single:4.115,double:5.485,baseline:11.885,service:6.4,net:.914};
// A ball touching a painted line is in. Keep preview and actual calls identical.
export function landingIsIn(ball,x,z){
 const edge=.055/2+.0335;
 if(Math.abs(x)>COURT.single+edge||Math.abs(z)>COURT.baseline+edge||(ball.last==='you'?-z:z)<-edge)return false;
 if(ball.serve&&(Math.abs(z)>COURT.service+edge||ball.serviceBoxX*x < -edge))return false;
 return true;
}
export const SHOTS={topspin:{flight:1.18,bounce:.76,spin:.18},flat:{flight:1.00,bounce:.69,spin:0},slice:{flight:1.35,bounce:.52,spin:-.12},lob:{flight:1.95,bounce:.72,spin:0}};
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class Match{
 constructor(emit=()=>{},random=Math.random){this.emit=emit;this.random=random;this.assist=.4;this.shotTiming='manual';this.difficulty='normal';this.reset();this.state='menu'}
 reset(){this.time=0;this.points={you:0,ai:0};this.rally=0;this.best=0;this.server='you';this.serveSide=1;this.end=0;this.aim={x:0,depth:.72};this.you={x:1.2,z:11.2,stamina:1,swing:0,step:0,motion:0,side:1};this.ai={x:-1.2,z:-10.6,stamina:1,swing:0,step:0,motion:0,side:1};this.ball={x:1.2,y:1,z:11.2,vx:0,vy:0,vz:0,alive:false,bounces:0,last:'you'};this.shot=null;this.pending=null;this.selectedShot={type:'topspin',power:.55};this.timer=0;this.lastStep=0;this.aiClock=0;this.aiTarget={x:0,z:-10.5};this.reason='';this.quality='';this.startPoint()}
 start(){this.reset();this.emit('start')}
 startPoint(secondServe=false){this.feet={you:{vx:0,vz:0,stepAt:-1,slideAt:-1},ai:{vx:0,vz:0,stepAt:-1,slideAt:-1}};this.serveAttempt=secondServe?2:1;const total=this.points.you+this.points.ai;this.server=(total<40?Math.floor(total/2)%2:total%2)?'ai':'you';this.serveSide=total%2?-1:1;this.end=Math.floor(total/5)%2;this.you.x=this.server==='you'?this.serveSide*1.3:-this.serveSide*.8;this.you.z=this.server==='you'?12.1:10.6;this.ai.x=this.server==='ai'?-this.serveSide*1.3:this.serveSide*.8;this.ai.z=this.server==='ai'?-12.1:-10.6;this.you.stamina=Math.min(1,this.you.stamina+.25);this.ai.stamina=Math.min(1,this.ai.stamina+.25);this.you.contact=this.ai.contact=null;this.state='serve';this.timer=1.25;this.rally=0;this.reason='';this.quality=this.server==='you'?(secondServe?'SECOND SERVE':'FIRST SERVE'):'RECEIVE';this.shot=null;this.pending=null;this.aim={x:0,depth:.72};this.ball={x:this[this.server].x,y:1,z:this[this.server].z,vx:0,vy:0,vz:0,alive:false,bounces:0,last:this.server};this.emit('ready')}
 prepare(type,source='input'){if(!SHOTS[type]||this.shot||(this.pending&&this.shotTiming!=='auto')||!(['rally','serve'].includes(this.state))||(this.state==='serve'&&this.server!=='you'))return false;if(this.shotTiming==='auto')this.pending=null;this.shot={type,source,time:this.time};this.quality='PREPARING';return true}
 release(source='input'){if(!this.shot||this.shot.source!==source)return false;const shot=this.shot;this.shot=null;this.pending={type:shot.type,power:clamp((this.time-shot.time)/.85,.15,1),over:Math.max(0,this.time-shot.time-1.15),at:this.time,aim:this.aim.x,depth:this.aim.depth};if(this.state==='serve'){this.state='toss';this.timer=.68;this.tossPower=this.pending;this.pending=null;this.quality='SERVE TOSS';this.emit('toss')}else if(this.shotTiming==='auto'){this.selectedShot={type:this.pending.type,power:this.pending.power};this.pending.over=0;this.quality='SHOT READY'}else{this.you.swing=.38;this.quality='SWING';this.emit('swing')}return true}
 cancel(){this.shot=null;this.pending=null}
 pause(){if(this.state==='paused'){this.state=this.pausedState;this.emit('resume')}else if(['serve','rally','toss','point','fault'].includes(this.state)){this.pausedState=this.state;this.state='paused';this.cancel();this.emit('pause')}}
 score(winner,reason){if(!['rally','toss','serve'].includes(this.state))return;this.points[winner]++;this.lastPointWinner=winner;this.reason=reason;this.ball.alive=false;this.cancel();this.state='point';this.timer=2.3;this.quality=reason;this.emit('point',{winner,reason});const loser=winner==='you'?'ai':'you';if(this.points[winner]>=21&&this.points[winner]-this.points[loser]>=2){this.state='over';this.winner=winner;this.emit('win',{winner})}}
 serviceFault(reason){
 if(this.serveAttempt===1){this.ball.alive=false;this.cancel();this.reason=reason;this.quality='SECOND SERVE';this.state='fault';this.timer=1.8;this.emit('fault',{reason,server:this.server});}
 else this.score(this.server==='you'?'ai':'you','DOUBLE FAULT');
 }
 trajectory(who,shot,serve=false,quality=1,contact=null){const p=this[who],sign=who==='you'?-1:1,spec=SHOTS[shot.type],power=shot.power;
 const origin=contact||{x:serve?p.x:this.ball.x,z:serve?p.z:this.ball.z,y:serve?2.75:clamp(this.ball.y,.5,2.4)};
 const risk=(1-quality)*(.5+(shot.type==='flat'?1.35:.5))+shot.over*.65;
 let tx=serve?(-Math.sign(p.x||1)*2+shot.aim*2.8):shot.aim*4.4+Math.sign(shot.aim||1)*risk;
 let tz=sign*(.8+shot.depth*(serve?6.4:10.8));
 let flight=(serve?1.18:spec.flight)*(1.13-power*.20)*(who==='ai'?{easy:1.15,normal:1,hard:.92}[this.difficulty]:1);
 if(!serve&&shot.type==='flat'&&quality<.35&&power>.8)flight*=.72;
 return {...origin,vx:(tx-origin.x)/flight,vz:(tz-origin.z)/flight,vy:(.5*9.81*flight*flight+.075-origin.y)/flight,alive:true,bounces:0,last:who,type:shot.type,serve,serviceBoxX:-Math.sign(p.x||1),spin:spec.spin,bounce:spec.bounce,landing:{x:tx,z:tz},firstFlight:flight};
 }
 launch(who,shot,serve=false,quality=1){const p=this[who];this.ball=this.trajectory(who,shot,serve,quality);p.contact={x:this.ball.x,y:this.ball.y,z:this.ball.z,serve};p.swing=1;p.side=Math.sign((this.ball.x-p.x)*(who==='you'?-1:1))||1;this.aiClock=.05;this.aiAimError=(this.random()-.5)*{easy:1.4,normal:.7,hard:.25}[this.difficulty];this.rally++;this.best=Math.max(this.best,this.rally);this.emit('hit',{who,power:shot.power,type:shot.type,quality,x:this.ball.x,z:this.ball.z});
 }
 autoHitYou(){
 const b=this.ball,p=this.you;
 // Timing assistance never moves the player or reaches across the net.
 if(!b.alive||b.last!=='ai'||b.z<.7||Math.hypot(b.x-p.x,b.z-p.z)>1.9||b.y<.32||b.y>2.6||(b.serve&&b.bounces===0))return false;
 const shot=this.shot?{type:this.shot.type,power:clamp((this.time-this.shot.time)/.85,.15,1)}:(this.pending||this.selectedShot);
 const planned={type:shot.type,power:shot.power,over:0,aim:this.aim.x,depth:this.aim.depth};
 this.selectedShot={type:planned.type,power:planned.power};this.shot=null;this.pending=null;this.quality='ASSISTED CONTACT';
 this.launch('you',planned,false,1);return true;
 }
 hitYou(){const b=this.ball,p=this.you;if(!this.pending||b.last==='you'||!b.alive)return false;const age=this.time-this.pending.at;if(age>.25){this.pending=null;this.quality='TOO EARLY';return false}
 const distance=Math.hypot(b.x-p.x,b.z-p.z);if(distance>1.65||b.y<.32||b.y>2.6||(b.serve&&b.bounces===0))return false;
 const quality=clamp(1-age/.32-Math.max(0,distance-1)*.45-this.pending.over*.5,0,1);const shot=this.pending;this.pending=null;this.quality=age<.075?'PERFECT':age<.15?'GOOD':'EARLY';this.launch('you',shot,false,quality);return true;
 }
 footSound(who,vx,vz){
 const f=this.feet[who],speed=Math.hypot(vx,vz),previous=Math.hypot(f.vx,f.vz),p=this[who];
 const turn=speed>2&&previous>2&&(vx*f.vx+vz*f.vz)/(speed*previous)<.35;
 const stop=previous>2.5&&speed<previous*.4;
 if((turn||stop||speed>7.1)&&this.time-f.slideAt>(speed>7.1?.85:.3)){f.slideAt=this.time;this.emit('slide',{who,x:p.x,z:p.z,intensity:clamp(Math.max(speed,previous)/8.8,.2,1)})}
 if(speed>.7&&this.time-f.stepAt>clamp(.34-speed*.013,.21,.33)){f.stepAt=this.time;this.emit('step',{who,x:p.x,z:p.z,intensity:clamp(speed/8.8,.2,1)})}
 f.vx=vx;f.vz=vz;
 }
 tick(dt,input={}){if(['menu','paused','over'].includes(this.state))return;dt=Math.min(dt,.05);for(let remaining=dt;remaining>1e-6;){const step=Math.min(1/120,remaining);this.step(step,input);remaining-=step}}
 step(dt,input){this.time+=dt;for(const p of [this.you,this.ai])p.swing=Math.max(0,p.swing-dt*2.7);
 if(this.state==='point'||this.state==='fault'){const retry=this.state==='fault';this.timer-=dt;this.you.motion*=.97;this.ai.motion*=.97;if(this.timer<=0)this.startPoint(retry);return}
 const p=this.you,oldX=p.x,oldZ=p.z,moveX=clamp(input.x||0,-1,1),moveZ=clamp(input.z||0,-1,1),magnitude=Math.hypot(moveX,moveZ),sprint=input.sprint&&p.stamina>.08&&magnitude>.1;
 p.stamina=clamp(p.stamina+dt*(sprint?-.27:.13),0,1);const speed=sprint?8.8:6.0,normalizer=Math.max(1,magnitude);
 if(!(this.state==='toss'&&this.server==='you')){p.x+=moveX/normalizer*speed*dt;p.z+=moveZ/normalizer*speed*dt;
 if(input.targetX!==undefined){p.x+=clamp(input.targetX-p.x,-speed*dt,speed*dt);if(input.targetZ!==undefined)p.z+=clamp(input.targetZ-p.z,-speed*dt,speed*dt)}}
 p.x=clamp(p.x,-6.3,6.3);p.z=clamp(p.z,this.state==='serve'&&this.server==='you'?COURT.baseline+.17:1.5,13.5);
 if(input.aimX!==undefined)this.aim.x=clamp(input.aimX,-1.35,1.35);if(input.aimDepth!==undefined)this.aim.depth=clamp(input.aimDepth,0,1.25);
 if(this.state==='serve'){const server=this[this.server];this.ball.x=server.x;this.ball.z=server.z;this.ball.y=.95+Math.sin(this.time*7)*.06;if(this.server==='ai'){this.timer-=dt;if(this.timer<=0){this.state='toss';this.timer=.68;this.tossPower={type:'topspin',power:.75,over:0,aim:(this.random()-.5),depth:.7};this.emit('toss')}}}
 if(this.state==='toss'){this.timer-=dt;const server=this[this.server];this.ball.x=server.x;this.ball.z=server.z;this.ball.y=1.15+Math.sin((.68-this.timer)/.68*Math.PI*.5)*2;server.swing=clamp(1-this.timer/.68,.1,1);if(this.timer<=0){this.launch(this.server,this.tossPower,true,1);this.state='rally'}}
 if(this.state==='rally'){
 const b=this.ball;this.aiClock-=dt;const cfg=OPPONENT_LEVELS[this.difficulty];
 if(this.aiClock<=0){this.aiClock=cfg.delay;if(b.last==='you'){this.aiTarget.x=clamp(b.landing.x+this.aiAimError,-5.6,5.6);this.aiTarget.z=clamp(b.landing.z-1.7,-12.3,-1.5)}else{this.aiTarget.x=clamp(b.landing.x*.3,-1.2,1.2);this.aiTarget.z=b.type==='slice'&&b.landing.z<4.5?-5.8:b.type==='lob'?-10.5:-9.8}}
 const ax=this.ai.x,az=this.ai.z,dx=this.aiTarget.x-ax,dz=this.aiTarget.z-az,len=Math.hypot(dx,dz)||1;this.ai.stamina=clamp(this.ai.stamina+dt*(len>3?-.11:.09),0,1);const aiSpeed=cfg.speed*(.8+.2*this.ai.stamina);this.ai.x+=dx/len*Math.min(len,aiSpeed*dt);this.ai.z+=dz/len*Math.min(len,aiSpeed*dt);this.ai.motion=clamp(Math.hypot(this.ai.x-ax,this.ai.z-az)/dt/6,0,1);this.ai.step+=dt*(4+this.ai.motion*11);this.footSound('ai',(this.ai.x-ax)/dt,(this.ai.z-az)/dt);
 const oldBallX=b.x,oldBallY=b.y,oldBallZ=b.z,oldVY=b.vy;
 b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt-.5*9.81*dt*dt;b.vy-=9.81*dt;
 if((oldBallZ>0&&b.z<=0)||(oldBallZ<0&&b.z>=0)){
 const t=-oldBallZ/b.vz,netX=oldBallX+b.vx*t,netY=oldBallY+oldVY*t-.5*9.81*t*t;
 if(netY<COURT.net+.075&&Math.abs(netX)<COURT.double){b.x=netX;b.y=netY;b.z=0;this.emit('net');if(b.serve)this.serviceFault('NET FAULT');else this.score(b.last==='you'?'ai':'you','INTO THE NET');return}
 }
 if(b.y<=.075&&b.vy<0){
 // Solve the exact contact time, rather than calling an overshot frame position out.
 const impact=clamp((oldVY+Math.sqrt(Math.max(0,oldVY*oldVY+2*9.81*(oldBallY-.075))))/9.81,0,dt);
 b.x=oldBallX+b.vx*impact;b.z=oldBallZ+b.vz*impact;b.y=.075;b.vy=oldVY-9.81*impact;
 b.bounces++;this.emit('bounce');const loser=b.last==='you'?'ai':'you';
 if(b.bounces===1&&!landingIsIn(b,b.x,b.z)){if(b.serve)this.serviceFault('SERVICE FAULT');else this.score(loser,'OUT');return}
 if(b.bounces>=2){this.score(b.last,'DOUBLE BOUNCE');return}
 b.vy=-b.vy*b.bounce;b.vz*=b.type==='slice'?.89:.94;b.vx*=.94;b.serve=false;
 }
 if(this.shotTiming!=='auto'&&(this.shot||this.pending)&&b.last==='ai'&&b.vz>0&&b.z>3&&Math.abs(b.landing.x-p.x)<1.8){p.x+=clamp(b.landing.x-p.x,-1.8,1.8)*this.assist*dt*2.2}
 p.x=clamp(p.x,-6.3,6.3);if(this.shotTiming==='auto')this.autoHitYou();else this.hitYou();
 if(b.last==='you'&&Math.hypot(b.x-this.ai.x,b.z-this.ai.z)<cfg.reach&&b.y>.35&&b.y<2.6&&(!b.serve||b.bounces>0)&&b.z<-.7){
 const plan=opponentShot(this.ai,this.you,b,this.difficulty,this.random);this.ai.tactic=plan.tactic;this.launch('ai',plan.shot,false,plan.quality);this.quality='OPPONENT RETURN';}
 if(this.shotTiming!=='auto'&&this.pending&&this.time-this.pending.at>.25){this.pending=null;this.quality='TOO EARLY'}
 if(b.y< -1||Math.abs(b.z)>19||Math.abs(b.x)>14){if(b.serve){this.serviceFault('SERVICE FAULT');return}this.score(b.bounces>0?b.last:(b.last==='you'?'ai':'you'),b.bounces>0?'WINNER':'OUT');return}
 }
 p.motion=clamp(Math.hypot(p.x-oldX,p.z-oldZ)/dt/6,0,1);p.step+=dt*(3+p.motion*12);this.footSound('you',(p.x-oldX)/dt,(p.z-oldZ)/dt);
 }
}
