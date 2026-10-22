"""Blender 4.3: --background --python tools/convert-character.py -- input.fbx output.glb female|male.
Preserves the user's mesh, skin and materials; reduces texture sizes for browser delivery.
"""
import bpy,sys,json
from pathlib import Path
source,target,sex=sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=source,use_anim=False)
# Keep materials on clothing and shoes separate from skin for cosmetic kit tinting.
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 role='outfit' if any(s in o.name.lower() for s in ['shirt','shorts','cloth']) else 'shoes' if 'sneaker'in o.name.lower() else 'body'
 o['equipmentRole']=role
 if role!='body':
  for slot in o.material_slots:
   if slot.material:slot.material=slot.material.copy();slot.material.name+='_'+role
for im in bpy.data.images:
 if not im.size[0]:continue
 max_size=2048 if 'Diffuse'in im.filepath and '1001'in im.filepath else 1024
 scale=min(1,max_size/max(im.size))
 if scale<1:im.scale(round(im.size[0]*scale),round(im.size[1]*scale))
# Mixamo FBX stores spec/gloss textures; glTF uses metallic/roughness.
for material in bpy.data.materials:
 if not material.use_nodes:continue
 for node in material.node_tree.nodes:
  if node.type=='BSDF_PRINCIPLED':
   node.inputs['Metallic'].default_value=0
   node.inputs['Roughness'].default_value=.78
   for key in ['Metallic','Roughness','Specular IOR Level']:
    for link in list(node.inputs[key].links):material.node_tree.links.remove(link)
for o in bpy.context.scene.objects:
 if o.type=='ARMATURE':o['characterSex']=sex
Path(target).parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=target,export_format='GLB',export_animations=False,export_extras=True,export_image_format='AUTO',export_jpeg_quality=85,export_yup=True,export_skins=True,export_all_influences=False)
print('EXPORTED',sex,Path(target).stat().st_size)
