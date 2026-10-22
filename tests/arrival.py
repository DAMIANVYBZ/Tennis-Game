"""Aerial arrival, walking actors, frozen match and close court framing."""
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
 page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/?court=oval-east');page.wait_for_function('window.__tennis?.environment.state==="ready"&&__tennis.characterStatus.state==="ready"',timeout=120000)
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();page.locator('#enterCourt').click()
 page.wait_for_function('__tennis.arrival.active&&__tennis.arrival.elapsed>.2');assert page.evaluate('__tennis.match.time')==0
 assert page.evaluate('__tennis.camera.position.y')>40
 early=page.evaluate('__tennis.youModel.root.position.toArray()');assert early[0]<-6
 page.locator('#skipArrival').click();page.wait_for_function('!document.body.classList.contains("arriving")');assert page.evaluate('__tennis.match.state')=='serve'
 page.evaluate('__tennis.arrival.begin()');page.wait_for_function('__tennis.camera.position.y>40');page.screenshot(path='/workspace/tennis-arrival-aerial.png')
 page.evaluate('__tennis.arrival.elapsed=6.8');page.wait_for_function('__tennis.camera.position.y<20');late=page.evaluate('__tennis.youModel.root.position.toArray()');assert late[0]>early[0]+4
 page.wait_for_function('!__tennis.arrival.active');page.wait_for_function('!document.body.classList.contains("arriving")')
 # Regulation court and baseline players remain in the frame; adjacent court is peripheral.
 def bounds():return page.evaluate('''() => [-5.485,5.485].flatMap(x=>[-13.5,13.5].map(z=>{const p=__tennis.youModel.root.position.clone().set(x,0,z).project(__tennis.camera);return {x:p.x,y:p.y}}))''')
 b=bounds();assert all(abs(p['x'])<1.03 and abs(p['y'])<1.03 for p in b),b
 assert max(p['x'] for p in b)-min(p['x'] for p in b)>1.05,b
 assert page.evaluate('__tennis.environment.root.userData.venue')=='oval-east'
 assert page.evaluate('__tennis.environment.root.children[0].position.x')==-13.5
 page.screenshot(path='/workspace/tennis-close-gameplay.png')
 # Manual movement remains responsive after arrival.
 before=page.evaluate('__tennis.match.you.x');page.locator('#court').focus();page.keyboard.down('d');page.wait_for_function('(x)=>__tennis.match.you.x>x',arg=before);page.keyboard.up('d')
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(300);b=bounds();assert all(abs(p['x'])<1.05 and abs(p['y'])<1.05 for p in b),b
 page.screenshot(path='/workspace/tennis-close-gameplay-mobile.png')
 # Returning to the club cancels arrival; a fresh court entry can finish naturally.
 page.locator('#returnClub').click();page.locator('#enterCourt').click();page.evaluate('__tennis.arrival.elapsed=7.9');page.wait_for_function('!__tennis.arrival.active');assert page.evaluate('__tennis.match.state')=='serve'
 assert not errors,errors
 print('PASS: selected-court aerial arrival, visible walking, smooth close approach, frozen match, skip and natural finish, desktop/phone full-court framing, manual movement and exact selected-court environment. No browser errors.')
 browser.close()
