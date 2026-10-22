// Sampled racket and shoe textures from the user-provided reference, with synthesized fallbacks.
const SAMPLE_FILES={hit:['racket-a.wav','racket-b.wav'],shoe:['shoe-a.wav','shoe-b.wav']};
export class CourtAudio{
 constructor(){this.enabled=true;this.volume=.65;this.events=0;this.sampleState='idle';this.samples={hit:[],shoe:[]};this.samplePlays={hit:0,step:0,slide:0};this.activeSamples=new Set();this.sampleIndex={hit:0,shoe:0}}
 unlock(){if(!this.enabled)return;try{this.ctx??=new(window.AudioContext||window.webkitAudioContext)();if(!this.master){this.master=this.ctx.createGain();this.master.gain.value=this.volume;this.limiter=this.ctx.createDynamicsCompressor();this.limiter.threshold.value=-10;this.limiter.ratio.value=3;this.limiter.attack.value=.003;this.limiter.release.value=.12;this.master.connect(this.limiter);this.limiter.connect(this.ctx.destination);this.buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate);const data=this.buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1}this.ctx.resume().catch(()=>{});this.loadSamples()}catch{}}
 loadSamples(){if(this.sampleState!=='idle'||!this.ctx)return;this.sampleState='loading';const tasks=[];for(const [kind,files]of Object.entries(SAMPLE_FILES))for(const file of files)tasks.push((async()=>{try{const response=await fetch(new URL('./assets/audio/'+file,import.meta.url));if(!response.ok)throw Error('Audio not available');const decoded=await this.ctx.decodeAudioData(await response.arrayBuffer());this.samples[kind].push(decoded);return true}catch{return false}})());this.loadPromise=Promise.all(tasks).then(results=>{this.sampleState=results.every(Boolean)?'ready':results.some(Boolean)?'partial':'fallback'})}
 setVolume(v){this.volume=v;if(this.master)this.master.gain.value=this.enabled?v:0}
 toggle(){this.enabled=!this.enabled;if(this.enabled)this.unlock();if(this.master)this.master.gain.value=this.enabled?this.volume:0;return this.enabled}
 stopSamples(){for(const source of this.activeSamples){try{source.stop()}catch{}}this.activeSamples.clear()}
 noise(length,gain,freq=1200,delay=0){if(!this.ctx||!this.enabled)return;const n=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain(),t=this.ctx.currentTime+delay;n.buffer=this.buffer;f.type='bandpass';f.frequency.value=freq;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+length);n.connect(f);f.connect(g);g.connect(this.master);n.start(t);n.stop(t+length)}
 note(freq,length,gain=.15,delay=0){if(!this.ctx||!this.enabled)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime+delay;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.45,t+length);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+length);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+length)}
 sample(kind,data={}){const category=kind==='hit'?'hit':'shoe',buffers=this.samples[category];if(!buffers.length)return false;
 const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),pan=this.ctx.createStereoPanner(),filter=this.ctx.createBiquadFilter();
 source.buffer=buffers[this.sampleIndex[category]++%buffers.length];const power=data.power??.6,intensity=data.intensity??.5,far=data.who==='ai';
 source.playbackRate.value=(kind==='hit'?.98+power*.05:.97+intensity*.10)+(Math.random()-.5)*.045;
 const level=kind==='hit'?.60+power*.25:kind==='slide'?.40+intensity*.22:.14+intensity*.10;
 gain.gain.value=level*(far?.43:1);filter.type='lowpass';filter.frequency.value=far?5700:10000;pan.pan.value=Math.max(-.65,Math.min(.65,(data.x||0)/8));
 source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(this.master);
 this.activeSamples.add(source);source.onended=()=>{this.activeSamples.delete(source);source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect()};
 if(kind==='step'){const duration=Math.min(.11,source.buffer.duration);const t=this.ctx.currentTime;gain.gain.setValueAtTime(gain.gain.value,t);gain.gain.exponentialRampToValueAtTime(.001,t+duration);source.start(0,0,duration)}else source.start();
 this.samplePlays[kind]++;return true;
 }
 play(kind,data={}){if(!this.enabled||!this.ctx)return;if(['pause','start','ready','fault'].includes(kind))this.stopSamples();this.events++;
 if(kind==='hit'&&!this.sample('hit',data)){this.note(320+(data.power||.5)*180,.065,.22);this.noise(.07,.27,2200)}
 if(kind==='swing')this.noise(.14,.07,3200);
 if(kind==='bounce'){this.note(160,.11,.18);this.noise(.06,.10,700)}
 if(kind==='step'&&!this.sample('step',data))this.noise(.09,.05,1800);
 if(kind==='slide'&&!this.sample('slide',data)){this.noise(.25,.14,2600);this.note(1300,.13,.025)}
 if(kind==='fault')this.note(230,.18,.12);if(kind==='net')this.noise(.25,.2,400);
 if(kind==='point'){for(let i=0;i<7;i++)this.noise(.45,.07,900+i*120,i*.08)}
 if(kind==='win'){for(let i=0;i<18;i++)this.noise(.6,.09,700+i*80,i*.08);[440,554,659,880].forEach((n,i)=>this.note(n,.25,.1,i*.14))}
 }
}
