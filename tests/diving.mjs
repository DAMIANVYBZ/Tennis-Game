import assert from 'node:assert/strict';
import {Match} from '../engine.mjs';
import {beginDive,advanceDive,diveRacket,diveContact,diveMovement} from '../dive.mjs';
const ball={alive:true,last:'ai',x:-3,y:.6,z:9,serve:false,bounces:1};
const player=stamina=>({x:0,z:9,stamina});
let p=player(1);assert(beginDive(p,ball,{x:-1},0,{vx:6,vz:0}));assert(p.dive.wrongFoot);const slow=p.dive.down+p.dive.rise;
let fresh=player(1);beginDive(fresh,ball,{x:-1},0,{vx:-6,vz:0});assert(fresh.dive.down+fresh.dive.rise<slow);
let tired=player(.2);beginDive(tired,ball,{x:-1},0,{vx:6,vz:0});assert(tired.dive.down+tired.dive.rise>slow);
assert.equal(beginDive(p,ball,{x:-1},.1),false);assert.equal(diveMovement(p),0);
advanceDive(p,.1,.1);let r=diveRacket(p);assert(diveContact(p,{...ball,...r},r));assert(!diveContact(p,{...ball,...r,y:3},r));assert(!diveContact(p,{...ball,...r,serve:true,bounces:0},r));p.dive.hit=true;assert(!diveContact(p,{...ball,...r},r));
for(let i=0;i<300&&p.dive;i++)advanceDive(p,.01,i*.01);assert.equal(p.dive,null);assert.equal(diveMovement(p),1);
function match(){const m=new Match(()=>{},()=>.5);m.shotTiming='auto';m.start();m.state='rally';m.you.x=0;m.you.z=9;m.ball={...ball,x:-2.8,y:1.2,vx:0,vy:0,vz:0,bounce:.7,type:'topspin',landing:{x:-2.8,z:9}};return m}
let m=match();for(let i=0;i<45&&m.ball.last==='ai';i++)m.tick(.01,{x:-1,dive:true});assert.equal(m.ball.last,'you');assert(m.you.dive?.hit);assert.equal(m.quality,'DIVING RETURN');
// Grounded players cannot get a normal assisted return or run freely.
m=match();m.you.dive={phase:'down',time:0,dx:-1,dz:0,down:.8,rise:.5,hit:false};m.ball.x=0;m.ball.y=1;const x=m.you.x;m.tick(.05,{x:1,dive:true});assert.equal(m.you.x,x);assert.equal(m.ball.last,'ai');assert.equal(m.prepare('flat'),false);
// Pause freezes recovery; a new point clears it.
m.pause();const t=m.you.dive.time;m.tick(.05);assert.equal(m.you.dive.time,t);m.pause();m.startPoint();assert.equal(m.you.dive,null);
// Missing the dive remains a live miss, and the second bounce still scores normally.
m=match();m.ball.x=5.5;for(let i=0;i<150&&m.state==='rally';i++)m.tick(.01,{x:-1,dive:true});assert.equal(m.points.ai,1);
console.log('PASS: wrong-foot/fatigue recovery costs, manual dive direction, actual swept racket/ball alignment, successful diving return, misses/second bounce, grounded restrictions, no repeated hit, pause and reset.');
// A fresh balanced dive can recover for the next ball while a tired wrong-footed dive cannot.
function recovery(stamina,velocity){const n=match();n.you.stamina=stamina;beginDive(n.you,n.ball,{x:-1},0,velocity);for(let i=0;i<145;i++)advanceDive(n.you,.01,i*.01);n.ball={...ball,x:n.you.x,y:1,z:n.you.z,vx:0,vy:-1,vz:0,bounce:.7,type:'topspin',landing:{x:n.you.x,z:n.you.z}};n.tick(.01);return n}
assert.equal(recovery(1,{vx:-6,vz:0}).ball.last,'you');assert.equal(recovery(.2,{vx:6,vz:0}).ball.last,'ai');
