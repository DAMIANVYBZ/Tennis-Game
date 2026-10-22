const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const OPPONENT_LEVELS={easy:{speed:4.5,delay:.30,reach:1.4,error:.36},normal:{speed:5.9,delay:.19,reach:1.5,error:.20},hard:{speed:7.2,delay:.11,reach:1.65,error:.09}};
export function opponentShot(ai,you,ball,difficulty,random=Math.random){
 const level=OPPONENT_LEVELS[difficulty],stretch=Math.hypot(ball.x-ai.x,ball.z-ai.z),pressure=clamp((stretch-.7)/1.2+(1-ai.stamina)*.5,0,1),open=you.x>=0?-1:1,choice=random();
 let type,aim,depth,power,tactic;
 if(pressure>.55){type='topspin';aim=-Math.sign(ai.x||1)*.42;depth=.83;power=.47;tactic='DEFENSIVE RESET'}
 else if(you.z<5.7){type=choice<.65?'lob':'topspin';aim=open*.6;depth=.88;power=.55;tactic=type==='lob'?'PASSING LOB':'PASSING SHOT'}
 else if(you.z>10.8&&choice<.22){type='slice';aim=open*.48;depth=.24;power=.35;tactic='DROP SHOT'}
 else{type=choice<.18?'slice':choice<.5?'flat':'topspin';aim=choice>.78?-open*.46:open*(.62+random()*.18);depth=.65+random()*.22;power=.55+random()*.3;tactic=choice>.78?'WRONG FOOT':'OPEN COURT'}
 // Placement becomes less reliable when stretched or fatigued, without changing reach rules.
 const error=level.error*(.25+pressure*1.5),miss=(random()-.5)*2*error;
 aim=clamp(aim+miss,-1.08,1.08);depth=clamp(depth+miss*.24,.12,1.1);
 const errorChance=level.error*(.10+pressure*.22+(1-ai.stamina)*.08);if(random()<errorChance){aim=open*(1.01+random()*.08);tactic='FORCED ERROR'}
 return {shot:{type,aim,depth,power,over:0},quality:clamp(1-pressure*.3-level.error*.2,.55,1),pressure,tactic};
}
