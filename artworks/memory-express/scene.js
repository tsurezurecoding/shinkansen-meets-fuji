/* Memory Express — local, deterministic WebGL film. No telemetry or remote assets. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const film = $('experience');
  const state = { time: 0, playing: false, ready: false, loadedPhotos: 0, sound: false, frames: 0, error: null };
  const clamp = (v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease = t => {t=clamp(t);return t*t*(3-2*t);};
  const mix = (a,b,t)=>a+(b-a)*t;
  let seed=231013; const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const memories = [
    {time:20,d:485,title:'眠る、新幹線たち。',sub:'米原・高速試験車両保存場 / 06:32',place:'MAIBARA',file:'20261013_maibara_test_trains_michikusa.jpg'},
    {time:40,d:885,title:'田んぼに、岩と727。',sub:'豊橋・立岩 / 07:10',place:'TOYOHASHI',file:'20261013_toyohashi_tateiwa_727_michikusa.jpg'},
    {time:60,d:1285,title:'朝の光に、天守。',sub:'掛川城 / 07:22',place:'KAKEGAWA',file:'20261013_kakegawa_castle_morning_michikusa.jpg'}
  ];
  let renderer,scene,camera,trainCars=[],portals=[],lights=[],sky,world,opposite=[],raf,last=0,needsRender=true;
  let audioCtx,master,soundBus,lowpass,oscillators=[],lastChime=-1;
  const pointer={x:0,y:0};
  function fail(message){state.error=message;state.playing=false;state.ready=false;if(audioCtx&&soundBus)soundBus.gain.setTargetAtTime(0,audioCtx.currentTime,.05);$('fallback').hidden=false;$('startText').textContent='3Dを表示できません';$('loadState').textContent=message;$('start').disabled=true;$('play').disabled=true;$('progress').disabled=true;}
  function trackX(d){return Math.sin(d/210)*23+Math.sin(d/670)*30;}
  function trackY(d){return 14+Math.sin(d/420)*1.4;}
  function point(d,side=0,height=0){return new THREE.Vector3(trackX(d)+side,trackY(d)+height,-d);}
  function direction(d){return point(d+1).sub(point(d-1)).normalize();}
  function material(color,opts={}){return new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.07,...opts});}
  const geometries={};
  function box(w,h,d,mat,x,y,z){const mesh=new THREE.Mesh(geometries.box||(geometries.box=new THREE.BoxGeometry(1,1,1)),mat);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}
  function makeBatch(geometry,mat,entries){const mesh=new THREE.InstancedMesh(geometry,mat,entries.length),dummy=new THREE.Object3D();entries.forEach((a,i)=>{dummy.position.set(a.x,a.y,a.z);dummy.rotation.set(0,a.r||0,0);dummy.scale.set(a.w,a.h,a.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(a.color)mesh.setColorAt(i,new THREE.Color(a.color));});mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;world.add(mesh);return mesh;}
  function facade(){const c=document.createElement('canvas');c.width=128;c.height=256;const g=c.getContext('2d');g.fillStyle='#9aafb6';g.fillRect(0,0,128,256);for(let y=5;y<256;y+=16)for(let x=5;x<128;x+=16){g.fillStyle=random()>.72?'#e6cb95':random()>.4?'#456375':'#6d8593';g.fillRect(x,y,8,10);g.fillStyle='#e4e5da';g.fillRect(x,y+10,9,1);}const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;}
  function model(category){const group=new THREE.Group();for(const data of MEMORY_MODELS[category]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));if(data.normals)geo.setAttribute('normal',new THREE.Float32BufferAttribute(data.normals,3));if(data.indices?.length)geo.setIndex(data.indices);if(!data.normals)geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material(data.color,{metalness:data.metalness??.2,roughness:data.roughness??.4}));mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}return group;}
  function buildSky(){const uniforms={top:{value:new THREE.Color('#476a8c')},bottom:{value:new THREE.Color('#f4d1ac')}};
    sky=new THREE.Mesh(new THREE.SphereGeometry(4000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms,vertexShader:'varying vec3 vWorld; void main(){vWorld=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vWorld; uniform vec3 top; uniform vec3 bottom; void main(){float h=normalize(vWorld).y; gl_FragColor=vec4(mix(bottom,top,smoothstep(-0.08,0.65,h)),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));scene.add(sky);
    const sunCanvas=document.createElement('canvas');sunCanvas.width=sunCanvas.height=128;const ctx=sunCanvas.getContext('2d'),grad=ctx.createRadialGradient(64,64,5,64,64,64);grad.addColorStop(0,'rgba(255,244,205,1)');grad.addColorStop(.22,'rgba(255,229,174,.9)');grad.addColorStop(.4,'rgba(255,206,140,.22)');grad.addColorStop(1,'rgba(255,193,122,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(sunCanvas),transparent:true,depthWrite:false,fog:false}));sun.position.set(-520,220,-2600);sun.scale.set(430,430,1);scene.add(sun);
  }
  function buildCity(){
    const ground=box(1800,3,3300,material('#596f6e'),0,-2,-1100);ground.receiveShadow=true;world.add(ground);
    const road=material('#3f5260'),edge=material('#87958f'),pale=material('#d2c6a7');
    const roadEntries=[],marks=[];
    for(let x=-550;x<=550;x+=74){roadEntries.push({x,y:.03,z:-1000,w:13,h:.12,d:3100});for(let z=350;z>-2500;z-=22)marks.push({x,y:.11,z,w:.25,h:.04,d:5});}
    for(let z=340;z>-2450;z-=88){roadEntries.push({x:0,y:.05,z,w:1300,h:.1,d:12});}
    makeBatch(geometries.box,road,roadEntries);makeBatch(geometries.box,pale,marks);
    const fac=facade(),buildingMat=material('#d9ddd8',{map:fac,roughness:.62}),buildings=[],roofs=[],trees=[],trunks=[];
    const palette=['#c8c1af','#a5b1b0','#aebbb9','#d6cab6','#889faa','#d6d7c8','#8e9ba6'];
    for(let z=310;z>-2330;z-=44){for(let x=-510;x<540;x+=37){const d=-z,tx=trackX(d);if(Math.abs(x-tx)<29)continue;if(random()<.14)continue;const near=Math.abs(x-tx)<95;let h=8+Math.pow(random(),2)*(near?37:95);const w=12+random()*13,depth=14+random()*16;const bx=x+(random()-.5)*8,bz=z+(random()-.5)*9;const country=d>650&&d<1100;if(country&&random()<.65)continue;if(country)h*=.55;buildings.push({x:bx,y:h/2,z:bz,w,h,d:depth,color:palette[Math.floor(random()*palette.length)]});roofs.push({x:bx,y:h+.5,z:bz,w:w+1,h:1,d:depth+1});if(h>27&&random()>.35)roofs.push({x:bx+2,y:h+2.2,z:bz,w:4,h:3,d:5});}}
    makeBatch(geometries.box,buildingMat,buildings);makeBatch(geometries.box,material('#98a9aa'),roofs);
    for(let i=0;i<540;i++){const d=random()*2300-250,x=trackX(d)+(random()<.5?-1:1)*(25+random()*310);if(i%3&&d<600)continue;const h=3+random()*4;trees.push({x,y:h+1,z:-d,w:3+random()*2,h:h*.8,d:3+random()*2,color:i%3?'#627c68':'#899b73'});trunks.push({x,y:h*.5,z:-d,w:.4,h,d:.4});}
    makeBatch(new THREE.IcosahedronGeometry(1,1),material('#7b9274'),trees);makeBatch(geometries.box,material('#635e50'),trunks);
    // Rice fields and irrigation bands form a quieter middle act.
    const fields=[];for(let d=650;d<1100;d+=52)for(let s of [-1,1])for(let j=0;j<4;j++)fields.push({x:trackX(d)+s*(60+j*53),y:.15,z:-d,w:48,h:.15,d:45,color:['#8e9a69','#a6a477','#b5ac7d','#6f8d7c'][(j+Math.floor(d/52))%4]});makeBatch(geometries.box,material('#a6a477'),fields);
    // Long overlapping ridges keep the horizon soft instead of isolated cones.
    for(let side of [-1,1])for(let layer=0;layer<3;layer++){const p=[],ix=[];for(let j=0;j<=65;j++){let z=600-j*60,x=side*(660+layer*150),h=55+layer*42+38*Math.sin(j*.28+layer)+25*Math.sin(j*.61+layer*2);p.push(x,-5,z,x,h,z,x+side*230,-5,z);}for(let j=0;j<65;j++){const a=j*3,b=a+3;ix.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();const ridge=new THREE.Mesh(g,material(['#7b969b','#8ca5a8','#a3b5b6'][layer],{side:THREE.DoubleSide}));world.add(ridge);}
    // Street lamps and tiny moving headlights make the city read at human scale.
    const poles=[],bulbs=[];for(let d=-100;d<1900;d+=40){const x=trackX(d)+29;poles.push({x,y:4,z:-d,w:.18,h:8,d:.18});bulbs.push({x:x-1,y:8,z:-d,w:2.5,h:.2,d:.6});}makeBatch(geometries.box,material('#637685'),poles);makeBatch(geometries.box,material('#ffdc9b',{emissive:'#ffc878',emissiveIntensity:1.8}),bulbs);
    state.buildings=buildings.length;
  }
  function ribbon(offset,width,yOffset,thickness,mat){const positions=[],indices=[];for(let d=-500;d<=2100;d+=10){for(const [side,y]of[[-1,0],[1,0],[-1,-thickness],[1,-thickness]])positions.push(trackX(d)+offset+side*width/2,trackY(d)+yOffset+y,-d);}const n=positions.length/12;for(let i=0;i<n-1;i++){let a=i*4,b=a+4;indices.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;world.add(m);}
  function buildRail(){const concrete=material('#aeb9b6'),rail=material('#ced9d9',{metalness:.75,roughness:.28}),bed=material('#56697a');ribbon(3.7,15,-.9,2.2,concrete);for(const side of[0,7.4]){ribbon(side,3.8,-.55,.4,bed);for(const x of[-.8,.8])ribbon(side+x,.12,-.08,.17,rail);}for(const x of[-4,11.4])ribbon(x,.22,-.12,.82,concrete);
    const pillars=[],ties=[],catenary=[];
    for(let d=-450;d<2070;d+=30){const x=trackX(d),y=trackY(d);pillars.push({x:x+3.7,y:(y-3)/2,z:-d,w:2.3,h:y-3,d:2.5});pillars.push({x:x+3.7,y:y-3,z:-d,w:12,h:1.4,d:2.8});}
    for(let d=-450;d<2070;d+=2.3){for(const x of[0,7.4])ties.push({x:trackX(d)+x,y:trackY(d)-.35,z:-d,w:2.7,h:.16,d:.36});}
    for(let d=-420;d<2070;d+=48){const x=trackX(d),y=trackY(d);for(const side of[-4.5,12])catenary.push({x:x+side,y:y+4.4,z:-d,w:.18,h:9,d:.18});catenary.push({x:x+3.7,y:y+8.8,z:-d,w:16.8,h:.18,d:.18});}
    makeBatch(geometries.box,concrete,pillars);makeBatch(geometries.box,material('#b3b0a0'),ties);makeBatch(geometries.box,material('#657a85'),catenary);for(const x of[0,7.4])ribbon(x,.035,7.2,.035,material('#546d7f'));
  }
  function buildTrains(){
    const lead=model('lead'),mid=model('mid');for(let i=0;i<7;i++){const car=i===0?lead:i===6?lead.clone():mid.clone();world.add(car);trainCars.push(car);}
    for(let i=0;i<5;i++){const car=i===0?lead.clone():mid.clone();world.add(car);opposite.push(car);}
  }
  function buildPortals(textures){
    memories.forEach((m,i)=>{const group=new THREE.Group(),frame=model('portal');frame.scale.setScalar(2.1);group.add(frame);
      const plane=new THREE.Mesh(new THREE.PlaneGeometry(32.3*2.1,19.3*2.1),new THREE.MeshBasicMaterial({map:textures[i],side:THREE.DoubleSide,toneMapped:false}));plane.position.set(0,10.5*2.1,-.1);group.add(plane);group.position.copy(point(m.d,0,-11));group.rotation.y=-Math.atan((trackX(m.d+1)-trackX(m.d-1))/2);
      // Five fine outlines create a visible tunnel in front of the photograph.
      for(let j=1;j<=5;j++){const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(69+j*.4,44+j*.3,.05)),new THREE.LineBasicMaterial({color:'#f8cf87',transparent:true,opacity:.25-j*.028}));outline.position.set(0,22,j*4);group.add(outline);}
      // Warm illuminated inner edge makes the physical portal visible from afar.
      const glowCanvas=document.createElement('canvas');glowCanvas.width=512;glowCanvas.height=320;const gx=glowCanvas.getContext('2d');gx.shadowColor='#ffdc8c';gx.shadowBlur=18;gx.strokeStyle='#ffe9ba';gx.lineWidth=3;gx.beginPath();gx.roundRect(12,12,488,296,22);gx.stroke();const glow=new THREE.Mesh(new THREE.PlaneGeometry(74,46),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,side:THREE.DoubleSide}));glow.position.set(0,22,.8);group.add(glow);
      world.add(group);portals.push(group);
      const poleMat=material('#b29b79',{metalness:.7,roughness:.3});world.add(box(2,13,2,poleMat,trackX(m.d)-35,6.5,-m.d));world.add(box(2,13,2,poleMat,trackX(m.d)+35,6.5,-m.d));
    });
  }
  function init(){
    if(!window.THREE||!window.MEMORY_MODELS)throw new Error('3D素材を読み込めませんでした。');
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('viewport').appendChild(renderer.domElement);
    scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#c6d0cc',.0023);world=new THREE.Group();scene.add(world);camera=new THREE.PerspectiveCamera(52,1,.25,5200);
    const hemi=new THREE.HemisphereLight('#dbecff','#77745b',2.5);scene.add(hemi);lights.push(hemi);const sun=new THREE.DirectionalLight('#ffe2ad',3.6);sun.position.set(-130,230,-100);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-130,right:130,top:130,bottom:-130,near:1,far:650});sun.shadow.bias=-.0004;sun.shadow.normalBias=.15;scene.add(sun,sun.target);lights.push(sun);
    geometries.box=new THREE.BoxGeometry(1,1,1);buildSky();buildCity();buildRail();buildTrains();
    const loader=new THREE.TextureLoader();Promise.all(MEMORY_PHOTOS.map(url=>new Promise((resolve,reject)=>loader.load(url,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();state.loadedPhotos++;resolve(t);},undefined,reject)))).then(textures=>{buildPortals(textures);state.ready=true;$('start').disabled=false;$('play').disabled=false;$('progress').disabled=false;$('startText').textContent='記憶の旅へ';$('loadState').textContent='70秒の旅。音は右下から。';renderAt(0);}).catch(()=>fail('写真を読み込めませんでした。ページを開き直してください。'));
    new ResizeObserver(resize).observe(film);resize();renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail('3Dの描画が中断されました。ページを開き直してください。');});
  }
  function resize(){if(!renderer)return;const w=film.clientWidth,h=film.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w<700?66:52;camera.updateProjectionMatrix();needsRender=true;}
  function placeCar(car,d,backwards=false,side=0){car.position.copy(point(d,side,.06));const tangent=direction(d);car.rotation.y=Math.atan2(-tangent.z,tangent.x)+(backwards?Math.PI:0);}
  function cameraPose(t){const d=120+t*20,mobile=camera.aspect<.9;let pos,target;
    if(t<9){const s=ease(t/9);pos=point(d+mix(65,25,s),mix(mobile?112:78,53,s),mix(47,25,s));target=point(d-20,0,2);}
    else if(t<14){const s=ease((t-9)/5);pos=point(d+mix(25,-35,s),mix(53,0,s),mix(25,8,s));target=point(d+mix(-20,80,s),0,mix(2,8,s));}
    else if(t<64){pos=point(d-35,0,8);target=point(d+80,0,8);}
    else {const s=ease((t-64)/6);pos=point(d-35-130*s,mix(0,75,s),mix(8,110,s));target=point(d+mix(80,40,s),0,mix(8,2,s));}
    // A brief orbit between portals; smoothly returns to track centre before entry.
    if((t>24&&t<34)||(t>44&&t<54)){const u=((t-24)%20)/10,w=Math.sin(ease(u)*Math.PI);pos=point(d-35,w*(mobile?40:62),8+w*32);target=point(d+mix(80,15,w),0,mix(8,2,w));}
    pos.x+=pointer.x*1.3;pos.y+=pointer.y*.7;return {d,pos,target};
  }
  let currentCopy='';
  function renderAt(t){if(!renderer)return;const pose=cameraPose(t);trainCars.forEach((car,i)=>placeCar(car,pose.d-i*25.8,i===6));opposite.forEach((car,i)=>placeCar(car,1240-t*24+i*25.8,true,7.4));camera.position.copy(pose.pos);camera.lookAt(pose.target);sky.position.copy(camera.position);
    lights[1].position.set(trackX(pose.d)-110,230,-pose.d-95);lights[1].target.position.copy(point(pose.d));lights[1].target.updateMatrixWorld();
    let photoOpacity=0,active=-1;memories.forEach((m,i)=>{const dt=t-m.time;const fade=ease((dt+.85)/.85)*(1-ease((dt-2.0)/1.3));if(fade>photoOpacity){photoOpacity=fade;active=i;}});
    $('photoFlash').style.opacity=photoOpacity.toFixed(3);if(active>=0){if($('memoryPhoto').dataset.index!==String(active)){$('memoryPhoto').src=MEMORY_PHOTOS[active];$('memoryPhoto').dataset.index=active;}$('memoryPhoto').style.objectPosition=camera.aspect<.9?["50% center","38% center","58% center"][active]:'center';$('memoryPhoto').style.transform=`scale(${1+clamp((t-memories[active].time+.9)/4)*.045})`;}
    const scenePhase=clamp(t/70);scene.fog.color.set('#c6d0cc').lerp(new THREE.Color('#e4d6b7'),scenePhase*.65);sky.material.uniforms.top.value.set('#476a8c').lerp(new THREE.Color('#86a6bb'),scenePhase);sky.material.uniforms.bottom.value.set('#f4d1ac').lerp(new THREE.Color('#f6e2bb'),scenePhase);
    renderer.render(scene,camera);state.frames++;state.drawCalls=renderer.info.render.calls;state.triangles=renderer.info.render.triangles;
    const m=memories.find(m=>t>=m.time-5&&t<m.time+6);const copyKey=m?m.place:t>=64?'end':t>24?'between':'intro';
    if(copyKey!==currentCopy){currentCopy=copyKey;$('chapterNumber').textContent=m?`${String(memories.indexOf(m)+1).padStart(2,'0')} / ${m.place}`:t>=64?'EPILOGUE / 旅のつづき':t>24?'INTERLUDE / 次の窓へ':'PROLOGUE / 出発';$('chapterTitle').textContent=m?m.title:t>=64?'窓の先に、また旅。':t>24?'記憶の、その先へ。':'街が、目を覚ます。';$('chapterDetail').textContent=m?m.sub:'2026.10.13 — ある朝の記憶';}
    $('cameraLabel').textContent=photoOpacity>.5?'MEMORY':t>14&&t<64?'FOLLOW':'DRONE';$('time').textContent=`${format(t)} / 01:10`;$('progress').value=t;$('progress').setAttribute('aria-valuetext',`${Math.floor(t)}秒 / 70秒`);$('endCard').hidden=t<69.95;
    if(state.sound&&state.playing)updateAudio(t,photoOpacity);
  }
  function format(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');}
  function frame(now){const delta=last?Math.min((now-last)/1000,.08):0;last=now;if(state.playing){state.time=Math.min(70,state.time+delta);needsRender=true;if(state.time>=70)setPlaying(false);}if(needsRender){renderAt(state.time);needsRender=false;}raf=requestAnimationFrame(frame);}
  function setPlaying(value){if(!state.ready)return;state.playing=value;film.classList.toggle('started',state.time>0||value);$('play').textContent=value?'Ⅱ':'▶';$('play').setAttribute('aria-label',value?'一時停止':'再生');last=0;if(soundBus&&audioCtx)soundBus.gain.setTargetAtTime(value&&state.sound?.12:0,audioCtx.currentTime,.25);needsRender=true;}
  function seek(t,play=false){if(state.error)return;state.time=clamp(t,0,70);film.classList.toggle('started',state.time>0||play);lastChime=-1;setPlaying(play);needsRender=true;}
  function setupAudio(){if(audioCtx)return;const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw new Error('音声に対応していません');audioCtx=new Ctx();master=audioCtx.createDynamicsCompressor();master.threshold.value=-20;master.ratio.value=8;master.connect(audioCtx.destination);soundBus=audioCtx.createGain();soundBus.gain.value=0;soundBus.connect(master);
    const reverb=audioCtx.createConvolver(),buffer=audioCtx.createBuffer(2,audioCtx.sampleRate*2.8,audioCtx.sampleRate);for(let c=0;c<2;c++){const a=buffer.getChannelData(c);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,3)*.22;}reverb.buffer=buffer;const wet=audioCtx.createGain();wet.gain.value=.32;reverb.connect(wet);wet.connect(soundBus);soundBus.reverb=reverb;
    [65.406,98,130.813,164.814,196].forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=i<2?'sine':'triangle';o.frequency.value=f;g.gain.value=i<2?.17:.04;o.connect(g);g.connect(soundBus);g.connect(reverb);o.start();oscillators.push(o);});
    const noise=audioCtx.createBuffer(1,audioCtx.sampleRate*3,audioCtx.sampleRate),a=noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const source=audioCtx.createBufferSource();source.buffer=noise;source.loop=true;lowpass=audioCtx.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=500;const gain=audioCtx.createGain();gain.gain.value=.16;source.connect(lowpass);lowpass.connect(gain);gain.connect(soundBus);source.start();
  }
  function updateAudio(t,flash){lowpass.frequency.setTargetAtTime(260+Math.sin(t*.17)*100+flash*750,audioCtx.currentTime,.1);const beat=memories.findIndex(m=>t>=m.time&&t<m.time+.15);if(beat>=0&&lastChime!==beat){lastChime=beat;[523.25,659.25,783.99].forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime+i*.09;o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.1,now+.025);g.gain.exponentialRampToValueAtTime(.001,now+2.6);o.connect(g);g.connect(soundBus);g.connect(soundBus.reverb);o.start(now);o.stop(now+2.8);});}}
  $('start').onclick=()=>{seek(state.time>=70?0:state.time,true);};$('play').onclick=()=>{if(state.time>=70)seek(0,true);else setPlaying(!state.playing);};$('replay').onclick=()=>seek(0,true);
  $('progress').addEventListener('input',event=>{const wasPlaying=state.playing;seek(Number(event.target.value),wasPlaying);});
  document.querySelectorAll('[data-seek]').forEach(el=>{el.onclick=()=>{seek(Number(el.dataset.seek),true);film.scrollIntoView({behavior:'smooth',block:'start'});};});
  $('sound').onclick=async()=>{try{setupAudio();await audioCtx.resume();state.sound=!state.sound;$('sound').setAttribute('aria-pressed',String(state.sound));$('sound').textContent=state.sound?'音 ON':'音 OFF';soundBus.gain.setTargetAtTime(state.sound&&state.playing?.12:0,audioCtx.currentTime,.3);}catch(error){$('sound').textContent='音声非対応';state.sound=false;$('sound').setAttribute('aria-pressed','false');}};
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(film.requestFullscreen)await film.requestFullscreen();else $('fullscreen').textContent='全画面非対応';}catch{$('fullscreen').textContent='全画面非対応';}};
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'全画面を終了 ↙':'全画面 ↗';$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'全画面を終了する':'作品を全画面にする');resize();});
  film.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const b=film.getBoundingClientRect();pointer.x=(event.clientX-b.left)/b.width-.5;pointer.y=.5-(event.clientY-b.top)/b.height;needsRender=true;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){setPlaying(false);if(audioCtx)audioCtx.suspend();}else if(audioCtx&&state.sound)audioCtx.resume().catch(()=>{});});
  window.MemoryExpress={state,seek,pause:()=>setPlaying(false),play:()=>setPlaying(true),render:()=>renderAt(state.time),cameraPose};
  try{init();raf=requestAnimationFrame(frame);}catch(error){fail(error.message);console.error(error);}
})();
