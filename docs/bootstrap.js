if(!self.define){const e=e=>("require"!==e&&(e+=".js"),Promise.resolve().then(()=>{if(!n[e])return"document"in self?new Promise(t=>{const n=document.createElement("script");n.src=e,n.defer=!0,document.head.appendChild(n),n.onload=t}):void importScripts(e)}).then(()=>{if(!n[e])throw new Error(`Module ${e} didn’t register its module`);return n[e]})),t=(t,n)=>{Promise.all(t.map(e)).then(e=>1===e.length?e[0]:e).then(e=>n(e))},n={require:Promise.resolve(t)};self.define=((t,i,o)=>{n[t]||(n[t]=new Promise(n=>{let r={};const a={uri:location.origin+t.slice(1)};Promise.all(i.map(t=>"exports"===t?r:"module"===t?a:e(t))).then(e=>{o(...e),n(r)})}))})}define("./bootstrap.js",["require","./chunk-539de822","./chunk-eb9e63f9","./chunk-4fc10aa5","./chunk-740044b8"],function(e,t,n,i,o){"use strict";var r=[14,16,62],a="default-game";function s(n,i){return t.__awaiter(this,void 0,void 0,function(){var o;return t.__generator(this,function(t){switch(t.label){case 0:return[4,new Promise(function(t,n){e(["./lazy-load-ab71c6ec"],t,n)})];case 1:return o=t.sent().comlinkProxy,n.subscribe(o(i)),[2]}})})}var l=function(e){return n.h("svg",t.__assign({viewBox:"0 0 24 24"},e),n.h("path",{d:"M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"}))},c=function(e){return n.h("svg",t.__assign({viewBox:"0 0 24 24"},e),n.h("path",{d:"M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"}))},u=function(e){return n.h("svg",t.__assign({viewBox:"0 0 10 5",preserveAspectRatio:"none"},e),n.h("path",{d:"M0 0l5 5 5-5z"}))},h=function(e){return n.h("svg",t.__assign({viewBox:"0 0 24 24"},e),n.h("path",{d:"M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"}))};function d(){document.documentElement.requestFullscreen?document.documentElement.requestFullscreen():document.documentElement.webkitRequestFullscreen&&document.documentElement.webkitRequestFullscreen()}var p=!(!document.documentElement.requestFullscreen&&!document.documentElement.webkitRequestFullscreen),g=function(e){function r(){var t=null!==e&&e.apply(this,arguments)||this;return t.state={flagModeAnnouncement:""},t}return t.__extends(r,e),r.prototype.render=function(e,t){var i=this,r=e.onSettingsClick,a=e.onBackClick,s=(e.buttonType,e.display),u=(e.showDangerModeToggle,e.dangerMode),g=t.flagModeAnnouncement;o.isFeaturePhone?n.h("button",{class:o.leftKeyIcon,onClick:a,"aria-label":"Back to main menu"},n.h("span",{class:o.shortcutKey},"*")," back"):n.h("button",{class:o.leftIcon,onClick:a,"aria-label":"Back to main menu"},n.h(h,null)),o.isFeaturePhone?n.h("button",{class:o.leftKeyIcon,onClick:r,"aria-label":"Open information and settings"},n.h("span",{class:o.shortcutKey},"*")," info"):n.h("button",{class:o.leftIcon,onClick:r,"aria-label":"Open information and settings"},n.h(c,null)),o.isFeaturePhone?n.h("div",{class:o.fpToggle},n.h("span",{class:o.shortcutKey},"#")," ",n.h("label",null,n.h("input",{class:o.checkbox,type:"checkbox",role:"switch checkbox",onChange:this._onDangerModeSwitchToggle,checked:!u,"aria-label":"flag mode",ref:function(e){return i._flagCheckbox=e}}),n.h("span",{"aria-hidden":"true"},"Flag:",u?"OFF":"ON")),n.h("span",{role:"status","aria-live":"assertive","aria-label":g})):n.h("div",{class:o.toggleContainer,onTouchStart:this._onDangerModeTouchStart},n.h("label",{class:o.toggleLabel},n.h("span",{"aria-hidden":"true",class:o.leftToggleLabel},"Clear"),n.h("input",{class:o.checkbox,type:"checkbox",role:"switch checkbox",onChange:this._onDangerModeSwitchToggle,checked:!u,"aria-label":"flag mode",ref:function(e){return i._flagCheckbox=e}}),n.h("svg",{viewBox:"0 0 32 16",class:o.toggle},n.h("defs",null,n.h("mask",{id:"flag-toggle-mask"},n.h("rect",{fill:"#fff",x:"0",y:"0",width:"32",height:"16"}),n.h("circle",{cx:u?8:24,cy:"8",fill:"#000",r:"4"}))),n.h("rect",{fill:"#fff",x:"0",y:"0",width:"32",height:"16",rx:"8",ry:"8",mask:"url(#flag-toggle-mask)"})),n.h("span",{"aria-hidden":"true",class:o.rightToggleLabel},"Flag")),n.h("span",{role:"status","aria-live":"assertive","aria-label":g})),o.isFeaturePhone||(p?n.h("button",{class:o.fullscreen,onClick:d,"aria-label":"fullscreen mode"},n.h(l,null)):n.h("div",{class:o.noFullscreen}));return n.h("div",{class:[o.bottomBar,s?"":o.hidden].join(" "),role:"menubar"})},r.prototype.componentDidMount=function(){window.addEventListener("keyup",this._onKeyUp)},r.prototype.componentWillUnmount=function(){window.removeEventListener("keyup",this._onKeyUp)},r.prototype._onKeyUp=function(e){"*"===e.key?"back"===this.props.buttonType?this.props.onBackClick():this.props.onSettingsClick():!this.props.showDangerModeToggle||"f"!==e.key&&"#"!==e.key||this._dangerModeChange(!this.props.dangerMode,!0)},r.prototype._dangerModeChange=function(e,t){this.props.onDangerModeChange(e);var n="";t&&(n=e?"flag mode off":"flag mode on"),this.setState({flagModeAnnouncement:n})},r.prototype._onDangerModeTouchStart=function(e){e.preventDefault(),this._dangerModeChange(this._flagCheckbox.checked,!0)},r.prototype._onDangerModeSwitchToggle=function(){this._dangerModeChange(!this._flagCheckbox.checked,!1)},t.__decorate([i.bind],r.prototype,"_onKeyUp",null),t.__decorate([i.bind],r.prototype,"_onDangerModeTouchStart",null),t.__decorate([i.bind],r.prototype,"_onDangerModeSwitchToggle",null),r}(n.Component);function f(e){return function(n){function i(t){var i=n.call(this,t)||this;return i.state={LoadedComponent:void 0},e.then(function(e){i.setState({LoadedComponent:e})}),i}return t.__extends(i,n),i.prototype.render=function(e,t){var n=e.loaded,i=e.loading,o=t.LoadedComponent;return o?n(o):i()},i}(n.Component)}o.styleInject("._2hqwv{display:flex;flex:1;align-items:center;justify-content:center;position:relative}@keyframes _2gTRD{50%{opacity:1}}._3CcZZ{display:flex;flex-flow:column;padding:var(--bar-avoid) var(--side-margin) 0;box-sizing:border-box;width:100%;text-align:center;font-size:2.3rem;opacity:0;animation:_2gTRD 3s ease-in-out .5s infinite}");var m=function(e){function i(){return null!==e&&e.apply(this,arguments)||this}return t.__extends(i,e),i.prototype.render=function(){return n.h("div",{class:"_2hqwv"},n.h("div",{class:"_3CcZZ"},"…Loading…"))},i}(n.Component);o.styleInject("._2GPlt{cursor:pointer;background:none;border:none;font:inherit;padding:0;margin:0;user-select:none}._3CM1x{background:#fff;font-weight:700;border-radius:50%;padding:.1rem;border:3px solid #fff}._1Xglm,._2AHRc,._39aAp,.Yxbhp{background:#fff;font-weight:700;font-size:1.2rem;color:#000;border-radius:var(--border-radius);padding:.3rem;border:3px solid #fff}._1Xglm:disabled,._2AHRc:disabled,._39aAp:disabled,.Yxbhp:disabled{cursor:default;background-color:#666;border-color:#666;color:#000}.ZBB7v{border:1px solid #fff;font-weight:400;border-radius:25%;display:inline-block;width:var(--icon-size);height:var(--icon-size);line-height:var(--icon-size);text-align:center;letter-spacing:0;box-sizing:border-box}._2AHRc{mix-blend-mode:screen}._1Xglm{background:none;color:#fff}.Yxbhp{background:#3ee5ea;border-color:#3ee5ea}._39aAp{color:#fff;background:#ff274b;border-color:#ff274b}@media (min-width:320px){._1Xglm,._2AHRc,._39aAp,.Yxbhp{padding:.9rem}}._3GEZA{flex-flow:column;flex:1;justify-content:space-evenly;position:relative;min-height:min-content;padding-bottom:3rem}._1SXV-,._3GEZA{display:flex;align-items:center}._1SXV-{width:100%;max-width:648px;justify-content:center;box-sizing:border-box;padding:0 var(--side-margin);margin:2.5rem 0}._2qor8{padding-top:20%}.EtVV2{display:flex;flex-flow:column;padding:0 var(--side-margin);box-sizing:border-box;width:100%;max-width:33rem;--item-margin:0.4rem}._1JPZT{position:relative;display:block;--padding-sides:0.9rem;margin:0 var(--item-margin)}._11wHV{position:absolute;padding:0 var(--padding-sides);font-size:.8rem;opacity:.7;top:.9rem;pointer-events:none}._23ehF{background:rgba(0,0,0,.39);border-radius:var(--border-radius) var(--border-radius) 0 0;font:inherit;padding:2em var(--padding-sides) .8em;-webkit-appearance:none;-moz-appearance:textfield;border:none;border-bottom:1px solid #fff;width:100%;color:#fff;box-sizing:border-box}._23ehF:invalid{box-shadow:none}._23ehF:focus{outline:none;border-bottom-color:#4b93ff}._23ehF::-webkit-inner-spin-button,._23ehF::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}._3QVdr{-moz-appearance:none}._2A_Xb,._2JKyV,.Ypu5A{position:absolute;fill:#fff;right:.6rem;width:15px;height:7px;-webkit-tap-highlight-color:transparent;padding:7px}.Ypu5A{top:50%;transform:translateY(-50%);pointer-events:none}._2A_Xb,._2JKyV{top:50%;transform:translateY(-10px) translateY(-50%) scaleY(-1);cursor:pointer}._2JKyV{transform:translateY(10px) translateY(-50%)}._29aQT{display:flex;margin:.4rem calc(-1*var(--item-margin))}@media (min-width:320px){._29aQT{margin:.8rem calc(-1*var(--item-margin))}}._29aQT>*{flex:1}._4WTus{margin:0 var(--item-margin)!important;text-transform:uppercase;letter-spacing:.15rem}._3Yv1J{border-color:#000!important}");var _=f(new Promise(function(e){e()}).then(function(){return new Promise(function(t,n){e(["./lazy-components-0645b949"],t,n)}).then(function(e){return e.ShowbizTitle})})),b=function(e){function o(){return null!==e&&e.apply(this,arguments)||this}return t.__extends(o,e),o.prototype.render=function(e){var i=this,o=(e.children,e.inputRef),r=t.__rest(e,["children","inputRef"]);return n.h("label",{class:"_1JPZT"},n.h(u,{class:"_2A_Xb",onClick:this._onUpClick}),n.h(u,{class:"_2JKyV",onClick:this._onDownClick}),n.h("span",{class:"_11wHV"},e.children),n.h("input",t.__assign({ref:function(e){i._input=e,o&&o(e)},class:"_23ehF",type:"number",inputmode:"numeric",pattern:"[0-9]*"},r)))},o.prototype._onUpClick=function(){this._input.valueAsNumber=Math.min(this._input.valueAsNumber+1,Number(this._input.max)),this._dispatch()},o.prototype._onDownClick=function(){this._input.valueAsNumber=Math.max(this._input.valueAsNumber-1,Number(this._input.min)),this._dispatch()},o.prototype._dispatch=function(){this._input.dispatchEvent(new Event("change"))},t.__decorate([i.bind],o.prototype,"_onUpClick",null),t.__decorate([i.bind],o.prototype,"_onDownClick",null),o}(n.Component);function v(e){var t=e.width,i=e.height,o=e.mines;return{width:t,height:i,mines:o,presetName:n.getPresetName(t,i,o)}}var y=function(e){function r(t){var n=e.call(this,t)||this;return t.defaults&&(n.state=v(t.defaults)),n}return t.__extends(r,e),r.prototype.componentDidMount=function(){window.scrollTo(0,0),window.addEventListener("keyup",this._onKeyUp)},r.prototype.componentWillUnmount=function(){window.removeEventListener("keyup",this._onKeyUp)},r.prototype.componentWillReceiveProps=function(e){var t=e.defaults;t&&!this.props.defaults&&this.setState(v(t))},r.prototype.render=function(e,t){var i=this,r=e.motion,a=t.width,s=t.height,l=t.mines,c=t.presetName;return n.h("div",{class:"_3GEZA"},n.h("div",{class:"_1SXV-"},n.h(_,{loading:function(){return n.h("div",{class:"_2qor8"})},loaded:function(e){return n.h(e,{motion:r})}})),n.h("form",{onSubmit:this._startGame,class:"EtVV2","aria-label":"game settings"},n.h("div",{class:"_29aQT"},n.h("label",{class:"_1JPZT"},n.h("span",{class:"_11wHV"},"Difficulty"),n.h(u,{class:"Ypu5A"}),n.h("select",{required:!0,class:"_3QVdr _23ehF",ref:function(e){return i._presetSelect=e},onChange:this._onSelectChange,value:c||""},c&&[n.h("option",{value:"easy"},"Easy"),n.h("option",{value:"medium"},"Medium"),n.h("option",{value:"hard"},"Hard"),n.h("option",{value:"custom"},"Custom")]))),n.h("div",{class:"_29aQT"},n.h(b,{required:!0,min:"5",max:"40",step:"1",value:a||"",inputRef:function(e){return i._widthInput=e},onChange:this._onSettingInput},"Width"),n.h(b,{required:!0,min:"5",max:"40",step:"1",value:s||"",inputRef:function(e){return i._heightInput=e},onChange:this._onSettingInput},"Height")),n.h("div",{class:"_29aQT"},n.h(b,{required:!0,min:"1",max:a&&s?a*s:"",step:"1",value:l,inputRef:function(e){return i._minesInput=e},onChange:this._onSettingInput},"Black holes")),n.h("div",{class:"_29aQT"},n.h("button",{class:"_4WTus _2AHRc _2GPlt"},o.isFeaturePhone?n.h("span",{class:"_3Yv1J ZBB7v"},"#"):""," ","Start"))))},r.prototype._onKeyUp=function(e){"#"===e.key&&this._startGame(e)},r.prototype._onSelectChange=function(){var e=this._presetSelect.value;if("custom"!==e){var t=n.presets[e];this.setState({height:t.height,mines:t.mines,presetName:e,width:t.width})}else this.setState({presetName:e})},r.prototype._onSettingInput=function(){var e=this._widthInput.valueAsNumber,t=this._heightInput.valueAsNumber,i=this._minesInput.valueAsNumber,o=e*t-9;this.setState({height:t,mines:i>o?o:i,presetName:n.getPresetName(e,t,i),width:e})},r.prototype._startGame=function(e){e.preventDefault(),this.props.onStartGame(this.state.width,this.state.height,this.state.mines)},t.__decorate([i.bind],r.prototype,"_onKeyUp",null),t.__decorate([i.bind],r.prototype,"_onSelectChange",null),t.__decorate([i.bind],r.prototype,"_onSettingInput",null),t.__decorate([i.bind],r.prototype,"_startGame",null),r}(n.Component);o.styleInject("._3hPwO{color:#fff;display:flex;flex-flow:column;height:100%}._3DazJ{position:fixed;top:0;left:0;width:100vw;height:100vh}");var w,x=new Promise(function(t,n){e(["./lazy-load-ab71c6ec"],t,n)}).then(function(e){return w=e}),C=new Promise(function(t){var n=new Promise(function(t,n){e(["./lazy-components-0645b949"],t,n)});t(x.then(function(){return n}))}),k=t.__awaiter(void 0,void 0,void 0,function(){var e,n;return t.__generator(this,function(t){switch(t.label){case 0:return e=new Worker("./index-7dfa68a0.js"),self.w=e,[4,x];case 1:return t.sent(),n=w.nextEvent(e,"message"),e.postMessage("ready?"),[4,n];case 2:return t.sent(),[2,w.comlinkWrap(e).stateService]}})}),S=[40,0,0],M=[131,23,71],P=[54,49,176],T=[0,0,0],z=[41,41,41],G=f(C.then(function(e){return e.Nebula})),D=f(C.then(function(e){return e.Game})),A=f(C.then(function(e){return e.Settings})),I=x.then(function(){return w.lazyGenerateTextures()}),F=I,V=function(e){function l(){var i=e.call(this)||this;i.state={dangerMode:!1,awaitingGame:!1,settingsOpen:!1,motionPreference:!0,gameInPlay:!1,allowIntroAnim:!0,vibrationPreference:!0},i.previousFocus=null,i._gameChangeSubscribers=new Set,i._awaitingGameTimeout=-1,function(){return t.__awaiter(this,void 0,void 0,function(){var e;return t.__generator(this,function(t){switch(t.label){case 0:return[4,o.get(a)];case 1:return(e=t.sent())?[2,e]:[2,n.presets.easy]}})})}().then(function(e){i.setState({gridDefaults:e})}),x.then(function(){return t.__awaiter(i,void 0,void 0,function(){var e,n;return t.__generator(this,function(t){switch(t.label){case 0:return w.initOffline(),e=this.setState,n={},[4,w.shouldUseMotion()];case 1:return n.motionPreference=t.sent(),[4,w.getVibrationPreference()];case 2:return e.apply(this,[(n.vibrationPreference=t.sent(),n)]),[2]}})})});return i.setState({awaitingGame:!0}),k.then(function(e){return t.__awaiter(i,void 0,void 0,function(){var n,i,r,l,c=this;return t.__generator(this,function(u){switch(u.label){case 0:return this._stateService=e,[4,s(this._stateService,function(e){return t.__awaiter(c,void 0,void 0,function(){var n,i,r,s,l,c,u,h;return t.__generator(this,function(d){switch(d.label){case 0:return[4,x];case 1:return d.sent(),"game"in e?(n=e.game)?(clearTimeout(this._awaitingGameTimeout),function(e,n,i){t.__awaiter(this,void 0,void 0,function(){return t.__generator(this,function(t){switch(t.label){case 0:return[4,o.set(a,{width:e,height:n,mines:i})];case 1:return t.sent(),[2]}})})}(n.width,n.height,n.mines),i=this.setState,r={game:n,awaitingGame:!1,gridDefaults:n,gameInPlay:!0},[4,w.getBestTime(n.width,n.height,n.mines)]):[3,3]:[3,4];case 2:return i.apply(this,[(r.bestTime=d.sent(),r.allowIntroAnim=!1,r)]),[3,4];case 3:this.setState({game:n,gameInPlay:!1}),d.label=4;case 4:if("gameStateChange"in e){2!==(s=e.gameStateChange.playMode)&&3!==s||this.setState({gameInPlay:!1});try{for(l=t.__values(this._gameChangeSubscribers),c=l.next();!c.done;c=l.next())(0,c.value)(e.gameStateChange)}catch(e){u={error:e}}finally{try{c&&!c.done&&(h=l.return)&&h.call(l)}finally{if(u)throw u.error}}}return[2]}})})})];case 1:return u.sent(),[4,F];case 2:u.sent(),n=JSON.parse('{ "width": 8,"height": 8, "mines": 10, "usedKeyboard": false }'),i=n.width,r=n.height,l=n.mines,n.usedKeyboard||document.body.dispatchEvent(new MouseEvent("mousemove",{bubbles:!0})),this._stateService.initGame(i,r,l),u.label=3;case 3:return[2]}})})}),i}return t.__extends(l,e),l.prototype.componentDidMount=function(){},l.prototype.render=function(e,t){var i,a=this,s=t.game,l=t.dangerMode,c=t.awaitingGame,u=t.gridDefaults,h=t.settingsOpen,d=t.motionPreference,p=t.gameInPlay,f=t.bestTime,_=t.allowIntroAnim,b=t.vibrationPreference;return i=s?n.h(D,{loading:function(){return n.h("div",null)},loaded:function(e){return n.h(e,{key:s.id,width:s.width,height:s.height,mines:s.mines,toRevealTotal:s.toRevealTotal,gameChangeSubscribe:a._onGameChangeSubscribe,gameChangeUnsubscribe:a._onGameChangeUnsubscribe,stateService:a._stateService,dangerMode:l,onDangerModeChange:a._onDangerModeChange,useMotion:d,bestTime:f,useVibration:b})}}):c?n.h(m,null):h?n.h(A,{loading:function(){return n.h("div",null)},loaded:function(e){return n.h(e,{onCloseClicked:a._onSettingsCloseClick,motion:d,onMotionPrefChange:a._onMotionPrefChange,disableAnimationBtn:!w.supportsSufficientWebGL||o.isFeaturePhone,supportsSufficientWebGL:w.supportsSufficientWebGL,texturePromise:I,useVibration:b,onVibrationPrefChange:a._onVibrationPrefChange})}}):n.h(y,{onStartGame:this._onStartGame,defaults:u,motion:d&&_}),n.h("div",{class:"_3hPwO"},n.h(G,{loading:function(){return n.h("div",{class:"_3DazJ",style:{background:"linear-gradient(to bottom, "+n.toRGB(P)+", "+n.toRGB(r)+")"}})},loaded:function(e){return n.h(e,{colorDark:a._nebulaDarkColor(),colorLight:a._nebulaLightColor(),useMotion:d})}}),i,n.h(g,{onSettingsClick:this._onSettingsClick,onBackClick:this._onBackClick,onDangerModeChange:this._onDangerModeChange,buttonType:s?"back":"info",display:!h,dangerMode:l,showDangerModeToggle:p}))},l.prototype._nebulaLightColor=function(){return this.state.settingsOpen?z:this.state.game&&this.state.dangerMode?M:P},l.prototype._nebulaDarkColor=function(){return this.state.settingsOpen?T:this.state.game&&this.state.dangerMode?S:r},l.prototype._onMotionPrefChange=function(){return t.__awaiter(this,void 0,void 0,function(){var e;return t.__generator(this,function(t){switch(t.label){case 0:return e=!this.state.motionPreference,this.setState({motionPreference:e}),[4,x];case 1:return(0,t.sent().setMotionPreference)(e),[2]}})})},l.prototype._onVibrationPrefChange=function(){return t.__awaiter(this,void 0,void 0,function(){var e;return t.__generator(this,function(t){switch(t.label){case 0:return e=!this.state.vibrationPreference,this.setState({vibrationPreference:e}),[4,x];case 1:return(0,t.sent().setVibrationPreference)(e),[2]}})})},l.prototype._onDangerModeChange=function(e){this.setState({dangerMode:e})},l.prototype._onGameChangeSubscribe=function(e){this._gameChangeSubscribers.add(e)},l.prototype._onGameChangeUnsubscribe=function(e){this._gameChangeSubscribers.delete(e)},l.prototype._onSettingsCloseClick=function(){var e=this;this.setState({settingsOpen:!1},function(){e.previousFocus.focus()})},l.prototype._onSettingsClick=function(){this.previousFocus=document.activeElement,this.setState({settingsOpen:!0,allowIntroAnim:!1})},l.prototype._onStartGame=function(e,n,i){return t.__awaiter(this,void 0,void 0,function(){var o,r,a,s,l=this;return t.__generator(this,function(t){switch(t.label){case 0:return this._awaitingGameTimeout=setTimeout(function(){l.setState({awaitingGame:!0})},1e3),[4,x];case 1:return o=t.sent(),r=o.updateReady,a=o.skipWaiting,r?[4,a()]:[3,3];case 2:return t.sent(),s=!!document.querySelector(".focus-visible"),sessionStorage.setItem("instantGame",JSON.stringify({width:e,height:n,mines:i,usedKeyboard:s})),location.reload(),[2];case 3:return[4,F];case 4:return t.sent(),[4,k];case 5:return t.sent().initGame(e,n,i),[2]}})})},l.prototype._onBackClick=function(){this.setState({dangerMode:!1}),this._stateService.reset()},t.__decorate([i.bind],l.prototype,"_onMotionPrefChange",null),t.__decorate([i.bind],l.prototype,"_onVibrationPrefChange",null),t.__decorate([i.bind],l.prototype,"_onDangerModeChange",null),t.__decorate([i.bind],l.prototype,"_onGameChangeSubscribe",null),t.__decorate([i.bind],l.prototype,"_onGameChangeUnsubscribe",null),t.__decorate([i.bind],l.prototype,"_onSettingsCloseClick",null),t.__decorate([i.bind],l.prototype,"_onSettingsClick",null),t.__decorate([i.bind],l.prototype,"_onStartGame",null),t.__decorate([i.bind],l.prototype,"_onBackClick",null),l}(n.Component);o.styleInject("html{background-color:#000;font-family:Space Mono,monospace;font-size:.8em;font-variant-ligatures:none;--cell-size:25px;--cell-padding:2px;--side-margin:10px;--icon-size:20px;--circlebtn-size:24px;--bar-avoid:40px;--bar-padding:5px;--border-radius:7px}@media (min-width:320px){html{font-size:1em;--cell-size:40px;--cell-padding:5px;--side-margin:24px;--icon-size:24px;--circlebtn-size:48px;--bar-avoid:78px;--bar-padding:18px}}body,html{margin:0;padding:0;height:100%;overscroll-behavior:none}*{-webkit-tap-highlight-color:transparent}._1NQ3y{height:100%}:focus:not(.focus-visible){outline:none}");var E=document.body.querySelector(".app");E.classList.add("_1NQ3y"),n.render(n.h(V,null),E,E.firstChild),performance.mark("UI ready"),window.ga=window.ga||function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];return(ga.q=ga.q||[]).push(e)},ga("create","UA-139146337-1","auto"),ga("set","transport","beacon"),ga("send","pageview");var B=document.createElement("script");B.src="https://www.google-analytics.com/analytics.js",document.head.appendChild(B)});
//# sourceMappingURL=bootstrap.js.map
