
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.op = factory());
}(this, (function () { 'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    const CONSTANTS = 
    { 
        AUTH_SERVER_TYPES : 
        {
            NAKAMA: "nakama"
        }, 

        TOURNEY_SERVER_TYPES : 
        {
            NAKAMA: "nakama"
        },     
        
        SDK_STATES: 
        {
            NOT_READY: "not_ready",
            INITIALIZING: "initializing",
            READY: "ready"
        },
        
        LOGIN_STATES:
        {
            LOGGED_OUT: "logged_out",
            LOGIN_IN_PROGRESS: "login_in_progress",
            LOGGED_IN: "logged_in",
        }
    };

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __assign = Object.assign;
    var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
    var __commonJS = (callback, module) => () => {
      if (!module) {
        module = {exports: {}};
        callback(module.exports, module);
      }
      return module.exports;
    };
    var __exportStar = (target, module, desc) => {
      __markAsModule(target);
      if (module && typeof module === "object" || typeof module === "function") {
        for (let key of __getOwnPropNames(module))
          if (!__hasOwnProp.call(target, key) && key !== "default")
            __defProp(target, key, {get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable});
      }
      return target;
    };
    var __toModule = (module) => {
      if (module && module.__esModule)
        return module;
      return __exportStar(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", {value: module, enumerable: true}), module);
    };
    var __async = (__this, __arguments, generator) => {
      return new Promise((resolve, reject) => {
        var fulfilled = (value) => {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        };
        var rejected = (value) => {
          try {
            step(generator.throw(value));
          } catch (e) {
            reject(e);
          }
        };
        var step = (result) => {
          return result.done ? resolve(result.value) : Promise.resolve(result.value).then(fulfilled, rejected);
        };
        step((generator = generator.apply(__this, __arguments)).next());
      });
    };

    // node_modules/whatwg-fetch/fetch.js
    var require_fetch = __commonJS((exports) => {
      (function(self2) {
        if (self2.fetch) {
          return;
        }
        var support = {
          searchParams: "URLSearchParams" in self2,
          iterable: "Symbol" in self2 && "iterator" in Symbol,
          blob: "FileReader" in self2 && "Blob" in self2 && function() {
            try {
              new Blob();
              return true;
            } catch (e) {
              return false;
            }
          }(),
          formData: "FormData" in self2,
          arrayBuffer: "ArrayBuffer" in self2
        };
        if (support.arrayBuffer) {
          var viewClasses = [
            "[object Int8Array]",
            "[object Uint8Array]",
            "[object Uint8ClampedArray]",
            "[object Int16Array]",
            "[object Uint16Array]",
            "[object Int32Array]",
            "[object Uint32Array]",
            "[object Float32Array]",
            "[object Float64Array]"
          ];
          var isDataView = function(obj) {
            return obj && DataView.prototype.isPrototypeOf(obj);
          };
          var isArrayBufferView = ArrayBuffer.isView || function(obj) {
            return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
          };
        }
        function normalizeName(name) {
          if (typeof name !== "string") {
            name = String(name);
          }
          if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
            throw new TypeError("Invalid character in header field name");
          }
          return name.toLowerCase();
        }
        function normalizeValue(value) {
          if (typeof value !== "string") {
            value = String(value);
          }
          return value;
        }
        function iteratorFor(items) {
          var iterator = {
            next: function() {
              var value = items.shift();
              return {done: value === void 0, value};
            }
          };
          if (support.iterable) {
            iterator[Symbol.iterator] = function() {
              return iterator;
            };
          }
          return iterator;
        }
        function Headers(headers) {
          this.map = {};
          if (headers instanceof Headers) {
            headers.forEach(function(value, name) {
              this.append(name, value);
            }, this);
          } else if (Array.isArray(headers)) {
            headers.forEach(function(header) {
              this.append(header[0], header[1]);
            }, this);
          } else if (headers) {
            Object.getOwnPropertyNames(headers).forEach(function(name) {
              this.append(name, headers[name]);
            }, this);
          }
        }
        Headers.prototype.append = function(name, value) {
          name = normalizeName(name);
          value = normalizeValue(value);
          var oldValue = this.map[name];
          this.map[name] = oldValue ? oldValue + "," + value : value;
        };
        Headers.prototype["delete"] = function(name) {
          delete this.map[normalizeName(name)];
        };
        Headers.prototype.get = function(name) {
          name = normalizeName(name);
          return this.has(name) ? this.map[name] : null;
        };
        Headers.prototype.has = function(name) {
          return this.map.hasOwnProperty(normalizeName(name));
        };
        Headers.prototype.set = function(name, value) {
          this.map[normalizeName(name)] = normalizeValue(value);
        };
        Headers.prototype.forEach = function(callback, thisArg) {
          for (var name in this.map) {
            if (this.map.hasOwnProperty(name)) {
              callback.call(thisArg, this.map[name], name, this);
            }
          }
        };
        Headers.prototype.keys = function() {
          var items = [];
          this.forEach(function(value, name) {
            items.push(name);
          });
          return iteratorFor(items);
        };
        Headers.prototype.values = function() {
          var items = [];
          this.forEach(function(value) {
            items.push(value);
          });
          return iteratorFor(items);
        };
        Headers.prototype.entries = function() {
          var items = [];
          this.forEach(function(value, name) {
            items.push([name, value]);
          });
          return iteratorFor(items);
        };
        if (support.iterable) {
          Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
        }
        function consumed(body) {
          if (body.bodyUsed) {
            return Promise.reject(new TypeError("Already read"));
          }
          body.bodyUsed = true;
        }
        function fileReaderReady(reader) {
          return new Promise(function(resolve, reject) {
            reader.onload = function() {
              resolve(reader.result);
            };
            reader.onerror = function() {
              reject(reader.error);
            };
          });
        }
        function readBlobAsArrayBuffer(blob) {
          var reader = new FileReader();
          var promise = fileReaderReady(reader);
          reader.readAsArrayBuffer(blob);
          return promise;
        }
        function readBlobAsText(blob) {
          var reader = new FileReader();
          var promise = fileReaderReady(reader);
          reader.readAsText(blob);
          return promise;
        }
        function readArrayBufferAsText(buf) {
          var view = new Uint8Array(buf);
          var chars = new Array(view.length);
          for (var i = 0; i < view.length; i++) {
            chars[i] = String.fromCharCode(view[i]);
          }
          return chars.join("");
        }
        function bufferClone(buf) {
          if (buf.slice) {
            return buf.slice(0);
          } else {
            var view = new Uint8Array(buf.byteLength);
            view.set(new Uint8Array(buf));
            return view.buffer;
          }
        }
        function Body() {
          this.bodyUsed = false;
          this._initBody = function(body) {
            this._bodyInit = body;
            if (!body) {
              this._bodyText = "";
            } else if (typeof body === "string") {
              this._bodyText = body;
            } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
              this._bodyBlob = body;
            } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
              this._bodyFormData = body;
            } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
              this._bodyText = body.toString();
            } else if (support.arrayBuffer && support.blob && isDataView(body)) {
              this._bodyArrayBuffer = bufferClone(body.buffer);
              this._bodyInit = new Blob([this._bodyArrayBuffer]);
            } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
              this._bodyArrayBuffer = bufferClone(body);
            } else {
              throw new Error("unsupported BodyInit type");
            }
            if (!this.headers.get("content-type")) {
              if (typeof body === "string") {
                this.headers.set("content-type", "text/plain;charset=UTF-8");
              } else if (this._bodyBlob && this._bodyBlob.type) {
                this.headers.set("content-type", this._bodyBlob.type);
              } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
                this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
              }
            }
          };
          if (support.blob) {
            this.blob = function() {
              var rejected = consumed(this);
              if (rejected) {
                return rejected;
              }
              if (this._bodyBlob) {
                return Promise.resolve(this._bodyBlob);
              } else if (this._bodyArrayBuffer) {
                return Promise.resolve(new Blob([this._bodyArrayBuffer]));
              } else if (this._bodyFormData) {
                throw new Error("could not read FormData body as blob");
              } else {
                return Promise.resolve(new Blob([this._bodyText]));
              }
            };
            this.arrayBuffer = function() {
              if (this._bodyArrayBuffer) {
                return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
              } else {
                return this.blob().then(readBlobAsArrayBuffer);
              }
            };
          }
          this.text = function() {
            var rejected = consumed(this);
            if (rejected) {
              return rejected;
            }
            if (this._bodyBlob) {
              return readBlobAsText(this._bodyBlob);
            } else if (this._bodyArrayBuffer) {
              return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
            } else if (this._bodyFormData) {
              throw new Error("could not read FormData body as text");
            } else {
              return Promise.resolve(this._bodyText);
            }
          };
          if (support.formData) {
            this.formData = function() {
              return this.text().then(decode2);
            };
          }
          this.json = function() {
            return this.text().then(JSON.parse);
          };
          return this;
        }
        var methods = ["DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT"];
        function normalizeMethod(method) {
          var upcased = method.toUpperCase();
          return methods.indexOf(upcased) > -1 ? upcased : method;
        }
        function Request(input, options) {
          options = options || {};
          var body = options.body;
          if (input instanceof Request) {
            if (input.bodyUsed) {
              throw new TypeError("Already read");
            }
            this.url = input.url;
            this.credentials = input.credentials;
            if (!options.headers) {
              this.headers = new Headers(input.headers);
            }
            this.method = input.method;
            this.mode = input.mode;
            if (!body && input._bodyInit != null) {
              body = input._bodyInit;
              input.bodyUsed = true;
            }
          } else {
            this.url = String(input);
          }
          this.credentials = options.credentials || this.credentials || "omit";
          if (options.headers || !this.headers) {
            this.headers = new Headers(options.headers);
          }
          this.method = normalizeMethod(options.method || this.method || "GET");
          this.mode = options.mode || this.mode || null;
          this.referrer = null;
          if ((this.method === "GET" || this.method === "HEAD") && body) {
            throw new TypeError("Body not allowed for GET or HEAD requests");
          }
          this._initBody(body);
        }
        Request.prototype.clone = function() {
          return new Request(this, {body: this._bodyInit});
        };
        function decode2(body) {
          var form = new FormData();
          body.trim().split("&").forEach(function(bytes) {
            if (bytes) {
              var split = bytes.split("=");
              var name = split.shift().replace(/\+/g, " ");
              var value = split.join("=").replace(/\+/g, " ");
              form.append(decodeURIComponent(name), decodeURIComponent(value));
            }
          });
          return form;
        }
        function parseHeaders(rawHeaders) {
          var headers = new Headers();
          var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, " ");
          preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
            var parts = line.split(":");
            var key = parts.shift().trim();
            if (key) {
              var value = parts.join(":").trim();
              headers.append(key, value);
            }
          });
          return headers;
        }
        Body.call(Request.prototype);
        function Response(bodyInit, options) {
          if (!options) {
            options = {};
          }
          this.type = "default";
          this.status = options.status === void 0 ? 200 : options.status;
          this.ok = this.status >= 200 && this.status < 300;
          this.statusText = "statusText" in options ? options.statusText : "OK";
          this.headers = new Headers(options.headers);
          this.url = options.url || "";
          this._initBody(bodyInit);
        }
        Body.call(Response.prototype);
        Response.prototype.clone = function() {
          return new Response(this._bodyInit, {
            status: this.status,
            statusText: this.statusText,
            headers: new Headers(this.headers),
            url: this.url
          });
        };
        Response.error = function() {
          var response = new Response(null, {status: 0, statusText: ""});
          response.type = "error";
          return response;
        };
        var redirectStatuses = [301, 302, 303, 307, 308];
        Response.redirect = function(url, status) {
          if (redirectStatuses.indexOf(status) === -1) {
            throw new RangeError("Invalid status code");
          }
          return new Response(null, {status, headers: {location: url}});
        };
        self2.Headers = Headers;
        self2.Request = Request;
        self2.Response = Response;
        self2.fetch = function(input, init) {
          return new Promise(function(resolve, reject) {
            var request = new Request(input, init);
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
              var options = {
                status: xhr.status,
                statusText: xhr.statusText,
                headers: parseHeaders(xhr.getAllResponseHeaders() || "")
              };
              options.url = "responseURL" in xhr ? xhr.responseURL : options.headers.get("X-Request-URL");
              var body = "response" in xhr ? xhr.response : xhr.responseText;
              resolve(new Response(body, options));
            };
            xhr.onerror = function() {
              reject(new TypeError("Network request failed"));
            };
            xhr.ontimeout = function() {
              reject(new TypeError("Network request failed"));
            };
            xhr.open(request.method, request.url, true);
            if (request.credentials === "include") {
              xhr.withCredentials = true;
            } else if (request.credentials === "omit") {
              xhr.withCredentials = false;
            }
            if ("responseType" in xhr && support.blob) {
              xhr.responseType = "blob";
            }
            request.headers.forEach(function(value, name) {
              xhr.setRequestHeader(name, value);
            });
            xhr.send(typeof request._bodyInit === "undefined" ? null : request._bodyInit);
          });
        };
        self2.fetch.polyfill = true;
      })(typeof self !== "undefined" ? self : exports);
    });

    // index.ts
    var import_whatwg_fetch = __toModule(require_fetch());

    // node_modules/js-base64/base64.mjs
    var _hasatob = typeof atob === "function";
    var _hasbtoa = typeof btoa === "function";
    var _hasBuffer = typeof Buffer === "function";
    var _TD = typeof TextDecoder === "function" ? new TextDecoder() : void 0;
    var _TE = typeof TextEncoder === "function" ? new TextEncoder() : void 0;
    var b64ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var b64chs = [...b64ch];
    var b64tab = ((a) => {
      let tab = {};
      a.forEach((c, i) => tab[c] = i);
      return tab;
    })(b64chs);
    var b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
    var _fromCC = String.fromCharCode.bind(String);
    var _U8Afrom = typeof Uint8Array.from === "function" ? Uint8Array.from.bind(Uint8Array) : (it, fn = (x) => x) => new Uint8Array(Array.prototype.slice.call(it, 0).map(fn));
    var _mkUriSafe = (src) => src.replace(/[+\/]/g, (m0) => m0 == "+" ? "-" : "_").replace(/=+$/m, "");
    var _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, "");
    var btoaPolyfill = (bin) => {
      let u32, c0, c1, c2, asc = "";
      const pad = bin.length % 3;
      for (let i = 0; i < bin.length; ) {
        if ((c0 = bin.charCodeAt(i++)) > 255 || (c1 = bin.charCodeAt(i++)) > 255 || (c2 = bin.charCodeAt(i++)) > 255)
          throw new TypeError("invalid character found");
        u32 = c0 << 16 | c1 << 8 | c2;
        asc += b64chs[u32 >> 18 & 63] + b64chs[u32 >> 12 & 63] + b64chs[u32 >> 6 & 63] + b64chs[u32 & 63];
      }
      return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
    };
    var _btoa = _hasbtoa ? (bin) => btoa(bin) : _hasBuffer ? (bin) => Buffer.from(bin, "binary").toString("base64") : btoaPolyfill;
    var _fromUint8Array = _hasBuffer ? (u8a) => Buffer.from(u8a).toString("base64") : (u8a) => {
      const maxargs = 4096;
      let strs = [];
      for (let i = 0, l = u8a.length; i < l; i += maxargs) {
        strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
      }
      return _btoa(strs.join(""));
    };
    var cb_utob = (c) => {
      if (c.length < 2) {
        var cc = c.charCodeAt(0);
        return cc < 128 ? c : cc < 2048 ? _fromCC(192 | cc >>> 6) + _fromCC(128 | cc & 63) : _fromCC(224 | cc >>> 12 & 15) + _fromCC(128 | cc >>> 6 & 63) + _fromCC(128 | cc & 63);
      } else {
        var cc = 65536 + (c.charCodeAt(0) - 55296) * 1024 + (c.charCodeAt(1) - 56320);
        return _fromCC(240 | cc >>> 18 & 7) + _fromCC(128 | cc >>> 12 & 63) + _fromCC(128 | cc >>> 6 & 63) + _fromCC(128 | cc & 63);
      }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = (u) => u.replace(re_utob, cb_utob);
    var _encode = _hasBuffer ? (s) => Buffer.from(s, "utf8").toString("base64") : _TE ? (s) => _fromUint8Array(_TE.encode(s)) : (s) => _btoa(utob(s));
    var encode = (src, urlsafe = false) => urlsafe ? _mkUriSafe(_encode(src)) : _encode(src);
    var re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
    var cb_btou = (cccc) => {
      switch (cccc.length) {
        case 4:
          var cp = (7 & cccc.charCodeAt(0)) << 18 | (63 & cccc.charCodeAt(1)) << 12 | (63 & cccc.charCodeAt(2)) << 6 | 63 & cccc.charCodeAt(3), offset = cp - 65536;
          return _fromCC((offset >>> 10) + 55296) + _fromCC((offset & 1023) + 56320);
        case 3:
          return _fromCC((15 & cccc.charCodeAt(0)) << 12 | (63 & cccc.charCodeAt(1)) << 6 | 63 & cccc.charCodeAt(2));
        default:
          return _fromCC((31 & cccc.charCodeAt(0)) << 6 | 63 & cccc.charCodeAt(1));
      }
    };
    var btou = (b) => b.replace(re_btou, cb_btou);
    var atobPolyfill = (asc) => {
      asc = asc.replace(/\s+/g, "");
      if (!b64re.test(asc))
        throw new TypeError("malformed base64.");
      asc += "==".slice(2 - (asc.length & 3));
      let u24, bin = "", r1, r2;
      for (let i = 0; i < asc.length; ) {
        u24 = b64tab[asc.charAt(i++)] << 18 | b64tab[asc.charAt(i++)] << 12 | (r1 = b64tab[asc.charAt(i++)]) << 6 | (r2 = b64tab[asc.charAt(i++)]);
        bin += r1 === 64 ? _fromCC(u24 >> 16 & 255) : r2 === 64 ? _fromCC(u24 >> 16 & 255, u24 >> 8 & 255) : _fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255);
      }
      return bin;
    };
    var _atob = _hasatob ? (asc) => atob(_tidyB64(asc)) : _hasBuffer ? (asc) => Buffer.from(asc, "base64").toString("binary") : atobPolyfill;
    var _toUint8Array = _hasBuffer ? (a) => _U8Afrom(Buffer.from(a, "base64")) : (a) => _U8Afrom(_atob(a), (c) => c.charCodeAt(0));
    var _decode = _hasBuffer ? (a) => Buffer.from(a, "base64").toString("utf8") : _TD ? (a) => _TD.decode(_toUint8Array(a)) : (a) => btou(_atob(a));
    var _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == "-" ? "+" : "/"));
    var decode = (src) => _decode(_unURI(src));

    // api.gen.ts
    var NakamaApi = class {
      constructor(configuration) {
        this.configuration = configuration;
      }
      doFetch(urlPath, method, queryParams, body, options) {
        const urlQuery = "?" + Object.keys(queryParams).map((k) => {
          if (queryParams[k] instanceof Array) {
            return queryParams[k].reduce((prev, curr) => {
              return prev + encodeURIComponent(k) + "=" + encodeURIComponent(curr) + "&";
            }, "");
          } else {
            if (queryParams[k] != null) {
              return encodeURIComponent(k) + "=" + encodeURIComponent(queryParams[k]) + "&";
            }
          }
        }).join("");
        const fetchOptions = __assign(__assign({}, {method}), options);
        fetchOptions.headers = __assign({}, options.headers);
        const descriptor = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "withCredentials");
        if (!(descriptor == null ? void 0 : descriptor.set)) {
          fetchOptions.credentials = "cocos-ignore";
        }
        if (this.configuration.bearerToken) {
          fetchOptions.headers["Authorization"] = "Bearer " + this.configuration.bearerToken;
        } else if (this.configuration.username) {
          fetchOptions.headers["Authorization"] = "Basic " + encode(this.configuration.username + ":" + this.configuration.password);
        }
        if (!Object.keys(fetchOptions.headers).includes("Accept")) {
          fetchOptions.headers["Accept"] = "application/json";
        }
        if (!Object.keys(fetchOptions.headers).includes("Content-Type")) {
          fetchOptions.headers["Content-Type"] = "application/json";
        }
        Object.keys(fetchOptions.headers).forEach((key) => {
          if (!fetchOptions.headers[key]) {
            delete fetchOptions.headers[key];
          }
        });
        fetchOptions.body = body;
        return Promise.race([
          fetch(this.configuration.basePath + urlPath + urlQuery, fetchOptions).then((response) => {
            if (response.status == 204) {
              return response;
            } else if (response.status >= 200 && response.status < 300) {
              return response.json();
            } else {
              throw response;
            }
          }),
          new Promise((_, reject) => setTimeout(reject, this.configuration.timeoutMs, "Request timed out."))
        ]);
      }
      healthcheck(options = {}) {
        const urlPath = "/healthcheck";
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      getAccount(options = {}) {
        const urlPath = "/v2/account";
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      updateAccount(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "PUT", queryParams, _body, options);
      }
      authenticateApple(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/apple";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateCustom(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/custom";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateDevice(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/device";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateEmail(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/email";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateFacebook(body, create, username, sync, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/facebook";
        const queryParams = {
          create,
          username,
          sync
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateFacebookInstantGame(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/facebookinstantgame";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateGameCenter(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/gamecenter";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateGoogle(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/google";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      authenticateSteam(body, create, username, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/authenticate/steam";
        const queryParams = {
          create,
          username
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkApple(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/apple";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkCustom(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/custom";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkDevice(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/device";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkEmail(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/email";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkFacebook(body, sync, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/facebook";
        const queryParams = {
          sync
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkFacebookInstantGame(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/facebookinstantgame";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkGameCenter(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/gamecenter";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkGoogle(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/google";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      linkSteam(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/link/steam";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      sessionRefresh(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/session/refresh";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkApple(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/apple";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkCustom(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/custom";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkDevice(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/device";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkEmail(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/email";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkFacebook(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/facebook";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkFacebookInstantGame(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/facebookinstantgame";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkGameCenter(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/gamecenter";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkGoogle(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/google";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      unlinkSteam(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/account/unlink/steam";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      listChannelMessages(channelId, limit, forward, cursor, options = {}) {
        if (channelId === null || channelId === void 0) {
          throw new Error("'channelId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/channel/{channelId}".replace("{channelId}", encodeURIComponent(String(channelId)));
        const queryParams = {
          limit,
          forward,
          cursor
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      event(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/event";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      deleteFriends(ids, usernames, options = {}) {
        const urlPath = "/v2/friend";
        const queryParams = {
          ids,
          usernames
        };
        let _body = null;
        return this.doFetch(urlPath, "DELETE", queryParams, _body, options);
      }
      listFriends(limit, state, cursor, options = {}) {
        const urlPath = "/v2/friend";
        const queryParams = {
          limit,
          state,
          cursor
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      addFriends(ids, usernames, options = {}) {
        const urlPath = "/v2/friend";
        const queryParams = {
          ids,
          usernames
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      blockFriends(ids, usernames, options = {}) {
        const urlPath = "/v2/friend/block";
        const queryParams = {
          ids,
          usernames
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      importFacebookFriends(body, reset, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/friend/facebook";
        const queryParams = {
          reset
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      listGroups(name, cursor, limit, options = {}) {
        const urlPath = "/v2/group";
        const queryParams = {
          name,
          cursor,
          limit
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      createGroup(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      deleteGroup(groupId, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "DELETE", queryParams, _body, options);
      }
      updateGroup(groupId, body, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "PUT", queryParams, _body, options);
      }
      addGroupUsers(groupId, userIds, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/add".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {
          user_ids: userIds
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      banGroupUsers(groupId, userIds, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/ban".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {
          user_ids: userIds
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      demoteGroupUsers(groupId, userIds, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        if (userIds === null || userIds === void 0) {
          throw new Error("'userIds' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/demote".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {
          user_ids: userIds
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      joinGroup(groupId, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/join".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      kickGroupUsers(groupId, userIds, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/kick".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {
          user_ids: userIds
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      leaveGroup(groupId, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/leave".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      promoteGroupUsers(groupId, userIds, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/promote".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {
          user_ids: userIds
        };
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      listGroupUsers(groupId, limit, state, cursor, options = {}) {
        if (groupId === null || groupId === void 0) {
          throw new Error("'groupId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/group/{groupId}/user".replace("{groupId}", encodeURIComponent(String(groupId)));
        const queryParams = {
          limit,
          state,
          cursor
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      deleteLeaderboardRecord(leaderboardId, options = {}) {
        if (leaderboardId === null || leaderboardId === void 0) {
          throw new Error("'leaderboardId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/leaderboard/{leaderboardId}".replace("{leaderboardId}", encodeURIComponent(String(leaderboardId)));
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "DELETE", queryParams, _body, options);
      }
      listLeaderboardRecords(leaderboardId, ownerIds, limit, cursor, expiry, options = {}) {
        if (leaderboardId === null || leaderboardId === void 0) {
          throw new Error("'leaderboardId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/leaderboard/{leaderboardId}".replace("{leaderboardId}", encodeURIComponent(String(leaderboardId)));
        const queryParams = {
          ownerIds,
          limit,
          cursor,
          expiry
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      writeLeaderboardRecord(leaderboardId, body, options = {}) {
        if (leaderboardId === null || leaderboardId === void 0) {
          throw new Error("'leaderboardId' is a required parameter but is null or undefined.");
        }
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/leaderboard/{leaderboardId}".replace("{leaderboardId}", encodeURIComponent(String(leaderboardId)));
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      listLeaderboardRecordsAroundOwner(leaderboardId, ownerId, limit, expiry, options = {}) {
        if (leaderboardId === null || leaderboardId === void 0) {
          throw new Error("'leaderboardId' is a required parameter but is null or undefined.");
        }
        if (ownerId === null || ownerId === void 0) {
          throw new Error("'ownerId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/leaderboard/{leaderboardId}/owner/{ownerId}".replace("{leaderboardId}", encodeURIComponent(String(leaderboardId))).replace("{ownerId}", encodeURIComponent(String(ownerId)));
        const queryParams = {
          limit,
          expiry
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      listMatches(limit, authoritative, label, minSize, maxSize, query, options = {}) {
        const urlPath = "/v2/match";
        const queryParams = {
          limit,
          authoritative,
          label,
          minSize,
          maxSize,
          query
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      deleteNotifications(ids, options = {}) {
        const urlPath = "/v2/notification";
        const queryParams = {
          ids
        };
        let _body = null;
        return this.doFetch(urlPath, "DELETE", queryParams, _body, options);
      }
      listNotifications(limit, cacheableCursor, options = {}) {
        const urlPath = "/v2/notification";
        const queryParams = {
          limit,
          cacheableCursor
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      rpcFunc2(id, payload, httpKey, options = {}) {
        if (id === null || id === void 0) {
          throw new Error("'id' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/rpc/{id}".replace("{id}", encodeURIComponent(String(id)));
        const queryParams = {
          payload,
          httpKey
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      rpcFunc(id, body, httpKey, options = {}) {
        if (id === null || id === void 0) {
          throw new Error("'id' is a required parameter but is null or undefined.");
        }
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/rpc/{id}".replace("{id}", encodeURIComponent(String(id)));
        const queryParams = {
          httpKey
        };
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      readStorageObjects(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/storage";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      writeStorageObjects(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/storage";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "PUT", queryParams, _body, options);
      }
      deleteStorageObjects(body, options = {}) {
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/storage/delete";
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "PUT", queryParams, _body, options);
      }
      listStorageObjects(collection, userId, limit, cursor, options = {}) {
        if (collection === null || collection === void 0) {
          throw new Error("'collection' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/storage/{collection}".replace("{collection}", encodeURIComponent(String(collection)));
        const queryParams = {
          userId,
          limit,
          cursor
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      listStorageObjects2(collection, userId, limit, cursor, options = {}) {
        if (collection === null || collection === void 0) {
          throw new Error("'collection' is a required parameter but is null or undefined.");
        }
        if (userId === null || userId === void 0) {
          throw new Error("'userId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/storage/{collection}/{userId}".replace("{collection}", encodeURIComponent(String(collection))).replace("{userId}", encodeURIComponent(String(userId)));
        const queryParams = {
          limit,
          cursor
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      listTournaments(categoryStart, categoryEnd, startTime, endTime, limit, cursor, options = {}) {
        const urlPath = "/v2/tournament";
        const queryParams = {
          categoryStart,
          categoryEnd,
          startTime,
          endTime,
          limit,
          cursor
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      listTournamentRecords(tournamentId, ownerIds, limit, cursor, expiry, options = {}) {
        if (tournamentId === null || tournamentId === void 0) {
          throw new Error("'tournamentId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/tournament/{tournamentId}".replace("{tournamentId}", encodeURIComponent(String(tournamentId)));
        const queryParams = {
          ownerIds,
          limit,
          cursor,
          expiry
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      writeTournamentRecord(tournamentId, body, options = {}) {
        if (tournamentId === null || tournamentId === void 0) {
          throw new Error("'tournamentId' is a required parameter but is null or undefined.");
        }
        if (body === null || body === void 0) {
          throw new Error("'body' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/tournament/{tournamentId}".replace("{tournamentId}", encodeURIComponent(String(tournamentId)));
        const queryParams = {};
        let _body = null;
        _body = JSON.stringify(body || {});
        return this.doFetch(urlPath, "PUT", queryParams, _body, options);
      }
      joinTournament(tournamentId, options = {}) {
        if (tournamentId === null || tournamentId === void 0) {
          throw new Error("'tournamentId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/tournament/{tournamentId}/join".replace("{tournamentId}", encodeURIComponent(String(tournamentId)));
        const queryParams = {};
        let _body = null;
        return this.doFetch(urlPath, "POST", queryParams, _body, options);
      }
      listTournamentRecordsAroundOwner(tournamentId, ownerId, limit, expiry, options = {}) {
        if (tournamentId === null || tournamentId === void 0) {
          throw new Error("'tournamentId' is a required parameter but is null or undefined.");
        }
        if (ownerId === null || ownerId === void 0) {
          throw new Error("'ownerId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/tournament/{tournamentId}/owner/{ownerId}".replace("{tournamentId}", encodeURIComponent(String(tournamentId))).replace("{ownerId}", encodeURIComponent(String(ownerId)));
        const queryParams = {
          limit,
          expiry
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      getUsers(ids, usernames, facebookIds, options = {}) {
        const urlPath = "/v2/user";
        const queryParams = {
          ids,
          usernames,
          facebookIds
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
      listUserGroups(userId, limit, state, cursor, options = {}) {
        if (userId === null || userId === void 0) {
          throw new Error("'userId' is a required parameter but is null or undefined.");
        }
        const urlPath = "/v2/user/{userId}/group".replace("{userId}", encodeURIComponent(String(userId)));
        const queryParams = {
          limit,
          state,
          cursor
        };
        let _body = null;
        return this.doFetch(urlPath, "GET", queryParams, _body, options);
      }
    };

    // session.ts
    var Session = class {
      constructor(token, created_at, expires_at, username, user_id, vars) {
        this.token = token;
        this.created_at = created_at;
        this.expires_at = expires_at;
        this.username = username;
        this.user_id = user_id;
        this.vars = vars;
      }
      isexpired(currenttime) {
        return this.expires_at - currenttime < 0;
      }
      static restore(jwt) {
        const createdAt = Math.floor(new Date().getTime() / 1e3);
        const parts = jwt.split(".");
        if (parts.length != 3) {
          throw "jwt is not valid.";
        }
        const decoded = JSON.parse(atob(parts[1]));
        const expiresAt = Math.floor(parseInt(decoded["exp"]));
        return new Session(jwt, createdAt, expiresAt, decoded["usn"], decoded["uid"], decoded["vrs"]);
      }
    };

    // web_socket_adapter.ts
    var WebSocketAdapterText = class {
      constructor() {
        this._isConnected = false;
      }
      get onClose() {
        return this._socket.onclose;
      }
      set onClose(value) {
        this._socket.onclose = value;
      }
      get onError() {
        return this._socket.onerror;
      }
      set onError(value) {
        this._socket.onerror = value;
      }
      get onMessage() {
        return this._socket.onmessage;
      }
      set onMessage(value) {
        if (value) {
          this._socket.onmessage = (evt) => {
            const message = JSON.parse(evt.data);
            value(message);
          };
        } else {
          value = null;
        }
      }
      get onOpen() {
        return this._socket.onopen;
      }
      set onOpen(value) {
        this._socket.onopen = value;
      }
      get isConnected() {
        return this._isConnected;
      }
      connect(scheme, host, port, createStatus, token) {
        const url = `${scheme}${host}:${port}/ws?lang=en&status=${encodeURIComponent(createStatus.toString())}&token=${encodeURIComponent(token)}`;
        this._socket = new WebSocket(url);
        this._isConnected = true;
      }
      close() {
        this._isConnected = false;
        this._socket.close();
        this._socket = void 0;
      }
      send(msg) {
        if (msg.match_data_send) {
          msg.match_data_send.op_code = msg.match_data_send.op_code.toString();
        }
        this._socket.send(JSON.stringify(msg));
      }
    };

    // utils.ts
    function b64EncodeUnicode(str) {
      return encode(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(_match, p1) {
        return String.fromCharCode(Number("0x" + p1));
      }));
    }
    function b64DecodeUnicode(str) {
      return decodeURIComponent(decode(str).split("").map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(""));
    }

    // socket.ts
    var DefaultSocket = class {
      constructor(host, port, useSSL = false, verbose = false, adapter = new WebSocketAdapterText()) {
        this.host = host;
        this.port = port;
        this.useSSL = useSSL;
        this.verbose = verbose;
        this.adapter = adapter;
        this.cIds = {};
        this.nextCid = 1;
      }
      generatecid() {
        const cid = this.nextCid.toString();
        ++this.nextCid;
        return cid;
      }
      connect(session, createStatus = false) {
        if (this.adapter.isConnected) {
          return Promise.resolve(session);
        }
        const scheme = this.useSSL ? "wss://" : "ws://";
        this.adapter.connect(scheme, this.host, this.port, createStatus, session.token);
        this.adapter.onClose = (evt) => {
          this.ondisconnect(evt);
        };
        this.adapter.onError = (evt) => {
          this.onerror(evt);
        };
        this.adapter.onMessage = (message) => {
          if (this.verbose && window && window.console) {
            console.log("Response: %o", message);
          }
          if (message.cid == void 0) {
            if (message.notifications) {
              message.notifications.notifications.forEach((n) => {
                n.content = n.content ? JSON.parse(n.content) : void 0;
                this.onnotification(n);
              });
            } else if (message.match_data) {
              message.match_data.data = message.match_data.data != null ? JSON.parse(b64DecodeUnicode(message.match_data.data)) : null;
              message.match_data.op_code = parseInt(message.match_data.op_code);
              this.onmatchdata(message.match_data);
            } else if (message.match_presence_event) {
              this.onmatchpresence(message.match_presence_event);
            } else if (message.matchmaker_matched) {
              this.onmatchmakermatched(message.matchmaker_matched);
            } else if (message.status_presence_event) {
              this.onstatuspresence(message.status_presence_event);
            } else if (message.stream_presence_event) {
              this.onstreampresence(message.stream_presence_event);
            } else if (message.stream_data) {
              this.onstreamdata(message.stream_data);
            } else if (message.channel_message) {
              message.channel_message.content = JSON.parse(message.channel_message.content);
              this.onchannelmessage(message.channel_message);
            } else if (message.channel_presence_event) {
              this.onchannelpresence(message.channel_presence_event);
            } else {
              if (this.verbose && window && window.console) {
                console.log("Unrecognized message received: %o", message);
              }
            }
          } else {
            const executor = this.cIds[message.cid];
            if (!executor) {
              if (this.verbose && window && window.console) {
                console.error("No promise executor for message: %o", message);
              }
              return;
            }
            delete this.cIds[message.cid];
            if (message.error) {
              executor.reject(message.error);
            } else {
              executor.resolve(message);
            }
          }
        };
        return new Promise((resolve, reject) => {
          this.adapter.onOpen = (evt) => {
            if (this.verbose && window && window.console) {
              console.log(evt);
            }
            resolve(session);
          };
          this.adapter.onError = (evt) => {
            reject(evt);
            this.adapter.close();
          };
        });
      }
      disconnect(fireDisconnectEvent = true) {
        if (this.adapter.isConnected) {
          this.adapter.close();
        }
        if (fireDisconnectEvent) {
          this.ondisconnect({});
        }
      }
      ondisconnect(evt) {
        if (this.verbose && window && window.console) {
          console.log(evt);
        }
      }
      onerror(evt) {
        if (this.verbose && window && window.console) {
          console.log(evt);
        }
      }
      onchannelmessage(channelMessage) {
        if (this.verbose && window && window.console) {
          console.log(channelMessage);
        }
      }
      onchannelpresence(channelPresence) {
        if (this.verbose && window && window.console) {
          console.log(channelPresence);
        }
      }
      onnotification(notification) {
        if (this.verbose && window && window.console) {
          console.log(notification);
        }
      }
      onmatchdata(matchData) {
        if (this.verbose && window && window.console) {
          console.log(matchData);
        }
      }
      onmatchpresence(matchPresence) {
        if (this.verbose && window && window.console) {
          console.log(matchPresence);
        }
      }
      onmatchmakermatched(matchmakerMatched) {
        if (this.verbose && window && window.console) {
          console.log(matchmakerMatched);
        }
      }
      onstatuspresence(statusPresence) {
        if (this.verbose && window && window.console) {
          console.log(statusPresence);
        }
      }
      onstreampresence(streamPresence) {
        if (this.verbose && window && window.console) {
          console.log(streamPresence);
        }
      }
      onstreamdata(streamData) {
        if (this.verbose && window && window.console) {
          console.log(streamData);
        }
      }
      send(message) {
        const untypedMessage = message;
        return new Promise((resolve, reject) => {
          if (!this.adapter.isConnected) {
            reject("Socket connection has not been established yet.");
          } else {
            if (untypedMessage.match_data_send) {
              untypedMessage.match_data_send.data = b64EncodeUnicode(JSON.stringify(untypedMessage.match_data_send.data));
              this.adapter.send(untypedMessage);
              resolve();
            } else {
              if (untypedMessage.channel_message_send) {
                untypedMessage.channel_message_send.content = JSON.stringify(untypedMessage.channel_message_send.content);
              } else if (untypedMessage.channel_message_update) {
                untypedMessage.channel_message_update.content = JSON.stringify(untypedMessage.channel_message_update.content);
              }
              const cid = this.generatecid();
              this.cIds[cid] = {resolve, reject};
              untypedMessage.cid = cid;
              this.adapter.send(untypedMessage);
            }
          }
          if (this.verbose && window && window.console) {
            console.log("Sent message: %o", untypedMessage);
          }
        });
      }
      addMatchmaker(query, minCount, maxCount, stringProperties, numericProperties) {
        return __async(this, null, function* () {
          const matchMakerAdd = {
            matchmaker_add: {
              min_count: minCount,
              max_count: maxCount,
              query,
              string_properties: stringProperties,
              numeric_properties: numericProperties
            }
          };
          const response = yield this.send(matchMakerAdd);
          return response.matchmaker_ticket;
        });
      }
      createMatch() {
        return __async(this, null, function* () {
          const response = yield this.send({match_create: {}});
          return response.match;
        });
      }
      followUsers(userIds) {
        return __async(this, null, function* () {
          const response = yield this.send({status_follow: {user_ids: userIds}});
          return response.status;
        });
      }
      joinChat(target, type, persistence, hidden) {
        return __async(this, null, function* () {
          const response = yield this.send({
            channel_join: {
              target,
              type,
              persistence,
              hidden
            }
          });
          return response.channel;
        });
      }
      joinMatch(match_id, token, metadata) {
        return __async(this, null, function* () {
          const join = {match_join: {metadata}};
          if (token) {
            join.match_join.token = token;
          } else {
            join.match_join.match_id = match_id;
          }
          const response = yield this.send(join);
          return response.match;
        });
      }
      leaveChat(channel_id) {
        return this.send({channel_leave: {channel_id}});
      }
      leaveMatch(matchId) {
        return this.send({match_leave: {match_id: matchId}});
      }
      removeChatMessage(channel_id, message_id) {
        return __async(this, null, function* () {
          const response = yield this.send({
            channel_message_remove: {
              channel_id,
              message_id
            }
          });
          return response.channel_message_ack;
        });
      }
      removeMatchmaker(ticket) {
        return this.send({matchmaker_remove: {ticket}});
      }
      rpc(id, payload, http_key) {
        return __async(this, null, function* () {
          const response = yield this.send({
            rpc: {
              id,
              payload,
              http_key
            }
          });
          return response.rpc;
        });
      }
      sendMatchState(matchId, opCode, data, presences) {
        return __async(this, null, function* () {
          return this.send({
            match_data_send: {
              match_id: matchId,
              op_code: opCode,
              data,
              presences: presences != null ? presences : []
            }
          });
        });
      }
      unfollowUsers(user_ids) {
        return this.send({status_unfollow: {user_ids}});
      }
      updateChatMessage(channel_id, message_id, content) {
        return __async(this, null, function* () {
          const response = yield this.send({channel_message_update: {channel_id, message_id, content}});
          return response.channel_message_ack;
        });
      }
      updateStatus(status) {
        return this.send({status_update: {status}});
      }
      writeChatMessage(channel_id, content) {
        return __async(this, null, function* () {
          const response = yield this.send({channel_message_send: {channel_id, content}});
          return response.channel_message_ack;
        });
      }
    };

    // client.ts
    var DEFAULT_HOST = "127.0.0.1";
    var DEFAULT_PORT = "7350";
    var DEFAULT_SERVER_KEY = "defaultkey";
    var DEFAULT_TIMEOUT_MS = 7e3;
    var Client = class {
      constructor(serverkey = DEFAULT_SERVER_KEY, host = DEFAULT_HOST, port = DEFAULT_PORT, useSSL = false, timeout = DEFAULT_TIMEOUT_MS) {
        this.serverkey = serverkey;
        this.host = host;
        this.port = port;
        this.useSSL = useSSL;
        this.timeout = timeout;
        const scheme = useSSL ? "https://" : "http://";
        const basePath = `${scheme}${host}:${port}`;
        this.configuration = {
          basePath,
          username: serverkey,
          password: "",
          timeoutMs: timeout
        };
        this.apiClient = new NakamaApi(this.configuration);
      }
      addGroupUsers(session, groupId, ids) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.addGroupUsers(groupId, ids).then((response) => {
          return response !== void 0;
        });
      }
      addFriends(session, ids, usernames) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.addFriends(ids, usernames).then((response) => {
          return response !== void 0;
        });
      }
      authenticateApple(token, create, username, vars = new Map(), options = {}) {
        const request = {
          token,
          vars
        };
        return this.apiClient.authenticateApple(request, create, username, options).then((apiSession) => {
          return Session.restore(apiSession.token || "");
        });
      }
      authenticateCustom(id, create, username, vars = new Map(), options = {}) {
        const request = {
          id,
          vars
        };
        return this.apiClient.authenticateCustom(request, create, username, options).then((apiSession) => {
          return Session.restore(apiSession.token || "");
        });
      }
      authenticateDevice(id, create, username, vars) {
        const request = {
          id,
          vars
        };
        return this.apiClient.authenticateDevice(request, create, username).then((apiSession) => {
          return Session.restore(apiSession.token || "");
        });
      }
      authenticateEmail(email, password, create, username, vars) {
        const request = {
          email,
          password,
          vars
        };
        return this.apiClient.authenticateEmail(request, create, username).then((apiSession) => {
          return Session.restore(apiSession.token || "");
        });
      }
      authenticateFacebookInstantGame(signedPlayerInfo, create, username, vars, options = {}) {
        const request = {
          signed_player_info: signedPlayerInfo,
          vars
        };
        return this.apiClient.authenticateFacebookInstantGame({signed_player_info: request.signed_player_info, vars: request.vars}, create, username, options).then((apiSession) => {
          return Session.restore(apiSession.token || "");
        });
      }
      authenticateFacebook(token, create, username, sync, vars, options = {}) {
        const request = {
          token,
          vars
        };
        return this.apiClient.authenticateFacebook(request, create, username, sync, options).then((apiSession) => {
          return Session.restore(apiSession.token || "");
        });
      }
      authenticateGoogle(token, create, username, vars, options = {}) {
        const request = {
          token,
          vars
        };
        return this.apiClient.authenticateGoogle(request, create, username, options).then((apiSession) => {
          return Session.restore(apiSession.token || "");
        });
      }
      authenticateGameCenter(token, create, username, vars) {
        const request = {
          token,
          vars
        };
        return this.apiClient.authenticateGameCenter(request, create, username).then((apiSession) => {
          return Session.restore(apiSession.token || "");
        });
      }
      authenticateSteam(token, create, username, vars) {
        const request = {
          token,
          vars
        };
        return this.apiClient.authenticateSteam(request, create, username).then((apiSession) => {
          return Session.restore(apiSession.token || "");
        });
      }
      banGroupUsers(session, groupId, ids) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.banGroupUsers(groupId, ids).then((response) => {
          return response !== void 0;
        });
      }
      blockFriends(session, ids, usernames) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.blockFriends(ids, usernames).then((response) => {
          return Promise.resolve(response != void 0);
        });
      }
      createGroup(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.createGroup(request).then((response) => {
          return Promise.resolve({
            avatar_url: response.avatar_url,
            create_time: response.create_time,
            creator_id: response.creator_id,
            description: response.description,
            edge_count: response.edge_count ? Number(response.edge_count) : 0,
            id: response.id,
            lang_tag: response.lang_tag,
            max_count: response.max_count ? Number(response.max_count) : 0,
            metadata: response.metadata ? JSON.parse(response.metadata) : void 0,
            name: response.name,
            open: response.open,
            update_time: response.update_time
          });
        });
      }
      createSocket(useSSL = false, verbose = false, adapter = new WebSocketAdapterText()) {
        return new DefaultSocket(this.host, this.port, useSSL, verbose, adapter);
      }
      deleteFriends(session, ids, usernames) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.deleteFriends(ids, usernames).then((response) => {
          return response !== void 0;
        });
      }
      deleteGroup(session, groupId) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.deleteGroup(groupId).then((response) => {
          return response !== void 0;
        });
      }
      deleteNotifications(session, ids) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.deleteNotifications(ids).then((response) => {
          return Promise.resolve(response != void 0);
        });
      }
      deleteStorageObjects(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.deleteStorageObjects(request).then((response) => {
          return Promise.resolve(response != void 0);
        });
      }
      demoteGroupUsers(session, groupId, ids) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.demoteGroupUsers(groupId, ids);
      }
      emitEvent(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.event(request).then((response) => {
          return Promise.resolve(response != void 0);
        });
      }
      getAccount(session) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.getAccount();
      }
      importFacebookFriends(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.importFacebookFriends(request).then((response) => {
          return response !== void 0;
        });
      }
      getUsers(session, ids, usernames, facebookIds) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.getUsers(ids, usernames, facebookIds).then((response) => {
          var result = {
            users: []
          };
          if (response.users == null) {
            return Promise.resolve(result);
          }
          response.users.forEach((u) => {
            result.users.push({
              avatar_url: u.avatar_url,
              create_time: u.create_time,
              display_name: u.display_name,
              edge_count: u.edge_count ? Number(u.edge_count) : 0,
              facebook_id: u.facebook_id,
              gamecenter_id: u.gamecenter_id,
              google_id: u.google_id,
              id: u.id,
              lang_tag: u.lang_tag,
              location: u.location,
              online: u.online,
              steam_id: u.steam_id,
              timezone: u.timezone,
              update_time: u.update_time,
              username: u.username,
              metadata: u.metadata ? JSON.parse(u.metadata) : void 0
            });
          });
          return Promise.resolve(result);
        });
      }
      joinGroup(session, groupId) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.joinGroup(groupId, {}).then((response) => {
          return response !== void 0;
        });
      }
      joinTournament(session, tournamentId) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.joinTournament(tournamentId, {}).then((response) => {
          return response !== void 0;
        });
      }
      kickGroupUsers(session, groupId, ids) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.kickGroupUsers(groupId, ids).then((response) => {
          return Promise.resolve(response != void 0);
        });
      }
      leaveGroup(session, groupId) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.leaveGroup(groupId, {}).then((response) => {
          return response !== void 0;
        });
      }
      listChannelMessages(session, channelId, limit, forward, cursor) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listChannelMessages(channelId, limit, forward, cursor).then((response) => {
          var result = {
            messages: [],
            next_cursor: response.next_cursor,
            prev_cursor: response.prev_cursor
          };
          if (response.messages == null) {
            return Promise.resolve(result);
          }
          response.messages.forEach((m) => {
            result.messages.push({
              channel_id: m.channel_id,
              code: m.code ? Number(m.code) : 0,
              create_time: m.create_time,
              message_id: m.message_id,
              persistent: m.persistent,
              sender_id: m.sender_id,
              update_time: m.update_time,
              username: m.username,
              content: m.content ? JSON.parse(m.content) : void 0,
              group_id: m.group_id,
              room_name: m.room_name,
              user_id_one: m.user_id_one,
              user_id_two: m.user_id_two
            });
          });
          return Promise.resolve(result);
        });
      }
      listGroupUsers(session, groupId, state, limit, cursor) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listGroupUsers(groupId, limit, state, cursor).then((response) => {
          var result = {
            group_users: [],
            cursor: response.cursor
          };
          if (response.group_users == null) {
            return Promise.resolve(result);
          }
          response.group_users.forEach((gu) => {
            result.group_users.push({
              user: {
                avatar_url: gu.user.avatar_url,
                create_time: gu.user.create_time,
                display_name: gu.user.display_name,
                edge_count: gu.user.edge_count ? Number(gu.user.edge_count) : 0,
                facebook_id: gu.user.facebook_id,
                gamecenter_id: gu.user.gamecenter_id,
                google_id: gu.user.google_id,
                id: gu.user.id,
                lang_tag: gu.user.lang_tag,
                location: gu.user.location,
                online: gu.user.online,
                steam_id: gu.user.steam_id,
                timezone: gu.user.timezone,
                update_time: gu.user.update_time,
                username: gu.user.username,
                metadata: gu.user.metadata ? JSON.parse(gu.user.metadata) : void 0
              },
              state: gu.state ? Number(gu.state) : 0
            });
          });
          return Promise.resolve(result);
        });
      }
      listUserGroups(session, userId, state, limit, cursor) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listUserGroups(userId, state, limit, cursor).then((response) => {
          var result = {
            user_groups: [],
            cursor: response.cursor
          };
          if (response.user_groups == null) {
            return Promise.resolve(result);
          }
          response.user_groups.forEach((ug) => {
            result.user_groups.push({
              group: {
                avatar_url: ug.group.avatar_url,
                create_time: ug.group.create_time,
                creator_id: ug.group.creator_id,
                description: ug.group.description,
                edge_count: ug.group.edge_count ? Number(ug.group.edge_count) : 0,
                id: ug.group.id,
                lang_tag: ug.group.lang_tag,
                max_count: ug.group.max_count,
                metadata: ug.group.metadata ? JSON.parse(ug.group.metadata) : void 0,
                name: ug.group.name,
                open: ug.group.open,
                update_time: ug.group.update_time
              },
              state: ug.state ? Number(ug.state) : 0
            });
          });
          return Promise.resolve(result);
        });
      }
      listGroups(session, name, cursor, limit) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listGroups(name, cursor, limit).then((response) => {
          var result = {
            groups: []
          };
          if (response.groups == null) {
            return Promise.resolve(result);
          }
          result.cursor = response.cursor;
          response.groups.forEach((ug) => {
            result.groups.push({
              avatar_url: ug.avatar_url,
              create_time: ug.create_time,
              creator_id: ug.creator_id,
              description: ug.description,
              edge_count: ug.edge_count ? Number(ug.edge_count) : 0,
              id: ug.id,
              lang_tag: ug.lang_tag,
              max_count: ug.max_count,
              metadata: ug.metadata ? JSON.parse(ug.metadata) : void 0,
              name: ug.name,
              open: ug.open,
              update_time: ug.update_time
            });
          });
          return Promise.resolve(result);
        });
      }
      linkApple(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.linkApple(request).then((response) => {
          return response !== void 0;
        });
      }
      linkCustom(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.linkCustom(request).then((response) => {
          return response !== void 0;
        });
      }
      linkDevice(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.linkDevice(request).then((response) => {
          return response !== void 0;
        });
      }
      linkEmail(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.linkEmail(request).then((response) => {
          return response !== void 0;
        });
      }
      linkFacebook(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.linkFacebook(request).then((response) => {
          return response !== void 0;
        });
      }
      linkFacebookInstantGame(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.linkFacebookInstantGame(request).then((response) => {
          return response !== void 0;
        });
      }
      linkGoogle(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.linkGoogle(request).then((response) => {
          return response !== void 0;
        });
      }
      linkGameCenter(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.linkGameCenter(request).then((response) => {
          return response !== void 0;
        });
      }
      linkSteam(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.linkSteam(request).then((response) => {
          return response !== void 0;
        });
      }
      listFriends(session, state, limit, cursor) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listFriends(limit, state, cursor).then((response) => {
          var result = {
            friends: [],
            cursor: response.cursor
          };
          if (response.friends == null) {
            return Promise.resolve(result);
          }
          response.friends.forEach((f) => {
            result.friends.push({
              user: {
                avatar_url: f.user.avatar_url,
                create_time: f.user.create_time,
                display_name: f.user.display_name,
                edge_count: f.user.edge_count ? Number(f.user.edge_count) : 0,
                facebook_id: f.user.facebook_id,
                gamecenter_id: f.user.gamecenter_id,
                google_id: f.user.google_id,
                id: f.user.id,
                lang_tag: f.user.lang_tag,
                location: f.user.location,
                online: f.user.online,
                steam_id: f.user.steam_id,
                timezone: f.user.timezone,
                update_time: f.user.update_time,
                username: f.user.username,
                metadata: f.user.metadata ? JSON.parse(f.user.metadata) : void 0,
                facebook_instant_game_id: f.user.facebook_instant_game_id
              },
              state: f.state
            });
          });
          return Promise.resolve(result);
        });
      }
      listLeaderboardRecords(session, leaderboardId, ownerIds, limit, cursor, expiry) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listLeaderboardRecords(leaderboardId, ownerIds, limit, cursor, expiry).then((response) => {
          var list = {
            next_cursor: response.next_cursor,
            prev_cursor: response.prev_cursor,
            owner_records: [],
            records: []
          };
          if (response.owner_records != null) {
            response.owner_records.forEach((o) => {
              list.owner_records.push({
                expiry_time: o.expiry_time,
                leaderboard_id: o.leaderboard_id,
                metadata: o.metadata ? JSON.parse(o.metadata) : void 0,
                num_score: o.num_score ? Number(o.num_score) : 0,
                owner_id: o.owner_id,
                rank: o.rank ? Number(o.rank) : 0,
                score: o.score ? Number(o.score) : 0,
                subscore: o.subscore ? Number(o.subscore) : 0,
                update_time: o.update_time,
                username: o.username,
                max_num_score: o.max_num_score ? Number(o.max_num_score) : 0
              });
            });
          }
          if (response.records != null) {
            response.records.forEach((o) => {
              list.records.push({
                expiry_time: o.expiry_time,
                leaderboard_id: o.leaderboard_id,
                metadata: o.metadata ? JSON.parse(o.metadata) : void 0,
                num_score: o.num_score ? Number(o.num_score) : 0,
                owner_id: o.owner_id,
                rank: o.rank ? Number(o.rank) : 0,
                score: o.score ? Number(o.score) : 0,
                subscore: o.subscore ? Number(o.subscore) : 0,
                update_time: o.update_time,
                username: o.username,
                max_num_score: o.max_num_score ? Number(o.max_num_score) : 0
              });
            });
          }
          return Promise.resolve(list);
        });
      }
      listLeaderboardRecordsAroundOwner(session, leaderboardId, ownerId, limit, expiry) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listLeaderboardRecordsAroundOwner(leaderboardId, ownerId, limit, expiry).then((response) => {
          var list = {
            next_cursor: response.next_cursor,
            prev_cursor: response.prev_cursor,
            owner_records: [],
            records: []
          };
          if (response.owner_records != null) {
            response.owner_records.forEach((o) => {
              list.owner_records.push({
                expiry_time: o.expiry_time,
                leaderboard_id: o.leaderboard_id,
                metadata: o.metadata ? JSON.parse(o.metadata) : void 0,
                num_score: o.num_score ? Number(o.num_score) : 0,
                owner_id: o.owner_id,
                rank: o.rank ? Number(o.rank) : 0,
                score: o.score ? Number(o.score) : 0,
                subscore: o.subscore ? Number(o.subscore) : 0,
                update_time: o.update_time,
                username: o.username,
                max_num_score: o.max_num_score ? Number(o.max_num_score) : 0
              });
            });
          }
          if (response.records != null) {
            response.records.forEach((o) => {
              list.records.push({
                expiry_time: o.expiry_time,
                leaderboard_id: o.leaderboard_id,
                metadata: o.metadata ? JSON.parse(o.metadata) : void 0,
                num_score: o.num_score ? Number(o.num_score) : 0,
                owner_id: o.owner_id,
                rank: o.rank ? Number(o.rank) : 0,
                score: o.score ? Number(o.score) : 0,
                subscore: o.subscore ? Number(o.subscore) : 0,
                update_time: o.update_time,
                username: o.username,
                max_num_score: o.max_num_score ? Number(o.max_num_score) : 0
              });
            });
          }
          return Promise.resolve(list);
        });
      }
      listMatches(session, limit, authoritative, label, minSize, maxSize, query) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listMatches(limit, authoritative, label, minSize, maxSize, query);
      }
      listNotifications(session, limit, cacheableCursor) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listNotifications(limit, cacheableCursor).then((response) => {
          var result = {
            cacheable_cursor: response.cacheable_cursor,
            notifications: []
          };
          if (response.notifications == null) {
            return Promise.resolve(result);
          }
          response.notifications.forEach((n) => {
            result.notifications.push({
              code: n.code ? Number(n.code) : 0,
              create_time: n.create_time,
              id: n.id,
              persistent: n.persistent,
              sender_id: n.sender_id,
              subject: n.subject,
              content: n.content ? JSON.parse(n.content) : void 0
            });
          });
          return Promise.resolve(result);
        });
      }
      listStorageObjects(session, collection, userId, limit, cursor) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listStorageObjects(collection, userId, limit, cursor).then((response) => {
          var result = {
            objects: [],
            cursor: response.cursor
          };
          if (response.objects == null) {
            return Promise.resolve(result);
          }
          response.objects.forEach((o) => {
            result.objects.push({
              collection: o.collection,
              key: o.key,
              permission_read: o.permission_read ? Number(o.permission_read) : 0,
              permission_write: o.permission_write ? Number(o.permission_write) : 0,
              value: o.value ? JSON.parse(o.value) : void 0,
              version: o.version,
              user_id: o.user_id,
              create_time: o.create_time,
              update_time: o.update_time
            });
          });
          return Promise.resolve(result);
        });
      }
      listTournaments(session, categoryStart, categoryEnd, startTime, endTime, limit, cursor) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listTournaments(categoryStart, categoryEnd, startTime, endTime, limit, cursor).then((response) => {
          var list = {
            cursor: response.cursor,
            tournaments: []
          };
          if (response.tournaments != null) {
            response.tournaments.forEach((o) => {
              list.tournaments.push({
                id: o.id,
                title: o.title,
                description: o.description,
                duration: o.duration ? Number(o.duration) : 0,
                category: o.category ? Number(o.category) : 0,
                sort_order: o.sort_order ? Number(o.sort_order) : 0,
                size: o.size ? Number(o.size) : 0,
                max_size: o.max_size ? Number(o.max_size) : 0,
                max_num_score: o.max_num_score ? Number(o.max_num_score) : 0,
                can_enter: o.can_enter,
                end_active: o.end_active ? Number(o.end_active) : 0,
                next_reset: o.next_reset ? Number(o.next_reset) : 0,
                metadata: o.metadata ? JSON.parse(o.metadata) : void 0,
                create_time: o.create_time,
                start_time: o.start_time,
                end_time: o.end_time,
                start_active: o.start_active
              });
            });
          }
          return Promise.resolve(list);
        });
      }
      listTournamentRecords(session, tournamentId, ownerIds, limit, cursor, expiry) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listTournamentRecords(tournamentId, ownerIds, limit, cursor, expiry).then((response) => {
          var list = {
            next_cursor: response.next_cursor,
            prev_cursor: response.prev_cursor,
            owner_records: [],
            records: []
          };
          if (response.owner_records != null) {
            response.owner_records.forEach((o) => {
              list.owner_records.push({
                expiry_time: o.expiry_time,
                leaderboard_id: o.leaderboard_id,
                metadata: o.metadata ? JSON.parse(o.metadata) : void 0,
                num_score: o.num_score ? Number(o.num_score) : 0,
                owner_id: o.owner_id,
                rank: o.rank ? Number(o.rank) : 0,
                score: o.score ? Number(o.score) : 0,
                subscore: o.subscore ? Number(o.subscore) : 0,
                update_time: o.update_time,
                username: o.username,
                max_num_score: o.max_num_score ? Number(o.max_num_score) : 0
              });
            });
          }
          if (response.records != null) {
            response.records.forEach((o) => {
              list.records.push({
                expiry_time: o.expiry_time,
                leaderboard_id: o.leaderboard_id,
                metadata: o.metadata ? JSON.parse(o.metadata) : void 0,
                num_score: o.num_score ? Number(o.num_score) : 0,
                owner_id: o.owner_id,
                rank: o.rank ? Number(o.rank) : 0,
                score: o.score ? Number(o.score) : 0,
                subscore: o.subscore ? Number(o.subscore) : 0,
                update_time: o.update_time,
                username: o.username,
                max_num_score: o.max_num_score ? Number(o.max_num_score) : 0
              });
            });
          }
          return Promise.resolve(list);
        });
      }
      listTournamentRecordsAroundOwner(session, tournamentId, ownerId, limit, expiry) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.listTournamentRecordsAroundOwner(tournamentId, ownerId, limit, expiry).then((response) => {
          var list = {
            next_cursor: response.next_cursor,
            prev_cursor: response.prev_cursor,
            owner_records: [],
            records: []
          };
          if (response.owner_records != null) {
            response.owner_records.forEach((o) => {
              list.owner_records.push({
                expiry_time: o.expiry_time,
                leaderboard_id: o.leaderboard_id,
                metadata: o.metadata ? JSON.parse(o.metadata) : void 0,
                num_score: o.num_score ? Number(o.num_score) : 0,
                owner_id: o.owner_id,
                rank: o.rank ? Number(o.rank) : 0,
                score: o.score ? Number(o.score) : 0,
                subscore: o.subscore ? Number(o.subscore) : 0,
                update_time: o.update_time,
                username: o.username,
                max_num_score: o.max_num_score ? Number(o.max_num_score) : 0
              });
            });
          }
          if (response.records != null) {
            response.records.forEach((o) => {
              list.records.push({
                expiry_time: o.expiry_time,
                leaderboard_id: o.leaderboard_id,
                metadata: o.metadata ? JSON.parse(o.metadata) : void 0,
                num_score: o.num_score ? Number(o.num_score) : 0,
                owner_id: o.owner_id,
                rank: o.rank ? Number(o.rank) : 0,
                score: o.score ? Number(o.score) : 0,
                subscore: o.subscore ? Number(o.subscore) : 0,
                update_time: o.update_time,
                username: o.username,
                max_num_score: o.max_num_score ? Number(o.max_num_score) : 0
              });
            });
          }
          return Promise.resolve(list);
        });
      }
      promoteGroupUsers(session, groupId, ids) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.promoteGroupUsers(groupId, ids);
      }
      readStorageObjects(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.readStorageObjects(request).then((response) => {
          var result = {objects: []};
          if (response.objects == null) {
            return Promise.resolve(result);
          }
          response.objects.forEach((o) => {
            result.objects.push({
              collection: o.collection,
              key: o.key,
              permission_read: o.permission_read ? Number(o.permission_read) : 0,
              permission_write: o.permission_write ? Number(o.permission_write) : 0,
              value: o.value ? JSON.parse(o.value) : void 0,
              version: o.version,
              user_id: o.user_id,
              create_time: o.create_time,
              update_time: o.update_time
            });
          });
          return Promise.resolve(result);
        });
      }
      rpc(session, id, input) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.rpcFunc(id, JSON.stringify(input)).then((response) => {
          return Promise.resolve({
            id: response.id,
            payload: !response.payload ? void 0 : JSON.parse(response.payload)
          });
        });
      }
      rpcGet(id, session, httpKey, input) {
        if (!httpKey || httpKey == "") {
          this.configuration.bearerToken = session && session.token;
        } else {
          this.configuration.username = void 0;
          this.configuration.bearerToken = void 0;
        }
        return this.apiClient.rpcFunc2(id, input && JSON.stringify(input) || "", httpKey).then((response) => {
          this.configuration.username = this.serverkey;
          return Promise.resolve({
            id: response.id,
            payload: !response.payload ? void 0 : JSON.parse(response.payload)
          });
        }).catch((err) => {
          this.configuration.username = this.serverkey;
          throw err;
        });
      }
      unlinkApple(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.unlinkApple(request).then((response) => {
          return response !== void 0;
        });
      }
      unlinkCustom(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.unlinkCustom(request).then((response) => {
          return response !== void 0;
        });
      }
      unlinkDevice(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.unlinkDevice(request).then((response) => {
          return response !== void 0;
        });
      }
      unlinkEmail(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.unlinkEmail(request).then((response) => {
          return response !== void 0;
        });
      }
      unlinkFacebook(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.unlinkFacebook(request).then((response) => {
          return response !== void 0;
        });
      }
      unlinkFacebookInstantGame(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.unlinkFacebookInstantGame(request).then((response) => {
          return response !== void 0;
        });
      }
      unlinkGoogle(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.unlinkGoogle(request).then((response) => {
          return response !== void 0;
        });
      }
      unlinkGameCenter(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.unlinkGameCenter(request).then((response) => {
          return response !== void 0;
        });
      }
      unlinkSteam(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.unlinkSteam(request).then((response) => {
          return response !== void 0;
        });
      }
      updateAccount(session, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.updateAccount(request).then((response) => {
          return response !== void 0;
        });
      }
      updateGroup(session, groupId, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.updateGroup(groupId, request).then((response) => {
          return response !== void 0;
        });
      }
      writeLeaderboardRecord(session, leaderboardId, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.writeLeaderboardRecord(leaderboardId, {
          metadata: request.metadata ? JSON.stringify(request.metadata) : void 0,
          score: request.score,
          subscore: request.subscore
        }).then((response) => {
          return Promise.resolve({
            expiry_time: response.expiry_time,
            leaderboard_id: response.leaderboard_id,
            metadata: response.metadata ? JSON.parse(response.metadata) : void 0,
            num_score: response.num_score ? Number(response.num_score) : 0,
            owner_id: response.owner_id,
            score: response.score ? Number(response.score) : 0,
            subscore: response.subscore ? Number(response.subscore) : 0,
            update_time: response.update_time,
            username: response.username,
            max_num_score: response.max_num_score ? Number(response.max_num_score) : 0,
            rank: response.rank ? Number(response.rank) : 0
          });
        });
      }
      writeStorageObjects(session, objects) {
        this.configuration.bearerToken = session && session.token;
        var request = {objects: []};
        objects.forEach((o) => {
          request.objects.push({
            collection: o.collection,
            key: o.key,
            permission_read: o.permission_read,
            permission_write: o.permission_write,
            value: JSON.stringify(o.value),
            version: o.version
          });
        });
        return this.apiClient.writeStorageObjects(request);
      }
      writeTournamentRecord(session, tournamentId, request) {
        this.configuration.bearerToken = session && session.token;
        return this.apiClient.writeTournamentRecord(tournamentId, {
          metadata: request.metadata ? JSON.stringify(request.metadata) : void 0,
          score: request.score,
          subscore: request.subscore
        }).then((response) => {
          return Promise.resolve({
            expiry_time: response.expiry_time,
            leaderboard_id: response.leaderboard_id,
            metadata: response.metadata ? JSON.parse(response.metadata) : void 0,
            num_score: response.num_score ? Number(response.num_score) : 0,
            owner_id: response.owner_id,
            score: response.score ? Number(response.score) : 0,
            subscore: response.subscore ? Number(response.subscore) : 0,
            update_time: response.update_time,
            username: response.username,
            max_num_score: response.max_num_score ? Number(response.max_num_score) : 0,
            rank: response.rank ? Number(response.rank) : 0
          });
        });
      }
    };

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode$1(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode$1(key) + '=' + encode$1(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    // Expose isAxiosError
    axios.isAxiosError = isAxiosError;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var _default = axios;
    axios_1.default = _default;

    var axios$1 = axios_1;

    const getTourneyProvider = async (options, auth_provider) => {

        let provider = new NakamaTourneyProvider(auth_provider);

        if (provider != null)
        {

            console.log('%c%s',
            'color: blue; background: white;',
            "Nakama Tourney Provider : --- " 
            + options.url + ":" + options.port + " ---"
            );
            
            return provider;
        }

        console.error("unable to initialize SDK");
        return null;
    };

    class NakamaTourneyProvider {

        authProvider = null;
        client = null;
        session = null;
        tournamentId = null;
        
        constructor(auth_provider) {
            this.authProvider = auth_provider;
        }

        refreshSession = async () => {
            this.authProvider.refreshSession();
            this.client = this.authProvider.client;
            this.session = this.authProvider.session;
        }

        getTourney = async (options) => {

            try {
                await this.refreshSession();

                let tourneyInfo = await this.client.apiClient.listLeaderboardRecords(
                    this.session,
                    options.tourney_id);

                return tourneyInfo;

            } catch (e) {
                console.error("getTourney failed [" + e.status + ":" + e.statusText + "]"); 
                return(e);
             }
        }    

        attemptTourney = async (options) => {

            try {

                await this.refreshSession();

                let socket = await this.client.createSocket(false, false);
                let socketSession = await  socket.connect(this.session, false);

                let response = await socket.createMatch();

                console.log(response);

                return response;

            } catch (e) {
                console.error("attemptTourney failed [" + e.status + ":" + e.statusText + "]"); 
                return(e);
             }
        }    

        postScoreJs = async (options) => {

            try {

                await this.refreshSession();

                let result = await this.client.rpc(
                    this.session,
                    "clientrpc.post_tourney_score",
                    options);

                return result.payload;

            } catch (e) {
                console.error("postScore failed [" + e.status + ":" + e.statusText + "]"); 
                return(e);
             }
        }
        
        postScore = async (options) => {

            try {

                await this.refreshSession();

                const config = {
                    headers: {
                        Authorization: 'Bearer ' + this.session.token,
                        'Content-Type': 'application/json'
                    }
                };

                const res = await axios$1.post('http://op-arcade-dev.herokuapp.com/oparcade/api/tournaments/post-score', options, config);

                return res;

            } catch (e) {
                console.error("postScore failed [" + e.status + ":" + e.statusText + "]"); 
                return(e);
             }
        }    
        
        joinTourney = async (options) => {

            try {
                await this.refreshSession();

                let tourneyInfo = await this.client.joinTournament(
                    this.session,
                    options.tournament_id);

                return tourneyInfo;

            } catch (e) {
                console.error("joinTourney failed [" + e.status + ":" + e.statusText + "]"); 
                return(e);
             }
        }

        saveTournamentId = (options) => {
          this.tournamentId = options.tournamentId;
        }

        getTournamentId = () => {
          return this.tournamentId;
        }
    }

    class Tourney {

        sdkState = CONSTANTS.SDK_STATES.INITIALIZING

        // provider depends on serverType
        tourneyProvider = null;

        constructor(options) {
          if (options != null)
            this.useServer(options);
        }

        useServer = async (options, auth_provider = null) => {
          let serverType = options.type;

          switch (serverType) {
              case CONSTANTS.TOURNEY_SERVER_TYPES.NAKAMA:

                  // nakama requires the authProvider
                  if (auth_provider == null)
                  {
                    console.error("no auth provider given. Nakama requires an auth provider.");
                  }

                  else {

                    let tourneyProvider = await getTourneyProvider(options, auth_provider);
                    
                    if (tourneyProvider != null) {
                        this.tourneyProvider = tourneyProvider;
                        this.sdkState = CONSTANTS.SDK_STATES.READY;
                      }
                    else {
                        console.error("unable to initialize nakama tourney provider.");
                    }

                  }
                  
                  break;
            
                  default:
                    console.error("server type not found. Must be one of : " + Object.keys(CONSTANTS.TOURNEY_SERVER_TYPES));
                  break;
          }

          return this.tourneyProvider;
        }

        getTourney = async (tournament_id) => {

            let result = await this.tourneyProvider.getTourney(tournament_id);
            return result

        }

        attemptTourney = async (tournament_id) => {
          let result = await this.tourneyProvider.attemptTourney(tournament_id);
          return result
        }

        postScore = async (options) => {
          let result = await this.tourneyProvider.postScore(options);
          return result
        }

        joinTourney = async (options) => {
          let result = await this.tourneyProvider.joinTourney(options);
          return result
        }

        saveTournamentId = (options) => {
          if (options != null)
          {
            this.tourneyProvider.saveTournamentId(options);
          }
        }

        getTournamentId = () => {
          return this.tourneyProvider.getTournamentId();
        }

    }

    function getTourneyStore(options) {
        return writable(new Tourney(options))
    }

    const TEST_ID = "test_id";

    // return a login provider on success
    const getAuthProvider = async (options) => {

        // initialize sdk    
         let client = new Client(
            options.key,
            options.url,
            options.port
        );

        // do a test authenticate
        let session = await client.apiClient.authenticateCustom({
            id: TEST_ID,
            create: true
        });

        if (session != null) {

            let provider = new NakamaAuthProvider(client);

            console.log('%c%s',
            'color: blue; background: white;',
            "Nakama Auth Provider : --- " 
            + options.url + ":" + options.port + " ---"
            );
            
            return provider;
        }

        console.error("unable to initialize SDK");
        return null;
    };

    class NakamaAuthProvider {

        client = null;
        session = null;
        loginObject = null;
        
        constructor(client) {
            this.client = client;
        }

        login = async (loginObject) => {

            this.loginObject = loginObject;

            try {
                this.session = await this.client.apiClient.authenticateEmail(
                    {
                    email: loginObject.username,
                    password: loginObject.password,
                    create: true   
                    }
                );

                return this.session
                
            } catch (e) {
                console.error("Login failed [" + e.status + ":" + e.statusText + "]"); 
             }
        
             return null;
        }    

        logout = () => {
            this.session = null;
            this.loginObject = null;
        }

        refreshSession = async () => {
            if (this.loginObject != null)
            {
                if (this.session == null)
                {   
                    await this.login(this.loginObject);
                }

                // if session has expired
                else if ( (this.session.expires_at * 1000) < Date.now())
                {
                    // recreate client
                    this.client = new Client(
                        this.client.serverkey,
                        this.client.host,
                        this.client.port
                    );

                    await this.login(this.loginObject);
                }
            }

            else {
                console.error("previous login not detected -- unable to refresh session");
            }
        }

        getSessionToken = () => {
            console.log(this.session);
            return this.session;
        }

        saveSessionToken = (options) => {
            this.session = options;
        }
     
    }

    class Auth {

        sdkState = CONSTANTS.SDK_STATES.INITIALIZING
        loginState = CONSTANTS.LOGIN_STATES.LOGGED_OUT

        // provider depends on serverType
        authProvider = null;

        constructor(options) {
          if (options != null)
            this.useServer(options);
        }

        useServer = async (options) => {
          let serverType = options.type;

          switch (serverType) {
              case CONSTANTS.AUTH_SERVER_TYPES.NAKAMA:

                  let authProvider = await getAuthProvider(options);

                  if (authProvider != null)
                      {
                        this.authProvider = authProvider;
                        this.sdkState = CONSTANTS.SDK_STATES.READY;
                      }
            
                  break;
            
                  default:
                    console.error("server type not found. Must be one of : " + Object.keys(CONSTANTS.AUTH_SERVER_TYPES));
                  break;
          }
          
          return this.authProvider;
        }


        login = async (loginCreds) => {
            this.loginState = CONSTANTS.LOGIN_STATES.LOGIN_IN_PROGRESS;
        
            let token = await this.authProvider.login(loginCreds);
            if (token != null)
            {
              this.loginState = CONSTANTS.LOGIN_STATES.LOGGED_IN;
            }

            else {
              this.loginState = CONSTANTS.LOGIN_STATES.LOGGED_OUT;
            }

            return this.loginState;

          }
        
          logout = () => {
            this.authProvider.logout();
            this.loginState = CONSTANTS.LOGIN_STATES.LOGGED_OUT;

            return this.loginState;
          }

          getSessionToken = () => {
            return this.authProvider.getSessionToken();
          }

          saveSessionToken = (options) => {
            if (options != null)
            {
              this.authProvider.saveSessionToken(options);
              this.loginState = CONSTANTS.LOGIN_STATES.LOGGED_IN;
            }
            
            return this.loginState;
          }
        
    }

    function getAuthStore(options) {
        return writable(new Auth(options))
    }

    const loginState = writable(CONSTANTS.LOGIN_STATES.LOGGED_OUT);
    const passedSessionToken = writable(null);
    const tournamentId = writable(null);
    const url = readable(document.referrer);

    const onOpArcade = writable(false);
    const isProd = writable(false);
    const isTournament = writable(false);

    const tourneyStore = getTourneyStore();
    const authStore = getAuthStore();

    async function useServers(options) {    
        let auth_provider = await get_store_value(authStore).useServer(options.auth_server);
        let tourney_provider = await get_store_value(tourneyStore).useServer(options.tourney_server, auth_provider);

        return {
            auth_provider,
            tourney_provider
        }
    }

    /* src\Op.svelte generated by Svelte v3.31.0 */

    function instance($$self, $$props, $$invalidate) {
    	let $url;
    	let $onOpArcade;
    	let $passedSessionToken;
    	let $loginState;
    	let $tournamentId;
    	let $isTournament;
    	let $tourneyStore;
    	let $authStore;
    	component_subscribe($$self, url, $$value => $$invalidate(18, $url = $$value));
    	component_subscribe($$self, onOpArcade, $$value => $$invalidate(19, $onOpArcade = $$value));
    	component_subscribe($$self, passedSessionToken, $$value => $$invalidate(20, $passedSessionToken = $$value));
    	component_subscribe($$self, loginState, $$value => $$invalidate(21, $loginState = $$value));
    	component_subscribe($$self, tournamentId, $$value => $$invalidate(22, $tournamentId = $$value));
    	component_subscribe($$self, isTournament, $$value => $$invalidate(23, $isTournament = $$value));
    	component_subscribe($$self, tourneyStore, $$value => $$invalidate(24, $tourneyStore = $$value));
    	component_subscribe($$self, authStore, $$value => $$invalidate(25, $authStore = $$value));
    	const OP_ARCADE_URL_DEV = "http://localhost:3000/";
    	const OP_ARCADE_URL_PROD = "http://test.outplay.games/";
    	const OP_ARCADE_URL_DEV_ORIGIN = "http://localhost:3000";
    	const OP_ARCADE_URL_PROD_ORIGIN = "http://test.outplay.games";

    	const DEFAULT_CONFIG = {
    		tourney_server: {
    			type: CONSTANTS.TOURNEY_SERVER_TYPES.NAKAMA,
    			url: "localhost",
    			port: "7350",
    			key: "defaultkey"
    		},
    		auth_server: {
    			type: CONSTANTS.TOURNEY_SERVER_TYPES.NAKAMA,
    			url: "localhost",
    			port: "7350",
    			key: "defaultkey"
    		}
    	};

    	let { config } = $$props;
    	const configStore = writable(config);

    	function props() {
    		return { url: $url, config };
    	}

    	async function initialize() {
    		let serverConfig = get_store_value(configStore);

    		if (serverConfig == null) {
    			console.log("%c%s", "color: blue; background: white;", "-- Using default localhost config --");
    			serverConfig = DEFAULT_CONFIG;
    		}

    		// check if we're on OP Arcade
    		onOpArcade.set($url == OP_ARCADE_URL_DEV || $url == OP_ARCADE_URL_PROD);

    		isProd.set($url == OP_ARCADE_URL_PROD);

    		if (get_store_value(isProd)) {
    			console.log("%c%s", "color: orange; background: white;", "-- Welcome to OP Arcade --");
    		} else {
    			console.log("%c%s", "color: orange; background: white;", "-- development mode --");
    		}

    		useServers(serverConfig).then(result => {
    			if ($onOpArcade) {
    				updateOpArcadeStores();
    			}
    		});
    	}

    	function updateOpArcadeStores() {
    		// possible timing issue with useServers. need to find a way to sync
    		if ($passedSessionToken === null) {
    			console.log("no session token passed");
    		} else {
    			set_store_value(loginState, $loginState = saveSessionToken($passedSessionToken), $loginState);
    			set_store_value(tournamentId, $tournamentId = saveTournamentId($passedSessionToken), $tournamentId);
    			if ($tournamentId !== null) set_store_value(isTournament, $isTournament = true, $isTournament);
    		}
    	}

    	// save session token
    	window.addEventListener(
    		"message",
    		e => {
    			if (e.origin == OP_ARCADE_URL_DEV_ORIGIN || e.origin == OP_ARCADE_URL_PROD_ORIGIN) {
    				try {
    					let session = JSON.parse(e.data);
    					passedSessionToken.set(session);
    					updateOpArcadeStores();
    				} catch(e) {
    					console.log(e);
    				}
    			}
    		},
    		false
    	);

    	async function getTourney(options) {
    		let result = await $tourneyStore.getTourney(options);
    		return result;
    	}

    	let showPopup; // bound to content

    	async function loginPrompt() {
    		showPopup();
    	}

    	async function attemptTourney(options) {
    		let result = await $tourneyStore.attemptTourney(options);
    		return result;
    	}

    	async function postScore(options) {
    		let result = await $tourneyStore.postScore(options);
    		return result;
    	}

    	async function joinTourney(options) {
    		let result = await $tourneyStore.joinTourney(options);
    		return result;
    	}

    	function getSessionToken() {
    		let session = $authStore.getSessionToken();
    		return session;
    	}

    	function saveSessionToken(options) {
    		return $authStore.saveSessionToken(options);
    	}

    	function saveTournamentId(options) {
    		return $tourneyStore.saveTournamentId(options);
    	}

    	function getTournamentId() {
    		let tournamentId = $tourneyStore.getTournamentId();
    		return tournamentId;
    	}

    	$$self.$$set = $$props => {
    		if ("config" in $$props) $$invalidate(5, config = $$props.config);
    	};

    	return [
    		OP_ARCADE_URL_DEV,
    		OP_ARCADE_URL_PROD,
    		OP_ARCADE_URL_DEV_ORIGIN,
    		OP_ARCADE_URL_PROD_ORIGIN,
    		DEFAULT_CONFIG,
    		config,
    		configStore,
    		CONSTANTS,
    		useServers,
    		props,
    		initialize,
    		getTourney,
    		loginPrompt,
    		attemptTourney,
    		postScore,
    		joinTourney,
    		getSessionToken,
    		getTournamentId
    	];
    }

    class Op extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance, null, safe_not_equal, {
    			OP_ARCADE_URL_DEV: 0,
    			OP_ARCADE_URL_PROD: 1,
    			OP_ARCADE_URL_DEV_ORIGIN: 2,
    			OP_ARCADE_URL_PROD_ORIGIN: 3,
    			DEFAULT_CONFIG: 4,
    			config: 5,
    			configStore: 6,
    			CONSTANTS: 7,
    			useServers: 8,
    			props: 9,
    			initialize: 10,
    			getTourney: 11,
    			loginPrompt: 12,
    			attemptTourney: 13,
    			postScore: 14,
    			joinTourney: 15,
    			getSessionToken: 16,
    			getTournamentId: 17
    		});
    	}

    	get OP_ARCADE_URL_DEV() {
    		return this.$$.ctx[0];
    	}

    	get OP_ARCADE_URL_PROD() {
    		return this.$$.ctx[1];
    	}

    	get OP_ARCADE_URL_DEV_ORIGIN() {
    		return this.$$.ctx[2];
    	}

    	get OP_ARCADE_URL_PROD_ORIGIN() {
    		return this.$$.ctx[3];
    	}

    	get DEFAULT_CONFIG() {
    		return this.$$.ctx[4];
    	}

    	get configStore() {
    		return this.$$.ctx[6];
    	}

    	get CONSTANTS() {
    		return CONSTANTS;
    	}

    	get useServers() {
    		return useServers;
    	}

    	get props() {
    		return this.$$.ctx[9];
    	}

    	get initialize() {
    		return this.$$.ctx[10];
    	}

    	get getTourney() {
    		return this.$$.ctx[11];
    	}

    	get loginPrompt() {
    		return this.$$.ctx[12];
    	}

    	get attemptTourney() {
    		return this.$$.ctx[13];
    	}

    	get postScore() {
    		return this.$$.ctx[14];
    	}

    	get joinTourney() {
    		return this.$$.ctx[15];
    	}

    	get getSessionToken() {
    		return this.$$.ctx[16];
    	}

    	get getTournamentId() {
    		return this.$$.ctx[17];
    	}
    }

    let config = null;

    try {
    	let configString = document.getElementsByName('op-config')[0];

    	if (configString != undefined)
    		config = JSON.parse(configString.content);

    } catch (e)
    {
    	console.log("unable to process op-config -- check if valid json");
    }

    const op = new Op({
    	target: document.body,
    	props: {
    		config
    	}
    });

    op.initialize();

    // attach to window
    window.op = op;

    return op;

})));
//# sourceMappingURL=op.js.map
