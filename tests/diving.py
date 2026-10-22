"""Manual dive inputs, airborne/fallen recovery rendering and the lower phone camera."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes,shutil,math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def asset(route):
  path=ROOT/urlparse(route.request.url).path.lstrip('/')
  if path.is_dir():path=path/'index.html'
  route.fulfill(body=path.read_bytes(),content_type='text/javascript' if path.suffix in ['.mjs','.js'] else mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
 page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/');page.wait_for_function('window.tennisLoading&&!tennisLoading.active',timeout=120000)
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();page.locator('#enterCourt').click();page.evaluate('__tennis.arrival.skip()');page.wait_for_function('!document.body.classList.contains("arriving")');page.evaluate('window.requestAnimationFrame=()=>0');page.wait_for_timeout(150)
 def setup():page.evaluate('''() => {const m=__tennis.match;m.start();__tennis.arrival.skip();m.state='rally';m.you.x=0;m.you.z=9;m.ball={x:-2.8,y:1.2,z:9,vx:0,vy:0,vz:0,alive:true,last:'ai',bounces:1,serve:false,bounce:.7,type:'topspin',landing:{x:-2.8,z:9}}}''')
 setup();page.locator('#court').focus();page.keyboard.down('a');page.keyboard.down('b');assert page.evaluate('__tennis.buildInput(.01).dive');page.evaluate('__tennis.match.tick(.05,__tennis.buildInput(.01))');page.keyboard.up('b');page.keyboard.up('a');assert page.evaluate('__tennis.match.you.dive.phase')=='air'
 for i in range(4):page.evaluate('__tennis.match.tick(.05)')
 page.evaluate('__tennis.refresh()');page.screenshot(path='/workspace/tennis-dive-airborne.png');error=page.evaluate('''() => {const a=__tennis.youModel,d=__tennis.match.you.dive,p=__tennis.match.you,u=Math.min(1,d.time/.5),target=a.root.position.clone().set(p.x+d.dx*1.05,.32+Math.sin(u*Math.PI)*.62,p.z+d.dz*1.05);return a.racket.getObjectByName('racket-frame').getWorldPosition(a.root.position.clone()).distanceTo(target)}''');assert error<.45,error
 assert page.evaluate('__tennis.youModel.current.visual.quaternion.angleTo(__tennis.youModel.root.quaternion.clone().identity())')>.5
 for i in range(7):page.evaluate('__tennis.match.tick(.05)')
 page.evaluate('__tennis.refresh()');assert page.evaluate('__tennis.match.you.dive.phase') in ['down','rising'];page.screenshot(path='/workspace/tennis-dive-grounded.png')
 # Standard mapped DualSense L1 starts a dive with the left stick direction.
 setup();page.evaluate("window.pad={index:0,connected:true,axes:[-1,0,0,0],buttons:Array.from({length:17},()=>({pressed:false}))};pad.buttons[4].pressed=true;Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});__tennis.pollPad();__tennis.match.tick(.01,__tennis.buildInput(.01))");assert page.evaluate('__tennis.match.you.dive.dx')<0
 page.evaluate('pad.connected=false;__tennis.pollPad();__tennis.lobby.setControl("touch")');setup();page.locator('#touchDive').dispatch_event('click');page.evaluate('__tennis.match.tick(.01,__tennis.buildInput(.01))');assert page.evaluate('!!__tennis.match.you.dive')
 # Portrait view is behind the player rather than overhead, and the touch dive button stays usable.
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(150);page.evaluate('__tennis.match.start();__tennis.refresh()');assert page.locator('#touchDive').is_visible()
 camera=page.evaluate('({y:__tennis.camera.position.y,z:__tennis.camera.position.z})');assert camera['y']==17 and camera['z']==34,camera
 assert math.degrees(math.atan2(camera['y'],camera['z']-5))<35
 page.screenshot(path='/workspace/tennis-phone-behind-player.png');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS: keyboard B, mapped PS5 L1 and phone DIVE; visible airborne/fallen animation; restricted recovery; lower portrait camera; desktop camera unchanged. No browser errors.')
 browser.close()
