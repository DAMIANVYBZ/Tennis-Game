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
