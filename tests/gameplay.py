"""Chromium integration checks. pip install playwright; requires Chromium."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    def asset(route):
        path=ROOT/urlparse(route.request.url).path.lstrip('/')
        if path.is_dir():path=path/'index.html'
        if not path.exists():route.fulfill(status=404,body='not found');return
        route.fulfill(body=path.read_bytes(),content_type='text/javascript' if path.suffix in ['.mjs','.js'] else mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
    page.route('http://baseline.test/**',asset)
    page.goto('http://baseline.test/')
    page.wait_for_function('!!window.__tennis',timeout=60000)
    page.get_by_role('button',name='PLAY INTER-HALL MATCH').click()
    page.get_by_role('button',name='OPEN ASSET GALLERY').click()
    page.locator('#enterCourt').click();page.evaluate('__tennis.arrival.skip()')
    page.wait_for_function('__tennis.sound.sampleState==="ready"')
    page.wait_for_function('__tennis.renderer.info.render.triangles>10000')
    page.evaluate('window.requestAnimationFrame=()=>0')
    page.wait_for_timeout(150)
    def js(code):return page.evaluate(code)
    def advance(seconds,input='{}'):js(f'for(let i=0;i<{int(seconds*120)};i++)__tennis.match.tick(1/120,{input})')
    assert js('__tennis.match.state')=='serve'
    # The visible face and the racket-ready arms must face the opponent.
    def facing_check():
        return js("""() => {
            __tennis.scene.updateMatrixWorld(true);
            return ['human-player','club-opponent'].map((name,index) => {
                const player=__tennis.scene.getObjectByName(name);
                const opponent=__tennis.scene.getObjectByName(index?'human-player':'club-opponent');
                const nose=player.getObjectByName('face-direction');
                const vector=()=>player.position.clone().set(0,0,0);
                const forward=nose.getWorldPosition(vector()).sub(nose.parent.getWorldPosition(vector()));
                const toward=opponent.getWorldPosition(vector()).sub(player.getWorldPosition(vector()));
                forward.y=toward.y=0;
                return forward.normalize().dot(toward.normalize());
            });
        }""")
    assert all(dot>.9 for dot in facing_check()), 'Players must face each other'
    js('__tennis.match.end=1')
    for _ in range(12):js('__tennis.refresh()')
    assert all(dot>.9 for dot in facing_check()), 'Facing must survive camera changeovers'
    js('__tennis.match.end=0')
    page.keyboard.down('ArrowUp');input_before=js('__tennis.match.you.z')
    advance(.2,'__tennis.buildInput(1/120)');page.keyboard.up('ArrowUp')
    assert js('__tennis.match.you.z')<input_before
    page.keyboard.down('Space');advance(.3);js('__tennis.refresh()')
    assert page.locator('#playerPower').is_visible()
    low=js('parseInt(document.getElementById("playerPowerPercent").textContent)')
    assert 30<low<60
    assert js('__tennis.scene.getObjectByName("aiming-arc").visible')
    left=js('__tennis.scene.getObjectByName("aim-target").position.x')
    page.keyboard.down('e');advance(.25,'__tennis.buildInput(1/120)');page.keyboard.up('e');js('__tennis.refresh()')
    assert js('__tennis.scene.getObjectByName("aim-target").position.x')>left
    assert js('parseInt(document.getElementById("playerPowerPercent").textContent)')>low
    advance(.1);page.keyboard.up('Space')
    assert js('__tennis.match.state')=='toss'
    advance(.7);assert js('__tennis.match.state')=='rally'
    assert js('__tennis.sound.events>0 && __tennis.sound.ctx.state==="running"')
    assert js('__tennis.sound.samplePlays.hit>0 && __tennis.sound.samples.hit.length===2 && __tennis.sound.samples.shoe.length===2')
    page.keyboard.press('p');assert js('__tennis.match.state')=='paused'
    before=js('__tennis.match.time');advance(.5);assert js('__tennis.match.time')==before
    page.keyboard.press('p');assert js('__tennis.match.state')=='rally'
    # Real gamepad polling with standard DualSense button positions.
    js("""window.pad={index:0,connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});__tennis.match.start();pad.buttons[0].pressed=true;__tennis.pollPad()""")
    assert js('__tennis.match.shot.type')=='topspin'
    advance(.6);js('pad.buttons[0].pressed=false;__tennis.pollPad()')
    assert js('__tennis.match.state')=='toss'
    advance(.7)
    js('pad.axes=[.7,-.7,-.8,.6];pad.buttons[7].pressed=true;__tennis.pollPad()')
    before=js('({x:__tennis.match.you.x,z:__tennis.match.you.z})')
    advance(.15,'__tennis.buildInput(1/120)')
    assert js('__tennis.match.you.x')>before['x'] and js('__tennis.match.you.z')<before['z']
    assert js('__tennis.match.aim.x')<0 and js('__tennis.match.you.stamina')<1
    advance(.03)
    assert js('__tennis.sound.samplePlays.step>0 && __tennis.sound.samplePlays.slide>0')
    js('pad.buttons[9].pressed=true;__tennis.pollPad()');assert js('__tennis.match.state')=='paused'
    js('pad.connected=false;__tennis.pollPad()');assert 'DISCONNECTED' in page.locator('#gamepadStatus').inner_text()
    # Holding the right stick keeps extending depth instead of selecting a fixed spot.
    js('pad.connected=true;pad.buttons.forEach(b=>b.pressed=false);pad.axes=[0,0,0,-.8];__tennis.match.start();__tennis.pollPad()')
    advance(.25,'__tennis.buildInput(1/120)');js('__tennis.refresh()')
    first=js('__tennis.scene.getObjectByName("aim-target").position.z')
    advance(.25,'__tennis.buildInput(1/120)');js('__tennis.refresh()')
    assert js('__tennis.scene.getObjectByName("aim-target").position.z')<first-.2
    js('pad.axes=[0,0,0,0];__tennis.pollPad()')
    held=js('__tennis.match.aim.depth');advance(.15,'__tennis.buildInput(1/120)')
    assert abs(js('__tennis.match.aim.depth')-held)<1e-8
    js('pad.axes=[0,0,0,-1];__tennis.pollPad()');advance(1,'__tennis.buildInput(1/120)');js('__tennis.refresh()')
    assert js('__tennis.scene.getObjectByName("aim-target").position.z')<-6.4
    assert js('__tennis.scene.getObjectByName("aiming-arc").material.color.getHex()')==0xf4a38b
    js('pad.axes=[0,0,0,1];__tennis.pollPad()');advance(2,'__tennis.buildInput(1/120)');js('__tennis.refresh()')
    assert js('__tennis.scene.getObjectByName("aim-target").position.z')> -2
    js('pad.connected=false;__tennis.pollPad();__tennis.match.start()')
    # Settings pause/resume and assistance changes.
    js('__tennis.match.start()')
    page.locator('#settingsButton').click();assert js('__tennis.match.state')=='paused'
    page.locator('#assist').fill('20');assert js('__tennis.match.assist')==.2
    page.locator('#difficulty').select_option('hard');assert js('__tennis.match.difficulty')=='hard'
    page.locator('#closeSettings').click();assert js('__tennis.match.state')=='serve'
    page.locator('#sound').click();assert js('!__tennis.sound.enabled && __tennis.sound.master.gain.value===0')
    page.locator('#sound').click();assert js('__tennis.sound.enabled')
    # Touch-sized landscape layout and actual pointer hold/release.
    page.set_viewport_size({'width':844,'height':390});js('__tennis.match.start();__tennis.refresh()')
    js('__tennis.lobby.setControl("touch")')
    button=page.locator('[data-shot="slice"]');r=button.bounding_box()
    page.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);page.mouse.down();advance(.6)
    assert js('__tennis.match.shot.type')=='slice'
    page.mouse.up();assert js('__tennis.match.state')=='toss'
    js('__tennis.match.start();__tennis.refresh()')
    stick=page.locator('#joystick').bounding_box();x=stick['x']+stick['width']/2;y=stick['y']+stick['height']/2
    before=js('__tennis.match.you.x');page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+25,y-10);advance(.2,'__tennis.buildInput(1/120)');page.mouse.up()
    assert js('__tennis.match.you.x')>before
    assert js('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/workspace/tennis-mobile-landscape.png')
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(150);js('__tennis.refresh()')
    assert js('document.documentElement.scrollWidth<=innerWidth')
    # First service fault gives a visible second serve without changing the score.
    js('__tennis.match.start();__tennis.match.state="rally";__tennis.match.launch("you",{type:"topspin",power:.7,over:0,aim:1.2,depth:.72},true)')
    advance(2);js('__tennis.refresh()')
    assert js('__tennis.match.state')=='fault'
    assert js('__tennis.match.points.you+__tennis.match.points.ai')==0
    assert page.locator('#pointScore').inner_text()=='2nd serve'
    assert js('__tennis.scene.getObjectByName("service-box").visible')
    advance(1.2);js('__tennis.refresh()')
    assert js('__tennis.match.serveAttempt')==2
    assert '2ND SERVE' in page.locator('#phase').inner_text()
    # Win overlay and restart integrate engine, HUD, camera and controls.
    js('__tennis.match.points={you:20,ai:18};__tennis.match.state="rally";__tennis.match.score("you","WINNER")')
    assert page.locator('#overlay').is_visible()
    assert 'VICTORY' in page.locator('#overlay h1').inner_text()
    page.get_by_role('button',name='Play again').click();assert js('__tennis.match.points.you')==0
    page.set_viewport_size({'width':1440,'height':900});page.wait_for_timeout(150);js('__tennis.refresh()')
    page.keyboard.down('Space');advance(.6);js('__tennis.refresh()');page.screenshot(path='/workspace/tennis-aim-power.png');page.keyboard.up('Space')
    assert not errors,errors
    print('PASS: WebGL rendered scene, 2-axis keyboard/gamepad/joystick, shot charge/release and toss, audio activation/mute, pause, settings, mobile/portrait layout, match win/restart. Aiming arc responds to input; overhead power bar fills. No browser errors.')
    browser.close()
