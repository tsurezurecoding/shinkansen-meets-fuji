(function () {
  'use strict';
  // Estimated sightlines share one Viewer and at most two district tilesets.
  // Targets remain points: this module does not invent bridge or tower geometry.
  var base = 'https://cesium.com/downloads/cesiumjs/releases/1.117/Build/Cesium/';
  var libraryPromise;
  var districts = {'13103':'港区','13101':'千代田区'};
  function library() {
    if (window.Cesium) return Promise.resolve(window.Cesium);
    if (!libraryPromise) libraryPromise = new Promise(function (resolve,reject) {
      var script=document.createElement('script'); script.src=base+'Cesium.js'; script.async=true;
      var timer=setTimeout(function () { script.remove(); reject(new Error('Cesium timeout')); },20000);
      script.onload=function () { clearTimeout(timer); window.Cesium?resolve(window.Cesium):reject(new Error('Cesium unavailable')); };
      script.onerror=function () { clearTimeout(timer); script.remove(); reject(new Error('Cesium network')); };
      document.head.append(script);
    }).catch(function (error) { libraryPromise=null; throw error; });
    return libraryPromise;
  }
  function validScene(value) {
    return value && Object.prototype.hasOwnProperty.call(districts,value.district) &&
      ['train','target'].every(function (key) { return Array.isArray(value[key]) && value[key].length===3 && value[key].every(Number.isFinite) && Math.abs(value[key][0])<=180 && Math.abs(value[key][1])<=90; }) &&
      Number.isFinite(value.heading) && Number.isFinite(value.range) && value.range>0 &&
      Number.isFinite(Number(value.distanceKm)) && typeof value.label==='string';
  }
  window.createTokyoStage = async function (container,options) {
    options=options||{};
    if (!validScene(options.scene)) throw new TypeError('Invalid Tokyo sightline scene');
    var C=await library();
    function ownerCurrent() { return !options.isCurrent || options.isCurrent(); }
    if (!ownerCurrent() || !container.isConnected) return null;
    if (!document.querySelector('[data-tokyo-cesium-css],[data-fujimi-cesium-css]')) {
      var css=document.createElement('link'); css.rel='stylesheet'; css.href=base+'Widgets/widgets.css'; css.dataset.tokyoCesiumCss=''; document.head.append(css);
    }
    var host=document.createElement('div'); host.style.cssText='position:absolute;inset:0;overflow:hidden'; container.append(host);
    var viewer,destroyed=false,active=true,timer,resize,removeError,scene,middle,selected,revision=0;
    var cache=new Map();
    function current() { return !destroyed && ownerCurrent(); }
    function status(text) { if (current() && options.onStatus) options.onStatus(text); }
    function destroy() {
      if (destroyed) return;
      destroyed=true; revision++; clearTimeout(timer); resize?.disconnect(); removeError?.();
      if (viewer && !viewer.isDestroyed()) viewer.destroy(); cache.clear(); host.remove();
    }
    function fail() { if (!current()) return; destroy(); if (options.onError) options.onError(); }
    function sceneStatus() {
      if (!current() || !selected) return;
      if (selected.partial) status('一部の建物を読み込めませんでした。表示済みの3Dは操作できます。');
      else if (!selected.visible || selected.pending+selected.processing>0) status(districts[scene.district]+'の建物を読み込んでいます…');
      else status('推定撮影位置から'+scene.label+'へ約'+scene.distanceKm+'km。位置と高さは模式的です。');
    }
    function armTimeout() {
      clearTimeout(timer);
      if (!active || !selected || selected.visible) return;
      var expected=revision;
      timer=setTimeout(function () { if (current() && active && revision===expected && !selected.visible) fail(); },35000);
    }
    try {
      viewer=new C.Viewer(host,{animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,baseLayer:false,requestRenderMode:true,maximumRenderTimeChange:Infinity,contextOptions:{webgl:{antialias:true}}});
      viewer.clock.currentTime=C.JulianDate.fromIso8601('2026-09-24T03:00:00Z'); viewer.clock.shouldAnimate=false;
      viewer.resolutionScale=Math.min(1,1.5/(window.devicePixelRatio||1));
      viewer.creditDisplay.addStaticCredit(new C.Credit('<a href="https://www.mlit.go.jp/plateau/" target="_blank" rel="noopener noreferrer">国土交通省 PLATEAU</a>',true));
      var cameraControls=viewer.scene.screenSpaceCameraController;
      cameraControls.minimumZoomDistance=80; cameraControls.maximumZoomDistance=8000;
      cameraControls.tiltEventTypes=[C.CameraEventType.RIGHT_DRAG,C.CameraEventType.PINCH];
      cameraControls.zoomEventTypes=[C.CameraEventType.PINCH,{eventType:C.CameraEventType.WHEEL,modifier:C.KeyboardEventModifier.CTRL}];
      host.addEventListener('wheel',function (event) { if (!event.ctrlKey) event.stopPropagation(); },{capture:true,passive:true});
      viewer.scene.skyBox.show=false; viewer.scene.skyAtmosphere.show=false; viewer.scene.sun.show=false; viewer.scene.moon.show=false; viewer.scene.fog.enabled=false;
      viewer.scene.backgroundColor=C.Color.fromCssColorString('#10212d'); viewer.scene.globe.baseColor=C.Color.fromCssColorString('#26383d');
      function marker(color,align) {
        return viewer.entities.add({position:C.Cartesian3.ZERO,point:{pixelSize:10,color:C.Color.fromCssColorString(color),outlineColor:C.Color.fromCssColorString('#10212d'),outlineWidth:3,disableDepthTestDistance:Infinity},label:{text:'',font:'12px sans-serif',fillColor:C.Color.fromCssColorString('#fff5d9'),outlineColor:C.Color.fromCssColorString('#10212d'),outlineWidth:4,style:C.LabelStyle.FILL_AND_OUTLINE,horizontalOrigin:align??C.HorizontalOrigin.CENTER,pixelOffset:new C.Cartesian2(0,-24),disableDepthTestDistance:Infinity}});
      }
      var trainMarker=marker('#7fcaba',C.HorizontalOrigin.RIGHT),targetMarker=marker('#efb75f');
      var line=viewer.entities.add({polyline:{positions:[],arcType:C.ArcType.NONE,width:3,material:C.Color.fromCssColorString('#efac49')}});
      function resetView() {
        if (!current() || !middle) return;
        viewer.camera.lookAt(middle,new C.HeadingPitchRange(C.Math.toRadians(scene.heading),C.Math.toRadians(-50),Math.max(200,Math.min(scene.range,8000))));
        viewer.camera.lookAtTransform(C.Matrix4.IDENTITY); viewer.scene.requestRender();
      }
      function zoom(direction) {
        if (!current() || !middle) return;
        var range=C.Cartesian3.distance(viewer.camera.position,middle);
        if (direction>0) viewer.camera.zoomIn(Math.max(0,Math.min(range*.22,range-100)));
        else viewer.camera.zoomOut(Math.max(0,Math.min(range*.25,8000-range)));
        viewer.scene.requestRender();
      }
      function key(value) {
        if (!current()) return false;
        var moves={ArrowLeft:'moveLeft',ArrowRight:'moveRight',ArrowUp:'moveForward',ArrowDown:'moveBackward'};
        if (moves[value]) viewer.camera[moves[value]](40);
        else if (value==='+' || value==='=') zoom(1);
        else if (value==='-') zoom(-1);
        else if (value==='Home') resetView();
        else return false;
        viewer.scene.requestRender(); return true;
      }
      function setActive(value) {
        if (!current()) return;
        active=Boolean(value); viewer.useDefaultRenderLoop=active; armTimeout();
        if (active) { viewer.resize(); viewer.scene.requestRender(); }
      }
      function loadDistrict(id) {
        var record={id:id,tile:null,visible:false,partial:false,pending:0,processing:0}; cache.set(id,record);
        void C.Cesium3DTileset.fromUrl('https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/'+id+'-bldg-lod1-latest/tileset.json',{maximumScreenSpaceError:window.innerWidth<600?24:16,cacheBytes:24*1024*1024,maximumCacheOverflowBytes:8*1024*1024,dynamicScreenSpaceError:false,skipLevelOfDetail:false,preferLeaves:false,preloadWhenHidden:false,preloadFlightDestinations:false}).then(function (tile) {
          if (!current()) { tile.destroy(); destroy(); return; }
          record.tile=tile; tile.show=selected===record;
          viewer.scene.primitives.add(tile); tile.colorBlendMode=C.Cesium3DTileColorBlendMode.REPLACE;
          tile.style=new C.Cesium3DTileStyle({color:"color('#b4c7bf')"});
          // District events consult the current selection, never a captured scene.
          tile.tileVisible.addEventListener(function () {
            if (!current() || selected!==record) return;
            if (!record.visible) { record.visible=true; clearTimeout(timer); sceneStatus(); }
          });
          tile.loadProgress.addEventListener(function (pending,processing) {
            if (!current()) return;
            record.pending=pending; record.processing=processing;
            if (selected===record) sceneStatus();
          });
          tile.tileFailed.addEventListener(function () {
            if (!current()) return;
            record.partial=true;
            if (selected===record) sceneStatus();
          });
          if (selected===record) { sceneStatus(); viewer.scene.requestRender(); }
        }).catch(function () {
          if (!current()) return;
          if (cache.get(id)===record) cache.delete(id);
          if (selected===record) fail();
        });
        return record;
      }
      function setScene(value) {
        if (!current()) return false;
        if (!validScene(value)) throw new TypeError('Invalid Tokyo sightline scene');
        revision++; scene={...value,train:value.train.slice(),target:value.target.slice()};
        var train=C.Cartesian3.fromDegrees.apply(null,scene.train),target=C.Cartesian3.fromDegrees.apply(null,scene.target);
        middle=C.Cartesian3.lerp(train,target,.5,new C.Cartesian3());
        trainMarker.position=train; trainMarker.label.text='撮影位置（推定）';
        targetMarker.position=target; targetMarker.label.text=scene.markerLabel||scene.label;
        line.polyline.positions=[train,target];
        selected=cache.get(scene.district)||loadDistrict(scene.district);
        cache.forEach(function (record) { if (record.tile) record.tile.show=record===selected; });
        armTimeout(); resetView(); sceneStatus(); return true;
      }
      removeError=viewer.scene.renderError.addEventListener(fail);
      if (window.ResizeObserver) { resize=new ResizeObserver(function () { if (current() && active) { viewer.resize(); viewer.scene.requestRender(); } }); resize.observe(container); }
      setScene(options.scene);
      return {resetView:resetView,zoom:zoom,key:key,setActive:setActive,destroy:destroy,setScene:setScene};
    } catch (error) { destroy(); throw error; }
  };
}());
