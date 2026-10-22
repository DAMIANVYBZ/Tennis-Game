// Surveyed from Legon-world-Test dc022c1. Coordinates use that game's x-east/z-south frame.
export const CAMPUS_SOURCE={repository:'DAMIANVYBZ/Legon-world-Test',commit:'dc022c169a40514d783a494743cdabdebff4034b',origin:{latitude:5.6518,longitude:-.1871}};
export const SITES=[
 {id:'athletic-oval',name:'Athletic Oval',short:'ATHLETIC OVAL',anchor:{x:-77.5,y:.07,z:376,yaw:0},description:'Open sports grounds beside the running track, with the handball and volleyball courts, trees and Legon Hall annexes.',sourceFiles:['src/game/athletics.ts','src/game/annexes.ts']},
 {id:'commonwealth-west',name:'Commonwealth west tennis complex',short:'COMMONWEALTH WEST',anchor:{x:-630.5,y:6.2,z:-73,yaw:0},description:'A sunken, tree-lined terrace with stepped stone retaining walls, chain-link fencing and two neighbouring red-soil courts.',sourceFiles:['src/game/tennis.ts','src/game/tennisplan.ts','src/game/ghlandscape.ts']},
 {id:'sports-stadium',name:'Sports Stadium & Pool',short:'STADIUM / POOL',anchor:{x:538,y:.06,z:1434.5,yaw:0},description:'The stadium sports precinct, with the swimming pool and diving tower, gymnasium and neighbouring tennis court.',sourceFiles:['src/game/stadium.ts']},
];
export const COURTS=[
 {id:'oval-west',siteId:'athletic-oval',name:'Athletic Oval · West court',x:-77.5,z:376,surface:'hard'},
 {id:'oval-east',siteId:'athletic-oval',name:'Athletic Oval · East court',x:-64,z:376,surface:'hard'},
 {id:'commonwealth-hard',siteId:'commonwealth-west',name:'Commonwealth west · Hard court',x:-630.5,z:-73,surface:'hard'},
 {id:'commonwealth-clay-west',siteId:'commonwealth-west',name:'Commonwealth west · Red-soil court 1',x:-613.625,z:-73,surface:'clay'},
 {id:'commonwealth-clay-east',siteId:'commonwealth-west',name:'Commonwealth west · Red-soil court 2',x:-595.875,z:-73,surface:'clay'},
 {id:'stadium-west',siteId:'sports-stadium',name:'Sports Stadium / Pool · West court',x:538,z:1434.5,surface:'hard'},
 {id:'stadium-east',siteId:'sports-stadium',name:'Sports Stadium / Pool · East court',x:558.5,z:1434.5,surface:'hard'},
];
export const DEFAULT_VENUE='oval-west';
const ALIASES={'athletic-oval':'oval-west',oval:'oval-west','commonwealth-west':'commonwealth-hard',commonwealth:'commonwealth-hard','sports-stadium':'stadium-west',stadium:'stadium-west'};
export function venueId(value){return COURTS.some(c=>c.id===value)?value:(Object.hasOwn(ALIASES,value)?ALIASES[value]:null)}
export function getVenue(value){const court=COURTS.find(c=>c.id===(venueId(value)||DEFAULT_VENUE)),site=SITES.find(s=>s.id===court.siteId),co=Math.cos(site.anchor.yaw),si=Math.sin(site.anchor.yaw),dx=court.x-site.anchor.x,dz=court.z-site.anchor.z;return {...court,site,offset:{x:co*dx+si*dz,z:-si*dx+co*dz},preview:`assets/venues/${site.id}-preview.webp`}}
export function requestedVenue(search){const q=new URLSearchParams(search);for(const key of ['court','courtId','venue']){const id=venueId(q.get(key));if(id)return id}return null}
export function toCampusPosition(value,x,z){const v=getVenue(value),co=Math.cos(v.site.anchor.yaw),si=Math.sin(v.site.anchor.yaw);return {x:v.x+co*x-si*z,y:v.site.anchor.y,z:v.z+si*x+co*z}}
