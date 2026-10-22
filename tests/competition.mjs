import assert from 'node:assert/strict';
import {opponentShot,OPPONENT_LEVELS} from '../opponent.mjs';
import {reachPose} from '../motion.mjs';
const ai={x:0,z:-10,stamina:1},ball={x:0,z:-10,y:1},you={x:2,z:11.5};
let p=opponentShot(ai,you,ball,'normal',()=>.1);assert.equal(p.tactic,'DROP SHOT');assert.equal(p.shot.type,'slice');assert(p.shot.depth<.4);
p=opponentShot(ai,{x:1,z:4},ball,'normal',()=>.2);assert.equal(p.shot.type,'lob');assert.equal(p.tactic,'PASSING LOB');
p=opponentShot(ai,{x:3,z:8},ball,'normal',()=>.5);assert(p.shot.aim<0);assert.equal(p.tactic,'OPEN COURT');
p=opponentShot(ai,{x:3,z:8},ball,'normal',()=>.9);assert(p.shot.aim>0);assert.equal(p.tactic,'WRONG FOOT');
p=opponentShot({...ai,stamina:.2},you,{...ball,x:1.5},'normal',()=>.5);assert.equal(p.tactic,'DEFENSIVE RESET');assert(p.shot.depth>.75);assert(p.shot.power<.6);
assert(OPPONENT_LEVELS.easy.speed<OPPONENT_LEVELS.normal.speed);assert(OPPONENT_LEVELS.normal.speed<OPPONENT_LEVELS.hard.speed);assert(OPPONENT_LEVELS.easy.error>OPPONENT_LEVELS.hard.error);
const player={x:0,z:9,swing:0};assert(reachPose(player,{alive:true,last:'ai',x:1.5,z:9,y:.5,vz:0},'you'));assert.equal(reachPose(player,{alive:true,last:'ai',x:5,z:9,y:1},'you'),null);
assert.equal(reachPose(player,{alive:true,last:'you',x:0,z:9,y:1},'you'),null);assert.equal(reachPose(player,{alive:true,last:'ai',serve:true,bounces:0,x:0,z:9,y:1},'you'),null);
assert.deepEqual(reachPose({...player,swing:1,contact:{x:1,y:.4,z:9}},null,'you').target,{x:1,y:.4,z:9});
console.log('PASS: tactical drop/lob/open-court/wrong-foot choices, defensive resets under pressure, difficulty levels and reachable-ball/recovery animation targets.');

p=opponentShot({...ai,stamina:.1},you,{...ball,x:1.5},'normal',()=>0);assert.equal(p.tactic,'FORCED ERROR');assert(Math.abs(p.shot.aim)>1);
// The same legal placements beat different levels of court coverage; even Hard misses some.
const {Match}=await import('../engine.mjs');const returns={};
for(const difficulty of ['easy','normal','hard']){let returned=0;for(const x of [-5.5,-3.8,0,3.8,5.5])for(const aim of [-.92,0,.92])for(const depth of [.18,.55,.95]){let hit=false;const m=new Match((event,data)=>{if(event==='hit'&&data.who==='ai')hit=true},()=>.5);m.difficulty=difficulty;m.start();m.state='rally';m.ai.x=x;m.ai.z=-12;m.you.x=0;m.you.z=10.5;m.ball={x:0,y:1.2,z:10.5};m.launch('you',{type:'topspin',power:.85,aim,depth,over:0});assert.equal(m.aiClock,OPPONENT_LEVELS[difficulty].delay);for(let i=0;i<400&&m.state==='rally'&&!hit;i++)m.tick(.01);returned+=hit?1:0}returns[difficulty]=returned}
assert(returns.easy<returns.normal&&returns.normal<returns.hard&&returns.hard<45,JSON.stringify(returns));console.log('PASS: 45 matched court placements distinguish Easy/Medium/Hard coverage, including missed balls on Hard; reaction delay applies from shot contact.');
