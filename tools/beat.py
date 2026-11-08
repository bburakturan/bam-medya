# Orijinal, telifsiz 10 sn afro-house altlığı (sentez). python3 beat.py out.wav
import numpy as np, wave, sys
SR=44100; BPM=122; DUR=10.0; N=int(SR*DUR); beat=60/BPM
out=np.zeros((N,2))
t=lambda d: np.arange(int(SR*d))/SR
rng=np.random.default_rng(7)
def add(sig,start,pan=0.0,g=1.0):
    i=int(start*SR); 
    if i>=N: return
    s=sig[:N-i]*g; out[i:i+len(s),0]+=s*(1-pan)/1; out[i:i+len(s),1]+=s*(1+pan)/1
def kick():
    x=t(.35); f=50+90*np.exp(-x*30); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-x*9)
def hat(o=False):
    x=t(.2 if o else .05); n=rng.standard_normal(len(x)); n=np.diff(n,prepend=0)
    return n*np.exp(-x*(18 if o else 70))*.25
def clap():
    x=t(.18); n=rng.standard_normal(len(x)); n=np.diff(n,prepend=0)
    env=np.exp(-x*25)+.6*np.exp(-np.maximum(x-.012,0)*40)*(x>.012)
    return n*env*.3
def shaker():
    x=t(.07); n=np.diff(rng.standard_normal(len(x)),prepend=0); return n*np.sin(np.pi*x/.07)*.08
def tone(freq,d,dec=4,harm=(1,.5,.25)):
    x=t(d); s=sum(a*np.sin(2*np.pi*freq*(k+1)*x) for k,a in enumerate(harm)); return s*np.exp(-x*dec)*np.minimum(1,x*200)
def pad(freqs,d):
    x=t(d); s=sum(np.sin(2*np.pi*f*x)+.3*np.sin(2*np.pi*f*2.003*x) for f in freqs)
    env=np.minimum(1,x/.4)*np.minimum(1,(d-x)/.4); return s*env*.05
# Am - F - C - G progression (2 beats each? use 1 bar each)
chords=[[220,261.6,329.6],[174.6,220,261.6],[261.6,329.6,392],[196,246.9,293.7]]
bass=[55,43.65,65.4,49]
bars=int(DUR/(4*beat))+1
for b in range(bars):
    t0=b*4*beat
    add(pad(chords[b%4],4*beat),t0,0,1)
    for q in range(4):
        tq=t0+q*beat
        if tq>8.6 and tq<9.4: continue
        add(kick(),tq,0,.9)
        add(hat(True),tq+beat/2,.3,.8)
        if q in(1,3): add(clap(),tq,-.1,1)
        for s16 in range(4): add(shaker(),tq+s16*beat/4,-.4,1 if s16%2 else .6)
    # syncopated bass
    for off,mult in [(0,1),(.75,1),(1.5,2),(2.5,1),(3.25,1)]:
        add(tone(bass[b%4]*mult,.28,8,(1,.35,.1)),t0+off*beat,0,.55)
    # marimba-ish pluck
    for off,n in [(0.5,2),(1.25,1),(2,2),(3,0),(3.5,1)]:
        add(tone(chords[b%4][n]*2,.3,14,(1,.2,.05)),t0+off*beat,.35,.18)
x=np.arange(N)/SR
out*=np.minimum(1,x/.3)[:,None]*np.minimum(1,(DUR-x)/1.2)[:,None]
out=np.tanh(out*1.1); out/=np.abs(out).max()/0.89
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((out*32767).astype('<i2').tobytes()); w.close()
