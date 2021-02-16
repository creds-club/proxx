define("./index-83a40a35.js",["exports","./chunk-539de822","./chunk-4fc10aa5","./chunk-740044b8","./chunk-45c70e7a","./chunk-a12f2b6f","./chunk-a647c4b1","./chunk-070e2192","./chunk-2fc5265f"],function(e,t,i,a,r,o,s,n,l){"use strict";function _(e,t){for(var i=[],a=0;a<e*t;a++)i.push(4*a,4*a+1,4*a+2,4*a+2,4*a+1,4*a+3);return i}var c=function(){function e(){this._lastFocus=[-1,-1],this._renderLoopRunning=!1}return e.prototype.createCanvas=function(){return this._canvas=l.getCanvas("webgl"),this._canvas},e.prototype.init=function(e,t){this._numTilesX=e,this._numTilesY=t,this._updateTileSize(),this._initShaderBox(),this._setupMesh(),this._setupTextures(),this._shaderBox.setUniform1f("sprite_size",s.spriteSize),this._shaderBox.setUniform1f("tile_size",o.textureTileSize*a.staticDevicePixelRatio),this._shaderBox.setUniform1f("idle_frames",s.idleAnimationNumFrames),this._updateFadeoutParameters(),this._startRenderLoop()},e.prototype.updateFirstRect=function(e){this._assertShaderBox(),this._shaderBox.setUniform2f("offset",[e.left*a.staticDevicePixelRatio,e.top*a.staticDevicePixelRatio])},e.prototype.stop=function(){this._renderLoopRunning=!1},e.prototype.onResize=function(){this._shaderBox&&(this._shaderBox.resize(),this._updateTileSize()&&this._updateGridMesh(),this._updateFadeoutParameters())},e.prototype.beforeUpdate=function(){},e.prototype.afterUpdate=function(){},e.prototype.beforeCell=function(e,t,i,a,r){},e.prototype.afterCell=function(e,t,i,a,r){},e.prototype.render=function(e,t,i,a,r){this._assertShaderBox(),this[a.name](e,t,i,a,r),this._updateDynamicTileData(e,t)},e.prototype.setFocus=function(e,i){if(this._lastFocus[0]>-1&&this._lastFocus[1]>-1){var a=t.__read(this._lastFocus,2),r=a[0],o=a[1];this._getDynamicTileDataAForTile(r,o)[0]&=-2,this._updateDynamicTileData(r,o)}e>-1&&i>-1&&(this._getDynamicTileDataAForTile(e,i)[0]|=1,this._updateDynamicTileData(e,i),this._lastFocus=[e,i])},e.prototype._updateFadeoutParameters=function(){var e=o.getBarHeights(),t=e.topBarHeight,i=e.bottomBarHeight;this._shaderBox.setUniform2f("paddings",[t*a.staticDevicePixelRatio,i*a.staticDevicePixelRatio])},e.prototype._updateTileSize=function(){var e=o.getCellSizes(),t=e.cellPadding,i=(e.cellSize+2*t)*a.staticDevicePixelRatio,r=i!==this._tileSize;return this._tileSize=i,r},e.prototype._updateDynamicTileData=function(e,t){for(var i=this._getDynamicTileDataAForTile(e,t),a=this._getDynamicTileDataBForTile(e,t),r=1;r<4;r++)this._getDynamicTileDataAForTile(e,t,r).set(i),this._getDynamicTileDataBForTile(e,t,r).set(a)},e.prototype[0]=function(e,t,i,a,r){var o=this._getDynamicTileDataAForTile(e,t),n=this._getDynamicTileDataBForTile(e,t),l=s.idleAnimationLength,_=(r-a.start)/l%1;o[3]=_;var c=(r-(a.fadeStart||0))/s.fadeInAnimationLength;c>1&&(c=1),n[3]=s.remap(0,1,1,s.fadedLinesAlpha,s.easeOutQuad(c)),o[1]=s.remap(0,1,1,0,s.easeOutQuad(c)),n[2]=1,o[0]|=2},e.prototype[6]=function(e,t,i,a,r){var o=this._getDynamicTileDataAForTile(e,t),n=this._getDynamicTileDataBForTile(e,t),l=s.idleAnimationLength,_=(r-a.start)/l%1;o[3]=_;var c=(r-(a.fadeStart||0))/s.fadeOutAnimationLength;c>1&&(c=1),n[3]=s.remap(0,1,s.fadedLinesAlpha,1,s.easeOutQuad(c)),o[1]=s.remap(0,1,0,1,s.easeOutQuad(c)),n[2]=1,n[2]=1},e.prototype[5]=function(e,t,i,a,r){if(!(r<a.start)){var o=this._getDynamicTileDataAForTile(e,t),n=this._getDynamicTileDataBForTile(e,t);o[2]=i.touchingMines,n[2]=i.touchingMines<=0?s.revealedAlpha:0,o[0]&=-3,o[1]=0,n[3]=0}},e.prototype[3]=function(e,t,i,a,r){this._getDynamicTileDataAForTile(e,t);var n=this._getDynamicTileDataBForTile(e,t),l=s.fadeInAnimationLength,_=(r-a.start)/l;_<0&&(_=0),_>1&&(o.processDoneCallback(a),_=1),n[0]=s.easeOutQuad(_)},e.prototype[4]=function(e,t,i,a,r){this._getDynamicTileDataAForTile(e,t);var n=this._getDynamicTileDataBForTile(e,t),l=s.fadeOutAnimationLength,_=(r-a.start)/l;_<0&&(_=0),_>1&&(o.processDoneCallback(a),_=1),n[0]=1-s.easeOutQuad(_)},e.prototype[1]=function(e,t,i,a,r){this._getDynamicTileDataAForTile(e,t);var n=this._getDynamicTileDataBForTile(e,t),l=s.flashInAnimationLength,_=(r-a.start)/l;_<0||(_>1&&(o.processDoneCallback(a),_=1),n[1]=s.easeOutQuad(_))},e.prototype[2]=function(e,t,i,a,r){this._getDynamicTileDataAForTile(e,t);var n=this._getDynamicTileDataBForTile(e,t),l=s.flashOutAnimationLength,_=(r-a.start)/l;_<0||(_>1&&(o.processDoneCallback(a),_=1),n[1]=1-s.easeInOutCubic(_))},e.prototype[7]=function(e,t,i,a,r){if(!(r<a.start)){var o=this._getDynamicTileDataAForTile(e,t),s=this._getDynamicTileDataBForTile(e,t);o[2]=10,o[0]&=-3,s[2]=0,s[3]=0}},e.prototype._getDynamicTileDataAForTile=function(e,t,i){void 0===i&&(i=0);var a=4*(4*(4*(t*this._numTilesX+e)+i));return new Float32Array(this._dynamicTileDataA.buffer,a,4)},e.prototype._getDynamicTileDataBForTile=function(e,t,i){void 0===i&&(i=0);var a=4*(4*(4*(t*this._numTilesX+e)+i));return new Float32Array(this._dynamicTileDataB.buffer,a,4)},e.prototype._initShaderBox=function(){this._shaderBox=new n.ShaderBox("\n#version 100\nprecision highp float;attribute vec2 pos;attribute vec2 tile_uv;attribute vec4 dynamic_tile_data_a;attribute vec4 dynamic_tile_data_b;varying vec2 uv;varying vec2 coords;varying vec2 iResolution2;varying vec4 dynamic_tile_data_a2;varying vec4 dynamic_tile_data_b2;uniform vec2 offset;uniform vec2 iResolution;void main(){vec2 a=vec2(0.,1.)+vec2(1.,-1.)*(pos+offset)/iResolution;gl_Position=vec4(a*2.-vec2(1.),0.0,1.0);uv=tile_uv;iResolution2=iResolution;dynamic_tile_data_a2=dynamic_tile_data_a;dynamic_tile_data_b2=dynamic_tile_data_b;}","\n#version 100\nprecision highp float;varying vec2 uv;varying vec4 dynamic_tile_data_a2;varying vec4 dynamic_tile_data_b2;varying vec2 iResolution2;uniform float idle_frames;uniform float sprite_size;uniform float tile_size;uniform sampler2D idle_sprites[4];uniform sampler2D static_sprite;uniform vec2 paddings;float a=floor(sprite_size/tile_size);float b=a*a;vec2 c(float d){return vec2(mod(d,a),floor(d/a));}bool e(float f,int g){return floor(mod(f,pow(2.,float(g+1)))/pow(2.,float(g)))>0.;}void main(){vec4 h=vec4(1.);vec4 i=vec4(vec3(0.),1.);vec4 j=vec4(0.);vec4 k=vec4(vec3(109.,205.,218.)/255.,1.);vec2 l=vec2(0.,1.)+vec2(1.,-1.)*uv;float m=e(dynamic_tile_data_a2.x,0)?1.:0.;float n=e(dynamic_tile_data_a2.x,1)?1.:0.;float o=dynamic_tile_data_a2.y;float p=dynamic_tile_data_a2.z;float q=dynamic_tile_data_a2.w;float r=dynamic_tile_data_b2.x;float s=dynamic_tile_data_b2.y;float t=dynamic_tile_data_b2.z;float u=dynamic_tile_data_b2.w;float f;if(p<0.){float v=floor(q*idle_frames);int w=int(floor(v/b));float x=mod(v,b);float y=mod(x,a);float z=floor(x/a);vec2 A=(vec2(y,z)+l)*tile_size/sprite_size;if(w==0){vec4 B=texture2D(idle_sprites[0],A);gl_FragColor=mix(gl_FragColor,B,B.a*u);}else if(w==1){vec4 B=texture2D(idle_sprites[1],A);gl_FragColor=mix(gl_FragColor,B,B.a*u);}else if(w==2){vec4 B=texture2D(idle_sprites[2],A);gl_FragColor=mix(gl_FragColor,B,B.a*u);}else if(w==3){vec4 B=texture2D(idle_sprites[3],A);gl_FragColor=mix(gl_FragColor,B,B.a*u);}}else if(p>=1.&&p<=8.){vec2 C=(c(p)+l)*tile_size/sprite_size;vec4 B=texture2D(static_sprite,C);gl_FragColor=mix(gl_FragColor,B,B.a);}{vec2 D=(c(0.)+l)*tile_size/sprite_size;vec4 B=texture2D(static_sprite,D);gl_FragColor=mix(gl_FragColor,B,B.a*t);}{vec2 D=(c(12.)+l)*tile_size/sprite_size;vec4 B=texture2D(static_sprite,D);gl_FragColor=mix(gl_FragColor,B,B.a*n);}{vec2 D=(c(13.)+l)*tile_size/sprite_size;vec4 B=texture2D(static_sprite,D);gl_FragColor=mix(gl_FragColor,B,B.a*o);}{gl_FragColor=mix(gl_FragColor,gl_FragColor*k,r);}{if(p==10.){vec2 E=(c(10.)+l)*tile_size/sprite_size;vec4 B=texture2D(static_sprite,E);gl_FragColor=mix(gl_FragColor,B,B.a);}}{vec2 F=(c(9.)+l)*tile_size/sprite_size;vec4 B=texture2D(static_sprite,F);gl_FragColor=mix(gl_FragColor,B,B.a*s);}{vec2 G=(c(11.)+l)*tile_size/sprite_size;vec4 H=mix(gl_FragColor,h,texture2D(static_sprite,G).a*m);gl_FragColor=H;}{vec2 I=vec2(1.0,1.3);float J=smoothstep(paddings.y*I.x,paddings.y*I.y,gl_FragCoord.y)*(1.-smoothstep(iResolution2.y-paddings.x*I.y,iResolution2.y-paddings.x*I.x,gl_FragCoord.y));gl_FragColor=mix(j,gl_FragColor,J);}}",{canvas:this._canvas,uniforms:["offset","idle_sprites[0]","idle_sprites[1]","idle_sprites[2]","idle_sprites[3]","static_sprite","sprite_size","tile_size","idle_frames","paddings"],scaling:a.staticDevicePixelRatio,antialias:!1,mesh:[{dimensions:2,name:"pos"},{dimensions:2,name:"tile_uv"},{name:"dynamic_tile_data_a",dimensions:4,usage:"DYNAMIC_DRAW"},{name:"dynamic_tile_data_b",dimensions:4,usage:"DYNAMIC_DRAW"}],indices:_(this._numTilesX,this._numTilesY),clearColor:[0,0,0,0]}),this._shaderBox.resize()},e.prototype._updateGridMesh=function(){var e=function(e,i,a){for(var r,o,s,n,l=[],_=0;_<i;_++)for(var c=0;c<e;c++)l.push.apply(l,t.__spread([r=c*a,o=_*a,r,n=(_+1)*a,s=(c+1)*a,o,s,n]));return new Float32Array(l)}(this._numTilesX,this._numTilesY,this._tileSize);return this._shaderBox.updateVBO("pos",e),e},e.prototype._setupMesh=function(){var e=this,t=this._updateGridMesh(),i=[0,1,0,0,1,1,1,0];this._shaderBox.updateVBO("tile_uv",t.map(function(e,t){return i[t%i.length]}));var a=this._numTilesX*this._numTilesY;this._dynamicTileDataA=new Float32Array(new Array(4*a*4).fill(0).map(function(t,i){var a=Math.floor(i/16);e._numTilesX,Math.floor(a/e._numTilesX);switch(i%4){case 0:return 2;case 1:return 0;case 2:return-1;case 3:return 0;default:return-1}})),this._shaderBox.updateVBO("dynamic_tile_data_a",this._dynamicTileDataA),this._dynamicTileDataB=new Float32Array(new Array(4*a*4).fill(0).map(function(e,t){switch(t%4){case 2:return 1;case 3:return s.fadedLinesAlpha;case 1:case 0:return 0;default:return-1}})),this._shaderBox.updateVBO("dynamic_tile_data_b",this._dynamicTileDataB)},e.prototype._setupTextures=function(){this._shaderBox.addTexture("staticSprite",o.staticSprites[0]);for(var e=0;e<o.idleSprites.length;e++)this._shaderBox.addTexture("idleSprite"+e,o.idleSprites[e]);for(e=0;e<o.idleSprites.length;e++)this._shaderBox.activateTexture("idleSprite"+e,e+1),this._shaderBox.setUniform1i("idle_sprites["+e+"]",e+1);this._shaderBox.activateTexture("staticSprite",0),this._shaderBox.setUniform1i("static_sprite",0)},e.prototype._startRenderLoop=function(){this._renderLoopRunning=!0,requestAnimationFrame(this._renderLoop)},e.prototype._assertShaderBox=function(){if(!this._shaderBox)throw Error("ShaderBox not initialized for WebGL renderer")},e.prototype._renderLoop=function(){this._shaderBox.updateVBO("dynamic_tile_data_a",this._dynamicTileDataA),this._shaderBox.updateVBO("dynamic_tile_data_b",this._dynamicTileDataB),this._shaderBox.draw(),this._renderLoopRunning&&requestAnimationFrame(this._renderLoop)},t.__decorate([i.bind],e.prototype,"_renderLoop",null),e}();e.default=c});
//# sourceMappingURL=index-83a40a35.js.map
