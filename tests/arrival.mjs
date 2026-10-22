import assert from 'node:assert/strict';
import {CourtArrival} from '../arrival.mjs';
const a=new CourtArrival(),p={x:1.3,z:12.1};a.begin();assert.equal(a.progress,0);assert.equal(a.cameraBlend,0);assert.equal(a.player(p,1).x,-6.65);
let blend=0;for(let i=0;i<80;i++){a.tick(.1);assert(a.cameraBlend>=blend);blend=a.cameraBlend;const you=a.player(p,1),ai=a.player({x:.8,z:-10.6},-1);assert(you.z>0&&ai.z<0)}
a.tick(.1);assert.equal(a.active,false);assert.equal(a.cameraBlend,1);assert(Math.abs(a.player(p,1).x-p.x)<1e-10);assert(Math.abs(a.player(p,1).z-p.z)<1e-10);assert.deepEqual(p,{x:1.3,z:12.1});a.begin();a.skip();assert.equal(a.active,false);assert.equal(a.progress,1);
console.log('PASS: deterministic arrival paths, separate halves, monotonic camera approach, finish/skip and immutable match positions.');
