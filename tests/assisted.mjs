import assert from 'node:assert/strict';
import {Match} from '../engine.mjs';
import {freshProfile,normalizeProfile} from '../inventory.mjs';
assert.equal(freshProfile().settings.shotTiming,'auto');assert.equal(normalizeProfile({settings:{shotTiming:'bad'}}).settings.shotTiming,'auto');assert.equal(normalizeProfile({settings:{shotTiming:'manual'}}).settings.shotTiming,'manual');
function incoming(x=0,y=1.1,serve=false){return {x,y,z:8.9,vx:0,vy:-1,vz:8,alive:true,bounces:serve?0:1,last:'ai',type:'topspin',serve,bounce:.7,landing:{x,z:8}}}
function setup(){const m=new Match(()=>{},()=>.5);m.shotTiming='auto';m.start();m.state='rally';m.you.x=0;m.you.z=9;m.ball=incoming();return m}
let m=setup();m.tick(.01);assert.equal(m.ball.last,'you');assert.equal(m.ball.type,'topspin');assert.equal(m.selectedShot.power,.55);assert.equal(m.you.x,0);assert.equal(m.you.z,9);
// Charge is read at assisted contact, without release; holding too long cannot cause a timing miss.
m=setup();m.prepare('lob');m.shot.time-=2;m.tick(.01);assert.equal(m.ball.last,'you');assert.equal(m.ball.type,'lob');assert.equal(m.selectedShot.power,1);assert.equal(m.shot,null);
// Early release stays queued until the player reaches the ball; aim remains under live user control.
m=setup();m.ball={...incoming(4,2.2),vz:0,vy:0};m.prepare('slice');m.shot.time-=.4;m.release();for(let i=0;i<50;i++)m.tick(.01);assert.ok(m.pending);m.ball=incoming();m.tick(.01,{aimX:.6,aimDepth:.6});assert.equal(m.ball.last,'you');assert.equal(m.ball.type,'slice');assert.ok(Math.abs(m.ball.landing.x-2.64)<.001);assert.ok(m.selectedShot.power>.47&&m.selectedShot.power<.48);
// No movement assistance or teleportation, even with the old saved position assistance at 40%.
m=setup();m.assist=.4;m.ball=incoming(4);m.prepare('flat');m.tick(.05);assert.equal(m.you.x,0);assert.equal(m.ball.last,'ai');
for(const [x,y,serve] of [[0,3,false],[0,.2,false],[0,1,true],[3,1,false]]){m=setup();m.ball=incoming(x,y,serve);m.tick(.01);assert.equal(m.ball.last,'ai')}
// A legal bounce unlocks receiving; outgoing balls cannot be hit twice.
m=setup();m.ball=incoming(0,1,true);m.ball.bounces=1;m.tick(.01);assert.equal(m.ball.last,'you');let count=m.rally;m.tick(.01);assert.equal(m.rally,count);
// Players still choose when to start a serve, and manual mode remains available.
m=new Match();m.shotTiming='auto';m.start();m.tick(.05);assert.equal(m.state,'serve');m.prepare('topspin');m.shot.time-=.5;m.release();assert.equal(m.state,'toss');
m=setup();m.shotTiming='manual';m.tick(.01);assert.equal(m.ball.last,'ai');
console.log('PASS: automatic contact in reach, held and banked power, live aim, no automatic movement, legal serve reception, no double hits, manual mode and default preference migration.');

m=setup();m.ball=incoming(4);m.prepare('slice');m.release();assert.ok(m.prepare('flat'));assert.equal(m.pending,null);assert.equal(m.shot.type,'flat');
