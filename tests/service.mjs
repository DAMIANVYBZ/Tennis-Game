import assert from 'node:assert/strict';
import {Match,COURT} from '../engine.mjs';
let checked=0;
function serve({who='you',side=1,x=-2,z=-4.6,type='topspin',power=.7,move=false,dt=1/60}){
 let bounced=null;const m=new Match((event)=>{if(event==='bounce'&&m.ball.serve)bounced={x:m.ball.x,z:m.ball.z}},()=>.5);
 m.start();m.server=who;m.serveAttempt=1;m[who].x=side*1.3;m[who].z=who==='you'?12.1:-12.1;m.state='rally';
 const shot={type,power,over:0,aim:(x+side*2)/2.8,depth:(Math.abs(z)-.8)/6.4};m.launch(who,shot,true);
 if(move)m[who].x=-side*2;
 for(let i=0;i<300&&m.state==='rally'&&!bounced;i++)m.tick(dt);
 checked++;return {m,bounced};
}
// Both servers and halves, every shot, three power levels, variable frame times.
// Include the service line, centre line and singles sideline: painted lines are in.
for(const who of ['you','ai'])for(const side of [-1,1])for(const type of ['flat','topspin','slice','lob'])for(const power of [.15,.7,1])for(const depth of [3.2,COURT.service])for(const width of [0,2,COURT.single]){
 const x=-side*width,z=(who==='you'?-1:1)*depth;
 const {m,bounced}=serve({who,side,type,power,x,z,dt:power===.15?1/30:1/60});
 assert.ok(bounced,JSON.stringify({who,side,type,power,x,z,reason:m.reason}));
 assert.equal(m.state,'rally','A legal serve must remain live');assert.deepEqual(m.points,{you:0,ai:0});
 assert.ok(Math.abs(bounced.x-x)<1e-6&&Math.abs(bounced.z-z)<1e-6,'Bounce must be at the actual ground contact, not beyond the frame');
}
// The server moving after contact must never switch the intended service box.
for(const who of ['you','ai'])for(const side of [-1,1]){
 const {m}=serve({who,side,x:-side*2,z:(who==='you'?-1:1)*5,move:true});assert.equal(m.state,'rally');assert.deepEqual(m.points,{you:0,ai:0});
}
// Genuine misses still fault: wrong diagonal box, wide, long and into the net.
for(const target of [{x:2,z:-4},{x:-4.4,z:-4},{x:-2,z:-6.6},{x:-2,z:-.1}]){
 const {m}=serve(target);assert.equal(m.state,'fault');assert.deepEqual(m.points,{you:0,ai:0});
 const oldEnd=m.end;for(let i=0;i<250&&m.state==='fault';i++)m.tick(1/120);
 assert.equal(m.state,'serve');assert.equal(m.serveAttempt,2);assert.equal(m.end,oldEnd);assert.equal(m.server,'you');
 m.state='rally';m.launch('you',{type:'topspin',power:.7,over:0,aim:(target.x+2)/2.8,depth:(Math.abs(target.z)-.8)/6.4},true);
 for(let i=0;i<400&&m.state==='rally';i++)m.tick(1/120);
 assert.equal(m.state,'point');assert.equal(m.reason,'DOUBLE FAULT');assert.deepEqual(m.points,{you:0,ai:1});
}
// A good second serve resumes the rally without awarding anyone a point.
const {m}=serve({x:2,z:-4});for(let i=0;i<250&&m.state==='fault';i++)m.tick(1/120);
m.state='rally';m.launch('you',{type:'topspin',power:.7,over:0,aim:0,depth:.72},true);
for(let i=0;i<200&&m.ball.bounces===0&&m.state==='rally';i++)m.tick(1/120);
assert.equal(m.state,'rally');assert.deepEqual(m.points,{you:0,ai:0});
console.log(`PASS: ${checked} serve cases; both servers/sides, all shots/powers, exact line contacts, post-contact movement, genuine faults, second serves and double faults.`);
