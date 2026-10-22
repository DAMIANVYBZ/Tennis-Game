"""Compress opaque canvas colour textures in exported campus GLBs. Alpha maps remain lossless."""
import io,json,struct,sys
from pathlib import Path
from PIL import Image
for name in sys.argv[1:]:
 p=Path(name);data=p.read_bytes();size=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+size]);binary=data[28+size:];changes={}
 for image in doc.get('images',[]):
  view=doc['bufferViews'][image['bufferView']];start=view.get('byteOffset',0);original=binary[start:start+view['byteLength']]
  if len(original)<20000:continue
  im=Image.open(io.BytesIO(original))
  if 'A' in im.getbands() and im.getchannel('A').getextrema()[0]<255:continue
  buf=io.BytesIO();im.convert('RGB').save(buf,format='JPEG',quality=87,optimize=True)
  if len(buf.getvalue())<len(original):changes[image['bufferView']]=buf.getvalue();image['mimeType']='image/jpeg'
 output=bytearray()
 for i,view in enumerate(doc['bufferViews']):
  at=view.get('byteOffset',0);block=changes.get(i,binary[at:at+view['byteLength']]);output.extend(b'\0'*(-len(output)%4));view['byteOffset']=len(output);view['byteLength']=len(block);output.extend(block)
 output.extend(b'\0'*(-len(output)%4));doc['buffers'][0]['byteLength']=len(output);js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*(-len(js)%4);p.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(output))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(output),0x004e4942)+output);print(p,len(data),'->',p.stat().st_size)
