"""Real GLB loading, skinned animation, character selection and failure recovery."""
from pathlib import Path
from urllib.parse import urlparse
import mimetypes,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and any(t in m.text for t in ['Shader Error','VALIDATE_STATUS','COMPILE_STATUS']) else None)
 def asset(route):
  path=ROOT/urlparse(route.request.url).path.lstrip('/')
  if path.is_dir():path=path/'index.html'
  if not path.exists():route.fulfill(status=404,body='missing');return
  route.fulfill(body=path.read_bytes(),content_type='text/javascript' if path.suffix in ['.mjs','.js'] else mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
 page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/');page.wait_for_function('window.__tennis?.characterStatus.state==="ready"',timeout=120000)
 assert page.evaluate('__tennis.youModel.sex')=='female';assert page.evaluate('__tennis.aiModel.sex')=='male'
 assert page.evaluate('[__tennis.youModel,__tennis.aiModel].every(a=>a.loaded&&a.current.joints.size===65)')
 assert page.evaluate('''() => [__tennis.youModel,__tennis.aiModel].every(a=>{let n=0;a.root.traverse(o=>{if(o.isSkinnedMesh&&o.skeleton.bones.length===65)n++});return n>=6})''')
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();page.get_by_role('button',name='OPEN ASSET GALLERY').click()
 assert page.locator('[data-character="female"] img').evaluate('(img)=>img.complete&&img.naturalWidth>0')
 assert page.locator('[data-character="male"] img').evaluate('(img)=>img.complete&&img.naturalWidth>0')
 page.locator('[data-character="male"]').click();assert page.evaluate('__tennis.youModel.sex')=='male';assert page.evaluate('__tennis.aiModel.sex')=='female'
 page.locator('[data-character="female"]').click();page.screenshot(path='/workspace/tennis-character-gallery.png');page.locator('#enterCourt').click();page.evaluate('__tennis.arrival.skip()');page.wait_for_timeout(600)
 assert page.evaluate('__tennis.renderer.info.render.triangles')>90000
 page.screenshot(path='/workspace/tennis-rigged-court.png')
 # Deterministic render checks use the actual player skeleton, never stand-in geometry.
 page.evaluate('window.requestAnimationFrame=()=>0');page.wait_for_timeout(150)
 data=page.evaluate('''() => {const a=__tennis.youModel,p={x:0,z:0,step:0,motion:0,swing:0,side:1},opponent={x:0,z:5};const pose=(options={})=>{a.pose(p,opponent,options);return a.current.bones.RightHand.getWorldPosition(a.root.position.clone()).toArray()};const idle=pose();p.motion=1;p.step=1.2;const run=pose();p.motion=0;p.swing=.55;const hit=pose();p.swing=0;const serve=pose({toss:.8});return {idle,run,hit,serve}}''')
 assert sum(abs(a-b) for a,b in zip(data['idle'],data['run']))>.03,data
 assert sum(abs(a-b) for a,b in zip(data['idle'],data['hit']))>.1,data
 assert data['serve'][1]>data['idle'][1]+.4,data
 # Racket remains attached to the animated hand in every pose and on both models.
 assert page.evaluate('[__tennis.youModel,__tennis.aiModel].every(a=>a.racket.parent===a.current.bones.RightHand)')
 page.locator('#returnClub').click();page.get_by_role('button',name='Settings',exact=True).click();page.locator('[data-tab="court"]').click();page.locator('[data-setting="character"]').select_option('male');page.reload();page.wait_for_function('__tennis.characterStatus.state==="ready"',timeout=120000);assert page.evaluate('__tennis.lobby.profile.settings.character')=='male';assert page.evaluate('__tennis.youModel.sex')=='male'
 # Network failure blocks court entry, while keeping the club usable and offering retry.
 bad=browser.new_page(viewport={'width':390,'height':844});bad.route('http://baseline.test/**',asset);bad.route('**/female.glb',lambda r:r.fulfill(status=503,body='temporary failure'));bad.goto('http://baseline.test/');bad.wait_for_function('window.__tennis?.characterStatus.state==="error"',timeout=120000)
 bad.get_by_role('button',name='PLAY INTER-HALL MATCH').click();bad.get_by_role('button',name='OPEN ASSET GALLERY').click();assert bad.locator('#enterCourt').is_disabled();assert bad.locator('#retryCharacters').is_visible();bad.unroute('**/female.glb');bad.locator('#retryCharacters').click();bad.wait_for_function('__tennis.characterStatus.state==="ready"',timeout=120000);assert bad.locator('#enterCourt').is_enabled();bad.locator('#enterCourt').click();bad.evaluate('__tennis.arrival.skip()');bad.wait_for_timeout(400);assert bad.locator('#joystick').is_visible() is False # desktop pointer defaults to keyboard
 assert not errors,errors
 print('PASS: both user GLBs, 65-bone skinned meshes, portraits, saved male/female selection, animated run/shot/serve, hand-bound rackets, rendered court, recoverable loading failure. No browser errors.')
 browser.close()
