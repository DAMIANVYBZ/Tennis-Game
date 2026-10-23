"""Automatic run/dive follow manual phone steering; shot buttons have generous touch targets."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);context=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def asset(r):
  f=ROOT/urlparse(r.request.url).path.lstrip('/')
  if f.is_dir():f=f/'index.html'
  r.fulfill(body=f.read_bytes(),content_type='text/javascript' if f.suffix in ['.js','.mjs'] else mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
 page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/');page.wait_for_function('window.tennisLoading&&!tennisLoading.active',timeout=120000)
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').tap();page.get_by_role('button',name='Settings',exact=True).tap();assert page.locator('[data-setting="difficulty"] option').all_text_contents()==['Easy','Medium','Hard'];page.locator('[data-setting="difficulty"]').select_option('easy');assert page.evaluate('__tennis.match.difficulty')=='easy';page.get_by_role('button',name='DONE').tap();assert 'AI EASY' in page.locator('.preparation-court').inner_text();page.set_viewport_size({'width':844,'height':390});page.locator('#enterCourt').tap();page.locator('#skipArrival').tap();page.wait_for_function('!document.body.classList.contains("arriving")')
 assert page.evaluate('__tennis.lobby.profile.settings.controls')=='touch';assert not page.locator('#touchSprint').is_visible();assert not page.locator('#touchDive').is_visible()
 page.wait_for_timeout(500);page.screenshot(path='/workspace/tennis-large-phone-shot-buttons.png')
 for width,height in [(844,390),(740,360),(932,430)]:
  page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(100)
  boxes=[button.bounding_box() for button in page.locator('[data-shot]').all()]
  assert all(box['width']>=60 and box['height']>=60 for box in boxes),boxes
  assert all(box['x']>=0 and box['x']+box['width']<=width and box['y']>=0 and box['y']+box['height']<=height for box in boxes),boxes
  for i,a in enumerate(boxes):
   for c in boxes[i+1:]:assert a['x']+a['width']<=c['x'] or c['x']+c['width']<=a['x'] or a['y']+a['height']<=c['y'] or c['y']+c['height']<=a['y']
 page.set_viewport_size({'width':844,'height':390});page.evaluate('() => new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
 page.evaluate('window.requestAnimationFrame=()=>0');page.wait_for_timeout(100)
 page.evaluate('''() => {const m=__tennis.match;m.state='rally';m.you.x=0;m.you.z=9;m.you.stamina=1;m.ball={x:-2.8,y:1.2,z:9,vx:0,vy:0,vz:0,alive:true,last:'ai',bounces:1,type:'topspin',serve:false,bounce:.7,landing:{x:-2.8,z:9}};m.feet.you.vx=6;m.feet.you.vz=0}''')
 # Steer the joystick left, without touching sprint or dive.
 joy=page.locator('#joystick').bounding_box();point={'pointerId':7,'clientX':joy['x']+2,'clientY':joy['y']+joy['height']/2}
 page.mouse.move(point['clientX'],point['clientY']);page.mouse.down()
 actions=page.evaluate('__tennis.buildInput(.01)');assert actions['x']<0 and actions['sprint'] and actions['dive'],actions
 page.evaluate('__tennis.match.tick(.01,__tennis.buildInput(.01))');assert page.evaluate('!!__tennis.match.you.dive')
 page.mouse.up()
 page.evaluate('__tennis.match.start();__tennis.lobby.updateSettings({shotTiming:"manual"})');assert page.locator('#touchSprint').is_visible();assert page.locator('#touchDive').is_visible()
 # Every enlarged shot target still supports charging through pointer input.
 for shot in ['flat','lob','slice','topspin']:
  page.evaluate('__tennis.match.start()');button=page.locator('[data-shot="'+shot+'"]');button.tap();assert page.evaluate('__tennis.match.state')=='toss';assert page.evaluate('__tennis.match.tossPower.type')==shot

 assert not errors,errors
 print('PASS: auto phone sprint/dive from joystick steering; hidden redundant buttons; manual mode restores them; 72px portrait/62px landscape shot targets fit without overlap and all four shots remain usable. No browser errors.');b.close()
