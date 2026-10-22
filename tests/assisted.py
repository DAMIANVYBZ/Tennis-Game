"""Assisted shot setting, real automatic return and saved advanced mode in Chromium."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def asset(route):
  path=ROOT/urlparse(route.request.url).path.lstrip('/')
  if path.is_dir():path=path/'index.html'
  route.fulfill(body=path.read_bytes(),content_type='text/javascript' if path.suffix in ['.mjs','.js'] else mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
 page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/');page.wait_for_function('window.__tennis?.environment.state==="ready"&&__tennis.characterStatus.state==="ready"',timeout=120000)
 assert page.evaluate('__tennis.match.shotTiming')=='auto'
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();page.get_by_role('button',name='Settings',exact=True).click();assert page.locator('[data-setting="shotTiming"]').input_value()=='auto'
 page.get_by_role('button',name='DONE').click();page.get_by_role('button',name='OPEN ASSET GALLERY').click();page.locator('#enterCourt').click();page.evaluate('__tennis.arrival.skip()')
 # Use the real animation loop and engine: no input should still return an in-reach ball.
 page.evaluate('''() => {const m=__tennis.match;m.state='rally';m.you.x=0;m.you.z=9;m.ball={x:0,y:1.1,z:8.9,vx:0,vy:-1,vz:8,alive:true,bounces:1,last:'ai',type:'topspin',serve:false,bounce:.7,landing:{x:0,z:8}}}''')
 page.wait_for_function('__tennis.match.ball.last==="you"');assert page.evaluate('__tennis.match.quality')=='ASSISTED CONTACT'
 assert page.locator('#playerPower').is_visible();assert 'AUTO CONTACT' in page.locator('#playerPowerLabel').inner_text()
 page.locator('#returnClub').click();page.get_by_role('button',name='Settings',exact=True).click();page.locator('[data-setting="shotTiming"]').select_option('manual');assert page.evaluate('__tennis.match.shotTiming')=='manual'
 page.reload();page.wait_for_function('window.__tennis?.characterStatus.state==="ready"',timeout=120000);assert page.evaluate('__tennis.match.shotTiming')=='manual'
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();page.get_by_role('button',name='Settings',exact=True).click();page.locator('[data-setting="shotTiming"]').select_option('auto');assert page.evaluate('__tennis.match.shotTiming')=='auto'
 assert not errors,errors
 print('PASS: default assisted contact, real rendered automatic return without shot input, power feedback, mode selection and saved advanced preference. No browser errors.')
 browser.close()
