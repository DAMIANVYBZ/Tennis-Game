"""Meaningful browser regression checks. Requires Playwright and Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    page=browser.new_page(viewport={'width':1440,'height':1200})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((Path(__file__).resolve().parents[1]/'index.html').read_text())
    page.get_by_role('button',name='Step onto court').click()
    # Remove animation scheduling so all physics checks use deterministic steps.
    page.evaluate('window.requestAnimationFrame=()=>0')
    page.wait_for_timeout(60)
    def js(s):return page.evaluate(s)
    def step(n=1,dt=.02):js(f'for(let i=0;i<{n};i++)update({dt})')
    def incoming(z=.905,x='px'):
        js(f"state='playing';cancelShot();ball={{x:{x},z:{z},vx:0,vz:1,lastPlayer:false,bounced:true}}")
    # Keyboard hold/release, power and actual audio.
    page.keyboard.down('Space');step(30)
    assert js('shot.type')=='topspin'
    page.keyboard.up('Space')
    assert js("state==='playing' && ball.vz<0 && ball.type==='topspin'")
    assert js('audioEvents>0 && audio.state==="running"')
    # No input must never return the ball.
    incoming();step(9)
    assert js("state==='between' && ai===1")
    # Prepared, well-timed flat return requires explicit release.
    incoming(.5);page.keyboard.down('x');step(18)
    js('ball.z=.895;ball.x=px;ball.vx=0;ball.vz=1')
    page.keyboard.up('x');step()
    assert js("ball.vz<0 && ball.type==='flat' && feedback==='PERFECT'")
    # Holding through contact is a miss, not an automatic shot.
    incoming();page.keyboard.down('Space');step(9);page.keyboard.up('Space')
    assert js("state==='between' && ai===2")
    # A release too early expires before contact.
    incoming(.5);page.keyboard.down('c');step(2);page.keyboard.up('c');step(30)
    assert js("state==='between' && ai===3")
    # AI assistance is capped and does not chase distant balls.
    incoming(.7,'0.16');js('target=0;px=0;beginShot("topspin","test")');step(20,.001)
    assert js('px<=.091')
    incoming(.7,'0.8');js('target=0;px=0;beginShot("topspin","test")');step()
    assert js('px===0')
    # Aim and power affect velocity; shot variety changes flight shape.
    js('ball={x:0,z:.91};launch(true,"topspin",.3,1,-1)')
    left=js('ball.vx');slow=js('Math.abs(ball.vz)')
    js('ball={x:0,z:.91};launch(true,"flat",1,1,1)')
    assert left<0<js('ball.vx') and js('Math.abs(ball.vz)')>slow
    js('ball={x:0,z:.91};launch(true,"lob",.6,1,0)')
    assert js('ball.arc')==100
    # Bad flat-shot timing can hit the net; out shots lose the hitter's point.
    js('state="playing";ball={x:0,z:.51};launch(true,"flat",1,.1,0)');step()
    assert js("state==='between' && feedback==='INTO THE NET'")
    js('state="playing";ball={x:1.2,z:.30,vx:0,vz:-1,lastPlayer:true,bounced:false}');step()
    assert js("state==='between' && feedback==='BALL OUT'")
    # Controller press charges; release serves. Right stick aims, left moves.
    js("""window.pad={index:0,connected:true,axes:[0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});ready();pad.buttons[0].pressed=true;pollGamepad(.02)""")
    assert js('shot.type')=='topspin'
    step(20);js('pad.buttons[0].pressed=false;pollGamepad(.02)')
    assert js("state==='playing'")
    js('pad.axes[0]=1;pad.axes[2]=-.8;pollGamepad(.02)');before=js('target');step()
    assert js('target')>before and abs(js('aimX')-(-.8+.18)/.82)<1e-8 # dead-zone scaling
    js('pad.buttons[9].pressed=true;pollGamepad(.02)')
    assert js('state')=='paused'
    before=js('gameTime');step(5);assert js('gameTime')==before
    js('pad.connected=false;pollGamepad(.02)')
    assert 'disconnected' in page.locator('#gamepadStatus').inner_text()
    # Mobile hold buttons also release shots, including pointer cancellation.
    page.set_viewport_size({'width':390,'height':1000})
    js('ready()')
    button=page.locator('[data-shot="slice"]')
    button.dispatch_event('pointerdown',{'pointerId':1});step(20)
    button.dispatch_event('pointerup',{'pointerId':1})
    assert js("state==='playing' && ball.type==='slice'")
    assert js('document.documentElement.scrollWidth<=innerWidth')
    # Muting updates the master gain; enabling resumes sound.
    page.locator('#sound').click();assert js('!sound && master.gain.value===0')
    page.locator('#sound').click();assert js('sound && master.gain.value>0')
    js('you=6;point(true)');assert 'Your court' in page.locator('#title').inner_text()
    page.get_by_role('button',name='Play again').click();assert js('you===0 && ai===0')
    assert not errors,errors
    print('PASS: manual timing/no auto-hit, shot power/aim/types, capped assist, net/out scoring, gamepad hold/release/aim/pause, mobile buttons, audio activation/mute, win/restart.')
    page.set_viewport_size({'width':1440,'height':1200})
    js('beginShot("topspin","test");update(.55);draw(0)')
    page.screenshot(path='/workspace/tennis-manual.png',full_page=True)
    browser.close()
