"""Compress opaque body color maps, preserving alpha hair and all geometry/skin data."""
import io,json,struct,sys
from pathlib import Path
from PIL import Image
for name in sys.argv[1:]:
 p=Path(name);data=p.read_bytes();json_size=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+json_size]);binary_start=20+json_size+8;binary=data[binary_start:];replacements={}
 for image in doc.get('images',[]):
  if '1001_Diffuse' not in image.get('name',''):continue
  view=image['bufferView'];v=doc['bufferViews'][view];im=Image.open(io.BytesIO(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]));out=io.BytesIO();im.convert('RGB').save(out,format='JPEG',quality=86,optimize=True);replacements[view]=out.getvalue();image['mimeType']='image/jpeg'
 out=bytearray()
 for index,view in enumerate(doc['bufferViews']):
  offset=view.get('byteOffset',0);block=replacements.get(index,binary[offset:offset+view['byteLength']]);out.extend(b'\0'*(-len(out)%4));view['byteOffset']=len(out);view['byteLength']=len(block);out.extend(block)
 out.extend(b'\0'*(-len(out)%4));doc['buffers'][0]['byteLength']=len(out);js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*(-len(js)%4);p.write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(out))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(out),0x004e4942)+out);print(p,len(data),'->',p.stat().st_size)
