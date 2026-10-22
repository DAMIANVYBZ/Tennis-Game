"""Create an original 16-bar, 96 BPM warm instrumental loop (NumPy + ffmpeg)."""
import math,wave,subprocess,tempfile
from pathlib import Path
import numpy as np
RATE=32000;BEAT=60/96;LENGTH=16*4*BEAT;N=round(LENGTH*RATE)
rng=np.random.default_rng(1948);audio=np.zeros((N,2),np.float64)
def frequency(note):return 440*2**((note-69)/12)
def mix(signal,start,gain=1,pan=0):
 i=round(start*RATE)%N;signal=signal*gain;left=math.sqrt((1-pan)/2);right=math.sqrt((1+pan)/2)
 for channel,level in [(0,left),(1,right)]:
  split=min(len(signal),N-i);audio[i:i+split,channel]+=signal[:split]*level
  if len(signal)>split:audio[:len(signal)-split,channel]+=signal[split:]*level

def keys(note,duration):
 t=np.arange(round(duration*RATE))/RATE;f=frequency(note);env=(1-np.exp(-t*50))*np.exp(-t*1.5)*np.minimum(1,(duration-t)*20)
 return (np.sin(2*np.pi*f*t+.22*np.sin(2*np.pi*f*2*t)*np.exp(-t*2))+.17*np.sin(2*np.pi*f*2*t)+.045*np.sin(2*np.pi*f*3*t))*env

def pad(note,duration):
 t=np.arange(round(duration*RATE))/RATE;f=frequency(note);env=np.minimum(1,t/.16)*np.minimum(1,(duration-t)/.45)
 return env*(np.sin(2*np.pi*f*t)+.27*np.sin(2*np.pi*f*1.003*t)+.13*np.sin(2*np.pi*f*2*t))

def bass(note,duration):
 t=np.arange(round(duration*RATE))/RATE;f=frequency(note);return (np.sin(2*np.pi*f*t)+.18*np.sin(2*np.pi*f*2*t))*(1-np.exp(-t*100))*np.exp(-t*3)*np.minimum(1,(duration-t)*25)

def kick():
 t=np.arange(round(.28*RATE))/RATE;phase=2*np.pi*(47*t+70*.023*(1-np.exp(-t/.023)));return np.sin(phase)*np.exp(-t*18)*(1-np.exp(-t*600))

def hat(duration=.065):
 t=np.arange(round(duration*RATE))/RATE;noise=rng.normal(0,.5,len(t));noise=np.r_[0,np.diff(noise)];return noise*np.exp(-t*65)*np.minimum(1,t*2000)

def rim():
 t=np.arange(round(.11*RATE))/RATE;return (.45*np.sin(2*np.pi*420*t)+.12*np.sin(2*np.pi*780*t)+rng.normal(0,.12,len(t)))*np.exp(-t*55)*np.minimum(1,t*2000)

chords=[[57,60,64,67,71],[53,57,60,64,67],[48,55,59,62,64],[55,59,62,64,69]]
melodies=[[76,None,79,76,74,None,71,72],[72,None,76,79,76,None,72,71],[71,None,74,76,79,None,76,74],[74,None,71,69,71,None,74,76]]
for bar in range(16):
 start=bar*4*BEAT;chord=chords[(bar//2)%4];root=chord[0]-12
 for j,note in enumerate(chord):mix(pad(note,4*BEAT+.35),start,.024,(-.55+j*.27))
 for offset,level in [(0,1),(1.5,.7),(2.75,.8)]:
  for j,note in enumerate(chord[1:]):mix(keys(note,1.7),start+offset*BEAT+j*.013,.033*level,(-.35+j*.23))
 for beat,level in [(0,.22),(1.75,.13),(2.5,.17)]:mix(bass(root,.62),start+beat*BEAT,level)
 for beat in [0,2]:mix(kick(),start+beat*BEAT,.22)
 for beat in [1,3]:mix(rim(),start+beat*BEAT,.11,.15)
 for eighth in range(8):mix(hat(),start+(eighth*.5+(.06 if eighth%2 else 0))*BEAT,.025 if eighth%2 else .016,(-.35 if eighth%2 else .35))
 if bar%2:
  for eighth,note in enumerate(melodies[(bar//2)%4]):
   if note is None:continue
   at=start+(eighth*.5+.04)*BEAT;signal=keys(note,.7);mix(signal,at,.045,.2);mix(signal,at+.75*BEAT,.012,-.4)
# Short diffuse stereo reflections wrap around the loop, giving continuous reverb tails.
dry=audio.copy()
for seconds,gain in [(.113,.08),(.179,.06),(.263,.045),(.37,.03)]:audio+=np.roll(dry,round(seconds*RATE),axis=0)[:,::-1]*gain
# Soft saturation, constant headroom and a short seam treatment avoid clicks.
audio=np.tanh(audio*1.2);audio*=.76/max(np.max(np.abs(audio)),1e-8)
fade=round(.008*RATE);audio[:fade]*=np.linspace(0,1,fade)[:,None];audio[-fade:]*=np.linspace(1,0,fade)[:,None]
output=Path(__file__).resolve().parents[1]/'assets/audio/legon-court-walk.mp3'
with tempfile.TemporaryDirectory() as directory:
 wav=Path(directory)/'loop.wav'
 with wave.open(str(wav),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes((audio*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','128k','-metadata','title=Legon Court Walk','-metadata','artist=UG Legon Tennis Smash - original game instrumental',str(output)],check=True)
print('Original instrumental:',round(LENGTH,2),'seconds;',output.stat().st_size,'bytes; peak',round(float(np.max(np.abs(audio))),3),'RMS',round(float(np.sqrt(np.mean(audio**2))),3))
