"""Real female/male skeletons lean and extend their rackets toward low/wide balls."""
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
 page.route('http://baseline.test/**',asset);page.goto('http://baseline.test/');page.wait_for_function('window.tennisLoading&&!tennisLoading.active',timeout=120000)
 page.get_by_role('button',name='PLAY INTER-HALL MATCH').click();page.locator('#enterCourt').click();page.evaluate('__tennis.arrival.skip()');page.wait_for_function('!document.body.classList.contains("arriving")');page.evaluate('window.requestAnimationFrame=()=>0');page.wait_for_timeout(150)
 result=page.evaluate('''() => {const result=[];for(const a of [__tennis.youModel,__tennis.aiModel])for(const x of [-1.5,1.5]){const p={x:0,z:0,step:0,motion:0,swing:0,side:1},opponent={x:0,z:8},target=a.root.position.clone().set(x,.55,.3),rim=a.racket.getObjectByName('racket-frame'),b=a.current.bones,point=n=>b[n].getWorldPosition(a.root.position.clone()),length=()=>point('RightArm').distanceTo(point('RightForeArm'))+point('RightForeArm').distanceTo(point('RightHand'));a.pose(p,opponent);const before=rim.getWorldPosition(a.root.position.clone()).distanceTo(target),limb=length(),head=point('Head').y;a.pose(p,opponent,{reach:{target,weight:1}});result.push({sex:a.sex,x,before,after:rim.getWorldPosition(a.root.position.clone()).distanceTo(target),limb,afterLimb:length(),head,afterHead:point('Head').y,attached:a.racket.parent===b.RightHand})}return result}''')
 for row in result:
  assert row['after']<row['before']-.15,row
  assert abs(row['afterLimb']-row['limb'])<.02,row
  assert row['afterHead']<row['head']-.05,row
  assert row['attached'],row
 # Render a stretched forehand and a low backhand on the actual court for visual inspection.
 page.evaluate('''() => {const m=__tennis.match;m.you.x=0;m.you.z=9;m.ai.x=0;m.ai.z=-9;__tennis.youModel.pose({...m.you,motion:.3,swing:.7},m.ai,{reach:{target:{x:1.6,y:.6,z:8.8},weight:1}});__tennis.aiModel.pose({...m.ai,motion:.3,swing:.7},m.you,{reach:{target:{x:-1.5,y:.5,z:-8.8},weight:1}});__tennis.renderer.render(__tennis.scene,__tennis.camera)}''');page.screenshot(path='/workspace/tennis-reaching-shots.png')
 assert not errors,errors
 print('PASS: both real skinned characters lean/crouch and move the racket closer to wide/low targets on either side; arm lengths preserved and rackets stay attached. No browser errors.')
 browser.close()
