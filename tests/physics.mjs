import assert from 'node:assert/strict';
import {Match,COURT} from '../engine.mjs';
const events=[];let seed=123;const random=()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;
const m=new Match((kind,data)=>events.push({kind,...data}),random);
const step=(seconds,input={})=>{for(let i=0;i<Math.ceil(seconds*120);i++)m.tick(1/120,input)};
const until=(condition,seconds,input={})=>{for(let i=0;i<seconds*120&&!condition();i++)m.tick(1/120,input);assert.ok(condition(),'Condition not reached')};
m.start();assert.equal(m.server,'you');assert.equal(m.state,'serve');
assert.ok(m.prepare('topspin'));step(.65);assert.ok(m.release());assert.equal(m.state,'toss');assert.ok(!m.ball.alive);step(.7);assert.equal(m.state,'rally');assert.ok(m.ball.vz<0);assert.ok(m.ball.y>1);
// A real serve must cross the net and land legally before the receiver can hit.
until(()=>events.some(e=>e.kind==='bounce'),3);assert.ok(m.ball.z<0&&Math.abs(m.ball.z)<COURT.service);assert.ok(Math.sign(m.ball.x)!==Math.sign(m.you.x));
until(()=>events.filter(e=>e.kind==='hit').some(e=>e.who==='ai'),4);
// With no shot input, being lined up does not auto-return the opponent's ball.
until(()=>m.state==='point',5);assert.equal(m.points.ai,1);assert.ok(['DOUBLE BOUNCE','WINNER'].includes(m.reason));
step(2.4);assert.equal(m.state,'serve');
// Full two-axis manual movement and diagonal speed normalization.
const start={x:m.you.x,z:m.you.z};step(.25,{x:1,z:-1});assert.ok(m.you.x>start.x&&m.you.z<start.z);
assert.ok(Math.hypot(m.you.x-start.x,m.you.z-start.z)<=1.51);
const stamina=m.you.stamina;step(.3,{x:1,sprint:true});assert.ok(m.you.stamina<stamina);
m.pause();const time=m.time;step(.5);assert.equal(m.time,time);m.pause();
// Reachable manual release hits; holding through two bounces does not.
m.state='rally';m.you.x=0;m.you.z=9;m.ball={x:0,y:1.1,z:8.9,vx:0,vy:-1,vz:8,alive:true,bounces:1,last:'ai',type:'topspin',serve:false,bounce:.7,landing:{x:0,z:8}};
m.prepare('flat');m.shot.time-=.65;m.release();step(.02);assert.equal(m.ball.last,'you');assert.equal(m.ball.type,'flat');assert.ok(m.ball.vz<0);
// A released shot outside reach cannot be magically aligned into a return.
m.state='rally';m.cancel();m.ball={x:5,y:1.1,z:8.9,vx:0,vy:-1,vz:8,alive:true,bounces:1,last:'ai',type:'topspin',serve:false,bounce:.7,landing:{x:5,z:8}};m.you.x=0;m.you.z=9;m.prepare('topspin');m.release();step(.02);assert.equal(m.ball.last,'ai');assert.equal(m.you.x,0);
// Net collision and first-bounce out scoring come from actual flight.
m.cancel();m.ball={x:0,y:.6,z:.02,vx:0,vy:0,vz:-10,alive:true,bounces:0,last:'you',serve:false,landing:{x:0,z:-8}};m.state='rally';const ai=m.points.ai;step(.02);assert.equal(m.reason,'INTO THE NET');assert.equal(m.points.ai,ai+1);
m.state='rally';m.ball={x:5,y:.08,z:-8,vx:0,vy:-2,vz:-4,alive:true,bounces:0,last:'you',serve:false,landing:{x:5,z:-8}};step(.02);assert.equal(m.reason,'OUT');
// Serve alternation, changeovers, and first-to-21 win-by-two.
m.points={you:3,ai:2};m.startPoint();assert.equal(m.end,1);assert.equal(m.server,'you');
m.points={you:20,ai:20};m.state='rally';m.score('you','WINNER');assert.equal(m.state,'point');step(2.4);m.state='rally';m.score('you','WINNER');assert.equal(m.state,'over');assert.equal(m.winner,'you');
// Distinct shot flights, rather than cosmetic labels.
const flight={};for(const type of ['flat','topspin','slice','lob']){m.ball={x:0,y:1,z:10};m.launch('you',{type,power:.7,over:0,aim:.6,depth:.8});flight[type]={vy:m.ball.vy,speed:Math.abs(m.ball.vz)}}
assert.ok(flight.flat.speed>flight.topspin.speed);assert.ok(flight.lob.vy>flight.topspin.vy);assert.ok(flight.slice.speed<flight.topspin.speed);
console.log('PASS: complete legal serve and AI return, no automatic player hit, two-axis motion, stamina, pause, manual release/reach, net/out physics, service rotation/changeovers, win-by-two and distinct shot trajectories.');

// Aim range includes short balls and deliberate long/wide shots, even on serves.
const shot={type:'topspin',power:.6,over:0,aim:1.35,depth:1.25};
m.you.x=1.3;m.you.z=12.1;m.ball={x:0,y:1,z:10};
let target=m.trajectory('you',shot,false).landing;assert.ok(target.x>COURT.single&&Math.abs(target.z)>COURT.baseline);
let deep=m.trajectory('you',shot,true).landing;let short=m.trajectory('you',{...shot,depth:0},true).landing;
assert.ok(Math.abs(deep.z)>COURT.service);assert.ok(Math.abs(short.z)<1);
console.log('PASS: short, deep, wide, out-of-court and adjustable service-depth targets.');
