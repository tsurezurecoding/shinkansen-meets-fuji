(function () {
  'use strict';
  // Adapted from window-unfold-0929/city-stage.js. Only the confirmed scene:
  // no building picking, district exploration, video tracking or roof model.
  var base = 'https://cesium.com/downloads/cesiumjs/releases/1.117/Build/Cesium/';
  var libraryPromise;
  function library() {
    if (window.Cesium) return Promise.resolve(window.Cesium);
    if (!libraryPromise) libraryPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script'); script.src = base + 'Cesium.js'; script.async = true;
      var timer = setTimeout(function () { script.remove(); reject(new Error('Cesium timeout')); }, 20000);
      script.onload = function () { clearTimeout(timer); window.Cesium ? resolve(window.Cesium) : reject(new Error('Cesium unavailable')); };
      script.onerror = function () { clearTimeout(timer); script.remove(); reject(new Error('Cesium network')); };
      document.head.append(script);
    }).catch(function (error) { libraryPromise = null; throw error; });
    return libraryPromise;
  }
  window.createFujimiStage = async function (container, options) {
    var C = await library();
    if (!options.isCurrent() || !container.isConnected) return null;
    if (!document.querySelector('[data-fujimi-cesium-css]')) {
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'Widgets/widgets.css'; css.dataset.fujimiCesiumCss = ''; document.head.append(css);
    }
    var host = document.createElement('div'); host.style.cssText = 'position:absolute;inset:0;overflow:hidden'; container.append(host);
    var viewer, destroyed = false, ready = false, timer, resize, removeError;
    function current() { return !destroyed && options.isCurrent(); }
    function destroy() {
      if (destroyed) return;
      destroyed = true; clearTimeout(timer); resize?.disconnect(); removeError?.();
      if (viewer && !viewer.isDestroyed()) viewer.destroy(); host.remove();
    }
    function fail() { if (!current()) return; destroy(); options.onError(); }
    try {
      viewer = new C.Viewer(host, { animation:false, timeline:false, baseLayerPicker:false, geocoder:false, homeButton:false, sceneModePicker:false, navigationHelpButton:false, fullscreenButton:false, infoBox:false, selectionIndicator:false, baseLayer:false, requestRenderMode:true, maximumRenderTimeChange:Infinity, contextOptions:{webgl:{antialias:true}} });
      viewer.clock.currentTime = C.JulianDate.fromIso8601('2026-09-24T03:00:00Z'); viewer.clock.shouldAnimate = false;
      viewer.resolutionScale = Math.min(1, 1.5 / (window.devicePixelRatio || 1));
      viewer.scene.screenSpaceCameraController.enableInputs = false;
      viewer.scene.skyBox.show = false; viewer.scene.skyAtmosphere.show = false; viewer.scene.sun.show = false; viewer.scene.moon.show = false; viewer.scene.fog.enabled = false;
      viewer.scene.backgroundColor = C.Color.fromCssColorString('#10212d'); viewer.scene.globe.baseColor = C.Color.fromCssColorString('#26383d');
      var map = viewer.imageryLayers.addImageryProvider(new C.UrlTemplateImageryProvider({ url:'https://cyberjapandata.gsi.go.jp/xyz/{gsiLayer}/{z}/{x}/{y}.png', customTags:{gsiLayer:function (_provider,_x,_y,level) { return level < 5 ? 'std' : 'pale'; }}, maximumLevel:18, credit:'地理院タイル' }));
      map.alpha = .12; map.saturation = 0; map.brightness = .45;
      // film-data.json: GPS interpolated at the visually identified 3.705s.
      // Heights are diagram settings, not calibrated rail/tower elevations.
      var train = C.Cartesian3.fromDegrees(139.76588175,35.67758694,64);
      var tower = C.Cartesian3.fromDegrees(139.7566,35.68419,54);
      var middle = C.Cartesian3.lerp(train,tower,.5,new C.Cartesian3());
      function marker(position, label, color) {
        viewer.entities.add({ position:position, point:{pixelSize:10,color:C.Color.fromCssColorString(color),outlineColor:C.Color.fromCssColorString('#10212d'),outlineWidth:3,disableDepthTestDistance:Infinity}, label:{text:label,font:'12px sans-serif',fillColor:C.Color.fromCssColorString('#fff5d9'),outlineColor:C.Color.fromCssColorString('#10212d'),outlineWidth:4,style:C.LabelStyle.FILL_AND_OUTLINE,pixelOffset:new C.Cartesian2(0,-24),disableDepthTestDistance:Infinity} });
      }
      marker(train,'列車位置（3.705秒）','#7fcaba'); marker(tower,'富士見櫓','#efb75f');
      viewer.entities.add({polyline:{positions:[train,tower],arcType:C.ArcType.NONE,width:3,material:C.Color.fromCssColorString('#efac49'),depthFailMaterial:C.Color.fromCssColorString('#efac49')}});
      function setView(mode) {
        if (!current()) return;
        viewer.camera.lookAt(middle, new C.HeadingPitchRange(C.Math.toRadians(mode === 'top' ? 0 : 311.21), C.Math.toRadians(mode === 'top' ? -90 : -50), mode === 'top' ? 1900 : 2100));
        viewer.camera.lookAtTransform(C.Matrix4.IDENTITY); viewer.scene.requestRender();
      }
      setView('oblique');
      removeError = viewer.scene.renderError.addEventListener(fail);
      timer = setTimeout(fail,35000);
      if (window.ResizeObserver) { resize = new ResizeObserver(function () { if (current()) { viewer.resize(); viewer.scene.requestRender(); } }); resize.observe(container); }
      options.onStatus('千代田区の建物を読み込んでいます…');
      void C.Cesium3DTileset.fromUrl('https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/13101-bldg-lod1-latest/tileset.json', {maximumScreenSpaceError:12,cacheBytes:32*1024*1024,maximumCacheOverflowBytes:16*1024*1024,dynamicScreenSpaceError:false,skipLevelOfDetail:false,preferLeaves:false,preloadWhenHidden:false,preloadFlightDestinations:false}).then(function (tile) {
      if (!current()) { tile.destroy(); destroy(); return; }
      viewer.scene.primitives.add(tile); tile.colorBlendMode = C.Cesium3DTileColorBlendMode.REPLACE;
      tile.style = new C.Cesium3DTileStyle({color:"color('#b4c7bf')"});
      tile.tileVisible.addEventListener(function () {
        if (!current() || ready) return;
        ready = true; clearTimeout(timer); options.onStatus('オレンジの線が列車と櫓を結びます。建物模型は位置関係の説明です。');
      });
      tile.loadProgress.addEventListener(function (pending,processing) {
        if (current() && ready) options.onStatus(pending + processing > 0 ? '周辺の建物を読み込んでいます…' : 'オレンジの線が列車と櫓を結びます。北西へ約1.1km。');
      });
      tile.tileFailed.addEventListener(fail);
      viewer.scene.requestRender();
      }).catch(fail);
      return {setView:setView,destroy:destroy};
    } catch (error) { destroy(); throw error; }
  };
}());
