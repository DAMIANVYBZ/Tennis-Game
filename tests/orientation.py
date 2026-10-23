"""Menus stay portrait; only phone court entry requires actual landscape, with a 40% larger joystick."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);context=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 context.add_init_script("try{Object.defineProperty(screen.orientation,'lock',{value:undefined})}catch{}")
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def asset(r):
  f=ROOT/urlparse(r.request.url).path.lstrip('/')
  if f.is_dir():f=f/'index.html'
  r.fulfill(body=f.read_bytes(),content_type='text/javascript' if f.suffix in ['.js','.mjs'] else mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
 page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/');page.wait_for_function('window.tennisLoading&&!tennisLoading.active',timeout=120000)
 assert page.locator('.ug-lobby').is_visible();assert page.locator('#rotateNotice').is_hidden()
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').tap();assert page.locator('#rotateNotice').is_hidden();page.locator('#enterCourt').tap();assert page.locator('#rotateNotice').is_visible();assert page.evaluate('__tennis.match.state')=='menu';assert page.evaluate('__tennis.match.time')==0
 page.screenshot(path='/workspace/tennis-phone-rotate-gate.png');page.locator('#rotateBack').tap();assert page.locator('.preparation-home').is_visible();assert page.locator('#rotateNotice').is_hidden()
 page.locator('#enterCourt').tap();page.set_viewport_size({'width':844,'height':390});page.wait_for_function('!__tennis.orientation.blocked&&__tennis.arrival.active');assert page.locator('#rotateNotice').is_hidden();page.locator('#skipArrival').tap();page.wait_for_function('!document.body.classList.contains("arriving")')
 pad=page.locator('#joystick').bounding_box();knob=page.locator('#knob').bounding_box();assert abs(pad['width']-126)<.1,pad;assert abs(knob['width']-56)<.1,knob
 # Normalized movement still reaches 100% at the new pad radius.
 page.mouse.move(pad['x']+pad['width']/2+pad['width']*.34,pad['y']+pad['height']/2);page.mouse.down();assert page.evaluate('__tennis.buildInput(.01).x')>.98;page.mouse.up()
 page.screenshot(path='/workspace/tennis-landscape-large-joystick.png')
 page.set_viewport_size({'width':390,'height':844});page.wait_for_function('__tennis.orientation.blocked');assert page.evaluate('__tennis.match.state')=='paused';t=page.evaluate('__tennis.match.time');page.wait_for_timeout(200);assert page.evaluate('__tennis.match.time')==t
 page.set_viewport_size({'width':844,'height':390});page.wait_for_function('!__tennis.orientation.blocked');assert page.evaluate('__tennis.match.state')=='serve';assert page.locator('#rotateNotice').is_hidden()
 # Preserve a pause that the user requested before rotating.
 page.locator('#pause').tap();page.set_viewport_size({'width':390,'height':844});page.wait_for_function('__tennis.orientation.blocked');page.set_viewport_size({'width':844,'height':390});page.wait_for_function('!__tennis.orientation.blocked');assert page.evaluate('__tennis.match.state')=='paused'
 page.locator('#quitHome').tap();page.set_viewport_size({'width':390,'height':844});assert page.locator('.ug-lobby').is_visible();assert page.locator('#rotateNotice').is_hidden()
 # Already landscape goes directly into court with no rotate prompt.
 page.set_viewport_size({'width':844,'height':390});page.get_by_role('button',name='PLAY INTER-HALL MATCH').tap();page.locator('#enterCourt').tap();assert page.locator('#rotateNotice').is_hidden();assert page.evaluate('__tennis.arrival.active')
 assert not errors,errors
 print('PASS: portrait menus; portrait court blocked; actual landscape continues without repeat prompts; mid-game rotation freezes/resumes play; manual pause preserved; menu cancels gate; joystick/knob exactly 40% larger with correct input normalization. No browser errors.');b.close()
