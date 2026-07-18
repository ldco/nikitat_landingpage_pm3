import process from 'node:process';globalThis._importMeta_={url:import.meta.url,env:process.env};import { tmpdir, totalmem, freemem, loadavg, cpus } from 'node:os';
import { defineEventHandler, handleCacheHeaders, splitCookiesString, createEvent, fetchWithEvent, isEvent, eventHandler, setHeaders, sendRedirect, proxyRequest, getRequestHeader, setResponseHeaders, setResponseStatus, send, getRequestHeaders, setResponseHeader, appendResponseHeader, getRequestURL, getResponseHeader, getResponseStatus, createError, getHeader, getCookie, setCookie, deleteCookie, removeResponseHeader, appendHeader, setHeader, getQuery as getQuery$1, readBody, getRouterParam, createApp, createRouter as createRouter$1, toNodeListener, lazyEventHandler, getRequestIP, sendStream, readMultipartFormData, defineWebSocketHandler, getResponseStatusText } from 'file:///app/node_modules/h3/dist/index.mjs';
import { Server } from 'node:http';
import path, { resolve, dirname, isAbsolute, join, normalize, relative, sep } from 'node:path';
import nodeCrypto, { timingSafeEqual, randomBytes, scryptSync, createDecipheriv, createCipheriv, randomUUID, createHmac } from 'node:crypto';
import { parentPort, threadId } from 'node:worker_threads';
import { escapeHtml as escapeHtml$1 } from 'file:///app/node_modules/@vue/shared/dist/shared.cjs.js';
import { Cron } from 'file:///app/node_modules/croner/dist/croner.js';
import { eq, asc, count, and, gt, lt, desc, like, ne, sql, inArray } from 'file:///app/node_modules/drizzle-orm/index.js';
import { z } from 'file:///app/node_modules/zod/index.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs, { existsSync, mkdirSync, readFileSync, writeFileSync, promises, readdirSync, statSync, unlinkSync, rmSync, createWriteStream, createReadStream } from 'node:fs';
import { setTimeout as setTimeout$1 } from 'node:timers/promises';
import { getHeapStatistics } from 'node:v8';
import nodemailer from 'file:///app/node_modules/nodemailer/lib/nodemailer.js';
import { setDefaultResultOrder } from 'node:dns';
import { S3Client, GetObjectCommand } from 'file:///app/node_modules/@aws-sdk/client-s3/dist-cjs/index.js';
import { Readable } from 'node:stream';
import AdmZip from 'file:///app/node_modules/adm-zip/adm-zip.js';
import { readFile, mkdir, writeFile, unlink, stat } from 'node:fs/promises';
import ffmpeg from 'file:///app/node_modules/fluent-ffmpeg/index.js';
import sharp from 'file:///app/node_modules/sharp/lib/index.js';
import { Secret, TOTP } from 'file:///app/node_modules/otpauth/dist/otpauth.node.mjs';
import QRCode from 'file:///app/node_modules/qrcode/lib/index.js';
import { createRenderer, getRequestDependencies, getPreloadLinks, getPrefetchLinks } from 'file:///app/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import { parseURL, withoutBase, joinURL, getQuery, withQuery, joinRelativeURL, parsePath, withLeadingSlash, decodePath, withoutTrailingSlash } from 'file:///app/node_modules/ufo/dist/index.mjs';
import destr, { destr as destr$1 } from 'file:///app/node_modules/destr/dist/index.mjs';
import { createHooks } from 'file:///app/node_modules/hookable/dist/index.mjs';
import { createFetch, Headers as Headers$1 } from 'file:///app/node_modules/ofetch/dist/node.mjs';
import { fetchNodeRequestHandler, callNodeRequestHandler } from 'file:///app/node_modules/node-mock-http/dist/index.mjs';
import { createStorage, prefixStorage } from 'file:///app/node_modules/unstorage/dist/index.mjs';
import unstorage_47drivers_47fs from 'file:///app/node_modules/unstorage/drivers/fs.mjs';
import { digest } from 'file:///app/node_modules/ohash/dist/index.mjs';
import { klona } from 'file:///app/node_modules/klona/dist/index.mjs';
import defu, { defuFn, createDefu } from 'file:///app/node_modules/defu/dist/defu.mjs';
import { snakeCase } from 'file:///app/node_modules/scule/dist/index.mjs';
import { getContext } from 'file:///app/node_modules/unctx/dist/index.mjs';
import { toRouteMatcher, createRouter } from 'file:///app/node_modules/radix3/dist/index.mjs';
import consola from 'file:///app/node_modules/consola/dist/index.mjs';
import { ErrorParser } from 'file:///app/node_modules/youch-core/build/index.js';
import { Youch } from 'file:///app/node_modules/youch/build/index.js';
import { SourceMapConsumer } from 'file:///app/node_modules/source-map/source-map.js';
import { createRouterMatcher } from 'file:///app/node_modules/vue-router/vue-router.node.mjs';
import pino from 'file:///app/node_modules/pino/pino.js';
import { drizzle } from 'file:///app/node_modules/drizzle-orm/better-sqlite3/index.js';
import Database from 'file:///app/node_modules/better-sqlite3/lib/index.js';
import { sqliteTable, integer, text, index, unique } from 'file:///app/node_modules/drizzle-orm/sqlite-core/index.js';
import * as Sentry from 'file:///app/node_modules/@sentry/node/build/esm/index.js';
import { fileURLToPath } from 'node:url';
import { dirname as dirname$1, resolve as resolve$1 } from 'file:///app/node_modules/pathe/dist/index.mjs';
import { createHead as createHead$1, propsToString, renderSSRHead } from 'file:///app/node_modules/unhead/dist/server.mjs';
import { toValue, isRef } from 'file:///app/node_modules/vue/index.mjs';
import process$1 from 'node:process';
import { renderToString } from 'file:///app/node_modules/vue/server-renderer/index.mjs';
import { walkResolver } from 'file:///app/node_modules/unhead/dist/utils.mjs';
import { stringify, uneval } from 'file:///app/node_modules/devalue/index.js';

const serverAssets = [{"baseName":"server","dir":"/app/server/assets"}];

const assets$1 = createStorage();

for (const asset of serverAssets) {
  assets$1.mount(asset.baseName, unstorage_47drivers_47fs({ base: asset.dir, ignore: (asset?.ignore || []) }));
}

const storage$1 = createStorage({});

storage$1.mount('/assets', assets$1);

storage$1.mount('root', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"/app","watchOptions":{"ignored":[null]}}));
storage$1.mount('src', unstorage_47drivers_47fs({"driver":"fs","readOnly":true,"base":"/app/server","watchOptions":{"ignored":[null]}}));
storage$1.mount('build', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"/app/.nuxt"}));
storage$1.mount('cache', unstorage_47drivers_47fs({"driver":"fs","readOnly":false,"base":"/app/.nuxt/cache"}));
storage$1.mount('data', unstorage_47drivers_47fs({"driver":"fs","base":"/app/.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage$1, base) : storage$1;
}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const inlineAppConfig = {
  "nuxt": {}
};



const appConfig = defuFn(inlineAppConfig);

function getEnv$1(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv$1(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "dev",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/**": {
        "headers": {
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      },
      "/favicon.*": {
        "headers": {
          "Cache-Control": "public, max-age=86400"
        }
      },
      "/og-image.png": {
        "headers": {
          "Cache-Control": "public, max-age=86400"
        }
      },
      "/og-image.*.png": {
        "headers": {
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      },
      "/logos/**": {
        "headers": {
          "Cache-Control": "public, max-age=2592000"
        }
      },
      "/puppetmaster/**": {
        "headers": {
          "Cache-Control": "public, max-age=2592000"
        }
      },
      "/apple-touch-icon.png": {
        "headers": {
          "Cache-Control": "public, max-age=86400"
        }
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      }
    }
  },
  "public": {
    "pm": {
      "entities": {
        "website": true,
        "app": false
      },
      "appShell": {
        "entryPath": "/login"
      },
      "adminEnabled": true,
      "adminSectionsByRole": {
        "master": [
          {
            "id": "users",
            "icon": "users",
            "label": "users",
            "roles": [
              "master"
            ],
            "group": "system"
          },
          {
            "id": "roles",
            "icon": "shield",
            "label": "roles",
            "roles": [
              "master"
            ],
            "group": "system"
          },
          {
            "id": "translations",
            "icon": "language",
            "label": "translations",
            "roles": [
              "master",
              "admin",
              "editor"
            ],
            "group": "system"
          },
          {
            "id": "settings",
            "icon": "settings",
            "label": "settings",
            "roles": [
              "master",
              "admin"
            ],
            "group": "system"
          },
          {
            "id": "legal",
            "icon": "file-certificate",
            "label": "legal",
            "roles": [
              "master",
              "admin"
            ],
            "group": "system"
          },
          {
            "id": "health",
            "icon": "heartbeat",
            "label": "health",
            "roles": [
              "master"
            ],
            "group": "system"
          },
          {
            "id": "contacts",
            "icon": "mail",
            "label": "contacts",
            "badge": true,
            "roles": [
              "master",
              "admin"
            ],
            "group": "content"
          }
        ],
        "admin": [
          {
            "id": "translations",
            "icon": "language",
            "label": "translations",
            "roles": [
              "master",
              "admin",
              "editor"
            ],
            "group": "system"
          },
          {
            "id": "settings",
            "icon": "settings",
            "label": "settings",
            "roles": [
              "master",
              "admin"
            ],
            "group": "system"
          },
          {
            "id": "legal",
            "icon": "file-certificate",
            "label": "legal",
            "roles": [
              "master",
              "admin"
            ],
            "group": "system"
          },
          {
            "id": "contacts",
            "icon": "mail",
            "label": "contacts",
            "badge": true,
            "roles": [
              "master",
              "admin"
            ],
            "group": "content"
          }
        ],
        "editor": [
          {
            "id": "translations",
            "icon": "language",
            "label": "translations",
            "roles": [
              "master",
              "admin",
              "editor"
            ],
            "group": "system"
          }
        ],
        "user": []
      },
      "features": {
        "cookies": true,
        "multiLangs": false,
        "doubleTheme": true,
        "onepager": true,
        "heroParallax": false,
        "scrollytelling": true,
        "interactiveHeader": true,
        "mobileInteractiveHeader": false,
        "hideHeaderOnScroll": false,
        "verticalNav": false,
        "headerFooterWidthMode": "contained",
        "pageTransitions": "zoom",
        "appVerticalNav": false,
        "twoFactorAuth": false,
        "pwa": false,
        "contactEmailConfirmation": false,
        "contactTelegramNotify": false,
        "footerNav": true,
        "footerCta": true,
        "footerLegalLinks": true,
        "footerMadeBy": false,
        "footerMadeWith": true,
        "backToTop": false
      },
      "modules": {
        "portfolio": {
          "enabled": false
        },
        "pricing": {
          "enabled": false
        },
        "contact": {
          "enabled": true,
          "config": {
            "showMap": false,
            "mapProvider": "yandex",
            "showForm": true,
            "showInfo": true,
            "formFields": [
              {
                "name": "name",
                "type": "text",
                "label": "Name",
                "required": true
              },
              {
                "name": "email",
                "type": "email",
                "label": "Email",
                "required": true
              },
              {
                "name": "message",
                "type": "textarea",
                "label": "Message",
                "required": true
              }
            ],
            "notifications": "email",
            "showSocial": false
          }
        },
        "blog": {
          "enabled": false
        },
        "team": {
          "enabled": false
        },
        "testimonials": {
          "enabled": false
        },
        "features": {
          "enabled": false
        },
        "clients": {
          "enabled": false
        },
        "faq": {
          "enabled": false
        }
      },
      "locales": [
        {
          "code": "ru",
          "iso": "ru-RU",
          "name": "Русский"
        },
        {
          "code": "en",
          "iso": "en-US",
          "name": "English"
        }
      ],
      "defaultLocale": "ru",
      "defaultTheme": "system",
      "sections": [
        {
          "id": "home",
          "inNav": true
        },
        {
          "id": "approach",
          "inNav": true
        },
        {
          "id": "economics",
          "inNav": true
        },
        {
          "id": "formats",
          "inNav": true
        },
        {
          "id": "experience",
          "inNav": true
        },
        {
          "id": "about",
          "inNav": true
        },
        {
          "id": "contact",
          "inNav": true
        }
      ],
      "colors": {
        "black": "#0d1117",
        "white": "#f5f5f5",
        "brand": "#c0392b",
        "accent": "#1e3a5f"
      },
      "logo": {
        "basePath": "/logos",
        "shapes": {
          "horizontal": "header",
          "circle": "short"
        },
        "langFallback": {
          "ru": "en"
        },
        "available": [
          "horizontal_dark_en",
          "horizontal_dark_ru",
          "horizontal_light_en",
          "horizontal_light_ru",
          "circle_dark_en",
          "circle_dark_ru",
          "circle_light_en",
          "circle_light_ru"
        ]
      },
      "footerMadeBy": {
        "text": "Made by",
        "url": "/",
        "logoAlt": "Puppet Master",
        "basePath": "/madebylogos",
        "available": [
          "horizontal_dark_en",
          "horizontal_dark_ru",
          "horizontal_light_en",
          "horizontal_light_ru",
          "circle_dark_en",
          "circle_dark_ru",
          "circle_light_en",
          "circle_light_ru"
        ],
        "langFallback": {
          "ru": "en"
        }
      },
      "settings": [
        {
          "key": "contact.email",
          "type": "email",
          "group": "contact",
          "label": "Email",
          "icon": "mail"
        },
        {
          "key": "contact.phone",
          "type": "tel",
          "group": "contact",
          "label": "Phone",
          "icon": "phone"
        },
        {
          "key": "contact.location",
          "type": "string",
          "group": "location",
          "label": "Location",
          "icon": "map-pin"
        },
        {
          "key": "contact.workingHours",
          "type": "string",
          "group": "location",
          "label": "Working Hours",
          "icon": "clock"
        },
        {
          "key": "contact.forceShowFormWithoutLegalDocuments",
          "type": "boolean",
          "group": "contact",
          "label": "Show Contact Form Without Legal Documents"
        },
        {
          "key": "contact.contactPageItems",
          "type": "string",
          "group": "contact",
          "label": "Contact Page Buttons"
        },
        {
          "key": "contact.telegramBotToken",
          "type": "password",
          "group": "integrations",
          "label": "Telegram Bot Token",
          "icon": "lock",
          "public": false
        },
        {
          "key": "contact.telegramChatId",
          "type": "string",
          "group": "integrations",
          "label": "Telegram Chat ID",
          "icon": "hash",
          "public": false
        },
        {
          "key": "contact.headerQuickEnabled",
          "type": "boolean",
          "group": "contact",
          "label": "Show Header Quick Contact Buttons"
        },
        {
          "key": "contact.headerQuickItems",
          "type": "string",
          "group": "contact",
          "label": "Header Quick Contact Items"
        },
        {
          "key": "social.telegram",
          "type": "url",
          "group": "contact",
          "label": "Telegram",
          "icon": "brand-telegram"
        },
        {
          "key": "social.whatsapp",
          "type": "url",
          "group": "contact",
          "label": "WhatsApp",
          "icon": "brand-whatsapp"
        },
        {
          "key": "social.viber",
          "type": "url",
          "group": "contact",
          "label": "Viber",
          "icon": "brand-viber"
        },
        {
          "key": "social.discord",
          "type": "url",
          "group": "contact",
          "label": "Discord",
          "icon": "brand-discord"
        },
        {
          "key": "social.max",
          "type": "url",
          "group": "contact",
          "label": "MAX Messenger",
          "icon": "custom-max"
        },
        {
          "key": "social.telegramChannel",
          "type": "url",
          "group": "social",
          "label": "Telegram Channel",
          "icon": "brand-telegram"
        },
        {
          "key": "social.maxChannel",
          "type": "url",
          "group": "social",
          "label": "MAX Channel",
          "icon": "custom-max"
        },
        {
          "key": "social.discordServer",
          "type": "url",
          "group": "social",
          "label": "Discord Server",
          "icon": "brand-discord"
        },
        {
          "key": "social.instagram",
          "type": "url",
          "group": "social",
          "label": "Instagram",
          "icon": "brand-instagram"
        },
        {
          "key": "social.facebook",
          "type": "url",
          "group": "social",
          "label": "Facebook",
          "icon": "brand-facebook"
        },
        {
          "key": "social.twitter",
          "type": "url",
          "group": "social",
          "label": "Twitter/X",
          "icon": "brand-x"
        },
        {
          "key": "social.threads",
          "type": "url",
          "group": "social",
          "label": "Threads",
          "icon": "brand-threads"
        },
        {
          "key": "social.tiktok",
          "type": "url",
          "group": "social",
          "label": "TikTok",
          "icon": "brand-tiktok"
        },
        {
          "key": "social.pinterest",
          "type": "url",
          "group": "social",
          "label": "Pinterest",
          "icon": "brand-pinterest"
        },
        {
          "key": "social.vk",
          "type": "url",
          "group": "social",
          "label": "VK (ВКонтакте)",
          "icon": "brand-vk"
        },
        {
          "key": "social.youtube",
          "type": "url",
          "group": "social",
          "label": "YouTube",
          "icon": "brand-youtube"
        },
        {
          "key": "social.twitch",
          "type": "url",
          "group": "social",
          "label": "Twitch",
          "icon": "brand-twitch"
        },
        {
          "key": "social.linkedin",
          "type": "url",
          "group": "social",
          "label": "LinkedIn",
          "icon": "brand-linkedin"
        },
        {
          "key": "social.medium",
          "type": "url",
          "group": "social",
          "label": "Medium",
          "icon": "brand-medium"
        },
        {
          "key": "social.github",
          "type": "url",
          "group": "social",
          "label": "GitHub",
          "icon": "brand-github"
        },
        {
          "key": "social.gitlab",
          "type": "url",
          "group": "social",
          "label": "GitLab",
          "icon": "brand-gitlab"
        },
        {
          "key": "social.dribbble",
          "type": "url",
          "group": "social",
          "label": "Dribbble",
          "icon": "brand-dribbble"
        },
        {
          "key": "social.behance",
          "type": "url",
          "group": "social",
          "label": "Behance",
          "icon": "brand-behance"
        },
        {
          "key": "legal.companyLegalName",
          "type": "string",
          "group": "legal",
          "label": "Company Legal Name"
        },
        {
          "key": "legal.companyName",
          "type": "string",
          "group": "legal",
          "label": "Company Name (for copyright)"
        },
        {
          "key": "legal.inn",
          "type": "string",
          "group": "legal",
          "label": "ИНН (Tax ID)"
        },
        {
          "key": "legal.kpp",
          "type": "string",
          "group": "legal",
          "label": "КПП"
        },
        {
          "key": "legal.ogrn",
          "type": "string",
          "group": "legal",
          "label": "ОГРН (Registration Number)"
        },
        {
          "key": "legal.address",
          "type": "string",
          "group": "legal",
          "label": "Legal Address"
        },
        {
          "key": "legal.email",
          "type": "email",
          "group": "legal",
          "label": "Legal Email"
        },
        {
          "key": "footer.ctaUrl",
          "type": "url",
          "group": "footer",
          "label": "CTA Button URL"
        },
        {
          "key": "seo.title",
          "type": "string",
          "group": "seo",
          "label": "Default Page Title"
        },
        {
          "key": "seo.description",
          "type": "text",
          "group": "seo",
          "label": "Meta Description"
        },
        {
          "key": "seo.keywords",
          "type": "text",
          "group": "seo",
          "label": "Meta Keywords (comma-separated)"
        },
        {
          "key": "analytics.googleId",
          "type": "string",
          "group": "integrations",
          "label": "Google Analytics ID (G-XXXXXXXX)"
        },
        {
          "key": "analytics.yandexId",
          "type": "string",
          "group": "integrations",
          "label": "Yandex Metrica ID"
        },
        {
          "key": "analytics.facebookPixel",
          "type": "string",
          "group": "integrations",
          "label": "Facebook Pixel ID"
        },
        {
          "key": "verification.google",
          "type": "string",
          "group": "integrations",
          "label": "Google Search Console"
        },
        {
          "key": "verification.yandex",
          "type": "string",
          "group": "integrations",
          "label": "Yandex Webmaster"
        }
      ],
      "settingGroups": [
        {
          "key": "contact",
          "label": "admin.settingsContact",
          "icon": "address-book"
        },
        {
          "key": "location",
          "label": "admin.settingsLocation",
          "icon": "map-pin"
        },
        {
          "key": "social",
          "label": "admin.settingsSocial",
          "icon": "share"
        },
        {
          "key": "integrations",
          "label": "admin.settingsIntegrations",
          "icon": "plug-connected"
        },
        {
          "key": "legal",
          "label": "admin.settingsLegal",
          "icon": "file-certificate"
        },
        {
          "key": "footer",
          "label": "admin.settingsFooter",
          "icon": "layout-bottombar"
        },
        {
          "key": "seo",
          "label": "admin.settingsSeo",
          "icon": "search"
        },
        {
          "key": "analytics",
          "label": "admin.settingsAnalytics",
          "icon": "chart-bar"
        },
        {
          "key": "verification",
          "label": "admin.settingsVerification",
          "icon": "certificate"
        }
      ],
      "headerContact": {
        "enabled": true,
        "items": [
          "contact.email",
          "social.telegram"
        ]
      },
      "hasWebsite": true,
      "hasApp": false,
      "hasAdmin": true,
      "hasLoginButton": false,
      "isAppOnly": false,
      "isWebsiteOnly": false,
      "isMultiLang": false,
      "hasThemeToggle": true,
      "useHeroParallax": false,
      "useScrollytelling": true,
      "has2FA": false,
      "useOnepager": true,
      "useInteractiveHeader": true,
      "headerFooterWidthMode": "contained"
    },
    "appVersion": "0.1.0",
    "buildVersion": "20260604T102914Z-unknown",
    "buildTimestamp": "2026-06-04T10:29:14.466Z",
    "buildSha": "unknown",
    "siteDomain": "fabrica22.pro",
    "pmMode": "build",
    "uptimeKumaUrl": "",
    "i18n": {
      "baseUrl": "",
      "defaultLocale": "ru",
      "rootRedirect": "",
      "redirectStatusCode": 302,
      "skipSettingLocaleOnNavigate": false,
      "locales": [
        {
          "code": "ru",
          "iso": "ru-RU",
          "name": "Русский",
          "preload": true,
          "language": ""
        },
        {
          "code": "en",
          "iso": "en-US",
          "name": "English",
          "preload": true,
          "language": ""
        }
      ],
      "detectBrowserLanguage": {
        "alwaysRedirect": false,
        "cookieCrossOrigin": false,
        "cookieDomain": "",
        "cookieKey": "i18n_redirected",
        "cookieSecure": false,
        "fallbackLocale": "ru",
        "redirectOn": "root",
        "useCookie": false
      },
      "experimental": {
        "localeDetector": "",
        "typedPages": true,
        "typedOptionsAndMessages": false,
        "alternateLinkCanonicalQueries": true,
        "devCache": false,
        "cacheLifetime": "",
        "stripMessagesPayload": false,
        "preload": false,
        "strictSeo": false,
        "nitroContextDetection": true,
        "httpCacheDuration": 10
      },
      "domainLocales": {
        "ru": {
          "domain": ""
        },
        "en": {
          "domain": ""
        }
      }
    }
  },
  "appVersion": "0.1.0",
  "buildVersion": "20260604T102914Z-unknown",
  "buildTimestamp": "2026-06-04T10:29:14.466Z",
  "buildSha": "unknown",
  "buildBranch": "unknown",
  "buildCommitMessage": "unknown",
  "databaseUrl": "./data/sqlite.db",
  "smtpHost": "smtp.yandex.ru",
  "smtpPort": "465",
  "smtpUser": "your-email@yandex.ru",
  "smtpPass": "your-app-password",
  "smtpFrom": "Your Site Name <your-email@yandex.ru>",
  "apiBaseUrl": "https://api.example.com/v1",
  "apiClientId": "your-client-id",
  "apiClientSecret": "your-client-secret",
  "apiTokenUrl": "https://auth.example.com/oauth/token",
  "apiJwtToken": "",
  "apiKey": "",
  "apiTokenRefreshBuffer": "300",
  "redisUrl": "",
  "redisPrefix": "pm-cache:",
  "netdataEnabled": "true",
  "netdataUrl": "http://127.0.0.1:19999",
  "opsAgentEnabled": "false",
  "opsAgentUrl": "http://127.0.0.1:3010",
  "opsAgentToken": "",
  "siteDomain": "fabrica22.pro"
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

getContext("nitro-app", {
  asyncContext: false,
  AsyncLocalStorage: void 0
});

const config$1 = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter({ routes: config$1.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function isJsonRequest(event) {
  if (hasReqHeader(event, "accept", "text/html")) {
    return false;
  }
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}

const iframeStorageBridge = (nonce) => (
  /* js */
  `
(function() {
  const memoryStore = {};

  const NONCE = ${JSON.stringify(nonce)}
  
  const mockStorage = {
    getItem: function(key) {
      return memoryStore[key] !== undefined ? memoryStore[key] : null;
    },
    setItem: function(key, value) {
      memoryStore[key] = String(value);
      window.parent.postMessage({
        type: 'storage-set',
        key: key,
        value: String(value),
        nonce: NONCE
      }, '*');
    },
    removeItem: function(key) {
      delete memoryStore[key];
      window.parent.postMessage({
        type: 'storage-remove',
        key: key,
        nonce: NONCE
      }, '*');
    },
    clear: function() {
      for (const key in memoryStore) {
        delete memoryStore[key];
      }
      window.parent.postMessage({
        type: 'storage-clear',
        nonce: NONCE
      }, '*');
    },
    key: function(index) {
      const keys = Object.keys(memoryStore);
      return keys[index] !== undefined ? keys[index] : null;
    },
    get length() {
      return Object.keys(memoryStore).length;
    }
  };
  
  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: false,
      configurable: true
    });
  } catch (e) {
    window.localStorage = mockStorage;
  }
  
  window.addEventListener('message', function(event) {
    if (event.data.type === 'storage-sync-data' && event.data.nonce === NONCE) {
      const data = event.data.data;
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          memoryStore[key] = data[key];
        }
      }
      if (typeof window.initTheme === 'function') {
        window.initTheme();
      }
      window.dispatchEvent(new Event('storage-ready'));
    }
  });
  
  window.parent.postMessage({ 
    type: 'storage-sync-request',
    nonce: NONCE
  }, '*');
})();
`
);
const parentStorageBridge = (nonce) => (
  /* js */
  `
(function() {
  const host = document.querySelector('nuxt-error-overlay');
  if (!host) return;
  
  // Wait for shadow root to be attached
  const checkShadow = setInterval(function() {
    if (host.shadowRoot) {
      clearInterval(checkShadow);
      const iframe = host.shadowRoot.getElementById('frame');
      if (!iframe) return;

      const NONCE = ${JSON.stringify(nonce)}
      
      window.addEventListener('message', function(event) {
        if (!event.data || event.data.nonce !== NONCE) return;
        
        const data = event.data;
        
        if (data.type === 'storage-set') {
          localStorage.setItem(data.key, data.value);
        } else if (data.type === 'storage-remove') {
          localStorage.removeItem(data.key);
        } else if (data.type === 'storage-clear') {
          localStorage.clear();
        } else if (data.type === 'storage-sync-request') {
          const allData = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            allData[key] = localStorage.getItem(key);
          }
          iframe.contentWindow.postMessage({
            type: 'storage-sync-data',
            data: allData,
            nonce: NONCE
          }, '*');
        }
      });
    }
  }, 10);
})();
`
);
const errorCSS = (
  /* css */
  `
:host {
  --preview-width: 240px;
  --preview-height: 180px;
  --base-width: 1200px;
  --base-height: 900px;
  --z-base: 999999998;
  all: initial;
  display: contents;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
#frame {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  border: none;
  z-index: var(--z-base);
}
#frame[inert] {
  right: 5px;
  bottom: 5px;
  left: auto;
  top: auto;
  width: var(--base-width);
  height: var(--base-height);
  transform: scale(calc(240 / 1200));
  transform-origin: bottom right;
  overflow: hidden;
  border-radius: calc(1200 * 8px / 240);
}
#preview {
  position: fixed;
  right: 5px;
  bottom: 5px;
  width: var(--preview-width);
  height: var(--preview-height);
  overflow: hidden;
  border-radius: 8px;
  pointer-events: none;
  z-index: var(--z-base);
  background: white;
  display: none;
}
#frame:not([inert]) + #preview {
  display: block;
}
#toggle {
  position: fixed;
  right: 5px;
  bottom: 5px;
  width: var(--preview-width);
  height: var(--preview-height);
  background: none;
  border: 3px solid #00DC82;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s, box-shadow 0.2s;
  z-index: calc(var(--z-base) + 1);
}
#toggle:hover,
#toggle:focus {
  opacity: 1;
  box-shadow: 0 0 20px rgba(0, 220, 130, 0.6);
}
#toggle:focus-visible {
  outline: 3px solid #00DC82;
  outline-offset: 3px;
  box-shadow: 0 0 24px rgba(0, 220, 130, 0.8);
}
@media (prefers-reduced-motion: reduce) {
  #toggle {
    transition: none;
  }
}
`
);
function webComponentScript(base64HTML, startMinimized) {
  return (
    /* js */
    `
  (function() {
    try {
      const host = document.querySelector('nuxt-error-overlay');
      if (!host) return;
      
      const shadow = host.attachShadow({ mode: 'open' });
      
      // Create elements
      const style = document.createElement('style');
      style.textContent = ${JSON.stringify(errorCSS)};
      
      const iframe = document.createElement('iframe');
      iframe.id = 'frame';
      iframe.src = 'data:text/html;base64,${base64HTML}';
      iframe.title = 'Detailed error stack trace';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      
      const preview = document.createElement('div');
      preview.id = 'preview';
      
      const button = document.createElement('button');
      button.id = 'toggle';
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('type', 'button');
      button.innerHTML = '<span class="sr-only">Toggle detailed error view</span>';
      
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.className = 'sr-only';
      
      // Update preview snapshot
      function updatePreview() {
        try {
          let previewIframe = preview.querySelector('iframe');
          if (!previewIframe) {
            previewIframe = document.createElement('iframe');
            previewIframe.style.cssText = 'width: 1200px; height: 900px; transform: scale(0.2); transform-origin: top left; border: none;';
            previewIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            preview.appendChild(previewIframe);
          }
          
          const doctype = document.doctype ? '<!DOCTYPE ' + document.doctype.name + '>' : '';
          const cleanedHTML = document.documentElement.outerHTML
            .replace(/<nuxt-error-overlay[^>]*>.*?<\\/nuxt-error-overlay>/gs, '')
            .replace(/<script[^>]*>.*?<\\/script>/gs, '');
          
          const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(doctype + cleanedHTML);
          iframeDoc.close();
        } catch (error) {
          console.error('Failed to update preview:', error);
        }
      }
      
      function toggleView() {
        const isMinimized = iframe.hasAttribute('inert');
        
        if (isMinimized) {
          updatePreview();
          iframe.removeAttribute('inert');
          button.setAttribute('aria-expanded', 'true');
          liveRegion.textContent = 'Showing detailed error view';
          setTimeout(function() {
            try { iframe.contentWindow.focus(); } catch {}
          }, 100);
        } else {
          iframe.setAttribute('inert', '');
          button.setAttribute('aria-expanded', 'false');
          liveRegion.textContent = 'Showing error page';
          button.focus();
        }
      }
      
      button.onclick = toggleView;
      
      document.addEventListener('keydown', function(e) {
        if ((e.key === 'Escape' || e.key === 'Esc') && !iframe.hasAttribute('inert')) {
          toggleView();
        }
      });
      
      // Append to shadow DOM
      shadow.appendChild(style);
      shadow.appendChild(liveRegion);
      shadow.appendChild(iframe);
      shadow.appendChild(preview);
      shadow.appendChild(button);
      
      if (${startMinimized}) {
        iframe.setAttribute('inert', '');
        button.setAttribute('aria-expanded', 'false');
      }
      
      // Initialize preview
      setTimeout(updatePreview, 100);
      
    } catch (error) {
      console.error('Failed to initialize Nuxt error overlay:', error);
    }
  })();
  `
  );
}
function generateErrorOverlayHTML(html, options) {
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  const errorPage = html.replace("<head>", `<head><script>${iframeStorageBridge(nonce)}<\/script>`);
  const base64HTML = Buffer.from(errorPage, "utf8").toString("base64");
  return `
    <script>${parentStorageBridge(nonce)}<\/script>
    <nuxt-error-overlay></nuxt-error-overlay>
    <script>${webComponentScript(base64HTML, options?.startMinimized ?? false)}<\/script>
  `;
}

const errorHandler$0 = (async function errorhandler(error, event, { defaultHandler }) {
  if (event.handled || isJsonRequest(event)) {
    return;
  }
  const defaultRes = await defaultHandler(error, event, { json: true });
  const statusCode = error.statusCode || 500;
  if (statusCode === 404 && defaultRes.status === 302) {
    setResponseHeaders(event, defaultRes.headers);
    setResponseStatus(event, defaultRes.status, defaultRes.statusText);
    return send(event, JSON.stringify(defaultRes.body, null, 2));
  }
  if (typeof defaultRes.body !== "string" && Array.isArray(defaultRes.body.stack)) {
    defaultRes.body.stack = defaultRes.body.stack.join("\n");
  }
  const errorObject = defaultRes.body;
  const url = new URL(errorObject.url);
  errorObject.url = withoutBase(url.pathname, useRuntimeConfig(event).app.baseURL) + url.search + url.hash;
  errorObject.message ||= "Server Error";
  errorObject.data ||= error.data;
  errorObject.statusMessage ||= error.statusMessage;
  delete defaultRes.headers["content-type"];
  delete defaultRes.headers["content-security-policy"];
  setResponseHeaders(event, defaultRes.headers);
  const reqHeaders = getRequestHeaders(event);
  const isRenderingError = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"];
  const res = isRenderingError ? null : await useNitroApp().localFetch(
    withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject),
    {
      headers: { ...reqHeaders, "x-nuxt-error": "true" },
      redirect: "manual"
    }
  ).catch(() => null);
  if (event.handled) {
    return;
  }
  if (!res) {
    const { template } = await Promise.resolve().then(function () { return error500; });
    {
      errorObject.description = errorObject.message;
    }
    setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
    return send(event, template(errorObject));
  }
  const html = await res.text();
  for (const [header, value] of res.headers.entries()) {
    if (header === "set-cookie") {
      appendResponseHeader(event, header, value);
      continue;
    }
    setResponseHeader(event, header, value);
  }
  setResponseStatus(event, res.status && res.status !== 200 ? res.status : defaultRes.status, res.statusText || defaultRes.statusText);
  if (!globalThis._importMeta_.test && typeof html === "string") {
    const prettyResponse = await defaultHandler(error, event, { json: false });
    return send(event, html.replace("</body>", `${generateErrorOverlayHTML(prettyResponse.body, { startMinimized: 300 <= statusCode && statusCode < 500 })}</body>`));
  }
  return send(event, html);
});

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$1 = defineNitroErrorHandler(
  async function defaultNitroErrorHandler(error, event) {
    const res = await defaultHandler(error, event);
    if (!event.node?.res.headersSent) {
      setResponseHeaders(event, res.headers);
    }
    setResponseStatus(event, res.status, res.statusText);
    return send(
      event,
      typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2)
    );
  }
);
async function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  await loadStackTrace(error).catch(consola.error);
  const youch = new Youch();
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    const ansiError = await (await youch.toANSI(error)).replaceAll(process.cwd(), ".");
    consola.error(
      `[request error] ${tags} [${event.method}] ${url}

`,
      ansiError
    );
  }
  const useJSON = opts?.json || !getRequestHeader(event, "accept")?.includes("text/html");
  const headers = {
    "content-type": useJSON ? "application/json" : "text/html",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self';"
  };
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = useJSON ? {
    error: true,
    url,
    statusCode,
    statusMessage,
    message: error.message,
    data: error.data,
    stack: error.stack?.split("\n").map((line) => line.trim())
  } : await youch.toHTML(error, {
    request: {
      url: url.href,
      method: event.method,
      headers: getRequestHeaders(event)
    }
  });
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}
async function loadStackTrace(error) {
  if (!(error instanceof Error)) {
    return;
  }
  const parsed = await new ErrorParser().defineSourceLoader(sourceLoader).parse(error);
  const stack = error.message + "\n" + parsed.frames.map((frame) => fmtFrame(frame)).join("\n");
  Object.defineProperty(error, "stack", { value: stack });
  if (error.cause) {
    await loadStackTrace(error.cause).catch(consola.error);
  }
}
async function sourceLoader(frame) {
  if (!frame.fileName || frame.fileType !== "fs" || frame.type === "native") {
    return;
  }
  if (frame.type === "app") {
    const rawSourceMap = await readFile(`${frame.fileName}.map`, "utf8").catch(() => {
    });
    if (rawSourceMap) {
      const consumer = await new SourceMapConsumer(rawSourceMap);
      const originalPosition = consumer.originalPositionFor({ line: frame.lineNumber, column: frame.columnNumber });
      if (originalPosition.source && originalPosition.line) {
        frame.fileName = resolve(dirname(frame.fileName), originalPosition.source);
        frame.lineNumber = originalPosition.line;
        frame.columnNumber = originalPosition.column || 0;
      }
    }
  }
  const contents = await readFile(frame.fileName, "utf8").catch(() => {
  });
  return contents ? { contents } : void 0;
}
function fmtFrame(frame) {
  if (frame.type === "native") {
    return frame.raw;
  }
  const src = `${frame.fileName || ""}:${frame.lineNumber}:${frame.columnNumber})`;
  return frame.functionName ? `at ${frame.functionName} (${src}` : `at ${src}`;
}

const errorHandlers = [errorHandler$0, errorHandler$1];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

/*!
  * shared v11.2.2
  * (c) 2025 kazuya kawaguchi
  * Released under the MIT License.
  */
const _create = Object.create;
const create = (obj = null) => _create(obj);
/* eslint-enable */
/**
 * Useful Utilities By Evan you
 * Modified by kazuya kawaguchi
 * MIT License
 * https://github.com/vuejs/vue-next/blob/master/packages/shared/src/index.ts
 * https://github.com/vuejs/vue-next/blob/master/packages/shared/src/codeframe.ts
 */
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isObject = (val) => val !== null && typeof val === 'object';
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);

const isNotObjectOrIsArray = (val) => !isObject(val) || isArray(val);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepCopy(src, des) {
    // src and des should both be objects, and none of them can be a array
    if (isNotObjectOrIsArray(src) || isNotObjectOrIsArray(des)) {
        throw new Error('Invalid value');
    }
    const stack = [{ src, des }];
    while (stack.length) {
        const { src, des } = stack.pop();
        // using `Object.keys` which skips prototype properties
        Object.keys(src).forEach(key => {
            if (key === '__proto__') {
                return;
            }
            // if src[key] is an object/array, set des[key]
            // to empty object/array to prevent setting by reference
            if (isObject(src[key]) && !isObject(des[key])) {
                des[key] = Array.isArray(src[key]) ? [] : create();
            }
            if (isNotObjectOrIsArray(des[key]) || isNotObjectOrIsArray(src[key])) {
                // replace with src[key] when:
                // src[key] or des[key] is not an object, or
                // src[key] or des[key] is an array
                des[key] = src[key];
            }
            else {
                // src[key] and des[key] are both objects, merge them
                stack.push({ src: src[key], des: des[key] });
            }
        });
    }
}

const __nuxtMock = { runWithContext: async (fn) => await fn() };
const merger = createDefu((obj, key, value) => {
  if (key === "messages" || key === "datetimeFormats" || key === "numberFormats") {
    obj[key] ??= create(null);
    deepCopy(value, obj[key]);
    return true;
  }
});
async function loadVueI18nOptions(vueI18nConfigs) {
  const nuxtApp = __nuxtMock;
  let vueI18nOptions = { messages: create(null) };
  for (const configFile of vueI18nConfigs) {
    const resolver = await configFile().then((x) => x.default);
    const resolved = isFunction(resolver) ? await nuxtApp.runWithContext(() => resolver()) : resolver;
    vueI18nOptions = merger(create(null), resolved, vueI18nOptions);
  }
  vueI18nOptions.fallbackLocale ??= false;
  return vueI18nOptions;
}
const isModule = (val) => toTypeString(val) === "[object Module]";
const isResolvedModule = (val) => isModule(val) || true;
async function getLocaleMessages(locale, loader) {
  const nuxtApp = __nuxtMock;
  try {
    const getter = await nuxtApp.runWithContext(loader.load).then((x) => isResolvedModule(x) ? x.default : x);
    return isFunction(getter) ? await nuxtApp.runWithContext(() => getter(locale)) : getter;
  } catch (e) {
    throw new Error(`Failed loading locale (${locale}): ` + e.message);
  }
}
async function getLocaleMessagesMerged(locale, loaders = []) {
  const nuxtApp = __nuxtMock;
  const messages = await Promise.all(
    loaders.map((loader) => nuxtApp.runWithContext(() => getLocaleMessages(locale, loader)))
  );
  const merged = {};
  for (const message of messages) {
    deepCopy(message, merged);
  }
  return merged;
}

// @ts-nocheck
const localeCodes =  [
  "ru",
  "en"
];
const localeLoaders = {
  ru: [
    {
      key: "locale_loader_46ts_e910167d",
      load: () => Promise.resolve().then(function () { return loader$1; }),
      cache: false
    }
  ],
  en: [
    {
      key: "locale_loader_46ts_e910167d",
      load: () => Promise.resolve().then(function () { return loader$1; }),
      cache: false
    }
  ]
};
const vueI18nConfigs = [];
const normalizedLocales = [
  {
    code: "ru",
    iso: "ru-RU",
    name: "Русский",
    preload: true,
    language: undefined
  },
  {
    code: "en",
    iso: "en-US",
    name: "English",
    preload: true,
    language: undefined
  }
];

const setupVueI18nOptions = async (defaultLocale) => {
  const options = await loadVueI18nOptions(vueI18nConfigs);
  options.locale = defaultLocale || options.locale || "en-US";
  options.defaultLocale = defaultLocale;
  options.fallbackLocale ??= false;
  options.messages ??= {};
  for (const locale of localeCodes) {
    options.messages[locale] ??= {};
  }
  return options;
};

function defineNitroPlugin(def) {
  return def;
}

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader(event, "Content-Type", "image/x-icon");
        return send(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus(event);
        setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
}

const r=Object.create(null),i=e=>globalThis.process?.env||globalThis._importMeta_.env||globalThis.Deno?.env.toObject()||globalThis.__env__||(e?r:globalThis),o=new Proxy(r,{get(e,s){return i()[s]??r[s]},has(e,s){const E=i();return s in E||s in r},set(e,s,E){const B=i(true);return B[s]=E,true},deleteProperty(e,s){if(!s)return  false;const E=i(true);return delete E[s],true},ownKeys(){const e=i(true);return Object.keys(e)}}),t=typeof process<"u"&&process.env&&"development"||"",f=[["APPVEYOR"],["AWS_AMPLIFY","AWS_APP_ID",{ci:true}],["AZURE_PIPELINES","SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"],["AZURE_STATIC","INPUT_AZURE_STATIC_WEB_APPS_API_TOKEN"],["APPCIRCLE","AC_APPCIRCLE"],["BAMBOO","bamboo_planKey"],["BITBUCKET","BITBUCKET_COMMIT"],["BITRISE","BITRISE_IO"],["BUDDY","BUDDY_WORKSPACE_ID"],["BUILDKITE"],["CIRCLE","CIRCLECI"],["CIRRUS","CIRRUS_CI"],["CLOUDFLARE_PAGES","CF_PAGES",{ci:true}],["CLOUDFLARE_WORKERS","WORKERS_CI",{ci:true}],["CODEBUILD","CODEBUILD_BUILD_ARN"],["CODEFRESH","CF_BUILD_ID"],["DRONE"],["DRONE","DRONE_BUILD_EVENT"],["DSARI"],["GITHUB_ACTIONS"],["GITLAB","GITLAB_CI"],["GITLAB","CI_MERGE_REQUEST_ID"],["GOCD","GO_PIPELINE_LABEL"],["LAYERCI"],["HUDSON","HUDSON_URL"],["JENKINS","JENKINS_URL"],["MAGNUM"],["NETLIFY"],["NETLIFY","NETLIFY_LOCAL",{ci:false}],["NEVERCODE"],["RENDER"],["SAIL","SAILCI"],["SEMAPHORE"],["SCREWDRIVER"],["SHIPPABLE"],["SOLANO","TDDIUM"],["STRIDER"],["TEAMCITY","TEAMCITY_VERSION"],["TRAVIS"],["VERCEL","NOW_BUILDER"],["VERCEL","VERCEL",{ci:false}],["VERCEL","VERCEL_ENV",{ci:false}],["APPCENTER","APPCENTER_BUILD_ID"],["CODESANDBOX","CODESANDBOX_SSE",{ci:false}],["CODESANDBOX","CODESANDBOX_HOST",{ci:false}],["STACKBLITZ"],["STORMKIT"],["CLEAVR"],["ZEABUR"],["CODESPHERE","CODESPHERE_APP_ID",{ci:true}],["RAILWAY","RAILWAY_PROJECT_ID"],["RAILWAY","RAILWAY_SERVICE_ID"],["DENO-DEPLOY","DENO_DEPLOYMENT_ID"],["FIREBASE_APP_HOSTING","FIREBASE_APP_HOSTING",{ci:true}]];function b(){if(globalThis.process?.env)for(const e of f){const s=e[1]||e[0];if(globalThis.process?.env[s])return {name:e[0].toLowerCase(),...e[2]}}return globalThis.process?.env?.SHELL==="/bin/jsh"&&globalThis.process?.versions?.webcontainer?{name:"stackblitz",ci:false}:{name:"",ci:false}}const l=b();l.name;function n(e){return e?e!=="false":false}const I=globalThis.process?.platform||"",T=n(o.CI)||l.ci!==false,R=n(globalThis.process?.stdout&&globalThis.process?.stdout.isTTY);n(o.DEBUG);const a=t==="test"||n(o.TEST);n(o.MINIMAL)||T||a||!R;const A=/^win/i.test(I);!n(o.NO_COLOR)&&(n(o.FORCE_COLOR)||(R||A)&&o.TERM!=="dumb"||T);const C=(globalThis.process?.versions?.node||"").replace(/^v/,"")||null;Number(C?.split(".")[0])||null;const W=globalThis.process||Object.create(null),_={versions:{}};new Proxy(W,{get(e,s){if(s==="env")return o;if(s in e)return e[s];if(s in _)return _[s]}});const O=globalThis.process?.release?.name==="node",c=!!globalThis.Bun||!!globalThis.process?.versions?.bun,D=!!globalThis.Deno,L=!!globalThis.fastly,S=!!globalThis.Netlify,u=!!globalThis.EdgeRuntime,N=globalThis.navigator?.userAgent==="Cloudflare-Workers",F=[[S,"netlify"],[u,"edge-light"],[N,"workerd"],[L,"fastly"],[D,"deno"],[c,"bun"],[O,"node"]];function G(){const e=F.find(s=>s[0]);if(e)return {name:e[1]}}const P=G();P?.name||"";

const scheduledTasks = [{"cron":"0 * * * *","tasks":["cleanup-sessions"]}];

const tasks = {
  "cleanup-sessions": {
          meta: {
            description: "",
          },
          resolve: () => Promise.resolve().then(function () { return cleanupSessions$1; }).then(r => r.default || r),
        }
};

function defineTask(def) {
  if (typeof def.run !== "function") {
    def.run = () => {
      throw new TypeError("Task must implement a `run` method!");
    };
  }
  return def;
}
const __runningTasks__ = {};
async function runTask(name, {
  payload = {},
  context = {}
} = {}) {
  if (__runningTasks__[name]) {
    return __runningTasks__[name];
  }
  if (!(name in tasks)) {
    throw createError({
      message: `Task \`${name}\` is not available!`,
      statusCode: 404
    });
  }
  if (!tasks[name].resolve) {
    throw createError({
      message: `Task \`${name}\` is not implemented!`,
      statusCode: 501
    });
  }
  const handler = await tasks[name].resolve();
  const taskEvent = { name, payload, context };
  __runningTasks__[name] = handler.run(taskEvent);
  try {
    const res = await __runningTasks__[name];
    return res;
  } finally {
    delete __runningTasks__[name];
  }
}
function startScheduleRunner() {
  if (!scheduledTasks || scheduledTasks.length === 0 || a) {
    return;
  }
  const payload = {
    scheduledTime: Date.now()
  };
  for (const schedule of scheduledTasks) {
    new Cron(schedule.cron, async () => {
      await Promise.all(
        schedule.tasks.map(
          (name) => runTask(name, {
            payload,
            context: {}
          }).catch((error) => {
            console.error(
              `Error while running scheduled task "${name}"`,
              error
            );
          })
        )
      );
    });
  }
}

function buildAssetsDir() {
  return useRuntimeConfig().app.buildAssetsDir;
}
function buildAssetsURL(...path) {
  return joinRelativeURL(publicAssetsURL(), buildAssetsDir(), ...path);
}
function publicAssetsURL(...path) {
  const app = useRuntimeConfig().app;
  const publicBase = app.cdnURL || app.baseURL;
  return path.length ? joinRelativeURL(publicBase, ...path) : publicBase;
}

function parseAcceptLanguage(value) {
  return value.split(",").map((tag) => tag.split(";")[0]).filter(
    (tag) => !(tag === "*" || tag === "")
  );
}
function createPathIndexLanguageParser(index = 0) {
  return (path) => {
    const rawPath = typeof path === "string" ? path : path.pathname;
    const normalizedPath = rawPath.split("?")[0];
    const parts = normalizedPath.split("/");
    if (parts[0] === "") {
      parts.shift();
    }
    return parts.length > index ? parts[index] || "" : "";
  };
}

const USER_ROLES = ["master", "admin", "editor"];
const ADMIN_PAGE_IDS = [
  // System pages
  "users",
  "roles",
  "translations",
  "settings",
  "health",
  // Content pages
  "sections",
  "blog",
  "portfolios",
  "team",
  "testimonials",
  "faq",
  "clients",
  "pricing",
  "features",
  "contacts"
];
const ROLE_COLORS = ["primary", "secondary", "warning", "success", "danger"];
const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  permissions: text("permissions").notNull(),
  // JSON of RolePermissions
  level: integer("level").notNull().default(0),
  // Higher = more authority
  isBuiltIn: integer("is_built_in", { mode: "boolean" }).default(false),
  color: text("color").default("secondary"),
  icon: text("icon").default("pencil"),
  // Icon name for custom roles
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  // Legacy role column (for backward compatibility during migration)
  role: text("role", { enum: ["master", "admin", "editor"] }).default("editor").notNull(),
  // New dynamic role reference
  roleId: integer("role_id").references(() => roles.id, { onDelete: "set null" }),
  // Account lockout fields (CRIT-04)
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
  lastFailedLogin: integer("last_failed_login", { mode: "timestamp" }),
  // Two-factor authentication
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    // UUID
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    index("sessions_user_expires_idx").on(table.userId, table.expiresAt),
    index("sessions_expires_idx").on(table.expiresAt)
  ]
);
const user2fa = sqliteTable(
  "user_2fa",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    // Encrypted TOTP secret (base32 encoded)
    secret: text("secret").notNull(),
    // JSON array of hashed backup codes (10 codes, each usable once)
    backupCodes: text("backup_codes").notNull(),
    // Number of backup codes remaining
    backupCodesRemaining: integer("backup_codes_remaining").default(10),
    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [index("user_2fa_user_idx").on(table.userId)]
);
const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  type: text("type", { enum: ["string", "number", "boolean", "json"] }).default("string").notNull(),
  group: text("group").default("general"),
  // For organizing in admin UI
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
const PORTFOLIO_TYPES = ["gallery", "case_study"];
const PORTFOLIO_ITEM_TYPES = ["image", "video", "link", "case_study"];
const portfolios = sqliteTable(
  "portfolios",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type", { enum: ["gallery", "case_study"] }).notNull(),
    coverImageUrl: text("cover_image_url"),
    coverThumbnailUrl: text("cover_thumbnail_url"),
    order: integer("order").default(0),
    published: integer("published", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [index("portfolios_published_idx").on(table.published)]
);
const portfolioItems = sqliteTable(
  "portfolio_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
    itemType: text("item_type", { enum: ["image", "video", "link", "case_study"] }).notNull(),
    // Common fields
    order: integer("order").default(0),
    published: integer("published", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()),
    // Media fields (for gallery items: image, video, link)
    mediaUrl: text("media_url"),
    // Image/video URL or external link
    thumbnailUrl: text("thumbnail_url"),
    // Thumbnail for image/video
    caption: text("caption"),
    // Brief caption for gallery items
    // Case study fields (for case_study items)
    slug: text("slug"),
    // Unique within portfolio
    title: text("title"),
    // Case study title
    description: text("description"),
    // Short description
    content: text("content"),
    // Rich text / markdown
    tags: text("tags"),
    // JSON array stored as text
    category: text("category"),
    // Category label
    publishedAt: integer("published_at", { mode: "timestamp" })
  },
  (table) => [index("portfolio_items_portfolio_idx").on(table.portfolioId)]
);
const contactSubmissions = sqliteTable("contact_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject"),
  message: text("message").notNull(),
  read: integer("read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
const PRICING_PERIODS = ["month", "year", "one-time"];
const pricingTiers = sqliteTable("pricing_tiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  // 'starter', 'pro', 'enterprise'
  name: text("name").notNull(),
  // Display name (translatable via i18n key)
  description: text("description"),
  // Short description
  price: integer("price"),
  // Price in cents (null = custom/contact)
  currency: text("currency").default("USD"),
  period: text("period", { enum: ["month", "year", "one-time"] }).default("month"),
  featured: integer("featured", { mode: "boolean" }).default(false),
  // Highlight this tier
  ctaText: text("cta_text"),
  // Button text (translatable via i18n key)
  ctaUrl: text("cta_url").default("/contact"),
  // Button link
  order: integer("order").default(0),
  published: integer("published", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
const pricingFeatures = sqliteTable(
  "pricing_features",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tierId: integer("tier_id").notNull().references(() => pricingTiers.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    // Feature description (default/fallback)
    included: integer("included", { mode: "boolean" }).default(true),
    // ✓ or ✗
    order: integer("order").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [index("pricing_features_tier_idx").on(table.tierId)]
);
const pricingTierTranslations = sqliteTable(
  "pricing_tier_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tierId: integer("tier_id").notNull().references(() => pricingTiers.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    // 'en', 'ru', 'he'
    name: text("name"),
    // Translated name
    description: text("description"),
    // Translated description
    ctaText: text("cta_text"),
    // Translated CTA button text
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    unique().on(table.tierId, table.locale),
    index("pricing_tier_translations_tier_idx").on(table.tierId)
  ]
);
const pricingFeatureTranslations = sqliteTable(
  "pricing_feature_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    featureId: integer("feature_id").notNull().references(() => pricingFeatures.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    // 'en', 'ru', 'he'
    text: text("text"),
    // Translated feature text
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    unique().on(table.featureId, table.locale),
    index("pricing_feature_translations_feature_idx").on(table.featureId)
  ]
);
const teamMembers = sqliteTable(
  "team_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    position: text("position"),
    bio: text("bio"),
    photoUrl: text("photo_url"),
    hoverPhotoUrl: text("hover_photo_url"),
    // Photo shown on hover
    email: text("email"),
    phone: text("phone"),
    department: text("department"),
    socialLinks: text("social_links"),
    // JSON: {linkedin, twitter, github, etc.}
    published: integer("published", { mode: "boolean" }).default(true),
    order: integer("order").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [index("team_members_published_idx").on(table.published)]
);
const teamMemberTranslations = sqliteTable(
  "team_member_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    position: text("position"),
    bio: text("bio"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    unique().on(table.memberId, table.locale),
    index("team_member_translations_member_idx").on(table.memberId)
  ]
);
const blogCategories = sqliteTable("blog_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  order: integer("order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
const blogCategoryTranslations = sqliteTable(
  "blog_category_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoryId: integer("category_id").notNull().references(() => blogCategories.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    unique().on(table.categoryId, table.locale),
    index("blog_category_translations_category_idx").on(table.categoryId)
  ]
);
const blogTags = sqliteTable("blog_tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
const blogPosts = sqliteTable(
  "blog_posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
    categoryId: integer("category_id").references(() => blogCategories.id, { onDelete: "set null" }),
    coverImageUrl: text("cover_image_url"),
    coverImageAlt: text("cover_image_alt"),
    published: integer("published", { mode: "boolean" }).default(false),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    readingTimeMinutes: integer("reading_time_minutes"),
    viewCount: integer("view_count").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    index("blog_posts_published_idx").on(table.published),
    index("blog_posts_author_idx").on(table.authorId),
    index("blog_posts_category_idx").on(table.categoryId)
  ]
);
const blogPostTranslations = sqliteTable(
  "blog_post_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content"),
    // Markdown
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    unique().on(table.postId, table.locale),
    index("blog_post_translations_post_idx").on(table.postId)
  ]
);
const blogPostTags = sqliteTable(
  "blog_post_tags",
  {
    postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id").notNull().references(() => blogTags.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    index("blog_post_tags_post_idx").on(table.postId),
    index("blog_post_tags_tag_idx").on(table.tagId)
  ]
);
const blogMedia = sqliteTable(
  "blog_media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["image", "video"] }).notNull(),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    alt: text("alt"),
    width: integer("width"),
    height: integer("height"),
    sizeBytes: integer("size_bytes"),
    order: integer("order").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [index("blog_media_post_idx").on(table.postId)]
);
const CLIENT_CATEGORIES = ["client", "sponsor", "partner"];
const clients = sqliteTable(
  "clients",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    logoUrl: text("logo_url").notNull(),
    websiteUrl: text("website_url"),
    category: text("category", { enum: ["client", "sponsor", "partner"] }).default("client"),
    featured: integer("featured", { mode: "boolean" }).default(false),
    published: integer("published", { mode: "boolean" }).default(true),
    order: integer("order").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [index("clients_published_idx").on(table.published)]
);
const features = sqliteTable(
  "features",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    imageUrl: text("image_url"),
    // Feature image (required for display)
    hoverImageUrl: text("hover_image_url"),
    // Image shown on hover
    category: text("category"),
    published: integer("published", { mode: "boolean" }).default(true),
    order: integer("order").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [index("features_published_idx").on(table.published)]
);
const featureTranslations = sqliteTable(
  "feature_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    featureId: integer("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    unique().on(table.featureId, table.locale),
    index("feature_translations_feature_idx").on(table.featureId)
  ]
);
const testimonials = sqliteTable(
  "testimonials",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    authorName: text("author_name").notNull(),
    authorTitle: text("author_title"),
    authorCompany: text("author_company"),
    authorPhotoUrl: text("author_photo_url"),
    rating: integer("rating"),
    // 1-5 stars, optional
    featured: integer("featured", { mode: "boolean" }).default(false),
    published: integer("published", { mode: "boolean" }).default(true),
    order: integer("order").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [index("testimonials_published_idx").on(table.published)]
);
const testimonialTranslations = sqliteTable(
  "testimonial_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    testimonialId: integer("testimonial_id").notNull().references(() => testimonials.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    quote: text("quote").notNull(),
    authorTitle: text("author_title"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    unique().on(table.testimonialId, table.locale),
    index("testimonial_translations_testimonial_idx").on(table.testimonialId)
  ]
);
const faqItems = sqliteTable(
  "faq_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    category: text("category"),
    published: integer("published", { mode: "boolean" }).default(true),
    order: integer("order").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [index("faq_items_published_idx").on(table.published)]
);
const faqItemTranslations = sqliteTable(
  "faq_item_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    faqItemId: integer("faq_item_id").notNull().references(() => faqItems.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    // Markdown supported
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    unique().on(table.faqItemId, table.locale),
    index("faq_item_translations_faq_idx").on(table.faqItemId)
  ]
);
const translations = sqliteTable(
  "translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    locale: text("locale").notNull(),
    // 'en', 'ru', 'he'
    key: text("key").notNull(),
    // 'nav.home', 'common.submit'
    value: text("value").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [unique().on(table.locale, table.key)]
);
const AUDIT_ACTIONS = [
  "login",
  "login_failed",
  "logout",
  "password_change",
  "role_change",
  "user_create",
  "user_update",
  "user_delete",
  "account_locked",
  "account_unlocked",
  "session_expired",
  // Role management
  "role_create",
  "role_update",
  "role_delete",
  "settings_update",
  "terminal_command",
  "ops_action",
  "support_bundle_export",
  // Two-Factor Authentication
  "2fa_enabled",
  "2fa_disabled",
  "2fa_verified",
  "2fa_failed"
];
const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    action: text("action").notNull(),
    // AuditAction
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    // Actor (null for system)
    targetUserId: integer("target_user_id").references(() => users.id, { onDelete: "set null" }),
    // Affected user
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    details: text("details"),
    // JSON with additional context
    success: integer("success", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
  },
  (table) => [
    index("audit_logs_created_idx").on(table.createdAt),
    index("audit_logs_action_idx").on(table.action)
  ]
);

const schema = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  ADMIN_PAGE_IDS: ADMIN_PAGE_IDS,
  AUDIT_ACTIONS: AUDIT_ACTIONS,
  CLIENT_CATEGORIES: CLIENT_CATEGORIES,
  PORTFOLIO_ITEM_TYPES: PORTFOLIO_ITEM_TYPES,
  PORTFOLIO_TYPES: PORTFOLIO_TYPES,
  PRICING_PERIODS: PRICING_PERIODS,
  ROLE_COLORS: ROLE_COLORS,
  USER_ROLES: USER_ROLES,
  auditLogs: auditLogs,
  blogCategories: blogCategories,
  blogCategoryTranslations: blogCategoryTranslations,
  blogMedia: blogMedia,
  blogPostTags: blogPostTags,
  blogPostTranslations: blogPostTranslations,
  blogPosts: blogPosts,
  blogTags: blogTags,
  clients: clients,
  contactSubmissions: contactSubmissions,
  faqItemTranslations: faqItemTranslations,
  faqItems: faqItems,
  featureTranslations: featureTranslations,
  features: features,
  portfolioItems: portfolioItems,
  portfolios: portfolios,
  pricingFeatureTranslations: pricingFeatureTranslations,
  pricingFeatures: pricingFeatures,
  pricingTierTranslations: pricingTierTranslations,
  pricingTiers: pricingTiers,
  roles: roles,
  sessions: sessions,
  settings: settings,
  teamMemberTranslations: teamMemberTranslations,
  teamMembers: teamMembers,
  testimonialTranslations: testimonialTranslations,
  testimonials: testimonials,
  translations: translations,
  user2fa: user2fa,
  users: users
}, Symbol.toStringTag, { value: 'Module' }));

const MAX_BUFFER_SIZE = 500;
const buffer = [];
function getRecentLogs(limit = 100, minLevel = 0) {
  const filtered = minLevel > 0 ? buffer.filter((entry) => entry.level >= minLevel) : buffer;
  return filtered.slice(-limit).reverse();
}
function getBufferStats() {
  const firstEntry = buffer[0];
  return {
    size: buffer.length,
    maxSize: MAX_BUFFER_SIZE,
    oldestEntry: firstEntry ? firstEntry.time : null
  };
}

const isProduction = false;
const logLevel = process.env.LOG_LEVEL || ("debug");
const destinations = void 0;
const logger = pino(
  {
    level: logLevel,
    // Base context added to all logs
    base: {
      service: "puppetmaster2",
      version: process.env.npm_package_version || "1.0.0",
      environment: "development"
    },
    // Timestamp format
    timestamp: pino.stdTimeFunctions.isoTime,
    // Development: Pretty output with pino-pretty (can't use multistream with transport)
    ...{
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname,service,version,environment"
        }
      }
    },
    // Production: use hooks to capture logs to buffer
    ...isProduction
  },
  // Pass multistream destination for production
  destinations
);

let _db = null;
let _sqlite = null;
function resolveDatabasePath(dbPath) {
  if (isAbsolute(dbPath)) {
    return dbPath;
  }
  const cwdCandidate = resolve(process.cwd(), dbPath);
  if (existsSync(cwdCandidate)) {
    return cwdCandidate;
  }
  const parentCandidate = resolve(process.cwd(), "..", dbPath);
  if (existsSync(parentCandidate)) {
    return parentCandidate;
  }
  return cwdCandidate;
}
function useDatabase() {
  if (!_db) {
    const config = useRuntimeConfig();
    const dbPath = resolveDatabasePath(config.databaseUrl || "./data/sqlite.db");
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    _sqlite = new Database(dbPath);
    _sqlite.pragma("journal_mode = WAL");
    _sqlite.pragma("busy_timeout = 5000");
    _db = drizzle(_sqlite, { schema });
  }
  return _db;
}
function transactionSync(fn) {
  const db2 = useDatabase();
  if (!_sqlite) {
    throw new Error("Database not initialized");
  }
  const transaction = _sqlite.transaction(() => {
    return fn(db2);
  });
  try {
    return transaction();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      { error: message },
      "Transaction failed"
    );
    throw error;
  }
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1e3;
const ATTEMPT_RESET_MS = 60 * 60 * 1e3;
async function checkAccountLocked(userId) {
  const db = useDatabase();
  const user = db.select({
    failedLoginAttempts: users.failedLoginAttempts,
    lockedUntil: users.lockedUntil,
    lastFailedLogin: users.lastFailedLogin
  }).from(users).where(eq(users.id, userId)).get();
  if (!user) {
    return {
      isLocked: false,
      lockedUntil: null,
      attemptsRemaining: MAX_FAILED_ATTEMPTS,
      minutesRemaining: 0
    };
  }
  const now = /* @__PURE__ */ new Date();
  if (user.lockedUntil && now < user.lockedUntil) {
    const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 6e4);
    return {
      isLocked: true,
      lockedUntil: user.lockedUntil,
      attemptsRemaining: 0,
      minutesRemaining
    };
  }
  if (user.lockedUntil && now >= user.lockedUntil) {
    await resetFailedAttempts(userId);
    return {
      isLocked: false,
      lockedUntil: null,
      attemptsRemaining: MAX_FAILED_ATTEMPTS,
      minutesRemaining: 0
    };
  }
  if (user.lastFailedLogin) {
    const timeSinceLastFailure = now.getTime() - user.lastFailedLogin.getTime();
    if (timeSinceLastFailure > ATTEMPT_RESET_MS) {
      await resetFailedAttempts(userId);
      return {
        isLocked: false,
        lockedUntil: null,
        attemptsRemaining: MAX_FAILED_ATTEMPTS,
        minutesRemaining: 0
      };
    }
  }
  const attempts = user.failedLoginAttempts || 0;
  return {
    isLocked: false,
    lockedUntil: null,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - attempts),
    minutesRemaining: 0
  };
}
async function recordFailedAttempt(userId) {
  const db = useDatabase();
  const user = db.select({
    failedLoginAttempts: users.failedLoginAttempts,
    lastFailedLogin: users.lastFailedLogin
  }).from(users).where(eq(users.id, userId)).get();
  if (!user) {
    return { isLocked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS, lockoutMinutes: 0 };
  }
  const now = /* @__PURE__ */ new Date();
  let currentAttempts = user.failedLoginAttempts || 0;
  if (user.lastFailedLogin) {
    const timeSinceLastFailure = now.getTime() - user.lastFailedLogin.getTime();
    if (timeSinceLastFailure > ATTEMPT_RESET_MS) {
      currentAttempts = 0;
    }
  }
  const newAttempts = currentAttempts + 1;
  const updateData = {
    failedLoginAttempts: newAttempts,
    lastFailedLogin: now
  };
  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    updateData.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
  }
  db.update(users).set(updateData).where(eq(users.id, userId)).run();
  const isLocked = newAttempts >= MAX_FAILED_ATTEMPTS;
  return {
    isLocked,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - newAttempts),
    lockoutMinutes: isLocked ? Math.ceil(LOCKOUT_DURATION_MS / 6e4) : 0
  };
}
async function resetFailedAttempts(userId) {
  const db = useDatabase();
  db.update(users).set({
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastFailedLogin: null
  }).where(eq(users.id, userId)).run();
}

function getDatabaseDiskPathFromUrl(databaseUrl) {
  const databasePath = databaseUrl.startsWith("file:") ? databaseUrl.replace(/^file:/, "") : databaseUrl;
  return databasePath.startsWith("/") ? dirname(databasePath) : null;
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
function safeJsonParseOrNull(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const LEGACY_ROLE_PERMISSIONS = {
  master: {
    // System pages
    users: true,
    roles: true,
    translations: true,
    settings: true,
    health: true,
    // Content pages
    sections: true,
    blog: true,
    portfolios: true,
    team: true,
    testimonials: true,
    faq: true,
    clients: true,
    pricing: true,
    features: true,
    contacts: true
  },
  admin: {
    // System pages (limited - users set to false for master-only)
    users: false,
    roles: false,
    translations: true,
    settings: true,
    health: false,
    // Content pages (all)
    sections: true,
    blog: true,
    portfolios: true,
    team: true,
    testimonials: true,
    faq: true,
    clients: true,
    pricing: true,
    features: true,
    contacts: true
  },
  editor: {
    // System pages (none)
    users: false,
    roles: false,
    translations: true,
    settings: false,
    health: false,
    // Content pages (editorial)
    sections: true,
    blog: true,
    portfolios: false,
    team: false,
    testimonials: true,
    faq: true,
    clients: false,
    pricing: false,
    features: true,
    contacts: false
  }
};
const rolePermissionsCache = /* @__PURE__ */ new Map();
const ROLE_PERMISSIONS_TTL_MS = 60 * 1e3;
let redisClient$1 = null;
let redisInitialized$1 = false;
async function initRedis$1() {
  if (redisInitialized$1) return redisClient$1 !== null;
  redisInitialized$1 = true;
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.debug("REDIS_URL not set - using in-memory permissions cache with TTL");
      return false;
    }
    const Redis = await import('file:///app/node_modules/ioredis/built/index.js').then((m) => m.default).catch(() => null);
    if (!Redis) {
      logger.warn("ioredis not installed - using in-memory permissions cache. Run: npm install ioredis");
      return false;
    }
    const client = new Redis(redisUrl);
    await client.ping();
    redisClient$1 = {
      get: async (key) => client.get(key),
      setex: async (key, seconds, value) => {
        await client.setex(key, seconds, value);
      },
      del: async (pattern) => {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(...keys);
        }
      }
    };
    logger.info("Permissions cache using Redis for distributed invalidation");
    return true;
  } catch (error) {
    logger.warn({ error }, "Redis connection failed - using in-memory permissions cache");
    return false;
  }
}
const LEGACY_ROLE_PERMISSION_KEYS = [
  "manageUsers",
  "manageRoles",
  "manageSettings",
  "viewHealth",
  "manageContent",
  "viewContent"
];
const CONTENT_PAGE_IDS = [
  "sections",
  "blog",
  "portfolios",
  "team",
  "testimonials",
  "faq",
  "clients",
  "pricing",
  "features",
  "contacts"
];
function normalizeRolePermissions(rawPermissions, fallbackRole) {
  var _a;
  const normalized = getEmptyPermissions();
  let hasPageBasedPermission = false;
  for (const pageId of ADMIN_PAGE_IDS) {
    if (typeof rawPermissions[pageId] === "boolean") {
      normalized[pageId] = rawPermissions[pageId];
      hasPageBasedPermission = true;
    }
  }
  if (hasPageBasedPermission) {
    return normalized;
  }
  const hasLegacyCapabilityPermissions = LEGACY_ROLE_PERMISSION_KEYS.some(
    (key) => typeof rawPermissions[key] === "boolean"
  );
  if (hasLegacyCapabilityPermissions) {
    const capabilities = rawPermissions;
    const hasContentAccess = capabilities.manageContent === true || capabilities.viewContent === true;
    normalized.users = capabilities.manageUsers === true;
    normalized.roles = capabilities.manageRoles === true;
    normalized.settings = capabilities.manageSettings === true;
    normalized.health = capabilities.viewHealth === true;
    normalized.translations = ((_a = LEGACY_ROLE_PERMISSIONS[fallbackRole]) == null ? void 0 : _a.translations) === true;
    for (const contentPageId of CONTENT_PAGE_IDS) {
      normalized[contentPageId] = hasContentAccess;
    }
    return normalized;
  }
  return LEGACY_ROLE_PERMISSIONS[fallbackRole] || LEGACY_ROLE_PERMISSIONS.editor;
}
async function clearRolePermissionsCache() {
  rolePermissionsCache.clear();
  if (redisClient$1) {
    try {
      await redisClient$1.del("role:*:permissions");
      logger.debug("Redis permissions cache invalidated");
    } catch (error) {
      logger.warn({ error }, "Failed to invalidate Redis permissions cache");
    }
  }
}
async function getRoleById(roleId) {
  const now = Date.now();
  const cached = rolePermissionsCache.get(roleId);
  if (cached && cached.expiresAt > now) {
    return { rawPermissions: cached.rawPermissions, level: cached.level };
  }
  if (redisClient$1) {
    try {
      const redisKey = `role:${roleId}:permissions`;
      const serialized = await redisClient$1.get(redisKey);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        rolePermissionsCache.set(roleId, {
          ...parsed,
          expiresAt: now + ROLE_PERMISSIONS_TTL_MS
        });
        return parsed;
      }
    } catch (error) {
      logger.warn({ error, roleId }, "Redis cache get failed, falling back to database");
    }
  }
  if (!redisInitialized$1) {
    await initRedis$1();
  }
  const db = useDatabase();
  const role = await db.select().from(roles).where(eq(roles.id, roleId)).get();
  if (!role) return null;
  const roleData = {
    rawPermissions: safeJsonParse(role.permissions, {}),
    level: role.level
  };
  rolePermissionsCache.set(roleId, {
    ...roleData,
    expiresAt: now + ROLE_PERMISSIONS_TTL_MS
  });
  if (redisClient$1) {
    try {
      const redisKey = `role:${roleId}:permissions`;
      await redisClient$1.setex(redisKey, 60, JSON.stringify(roleData));
    } catch (error) {
      logger.warn({ error, roleId }, "Redis cache set failed");
    }
  }
  return roleData;
}
function getEmptyPermissions() {
  const perms = {};
  for (const pageId of ADMIN_PAGE_IDS) {
    perms[pageId] = false;
  }
  return perms;
}
async function getUserPermissions(user) {
  if (!user) {
    return getEmptyPermissions();
  }
  if (user.roleId) {
    const roleData = await getRoleById(user.roleId);
    if (roleData) {
      return normalizeRolePermissions(roleData.rawPermissions, user.role);
    }
  }
  return LEGACY_ROLE_PERMISSIONS[user.role] || LEGACY_ROLE_PERMISSIONS.editor;
}
async function hasPageAccess(user, pageId) {
  const permissions = await getUserPermissions(user);
  return permissions[pageId] === true;
}
async function hasAnyPageAccess(user, pageIds) {
  const permissions = await getUserPermissions(user);
  return pageIds.some((p) => permissions[p] === true);
}
async function requirePageAccess(user, pageId, message) {
  const hasAccess = await hasPageAccess(user, pageId);
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      message: message || `Access denied: ${pageId}`
    });
  }
}
const requirePermission = requirePageAccess;
function calculateLevel(permissions) {
  if (permissions.roles === true) return 90;
  if (permissions.users === true) return 50;
  return 25;
}

function createApiError(statusCode, code, details = {}) {
  return createError({
    statusCode,
    message: "Request failed",
    data: {
      code,
      ...details
    }
  });
}

const ADMIN_PAGE_ID_SET = new Set(ADMIN_PAGE_IDS);
const ADMIN_SECTION_ALIASES = {
  stats: "health",
  logs: "health",
  "audit-logs": "health",
  monitoring: "health",
  ops: "health",
  "support-bundle": "health",
  terminal: "health",
  gradebook: "progress"
};
const CONTENT_ADMIN_SECTIONS = [
  "sections",
  "blog",
  "portfolios",
  "team",
  "testimonials",
  "faq",
  "clients",
  "pricing",
  "features",
  "contacts"
];
function resolveAdminSectionFromPath(path) {
  var _a;
  if (!path.startsWith("/api/admin/")) {
    return null;
  }
  const sectionCandidate = path.slice("/api/admin/".length).split("/")[0];
  if (!sectionCandidate) {
    return null;
  }
  const mappedSection = (_a = ADMIN_SECTION_ALIASES[sectionCandidate]) != null ? _a : sectionCandidate;
  if (!ADMIN_PAGE_ID_SET.has(mappedSection)) {
    return null;
  }
  return mappedSection;
}
async function hasAdminSectionAccess(user, section) {
  if (!user) {
    return false;
  }
  return hasPageAccess(user, section);
}
async function requireAdminSectionAccess(user, section) {
  if (!user) {
    throw createApiError(401, "auth.authenticationRequired");
  }
  if (!await hasAdminSectionAccess(user, section)) {
    throw createApiError(403, "auth.insufficientRole", { section });
  }
}
async function requireAnyContentAdminSectionAccess(user) {
  if (!user) {
    throw createApiError(401, "auth.authenticationRequired");
  }
  if (!await hasAnyPageAccess(user, [...CONTENT_ADMIN_SECTIONS])) {
    throw createApiError(403, "auth.insufficientRole", {
      sections: [...CONTENT_ADMIN_SECTIONS]
    });
  }
}
async function requireAdminRouteAccessByPath(user, path) {
  if (!user) {
    throw createApiError(401, "auth.authenticationRequired");
  }
  const section = resolveAdminSectionFromPath(path);
  if (!section) {
    throw createApiError(403, "auth.insufficientRole", { path });
  }
  await requireAdminSectionAccess(user, section);
  return section;
}

const terminalCommandOptions = [
  { command: "help", labelKey: "admin.healthPage.terminal.command.help" },
  { command: "pwd", labelKey: "admin.healthPage.terminal.command.pwd" },
  { command: "date -u", labelKey: "admin.healthPage.terminal.command.dateUtc" },
  { command: "uptime", labelKey: "admin.healthPage.terminal.command.uptime" },
  { command: "node -v", labelKey: "admin.healthPage.terminal.command.nodeVersion" },
  { command: "npm -v", labelKey: "admin.healthPage.terminal.command.npmVersion" },
  { command: "df -h . /app/data /app/uploads", labelKey: "admin.healthPage.terminal.command.diskUsage" },
  { command: "cat /proc/self/cgroup", labelKey: "admin.healthPage.terminal.command.cgroup" },
  { command: "cat /proc/meminfo", labelKey: "admin.healthPage.terminal.command.memoryInfo" },
  { command: "process", labelKey: "admin.healthPage.terminal.command.process" }
];
function formatBytes$1(bytes) {
  const mib = bytes / 1024 / 1024;
  return `${Math.round(mib)} MiB`;
}
function readTextFile$1(path) {
  if (!existsSync(path)) {
    return `${path}: unavailable`;
  }
  return readFileSync(path, "utf8").trimEnd() || "(empty)";
}
const allowedTerminalCommands = {
  help: {
    output: () => [
      "Allowed read-only diagnostics commands:",
      "",
      ...terminalCommandOptions.map((option) => option.command)
    ].join("\n")
  },
  pwd: {
    output: () => process.cwd()
  },
  "date -u": {
    file: "date",
    args: ["-u"]
  },
  uptime: {
    file: "uptime",
    args: []
  },
  "node -v": {
    output: () => process.version
  },
  "npm -v": {
    file: "npm",
    args: ["-v"]
  },
  "df -h . /app/data /app/uploads": {
    file: "df",
    args: ["-h", ".", "/app/data", "/app/uploads"]
  },
  "cat /proc/self/cgroup": {
    output: () => readTextFile$1("/proc/self/cgroup")
  },
  "cat /proc/meminfo": {
    output: () => readTextFile$1("/proc/meminfo")
  },
  process: {
    output: () => {
      const memory = process.memoryUsage();
      return [
        `pid: ${process.pid}`,
        `ppid: ${process.ppid}`,
        `cwd: ${process.cwd()}`,
        `node: ${process.version}`,
        `uptime: ${Math.floor(process.uptime())}s`,
        `rss: ${formatBytes$1(memory.rss)}`,
        `heapUsed: ${formatBytes$1(memory.heapUsed)}`,
        `heapTotal: ${formatBytes$1(memory.heapTotal)}`,
        `external: ${formatBytes$1(memory.external)}`
      ].join("\n");
    }
  }
};

const WEBSITE_SECTION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function assertValidWebsiteSectionId(sectionId) {
  if (sectionId.trim() !== sectionId) {
    throw new Error(`Invalid website section id "${sectionId}": leading/trailing whitespace is not allowed`);
  }
  if (!WEBSITE_SECTION_ID_PATTERN.test(sectionId)) {
    throw new Error(
      `Invalid website section id "${sectionId}": expected lowercase-kebab-case (letters, numbers, dashes)`
    );
  }
}
function defineWebsiteSections(sections) {
  if (sections.length === 0) {
    throw new Error("Invalid website sections config: at least one section is required");
  }
  const seenIds = /* @__PURE__ */ new Set();
  for (const section of sections) {
    assertValidWebsiteSectionId(section.id);
    if (seenIds.has(section.id)) {
      throw new Error(`Invalid website sections config: duplicate id "${section.id}"`);
    }
    seenIds.add(section.id);
  }
  const homeIndex = sections.findIndex((section) => section.id === "home");
  if (homeIndex > 0) {
    throw new Error('Invalid website sections config: "home" must be the first section when present');
  }
  return sections;
}

const config = {
  // ═══════════════════════════════════════════════════════════════════════════
  // AI WORKFLOW - Select AI agent workflow
  // ═══════════════════════════════════════════════════════════════════════════
  // - 'claude': Claude Code workflow with basic commands
  // - 'qwen': Qwen Code workflow with 42 expert personas (7 specialties × 6 countries)
  // - 'codex': Codex workflow (future/experimental)
  // ═══════════════════════════════════════════════════════════════════════════
  aiWorkflow: "codex",
  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE TOGGLES - Fine-tune behavior for website and app entities
  // ═══════════════════════════════════════════════════════════════════════════
  features: {
    // App UX: true = vertical sidebar, false = horizontal nav
    twoFactorAuth: false,
    // Contact form notifications
    // ⚠️ Email confirmations require SMTP_* in .env.
    // ⚠️ Telegram notifications require contact.telegramBotToken and
    // contact.telegramChatId in Admin Settings.
    contactEmailConfirmation: false,
    // Send confirmation email to user (requires SMTP_* in .env)
    contactTelegramNotify: false},
  // ═══════════════════════════════════════════════════════════════════════════
  // MODULES - Pre-built, config-driven features
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Each module provides: database tables, API endpoints, admin UI, frontend pages.
  // Enable modules per-project and customize their behavior via config.
  //
  // Available modules:
  //   - portfolio:    Project showcase with galleries and case studies
  //   - pricing:      Pricing tiers with comparison table
  //   - contact:      Contact form, map, and info display
  //   - blog:         Blog posts with categories, tags, and media
  //   - team:         Team member profiles with photos and social links
  //   - testimonials: Customer testimonials and reviews
  //   - features:     Feature cards with icons (replaces services)
  //   - clients:      Client/sponsor/partner logos
  //   - faq:          Frequently asked questions accordion
  //
  // ═══════════════════════════════════════════════════════════════════════════
  modules: {
    portfolio: {
      enabled: false,
      config: {
        layout: "grid",
        cardStyle: "overlay",
        showFilters: true,
        showCaseStudies: true,
        showGallery: true,
        itemsPerPage: 12,
        sortDefault: "order",
        showCategories: true,
        showTechnologies: true
      }
    },
    pricing: {
      enabled: false,
      config: {
        tiers: [
          {
            id: "starter",
            name: "Starter",
            description: "Perfect for small projects",
            price: 0,
            period: "month",
            currency: "USD",
            featured: false,
            features: [
              { text: "Up to 3 pages", included: true },
              { text: "Basic blocks", included: true },
              { text: "Community support", included: true },
              { text: "Visual editor", included: false },
              { text: "Custom modules", included: false }
            ],
            cta: { text: "Get Started", url: "/contact" }
          },
          {
            id: "pro",
            name: "Pro",
            description: "For growing businesses",
            price: 29,
            period: "month",
            currency: "USD",
            featured: true,
            features: [
              { text: "Unlimited pages", included: true },
              { text: "All blocks", included: true },
              { text: "Priority support", included: true },
              { text: "Visual editor", included: true },
              { text: "Custom modules", included: false }
            ],
            cta: { text: "Start Free Trial", url: "/contact" }
          },
          {
            id: "enterprise",
            name: "Enterprise",
            description: "Custom solutions",
            price: null,
            period: "month",
            currency: "USD",
            featured: false,
            features: [
              { text: "Unlimited pages", included: true },
              { text: "All blocks", included: true },
              { text: "Dedicated support", included: true },
              { text: "Visual editor", included: true },
              { text: "Custom modules", included: true }
            ],
            cta: { text: "Contact Sales", url: "/contact" }
          }
        ],
        showComparison: true,
        showToggle: true,
        yearlyDiscount: 20,
        currency: "USD",
        style: "cards",
        ctaStyle: "button",
        highlightFeatured: true,
        showFAQ: false
      }
    },
    contact: {
      enabled: true,
      config: {
        showMap: false,
        mapProvider: "yandex",
        showForm: true,
        showInfo: true,
        formFields: [
          { name: "name", type: "text", label: "Name", required: true },
          { name: "email", type: "email", label: "Email", required: true },
          { name: "message", type: "textarea", label: "Message", required: true }
        ],
        notifications: "email",
        showSocial: false
      }
    },
    blog: {
      enabled: false,
      config: {
        postsPerPage: 10,
        showCategories: true,
        showTags: true,
        showAuthor: true,
        showReadingTime: true,
        showViewCount: false,
        excerptLength: 160,
        layout: "grid",
        latestPostsCount: 3
      }
    },
    team: {
      enabled: false,
      config: {
        layout: "grid",
        cardStyle: "detailed",
        showSocial: true,
        showBio: true,
        showEmail: false,
        showPhone: false,
        groupByDepartment: false,
        columnsDesktop: 4,
        columnsMobile: 2
      }
    },
    testimonials: {
      enabled: false,
      config: {
        layout: "carousel",
        showRating: true,
        showPhoto: true,
        showCompany: true,
        autoPlay: false,
        autoPlayInterval: 5e3
      }
    },
    features: {
      enabled: false,
      config: {
        layout: "grid",
        cardStyle: "icon-top",
        showCategory: false,
        columnsDesktop: 3,
        columnsMobile: 1
      }
    },
    clients: {
      enabled: false,
      config: {
        layout: "strip",
        showNames: false,
        grayscale: true,
        hoverColor: true,
        categories: ["client", "sponsor", "partner"]
      }
    },
    faq: {
      enabled: false,
      config: {
        layout: "accordion",
        showCategories: false,
        expandFirst: true,
        allowMultipleOpen: false
      }
    }
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // STORAGE - File uploads configuration (images & videos)
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Provider options:
  //   - 'local': Files stored in public/uploads/ (good for small/medium sites)
  //   - 's3': Files stored in S3-compatible bucket (AWS S3, Cloudflare R2, MinIO)
  //
  // For S3, set these environment variables in .env:
  //   S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION,
  //   S3_VISIBILITY (public|private), S3_PUBLIC_URL (public mode), S3_PROXY_SIGNING_KEY (optional)
  //
  // Video processing uses FFmpeg to compress and optimize for web playback.
  // ═══════════════════════════════════════════════════════════════════════════
  storage: {
    // Image settings
    image: {
      maxSizeMB: 10,
      // Max upload size
      maxWidth: 1920,
      // Resize to max width
      maxHeight: 1080,
      // Resize to max height
      quality: 85,
      // WebP quality (1-100)
      thumbnailWidth: 400,
      // Thumbnail width
      thumbnailHeight: 300,
      // Thumbnail height
      thumbnailQuality: 75
      // Thumbnail WebP quality
    },
    // Video settings
    video: {
      // Allow video uploads
      maxSizeMB: 100,
      outputFormat: "mp4",
      // FFmpeg compression settings
      compression: {
        videoBitrate: "2M",
        // Target video bitrate
        audioBitrate: "128k",
        // Target audio bitrate
        maxWidth: 1920,
        // Scale down if larger
        fps: 30
        // Target frame rate
      }
    }
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTIONS - Website navigation and routing (DRY Architecture)
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // This array controls:
  //   1. Main navigation links (items with inNav: true)
  //   2. Routes handled by [section].vue dynamic page
  //   3. Onepager mode anchor targets (#about, #portfolio, etc.)
  //
  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ HOW TO ADD A NEW SECTION (only 3 steps!)                               │
  // ├─────────────────────────────────────────────────────────────────────────┤
  // │ 1. Add entry here:  { id: 'history', inNav: true }                     │
  // │ 2. Create component: app/components/sections/SectionHistory.vue        │
  // │ 3. Add translations: nav.history, history.title, etc.                  │
  // │                                                                         │
  // │ That's it! SectionRenderer handles both onepager and SPA modes.        │
  // │ Component naming: Section{PascalCase(id)} → SectionHistory             │
  // └─────────────────────────────────────────────────────────────────────────┘
  //
  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ SELF-CONTAINED SECTIONS                                                │
  // ├─────────────────────────────────────────────────────────────────────────┤
  // │ Each section component should be self-contained:                       │
  // │   - Fetch its own title from i18n (or use title prop as override)      │
  // │   - Fetch its own content from i18n or API                             │
  // │   - Have sensible defaults for all content                             │
  // │                                                                         │
  // │ Example pattern:                                                        │
  // │   const { t, te } = useI18n()                                          │
  // │   const sectionTitle = computed(() =>                                  │
  // │     te('history.title') ? t('history.title') : 'Our History'           │
  // │   )                                                                    │
  // └─────────────────────────────────────────────────────────────────────────┘
  //
  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ CUSTOM PAGE (not a section)                                            │
  // ├─────────────────────────────────────────────────────────────────────────┤
  // │ Just create the file: app/pages/terms.vue → accessible at /terms       │
  // │ No config changes needed. Link it from footer or elsewhere.            │
  // │ Add to sections array only if you want it in navigation.               │
  // └─────────────────────────────────────────────────────────────────────────┘
  //
  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ ONEPAGER vs SPA MODE                                                   │
  // ├─────────────────────────────────────────────────────────────────────────┤
  // │ Onepager (features.onepager: true):                                    │
  // │   - All sections rendered on index.vue via SectionRenderer             │
  // │   - Nav links are anchors: #about, #portfolio                          │
  // │   - Scrollspy highlights active section                                │
  // │   - Hybrid pages use renderMode: 'page' and stay routes: /blog         │
  // │                                                                         │
  // │ SPA mode (features.onepager: false):                                   │
  // │   - Each section is a separate page: /about, /portfolio                │
  // │   - Nav links are routes                                               │
  // │   - [section].vue uses SectionRenderer for dynamic routing             │
  // └─────────────────────────────────────────────────────────────────────────┘
  //
  sections: defineWebsiteSections([
    { id: "home", inNav: true },
    { id: "approach", inNav: true },
    { id: "economics", inNav: true },
    { id: "formats", inNav: true },
    { id: "experience", inNav: true },
    { id: "about", inNav: true },
    { id: "contact", inNav: true }
  ]),
  // ═══════════════════════════════════════════════════════════════════════════
  // LANGUAGE & THEME DEFAULTS
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Language detection priority:
  //   1. User's saved preference (cookie from previous visit, only when features.cookies is true)
  //   2. Browser language (if matches one of available locales)
  //   3. defaultLocale (fallback when browser lang not supported)
  //
  // Theme detection priority:
  //   1. User's saved preference (cookie from previous visit, only when features.cookies is true)
  //   2. defaultTheme setting below
  //   3. System preference (only when defaultTheme is 'system')
  //
  // RTL is auto-detected from locale code (he, ar, fa, ur)
  // Translations come from DATABASE - run `npm run db:seed` for initial data
  // ═══════════════════════════════════════════════════════════════════════════
  locales: [
    { code: "ru", iso: "ru-RU", name: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
    { code: "en", iso: "en-US", name: "English" }
  ],
  defaultLocale: "ru",
  // ═══════════════════════════════════════════════════════════════════════════
  // SETTINGS SCHEMA - Config-Driven Settings Definition
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // MOTTO: "The config file is the developer's best friend!"
  //
  // This defines WHICH settings exist. VALUES are entered via Admin Panel.
  //
  // Schema:
  //   key      - Unique identifier (group.name format)
  //   type     - Input type: 'string', 'url', 'email', 'tel', 'text', 'boolean'
  //   group    - Admin panel grouping
  //   label    - Human-readable label for admin UI
  //   icon     - Tabler icon name (optional, for display in components)
  //
  // Components:
  //   <SocialNav />    - Renders all social.* with values (icons auto: brand-{platform})
  //   <ContactInfo />  - Renders all contact.* with values (icons from config)
  //
  // ═══════════════════════════════════════════════════════════════════════════
  settings: [
    // Contact Information (displayed via <ContactInfo /> component)
    // Icons are Tabler icon names: https://tabler.io/icons
    { key: "contact.email", type: "email", group: "contact", label: "Email", icon: "mail" },
    { key: "contact.phone", type: "tel", group: "contact", label: "Phone", icon: "phone" },
    // Location: empty=hidden, address text=show text, coordinates (lat,lng)=show Yandex map
    {
      key: "contact.location",
      type: "string",
      group: "location",
      label: "Location",
      icon: "map-pin"
    },
    {
      key: "contact.workingHours",
      type: "string",
      group: "location",
      label: "Working Hours",
      icon: "clock"
    },
    {
      key: "contact.forceShowFormWithoutLegalDocuments",
      type: "boolean",
      group: "contact",
      label: "Show Contact Form Without Legal Documents"
    },
    {
      key: "contact.contactPageItems",
      type: "string",
      group: "contact",
      label: "Contact Page Buttons"
    },
    {
      key: "contact.telegramBotToken",
      type: "password",
      group: "integrations",
      label: "Telegram Bot Token",
      icon: "lock",
      public: false
    },
    {
      key: "contact.telegramChatId",
      type: "string",
      group: "integrations",
      label: "Telegram Chat ID",
      icon: "hash",
      public: false
    },
    {
      key: "contact.headerQuickEnabled",
      type: "boolean",
      group: "contact",
      label: "Show Header Quick Contact Buttons"
    },
    {
      key: "contact.headerQuickItems",
      type: "string",
      group: "contact",
      label: "Header Quick Contact Items"
    },
    // Social Links (displayed via <SocialNav /> component)
    // Icons: Tabler brand icons (https://tabler.io/icons) or custom-* for custom icons
    // ─── Messaging ───
    {
      key: "social.telegram",
      type: "url",
      group: "contact",
      label: "Telegram",
      icon: "brand-telegram"
    },
    {
      key: "social.whatsapp",
      type: "url",
      group: "contact",
      label: "WhatsApp",
      icon: "brand-whatsapp"
    },
    { key: "social.viber", type: "url", group: "contact", label: "Viber", icon: "brand-viber" },
    {
      key: "social.discord",
      type: "url",
      group: "contact",
      label: "Discord",
      icon: "brand-discord"
    },
    { key: "social.max", type: "url", group: "contact", label: "MAX Messenger", icon: "custom-max" },
    // ─── Social Networks ───
    {
      key: "social.telegramChannel",
      type: "url",
      group: "social",
      label: "Telegram Channel",
      icon: "brand-telegram"
    },
    {
      key: "social.maxChannel",
      type: "url",
      group: "social",
      label: "MAX Channel",
      icon: "custom-max"
    },
    {
      key: "social.discordServer",
      type: "url",
      group: "social",
      label: "Discord Server",
      icon: "brand-discord"
    },
    {
      key: "social.instagram",
      type: "url",
      group: "social",
      label: "Instagram",
      icon: "brand-instagram"
    },
    {
      key: "social.facebook",
      type: "url",
      group: "social",
      label: "Facebook",
      icon: "brand-facebook"
    },
    { key: "social.twitter", type: "url", group: "social", label: "Twitter/X", icon: "brand-x" },
    {
      key: "social.threads",
      type: "url",
      group: "social",
      label: "Threads",
      icon: "brand-threads"
    },
    { key: "social.tiktok", type: "url", group: "social", label: "TikTok", icon: "brand-tiktok" },
    {
      key: "social.pinterest",
      type: "url",
      group: "social",
      label: "Pinterest",
      icon: "brand-pinterest"
    },
    { key: "social.vk", type: "url", group: "social", label: "VK (\u0412\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u0435)", icon: "brand-vk" },
    // ─── Video ───
    {
      key: "social.youtube",
      type: "url",
      group: "social",
      label: "YouTube",
      icon: "brand-youtube"
    },
    { key: "social.twitch", type: "url", group: "social", label: "Twitch", icon: "brand-twitch" },
    // ─── Professional ───
    {
      key: "social.linkedin",
      type: "url",
      group: "social",
      label: "LinkedIn",
      icon: "brand-linkedin"
    },
    { key: "social.medium", type: "url", group: "social", label: "Medium", icon: "brand-medium" },
    // ─── Dev/Design ───
    { key: "social.github", type: "url", group: "social", label: "GitHub", icon: "brand-github" },
    { key: "social.gitlab", type: "url", group: "social", label: "GitLab", icon: "brand-gitlab" },
    {
      key: "social.dribbble",
      type: "url",
      group: "social",
      label: "Dribbble",
      icon: "brand-dribbble"
    },
    {
      key: "social.behance",
      type: "url",
      group: "social",
      label: "Behance",
      icon: "brand-behance"
    },
    // Legal/Juridical Info (displayed in footer small print)
    // Russian: ИНН, ОГРН, Юридический адрес
    {
      key: "legal.companyLegalName",
      type: "string",
      group: "legal",
      label: "Company Legal Name"
    },
    {
      key: "legal.companyName",
      type: "string",
      group: "legal",
      label: "Company Name (for copyright)"
    },
    { key: "legal.inn", type: "string", group: "legal", label: "\u0418\u041D\u041D (Tax ID)" },
    { key: "legal.kpp", type: "string", group: "legal", label: "\u041A\u041F\u041F" },
    { key: "legal.ogrn", type: "string", group: "legal", label: "\u041E\u0413\u0420\u041D (Registration Number)" },
    { key: "legal.address", type: "string", group: "legal", label: "Legal Address" },
    { key: "legal.email", type: "email", group: "legal", label: "Legal Email" },
    // Footer Settings (CTA text is in translations: cta.primaryButton)
    { key: "footer.ctaUrl", type: "url", group: "footer", label: "CTA Button URL" },
    // SEO & Meta
    { key: "seo.title", type: "string", group: "seo", label: "Default Page Title" },
    { key: "seo.description", type: "text", group: "seo", label: "Meta Description" },
    { key: "seo.keywords", type: "text", group: "seo", label: "Meta Keywords (comma-separated)" },
    // Analytics (IDs only - scripts injected by plugins)
    {
      key: "analytics.googleId",
      type: "string",
      group: "integrations",
      label: "Google Analytics ID (G-XXXXXXXX)"
    },
    { key: "analytics.yandexId", type: "string", group: "integrations", label: "Yandex Metrica ID" },
    {
      key: "analytics.facebookPixel",
      type: "string",
      group: "integrations",
      label: "Facebook Pixel ID"
    },
    // Verification codes (for webmaster tools)
    {
      key: "verification.google",
      type: "string",
      group: "integrations",
      label: "Google Search Console"
    },
    { key: "verification.yandex", type: "string", group: "integrations", label: "Yandex Webmaster" }
  ],
  get has2FA() {
    return this.features.twoFactorAuth;
  }};

function getClientIp$1(event) {
  var _a;
  const forwarded = getHeader(event, "x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0];
    return firstIp ? firstIp.trim() : null;
  }
  const realIp = getHeader(event, "x-real-ip");
  if (realIp) {
    return realIp;
  }
  return ((_a = event.node.req.socket) == null ? void 0 : _a.remoteAddress) || null;
}
function getUserAgent(event) {
  return getHeader(event, "user-agent") || null;
}
async function logAudit(event, action, options = {}) {
  var _a, _b, _c;
  const db = useDatabase();
  try {
    await db.insert(auditLogs).values({
      action,
      userId: (_a = options.userId) != null ? _a : null,
      targetUserId: (_b = options.targetUserId) != null ? _b : null,
      ipAddress: getClientIp$1(event),
      userAgent: getUserAgent(event),
      details: options.details ? JSON.stringify(options.details) : null,
      success: (_c = options.success) != null ? _c : true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      { action, error: message },
      "Failed to log audit event"
    );
  }
}
const audit = {
  /**
   * Log successful login
   */
  async login(event, userId) {
    await logAudit(event, "login", { userId, targetUserId: userId });
  },
  /**
   * Log failed login attempt
   */
  async loginFailed(event, email, reason, userId) {
    await logAudit(event, "login_failed", {
      targetUserId: userId,
      details: { email, reason },
      success: false
    });
  },
  /**
   * Log logout
   */
  async logout(event, userId) {
    await logAudit(event, "logout", { userId, targetUserId: userId });
  },
  /**
   * Log password change
   */
  async passwordChange(event, actorId, targetUserId) {
    await logAudit(event, "password_change", {
      userId: actorId,
      targetUserId,
      details: { selfChange: actorId === targetUserId }
    });
  },
  /**
   * Log role change
   */
  async roleChange(event, actorId, targetUserId, oldRole, newRole) {
    await logAudit(event, "role_change", {
      userId: actorId,
      targetUserId,
      details: { oldRole, newRole }
    });
  },
  /**
   * Log user creation
   */
  async userCreate(event, actorId, newUserId, email, role) {
    await logAudit(event, "user_create", {
      userId: actorId,
      targetUserId: newUserId,
      details: { email, role }
    });
  },
  /**
   * Log user update
   */
  async userUpdate(event, actorId, targetUserId, changes) {
    await logAudit(event, "user_update", {
      userId: actorId,
      targetUserId,
      details: { changes }
    });
  },
  /**
   * Log user deletion
   */
  async userDelete(event, actorId, targetUserId, email) {
    await logAudit(event, "user_delete", {
      userId: actorId,
      targetUserId,
      details: { email }
    });
  },
  /**
   * Log account lockout
   */
  async accountLocked(event, userId, reason) {
    await logAudit(event, "account_locked", {
      targetUserId: userId,
      details: { reason }
    });
  },
  /**
   * Log account unlock
   */
  async accountUnlocked(event, actorId, targetUserId, reason) {
    await logAudit(event, "account_unlocked", {
      userId: actorId,
      targetUserId,
      details: { reason }
    });
  },
  /**
   * Log session expiration
   */
  async sessionExpired(event, userId) {
    await logAudit(event, "session_expired", {
      targetUserId: userId
    });
  },
  /**
   * Log role creation
   */
  async roleCreate(event, actorId, roleId, roleName, roleSlug) {
    await logAudit(event, "role_create", {
      userId: actorId,
      details: { roleId, roleName, roleSlug }
    });
  },
  /**
   * Log role update
   */
  async roleUpdate(event, actorId, roleId, roleName, changes) {
    await logAudit(event, "role_update", {
      userId: actorId,
      details: { roleId, roleName, changes }
    });
  },
  /**
   * Log role deletion
   */
  async roleDelete(event, actorId, roleId, roleName) {
    await logAudit(event, "role_delete", {
      userId: actorId,
      details: { roleId, roleName }
    });
  },
  /**
   * Log settings update with secret-safe metadata.
   */
  async settingsUpdate(event, actorId, details) {
    await logAudit(event, "settings_update", {
      userId: actorId,
      details
    });
  },
  /**
   * Log admin terminal command execution.
   */
  async terminalCommand(event, actorId, command, success) {
    await logAudit(event, "terminal_command", {
      userId: actorId,
      details: { command },
      success
    });
  },
  /**
   * Log allowlisted ops console action execution.
   */
  async opsAction(event, actorId, action, success) {
    await logAudit(event, "ops_action", {
      userId: actorId,
      details: { action },
      success
    });
  },
  /**
   * Log support bundle export/copy.
   */
  async supportBundleExport(event, actorId, success) {
    await logAudit(event, "support_bundle_export", {
      userId: actorId,
      details: { format: "json" },
      success
    });
  },
  /**
   * Log 2FA enabled
   */
  async twoFactorEnabled(event, userId) {
    await logAudit(event, "2fa_enabled", {
      userId,
      targetUserId: userId,
      details: { action: "2FA enabled for account" }
    });
  },
  /**
   * Log 2FA disabled
   */
  async twoFactorDisabled(event, actorId, targetUserId, reason) {
    await logAudit(event, "2fa_disabled", {
      userId: actorId,
      targetUserId,
      details: { reason: reason || "User disabled 2FA", selfAction: actorId === targetUserId }
    });
  },
  /**
   * Log successful 2FA verification
   */
  async twoFactorVerified(event, userId, method) {
    await logAudit(event, "2fa_verified", {
      userId,
      targetUserId: userId,
      details: { method }
    });
  },
  /**
   * Log failed 2FA verification attempt
   */
  async twoFactorFailed(event, userId, reason) {
    await logAudit(event, "2fa_failed", {
      targetUserId: userId,
      details: { reason },
      success: false
    });
  }
};

const CSRF_COOKIE_NAME = "pm-csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;
function generateCsrfToken() {
  return randomBytes(TOKEN_LENGTH).toString("hex");
}
function setCsrfCookie(event, token) {
  setCookie(event, CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/"
  });
}
function getCsrfToken(event) {
  return getCookie(event, CSRF_COOKIE_NAME);
}
function deleteCsrfCookie(event) {
  deleteCookie(event, CSRF_COOKIE_NAME, { path: "/" });
}
function validateCsrfToken(event) {
  const cookieToken = getCookie(event, CSRF_COOKIE_NAME);
  const headerToken = getHeader(event, CSRF_HEADER_NAME);
  if (!cookieToken || !headerToken) {
    return false;
  }
  if (cookieToken.length !== headerToken.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(cookieToken, "utf8"), Buffer.from(headerToken, "utf8"));
  } catch {
    return false;
  }
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const config = useRuntimeConfig();
  const { smtpHost, smtpPort, smtpUser, smtpPass } = config;
  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.debug("SMTP not configured - emails will be skipped");
    return null;
  }
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort) || 465,
    secure: Number(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  return transporter;
}
async function sendEmail(options) {
  const transport = getTransporter();
  if (!transport) return false;
  const config = useRuntimeConfig();
  const from = config.smtpFrom || config.smtpUser;
  try {
    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
    logger.info({ to: options.to, subject: options.subject }, "Email sent");
    return true;
  } catch (error) {
    logger.error({ error, to: options.to }, "Failed to send email");
    return false;
  }
}
async function sendContactConfirmation(to, name, siteName = "Our Team") {
  return sendEmail({
    to,
    subject: `We received your message - ${siteName}`,
    text: `Hi ${name},

Thank you for contacting us! We have received your message and will get back to you as soon as possible.

Best regards,
${siteName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for reaching out!</h2>
        <p>Hi ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>Best regards,<br/><strong>${siteName}</strong></p>
      </div>
    `
  });
}

const optionalString = z.preprocess(
  (val) => val === "" || val === void 0 ? void 0 : val,
  z.string().optional()
);
const emailAddress = z.string().email();
function isValidSmtpFrom(value) {
  var _a;
  if (emailAddress.safeParse(value).success) {
    return true;
  }
  const displayAddressMatch = value.match(/^[^<>]+<([^<>]+)>$/);
  if (!displayAddressMatch) {
    return false;
  }
  return emailAddress.safeParse((_a = displayAddressMatch[1]) == null ? void 0 : _a.trim()).success;
}
const optionalMailFrom = z.preprocess(
  (val) => val === "" || val === void 0 ? void 0 : val,
  z.string().trim().refine(isValidSmtpFrom, "Invalid email address").optional()
);
const optionalUrl = z.preprocess(
  (val) => val === "" || val === void 0 ? void 0 : val,
  z.string().url().optional()
);
const optionalNumber = z.preprocess(
  (val) => val === "" || val === void 0 ? void 0 : Number(val),
  z.number().optional()
);
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Server
  HOST: z.string().default("0.0.0.0"),
  PORT: z.string().default("3000").transform(Number).pipe(z.number().min(1).max(65535)),
  // Database
  DATABASE_URL: z.string().min(1).default("./data/sqlite.db"),
  // Logging
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  // Email (optional - empty strings treated as not set)
  SMTP_HOST: optionalString,
  SMTP_PORT: optionalNumber,
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_FROM: optionalMailFrom,
  // External API (optional)
  API_BASE_URL: optionalUrl,
  API_CLIENT_ID: optionalString,
  API_CLIENT_SECRET: optionalString
});
let _env = null;
function getEnv() {
  if (!_env) {
    validateEnv();
  }
  return _env;
}
function validateEnv() {
  if (_env) return;
  try {
    _env = envSchema.parse(process.env);
    logger.info(
      {
        nodeEnv: _env.NODE_ENV,
        hasSmtp: !!_env.SMTP_HOST,
        hasExternalApi: !!_env.API_BASE_URL
      },
      "Environment validated"
    );
    if (_env.NODE_ENV === "production") {
      const warnings = [];
      if (!_env.SMTP_HOST) {
        warnings.push("SMTP not configured - email notifications disabled");
      }
      warnings.forEach((w) => logger.warn(w));
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      logger.fatal({ issues }, "Environment validation failed");
      throw new Error(`Environment validation failed: ${issues.join(", ")}`);
    }
    throw error;
  }
}
new Proxy({}, {
  get(_, prop) {
    return getEnv()[prop];
  }
});

var __defProp$3 = Object.defineProperty;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$3 = (obj, key, value) => __defNormalProp$3(obj, typeof key !== "symbol" ? key + "" : key, value);
class EphemeralStore {
  constructor(prefix, options = { ttlSeconds: 300 }) {
    __publicField$3(this, "prefix");
    __publicField$3(this, "ttlSeconds");
    __publicField$3(this, "memoryStore");
    __publicField$3(this, "redisClient");
    __publicField$3(this, "cleanupInterval");
    var _a;
    this.prefix = `ephemeral:${prefix}`;
    this.ttlSeconds = options.ttlSeconds;
    this.memoryStore = /* @__PURE__ */ new Map();
    this.redisClient = (_a = options.redisClient) != null ? _a : null;
    this.cleanupInterval = null;
    if (!this.redisClient) {
      this.startMemoryCleanup();
    }
  }
  /**
   * Initialize Redis client if REDIS_URL is available
   */
  static async initRedis() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.debug("REDIS_URL not set - using in-memory ephemeral store");
      return null;
    }
    try {
      const Redis = await import('file:///app/node_modules/ioredis/built/index.js').then((m) => m.default).catch(() => null);
      if (!Redis) {
        logger.warn("ioredis not installed - using in-memory ephemeral store. Run: npm install ioredis");
        return null;
      }
      const client = new Redis(redisUrl);
      await client.ping();
      logger.info("Ephemeral store using Redis");
      return {
        get: async (key) => client.get(key),
        setex: async (key, seconds, value) => {
          await client.setex(key, seconds, value);
        },
        del: async (key) => {
          await client.del(key);
        },
        keys: async (pattern) => client.keys(pattern)
      };
    } catch (error) {
      logger.warn({ error }, "Redis connection failed - using in-memory ephemeral store");
      return null;
    }
  }
  /**
   * Create an ephemeral store with Redis if available
   */
  static async create(prefix, options = { ttlSeconds: 300 }) {
    const redisClient = await this.initRedis();
    return new EphemeralStore(prefix, { ttlSeconds: options.ttlSeconds, redisClient });
  }
  /**
   * Start periodic cleanup of expired in-memory entries
   */
  startMemoryCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryStore.entries()) {
        if (entry.expiresAt < now) {
          this.memoryStore.delete(key);
        }
      }
    }, 6e4);
    process.on("beforeExit", () => {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
    });
  }
  /**
   * Store a value with TTL
   */
  async set(key, value) {
    const fullKey = `${this.prefix}:${key}`;
    if (this.redisClient) {
      try {
        const serialized = JSON.stringify(value);
        await this.redisClient.setex(fullKey, this.ttlSeconds, serialized);
      } catch (error) {
        logger.warn({ error, key }, "Redis set failed, falling back to memory");
        this.setMemory(key, value);
      }
    } else {
      this.setMemory(key, value);
    }
  }
  /**
   * Set value in memory store
   */
  setMemory(key, value) {
    const fullKey = `${this.prefix}:${key}`;
    this.memoryStore.set(fullKey, {
      value,
      expiresAt: Date.now() + this.ttlSeconds * 1e3
    });
  }
  /**
   * Get a value by key (returns null if expired or not found)
   */
  async get(key) {
    const fullKey = `${this.prefix}:${key}`;
    if (this.redisClient) {
      try {
        const serialized = await this.redisClient.get(fullKey);
        if (!serialized) return null;
        return JSON.parse(serialized);
      } catch (error) {
        logger.warn({ error, key }, "Redis get failed, falling back to memory");
        return this.getMemory(key);
      }
    } else {
      return this.getMemory(key);
    }
  }
  /**
   * Get value from memory store
   */
  getMemory(key) {
    const fullKey = `${this.prefix}:${key}`;
    const entry = this.memoryStore.get(fullKey);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.memoryStore.delete(fullKey);
      return null;
    }
    return entry.value;
  }
  /**
   * Delete a key
   */
  async delete(key) {
    const fullKey = `${this.prefix}:${key}`;
    if (this.redisClient) {
      try {
        await this.redisClient.del(fullKey);
      } catch {
      }
    }
    this.memoryStore.delete(fullKey);
  }
  /**
   * Check if a key exists (and is not expired)
   */
  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }
  /**
   * Clear all entries (for testing)
   */
  async clear() {
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys(`${this.prefix}:*`);
        for (const key of keys) {
          await this.redisClient.del(key);
        }
      } catch {
      }
    }
    this.memoryStore.clear();
  }
  /**
   * Get store statistics (for debugging)
   */
  async stats() {
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys(`${this.prefix}:*`);
        return { size: keys.length, source: "redis" };
      } catch {
      }
    }
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.expiresAt < now) {
        this.memoryStore.delete(key);
      }
    }
    return { size: this.memoryStore.size, source: "memory" };
  }
  /**
   * Dispose of the store (cleanup resources)
   */
  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
function useEphemeralStore(prefix, options = {}) {
  var _a;
  const ttlSeconds = (_a = options.ttlSeconds) != null ? _a : 300;
  const redisClientPromise = EphemeralStore.initRedis();
  const store = new EphemeralStore(prefix, {
    ttlSeconds,
    redisClient: null
    // Will be set asynchronously
  });
  redisClientPromise.then((client) => {
    if (client) {
      store.redisClient = client;
      if (store.cleanupInterval) {
        clearInterval(store.cleanupInterval);
        store.cleanupInterval = null;
      }
    }
  });
  return store;
}
const pending2FASessions = useEphemeralStore("2fa-pending", { ttlSeconds: 300 });
const pending2faVerifications = useEphemeralStore("2fa-verify", { ttlSeconds: 600 });

const FILE_SIGNATURES = {
  // Images
  jpeg: {
    signatures: [
      { bytes: [255, 216, 255] }
      // JPEG/JPG
    ],
    mime: "image/jpeg"
  },
  png: {
    signatures: [
      { bytes: [137, 80, 78, 71, 13, 10, 26, 10] }
      // PNG
    ],
    mime: "image/png"
  },
  gif: {
    signatures: [
      { bytes: [71, 73, 70, 56, 55, 97] },
      // GIF87a
      { bytes: [71, 73, 70, 56, 57, 97] }
      // GIF89a
    ],
    mime: "image/gif"
  },
  webp: {
    signatures: [
      { bytes: [82, 73, 70, 70], offset: 0 },
      // RIFF
      { bytes: [87, 69, 66, 80], offset: 8 }
      // WEBP at offset 8
    ],
    mime: "image/webp",
    multiCheck: true
    // Both signatures must match
  },
  // Videos
  mp4: {
    signatures: [
      { bytes: [102, 116, 121, 112], offset: 4 }
      // ftyp at offset 4
    ],
    mime: "video/mp4"
  },
  webm: {
    signatures: [
      { bytes: [26, 69, 223, 163] }
      // WebM/MKV
    ],
    mime: "video/webm"
  },
  mov: {
    signatures: [
      { bytes: [102, 116, 121, 112, 113, 116], offset: 4 },
      // ftypqt (QuickTime)
      { bytes: [109, 111, 111, 118], offset: 4 }
      // moov
    ],
    mime: "video/quicktime"
  },
  avi: {
    signatures: [
      { bytes: [82, 73, 70, 70] },
      // RIFF (AVI starts with RIFF)
      { bytes: [65, 86, 73, 32], offset: 8 }
      // AVI  at offset 8
    ],
    mime: "video/x-msvideo",
    multiCheck: true
  }
};
const ALLOWED_IMAGE_MIMES = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_VIDEO_MIMES = /* @__PURE__ */ new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo"
]);
function matchesSignature(buffer, bytes, offset = 0) {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
}
function detectFileType(buffer) {
  for (const [, fileType] of Object.entries(FILE_SIGNATURES)) {
    if (fileType.multiCheck) {
      const allMatch = fileType.signatures.every(
        (sig) => matchesSignature(buffer, sig.bytes, sig.offset || 0)
      );
      if (allMatch) return fileType.mime;
    } else {
      for (const sig of fileType.signatures) {
        if (matchesSignature(buffer, sig.bytes, sig.offset || 0)) {
          return fileType.mime;
        }
      }
    }
  }
  if (buffer.length >= 12) {
    const ftypAt4 = matchesSignature(buffer, [102, 116, 121, 112], 4);
    if (ftypAt4) {
      const brand = buffer.slice(8, 12).toString("ascii");
      const mp4Brands = ["isom", "iso2", "mp41", "mp42", "M4V ", "M4A ", "avc1", "iso5", "iso6"];
      if (mp4Brands.some((b) => brand.startsWith(b.trim()))) {
        return "video/mp4";
      }
      if (brand === "qt  ") {
        return "video/quicktime";
      }
    }
  }
  return null;
}
function validateImageFile(buffer) {
  const detectedMime = detectFileType(buffer);
  if (!detectedMime) {
    return {
      valid: false,
      detectedMime: null,
      error: "Could not detect file type. File may be corrupted or unsupported."
    };
  }
  if (!ALLOWED_IMAGE_MIMES.has(detectedMime)) {
    return {
      valid: false,
      detectedMime,
      error: `Detected file type "${detectedMime}" is not allowed. Allowed types: ${[...ALLOWED_IMAGE_MIMES].join(", ")}`
    };
  }
  return {
    valid: true,
    detectedMime
  };
}
function validateVideoFile(buffer) {
  const detectedMime = detectFileType(buffer);
  if (!detectedMime) {
    return {
      valid: false,
      detectedMime: null,
      error: "Could not detect file type. File may be corrupted or unsupported."
    };
  }
  if (!ALLOWED_VIDEO_MIMES.has(detectedMime)) {
    return {
      valid: false,
      detectedMime,
      error: `Detected file type "${detectedMime}" is not allowed. Allowed types: ${[...ALLOWED_VIDEO_MIMES].join(", ")}`
    };
  }
  return {
    valid: true,
    detectedMime
  };
}

const NETDATA_DEFAULT_URL = "http://127.0.0.1:19999";
const DEFAULT_AFTER_SECONDS = 300;
const DEFAULT_POINTS = 30;
const metricDefinitions = [
  {
    id: "cpu",
    label: "CPU",
    unit: "%",
    charts: ["system.cpu"],
    value: (query) => latestSum(query, (name) => name !== "idle"),
    status: percentageStatus
  },
  {
    id: "ram",
    label: "RAM",
    unit: "%",
    charts: ["system.ram"],
    value: (query) => {
      const latest = latestRow(query);
      if (!latest) return null;
      const total = sumDimensions(latest, () => true);
      const used = getDimension(latest, ["used"]);
      if (total <= 0 || used === null) return null;
      return used / total * 100;
    },
    status: percentageStatus,
    detail: (query) => {
      const latest = latestRow(query);
      if (!latest) return void 0;
      const total = sumDimensions(latest, () => true);
      const used = getDimension(latest, ["used"]);
      if (total <= 0 || used === null) return void 0;
      return `${Math.round(used)}/${Math.round(total)} MB`;
    }
  },
  {
    id: "load",
    label: "Load",
    unit: "",
    charts: ["system.load"],
    value: (query) => latestDimension(query, ["load1", "load 1", "1min"]),
    status: (value) => {
      if (value === null) return "unavailable";
      if (value >= 4) return "error";
      if (value >= 2) return "warning";
      return "ok";
    }
  },
  {
    id: "disk",
    label: "Disk",
    unit: "%",
    charts: ["disk_space._", "disk_space./", "disk_space.root"],
    chartMatcher: (chart) => {
      const id = chart.id || chart.name || "";
      return id.startsWith("disk_space.") || chart.context === "disk.space";
    },
    value: (query) => {
      const latest = latestRow(query);
      if (!latest) return null;
      const used = getDimension(latest, ["used"]);
      const avail = getDimension(latest, ["avail", "available", "free"]);
      if (used === null || avail === null || used + avail <= 0) return null;
      return used / (used + avail) * 100;
    },
    status: percentageStatus
  },
  {
    id: "network",
    label: "Network",
    unit: "Kbit/s",
    charts: ["system.net"],
    value: (query) => latestAbsSum(query),
    status: (value) => value === null ? "unavailable" : "ok"
  },
  {
    id: "diskIo",
    label: "Disk I/O",
    unit: "KiB/s",
    charts: ["system.io"],
    value: (query) => latestAbsSum(query),
    status: (value) => value === null ? "unavailable" : "ok"
  }
];
function getNetdataConfig(event) {
  var _a, _b;
  const runtimeConfig = useRuntimeConfig(event);
  const enabledValue = String((_b = (_a = runtimeConfig.netdataEnabled) != null ? _a : process.env.PM_MONITORING_NETDATA_ENABLED) != null ? _b : "true").trim().toLowerCase();
  return {
    enabled: !["0", "false", "no", "off"].includes(enabledValue),
    url: String(process.env.NETDATA_URL || runtimeConfig.netdataUrl || NETDATA_DEFAULT_URL).replace(/\/+$/, "")
  };
}
async function getNetdataSummary(event) {
  const config = getNetdataConfig(event);
  if (!config.enabled) {
    return {
      available: false,
      source: config.url,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      metrics: [],
      error: "Netdata monitoring is disabled"
    };
  }
  try {
    const metrics = await Promise.all(metricDefinitions.map((definition) => buildMetric(config.url, definition)));
    return {
      available: metrics.some((metric) => metric.status !== "unavailable"),
      source: config.url,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      metrics
    };
  } catch (error) {
    return {
      available: false,
      source: config.url,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      metrics: [],
      error: error instanceof Error ? error.message : "Netdata request failed"
    };
  }
}
async function getNetdataTimeseries(event, metricId, afterSeconds = DEFAULT_AFTER_SECONDS, points = DEFAULT_POINTS) {
  const config = getNetdataConfig(event);
  if (!config.enabled) return null;
  const definition = metricDefinitions.find((metric) => metric.id === metricId);
  if (!definition) return null;
  return buildMetric(config.url, definition, afterSeconds, points);
}
async function buildMetric(netdataUrl, definition, afterSeconds = DEFAULT_AFTER_SECONDS, points = DEFAULT_POINTS) {
  var _a, _b, _c;
  const query = await queryFirstAvailable(netdataUrl, definition, afterSeconds, points);
  if (!query) {
    return {
      id: definition.id,
      label: definition.label,
      unit: definition.unit,
      value: null,
      status: "unavailable",
      chart: definition.charts[0] || definition.id,
      dimensions: [],
      points: []
    };
  }
  const value = definition.value(query);
  return {
    id: definition.id,
    label: definition.label,
    unit: definition.unit,
    value,
    status: (_b = (_a = definition.status) == null ? void 0 : _a.call(definition, value)) != null ? _b : "ok",
    chart: query.chart,
    dimensions: query.dimensionNames,
    points: query.rows.map((row) => {
      var _a2;
      return {
        timestamp: row.time || 0,
        value: (_a2 = definition.value({ ...query, rows: [row] })) != null ? _a2 : 0
      };
    }),
    detail: (_c = definition.detail) == null ? void 0 : _c.call(definition, query, value)
  };
}
async function queryFirstAvailable(netdataUrl, definition, afterSeconds, points) {
  const charts = [...definition.charts];
  if (definition.chartMatcher) {
    charts.push(...await discoverMatchingCharts(netdataUrl, definition.chartMatcher));
  }
  for (const chart of [...new Set(charts)]) {
    try {
      const query = await queryChart(netdataUrl, chart, afterSeconds, points);
      if (query.rows.length > 0) {
        return query;
      }
    } catch {
    }
  }
  return null;
}
async function discoverMatchingCharts(netdataUrl, matcher) {
  try {
    const response = await fetch(`${netdataUrl}/api/v1/charts`, {
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) return [];
    const payload = await response.json();
    const charts = Object.entries(payload.charts || {}).map(([id, chart]) => ({ ...chart, id: chart.id || id })).filter(matcher).sort((left, right) => chartPriority(left.id) - chartPriority(right.id));
    return charts.map((chart) => chart.id);
  } catch {
    return [];
  }
}
function chartPriority(chartId) {
  if (chartId === "disk_space._" || chartId === "disk_space./" || chartId === "disk_space.root") return 0;
  if (chartId.includes("root")) return 1;
  return 2;
}
async function queryChart(netdataUrl, chart, afterSeconds, points) {
  const params = new URLSearchParams({
    chart,
    after: `-${afterSeconds}`,
    points: String(points),
    group: "average",
    format: "csv",
    options: "jsonwrap,seconds,nonzero"
  });
  const response = await fetch(`${netdataUrl}/api/v1/data?${params.toString()}`, {
    signal: AbortSignal.timeout(2500)
  });
  if (!response.ok) {
    throw new Error(`Netdata returned HTTP ${response.status} for ${chart}`);
  }
  const payload = await response.json();
  return parseCsvResult(chart, payload);
}
function parseCsvResult(chart, payload) {
  var _a, _b;
  const result = (_a = payload.result) == null ? void 0 : _a.trim();
  if (!result) {
    return {
      chart: payload.id || payload.name || chart,
      dimensionNames: payload.dimension_names || [],
      rows: []
    };
  }
  const lines = result.split(/\r?\n/).filter(Boolean);
  const header = ((_b = lines.shift()) == null ? void 0 : _b.split(",")) || [];
  const dimensionNames = header.slice(1);
  const rows = lines.map((line) => {
    const values = line.split(",");
    const row = {
      time: Number(values[0] || 0)
    };
    for (let index = 1; index < header.length; index += 1) {
      row[header[index]] = Number(values[index] || 0);
    }
    return row;
  });
  return {
    chart: payload.id || payload.name || chart,
    dimensionNames,
    rows
  };
}
function latestRow(query) {
  return query.rows[query.rows.length - 1] || null;
}
function latestDimension(query, candidates) {
  const latest = latestRow(query);
  if (!latest) return null;
  return getDimension(latest, candidates);
}
function latestSum(query, include) {
  const latest = latestRow(query);
  if (!latest) return null;
  return sumDimensions(latest, include);
}
function latestAbsSum(query) {
  const latest = latestRow(query);
  if (!latest) return null;
  return sumDimensions(latest, () => true, true);
}
function getDimension(row, candidates) {
  for (const candidate of candidates) {
    if (typeof row[candidate] === "number" && Number.isFinite(row[candidate])) {
      return row[candidate];
    }
  }
  return null;
}
function sumDimensions(row, include, absolute = false) {
  return Object.entries(row).reduce((sum, [dimension, value]) => {
    if (dimension === "time" || !include(dimension) || !Number.isFinite(value)) return sum;
    return sum + (absolute ? Math.abs(value) : value);
  }, 0);
}
function percentageStatus(value) {
  if (value === null) return "unavailable";
  if (value >= 95) return "error";
  if (value >= 85) return "warning";
  return "ok";
}

function getOpsAgentConfig(event) {
  var _a, _b;
  const runtimeConfig = useRuntimeConfig(event);
  const enabledValue = String((_b = (_a = process.env.PM_OPS_AGENT_ENABLED) != null ? _a : runtimeConfig.opsAgentEnabled) != null ? _b : "false").trim().toLowerCase();
  return {
    enabled: !["0", "false", "no", "off"].includes(enabledValue),
    url: String(process.env.PM_OPS_AGENT_URL || runtimeConfig.opsAgentUrl || "http://127.0.0.1:3010").replace(/\/+$/, ""),
    token: String(process.env.PM_OPS_AGENT_TOKEN || runtimeConfig.opsAgentToken || "")
  };
}
async function opsAgentFetch(event, path, options = {}) {
  const config = getOpsAgentConfig(event);
  if (!config.enabled) {
    throw createError({
      statusCode: 503,
      message: "Ops agent is disabled"
    });
  }
  if (!config.token) {
    throw createError({
      statusCode: 503,
      message: "Ops agent token is not configured"
    });
  }
  const url = new URL(`${config.url}${path}`);
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== void 0) url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      authorization: `Bearer ${config.token}`,
      ...options.body ? { "content-type": "application/json" } : {}
    },
    body: options.body ? JSON.stringify(options.body) : void 0,
    signal: AbortSignal.timeout(1e4)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !(payload == null ? void 0 : payload.success)) {
    throw createError({
      statusCode: response.status || 502,
      message: (payload == null ? void 0 : payload.error) || `Ops agent returned HTTP ${response.status}`
    });
  }
  return payload.data;
}

function checkVersion(currentVersion, expectedVersion) {
  if (expectedVersion === void 0 || expectedVersion === null) {
    return;
  }
  if (!currentVersion) {
    return;
  }
  const currentTs = currentVersion instanceof Date ? currentVersion.getTime() : typeof currentVersion === "number" ? currentVersion : new Date(currentVersion).getTime();
  const expectedTs = expectedVersion instanceof Date ? expectedVersion.getTime() : typeof expectedVersion === "number" ? expectedVersion : new Date(expectedVersion).getTime();
  if (isNaN(currentTs) || isNaN(expectedTs)) {
    return;
  }
  if (Math.abs(currentTs - expectedTs) > 1e3) {
    throw createError({
      statusCode: 409,
      statusMessage: "Conflict: Resource was modified by another user",
      data: {
        currentVersion: new Date(currentTs).toISOString(),
        expectedVersion: new Date(expectedTs).toISOString(),
        message: "Please refresh the page and try again."
      }
    });
  }
}
function versionInfo(record) {
  var _a;
  return {
    version: ((_a = record.updatedAt) == null ? void 0 : _a.toISOString()) || null
  };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
function parsePaginationParams(query) {
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit || DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const cursor = query.cursor ? String(query.cursor) : void 0;
  const sortBy = query.sortBy ? String(query.sortBy) : void 0;
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const filters = {};
  for (const [key, value] of Object.entries(query)) {
    const filterMatch = key.match(/^filter\[(\w+)\]$/);
    if (filterMatch && value !== void 0 && value !== "") {
      filters[filterMatch[1]] = value;
    }
  }
  return { page, limit, cursor, sortBy, sortOrder, filters };
}
function calculateOffset(page, limit) {
  return (page - 1) * limit;
}
function buildPaginationMeta(total, page, limit, items, cursorField) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  const meta = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage
  };
  return meta;
}
function paginationClauses(page, limit) {
  return {
    limitClause: limit,
    offsetClause: calculateOffset(page, limit)
  };
}

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const COMMON_PASSWORDS = /* @__PURE__ */ new Set([
  "password",
  "password1",
  "password123",
  "123456",
  "12345678",
  "123456789",
  "qwerty",
  "abc123",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "admin",
  "login",
  "passw0rd",
  "hello",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "iloveyou",
  "trustno1",
  "superman",
  "batman",
  "shadow",
  "michael",
  "ashley",
  "daniel",
  "jessica",
  "charlie",
  "thomas",
  "robert",
  "jennifer"
]);
const DEFAULT_PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  rejectCommon: true
};
function validatePassword(password, policy = DEFAULT_PASSWORD_POLICY) {
  const errors = [];
  let score = 0;
  const specialCharRegex = /[^A-Za-z0-9]/;
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  } else if (/\d/.test(password)) {
    score += 1;
  }
  if (policy.requireSpecial && !specialCharRegex.test(password)) {
    errors.push("Password must contain at least one special character");
  } else if (specialCharRegex.test(password)) {
    score += 1;
  }
  if (policy.rejectCommon) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.has(lowerPassword)) {
      errors.push("Password is too common");
      score = Math.max(0, score - 2);
    }
  }
  const charTypes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    specialCharRegex.test(password)
  ].filter(Boolean).length;
  if (charTypes === 4) score += 1;
  if (!/(.)\1{2,}/.test(password)) score += 1;
  let strength;
  if (score <= 3) {
    strength = "weak";
  } else if (score <= 5) {
    strength = "fair";
  } else if (score <= 7) {
    strength = "good";
  } else {
    strength = "strong";
  }
  return {
    valid: errors.length === 0,
    errors,
    strength,
    score: Math.min(10, score)
  };
}
function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const hashBuffer = Buffer.from(hash, "hex");
    const suppliedHashBuffer = scryptSync(password, salt, KEY_LENGTH);
    return timingSafeEqual(hashBuffer, suppliedHashBuffer);
  } catch {
    return false;
  }
}
function generateSessionId() {
  return randomBytes(32).toString("hex");
}

let redisClient = null;
let redisInitialized = false;
async function initRedis() {
  if (redisInitialized) return redisClient !== null;
  redisInitialized = true;
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.debug("REDIS_URL not set - using in-memory rate limiting");
      return false;
    }
    const Redis = await import('file:///app/node_modules/ioredis/built/index.js').then((m) => m.default).catch(() => null);
    if (!Redis) {
      logger.warn("ioredis not installed - using in-memory rate limiting. Run: npm install ioredis");
      return false;
    }
    const client = new Redis(redisUrl);
    await client.ping();
    redisClient = {
      get: async (key) => client.get(key),
      incr: async (key) => client.incr(key),
      expire: async (key, seconds) => await client.expire(key, seconds) === 1,
      setex: async (key, seconds, value) => {
        await client.setex(key, seconds, value);
      },
      del: async (key) => {
        await client.del(key);
      }
    };
    logger.info("Rate limiting using Redis");
    return true;
  } catch (error) {
    logger.warn({ error }, "Redis connection failed - using in-memory rate limiting");
    return false;
  }
}
function createRateLimiter(limit, windowMs, prefix = "rl") {
  const rateLimitMap = /* @__PURE__ */ new Map();
  const windowSec = Math.ceil(windowMs / 1e3);
  async function checkRateLimitAsync(key) {
    if (redisClient) {
      return checkRateLimitRedis(key);
    }
    await initRedis();
    if (redisClient) {
      return checkRateLimitRedis(key);
    }
    return checkRateLimitMemory(key);
  }
  function checkRateLimit(key) {
    return checkRateLimitMemory(key);
  }
  function checkRateLimitMemory(key) {
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || entry.resetAt < now) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= limit) {
      return false;
    }
    entry.count++;
    return true;
  }
  async function checkRateLimitRedis(key) {
    if (!redisClient) return checkRateLimitMemory(key);
    const redisKey = `${prefix}:${key}`;
    try {
      const count = await redisClient.incr(redisKey);
      if (count === 1) {
        await redisClient.expire(redisKey, windowSec);
        return true;
      }
      if (count > limit) {
        return false;
      }
      return true;
    } catch (error) {
      logger.warn({ error, key }, "Redis rate limit check failed, falling back to memory");
      return checkRateLimitMemory(key);
    }
  }
  function getRemaining(key) {
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || entry.resetAt < now) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }
  async function reset(key) {
    rateLimitMap.delete(key);
    if (redisClient) {
      try {
        await redisClient.del(`${prefix}:${key}`);
      } catch {
      }
    }
  }
  function clear() {
    rateLimitMap.clear();
  }
  return {
    checkRateLimit,
    checkRateLimitAsync,
    getRemaining,
    reset,
    clear
  };
}
const contactRateLimiter = createRateLimiter(5, 60 * 60 * 1e3, "contact");
const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1e3, "login");
const twoFactorSetupRateLimiter = createRateLimiter(10, 60 * 60 * 1e3, "2fa-setup");
const twoFactorEnableRateLimiter = createRateLimiter(5, 15 * 60 * 1e3, "2fa-enable");
const twoFactorVerifyRateLimiter = createRateLimiter(5, 15 * 60 * 1e3, "2fa-verify");
const twoFactorDisableRateLimiter = createRateLimiter(3, 15 * 60 * 1e3, "2fa-disable");
function getClientIp(event) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const forwardedFor = (_c = (_b = (_a = event.node) == null ? void 0 : _a.req) == null ? void 0 : _b.headers) == null ? void 0 : _c["x-forwarded-for"];
  if (forwardedFor) {
    const ip = typeof forwardedFor === "string" ? (_d = forwardedFor.split(",")[0]) == null ? void 0 : _d.trim() : (_f = (_e = forwardedFor[0]) == null ? void 0 : _e.split(",")[0]) == null ? void 0 : _f.trim();
    if (ip) return ip;
  }
  const realIp = (_i = (_h = (_g = event.node) == null ? void 0 : _g.req) == null ? void 0 : _h.headers) == null ? void 0 : _i["x-real-ip"];
  if (realIp) {
    return typeof realIp === "string" ? realIp : (_j = realIp[0]) != null ? _j : "unknown";
  }
  const socketAddress = (_m = (_l = (_k = event.node) == null ? void 0 : _k.req) == null ? void 0 : _l.socket) == null ? void 0 : _m.remoteAddress;
  if (socketAddress) return socketAddress;
  return "unknown";
}

const ROLE_HIERARCHY = {
  editor: 0,
  admin: 1,
  master: 2
};
function hasRole(userRole, minRole) {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}
function isAdmin(userRole) {
  return hasRole(userRole, "admin");
}
function requireAdmin(userRole) {
  if (!isAdmin(userRole)) {
    throw createApiError(403, "auth.adminRequired", {
      requiredRole: "admin",
      actualRole: userRole != null ? userRole : null
    });
  }
}

const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "del",
  "ins",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "span",
  "figure",
  "figcaption",
  "sup",
  "sub",
  "mark",
  "small"
];
let sanitizeHtmlLib = null;
let libInitialized = false;
async function initSanitizeLib() {
  if (libInitialized) return sanitizeHtmlLib !== null;
  libInitialized = true;
  try {
    const lib = await import('file:///app/node_modules/sanitize-html/index.js').then((m) => m.default).catch(() => null);
    if (!lib) {
      logger.debug("sanitize-html not installed - using regex-based sanitization");
      return false;
    }
    sanitizeHtmlLib = lib;
    logger.info("HTML sanitization using sanitize-html library");
    return true;
  } catch {
    return false;
  }
}
initSanitizeLib();
function sanitizeWithLibrary(html) {
  if (!sanitizeHtmlLib) return sanitizeWithRegex(html);
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      "*": ["class", "id", "title"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"]
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"]
    },
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target === "_blank") {
          attribs.rel = "noopener noreferrer";
        }
        return { tagName, attribs };
      }
    }
  });
}
const DANGEROUS_TAGS = [
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "meta",
  "link",
  "base",
  "noscript",
  "template"
];
const EVENT_HANDLER_ATTR_REGEX = /\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_URL_REGEX = /^\s*(javascript|data|vbscript):/i;
function sanitizeWithRegex(html) {
  var _a, _b;
  let result = html;
  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    result = result.replace(regex, "");
    const selfClosing = new RegExp(`<${tag}[^>]*\\/?>`, "gi");
    result = result.replace(selfClosing, "");
  }
  result = result.replace(EVENT_HANDLER_ATTR_REGEX, "");
  result = result.replace(/(href|src)\s*=\s*["']([^"']*)["']/gi, (match, attr, url) => {
    if (DANGEROUS_URL_REGEX.test(url)) {
      return `${attr}="#"`;
    }
    return match;
  });
  result = result.replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, 'style=""');
  result = result.replace(/\s+data-[a-z-]+\s*=\s*["'][^"']*["']/gi, "");
  const allTags = result.match(/<\/?([a-z][a-z0-9]*)[^>]*>/gi) || [];
  for (const tagMatch of allTags) {
    const tagName = (_b = (_a = tagMatch.match(/<\/?([a-z][a-z0-9]*)/i)) == null ? void 0 : _a[1]) == null ? void 0 : _b.toLowerCase();
    if (tagName && !ALLOWED_TAGS.includes(tagName)) {
      result = result.replace(tagMatch, "");
    }
  }
  result = result.replace(/\n\s*\n\s*\n/g, "\n\n");
  return result.trim();
}
function sanitizeHtml(html) {
  if (!html) return "";
  if (sanitizeHtmlLib) {
    return sanitizeWithLibrary(html);
  }
  return sanitizeWithRegex(html);
}
function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

const SETTINGS_SECRET_PREFIX = "enc:v1:";
const ENCRYPTION_ALGORITHM$1 = "aes-256-gcm";
const IV_LENGTH$1 = 16;
const AUTH_TAG_LENGTH = 16;
const HEX_64_PATTERN = /^[a-f0-9]{64,}$/i;
const SETTINGS_ENCRYPTION_KEY_PLACEHOLDER = "replace-with-64-character-hex-string-from-openssl";
function validateSettingsEncryptionKeyValue(envKey) {
  if (!envKey) {
    return "PM_SETTINGS_ENCRYPTION_KEY or SETTINGS_ENCRYPTION_KEY is required in production.";
  }
  if (envKey !== envKey.trim()) {
    return "PM_SETTINGS_ENCRYPTION_KEY or SETTINGS_ENCRYPTION_KEY must not include surrounding whitespace.";
  }
  if (envKey === SETTINGS_ENCRYPTION_KEY_PLACEHOLDER) {
    return "PM_SETTINGS_ENCRYPTION_KEY must be replaced with a real generated secret.";
  }
  if (envKey.includes("$(") || envKey.includes("`")) {
    return "PM_SETTINGS_ENCRYPTION_KEY must be a literal secret value, not shell command substitution.";
  }
  if (!HEX_64_PATTERN.test(envKey)) {
    return "PM_SETTINGS_ENCRYPTION_KEY or SETTINGS_ENCRYPTION_KEY must be a hexadecimal string with at least 64 characters.";
  }
  return null;
}
function getSettingsEncryptionKey() {
  const envKey = process.env.SETTINGS_ENCRYPTION_KEY || process.env.PM_SETTINGS_ENCRYPTION_KEY;
  if (envKey) {
    const validationError = validateSettingsEncryptionKeyValue(envKey);
    if (validationError) {
      throw new Error(`FATAL: ${validationError}`);
    }
    return scryptSync(envKey, "pm-settings-secret-salt", 32);
  }
  console.warn(
    "\u26A0\uFE0F  Using development encryption key - DO NOT use in production. Set PM_SETTINGS_ENCRYPTION_KEY environment variable."
  );
  return scryptSync("pm-development-settings-key", "pm-settings-secret-salt", 32);
}
function isEncryptedSecretValue(value) {
  return typeof value === "string" && value.startsWith(SETTINGS_SECRET_PREFIX);
}
function encryptSecretValue(plainText) {
  const key = getSettingsEncryptionKey();
  const iv = randomBytes(IV_LENGTH$1);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM$1, key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${SETTINGS_SECRET_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}
function decryptSecretValue(value) {
  if (!isEncryptedSecretValue(value)) {
    return value;
  }
  const payload = value.slice(SETTINGS_SECRET_PREFIX.length);
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted secret payload format");
  }
  const [ivHex, authTagHex, cipherHex] = parts;
  if (!ivHex || !authTagHex || !cipherHex) {
    throw new Error("Invalid encrypted secret payload");
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  if (iv.length !== IV_LENGTH$1 || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted secret payload length");
  }
  const key = getSettingsEncryptionKey();
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM$1, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function readPmModeResult() {
  const configPath = resolve(process.cwd(), "project", "puppet-master.config.ts");
  if (!existsSync(configPath)) {
    return { success: true, mode: "unconfigured" };
  }
  try {
    const content = readFileSync(configPath, "utf-8");
    const match = content.match(/pmMode:\s*['"](\w+)['"]/);
    if (match && ["unconfigured", "build", "develop"].includes(match[1])) {
      return { success: true, mode: match[1] };
    }
    return {
      success: false,
      error: "parse_error",
      message: "Could not parse pmMode from config file"
    };
  } catch (e) {
    return {
      success: false,
      error: "read_error",
      message: `Failed to read config file: ${e.message}`
    };
  }
}
function validateProductionAuth(event) {
  const authHeader = getHeader(event, "x-pm-setup-authorization");
  const setupSecret = process.env.PM_SETUP_SECRET;
  if (!setupSecret) {
    return true;
  }
  return authHeader === setupSecret;
}
function requireSetupAccess(event, options = {}) {
  const { allowModes = ["unconfigured"], allowReadOnly = false, requireProductionAuth = false } = options;
  const result = readPmModeResult();
  const method = event.method.toUpperCase();
  if (requireProductionAuth && !validateProductionAuth(event)) {
    throw createError({
      statusCode: 403,
      statusMessage: "PM_SETUP_003: Production authorization failed",
      message: "Invalid or missing setup authorization secret. Provide a valid X-PM-Setup-Authorization header matching PM_SETUP_SECRET environment variable."
    });
  }
  if (!result.success) {
    if (allowReadOnly && method === "GET" && result.error === "parse_error") {
      return "unconfigured";
    }
    throw createError({
      statusCode: 500,
      statusMessage: "PM_SETUP_002: Config read failed",
      message: `Cannot determine setup state: ${result.message}. Setup endpoints are blocked for security. Please verify puppet-master.config.ts is readable and properly formatted.`
    });
  }
  const pmMode = result.mode;
  if (allowReadOnly && method === "GET") {
    return pmMode;
  }
  if (!allowModes.includes(pmMode)) {
    throw createError({
      statusCode: 403,
      statusMessage: "PM_SETUP_001: Setup access denied",
      message: `Setup API is only accessible when project is unconfigured. Current mode: '${pmMode}'. To reconfigure, run '/pm-init --reset' or manually set pmMode to 'unconfigured' in puppet-master.config.ts.`
    });
  }
  return pmMode;
}

const SECRET_MASK_VALUE = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
const SETTING_DEFINITIONS = [...config.settings];
const SETTING_DEFINITION_BY_KEY = new Map(
  SETTING_DEFINITIONS.map((setting) => [setting.key, setting])
);
function getSettingDefinition(key) {
  return SETTING_DEFINITION_BY_KEY.get(key);
}
function isSecretSettingDefinition(setting) {
  return setting.type === "password" || setting.public === false;
}
function isSecretSettingKey(key) {
  const setting = getSettingDefinition(key);
  return !!setting && isSecretSettingDefinition(setting);
}
function splitSettingKey(key) {
  const [group, ...rest] = key.split(".");
  return {
    group: group || "general",
    shortKey: rest.length > 0 ? rest.join(".") : key
  };
}
function parseStoredSettingValue(key, storedValue) {
  if (storedValue === null) {
    return null;
  }
  if (!isSecretSettingKey(key)) {
    return storedValue;
  }
  try {
    return decryptSecretValue(storedValue);
  } catch {
    return null;
  }
}
function normalizeSettingValueForStorage(key, value) {
  if (!isSecretSettingKey(key)) {
    return { value, isSecret: false };
  }
  if (value === null) {
    return { value: null, isSecret: true };
  }
  if (value === SECRET_MASK_VALUE) {
    return { value: SECRET_MASK_VALUE, isSecret: true };
  }
  const normalized = value.trim();
  if (!normalized) {
    return { value: "", isSecret: true };
  }
  return {
    value: encryptSecretValue(normalized),
    isSecret: true
  };
}
function buildGroupedSettings(byKey, options) {
  var _a, _b;
  const grouped = {};
  for (const definition of SETTING_DEFINITIONS) {
    const isSecret = isSecretSettingDefinition(definition);
    if (!options.includeSecrets && isSecret) {
      continue;
    }
    const settingValue = (_b = (_a = byKey.get(definition.key)) == null ? void 0 : _a.value) != null ? _b : null;
    const { group, shortKey } = splitSettingKey(definition.key);
    grouped[group] || (grouped[group] = {});
    if (!isSecret) {
      grouped[group][shortKey] = settingValue;
      continue;
    }
    const parsed = parseStoredSettingValue(definition.key, settingValue);
    if (options.viewerRole === "master") {
      grouped[group][shortKey] = parsed;
      continue;
    }
    grouped[group][shortKey] = parsed ? SECRET_MASK_VALUE : null;
  }
  return grouped;
}
function buildSettingsMap() {
  const db = useDatabase();
  const rows = db.select().from(settings).all();
  return new Map(rows.map((row) => [row.key, { key: row.key, value: row.value }]));
}
function getSettingValue(key) {
  const db = useDatabase();
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  if (!row) {
    return null;
  }
  return parseStoredSettingValue(key, row.value);
}

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
const UPLOAD_DIR = process.env.UPLOAD_DIR || "public/uploads";
class LocalStorage {
  constructor(imageOptions, videoOptions) {
    __publicField$2(this, "imageOptions");
    __publicField$2(this, "videoOptions");
    this.imageOptions = imageOptions;
    this.videoOptions = videoOptions;
  }
  async upload(buffer, options) {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
    const id = randomUUID();
    if (options.type === "image") {
      return this.uploadImage(buffer, id, options);
    } else {
      return this.uploadVideo(buffer, id, options);
    }
  }
  async uploadImage(buffer, id, options) {
    const { maxWidth, maxHeight, quality, thumbnailWidth, thumbnailHeight, thumbnailQuality } = this.imageOptions;
    const metadata = await sharp(buffer).metadata();
    const mainImage = await sharp(buffer).resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true
    }).webp({ quality }).toBuffer();
    const thumbnail = await sharp(buffer).resize(thumbnailWidth, thumbnailHeight, {
      fit: "cover",
      position: "center"
    }).webp({ quality: thumbnailQuality }).toBuffer();
    await writeFile(`${UPLOAD_DIR}/${id}.webp`, mainImage);
    await writeFile(`${UPLOAD_DIR}/${id}-thumb.webp`, thumbnail);
    return {
      id,
      url: `/uploads/${id}.webp`,
      thumbnailUrl: `/uploads/${id}-thumb.webp`,
      originalName: options.originalName,
      size: mainImage.length,
      mimeType: "image/webp",
      width: metadata.width,
      height: metadata.height
    };
  }
  async uploadVideo(buffer, id, options) {
    const ext = this.videoOptions.outputFormat;
    const outputPath = `${UPLOAD_DIR}/${id}.${ext}`;
    await writeFile(outputPath, buffer);
    return {
      id,
      url: `/uploads/${id}.${ext}`,
      originalName: options.originalName,
      size: buffer.length,
      mimeType: options.mimeType
    };
  }
  async delete(id) {
    const extensions = ["webp", "mp4", "webm"];
    const variants = ["", "-thumb"];
    for (const ext of extensions) {
      for (const variant of variants) {
        const path = `${UPLOAD_DIR}/${id}${variant}.${ext}`;
        if (existsSync(path)) {
          await unlink(path);
        }
      }
    }
  }
  getUrl(id, variant = "original") {
    const suffix = variant === "thumbnail" ? "-thumb" : "";
    return `/uploads/${id}${suffix}.webp`;
  }
}

const MAX_S3_KEY_LENGTH = 1024;
function getS3SigningSecret() {
  const secret = process.env.S3_PROXY_SIGNING_KEY || process.env.S3_SECRET_KEY;
  if (!secret) {
    throw new Error("S3 signing key missing. Set S3_PROXY_SIGNING_KEY or S3_SECRET_KEY.");
  }
  return secret;
}
function signRawKey(key) {
  return createHmac("sha256", getS3SigningSecret()).update(key).digest("hex");
}
function getS3VisibilityMode() {
  var _a;
  const explicit = (_a = process.env.S3_VISIBILITY) == null ? void 0 : _a.trim().toLowerCase();
  if (!explicit) {
    return process.env.S3_PUBLIC_URL ? "public" : "private";
  }
  if (explicit !== "public" && explicit !== "private") {
    throw new Error('Invalid S3_VISIBILITY value. Expected "public" or "private".');
  }
  return explicit;
}
function normalizeS3ObjectKey(rawKey) {
  const key = rawKey.trim().replace(/^\/+/, "");
  if (!key) {
    throw new Error("S3 object key is required");
  }
  if (key.length > MAX_S3_KEY_LENGTH) {
    throw new Error("S3 object key is too long");
  }
  if (key.includes("\0") || key.includes("..")) {
    throw new Error("Invalid S3 object key");
  }
  return key;
}
function decodeS3ObjectKeyFromPath(pathKey) {
  const decoded = pathKey.split("/").map((segment) => decodeURIComponent(segment)).join("/");
  return normalizeS3ObjectKey(decoded);
}
function verifyS3ObjectKeySignature(key, signature) {
  if (!signature) {
    return false;
  }
  const expected = signRawKey(normalizeS3ObjectKey(key));
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function getS3RuntimeConfig() {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const region = process.env.S3_REGION || "auto";
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 credentials not configured. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY in .env"
    );
  }
  return {
    endpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket: process.env.S3_BUCKET || "uploads"
  };
}
function createS3Client(config) {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    forcePathStyle: true
    // Required for MinIO and some S3-compatible services
  });
}
function createS3ClientFromEnv() {
  const runtimeConfig = getS3RuntimeConfig();
  return {
    client: createS3Client(runtimeConfig),
    bucket: runtimeConfig.bucket
  };
}

let storageInstance = null;
function useFileStorage() {
  if (storageInstance) {
    return storageInstance;
  }
  const { storage } = config;
  const imageOptions = {
    maxWidth: storage.image.maxWidth,
    maxHeight: storage.image.maxHeight,
    quality: storage.image.quality,
    thumbnailWidth: storage.image.thumbnailWidth,
    thumbnailHeight: storage.image.thumbnailHeight,
    thumbnailQuality: storage.image.thumbnailQuality
  };
  const videoOptions = {
    maxWidth: storage.video.compression.maxWidth,
    videoBitrate: storage.video.compression.videoBitrate,
    audioBitrate: storage.video.compression.audioBitrate,
    fps: storage.video.compression.fps,
    outputFormat: storage.video.outputFormat
  };
  {
    storageInstance = new LocalStorage(imageOptions, videoOptions);
  }
  return storageInstance;
}

const SYSTEM_PREFIXES = [
  "common.",
  "cookies.",
  "nav.",
  "auth.",
  "admin.",
  "theme.",
  "footer.",
  "validation.",
  "pricing.",
  "settings."
];
function isSystemKey(key) {
  return SYSTEM_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function syncSystemTranslationsToFile() {
  try {
    const db = useDatabase();
    const rows = db.select({
      locale: translations.locale,
      key: translations.key,
      value: translations.value
    }).from(translations).orderBy(asc(translations.locale), asc(translations.key)).all();
    const systemRows = rows.filter((row) => isSystemKey(row.key)).map((row) => {
      var _a;
      return {
        locale: row.locale,
        key: row.key,
        value: (_a = row.value) != null ? _a : ""
      };
    });
    const seedPath = join(process.cwd(), "i18n/system-seed.json");
    writeFileSync(seedPath, JSON.stringify(systemRows, null, 2), "utf-8");
    logger.info({ count: systemRows.length }, "Synced system translations to system-seed.json");
  } catch (error) {
    logger.error({ error }, "Failed to sync system translations");
  }
}

setDefaultResultOrder("ipv4first");
const TELEGRAM_BOT_TOKEN_PATTERN = /^\d{6,}:[A-Za-z0-9_-]{20,}$/;
function formatTelegramDate(value) {
  const date = value instanceof Date ? value : value ? new Date(value) : /* @__PURE__ */ new Date();
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const getPart = (type) => {
    var _a;
    return ((_a = parts.find((part) => part.type === type)) == null ? void 0 : _a.value) || "00";
  };
  return `${getPart("day")}.${getPart("month")}.${getPart("year")} ${getPart("hour")}:${getPart("minute")}`;
}
function normalizeTelegramBotToken(value) {
  const trimmed = value.trim();
  if (/^bot\d{6,}:/i.test(trimmed)) {
    return trimmed.slice(3);
  }
  return trimmed;
}
function getConfig() {
  const telegramBotToken = normalizeTelegramBotToken(getSettingValue("contact.telegramBotToken") || "");
  const telegramChatId = (getSettingValue("contact.telegramChatId") || "").trim();
  if (!telegramBotToken || !telegramChatId) {
    logger.debug("Telegram bot not configured - notifications will be skipped");
    return null;
  }
  if (!TELEGRAM_BOT_TOKEN_PATTERN.test(telegramBotToken)) {
    logger.error(
      {
        tokenLength: telegramBotToken.length,
        hasSeparator: telegramBotToken.includes(":"),
        startsWithHttp: /^https?:\/\//i.test(telegramBotToken)
      },
      "Telegram bot token has invalid format - expected BotFather token like 123456789:ABC..."
    );
    return null;
  }
  return {
    botToken: telegramBotToken,
    chatId: telegramChatId
  };
}
async function sendTelegramMessage(text, parseMode = "HTML") {
  const config = getConfig();
  if (!config) return false;
  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(1e4),
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: parseMode
      })
    });
    const result = await response.json();
    if (!result.ok) {
      logger.error({ description: result.description }, "Telegram API error");
      return false;
    }
    logger.info("Telegram message sent successfully");
    return true;
  } catch (error) {
    logger.error({ error }, "Failed to send Telegram message");
    return false;
  }
}
async function notifyNewContact(data) {
  const receivedAt = formatTelegramDate(data.createdAt);
  const text = `
\u{1F4E9} <b>New Contact Form Submission</b>

<b>Submission ID:</b> #${data.submissionId}
<b>Received:</b> ${receivedAt}

Personal data was not sent to Telegram.
Open the admin contact inbox to review the full submission.
`.trim();
  return sendTelegramMessage(text);
}

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
function getEncryptionKey() {
  const envKey = process.env.TOTP_ENCRYPTION_KEY;
  if (envKey) {
    return scryptSync(envKey, "totp-salt", 32);
  }
  return scryptSync("development-totp-key", "totp-salt", 32);
}
function generateTotpSecret() {
  const secret = new Secret({ size: 20 });
  return secret.base32;
}
function createTotpInstance(secret, userEmail) {
  var _a;
  const projectName = ((_a = config.meta) == null ? void 0 : _a.title) || "Puppet Master";
  return new TOTP({
    issuer: projectName,
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret)
  });
}
async function generateTotpQRCode(secret, userEmail) {
  const totp = createTotpInstance(secret, userEmail);
  const uri = totp.toString();
  return QRCode.toDataURL(uri, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 256
  });
}
function getTotpUri(secret, userEmail) {
  const totp = createTotpInstance(secret, userEmail);
  return totp.toString();
}
function verifyTotpCode(secret, code, userEmail) {
  const totp = createTotpInstance(secret, userEmail);
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}
function generateBackupCodes() {
  const codes = [];
  const hashedCodes = [];
  for (let i = 0; i < 10; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
    const hash = scryptSync(code, "backup-code-salt", 32).toString("hex");
    hashedCodes.push(hash);
  }
  return { plain: codes, hashed: hashedCodes };
}
function verifyBackupCode(code, hashedCodes) {
  const normalizedCode = code.toUpperCase().replace(/[\s-]/g, "");
  const codeHash = scryptSync(normalizedCode, "backup-code-salt", 32).toString("hex");
  return hashedCodes.findIndex((hash) => hash === codeHash);
}
function encryptTotpSecret(secret) {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}
function decryptTotpSecret(encryptedSecret) {
  const key = getEncryptionKey();
  const parts = encryptedSecret.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted secret format");
  }
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
function verify2faCode(code, encryptedSecret, hashedBackupCodes, userEmail) {
  const normalizedCode = code.replace(/[\s-]/g, "");
  if (/^\d{6}$/.test(normalizedCode)) {
    const secret = decryptTotpSecret(encryptedSecret);
    if (verifyTotpCode(secret, normalizedCode, userEmail)) {
      return { success: true, method: "totp" };
    }
    return { success: false, error: "Invalid verification code" };
  }
  const backupIndex = verifyBackupCode(normalizedCode, hashedBackupCodes);
  if (backupIndex >= 0) {
    return { success: true, method: "backup", backupCodeIndex: backupIndex };
  }
  return { success: false, error: "Invalid verification code" };
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, key + "" , value);
const CACHE_TTL = 5 * 60 * 1e3;
function normalizeTranslationValueForI18n(value) {
  let normalized = "";
  for (let index = 0; index < value.length; index++) {
    if (value.startsWith("{'@'}", index)) {
      normalized += "{'@'}";
      index += 4;
      continue;
    }
    const char = value[index];
    const nextChar = value[index + 1];
    if (char === "@" && nextChar !== ":" && nextChar !== ".") {
      normalized += "{'@'}";
      continue;
    }
    normalized += char;
  }
  return normalized;
}
class TranslationCache {
  constructor() {
    __publicField$1(this, "cache", /* @__PURE__ */ new Map());
  }
  /**
   * Get translations for a locale (from cache or DB)
   */
  get(locale) {
    const cached = this.cache.get(locale);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    const translations = this.fetchFromDb(locale);
    this.cache.set(locale, {
      data: translations,
      timestamp: now
    });
    logger.debug({ locale, count: Object.keys(translations).length }, "Translation cache refreshed");
    return translations;
  }
  /**
   * Fetch translations from database
   */
  fetchFromDb(locale) {
    const db = useDatabase();
    const rows = db.select({
      key: translations.key,
      value: translations.value
    }).from(translations).where(eq(translations.locale, locale)).all();
    const result = {};
    for (const row of rows) {
      if (row.value !== null && row.value !== void 0) {
        result[row.key] = normalizeTranslationValueForI18n(row.value);
      }
    }
    return result;
  }
  /**
   * Invalidate cache for a specific locale
   */
  invalidate(locale) {
    this.cache.delete(locale);
    logger.debug({ locale }, "Translation cache invalidated");
  }
  /**
   * Invalidate entire cache
   */
  invalidateAll() {
    this.cache.clear();
    logger.debug("Translation cache fully invalidated");
  }
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      locales: Array.from(this.cache.keys()),
      size: this.cache.size
    };
  }
}
const translationCache = new TranslationCache();

const translationKeyPattern = /^[A-Za-z0-9][A-Za-z0-9_-]*(?:\.[A-Za-z0-9][A-Za-z0-9_-]*)+$/;
const configuredLocaleCodes = config.locales.map((locale) => locale.code);
const configuredLocalesByLowercase = new Map(
  configuredLocaleCodes.map((locale) => [locale.toLowerCase(), locale])
);
function normalizeLocale(locale) {
  const trimmed = locale.trim();
  return configuredLocalesByLowercase.get(trimmed.toLowerCase()) || trimmed;
}
function normalizeTranslationKey(key) {
  return key.trim();
}
function isValidTranslationKey(key) {
  return translationKeyPattern.test(key);
}
function validateLocaleMembership(locale) {
  return configuredLocaleCodes.includes(locale);
}
const singleTranslationPayloadSchema = z.object({
  locale: z.string().min(1, "Locale is required"),
  key: z.string().min(1, "Key is required"),
  value: z.string()
}).strict();
function parseSingleTranslationPayload(body) {
  const parsed = singleTranslationPayloadSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid translation payload",
      data: { errors: parsed.error.issues }
    });
  }
  const locale = normalizeLocale(parsed.data.locale);
  const key = normalizeTranslationKey(parsed.data.key);
  if (!validateLocaleMembership(locale)) {
    throw createError({
      statusCode: 400,
      message: "Invalid locale",
      data: { locale, allowedLocales: configuredLocaleCodes }
    });
  }
  if (!isValidTranslationKey(key)) {
    throw createError({
      statusCode: 400,
      message: "Invalid translation key",
      data: {
        key,
        format: "Use dot notation with non-empty alphanumeric, hyphen, or underscore segments."
      }
    });
  }
  return {
    locale,
    key,
    value: parsed.data.value
  };
}
const batchTranslationPayloadSchema = z.object({
  key: z.string().min(1, "Key is required"),
  values: z.record(z.string(), z.unknown())
}).strict();
function parseBatchTranslationPayload(body) {
  const parsed = batchTranslationPayloadSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid translation payload",
      data: { errors: parsed.error.issues, localeErrors: [] }
    });
  }
  const key = normalizeTranslationKey(parsed.data.key);
  if (!isValidTranslationKey(key)) {
    throw createError({
      statusCode: 400,
      message: "Invalid translation key",
      data: {
        key,
        format: "Use dot notation with non-empty alphanumeric, hyphen, or underscore segments.",
        localeErrors: []
      }
    });
  }
  const seenLocales = /* @__PURE__ */ new Set();
  const localeErrors = [];
  const translations = [];
  for (const [rawLocale, value] of Object.entries(parsed.data.values)) {
    const locale = normalizeLocale(rawLocale);
    if (!validateLocaleMembership(locale)) {
      localeErrors.push({
        locale: rawLocale,
        message: `Locale must be one of: ${configuredLocaleCodes.join(", ")}`
      });
      continue;
    }
    if (typeof value !== "string") {
      localeErrors.push({
        locale,
        message: "Translation value must be a string"
      });
      continue;
    }
    if (seenLocales.has(locale)) {
      localeErrors.push({
        locale: rawLocale,
        message: `Duplicate locale after normalization: ${locale}`
      });
      continue;
    }
    seenLocales.add(locale);
    translations.push({ locale, key, value });
  }
  if (translations.length === 0) {
    localeErrors.push({
      locale: "",
      message: "At least one locale value is required"
    });
  }
  return {
    key,
    translations,
    localeErrors
  };
}

const CONTACT_REPLY_TO_MAX_LENGTH = 255;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEGRAM_HANDLE_REGEX = /^@[A-Za-z0-9_]{5,32}$/;
function normalizeContactReplyTo(value) {
  return value.trim();
}
function isValidEmailAddress(value) {
  return EMAIL_REGEX.test(normalizeContactReplyTo(value));
}
function isValidTelegramHandle(value) {
  return TELEGRAM_HANDLE_REGEX.test(normalizeContactReplyTo(value));
}
function isValidContactReplyTo(value) {
  const normalized = normalizeContactReplyTo(value);
  return isValidEmailAddress(normalized) || isValidTelegramHandle(normalized);
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false)
});
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().min(1, "Contact method is required").max(CONTACT_REPLY_TO_MAX_LENGTH, "Contact method is too long").refine(isValidContactReplyTo, "Enter a valid email address or Telegram username"),
  phone: z.string().max(30, "Phone number is too long").optional(),
  subject: z.string().max(200, "Subject is too long").optional(),
  consent: z.boolean().optional().default(false),
  message: z.string().min(10, "Message must be at least 10 characters").max(5e3, "Message is too long")
});
z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(100, "Name is too long").optional(),
  role: z.enum(USER_ROLES, { message: "Invalid role" })
});
z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  name: z.string().max(100, "Name is too long").optional(),
  role: z.enum(USER_ROLES, { message: "Invalid role" }).optional()
});
const twoFactorEnableSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits").regex(/^\d{6}$/, "Code must be 6 digits")
});
const twoFactorVerifySchema = z.object({
  code: z.string().min(6, "Code is required").max(10, "Invalid code format")
});
const twoFactorDisableSchema = z.object({
  password: z.string().min(1, "Password is required")
});
const pagePermissionsShape = {};
for (const pageId of ADMIN_PAGE_IDS) {
  pagePermissionsShape[pageId] = z.boolean().optional();
}
const permissionsSchema = z.object(pagePermissionsShape);
const createRoleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be 50 characters or less"),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(50, "Slug must be 50 characters or less").regex(/^[a-z][a-z0-9-]*$/, "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(200, "Description must be 200 characters or less").optional().nullable(),
  permissions: permissionsSchema,
  color: z.enum(ROLE_COLORS).optional().default("secondary"),
  icon: z.string().max(50).optional().default("pencil")
});
const updateRoleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be 50 characters or less").optional(),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(50, "Slug must be 50 characters or less").regex(/^[a-z][a-z0-9-]*$/, "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens").optional(),
  description: z.string().max(200, "Description must be 200 characters or less").optional().nullable(),
  permissions: permissionsSchema.optional(),
  color: z.enum(ROLE_COLORS).optional(),
  icon: z.string().max(50).optional()
});
z.object({
  slug: z.string().min(1, "Slug is required").max(100, "Slug is too long").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(1e3, "Description is too long").optional(),
  content: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional().or(z.literal("")),
  category: z.string().max(50, "Category is too long").optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().int().optional(),
  published: z.boolean().optional()
});

let clamScanInstance = null;
async function initClamScan() {
  if (clamScanInstance !== null) {
    return clamScanInstance;
  }
  try {
    const clamscanPackage = "clamscan";
    const { default: NodeClam } = await import(
      /* @vite-ignore */
      clamscanPackage
    ).catch(() => {
      logger.warn("clamscan package not installed. Run: npm install clamscan");
      throw new Error("clamscan not installed");
    });
    const socketPath = process.env.CLAMAV_SOCKET || "/var/run/clamav/clamd.ctl";
    clamScanInstance = await new NodeClam().init({
      clamdscan: {
        socket: socketPath,
        timeout: 6e4,
        // 60 seconds
        localFallback: false
        // Don't fall back to local scanning (too slow)
      },
      preference: "clamdscan"
      // Use daemon for speed
    });
    logger.info(
      { socket: socketPath },
      "ClamAV initialized successfully"
    );
    return clamScanInstance;
  } catch (error) {
    const err = error;
    logger.warn(
      { error: err.message },
      "ClamAV not available - virus scanning disabled"
    );
    return null;
  }
}
function isClamAvEnabled() {
  process.env.CLAMAV_ENABLED !== "false";
  return process.env.CLAMAV_ENABLED === "true";
}
async function scanFileForViruses(buffer, filename) {
  if (!isClamAvEnabled()) {
    logger.debug(
      { filename },
      "Virus scanning disabled (dev mode or CLAMAV_ENABLED=false)"
    );
    return { isInfected: false };
  }
  try {
    const clam = await initClamScan();
    if (!clam) {
      logger.warn(
        { filename },
        "ClamAV unavailable - file uploaded without virus scan"
      );
      return {
        isInfected: false,
        error: "Scanner unavailable"
      };
    }
    const { isInfected, viruses } = await clam.scanBuffer(buffer, 3e3, filename);
    if (isInfected) {
      logger.warn(
        { filename, viruses },
        "Virus detected in uploaded file"
      );
      return {
        isInfected: true,
        viruses: viruses || ["Unknown virus"]
      };
    }
    logger.debug({ filename }, "File scanned - clean");
    return { isInfected: false };
  } catch (error) {
    const err = error;
    logger.error(
      { filename, error: err.message },
      "Virus scanning failed"
    );
    return {
      isInfected: false,
      error: err.message
    };
  }
}

function getWorkflowDataDir(workflow) {
  switch (workflow) {
    case "claude":
      return ".claude-data";
    case "qwen":
      return ".qwen-data";
    case "codex":
      return ".codex-data";
    default:
      console.warn(`Invalid workflow: ${workflow}. Falling back to 'claude'.`);
      return ".claude-data";
  }
}
function getCurrentWorkflow() {
  const workflow = config.aiWorkflow;
  {
    return workflow;
  }
}
function ensureWorkflowDataDir(workflow) {
  try {
    const dataDir = getWorkflowDataDir(workflow);
    const fullPath = path.join(process.cwd(), dataDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created workflow data directory: ${fullPath}`);
    }
    return true;
  } catch (error) {
    console.error(`Error creating workflow data directory for ${workflow}:`, error);
    return false;
  }
}

function useRuntimeI18n(nuxtApp, event) {
  {
    return useRuntimeConfig(event).public.i18n;
  }
}
function useI18nDetection(nuxtApp) {
  const detectBrowserLanguage = useRuntimeI18n().detectBrowserLanguage;
  const detect = detectBrowserLanguage || {};
  return {
    ...detect,
    enabled: !!detectBrowserLanguage,
    cookieKey: detect.cookieKey || "i18n_redirected"
  };
}
function resolveRootRedirect(config) {
  if (!config) {
    return void 0;
  }
  return {
    path: "/" + (isString(config) ? config : config.path).replace(/^\//, ""),
    code: !isString(config) && config.statusCode || 302
  };
}
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

function createLocaleConfigs(fallbackLocale) {
  const localeConfigs = {};
  for (const locale of localeCodes) {
    const fallbacks = getFallbackLocaleCodes(fallbackLocale, [locale]);
    const cacheable = isLocaleWithFallbacksCacheable(locale, fallbacks);
    localeConfigs[locale] = { fallbacks, cacheable };
  }
  return localeConfigs;
}
function getFallbackLocaleCodes(fallback, locales) {
  if (fallback === false) {
    return [];
  }
  if (isArray(fallback)) {
    return fallback;
  }
  let fallbackLocales = [];
  if (isString(fallback)) {
    if (locales.every((locale) => locale !== fallback)) {
      fallbackLocales.push(fallback);
    }
    return fallbackLocales;
  }
  const targets = [...locales, "default"];
  for (const locale of targets) {
    if (locale in fallback == false) {
      continue;
    }
    fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)];
  }
  return fallbackLocales;
}
function isLocaleCacheable(locale) {
  return localeLoaders[locale] != null && localeLoaders[locale].every((loader) => loader.cache !== false);
}
function isLocaleWithFallbacksCacheable(locale, fallbackLocales) {
  return isLocaleCacheable(locale) && fallbackLocales.every((fallbackLocale) => isLocaleCacheable(fallbackLocale));
}
function getDefaultLocaleForDomain(host) {
  return normalizedLocales.find((l) => !!l.defaultForDomains?.includes(host))?.code;
}
const isSupportedLocale = (locale) => localeCodes.includes(locale || "");

function useI18nContext(event) {
  if (event.context.nuxtI18n == null) {
    throw new Error("Nuxt I18n server context has not been set up yet.");
  }
  return event.context.nuxtI18n;
}
function tryUseI18nContext(event) {
  return event.context.nuxtI18n;
}
const getHost = (event) => getRequestURL(event, { xForwardedHost: true }).host;
async function initializeI18nContext(event) {
  const runtimeI18n = useRuntimeI18n(void 0, event);
  const defaultLocale = runtimeI18n.defaultLocale || "";
  const options = await setupVueI18nOptions(getDefaultLocaleForDomain(getHost(event)) || defaultLocale);
  const localeConfigs = createLocaleConfigs(options.fallbackLocale);
  const ctx = createI18nContext();
  ctx.vueI18nOptions = options;
  ctx.localeConfigs = localeConfigs;
  event.context.nuxtI18n = ctx;
  return ctx;
}
function createI18nContext() {
  return {
    messages: {},
    slp: {},
    localeConfigs: {},
    trackMap: {},
    vueI18nOptions: void 0,
    trackKey(key, locale) {
      this.trackMap[locale] ??= /* @__PURE__ */ new Set();
      this.trackMap[locale].add(key);
    }
  };
}

function matchBrowserLocale(locales, browserLocales) {
  const matchedLocales = [];
  for (const [index, browserCode] of browserLocales.entries()) {
    const matchedLocale = locales.find((l) => l.language?.toLowerCase() === browserCode.toLowerCase());
    if (matchedLocale) {
      matchedLocales.push({ code: matchedLocale.code, score: 1 - index / browserLocales.length });
      break;
    }
  }
  for (const [index, browserCode] of browserLocales.entries()) {
    const languageCode = browserCode.split("-")[0].toLowerCase();
    const matchedLocale = locales.find((l) => l.language?.split("-")[0].toLowerCase() === languageCode);
    if (matchedLocale) {
      matchedLocales.push({ code: matchedLocale.code, score: 0.999 - index / browserLocales.length });
      break;
    }
  }
  return matchedLocales;
}
function compareBrowserLocale(a, b) {
  if (a.score === b.score) {
    return b.code.length - a.code.length;
  }
  return b.score - a.score;
}
function findBrowserLocale(locales, browserLocales) {
  const matchedLocales = matchBrowserLocale(
    locales.map((l) => ({ code: l.code, language: l.language || l.code })),
    browserLocales
  );
  return matchedLocales.sort(compareBrowserLocale).at(0)?.code ?? "";
}

const appHead = {"meta":[{"charset":"utf-8"},{"name":"viewport","content":"width=device-width, initial-scale=1, viewport-fit=cover"}],"link":[{"rel":"icon","href":"/favicon.ico","sizes":"any"},{"rel":"icon","href":"/favicon.svg","type":"image/svg+xml"},{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}],"style":[],"script":[],"noscript":[]};

const appRootTag = "div";

const appRootAttrs = {"id":"__nuxt"};

const appTeleportTag = "div";

const appTeleportAttrs = {"id":"teleports"};

const appSpaLoaderTag = "div";

const appSpaLoaderAttrs = {"id":"__nuxt-loader"};

const appId = "nuxt-app";

const separator = "___";
const pathLanguageParser = createPathIndexLanguageParser(0);
const getLocaleFromRoutePath = (path) => pathLanguageParser(path);
const getLocaleFromRouteName = (name) => name.split(separator).at(1) ?? "";
function normalizeInput(input) {
  return typeof input !== "object" ? String(input) : String(input?.name || input?.path || "");
}
function getLocaleFromRoute(route) {
  const input = normalizeInput(route);
  return input[0] === "/" ? getLocaleFromRoutePath(input) : getLocaleFromRouteName(input);
}

function matchDomainLocale(locales, host, pathLocale) {
  const normalizeDomain = (domain = "") => domain.replace(/https?:\/\//, "");
  const matches = locales.filter(
    (locale) => normalizeDomain(locale.domain) === host || toArray(locale.domains).includes(host)
  );
  if (matches.length <= 1) {
    return matches[0]?.code;
  }
  return (
    // match by current path locale
    matches.find((l) => l.code === pathLocale)?.code || matches.find((l) => l.defaultForDomains?.includes(host) ?? l.domainDefault)?.code
  );
}

const getCookieLocale = (event, cookieName) => (getCookie(event, cookieName)) || void 0;
const getRouteLocale = (event, route) => getLocaleFromRoute(route);
const getHeaderLocale = (event) => findBrowserLocale(normalizedLocales, parseAcceptLanguage(getRequestHeader(event, "accept-language") || ""));
const getHostLocale = (event, path, domainLocales) => {
  const host = getRequestURL(event, { xForwardedHost: true }).host;
  const locales = normalizedLocales.map((l) => ({
    ...l,
    domain: domainLocales[l.code]?.domain ?? l.domain
  }));
  return matchDomainLocale(locales, host, getLocaleFromRoutePath(path));
};
const useDetectors = (event, config, nuxtApp) => {
  if (!event) {
    throw new Error("H3Event is required for server-side locale detection");
  }
  const runtimeI18n = useRuntimeI18n();
  return {
    cookie: () => getCookieLocale(event, config.cookieKey),
    header: () => getHeaderLocale(event) ,
    navigator: () => void 0,
    host: (path) => getHostLocale(event, path, runtimeI18n.domainLocales),
    route: (path) => getRouteLocale(event, path)
  };
};

// Generated by @nuxtjs/i18n
const pathToI18nConfig = {
  "/init": {
    "ru": "/init",
    "en": "/init"
  },
  "/": {
    "ru": "/",
    "en": "/"
  },
  "/login": {
    "ru": "/login",
    "en": "/login"
  },
  "/:section()": {
    "ru": "/:section()",
    "en": "/:section()"
  },
  "/admin/faq": {
    "ru": "/admin/faq",
    "en": "/admin/faq"
  },
  "/admin/blog": {
    "ru": "/admin/blog",
    "en": "/admin/blog"
  },
  "/admin/team": {
    "ru": "/admin/team",
    "en": "/admin/team"
  },
  "/admin": {
    "ru": "/admin",
    "en": "/admin"
  },
  "/admin/legal": {
    "ru": "/admin/legal",
    "en": "/admin/legal"
  },
  "/admin/login": {
    "ru": "/admin/login",
    "en": "/admin/login"
  },
  "/admin/roles": {
    "ru": "/admin/roles",
    "en": "/admin/roles"
  },
  "/admin/users": {
    "ru": "/admin/users",
    "en": "/admin/users"
  },
  "/blog/:slug()": {
    "ru": "/blog/:slug()",
    "en": "/blog/:slug()"
  },
  "/admin/health": {
    "ru": "/admin/health",
    "en": "/admin/health"
  },
  "/admin/clients": {
    "ru": "/admin/clients",
    "en": "/admin/clients"
  },
  "/admin/pricing": {
    "ru": "/admin/pricing",
    "en": "/admin/pricing"
  },
  "/admin/contacts": {
    "ru": "/admin/contacts",
    "en": "/admin/contacts"
  },
  "/admin/features": {
    "ru": "/admin/features",
    "en": "/admin/features"
  },
  "/admin/settings": {
    "ru": "/admin/settings",
    "en": "/admin/settings"
  },
  "/legal/:document()": {
    "ru": "/legal/:document()",
    "en": "/legal/:document()"
  },
  "/admin/testimonials": {
    "ru": "/admin/testimonials",
    "en": "/admin/testimonials"
  },
  "/admin/translations": {
    "ru": "/admin/translations",
    "en": "/admin/translations"
  },
  "/admin/portfolios/:id()": {
    "ru": "/admin/portfolios/:id()",
    "en": "/admin/portfolios/:id()"
  },
  "/admin/portfolios": {
    "ru": "/admin/portfolios",
    "en": "/admin/portfolios"
  }
};
const i18nPathToPath = {
  "/init": "/init",
  "/": "/",
  "/login": "/login",
  "/:section()": "/:section()",
  "/admin/faq": "/admin/faq",
  "/admin/blog": "/admin/blog",
  "/admin/team": "/admin/team",
  "/admin": "/admin",
  "/admin/legal": "/admin/legal",
  "/admin/login": "/admin/login",
  "/admin/roles": "/admin/roles",
  "/admin/users": "/admin/users",
  "/blog/:slug()": "/blog/:slug()",
  "/admin/health": "/admin/health",
  "/admin/clients": "/admin/clients",
  "/admin/pricing": "/admin/pricing",
  "/admin/contacts": "/admin/contacts",
  "/admin/features": "/admin/features",
  "/admin/settings": "/admin/settings",
  "/legal/:document()": "/legal/:document()",
  "/admin/testimonials": "/admin/testimonials",
  "/admin/translations": "/admin/translations",
  "/admin/portfolios/:id()": "/admin/portfolios/:id()",
  "/admin/portfolios": "/admin/portfolios"
};

const matcher = createRouterMatcher([], {});
for (const path of Object.keys(i18nPathToPath)) {
  matcher.addRoute({ path, component: () => "", meta: {} });
}
const getI18nPathToI18nPath = (path, locale) => {
  if (!path || !locale) {
    return;
  }
  const plainPath = i18nPathToPath[path];
  const i18nConfig = pathToI18nConfig[plainPath];
  if (i18nConfig && i18nConfig[locale]) {
    return i18nConfig[locale] === true ? plainPath : i18nConfig[locale];
  }
};
function isExistingNuxtRoute(path) {
  if (path === "") {
    return;
  }
  if (path.endsWith("/__nuxt_error")) {
    return;
  }
  const resolvedMatch = matcher.resolve({ path }, { path: "/", name: "", matched: [], params: {}, meta: {} });
  return resolvedMatch.matched.length > 0 ? resolvedMatch : void 0;
}
function matchLocalized(path, locale, defaultLocale) {
  if (path === "") {
    return;
  }
  const parsed = parsePath(path);
  const resolvedMatch = matcher.resolve(
    { path: parsed.pathname || "/" },
    { path: "/", name: "", matched: [], params: {}, meta: {} }
  );
  if (resolvedMatch.matched.length > 0) {
    const alternate = getI18nPathToI18nPath(resolvedMatch.matched[0].path, locale);
    const match = matcher.resolve(
      { params: resolvedMatch.params },
      { path: alternate || "/", name: "", matched: [], params: {}, meta: {} }
    );
    const isPrefixable = prefixable(locale, defaultLocale);
    return withLeadingSlash(joinURL(isPrefixable ? locale : "", match.path));
  }
}
function prefixable(currentLocale, defaultLocale) {
  return (currentLocale !== defaultLocale || "prefix_and_default" === "prefix");
}

function* detect(detectors, detection, path) {
  if (detection.enabled) {
    yield { locale: detectors.cookie(), source: "cookie" };
    yield { locale: detectors.header(), source: "header" };
  }
  {
    yield { locale: detectors.route(path), source: "route" };
  }
  yield { locale: detection.fallbackLocale, source: "fallback" };
}
const _HSLR6LVYB6Jxg8OzRp1aUz6fuSwaQ2FVuwBtHNuoR0w = defineNitroPlugin(async (nitro) => {
  const runtimeI18n = useRuntimeI18n();
  const rootRedirect = resolveRootRedirect(runtimeI18n.rootRedirect);
  runtimeI18n.defaultLocale || "";
  try {
    const cacheStorage = useStorage("cache");
    const cachedKeys = await cacheStorage.getKeys("nitro:handlers:i18n");
    await Promise.all(cachedKeys.map((key) => cacheStorage.removeItem(key)));
  } catch {
  }
  const detection = useI18nDetection();
  const cookieOptions = {
    path: "/",
    domain: detection.cookieDomain || void 0,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: detection.cookieSecure
  };
  const createBaseUrlGetter = () => {
    isFunction(runtimeI18n.baseUrl) ? "" : runtimeI18n.baseUrl || "";
    if (isFunction(runtimeI18n.baseUrl)) {
      console.warn("[nuxt-i18n] Configuring baseUrl as a function is deprecated and will be removed in v11.");
      return () => "";
    }
    return (event, defaultLocale) => {
      return "";
    };
  };
  function resolveRedirectPath(event, path, pathLocale, defaultLocale, detector) {
    let locale = "";
    for (const detected of detect(detector, detection, event.path)) {
      if (detected.locale && isSupportedLocale(detected.locale)) {
        locale = detected.locale;
        break;
      }
    }
    locale ||= defaultLocale;
    function getLocalizedMatch(locale2) {
      const res = matchLocalized(path || "/", locale2, defaultLocale);
      if (res && res !== event.path) {
        return res;
      }
    }
    let resolvedPath = void 0;
    let redirectCode = 302;
    const requestURL = getRequestURL(event);
    if (rootRedirect && requestURL.pathname === "/") {
      locale = detection.enabled && locale || defaultLocale;
      resolvedPath = isSupportedLocale(detector.route(rootRedirect.path)) && rootRedirect.path || matchLocalized(rootRedirect.path, locale, defaultLocale);
      redirectCode = rootRedirect.code;
    } else if (runtimeI18n.redirectStatusCode) {
      redirectCode = runtimeI18n.redirectStatusCode;
    }
    switch (detection.redirectOn) {
      case "root":
        if (requestURL.pathname !== "/") {
          break;
        }
      // fallthrough (root has no prefix)
      case "no prefix":
        if (pathLocale) {
          break;
        }
      // fallthrough to resolve
      case "all":
        resolvedPath ??= getLocalizedMatch(locale);
        break;
    }
    if (requestURL.pathname === "/" && "prefix_and_default" === "prefix") ;
    return { path: resolvedPath, code: redirectCode, locale };
  }
  const baseUrlGetter = createBaseUrlGetter();
  nitro.hooks.hook("request", async (event) => {
    await initializeI18nContext(event);
  });
  nitro.hooks.hook("render:before", async ({ event }) => {
    const ctx = useI18nContext(event);
    const url = getRequestURL(event);
    const detector = useDetectors(event, detection);
    const localeSegment = detector.route(event.path);
    const pathLocale = isSupportedLocale(localeSegment) && localeSegment || void 0;
    const path = (pathLocale && url.pathname.slice(pathLocale.length + 1)) ?? url.pathname;
    if (!url.pathname.includes("/_i18n/k4W6tQEq") && !isExistingNuxtRoute(path)) {
      return;
    }
    const resolved = resolveRedirectPath(event, path, pathLocale, ctx.vueI18nOptions.defaultLocale, detector);
    if (resolved.path && resolved.path !== url.pathname) {
      ctx.detectLocale = resolved.locale;
      detection.useCookie && setCookie(event, detection.cookieKey, resolved.locale, cookieOptions);
      await sendRedirect(
        event,
        joinURL(baseUrlGetter(event, ctx.vueI18nOptions.defaultLocale), resolved.path + url.search),
        resolved.code
      );
      return;
    }
  });
  nitro.hooks.hook("render:html", (htmlContext, { event }) => {
    tryUseI18nContext(event);
  });
});

const script = "\"use strict\";(()=>{const t=window,e=document.documentElement,c=[\"dark\",\"light\"],n=getStorageValue(\"localStorage\",\"pm-color-mode\")||\"system\";let i=n===\"system\"?u():n;const r=e.getAttribute(\"data-color-mode-forced\");r&&(i=r),l(i),t[\"__NUXT_COLOR_MODE__\"]={preference:n,value:i,getColorScheme:u,addColorScheme:l,removeColorScheme:d};function l(o){const s=\"\"+o+\"\",a=\"\";e.classList?e.classList.add(s):e.className+=\" \"+s,a&&e.setAttribute(\"data-\"+a,o)}function d(o){const s=\"\"+o+\"\",a=\"\";e.classList?e.classList.remove(s):e.className=e.className.replace(new RegExp(s,\"g\"),\"\"),a&&e.removeAttribute(\"data-\"+a)}function f(o){return t.matchMedia(\"(prefers-color-scheme\"+o+\")\")}function u(){if(t.matchMedia&&f(\"\").media!==\"not all\"){for(const o of c)if(f(\":\"+o).matches)return o}return\"light\"}})();function getStorageValue(t,e){switch(t){case\"localStorage\":return window.localStorage.getItem(e);case\"sessionStorage\":return window.sessionStorage.getItem(e);case\"cookie\":return getCookie(e);default:return null}}function getCookie(t){const c=(\"; \"+window.document.cookie).split(\"; \"+t+\"=\");if(c.length===2)return c.pop()?.split(\";\").shift()}";

const _E0LLhNjKQn_mEGb6XaXlumPYzHdVK8aFOvSEDgOlOc = (function(nitro) {
  nitro.hooks.hook("render:html", (htmlContext) => {
    htmlContext.head.push(`<script>${script}<\/script>`);
  });
});

const _hXi2SKpsJvIOiBIGvUXPlWZldM_sAdAmpLy7jnF7Tv8 = defineNitroPlugin(() => {
  validateEnv();
});

const _HXt0_DTeTacQ8zpzZJbKxadrCty7HPbcp_eqrwLxqUc = defineNitroPlugin(() => {
  process.on("unhandledRejection", (reason, _promise) => {
    logger.error(
      {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : void 0
      },
      "Unhandled promise rejection"
    );
  });
  process.on("uncaughtException", (error) => {
    logger.error(
      {
        error: error.message,
        stack: error.stack
      },
      "Uncaught exception"
    );
  });
  logger.info("Global error handlers registered");
});

const contentTranslations = {
  ru: {
    seo: {
      homeTitle: "\u0420\u043E\u043C\u0430\u043D \u0417\u0438\u043D\u043D\u0430\u0442\u043E\u0432 \u2014 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0440\u0430\u043D\u043D\u0435\u0439 \u0441\u0442\u0430\u0434\u0438\u0435\u0439 \u0418\u0422 \u0438 AI-\u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432",
      homeDescription: "\u0423\u043F\u0440\u0430\u0432\u043B\u044F\u044E \u0440\u0430\u043D\u043D\u0435\u0439 \u0441\u0442\u0430\u0434\u0438\u0435\u0439 \u0418\u0422 \u0438 AI-\u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432: \u043E\u0442 \u0433\u0438\u043F\u043E\u0442\u0435\u0437\u044B \u0434\u043E \u0434\u043E\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0439 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0438. \u041F\u043E\u043C\u043E\u0433\u0430\u044E \u043A\u0440\u0443\u043F\u043D\u043E\u043C\u0443 \u0431\u0438\u0437\u043D\u0435\u0441\u0443 \u0431\u044B\u0441\u0442\u0440\u043E \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0443\u044E \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0443 \u0434\u043E \u0431\u043E\u043B\u044C\u0448\u0438\u0445 \u0431\u044E\u0434\u0436\u0435\u0442\u043E\u0432."
    },
    hero: {
      title: "\u0423\u043F\u0440\u0430\u0432\u043B\u044F\u044E \u0440\u0430\u043D\u043D\u0435\u0439 \u0441\u0442\u0430\u0434\u0438\u0435\u0439 \u0418\u0422 \u0438 AI-\u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432 \u2014 \u043E\u0442 \u0433\u0438\u043F\u043E\u0442\u0435\u0437\u044B \u0434\u043E \u0434\u043E\u043A\u0430\u0437\u0430\u043D\u043D\u043E\u0439 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0438",
      subtitle: "\u041F\u043E\u043C\u043E\u0433\u0430\u044E \u043A\u0440\u0443\u043F\u043D\u043E\u043C\u0443 \u0431\u0438\u0437\u043D\u0435\u0441\u0443 \u0431\u044B\u0441\u0442\u0440\u043E \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0443\u044E \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0443 \u0434\u043E \u0431\u043E\u043B\u044C\u0448\u0438\u0445 \u0431\u044E\u0434\u0436\u0435\u0442\u043E\u0432: \u0441\u0444\u043E\u0440\u043C\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0433\u0438\u043F\u043E\u0442\u0435\u0437\u0443, \u0441\u043E\u0431\u0440\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u0435, \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u043A\u0440\u0438\u0442\u0435\u0440\u0438\u0438 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438, \u043F\u043E\u0441\u0447\u0438\u0442\u0430\u0442\u044C \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u044D\u0444\u0444\u0435\u043A\u0442 \u0438 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u043E \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438.",
      primaryCta: "\u041E\u0431\u0441\u0443\u0434\u0438\u0442\u044C \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0443",
      secondaryCta: "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043F\u043E\u0434\u0445\u043E\u0434"
    },
    approach: {
      title: "\u0420\u0430\u043D\u043D\u044F\u044F \u0441\u0442\u0430\u0434\u0438\u044F \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F",
      intro: "\u041D\u0430 \u0440\u0430\u043D\u043D\u0435\u0439 \u0441\u0442\u0430\u0434\u0438\u0438 \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0430 \u0435\u0449\u0435 \u043D\u0435 \u0434\u043E\u043A\u0430\u0437\u0430\u043B\u0430 \u0441\u0432\u043E\u044E \u0432\u0430\u0436\u043D\u043E\u0441\u0442\u044C \u0434\u043B\u044F \u0431\u0438\u0437\u043D\u0435\u0441\u0430. \u0415\u0435 \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u043D\u0443\u0436\u043D\u043E \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C: \u0447\u0435\u0440\u0435\u0437 \u0434\u0430\u043D\u043D\u044B\u0435, \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439, \u043F\u0440\u043E\u0446\u0435\u0441\u0441, \u043C\u0435\u0442\u0440\u0438\u043A\u0438 \u0438 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0443.",
      paragraph2: "\u0417\u0434\u0435\u0441\u044C \u043F\u043B\u043E\u0445\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u043F\u0440\u0438\u0432\u044B\u0447\u043D\u044B\u0435 \u043A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0435 \u043C\u0435\u0445\u0430\u043D\u0438\u043A\u0438: \u0431\u043E\u043B\u044C\u0448\u0438\u0435 \u0440\u0430\u0431\u043E\u0447\u0438\u0435 \u0433\u0440\u0443\u043F\u043F\u044B, \u0434\u043B\u0438\u043D\u043D\u044B\u0435 \u0441\u043E\u0433\u043B\u0430\u0441\u043E\u0432\u0430\u043D\u0438\u044F, \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u044B\u0435 \u0422\u0417 \u0438 \u043F\u043E\u043F\u044B\u0442\u043A\u0430 \u0441\u0440\u0430\u0437\u0443 \u0432\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u043D\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u043D\u0443\u044E \u0438\u0434\u0435\u044E \u0432 \u0437\u0440\u0435\u043B\u044B\u0439 \u043F\u0440\u043E\u0446\u0435\u0441\u0441. \u0421\u043D\u0430\u0440\u0443\u0436\u0438 \u0440\u0430\u043D\u043D\u044F\u044F \u0441\u0442\u0430\u0434\u0438\u044F \u043C\u043E\u0436\u0435\u0442 \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u0442\u044C \u043A\u0430\u043A \u0445\u0430\u043E\u0441, \u043D\u043E \u043D\u0430 \u0441\u0430\u043C\u043E\u043C \u0434\u0435\u043B\u0435 \u0435\u0439 \u043D\u0443\u0436\u0435\u043D \u0434\u0440\u0443\u0433\u043E\u0439 \u0442\u0438\u043F \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F: \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0435 \u0446\u0438\u043A\u043B\u044B, \u0440\u0430\u0437\u043C\u044B\u0442\u044B\u0435 \u0440\u043E\u043B\u0438, \u0431\u044B\u0441\u0442\u0440\u044B\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0438 \u0436\u0435\u0441\u0442\u043A\u0438\u0435 \u043A\u0440\u0438\u0442\u0435\u0440\u0438\u0438 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438.",
      card1: {
        title: "\u041C\u0435\u043D\u044C\u0448\u0435 \u0437\u0430\u0442\u0440\u0430\u0442 \u043D\u0430 \u043D\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u0441\u0442\u044C",
        desc: "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0438 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0443, \u0430 \u043D\u0435 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u043C \u0441\u044B\u0440\u0443\u044E \u0438\u0434\u0435\u044E \u0432 \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u043F\u0440\u043E\u0435\u043A\u0442."
      },
      card2: {
        title: "\u0411\u044B\u0441\u0442\u0440\u0435\u0435 \u0434\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0440\u0435\u0448\u0435\u043D\u0438\u044F",
        desc: "\u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u0446\u0438\u043A\u043B \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0434\u0430\u0435\u0442 \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u0443 \u044F\u0441\u043D\u044B\u0439 \u0432\u044B\u0431\u043E\u0440: \u0437\u0430\u043A\u0440\u044B\u0442\u044C, \u0434\u043E\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0438\u043B\u0438 \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u043E\u0432\u0430\u0442\u044C."
      },
      card3: {
        title: "\u0422\u043E\u0447\u043D\u0435\u0435 \u0437\u0430\u0434\u0430\u0447\u0430 \u0434\u043B\u044F \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0445 \u044D\u0442\u0430\u043F\u043E\u0432",
        desc: "\u041F\u043E\u0441\u043B\u0435 \u0440\u0430\u043D\u043D\u0435\u0439 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u043F\u043E\u043D\u044F\u0442\u043D\u0435\u0435, \u0447\u0442\u043E \u0438\u043C\u0435\u043D\u043D\u043E \u0441\u0442\u0440\u043E\u0438\u0442\u044C, \u043A\u0430\u043A\u0438\u0435 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F \u0443\u0447\u0438\u0442\u044B\u0432\u0430\u0442\u044C \u0438 \u043A\u0430\u043A\u043E\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u0442\u044C."
      },
      cta: "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0443"
    },
    economics: {
      title: "\u041D\u0435 \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u0438\u043B\u043E\u0442, \u0430 \u0434\u043E\u043A\u0430\u0437\u0430\u043D\u043D\u044B\u0439 \u0431\u0438\u0437\u043D\u0435\u0441-\u044D\u0444\u0444\u0435\u043A\u0442",
      intro: "\u0412 \u043A\u0440\u0443\u043F\u043D\u043E\u043C \u0431\u0438\u0437\u043D\u0435\u0441\u0435 \u043C\u0430\u043B\u043E \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u043F\u0440\u043E\u0442\u043E\u0442\u0438\u043F. \u0418\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0430 \u0434\u043E\u043B\u0436\u043D\u0430 \u043F\u0440\u043E\u0439\u0442\u0438 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044E\u044E \u0437\u0430\u0449\u0438\u0442\u0443: \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0443, \u0440\u0438\u0441\u043A\u0438, \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F, \u0432\u043B\u0438\u044F\u043D\u0438\u0435 \u043D\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u044B \u0438 \u043F\u043E\u043D\u044F\u0442\u043D\u044B\u0439 \u043F\u043B\u0430\u043D \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F. \u042F \u043F\u043E\u043C\u043E\u0433\u0430\u044E \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u043E\u0439 \u0442\u0430\u043A, \u0447\u0442\u043E\u0431\u044B \u0443\u0436\u0435 \u043D\u0430 \u0440\u0430\u043D\u043D\u0435\u0439 \u0441\u0442\u0430\u0434\u0438\u0438 \u0431\u044B\u043B\u043E \u043F\u043E\u043D\u044F\u0442\u043D\u043E:",
      checklist: {
        item1: "\u043A\u0430\u043A\u0443\u044E \u0431\u0438\u0437\u043D\u0435\u0441-\u0433\u0438\u043F\u043E\u0442\u0435\u0437\u0443 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C",
        item2: "\u043A\u0430\u043A\u043E\u0439 \u044D\u0444\u0444\u0435\u043A\u0442 \u043E\u0436\u0438\u0434\u0430\u0435\u043C",
        item3: "\u0437\u0430 \u0441\u0447\u0435\u0442 \u0447\u0435\u0433\u043E \u043E\u043D \u0432\u043E\u0437\u043D\u0438\u043A\u0430\u0435\u0442",
        item4: "\u043A\u0430\u043A\u0438\u043C\u0438 \u043C\u0435\u0442\u0440\u0438\u043A\u0430\u043C\u0438 \u0435\u0433\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u0435\u043C",
        item5: "\u043A\u0430\u043A\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u0443\u0436\u043D\u044B \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438",
        item6: "\u043A\u0430\u043A\u0438\u0435 \u0440\u0438\u0441\u043A\u0438 \u043C\u0435\u0448\u0430\u044E\u0442 \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044E",
        item7: "\u0447\u0442\u043E \u0434\u0435\u043B\u0430\u0442\u044C \u0434\u0430\u043B\u044C\u0448\u0435: \u0437\u0430\u043A\u0440\u044B\u0442\u044C, \u0434\u043E\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0438\u043B\u0438 \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u043E\u0432\u0430\u0442\u044C"
      },
      output: {
        item1: "\u0440\u0430\u0431\u043E\u0447\u0438\u0439 \u043F\u0440\u043E\u0442\u043E\u0442\u0438\u043F \u0438\u043B\u0438 \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0442\u043E\u0440",
        item2: "\u043A\u0440\u0438\u0442\u0435\u0440\u0438\u0438 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438",
        item3: "\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043D\u0430 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0435",
        item4: "\u043E\u0446\u0435\u043D\u043A\u0430 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u044D\u0444\u0444\u0435\u043A\u0442\u0430",
        item5: "\u043A\u0430\u0440\u0442\u0430 \u0440\u0438\u0441\u043A\u043E\u0432 \u0438 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0439",
        item6: "\u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u044B \u0434\u043B\u044F \u0437\u0430\u0449\u0438\u0442\u044B \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u044B",
        item7: "\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u043E \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u043C \u0448\u0430\u0433\u0435"
      },
      cta: "\u041E\u0431\u0441\u0443\u0434\u0438\u0442\u044C \u0431\u0438\u0437\u043D\u0435\u0441-\u043A\u0435\u0439\u0441"
    },
    formats: {
      title: "\u0424\u043E\u0440\u043C\u0430\u0442\u044B \u0440\u0430\u0431\u043E\u0442\u044B",
      sprint: {
        title: "AI / IT Opportunity Sprint",
        duration: "2-4 \u043D\u0435\u0434\u0435\u043B\u0438",
        desc: "\u041F\u043E\u0438\u0441\u043A \u0438 \u043F\u0440\u0438\u043E\u0440\u0438\u0442\u0438\u0437\u0430\u0446\u0438\u044F \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0435\u0439: \u0433\u0434\u0435 AI, \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u044F \u0438\u043B\u0438 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0439 \u043F\u0440\u043E\u0434\u0443\u043A\u0442 \u043C\u043E\u0433\u0443\u0442 \u0434\u0430\u0442\u044C \u0438\u0437\u043C\u0435\u0440\u0438\u043C\u044B\u0439 \u0431\u0438\u0437\u043D\u0435\u0441-\u044D\u0444\u0444\u0435\u043A\u0442."
      },
      prototype: {
        title: "Prototype to Business Case",
        duration: "4-6 \u043D\u0435\u0434\u0435\u043B\u044C",
        desc: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0418\u0422 \u0438\u043B\u0438 AI-\u0433\u0438\u043F\u043E\u0442\u0435\u0437\u044B \u043D\u0430 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0435: \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u0435, \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0430\u044F \u043E\u0431\u0440\u0430\u0442\u043D\u0430\u044F \u0441\u0432\u044F\u0437\u044C, \u043A\u0440\u0438\u0442\u0435\u0440\u0438\u0438 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438, \u0440\u0430\u0441\u0447\u0435\u0442 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u044D\u0444\u0444\u0435\u043A\u0442\u0430 \u0438 \u043F\u0430\u043A\u0435\u0442 \u0434\u043B\u044F \u0437\u0430\u0449\u0438\u0442\u044B \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u044B."
      },
      defense: {
        title: "Business Case Defense",
        duration: "2-3 \u043D\u0435\u0434\u0435\u043B\u0438",
        desc: "\u0423\u043F\u0430\u043A\u043E\u0432\u043A\u0430 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u044B \u0434\u043B\u044F \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0435\u0439 \u0437\u0430\u0449\u0438\u0442\u044B: \u043B\u043E\u0433\u0438\u043A\u0430 \u044D\u0444\u0444\u0435\u043A\u0442\u0430, \u043C\u0435\u0442\u0440\u0438\u043A\u0438, \u0440\u0438\u0441\u043A\u0438, \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u0432\u043D\u0435\u0434\u0440\u0435\u043D\u0438\u044F, \u0431\u044E\u0434\u0436\u0435\u0442\u043D\u0430\u044F \u0440\u0430\u043C\u043A\u0430 \u0438 \u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u0430\u0446\u0438\u044F \u0434\u043B\u044F decision makers."
      },
      management: {
        title: "Early-Stage Initiative Management",
        duration: "6-12 \u043D\u0435\u0434\u0435\u043B\u044C",
        desc: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0440\u0430\u043D\u043D\u0435\u0439 \u0441\u0442\u0430\u0434\u0438\u0435\u0439 \u0418\u0422 \u0438\u043B\u0438 AI-\u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u044B: \u043A\u043E\u043C\u043F\u0430\u043A\u0442\u043D\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430, \u0431\u044B\u0441\u0442\u0440\u044B\u0435 \u0438\u0442\u0435\u0440\u0430\u0446\u0438\u0438, \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0433\u0438\u043F\u043E\u0442\u0435\u0437, \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0430, \u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u043E \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438."
      },
      cta: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u043E\u0440\u043C\u0430\u0442",
      secondaryCta: "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043E\u043F\u044B\u0442"
    },
    experience: {
      title: "\u0421\u0442\u0430\u0440\u0442\u0430\u043F-\u043E\u043F\u044B\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043F\u043E\u043B\u0435\u0437\u0435\u043D \u043A\u0440\u0443\u043F\u043D\u043E\u043C\u0443 \u0431\u0438\u0437\u043D\u0435\u0441\u0443",
      intro: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 4 \u0433\u043E\u0434\u0430 \u044F \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u044E \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0435 \u0441\u0442\u0430\u0440\u0442\u0430\u043F\u044B. \u0417\u0430 \u044D\u0442\u043E \u0432\u0440\u0435\u043C\u044F \u0441\u0434\u0435\u043B\u0430\u043B 7 \u0437\u0430\u043F\u0443\u0441\u043A\u043E\u0432 \u0432 \u0440\u0430\u0437\u043D\u044B\u0445 \u043D\u0438\u0448\u0430\u0445 \u0438 \u0431\u0438\u0437\u043D\u0435\u0441-\u043C\u043E\u0434\u0435\u043B\u044F\u0445. \u042D\u0442\u043E\u0442 \u043E\u043F\u044B\u0442 \u043D\u0430\u0443\u0447\u0438\u043B \u043C\u0435\u043D\u044F \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u043D\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u0441\u0442\u044C\u044E: \u0431\u044B\u0441\u0442\u0440\u043E \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0442\u044C \u0433\u0438\u043F\u043E\u0442\u0435\u0437\u044B, \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0441 \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u0438\u043C\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u0430\u043C\u0438, \u0441\u0447\u0438\u0442\u0430\u0442\u044C \u044D\u0444\u0444\u0435\u043A\u0442, \u043D\u0435 \u0440\u0430\u0437\u0434\u0443\u0432\u0430\u0442\u044C \u0431\u044E\u0434\u0436\u0435\u0442 \u0434\u043E \u0434\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u0430 \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u0438 \u0438 \u043D\u0435 \u043F\u0443\u0442\u0430\u0442\u044C \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u0441 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u043E\u043C.",
      card1: {
        title: "\u0411\u044B\u0441\u0442\u0440\u044B\u0435 \u0438\u0442\u0435\u0440\u0430\u0446\u0438\u0438",
        desc: "\u041F\u0435\u0440\u0435\u0445\u043E\u0434\u0438\u0442\u044C \u043E\u0442 \u0438\u0434\u0435\u0438 \u043A \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435 \u0431\u0435\u0437 \u0434\u043E\u043B\u0433\u0438\u0445 \u0446\u0438\u043A\u043B\u043E\u0432 \u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F."
      },
      card2: {
        title: "\u041C\u0438\u043A\u0440\u043E-\u0431\u044E\u0434\u0436\u0435\u0442\u044B",
        desc: "\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0442\u044C \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u043C \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u043C \u0434\u043E \u0431\u043E\u043B\u044C\u0448\u0438\u0445 \u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u0439."
      },
      card3: {
        title: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432\u043E\u0435 \u043C\u044B\u0448\u043B\u0435\u043D\u0438\u0435",
        desc: "\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043D\u0430 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u044E \u0447\u0435\u0440\u0435\u0437 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439, \u043F\u0440\u043E\u0446\u0435\u0441\u0441 \u0438 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442."
      },
      card4: {
        title: "\u0418\u043D\u0436\u0435\u043D\u0435\u0440\u043D\u0430\u044F \u0433\u043B\u0443\u0431\u0438\u043D\u0430",
        desc: "\u041F\u043E\u043D\u0438\u043C\u0430\u0442\u044C, \u0447\u0442\u043E \u0440\u0435\u0430\u043B\u044C\u043D\u043E \u0441\u043E\u0431\u0440\u0430\u0442\u044C, \u0433\u0434\u0435 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0440\u0438\u0441\u043A \u0438 \u0447\u0442\u043E \u043F\u043E\u043C\u0435\u0448\u0430\u0435\u0442 \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044E."
      },
      cta: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435 \u043E\u0431\u043E \u043C\u043D\u0435"
    },
    about: {
      title: "\u0420\u043E\u043C\u0430\u043D \u0417\u0438\u043D\u043D\u0430\u0442\u043E\u0432",
      image: "/images/roman.webp",
      paragraph1: "\u042F 15 \u043B\u0435\u0442 \u0432 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438 \u0438 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 4 \u0433\u043E\u0434\u0430 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u044E \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0435 \u0441\u0442\u0430\u0440\u0442\u0430\u043F\u044B. \u041C\u043E\u044F \u0441\u0438\u043B\u044C\u043D\u0430\u044F \u0441\u0442\u043E\u0440\u043E\u043D\u0430 \u2014 \u0441\u043E\u0435\u0434\u0438\u043D\u044F\u0442\u044C \u0438\u043D\u0436\u0435\u043D\u0435\u0440\u043D\u0443\u044E \u0433\u043B\u0443\u0431\u0438\u043D\u0443, \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432\u043E\u0435 \u043C\u044B\u0448\u043B\u0435\u043D\u0438\u0435 \u0438 \u043F\u0440\u0435\u0434\u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0443\u044E \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C.",
      paragraph2: "\u042F \u043F\u043E\u043C\u043E\u0433\u0430\u044E \u043A\u0440\u0443\u043F\u043D\u043E\u043C\u0443 \u0431\u0438\u0437\u043D\u0435\u0441\u0443 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0442\u044C \u0418\u0422 \u0438 AI-\u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u044B \u0434\u043E \u0442\u043E\u0433\u043E, \u043A\u0430\u043A \u043E\u043D\u0438 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u044E\u0442\u0441\u044F \u0432 \u0434\u043E\u0440\u043E\u0433\u0438\u0435 \u0438 \u0434\u043E\u043B\u0433\u0438\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u044B. \u041C\u043E\u044F \u0437\u0430\u0434\u0430\u0447\u0430 \u2014 \u0431\u044B\u0441\u0442\u0440\u043E \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C, \u0435\u0441\u0442\u044C \u043B\u0438 \u0432 \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0435 \u0440\u0435\u0430\u043B\u044C\u043D\u0430\u044F \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0430, \u043A\u0430\u043A\u0438\u0435 \u0440\u0438\u0441\u043A\u0438 \u0432\u0438\u0434\u043D\u044B \u0443\u0436\u0435 \u0441\u0435\u0439\u0447\u0430\u0441 \u0438 \u043A\u0430\u043A\u043E\u0439 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0448\u0430\u0433 \u0438\u043C\u0435\u0435\u0442 \u0441\u043C\u044B\u0441\u043B.",
      stat1: { label: "15 \u043B\u0435\u0442 \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435" },
      stat2: { label: "7 \u0441\u0442\u0430\u0440\u0442\u0430\u043F-\u0437\u0430\u043F\u0443\u0441\u043A\u043E\u0432" },
      stat3: { label: "AI / automation / internal tools" },
      stat4: { label: "\u0420\u0430\u0431\u043E\u0442\u0430 \u043D\u0430 \u0441\u0442\u044B\u043A\u0435 \u0431\u0438\u0437\u043D\u0435\u0441\u0430, \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430 \u0438 \u0438\u043D\u0436\u0435\u043D\u0435\u0440\u0438\u0438" },
      cta: "\u0421\u0432\u044F\u0437\u0430\u0442\u044C\u0441\u044F"
    },
    contact: {
      title: "\u041E\u0431\u0441\u0443\u0434\u0438\u043C \u0432\u0430\u0448\u0443 \u0418\u0422 \u0438\u043B\u0438 AI-\u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0443",
      fallbackTitle: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B",
      intro: "\u0417\u0430 \u043E\u0434\u0438\u043D \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u043C\u043E\u0436\u043D\u043E \u043F\u043E\u043D\u044F\u0442\u044C, \u043A\u0430\u043A\u0443\u044E \u0433\u0438\u043F\u043E\u0442\u0435\u0437\u0443 \u0441\u0442\u043E\u0438\u0442 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C, \u043A\u0430\u043A\u0438\u0435 \u043A\u0440\u0438\u0442\u0435\u0440\u0438\u0438 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0437\u0430\u0434\u0430\u0442\u044C, \u0433\u0434\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u044D\u0444\u0444\u0435\u043A\u0442 \u0438 \u043A\u0430\u043A\u043E\u0439 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0448\u0430\u0433 \u043F\u043E\u043A\u0430\u0436\u0435\u0442, \u0441\u0442\u043E\u0438\u0442 \u043B\u0438 \u0434\u0432\u0438\u0433\u0430\u0442\u044C\u0441\u044F \u0434\u0430\u043B\u044C\u0448\u0435.",
      nameLabel: "\u0418\u043C\u044F",
      namePlaceholder: "\u0418\u0432\u0430\u043D \u0418\u0432\u0430\u043D\u043E\u0432",
      emailLabel: "Email",
      emailPlaceholder: "ivan{'@'}example.com",
      messageLabel: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435",
      messagePlaceholder: "\u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u0432\u0430\u0448\u0443 \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0443 \u0438\u043B\u0438 \u0437\u0430\u0434\u0430\u0447\u0443...",
      consentPrefix: "\u042F \u0441\u043E\u0433\u043B\u0430\u0441\u0435\u043D \u043D\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0432 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0438 \u0441",
      consentPersonalData: "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u043E\u0439 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445",
      consentAnd: "\u0438",
      consentPrivacy: "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u043E\u0439 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438",
      consentRequired: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u043D\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445.",
      legalDocumentsMissing: "\u0424\u043E\u0440\u043C\u0430 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430: \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u0443\u0439\u0442\u0435 \u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0443 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u0438 \u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0443 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0432 \u0430\u0434\u043C\u0438\u043D-\u043F\u0430\u043D\u0435\u043B\u0438.",
      sendButton: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435",
      sending: "\u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430...",
      successMessage: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E.",
      errorMessage: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437.",
      invalidEmail: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 email.",
      messageTooShort: "\u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0443 \u043C\u0438\u043D\u0438\u043C\u0443\u043C \u0432 10 \u0441\u0438\u043C\u0432\u043E\u043B\u0430\u0445."
    },
    cta: {
      primaryButton: "\u041E\u0431\u0441\u0443\u0434\u0438\u0442\u044C \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0443"
    },
    legalDocuments: {}
  },
  en: {
    seo: {
      homeTitle: "Roman Zinnatov \u2014 IT & AI Early-Stage Initiative Management",
      homeDescription: "Managing early-stage IT and AI initiatives: from hypothesis to proven economics. Helping large businesses validate technology initiatives before large budgets."
    },
    hero: {
      title: "Managing early-stage IT & AI \u2014 from hypothesis to proven economics",
      subtitle: "Helping large businesses quickly validate technology initiatives before big budgets: formulate hypotheses, build minimal solutions, define validation criteria, calculate economic impact, and prepare scaling decisions.",
      primaryCta: "Discuss initiative",
      secondaryCta: "View approach"
    },
    approach: {
      title: "Early stage requires different management",
      card1: { title: "Less cost on uncertainty", desc: "" },
      card2: { title: "Faster to decisions", desc: "" },
      card3: { title: "Clearer next step", desc: "" },
      cta: "View economics"
    },
    economics: {
      title: "Not just a pilot, proven business impact",
      cta: "Discuss business case"
    },
    formats: {
      title: "Work formats",
      sprint: { title: "AI / IT Opportunity Sprint", duration: "2-4 weeks", desc: "" },
      prototype: { title: "Prototype to Business Case", duration: "4-6 weeks", desc: "" },
      defense: { title: "Business Case Defense", duration: "2-3 weeks", desc: "" },
      management: { title: "Early-Stage Initiative Management", duration: "6-12 weeks", desc: "" },
      cta: "Choose format",
      secondaryCta: "View experience"
    },
    experience: {
      title: "Startup experience useful for enterprise",
      card1: { title: "Fast iterations", desc: "" },
      card2: { title: "Micro-budgets", desc: "" },
      card3: { title: "Product thinking", desc: "" },
      card4: { title: "Engineering depth", desc: "" },
      cta: "More about me"
    },
    about: {
      title: "Roman Zinnatov",
      cta: "Get in touch"
    },
    contact: {
      title: "Let's discuss your IT or AI initiative",
      fallbackTitle: "Contact",
      nameLabel: "Name",
      emailLabel: "Email",
      messageLabel: "Message",
      consentPrefix: "I agree to the processing of personal data in accordance with the",
      consentPersonalData: "Personal Data Processing Policy",
      consentAnd: "and",
      consentPrivacy: "Privacy Policy",
      consentRequired: "You must agree to the personal data processing terms.",
      sendButton: "Send message",
      sending: "Sending...",
      successMessage: "Message sent.",
      errorMessage: "We could not send the message. Please try again.",
      invalidEmail: "Enter a valid email address.",
      messageTooShort: "Describe the task in at least 10 characters."
    },
    cta: { primaryButton: "Discuss initiative" },
    legalDocuments: {}
  }
};
function flattenTranslations(obj, prefix = "") {
  const result = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result.push(...flattenTranslations(value, fullKey));
    } else {
      result.push({ key: fullKey, value: String(value) });
    }
  }
  return result;
}
function getContentSeedData() {
  const result = [];
  for (const [locale, messages] of Object.entries(contentTranslations)) {
    const flat = flattenTranslations(messages);
    for (const { key, value } of flat) {
      result.push({ locale, key, value });
    }
  }
  return result;
}

function isMissingTableError(error, tableName) {
  return error instanceof Error && error.message.includes(`no such table: ${tableName}`);
}
const _OEji2TxhmBvaEZbV8Kh36jZCSpGkTE0RZJT55zTkzSs = defineNitroPlugin(async () => {
  var _a;
  const db = useDatabase();
  let translationCount = 0;
  try {
    const result = db.select({ count: count() }).from(translations).get();
    translationCount = (_a = result == null ? void 0 : result.count) != null ? _a : 0;
  } catch (error) {
    if (isMissingTableError(error, "translations")) {
      console.warn("[auto-seed] translations table is unavailable, skipping seed until schema sync completes");
      return;
    }
    throw error;
  }
  const seedPath = join(process.cwd(), "i18n/system-seed.json");
  let systemTranslations = [];
  if (existsSync(seedPath)) {
    try {
      const data = readFileSync(seedPath, "utf-8");
      systemTranslations = JSON.parse(data);
    } catch (e) {
      console.error("[auto-seed] Failed to load system-seed.json:", e);
    }
  }
  if (translationCount > 0) {
    let added2 = 0;
    const contentTranslations2 = getContentSeedData();
    const backfillTranslations = [...systemTranslations, ...contentTranslations2];
    for (const t of backfillTranslations) {
      const result = db.insert(translations).values({
        locale: t.locale,
        key: t.key,
        value: t.value
      }).onConflictDoNothing().run();
      added2 += result.changes;
    }
    console.log(
      `[auto-seed] Database has ${translationCount} translations, backfilled ${added2} missing translations`
    );
    return;
  }
  console.log("[auto-seed] Empty database detected, seeding translations...");
  const contentTranslations = getContentSeedData();
  const allTranslations = [...systemTranslations, ...contentTranslations];
  let added = 0;
  for (const t of allTranslations) {
    try {
      db.insert(translations).values({
        locale: t.locale,
        key: t.key,
        value: t.value
      }).onConflictDoNothing().run();
      added++;
    } catch {
    }
  }
  console.log(`[auto-seed] Seeded ${added} translations (${systemTranslations.length} system + ${contentTranslations.length} content)`);
});

const _hK8fQ8czOb7dNvFIr_5NgnE9fsG8G4JNZgzlaACL8dA = defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (html, { event }) => {
    const nonce = randomBytes(16).toString("base64");
    event.context.cspNonce = nonce;
    html.head = html.head.map(
      (segment) => segment.replace(/<script(?![^>]*\bsrc\b)([^>]*)>/gi, `<script nonce="${nonce}"$1>`)
    );
    html.bodyAppend = html.bodyAppend.map(
      (segment) => segment.replace(/<script(?![^>]*\bsrc\b)([^>]*)>/gi, `<script nonce="${nonce}"$1>`)
    );
    html.bodyPrepend = html.bodyPrepend.map(
      (segment) => segment.replace(/<script(?![^>]*\bsrc\b)([^>]*)>/gi, `<script nonce="${nonce}"$1>`)
    );
  });
  nitroApp.hooks.hook("render:response", (response, { event }) => {
    const nonce = event.context.cspNonce;
    if (!nonce) return;
    const cspDirectives = [
      "default-src 'self'",
      // Scripts: self + nonce (no unsafe-inline!)
      `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`,
      // eval needed for Vue devtools
      // Styles: self + unsafe-inline (required for Vue's dynamic styles)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' ws: wss:",
      // Add WebSocket for HMR in dev
      "media-src 'self' https:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...[]
    ];
    if (response.headers) {
      response.headers["Content-Security-Policy"] = cspDirectives.join("; ");
    }
  });
});

const _rvNklo5XHovA5rnxas0BRbRaImeMk9XCN1JKSvFSM = defineNitroPlugin((nitroApp) => {
  var _a, _b, _c;
  const config = useRuntimeConfig();
  const dsn = ((_a = config.sentry) == null ? void 0 : _a.dsn) || process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }
  const environment = ((_b = config.sentry) == null ? void 0 : _b.environment) || process.env.SENTRY_ENVIRONMENT || "development";
  const release = ((_c = config.sentry) == null ? void 0 : _c.release) || process.env.SENTRY_RELEASE || process.env.GIT_COMMIT_SHA;
  Sentry.init({
    dsn,
    environment,
    release,
    // Performance monitoring
    tracesSampleRate: environment === "production" ? 0.1 : 1,
    // Error sampling
    sampleRate: 1,
    // Attach stack traces to all messages
    attachStacktrace: true,
    // Breadcrumbs configuration
    maxBreadcrumbs: 50,
    // Integrations
    integrations: [
      // Automatically instrument HTTP requests
      Sentry.httpIntegration(),
      // Capture console messages as breadcrumbs
      Sentry.consoleIntegration(),
      // Capture unhandled promise rejections
      Sentry.onUnhandledRejectionIntegration()
    ],
    // Filter sensitive data
    beforeSend(event) {
      var _a2, _b2;
      if ((_a2 = event.request) == null ? void 0 : _a2.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
        delete event.request.headers["x-csrf-token"];
      }
      if ((_b2 = event.request) == null ? void 0 : _b2.data) {
        const sensitiveFields = ["password", "passwordHash", "secret", "token", "apiKey"];
        for (const field of sensitiveFields) {
          if (typeof event.request.data === "object" && field in event.request.data) {
            event.request.data[field] = "[REDACTED]";
          }
        }
      }
      return event;
    },
    // Ignore certain errors
    ignoreErrors: [
      // Ignore client disconnection errors
      "ECONNRESET",
      "EPIPE",
      // Ignore 404s (handled elsewhere)
      /404/,
      // Ignore timeout errors
      "ETIMEDOUT"
    ]
  });
  nitroApp.hooks.hook("request", async (event) => {
    Sentry.setContext("request", {
      url: event.path,
      method: event.method,
      headers: {
        "user-agent": getHeader(event, "user-agent"),
        "content-type": getHeader(event, "content-type")
      }
    });
    const session = event.context.session;
    if (session == null ? void 0 : session.userId) {
      Sentry.setUser({
        id: String(session.userId)
      });
    } else {
      Sentry.setUser(null);
    }
  });
  nitroApp.hooks.hook("error", async (error, { event }) => {
    const statusCode = error.statusCode;
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return;
    }
    Sentry.captureException(error, {
      extra: {
        path: event == null ? void 0 : event.path,
        method: event == null ? void 0 : event.method
      }
    });
  });
  console.info(`[Sentry] Initialized for ${environment}`);
});

const plugins = [
  _HSLR6LVYB6Jxg8OzRp1aUz6fuSwaQ2FVuwBtHNuoR0w,
_E0LLhNjKQn_mEGb6XaXlumPYzHdVK8aFOvSEDgOlOc,
_hXi2SKpsJvIOiBIGvUXPlWZldM_sAdAmpLy7jnF7Tv8,
_HXt0_DTeTacQ8zpzZJbKxadrCty7HPbcp_eqrwLxqUc,
_OEji2TxhmBvaEZbV8Kh36jZCSpGkTE0RZJT55zTkzSs,
_hK8fQ8czOb7dNvFIr_5NgnE9fsG8G4JNZgzlaACL8dA,
_rvNklo5XHovA5rnxas0BRbRaImeMk9XCN1JKSvFSM
];

const assets = {
  "/index.mjs": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"aa3ce-Mx+MU6NFPzfDUOuvEXYCiYUNI4k\"",
    "mtime": "2026-06-04T11:47:28.254Z",
    "size": 697294,
    "path": "index.mjs"
  },
  "/index.mjs.map": {
    "type": "application/json",
    "etag": "\"2803cc-AzGFQuM4ZOlJzi9nqVn9grYw+RU\"",
    "mtime": "2026-06-04T11:47:28.255Z",
    "size": 2622412,
    "path": "index.mjs.map"
  }
};

function readAsset (id) {
  const serverDir = dirname$1(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve$1(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta/":{"maxAge":31536000},"/_nuxt/builds/":{"maxAge":1},"/images/":{"maxAge":0}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _oStzCE = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  if (encodings.length > 1) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError({ statusCode: 404 });
    }
    return;
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

const CURRENT_VERSION = 1;
const SUPPORTED_VERSIONS = [1];
const DEPRECATED_VERSIONS = [];
const VERSION_SUNSET_DATES = {
  // v1: '2027-01-01' // Example sunset date
};
function parseVersionFromPath(path) {
  const match = path.match(/^\/api\/v(\d+)\//);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}
function parseVersionFromAcceptHeader(accept) {
  if (!accept) return null;
  const match = accept.match(/application\/vnd\.pm\.v(\d+)\+json/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}
function isVersionSupported(version) {
  return SUPPORTED_VERSIONS.includes(version);
}
function isVersionDeprecated(version) {
  return DEPRECATED_VERSIONS.includes(version);
}
const _4dj19y = defineEventHandler((event) => {
  var _a;
  const url = getRequestURL(event);
  const path = url.pathname;
  if (!path.startsWith("/api")) {
    return;
  }
  let version = parseVersionFromPath(path);
  let rewrittenPath = null;
  if (version !== null) {
    rewrittenPath = path.replace(/^\/api\/v\d+\//, "/api/");
  }
  if (version === null) {
    const accept = getHeader(event, "accept");
    version = parseVersionFromAcceptHeader(accept);
  }
  if (version === null) {
    version = CURRENT_VERSION;
  }
  if (!isVersionSupported(version)) {
    throw createError({
      statusCode: 400,
      message: `API version ${version} is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(", ")}`,
      data: {
        requestedVersion: version,
        supportedVersions: SUPPORTED_VERSIONS,
        currentVersion: CURRENT_VERSION
      }
    });
  }
  event.context.apiVersion = version;
  if (rewrittenPath) {
    event.context.originalApiPath = path;
    if ((_a = event.node) == null ? void 0 : _a.req) {
      event.node.req.url = rewrittenPath + url.search;
    }
    Object.defineProperty(event, "path", {
      value: rewrittenPath,
      writable: true,
      configurable: true
    });
  }
  if (isVersionDeprecated(version)) {
    const sunsetDate = VERSION_SUNSET_DATES[version];
    appendHeader(event, "Deprecation", "true");
    appendHeader(event, "X-API-Deprecated", "true");
    appendHeader(
      event,
      "X-API-Deprecation-Info",
      `API v${version} is deprecated. Please migrate to v${CURRENT_VERSION}.`
    );
    if (sunsetDate) {
      appendHeader(event, "Sunset", sunsetDate);
    }
  }
  appendHeader(event, "X-API-Version", String(version));
});

const _0FD7Gp = defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  if (!path.startsWith("/api")) {
    return;
  }
  const sessionId = getCookie(event, "pm-session");
  const isAdminRoute = path.startsWith("/api/admin");
  if (!sessionId) {
    if (isAdminRoute) {
      throw createError({
        statusCode: 401,
        message: "Authentication required"
      });
    }
    return;
  }
  const db = useDatabase();
  const session = db.select().from(sessions).where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, /* @__PURE__ */ new Date()))).get();
  if (!session) {
    deleteCookie(event, "pm-session", { path: "/" });
    if (isAdminRoute) {
      throw createError({
        statusCode: 401,
        message: "Session expired"
      });
    }
    return;
  }
  const user = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    roleId: users.roleId
  }).from(users).where(eq(users.id, session.userId)).get();
  if (!user) {
    if (isAdminRoute) {
      throw createError({
        statusCode: 401,
        message: "User not found"
      });
    }
    return;
  }
  event.context.session = { userId: user.id };
  event.context.user = user;
  if (isAdminRoute) {
    await requireAdminRouteAccessByPath(user, path);
  }
});

const CSRF_EXEMPT_ROUTES = [
  "/api/auth/login",
  // No session yet
  "/api/auth/logout",
  // Destroying session
  "/api/analytics/performance",
  // Public metrics endpoint, has its own rate limiting
  "/api/contact/submit",
  // Public form, has its own rate limiting
  "/api/health",
  // Health check
  // Setup lifecycle endpoints - unauthenticated initial configuration
  // These are protected by setup-guard.ts (pmMode check) instead
  "/api/setup/config",
  // POST/DELETE setup config
  "/api/setup/import-zip"
  // POST/DELETE import zip
];
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const _O1Fe3T = defineEventHandler((event) => {
  const method = event.method.toUpperCase();
  const path = getRequestURL(event).pathname;
  if (SAFE_METHODS.includes(method)) {
    return;
  }
  if (!path.startsWith("/api/")) {
    return;
  }
  if (CSRF_EXEMPT_ROUTES.some((route) => path.startsWith(route))) {
    return;
  }
  if (!validateCsrfToken(event)) {
    throw createError({
      statusCode: 403,
      message: "Invalid or missing CSRF token"
    });
  }
});

const SLOW_REQUEST_THRESHOLD_MS = 1e3;
const requestMetrics = /* @__PURE__ */ new Map();
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
function logMetrics(metrics) {
  var _a;
  const isSlowRequest = metrics.duration && metrics.duration > SLOW_REQUEST_THRESHOLD_MS;
  {
    const logData = {
      requestId: metrics.requestId,
      method: metrics.method,
      path: metrics.path,
      duration: `${(_a = metrics.duration) == null ? void 0 : _a.toFixed(2)}ms`,
      status: metrics.statusCode,
      memoryUsed: metrics.memoryUsage ? formatBytes(metrics.memoryUsage.heapUsed) : void 0,
      timings: metrics.timings.map((t) => `${t.name}:${t.duration.toFixed(2)}ms`).join(", ")
    };
    if (isSlowRequest) {
      console.warn("[PERF] Slow request detected:", logData);
    } else {
      console.debug("[PERF]", logData);
    }
  }
}
function buildServerTimingHeader(metrics) {
  const entries = [];
  if (metrics.duration) {
    entries.push(`total;dur=${metrics.duration.toFixed(2)};desc="Total Request Time"`);
  }
  for (const timing of metrics.timings) {
    const desc = timing.description ? `;desc="${timing.description}"` : "";
    entries.push(`${timing.name};dur=${timing.duration.toFixed(2)}${desc}`);
  }
  return entries.join(", ");
}
const _AxbTcq = defineEventHandler(async (event) => {
  const path = event.path;
  if (path.startsWith("/_nuxt") || path.startsWith("/favicon") || path.endsWith(".js") || path.endsWith(".css") || path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".svg")) {
    return;
  }
  const requestId = getHeader(event, "x-request-id") || generateRequestId();
  const metrics = {
    requestId,
    method: event.method,
    path,
    startTime: performance.now(),
    timings: []
  };
  requestMetrics.set(requestId, metrics);
  event.context.requestId = requestId;
  event.context.perfMetrics = metrics;
  event.context.recordTiming = (name, duration, description) => {
    metrics.timings.push({ name, duration, description });
  };
  event.context.startTimer = (name) => {
    const start = performance.now();
    return {
      end: (description) => {
        const duration = performance.now() - start;
        metrics.timings.push({ name, duration, description });
        return duration;
      }
    };
  };
  setHeader(event, "X-Request-ID", requestId);
  event.node.res.on("finish", () => {
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.statusCode = event.node.res.statusCode;
    {
      const memUsage = process.memoryUsage();
      metrics.memoryUsage = {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      };
    }
    const serverTiming = buildServerTimingHeader(metrics);
    if (!event.node.res.headersSent) {
      setHeader(event, "Server-Timing", serverTiming);
    }
    logMetrics(metrics);
    requestMetrics.delete(requestId);
  });
});

const _24zPt9 = defineEventHandler((event) => {
  const headers = event.node.res;
  headers.setHeader("X-Frame-Options", "DENY");
  headers.setHeader("X-Content-Type-Options", "nosniff");
  headers.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  const permissionsPolicies = [
    "camera=()",
    // Disable camera
    "microphone=()",
    // Disable microphone
    "geolocation=()",
    // Disable geolocation
    "payment=()",
    // Disable payment API
    "usb=()",
    // Disable USB
    "magnetometer=()",
    // Disable magnetometer
    "gyroscope=()",
    // Disable gyroscope
    "accelerometer=()"
    // Disable accelerometer
  ];
  headers.setHeader("Permissions-Policy", permissionsPolicies.join(", "));
  headers.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  headers.setHeader("Cross-Origin-Resource-Policy", "same-origin");
});

const VueResolver = (_, value) => {
  return isRef(value) ? toValue(value) : value;
};

const headSymbol = "usehead";
// @__NO_SIDE_EFFECTS__
function vueInstall(head) {
  const plugin = {
    install(app) {
      app.config.globalProperties.$unhead = head;
      app.config.globalProperties.$head = head;
      app.provide(headSymbol, head);
    }
  };
  return plugin.install;
}

// @__NO_SIDE_EFFECTS__
function resolveUnrefHeadInput(input) {
  return walkResolver(input, VueResolver);
}

// @__NO_SIDE_EFFECTS__
function createHead(options = {}) {
  const head = createHead$1({
    ...options,
    propResolvers: [VueResolver]
  });
  head.install = vueInstall(head);
  return head;
}

const unheadOptions = {
  disableDefaults: true,
};

function createSSRContext(event) {
  const ssrContext = {
    url: event.path,
    event,
    runtimeConfig: useRuntimeConfig(event),
    noSSR: event.context.nuxt?.noSSR || (false),
    head: createHead(unheadOptions),
    error: false,
    nuxt: void 0,
    /* NuxtApp */
    payload: {},
    _payloadReducers: /* @__PURE__ */ Object.create(null),
    modules: /* @__PURE__ */ new Set()
  };
  return ssrContext;
}
function setSSRError(ssrContext, error) {
  ssrContext.error = true;
  ssrContext.payload = { error };
  ssrContext.url = error.url;
}

const APP_ROOT_OPEN_TAG = `<${appRootTag}${propsToString(appRootAttrs)}>`;
const APP_ROOT_CLOSE_TAG = `</${appRootTag}>`;
const getServerEntry = () => import('file:///app/.nuxt//dist/server/server.mjs').then((r) => r.default || r);
const getClientManifest = () => import('file:///app/.nuxt//dist/server/client.manifest.mjs').then((r) => r.default || r).then((r) => typeof r === "function" ? r() : r);
const getSSRRenderer = lazyCachedFunction(async () => {
  const createSSRApp = await getServerEntry();
  if (!createSSRApp) {
    throw new Error("Server bundle is not available");
  }
  const precomputed = void 0 ;
  const renderer = createRenderer(createSSRApp, {
    precomputed,
    manifest: await getClientManifest() ,
    renderToString: renderToString$1,
    buildAssetsURL
  });
  async function renderToString$1(input, context) {
    const html = await renderToString(input, context);
    if (process$1.env.NUXT_VITE_NODE_OPTIONS) {
      renderer.rendererContext.updateManifest(await getClientManifest());
    }
    return APP_ROOT_OPEN_TAG + html + APP_ROOT_CLOSE_TAG;
  }
  return renderer;
});
const getSPARenderer = lazyCachedFunction(async () => {
  const precomputed = void 0 ;
  const spaTemplate = await Promise.resolve().then(function () { return _virtual__spaTemplate; }).then((r) => r.template).catch(() => "").then((r) => {
    {
      const APP_SPA_LOADER_OPEN_TAG = `<${appSpaLoaderTag}${propsToString(appSpaLoaderAttrs)}>`;
      const APP_SPA_LOADER_CLOSE_TAG = `</${appSpaLoaderTag}>`;
      const appTemplate = APP_ROOT_OPEN_TAG + APP_ROOT_CLOSE_TAG;
      const loaderTemplate = r ? APP_SPA_LOADER_OPEN_TAG + r + APP_SPA_LOADER_CLOSE_TAG : "";
      return appTemplate + loaderTemplate;
    }
  });
  const renderer = createRenderer(() => () => {
  }, {
    precomputed,
    manifest: await getClientManifest() ,
    renderToString: () => spaTemplate,
    buildAssetsURL
  });
  const result = await renderer.renderToString({});
  const renderToString = (ssrContext) => {
    const config = useRuntimeConfig(ssrContext.event);
    ssrContext.modules ||= /* @__PURE__ */ new Set();
    ssrContext.payload.serverRendered = false;
    ssrContext.config = {
      public: config.public,
      app: config.app
    };
    return Promise.resolve(result);
  };
  return {
    rendererContext: renderer.rendererContext,
    renderToString
  };
});
function lazyCachedFunction(fn) {
  let res = null;
  return () => {
    if (res === null) {
      res = fn().catch((err) => {
        res = null;
        throw err;
      });
    }
    return res;
  };
}
function getRenderer(ssrContext) {
  return ssrContext.noSSR ? getSPARenderer() : getSSRRenderer();
}
const getSSRStyles = lazyCachedFunction(() => Promise.resolve().then(function () { return styles$1; }).then((r) => r.default || r));

async function renderInlineStyles(usedModules) {
  const styleMap = await getSSRStyles();
  const inlinedStyles = /* @__PURE__ */ new Set();
  for (const mod of usedModules) {
    if (mod in styleMap && styleMap[mod]) {
      for (const style of await styleMap[mod]()) {
        inlinedStyles.add(style);
      }
    }
  }
  return Array.from(inlinedStyles).map((style) => ({ innerHTML: style }));
}

const ROOT_NODE_REGEX = new RegExp(`^<${appRootTag}[^>]*>([\\s\\S]*)<\\/${appRootTag}>$`);
function getServerComponentHTML(body) {
  const match = body.match(ROOT_NODE_REGEX);
  return match?.[1] || body;
}
const SSR_SLOT_TELEPORT_MARKER = /^uid=([^;]*);slot=(.*)$/;
const SSR_CLIENT_TELEPORT_MARKER = /^uid=([^;]*);client=(.*)$/;
const SSR_CLIENT_SLOT_MARKER = /^island-slot=([^;]*);(.*)$/;
function getSlotIslandResponse(ssrContext) {
  if (!ssrContext.islandContext || !Object.keys(ssrContext.islandContext.slots).length) {
    return void 0;
  }
  const response = {};
  for (const [name, slot] of Object.entries(ssrContext.islandContext.slots)) {
    response[name] = {
      ...slot,
      fallback: ssrContext.teleports?.[`island-fallback=${name}`]
    };
  }
  return response;
}
function getClientIslandResponse(ssrContext) {
  if (!ssrContext.islandContext || !Object.keys(ssrContext.islandContext.components).length) {
    return void 0;
  }
  const response = {};
  for (const [clientUid, component] of Object.entries(ssrContext.islandContext.components)) {
    const html = ssrContext.teleports?.[clientUid]?.replaceAll("<!--teleport start anchor-->", "") || "";
    response[clientUid] = {
      ...component,
      html,
      slots: getComponentSlotTeleport(clientUid, ssrContext.teleports ?? {})
    };
  }
  return response;
}
function getComponentSlotTeleport(clientUid, teleports) {
  const entries = Object.entries(teleports);
  const slots = {};
  for (const [key, value] of entries) {
    const match = key.match(SSR_CLIENT_SLOT_MARKER);
    if (match) {
      const [, id, slot] = match;
      if (!slot || clientUid !== id) {
        continue;
      }
      slots[slot] = value;
    }
  }
  return slots;
}
function replaceIslandTeleports(ssrContext, html) {
  const { teleports, islandContext } = ssrContext;
  if (islandContext || !teleports) {
    return html;
  }
  for (const key in teleports) {
    const matchClientComp = key.match(SSR_CLIENT_TELEPORT_MARKER);
    if (matchClientComp) {
      const [, uid, clientId] = matchClientComp;
      if (!uid || !clientId) {
        continue;
      }
      html = html.replace(new RegExp(` data-island-uid="${uid}" data-island-component="${clientId}"[^>]*>`), (full) => {
        return full + teleports[key];
      });
      continue;
    }
    const matchSlot = key.match(SSR_SLOT_TELEPORT_MARKER);
    if (matchSlot) {
      const [, uid, slot] = matchSlot;
      if (!uid || !slot) {
        continue;
      }
      html = html.replace(new RegExp(` data-island-uid="${uid}" data-island-slot="${slot}"[^>]*>`), (full) => {
        return full + teleports[key];
      });
    }
  }
  return html;
}

const ISLAND_SUFFIX_RE = /\.json(?:\?.*)?$/;
const _SxA8c9 = defineEventHandler(async (event) => {
  const nitroApp = useNitroApp();
  setResponseHeaders(event, {
    "content-type": "application/json;charset=utf-8",
    "x-powered-by": "Nuxt"
  });
  const islandContext = await getIslandContext(event);
  const ssrContext = {
    ...createSSRContext(event),
    islandContext,
    noSSR: false,
    url: islandContext.url
  };
  const renderer = await getSSRRenderer();
  const renderResult = await renderer.renderToString(ssrContext).catch(async (err) => {
    await ssrContext.nuxt?.hooks.callHook("app:error", err);
    throw err;
  });
  if (ssrContext.payload?.error) {
    throw ssrContext.payload.error;
  }
  const inlinedStyles = await renderInlineStyles(ssrContext.modules ?? []);
  await ssrContext.nuxt?.hooks.callHook("app:rendered", { ssrContext, renderResult });
  if (inlinedStyles.length) {
    ssrContext.head.push({ style: inlinedStyles });
  }
  {
    const { styles } = getRequestDependencies(ssrContext, renderer.rendererContext);
    const link = [];
    for (const resource of Object.values(styles)) {
      if ("inline" in getQuery(resource.file)) {
        continue;
      }
      if (resource.file.includes("scoped") && !resource.file.includes("pages/")) {
        link.push({ rel: "stylesheet", href: renderer.rendererContext.buildAssetsURL(resource.file), crossorigin: "" });
      }
    }
    if (link.length) {
      ssrContext.head.push({ link }, { mode: "server" });
    }
  }
  const islandHead = {};
  for (const entry of ssrContext.head.entries.values()) {
    for (const [key, value] of Object.entries(resolveUnrefHeadInput(entry.input))) {
      const currentValue = islandHead[key];
      if (Array.isArray(currentValue)) {
        currentValue.push(...value);
      }
      islandHead[key] = value;
    }
  }
  const islandResponse = {
    id: islandContext.id,
    head: islandHead,
    html: getServerComponentHTML(renderResult.html),
    components: getClientIslandResponse(ssrContext),
    slots: getSlotIslandResponse(ssrContext)
  };
  await nitroApp.hooks.callHook("render:island", islandResponse, { event, islandContext });
  return islandResponse;
});
async function getIslandContext(event) {
  let url = event.path || "";
  const componentParts = url.substring("/__nuxt_island".length + 1).replace(ISLAND_SUFFIX_RE, "").split("_");
  const hashId = componentParts.length > 1 ? componentParts.pop() : void 0;
  const componentName = componentParts.join("_");
  const context = event.method === "GET" ? getQuery$1(event) : await readBody(event);
  const ctx = {
    url: "/",
    ...context,
    id: hashId,
    name: componentName,
    props: destr$1(context.props) || {},
    slots: {},
    components: {}
  };
  return ctx;
}

const storage = prefixStorage(useStorage(), "i18n");
function cachedFunctionI18n(fn, opts) {
  opts = { maxAge: 1, ...opts };
  const pending = {};
  async function get(key, resolver) {
    const isPending = pending[key];
    if (!isPending) {
      pending[key] = Promise.resolve(resolver());
    }
    try {
      return await pending[key];
    } finally {
      delete pending[key];
    }
  }
  return async (...args) => {
    const key = [opts.name, opts.getKey(...args)].join(":").replace(/:\/$/, ":index");
    const maxAge = opts.maxAge ?? 1;
    const isCacheable = !opts.shouldBypassCache(...args) && maxAge >= 0;
    const cache = isCacheable && await storage.getItemRaw(key);
    if (!cache || cache.ttl < Date.now()) {
      pending[key] = Promise.resolve(fn(...args));
      const value = await get(key, () => fn(...args));
      if (isCacheable) {
        await storage.setItemRaw(key, { ttl: Date.now() + maxAge * 1e3, value, mtime: Date.now() });
      }
      return value;
    }
    return cache.value;
  };
}

const _getMessages = async (locale) => {
  return { [locale]: await getLocaleMessagesMerged(locale, localeLoaders[locale]) };
};
cachedFunctionI18n(_getMessages, {
  name: "messages",
  maxAge: -1 ,
  getKey: (locale) => locale,
  shouldBypassCache: (locale) => !isLocaleCacheable(locale)
});
const getMessages = _getMessages ;
const _getMergedMessages = async (locale, fallbackLocales) => {
  const merged = {};
  try {
    if (fallbackLocales.length > 0) {
      const messages = await Promise.all(fallbackLocales.map(getMessages));
      for (const message2 of messages) {
        deepCopy(message2, merged);
      }
    }
    const message = await getMessages(locale);
    deepCopy(message, merged);
    return merged;
  } catch (e) {
    throw new Error("Failed to merge messages: " + e.message);
  }
};
const getMergedMessages = cachedFunctionI18n(_getMergedMessages, {
  name: "merged-single",
  maxAge: -1 ,
  getKey: (locale, fallbackLocales) => `${locale}-[${[...new Set(fallbackLocales)].sort().join("-")}]`,
  shouldBypassCache: (locale, fallbackLocales) => !isLocaleWithFallbacksCacheable(locale, fallbackLocales)
});
const _getAllMergedMessages = async (locales) => {
  const merged = {};
  try {
    const messages = await Promise.all(locales.map(getMessages));
    for (const message of messages) {
      deepCopy(message, merged);
    }
    return merged;
  } catch (e) {
    throw new Error("Failed to merge messages: " + e.message);
  }
};
cachedFunctionI18n(_getAllMergedMessages, {
  name: "merged-all",
  maxAge: -1 ,
  getKey: (locales) => locales.join("-"),
  shouldBypassCache: (locales) => !locales.every((locale) => isLocaleCacheable(locale))
});

const _messagesHandler = defineEventHandler(async (event) => {
  const locale = getRouterParam(event, "locale");
  if (!locale) {
    throw createError({ status: 400, message: "Locale not specified." });
  }
  const ctx = useI18nContext(event);
  if (ctx.localeConfigs && locale in ctx.localeConfigs === false) {
    throw createError({ status: 404, message: `Locale '${locale}' not found.` });
  }
  const messages = await getMergedMessages(locale, ctx.localeConfigs?.[locale]?.fallbacks ?? []);
  deepCopy(messages, ctx.messages);
  return ctx.messages;
});
const _cachedMessageLoader = defineCachedFunction(_messagesHandler, {
  name: "i18n:messages-internal",
  maxAge: -1 ,
  getKey: (event) => [getRouterParam(event, "locale") ?? "null", getRouterParam(event, "hash") ?? "null"].join("-"),
  async shouldBypassCache(event) {
    const locale = getRouterParam(event, "locale");
    if (locale == null) {
      return false;
    }
    const ctx = tryUseI18nContext(event) || await initializeI18nContext(event);
    return !ctx.localeConfigs?.[locale]?.cacheable;
  }
});
defineCachedEventHandler(_cachedMessageLoader, {
  name: "i18n:messages",
  maxAge: -1 ,
  swr: false,
  getKey: (event) => [getRouterParam(event, "locale") ?? "null", getRouterParam(event, "hash") ?? "null"].join("-")
});
const _cSDLJw = _messagesHandler ;

const _lazy_dtCFhk = () => Promise.resolve().then(function () { return auditLogs_get$1; });
const _lazy_MY7ER4 = () => Promise.resolve().then(function () { return categories_get$3; });
const _lazy_DSBRci = () => Promise.resolve().then(function () { return categories_post$1; });
const _lazy_gL1XhM = () => Promise.resolve().then(function () { return _id__delete$r; });
const _lazy_FByJ3B = () => Promise.resolve().then(function () { return _id__put$p; });
const _lazy_RVbJZL = () => Promise.resolve().then(function () { return translations_put$d; });
const _lazy_fRxOzH = () => Promise.resolve().then(function () { return posts_get$3; });
const _lazy_XJu21n = () => Promise.resolve().then(function () { return posts_post$1; });
const _lazy_cyJ3G0 = () => Promise.resolve().then(function () { return _id__delete$p; });
const _lazy_HcsonA = () => Promise.resolve().then(function () { return _id__put$n; });
const _lazy_uSka9w = () => Promise.resolve().then(function () { return translations_put$b; });
const _lazy_1s0xVM = () => Promise.resolve().then(function () { return tags_get$1; });
const _lazy_APZWmF = () => Promise.resolve().then(function () { return tags_post$1; });
const _lazy_zOc2Ld = () => Promise.resolve().then(function () { return _id__delete$n; });
const _lazy_ndC_iI = () => Promise.resolve().then(function () { return _id__put$l; });
const _lazy_ryRKBe = () => Promise.resolve().then(function () { return _id__delete$l; });
const _lazy_TTIPdK = () => Promise.resolve().then(function () { return _id__put$j; });
const _lazy_fXjUxY = () => Promise.resolve().then(function () { return index_get$v; });
const _lazy_wi384d = () => Promise.resolve().then(function () { return index_post$h; });
const _lazy_zP_EZV = () => Promise.resolve().then(function () { return contacts_get$1; });
const _lazy_6g6r4c = () => Promise.resolve().then(function () { return _id__delete$j; });
const _lazy_72imvu = () => Promise.resolve().then(function () { return _id__put$h; });
const _lazy_fgDs7h = () => Promise.resolve().then(function () { return _id__delete$h; });
const _lazy_68awVB = () => Promise.resolve().then(function () { return _id__put$f; });
const _lazy_KDVYUM = () => Promise.resolve().then(function () { return translations_put$9; });
const _lazy_bnR6zk = () => Promise.resolve().then(function () { return index_get$t; });
const _lazy_lYCoS3 = () => Promise.resolve().then(function () { return index_post$f; });
const _lazy_3Gdy3P = () => Promise.resolve().then(function () { return _id__delete$f; });
const _lazy_2Ij_GE = () => Promise.resolve().then(function () { return _id__put$d; });
const _lazy_an5TWG = () => Promise.resolve().then(function () { return translations_put$7; });
const _lazy_bkqSEu = () => Promise.resolve().then(function () { return index_get$r; });
const _lazy_8xzy_U = () => Promise.resolve().then(function () { return index_post$d; });
const _lazy_PKHu42 = () => Promise.resolve().then(function () { return health_get$3; });
const _lazy_fOz2lp = () => Promise.resolve().then(function () { return logs_get$3; });
const _lazy_B8BDEW = () => Promise.resolve().then(function () { return summary_get$3; });
const _lazy_CmBraR = () => Promise.resolve().then(function () { return timeseries_get$1; });
const _lazy_IJHLPn = () => Promise.resolve().then(function () { return action_post$1; });
const _lazy_eC1kU8 = () => Promise.resolve().then(function () { return logs_get$1; });
const _lazy_hIyl37 = () => Promise.resolve().then(function () { return summary_get$1; });
const _lazy_60sksX = () => Promise.resolve().then(function () { return _id__delete$d; });
const _lazy_jsbeM2 = () => Promise.resolve().then(function () { return _id__put$b; });
const _lazy_X3d0oO = () => Promise.resolve().then(function () { return translations_put$5; });
const _lazy_hwAJ01 = () => Promise.resolve().then(function () { return index_get$p; });
const _lazy_aQ3GUu = () => Promise.resolve().then(function () { return index_post$b; });
const _lazy_O_X6Pa = () => Promise.resolve().then(function () { return _id__delete$b; });
const _lazy_S1FKMA = () => Promise.resolve().then(function () { return _id__put$9; });
const _lazy_1I66Wm = () => Promise.resolve().then(function () { return index_get$n; });
const _lazy_9y7kx7 = () => Promise.resolve().then(function () { return index_post$9; });
const _lazy_ObcIgL = () => Promise.resolve().then(function () { return settings_get$1; });
const _lazy_eW1yEv = () => Promise.resolve().then(function () { return settings_put$1; });
const _lazy_RcrZua = () => Promise.resolve().then(function () { return stats_get$1; });
const _lazy_zxMIA_ = () => Promise.resolve().then(function () { return supportBundle_get$1; });
const _lazy_t7y6T8 = () => Promise.resolve().then(function () { return _id__delete$9; });
const _lazy_U350Tn = () => Promise.resolve().then(function () { return _id__get$3; });
const _lazy_FNd_dR = () => Promise.resolve().then(function () { return _id__put$7; });
const _lazy_93HIkJ = () => Promise.resolve().then(function () { return translations_put$3; });
const _lazy_Nv87MN = () => Promise.resolve().then(function () { return index_get$l; });
const _lazy_ySXqQD = () => Promise.resolve().then(function () { return index_post$7; });
const _lazy_tuPtRw = () => Promise.resolve().then(function () { return terminal_post$1; });
const _lazy_Ac_7Xf = () => Promise.resolve().then(function () { return commands_get$1; });
const _lazy_anFXRT = () => Promise.resolve().then(function () { return _id__delete$7; });
const _lazy_sLHa09 = () => Promise.resolve().then(function () { return _id__put$5; });
const _lazy_6xbKyo = () => Promise.resolve().then(function () { return translations_put$1; });
const _lazy_Gr235O = () => Promise.resolve().then(function () { return index_get$j; });
const _lazy_7fXPbd = () => Promise.resolve().then(function () { return index_post$5; });
const _lazy_r_5YdU = () => Promise.resolve().then(function () { return translations_get$1; });
const _lazy_TSDaLi = () => Promise.resolve().then(function () { return translations_post$1; });
const _lazy_sQyKOA = () => Promise.resolve().then(function () { return _id__delete$5; });
const _lazy_f9tiKz = () => Promise.resolve().then(function () { return batch_post$1; });
const _lazy_sxQTQx = () => Promise.resolve().then(function () { return users_get$1; });
const _lazy_SJZSpd = () => Promise.resolve().then(function () { return users_post$1; });
const _lazy_UnIgM6 = () => Promise.resolve().then(function () { return _id__delete$3; });
const _lazy_6uUnJn = () => Promise.resolve().then(function () { return _id__put$3; });
const _lazy_gU1aMM = () => Promise.resolve().then(function () { return performance_post$1; });
const _lazy_MyKlQu = () => Promise.resolve().then(function () { return login_post$1; });
const _lazy_ddOhBs = () => Promise.resolve().then(function () { return logout_post$1; });
const _lazy_Kohc8N = () => Promise.resolve().then(function () { return session_get$1; });
const _lazy_DFgy8d = () => Promise.resolve().then(function () { return _slug__get$1; });
const _lazy_Iu29nT = () => Promise.resolve().then(function () { return categories_get$1; });
const _lazy_YOHfhP = () => Promise.resolve().then(function () { return posts_get$1; });
const _lazy_mINiGU = () => Promise.resolve().then(function () { return index_get$h; });
const _lazy_sXPL_x = () => Promise.resolve().then(function () { return submit_post$1; });
const _lazy_9vyE0P = () => Promise.resolve().then(function () { return openapi_json_get$1; });
const _lazy_yCUahm = () => Promise.resolve().then(function () { return swagger_get$1; });
const _lazy_AnQOIj = () => Promise.resolve().then(function () { return index_get$f; });
const _lazy_vnRaXj = () => Promise.resolve().then(function () { return index_get$d; });
const _lazy_9XYAAs = () => Promise.resolve().then(function () { return health_get$1; });
const _lazy_ARFBDD = () => Promise.resolve().then(function () { return _locale__get$1; });
const _lazy_Vi_cBy = () => Promise.resolve().then(function () { return ____key__get$1; });
const _lazy_PvYv1D = () => Promise.resolve().then(function () { return _id__delete$1; });
const _lazy_CtMtJa = () => Promise.resolve().then(function () { return _id__get$1; });
const _lazy_dKxC4h = () => Promise.resolve().then(function () { return _id__put$1; });
const _lazy_IiqJTa = () => Promise.resolve().then(function () { return _itemId__delete$1; });
const _lazy_v3YX_e = () => Promise.resolve().then(function () { return _itemId__put$1; });
const _lazy_jC7zSx = () => Promise.resolve().then(function () { return index_get$b; });
const _lazy_F5TEwo = () => Promise.resolve().then(function () { return index_post$3; });
const _lazy_ppGO5O = () => Promise.resolve().then(function () { return reorder_post$1; });
const _lazy_x4QR_g = () => Promise.resolve().then(function () { return index_get$9; });
const _lazy_h65Tbo = () => Promise.resolve().then(function () { return index_post$1; });
const _lazy_0ZmUaz = () => Promise.resolve().then(function () { return index_get$7; });
const _lazy_cTRr22 = () => Promise.resolve().then(function () { return index_get$5; });
const _lazy_OHahnq = () => Promise.resolve().then(function () { return config_get$1; });
const _lazy_Qixg9E = () => Promise.resolve().then(function () { return config_post$1; });
const _lazy_N66oXf = () => Promise.resolve().then(function () { return importZip_delete$1; });
const _lazy_zANkAH = () => Promise.resolve().then(function () { return importZip_post$1; });
const _lazy_4DmWAu = () => Promise.resolve().then(function () { return index_get$3; });
const _lazy_lE3tBN = () => Promise.resolve().then(function () { return index_get$1; });
const _lazy_FizaiG = () => Promise.resolve().then(function () { return image_post$1; });
const _lazy_3UILnF = () => Promise.resolve().then(function () { return video_post$1; });
const _lazy_4bAx9F = () => Promise.resolve().then(function () { return disable_post$1; });
const _lazy_w4buAb = () => Promise.resolve().then(function () { return enable_post$1; });
const _lazy_sp3vBN = () => Promise.resolve().then(function () { return setup_post$1; });
const _lazy_PrtqIJ = () => Promise.resolve().then(function () { return status_get$1; });
const _lazy_jaH5W6 = () => Promise.resolve().then(function () { return verify_post$1; });
const _lazy_VD7JXC = () => Promise.resolve().then(function () { return changePassword_put$1; });
const _lazy_8hM0Mp = () => Promise.resolve().then(function () { return ws$1; });
const _lazy_fq74i3 = () => Promise.resolve().then(function () { return com_chrome_devtools_json_get$1; });
const _lazy_z5UyYL = () => Promise.resolve().then(function () { return ____path__get$1; });
const _lazy_0XwxzV = () => Promise.resolve().then(function () { return renderer$1; });

const handlers = [
  { route: '', handler: _oStzCE, lazy: false, middleware: true, method: undefined },
  { route: '', handler: _4dj19y, lazy: false, middleware: true, method: undefined },
  { route: '', handler: _0FD7Gp, lazy: false, middleware: true, method: undefined },
  { route: '', handler: _O1Fe3T, lazy: false, middleware: true, method: undefined },
  { route: '', handler: _AxbTcq, lazy: false, middleware: true, method: undefined },
  { route: '', handler: _24zPt9, lazy: false, middleware: true, method: undefined },
  { route: '/api/admin/audit-logs', handler: _lazy_dtCFhk, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/blog/categories', handler: _lazy_MY7ER4, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/blog/categories', handler: _lazy_DSBRci, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/blog/categories/:id', handler: _lazy_gL1XhM, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/blog/categories/:id', handler: _lazy_FByJ3B, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/blog/categories/:id/translations', handler: _lazy_RVbJZL, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/blog/posts', handler: _lazy_fRxOzH, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/blog/posts', handler: _lazy_XJu21n, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/blog/posts/:id', handler: _lazy_cyJ3G0, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/blog/posts/:id', handler: _lazy_HcsonA, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/blog/posts/:id/translations', handler: _lazy_uSka9w, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/blog/tags', handler: _lazy_1s0xVM, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/blog/tags', handler: _lazy_APZWmF, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/blog/tags/:id', handler: _lazy_zOc2Ld, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/blog/tags/:id', handler: _lazy_ndC_iI, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/clients/:id', handler: _lazy_ryRKBe, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/clients/:id', handler: _lazy_TTIPdK, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/clients', handler: _lazy_fXjUxY, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/clients', handler: _lazy_wi384d, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/contacts', handler: _lazy_zP_EZV, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/contacts/:id', handler: _lazy_6g6r4c, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/contacts/:id', handler: _lazy_72imvu, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/faq/:id', handler: _lazy_fgDs7h, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/faq/:id', handler: _lazy_68awVB, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/faq/:id/translations', handler: _lazy_KDVYUM, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/faq', handler: _lazy_bnR6zk, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/faq', handler: _lazy_lYCoS3, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/features/:id', handler: _lazy_3Gdy3P, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/features/:id', handler: _lazy_2Ij_GE, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/features/:id/translations', handler: _lazy_an5TWG, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/features', handler: _lazy_bkqSEu, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/features', handler: _lazy_8xzy_U, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/health', handler: _lazy_PKHu42, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/logs', handler: _lazy_fOz2lp, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/monitoring/summary', handler: _lazy_B8BDEW, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/monitoring/timeseries', handler: _lazy_CmBraR, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/ops/action', handler: _lazy_IJHLPn, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/ops/logs', handler: _lazy_eC1kU8, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/ops/summary', handler: _lazy_hIyl37, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/pricing/:id', handler: _lazy_60sksX, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/pricing/:id', handler: _lazy_jsbeM2, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/pricing/:id/translations', handler: _lazy_X3d0oO, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/pricing', handler: _lazy_hwAJ01, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/pricing', handler: _lazy_aQ3GUu, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/roles/:id', handler: _lazy_O_X6Pa, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/roles/:id', handler: _lazy_S1FKMA, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/roles', handler: _lazy_1I66Wm, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/roles', handler: _lazy_9y7kx7, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/settings', handler: _lazy_ObcIgL, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/settings', handler: _lazy_eW1yEv, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/stats', handler: _lazy_RcrZua, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/support-bundle', handler: _lazy_zxMIA_, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/team/:id', handler: _lazy_t7y6T8, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/team/:id', handler: _lazy_U350Tn, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/team/:id', handler: _lazy_FNd_dR, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/team/:id/translations', handler: _lazy_93HIkJ, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/team', handler: _lazy_Nv87MN, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/team', handler: _lazy_ySXqQD, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/terminal', handler: _lazy_tuPtRw, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/terminal/commands', handler: _lazy_Ac_7Xf, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/testimonials/:id', handler: _lazy_anFXRT, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/testimonials/:id', handler: _lazy_sLHa09, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/testimonials/:id/translations', handler: _lazy_6xbKyo, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/testimonials', handler: _lazy_Gr235O, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/testimonials', handler: _lazy_7fXPbd, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/translations', handler: _lazy_r_5YdU, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/translations', handler: _lazy_TSDaLi, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/translations/:id', handler: _lazy_sQyKOA, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/translations/batch', handler: _lazy_f9tiKz, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/users', handler: _lazy_sxQTQx, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/users', handler: _lazy_SJZSpd, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/users/:id', handler: _lazy_UnIgM6, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/users/:id', handler: _lazy_6uUnJn, lazy: true, middleware: false, method: "put" },
  { route: '/api/analytics/performance', handler: _lazy_gU1aMM, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/login', handler: _lazy_MyKlQu, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/logout', handler: _lazy_ddOhBs, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/session', handler: _lazy_Kohc8N, lazy: true, middleware: false, method: "get" },
  { route: '/api/blog/:slug', handler: _lazy_DFgy8d, lazy: true, middleware: false, method: "get" },
  { route: '/api/blog/categories', handler: _lazy_Iu29nT, lazy: true, middleware: false, method: "get" },
  { route: '/api/blog/posts', handler: _lazy_YOHfhP, lazy: true, middleware: false, method: "get" },
  { route: '/api/clients', handler: _lazy_mINiGU, lazy: true, middleware: false, method: "get" },
  { route: '/api/contact/submit', handler: _lazy_sXPL_x, lazy: true, middleware: false, method: "post" },
  { route: '/api/docs/openapi.json', handler: _lazy_9vyE0P, lazy: true, middleware: false, method: "get" },
  { route: '/api/docs/swagger', handler: _lazy_yCUahm, lazy: true, middleware: false, method: "get" },
  { route: '/api/faq', handler: _lazy_AnQOIj, lazy: true, middleware: false, method: "get" },
  { route: '/api/features', handler: _lazy_vnRaXj, lazy: true, middleware: false, method: "get" },
  { route: '/api/health', handler: _lazy_9XYAAs, lazy: true, middleware: false, method: "get" },
  { route: '/api/i18n/:locale', handler: _lazy_ARFBDD, lazy: true, middleware: false, method: "get" },
  { route: '/api/media/s3/**:key', handler: _lazy_Vi_cBy, lazy: true, middleware: false, method: "get" },
  { route: '/api/portfolios/:id', handler: _lazy_PvYv1D, lazy: true, middleware: false, method: "delete" },
  { route: '/api/portfolios/:id', handler: _lazy_CtMtJa, lazy: true, middleware: false, method: "get" },
  { route: '/api/portfolios/:id', handler: _lazy_dKxC4h, lazy: true, middleware: false, method: "put" },
  { route: '/api/portfolios/:id/items/:itemId', handler: _lazy_IiqJTa, lazy: true, middleware: false, method: "delete" },
  { route: '/api/portfolios/:id/items/:itemId', handler: _lazy_v3YX_e, lazy: true, middleware: false, method: "put" },
  { route: '/api/portfolios/:id/items', handler: _lazy_jC7zSx, lazy: true, middleware: false, method: "get" },
  { route: '/api/portfolios/:id/items', handler: _lazy_F5TEwo, lazy: true, middleware: false, method: "post" },
  { route: '/api/portfolios/:id/items/reorder', handler: _lazy_ppGO5O, lazy: true, middleware: false, method: "post" },
  { route: '/api/portfolios', handler: _lazy_x4QR_g, lazy: true, middleware: false, method: "get" },
  { route: '/api/portfolios', handler: _lazy_h65Tbo, lazy: true, middleware: false, method: "post" },
  { route: '/api/pricing', handler: _lazy_0ZmUaz, lazy: true, middleware: false, method: "get" },
  { route: '/api/settings', handler: _lazy_cTRr22, lazy: true, middleware: false, method: "get" },
  { route: '/api/setup/config', handler: _lazy_OHahnq, lazy: true, middleware: false, method: "get" },
  { route: '/api/setup/config', handler: _lazy_Qixg9E, lazy: true, middleware: false, method: "post" },
  { route: '/api/setup/import-zip', handler: _lazy_N66oXf, lazy: true, middleware: false, method: "delete" },
  { route: '/api/setup/import-zip', handler: _lazy_zANkAH, lazy: true, middleware: false, method: "post" },
  { route: '/api/team', handler: _lazy_4DmWAu, lazy: true, middleware: false, method: "get" },
  { route: '/api/testimonials', handler: _lazy_lE3tBN, lazy: true, middleware: false, method: "get" },
  { route: '/api/upload/image', handler: _lazy_FizaiG, lazy: true, middleware: false, method: "post" },
  { route: '/api/upload/video', handler: _lazy_3UILnF, lazy: true, middleware: false, method: "post" },
  { route: '/api/user/2fa/disable', handler: _lazy_4bAx9F, lazy: true, middleware: false, method: "post" },
  { route: '/api/user/2fa/enable', handler: _lazy_w4buAb, lazy: true, middleware: false, method: "post" },
  { route: '/api/user/2fa/setup', handler: _lazy_sp3vBN, lazy: true, middleware: false, method: "post" },
  { route: '/api/user/2fa/status', handler: _lazy_PrtqIJ, lazy: true, middleware: false, method: "get" },
  { route: '/api/user/2fa/verify', handler: _lazy_jaH5W6, lazy: true, middleware: false, method: "post" },
  { route: '/api/user/change-password', handler: _lazy_VD7JXC, lazy: true, middleware: false, method: "put" },
  { route: '/api/ws', handler: _lazy_8hM0Mp, lazy: true, middleware: false, method: undefined },
  { route: '/.well-known/appspecific/com.chrome.devtools.json', handler: _lazy_fq74i3, lazy: true, middleware: false, method: "get" },
  { route: '/uploads/**:path', handler: _lazy_z5UyYL, lazy: true, middleware: false, method: "get" },
  { route: '/__nuxt_error', handler: _lazy_0XwxzV, lazy: true, middleware: false, method: undefined },
  { route: '/__nuxt_island/**', handler: _SxA8c9, lazy: false, middleware: false, method: undefined },
  { route: '/_i18n/:hash/:locale/messages.json', handler: _cSDLJw, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_0XwxzV, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(true),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter$1({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => callNodeRequestHandler(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return fetchNodeRequestHandler(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto;
}
const { NITRO_NO_UNIX_SOCKET, NITRO_DEV_WORKER_ID } = process.env;
trapUnhandledNodeErrors();
parentPort?.on("message", (msg) => {
  if (msg && msg.event === "shutdown") {
    shutdown();
  }
});
const nitroApp = useNitroApp();
const server = new Server(toNodeListener(nitroApp.h3App));
let listener;
listen().catch(() => listen(
  true
  /* use random port */
)).catch((error) => {
  console.error("Dev worker failed to listen:", error);
  return shutdown();
});
nitroApp.router.get(
  "/_nitro/tasks",
  defineEventHandler(async (event) => {
    const _tasks = await Promise.all(
      Object.entries(tasks).map(async ([name, task]) => {
        const _task = await task.resolve?.();
        return [name, { description: _task?.meta?.description }];
      })
    );
    return {
      tasks: Object.fromEntries(_tasks),
      scheduledTasks
    };
  })
);
nitroApp.router.use(
  "/_nitro/tasks/:name",
  defineEventHandler(async (event) => {
    const name = getRouterParam(event, "name");
    const payload = {
      ...getQuery$1(event),
      ...await readBody(event).then((r) => r?.payload).catch(() => ({}))
    };
    return await runTask(name, { payload });
  })
);
{
  startScheduleRunner();
}
function listen(useRandomPort = Boolean(
  NITRO_NO_UNIX_SOCKET || process.versions.webcontainer || "Bun" in globalThis && process.platform === "win32"
)) {
  return new Promise((resolve, reject) => {
    try {
      listener = server.listen(useRandomPort ? 0 : getSocketAddress(), () => {
        const address = server.address();
        parentPort?.postMessage({
          event: "listen",
          address: typeof address === "string" ? { socketPath: address } : { host: "localhost", port: address?.port }
        });
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
function getSocketAddress() {
  const socketName = `nitro-worker-${process.pid}-${threadId}-${NITRO_DEV_WORKER_ID}-${Math.round(Math.random() * 1e4)}.sock`;
  if (process.platform === "win32") {
    return join(String.raw`\\.\pipe`, socketName);
  }
  if (process.platform === "linux") {
    const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
    if (nodeMajor >= 20) {
      return `\0${socketName}`;
    }
  }
  return join(tmpdir(), socketName);
}
async function shutdown() {
  server.closeAllConnections?.();
  await Promise.all([
    new Promise((resolve) => listener?.close(resolve)),
    nitroApp.hooks.callHook("close").catch(console.error)
  ]);
  parentPort?.postMessage({ event: "exit" });
}

const _messages = { "appName": "Nuxt", "statusCode": 500, "statusMessage": "Internal server error", "description": "This page is temporarily unavailable.", "refresh": "Refresh this page" };
const template$1 = (messages) => {
  messages = { ..._messages, ...messages };
  return '<!DOCTYPE html><html lang="en"><head><title>' + escapeHtml$1(messages.statusCode) + " - " + escapeHtml$1(messages.statusMessage) + " | " + escapeHtml$1(messages.appName) + `</title><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,minimum-scale=1.0" name="viewport"><script>!function(){const e=document.createElement("link").relList;if(!(e&&e.supports&&e.supports("modulepreload"))){for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver(e=>{for(const o of e)if("childList"===o.type)for(const e of o.addedNodes)"LINK"===e.tagName&&"modulepreload"===e.rel&&r(e)}).observe(document,{childList:!0,subtree:!0})}function r(e){if(e.ep)return;e.ep=!0;const r=function(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),"use-credentials"===e.crossOrigin?r.credentials="include":"anonymous"===e.crossOrigin?r.credentials="omit":r.credentials="same-origin",r}(e);fetch(e.href,r)}}();<\/script><style>*,:after,:before{border-color:var(--un-default-border-color,#e5e7eb);border-style:solid;border-width:0;box-sizing:border-box}:after,:before{--un-content:""}html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-moz-tab-size:4;tab-size:4;-webkit-tap-highlight-color:transparent}body{line-height:inherit;margin:0}h1,h2{font-size:inherit;font-weight:inherit}h1,h2,p{margin:0}*,:after,:before{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 transparent;--un-ring-shadow:0 0 transparent;--un-shadow-inset: ;--un-shadow:0 0 transparent;--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgba(147,197,253,.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: }.grid{display:grid}.mb-2{margin-bottom:.5rem}.mb-4{margin-bottom:1rem}.max-w-520px{max-width:520px}.min-h-screen{min-height:100vh}.place-content-center{place-content:center}.overflow-hidden{overflow:hidden}.bg-white{--un-bg-opacity:1;background-color:rgb(255 255 255/var(--un-bg-opacity))}.px-2{padding-left:.5rem;padding-right:.5rem}.text-center{text-align:center}.text-\\[80px\\]{font-size:80px}.text-2xl{font-size:1.5rem;line-height:2rem}.text-\\[\\#020420\\]{--un-text-opacity:1;color:rgb(2 4 32/var(--un-text-opacity))}.text-\\[\\#64748B\\]{--un-text-opacity:1;color:rgb(100 116 139/var(--un-text-opacity))}.font-semibold{font-weight:600}.leading-none{line-height:1}.tracking-wide{letter-spacing:.025em}.font-sans{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}.tabular-nums{--un-numeric-spacing:tabular-nums;font-variant-numeric:var(--un-ordinal) var(--un-slashed-zero) var(--un-numeric-figure) var(--un-numeric-spacing) var(--un-numeric-fraction)}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}@media(prefers-color-scheme:dark){.dark\\:bg-\\[\\#020420\\]{--un-bg-opacity:1;background-color:rgb(2 4 32/var(--un-bg-opacity))}.dark\\:text-white{--un-text-opacity:1;color:rgb(255 255 255/var(--un-text-opacity))}}@media(min-width:640px){.sm\\:text-\\[110px\\]{font-size:110px}.sm\\:text-3xl{font-size:1.875rem;line-height:2.25rem}}</style></head><body class="antialiased bg-white dark:bg-[#020420] dark:text-white font-sans grid min-h-screen overflow-hidden place-content-center text-[#020420] tracking-wide"><div class="max-w-520px text-center"><h1 class="font-semibold leading-none mb-4 sm:text-[110px] tabular-nums text-[80px]">` + escapeHtml$1(messages.statusCode) + '</h1><h2 class="font-semibold mb-2 sm:text-3xl text-2xl">' + escapeHtml$1(messages.statusMessage) + '</h2><p class="mb-4 px-2 text-[#64748B] text-md">' + escapeHtml$1(messages.description) + "</p></div></body></html>";
};

const error500 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  template: template$1
}, Symbol.toStringTag, { value: 'Module' }));

function isServerRuntime() {
  return true;
}
const apiFetchRuntime = {
  isServerRuntime,
  useCsrf: () => useCsrf(),
  useRequestFetch: () => useRequestFetch(),
  useRoute: () => useRoute(),
  useState: (key, init) => useState(key, init),
  navigateTo: (...args) => navigateTo(...args)
};
function withCsrfHeaders(method, options) {
  {
    return options || {};
  }
}
function getApiFetchTransport() {
  {
    try {
      return apiFetchRuntime.useRequestFetch();
    } catch {
      return $fetch;
    }
  }
  return $fetch;
}
async function handleUnauthorizedApiResponse(input) {
  {
    return;
  }
}
function isApiSuccessEnvelope(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value;
  return candidate.success === true && "data" in candidate;
}
function unwrapApiEnvelope(value) {
  if (isApiSuccessEnvelope(value)) {
    return value.data;
  }
  return value;
}
async function apiFetch(input, options) {
  var _a, _b, _c, _d;
  const method = void 0;
  const transport = getApiFetchTransport();
  try {
    const response = await transport(input, withCsrfHeaders(method, options));
    return unwrapApiEnvelope(response);
  } catch (error) {
    const statusCode = (_d = (_b = error == null ? void 0 : error.statusCode) != null ? _b : (_a = error == null ? void 0 : error.response) == null ? void 0 : _a.status) != null ? _d : (_c = error == null ? void 0 : error.data) == null ? void 0 : _c.statusCode;
    if (statusCode === 401) {
      await handleUnauthorizedApiResponse();
    }
    throw error;
  }
}

const loader = async (locale) => {
  try {
    return await apiFetch(`/api/i18n/${locale}`);
  } catch {
    {
      console.warn(`[i18n] Failed to load translations for: ${locale}`);
    }
    return {};
  }
};

const loader$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: loader
}, Symbol.toStringTag, { value: 'Module' }));

const cleanupSessions = defineTask({
  meta: {
    name: "cleanup-sessions",
    description: "Remove expired sessions from database"
  },
  async run() {
    const startTime = Date.now();
    const db = useDatabase();
    try {
      const result = db.delete(sessions).where(lt(sessions.expiresAt, /* @__PURE__ */ new Date())).run();
      const duration = Date.now() - startTime;
      logger.info(
        { deleted: result.changes, durationMs: duration },
        "Session cleanup completed"
      );
      return {
        result: "success",
        deleted: result.changes,
        durationMs: duration
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(
        { error: message },
        "Session cleanup failed"
      );
      return {
        result: "error",
        error: message
      };
    }
  }
});

const cleanupSessions$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: cleanupSessions
}, Symbol.toStringTag, { value: 'Module' }));

const template = "";

const _virtual__spaTemplate = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  template: template
}, Symbol.toStringTag, { value: 'Module' }));

const styles = {};

const styles$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: styles
}, Symbol.toStringTag, { value: 'Module' }));

const auditLogs_get = defineEventHandler(async (event) => {
  var _a;
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  const db = useDatabase();
  const query = getQuery$1(event);
  let limit = parseInt(String(query.limit || "50"), 10);
  if (isNaN(limit) || limit < 1) limit = 50;
  if (limit > 200) limit = 200;
  let offset = parseInt(String(query.offset || "0"), 10);
  if (isNaN(offset) || offset < 0) offset = 0;
  const conditions = [];
  if (query.action) {
    conditions.push(eq(auditLogs.action, String(query.action)));
  }
  if (query.userId) {
    const userId = parseInt(String(query.userId), 10);
    if (!isNaN(userId)) {
      conditions.push(eq(auditLogs.userId, userId));
    }
  }
  const whereClause = conditions.length === 0 ? void 0 : conditions.length === 1 ? conditions[0] : and(...conditions);
  const totalResult = whereClause ? db.select({ count: count() }).from(auditLogs).where(whereClause).get() : db.select({ count: count() }).from(auditLogs).get();
  const total = (_a = totalResult == null ? void 0 : totalResult.count) != null ? _a : 0;
  const logs = (whereClause ? db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    userId: auditLogs.userId,
    targetUserId: auditLogs.targetUserId,
    ipAddress: auditLogs.ipAddress,
    userAgent: auditLogs.userAgent,
    details: auditLogs.details,
    success: auditLogs.success,
    createdAt: auditLogs.createdAt,
    actorName: users.name,
    actorEmail: users.email
  }).from(auditLogs).leftJoin(users, eq(auditLogs.userId, users.id)).where(whereClause).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset) : db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    userId: auditLogs.userId,
    targetUserId: auditLogs.targetUserId,
    ipAddress: auditLogs.ipAddress,
    userAgent: auditLogs.userAgent,
    details: auditLogs.details,
    success: auditLogs.success,
    createdAt: auditLogs.createdAt,
    actorName: users.name,
    actorEmail: users.email
  }).from(auditLogs).leftJoin(users, eq(auditLogs.userId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset)).all();
  const transformedLogs = logs.map((log) => {
    var _a2;
    return {
      id: log.id,
      action: log.action,
      userId: log.userId,
      targetUserId: log.targetUserId,
      actorName: log.actorName,
      actorEmail: log.actorEmail,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      details: safeJsonParseOrNull(log.details),
      success: log.success,
      createdAt: (_a2 = log.createdAt) == null ? void 0 : _a2.toISOString()
    };
  });
  return {
    success: true,
    data: {
      logs: transformedLogs,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total
      }
    }
  };
});

const auditLogs_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: auditLogs_get
}, Symbol.toStringTag, { value: 'Module' }));

const categories_get$2 = defineEventHandler(async () => {
  const db = useDatabase();
  const categories = db.select().from(blogCategories).orderBy(asc(blogCategories.order)).all();
  const allTranslations = db.select().from(translations).where(like(translations.key, "blog.category.%")).all();
  const categoriesWithTranslations = categories.map((cat) => {
    const nameKey = `blog.category.${cat.id}.name`;
    const descKey = `blog.category.${cat.id}.description`;
    const catTranslations = {};
    const catTrans = allTranslations.filter((t) => t.key.startsWith(`blog.category.${cat.id}.`));
    const locales = [...new Set(catTrans.map((t) => t.locale))];
    for (const locale of locales) {
      const name = allTranslations.find((t) => t.key === nameKey && t.locale === locale);
      const desc = allTranslations.find((t) => t.key === descKey && t.locale === locale);
      if (name) {
        catTranslations[locale] = {
          name: name.value,
          description: (desc == null ? void 0 : desc.value) || null
        };
      }
    }
    return {
      ...cat,
      translations: catTranslations
    };
  });
  return {
    success: true,
    data: categoriesWithTranslations,
    categories: categoriesWithTranslations
  };
});

const categories_get$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: categories_get$2
}, Symbol.toStringTag, { value: 'Module' }));

const createCategorySchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  order: z.number().int().min(0).default(0),
  translations: z.record(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable()
  })).optional()
});
const categories_post = defineEventHandler(async (event) => {
  const db = useDatabase();
  const body = await readBody(event);
  const result = createCategorySchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, ...data } = result.data;
  const existing = db.select().from(blogCategories).where(eq(blogCategories.slug, data.slug)).get();
  if (existing) {
    throw createError({ statusCode: 409, message: "Slug already exists" });
  }
  const [category] = db.insert(blogCategories).values({ slug: data.slug, order: data.order }).returning();
  if (!category) {
    throw createError({ statusCode: 500, message: "Failed to create category" });
  }
  if (translations$1) {
    const translationValues = [];
    for (const [locale, trans] of Object.entries(translations$1)) {
      translationValues.push({
        locale,
        key: `blog.category.${category.id}.name`,
        value: escapeHtml(trans.name)
      });
      if (trans.description) {
        translationValues.push({
          locale,
          key: `blog.category.${category.id}.description`,
          value: escapeHtml(trans.description)
        });
      }
    }
    if (translationValues.length > 0) {
      db.insert(translations).values(translationValues).run();
    }
  }
  return {
    success: true,
    data: {
      category
    },
    category
  };
});

const categories_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: categories_post
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$q = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const existing = db.select().from(blogCategories).where(eq(blogCategories.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Category not found" });
  }
  db.delete(translations).where(like(translations.key, `blog.category.${id}.%`)).run();
  db.delete(blogCategories).where(eq(blogCategories.id, id)).run();
  return {
    success: true,
    data: null
  };
});

const _id__delete$r = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$q
}, Symbol.toStringTag, { value: 'Module' }));

const updateCategorySchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  order: z.number().int().min(0).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  translations: z.record(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable()
  })).optional()
});
const _id__put$o = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const result = updateCategorySchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const existing = db.select().from(blogCategories).where(eq(blogCategories.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Category not found" });
  }
  const { translations: translations$1, name, description, ...data } = result.data;
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = db.select().from(blogCategories).where(and(eq(blogCategories.slug, data.slug), ne(blogCategories.id, id))).get();
    if (slugExists) {
      throw createError({ statusCode: 409, message: "Slug already exists" });
    }
  }
  const updateValues = { updatedAt: /* @__PURE__ */ new Date() };
  if (data.slug !== void 0) updateValues.slug = data.slug;
  if (data.order !== void 0) updateValues.order = data.order;
  db.update(blogCategories).set(updateValues).where(eq(blogCategories.id, id)).run();
  const defaultLocale = config.defaultLocale;
  if (name !== void 0) {
    const nameKey = `blog.category.${id}.name`;
    const existingName = db.select().from(translations).where(and(eq(translations.key, nameKey), eq(translations.locale, defaultLocale))).get();
    if (existingName) {
      db.update(translations).set({ value: escapeHtml(name), updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingName.id)).run();
    } else {
      db.insert(translations).values({ locale: defaultLocale, key: nameKey, value: escapeHtml(name) }).run();
    }
  }
  if (description !== void 0) {
    const descKey = `blog.category.${id}.description`;
    const existingDesc = db.select().from(translations).where(and(eq(translations.key, descKey), eq(translations.locale, defaultLocale))).get();
    if (existingDesc) {
      db.update(translations).set({ value: description ? escapeHtml(description) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingDesc.id)).run();
    } else if (description) {
      db.insert(translations).values({ locale: defaultLocale, key: descKey, value: escapeHtml(description) }).run();
    }
  }
  if (translations$1) {
    for (const [locale, trans] of Object.entries(translations$1)) {
      const nameKey = `blog.category.${id}.name`;
      const descKey = `blog.category.${id}.description`;
      const existingName = db.select().from(translations).where(and(eq(translations.key, nameKey), eq(translations.locale, locale))).get();
      if (existingName) {
        db.update(translations).set({ value: escapeHtml(trans.name), updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingName.id)).run();
      } else {
        db.insert(translations).values({ locale, key: nameKey, value: escapeHtml(trans.name) }).run();
      }
      const existingDesc = db.select().from(translations).where(and(eq(translations.key, descKey), eq(translations.locale, locale))).get();
      if (existingDesc) {
        db.update(translations).set({ value: trans.description ? escapeHtml(trans.description) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingDesc.id)).run();
      } else if (trans.description) {
        db.insert(translations).values({ locale, key: descKey, value: escapeHtml(trans.description) }).run();
      }
    }
  }
  return {
    success: true,
    data: null
  };
});

const _id__put$p = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$o
}, Symbol.toStringTag, { value: 'Module' }));

const updateTranslationSchema$2 = z.object({
  locale: z.string().min(2).max(5),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable()
});
const translations_put$c = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const result = updateTranslationSchema$2.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { locale, name, description } = result.data;
  const existing = db.select().from(blogCategories).where(eq(blogCategories.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Category not found" });
  }
  if (name !== void 0) {
    const nameKey = `blog.category.${id}.name`;
    const existingName = db.select().from(translations).where(and(eq(translations.key, nameKey), eq(translations.locale, locale))).get();
    if (existingName) {
      db.update(translations).set({ value: escapeHtml(name), updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingName.id)).run();
    } else {
      db.insert(translations).values({ locale, key: nameKey, value: escapeHtml(name) }).run();
    }
  }
  if (description !== void 0) {
    const descKey = `blog.category.${id}.description`;
    const existingDesc = db.select().from(translations).where(and(eq(translations.key, descKey), eq(translations.locale, locale))).get();
    if (existingDesc) {
      db.update(translations).set({ value: description ? escapeHtml(description) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingDesc.id)).run();
    } else if (description) {
      db.insert(translations).values({ locale, key: descKey, value: escapeHtml(description) }).run();
    }
  }
  return {
    success: true,
    data: null
  };
});

const translations_put$d = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: translations_put$c
}, Symbol.toStringTag, { value: 'Module' }));

const posts_get$2 = defineEventHandler(async () => {
  const db = useDatabase();
  const posts = db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt)).all();
  const allTranslations = db.select().from(translations).where(like(translations.key, "blog.post.%")).all();
  const categories = db.select().from(blogCategories).all();
  const users$1 = db.select().from(users).all();
  const postTags = db.select().from(blogPostTags).all();
  const tags = db.select().from(blogTags).all();
  const postsWithRelations = posts.map((post) => {
    const postTranslations = {};
    const titleKey = `blog.post.${post.id}.title`;
    const excerptKey = `blog.post.${post.id}.excerpt`;
    const contentKey = `blog.post.${post.id}.content`;
    const postTrans = allTranslations.filter((t) => t.key.startsWith(`blog.post.${post.id}.`));
    const locales = [...new Set(postTrans.map((t) => t.locale))];
    for (const locale of locales) {
      const title = allTranslations.find((t) => t.key === titleKey && t.locale === locale);
      const excerpt = allTranslations.find((t) => t.key === excerptKey && t.locale === locale);
      const content = allTranslations.find((t) => t.key === contentKey && t.locale === locale);
      if (title) {
        postTranslations[locale] = {
          title: title.value,
          excerpt: (excerpt == null ? void 0 : excerpt.value) || null,
          content: (content == null ? void 0 : content.value) || null
        };
      }
    }
    const category = post.categoryId ? categories.find((c) => c.id === post.categoryId) : null;
    const author = post.authorId ? users$1.find((u) => u.id === post.authorId) : null;
    const postTagIds = postTags.filter((pt) => pt.postId === post.id).map((pt) => pt.tagId);
    const postTagList = tags.filter((t) => postTagIds.includes(t.id));
    return {
      ...post,
      translations: postTranslations,
      category: category ? { id: category.id, slug: category.slug } : null,
      author: author ? { id: author.id, name: author.name } : null,
      tags: postTagList.map((t) => ({ id: t.id, slug: t.slug, name: t.name }))
    };
  });
  return {
    success: true,
    data: postsWithRelations,
    posts: postsWithRelations
  };
});

const posts_get$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: posts_get$2
}, Symbol.toStringTag, { value: 'Module' }));

const createPostSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  categoryId: z.number().int().optional().nullable(),
  coverImageUrl: z.string().max(500).optional().nullable(),
  coverImageAlt: z.string().max(200).optional().nullable(),
  published: z.boolean().default(false),
  readingTimeMinutes: z.number().int().min(0).optional().nullable(),
  translations: z.record(z.object({
    title: z.string().max(300),
    excerpt: z.string().max(500),
    content: z.string()
  })).optional(),
  tagIds: z.array(z.number().int()).optional()
});
const posts_post = defineEventHandler(async (event) => {
  const db = useDatabase();
  const session = event.context.session;
  const body = await readBody(event);
  const result = createPostSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, tagIds, ...data } = result.data;
  const existing = db.select().from(blogPosts).where(eq(blogPosts.slug, data.slug)).get();
  if (existing) {
    throw createError({
      statusCode: 409,
      message: "Slug already exists"
    });
  }
  const [post] = db.insert(blogPosts).values({
    slug: data.slug,
    authorId: (session == null ? void 0 : session.userId) || null,
    categoryId: data.categoryId || null,
    coverImageUrl: data.coverImageUrl || null,
    coverImageAlt: data.coverImageAlt || null,
    published: data.published,
    publishedAt: data.published ? /* @__PURE__ */ new Date() : null,
    readingTimeMinutes: data.readingTimeMinutes || null
  }).returning();
  if (!post) {
    throw createError({ statusCode: 500, message: "Failed to create post" });
  }
  if (translations$1) {
    const translationValues = [];
    for (const [locale, trans] of Object.entries(translations$1)) {
      translationValues.push({
        locale,
        key: `blog.post.${post.id}.title`,
        value: escapeHtml(trans.title)
      });
      if (trans.excerpt) {
        translationValues.push({
          locale,
          key: `blog.post.${post.id}.excerpt`,
          value: escapeHtml(trans.excerpt)
        });
      }
      if (trans.content) {
        translationValues.push({
          locale,
          key: `blog.post.${post.id}.content`,
          value: trans.content
          // Markdown content - sanitized on output
        });
      }
    }
    if (translationValues.length > 0) {
      db.insert(translations).values(translationValues).run();
    }
  }
  if (tagIds && tagIds.length > 0) {
    for (const tagId of tagIds) {
      db.insert(blogPostTags).values({ postId: post.id, tagId }).run();
    }
  }
  return {
    success: true,
    data: {
      post
    },
    post
  };
});

const posts_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: posts_post
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$o = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const existing = db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Post not found" });
  }
  db.delete(translations).where(like(translations.key, `blog.post.${id}.%`)).run();
  db.delete(blogPostTags).where(eq(blogPostTags.postId, id)).run();
  db.delete(blogMedia).where(eq(blogMedia.postId, id)).run();
  db.delete(blogPosts).where(eq(blogPosts.id, id)).run();
  return {
    success: true,
    data: null
  };
});

const _id__delete$p = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$o
}, Symbol.toStringTag, { value: 'Module' }));

const updatePostSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  categoryId: z.number().int().optional().nullable(),
  coverImageUrl: z.string().max(500).optional().nullable(),
  coverImageAlt: z.string().max(200).optional().nullable(),
  published: z.boolean().optional(),
  readingTimeMinutes: z.number().int().min(0).optional().nullable(),
  translations: z.record(z.object({
    title: z.string().max(300),
    excerpt: z.string().max(500),
    content: z.string()
  })).optional(),
  tagIds: z.array(z.number().int()).optional()
});
const _id__put$m = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const result = updatePostSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const existing = db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Post not found" });
  }
  const { translations: translations$1, tagIds, ...data } = result.data;
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = db.select().from(blogPosts).where(and(eq(blogPosts.slug, data.slug), ne(blogPosts.id, id))).get();
    if (slugExists) {
      throw createError({ statusCode: 409, message: "Slug already exists" });
    }
  }
  const updateValues = { updatedAt: /* @__PURE__ */ new Date() };
  if (data.slug !== void 0) updateValues.slug = data.slug;
  if (data.categoryId !== void 0) updateValues.categoryId = data.categoryId;
  if (data.coverImageUrl !== void 0) updateValues.coverImageUrl = data.coverImageUrl;
  if (data.coverImageAlt !== void 0) updateValues.coverImageAlt = data.coverImageAlt;
  if (data.readingTimeMinutes !== void 0) updateValues.readingTimeMinutes = data.readingTimeMinutes;
  if (data.published !== void 0) {
    updateValues.published = data.published;
    if (data.published && !existing.publishedAt) {
      updateValues.publishedAt = /* @__PURE__ */ new Date();
    }
  }
  const [post] = db.update(blogPosts).set(updateValues).where(eq(blogPosts.id, id)).returning();
  if (translations$1) {
    for (const [locale, trans] of Object.entries(translations$1)) {
      const titleKey = `blog.post.${id}.title`;
      const excerptKey = `blog.post.${id}.excerpt`;
      const contentKey = `blog.post.${id}.content`;
      const existingTitle = db.select().from(translations).where(and(eq(translations.key, titleKey), eq(translations.locale, locale))).get();
      if (existingTitle) {
        db.update(translations).set({ value: escapeHtml(trans.title), updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingTitle.id)).run();
      } else {
        db.insert(translations).values({ locale, key: titleKey, value: escapeHtml(trans.title) }).run();
      }
      const existingExcerpt = db.select().from(translations).where(and(eq(translations.key, excerptKey), eq(translations.locale, locale))).get();
      if (existingExcerpt) {
        db.update(translations).set({ value: trans.excerpt ? escapeHtml(trans.excerpt) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingExcerpt.id)).run();
      } else if (trans.excerpt) {
        db.insert(translations).values({ locale, key: excerptKey, value: escapeHtml(trans.excerpt) }).run();
      }
      const existingContent = db.select().from(translations).where(and(eq(translations.key, contentKey), eq(translations.locale, locale))).get();
      if (existingContent) {
        db.update(translations).set({ value: trans.content || "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingContent.id)).run();
      } else if (trans.content) {
        db.insert(translations).values({ locale, key: contentKey, value: trans.content }).run();
      }
    }
  }
  if (tagIds !== void 0) {
    db.delete(blogPostTags).where(eq(blogPostTags.postId, id)).run();
    for (const tagId of tagIds) {
      db.insert(blogPostTags).values({ postId: id, tagId }).run();
    }
  }
  return {
    success: true,
    data: {
      post
    },
    post
  };
});

const _id__put$n = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$m
}, Symbol.toStringTag, { value: 'Module' }));

const updateTranslationSchema$1 = z.object({
  locale: z.string().min(2).max(5),
  title: z.string().min(1).max(300).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().optional().nullable()
});
const translations_put$a = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const result = updateTranslationSchema$1.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { locale, title, excerpt, content } = result.data;
  const existing = db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Post not found" });
  }
  if (title !== void 0) {
    const titleKey = `blog.post.${id}.title`;
    const existingTitle = db.select().from(translations).where(and(eq(translations.key, titleKey), eq(translations.locale, locale))).get();
    if (existingTitle) {
      db.update(translations).set({ value: escapeHtml(title), updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingTitle.id)).run();
    } else {
      db.insert(translations).values({ locale, key: titleKey, value: escapeHtml(title) }).run();
    }
  }
  if (excerpt !== void 0) {
    const excerptKey = `blog.post.${id}.excerpt`;
    const existingExcerpt = db.select().from(translations).where(and(eq(translations.key, excerptKey), eq(translations.locale, locale))).get();
    if (existingExcerpt) {
      db.update(translations).set({ value: excerpt ? escapeHtml(excerpt) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingExcerpt.id)).run();
    } else if (excerpt) {
      db.insert(translations).values({ locale, key: excerptKey, value: escapeHtml(excerpt) }).run();
    }
  }
  if (content !== void 0) {
    const contentKey = `blog.post.${id}.content`;
    const existingContent = db.select().from(translations).where(and(eq(translations.key, contentKey), eq(translations.locale, locale))).get();
    if (existingContent) {
      db.update(translations).set({ value: content || "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingContent.id)).run();
    } else if (content) {
      db.insert(translations).values({ locale, key: contentKey, value: content }).run();
    }
  }
  return {
    success: true,
    data: null
  };
});

const translations_put$b = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: translations_put$a
}, Symbol.toStringTag, { value: 'Module' }));

const tags_get = defineEventHandler(async () => {
  const db = useDatabase();
  const tags = db.select().from(blogTags).orderBy(asc(blogTags.name)).all();
  return {
    success: true,
    data: tags,
    tags
  };
});

const tags_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: tags_get
}, Symbol.toStringTag, { value: 'Module' }));

const createTagSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(50)
});
const tags_post = defineEventHandler(async (event) => {
  const db = useDatabase();
  const body = await readBody(event);
  const result = createTagSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const data = result.data;
  const existing = db.select().from(blogTags).where(eq(blogTags.slug, data.slug)).get();
  if (existing) {
    throw createError({ statusCode: 409, message: "Slug already exists" });
  }
  const [tag] = db.insert(blogTags).values({
    slug: data.slug,
    name: escapeHtml(data.name)
  }).returning();
  if (!tag) {
    throw createError({ statusCode: 500, message: "Failed to create tag" });
  }
  return {
    success: true,
    data: {
      tag
    },
    tag
  };
});

const tags_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: tags_post
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$m = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const existing = db.select().from(blogTags).where(eq(blogTags.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Tag not found" });
  }
  db.delete(blogTags).where(eq(blogTags.id, id)).run();
  return {
    success: true,
    data: null
  };
});

const _id__delete$n = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$m
}, Symbol.toStringTag, { value: 'Module' }));

const _id__put$k = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const { slug, name } = body;
  if (!slug || !name) {
    throw createError({ statusCode: 400, message: "Slug and name are required" });
  }
  const existing = db.select().from(blogTags).where(eq(blogTags.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Tag not found" });
  }
  const slugExists = db.select().from(blogTags).where(
    and(
      eq(blogTags.slug, slug),
      ne(blogTags.id, id)
    )
  ).get();
  if (slugExists) {
    throw createError({ statusCode: 409, message: "Slug already exists" });
  }
  db.update(blogTags).set({
    slug,
    name,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }).where(eq(blogTags.id, id)).run();
  return {
    success: true,
    data: null
  };
});

const _id__put$l = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$k
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$k = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const existing = db.select().from(clients).where(eq(clients.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Client not found" });
  }
  db.delete(clients).where(eq(clients.id, id)).run();
  return {
    success: true,
    data: null
  };
});

const _id__delete$l = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$k
}, Symbol.toStringTag, { value: 'Module' }));

const _id__put$i = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const { slug, name, logoUrl, websiteUrl, category, featured, order } = body;
  if (!slug || !name) {
    throw createError({ statusCode: 400, message: "Slug and name are required" });
  }
  const existing = db.select().from(clients).where(eq(clients.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Client not found" });
  }
  const slugExists = db.select().from(clients).where(
    and(
      eq(clients.slug, slug),
      ne(clients.id, id)
    )
  ).get();
  if (slugExists) {
    throw createError({ statusCode: 409, message: "Slug already exists" });
  }
  db.update(clients).set({
    slug,
    name,
    logoUrl: logoUrl || null,
    websiteUrl: websiteUrl || null,
    category: category || null,
    featured: featured != null ? featured : false,
    order: order != null ? order : 0,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }).where(eq(clients.id, id)).run();
  return {
    success: true,
    data: null
  };
});

const _id__put$j = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$i
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$u = defineEventHandler(async () => {
  const db = useDatabase();
  const clients$1 = db.select().from(clients).orderBy(clients.order).all();
  return {
    success: true,
    data: clients$1,
    clients: clients$1
  };
});

const index_get$v = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$u
}, Symbol.toStringTag, { value: 'Module' }));

const index_post$g = defineEventHandler(async (event) => {
  const db = useDatabase();
  const body = await readBody(event);
  const { slug, name, logoUrl, websiteUrl, category, featured, order } = body;
  if (!slug || !name) {
    throw createError({ statusCode: 400, message: "Slug and name are required" });
  }
  const existing = db.select().from(clients).where(eq(clients.slug, slug)).get();
  if (existing) {
    throw createError({ statusCode: 409, message: "Slug already exists" });
  }
  const result = db.insert(clients).values({
    slug,
    name,
    logoUrl: logoUrl || null,
    websiteUrl: websiteUrl || null,
    category: category || null,
    featured: featured != null ? featured : false,
    order: order != null ? order : 0
  }).run();
  return {
    success: true,
    data: {
      id: result.lastInsertRowid
    },
    id: result.lastInsertRowid
  };
});

const index_post$h = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post$g
}, Symbol.toStringTag, { value: 'Module' }));

const contacts_get = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const session = event.context.session;
  if (!(session == null ? void 0 : session.userId)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  const db = useDatabase();
  const query = getQuery$1(event);
  const params = parsePaginationParams(query);
  const { limitClause, offsetClause } = paginationClauses(params.page, params.limit);
  const unreadOnly = query.unread === "true";
  const countsResult = db.select({
    total: sql`count(*)`,
    unread: sql`sum(case when read = 0 then 1 else 0 end)`
  }).from(contactSubmissions).get();
  const total = unreadOnly ? (_a = countsResult == null ? void 0 : countsResult.unread) != null ? _a : 0 : (_b = countsResult == null ? void 0 : countsResult.total) != null ? _b : 0;
  const unreadCount = (_c = countsResult == null ? void 0 : countsResult.unread) != null ? _c : 0;
  let items;
  if (unreadOnly) {
    items = db.select().from(contactSubmissions).where(eq(contactSubmissions.read, false)).orderBy(desc(contactSubmissions.createdAt)).limit(limitClause).offset(offsetClause).all();
  } else {
    items = db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).limit(limitClause).offset(offsetClause).all();
  }
  const meta = buildPaginationMeta(total, params.page, params.limit);
  return {
    success: true,
    data: {
      items,
      meta,
      unreadCount
    }
  };
});

const contacts_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: contacts_get
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$i = defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!(session == null ? void 0 : session.userId)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Valid ID required"
    });
  }
  const db = useDatabase();
  const existing = db.select().from(contactSubmissions).where(eq(contactSubmissions.id, parseInt(id))).get();
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Contact submission not found"
    });
  }
  db.delete(contactSubmissions).where(eq(contactSubmissions.id, parseInt(id))).run();
  return {
    success: true,
    data: {
      deleted: { id: parseInt(id) }
    }
  };
});

const _id__delete$j = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$i
}, Symbol.toStringTag, { value: 'Module' }));

const updateSchema$3 = z.object({
  read: z.boolean()
});
const _id__put$g = defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!(session == null ? void 0 : session.userId)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Valid ID required"
    });
  }
  const body = await readBody(event);
  const result = updateSchema$3.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: result.error.flatten()
    });
  }
  const db = useDatabase();
  const existing = db.select().from(contactSubmissions).where(eq(contactSubmissions.id, parseInt(id))).get();
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Contact submission not found"
    });
  }
  const updated = db.update(contactSubmissions).set({ read: result.data.read }).where(eq(contactSubmissions.id, parseInt(id))).returning().get();
  return {
    success: true,
    data: {
      item: updated
    }
  };
});

const _id__put$h = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$g
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$g = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const existing = db.select().from(faqItems).where(eq(faqItems.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "FAQ item not found" });
  }
  db.delete(translations).where(like(translations.key, `faq.${id}.%`)).run();
  db.delete(faqItems).where(eq(faqItems.id, id)).run();
  return {
    success: true,
    data: null
  };
});

const _id__delete$h = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$g
}, Symbol.toStringTag, { value: 'Module' }));

const updateFaqSchema = z.object({
  category: z.string().max(100).nullish(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
  translations: z.record(z.object({
    question: z.string().min(1).max(500),
    answer: z.string().min(1).max(5e3)
  })).optional()
});
const _id__put$e = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const result = updateFaqSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const existing = db.select().from(faqItems).where(eq(faqItems.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "FAQ item not found" });
  }
  const { translations: translations$1, ...data } = result.data;
  const updateValues = {};
  if (data.category !== void 0) updateValues.category = data.category ? escapeHtml(data.category) : null;
  if (data.order !== void 0) updateValues.order = data.order;
  if (data.published !== void 0) updateValues.published = data.published;
  db.update(faqItems).set(updateValues).where(eq(faqItems.id, id)).run();
  if (translations$1) {
    for (const [locale, trans] of Object.entries(translations$1)) {
      const questionKey = `faq.${id}.question`;
      const answerKey = `faq.${id}.answer`;
      const existingQuestion = db.select().from(translations).where(and(eq(translations.key, questionKey), eq(translations.locale, locale))).get();
      if (existingQuestion) {
        db.update(translations).set({ value: trans.question ? escapeHtml(trans.question) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingQuestion.id)).run();
      } else if (trans.question) {
        db.insert(translations).values({ locale, key: questionKey, value: escapeHtml(trans.question) }).run();
      }
      const existingAnswer = db.select().from(translations).where(and(eq(translations.key, answerKey), eq(translations.locale, locale))).get();
      if (existingAnswer) {
        db.update(translations).set({ value: trans.answer ? sanitizeHtml(trans.answer) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingAnswer.id)).run();
      } else if (trans.answer) {
        db.insert(translations).values({ locale, key: answerKey, value: sanitizeHtml(trans.answer) }).run();
      }
    }
  }
  return {
    success: true,
    data: null
  };
});

const _id__put$f = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$e
}, Symbol.toStringTag, { value: 'Module' }));

const updateFaqTranslationSchema = z.object({
  locale: z.string().min(2).max(8),
  question: z.string().max(500).optional().nullable(),
  answer: z.string().max(5e3).optional().nullable()
}).refine(
  (value) => value.question !== void 0 || value.answer !== void 0,
  { message: "At least one of question or answer is required" }
);
const translations_put$8 = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const result = updateFaqTranslationSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { locale, question, answer } = result.data;
  const existing = db.select().from(faqItems).where(eq(faqItems.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "FAQ item not found" });
  }
  if (question !== void 0) {
    const questionKey = `faq.${id}.question`;
    const existingQuestion = db.select().from(translations).where(and(eq(translations.key, questionKey), eq(translations.locale, locale))).get();
    if (existingQuestion) {
      db.update(translations).set({ value: question ? escapeHtml(question) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingQuestion.id)).run();
    } else if (question) {
      db.insert(translations).values({ locale, key: questionKey, value: escapeHtml(question) }).run();
    }
  }
  if (answer !== void 0) {
    const answerKey = `faq.${id}.answer`;
    const existingAnswer = db.select().from(translations).where(and(eq(translations.key, answerKey), eq(translations.locale, locale))).get();
    if (existingAnswer) {
      db.update(translations).set({ value: answer ? sanitizeHtml(answer) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingAnswer.id)).run();
    } else if (answer) {
      db.insert(translations).values({ locale, key: answerKey, value: sanitizeHtml(answer) }).run();
    }
  }
  return {
    success: true,
    data: null
  };
});

const translations_put$9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: translations_put$8
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$s = defineEventHandler(async () => {
  const db = useDatabase();
  const defaultLocale = config.defaultLocale;
  const faqItems$1 = db.select().from(faqItems).orderBy(faqItems.order).all();
  const allTranslations = db.select().from(translations).where(like(translations.key, "faq.%")).all();
  const result = faqItems$1.map((item) => {
    var _a, _b;
    const translationsMap = {};
    const questionKey = `faq.${item.id}.question`;
    const answerKey = `faq.${item.id}.answer`;
    const locales = new Set(
      allTranslations.filter((t) => t.key === questionKey || t.key === answerKey).map((t) => t.locale)
    );
    locales.forEach((locale) => {
      var _a2, _b2;
      const question = ((_a2 = allTranslations.find((t) => t.key === questionKey && t.locale === locale)) == null ? void 0 : _a2.value) || null;
      const answer = ((_b2 = allTranslations.find((t) => t.key === answerKey && t.locale === locale)) == null ? void 0 : _b2.value) || null;
      translationsMap[locale] = { question, answer };
    });
    const defaultQuestion = ((_a = translationsMap[defaultLocale]) == null ? void 0 : _a.question) || "";
    const defaultAnswer = ((_b = translationsMap[defaultLocale]) == null ? void 0 : _b.answer) || "";
    return {
      ...item,
      question: defaultQuestion,
      answer: defaultAnswer,
      translations: translationsMap
    };
  });
  return {
    success: true,
    data: result,
    faq: result
  };
});

const index_get$t = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$s
}, Symbol.toStringTag, { value: 'Module' }));

const createFaqSchema = z.object({
  category: z.string().max(100).nullish(),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  translations: z.record(z.object({
    question: z.string().min(1).max(500),
    answer: z.string().min(1).max(5e3)
  })).optional()
});
function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function createUniqueSlug(db, baseSlug) {
  const normalized = baseSlug || "faq-item";
  let candidate = normalized;
  let index = 1;
  while (db.select().from(faqItems).where(eq(faqItems.slug, candidate)).get()) {
    candidate = `${normalized}-${index}`;
    index += 1;
  }
  return candidate;
}
const index_post$e = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const body = await readBody(event);
  const result = createFaqSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, ...data } = result.data;
  const firstQuestion = translations$1 ? (_a = Object.values(translations$1).find((translation) => translation.question.trim().length > 0)) == null ? void 0 : _a.question : "";
  const baseSlug = slugify(firstQuestion || `faq-${Date.now()}`);
  const uniqueSlug = createUniqueSlug(db, baseSlug);
  const insertResult = db.insert(faqItems).values({
    slug: uniqueSlug,
    category: data.category ? escapeHtml(data.category) : null,
    order: data.order,
    published: data.published
  }).run();
  const faqId = Number(insertResult.lastInsertRowid);
  if (translations$1) {
    const translationValues = [];
    for (const [locale, trans] of Object.entries(translations$1)) {
      if (trans.question) {
        translationValues.push({
          locale,
          key: `faq.${faqId}.question`,
          value: escapeHtml(trans.question)
        });
      }
      if (trans.answer) {
        translationValues.push({
          locale,
          key: `faq.${faqId}.answer`,
          value: sanitizeHtml(trans.answer)
        });
      }
    }
    if (translationValues.length > 0) {
      db.insert(translations).values(translationValues).run();
    }
  }
  return {
    success: true,
    data: {
      id: faqId
    },
    id: faqId
  };
});

const index_post$f = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post$e
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$e = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const existing = db.select().from(features).where(eq(features.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Feature not found" });
  }
  db.delete(translations).where(like(translations.key, `feature.${id}.%`)).run();
  db.delete(features).where(eq(features.id, id)).run();
  return {
    success: true,
    data: {}
  };
});

const _id__delete$f = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$e
}, Symbol.toStringTag, { value: 'Module' }));

const updateFeatureSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  imageUrl: z.string().max(500).nullish(),
  hoverImageUrl: z.string().max(500).nullish(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
  translations: z.record(z.object({
    title: z.string().max(200).nullable().optional(),
    description: z.string().max(1e3).nullable().optional()
  })).optional()
});
const _id__put$c = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const result = updateFeatureSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const existing = db.select().from(features).where(eq(features.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Feature not found" });
  }
  const { translations: translations$1, ...data } = result.data;
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = db.select().from(features).where(and(eq(features.slug, data.slug), ne(features.id, id))).get();
    if (slugExists) {
      throw createError({ statusCode: 409, message: "Slug already exists" });
    }
  }
  const updateValues = {};
  if (data.slug !== void 0) updateValues.slug = data.slug;
  if (data.imageUrl !== void 0) updateValues.imageUrl = data.imageUrl;
  if (data.hoverImageUrl !== void 0) updateValues.hoverImageUrl = data.hoverImageUrl;
  if (data.order !== void 0) updateValues.order = data.order;
  if (data.published !== void 0) updateValues.published = data.published;
  if (Object.keys(updateValues).length > 0) {
    db.update(features).set(updateValues).where(eq(features.id, id)).run();
  }
  if (translations$1) {
    for (const [locale, trans] of Object.entries(translations$1)) {
      const titleKey = `feature.${id}.title`;
      const descKey = `feature.${id}.description`;
      const existingTitle = db.select().from(translations).where(and(eq(translations.key, titleKey), eq(translations.locale, locale))).get();
      if (existingTitle) {
        db.update(translations).set({ value: trans.title || "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingTitle.id)).run();
      } else if (trans.title) {
        db.insert(translations).values({ locale, key: titleKey, value: trans.title }).run();
      }
      const existingDesc = db.select().from(translations).where(and(eq(translations.key, descKey), eq(translations.locale, locale))).get();
      if (existingDesc) {
        db.update(translations).set({ value: trans.description || "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingDesc.id)).run();
      } else if (trans.description) {
        db.insert(translations).values({ locale, key: descKey, value: trans.description }).run();
      }
    }
  }
  return {
    success: true,
    data: {}
  };
});

const _id__put$d = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$c
}, Symbol.toStringTag, { value: 'Module' }));

const translations_put$6 = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const { locale, title, description } = body;
  if (!locale) {
    throw createError({ statusCode: 400, message: "Locale is required" });
  }
  const existing = db.select().from(features).where(eq(features.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Feature not found" });
  }
  if (title !== void 0) {
    const titleKey = `feature.${id}.title`;
    const existingTitle = db.select().from(translations).where(and(eq(translations.key, titleKey), eq(translations.locale, locale))).get();
    if (existingTitle) {
      db.update(translations).set({ value: title, updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingTitle.id)).run();
    } else {
      db.insert(translations).values({ locale, key: titleKey, value: title }).run();
    }
  }
  if (description !== void 0) {
    const descKey = `feature.${id}.description`;
    const existingDesc = db.select().from(translations).where(and(eq(translations.key, descKey), eq(translations.locale, locale))).get();
    if (existingDesc) {
      db.update(translations).set({ value: description, updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingDesc.id)).run();
    } else {
      db.insert(translations).values({ locale, key: descKey, value: description }).run();
    }
  }
  return {
    success: true,
    data: {}
  };
});

const translations_put$7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: translations_put$6
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$q = defineEventHandler(async () => {
  const db = useDatabase();
  const defaultLocale = config.defaultLocale;
  const features$1 = db.select().from(features).orderBy(features.order).all();
  const allTranslations = db.select().from(translations).where(like(translations.key, "feature.%")).all();
  const result = features$1.map((feature) => {
    var _a, _b;
    const translationsMap = {};
    const titleKey = `feature.${feature.id}.title`;
    const descKey = `feature.${feature.id}.description`;
    const locales = new Set(
      allTranslations.filter((t) => t.key === titleKey || t.key === descKey).map((t) => t.locale)
    );
    locales.forEach((locale) => {
      var _a2, _b2;
      const title = ((_a2 = allTranslations.find((t) => t.key === titleKey && t.locale === locale)) == null ? void 0 : _a2.value) || null;
      const description = ((_b2 = allTranslations.find((t) => t.key === descKey && t.locale === locale)) == null ? void 0 : _b2.value) || null;
      translationsMap[locale] = { title, description };
    });
    const defaultTitle = ((_a = translationsMap[defaultLocale]) == null ? void 0 : _a.title) || "";
    const defaultDescription = ((_b = translationsMap[defaultLocale]) == null ? void 0 : _b.description) || "";
    return {
      ...feature,
      title: defaultTitle,
      description: defaultDescription,
      translations: translationsMap
    };
  });
  return {
    success: true,
    data: result,
    features: result
  };
});

const index_get$r = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$q
}, Symbol.toStringTag, { value: 'Module' }));

const createFeatureSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  imageUrl: z.string().max(500).nullish(),
  hoverImageUrl: z.string().max(500).nullish(),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  translations: z.record(z.object({
    title: z.string().max(200).nullable().optional(),
    description: z.string().max(1e3).nullable().optional()
  })).optional()
});
const index_post$c = defineEventHandler(async (event) => {
  const db = useDatabase();
  const body = await readBody(event);
  const result = createFeatureSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, ...data } = result.data;
  const existing = db.select().from(features).where(eq(features.slug, data.slug)).get();
  if (existing) {
    throw createError({ statusCode: 409, message: "Slug already exists" });
  }
  const insertResult = db.insert(features).values({
    slug: data.slug,
    imageUrl: data.imageUrl || null,
    hoverImageUrl: data.hoverImageUrl || null,
    order: data.order,
    published: data.published
  }).run();
  const featureId = Number(insertResult.lastInsertRowid);
  if (translations$1) {
    const translationValues = [];
    for (const [locale, trans] of Object.entries(translations$1)) {
      if (trans.title) {
        translationValues.push({
          locale,
          key: `feature.${featureId}.title`,
          value: trans.title
        });
      }
      if (trans.description) {
        translationValues.push({
          locale,
          key: `feature.${featureId}.description`,
          value: trans.description
        });
      }
    }
    if (translationValues.length > 0) {
      db.insert(translations).values(translationValues).run();
    }
  }
  return {
    success: true,
    data: {
      id: featureId
    }
  };
});

const index_post$d = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post$c
}, Symbol.toStringTag, { value: 'Module' }));

const execFileAsync$1 = promisify(execFile);
function getPercentageStatus(percentage) {
  if (percentage >= 95) return "error";
  if (percentage >= 85) return "warning";
  return "ok";
}
function setOverallStatus(current, checkStatus) {
  if (checkStatus === "error") return "unhealthy";
  if (checkStatus === "warning" && current === "ok") return "degraded";
  return current;
}
function readTextFile(path) {
  try {
    if (!existsSync(path)) return null;
    return readFileSync(path, "utf8").trim();
  } catch {
    return null;
  }
}
function readNumberFile(path) {
  const value = readTextFile(path);
  if (!value || value === "max") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function isUsableCgroupLimit(limit) {
  return typeof limit === "number" && Number.isFinite(limit) && limit > 0 && limit < 9007199254740991;
}
function getCgroupMemoryStats() {
  const v2Usage = readNumberFile("/sys/fs/cgroup/memory.current");
  const v2Limit = readNumberFile("/sys/fs/cgroup/memory.max");
  if (v2Usage !== null && isUsableCgroupLimit(v2Limit)) {
    return {
      scope: "container",
      usedBytes: v2Usage,
      totalBytes: v2Limit,
      freeBytes: Math.max(0, v2Limit - v2Usage)
    };
  }
  const v1Usage = readNumberFile("/sys/fs/cgroup/memory/memory.usage_in_bytes");
  const v1Limit = readNumberFile("/sys/fs/cgroup/memory/memory.limit_in_bytes");
  if (v1Usage !== null && isUsableCgroupLimit(v1Limit)) {
    return {
      scope: "container",
      usedBytes: v1Usage,
      totalBytes: v1Limit,
      freeBytes: Math.max(0, v1Limit - v1Usage)
    };
  }
  const hostTotal = totalmem();
  const hostFree = freemem();
  return {
    scope: "host",
    usedBytes: Math.max(0, hostTotal - hostFree),
    totalBytes: hostTotal,
    freeBytes: hostFree
  };
}
function getCpuLimit() {
  const cpuMax = readTextFile("/sys/fs/cgroup/cpu.max");
  if (cpuMax) {
    const [quotaValue, periodValue] = cpuMax.split(/\s+/);
    const quota2 = quotaValue === "max" ? null : Number(quotaValue);
    const period2 = Number(periodValue);
    if (quota2 && period2 > 0) {
      return {
        scope: "container",
        cores: Math.max(0.01, quota2 / period2)
      };
    }
  }
  const quota = readNumberFile("/sys/fs/cgroup/cpu/cpu.cfs_quota_us");
  const period = readNumberFile("/sys/fs/cgroup/cpu/cpu.cfs_period_us");
  if (quota && quota > 0 && period && period > 0) {
    return {
      scope: "container",
      cores: Math.max(0.01, quota / period)
    };
  }
  return {
    scope: "host",
    cores: Math.max(1, cpus().length)
  };
}
function readCgroupCpuUsageMicros() {
  const cpuStat = readTextFile("/sys/fs/cgroup/cpu.stat");
  if (cpuStat) {
    const usageLine = cpuStat.split("\n").find((line) => line.startsWith("usage_usec "));
    const usage = Number(usageLine == null ? void 0 : usageLine.split(/\s+/)[1]);
    if (Number.isFinite(usage)) return usage;
  }
  const usageNanos = readNumberFile("/sys/fs/cgroup/cpuacct/cpuacct.usage");
  return usageNanos === null ? null : usageNanos / 1e3;
}
async function getCpuCheck() {
  const limit = getCpuLimit();
  const firstUsage = readCgroupCpuUsageMicros();
  if (limit.scope === "container" && firstUsage !== null) {
    const startedAt = process.hrtime.bigint();
    await setTimeout$1(100);
    const secondUsage = readCgroupCpuUsageMicros();
    const endedAt = process.hrtime.bigint();
    if (secondUsage !== null && secondUsage >= firstUsage) {
      const elapsedMicros = Number(endedAt - startedAt) / 1e3;
      const rawPercentage = elapsedMicros > 0 ? (secondUsage - firstUsage) / (elapsedMicros * limit.cores) * 100 : 0;
      const percentage2 = Math.max(0, Math.round(rawPercentage));
      return {
        name: "cpu",
        status: getPercentageStatus(percentage2),
        details: {
          scope: limit.scope,
          percentage: percentage2,
          cores: Number(limit.cores.toFixed(2)),
          usageDeltaMs: Math.round((secondUsage - firstUsage) / 1e3)
        }
      };
    }
  }
  const oneMinuteLoad = loadavg()[0] || 0;
  const percentage = Math.round(oneMinuteLoad / limit.cores * 100);
  return {
    name: "cpu",
    status: getPercentageStatus(percentage),
    details: {
      scope: limit.scope,
      percentage,
      load1m: Number(oneMinuteLoad.toFixed(2)),
      cores: Number(limit.cores.toFixed(2))
    }
  };
}
function getRuntimeDiskPaths() {
  const candidates = [
    { name: "diskData", path: "/app/data" },
    { name: "diskUploads", path: "/app/uploads" }
  ];
  const databaseUrl = process.env.DATABASE_URL || "";
  const databasePath = getDatabaseDiskPathFromUrl(databaseUrl);
  if (databasePath) {
    candidates.push({ name: "diskDatabase", path: databasePath });
  }
  candidates.push({ name: "diskApp", path: process.cwd() });
  const seen = /* @__PURE__ */ new Set();
  return candidates.map((candidate) => ({ ...candidate, path: resolve(candidate.path) })).filter((candidate) => {
    if (seen.has(candidate.path) || !existsSync(candidate.path)) return false;
    seen.add(candidate.path);
    return true;
  });
}
async function getDiskCheck(name, path) {
  try {
    const { stdout } = await execFileAsync$1("df", ["-Pk", path], {
      timeout: 3e3,
      maxBuffer: 32 * 1024,
      shell: false
    });
    const lines = stdout.trim().split("\n");
    const dataLine = lines[lines.length - 1];
    const parts = (dataLine == null ? void 0 : dataLine.trim().split(/\s+/)) || [];
    const sizeKB = Number(parts[1] || 0);
    const usedKB = Number(parts[2] || 0);
    const availableKB = Number(parts[3] || 0);
    const mount = parts[5] || "/";
    const percentage = sizeKB > 0 ? Math.round(usedKB / sizeKB * 100) : 0;
    return {
      name,
      status: getPercentageStatus(percentage),
      details: {
        scope: "runtimePath",
        path,
        percentage,
        usedMB: Math.round(usedKB / 1024),
        totalMB: Math.round(sizeKB / 1024),
        availableMB: Math.round(availableKB / 1024),
        mount
      }
    };
  } catch (error) {
    return {
      name,
      status: "warning",
      message: error instanceof Error ? error.message : "Disk usage check failed",
      details: {
        scope: "runtimePath",
        path
      }
    };
  }
}
async function getDiskChecks() {
  const paths = getRuntimeDiskPaths();
  if (paths.length === 0) {
    return [await getDiskCheck("diskApp", process.cwd())];
  }
  return Promise.all(paths.map((item) => getDiskCheck(item.name, item.path)));
}
async function getAdminHealthData(event) {
  var _a, _b;
  const startTime = Date.now();
  const runtimeConfig = useRuntimeConfig(event);
  const checks = [];
  let overallStatus = "ok";
  const dbStart = Date.now();
  try {
    const db = useDatabase();
    const userCountResult = db.select({ count: sql`count(*)` }).from(users).get();
    const userCount = (_a = userCountResult == null ? void 0 : userCountResult.count) != null ? _a : 0;
    const auditCountResult = db.select({ count: sql`count(*)` }).from(auditLogs).get();
    const auditCount = (_b = auditCountResult == null ? void 0 : auditCountResult.count) != null ? _b : 0;
    checks.push({
      name: "database",
      status: "ok",
      latency: Date.now() - dbStart,
      details: {
        users: userCount,
        auditLogs: auditCount
      }
    });
  } catch (error) {
    overallStatus = "unhealthy";
    checks.push({
      name: "database",
      status: "error",
      message: error instanceof Error ? error.message : "Database connection failed"
    });
  }
  const ramStats = getCgroupMemoryStats();
  const totalRamMB = Math.round(ramStats.totalBytes / 1024 / 1024);
  const freeRamMB = Math.round(ramStats.freeBytes / 1024 / 1024);
  const usedRamMB = Math.round(ramStats.usedBytes / 1024 / 1024);
  const ramPercentage = totalRamMB > 0 ? Math.round(usedRamMB / totalRamMB * 100) : 0;
  const ramStatus = getPercentageStatus(ramPercentage);
  overallStatus = setOverallStatus(overallStatus, ramStatus);
  checks.push({
    name: "ram",
    status: ramStatus,
    details: {
      scope: ramStats.scope,
      percentage: ramPercentage,
      usedMB: usedRamMB,
      totalMB: totalRamMB,
      freeMB: freeRamMB
    }
  });
  const memUsage = process.memoryUsage();
  const heapStats = getHeapStatistics();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const heapLimitMB = Math.round(heapStats.heap_size_limit / 1024 / 1024);
  const nodeHeapPercentage = heapLimitMB > 0 ? Math.round(heapUsedMB / heapLimitMB * 100) : 0;
  const nodeHeapStatus = getPercentageStatus(nodeHeapPercentage);
  overallStatus = setOverallStatus(overallStatus, nodeHeapStatus);
  checks.push({
    name: "nodeHeap",
    status: nodeHeapStatus,
    details: {
      scope: "process",
      percentage: nodeHeapPercentage,
      usedMB: heapUsedMB,
      totalMB: heapLimitMB,
      allocatedMB: heapTotalMB,
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
      externalMB: Math.round(memUsage.external / 1024 / 1024)
    }
  });
  const diskChecks = await getDiskChecks();
  for (const diskCheck of diskChecks) {
    overallStatus = setOverallStatus(overallStatus, diskCheck.status);
    checks.push(diskCheck);
  }
  const bufferStats = getBufferStats();
  checks.push({
    name: "logBuffer",
    status: "ok",
    details: {
      scope: "process",
      entries: bufferStats.size,
      maxEntries: bufferStats.maxSize,
      oldestEntry: bufferStats.oldestEntry
    }
  });
  const cpuCheck = await getCpuCheck();
  overallStatus = setOverallStatus(overallStatus, cpuCheck.status);
  checks.push(cpuCheck);
  return {
    status: overallStatus,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: Math.floor(process.uptime()),
    version: runtimeConfig.appVersion,
    appVersion: runtimeConfig.appVersion,
    buildTimestamp: runtimeConfig.buildTimestamp,
    buildVersion: runtimeConfig.buildVersion,
    buildSha: runtimeConfig.buildSha,
    buildBranch: runtimeConfig.buildBranch,
    buildCommitMessage: runtimeConfig.buildCommitMessage,
    nodeVersion: process.version,
    environment: "development",
    checks,
    responseTime: Date.now() - startTime
  };
}
const health_get$2 = defineEventHandler(async (event) => {
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  return {
    success: true,
    data: await getAdminHealthData(event)
  };
});

const health_get$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: health_get$2,
  getAdminHealthData: getAdminHealthData
}, Symbol.toStringTag, { value: 'Module' }));

const LEVEL_VALUES = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
};
const logs_get$2 = defineEventHandler(async (event) => {
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  const query = getQuery$1(event);
  let limit = parseInt(String(query.limit || "100"), 10);
  if (isNaN(limit) || limit < 1) limit = 100;
  if (limit > 500) limit = 500;
  let minLevel = 0;
  if (query.level) {
    const levelStr = String(query.level).toLowerCase();
    const levelValue = LEVEL_VALUES[levelStr];
    if (levelValue !== void 0) {
      minLevel = levelValue;
    } else {
      const numLevel = parseInt(levelStr, 10);
      if (!isNaN(numLevel)) {
        minLevel = numLevel;
      }
    }
  }
  const logs = getRecentLogs(limit, minLevel);
  const stats = getBufferStats();
  return {
    success: true,
    data: {
      logs,
      meta: {
        returned: logs.length,
        limit,
        minLevel,
        bufferSize: stats.size,
        bufferMaxSize: stats.maxSize,
        oldestEntry: stats.oldestEntry
      }
    }
  };
});

const logs_get$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: logs_get$2
}, Symbol.toStringTag, { value: 'Module' }));

const summary_get$2 = defineEventHandler(async (event) => {
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  return {
    success: true,
    data: await getNetdataSummary(event)
  };
});

const summary_get$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: summary_get$2
}, Symbol.toStringTag, { value: 'Module' }));

const querySchema$1 = z.object({
  metric: z.string().trim().min(1).max(40),
  after: z.coerce.number().int().min(60).max(86400).default(900),
  points: z.coerce.number().int().min(5).max(300).default(60)
});
const timeseries_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  const parsed = querySchema$1.safeParse(getQuery$1(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid monitoring query"
    });
  }
  const metric = await getNetdataTimeseries(event, parsed.data.metric, parsed.data.after, parsed.data.points);
  if (!metric) {
    throw createError({
      statusCode: 404,
      message: "Monitoring metric not found"
    });
  }
  return {
    success: true,
    data: metric
  };
});

const timeseries_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: timeseries_get
}, Symbol.toStringTag, { value: 'Module' }));

const allowedActions = ["db-integrity", "db-backup", "restart-app", "restart-traefik"];
const actionSchema = z.object({
  action: z.enum(allowedActions),
  confirm: z.string().optional()
});
function requiresConfirmation(action) {
  return action === "restart-app" || action === "restart-traefik";
}
const action_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  if ((user == null ? void 0 : user.role) !== "master") {
    throw createError({
      statusCode: 403,
      message: "Master role is required for ops actions"
    });
  }
  const parsed = actionSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid ops action"
    });
  }
  const { action, confirm } = parsed.data;
  if (requiresConfirmation(action) && confirm !== action) {
    throw createError({
      statusCode: 400,
      message: `Confirmation '${action}' is required`
    });
  }
  try {
    const result = await opsAgentFetch(event, "/actions", {
      method: "POST",
      body: { action }
    });
    await audit.opsAction(event, user.id, action, true);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    await audit.opsAction(event, user.id, action, false);
    throw error;
  }
});

const action_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: action_post
}, Symbol.toStringTag, { value: 'Module' }));

const querySchema = z.object({
  container: z.enum(["app", "traefik"]).default("app"),
  tail: z.coerce.number().int().min(1).max(500).default(200)
});
const logs_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  const parsed = querySchema.safeParse(getQuery$1(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid ops log query"
    });
  }
  return {
    success: true,
    data: await opsAgentFetch(event, "/logs", { query: parsed.data })
  };
});

const logs_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: logs_get
}, Symbol.toStringTag, { value: 'Module' }));

const summary_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  const config = getOpsAgentConfig(event);
  if (!config.enabled) {
    return {
      success: true,
      data: {
        available: false,
        error: "Ops agent is disabled"
      }
    };
  }
  try {
    const data = await opsAgentFetch(event, "/summary");
    return {
      success: true,
      data: {
        available: true,
        ...data
      }
    };
  } catch (error) {
    return {
      success: true,
      data: {
        available: false,
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
});

const summary_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: summary_get
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$c = defineEventHandler(async (event) => {
  const db = useDatabase();
  const id = parseInt(getRouterParam(event, "id") || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid tier ID" });
  }
  const [existing] = await db.select().from(pricingTiers).where(eq(pricingTiers.id, id));
  if (!existing) {
    throw createError({ statusCode: 404, message: "Tier not found" });
  }
  const existingFeatures = await db.select().from(pricingFeatures).where(eq(pricingFeatures.tierId, id));
  for (const f of existingFeatures) {
    await db.delete(translations).where(like(translations.key, `pricing.feature.${f.id}.%`));
  }
  await db.delete(translations).where(like(translations.key, `pricing.tier.${id}.%`));
  await db.delete(pricingTiers).where(eq(pricingTiers.id, id));
  return {
    success: true,
    data: {}
  };
});

const _id__delete$d = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$c
}, Symbol.toStringTag, { value: 'Module' }));

const updateTierSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  price: z.number().min(0).nullable().optional(),
  currency: z.string().length(3).optional(),
  period: z.enum(["month", "year", "one-time"]).optional(),
  featured: z.boolean().optional(),
  ctaUrl: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
  translations: z.record(z.object({
    name: z.string().max(100),
    description: z.string().max(500),
    ctaText: z.string().max(50)
  })).optional(),
  features: z.array(z.object({
    id: z.number().optional(),
    included: z.boolean().default(true),
    order: z.number().int().min(0).default(0),
    translations: z.record(z.string().max(200)).optional()
  })).optional()
});
const _id__put$a = defineEventHandler(async (event) => {
  const db = useDatabase();
  const id = parseInt(getRouterParam(event, "id") || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid tier ID" });
  }
  const body = await readBody(event);
  const result = updateTierSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, features, price, ...tierData } = result.data;
  const [existing] = await db.select().from(pricingTiers).where(eq(pricingTiers.id, id));
  if (!existing) {
    throw createError({ statusCode: 404, message: "Tier not found" });
  }
  let fallbackName = existing.name;
  if (translations$1) {
    const firstTrans = Object.values(translations$1)[0];
    if (firstTrans == null ? void 0 : firstTrans.name) fallbackName = firstTrans.name;
  }
  const updateData = { ...tierData, name: fallbackName, updatedAt: /* @__PURE__ */ new Date() };
  if (price !== void 0) {
    updateData.price = price !== null ? Math.round(price * 100) : null;
  }
  const [tier] = await db.update(pricingTiers).set(updateData).where(eq(pricingTiers.id, id)).returning();
  if (translations$1) {
    for (const [locale, trans] of Object.entries(translations$1)) {
      const nameKey = `pricing.tier.${id}.name`;
      const existingName = await db.select().from(translations).where(and(eq(translations.key, nameKey), eq(translations.locale, locale))).get();
      if (existingName) {
        await db.update(translations).set({ value: trans.name ? escapeHtml(trans.name) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingName.id));
      } else if (trans.name) {
        await db.insert(translations).values({ locale, key: nameKey, value: escapeHtml(trans.name) });
      }
      const descKey = `pricing.tier.${id}.description`;
      const existingDesc = await db.select().from(translations).where(and(eq(translations.key, descKey), eq(translations.locale, locale))).get();
      if (existingDesc) {
        await db.update(translations).set({ value: trans.description ? escapeHtml(trans.description) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingDesc.id));
      } else if (trans.description) {
        await db.insert(translations).values({ locale, key: descKey, value: escapeHtml(trans.description) });
      }
      const ctaKey = `pricing.tier.${id}.ctaText`;
      const existingCta = await db.select().from(translations).where(and(eq(translations.key, ctaKey), eq(translations.locale, locale))).get();
      if (existingCta) {
        await db.update(translations).set({ value: trans.ctaText ? escapeHtml(trans.ctaText) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingCta.id));
      } else if (trans.ctaText) {
        await db.insert(translations).values({ locale, key: ctaKey, value: escapeHtml(trans.ctaText) });
      }
    }
  }
  if (features !== void 0) {
    const existingFeatures = await db.select().from(pricingFeatures).where(eq(pricingFeatures.tierId, id));
    for (const f of existingFeatures) {
      await db.delete(translations).where(like(translations.key, `pricing.feature.${f.id}.%`));
    }
    await db.delete(pricingFeatures).where(eq(pricingFeatures.tierId, id));
    if (features.length > 0) {
      const insertedFeatures = await db.insert(pricingFeatures).values(
        features.map((f, index) => {
          var _a;
          let fallbackText = "";
          if (f.translations) {
            const firstText = Object.values(f.translations)[0];
            if (firstText) fallbackText = firstText;
          }
          return {
            tierId: id,
            text: fallbackText,
            included: f.included,
            order: (_a = f.order) != null ? _a : index
          };
        })
      ).returning();
      const translationValues = [];
      for (let i = 0; i < insertedFeatures.length; i++) {
        const feature = insertedFeatures[i];
        const originalFeature = features[i];
        if (feature && (originalFeature == null ? void 0 : originalFeature.translations)) {
          for (const [locale, text] of Object.entries(originalFeature.translations)) {
            if (text) {
              translationValues.push({
                locale,
                key: `pricing.feature.${feature.id}.text`,
                value: escapeHtml(text)
              });
            }
          }
        }
      }
      if (translationValues.length > 0) {
        await db.insert(translations).values(translationValues);
      }
    }
  }
  return {
    success: true,
    data: {
      tier
    }
  };
});

const _id__put$b = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$a
}, Symbol.toStringTag, { value: 'Module' }));

const translationsSchema = z.object({
  locale: z.string().min(2).max(5),
  tier: z.object({
    name: z.string().max(100).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
    ctaText: z.string().max(50).nullable().optional()
  }),
  features: z.array(
    z.object({
      featureId: z.number(),
      text: z.string().max(200).nullable()
    })
  ).optional()
});
const translations_put$4 = defineEventHandler(async (event) => {
  const db = useDatabase();
  const id = parseInt(getRouterParam(event, "id") || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid tier ID" });
  }
  const body = await readBody(event);
  const result = translationsSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { locale, tier: tierTranslation, features: featureTranslations } = result.data;
  const [existing] = await db.select().from(pricingTiers).where(eq(pricingTiers.id, id));
  if (!existing) {
    throw createError({ statusCode: 404, message: "Tier not found" });
  }
  if (tierTranslation.name !== void 0) {
    const nameKey = `pricing.tier.${id}.name`;
    const existingName = await db.select().from(translations).where(and(eq(translations.key, nameKey), eq(translations.locale, locale))).get();
    if (existingName) {
      await db.update(translations).set({ value: tierTranslation.name ? escapeHtml(tierTranslation.name) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingName.id));
    } else if (tierTranslation.name) {
      await db.insert(translations).values({ locale, key: nameKey, value: escapeHtml(tierTranslation.name) });
    }
  }
  if (tierTranslation.description !== void 0) {
    const descKey = `pricing.tier.${id}.description`;
    const existingDesc = await db.select().from(translations).where(and(eq(translations.key, descKey), eq(translations.locale, locale))).get();
    if (existingDesc) {
      await db.update(translations).set({ value: tierTranslation.description ? escapeHtml(tierTranslation.description) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingDesc.id));
    } else if (tierTranslation.description) {
      await db.insert(translations).values({ locale, key: descKey, value: escapeHtml(tierTranslation.description) });
    }
  }
  if (tierTranslation.ctaText !== void 0) {
    const ctaKey = `pricing.tier.${id}.ctaText`;
    const existingCta = await db.select().from(translations).where(and(eq(translations.key, ctaKey), eq(translations.locale, locale))).get();
    if (existingCta) {
      await db.update(translations).set({ value: tierTranslation.ctaText ? escapeHtml(tierTranslation.ctaText) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingCta.id));
    } else if (tierTranslation.ctaText) {
      await db.insert(translations).values({ locale, key: ctaKey, value: escapeHtml(tierTranslation.ctaText) });
    }
  }
  if (featureTranslations && featureTranslations.length > 0) {
    for (const ft of featureTranslations) {
      const textKey = `pricing.feature.${ft.featureId}.text`;
      const existingText = await db.select().from(translations).where(and(eq(translations.key, textKey), eq(translations.locale, locale))).get();
      if (existingText) {
        await db.update(translations).set({ value: ft.text ? escapeHtml(ft.text) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingText.id));
      } else if (ft.text) {
        await db.insert(translations).values({ locale, key: textKey, value: escapeHtml(ft.text) });
      }
    }
  }
  return {
    success: true,
    data: {}
  };
});

const translations_put$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: translations_put$4
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$o = defineEventHandler(async () => {
  const db = useDatabase();
  const tiers = await db.select().from(pricingTiers).orderBy(asc(pricingTiers.order));
  const allTranslations = await db.select().from(translations).where(like(translations.key, "pricing.%"));
  const tiersWithFeatures = await Promise.all(
    tiers.map(async (tier) => {
      const features = await db.select().from(pricingFeatures).where(eq(pricingFeatures.tierId, tier.id)).orderBy(asc(pricingFeatures.order));
      const tierTranslations = {};
      const nameKey = `pricing.tier.${tier.id}.name`;
      const descKey = `pricing.tier.${tier.id}.description`;
      const ctaKey = `pricing.tier.${tier.id}.ctaText`;
      const tierTrans = allTranslations.filter((t) => t.key.startsWith(`pricing.tier.${tier.id}.`));
      const tierLocales = [...new Set(tierTrans.map((t) => t.locale))];
      for (const locale of tierLocales) {
        const name = allTranslations.find((t) => t.key === nameKey && t.locale === locale);
        const desc = allTranslations.find((t) => t.key === descKey && t.locale === locale);
        const cta = allTranslations.find((t) => t.key === ctaKey && t.locale === locale);
        tierTranslations[locale] = {
          name: (name == null ? void 0 : name.value) || null,
          description: (desc == null ? void 0 : desc.value) || null,
          ctaText: (cta == null ? void 0 : cta.value) || null
        };
      }
      const featuresWithTranslations = features.map((f) => {
        const featureTextKey = `pricing.feature.${f.id}.text`;
        const featureTrans = allTranslations.filter((t) => t.key === featureTextKey);
        const translations = {};
        for (const ft of featureTrans) {
          translations[ft.locale] = ft.value;
        }
        return {
          ...f,
          translations
        };
      });
      return {
        ...tier,
        // Convert price from cents to dollars for display
        price: tier.price !== null ? tier.price / 100 : null,
        translations: tierTranslations,
        features: featuresWithTranslations
      };
    })
  );
  return {
    success: true,
    data: tiersWithFeatures
  };
});

const index_get$p = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$o
}, Symbol.toStringTag, { value: 'Module' }));

const createTierSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  price: z.number().min(0).nullable().optional(),
  currency: z.string().length(3).default("USD"),
  period: z.enum(["month", "year", "one-time"]).default("month"),
  featured: z.boolean().default(false),
  ctaUrl: z.string().max(200).default("/contact"),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  translations: z.record(z.object({
    name: z.string().max(100),
    description: z.string().max(500),
    ctaText: z.string().max(50)
  })).optional(),
  features: z.array(z.object({
    included: z.boolean().default(true),
    order: z.number().int().min(0).default(0),
    translations: z.record(z.string().max(200)).optional()
  })).optional()
});
const index_post$a = defineEventHandler(async (event) => {
  const db = useDatabase();
  const body = await readBody(event);
  const result = createTierSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, features, price, ...tierData } = result.data;
  let fallbackName = "New Tier";
  if (translations$1) {
    const firstTrans = Object.values(translations$1)[0];
    if (firstTrans == null ? void 0 : firstTrans.name) fallbackName = firstTrans.name;
  }
  const [tier] = await db.insert(pricingTiers).values({
    ...tierData,
    name: fallbackName,
    description: null,
    ctaText: null,
    price: price !== null && price !== void 0 ? Math.round(price * 100) : null
  }).returning();
  if (!tier) {
    throw createError({ statusCode: 500, message: "Failed to create tier" });
  }
  const translationValues = [];
  if (translations$1) {
    for (const [locale, trans] of Object.entries(translations$1)) {
      if (trans.name) {
        translationValues.push({
          locale,
          key: `pricing.tier.${tier.id}.name`,
          value: escapeHtml(trans.name)
        });
      }
      if (trans.description) {
        translationValues.push({
          locale,
          key: `pricing.tier.${tier.id}.description`,
          value: escapeHtml(trans.description)
        });
      }
      if (trans.ctaText) {
        translationValues.push({
          locale,
          key: `pricing.tier.${tier.id}.ctaText`,
          value: escapeHtml(trans.ctaText)
        });
      }
    }
  }
  if (features && features.length > 0) {
    const insertedFeatures = await db.insert(pricingFeatures).values(
      features.map((f, index) => {
        var _a;
        let fallbackText = "";
        if (f.translations) {
          const firstText = Object.values(f.translations)[0];
          if (firstText) fallbackText = firstText;
        }
        return {
          tierId: tier.id,
          text: fallbackText,
          included: f.included,
          order: (_a = f.order) != null ? _a : index
        };
      })
    ).returning();
    for (let i = 0; i < insertedFeatures.length; i++) {
      const feature = insertedFeatures[i];
      const originalFeature = features[i];
      if (feature && (originalFeature == null ? void 0 : originalFeature.translations)) {
        for (const [locale, text] of Object.entries(originalFeature.translations)) {
          if (text) {
            translationValues.push({
              locale,
              key: `pricing.feature.${feature.id}.text`,
              value: escapeHtml(text)
            });
          }
        }
      }
    }
  }
  if (translationValues.length > 0) {
    await db.insert(translations).values(translationValues);
  }
  return {
    success: true,
    data: {
      tier
    }
  };
});

const index_post$b = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post$a
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$a = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: 400,
      message: "Valid role ID required"
    });
  }
  const roleId = parseInt(id);
  const currentUser = event.context.user;
  await requirePermission(currentUser, "roles");
  const db = useDatabase();
  const existingRole = db.select().from(roles).where(eq(roles.id, roleId)).get();
  if (!existingRole) {
    throw createError({
      statusCode: 404,
      message: "Role not found"
    });
  }
  if (existingRole.isBuiltIn) {
    throw createError({
      statusCode: 403,
      message: "Cannot delete built-in roles"
    });
  }
  const usersWithRole = db.select({ id: users.id }).from(users).where(eq(users.roleId, roleId)).limit(1).get();
  if (usersWithRole) {
    throw createError({
      statusCode: 409,
      message: "Cannot delete role with assigned users. Reassign users first."
    });
  }
  db.delete(roles).where(eq(roles.id, roleId)).run();
  clearRolePermissionsCache();
  await audit.roleDelete(event, currentUser.id, roleId, existingRole.name);
  return {
    success: true,
    data: null
  };
});

const _id__delete$b = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$a
}, Symbol.toStringTag, { value: 'Module' }));

const _id__put$8 = defineEventHandler(async (event) => {
  var _a;
  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: 400,
      message: "Valid role ID required"
    });
  }
  const roleId = parseInt(id);
  const currentUser = event.context.user;
  await requirePermission(currentUser, "roles");
  const body = await readBody(event);
  const result = updateRoleSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: ((_a = result.error.issues[0]) == null ? void 0 : _a.message) || "Invalid input"
    });
  }
  const { name, slug, description, permissions, color, icon } = result.data;
  const db = useDatabase();
  const existingRole = db.select().from(roles).where(eq(roles.id, roleId)).get();
  if (!existingRole) {
    throw createError({
      statusCode: 404,
      message: "Role not found"
    });
  }
  if (existingRole.slug === "master") {
    throw createError({
      statusCode: 403,
      message: "Cannot modify master role"
    });
  }
  if (name && name !== existingRole.name) {
    const existingByName = db.select().from(roles).where(and(eq(roles.name, name), ne(roles.id, roleId))).get();
    if (existingByName) {
      throw createError({
        statusCode: 409,
        message: "A role with this name already exists"
      });
    }
  }
  if (slug && slug !== existingRole.slug) {
    const existingBySlug = db.select().from(roles).where(and(eq(roles.slug, slug), ne(roles.id, roleId))).get();
    if (existingBySlug) {
      throw createError({
        statusCode: 409,
        message: "A role with this slug already exists"
      });
    }
  }
  const updates = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (name !== void 0) updates.name = name;
  if (slug !== void 0) updates.slug = slug;
  if (description !== void 0) updates.description = description;
  if (permissions !== void 0) {
    updates.permissions = JSON.stringify(permissions);
    updates.level = calculateLevel(permissions);
  }
  if (color !== void 0) updates.color = color;
  if (icon !== void 0) updates.icon = icon;
  db.update(roles).set(updates).where(eq(roles.id, roleId)).run();
  clearRolePermissionsCache();
  const updatedRole = db.select().from(roles).where(eq(roles.id, roleId)).get();
  const changesForLog = { ...updates };
  delete changesForLog.updatedAt;
  if (Object.keys(changesForLog).length > 0) {
    await audit.roleUpdate(event, currentUser.id, roleId, updatedRole.name, changesForLog);
  }
  const role = {
    ...updatedRole,
    permissions: safeJsonParse(updatedRole.permissions, {})
  };
  return {
    success: true,
    data: {
      role
    },
    role
  };
});

const _id__put$9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$8
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$m = defineEventHandler(async (event) => {
  const currentUser = event.context.user;
  await requirePermission(currentUser, "roles");
  const db = useDatabase();
  const rolesData = db.select({
    id: roles.id,
    name: roles.name,
    slug: roles.slug,
    description: roles.description,
    permissions: roles.permissions,
    level: roles.level,
    isBuiltIn: roles.isBuiltIn,
    color: roles.color,
    icon: roles.icon,
    createdAt: roles.createdAt,
    updatedAt: roles.updatedAt
  }).from(roles).orderBy(roles.level).all();
  const userCounts = db.select({
    roleId: users.roleId,
    count: sql`count(*)`.as("count")
  }).from(users).groupBy(users.roleId).all();
  const countMap = new Map(userCounts.map((uc) => [uc.roleId, uc.count]));
  const roles$1 = rolesData.map((role) => ({
    ...role,
    permissions: safeJsonParse(role.permissions, {}),
    userCount: countMap.get(role.id) || 0
  }));
  roles$1.sort((a, b) => b.level - a.level);
  return {
    success: true,
    data: {
      roles: roles$1
    },
    roles: roles$1
  };
});

const index_get$n = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$m
}, Symbol.toStringTag, { value: 'Module' }));

const index_post$8 = defineEventHandler(async (event) => {
  var _a;
  const currentUser = event.context.user;
  await requirePermission(currentUser, "roles");
  const body = await readBody(event);
  const result = createRoleSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: ((_a = result.error.issues[0]) == null ? void 0 : _a.message) || "Invalid input"
    });
  }
  const { name, slug, description, permissions, color, icon } = result.data;
  const db = useDatabase();
  const existingByName = db.select().from(roles).where(eq(roles.name, name)).get();
  if (existingByName) {
    throw createError({
      statusCode: 409,
      message: "A role with this name already exists"
    });
  }
  const existingBySlug = db.select().from(roles).where(eq(roles.slug, slug)).get();
  if (existingBySlug) {
    throw createError({
      statusCode: 409,
      message: "A role with this slug already exists"
    });
  }
  const level = calculateLevel(permissions);
  const newRole = db.insert(roles).values({
    name,
    slug,
    description: description || null,
    permissions: JSON.stringify(permissions),
    level,
    isBuiltIn: false,
    color: color || "secondary",
    icon: icon || "pencil"
  }).returning().get();
  clearRolePermissionsCache();
  await audit.roleCreate(event, currentUser.id, newRole.id, newRole.name, newRole.slug);
  const role = {
    ...newRole,
    permissions: safeJsonParse(newRole.permissions, {}),
    userCount: 0
  };
  return {
    success: true,
    data: {
      role
    },
    role
  };
});

const index_post$9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post$8
}, Symbol.toStringTag, { value: 'Module' }));

const settings_get = defineEventHandler(async (event) => {
  var _a, _b;
  requireAdmin((_a = event.context.user) == null ? void 0 : _a.role);
  const settingsMap = buildSettingsMap();
  const grouped = buildGroupedSettings(settingsMap, {
    includeSecrets: true,
    viewerRole: (_b = event.context.user) == null ? void 0 : _b.role
  });
  return {
    success: true,
    data: grouped
  };
});

const settings_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: settings_get
}, Symbol.toStringTag, { value: 'Module' }));

const ALLOWED_SETTINGS_KEYS = new Set(config.settings.map((setting) => setting.key));
const updateSchema$2 = z.record(z.string(), z.string().nullable());
const settings_put = defineEventHandler(async (event) => {
  var _a, _b;
  requireAdmin((_a = event.context.user) == null ? void 0 : _a.role);
  const body = await readBody(event);
  const result = updateSchema$2.safeParse(body);
  if (!result.success) {
    throw createApiError(400, "admin.settings.invalidBody", {
      validation: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code
      }))
    });
  }
  const updates = result.data;
  const invalidKeys = Object.keys(updates).filter((key) => !ALLOWED_SETTINGS_KEYS.has(key));
  if (invalidKeys.length > 0) {
    throw createApiError(400, "admin.settings.invalidKeys", { invalidKeys });
  }
  const changes = transactionSync((db) => {
    const updated = [];
    const created = [];
    const skipped = [];
    const secretPolicy = {};
    for (const [key, value] of Object.entries(updates)) {
      const definition = getSettingDefinition(key);
      if (!definition) {
        continue;
      }
      const isSecret = isSecretSettingDefinition(definition);
      const prepared = normalizeSettingValueForStorage(key, value);
      const existing = db.select().from(settings).where(eq(settings.key, key)).get();
      if (isSecret) {
        if (prepared.value === SECRET_MASK_VALUE || prepared.value === "") {
          skipped.push(key);
          continue;
        }
      }
      if (existing && isSecret && prepared.value !== null) {
        const existingPlain = existing.value ? isEncryptedSecretValue(existing.value) ? decryptSecretValue(existing.value) : existing.value : null;
        const incomingPlain = (value == null ? void 0 : value.trim()) || null;
        if (existingPlain === incomingPlain) {
          skipped.push(key);
          continue;
        }
      }
      if (existing && !isSecret && existing.value === prepared.value) {
        skipped.push(key);
        continue;
      }
      if (existing) {
        db.update(settings).set({
          value: prepared.value,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(settings.key, key)).run();
        updated.push(key);
      } else {
        db.insert(settings).values({
          key,
          value: prepared.value,
          type: "string",
          group: definition.group
        }).run();
        created.push(key);
      }
      if (isSecret) {
        const configured = ((value == null ? void 0 : value.trim().length) || 0) > 0;
        secretPolicy[key] = { configured };
      }
    }
    return { updated, created, skipped, secretPolicy };
  });
  if ((_b = event.context.user) == null ? void 0 : _b.id) {
    await audit.settingsUpdate(event, event.context.user.id, {
      updatedKeys: changes.updated,
      createdKeys: changes.created,
      skippedKeys: changes.skipped,
      secretPolicy: changes.secretPolicy
    });
  }
  return {
    success: true,
    data: changes
  };
});

const settings_put$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: settings_put
}, Symbol.toStringTag, { value: 'Module' }));

const stats_get = defineEventHandler(async (_event) => {
  var _a, _b, _c;
  const db = useDatabase();
  const portfolioResult = db.select({ count: count() }).from(portfolioItems).get();
  const contactsResult = db.select({ count: count() }).from(contactSubmissions).get();
  const unreadResult = db.select({ count: count() }).from(contactSubmissions).where(eq(contactSubmissions.read, false)).get();
  return {
    success: true,
    data: {
      portfolioItems: (_a = portfolioResult == null ? void 0 : portfolioResult.count) != null ? _a : 0,
      contactSubmissions: (_b = contactsResult == null ? void 0 : contactsResult.count) != null ? _b : 0,
      unreadMessages: (_c = unreadResult == null ? void 0 : unreadResult.count) != null ? _c : 0
    }
  };
});

const stats_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: stats_get
}, Symbol.toStringTag, { value: 'Module' }));

function redactString(value) {
  return value.replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[redacted]").replace(/\b([A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g, "[redacted-jwt]").replace(/([?&](?:token|key|secret|password|signature|auth|session)=)[^&\s]+/gi, "$1[redacted]").replace(/\b((?:token|key|secret|password|signature|authorization|cookie|session)[\w-]*\s*[:=]\s*)[^\s,;"']+/gi, "$1[redacted]").replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]");
}
function redactValue(value, key = "") {
  const sensitiveKey = /(token|secret|password|authorization|cookie|session|email)/i.test(key);
  if (value === null || value === void 0) return value;
  if (typeof value === "string") return sensitiveKey ? "[redacted]" : redactString(value);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redactValue(item, key));
  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      redactValue(entryValue, entryKey)
    ])
  );
}
function getOpsProblems(ops) {
  if (!ops || ops.available === false) {
    return [typeof (ops == null ? void 0 : ops.error) === "string" ? ops.error : "Ops agent unavailable"];
  }
  const problems = [];
  const agent = ops.agent;
  if ((agent == null ? void 0 : agent.dockerSocket) === false) problems.push("Docker socket is unavailable to the ops agent");
  const containers = Array.isArray(ops.containers) ? ops.containers : [];
  for (const container of containers) {
    const name = String(container.name || "container");
    const state = String(container.state || "");
    const health = typeof container.health === "string" ? container.health : "";
    const restartCount = typeof container.restartCount === "number" ? container.restartCount : 0;
    if (state && state !== "running") problems.push(`${name} is ${state}`);
    if (restartCount > 0) problems.push(`${name} restarted ${restartCount} time(s)`);
    if (health && !["healthy", "starting"].includes(health)) problems.push(`${name} health is ${health}`);
  }
  const database = ops.database;
  const migrations = database == null ? void 0 : database.migrations;
  const pendingMigrations = typeof (migrations == null ? void 0 : migrations.pending) === "number" ? migrations.pending : 0;
  if (pendingMigrations > 0) problems.push(`${pendingMigrations} database migration(s) pending`);
  if (typeof (migrations == null ? void 0 : migrations.error) === "string") problems.push(`Migration journal: ${migrations.error}`);
  const file = database == null ? void 0 : database.file;
  const backupDir = database == null ? void 0 : database.backupDir;
  const storage = ops.storage;
  const uploads = storage == null ? void 0 : storage.uploads;
  const temp = storage == null ? void 0 : storage.temp;
  if ((file == null ? void 0 : file.writable) === false) problems.push("SQLite database is not writable");
  if ((backupDir == null ? void 0 : backupDir.writable) === false) problems.push("Backup directory is not writable");
  if ((uploads == null ? void 0 : uploads.writable) === false) problems.push("Uploads directory is not writable");
  if ((temp == null ? void 0 : temp.writable) === false) problems.push("Temp directory is not writable");
  return problems;
}
async function getOpsSummary(event) {
  const config = getOpsAgentConfig(event);
  if (!config.enabled) {
    return {
      available: false,
      error: "Ops agent is disabled"
    };
  }
  try {
    const data = await opsAgentFetch(event, "/summary");
    return {
      available: true,
      ...data
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
async function getOpsContainerLogs(event) {
  const config = getOpsAgentConfig(event);
  if (!config.enabled) {
    return {
      app: { available: false, error: "Ops agent is disabled" },
      traefik: { available: false, error: "Ops agent is disabled" }
    };
  }
  const load = async (container) => {
    try {
      return await opsAgentFetch(event, "/logs", { query: { container, tail: 250 } });
    } catch (error) {
      return {
        available: false,
        container,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };
  const [app, traefik] = await Promise.all([load("app"), load("traefik")]);
  return { app, traefik };
}
function getAuditSummary(limit = 50) {
  var _a, _b, _c;
  const db = useDatabase();
  const totalResult = db.select({ count: count() }).from(auditLogs).get();
  const total = (_a = totalResult == null ? void 0 : totalResult.count) != null ? _a : 0;
  const recent = db.select({
    action: auditLogs.action,
    success: auditLogs.success,
    details: auditLogs.details,
    createdAt: auditLogs.createdAt
  }).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).all();
  const actionCounts = db.select({
    action: auditLogs.action,
    count: count()
  }).from(auditLogs).groupBy(auditLogs.action).all();
  const failedCount = (_c = (_b = db.select({ count: count() }).from(auditLogs).where(eq(auditLogs.success, false)).get()) == null ? void 0 : _b.count) != null ? _c : 0;
  return {
    total,
    failed: failedCount,
    byAction: actionCounts,
    recent: recent.map((log) => {
      var _a2;
      return {
        action: log.action,
        success: log.success,
        details: safeJsonParseOrNull(log.details),
        createdAt: (_a2 = log.createdAt) == null ? void 0 : _a2.toISOString()
      };
    })
  };
}
const supportBundle_get = defineEventHandler(async (event) => {
  var _a, _b, _c, _d;
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  try {
    const [health, monitoring, operations, containerLogs] = await Promise.all([
      getAdminHealthData(event),
      getNetdataSummary(event),
      getOpsSummary(event),
      getOpsContainerLogs(event)
    ]);
    const bundle = {
      bundleVersion: 2,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      generatedBy: {
        userId: (_a = user == null ? void 0 : user.id) != null ? _a : null,
        role: (_b = user == null ? void 0 : user.role) != null ? _b : null
      },
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptimeSeconds: Math.floor(process.uptime()),
        cwd: process.cwd(),
        env: "development"
      },
      problemSummary: getOpsProblems(operations),
      health,
      monitoring,
      operations,
      appLogs: {
        entries: getRecentLogs(250),
        buffer: getBufferStats()
      },
      containerLogs,
      audit: getAuditSummary()
    };
    await audit.supportBundleExport(event, (_c = user == null ? void 0 : user.id) != null ? _c : 0, true);
    return {
      success: true,
      data: redactValue(bundle)
    };
  } catch (error) {
    await audit.supportBundleExport(event, (_d = user == null ? void 0 : user.id) != null ? _d : 0, false);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : "Failed to build support bundle"
    });
  }
});

const supportBundle_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: supportBundle_get
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$8 = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: "Invalid ID"
    });
  }
  const existing = db.select().from(teamMembers).where(eq(teamMembers.id, id)).get();
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: "Team member not found"
    });
  }
  db.delete(translations).where(like(translations.key, `team.${id}.%`)).run();
  db.delete(teamMembers).where(eq(teamMembers.id, id)).run();
  return {
    success: true,
    data: {}
  };
});

const _id__delete$9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$8
}, Symbol.toStringTag, { value: 'Module' }));

const _id__get$2 = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: "Invalid ID"
    });
  }
  const member = db.select().from(teamMembers).where(eq(teamMembers.id, id)).get();
  if (!member) {
    throw createError({
      statusCode: 404,
      message: "Team member not found"
    });
  }
  const translations = db.select().from(teamMemberTranslations).where(eq(teamMemberTranslations.memberId, id)).all();
  const translationsByLocale = translations.reduce((acc, t) => {
    acc[t.locale] = {
      position: t.position,
      bio: t.bio
    };
    return acc;
  }, {});
  return {
    success: true,
    data: {
      ...member,
      socialLinks: safeJsonParseOrNull(member.socialLinks),
      translations: translationsByLocale
    }
  };
});

const _id__get$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__get$2
}, Symbol.toStringTag, { value: 'Module' }));

const updateMemberSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(1).max(100).optional(),
  photoUrl: z.string().max(500).nullish(),
  hoverPhotoUrl: z.string().max(500).nullish(),
  email: z.string().email().max(255).nullish(),
  phone: z.string().max(30).nullish(),
  department: z.string().max(50).nullish(),
  socialLinks: z.record(z.string()).nullish(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
  translations: z.record(z.object({
    position: z.string().max(100),
    bio: z.string().max(2e3)
  })).optional()
});
const _id__put$6 = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const result = updateMemberSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const existing = db.select().from(teamMembers).where(eq(teamMembers.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Team member not found" });
  }
  const { translations: translations$1, ...data } = result.data;
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = db.select().from(teamMembers).where(and(eq(teamMembers.slug, data.slug), ne(teamMembers.id, id))).get();
    if (slugExists) {
      throw createError({ statusCode: 409, message: "Slug already exists" });
    }
  }
  const updateValues = {};
  if (data.slug !== void 0) updateValues.slug = data.slug;
  if (data.name !== void 0) updateValues.name = escapeHtml(data.name);
  if (data.photoUrl !== void 0) updateValues.photoUrl = data.photoUrl;
  if (data.hoverPhotoUrl !== void 0) updateValues.hoverPhotoUrl = data.hoverPhotoUrl;
  if (data.email !== void 0) updateValues.email = data.email;
  if (data.phone !== void 0) updateValues.phone = data.phone;
  if (data.department !== void 0) updateValues.department = data.department;
  if (data.socialLinks !== void 0) updateValues.socialLinks = data.socialLinks ? JSON.stringify(data.socialLinks) : null;
  if (data.order !== void 0) updateValues.order = data.order;
  if (data.published !== void 0) updateValues.published = data.published;
  if (Object.keys(updateValues).length > 0) {
    db.update(teamMembers).set(updateValues).where(eq(teamMembers.id, id)).run();
  }
  if (translations$1) {
    for (const [locale, trans] of Object.entries(translations$1)) {
      const positionKey = `team.${id}.position`;
      const bioKey = `team.${id}.bio`;
      const existingPosition = db.select().from(translations).where(and(eq(translations.key, positionKey), eq(translations.locale, locale))).get();
      if (existingPosition) {
        db.update(translations).set({ value: trans.position ? escapeHtml(trans.position) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingPosition.id)).run();
      } else if (trans.position) {
        db.insert(translations).values({ locale, key: positionKey, value: escapeHtml(trans.position) }).run();
      }
      const existingBio = db.select().from(translations).where(and(eq(translations.key, bioKey), eq(translations.locale, locale))).get();
      if (existingBio) {
        db.update(translations).set({ value: trans.bio ? escapeHtml(trans.bio) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingBio.id)).run();
      } else if (trans.bio) {
        db.insert(translations).values({ locale, key: bioKey, value: escapeHtml(trans.bio) }).run();
      }
    }
  }
  return {
    success: true,
    data: {}
  };
});

const _id__put$7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$6
}, Symbol.toStringTag, { value: 'Module' }));

const updateTranslationSchema = z.object({
  locale: z.string().min(2).max(5),
  position: z.string().max(100).optional().nullable(),
  bio: z.string().max(2e3).optional().nullable()
});
const translations_put$2 = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: "Invalid ID"
    });
  }
  const body = await readBody(event);
  const result = updateTranslationSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { locale, position, bio } = result.data;
  const member = db.select().from(teamMembers).where(eq(teamMembers.id, id)).get();
  if (!member) {
    throw createError({
      statusCode: 404,
      message: "Team member not found"
    });
  }
  if (position !== void 0) {
    const positionKey = `team.${id}.position`;
    const existingPosition = db.select().from(translations).where(and(eq(translations.key, positionKey), eq(translations.locale, locale))).get();
    if (existingPosition) {
      db.update(translations).set({ value: position ? escapeHtml(position) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingPosition.id)).run();
    } else if (position) {
      db.insert(translations).values({ locale, key: positionKey, value: escapeHtml(position) }).run();
    }
  }
  if (bio !== void 0) {
    const bioKey = `team.${id}.bio`;
    const existingBio = db.select().from(translations).where(and(eq(translations.key, bioKey), eq(translations.locale, locale))).get();
    if (existingBio) {
      db.update(translations).set({ value: bio ? escapeHtml(bio) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingBio.id)).run();
    } else if (bio) {
      db.insert(translations).values({ locale, key: bioKey, value: escapeHtml(bio) }).run();
    }
  }
  return {
    success: true,
    data: {}
  };
});

const translations_put$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: translations_put$2
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$k = defineEventHandler(async () => {
  const db = useDatabase();
  const defaultLocale = config.defaultLocale;
  const members = db.select().from(teamMembers).orderBy(asc(teamMembers.order), asc(teamMembers.name)).all();
  const allTranslations = db.select().from(translations).where(like(translations.key, "team.%")).all();
  return {
    success: true,
    data: members.map((member) => {
      var _a, _b;
      const translationsMap = {};
      const positionKey = `team.${member.id}.position`;
      const bioKey = `team.${member.id}.bio`;
      const locales = new Set(
        allTranslations.filter((t) => t.key === positionKey || t.key === bioKey).map((t) => t.locale)
      );
      locales.forEach((locale) => {
        var _a2, _b2;
        const position = ((_a2 = allTranslations.find((t) => t.key === positionKey && t.locale === locale)) == null ? void 0 : _a2.value) || null;
        const bio = ((_b2 = allTranslations.find((t) => t.key === bioKey && t.locale === locale)) == null ? void 0 : _b2.value) || null;
        translationsMap[locale] = { position, bio };
      });
      const defaultPosition = ((_a = translationsMap[defaultLocale]) == null ? void 0 : _a.position) || "";
      const defaultBio = ((_b = translationsMap[defaultLocale]) == null ? void 0 : _b.bio) || "";
      return {
        ...member,
        position: defaultPosition,
        bio: defaultBio,
        socialLinks: safeJsonParseOrNull(member.socialLinks),
        translations: translationsMap
      };
    })
  };
});

const index_get$l = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$k
}, Symbol.toStringTag, { value: 'Module' }));

const createMemberSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  photoUrl: z.string().max(500).nullish(),
  hoverPhotoUrl: z.string().max(500).nullish(),
  email: z.string().email().max(255).nullish(),
  phone: z.string().max(30).nullish(),
  department: z.string().max(50).nullish(),
  socialLinks: z.record(z.string()).nullish(),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  translations: z.record(z.object({
    position: z.string().max(100),
    bio: z.string().max(2e3)
  })).optional()
});
const index_post$6 = defineEventHandler(async (event) => {
  const db = useDatabase();
  const body = await readBody(event);
  const result = createMemberSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, ...data } = result.data;
  const existing = db.select().from(teamMembers).where(eq(teamMembers.slug, data.slug)).get();
  if (existing) {
    throw createError({
      statusCode: 409,
      message: "Slug already exists"
    });
  }
  const [member] = db.insert(teamMembers).values({
    slug: data.slug,
    name: escapeHtml(data.name),
    photoUrl: data.photoUrl || null,
    hoverPhotoUrl: data.hoverPhotoUrl || null,
    email: data.email || null,
    phone: data.phone || null,
    department: data.department || null,
    socialLinks: data.socialLinks ? JSON.stringify(data.socialLinks) : null,
    order: data.order,
    published: data.published
  }).returning();
  if (!member) {
    throw createError({ statusCode: 500, message: "Failed to create team member" });
  }
  if (translations$1) {
    const translationValues = [];
    for (const [locale, trans] of Object.entries(translations$1)) {
      if (trans.position) {
        translationValues.push({
          locale,
          key: `team.${member.id}.position`,
          value: escapeHtml(trans.position)
        });
      }
      if (trans.bio) {
        translationValues.push({
          locale,
          key: `team.${member.id}.bio`,
          value: escapeHtml(trans.bio)
        });
      }
    }
    if (translationValues.length > 0) {
      db.insert(translations).values(translationValues).run();
    }
  }
  return {
    success: true,
    data: {
      member: {
        ...member,
        socialLinks: safeJsonParseOrNull(member.socialLinks)
      }
    }
  };
});

const index_post$7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post$6
}, Symbol.toStringTag, { value: 'Module' }));

const execFileAsync = promisify(execFile);
const terminalCommandSchema = z.object({
  command: z.string().trim().min(1).max(120)
});
function normalizeOutput(stdout, stderr) {
  const combined = [stdout.trimEnd(), stderr.trimEnd()].filter(Boolean).join("\n");
  return combined || "(no output)";
}
const terminal_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  const parsed = terminalCommandSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid terminal command"
    });
  }
  const command = parsed.data.command;
  const allowedCommand = allowedTerminalCommands[command];
  if (!allowedCommand) {
    await audit.terminalCommand(event, user.id, command, false);
    throw createError({
      statusCode: 400,
      message: "Command is not allowed"
    });
  }
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const startTime = Date.now();
  try {
    if (allowedCommand.output) {
      const output = await allowedCommand.output();
      await audit.terminalCommand(event, user.id, command, true);
      return {
        success: true,
        data: {
          command,
          output,
          exitCode: 0,
          durationMs: Date.now() - startTime,
          startedAt
        }
      };
    }
    const result = await execFileAsync(allowedCommand.file, allowedCommand.args || [], {
      cwd: process.cwd(),
      timeout: 5e3,
      maxBuffer: 64 * 1024,
      shell: false
    });
    await audit.terminalCommand(event, user.id, command, true);
    return {
      success: true,
      data: {
        command,
        output: normalizeOutput(result.stdout, result.stderr),
        exitCode: 0,
        durationMs: Date.now() - startTime,
        startedAt
      }
    };
  } catch (error) {
    const execError = error;
    await audit.terminalCommand(event, user.id, command, false);
    return {
      success: true,
      data: {
        command,
        output: normalizeOutput(
          execError.stdout || "",
          execError.stderr || execError.message || execError.signal || "Command failed"
        ),
        exitCode: typeof execError.code === "number" ? execError.code : 1,
        durationMs: Date.now() - startTime,
        startedAt
      }
    };
  }
});

const terminal_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: terminal_post
}, Symbol.toStringTag, { value: 'Module' }));

const commands_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  await requireAdminSectionAccess(user, "health");
  return {
    success: true,
    data: {
      commands: terminalCommandOptions
    }
  };
});

const commands_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: commands_get
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$6 = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const existing = db.select().from(testimonials).where(eq(testimonials.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Testimonial not found" });
  }
  db.delete(testimonials).where(eq(testimonials.id, id)).run();
  return {
    success: true,
    data: {}
  };
});

const _id__delete$7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$6
}, Symbol.toStringTag, { value: 'Module' }));

const updateTestimonialSchema = z.object({
  authorName: z.string().min(1).max(100).optional(),
  authorPhoto: z.string().max(500).nullish(),
  rating: z.number().int().min(1).max(5).optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
  translations: z.record(z.object({
    quote: z.string().max(2e3),
    authorTitle: z.string().max(200)
  })).optional()
});
const _id__put$4 = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const result = updateTestimonialSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const existing = db.select().from(testimonials).where(eq(testimonials.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Testimonial not found" });
  }
  const { translations: translations$1, ...data } = result.data;
  const updateValues = {};
  if (data.authorName !== void 0) updateValues.authorName = data.authorName;
  if (data.authorPhoto !== void 0) updateValues.authorPhotoUrl = data.authorPhoto;
  if (data.rating !== void 0) updateValues.rating = data.rating;
  if (data.order !== void 0) updateValues.order = data.order;
  if (data.published !== void 0) updateValues.published = data.published;
  if (Object.keys(updateValues).length > 0) {
    db.update(testimonials).set(updateValues).where(eq(testimonials.id, id)).run();
  }
  if (translations$1) {
    for (const [locale, trans] of Object.entries(translations$1)) {
      const quoteKey = `testimonial.${id}.quote`;
      const titleKey = `testimonial.${id}.authorTitle`;
      const existingQuote = db.select().from(translations).where(and(eq(translations.key, quoteKey), eq(translations.locale, locale))).get();
      if (existingQuote) {
        db.update(translations).set({ value: trans.quote || "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingQuote.id)).run();
      } else if (trans.quote) {
        db.insert(translations).values({ locale, key: quoteKey, value: trans.quote }).run();
      }
      const existingTitle = db.select().from(translations).where(and(eq(translations.key, titleKey), eq(translations.locale, locale))).get();
      if (existingTitle) {
        db.update(translations).set({ value: trans.authorTitle || "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingTitle.id)).run();
      } else if (trans.authorTitle) {
        db.insert(translations).values({ locale, key: titleKey, value: trans.authorTitle }).run();
      }
    }
  }
  return {
    success: true,
    data: {}
  };
});

const _id__put$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$4
}, Symbol.toStringTag, { value: 'Module' }));

const translations_put = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const id = parseInt(((_a = event.context.params) == null ? void 0 : _a.id) || "");
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const body = await readBody(event);
  const { locale, quote, authorTitle } = body;
  if (!locale) {
    throw createError({ statusCode: 400, message: "Locale is required" });
  }
  const existing = db.select().from(testimonials).where(eq(testimonials.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Testimonial not found" });
  }
  if (quote) {
    const quoteKey = `testimonial.${id}.quote`;
    const existingQuote = db.select().from(translations).where(and(eq(translations.key, quoteKey), eq(translations.locale, locale))).get();
    if (existingQuote) {
      db.update(translations).set({ value: quote, updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingQuote.id)).run();
    } else {
      db.insert(translations).values({ locale, key: quoteKey, value: quote }).run();
    }
  }
  if (authorTitle) {
    const titleKey = `testimonial.${id}.authorTitle`;
    const existingTitle = db.select().from(translations).where(and(eq(translations.key, titleKey), eq(translations.locale, locale))).get();
    if (existingTitle) {
      db.update(translations).set({ value: authorTitle, updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingTitle.id)).run();
    } else {
      db.insert(translations).values({ locale, key: titleKey, value: authorTitle }).run();
    }
  }
  return {
    success: true,
    data: {}
  };
});

const translations_put$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: translations_put
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$i = defineEventHandler(async () => {
  const db = useDatabase();
  const defaultLocale = config.defaultLocale;
  const testimonials$1 = db.select().from(testimonials).orderBy(testimonials.order).all();
  const allTranslations = db.select().from(translations).where(like(translations.key, "testimonial.%")).all();
  const result = testimonials$1.map((testimonial) => {
    var _a;
    const translationsMap = {};
    const quoteKey = `testimonial.${testimonial.id}.quote`;
    const titleKey = `testimonial.${testimonial.id}.authorTitle`;
    const locales = new Set(allTranslations.filter((t) => t.key === quoteKey || t.key === titleKey).map((t) => t.locale));
    locales.forEach((locale) => {
      var _a2, _b;
      const quote = ((_a2 = allTranslations.find((t) => t.key === quoteKey && t.locale === locale)) == null ? void 0 : _a2.value) || null;
      const authorTitle = ((_b = allTranslations.find((t) => t.key === titleKey && t.locale === locale)) == null ? void 0 : _b.value) || null;
      translationsMap[locale] = { quote, authorTitle };
    });
    const defaultQuote = ((_a = translationsMap[defaultLocale]) == null ? void 0 : _a.quote) || "";
    return {
      ...testimonial,
      quote: defaultQuote,
      translations: translationsMap
    };
  });
  return {
    success: true,
    data: result
  };
});

const index_get$j = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$i
}, Symbol.toStringTag, { value: 'Module' }));

const createTestimonialSchema = z.object({
  authorName: z.string().min(1).max(100),
  authorPhoto: z.string().max(500).nullish(),
  rating: z.number().int().min(1).max(5).default(5),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  translations: z.record(z.object({
    quote: z.string().max(2e3),
    authorTitle: z.string().max(200)
  })).optional()
});
const index_post$4 = defineEventHandler(async (event) => {
  const db = useDatabase();
  const body = await readBody(event);
  const result = createTestimonialSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, ...data } = result.data;
  const insertResult = db.insert(testimonials).values({
    authorName: data.authorName,
    authorTitle: null,
    // No longer stored in main table
    authorPhotoUrl: data.authorPhoto || null,
    rating: data.rating,
    order: data.order,
    published: data.published
  }).run();
  const testimonialId = Number(insertResult.lastInsertRowid);
  if (translations$1) {
    const translationValues = [];
    for (const [locale, trans] of Object.entries(translations$1)) {
      if (trans.quote) {
        translationValues.push({
          locale,
          key: `testimonial.${testimonialId}.quote`,
          value: trans.quote
        });
      }
      if (trans.authorTitle) {
        translationValues.push({
          locale,
          key: `testimonial.${testimonialId}.authorTitle`,
          value: trans.authorTitle
        });
      }
    }
    if (translationValues.length > 0) {
      db.insert(translations).values(translationValues).run();
    }
  }
  return {
    success: true,
    data: {
      id: testimonialId
    }
  };
});

const index_post$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post$4
}, Symbol.toStringTag, { value: 'Module' }));

const translations_get = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const user = event.context.user;
  const isMaster = user && hasRole(user.role, "master");
  const db = useDatabase();
  const rows = db.select().from(translations).orderBy(asc(translations.locale), asc(translations.key)).all();
  const systemTranslations = {};
  const contentTranslations = {};
  for (const row of rows) {
    const isSystem = isSystemKey(row.key);
    const target = isSystem ? systemTranslations : contentTranslations;
    const localeGroup = (_b = target[_a = row.locale]) != null ? _b : target[_a] = [];
    localeGroup.push({
      id: row.id,
      key: row.key,
      value: (_c = row.value) != null ? _c : ""
    });
  }
  const locales = config.locales.map((l) => l.code);
  return {
    success: true,
    data: {
      locales,
      localeNames: Object.fromEntries(config.locales.map((l) => [l.code, l.name])),
      content: contentTranslations,
      // Only include system translations for master users
      system: isMaster ? systemTranslations : null,
      canEditSystem: isMaster
    }
  };
});

const translations_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: translations_get
}, Symbol.toStringTag, { value: 'Module' }));

const translations_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const { locale, key, value } = parseSingleTranslationPayload(await readBody(event));
  if (isSystemKey(key)) {
    if (!hasRole(user.role, "master")) {
      throw createError({
        statusCode: 403,
        message: "Only master users can edit system translations"
      });
    }
  }
  const db = useDatabase();
  const existing = db.select().from(translations).where(and(eq(translations.locale, locale), eq(translations.key, key))).limit(1).all();
  const existingRow = existing[0];
  const isSystem = isSystemKey(key);
  if (existingRow) {
    db.update(translations).set({ value, updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingRow.id)).run();
    translationCache.invalidate(locale);
    if (isSystem) {
      syncSystemTranslationsToFile();
    }
    return {
      success: true,
      data: {
        action: "updated",
        id: existingRow.id
      }
    };
  } else {
    const result = db.insert(translations).values({ locale, key, value }).returning({ id: translations.id }).all();
    translationCache.invalidate(locale);
    if (isSystem) {
      syncSystemTranslationsToFile();
    }
    const newRow = result[0];
    return {
      success: true,
      data: {
        action: "created",
        id: newRow == null ? void 0 : newRow.id
      }
    };
  }
});

const translations_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: translations_post
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$4 = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const id = Number(getRouterParam(event, "id"));
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid ID" });
  }
  const db = useDatabase();
  const existing = db.select().from(translations).where(eq(translations.id, id)).get();
  if (!existing) {
    throw createError({ statusCode: 404, message: "Translation not found" });
  }
  if (isSystemKey(existing.key)) {
    if (!hasRole(user.role, "master")) {
      throw createError({
        statusCode: 403,
        message: "Only master users can delete system translations"
      });
    }
  }
  const isSystem = isSystemKey(existing.key);
  db.delete(translations).where(eq(translations.id, id)).run();
  translationCache.invalidate(existing.locale);
  if (isSystem) {
    syncSystemTranslationsToFile();
  }
  return {
    success: true,
    data: {}
  };
});

const _id__delete$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$4
}, Symbol.toStringTag, { value: 'Module' }));

const batch_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const { key, translations: translations$1, localeErrors } = parseBatchTranslationPayload(await readBody(event));
  if (localeErrors.length > 0) {
    throw createError({
      statusCode: 400,
      message: "Invalid translation locales",
      data: { localeErrors }
    });
  }
  const isSystem = isSystemKey(key);
  if (isSystem && !hasRole(user.role, "master")) {
    throw createError({
      statusCode: 403,
      message: "Only master users can edit system translations"
    });
  }
  const now = /* @__PURE__ */ new Date();
  const results = transactionSync((db) => {
    return translations$1.map(({ locale, value }) => {
      const existingRow = db.select().from(translations).where(and(eq(translations.locale, locale), eq(translations.key, key))).limit(1).get();
      if (existingRow) {
        db.update(translations).set({ value, updatedAt: now }).where(eq(translations.id, existingRow.id)).run();
        return {
          locale,
          action: "updated",
          id: existingRow.id
        };
      }
      const newRow = db.insert(translations).values({ locale, key, value, updatedAt: now }).returning({ id: translations.id }).get();
      return {
        locale,
        action: "created",
        id: newRow == null ? void 0 : newRow.id
      };
    });
  });
  for (const { locale } of translations$1) {
    translationCache.invalidate(locale);
  }
  if (isSystem) {
    syncSystemTranslationsToFile();
  }
  return {
    success: true,
    data: {
      key,
      results
    }
  };
});

const batch_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: batch_post
}, Symbol.toStringTag, { value: 'Module' }));

const users_get = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const currentUser = event.context.user;
  const query = getQuery$1(event);
  const params = parsePaginationParams(query);
  const { limitClause, offsetClause } = paginationClauses(params.page, params.limit);
  const permissions = await getUserPermissions(currentUser);
  if (permissions.users !== true) {
    throw createApiError(403, "admin.users.accessDenied");
  }
  const users$1 = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt
  }).from(users).orderBy(desc(users.createdAt)).limit(limitClause).offset(offsetClause).all();
  const countResult = db.select({ count: sql`count(*)` }).from(users).get();
  const total = (_a = countResult == null ? void 0 : countResult.count) != null ? _a : 0;
  const meta = buildPaginationMeta(total, params.page, params.limit);
  return {
    success: true,
    data: { users: users$1, meta },
    users: users$1,
    meta
  };
});

const users_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: users_get
}, Symbol.toStringTag, { value: 'Module' }));

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
  role: z.enum(USER_ROLES)
});
const users_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const currentUser = event.context.user;
  const result = createUserSchema.safeParse(body);
  if (!result.success) {
    throw createApiError(400, "admin.users.invalidInput", {
      validation: result.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code }))
    });
  }
  const { email, password, name, role } = result.data;
  const permissions = await getUserPermissions(currentUser);
  if (permissions.users !== true) {
    throw createApiError(403, "admin.users.accessDenied");
  }
  const db = useDatabase();
  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    throw createApiError(409, "admin.users.emailExists");
  }
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw createApiError(400, "auth.passwordPolicyFailed", {
      strength: validation.strength
    });
  }
  const passwordHash = hashPassword(password);
  db.insert(users).values({
    email,
    passwordHash,
    name: name || null,
    role
  }).run();
  const newUser = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    createdAt: users.createdAt
  }).from(users).where(eq(users.email, email)).get();
  if (newUser) {
    await audit.userCreate(event, currentUser.id, newUser.id, email, role);
  }
  return {
    success: true,
    data: {
      user: newUser
    },
    user: newUser
  };
});

const users_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: users_post
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete$2 = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) {
    throw createApiError(400, "admin.users.invalidId");
  }
  const userId = parseInt(id);
  const currentUser = event.context.user;
  const permissions = await getUserPermissions(currentUser);
  if (permissions.users !== true) {
    throw createApiError(403, "admin.users.accessDenied");
  }
  if ((currentUser == null ? void 0 : currentUser.id) === userId) {
    throw createApiError(400, "admin.users.cannotDeleteSelf");
  }
  const db = useDatabase();
  const targetUser = db.select().from(users).where(eq(users.id, userId)).get();
  if (!targetUser) {
    throw createApiError(404, "admin.users.notFound");
  }
  await audit.userDelete(event, currentUser.id, userId, targetUser.email);
  db.delete(users).where(eq(users.id, userId)).run();
  return {
    success: true,
    data: null
  };
});

const _id__delete$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete$2
}, Symbol.toStringTag, { value: 'Module' }));

const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  name: z.string().optional().nullable(),
  role: z.enum(USER_ROLES).optional(),
  // Optimistic locking (MED-03)
  expectedVersion: z.string().datetime().optional()
});
const _id__put$2 = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) {
    throw createApiError(400, "admin.users.invalidId");
  }
  const userId = parseInt(id);
  const body = await readBody(event);
  const currentUser = event.context.user;
  const result = updateUserSchema.safeParse(body);
  if (!result.success) {
    throw createApiError(400, "admin.users.invalidInput", {
      validation: result.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code }))
    });
  }
  const { email, password, name, role, expectedVersion } = result.data;
  const db = useDatabase();
  const targetUser = db.select().from(users).where(eq(users.id, userId)).get();
  if (!targetUser) {
    throw createApiError(404, "admin.users.notFound");
  }
  const permissions = await getUserPermissions(currentUser);
  if (permissions.users !== true) {
    throw createApiError(403, "admin.users.accessDenied");
  }
  checkVersion(targetUser.updatedAt, expectedVersion);
  if (email && email !== targetUser.email) {
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      throw createApiError(409, "admin.users.emailExists");
    }
  }
  const updates = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (email !== void 0) updates.email = email;
  if (name !== void 0) updates.name = name;
  if (role !== void 0) updates.role = role;
  if (password) {
    const validation = validatePassword(password);
    if (!validation.valid) {
      throw createApiError(400, "auth.passwordPolicyFailed", {
        strength: validation.strength
      });
    }
    updates.passwordHash = hashPassword(password);
  }
  db.update(users).set(updates).where(eq(users.id, userId)).run();
  if (role && role !== targetUser.role) {
    await audit.roleChange(event, currentUser.id, userId, targetUser.role, role);
  }
  if (password) {
    await audit.passwordChange(event, currentUser.id, userId);
  }
  const changesForLog = { ...updates };
  delete changesForLog.passwordHash;
  delete changesForLog.updatedAt;
  if (Object.keys(changesForLog).length > 0) {
    await audit.userUpdate(event, currentUser.id, userId, changesForLog);
  }
  const updatedUser = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt
  }).from(users).where(eq(users.id, userId)).get();
  const version = versionInfo(updatedUser);
  return {
    success: true,
    data: {
      user: updatedUser,
      ...version
    },
    user: updatedUser,
    // Include version for optimistic locking (MED-03)
    ...version
  };
});

const _id__put$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put$2
}, Symbol.toStringTag, { value: 'Module' }));

const webVitalSchema = z.object({
  name: z.string(),
  value: z.number(),
  rating: z.enum(["good", "needs-improvement", "poor"]),
  delta: z.number()
});
const resourceTimingSchema = z.object({
  name: z.string(),
  type: z.string(),
  duration: z.number(),
  transferSize: z.number(),
  encodedBodySize: z.number(),
  decodedBodySize: z.number()
});
const performanceReportSchema = z.object({
  url: z.string().url(),
  timestamp: z.number(),
  webVitals: z.record(z.string(), webVitalSchema),
  resourceTimings: z.array(resourceTimingSchema),
  serverTimings: z.record(z.string(), z.number()),
  customMarks: z.record(z.string(), z.number()),
  navigationTiming: z.object({
    domContentLoaded: z.number(),
    loadComplete: z.number(),
    firstByte: z.number()
  })
});
const metricsStore = [];
const MAX_STORED_REPORTS = 1e3;
const rateLimitMap = /* @__PURE__ */ new Map();
const RATE_LIMIT_WINDOW_MS = 6e4;
const MAX_REQUESTS_PER_WINDOW = 10;
function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count++;
  return true;
}
const performance_post = defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  if (!checkRateLimit(ip)) {
    throw createError({
      statusCode: 429,
      message: "Too many performance reports. Please try again later."
    });
  }
  const body = await readBody(event);
  const result = performanceReportSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid performance report format",
      data: result.error.flatten()
    });
  }
  const report = result.data;
  const userAgent = getHeader(event, "user-agent") || "unknown";
  metricsStore.push({
    report,
    receivedAt: /* @__PURE__ */ new Date(),
    userAgent,
    ip: ip.substring(0, ip.lastIndexOf(".")) + ".x"
    // Partial IP for privacy
  });
  if (metricsStore.length > MAX_STORED_REPORTS) {
    metricsStore.splice(0, metricsStore.length - MAX_STORED_REPORTS);
  }
  const webVitals = Object.values(report.webVitals);
  const poorVitals = webVitals.filter((v) => v.rating === "poor");
  if (poorVitals.length > 0) {
    console.warn("[PERF] Poor Web Vitals reported:", {
      url: new URL(report.url).pathname,
      poorVitals: poorVitals.map((v) => `${v.name}: ${v.value.toFixed(2)}`).join(", "),
      loadTime: `${report.navigationTiming.loadComplete.toFixed(0)}ms`
    });
  }
  return {
    success: true,
    data: {
      message: "Performance report received"
    }
  };
});
function getStoredMetrics() {
  return metricsStore;
}
function getMetricsSummary() {
  var _a, _b;
  if (metricsStore.length === 0) {
    return { totalReports: 0, averages: {} };
  }
  const vitalSums = {};
  for (const { report } of metricsStore) {
    for (const [name, vital] of Object.entries(report.webVitals)) {
      if (!vitalSums[name]) {
        vitalSums[name] = { sum: 0, count: 0 };
      }
      vitalSums[name].sum += vital.value;
      vitalSums[name].count++;
    }
  }
  const averages = {};
  for (const [name, data] of Object.entries(vitalSums)) {
    averages[name] = data.sum / data.count;
  }
  return {
    totalReports: metricsStore.length,
    averages,
    timeRange: {
      oldest: (_a = metricsStore[0]) == null ? void 0 : _a.receivedAt,
      newest: (_b = metricsStore[metricsStore.length - 1]) == null ? void 0 : _b.receivedAt
    }
  };
}

const performance_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: performance_post,
  getMetricsSummary: getMetricsSummary,
  getStoredMetrics: getStoredMetrics
}, Symbol.toStringTag, { value: 'Module' }));

const login_post = defineEventHandler(async (event) => {
  const disableRateLimit = process.env.NUXT_PUBLIC_DISABLE_RATE_LIMIT === "true";
  if (!disableRateLimit) {
    const clientIp = getClientIp(event);
    if (!loginRateLimiter.checkRateLimit(clientIp)) {
      throw createApiError(429, "auth.tooManyLoginAttempts", {
        retryAfter: 15 * 60,
        remaining: 0
      });
    }
  }
  const body = await readBody(event);
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    throw createApiError(400, "auth.invalidLoginFormat");
  }
  const { email, password, rememberMe } = result.data;
  const db = useDatabase();
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    await audit.loginFailed(event, email, "user_not_found");
    throw createApiError(401, "auth.invalidCredentials");
  }
  const lockoutStatus = await checkAccountLocked(user.id);
  if (lockoutStatus.isLocked) {
    await audit.loginFailed(event, email, "account_locked", user.id);
    throw createApiError(423, "auth.accountLocked", {
      lockedUntil: lockoutStatus.lockedUntil,
      minutesRemaining: lockoutStatus.minutesRemaining
    });
  }
  if (!verifyPassword(password, user.passwordHash)) {
    const lockoutResult = await recordFailedAttempt(user.id);
    if (lockoutResult.isLocked) {
      await audit.accountLocked(event, user.id, "max_failed_attempts");
      await audit.loginFailed(event, email, "invalid_password_locked", user.id);
      throw createApiError(423, "auth.accountLocked", {
        attemptsRemaining: 0,
        lockoutMinutes: lockoutResult.lockoutMinutes
      });
    }
    await audit.loginFailed(event, email, "invalid_password", user.id);
    throw createApiError(401, "auth.invalidCredentials", {
      attemptsRemaining: lockoutResult.attemptsRemaining
    });
  }
  await resetFailedAttempts(user.id);
  if (config.has2FA && user.twoFactorEnabled) {
    const pendingToken = randomBytes(32).toString("hex");
    const expiresAt2 = Date.now() + 5 * 60 * 1e3;
    await pending2faVerifications.set(pendingToken, {
      userId: user.id,
      email: user.email,
      rememberMe,
      expiresAt: expiresAt2,
      attempts: 0
    });
    setCookie(event, "pm-2fa-pending", pendingToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      expires: new Date(expiresAt2)
    });
    const csrfToken2 = generateCsrfToken();
    setCsrfCookie(event, csrfToken2);
    return {
      success: true,
      data: {
        requires2fa: true,
        code: "auth.twoFactorRequired",
        csrfToken: csrfToken2
      },
      requires2fa: true,
      csrfToken: csrfToken2
    };
  }
  await audit.login(event, user.id);
  const oldSessionId = getCookie(event, "pm-session");
  if (oldSessionId) {
    db.delete(sessions).where(eq(sessions.id, oldSessionId)).run();
  }
  const sessionId = generateSessionId();
  const expiresAt = /* @__PURE__ */ new Date();
  if (rememberMe) {
    expiresAt.setDate(expiresAt.getDate() + 30);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7);
  }
  db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt
  }).run();
  setCookie(event, "pm-session", sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/",
    expires: expiresAt
  });
  const csrfToken = generateCsrfToken();
  setCsrfCookie(event, csrfToken);
  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
  return {
    success: true,
    data: {
      user: userData,
      csrfToken
    },
    user: userData,
    csrfToken
  };
});

const login_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: login_post
}, Symbol.toStringTag, { value: 'Module' }));

const logout_post = defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "pm-session");
  let userId;
  if (sessionId) {
    const db = useDatabase();
    const session = db.select({ userId: sessions.userId }).from(sessions).where(eq(sessions.id, sessionId)).get();
    if (session) {
      userId = session.userId;
    }
    db.delete(sessions).where(eq(sessions.id, sessionId)).run();
  }
  if (userId) {
    await audit.logout(event, userId);
  }
  deleteCookie(event, "pm-session", {
    path: "/"
  });
  deleteCsrfCookie(event);
  return {
    success: true,
    data: null
  };
});

const logout_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: logout_post
}, Symbol.toStringTag, { value: 'Module' }));

const session_get = defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "pm-session");
  if (!sessionId) {
    deleteCsrfCookie(event);
    return {
      success: true,
      data: { user: null, csrfToken: null },
      user: null,
      csrfToken: null
    };
  }
  const db = useDatabase();
  const session = db.select().from(sessions).where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, /* @__PURE__ */ new Date()))).get();
  if (!session) {
    deleteCookie(event, "pm-session", { path: "/" });
    deleteCsrfCookie(event);
    return {
      success: true,
      data: { user: null, csrfToken: null },
      user: null,
      csrfToken: null
    };
  }
  const user = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    roleId: users.roleId
  }).from(users).where(eq(users.id, session.userId)).get();
  if (!user) {
    db.delete(sessions).where(eq(sessions.id, sessionId)).run();
    deleteCookie(event, "pm-session", { path: "/" });
    deleteCsrfCookie(event);
    return {
      success: true,
      data: { user: null, csrfToken: null },
      user: null,
      csrfToken: null
    };
  }
  let csrfToken = getCsrfToken(event);
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    setCsrfCookie(event, csrfToken);
  }
  const permissions = await getUserPermissions(user);
  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
  return {
    success: true,
    data: {
      user: userData,
      permissions,
      csrfToken
    },
    user: userData,
    permissions,
    csrfToken
  };
});

const session_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: session_get
}, Symbol.toStringTag, { value: 'Module' }));

const _slug__get = defineEventHandler(async (event) => {
  var _a;
  const db = useDatabase();
  const slug = (_a = event.context.params) == null ? void 0 : _a.slug;
  const query = getQuery$1(event);
  const locale = query.locale || config.defaultLocale;
  const defaultLocale = config.defaultLocale;
  if (!slug) {
    throw createError({
      statusCode: 400,
      message: "Slug is required"
    });
  }
  const post = db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).get();
  if (!post) {
    throw createError({
      statusCode: 404,
      message: "Post not found"
    });
  }
  const user = event.context.user;
  const canReadUnpublished = user ? await hasAdminSectionAccess(user, "blog") : false;
  if (!post.published && !canReadUnpublished) {
    if (user) {
      throw createError({
        statusCode: 403,
        message: "Access denied: unpublished posts require blog section access"
      });
    }
    throw createError({
      statusCode: 404,
      message: "Post not found"
    });
  }
  if (post.published) {
    db.update(blogPosts).set({ viewCount: (post.viewCount || 0) + 1 }).where(eq(blogPosts.id, post.id)).run();
  }
  const allTranslations = db.select().from(translations).where(like(translations.key, `blog.post.${post.id}.%`)).all();
  const titleKey = `blog.post.${post.id}.title`;
  const excerptKey = `blog.post.${post.id}.excerpt`;
  const contentKey = `blog.post.${post.id}.content`;
  const titleTrans = allTranslations.find((t) => t.key === titleKey && t.locale === locale) || allTranslations.find((t) => t.key === titleKey && t.locale === defaultLocale);
  const excerptTrans = allTranslations.find((t) => t.key === excerptKey && t.locale === locale) || allTranslations.find((t) => t.key === excerptKey && t.locale === defaultLocale);
  const contentTrans = allTranslations.find((t) => t.key === contentKey && t.locale === locale) || allTranslations.find((t) => t.key === contentKey && t.locale === defaultLocale);
  let category = null;
  if (post.categoryId) {
    const cat = db.select().from(blogCategories).where(eq(blogCategories.id, post.categoryId)).get();
    if (cat) {
      const catNameKey = `blog.category.${cat.id}.name`;
      const catTrans = db.select().from(translations).where(like(translations.key, catNameKey)).all();
      const catNameTrans = catTrans.find((t) => t.locale === locale) || catTrans.find((t) => t.locale === defaultLocale);
      category = {
        slug: cat.slug,
        name: (catNameTrans == null ? void 0 : catNameTrans.value) || cat.slug
      };
    }
  }
  const postTags = db.select().from(blogPostTags).where(eq(blogPostTags.postId, post.id)).all();
  const tagIds = postTags.map((pt) => pt.tagId);
  const tags = tagIds.length > 0 ? db.select().from(blogTags).all().filter((t) => tagIds.includes(t.id)) : [];
  let author = null;
  if (post.authorId) {
    const user2 = db.select().from(users).where(eq(users.id, post.authorId)).get();
    if (user2) {
      author = { name: user2.name || "Anonymous" };
    }
  }
  const media = db.select().from(blogMedia).where(eq(blogMedia.postId, post.id)).all();
  return {
    success: true,
    data: {
      id: post.id,
      slug: post.slug,
      title: (titleTrans == null ? void 0 : titleTrans.value) || "Untitled",
      excerpt: (excerptTrans == null ? void 0 : excerptTrans.value) || null,
      content: (contentTrans == null ? void 0 : contentTrans.value) || null,
      coverImageUrl: post.coverImageUrl,
      coverImageAlt: post.coverImageAlt,
      publishedAt: post.publishedAt,
      readingTimeMinutes: post.readingTimeMinutes,
      viewCount: post.viewCount,
      category,
      tags: tags.map((t) => ({ slug: t.slug, name: t.name })),
      author,
      media: media.map((m) => ({
        type: m.type,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        alt: m.alt
      }))
    }
  };
});

const _slug__get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _slug__get
}, Symbol.toStringTag, { value: 'Module' }));

const categories_get = defineEventHandler(async (event) => {
  const db = useDatabase();
  const query = getQuery$1(event);
  const locale = query.locale || config.defaultLocale;
  const defaultLocale = config.defaultLocale;
  const categories = db.select().from(blogCategories).orderBy(asc(blogCategories.order)).all();
  const allTranslations = db.select().from(translations).where(like(translations.key, "blog.category.%")).all();
  return {
    success: true,
    data: categories.map((cat) => {
      const nameKey = `blog.category.${cat.id}.name`;
      const descKey = `blog.category.${cat.id}.description`;
      const nameTrans = allTranslations.find((t) => t.key === nameKey && t.locale === locale) || allTranslations.find((t) => t.key === nameKey && t.locale === defaultLocale);
      const descTrans = allTranslations.find((t) => t.key === descKey && t.locale === locale) || allTranslations.find((t) => t.key === descKey && t.locale === defaultLocale);
      return {
        id: cat.id,
        slug: cat.slug,
        name: (nameTrans == null ? void 0 : nameTrans.value) || cat.slug,
        description: (descTrans == null ? void 0 : descTrans.value) || null
      };
    })
  };
});

const categories_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: categories_get
}, Symbol.toStringTag, { value: 'Module' }));

const posts_get = defineEventHandler(async (event) => {
  const db = useDatabase();
  const query = getQuery$1(event);
  const locale = query.locale || config.defaultLocale;
  const defaultLocale = config.defaultLocale;
  const conditions = [eq(blogPosts.published, true)];
  if (query.category && typeof query.category === "string") {
    const category = db.select().from(blogCategories).where(eq(blogCategories.slug, query.category)).get();
    if (category) {
      conditions.push(eq(blogPosts.categoryId, category.id));
    }
  }
  const limit = query.limit ? parseInt(query.limit) : 10;
  const offset = query.offset ? parseInt(query.offset) : 0;
  const posts = db.select().from(blogPosts).where(and(...conditions)).orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt)).limit(limit).offset(offset).all();
  if (posts.length === 0) {
    return { success: true, data: [] };
  }
  const allTranslations = db.select().from(translations).where(like(translations.key, "blog.post.%")).all();
  const categories = db.select().from(blogCategories).all();
  const categoryTranslations = db.select().from(translations).where(like(translations.key, "blog.category.%")).all();
  const postTags = db.select().from(blogPostTags).all();
  const tags = db.select().from(blogTags).all();
  const authorIds = [...new Set(posts.map((p) => p.authorId).filter(Boolean))];
  const authors = authorIds.length > 0 ? db.select().from(users).all().filter((u) => authorIds.includes(u.id)) : [];
  return {
    success: true,
    data: posts.map((post) => {
      const titleKey = `blog.post.${post.id}.title`;
      const excerptKey = `blog.post.${post.id}.excerpt`;
      const titleTrans = allTranslations.find((t) => t.key === titleKey && t.locale === locale) || allTranslations.find((t) => t.key === titleKey && t.locale === defaultLocale);
      const excerptTrans = allTranslations.find((t) => t.key === excerptKey && t.locale === locale) || allTranslations.find((t) => t.key === excerptKey && t.locale === defaultLocale);
      const category = post.categoryId ? categories.find((c) => c.id === post.categoryId) : null;
      let categoryName = (category == null ? void 0 : category.slug) || null;
      if (category) {
        const catNameKey = `blog.category.${category.id}.name`;
        const catTrans = categoryTranslations.find((t) => t.key === catNameKey && t.locale === locale) || categoryTranslations.find((t) => t.key === catNameKey && t.locale === defaultLocale);
        if (catTrans) categoryName = catTrans.value;
      }
      const postTagIds = postTags.filter((pt) => pt.postId === post.id).map((pt) => pt.tagId);
      const postTagList = tags.filter((t) => postTagIds.includes(t.id));
      const author = post.authorId ? authors.find((u) => u.id === post.authorId) : null;
      return {
        id: post.id,
        slug: post.slug,
        title: (titleTrans == null ? void 0 : titleTrans.value) || "Untitled",
        excerpt: (excerptTrans == null ? void 0 : excerptTrans.value) || null,
        coverImageUrl: post.coverImageUrl,
        coverImageAlt: post.coverImageAlt,
        publishedAt: post.publishedAt,
        readingTimeMinutes: post.readingTimeMinutes,
        viewCount: post.viewCount,
        category: category ? {
          slug: category.slug,
          name: categoryName
        } : null,
        tags: postTagList.map((t) => ({ slug: t.slug, name: t.name })),
        author: author ? {
          name: author.name || "Anonymous"
        } : null
      };
    })
  };
});

const posts_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: posts_get
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$g = defineEventHandler(async (event) => {
  const db = useDatabase();
  const query = getQuery$1(event);
  const conditions = [eq(clients.published, true)];
  if (query.category && typeof query.category === "string") {
    conditions.push(eq(clients.category, query.category));
  }
  if (query.featured === "true") {
    conditions.push(eq(clients.featured, true));
  }
  const limit = query.limit ? parseInt(query.limit) : void 0;
  let clients$1 = db.select().from(clients).where(and(...conditions)).orderBy(asc(clients.order)).all();
  if (limit) {
    clients$1 = clients$1.slice(0, limit);
  }
  return {
    success: true,
    data: clients$1
  };
});

const index_get$h = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$g
}, Symbol.toStringTag, { value: 'Module' }));

const submit_post = defineEventHandler(async (event) => {
  const ip = getHeader(event, "x-forwarded-for") || getHeader(event, "x-real-ip") || "unknown";
  if (!contactRateLimiter.checkRateLimit(ip)) {
    throw createError({
      statusCode: 429,
      statusMessage: "Too many requests. Please try again later."
    });
  }
  const body = await readBody(event);
  const result = contactSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: result.error.flatten()
    });
  }
  const data = result.data;
  const forceShowFormWithoutLegalDocuments = getSettingValue("contact.forceShowFormWithoutLegalDocuments") === "true";
  if (!data.consent && !forceShowFormWithoutLegalDocuments) {
    throw createError({
      statusCode: 400,
      statusMessage: "Consent is required",
      data: {
        formErrors: [],
        fieldErrors: {
          consent: ["Consent is required"]
        }
      }
    });
  }
  const db = useDatabase();
  const sanitizedData = {
    name: escapeHtml(data.name),
    // The legacy column stores a reply-to contact: email address or Telegram handle.
    email: data.email,
    phone: data.phone ? escapeHtml(data.phone) : null,
    subject: data.subject ? escapeHtml(data.subject) : null,
    message: escapeHtml(data.message)
  };
  const submission = db.insert(contactSubmissions).values({
    name: sanitizedData.name,
    email: sanitizedData.email,
    phone: sanitizedData.phone,
    subject: sanitizedData.subject,
    message: sanitizedData.message,
    read: false
  }).returning().get();
  if (config.features.contactEmailConfirmation && isValidEmailAddress(data.email)) {
    const companyNameSetting = db.select().from(settings).where(eq(settings.key, "legal.companyName")).get();
    const seoTitleSetting = db.select().from(settings).where(eq(settings.key, "seo.title")).get();
    const siteName = (companyNameSetting == null ? void 0 : companyNameSetting.value) || (seoTitleSetting == null ? void 0 : seoTitleSetting.value) || "Puppet Master";
    sendContactConfirmation(data.email, data.name, siteName).catch((e) => {
      logger.error(
        { error: e instanceof Error ? e.message : String(e) },
        "Email notification failed"
      );
    });
  }
  if (config.features.contactTelegramNotify) {
    const telegramDelivered = await notifyNewContact({
      submissionId: submission.id,
      createdAt: submission.createdAt
    }).catch((e) => {
      logger.error(
        {
          error: e instanceof Error ? e.message : String(e),
          submissionId: submission.id
        },
        "Telegram notification failed"
      );
      return false;
    });
    if (!telegramDelivered) {
      throw createError({
        statusCode: 502,
        statusMessage: "We saved your message, but could not notify the team. Please contact us directly.",
        data: {
          code: "contact.telegramNotificationFailed",
          submissionId: submission.id
        }
      });
    }
  }
  return {
    success: true,
    data: {
      message: "Thank you for your message. We will get back to you soon.",
      id: submission.id
    }
  };
});

const submit_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: submit_post
}, Symbol.toStringTag, { value: 'Module' }));

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Puppet Master API",
    description: `
Config-driven studio toolkit API for building client websites.

## Authentication
Most admin endpoints require cookie-based session authentication.
- Login via \`POST /api/auth/login\` to obtain a session
- Include CSRF token in \`x-csrf-token\` header for state-changing requests

## Rate Limiting
- Login: 5 attempts per 15 minutes per IP
- Contact form: 5 submissions per hour per IP

## Roles
- **master**: Full access (developer/agency)
- **admin**: Manage content + users (except master)
- **editor**: Content editing only
    `,
    version: "1.0.0",
    contact: {
      name: "API Support"
    }
  },
  servers: [
    {
      url: "/api",
      description: "API Server"
    }
  ],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Admin - Users", description: "User management (admin only)" },
    { name: "Admin - Contacts", description: "Contact submissions (admin only)" },
    { name: "Admin - Settings", description: "Site settings (admin only)" },
    { name: "Admin - Translations", description: "i18n translations (admin only)" },
    { name: "Admin - System", description: "System health & logs (admin only)" },
    { name: "Portfolios", description: "Portfolio management" },
    { name: "Public", description: "Public endpoints" },
    { name: "User", description: "Authenticated user endpoints" }
  ],
  paths: {
    // ═══════════════════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════════════════
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description: "Authenticate with email and password. Returns session cookie and CSRF token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          },
          401: { description: "Invalid credentials" },
          423: { description: "Account locked" },
          429: { description: "Rate limit exceeded" }
        }
      }
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        description: "End current session and clear cookies.",
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: "Logout successful" }
        }
      }
    },
    "/auth/session": {
      get: {
        tags: ["Auth"],
        summary: "Get current session",
        description: "Returns current user info if authenticated.",
        responses: {
          200: {
            description: "Session info",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SessionResponse" }
              }
            }
          }
        }
      }
    },
    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN - USERS
    // ═══════════════════════════════════════════════════════════════════════
    "/admin/users": {
      get: {
        tags: ["Admin - Users"],
        summary: "List users",
        description: "Get paginated list of users. Requires admin role.",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" }
        ],
        responses: {
          200: {
            description: "User list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserListResponse" }
              }
            }
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - requires admin role" }
        }
      },
      post: {
        tags: ["Admin - Users"],
        summary: "Create user",
        description: "Create a new user. Requires admin role.",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" }
              }
            }
          },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          409: { description: "Email already exists" }
        }
      }
    },
    "/admin/users/{id}": {
      put: {
        tags: ["Admin - Users"],
        summary: "Update user",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [{ $ref: "#/components/parameters/userId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserRequest" }
            }
          }
        },
        responses: {
          200: { description: "User updated" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "User not found" }
        }
      },
      delete: {
        tags: ["Admin - Users"],
        summary: "Delete user",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [{ $ref: "#/components/parameters/userId" }],
        responses: {
          200: { description: "User deleted" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - cannot delete self or higher role" },
          404: { description: "User not found" }
        }
      }
    },
    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN - CONTACTS
    // ═══════════════════════════════════════════════════════════════════════
    "/admin/contacts": {
      get: {
        tags: ["Admin - Contacts"],
        summary: "List contact submissions",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
          {
            name: "unread",
            in: "query",
            schema: { type: "boolean" },
            description: "Filter to unread only"
          }
        ],
        responses: {
          200: {
            description: "Contact list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ContactListResponse" }
              }
            }
          },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/admin/contacts/{id}": {
      put: {
        tags: ["Admin - Contacts"],
        summary: "Mark contact as read",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [{ $ref: "#/components/parameters/contactId" }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  read: { type: "boolean" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Contact updated" },
          404: { description: "Contact not found" }
        }
      },
      delete: {
        tags: ["Admin - Contacts"],
        summary: "Delete contact",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [{ $ref: "#/components/parameters/contactId" }],
        responses: {
          200: { description: "Contact deleted" },
          404: { description: "Contact not found" }
        }
      }
    },
    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN - SETTINGS
    // ═══════════════════════════════════════════════════════════════════════
    "/admin/settings": {
      put: {
        tags: ["Admin - Settings"],
        summary: "Update settings",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
                example: {
                  "contact.email": "hello@example.com",
                  "contact.phone": "+1234567890"
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Settings updated" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/admin/stats": {
      get: {
        tags: ["Admin - System"],
        summary: "Get dashboard stats",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Dashboard statistics",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StatsResponse" }
              }
            }
          }
        }
      }
    },
    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN - TRANSLATIONS
    // ═══════════════════════════════════════════════════════════════════════
    "/admin/translations": {
      get: {
        tags: ["Admin - Translations"],
        summary: "List translations",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "locale",
            in: "query",
            schema: { type: "string" },
            description: "Filter by locale (e.g., en, ru, he)"
          }
        ],
        responses: {
          200: { description: "Translation list" }
        }
      },
      post: {
        tags: ["Admin - Translations"],
        summary: "Create/update translation",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TranslationRequest" }
            }
          }
        },
        responses: {
          200: { description: "Translation saved" },
          400: { description: "Validation error" }
        }
      }
    },
    "/admin/translations/{id}": {
      delete: {
        tags: ["Admin - Translations"],
        summary: "Delete translation",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: { description: "Translation deleted" },
          404: { description: "Translation not found" }
        }
      }
    },
    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN - SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    "/admin/health": {
      get: {
        tags: ["Admin - System"],
        summary: "System health check",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Health status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" }
              }
            }
          }
        }
      }
    },
    "/admin/logs": {
      get: {
        tags: ["Admin - System"],
        summary: "Get recent logs",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 100 }
          },
          {
            name: "level",
            in: "query",
            schema: { type: "integer" },
            description: "Minimum log level (10=trace, 20=debug, 30=info, 40=warn, 50=error)"
          }
        ],
        responses: {
          200: { description: "Log entries" }
        }
      }
    },
    "/admin/audit-logs": {
      get: {
        tags: ["Admin - System"],
        summary: "Get audit logs",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" }
        ],
        responses: {
          200: { description: "Audit log entries" }
        }
      }
    },
    // ═══════════════════════════════════════════════════════════════════════
    // PORTFOLIOS
    // ═══════════════════════════════════════════════════════════════════════
    "/portfolios": {
      get: {
        tags: ["Portfolios"],
        summary: "List portfolios",
        parameters: [
          {
            name: "published",
            in: "query",
            schema: { type: "boolean" },
            description: "Filter by published status"
          }
        ],
        responses: {
          200: {
            description: "Portfolio list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PortfolioListResponse" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Portfolios"],
        summary: "Create portfolio",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePortfolioRequest" }
            }
          }
        },
        responses: {
          201: { description: "Portfolio created" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/portfolios/{id}": {
      get: {
        tags: ["Portfolios"],
        summary: "Get portfolio by ID or slug",
        parameters: [{ $ref: "#/components/parameters/portfolioId" }],
        responses: {
          200: {
            description: "Portfolio details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Portfolio" }
              }
            }
          },
          404: { description: "Portfolio not found" }
        }
      },
      put: {
        tags: ["Portfolios"],
        summary: "Update portfolio",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [{ $ref: "#/components/parameters/portfolioId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePortfolioRequest" }
            }
          }
        },
        responses: {
          200: { description: "Portfolio updated" },
          404: { description: "Portfolio not found" }
        }
      },
      delete: {
        tags: ["Portfolios"],
        summary: "Delete portfolio",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [{ $ref: "#/components/parameters/portfolioId" }],
        responses: {
          200: { description: "Portfolio deleted" },
          404: { description: "Portfolio not found" }
        }
      }
    },
    "/portfolios/{id}/items": {
      get: {
        tags: ["Portfolios"],
        summary: "List portfolio items",
        parameters: [{ $ref: "#/components/parameters/portfolioId" }],
        responses: {
          200: { description: "Item list" }
        }
      },
      post: {
        tags: ["Portfolios"],
        summary: "Add portfolio item",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [{ $ref: "#/components/parameters/portfolioId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePortfolioItemRequest" }
            }
          }
        },
        responses: {
          201: { description: "Item created" }
        }
      }
    },
    "/portfolios/{id}/items/{itemId}": {
      put: {
        tags: ["Portfolios"],
        summary: "Update portfolio item",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [
          { $ref: "#/components/parameters/portfolioId" },
          { $ref: "#/components/parameters/itemId" }
        ],
        responses: {
          200: { description: "Item updated" }
        }
      },
      delete: {
        tags: ["Portfolios"],
        summary: "Delete portfolio item",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [
          { $ref: "#/components/parameters/portfolioId" },
          { $ref: "#/components/parameters/itemId" }
        ],
        responses: {
          200: { description: "Item deleted" }
        }
      }
    },
    "/portfolios/{id}/items/reorder": {
      post: {
        tags: ["Portfolios"],
        summary: "Reorder portfolio items",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        parameters: [{ $ref: "#/components/parameters/portfolioId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  itemIds: {
                    type: "array",
                    items: { type: "integer" },
                    description: "Item IDs in new order"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Items reordered" }
        }
      }
    },
    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC
    // ═══════════════════════════════════════════════════════════════════════
    "/contact/submit": {
      post: {
        tags: ["Public"],
        summary: "Submit contact form",
        description: "Rate limited: 5 submissions per hour per IP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ContactRequest" }
            }
          }
        },
        responses: {
          200: { description: "Message sent" },
          400: { description: "Validation error" },
          429: { description: "Rate limit exceeded" }
        }
      }
    },
    "/settings": {
      get: {
        tags: ["Public"],
        summary: "Get public settings",
        responses: {
          200: {
            description: "Public settings",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: true
                }
              }
            }
          }
        }
      }
    },
    "/health": {
      get: {
        tags: ["Public"],
        summary: "Public health check",
        responses: {
          200: {
            description: "Service healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/i18n/{locale}": {
      get: {
        tags: ["Public"],
        summary: "Get translations for locale",
        parameters: [
          {
            name: "locale",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "en"
          }
        ],
        responses: {
          200: { description: "Translation messages" }
        }
      }
    },
    // ═══════════════════════════════════════════════════════════════════════
    // USER
    // ═══════════════════════════════════════════════════════════════════════
    "/user/change-password": {
      put: {
        tags: ["User"],
        summary: "Change own password",
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordRequest" }
            }
          }
        },
        responses: {
          200: { description: "Password changed" },
          400: { description: "Validation error" },
          401: { description: "Current password incorrect" }
        }
      }
    },
    // ═══════════════════════════════════════════════════════════════════════
    // UPLOADS
    // ═══════════════════════════════════════════════════════════════════════
    "/upload/image": {
      post: {
        tags: ["Portfolios"],
        summary: "Upload image",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Upload successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string" },
                    thumbnailUrl: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/upload/video": {
      post: {
        tags: ["Portfolios"],
        summary: "Upload video",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Upload successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string" },
                    thumbnailUrl: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "pm-session",
        description: "Session cookie obtained from login"
      },
      csrfToken: {
        type: "apiKey",
        in: "header",
        name: "x-csrf-token",
        description: "CSRF token from login response"
      }
    },
    parameters: {
      page: {
        name: "page",
        in: "query",
        schema: { type: "integer", default: 1, minimum: 1 },
        description: "Page number"
      },
      limit: {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
        description: "Items per page"
      },
      userId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer" },
        description: "User ID"
      },
      contactId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer" },
        description: "Contact submission ID"
      },
      portfolioId: {
        name: "id",
        in: "path",
        required: true,
        schema: { oneOf: [{ type: "integer" }, { type: "string" }] },
        description: "Portfolio ID or slug"
      },
      itemId: {
        name: "itemId",
        in: "path",
        required: true,
        schema: { type: "integer" },
        description: "Portfolio item ID"
      }
    },
    schemas: {
      // Auth
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 },
          rememberMe: { type: "boolean", default: false }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          user: { $ref: "#/components/schemas/User" },
          csrfToken: { type: "string" }
        }
      },
      SessionResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          csrfToken: { type: "string" }
        }
      },
      // User
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          role: { type: "string", enum: ["master", "admin", "editor"] },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      CreateUserRequest: {
        type: "object",
        required: ["email", "password", "role"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          name: { type: "string", maxLength: 100 },
          role: { type: "string", enum: ["master", "admin", "editor"] }
        }
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          name: { type: "string", maxLength: 100 },
          role: { type: "string", enum: ["master", "admin", "editor"] }
        }
      },
      UserListResponse: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/User" }
          },
          meta: { $ref: "#/components/schemas/PaginationMeta" }
        }
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string" },
          newPassword: { type: "string", minLength: 8 }
        }
      },
      // Contact
      ContactRequest: {
        type: "object",
        required: ["name", "email", "message"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          email: {
            type: "string",
            maxLength: 255,
            description: "Reply-to contact: email address or Telegram username such as @johndoe"
          },
          phone: { type: "string", maxLength: 30 },
          subject: { type: "string", maxLength: 200 },
          message: { type: "string", minLength: 10, maxLength: 5e3 }
        }
      },
      Contact: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          subject: { type: "string" },
          message: { type: "string" },
          read: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      ContactListResponse: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/Contact" }
          },
          meta: { $ref: "#/components/schemas/PaginationMeta" },
          unreadCount: { type: "integer" }
        }
      },
      // Portfolio
      Portfolio: {
        type: "object",
        properties: {
          id: { type: "integer" },
          slug: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          type: { type: "string", enum: ["gallery", "case_study"] },
          coverImageUrl: { type: "string" },
          coverThumbnailUrl: { type: "string" },
          order: { type: "integer" },
          published: { type: "boolean" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/PortfolioItem" }
          }
        }
      },
      PortfolioItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          portfolioId: { type: "integer" },
          itemType: { type: "string", enum: ["image", "video", "link", "case_study"] },
          mediaUrl: { type: "string" },
          thumbnailUrl: { type: "string" },
          caption: { type: "string" },
          slug: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          content: { type: "string" },
          category: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          order: { type: "integer" }
        }
      },
      CreatePortfolioRequest: {
        type: "object",
        required: ["slug", "name"],
        properties: {
          slug: { type: "string", pattern: "^[a-z0-9-]+$" },
          name: { type: "string" },
          description: { type: "string" },
          type: { type: "string", enum: ["gallery", "case_study"], default: "gallery" },
          published: { type: "boolean", default: false }
        }
      },
      UpdatePortfolioRequest: {
        type: "object",
        properties: {
          slug: { type: "string", pattern: "^[a-z0-9-]+$" },
          name: { type: "string" },
          description: { type: "string" },
          type: { type: "string", enum: ["gallery", "case_study"] },
          coverImageUrl: { type: "string" },
          order: { type: "integer" },
          published: { type: "boolean" }
        }
      },
      CreatePortfolioItemRequest: {
        type: "object",
        required: ["itemType"],
        properties: {
          itemType: { type: "string", enum: ["image", "video", "link", "case_study"] },
          mediaUrl: { type: "string" },
          thumbnailUrl: { type: "string" },
          caption: { type: "string" },
          slug: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          content: { type: "string" },
          category: { type: "string" },
          tags: { type: "array", items: { type: "string" } }
        }
      },
      PortfolioListResponse: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/Portfolio" }
          }
        }
      },
      // Translations
      TranslationRequest: {
        type: "object",
        required: ["locale", "key", "value"],
        properties: {
          locale: { type: "string", example: "en" },
          key: { type: "string", example: "nav.home" },
          value: { type: "string", example: "Home" }
        }
      },
      // System
      StatsResponse: {
        type: "object",
        properties: {
          users: { type: "integer" },
          portfolios: { type: "integer" },
          contacts: { type: "integer" },
          unreadContacts: { type: "integer" }
        }
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ok", "degraded", "error"] },
          database: { type: "boolean" },
          uptime: { type: "number" },
          memory: {
            type: "object",
            properties: {
              used: { type: "number" },
              total: { type: "number" }
            }
          },
          timestamp: { type: "string", format: "date-time" }
        }
      },
      // Pagination
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
          hasMore: { type: "boolean" }
        }
      }
    }
  }
};

const openapi_json_get = defineEventHandler(() => {
  return openApiSpec;
});

const openapi_json_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: openapi_json_get
}, Symbol.toStringTag, { value: 'Module' }));

const swagger_get = defineEventHandler((event) => {
  const nonce = Buffer.from(Date.now().toString() + Math.random().toString()).toString("base64").slice(0, 24);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Puppet Master API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style nonce="${nonce}">
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 2rem; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"><\/script>
  <script nonce="${nonce}">
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
        deepLinking: true,
        docExpansion: 'list',
        filter: true,
        tryItOutEnabled: true
      });
    };
  <\/script>
</body>
</html>`;
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net`,
    `style-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net`,
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join("; ");
  setHeader(event, "Content-Type", "text/html");
  setHeader(event, "Content-Security-Policy", csp);
  return html;
});

const swagger_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: swagger_get
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$e = defineEventHandler(async (event) => {
  const db = useDatabase();
  const query = getQuery$1(event);
  const locale = query.locale || config.defaultLocale;
  const defaultLocale = config.defaultLocale;
  const conditions = [eq(faqItems.published, true)];
  if (query.category && typeof query.category === "string") {
    conditions.push(eq(faqItems.category, query.category));
  }
  const items = db.select().from(faqItems).where(and(...conditions)).orderBy(asc(faqItems.order)).all();
  if (items.length === 0) return { success: true, data: [] };
  const allTranslations = db.select().from(translations).where(like(translations.key, "faq.%")).all();
  return {
    success: true,
    data: items.map((item) => {
      const questionKey = `faq.${item.id}.question`;
      const answerKey = `faq.${item.id}.answer`;
      const questionTrans = allTranslations.find((t) => t.key === questionKey && t.locale === locale) || allTranslations.find((t) => t.key === questionKey && t.locale === defaultLocale);
      const answerTrans = allTranslations.find((t) => t.key === answerKey && t.locale === locale) || allTranslations.find((t) => t.key === answerKey && t.locale === defaultLocale);
      return {
        id: item.id,
        slug: item.slug,
        category: item.category,
        question: (questionTrans == null ? void 0 : questionTrans.value) || "",
        // Public FAQ payload is sanitized before UI v-html rendering.
        answer: sanitizeHtml((answerTrans == null ? void 0 : answerTrans.value) || "")
      };
    })
  };
});

const index_get$f = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$e
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$c = defineEventHandler(async (event) => {
  const db = useDatabase();
  const query = getQuery$1(event);
  const locale = query.locale || config.defaultLocale;
  const defaultLocale = config.defaultLocale;
  const conditions = [eq(features.published, true)];
  if (query.category && typeof query.category === "string") {
    conditions.push(eq(features.category, query.category));
  }
  const features$1 = db.select().from(features).where(and(...conditions)).orderBy(asc(features.order)).all();
  if (features$1.length === 0) return { success: true, data: [] };
  const allTranslations = db.select().from(translations).where(like(translations.key, "feature.%")).all();
  return {
    success: true,
    data: features$1.map((feature) => {
      const titleKey = `feature.${feature.id}.title`;
      const descKey = `feature.${feature.id}.description`;
      const titleTrans = allTranslations.find((t) => t.key === titleKey && t.locale === locale) || allTranslations.find((t) => t.key === titleKey && t.locale === defaultLocale);
      const descTrans = allTranslations.find((t) => t.key === descKey && t.locale === locale) || allTranslations.find((t) => t.key === descKey && t.locale === defaultLocale);
      return {
        ...feature,
        title: (titleTrans == null ? void 0 : titleTrans.value) || feature.slug,
        description: (descTrans == null ? void 0 : descTrans.value) || null
      };
    })
  };
});

const index_get$d = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$c
}, Symbol.toStringTag, { value: 'Module' }));

const health_get = defineEventHandler(async (event) => {
  const startTime = Date.now();
  const runtimeConfig = useRuntimeConfig(event);
  const checks = [];
  let overallStatus = "ok";
  const dbStart = Date.now();
  try {
    const db = useDatabase();
    db.get(sql`select 1 as ok`);
    checks.push({
      name: "database",
      status: "ok",
      latency: Date.now() - dbStart
    });
  } catch (error) {
    overallStatus = "unhealthy";
    const message = error instanceof Error ? error.message : "Database connection failed";
    checks.push({
      name: "database",
      status: "error",
      message
    });
  }
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const memoryThreshold = 500;
  if (heapUsedMB > memoryThreshold) {
    if (overallStatus === "ok") overallStatus = "degraded";
    checks.push({
      name: "memory",
      status: "warning",
      message: `High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB`
    });
  } else {
    checks.push({
      name: "memory",
      status: "ok",
      message: `${heapUsedMB}MB / ${heapTotalMB}MB`
    });
  }
  const response = {
    success: true,
    data: {
      status: overallStatus,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: Math.floor(process.uptime()),
      version: runtimeConfig.appVersion,
      appVersion: runtimeConfig.appVersion,
      buildTimestamp: runtimeConfig.buildTimestamp,
      buildVersion: runtimeConfig.buildVersion,
      buildSha: runtimeConfig.buildSha,
      checks,
      responseTime: Date.now() - startTime
    }
  };
  if (overallStatus === "unhealthy") {
    setResponseStatus(event, 503);
  } else if (overallStatus === "degraded") {
    setResponseStatus(event, 200);
  }
  return response;
});

const health_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: health_get
}, Symbol.toStringTag, { value: 'Module' }));

const _locale__get = defineEventHandler(async (event) => {
  const locale = getRouterParam(event, "locale");
  if (!locale) {
    throw createError({ statusCode: 400, message: "Locale is required" });
  }
  const flatTranslations = translationCache.get(locale);
  const result = {};
  for (const [key, value] of Object.entries(flatTranslations)) {
    const keys = key.split(".");
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] === "string") {
        current[k] = {};
      }
      current = current[k];
    }
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }
  return {
    success: true,
    data: result
  };
});

const _locale__get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _locale__get
}, Symbol.toStringTag, { value: 'Module' }));

function toNodeReadable(body) {
  if (!body) {
    return null;
  }
  if (body instanceof Readable) {
    return body;
  }
  const webStreamBody = body;
  if (typeof webStreamBody.transformToWebStream === "function") {
    return Readable.fromWeb(webStreamBody.transformToWebStream());
  }
  return null;
}
const ____key__get = defineEventHandler(async (event) => {
  var _a, _b;
  if (getS3VisibilityMode() !== "private") {
    throw createError({
      statusCode: 404,
      statusMessage: "Not found"
    });
  }
  const rawKey = (_a = event.context.params) == null ? void 0 : _a.key;
  if (!rawKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing object key"
    });
  }
  const signature = getQuery$1(event).sig;
  if (typeof signature !== "string" || signature.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing media signature"
    });
  }
  const key = decodeS3ObjectKeyFromPath(rawKey);
  if (!verifyS3ObjectKeySignature(key, signature)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Invalid media signature"
    });
  }
  const { client, bucket } = createS3ClientFromEnv();
  const range = getHeader(event, "range");
  try {
    const object = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ...range ? { Range: range } : {}
      })
    );
    if (object.ContentType) setHeader(event, "Content-Type", object.ContentType);
    if (object.ContentLength !== void 0) {
      setHeader(event, "Content-Length", String(object.ContentLength));
    }
    if (object.ETag) setHeader(event, "ETag", object.ETag);
    if (object.LastModified) setHeader(event, "Last-Modified", object.LastModified.toUTCString());
    if (object.AcceptRanges) setHeader(event, "Accept-Ranges", object.AcceptRanges);
    if (object.ContentRange) {
      setHeader(event, "Content-Range", object.ContentRange);
      setResponseStatus(event, 206);
    }
    setHeader(event, "Cache-Control", "private, max-age=300");
    const stream = toNodeReadable(object.Body);
    if (!stream) {
      throw createError({
        statusCode: 502,
        statusMessage: "S3 response body is not streamable"
      });
    }
    return sendStream(event, stream);
  } catch (error) {
    const statusCode = (_b = error == null ? void 0 : error.$metadata) == null ? void 0 : _b.httpStatusCode;
    const errorName = error == null ? void 0 : error.name;
    if (statusCode === 404 || errorName === "NoSuchKey") {
      throw createError({
        statusCode: 404,
        statusMessage: "Media not found"
      });
    }
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch media from storage"
    });
  }
});

const ____key__get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: ____key__get
}, Symbol.toStringTag, { value: 'Module' }));

const _id__delete = defineEventHandler(async (event) => {
  await requireAdminSectionAccess(event.context.user, "portfolios");
  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid portfolio ID"
    });
  }
  const portfolioId = parseInt(id);
  const db = useDatabase();
  const existing = db.select().from(portfolios).where(eq(portfolios.id, portfolioId)).get();
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Portfolio not found"
    });
  }
  db.delete(portfolios).where(eq(portfolios.id, portfolioId)).run();
  return {
    success: true,
    data: {
      deleted: {
        id: portfolioId,
        slug: existing.slug
      }
    }
  };
});

const _id__delete$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__delete
}, Symbol.toStringTag, { value: 'Module' }));

const _id__get = defineEventHandler(async (event) => {
  const db = useDatabase();
  const idOrSlug = getRouterParam(event, "id");
  const query = getQuery$1(event);
  const user = event.context.user;
  if (!idOrSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Portfolio ID or slug required"
    });
  }
  const isNumericId = /^\d+$/.test(idOrSlug);
  const portfolio = isNumericId ? db.select().from(portfolios).where(eq(portfolios.id, parseInt(idOrSlug))).get() : db.select().from(portfolios).where(eq(portfolios.slug, idOrSlug)).get();
  if (!portfolio) {
    throw createError({
      statusCode: 404,
      statusMessage: "Portfolio not found"
    });
  }
  const canReadUnpublished = user ? await hasAdminSectionAccess(user, "portfolios") : false;
  if (!portfolio.published && !canReadUnpublished) {
    if (user) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied: unpublished portfolios require portfolios section access"
      });
    }
    throw createError({
      statusCode: 404,
      statusMessage: "Portfolio not found"
    });
  }
  const includeItems = query.includeItems !== "false";
  let items = [];
  if (includeItems) {
    const itemConditions = [eq(portfolioItems.portfolioId, portfolio.id)];
    if (!canReadUnpublished) {
      itemConditions.push(eq(portfolioItems.published, true));
    }
    items = db.select().from(portfolioItems).where(itemConditions.length === 1 ? itemConditions[0] : and(...itemConditions)).orderBy(desc(portfolioItems.order), desc(portfolioItems.createdAt)).all();
    items = items.map((item) => ({
      ...item,
      tags: safeJsonParse(item.tags, [])
    }));
  }
  return {
    success: true,
    data: {
      ...portfolio,
      items
    }
  };
});

const _id__get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__get
}, Symbol.toStringTag, { value: 'Module' }));

const updateSchema$1 = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes").optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1e3).optional().nullable(),
  type: z.enum(["gallery", "case_study"]).optional(),
  coverImageUrl: z.string().optional().nullable(),
  coverThumbnailUrl: z.string().optional().nullable(),
  order: z.number().int().optional(),
  published: z.boolean().optional(),
  translations: z.record(z.object({
    name: z.string().max(200).nullable().optional(),
    description: z.string().max(1e3).nullable().optional()
  })).optional()
});
const _id__put = defineEventHandler(async (event) => {
  await requireAdminSectionAccess(event.context.user, "portfolios");
  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid portfolio ID"
    });
  }
  const portfolioId = parseInt(id);
  const db = useDatabase();
  const existing = db.select().from(portfolios).where(eq(portfolios.id, portfolioId)).get();
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Portfolio not found"
    });
  }
  const body = await readBody(event);
  const result = updateSchema$1.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, ...data } = result.data;
  if (data.slug && data.slug !== existing.slug) {
    const slugConflict = db.select().from(portfolios).where(and(eq(portfolios.slug, data.slug), ne(portfolios.id, portfolioId))).get();
    if (slugConflict) {
      throw createError({
        statusCode: 409,
        statusMessage: "Slug already exists"
      });
    }
  }
  const updateData = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (data.slug !== void 0) updateData.slug = data.slug;
  if (data.name !== void 0) updateData.name = escapeHtml(data.name);
  if (data.description !== void 0)
    updateData.description = data.description ? escapeHtml(data.description) : null;
  if (data.type !== void 0) updateData.type = data.type;
  if (data.coverImageUrl !== void 0) updateData.coverImageUrl = data.coverImageUrl;
  if (data.coverThumbnailUrl !== void 0) updateData.coverThumbnailUrl = data.coverThumbnailUrl;
  if (data.order !== void 0) updateData.order = data.order;
  if (data.published !== void 0) updateData.published = data.published;
  const updated = db.update(portfolios).set(updateData).where(eq(portfolios.id, portfolioId)).returning().get();
  if (translations$1) {
    for (const [locale, trans] of Object.entries(translations$1)) {
      const nameKey = `portfolio.${portfolioId}.name`;
      const descKey = `portfolio.${portfolioId}.description`;
      const existingName = db.select().from(translations).where(and(eq(translations.key, nameKey), eq(translations.locale, locale))).get();
      if (existingName) {
        db.update(translations).set({ value: trans.name ? escapeHtml(trans.name) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingName.id)).run();
      } else if (trans.name) {
        db.insert(translations).values({ locale, key: nameKey, value: escapeHtml(trans.name) }).run();
      }
      const existingDesc = db.select().from(translations).where(and(eq(translations.key, descKey), eq(translations.locale, locale))).get();
      if (existingDesc) {
        db.update(translations).set({ value: trans.description ? escapeHtml(trans.description) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingDesc.id)).run();
      } else if (trans.description) {
        db.insert(translations).values({ locale, key: descKey, value: escapeHtml(trans.description) }).run();
      }
    }
  }
  return {
    success: true,
    data: {
      portfolio: updated
    }
  };
});

const _id__put$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _id__put
}, Symbol.toStringTag, { value: 'Module' }));

const _itemId__delete = defineEventHandler(async (event) => {
  await requireAdminSectionAccess(event.context.user, "portfolios");
  const portfolioId = getRouterParam(event, "id");
  const itemId = getRouterParam(event, "itemId");
  if (!portfolioId || !/^\d+$/.test(portfolioId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid portfolio ID"
    });
  }
  if (!itemId || !/^\d+$/.test(itemId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid item ID"
    });
  }
  const pId = parseInt(portfolioId);
  const iId = parseInt(itemId);
  const db = useDatabase();
  const existing = db.select().from(portfolioItems).where(and(eq(portfolioItems.id, iId), eq(portfolioItems.portfolioId, pId))).get();
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Item not found"
    });
  }
  db.delete(portfolioItems).where(eq(portfolioItems.id, iId)).run();
  return {
    success: true,
    data: {
      deleted: {
        id: iId,
        itemType: existing.itemType,
        slug: existing.slug
      }
    }
  };
});

const _itemId__delete$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _itemId__delete
}, Symbol.toStringTag, { value: 'Module' }));

const itemTranslationSchema$1 = z.object({
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(1e3).nullable().optional(),
  content: z.string().nullable().optional(),
  category: z.string().max(50).nullable().optional()
});
const updateSchema = z.object({
  order: z.number().int().optional(),
  published: z.boolean().optional(),
  // Media fields
  mediaUrl: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  // Case study fields
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes").optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1e3).optional().nullable(),
  content: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  category: z.string().max(50).optional().nullable(),
  translations: z.record(itemTranslationSchema$1).optional()
});
const _itemId__put = defineEventHandler(async (event) => {
  await requireAdminSectionAccess(event.context.user, "portfolios");
  const portfolioId = getRouterParam(event, "id");
  const itemId = getRouterParam(event, "itemId");
  if (!portfolioId || !/^\d+$/.test(portfolioId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid portfolio ID"
    });
  }
  if (!itemId || !/^\d+$/.test(itemId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid item ID"
    });
  }
  const pId = parseInt(portfolioId);
  const iId = parseInt(itemId);
  const db = useDatabase();
  const existing = db.select().from(portfolioItems).where(and(eq(portfolioItems.id, iId), eq(portfolioItems.portfolioId, pId))).get();
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Item not found"
    });
  }
  const body = await readBody(event);
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, ...data } = result.data;
  if (data.slug && data.slug !== existing.slug) {
    const slugConflict = db.select().from(portfolioItems).where(
      and(
        eq(portfolioItems.portfolioId, pId),
        eq(portfolioItems.slug, data.slug),
        ne(portfolioItems.id, iId)
      )
    ).get();
    if (slugConflict) {
      throw createError({
        statusCode: 409,
        statusMessage: "Slug already exists in this portfolio"
      });
    }
  }
  const updateData = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (data.order !== void 0) updateData.order = data.order;
  if (data.published !== void 0) {
    updateData.published = data.published;
    if (existing.itemType === "case_study" && data.published && !existing.publishedAt) {
      updateData.publishedAt = /* @__PURE__ */ new Date();
    }
  }
  if (data.mediaUrl !== void 0) updateData.mediaUrl = data.mediaUrl;
  if (data.thumbnailUrl !== void 0) updateData.thumbnailUrl = data.thumbnailUrl;
  if (data.caption !== void 0)
    updateData.caption = data.caption ? escapeHtml(data.caption) : null;
  if (data.slug !== void 0) updateData.slug = data.slug;
  if (data.title !== void 0) updateData.title = escapeHtml(data.title);
  if (data.description !== void 0)
    updateData.description = data.description ? escapeHtml(data.description) : null;
  if (data.content !== void 0)
    updateData.content = data.content ? sanitizeHtml(data.content) : null;
  if (data.tags !== void 0)
    updateData.tags = data.tags ? JSON.stringify(data.tags.map((t) => escapeHtml(t))) : null;
  if (data.category !== void 0)
    updateData.category = data.category ? escapeHtml(data.category) : null;
  const updated = db.update(portfolioItems).set(updateData).where(eq(portfolioItems.id, iId)).returning().get();
  if (existing.itemType === "case_study" && translations$1) {
    for (const [locale, trans] of Object.entries(translations$1)) {
      const titleKey = `portfolio_item.${iId}.title`;
      const descKey = `portfolio_item.${iId}.description`;
      const contentKey = `portfolio_item.${iId}.content`;
      const categoryKey = `portfolio_item.${iId}.category`;
      if (trans.title !== void 0) {
        const existingTitle = db.select().from(translations).where(and(eq(translations.key, titleKey), eq(translations.locale, locale))).get();
        if (existingTitle) {
          db.update(translations).set({ value: trans.title ? escapeHtml(trans.title) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingTitle.id)).run();
        } else if (trans.title) {
          db.insert(translations).values({ locale, key: titleKey, value: escapeHtml(trans.title) }).run();
        }
      }
      if (trans.description !== void 0) {
        const existingDesc = db.select().from(translations).where(and(eq(translations.key, descKey), eq(translations.locale, locale))).get();
        if (existingDesc) {
          db.update(translations).set({ value: trans.description ? escapeHtml(trans.description) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingDesc.id)).run();
        } else if (trans.description) {
          db.insert(translations).values({ locale, key: descKey, value: escapeHtml(trans.description) }).run();
        }
      }
      if (trans.content !== void 0) {
        const existingContent = db.select().from(translations).where(and(eq(translations.key, contentKey), eq(translations.locale, locale))).get();
        if (existingContent) {
          db.update(translations).set({ value: trans.content ? sanitizeHtml(trans.content) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingContent.id)).run();
        } else if (trans.content) {
          db.insert(translations).values({ locale, key: contentKey, value: sanitizeHtml(trans.content) }).run();
        }
      }
      if (trans.category !== void 0) {
        const existingCategory = db.select().from(translations).where(and(eq(translations.key, categoryKey), eq(translations.locale, locale))).get();
        if (existingCategory) {
          db.update(translations).set({ value: trans.category ? escapeHtml(trans.category) : "", updatedAt: /* @__PURE__ */ new Date() }).where(eq(translations.id, existingCategory.id)).run();
        } else if (trans.category) {
          db.insert(translations).values({ locale, key: categoryKey, value: escapeHtml(trans.category) }).run();
        }
      }
    }
  }
  return {
    success: true,
    data: {
      item: {
        ...updated,
        tags: safeJsonParse(updated.tags, [])
      }
    }
  };
});

const _itemId__put$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: _itemId__put
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$a = defineEventHandler(async (event) => {
  const db = useDatabase();
  const portfolioId = getRouterParam(event, "id");
  const query = getQuery$1(event);
  const user = event.context.user;
  if (!portfolioId || !/^\d+$/.test(portfolioId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid portfolio ID"
    });
  }
  const id = parseInt(portfolioId);
  const portfolio = db.select().from(portfolios).where(eq(portfolios.id, id)).get();
  if (!portfolio) {
    throw createError({
      statusCode: 404,
      statusMessage: "Portfolio not found"
    });
  }
  const canReadUnpublished = user ? await hasAdminSectionAccess(user, "portfolios") : false;
  if (!portfolio.published && !canReadUnpublished) {
    if (user) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied: unpublished portfolios require portfolios section access"
      });
    }
    throw createError({
      statusCode: 404,
      statusMessage: "Portfolio not found"
    });
  }
  const conditions = [eq(portfolioItems.portfolioId, id)];
  const requestedAll = query.all === "true";
  let includeAll = false;
  if (requestedAll) {
    if (!user || !canReadUnpublished) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied: unpublished items require portfolios section access"
      });
    }
    includeAll = true;
  }
  if (!includeAll) {
    conditions.push(eq(portfolioItems.published, true));
  }
  const validTypes = ["image", "video", "link", "case_study"];
  if (query.type && validTypes.includes(query.type)) {
    conditions.push(eq(portfolioItems.itemType, query.type));
  }
  const limit = query.limit ? parseInt(query.limit) : void 0;
  const offset = query.offset ? parseInt(query.offset) : 0;
  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
  const baseQuery = db.select().from(portfolioItems).where(whereClause).orderBy(desc(portfolioItems.order), desc(portfolioItems.createdAt));
  let items;
  if (limit) {
    items = baseQuery.limit(limit).offset(offset).all();
  } else {
    items = baseQuery.all();
  }
  return {
    success: true,
    data: items.map((item) => ({
      ...item,
      tags: safeJsonParse(item.tags, [])
    }))
  };
});

const index_get$b = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$a
}, Symbol.toStringTag, { value: 'Module' }));

const itemTranslationSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(1e3).nullable().optional(),
  content: z.string().nullable().optional(),
  category: z.string().max(50).nullable().optional()
});
const baseSchema = z.object({
  itemType: z.enum(["image", "video", "link", "case_study"]),
  order: z.number().int().optional(),
  published: z.boolean().optional()
});
const mediaSchema = baseSchema.extend({
  itemType: z.enum(["image", "video", "link"]),
  mediaUrl: z.string().min(1),
  thumbnailUrl: z.string().optional().nullable(),
  caption: z.string().max(500).optional().nullable()
});
const caseStudySchema = baseSchema.extend({
  itemType: z.literal("case_study"),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  title: z.string().min(1).max(200),
  description: z.string().max(1e3).optional().nullable(),
  content: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  category: z.string().max(50).optional().nullable(),
  mediaUrl: z.string().optional().nullable(),
  // Cover image
  thumbnailUrl: z.string().optional().nullable(),
  translations: z.record(itemTranslationSchema).optional()
});
const createSchema$1 = z.discriminatedUnion("itemType", [
  mediaSchema.extend({ itemType: z.literal("image") }),
  mediaSchema.extend({ itemType: z.literal("video") }),
  mediaSchema.extend({ itemType: z.literal("link") }),
  caseStudySchema
]);
const index_post$2 = defineEventHandler(async (event) => {
  var _a;
  await requireAdminSectionAccess(event.context.user, "portfolios");
  const portfolioId = getRouterParam(event, "id");
  if (!portfolioId || !/^\d+$/.test(portfolioId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid portfolio ID"
    });
  }
  const id = parseInt(portfolioId);
  const db = useDatabase();
  const portfolio = db.select().from(portfolios).where(eq(portfolios.id, id)).get();
  if (!portfolio) {
    throw createError({
      statusCode: 404,
      statusMessage: "Portfolio not found"
    });
  }
  const body = await readBody(event);
  const result = createSchema$1.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: result.error.flatten()
    });
  }
  const data = result.data;
  if (data.itemType === "case_study") {
    const existingSlug = db.select().from(portfolioItems).where(
      and(eq(portfolioItems.portfolioId, id), eq(portfolioItems.slug, data.slug))
    ).get();
    if (existingSlug) {
      throw createError({
        statusCode: 409,
        statusMessage: "Slug already exists in this portfolio"
      });
    }
  }
  const baseValues = {
    portfolioId: id,
    itemType: data.itemType,
    order: data.order || 0,
    published: (_a = data.published) != null ? _a : true
  };
  let insertValues;
  let translations$1;
  if (data.itemType === "case_study") {
    translations$1 = data.translations;
    insertValues = {
      ...baseValues,
      slug: data.slug,
      title: escapeHtml(data.title),
      description: data.description ? escapeHtml(data.description) : null,
      content: data.content ? sanitizeHtml(data.content) : null,
      tags: data.tags ? JSON.stringify(data.tags.map((t) => escapeHtml(t))) : null,
      category: data.category ? escapeHtml(data.category) : null,
      mediaUrl: data.mediaUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      publishedAt: data.published ? /* @__PURE__ */ new Date() : null
    };
  } else {
    insertValues = {
      ...baseValues,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl || null,
      caption: data.caption ? escapeHtml(data.caption) : null
    };
  }
  try {
    const insertResult = db.insert(portfolioItems).values(insertValues).run();
    const itemId = Number(insertResult.lastInsertRowid);
    if (data.itemType === "case_study" && translations$1) {
      const translationValues = [];
      for (const [locale, trans] of Object.entries(translations$1)) {
        if (trans.title) {
          translationValues.push({
            locale,
            key: `portfolio_item.${itemId}.title`,
            value: escapeHtml(trans.title)
          });
        }
        if (trans.description) {
          translationValues.push({
            locale,
            key: `portfolio_item.${itemId}.description`,
            value: escapeHtml(trans.description)
          });
        }
        if (trans.content) {
          translationValues.push({
            locale,
            key: `portfolio_item.${itemId}.content`,
            value: sanitizeHtml(trans.content)
          });
        }
        if (trans.category) {
          translationValues.push({
            locale,
            key: `portfolio_item.${itemId}.category`,
            value: escapeHtml(trans.category)
          });
        }
      }
      if (translationValues.length > 0) {
        db.insert(translations).values(translationValues).run();
      }
    }
    const newItem = db.select().from(portfolioItems).where(eq(portfolioItems.id, itemId)).get();
    return {
      success: true,
      data: {
        item: {
          ...newItem,
          tags: safeJsonParse(newItem == null ? void 0 : newItem.tags, [])
        }
      }
    };
  } catch (dbError) {
    logger.error(
      {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        portfolioId: id,
        itemType: insertValues.itemType
      },
      "Database insert error for portfolio item"
    );
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create portfolio item"
    });
  }
});

const index_post$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post$2
}, Symbol.toStringTag, { value: 'Module' }));

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int(),
      order: z.number().int()
    })
  )
});
const reorder_post = defineEventHandler(async (event) => {
  await requireAdminSectionAccess(event.context.user, "portfolios");
  const portfolioId = getRouterParam(event, "id");
  if (!portfolioId || !/^\d+$/.test(portfolioId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid portfolio ID"
    });
  }
  const pId = parseInt(portfolioId);
  const db = useDatabase();
  const portfolio = db.select().from(portfolios).where(eq(portfolios.id, pId)).get();
  if (!portfolio) {
    throw createError({
      statusCode: 404,
      statusMessage: "Portfolio not found"
    });
  }
  const body = await readBody(event);
  const result = reorderSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { items } = result.data;
  if (items.length === 0) {
    return {
      success: true,
      data: {
        updated: 0
      }
    };
  }
  const itemIds = items.map((i) => i.id);
  const existingItems = db.select({ id: portfolioItems.id }).from(portfolioItems).where(
    and(eq(portfolioItems.portfolioId, pId), inArray(portfolioItems.id, itemIds))
  ).all();
  const existingIds = new Set(existingItems.map((i) => i.id));
  const invalidIds = itemIds.filter((id) => !existingIds.has(id));
  if (invalidIds.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Items not found in this portfolio: ${invalidIds.join(", ")}`
    });
  }
  const now = /* @__PURE__ */ new Date();
  transactionSync((db2) => {
    for (const item of items) {
      db2.update(portfolioItems).set({ order: item.order, updatedAt: now }).where(eq(portfolioItems.id, item.id)).run();
    }
  });
  return {
    success: true,
    data: {
      updated: items.length
    }
  };
});

const reorder_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: reorder_post
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$8 = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g;
  const db = useDatabase();
  const query = getQuery$1(event);
  const user = event.context.user;
  const requestedAll = query.all === "true";
  let includeAll = false;
  if (requestedAll) {
    if (!user || !await hasAdminSectionAccess(user, "portfolios")) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied: unpublished portfolios require portfolios section access"
      });
    }
    includeAll = true;
  }
  const includeItems = query.includeItems === "true";
  const requestedLocale = query.locale;
  const defaultLocale = config.defaultLocale;
  const itemsLimit = query.itemsLimit ? Math.min(parseInt(query.itemsLimit), 50) : ((_c = (_b = (_a = config.modules) == null ? void 0 : _a.portfolio) == null ? void 0 : _b.config) == null ? void 0 : _c.itemsPerPage) || 12;
  const conditions = [];
  if (!includeAll) {
    conditions.push(eq(portfolios.published, true));
  }
  if (query.type && (query.type === "gallery" || query.type === "case_study")) {
    conditions.push(eq(portfolios.type, query.type));
  }
  const limit = query.limit ? parseInt(query.limit) : void 0;
  const offset = query.offset ? parseInt(query.offset) : 0;
  const whereClause = conditions.length === 0 ? void 0 : conditions.length === 1 ? conditions[0] : and(...conditions);
  const baseQuery = db.select().from(portfolios).orderBy(desc(portfolios.order), desc(portfolios.createdAt));
  let portfolios$1;
  if (whereClause) {
    if (limit) {
      portfolios$1 = baseQuery.where(whereClause).limit(limit).offset(offset).all();
    } else {
      portfolios$1 = baseQuery.where(whereClause).all();
    }
  } else {
    if (limit) {
      portfolios$1 = baseQuery.limit(limit).offset(offset).all();
    } else {
      portfolios$1 = baseQuery.all();
    }
  }
  const portfolioTranslations = db.select().from(translations).where(like(translations.key, "portfolio.%")).all();
  const getPortfolioTranslations = (portfolioId) => {
    const nameKey = `portfolio.${portfolioId}.name`;
    const descKey = `portfolio.${portfolioId}.description`;
    const translationsMap = {};
    const locales = new Set(
      portfolioTranslations.filter((t) => t.key === nameKey || t.key === descKey).map((t) => t.locale)
    );
    locales.forEach((locale) => {
      var _a2, _b2;
      const name = ((_a2 = portfolioTranslations.find((t) => t.key === nameKey && t.locale === locale)) == null ? void 0 : _a2.value) || null;
      const description = ((_b2 = portfolioTranslations.find((t) => t.key === descKey && t.locale === locale)) == null ? void 0 : _b2.value) || null;
      translationsMap[locale] = { name, description };
    });
    return translationsMap;
  };
  if (includeItems && portfolios$1.length > 0) {
    const portfolioIds = portfolios$1.map((p) => p.id);
    const dbLimit = portfolioIds.length * itemsLimit;
    const itemConditions = includeAll ? [] : [eq(portfolioItems.published, true)];
    const allItems = itemConditions.length > 0 ? db.select().from(portfolioItems).where(and(...itemConditions)).orderBy(desc(portfolioItems.order), desc(portfolioItems.createdAt)).limit(dbLimit).all() : db.select().from(portfolioItems).orderBy(desc(portfolioItems.order), desc(portfolioItems.createdAt)).limit(dbLimit).all();
    const itemTranslations = db.select().from(translations).where(like(translations.key, "portfolio_item.%")).all();
    const getItemTranslations = (itemId) => {
      const titleKey = `portfolio_item.${itemId}.title`;
      const descKey = `portfolio_item.${itemId}.description`;
      const contentKey = `portfolio_item.${itemId}.content`;
      const categoryKey = `portfolio_item.${itemId}.category`;
      const translationsMap = {};
      const locales = new Set(
        itemTranslations.filter((t) => t.key === titleKey || t.key === descKey || t.key === contentKey || t.key === categoryKey).map((t) => t.locale)
      );
      locales.forEach((locale) => {
        var _a2, _b2, _c2, _d2;
        const title = ((_a2 = itemTranslations.find((t) => t.key === titleKey && t.locale === locale)) == null ? void 0 : _a2.value) || null;
        const description = ((_b2 = itemTranslations.find((t) => t.key === descKey && t.locale === locale)) == null ? void 0 : _b2.value) || null;
        const content = ((_c2 = itemTranslations.find((t) => t.key === contentKey && t.locale === locale)) == null ? void 0 : _c2.value) || null;
        const category = ((_d2 = itemTranslations.find((t) => t.key === categoryKey && t.locale === locale)) == null ? void 0 : _d2.value) || null;
        translationsMap[locale] = { title, description, content, category };
      });
      return translationsMap;
    };
    const itemsByPortfolio = /* @__PURE__ */ new Map();
    for (const item of allItems) {
      if (portfolioIds.includes(item.portfolioId)) {
        const existing = itemsByPortfolio.get(item.portfolioId) || [];
        if (existing.length >= itemsLimit) {
          continue;
        }
        const itemTrans = getItemTranslations(item.id);
        const locale = requestedLocale || defaultLocale;
        const parsedItem = {
          ...item,
          tags: safeJsonParse(item.tags, []),
          // For public: return translated values, for admin: return translations map
          ...includeAll ? { translations: itemTrans } : {
            title: ((_d = itemTrans[locale]) == null ? void 0 : _d.title) || item.title,
            description: ((_e = itemTrans[locale]) == null ? void 0 : _e.description) || item.description,
            content: ((_f = itemTrans[locale]) == null ? void 0 : _f.content) || item.content,
            category: ((_g = itemTrans[locale]) == null ? void 0 : _g.category) || item.category
          }
        };
        existing.push(parsedItem);
        itemsByPortfolio.set(item.portfolioId, existing);
      }
    }
    const portfoliosWithItems = portfolios$1.map((portfolio) => {
      var _a2, _b2;
      const trans = getPortfolioTranslations(portfolio.id);
      const locale = requestedLocale || defaultLocale;
      return {
        ...portfolio,
        // For public: return translated values, for admin: return translations map
        ...includeAll ? { translations: trans } : {
          name: ((_a2 = trans[locale]) == null ? void 0 : _a2.name) || portfolio.name,
          description: ((_b2 = trans[locale]) == null ? void 0 : _b2.description) || portfolio.description
        },
        items: itemsByPortfolio.get(portfolio.id) || []
      };
    });
    return {
      success: true,
      data: portfoliosWithItems
    };
  }
  return {
    success: true,
    data: portfolios$1.map((portfolio) => {
      var _a2, _b2;
      const trans = getPortfolioTranslations(portfolio.id);
      const locale = requestedLocale || defaultLocale;
      return {
        ...portfolio,
        // For public: return translated values, for admin: return translations map
        ...includeAll ? { translations: trans } : {
          name: ((_a2 = trans[locale]) == null ? void 0 : _a2.name) || portfolio.name,
          description: ((_b2 = trans[locale]) == null ? void 0 : _b2.description) || portfolio.description
        }
      };
    })
  };
});

const index_get$9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$8
}, Symbol.toStringTag, { value: 'Module' }));

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  name: z.string().min(1).max(200),
  description: z.string().max(1e3).optional(),
  type: z.enum(["gallery", "case_study"]),
  coverImageUrl: z.string().optional().nullable(),
  coverThumbnailUrl: z.string().optional().nullable(),
  order: z.number().int().optional(),
  published: z.boolean().optional(),
  translations: z.record(z.object({
    name: z.string().max(200).nullable().optional(),
    description: z.string().max(1e3).nullable().optional()
  })).optional()
});
const index_post = defineEventHandler(async (event) => {
  await requireAdminSectionAccess(event.context.user, "portfolios");
  const body = await readBody(event);
  const result = createSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: result.error.flatten()
    });
  }
  const { translations: translations$1, ...data } = result.data;
  const db = useDatabase();
  const existing = db.select().from(portfolios).where(eq(portfolios.slug, data.slug)).get();
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Slug already exists"
    });
  }
  const insertResult = db.insert(portfolios).values({
    slug: data.slug,
    name: escapeHtml(data.name),
    description: data.description ? escapeHtml(data.description) : null,
    type: data.type,
    coverImageUrl: data.coverImageUrl || null,
    coverThumbnailUrl: data.coverThumbnailUrl || null,
    order: data.order || 0,
    published: data.published || false
  }).run();
  const portfolioId = Number(insertResult.lastInsertRowid);
  if (translations$1) {
    const translationValues = [];
    for (const [locale, trans] of Object.entries(translations$1)) {
      if (trans.name) {
        translationValues.push({
          locale,
          key: `portfolio.${portfolioId}.name`,
          value: escapeHtml(trans.name)
        });
      }
      if (trans.description) {
        translationValues.push({
          locale,
          key: `portfolio.${portfolioId}.description`,
          value: escapeHtml(trans.description)
        });
      }
    }
    if (translationValues.length > 0) {
      db.insert(translations).values(translationValues).run();
    }
  }
  const newPortfolio = db.select().from(portfolios).where(eq(portfolios.id, portfolioId)).get();
  return {
    success: true,
    data: {
      portfolio: newPortfolio
    }
  };
});

const index_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_post
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$6 = defineEventHandler(async (event) => {
  const db = useDatabase();
  const query = getQuery$1(event);
  const locale = query.locale || config.defaultLocale;
  const defaultLocale = config.defaultLocale;
  const tiers = await db.select().from(pricingTiers).where(eq(pricingTiers.published, true)).orderBy(asc(pricingTiers.order));
  const allTranslations = await db.select().from(translations).where(like(translations.key, "pricing.%"));
  const tiersWithFeatures = await Promise.all(
    tiers.map(async (tier) => {
      const features = await db.select().from(pricingFeatures).where(eq(pricingFeatures.tierId, tier.id)).orderBy(asc(pricingFeatures.order));
      const nameKey = `pricing.tier.${tier.id}.name`;
      const descKey = `pricing.tier.${tier.id}.description`;
      const ctaKey = `pricing.tier.${tier.id}.ctaText`;
      const nameTrans = allTranslations.find((t) => t.key === nameKey && t.locale === locale) || allTranslations.find((t) => t.key === nameKey && t.locale === defaultLocale);
      const descTrans = allTranslations.find((t) => t.key === descKey && t.locale === locale) || allTranslations.find((t) => t.key === descKey && t.locale === defaultLocale);
      const ctaTrans = allTranslations.find((t) => t.key === ctaKey && t.locale === locale) || allTranslations.find((t) => t.key === ctaKey && t.locale === defaultLocale);
      return {
        ...tier,
        name: (nameTrans == null ? void 0 : nameTrans.value) || tier.name,
        description: (descTrans == null ? void 0 : descTrans.value) || tier.description,
        ctaText: (ctaTrans == null ? void 0 : ctaTrans.value) || tier.ctaText,
        // Convert price from cents to dollars for display
        price: tier.price !== null ? tier.price / 100 : null,
        features: features.map((f) => {
          const featureTextKey = `pricing.feature.${f.id}.text`;
          const fTrans = allTranslations.find((t) => t.key === featureTextKey && t.locale === locale) || allTranslations.find((t) => t.key === featureTextKey && t.locale === defaultLocale);
          return {
            ...f,
            text: (fTrans == null ? void 0 : fTrans.value) || f.text
          };
        })
      };
    })
  );
  return {
    success: true,
    data: tiersWithFeatures
  };
});

const index_get$7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$6
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$4 = defineEventHandler(async () => {
  const settingsMap = buildSettingsMap();
  const grouped = buildGroupedSettings(settingsMap, {
    includeSecrets: false
  });
  return {
    success: true,
    data: grouped
  };
});

const index_get$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$4
}, Symbol.toStringTag, { value: 'Module' }));

const config_get = defineEventHandler(async (event) => {
  requireSetupAccess(event, { allowReadOnly: true });
  const configPath = resolve(process.cwd(), "project", "puppet-master.config.ts");
  if (!existsSync(configPath)) {
    throw createError({
      statusCode: 500,
      message: "Config file not found"
    });
  }
  const content = readFileSync(configPath, "utf-8");
  const pmModeMatch = content.match(/pmMode:\s*['"](\w+)['"]/);
  const pmMode = (pmModeMatch == null ? void 0 : pmModeMatch[1]) || "unconfigured";
  const websiteMatch = content.match(/website:\s*(true|false)/);
  const appMatch = content.match(/app:\s*(true|false)/);
  const hasWebsite = (websiteMatch == null ? void 0 : websiteMatch[1]) === "true";
  const hasApp = (appMatch == null ? void 0 : appMatch[1]) === "true";
  let projectType = null;
  if (hasWebsite && !hasApp) projectType = "website";
  else if (hasApp && !hasWebsite) projectType = "app";
  else if (hasWebsite) projectType = "website";
  const adminMatch = content.match(/admin:\s*\{[\s\S]*?enabled:\s*(true|false)/);
  const adminEnabled = (adminMatch == null ? void 0 : adminMatch[1]) === "true";
  const localesMatch = content.match(/locales:\s*\[([\s\S]*?)\]/);
  const locales = [];
  if (localesMatch) {
    const localePattern = /\{\s*code:\s*['"](\w+)['"]\s*,\s*iso:\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*\}/g;
    let match;
    while ((match = localePattern.exec(localesMatch[1])) !== null) {
      locales.push({ code: match[1], iso: match[2], name: match[3] });
    }
  }
  if (locales.length === 0) {
    locales.push({ code: "en", iso: "en-US", name: "English" });
  }
  const defaultLocaleMatch = content.match(/defaultLocale:\s*['"](\w+)['"]/);
  const defaultLocale = (defaultLocaleMatch == null ? void 0 : defaultLocaleMatch[1]) || "en";
  const enabledModules = [];
  const modulesStart = content.indexOf("modules:");
  if (modulesStart !== -1) {
    const openBrace = content.indexOf("{", modulesStart);
    if (openBrace !== -1) {
      let depth = 1;
      let i = openBrace + 1;
      while (i < content.length && depth > 0) {
        if (content[i] === "{") depth++;
        else if (content[i] === "}") depth--;
        i++;
      }
      const modulesBlock = content.slice(modulesStart, i);
      const skipKeys = ["config", "system", "websiteModules", "appModules"];
      const moduleEntryPattern = /(\w+):\s*\{/g;
      let match;
      while ((match = moduleEntryPattern.exec(modulesBlock)) !== null) {
        const moduleName = match[1];
        if (skipKeys.includes(moduleName)) continue;
        const startIdx = match.index + match[0].length - 1;
        let d = 1;
        let endIdx = startIdx + 1;
        while (endIdx < modulesBlock.length && d > 0) {
          if (modulesBlock[endIdx] === "{") d++;
          else if (modulesBlock[endIdx] === "}") d--;
          endIdx++;
        }
        const moduleConfig = modulesBlock.slice(startIdx, endIdx);
        if (/enabled:\s*true/.test(moduleConfig)) {
          enabledModules.push(moduleName);
        }
      }
    }
  }
  const features = {
    cookies: !/cookies:\s*false/.test(content),
    multiLangs: /multiLangs:\s*true/.test(content),
    doubleTheme: /doubleTheme:\s*true/.test(content),
    onepager: /onepager:\s*true/.test(content),
    heroParallax: /heroParallax:\s*true/.test(content),
    scrollytelling: /scrollytelling:\s*true/.test(content),
    pwa: /pwa:\s*true/.test(content),
    twoFactorAuth: /twoFactorAuth:\s*true/.test(content)
  };
  const importPath = resolve(process.cwd(), "import");
  let hasBrownfieldContent = false;
  const importFolderFiles = [];
  if (existsSync(importPath)) {
    try {
      const entries = readdirSync(importPath);
      for (const entry of entries) {
        const entryPath = join(importPath, entry);
        const stat = statSync(entryPath);
        if (stat.isDirectory()) {
          importFolderFiles.push(`${entry}/`);
        } else if (!entry.startsWith(".")) {
          importFolderFiles.push(entry);
        }
      }
    } catch {
    }
    const projectMd = resolve(importPath, "PROJECT.md");
    if (existsSync(projectMd)) {
      const projectContent = readFileSync(projectMd, "utf-8");
      hasBrownfieldContent = projectContent.includes("## Project Overview") && !projectContent.includes("[Your project name]");
    }
    if (!hasBrownfieldContent && importFolderFiles.length > 0) {
      const hasRealContent = importFolderFiles.some(
        (f) => f !== "PROJECT.md" && !f.startsWith(".")
      );
      if (hasRealContent) {
        hasBrownfieldContent = true;
      }
    }
  }
  const dbPath = resolve(process.cwd(), "data", "sqlite.db");
  const databaseExists = existsSync(dbPath);
  let projectName;
  let projectDescription;
  let targetAudience;
  let technicalBrief;
  let customModules;
  const currentWorkflow = getCurrentWorkflow();
  const workflowDataDir = getWorkflowDataDir(currentWorkflow);
  const briefPath = resolve(process.cwd(), workflowDataDir, "project-brief.md");
  if (existsSync(briefPath)) {
    try {
      const briefContent = readFileSync(briefPath, "utf-8");
      const nameMatch = briefContent.match(/## Project:\s*(.+)/);
      if (nameMatch) projectName = nameMatch[1].trim();
      const descMatch = briefContent.match(/\*\*Description:\*\*\s*(.+)/);
      if (descMatch) projectDescription = descMatch[1].trim();
      const audienceMatch = briefContent.match(/\*\*Target Audience:\*\*\s*(.+)/);
      if (audienceMatch) targetAudience = audienceMatch[1].trim();
      const modulesMatch = briefContent.match(/\*\*Custom Modules Requested:\*\*\s*(.+)/);
      if (modulesMatch) customModules = modulesMatch[1].trim();
      const briefSection = briefContent.split("## Technical Brief");
      if (briefSection.length > 1) {
        technicalBrief = briefSection[1].trim();
      }
    } catch {
    }
  }
  return {
    success: true,
    data: {
      pmMode,
      aiWorkflow: currentWorkflow,
      // NEW FIELD: Include current AI workflow
      projectType,
      adminEnabled,
      locales,
      defaultLocale,
      enabledModules,
      features,
      hasBrownfieldContent,
      importFolderFiles,
      databaseExists,
      // Project info
      projectName,
      projectDescription,
      targetAudience,
      technicalBrief,
      customModules
    }
  };
});

const config_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: config_get
}, Symbol.toStringTag, { value: 'Module' }));

const ALL_MODULES = [
  "blog",
  "portfolio",
  "team",
  "testimonials",
  "faq",
  "pricing",
  "clients",
  "features",
  "contact"
];
const LOCALE_MAP = {
  en: { code: "en", iso: "en-US", name: "English" },
  ru: { code: "ru", iso: "ru-RU", name: "Russian" },
  he: { code: "he", iso: "he-IL", name: "Hebrew" },
  es: { code: "es", iso: "es-ES", name: "Spanish" },
  fr: { code: "fr", iso: "fr-FR", name: "French" },
  de: { code: "de", iso: "de-DE", name: "German" },
  zh: { code: "zh", iso: "zh-CN", name: "Chinese" },
  ja: { code: "ja", iso: "ja-JP", name: "Japanese" }
};
const SUPPORTED_LOCALE_ISOS = Object.values(LOCALE_MAP).map((locale) => locale.iso);
function getLocaleInfo(code) {
  return LOCALE_MAP[code.toLowerCase()];
}
function isValidIntlLocale(value) {
  try {
    new Intl.Locale(value);
    return true;
  } catch {
    return false;
  }
}
function isSupportedLocaleCode(code) {
  const normalized = code.toLowerCase();
  return Boolean(getLocaleInfo(normalized)) || /^[a-z]{2,3}$/.test(normalized);
}
function isSupportedLocaleIso(iso) {
  return SUPPORTED_LOCALE_ISOS.includes(iso) || isValidIntlLocale(iso);
}

function getErrorDetails(error) {
  return error && typeof error === "object" ? error : {};
}
function sanitizeString(input, maxLength = 500) {
  const sanitized = input.replace(/[\x00-\x1f\x7f-\x9f]/g, "");
  return sanitized.trim().slice(0, maxLength);
}
function validateLocaleCode(code) {
  return isSupportedLocaleCode(code);
}
function validateIsoCode(iso) {
  return isSupportedLocaleIso(iso);
}
function validateLocaleName(name) {
  const namePattern = /^[\p{L}\p{N}\s\-']+$/u;
  return namePattern.test(name) && name.length <= 100;
}
function validateModuleId(id) {
  return ALL_MODULES.includes(id);
}
function getConfigPath(projectDir) {
  return resolve(projectDir, "puppet-master.config.ts");
}
function readConfigRaw(projectDir) {
  const configPath = getConfigPath(projectDir);
  return readFileSync(configPath, "utf-8");
}
function createBackup(projectDir) {
  try {
    const configPath = getConfigPath(projectDir);
    if (!existsSync(configPath)) return void 0;
    const dir = dirname(configPath);
    const timestamp = Date.now();
    const backupPath = resolve(dir, `puppet-master.config.ts.backup.${timestamp}`);
    const content = readFileSync(configPath, "utf-8");
    writeFileSync(backupPath, content, "utf-8");
    const backups = readdirSync(dir).filter((f) => f.startsWith("puppet-master.config.ts.backup.")).map((f) => ({ path: resolve(dir, f), ts: parseInt(f.split(".").pop() || "0", 10) })).sort((a, b) => b.ts - a.ts);
    for (const backup of backups.slice(3)) {
      try {
        unlinkSync(backup.path);
      } catch {
      }
    }
    return backupPath;
  } catch {
    return void 0;
  }
}
function rollbackToBackup(projectDir) {
  try {
    const configPath = getConfigPath(projectDir);
    const dir = dirname(configPath);
    const backups = readdirSync(dir).filter((f) => f.startsWith("puppet-master.config.ts.backup.")).map((f) => ({ path: resolve(dir, f), ts: parseInt(f.split(".").pop() || "0", 10) })).sort((a, b) => b.ts - a.ts);
    if (backups.length === 0) return false;
    const backupContent = readFileSync(backups[0].path, "utf-8");
    writeFileSync(configPath, backupContent, "utf-8");
    return true;
  } catch {
    return false;
  }
}
function readPmMode(projectDir) {
  try {
    const content = readConfigRaw(projectDir);
    const match = content.match(/pmMode:\s*['"](\w+)['"]/);
    if (match && ["unconfigured", "build", "develop"].includes(match[1])) {
      return match[1];
    }
    return "unconfigured";
  } catch {
    return "unconfigured";
  }
}
function readAiWorkflow(projectDir) {
  try {
    const content = readConfigRaw(projectDir);
    const match = content.match(/aiWorkflow:\s*['"](\w+)['"]/);
    if (match && ["claude", "qwen", "codex"].includes(match[1])) {
      return match[1];
    }
    return "claude";
  } catch {
    return "claude";
  }
}
function databaseExists(projectDir) {
  return existsSync(resolve(projectDir, "..", "data", "sqlite.db"));
}
function generateConfigPatches(config) {
  const patches = [];
  patches.push({
    pattern: /pmMode:\s*['"][^'"]+['"]\s*as\s*(?:const|'[^']+'\s*\|\s*'[^']+'\s*\|\s*'[^']+')/,
    replacement: `pmMode: '${config.pmMode}' as 'unconfigured' | 'build' | 'develop'`,
    description: "pmMode"
  });
  if (config.aiWorkflow) {
    patches.push({
      pattern: /aiWorkflow:\s*['"][^'"]+['"]\s*as\s*(?:const|'[^']+'\s*\|\s*'[^']+'\s*\|\s*'[^']+')/,
      replacement: `aiWorkflow: '${config.aiWorkflow}' as 'claude' | 'qwen' | 'codex'`,
      description: "aiWorkflow"
    });
  }
  if (config.projectType) {
    patches.push({
      pattern: /(entities:\s*\{[\s\S]*?website:\s*)(true|false)/,
      replacement: `$1${config.projectType === "website"}`,
      description: "entities.website"
    });
    patches.push({
      pattern: /(entities:\s*\{[\s\S]*?app:\s*)(true|false)/,
      replacement: `$1${config.projectType === "app"}`,
      description: "entities.app"
    });
  }
  if (config.adminEnabled !== void 0) {
    patches.push({
      pattern: /(admin:\s*\{[\s\S]*?enabled:\s*)(true|false)/,
      replacement: `$1${config.adminEnabled}`,
      description: "admin.enabled"
    });
  }
  if (config.locales && config.locales.length > 0) {
    const localesStr = config.locales.map((l) => `    { code: '${l.code}', iso: '${l.iso}', name: '${l.name}' }`).join(",\n");
    patches.push({
      pattern: /(locales:\s*)\[[\s\S]*?\]/,
      replacement: `$1[
${localesStr}
  ]`,
      description: "locales"
    });
  }
  if (config.defaultLocale) {
    patches.push({
      pattern: /(defaultLocale:\s*)['"][^'"]*['"]/,
      replacement: `$1'${config.defaultLocale}'`,
      description: "defaultLocale"
    });
  }
  if (config.modules !== void 0) {
    for (const moduleId of ALL_MODULES) {
      const enabled = config.modules.includes(moduleId);
      patches.push({
        pattern: new RegExp(`(${moduleId}:\\s*\\{[^}]*)(enabled:\\s*)(true|false)`, "s"),
        replacement: `$1$2${enabled}`,
        description: `modules.${moduleId}`
      });
    }
  }
  if (config.features) {
    if (config.features.cookies !== void 0) {
      patches.push({
        pattern: /(features:\s*\{\s*(?:\/\/[^\n]*\n\s*)?)(?:cookies:\s*(?:true|false),?[^\n]*\n\s*)?/,
        replacement: `$1cookies: ${config.features.cookies},
    `,
        description: "features.cookies"
      });
    }
    if (config.features.multiLangs !== void 0) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?multiLangs:\s*)(true|false)/,
        replacement: `$1${config.features.multiLangs}`,
        description: "features.multiLangs"
      });
    }
    if (config.features.doubleTheme !== void 0) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?doubleTheme:\s*)(true|false)/,
        replacement: `$1${config.features.doubleTheme}`,
        description: "features.doubleTheme"
      });
    }
    if (config.features.onepager !== void 0) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?onepager:\s*)(true|false)/,
        replacement: `$1${config.features.onepager}`,
        description: "features.onepager"
      });
    }
    if (config.features.heroParallax !== void 0) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?heroParallax:\s*)(true|false)/,
        replacement: `$1${config.features.heroParallax}`,
        description: "features.heroParallax"
      });
    }
    if (config.features.scrollytelling !== void 0) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?scrollytelling:\s*)(true|false)/,
        replacement: `$1${config.features.scrollytelling}`,
        description: "features.scrollytelling"
      });
    }
    if (config.features.pwa !== void 0) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?pwa:\s*)(true|false)/,
        replacement: `$1${config.features.pwa}`,
        description: "features.pwa"
      });
    }
    if (config.features.twoFactorAuth !== void 0) {
      patches.push({
        pattern: /(features:\s*\{[\s\S]*?twoFactorAuth:\s*)(true|false)/,
        replacement: `$1${config.features.twoFactorAuth}`,
        description: "features.twoFactorAuth"
      });
    }
  }
  return patches;
}
function applyConfigPatches(content, patches) {
  let updated = content;
  for (const { pattern, replacement, description } of patches) {
    const before = updated;
    const matched = before.search(pattern) !== -1;
    updated = updated.replace(pattern, replacement);
    if (!matched) {
      throw new Error(`Failed to apply patch for ${description}`);
    }
  }
  return updated;
}
const localeSchema = z.object({
  code: z.string().max(10),
  iso: z.string().max(10),
  name: z.string().max(100)
});
const featuresSchema = z.object({
  cookies: z.boolean().optional(),
  multiLangs: z.boolean().optional(),
  doubleTheme: z.boolean().optional(),
  onepager: z.boolean().optional(),
  heroParallax: z.boolean().optional(),
  scrollytelling: z.boolean().optional(),
  pwa: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional()
});
const setupConfigSchema = z.object({
  pmMode: z.enum(["unconfigured", "build", "develop"]),
  projectName: z.string().max(200).optional(),
  projectDescription: z.string().max(500).optional(),
  targetAudience: z.string().max(500).optional(),
  technicalBrief: z.string().max(5e5).optional(),
  aiWorkflow: z.enum(["claude", "qwen", "codex"]).optional(),
  projectType: z.enum(["website", "app"]).optional(),
  adminEnabled: z.boolean().optional(),
  locales: z.array(localeSchema).optional(),
  defaultLocale: z.string().max(10).optional(),
  modules: z.array(z.string()).optional(),
  customModules: z.string().max(1e3).optional(),
  features: featuresSchema.optional()
});
const config_post = defineEventHandler(async (event) => {
  var _a;
  requireSetupAccess(event, { requireProductionAuth: true });
  const body = await readBody(event);
  const result = setupConfigSchema.safeParse(body);
  if (!result.success) {
    throw createApiError(400, "setup.invalidConfig", {
      validation: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code
      }))
    });
  }
  const config = result.data;
  const projectDir = resolve(process.cwd(), "project");
  const configPath = getConfigPath(projectDir);
  if (!existsSync(configPath)) {
    throw createApiError(500, "setup.configNotFound");
  }
  if (config.locales && config.locales.length > 0) {
    for (const locale of config.locales) {
      if (!validateLocaleCode(locale.code)) {
        throw createApiError(400, "setup.invalidLocaleCode", { localeCode: locale.code });
      }
      if (!validateIsoCode(locale.iso)) {
        throw createApiError(400, "setup.invalidLocaleIso", { localeIso: locale.iso });
      }
      if (!validateLocaleName(locale.name)) {
        throw createApiError(400, "setup.invalidLocaleName", { localeCode: locale.code });
      }
    }
  }
  if (config.modules && config.modules.length > 0) {
    const invalidModules = config.modules.filter((m) => !validateModuleId(m));
    if (invalidModules.length > 0) {
      throw createApiError(400, "setup.invalidModules", { invalidModules });
    }
  }
  let existingContent;
  try {
    existingContent = readConfigRaw(projectDir);
  } catch (error) {
    throw createApiError(500, "setup.configReadFailed", { reason: getErrorDetails(error).code });
  }
  const backupPath = createBackup(projectDir);
  try {
    const patches = generateConfigPatches({
      pmMode: config.pmMode,
      aiWorkflow: config.aiWorkflow,
      projectType: config.projectType,
      adminEnabled: config.adminEnabled,
      locales: config.locales,
      defaultLocale: config.defaultLocale,
      modules: config.modules,
      features: config.features
    });
    const updatedContent = applyConfigPatches(existingContent, patches);
    writeFileSync(configPath, updatedContent, "utf-8");
    const actualMode = readPmMode(projectDir);
    if (actualMode !== config.pmMode) {
      throw createApiError(500, "setup.configValidationFailed", {
        expected: config.pmMode,
        actual: actualMode
      });
    }
    if (config.aiWorkflow) {
      const actualWorkflow = readAiWorkflow(projectDir);
      if (actualWorkflow !== config.aiWorkflow) {
        throw createApiError(500, "setup.workflowValidationFailed", {
          expected: config.aiWorkflow,
          actual: actualWorkflow
        });
      }
    }
  } catch (error) {
    const details = getErrorDetails(error);
    if (!details.statusCode) {
      if (backupPath) {
        rollbackToBackup(projectDir);
      }
      throw createApiError(500, "setup.configWriteFailed");
    }
    throw error;
  }
  const workflowToUse = config.aiWorkflow || getCurrentWorkflow();
  const workflowDataDir = getWorkflowDataDir(workflowToUse);
  const workflowDataPath = resolve(process.cwd(), workflowDataDir);
  if (!ensureWorkflowDataDir(workflowToUse)) {
    throw createApiError(500, "setup.workflowDirectoryFailed", { workflow: workflowToUse });
  }
  if (config.technicalBrief) {
    const briefPath = resolve(workflowDataPath, "project-brief.md");
    const sanitizedBrief = sanitizeString(config.technicalBrief, 5e5);
    const sanitizedProjectName = config.projectName ? sanitizeString(config.projectName, 200) : void 0;
    const sanitizedDescription = config.projectDescription ? sanitizeString(config.projectDescription, 500) : void 0;
    const sanitizedAudience = config.targetAudience ? sanitizeString(config.targetAudience, 500) : void 0;
    const sanitizedCustomModules = config.customModules ? sanitizeString(config.customModules, 1e3) : void 0;
    const briefContent = `# Project Brief

> Auto-generated from setup wizard on ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}

${sanitizedProjectName ? `## Project: ${sanitizedProjectName}
` : ""}
${sanitizedDescription ? `**Description:** ${sanitizedDescription}
` : ""}
${sanitizedAudience ? `**Target Audience:** ${sanitizedAudience}
` : ""}
${sanitizedCustomModules ? `**Custom Modules Requested:** ${sanitizedCustomModules}
` : ""}

---

## Technical Brief

${sanitizedBrief}
`;
    writeFileSync(briefPath, briefContent, "utf-8");
  }
  let databaseStatus = "exists";
  let databaseMessageKey;
  const dbExisted = databaseExists(projectDir);
  {
    try {
      const { spawn } = await import('node:child_process');
      const dbPushResult = await new Promise((resolve2) => {
        var _a2, _b, _c, _d;
        const timeout = 6e4;
        const child = spawn("npm", ["run", "db:push"], {
          cwd: process.cwd(),
          env: { ...process.env, FORCE_COLOR: "0" },
          stdio: ["pipe", "pipe", "pipe"]
        });
        let stdout = "";
        let stderr = "";
        (_a2 = child.stdout) == null ? void 0 : _a2.on("data", (data) => {
          stdout += data.toString();
        });
        (_b = child.stderr) == null ? void 0 : _b.on("data", (data) => {
          stderr += data.toString();
        });
        (_c = child.stdin) == null ? void 0 : _c.write("y\n");
        (_d = child.stdin) == null ? void 0 : _d.end();
        const timeoutId = setTimeout(() => {
          child.kill("SIGTERM");
          console.warn("db:push timed out after 60 seconds");
          resolve2({
            status: "timeout",
            messageKey: "setup.databaseTimeout"
          });
        }, timeout);
        child.on("close", (code) => {
          clearTimeout(timeoutId);
          if (code === 0) {
            resolve2({ status: "success" });
          } else {
            console.error("db:push failed:", { code, stdout, stderr });
            resolve2({
              status: "error",
              messageKey: "setup.databasePushFailed",
              exitCode: code
            });
          }
        });
        child.on("error", (err) => {
          clearTimeout(timeoutId);
          console.error("db:push spawn error:", err.message);
          resolve2({
            status: "error",
            messageKey: "setup.databaseStartFailed"
          });
        });
      });
      if (dbPushResult.status === "success") {
        databaseStatus = dbExisted ? "exists" : "created";
      } else if (dbPushResult.status === "timeout") {
        databaseStatus = "timeout";
        databaseMessageKey = dbPushResult.messageKey;
      } else {
        databaseStatus = "error";
        databaseMessageKey = dbPushResult.messageKey;
      }
    } catch (error) {
      {
        console.error("db:push error:", (_a = getErrorDetails(error).message) != null ? _a : "Unknown error");
      }
      databaseStatus = "error";
      databaseMessageKey = "setup.databaseUnexpectedError";
    }
  }
  return {
    success: true,
    data: {
      databaseStatus,
      databaseMessageKey,
      aiWorkflow: config.aiWorkflow || readAiWorkflow(projectDir)
    }
  };
});

const config_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  applyConfigPatches: applyConfigPatches,
  default: config_post,
  generateConfigPatches: generateConfigPatches,
  sanitizeString: sanitizeString,
  setupConfigSchema: setupConfigSchema
}, Symbol.toStringTag, { value: 'Module' }));

const importZip_delete = defineEventHandler(async (event) => {
  requireSetupAccess(event);
  const importDir = resolve(process.cwd(), "import");
  if (existsSync(importDir)) {
    rmSync(importDir, { recursive: true, force: true });
  }
  return {
    success: true,
    data: {}
  };
});

const importZip_delete$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: importZip_delete
}, Symbol.toStringTag, { value: 'Module' }));

const MAX_ZIP_SIZE_MB = 100;
const MAX_UNCOMPRESSED_SIZE_MB = 500;
const MAX_FILE_COUNT = 1e4;
const MAX_SINGLE_FILE_SIZE_MB = 50;
function isSafePath(targetDir, entryPath) {
  const normalizedEntry = normalize(entryPath);
  if (normalizedEntry.includes("..")) {
    return false;
  }
  if (normalizedEntry.startsWith("/") || /^[a-zA-Z]:/.test(normalizedEntry)) {
    return false;
  }
  const fullPath = resolve(targetDir, normalizedEntry);
  const relativePath = relative(targetDir, fullPath);
  if (relativePath.startsWith("..") || relativePath.startsWith("/")) {
    return false;
  }
  return true;
}
function validateZipArchive(zip, targetDir) {
  const entries = zip.getEntries();
  if (entries.length > MAX_FILE_COUNT) {
    throw createError({
      statusCode: 400,
      statusMessage: "PM_ZIP_006: Too many files",
      message: `ZIP archive contains ${entries.length} files. Maximum allowed is ${MAX_FILE_COUNT}.`
    });
  }
  let totalUncompressedSize = 0;
  const maxUncompressedBytes = MAX_UNCOMPRESSED_SIZE_MB * 1024 * 1024;
  const maxSingleFileBytes = MAX_SINGLE_FILE_SIZE_MB * 1024 * 1024;
  for (const entry of entries) {
    const entryPath = entry.entryName;
    if (!isSafePath(targetDir, entryPath)) {
      throw createError({
        statusCode: 400,
        statusMessage: "PM_ZIP_007: Invalid path detected",
        message: `ZIP archive contains potentially unsafe path: "${entryPath}". Path traversal is not allowed.`
      });
    }
    if (entry.isDirectory) continue;
    const fileSize = entry.header.size;
    if (fileSize > maxSingleFileBytes) {
      throw createError({
        statusCode: 400,
        statusMessage: "PM_ZIP_008: File too large",
        message: `File "${entryPath}" is ${Math.round(fileSize / 1024 / 1024)}MB. Maximum allowed is ${MAX_SINGLE_FILE_SIZE_MB}MB.`
      });
    }
    totalUncompressedSize += fileSize;
    if (totalUncompressedSize > maxUncompressedBytes) {
      throw createError({
        statusCode: 400,
        statusMessage: "PM_ZIP_009: Archive too large",
        message: `ZIP archive uncompressed size exceeds ${MAX_UNCOMPRESSED_SIZE_MB}MB limit.`
      });
    }
  }
}
function safeExtract(zip, targetDir) {
  const entries = zip.getEntries();
  for (const entry of entries) {
    const entryPath = entry.entryName;
    if (!isSafePath(targetDir, entryPath)) {
      console.warn(`Skipping unsafe entry: ${entryPath}`);
      continue;
    }
    const fullPath = resolve(targetDir, entryPath);
    if (entry.isDirectory) {
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    } else {
      const parentDir = resolve(fullPath, "..");
      if (!existsSync(parentDir)) {
        mkdirSync(parentDir, { recursive: true });
      }
      zip.extractEntryTo(entry, targetDir, true, true);
    }
  }
}
const importZip_post = defineEventHandler(async (event) => {
  var _a;
  requireSetupAccess(event);
  const contentLength = getHeader(event, "content-length");
  const maxRequestBytes = (MAX_ZIP_SIZE_MB + 1) * 1024 * 1024;
  if (!contentLength) {
    throw createError({
      statusCode: 411,
      statusMessage: "PM_ZIP_012: Content-Length required",
      message: "Content-Length header is required for file uploads. Chunked transfer encoding is not supported for security reasons."
    });
  }
  const requestSizeBytes = parseInt(contentLength, 10);
  if (isNaN(requestSizeBytes) || requestSizeBytes < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "PM_ZIP_013: Invalid Content-Length",
      message: "Invalid Content-Length header value."
    });
  }
  if (requestSizeBytes > maxRequestBytes) {
    throw createError({
      statusCode: 413,
      statusMessage: "PM_ZIP_011: Request too large",
      message: `Request body is ${Math.round(requestSizeBytes / 1024 / 1024)}MB. Maximum allowed is ${MAX_ZIP_SIZE_MB}MB. Please compress your project further or split it into smaller parts.`
    });
  }
  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "PM_ZIP_001: No file uploaded",
      message: "No file uploaded. Please select a ZIP file to import."
    });
  }
  const file = formData.find((f) => f.name === "file");
  if (!file || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: "PM_ZIP_002: No file data found",
      message: "No file data found. Please try uploading again."
    });
  }
  if (!((_a = file.filename) == null ? void 0 : _a.endsWith(".zip"))) {
    throw createError({
      statusCode: 400,
      statusMessage: "PM_ZIP_003: Invalid file type",
      message: "Only .zip files are allowed. Please compress your project as a ZIP file."
    });
  }
  const fileSizeBytes = file.data.length;
  const maxZipBytes = MAX_ZIP_SIZE_MB * 1024 * 1024;
  if (fileSizeBytes > maxZipBytes) {
    throw createError({
      statusCode: 400,
      statusMessage: "PM_ZIP_010: Upload too large",
      message: `ZIP file is ${Math.round(fileSizeBytes / 1024 / 1024)}MB. Maximum allowed is ${MAX_ZIP_SIZE_MB}MB.`
    });
  }
  const importDir = resolve(process.cwd(), "import");
  const tempZipPath = resolve(process.cwd(), "data", "temp-import.zip");
  let extractionMethod = "node";
  try {
    const dataDir = resolve(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    if (existsSync(importDir)) {
      rmSync(importDir, { recursive: true, force: true });
    }
    mkdirSync(importDir, { recursive: true });
    const writeStream = createWriteStream(tempZipPath);
    writeStream.write(file.data);
    writeStream.end();
    await new Promise((resolve2, reject) => {
      writeStream.on("finish", resolve2);
      writeStream.on("error", reject);
    });
    try {
      const zip = new AdmZip(tempZipPath);
      validateZipArchive(zip, importDir);
      safeExtract(zip, importDir);
      extractionMethod = "node";
    } catch (e) {
      if (e.statusCode) throw e;
      throw createError({
        statusCode: 500,
        statusMessage: "PM_ZIP_004: Extraction failed",
        message: `Failed to extract ZIP file: ${e.message}. The file may be corrupted or use unsupported compression.`
      });
    }
    if (existsSync(tempZipPath)) {
      unlinkSync(tempZipPath);
    }
    const files = getFilesRecursive(importDir);
    return {
      success: true,
      data: {
        files: files.map((f) => f.replace(importDir + "/", "")),
        extractionMethod,
        fileCount: files.length
      }
    };
  } catch (e) {
    if (existsSync(tempZipPath)) {
      try {
        unlinkSync(tempZipPath);
      } catch {
      }
    }
    if (existsSync(importDir)) {
      try {
        rmSync(importDir, { recursive: true, force: true });
      } catch {
      }
    }
    if (e.statusCode) {
      throw e;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "PM_ZIP_005: Processing failed",
      message: e.message || "Failed to process zip file"
    });
  }
});
function getFilesRecursive(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
        files.push(...getFilesRecursive(fullPath));
      }
    } else {
      if (!entry.name.startsWith(".")) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const importZip_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: importZip_post
}, Symbol.toStringTag, { value: 'Module' }));

const index_get$2 = defineEventHandler(async (event) => {
  const db = useDatabase();
  const query = getQuery$1(event);
  const locale = query.locale || config.defaultLocale;
  const defaultLocale = config.defaultLocale;
  const conditions = [eq(teamMembers.published, true)];
  if (query.department && typeof query.department === "string") {
    conditions.push(eq(teamMembers.department, query.department));
  }
  const limit = query.limit ? parseInt(query.limit) : void 0;
  let members = db.select().from(teamMembers).where(and(...conditions)).orderBy(asc(teamMembers.order), asc(teamMembers.name)).all();
  if (limit) {
    members = members.slice(0, limit);
  }
  if (members.length === 0) return { success: true, data: [] };
  const allTranslations = db.select().from(translations).where(like(translations.key, "team.%")).all();
  return {
    success: true,
    data: members.map((member) => {
      const positionKey = `team.${member.id}.position`;
      const bioKey = `team.${member.id}.bio`;
      const positionTrans = allTranslations.find((t) => t.key === positionKey && t.locale === locale) || allTranslations.find((t) => t.key === positionKey && t.locale === defaultLocale);
      const bioTrans = allTranslations.find((t) => t.key === bioKey && t.locale === locale) || allTranslations.find((t) => t.key === bioKey && t.locale === defaultLocale);
      return {
        ...member,
        position: (positionTrans == null ? void 0 : positionTrans.value) || null,
        bio: (bioTrans == null ? void 0 : bioTrans.value) || null,
        socialLinks: safeJsonParseOrNull(member.socialLinks)
      };
    })
  };
});

const index_get$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get$2
}, Symbol.toStringTag, { value: 'Module' }));

const index_get = defineEventHandler(async (event) => {
  const db = useDatabase();
  const query = getQuery$1(event);
  const locale = query.locale || config.defaultLocale;
  const defaultLocale = config.defaultLocale;
  const conditions = [eq(testimonials.published, true)];
  if (query.featured === "true") {
    conditions.push(eq(testimonials.featured, true));
  }
  const limit = query.limit ? parseInt(query.limit) : void 0;
  let testimonials$1 = db.select().from(testimonials).where(and(...conditions)).orderBy(asc(testimonials.order)).all();
  if (limit) {
    testimonials$1 = testimonials$1.slice(0, limit);
  }
  if (testimonials$1.length === 0) return { success: true, data: [] };
  const allTranslations = db.select().from(translations).where(like(translations.key, "testimonial.%.quote")).all();
  return {
    success: true,
    data: testimonials$1.map((t) => {
      const testimonialKey = `testimonial.${t.id}.quote`;
      const keyTranslations = allTranslations.filter((tr) => tr.key === testimonialKey);
      const trans = keyTranslations.find((tr) => tr.locale === locale) || keyTranslations.find((tr) => tr.locale === defaultLocale);
      return {
        id: t.id,
        authorName: t.authorName,
        authorTitle: t.authorTitle,
        authorCompany: t.authorCompany,
        authorPhotoUrl: t.authorPhotoUrl,
        rating: t.rating,
        quote: (trans == null ? void 0 : trans.value) || ""
      };
    })
  };
});

const index_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index_get
}, Symbol.toStringTag, { value: 'Module' }));

const image_post = defineEventHandler(async (event) => {
  var _a;
  await requireAnyContentAdminSectionAccess(event.context.user);
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "No form data provided"
    });
  }
  const file = formData.find((f) => f.name === "image");
  if (!(file == null ? void 0 : file.data)) {
    throw createError({
      statusCode: 400,
      statusMessage: "No image provided"
    });
  }
  const maxSize = config.storage.image.maxSizeMB * 1024 * 1024;
  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: `File too large. Maximum size: ${config.storage.image.maxSizeMB}MB`
    });
  }
  const validation = validateImageFile(file.data);
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error || "Invalid file type"
    });
  }
  const mimeType = validation.detectedMime;
  const scanResult = await scanFileForViruses(file.data, file.filename || "image");
  if (scanResult.isInfected) {
    throw createError({
      statusCode: 400,
      statusMessage: `File rejected: ${((_a = scanResult.viruses) == null ? void 0 : _a.join(", ")) || "Malware detected"}`
    });
  }
  try {
    const storage = useFileStorage();
    const result = await storage.upload(file.data, {
      type: "image",
      originalName: file.filename,
      mimeType
    });
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Image upload error");
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to process image"
    });
  }
});

const image_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: image_post
}, Symbol.toStringTag, { value: 'Module' }));

const resolvedFfmpegPath = process.env.FFMPEG_PATH || "";
if (resolvedFfmpegPath && existsSync(resolvedFfmpegPath)) {
  ffmpeg.setFfmpegPath(resolvedFfmpegPath);
}
const TEMP_DIR = "./data/temp";
const video_post = defineEventHandler(async (event) => {
  var _a;
  await requireAnyContentAdminSectionAccess(event.context.user);
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "No form data provided"
    });
  }
  const file = formData.find((f) => f.name === "video");
  if (!(file == null ? void 0 : file.data)) {
    throw createError({
      statusCode: 400,
      statusMessage: "No video provided"
    });
  }
  const maxSize = config.storage.video.maxSizeMB * 1024 * 1024;
  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: `File too large. Maximum size: ${config.storage.video.maxSizeMB}MB`
    });
  }
  const validation = validateVideoFile(file.data);
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error || "Invalid file type"
    });
  }
  const scanResult = await scanFileForViruses(file.data, file.filename || "video");
  if (scanResult.isInfected) {
    throw createError({
      statusCode: 400,
      statusMessage: `File rejected: ${((_a = scanResult.viruses) == null ? void 0 : _a.join(", ")) || "Malware detected"}`
    });
  }
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
  const id = randomUUID();
  const inputPath = `${TEMP_DIR}/${id}-input`;
  const outputFormat = config.storage.video.outputFormat;
  const outputPath = `${TEMP_DIR}/${id}.${outputFormat}`;
  const thumbPath = `${TEMP_DIR}/${id}-thumb.jpg`;
  try {
    await writeFile(inputPath, file.data);
    await compressVideo(inputPath, outputPath);
    await generateThumbnail(inputPath, thumbPath);
    const { readFile } = await import('node:fs/promises');
    const videoBuffer = await readFile(outputPath);
    const thumbBuffer = await readFile(thumbPath);
    const storage = useFileStorage();
    const videoResult = await storage.upload(videoBuffer, {
      type: "video",
      originalName: file.filename,
      mimeType: outputFormat === "mp4" ? "video/mp4" : "video/webm"
    });
    const thumbResult = await storage.upload(thumbBuffer, {
      type: "image",
      originalName: `${file.filename}-thumb.jpg`,
      mimeType: "image/jpeg"
    });
    await Promise.all([
      unlink(inputPath).catch(() => {
      }),
      unlink(outputPath).catch(() => {
      }),
      unlink(thumbPath).catch(() => {
      })
    ]);
    return {
      success: true,
      data: {
        id: videoResult.id,
        url: videoResult.url,
        thumbnailUrl: thumbResult.url,
        originalName: file.filename,
        size: videoBuffer.length
      }
    };
  } catch (error) {
    await Promise.all([
      unlink(inputPath).catch(() => {
      }),
      unlink(outputPath).catch(() => {
      }),
      unlink(thumbPath).catch(() => {
      })
    ]);
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Video upload error");
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to process video"
    });
  }
});
function compressVideo(input, output) {
  const { compression} = config.storage.video;
  return new Promise((resolve, reject) => {
    let command = ffmpeg(input).outputOptions([
      `-vf scale='min(${compression.maxWidth},iw)':-2`,
      `-b:v ${compression.videoBitrate}`,
      `-b:a ${compression.audioBitrate}`,
      `-r ${compression.fps}`,
      "-movflags +faststart"
      // Enable streaming
    ]);
    {
      command = command.videoCodec("libx264").audioCodec("aac");
    }
    command.output(output).on("end", () => resolve()).on("error", reject).run();
  });
}
function generateThumbnail(input, output) {
  return new Promise((resolve, reject) => {
    ffmpeg(input).screenshots({
      timestamps: ["00:00:01"],
      filename: output.split("/").pop(),
      folder: TEMP_DIR,
      size: "400x300"
    }).on("end", () => resolve()).on("error", reject);
  });
}

const video_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: video_post
}, Symbol.toStringTag, { value: 'Module' }));

const disable_post = defineEventHandler(async (event) => {
  var _a;
  if (!config.has2FA) {
    throw createError({
      statusCode: 403,
      message: "Two-factor authentication is not enabled for this project"
    });
  }
  if (!((_a = event.context.session) == null ? void 0 : _a.userId)) {
    throw createError({
      statusCode: 401,
      message: "Authentication required"
    });
  }
  const userId = event.context.session.userId;
  if (!twoFactorDisableRateLimiter.checkRateLimit(String(userId))) {
    throw createError({
      statusCode: 429,
      message: "Too many disable attempts. Please try again later."
    });
  }
  const body = await readBody(event);
  const result = twoFactorDisableSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Password is required"
    });
  }
  const { password } = result.data;
  const db = useDatabase();
  const user = db.select({
    id: users.id,
    passwordHash: users.passwordHash,
    twoFactorEnabled: users.twoFactorEnabled
  }).from(users).where(eq(users.id, userId)).get();
  if (!user) {
    throw createError({
      statusCode: 404,
      message: "User not found"
    });
  }
  if (!user.twoFactorEnabled) {
    throw createError({
      statusCode: 400,
      message: "Two-factor authentication is not enabled"
    });
  }
  if (!verifyPassword(password, user.passwordHash)) {
    throw createError({
      statusCode: 401,
      message: "Incorrect password"
    });
  }
  db.delete(user2fa).where(eq(user2fa.userId, userId)).run();
  db.update(users).set({
    twoFactorEnabled: false,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId)).run();
  await audit.twoFactorDisabled(event, userId, userId, "User disabled 2FA");
  return {
    success: true,
    data: {
      message: "Two-factor authentication has been disabled."
    },
    message: "Two-factor authentication has been disabled."
  };
});

const disable_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: disable_post
}, Symbol.toStringTag, { value: 'Module' }));

const enable_post = defineEventHandler(async (event) => {
  var _a;
  if (!config.has2FA) {
    throw createApiError(403, "auth.twoFactorNotEnabled");
  }
  if (!((_a = event.context.session) == null ? void 0 : _a.userId)) {
    throw createApiError(401, "auth.authenticationRequired");
  }
  const userId = event.context.session.userId;
  const userIdStr = String(userId);
  const rateLimitAllowed = await twoFactorEnableRateLimiter.checkRateLimitAsync(userIdStr);
  if (!rateLimitAllowed) {
    throw createApiError(429, "auth.twoFactorVerifyRateLimited");
  }
  const body = await readBody(event);
  const result = twoFactorEnableSchema.safeParse(body);
  if (!result.success) {
    throw createApiError(400, "auth.twoFactorInvalidCodeFormat");
  }
  const { code } = result.data;
  const pendingSetup = await pending2FASessions.get(userIdStr);
  if (!pendingSetup) {
    throw createApiError(400, "auth.twoFactorNoPendingSetup");
  }
  const setupAge = Date.now() - pendingSetup.createdAt;
  if (setupAge > 5 * 60 * 1e3) {
    await pending2FASessions.delete(userIdStr);
    throw createApiError(400, "auth.twoFactorSetupExpired");
  }
  const db = useDatabase();
  const user = db.select({ email: users.email }).from(users).where(eq(users.id, userId)).get();
  if (!user) {
    throw createApiError(404, "admin.users.notFound");
  }
  if (!verifyTotpCode(pendingSetup.secret, code, user.email)) {
    await audit.twoFactorFailed(event, userId, "invalid_setup_code");
    throw createApiError(400, "auth.twoFactorInvalidVerificationCode");
  }
  const existing2fa = db.select({ id: user2fa.id }).from(user2fa).where(eq(user2fa.userId, userId)).get();
  if (existing2fa) {
    db.update(user2fa).set({
      secret: pendingSetup.encryptedSecret,
      backupCodes: JSON.stringify(pendingSetup.backupCodes.hashed),
      backupCodesRemaining: 10,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(user2fa.userId, userId)).run();
  } else {
    db.insert(user2fa).values({
      userId,
      secret: pendingSetup.encryptedSecret,
      backupCodes: JSON.stringify(pendingSetup.backupCodes.hashed),
      backupCodesRemaining: 10
    }).run();
  }
  db.update(users).set({
    twoFactorEnabled: true,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId)).run();
  await pending2FASessions.delete(userIdStr);
  await audit.twoFactorEnabled(event, userId);
  return {
    success: true,
    data: {
      code: "auth.twoFactorEnabled"
    }
  };
});

const enable_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: enable_post
}, Symbol.toStringTag, { value: 'Module' }));

const setup_post = defineEventHandler(async (event) => {
  var _a;
  if (!config.has2FA) {
    throw createApiError(403, "auth.twoFactorNotEnabled");
  }
  if (!((_a = event.context.session) == null ? void 0 : _a.userId)) {
    throw createApiError(401, "auth.authenticationRequired");
  }
  const userId = event.context.session.userId;
  const userIdStr = String(userId);
  const rateLimitAllowed = await twoFactorSetupRateLimiter.checkRateLimitAsync(userIdStr);
  if (!rateLimitAllowed) {
    throw createApiError(429, "auth.twoFactorSetupRateLimited");
  }
  const db = useDatabase();
  const user = db.select({
    id: users.id,
    email: users.email,
    twoFactorEnabled: users.twoFactorEnabled
  }).from(users).where(eq(users.id, userId)).get();
  if (!user) {
    throw createApiError(404, "admin.users.notFound");
  }
  if (user.twoFactorEnabled) {
    throw createApiError(400, "auth.twoFactorAlreadyEnabled");
  }
  const secret = generateTotpSecret();
  const encryptedSecret = encryptTotpSecret(secret);
  const backupCodes = generateBackupCodes();
  const qrCode = await generateTotpQRCode(secret, user.email);
  const uri = getTotpUri(secret, user.email);
  await pending2FASessions.set(userIdStr, {
    secret,
    encryptedSecret,
    backupCodes,
    createdAt: Date.now()
  });
  return {
    success: true,
    data: {
      qrCode,
      uri,
      backupCodes: backupCodes.plain
    },
    // Don't expose the raw secret - only the QR code and manual entry URI
    qrCode,
    uri,
    // Return plain backup codes (only shown once during setup)
    backupCodes: backupCodes.plain
  };
});

const setup_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: setup_post
}, Symbol.toStringTag, { value: 'Module' }));

const status_get = defineEventHandler(async (event) => {
  var _a, _b, _c;
  if (!config.has2FA) {
    return {
      success: true,
      data: {
        enabled: false,
        available: false
      },
      enabled: false,
      available: false
    };
  }
  if (!((_a = event.context.session) == null ? void 0 : _a.userId)) {
    throw createError({
      statusCode: 401,
      message: "Authentication required"
    });
  }
  const userId = event.context.session.userId;
  const db = useDatabase();
  const user = db.select({
    twoFactorEnabled: users.twoFactorEnabled
  }).from(users).where(eq(users.id, userId)).get();
  if (!user) {
    throw createError({
      statusCode: 404,
      message: "User not found"
    });
  }
  if (!user.twoFactorEnabled) {
    return {
      success: true,
      data: {
        enabled: false,
        available: true
        // 2FA is available but not enabled for this user
      },
      enabled: false,
      available: true
      // 2FA is available but not enabled for this user
    };
  }
  const user2fa$1 = db.select({
    backupCodesRemaining: user2fa.backupCodesRemaining
  }).from(user2fa).where(eq(user2fa.userId, userId)).get();
  return {
    success: true,
    data: {
      enabled: true,
      available: true,
      backupCodesRemaining: (_b = user2fa$1 == null ? void 0 : user2fa$1.backupCodesRemaining) != null ? _b : 0
    },
    enabled: true,
    available: true,
    backupCodesRemaining: (_c = user2fa$1 == null ? void 0 : user2fa$1.backupCodesRemaining) != null ? _c : 0
  };
});

const status_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: status_get
}, Symbol.toStringTag, { value: 'Module' }));

const MAX_ATTEMPTS = 5;
const verify_post = defineEventHandler(async (event) => {
  if (!config.has2FA) {
    throw createApiError(403, "auth.twoFactorNotEnabled");
  }
  const clientIp = getClientIp(event);
  const rateLimitAllowed = await twoFactorVerifyRateLimiter.checkRateLimitAsync(clientIp);
  if (!rateLimitAllowed) {
    throw createApiError(429, "auth.twoFactorVerifyRateLimited");
  }
  const pendingToken = getCookie(event, "pm-2fa-pending");
  if (!pendingToken) {
    throw createApiError(400, "auth.twoFactorNoPendingVerification");
  }
  const pendingSession = await pending2faVerifications.get(pendingToken);
  if (!pendingSession) {
    deleteCookie(event, "pm-2fa-pending", { path: "/" });
    throw createApiError(400, "auth.twoFactorVerificationExpired");
  }
  if (Date.now() > pendingSession.expiresAt) {
    await pending2faVerifications.delete(pendingToken);
    deleteCookie(event, "pm-2fa-pending", { path: "/" });
    throw createApiError(400, "auth.twoFactorVerificationExpired");
  }
  if (pendingSession.attempts >= MAX_ATTEMPTS) {
    await pending2faVerifications.delete(pendingToken);
    deleteCookie(event, "pm-2fa-pending", { path: "/" });
    throw createApiError(429, "auth.twoFactorTooManyFailedAttempts");
  }
  const body = await readBody(event);
  const result = twoFactorVerifySchema.safeParse(body);
  if (!result.success) {
    throw createApiError(400, "auth.twoFactorInvalidCodeFormat");
  }
  const { code } = result.data;
  const db = useDatabase();
  const user2fa$1 = db.select().from(user2fa).where(eq(user2fa.userId, pendingSession.userId)).get();
  if (!user2fa$1) {
    await pending2faVerifications.delete(pendingToken);
    deleteCookie(event, "pm-2fa-pending", { path: "/" });
    throw createApiError(400, "auth.twoFactorNoLongerEnabled");
  }
  const hashedBackupCodes = JSON.parse(user2fa$1.backupCodes);
  const verifyResult = verify2faCode(
    code,
    user2fa$1.secret,
    hashedBackupCodes,
    pendingSession.email
  );
  if (!verifyResult.success) {
    pendingSession.attempts++;
    await pending2faVerifications.set(pendingToken, pendingSession);
    await audit.twoFactorFailed(event, pendingSession.userId, "invalid_code");
    const remainingAttempts = MAX_ATTEMPTS - pendingSession.attempts;
    throw createApiError(401, "auth.twoFactorInvalidVerificationCode", {
      attemptsRemaining: remainingAttempts
    });
  }
  if (verifyResult.method === "backup" && verifyResult.backupCodeIndex !== void 0) {
    hashedBackupCodes.splice(verifyResult.backupCodeIndex, 1);
    db.update(user2fa).set({
      backupCodes: JSON.stringify(hashedBackupCodes),
      backupCodesRemaining: hashedBackupCodes.length,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(user2fa.userId, pendingSession.userId)).run();
  }
  await audit.twoFactorVerified(event, pendingSession.userId, verifyResult.method);
  await pending2faVerifications.delete(pendingToken);
  deleteCookie(event, "pm-2fa-pending", { path: "/" });
  const user = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role
  }).from(users).where(eq(users.id, pendingSession.userId)).get();
  if (!user) {
    throw createApiError(404, "admin.users.notFound");
  }
  const oldSessionId = getCookie(event, "pm-session");
  if (oldSessionId) {
    db.delete(sessions).where(eq(sessions.id, oldSessionId)).run();
  }
  const sessionId = generateSessionId();
  const expiresAt = /* @__PURE__ */ new Date();
  if (pendingSession.rememberMe) {
    expiresAt.setDate(expiresAt.getDate() + 30);
  } else {
    expiresAt.setHours(expiresAt.getHours() + 24);
  }
  db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt
  }).run();
  setCookie(event, "pm-session", sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/",
    expires: expiresAt
  });
  const csrfToken = generateCsrfToken();
  setCsrfCookie(event, csrfToken);
  await audit.login(event, user.id);
  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
  const backupCodesRemaining = verifyResult.method === "backup" ? hashedBackupCodes.length : void 0;
  return {
    success: true,
    data: {
      user: userData,
      csrfToken,
      backupCodesRemaining
    },
    user: userData,
    csrfToken,
    // Warn if backup codes are running low
    backupCodesRemaining
  };
});

const verify_post$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: verify_post
}, Symbol.toStringTag, { value: 'Module' }));

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required")
});
const changePassword_put = defineEventHandler(async (event) => {
  const sessionUser = event.context.user;
  if (!(sessionUser == null ? void 0 : sessionUser.id)) {
    throw createApiError(401, "auth.authenticationRequired");
  }
  const body = await readBody(event);
  const result = changePasswordSchema.safeParse(body);
  if (!result.success) {
    throw createApiError(400, "auth.changePasswordInvalidInput", {
      validation: result.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code }))
    });
  }
  const { currentPassword, newPassword } = result.data;
  const db = useDatabase();
  const passwordValidation = validatePassword(newPassword, DEFAULT_PASSWORD_POLICY);
  if (!passwordValidation.valid) {
    throw createApiError(400, "auth.passwordPolicyFailed", {
      strength: passwordValidation.strength
    });
  }
  const user = db.select({ id: users.id, passwordHash: users.passwordHash }).from(users).where(eq(users.id, sessionUser.id)).get();
  if (!user) {
    throw createApiError(404, "admin.users.notFound");
  }
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw createApiError(401, "auth.currentPasswordIncorrect");
  }
  const newPasswordHash = hashPassword(newPassword);
  db.update(users).set({
    passwordHash: newPasswordHash,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, user.id)).run();
  await audit.passwordChange(event, sessionUser.id, user.id);
  return {
    success: true,
    data: {
      updated: true
    },
    updated: true
  };
});

const changePassword_put$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: changePassword_put
}, Symbol.toStringTag, { value: 'Module' }));

const ROOM_CONFIG = {
  // Support room - admin+ only
  support: { minRole: "editor" },
  // Admin notifications - admin+ only
  "admin:notifications": { minRole: "admin" },
  // System-wide broadcasts - master only
  "system:broadcast": { minRole: "master" }
};
const WS_RATE_LIMIT = {
  maxMessages: 60,
  windowMs: 6e4
  // 1 minute
};
const WS_LIMITS = {
  /** Maximum connections per user */
  maxConnectionsPerUser: 5,
  /** Maximum rooms per connection */
  maxRoomsPerConnection: 10};

const WS_MESSAGE_TYPES = {
  // Connection management
  PING: "ping",
  PONG: "pong",
  CONNECTED: "connected",
  ERROR: "error",
  // Room/channel management
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
  SUBSCRIBED: "subscribed",
  UNSUBSCRIBED: "unsubscribed",
  // Generic messaging
  MESSAGE: "message",
  BROADCAST: "broadcast",
  // Notifications
  NOTIFICATION: "notification"
};
function createWSMessage(type, payload, id) {
  return {
    type,
    payload,
    timestamp: Date.now(),
    id
  };
}
function isWSMessage(data) {
  return typeof data === "object" && data !== null && "type" in data && typeof data.type === "string" && "timestamp" in data && typeof data.timestamp === "number";
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class WebSocketHub {
  constructor() {
    /** All active connections by connection ID */
    __publicField(this, "connections", /* @__PURE__ */ new Map());
    /** Connections grouped by user ID for quick lookup */
    __publicField(this, "userConnections", /* @__PURE__ */ new Map());
    /** Room subscriptions: room name -> Set of connection IDs */
    __publicField(this, "rooms", /* @__PURE__ */ new Map());
    /** Rate limiting: connection ID -> message timestamps */
    __publicField(this, "rateLimits", /* @__PURE__ */ new Map());
  }
  /**
   * Generate unique connection ID
   */
  generateConnectionId() {
    return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
  /**
   * Add a new connection
   */
  addConnection(peer, user) {
    const connectionId = this.generateConnectionId();
    if (user) {
      const userConns = this.userConnections.get(user.userId) || /* @__PURE__ */ new Set();
      if (userConns.size >= WS_LIMITS.maxConnectionsPerUser) {
        const oldestId = userConns.values().next().value;
        if (oldestId) {
          this.removeConnection(oldestId);
          logger.info({ userId: user.userId }, "Closed oldest connection due to limit");
        }
      }
    }
    const connection = {
      peer,
      user,
      connectionId,
      connectedAt: Date.now(),
      rooms: /* @__PURE__ */ new Set()
    };
    this.connections.set(connectionId, connection);
    if (user) {
      const userConns = this.userConnections.get(user.userId) || /* @__PURE__ */ new Set();
      userConns.add(connectionId);
      this.userConnections.set(user.userId, userConns);
    }
    logger.debug(
      { connectionId, userId: user == null ? void 0 : user.userId },
      "WebSocket connection added"
    );
    return connection;
  }
  /**
   * Remove a connection and clean up
   */
  removeConnection(connectionId) {
    var _a;
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    for (const room of connection.rooms) {
      this.unsubscribe(connectionId, room);
    }
    if (connection.user) {
      const userConns = this.userConnections.get(connection.user.userId);
      if (userConns) {
        userConns.delete(connectionId);
        if (userConns.size === 0) {
          this.userConnections.delete(connection.user.userId);
        }
      }
    }
    this.rateLimits.delete(connectionId);
    this.connections.delete(connectionId);
    logger.debug(
      { connectionId, userId: (_a = connection.user) == null ? void 0 : _a.userId },
      "WebSocket connection removed"
    );
  }
  /**
   * Get connection by ID
   */
  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }
  /**
   * Get all connections for a user
   */
  getUserConnections(userId) {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return [];
    return Array.from(connectionIds).map((id) => this.connections.get(id)).filter((c) => c !== void 0);
  }
  /**
   * Subscribe connection to a room
   */
  subscribe(connectionId, room) {
    var _a;
    const connection = this.connections.get(connectionId);
    if (!connection) {
      this.sendError(connectionId, "NOT_CONNECTED", "Connection not found");
      return false;
    }
    if (connection.rooms.size >= WS_LIMITS.maxRoomsPerConnection) {
      this.sendError(connectionId, "ROOM_LIMIT", "Maximum room subscriptions reached");
      return false;
    }
    const roomConfig = ROOM_CONFIG[room];
    if (roomConfig == null ? void 0 : roomConfig.minRole) {
      if (!connection.user) {
        this.sendError(connectionId, "AUTH_REQUIRED", "Authentication required for this room");
        return false;
      }
      if (!hasRole(connection.user.role, roomConfig.minRole)) {
        this.sendError(connectionId, "FORBIDDEN", "Insufficient permissions for this room");
        return false;
      }
    }
    if (roomConfig == null ? void 0 : roomConfig.maxConnections) {
      const roomConns = this.rooms.get(room);
      if (roomConns && roomConns.size >= roomConfig.maxConnections) {
        this.sendError(connectionId, "ROOM_FULL", "Room is at capacity");
        return false;
      }
    }
    connection.rooms.add(room);
    const roomConnections = this.rooms.get(room) || /* @__PURE__ */ new Set();
    roomConnections.add(connectionId);
    this.rooms.set(room, roomConnections);
    this.send(connectionId, createWSMessage(
      WS_MESSAGE_TYPES.SUBSCRIBED,
      { room, success: true }
    ));
    logger.debug(
      { connectionId, room, userId: (_a = connection.user) == null ? void 0 : _a.userId },
      "Subscribed to room"
    );
    return true;
  }
  /**
   * Unsubscribe connection from a room
   */
  unsubscribe(connectionId, room) {
    var _a;
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    connection.rooms.delete(room);
    const roomConnections = this.rooms.get(room);
    if (roomConnections) {
      roomConnections.delete(connectionId);
      if (roomConnections.size === 0) {
        this.rooms.delete(room);
      }
    }
    this.send(connectionId, createWSMessage(
      WS_MESSAGE_TYPES.UNSUBSCRIBED,
      { room, success: true }
    ));
    logger.debug(
      { connectionId, room, userId: (_a = connection.user) == null ? void 0 : _a.userId },
      "Unsubscribed from room"
    );
  }
  /**
   * Send message to a specific connection
   */
  send(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;
    try {
      connection.peer.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error({ connectionId, error }, "Failed to send WebSocket message");
      return false;
    }
  }
  /**
   * Send error to a specific connection
   */
  sendError(connectionId, code, message) {
    this.send(connectionId, createWSMessage(
      WS_MESSAGE_TYPES.ERROR,
      { code, message }
    ));
  }
  /**
   * Broadcast message to all connections in a room
   */
  broadcastToRoom(room, message, excludeConnectionId) {
    const roomConnections = this.rooms.get(room);
    if (!roomConnections) return 0;
    let sent = 0;
    for (const connectionId of roomConnections) {
      if (connectionId === excludeConnectionId) continue;
      if (this.send(connectionId, message)) {
        sent++;
      }
    }
    return sent;
  }
  /**
   * Send message to a specific user (all their connections)
   */
  sendToUser(userId, message) {
    const connections = this.getUserConnections(userId);
    let sent = 0;
    for (const connection of connections) {
      if (this.send(connection.connectionId, message)) {
        sent++;
      }
    }
    return sent;
  }
  /**
   * Broadcast to all authenticated connections
   */
  broadcastToAuthenticated(message, minRole) {
    let sent = 0;
    for (const connection of this.connections.values()) {
      if (!connection.user) continue;
      if (minRole && !hasRole(connection.user.role, minRole)) continue;
      if (this.send(connection.connectionId, message)) {
        sent++;
      }
    }
    return sent;
  }
  /**
   * Check rate limit for a connection
   */
  checkRateLimit(connectionId, maxMessages, windowMs) {
    const now = Date.now();
    const timestamps = this.rateLimits.get(connectionId) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);
    if (validTimestamps.length >= maxMessages) {
      return false;
    }
    validTimestamps.push(now);
    this.rateLimits.set(connectionId, validTimestamps);
    return true;
  }
  /**
   * Get hub statistics
   */
  getStats() {
    let authenticatedConnections = 0;
    for (const connection of this.connections.values()) {
      if (connection.user) authenticatedConnections++;
    }
    const roomStats = {};
    for (const [room, connections] of this.rooms) {
      roomStats[room] = connections.size;
    }
    return {
      totalConnections: this.connections.size,
      authenticatedConnections,
      totalRooms: this.rooms.size,
      roomStats
    };
  }
}
const wsHub = new WebSocketHub();

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  const cookies = {};
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [name, ...rest] = pair.trim().split("=");
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join("="));
    }
  }
  return cookies;
}
async function authenticateWebSocket(request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    const sessionId = cookies["pm-session"];
    if (!sessionId) {
      logger.debug("WebSocket auth: No session cookie");
      return null;
    }
    const db = useDatabase();
    const session = db.select().from(sessions).where(
      and(
        eq(sessions.id, sessionId),
        gt(sessions.expiresAt, /* @__PURE__ */ new Date())
      )
    ).get();
    if (!session) {
      logger.debug("WebSocket auth: Session not found or expired");
      return null;
    }
    const user = db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role
    }).from(users).where(eq(users.id, session.userId)).get();
    if (!user) {
      logger.debug({ userId: session.userId }, "WebSocket auth: User not found");
      return null;
    }
    logger.debug({ userId: user.id }, "WebSocket auth: Authenticated");
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  } catch (error) {
    logger.error({ error }, "WebSocket auth error");
    return null;
  }
}

const peerConnectionMap = /* @__PURE__ */ new WeakMap();
const ws = defineWebSocketHandler({
  /**
   * Handle new WebSocket connection
   */
  async open(peer) {
    var _a;
    try {
      const request = peer.request;
      const user = request ? await authenticateWebSocket(request) : null;
      const connection = wsHub.addConnection(peer, user);
      peerConnectionMap.set(peer, connection.connectionId);
      wsHub.send(
        connection.connectionId,
        createWSMessage(WS_MESSAGE_TYPES.CONNECTED, {
          userId: (_a = user == null ? void 0 : user.userId) != null ? _a : 0,
          connectionId: connection.connectionId
        })
      );
      logger.info(
        {
          connectionId: connection.connectionId,
          userId: user == null ? void 0 : user.userId,
          authenticated: !!user
        },
        "WebSocket connected"
      );
    } catch (error) {
      logger.error({ error }, "WebSocket open error");
      peer.close(1011, "Internal error");
    }
  },
  /**
   * Handle incoming WebSocket message
   */
  async message(peer, message) {
    const connectionId = peerConnectionMap.get(peer);
    if (!connectionId) {
      logger.warn("Message from unknown peer");
      return;
    }
    const connection = wsHub.getConnection(connectionId);
    if (!connection) {
      logger.warn({ connectionId }, "Message from disconnected connection");
      return;
    }
    if (!wsHub.checkRateLimit(connectionId, WS_RATE_LIMIT.maxMessages, WS_RATE_LIMIT.windowMs)) {
      wsHub.sendError(connectionId, "RATE_LIMITED", "Too many messages, please slow down");
      return;
    }
    try {
      const text = message.text();
      const data = JSON.parse(text);
      if (!isWSMessage(data)) {
        wsHub.sendError(connectionId, "INVALID_MESSAGE", "Invalid message format");
        return;
      }
      await handleMessage(connectionId, data);
    } catch (error) {
      logger.error({ connectionId, error }, "WebSocket message error");
      wsHub.sendError(connectionId, "PARSE_ERROR", "Failed to parse message");
    }
  },
  /**
   * Handle WebSocket close
   */
  close(peer, details) {
    var _a;
    const connectionId = peerConnectionMap.get(peer);
    if (connectionId) {
      const connection = wsHub.getConnection(connectionId);
      logger.info(
        {
          connectionId,
          userId: (_a = connection == null ? void 0 : connection.user) == null ? void 0 : _a.userId,
          code: details.code,
          reason: details.reason
        },
        "WebSocket disconnected"
      );
      wsHub.removeConnection(connectionId);
    }
  },
  /**
   * Handle WebSocket error
   */
  error(peer, error) {
    const connectionId = peerConnectionMap.get(peer);
    logger.error(
      { connectionId, error: error.message },
      "WebSocket error"
    );
    if (connectionId) {
      wsHub.removeConnection(connectionId);
    }
  }
});
async function handleMessage(connectionId, message) {
  var _a;
  const connection = wsHub.getConnection(connectionId);
  if (!connection) return;
  switch (message.type) {
    case WS_MESSAGE_TYPES.PING:
      wsHub.send(connectionId, createWSMessage(WS_MESSAGE_TYPES.PONG));
      break;
    case WS_MESSAGE_TYPES.SUBSCRIBE: {
      const payload = message.payload;
      if (!(payload == null ? void 0 : payload.room)) {
        wsHub.sendError(connectionId, "INVALID_PAYLOAD", "Room name required");
        return;
      }
      wsHub.subscribe(connectionId, payload.room);
      break;
    }
    case WS_MESSAGE_TYPES.UNSUBSCRIBE: {
      const payload = message.payload;
      if (!(payload == null ? void 0 : payload.room)) {
        wsHub.sendError(connectionId, "INVALID_PAYLOAD", "Room name required");
        return;
      }
      wsHub.unsubscribe(connectionId, payload.room);
      break;
    }
    case WS_MESSAGE_TYPES.MESSAGE: {
      const payload = message.payload;
      if (!(payload == null ? void 0 : payload.room) || payload.content === void 0) {
        wsHub.sendError(connectionId, "INVALID_PAYLOAD", "Room and content required");
        return;
      }
      if (!connection.rooms.has(payload.room)) {
        wsHub.sendError(connectionId, "NOT_IN_ROOM", "You must subscribe to the room first");
        return;
      }
      const broadcastPayload = {
        room: payload.room,
        content: payload.content,
        from: connection.user ? { userId: connection.user.userId, name: (_a = connection.user.name) != null ? _a : void 0 } : void 0
      };
      wsHub.broadcastToRoom(
        payload.room,
        createWSMessage(WS_MESSAGE_TYPES.MESSAGE, broadcastPayload, message.id)
      );
      break;
    }
    default:
      logger.debug(
        { connectionId, type: message.type },
        "Unknown message type"
      );
      wsHub.sendError(connectionId, "UNKNOWN_TYPE", `Unknown message type: ${message.type}`);
  }
}

const ws$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: ws
}, Symbol.toStringTag, { value: 'Module' }));

const com_chrome_devtools_json_get = defineEventHandler((event) => {
  setHeader(event, "Content-Type", "application/json; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600");
  return {};
});

const com_chrome_devtools_json_get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: com_chrome_devtools_json_get
}, Symbol.toStringTag, { value: 'Module' }));

const uploadRoot = resolve(process.cwd(), process.env.UPLOAD_DIR || "public/uploads");
const CONTENT_TYPES = {
  avif: "image/avif",
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  mp4: "video/mp4",
  png: "image/png",
  svg: "image/svg+xml",
  webm: "video/webm",
  webp: "image/webp"
};
function getContentType(path) {
  var _a;
  const extension = (_a = path.split(".").pop()) == null ? void 0 : _a.toLowerCase();
  return extension ? CONTENT_TYPES[extension] || "application/octet-stream" : "application/octet-stream";
}
function resolveUploadPath(rawPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPath).replace(/\\/g, "/");
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid upload path"
    });
  }
  if (decodedPath.includes("\0")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid upload path"
    });
  }
  const filePath = resolve(uploadRoot, decodedPath);
  const pathFromRoot = relative(uploadRoot, filePath);
  if (pathFromRoot === ".." || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Upload path is outside the upload directory"
    });
  }
  return filePath;
}
const ____path__get = defineEventHandler(async (event) => {
  var _a;
  const rawPathParam = (_a = event.context.params) == null ? void 0 : _a.path;
  const rawPath = Array.isArray(rawPathParam) ? rawPathParam.join("/") : rawPathParam;
  if (!rawPath) {
    throw createError({
      statusCode: 404,
      statusMessage: "Upload not found"
    });
  }
  const filePath = resolveUploadPath(rawPath);
  const info = await stat(filePath).catch(() => null);
  if (!(info == null ? void 0 : info.isFile())) {
    throw createError({
      statusCode: 404,
      statusMessage: "Upload not found"
    });
  }
  setHeader(event, "Content-Type", getContentType(filePath));
  setHeader(event, "Content-Length", String(info.size));
  setHeader(event, "Last-Modified", info.mtime.toUTCString());
  setHeader(event, "Cache-Control", "public, max-age=2592000");
  setHeader(event, "X-Content-Type-Options", "nosniff");
  if (filePath.toLowerCase().endsWith(".svg")) {
    setHeader(event, "Content-Security-Policy", "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
  }
  return sendStream(event, createReadStream(filePath));
});

const ____path__get$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: ____path__get
}, Symbol.toStringTag, { value: 'Module' }));

function renderPayloadResponse(ssrContext) {
  return {
    body: stringify(splitPayload(ssrContext).payload, ssrContext._payloadReducers) ,
    statusCode: getResponseStatus(ssrContext.event),
    statusMessage: getResponseStatusText(ssrContext.event),
    headers: {
      "content-type": "application/json;charset=utf-8" ,
      "x-powered-by": "Nuxt"
    }
  };
}
function renderPayloadJsonScript(opts) {
  const contents = opts.data ? stringify(opts.data, opts.ssrContext._payloadReducers) : "";
  const payload = {
    "type": "application/json",
    "innerHTML": contents,
    "data-nuxt-data": appId,
    "data-ssr": !(opts.ssrContext.noSSR)
  };
  {
    payload.id = "__NUXT_DATA__";
  }
  if (opts.src) {
    payload["data-src"] = opts.src;
  }
  const config = uneval(opts.ssrContext.config);
  return [
    payload,
    {
      innerHTML: `window.__NUXT__={};window.__NUXT__.config=${config}`
    }
  ];
}
function splitPayload(ssrContext) {
  const { data, prerenderedAt, ...initial } = ssrContext.payload;
  return {
    initial: { ...initial, prerenderedAt },
    payload: { data, prerenderedAt }
  };
}

const renderSSRHeadOptions = {"omitLineBreaks":true};

globalThis.__buildAssetsURL = buildAssetsURL;
globalThis.__publicAssetsURL = publicAssetsURL;
const HAS_APP_TELEPORTS = !!(appTeleportAttrs.id);
const APP_TELEPORT_OPEN_TAG = HAS_APP_TELEPORTS ? `<${appTeleportTag}${propsToString(appTeleportAttrs)}>` : "";
const APP_TELEPORT_CLOSE_TAG = HAS_APP_TELEPORTS ? `</${appTeleportTag}>` : "";
const PAYLOAD_URL_RE = /^[^?]*\/_payload.json(?:\?.*)?$/ ;
const renderer = defineRenderHandler(async (event) => {
  const nitroApp = useNitroApp();
  const ssrError = event.path.startsWith("/__nuxt_error") ? getQuery$1(event) : null;
  if (ssrError && !("__unenv__" in event.node.req)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Page Not Found: /__nuxt_error"
    });
  }
  const ssrContext = createSSRContext(event);
  const headEntryOptions = { mode: "server" };
  ssrContext.head.push(appHead, headEntryOptions);
  if (ssrError) {
    ssrError.statusCode &&= Number.parseInt(ssrError.statusCode);
    if (typeof ssrError.data === "string") {
      try {
        ssrError.data = destr(ssrError.data);
      } catch {
      }
    }
    setSSRError(ssrContext, ssrError);
  }
  const isRenderingPayload = PAYLOAD_URL_RE.test(ssrContext.url);
  if (isRenderingPayload) {
    const url = ssrContext.url.substring(0, ssrContext.url.lastIndexOf("/")) || "/";
    ssrContext.url = url;
    event._path = event.node.req.url = url;
  }
  const routeOptions = getRouteRules(event);
  if (routeOptions.ssr === false) {
    ssrContext.noSSR = true;
  }
  const renderer = await getRenderer(ssrContext);
  const _rendered = await renderer.renderToString(ssrContext).catch(async (error) => {
    if (ssrContext._renderResponse && error.message === "skipping render") {
      return {};
    }
    const _err = !ssrError && ssrContext.payload?.error || error;
    await ssrContext.nuxt?.hooks.callHook("app:error", _err);
    throw _err;
  });
  const inlinedStyles = [];
  await ssrContext.nuxt?.hooks.callHook("app:rendered", { ssrContext, renderResult: _rendered });
  if (ssrContext._renderResponse) {
    return ssrContext._renderResponse;
  }
  if (ssrContext.payload?.error && !ssrError) {
    throw ssrContext.payload.error;
  }
  if (isRenderingPayload) {
    const response = renderPayloadResponse(ssrContext);
    return response;
  }
  const NO_SCRIPTS = routeOptions.noScripts;
  const { styles, scripts } = getRequestDependencies(ssrContext, renderer.rendererContext);
  if (ssrContext._preloadManifest && !NO_SCRIPTS) {
    ssrContext.head.push({
      link: [
        { rel: "preload", as: "fetch", fetchpriority: "low", crossorigin: "anonymous", href: buildAssetsURL(`builds/meta/${ssrContext.runtimeConfig.app.buildId}.json`) }
      ]
    }, { ...headEntryOptions, tagPriority: "low" });
  }
  if (inlinedStyles.length) {
    ssrContext.head.push({ style: inlinedStyles });
  }
  const link = [];
  for (const resource of Object.values(styles)) {
    if ("inline" in getQuery(resource.file)) {
      continue;
    }
    link.push({ rel: "stylesheet", href: renderer.rendererContext.buildAssetsURL(resource.file), crossorigin: "" });
  }
  if (link.length) {
    ssrContext.head.push({ link }, headEntryOptions);
  }
  if (!NO_SCRIPTS) {
    ssrContext.head.push({
      link: getPreloadLinks(ssrContext, renderer.rendererContext)
    }, headEntryOptions);
    ssrContext.head.push({
      link: getPrefetchLinks(ssrContext, renderer.rendererContext)
    }, headEntryOptions);
    ssrContext.head.push({
      script: renderPayloadJsonScript({ ssrContext, data: ssrContext.payload }) 
    }, {
      ...headEntryOptions,
      // this should come before another end of body scripts
      tagPosition: "bodyClose",
      tagPriority: "high"
    });
  }
  if (!routeOptions.noScripts) {
    const tagPosition = "head";
    ssrContext.head.push({
      script: Object.values(scripts).map((resource) => ({
        type: resource.module ? "module" : null,
        src: renderer.rendererContext.buildAssetsURL(resource.file),
        defer: resource.module ? null : true,
        // if we are rendering script tag payloads that import an async payload
        // we need to ensure this resolves before executing the Nuxt entry
        tagPosition,
        crossorigin: ""
      }))
    }, headEntryOptions);
  }
  const { headTags, bodyTags, bodyTagsOpen, htmlAttrs, bodyAttrs } = await renderSSRHead(ssrContext.head, renderSSRHeadOptions);
  const htmlContext = {
    htmlAttrs: htmlAttrs ? [htmlAttrs] : [],
    head: normalizeChunks([headTags]),
    bodyAttrs: bodyAttrs ? [bodyAttrs] : [],
    bodyPrepend: normalizeChunks([bodyTagsOpen, ssrContext.teleports?.body]),
    body: [
      replaceIslandTeleports(ssrContext, _rendered.html) ,
      APP_TELEPORT_OPEN_TAG + (HAS_APP_TELEPORTS ? joinTags([ssrContext.teleports?.[`#${appTeleportAttrs.id}`]]) : "") + APP_TELEPORT_CLOSE_TAG
    ],
    bodyAppend: [bodyTags]
  };
  await nitroApp.hooks.callHook("render:html", htmlContext, { event });
  return {
    body: renderHTMLDocument(htmlContext),
    statusCode: getResponseStatus(event),
    statusMessage: getResponseStatusText(event),
    headers: {
      "content-type": "text/html;charset=utf-8",
      "x-powered-by": "Nuxt"
    }
  };
});
function normalizeChunks(chunks) {
  const result = [];
  for (const _chunk of chunks) {
    const chunk = _chunk?.trim();
    if (chunk) {
      result.push(chunk);
    }
  }
  return result;
}
function joinTags(tags) {
  return tags.join("");
}
function joinAttrs(chunks) {
  if (chunks.length === 0) {
    return "";
  }
  return " " + chunks.join(" ");
}
function renderHTMLDocument(html) {
  return `<!DOCTYPE html><html${joinAttrs(html.htmlAttrs)}><head>${joinTags(html.head)}</head><body${joinAttrs(html.bodyAttrs)}>${joinTags(html.bodyPrepend)}${joinTags(html.body)}${joinTags(html.bodyAppend)}</body></html>`;
}

const renderer$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: renderer
}, Symbol.toStringTag, { value: 'Module' }));
//# sourceMappingURL=index.mjs.map
