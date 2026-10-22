// Original instrumental for pre-match navigation; match audio remains separate.
export class MenuMusic{
 constructor(){
  this.audio=new Audio(new URL('./assets/audio/legon-court-walk.mp3',import.meta.url).href);
  this.audio.loop=true;this.audio.preload='auto';this.audio.volume=0;
  this.enabled=true;this.volume=.35;this.screen='landing';this.unlocked=false;this.state='waiting';this.playRequest=0;
  this.audio.addEventListener('error',()=>{this.state='unavailable';this.onChange?.()});
 }
 configure({enabled=this.enabled,volume=this.volume}={}){this.enabled=enabled;this.volume=Math.max(0,Math.min(1,volume));if(this.canPlay()){this.setLevel(this.volume);this.play()}else this.stop()}
 canPlay(){return this.enabled&&this.volume>0&&this.screen!=='court'&&!document.hidden&&this.unlocked}
 unlock(){
  this.unlocked=true;
  if(this.enabled&&this.screen!=='court')try{
   this.ctx??=new(window.AudioContext||window.webkitAudioContext)();
   if(!this.gain){this.source=this.ctx.createMediaElementSource(this.audio);this.gain=this.ctx.createGain();this.source.connect(this.gain);this.gain.connect(this.ctx.destination);this.audio.volume=1}
   this.ctx.resume().catch(()=>{});
  }catch{/* Media playback remains available without Web Audio. */}
  return this.play();
 }
 setLevel(volume){if(this.gain){this.gain.gain.value=volume;this.audio.volume=1}else this.audio.volume=volume}
 setScreen(screen){this.screen=screen;if(screen==='court')this.stop();else this.play()}
 async play(){
  if(!this.canPlay()){this.onChange?.();return}
  if(!this.audio.paused){this.setLevel(this.volume);return}
  const request=++this.playRequest;this.setLevel(this.volume);
  try{await this.audio.play();if(request!==this.playRequest){if(!this.canPlay())this.audio.pause();return}if(!this.canPlay()){this.audio.pause();return}this.state='playing'}
  catch(error){if(request!==this.playRequest)return;this.state=error.name==='NotAllowedError'?'waiting':error.name==='AbortError'?'stopped':'unavailable'}
  this.onChange?.();
 }
 stop(){this.playRequest++;this.setLevel(0);this.audio.pause();this.state=this.enabled&&!this.unlocked?'waiting':'stopped';this.onChange?.()}
}
