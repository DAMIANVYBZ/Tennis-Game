import assert from 'node:assert/strict';
import {assistPhoneInput} from '../phone-assist.mjs';
const make=()=>({state:'rally',time:2,you:{x:0,z:9,stamina:1},ball:{x:-2.8,y:1.2,z:9,vx:0,vy:0,vz:0,alive:true,last:'ai',bounces:1},feet:{you:{vx:6,vz:0}}});
let m=make(),i={x:-1,z:0,aimX:.7,aimDepth:.8};let out=assistPhoneInput(m,i);assert(out.sprint);assert(out.dive);assert.equal(out.x,-1);assert.equal(out.aimX,.7);assert.equal(i.dive,undefined);
assert.equal(assistPhoneInput(m,{x:0,z:0}).dive,undefined);assert.equal(assistPhoneInput(m,{x:1,z:0}).dive,undefined);
m.you.stamina=.1;out=assistPhoneInput(m,i);assert(!out.sprint);assert(!out.dive);
m=make();m.state='paused';assert.equal(assistPhoneInput(m,i),i);m.state='serve';assert.equal(assistPhoneInput(m,i),i);
m=make();m.ball.serve=true;m.ball.bounces=0;assert(!assistPhoneInput(m,i).dive);
m=make();m.you.dive={phase:'down'};assert.equal(assistPhoneInput(m,i),i);
m=make();m.you.diveCooldown=3;assert(!assistPhoneInput(m,i).dive);
m=make();m.ball.last='you';assert(!assistPhoneInput(m,i).dive);
console.log('PASS: automatic phone sprint and contextual diving, preserved manual steering/aim, no idle dives, no wrong-direction dives, stamina/recovery/cooldown and legal serve protections.');

m=make();out=assistPhoneInput(m,{x:0,z:0,targetX:-3,targetZ:9});assert(out.sprint);assert(out.dive);assert.equal(out.x,0);assert.equal(out.targetX,-3);
// Real moving returns, not just a stationary mock: dive before the ball reaches the player's baseline.
const {Match}=await import('../engine.mjs');
for(const side of [-1,1])for(const frame of [1/120,1/60,1/30]){
 const game=new Match(()=>{},()=>.5);game.start();game.shotTiming='auto';game.state='rally';game.time=2;game.you.x=0;game.you.z=9;game.ball={x:side*2.8,y:1.4,z:5.4,vx:0,vy:-1,vz:16,alive:true,last:'ai',bounces:1,serve:false,type:'topspin',bounce:.7,landing:{x:side*2.8,z:8}};
 let dived=false;for(let t=0;t<1&&game.state==='rally'&&game.ball.last==='ai';t+=frame){game.tick(frame,assistPhoneInput(game,{x:side,z:0}));dived ||=!!game.you.dive}
 assert(dived,`Moving return did not trigger at ${frame}`);assert.equal(game.ball.last,'you');assert.equal(game.quality,'DIVING RETURN');
}
console.log('PASS: moving 16 m/s returns trigger and connect automatic dives on both sides at 30/60/120 fps.');

m=make();m.you.stamina=.25;out=assistPhoneInput(m,{x:-1,z:0});assert(!out.sprint,'Reserve stamina for the dive');assert(out.dive);
