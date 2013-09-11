var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && (el.scrollWidth != el.clientWidth || el.scrollHeight != el.clientHeight) && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if(goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY
  }else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY)
  }
  if(!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY
  }
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return new goog.math.Size(element.offsetWidth, element.offsetHeight)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var originalWidth = element.offsetWidth;
  var originalHeight = element.offsetHeight;
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return new goog.math.Size(originalWidth, originalHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function() {
  var mockElement = goog.dom.createElement("div");
  mockElement.style.cssText = "visibility:hidden;overflow:scroll;" + "position:absolute;top:0;width:100px;height:100px";
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf(x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__5820__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__5820 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5820__delegate.call(this, array, i, idxs)
    };
    G__5820.cljs$lang$maxFixedArity = 2;
    G__5820.cljs$lang$applyTo = function(arglist__5821) {
      var array = cljs.core.first(arglist__5821);
      var i = cljs.core.first(cljs.core.next(arglist__5821));
      var idxs = cljs.core.rest(cljs.core.next(arglist__5821));
      return G__5820__delegate(array, i, idxs)
    };
    G__5820.cljs$lang$arity$variadic = G__5820__delegate;
    return G__5820
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto____5885 = this$;
      if(and__3941__auto____5885) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto____5885
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3943__auto____5886 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5886) {
          return or__3943__auto____5886
        }else {
          var or__3943__auto____5887 = cljs.core._invoke["_"];
          if(or__3943__auto____5887) {
            return or__3943__auto____5887
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto____5888 = this$;
      if(and__3941__auto____5888) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto____5888
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3943__auto____5889 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5889) {
          return or__3943__auto____5889
        }else {
          var or__3943__auto____5890 = cljs.core._invoke["_"];
          if(or__3943__auto____5890) {
            return or__3943__auto____5890
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto____5891 = this$;
      if(and__3941__auto____5891) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto____5891
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3943__auto____5892 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5892) {
          return or__3943__auto____5892
        }else {
          var or__3943__auto____5893 = cljs.core._invoke["_"];
          if(or__3943__auto____5893) {
            return or__3943__auto____5893
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto____5894 = this$;
      if(and__3941__auto____5894) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto____5894
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3943__auto____5895 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5895) {
          return or__3943__auto____5895
        }else {
          var or__3943__auto____5896 = cljs.core._invoke["_"];
          if(or__3943__auto____5896) {
            return or__3943__auto____5896
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto____5897 = this$;
      if(and__3941__auto____5897) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto____5897
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3943__auto____5898 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5898) {
          return or__3943__auto____5898
        }else {
          var or__3943__auto____5899 = cljs.core._invoke["_"];
          if(or__3943__auto____5899) {
            return or__3943__auto____5899
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto____5900 = this$;
      if(and__3941__auto____5900) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto____5900
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3943__auto____5901 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5901) {
          return or__3943__auto____5901
        }else {
          var or__3943__auto____5902 = cljs.core._invoke["_"];
          if(or__3943__auto____5902) {
            return or__3943__auto____5902
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto____5903 = this$;
      if(and__3941__auto____5903) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto____5903
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3943__auto____5904 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5904) {
          return or__3943__auto____5904
        }else {
          var or__3943__auto____5905 = cljs.core._invoke["_"];
          if(or__3943__auto____5905) {
            return or__3943__auto____5905
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto____5906 = this$;
      if(and__3941__auto____5906) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto____5906
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3943__auto____5907 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5907) {
          return or__3943__auto____5907
        }else {
          var or__3943__auto____5908 = cljs.core._invoke["_"];
          if(or__3943__auto____5908) {
            return or__3943__auto____5908
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto____5909 = this$;
      if(and__3941__auto____5909) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto____5909
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3943__auto____5910 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5910) {
          return or__3943__auto____5910
        }else {
          var or__3943__auto____5911 = cljs.core._invoke["_"];
          if(or__3943__auto____5911) {
            return or__3943__auto____5911
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto____5912 = this$;
      if(and__3941__auto____5912) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto____5912
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3943__auto____5913 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5913) {
          return or__3943__auto____5913
        }else {
          var or__3943__auto____5914 = cljs.core._invoke["_"];
          if(or__3943__auto____5914) {
            return or__3943__auto____5914
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto____5915 = this$;
      if(and__3941__auto____5915) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto____5915
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3943__auto____5916 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5916) {
          return or__3943__auto____5916
        }else {
          var or__3943__auto____5917 = cljs.core._invoke["_"];
          if(or__3943__auto____5917) {
            return or__3943__auto____5917
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto____5918 = this$;
      if(and__3941__auto____5918) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto____5918
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3943__auto____5919 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5919) {
          return or__3943__auto____5919
        }else {
          var or__3943__auto____5920 = cljs.core._invoke["_"];
          if(or__3943__auto____5920) {
            return or__3943__auto____5920
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto____5921 = this$;
      if(and__3941__auto____5921) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto____5921
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3943__auto____5922 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5922) {
          return or__3943__auto____5922
        }else {
          var or__3943__auto____5923 = cljs.core._invoke["_"];
          if(or__3943__auto____5923) {
            return or__3943__auto____5923
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto____5924 = this$;
      if(and__3941__auto____5924) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto____5924
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3943__auto____5925 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5925) {
          return or__3943__auto____5925
        }else {
          var or__3943__auto____5926 = cljs.core._invoke["_"];
          if(or__3943__auto____5926) {
            return or__3943__auto____5926
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto____5927 = this$;
      if(and__3941__auto____5927) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto____5927
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3943__auto____5928 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5928) {
          return or__3943__auto____5928
        }else {
          var or__3943__auto____5929 = cljs.core._invoke["_"];
          if(or__3943__auto____5929) {
            return or__3943__auto____5929
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto____5930 = this$;
      if(and__3941__auto____5930) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto____5930
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3943__auto____5931 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5931) {
          return or__3943__auto____5931
        }else {
          var or__3943__auto____5932 = cljs.core._invoke["_"];
          if(or__3943__auto____5932) {
            return or__3943__auto____5932
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto____5933 = this$;
      if(and__3941__auto____5933) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto____5933
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3943__auto____5934 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5934) {
          return or__3943__auto____5934
        }else {
          var or__3943__auto____5935 = cljs.core._invoke["_"];
          if(or__3943__auto____5935) {
            return or__3943__auto____5935
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto____5936 = this$;
      if(and__3941__auto____5936) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto____5936
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3943__auto____5937 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5937) {
          return or__3943__auto____5937
        }else {
          var or__3943__auto____5938 = cljs.core._invoke["_"];
          if(or__3943__auto____5938) {
            return or__3943__auto____5938
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto____5939 = this$;
      if(and__3941__auto____5939) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto____5939
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3943__auto____5940 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5940) {
          return or__3943__auto____5940
        }else {
          var or__3943__auto____5941 = cljs.core._invoke["_"];
          if(or__3943__auto____5941) {
            return or__3943__auto____5941
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto____5942 = this$;
      if(and__3941__auto____5942) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto____5942
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3943__auto____5943 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5943) {
          return or__3943__auto____5943
        }else {
          var or__3943__auto____5944 = cljs.core._invoke["_"];
          if(or__3943__auto____5944) {
            return or__3943__auto____5944
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto____5945 = this$;
      if(and__3941__auto____5945) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto____5945
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3943__auto____5946 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5946) {
          return or__3943__auto____5946
        }else {
          var or__3943__auto____5947 = cljs.core._invoke["_"];
          if(or__3943__auto____5947) {
            return or__3943__auto____5947
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto____5951 = coll;
    if(and__3941__auto____5951) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto____5951
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____5952 = cljs.core._count[goog.typeOf(coll)];
      if(or__3943__auto____5952) {
        return or__3943__auto____5952
      }else {
        var or__3943__auto____5953 = cljs.core._count["_"];
        if(or__3943__auto____5953) {
          return or__3943__auto____5953
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto____5957 = coll;
    if(and__3941__auto____5957) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto____5957
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____5958 = cljs.core._empty[goog.typeOf(coll)];
      if(or__3943__auto____5958) {
        return or__3943__auto____5958
      }else {
        var or__3943__auto____5959 = cljs.core._empty["_"];
        if(or__3943__auto____5959) {
          return or__3943__auto____5959
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto____5963 = coll;
    if(and__3941__auto____5963) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto____5963
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3943__auto____5964 = cljs.core._conj[goog.typeOf(coll)];
      if(or__3943__auto____5964) {
        return or__3943__auto____5964
      }else {
        var or__3943__auto____5965 = cljs.core._conj["_"];
        if(or__3943__auto____5965) {
          return or__3943__auto____5965
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto____5972 = coll;
      if(and__3941__auto____5972) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto____5972
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3943__auto____5973 = cljs.core._nth[goog.typeOf(coll)];
        if(or__3943__auto____5973) {
          return or__3943__auto____5973
        }else {
          var or__3943__auto____5974 = cljs.core._nth["_"];
          if(or__3943__auto____5974) {
            return or__3943__auto____5974
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto____5975 = coll;
      if(and__3941__auto____5975) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto____5975
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3943__auto____5976 = cljs.core._nth[goog.typeOf(coll)];
        if(or__3943__auto____5976) {
          return or__3943__auto____5976
        }else {
          var or__3943__auto____5977 = cljs.core._nth["_"];
          if(or__3943__auto____5977) {
            return or__3943__auto____5977
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto____5981 = coll;
    if(and__3941__auto____5981) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto____5981
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____5982 = cljs.core._first[goog.typeOf(coll)];
      if(or__3943__auto____5982) {
        return or__3943__auto____5982
      }else {
        var or__3943__auto____5983 = cljs.core._first["_"];
        if(or__3943__auto____5983) {
          return or__3943__auto____5983
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto____5987 = coll;
    if(and__3941__auto____5987) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto____5987
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____5988 = cljs.core._rest[goog.typeOf(coll)];
      if(or__3943__auto____5988) {
        return or__3943__auto____5988
      }else {
        var or__3943__auto____5989 = cljs.core._rest["_"];
        if(or__3943__auto____5989) {
          return or__3943__auto____5989
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto____5993 = coll;
    if(and__3941__auto____5993) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto____5993
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____5994 = cljs.core._next[goog.typeOf(coll)];
      if(or__3943__auto____5994) {
        return or__3943__auto____5994
      }else {
        var or__3943__auto____5995 = cljs.core._next["_"];
        if(or__3943__auto____5995) {
          return or__3943__auto____5995
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto____6002 = o;
      if(and__3941__auto____6002) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto____6002
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3943__auto____6003 = cljs.core._lookup[goog.typeOf(o)];
        if(or__3943__auto____6003) {
          return or__3943__auto____6003
        }else {
          var or__3943__auto____6004 = cljs.core._lookup["_"];
          if(or__3943__auto____6004) {
            return or__3943__auto____6004
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto____6005 = o;
      if(and__3941__auto____6005) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto____6005
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3943__auto____6006 = cljs.core._lookup[goog.typeOf(o)];
        if(or__3943__auto____6006) {
          return or__3943__auto____6006
        }else {
          var or__3943__auto____6007 = cljs.core._lookup["_"];
          if(or__3943__auto____6007) {
            return or__3943__auto____6007
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto____6011 = coll;
    if(and__3941__auto____6011) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto____6011
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3943__auto____6012 = cljs.core._contains_key_QMARK_[goog.typeOf(coll)];
      if(or__3943__auto____6012) {
        return or__3943__auto____6012
      }else {
        var or__3943__auto____6013 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____6013) {
          return or__3943__auto____6013
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto____6017 = coll;
    if(and__3941__auto____6017) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto____6017
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3943__auto____6018 = cljs.core._assoc[goog.typeOf(coll)];
      if(or__3943__auto____6018) {
        return or__3943__auto____6018
      }else {
        var or__3943__auto____6019 = cljs.core._assoc["_"];
        if(or__3943__auto____6019) {
          return or__3943__auto____6019
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto____6023 = coll;
    if(and__3941__auto____6023) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto____6023
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3943__auto____6024 = cljs.core._dissoc[goog.typeOf(coll)];
      if(or__3943__auto____6024) {
        return or__3943__auto____6024
      }else {
        var or__3943__auto____6025 = cljs.core._dissoc["_"];
        if(or__3943__auto____6025) {
          return or__3943__auto____6025
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto____6029 = coll;
    if(and__3941__auto____6029) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto____6029
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6030 = cljs.core._key[goog.typeOf(coll)];
      if(or__3943__auto____6030) {
        return or__3943__auto____6030
      }else {
        var or__3943__auto____6031 = cljs.core._key["_"];
        if(or__3943__auto____6031) {
          return or__3943__auto____6031
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto____6035 = coll;
    if(and__3941__auto____6035) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto____6035
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6036 = cljs.core._val[goog.typeOf(coll)];
      if(or__3943__auto____6036) {
        return or__3943__auto____6036
      }else {
        var or__3943__auto____6037 = cljs.core._val["_"];
        if(or__3943__auto____6037) {
          return or__3943__auto____6037
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto____6041 = coll;
    if(and__3941__auto____6041) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto____6041
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3943__auto____6042 = cljs.core._disjoin[goog.typeOf(coll)];
      if(or__3943__auto____6042) {
        return or__3943__auto____6042
      }else {
        var or__3943__auto____6043 = cljs.core._disjoin["_"];
        if(or__3943__auto____6043) {
          return or__3943__auto____6043
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto____6047 = coll;
    if(and__3941__auto____6047) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto____6047
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6048 = cljs.core._peek[goog.typeOf(coll)];
      if(or__3943__auto____6048) {
        return or__3943__auto____6048
      }else {
        var or__3943__auto____6049 = cljs.core._peek["_"];
        if(or__3943__auto____6049) {
          return or__3943__auto____6049
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto____6053 = coll;
    if(and__3941__auto____6053) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto____6053
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6054 = cljs.core._pop[goog.typeOf(coll)];
      if(or__3943__auto____6054) {
        return or__3943__auto____6054
      }else {
        var or__3943__auto____6055 = cljs.core._pop["_"];
        if(or__3943__auto____6055) {
          return or__3943__auto____6055
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto____6059 = coll;
    if(and__3941__auto____6059) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto____6059
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3943__auto____6060 = cljs.core._assoc_n[goog.typeOf(coll)];
      if(or__3943__auto____6060) {
        return or__3943__auto____6060
      }else {
        var or__3943__auto____6061 = cljs.core._assoc_n["_"];
        if(or__3943__auto____6061) {
          return or__3943__auto____6061
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto____6065 = o;
    if(and__3941__auto____6065) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto____6065
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6066 = cljs.core._deref[goog.typeOf(o)];
      if(or__3943__auto____6066) {
        return or__3943__auto____6066
      }else {
        var or__3943__auto____6067 = cljs.core._deref["_"];
        if(or__3943__auto____6067) {
          return or__3943__auto____6067
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto____6071 = o;
    if(and__3941__auto____6071) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto____6071
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3943__auto____6072 = cljs.core._deref_with_timeout[goog.typeOf(o)];
      if(or__3943__auto____6072) {
        return or__3943__auto____6072
      }else {
        var or__3943__auto____6073 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____6073) {
          return or__3943__auto____6073
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto____6077 = o;
    if(and__3941__auto____6077) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto____6077
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6078 = cljs.core._meta[goog.typeOf(o)];
      if(or__3943__auto____6078) {
        return or__3943__auto____6078
      }else {
        var or__3943__auto____6079 = cljs.core._meta["_"];
        if(or__3943__auto____6079) {
          return or__3943__auto____6079
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto____6083 = o;
    if(and__3941__auto____6083) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto____6083
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3943__auto____6084 = cljs.core._with_meta[goog.typeOf(o)];
      if(or__3943__auto____6084) {
        return or__3943__auto____6084
      }else {
        var or__3943__auto____6085 = cljs.core._with_meta["_"];
        if(or__3943__auto____6085) {
          return or__3943__auto____6085
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto____6092 = coll;
      if(and__3941__auto____6092) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto____6092
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3943__auto____6093 = cljs.core._reduce[goog.typeOf(coll)];
        if(or__3943__auto____6093) {
          return or__3943__auto____6093
        }else {
          var or__3943__auto____6094 = cljs.core._reduce["_"];
          if(or__3943__auto____6094) {
            return or__3943__auto____6094
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto____6095 = coll;
      if(and__3941__auto____6095) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto____6095
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3943__auto____6096 = cljs.core._reduce[goog.typeOf(coll)];
        if(or__3943__auto____6096) {
          return or__3943__auto____6096
        }else {
          var or__3943__auto____6097 = cljs.core._reduce["_"];
          if(or__3943__auto____6097) {
            return or__3943__auto____6097
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto____6101 = coll;
    if(and__3941__auto____6101) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto____6101
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3943__auto____6102 = cljs.core._kv_reduce[goog.typeOf(coll)];
      if(or__3943__auto____6102) {
        return or__3943__auto____6102
      }else {
        var or__3943__auto____6103 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____6103) {
          return or__3943__auto____6103
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto____6107 = o;
    if(and__3941__auto____6107) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto____6107
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3943__auto____6108 = cljs.core._equiv[goog.typeOf(o)];
      if(or__3943__auto____6108) {
        return or__3943__auto____6108
      }else {
        var or__3943__auto____6109 = cljs.core._equiv["_"];
        if(or__3943__auto____6109) {
          return or__3943__auto____6109
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto____6113 = o;
    if(and__3941__auto____6113) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto____6113
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6114 = cljs.core._hash[goog.typeOf(o)];
      if(or__3943__auto____6114) {
        return or__3943__auto____6114
      }else {
        var or__3943__auto____6115 = cljs.core._hash["_"];
        if(or__3943__auto____6115) {
          return or__3943__auto____6115
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto____6119 = o;
    if(and__3941__auto____6119) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto____6119
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6120 = cljs.core._seq[goog.typeOf(o)];
      if(or__3943__auto____6120) {
        return or__3943__auto____6120
      }else {
        var or__3943__auto____6121 = cljs.core._seq["_"];
        if(or__3943__auto____6121) {
          return or__3943__auto____6121
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto____6125 = coll;
    if(and__3941__auto____6125) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto____6125
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6126 = cljs.core._rseq[goog.typeOf(coll)];
      if(or__3943__auto____6126) {
        return or__3943__auto____6126
      }else {
        var or__3943__auto____6127 = cljs.core._rseq["_"];
        if(or__3943__auto____6127) {
          return or__3943__auto____6127
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6131 = coll;
    if(and__3941__auto____6131) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto____6131
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3943__auto____6132 = cljs.core._sorted_seq[goog.typeOf(coll)];
      if(or__3943__auto____6132) {
        return or__3943__auto____6132
      }else {
        var or__3943__auto____6133 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____6133) {
          return or__3943__auto____6133
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6137 = coll;
    if(and__3941__auto____6137) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto____6137
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3943__auto____6138 = cljs.core._sorted_seq_from[goog.typeOf(coll)];
      if(or__3943__auto____6138) {
        return or__3943__auto____6138
      }else {
        var or__3943__auto____6139 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____6139) {
          return or__3943__auto____6139
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto____6143 = coll;
    if(and__3941__auto____6143) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto____6143
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3943__auto____6144 = cljs.core._entry_key[goog.typeOf(coll)];
      if(or__3943__auto____6144) {
        return or__3943__auto____6144
      }else {
        var or__3943__auto____6145 = cljs.core._entry_key["_"];
        if(or__3943__auto____6145) {
          return or__3943__auto____6145
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto____6149 = coll;
    if(and__3941__auto____6149) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto____6149
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6150 = cljs.core._comparator[goog.typeOf(coll)];
      if(or__3943__auto____6150) {
        return or__3943__auto____6150
      }else {
        var or__3943__auto____6151 = cljs.core._comparator["_"];
        if(or__3943__auto____6151) {
          return or__3943__auto____6151
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3941__auto____6155 = o;
    if(and__3941__auto____6155) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3941__auto____6155
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3943__auto____6156 = cljs.core._pr_seq[goog.typeOf(o)];
      if(or__3943__auto____6156) {
        return or__3943__auto____6156
      }else {
        var or__3943__auto____6157 = cljs.core._pr_seq["_"];
        if(or__3943__auto____6157) {
          return or__3943__auto____6157
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto____6161 = d;
    if(and__3941__auto____6161) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto____6161
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3943__auto____6162 = cljs.core._realized_QMARK_[goog.typeOf(d)];
      if(or__3943__auto____6162) {
        return or__3943__auto____6162
      }else {
        var or__3943__auto____6163 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____6163) {
          return or__3943__auto____6163
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto____6167 = this$;
    if(and__3941__auto____6167) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto____6167
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3943__auto____6168 = cljs.core._notify_watches[goog.typeOf(this$)];
      if(or__3943__auto____6168) {
        return or__3943__auto____6168
      }else {
        var or__3943__auto____6169 = cljs.core._notify_watches["_"];
        if(or__3943__auto____6169) {
          return or__3943__auto____6169
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto____6173 = this$;
    if(and__3941__auto____6173) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto____6173
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3943__auto____6174 = cljs.core._add_watch[goog.typeOf(this$)];
      if(or__3943__auto____6174) {
        return or__3943__auto____6174
      }else {
        var or__3943__auto____6175 = cljs.core._add_watch["_"];
        if(or__3943__auto____6175) {
          return or__3943__auto____6175
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto____6179 = this$;
    if(and__3941__auto____6179) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto____6179
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3943__auto____6180 = cljs.core._remove_watch[goog.typeOf(this$)];
      if(or__3943__auto____6180) {
        return or__3943__auto____6180
      }else {
        var or__3943__auto____6181 = cljs.core._remove_watch["_"];
        if(or__3943__auto____6181) {
          return or__3943__auto____6181
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto____6185 = coll;
    if(and__3941__auto____6185) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto____6185
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6186 = cljs.core._as_transient[goog.typeOf(coll)];
      if(or__3943__auto____6186) {
        return or__3943__auto____6186
      }else {
        var or__3943__auto____6187 = cljs.core._as_transient["_"];
        if(or__3943__auto____6187) {
          return or__3943__auto____6187
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto____6191 = tcoll;
    if(and__3941__auto____6191) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto____6191
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3943__auto____6192 = cljs.core._conj_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6192) {
        return or__3943__auto____6192
      }else {
        var or__3943__auto____6193 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____6193) {
          return or__3943__auto____6193
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6197 = tcoll;
    if(and__3941__auto____6197) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto____6197
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3943__auto____6198 = cljs.core._persistent_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6198) {
        return or__3943__auto____6198
      }else {
        var or__3943__auto____6199 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____6199) {
          return or__3943__auto____6199
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto____6203 = tcoll;
    if(and__3941__auto____6203) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto____6203
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3943__auto____6204 = cljs.core._assoc_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6204) {
        return or__3943__auto____6204
      }else {
        var or__3943__auto____6205 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____6205) {
          return or__3943__auto____6205
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto____6209 = tcoll;
    if(and__3941__auto____6209) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto____6209
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3943__auto____6210 = cljs.core._dissoc_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6210) {
        return or__3943__auto____6210
      }else {
        var or__3943__auto____6211 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____6211) {
          return or__3943__auto____6211
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto____6215 = tcoll;
    if(and__3941__auto____6215) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto____6215
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3943__auto____6216 = cljs.core._assoc_n_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6216) {
        return or__3943__auto____6216
      }else {
        var or__3943__auto____6217 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____6217) {
          return or__3943__auto____6217
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6221 = tcoll;
    if(and__3941__auto____6221) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto____6221
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3943__auto____6222 = cljs.core._pop_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6222) {
        return or__3943__auto____6222
      }else {
        var or__3943__auto____6223 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____6223) {
          return or__3943__auto____6223
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto____6227 = tcoll;
    if(and__3941__auto____6227) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto____6227
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3943__auto____6228 = cljs.core._disjoin_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6228) {
        return or__3943__auto____6228
      }else {
        var or__3943__auto____6229 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____6229) {
          return or__3943__auto____6229
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
void 0;
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto____6233 = x;
    if(and__3941__auto____6233) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto____6233
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    return function() {
      var or__3943__auto____6234 = cljs.core._compare[goog.typeOf(x)];
      if(or__3943__auto____6234) {
        return or__3943__auto____6234
      }else {
        var or__3943__auto____6235 = cljs.core._compare["_"];
        if(or__3943__auto____6235) {
          return or__3943__auto____6235
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
void 0;
void 0;
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto____6239 = coll;
    if(and__3941__auto____6239) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto____6239
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6240 = cljs.core._drop_first[goog.typeOf(coll)];
      if(or__3943__auto____6240) {
        return or__3943__auto____6240
      }else {
        var or__3943__auto____6241 = cljs.core._drop_first["_"];
        if(or__3943__auto____6241) {
          return or__3943__auto____6241
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto____6245 = coll;
    if(and__3941__auto____6245) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto____6245
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6246 = cljs.core._chunked_first[goog.typeOf(coll)];
      if(or__3943__auto____6246) {
        return or__3943__auto____6246
      }else {
        var or__3943__auto____6247 = cljs.core._chunked_first["_"];
        if(or__3943__auto____6247) {
          return or__3943__auto____6247
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto____6251 = coll;
    if(and__3941__auto____6251) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto____6251
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6252 = cljs.core._chunked_rest[goog.typeOf(coll)];
      if(or__3943__auto____6252) {
        return or__3943__auto____6252
      }else {
        var or__3943__auto____6253 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____6253) {
          return or__3943__auto____6253
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto____6257 = coll;
    if(and__3941__auto____6257) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto____6257
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6258 = cljs.core._chunked_next[goog.typeOf(coll)];
      if(or__3943__auto____6258) {
        return or__3943__auto____6258
      }else {
        var or__3943__auto____6259 = cljs.core._chunked_next["_"];
        if(or__3943__auto____6259) {
          return or__3943__auto____6259
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto____6261 = x === y;
    if(or__3943__auto____6261) {
      return or__3943__auto____6261
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6262__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6263 = y;
            var G__6264 = cljs.core.first.call(null, more);
            var G__6265 = cljs.core.next.call(null, more);
            x = G__6263;
            y = G__6264;
            more = G__6265;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6262 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6262__delegate.call(this, x, y, more)
    };
    G__6262.cljs$lang$maxFixedArity = 2;
    G__6262.cljs$lang$applyTo = function(arglist__6266) {
      var x = cljs.core.first(arglist__6266);
      var y = cljs.core.first(cljs.core.next(arglist__6266));
      var more = cljs.core.rest(cljs.core.next(arglist__6266));
      return G__6262__delegate(x, y, more)
    };
    G__6262.cljs$lang$arity$variadic = G__6262__delegate;
    return G__6262
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6267 = null;
  var G__6267__2 = function(o, k) {
    return null
  };
  var G__6267__3 = function(o, k, not_found) {
    return not_found
  };
  G__6267 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6267__2.call(this, o, k);
      case 3:
        return G__6267__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6267
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6268 = null;
  var G__6268__2 = function(_, f) {
    return f.call(null)
  };
  var G__6268__3 = function(_, f, start) {
    return start
  };
  G__6268 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6268__2.call(this, _, f);
      case 3:
        return G__6268__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6268
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6269 = null;
  var G__6269__2 = function(_, n) {
    return null
  };
  var G__6269__3 = function(_, n, not_found) {
    return not_found
  };
  G__6269 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6269__2.call(this, _, n);
      case 3:
        return G__6269__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6269
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6282 = cljs.core._count.call(null, cicoll);
    if(cnt__6282 === 0) {
      return f.call(null)
    }else {
      var val__6283 = cljs.core._nth.call(null, cicoll, 0);
      var n__6284 = 1;
      while(true) {
        if(n__6284 < cnt__6282) {
          var nval__6285 = f.call(null, val__6283, cljs.core._nth.call(null, cicoll, n__6284));
          if(cljs.core.reduced_QMARK_.call(null, nval__6285)) {
            return cljs.core.deref.call(null, nval__6285)
          }else {
            var G__6294 = nval__6285;
            var G__6295 = n__6284 + 1;
            val__6283 = G__6294;
            n__6284 = G__6295;
            continue
          }
        }else {
          return val__6283
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6286 = cljs.core._count.call(null, cicoll);
    var val__6287 = val;
    var n__6288 = 0;
    while(true) {
      if(n__6288 < cnt__6286) {
        var nval__6289 = f.call(null, val__6287, cljs.core._nth.call(null, cicoll, n__6288));
        if(cljs.core.reduced_QMARK_.call(null, nval__6289)) {
          return cljs.core.deref.call(null, nval__6289)
        }else {
          var G__6296 = nval__6289;
          var G__6297 = n__6288 + 1;
          val__6287 = G__6296;
          n__6288 = G__6297;
          continue
        }
      }else {
        return val__6287
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6290 = cljs.core._count.call(null, cicoll);
    var val__6291 = val;
    var n__6292 = idx;
    while(true) {
      if(n__6292 < cnt__6290) {
        var nval__6293 = f.call(null, val__6291, cljs.core._nth.call(null, cicoll, n__6292));
        if(cljs.core.reduced_QMARK_.call(null, nval__6293)) {
          return cljs.core.deref.call(null, nval__6293)
        }else {
          var G__6298 = nval__6293;
          var G__6299 = n__6292 + 1;
          val__6291 = G__6298;
          n__6292 = G__6299;
          continue
        }
      }else {
        return val__6291
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6312 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6313 = arr[0];
      var n__6314 = 1;
      while(true) {
        if(n__6314 < cnt__6312) {
          var nval__6315 = f.call(null, val__6313, arr[n__6314]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6315)) {
            return cljs.core.deref.call(null, nval__6315)
          }else {
            var G__6324 = nval__6315;
            var G__6325 = n__6314 + 1;
            val__6313 = G__6324;
            n__6314 = G__6325;
            continue
          }
        }else {
          return val__6313
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6316 = arr.length;
    var val__6317 = val;
    var n__6318 = 0;
    while(true) {
      if(n__6318 < cnt__6316) {
        var nval__6319 = f.call(null, val__6317, arr[n__6318]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6319)) {
          return cljs.core.deref.call(null, nval__6319)
        }else {
          var G__6326 = nval__6319;
          var G__6327 = n__6318 + 1;
          val__6317 = G__6326;
          n__6318 = G__6327;
          continue
        }
      }else {
        return val__6317
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6320 = arr.length;
    var val__6321 = val;
    var n__6322 = idx;
    while(true) {
      if(n__6322 < cnt__6320) {
        var nval__6323 = f.call(null, val__6321, arr[n__6322]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6323)) {
          return cljs.core.deref.call(null, nval__6323)
        }else {
          var G__6328 = nval__6323;
          var G__6329 = n__6322 + 1;
          val__6321 = G__6328;
          n__6322 = G__6329;
          continue
        }
      }else {
        return val__6321
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6330 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6331 = this;
  if(this__6331.i + 1 < this__6331.a.length) {
    return new cljs.core.IndexedSeq(this__6331.a, this__6331.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6332 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6333 = this;
  var c__6334 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6334 > 0) {
    return new cljs.core.RSeq(coll, c__6334 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6335 = this;
  var this__6336 = this;
  return cljs.core.pr_str.call(null, this__6336)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6337 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6337.a)) {
    return cljs.core.ci_reduce.call(null, this__6337.a, f, this__6337.a[this__6337.i], this__6337.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6337.a[this__6337.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6338 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6338.a)) {
    return cljs.core.ci_reduce.call(null, this__6338.a, f, start, this__6338.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6339 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6340 = this;
  return this__6340.a.length - this__6340.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6341 = this;
  return this__6341.a[this__6341.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6342 = this;
  if(this__6342.i + 1 < this__6342.a.length) {
    return new cljs.core.IndexedSeq(this__6342.a, this__6342.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6343 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6344 = this;
  var i__6345 = n + this__6344.i;
  if(i__6345 < this__6344.a.length) {
    return this__6344.a[i__6345]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6346 = this;
  var i__6347 = n + this__6346.i;
  if(i__6347 < this__6346.a.length) {
    return this__6346.a[i__6347]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6348 = null;
  var G__6348__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6348__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6348 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6348__2.call(this, array, f);
      case 3:
        return G__6348__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6348
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6349 = null;
  var G__6349__2 = function(array, k) {
    return array[k]
  };
  var G__6349__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6349 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6349__2.call(this, array, k);
      case 3:
        return G__6349__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6349
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6350 = null;
  var G__6350__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6350__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6350 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6350__2.call(this, array, n);
      case 3:
        return G__6350__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6350
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6351 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6352 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6353 = this;
  var this__6354 = this;
  return cljs.core.pr_str.call(null, this__6354)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6355 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6356 = this;
  return this__6356.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6357 = this;
  return cljs.core._nth.call(null, this__6357.ci, this__6357.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6358 = this;
  if(this__6358.i > 0) {
    return new cljs.core.RSeq(this__6358.ci, this__6358.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6359 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6360 = this;
  return new cljs.core.RSeq(this__6360.ci, this__6360.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6361 = this;
  return this__6361.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6365__6366 = coll;
      if(G__6365__6366) {
        if(function() {
          var or__3943__auto____6367 = G__6365__6366.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3943__auto____6367) {
            return or__3943__auto____6367
          }else {
            return G__6365__6366.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6365__6366.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6365__6366)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6365__6366)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6372__6373 = coll;
      if(G__6372__6373) {
        if(function() {
          var or__3943__auto____6374 = G__6372__6373.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6374) {
            return or__3943__auto____6374
          }else {
            return G__6372__6373.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6372__6373.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6372__6373)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6372__6373)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6375 = cljs.core.seq.call(null, coll);
      if(s__6375 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6375)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6380__6381 = coll;
      if(G__6380__6381) {
        if(function() {
          var or__3943__auto____6382 = G__6380__6381.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6382) {
            return or__3943__auto____6382
          }else {
            return G__6380__6381.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6380__6381.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6380__6381)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6380__6381)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6383 = cljs.core.seq.call(null, coll);
      if(!(s__6383 == null)) {
        return cljs.core._rest.call(null, s__6383)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6387__6388 = coll;
      if(G__6387__6388) {
        if(function() {
          var or__3943__auto____6389 = G__6387__6388.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto____6389) {
            return or__3943__auto____6389
          }else {
            return G__6387__6388.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6387__6388.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6387__6388)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6387__6388)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6391 = cljs.core.next.call(null, s);
    if(!(sn__6391 == null)) {
      var G__6392 = sn__6391;
      s = G__6392;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6393__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6394 = conj.call(null, coll, x);
          var G__6395 = cljs.core.first.call(null, xs);
          var G__6396 = cljs.core.next.call(null, xs);
          coll = G__6394;
          x = G__6395;
          xs = G__6396;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6393 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6393__delegate.call(this, coll, x, xs)
    };
    G__6393.cljs$lang$maxFixedArity = 2;
    G__6393.cljs$lang$applyTo = function(arglist__6397) {
      var coll = cljs.core.first(arglist__6397);
      var x = cljs.core.first(cljs.core.next(arglist__6397));
      var xs = cljs.core.rest(cljs.core.next(arglist__6397));
      return G__6393__delegate(coll, x, xs)
    };
    G__6393.cljs$lang$arity$variadic = G__6393__delegate;
    return G__6393
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6400 = cljs.core.seq.call(null, coll);
  var acc__6401 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6400)) {
      return acc__6401 + cljs.core._count.call(null, s__6400)
    }else {
      var G__6402 = cljs.core.next.call(null, s__6400);
      var G__6403 = acc__6401 + 1;
      s__6400 = G__6402;
      acc__6401 = G__6403;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6410__6411 = coll;
        if(G__6410__6411) {
          if(function() {
            var or__3943__auto____6412 = G__6410__6411.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6412) {
              return or__3943__auto____6412
            }else {
              return G__6410__6411.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6410__6411.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6410__6411)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6410__6411)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6413__6414 = coll;
        if(G__6413__6414) {
          if(function() {
            var or__3943__auto____6415 = G__6413__6414.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6415) {
              return or__3943__auto____6415
            }else {
              return G__6413__6414.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6413__6414.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6413__6414)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6413__6414)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6418__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6417 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6419 = ret__6417;
          var G__6420 = cljs.core.first.call(null, kvs);
          var G__6421 = cljs.core.second.call(null, kvs);
          var G__6422 = cljs.core.nnext.call(null, kvs);
          coll = G__6419;
          k = G__6420;
          v = G__6421;
          kvs = G__6422;
          continue
        }else {
          return ret__6417
        }
        break
      }
    };
    var G__6418 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6418__delegate.call(this, coll, k, v, kvs)
    };
    G__6418.cljs$lang$maxFixedArity = 3;
    G__6418.cljs$lang$applyTo = function(arglist__6423) {
      var coll = cljs.core.first(arglist__6423);
      var k = cljs.core.first(cljs.core.next(arglist__6423));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6423)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6423)));
      return G__6418__delegate(coll, k, v, kvs)
    };
    G__6418.cljs$lang$arity$variadic = G__6418__delegate;
    return G__6418
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6426__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6425 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6427 = ret__6425;
          var G__6428 = cljs.core.first.call(null, ks);
          var G__6429 = cljs.core.next.call(null, ks);
          coll = G__6427;
          k = G__6428;
          ks = G__6429;
          continue
        }else {
          return ret__6425
        }
        break
      }
    };
    var G__6426 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6426__delegate.call(this, coll, k, ks)
    };
    G__6426.cljs$lang$maxFixedArity = 2;
    G__6426.cljs$lang$applyTo = function(arglist__6430) {
      var coll = cljs.core.first(arglist__6430);
      var k = cljs.core.first(cljs.core.next(arglist__6430));
      var ks = cljs.core.rest(cljs.core.next(arglist__6430));
      return G__6426__delegate(coll, k, ks)
    };
    G__6426.cljs$lang$arity$variadic = G__6426__delegate;
    return G__6426
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6434__6435 = o;
    if(G__6434__6435) {
      if(function() {
        var or__3943__auto____6436 = G__6434__6435.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto____6436) {
          return or__3943__auto____6436
        }else {
          return G__6434__6435.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6434__6435.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6434__6435)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6434__6435)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6439__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6438 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6440 = ret__6438;
          var G__6441 = cljs.core.first.call(null, ks);
          var G__6442 = cljs.core.next.call(null, ks);
          coll = G__6440;
          k = G__6441;
          ks = G__6442;
          continue
        }else {
          return ret__6438
        }
        break
      }
    };
    var G__6439 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6439__delegate.call(this, coll, k, ks)
    };
    G__6439.cljs$lang$maxFixedArity = 2;
    G__6439.cljs$lang$applyTo = function(arglist__6443) {
      var coll = cljs.core.first(arglist__6443);
      var k = cljs.core.first(cljs.core.next(arglist__6443));
      var ks = cljs.core.rest(cljs.core.next(arglist__6443));
      return G__6439__delegate(coll, k, ks)
    };
    G__6439.cljs$lang$arity$variadic = G__6439__delegate;
    return G__6439
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6445 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6445;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6445
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6447 = cljs.core.string_hash_cache[k];
  if(!(h__6447 == null)) {
    return h__6447
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto____6449 = goog.isString(o);
      if(and__3941__auto____6449) {
        return check_cache
      }else {
        return and__3941__auto____6449
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6453__6454 = x;
    if(G__6453__6454) {
      if(function() {
        var or__3943__auto____6455 = G__6453__6454.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto____6455) {
          return or__3943__auto____6455
        }else {
          return G__6453__6454.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6453__6454.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6453__6454)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6453__6454)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6459__6460 = x;
    if(G__6459__6460) {
      if(function() {
        var or__3943__auto____6461 = G__6459__6460.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto____6461) {
          return or__3943__auto____6461
        }else {
          return G__6459__6460.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6459__6460.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6459__6460)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6459__6460)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6465__6466 = x;
  if(G__6465__6466) {
    if(function() {
      var or__3943__auto____6467 = G__6465__6466.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto____6467) {
        return or__3943__auto____6467
      }else {
        return G__6465__6466.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6465__6466.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6465__6466)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6465__6466)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6471__6472 = x;
  if(G__6471__6472) {
    if(function() {
      var or__3943__auto____6473 = G__6471__6472.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto____6473) {
        return or__3943__auto____6473
      }else {
        return G__6471__6472.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6471__6472.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6471__6472)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6471__6472)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6477__6478 = x;
  if(G__6477__6478) {
    if(function() {
      var or__3943__auto____6479 = G__6477__6478.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto____6479) {
        return or__3943__auto____6479
      }else {
        return G__6477__6478.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6477__6478.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6477__6478)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6477__6478)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6483__6484 = x;
  if(G__6483__6484) {
    if(function() {
      var or__3943__auto____6485 = G__6483__6484.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto____6485) {
        return or__3943__auto____6485
      }else {
        return G__6483__6484.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6483__6484.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6483__6484)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6483__6484)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6489__6490 = x;
  if(G__6489__6490) {
    if(function() {
      var or__3943__auto____6491 = G__6489__6490.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto____6491) {
        return or__3943__auto____6491
      }else {
        return G__6489__6490.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6489__6490.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6489__6490)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6489__6490)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6495__6496 = x;
    if(G__6495__6496) {
      if(function() {
        var or__3943__auto____6497 = G__6495__6496.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto____6497) {
          return or__3943__auto____6497
        }else {
          return G__6495__6496.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6495__6496.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6495__6496)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6495__6496)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6501__6502 = x;
  if(G__6501__6502) {
    if(function() {
      var or__3943__auto____6503 = G__6501__6502.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto____6503) {
        return or__3943__auto____6503
      }else {
        return G__6501__6502.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6501__6502.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6501__6502)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6501__6502)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6507__6508 = x;
  if(G__6507__6508) {
    if(cljs.core.truth_(function() {
      var or__3943__auto____6509 = null;
      if(cljs.core.truth_(or__3943__auto____6509)) {
        return or__3943__auto____6509
      }else {
        return G__6507__6508.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6507__6508.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6507__6508)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6507__6508)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6510__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6510 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6510__delegate.call(this, keyvals)
    };
    G__6510.cljs$lang$maxFixedArity = 0;
    G__6510.cljs$lang$applyTo = function(arglist__6511) {
      var keyvals = cljs.core.seq(arglist__6511);
      return G__6510__delegate(keyvals)
    };
    G__6510.cljs$lang$arity$variadic = G__6510__delegate;
    return G__6510
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6513 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6513.push(key)
  });
  return keys__6513
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6517 = i;
  var j__6518 = j;
  var len__6519 = len;
  while(true) {
    if(len__6519 === 0) {
      return to
    }else {
      to[j__6518] = from[i__6517];
      var G__6520 = i__6517 + 1;
      var G__6521 = j__6518 + 1;
      var G__6522 = len__6519 - 1;
      i__6517 = G__6520;
      j__6518 = G__6521;
      len__6519 = G__6522;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6526 = i + (len - 1);
  var j__6527 = j + (len - 1);
  var len__6528 = len;
  while(true) {
    if(len__6528 === 0) {
      return to
    }else {
      to[j__6527] = from[i__6526];
      var G__6529 = i__6526 - 1;
      var G__6530 = j__6527 - 1;
      var G__6531 = len__6528 - 1;
      i__6526 = G__6529;
      j__6527 = G__6530;
      len__6528 = G__6531;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6535__6536 = s;
    if(G__6535__6536) {
      if(function() {
        var or__3943__auto____6537 = G__6535__6536.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto____6537) {
          return or__3943__auto____6537
        }else {
          return G__6535__6536.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6535__6536.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6535__6536)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6535__6536)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6541__6542 = s;
  if(G__6541__6542) {
    if(function() {
      var or__3943__auto____6543 = G__6541__6542.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto____6543) {
        return or__3943__auto____6543
      }else {
        return G__6541__6542.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6541__6542.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6541__6542)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6541__6542)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3941__auto____6546 = goog.isString(x);
  if(and__3941__auto____6546) {
    return!function() {
      var or__3943__auto____6547 = x.charAt(0) === "\ufdd0";
      if(or__3943__auto____6547) {
        return or__3943__auto____6547
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3941__auto____6546
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto____6549 = goog.isString(x);
  if(and__3941__auto____6549) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto____6549
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3941__auto____6551 = goog.isString(x);
  if(and__3941__auto____6551) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3941__auto____6551
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto____6556 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto____6556) {
    return or__3943__auto____6556
  }else {
    var G__6557__6558 = f;
    if(G__6557__6558) {
      if(function() {
        var or__3943__auto____6559 = G__6557__6558.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____6559) {
          return or__3943__auto____6559
        }else {
          return G__6557__6558.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6557__6558.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6557__6558)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6557__6558)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto____6561 = cljs.core.number_QMARK_.call(null, n);
  if(and__3941__auto____6561) {
    return n == n.toFixed()
  }else {
    return and__3941__auto____6561
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3941__auto____6564 = coll;
    if(cljs.core.truth_(and__3941__auto____6564)) {
      var and__3941__auto____6565 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____6565) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____6565
      }
    }else {
      return and__3941__auto____6564
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__6574__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__6570 = cljs.core.set([y, x]);
        var xs__6571 = more;
        while(true) {
          var x__6572 = cljs.core.first.call(null, xs__6571);
          var etc__6573 = cljs.core.next.call(null, xs__6571);
          if(cljs.core.truth_(xs__6571)) {
            if(cljs.core.contains_QMARK_.call(null, s__6570, x__6572)) {
              return false
            }else {
              var G__6575 = cljs.core.conj.call(null, s__6570, x__6572);
              var G__6576 = etc__6573;
              s__6570 = G__6575;
              xs__6571 = G__6576;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__6574 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6574__delegate.call(this, x, y, more)
    };
    G__6574.cljs$lang$maxFixedArity = 2;
    G__6574.cljs$lang$applyTo = function(arglist__6577) {
      var x = cljs.core.first(arglist__6577);
      var y = cljs.core.first(cljs.core.next(arglist__6577));
      var more = cljs.core.rest(cljs.core.next(arglist__6577));
      return G__6574__delegate(x, y, more)
    };
    G__6574.cljs$lang$arity$variadic = G__6574__delegate;
    return G__6574
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__6581__6582 = x;
            if(G__6581__6582) {
              if(cljs.core.truth_(function() {
                var or__3943__auto____6583 = null;
                if(cljs.core.truth_(or__3943__auto____6583)) {
                  return or__3943__auto____6583
                }else {
                  return G__6581__6582.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__6581__6582.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__6581__6582)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__6581__6582)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__6588 = cljs.core.count.call(null, xs);
    var yl__6589 = cljs.core.count.call(null, ys);
    if(xl__6588 < yl__6589) {
      return-1
    }else {
      if(xl__6588 > yl__6589) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__6588, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__6590 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto____6591 = d__6590 === 0;
        if(and__3941__auto____6591) {
          return n + 1 < len
        }else {
          return and__3941__auto____6591
        }
      }()) {
        var G__6592 = xs;
        var G__6593 = ys;
        var G__6594 = len;
        var G__6595 = n + 1;
        xs = G__6592;
        ys = G__6593;
        len = G__6594;
        n = G__6595;
        continue
      }else {
        return d__6590
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__6597 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__6597)) {
        return r__6597
      }else {
        if(cljs.core.truth_(r__6597)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__6599 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__6599, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__6599)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto____6605 = cljs.core.seq.call(null, coll);
    if(temp__4090__auto____6605) {
      var s__6606 = temp__4090__auto____6605;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__6606), cljs.core.next.call(null, s__6606))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__6607 = val;
    var coll__6608 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__6608) {
        var nval__6609 = f.call(null, val__6607, cljs.core.first.call(null, coll__6608));
        if(cljs.core.reduced_QMARK_.call(null, nval__6609)) {
          return cljs.core.deref.call(null, nval__6609)
        }else {
          var G__6610 = nval__6609;
          var G__6611 = cljs.core.next.call(null, coll__6608);
          val__6607 = G__6610;
          coll__6608 = G__6611;
          continue
        }
      }else {
        return val__6607
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
void 0;
cljs.core.shuffle = function shuffle(coll) {
  var a__6613 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__6613);
  return cljs.core.vec.call(null, a__6613)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__6620__6621 = coll;
      if(G__6620__6621) {
        if(function() {
          var or__3943__auto____6622 = G__6620__6621.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____6622) {
            return or__3943__auto____6622
          }else {
            return G__6620__6621.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__6620__6621.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6620__6621)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6620__6621)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__6623__6624 = coll;
      if(G__6623__6624) {
        if(function() {
          var or__3943__auto____6625 = G__6623__6624.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____6625) {
            return or__3943__auto____6625
          }else {
            return G__6623__6624.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__6623__6624.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6623__6624)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6623__6624)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__6626 = this;
  return this__6626.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__6627__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__6627 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6627__delegate.call(this, x, y, more)
    };
    G__6627.cljs$lang$maxFixedArity = 2;
    G__6627.cljs$lang$applyTo = function(arglist__6628) {
      var x = cljs.core.first(arglist__6628);
      var y = cljs.core.first(cljs.core.next(arglist__6628));
      var more = cljs.core.rest(cljs.core.next(arglist__6628));
      return G__6627__delegate(x, y, more)
    };
    G__6627.cljs$lang$arity$variadic = G__6627__delegate;
    return G__6627
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__6629__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__6629 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6629__delegate.call(this, x, y, more)
    };
    G__6629.cljs$lang$maxFixedArity = 2;
    G__6629.cljs$lang$applyTo = function(arglist__6630) {
      var x = cljs.core.first(arglist__6630);
      var y = cljs.core.first(cljs.core.next(arglist__6630));
      var more = cljs.core.rest(cljs.core.next(arglist__6630));
      return G__6629__delegate(x, y, more)
    };
    G__6629.cljs$lang$arity$variadic = G__6629__delegate;
    return G__6629
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__6631__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__6631 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6631__delegate.call(this, x, y, more)
    };
    G__6631.cljs$lang$maxFixedArity = 2;
    G__6631.cljs$lang$applyTo = function(arglist__6632) {
      var x = cljs.core.first(arglist__6632);
      var y = cljs.core.first(cljs.core.next(arglist__6632));
      var more = cljs.core.rest(cljs.core.next(arglist__6632));
      return G__6631__delegate(x, y, more)
    };
    G__6631.cljs$lang$arity$variadic = G__6631__delegate;
    return G__6631
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__6633__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__6633 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6633__delegate.call(this, x, y, more)
    };
    G__6633.cljs$lang$maxFixedArity = 2;
    G__6633.cljs$lang$applyTo = function(arglist__6634) {
      var x = cljs.core.first(arglist__6634);
      var y = cljs.core.first(cljs.core.next(arglist__6634));
      var more = cljs.core.rest(cljs.core.next(arglist__6634));
      return G__6633__delegate(x, y, more)
    };
    G__6633.cljs$lang$arity$variadic = G__6633__delegate;
    return G__6633
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__6635__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__6636 = y;
            var G__6637 = cljs.core.first.call(null, more);
            var G__6638 = cljs.core.next.call(null, more);
            x = G__6636;
            y = G__6637;
            more = G__6638;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6635 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6635__delegate.call(this, x, y, more)
    };
    G__6635.cljs$lang$maxFixedArity = 2;
    G__6635.cljs$lang$applyTo = function(arglist__6639) {
      var x = cljs.core.first(arglist__6639);
      var y = cljs.core.first(cljs.core.next(arglist__6639));
      var more = cljs.core.rest(cljs.core.next(arglist__6639));
      return G__6635__delegate(x, y, more)
    };
    G__6635.cljs$lang$arity$variadic = G__6635__delegate;
    return G__6635
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__6640__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__6641 = y;
            var G__6642 = cljs.core.first.call(null, more);
            var G__6643 = cljs.core.next.call(null, more);
            x = G__6641;
            y = G__6642;
            more = G__6643;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6640 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6640__delegate.call(this, x, y, more)
    };
    G__6640.cljs$lang$maxFixedArity = 2;
    G__6640.cljs$lang$applyTo = function(arglist__6644) {
      var x = cljs.core.first(arglist__6644);
      var y = cljs.core.first(cljs.core.next(arglist__6644));
      var more = cljs.core.rest(cljs.core.next(arglist__6644));
      return G__6640__delegate(x, y, more)
    };
    G__6640.cljs$lang$arity$variadic = G__6640__delegate;
    return G__6640
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__6645__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__6646 = y;
            var G__6647 = cljs.core.first.call(null, more);
            var G__6648 = cljs.core.next.call(null, more);
            x = G__6646;
            y = G__6647;
            more = G__6648;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6645 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6645__delegate.call(this, x, y, more)
    };
    G__6645.cljs$lang$maxFixedArity = 2;
    G__6645.cljs$lang$applyTo = function(arglist__6649) {
      var x = cljs.core.first(arglist__6649);
      var y = cljs.core.first(cljs.core.next(arglist__6649));
      var more = cljs.core.rest(cljs.core.next(arglist__6649));
      return G__6645__delegate(x, y, more)
    };
    G__6645.cljs$lang$arity$variadic = G__6645__delegate;
    return G__6645
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__6650__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__6651 = y;
            var G__6652 = cljs.core.first.call(null, more);
            var G__6653 = cljs.core.next.call(null, more);
            x = G__6651;
            y = G__6652;
            more = G__6653;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6650 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6650__delegate.call(this, x, y, more)
    };
    G__6650.cljs$lang$maxFixedArity = 2;
    G__6650.cljs$lang$applyTo = function(arglist__6654) {
      var x = cljs.core.first(arglist__6654);
      var y = cljs.core.first(cljs.core.next(arglist__6654));
      var more = cljs.core.rest(cljs.core.next(arglist__6654));
      return G__6650__delegate(x, y, more)
    };
    G__6650.cljs$lang$arity$variadic = G__6650__delegate;
    return G__6650
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__6655__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__6655 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6655__delegate.call(this, x, y, more)
    };
    G__6655.cljs$lang$maxFixedArity = 2;
    G__6655.cljs$lang$applyTo = function(arglist__6656) {
      var x = cljs.core.first(arglist__6656);
      var y = cljs.core.first(cljs.core.next(arglist__6656));
      var more = cljs.core.rest(cljs.core.next(arglist__6656));
      return G__6655__delegate(x, y, more)
    };
    G__6655.cljs$lang$arity$variadic = G__6655__delegate;
    return G__6655
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__6657__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__6657 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6657__delegate.call(this, x, y, more)
    };
    G__6657.cljs$lang$maxFixedArity = 2;
    G__6657.cljs$lang$applyTo = function(arglist__6658) {
      var x = cljs.core.first(arglist__6658);
      var y = cljs.core.first(cljs.core.next(arglist__6658));
      var more = cljs.core.rest(cljs.core.next(arglist__6658));
      return G__6657__delegate(x, y, more)
    };
    G__6657.cljs$lang$arity$variadic = G__6657__delegate;
    return G__6657
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__6660 = n % d;
  return cljs.core.fix.call(null, (n - rem__6660) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__6662 = cljs.core.quot.call(null, n, d);
  return n - d * q__6662
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__6665 = v - (v >> 1 & 1431655765);
  var v__6666 = (v__6665 & 858993459) + (v__6665 >> 2 & 858993459);
  return(v__6666 + (v__6666 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__6667__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6668 = y;
            var G__6669 = cljs.core.first.call(null, more);
            var G__6670 = cljs.core.next.call(null, more);
            x = G__6668;
            y = G__6669;
            more = G__6670;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6667 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6667__delegate.call(this, x, y, more)
    };
    G__6667.cljs$lang$maxFixedArity = 2;
    G__6667.cljs$lang$applyTo = function(arglist__6671) {
      var x = cljs.core.first(arglist__6671);
      var y = cljs.core.first(cljs.core.next(arglist__6671));
      var more = cljs.core.rest(cljs.core.next(arglist__6671));
      return G__6667__delegate(x, y, more)
    };
    G__6667.cljs$lang$arity$variadic = G__6667__delegate;
    return G__6667
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__6675 = n;
  var xs__6676 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto____6677 = xs__6676;
      if(and__3941__auto____6677) {
        return n__6675 > 0
      }else {
        return and__3941__auto____6677
      }
    }())) {
      var G__6678 = n__6675 - 1;
      var G__6679 = cljs.core.next.call(null, xs__6676);
      n__6675 = G__6678;
      xs__6676 = G__6679;
      continue
    }else {
      return xs__6676
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__6680__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__6681 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__6682 = cljs.core.next.call(null, more);
            sb = G__6681;
            more = G__6682;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__6680 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6680__delegate.call(this, x, ys)
    };
    G__6680.cljs$lang$maxFixedArity = 1;
    G__6680.cljs$lang$applyTo = function(arglist__6683) {
      var x = cljs.core.first(arglist__6683);
      var ys = cljs.core.rest(arglist__6683);
      return G__6680__delegate(x, ys)
    };
    G__6680.cljs$lang$arity$variadic = G__6680__delegate;
    return G__6680
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__6684__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__6685 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__6686 = cljs.core.next.call(null, more);
            sb = G__6685;
            more = G__6686;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__6684 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6684__delegate.call(this, x, ys)
    };
    G__6684.cljs$lang$maxFixedArity = 1;
    G__6684.cljs$lang$applyTo = function(arglist__6687) {
      var x = cljs.core.first(arglist__6687);
      var ys = cljs.core.rest(arglist__6687);
      return G__6684__delegate(x, ys)
    };
    G__6684.cljs$lang$arity$variadic = G__6684__delegate;
    return G__6684
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__6690 = cljs.core.seq.call(null, x);
    var ys__6691 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__6690 == null) {
        return ys__6691 == null
      }else {
        if(ys__6691 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__6690), cljs.core.first.call(null, ys__6691))) {
            var G__6692 = cljs.core.next.call(null, xs__6690);
            var G__6693 = cljs.core.next.call(null, ys__6691);
            xs__6690 = G__6692;
            ys__6691 = G__6693;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__6694_SHARP_, p2__6695_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__6694_SHARP_, cljs.core.hash.call(null, p2__6695_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__6699 = 0;
  var s__6700 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__6700) {
      var e__6701 = cljs.core.first.call(null, s__6700);
      var G__6702 = (h__6699 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__6701)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__6701)))) % 4503599627370496;
      var G__6703 = cljs.core.next.call(null, s__6700);
      h__6699 = G__6702;
      s__6700 = G__6703;
      continue
    }else {
      return h__6699
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__6707 = 0;
  var s__6708 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__6708) {
      var e__6709 = cljs.core.first.call(null, s__6708);
      var G__6710 = (h__6707 + cljs.core.hash.call(null, e__6709)) % 4503599627370496;
      var G__6711 = cljs.core.next.call(null, s__6708);
      h__6707 = G__6710;
      s__6708 = G__6711;
      continue
    }else {
      return h__6707
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__6732__6733 = cljs.core.seq.call(null, fn_map);
  if(G__6732__6733) {
    var G__6735__6737 = cljs.core.first.call(null, G__6732__6733);
    var vec__6736__6738 = G__6735__6737;
    var key_name__6739 = cljs.core.nth.call(null, vec__6736__6738, 0, null);
    var f__6740 = cljs.core.nth.call(null, vec__6736__6738, 1, null);
    var G__6732__6741 = G__6732__6733;
    var G__6735__6742 = G__6735__6737;
    var G__6732__6743 = G__6732__6741;
    while(true) {
      var vec__6744__6745 = G__6735__6742;
      var key_name__6746 = cljs.core.nth.call(null, vec__6744__6745, 0, null);
      var f__6747 = cljs.core.nth.call(null, vec__6744__6745, 1, null);
      var G__6732__6748 = G__6732__6743;
      var str_name__6749 = cljs.core.name.call(null, key_name__6746);
      obj[str_name__6749] = f__6747;
      var temp__4092__auto____6750 = cljs.core.next.call(null, G__6732__6748);
      if(temp__4092__auto____6750) {
        var G__6732__6751 = temp__4092__auto____6750;
        var G__6752 = cljs.core.first.call(null, G__6732__6751);
        var G__6753 = G__6732__6751;
        G__6735__6742 = G__6752;
        G__6732__6743 = G__6753;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6754 = this;
  var h__2089__auto____6755 = this__6754.__hash;
  if(!(h__2089__auto____6755 == null)) {
    return h__2089__auto____6755
  }else {
    var h__2089__auto____6756 = cljs.core.hash_coll.call(null, coll);
    this__6754.__hash = h__2089__auto____6756;
    return h__2089__auto____6756
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__6757 = this;
  if(this__6757.count === 1) {
    return null
  }else {
    return this__6757.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6758 = this;
  return new cljs.core.List(this__6758.meta, o, coll, this__6758.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__6759 = this;
  var this__6760 = this;
  return cljs.core.pr_str.call(null, this__6760)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6761 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6762 = this;
  return this__6762.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__6763 = this;
  return this__6763.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__6764 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6765 = this;
  return this__6765.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6766 = this;
  if(this__6766.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__6766.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6767 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6768 = this;
  return new cljs.core.List(meta, this__6768.first, this__6768.rest, this__6768.count, this__6768.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6769 = this;
  return this__6769.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6770 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6771 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__6772 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6773 = this;
  return new cljs.core.List(this__6773.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__6774 = this;
  var this__6775 = this;
  return cljs.core.pr_str.call(null, this__6775)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6776 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6777 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__6778 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__6779 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6780 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6781 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6782 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6783 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6784 = this;
  return this__6784.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6785 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__6789__6790 = coll;
  if(G__6789__6790) {
    if(function() {
      var or__3943__auto____6791 = G__6789__6790.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto____6791) {
        return or__3943__auto____6791
      }else {
        return G__6789__6790.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__6789__6790.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__6789__6790)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__6789__6790)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__6792__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__6792 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6792__delegate.call(this, x, y, z, items)
    };
    G__6792.cljs$lang$maxFixedArity = 3;
    G__6792.cljs$lang$applyTo = function(arglist__6793) {
      var x = cljs.core.first(arglist__6793);
      var y = cljs.core.first(cljs.core.next(arglist__6793));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6793)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6793)));
      return G__6792__delegate(x, y, z, items)
    };
    G__6792.cljs$lang$arity$variadic = G__6792__delegate;
    return G__6792
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6794 = this;
  var h__2089__auto____6795 = this__6794.__hash;
  if(!(h__2089__auto____6795 == null)) {
    return h__2089__auto____6795
  }else {
    var h__2089__auto____6796 = cljs.core.hash_coll.call(null, coll);
    this__6794.__hash = h__2089__auto____6796;
    return h__2089__auto____6796
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__6797 = this;
  if(this__6797.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__6797.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6798 = this;
  return new cljs.core.Cons(null, o, coll, this__6798.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__6799 = this;
  var this__6800 = this;
  return cljs.core.pr_str.call(null, this__6800)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6801 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6802 = this;
  return this__6802.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6803 = this;
  if(this__6803.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__6803.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6804 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6805 = this;
  return new cljs.core.Cons(meta, this__6805.first, this__6805.rest, this__6805.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6806 = this;
  return this__6806.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6807 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6807.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto____6812 = coll == null;
    if(or__3943__auto____6812) {
      return or__3943__auto____6812
    }else {
      var G__6813__6814 = coll;
      if(G__6813__6814) {
        if(function() {
          var or__3943__auto____6815 = G__6813__6814.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6815) {
            return or__3943__auto____6815
          }else {
            return G__6813__6814.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6813__6814.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6813__6814)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6813__6814)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__6819__6820 = x;
  if(G__6819__6820) {
    if(function() {
      var or__3943__auto____6821 = G__6819__6820.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto____6821) {
        return or__3943__auto____6821
      }else {
        return G__6819__6820.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__6819__6820.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__6819__6820)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__6819__6820)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__6822 = null;
  var G__6822__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__6822__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__6822 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6822__2.call(this, string, f);
      case 3:
        return G__6822__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6822
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__6823 = null;
  var G__6823__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__6823__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__6823 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6823__2.call(this, string, k);
      case 3:
        return G__6823__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6823
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__6824 = null;
  var G__6824__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__6824__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__6824 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6824__2.call(this, string, n);
      case 3:
        return G__6824__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6824
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function(this_sym6827, coll) {
  var this__6828 = this;
  var this_sym6827__6829 = this;
  var ___6830 = this_sym6827__6829;
  if(coll == null) {
    return null
  }else {
    var strobj__6831 = coll.strobj;
    if(strobj__6831 == null) {
      return cljs.core._lookup.call(null, coll, this__6828.k, null)
    }else {
      return strobj__6831[this__6828.k]
    }
  }
};
cljs.core.Keyword.prototype.apply = function(this_sym6825, args6826) {
  var this__6832 = this;
  return this_sym6825.call.apply(this_sym6825, [this_sym6825].concat(args6826.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__6841 = null;
  var G__6841__2 = function(this_sym6835, coll) {
    var this_sym6835__6837 = this;
    var this__6838 = this_sym6835__6837;
    return cljs.core._lookup.call(null, coll, this__6838.toString(), null)
  };
  var G__6841__3 = function(this_sym6836, coll, not_found) {
    var this_sym6836__6839 = this;
    var this__6840 = this_sym6836__6839;
    return cljs.core._lookup.call(null, coll, this__6840.toString(), not_found)
  };
  G__6841 = function(this_sym6836, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6841__2.call(this, this_sym6836, coll);
      case 3:
        return G__6841__3.call(this, this_sym6836, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6841
}();
String.prototype.apply = function(this_sym6833, args6834) {
  return this_sym6833.call.apply(this_sym6833, [this_sym6833].concat(args6834.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__6843 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__6843
  }else {
    lazy_seq.x = x__6843.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6844 = this;
  var h__2089__auto____6845 = this__6844.__hash;
  if(!(h__2089__auto____6845 == null)) {
    return h__2089__auto____6845
  }else {
    var h__2089__auto____6846 = cljs.core.hash_coll.call(null, coll);
    this__6844.__hash = h__2089__auto____6846;
    return h__2089__auto____6846
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__6847 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6848 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__6849 = this;
  var this__6850 = this;
  return cljs.core.pr_str.call(null, this__6850)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6851 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6852 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6853 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6854 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6855 = this;
  return new cljs.core.LazySeq(meta, this__6855.realized, this__6855.x, this__6855.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6856 = this;
  return this__6856.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6857 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6857.meta)
};
cljs.core.LazySeq;
void 0;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6858 = this;
  return this__6858.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__6859 = this;
  var ___6860 = this;
  this__6859.buf[this__6859.end] = o;
  return this__6859.end = this__6859.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__6861 = this;
  var ___6862 = this;
  var ret__6863 = new cljs.core.ArrayChunk(this__6861.buf, 0, this__6861.end);
  this__6861.buf = null;
  return ret__6863
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6864 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__6864.arr[this__6864.off], this__6864.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6865 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__6865.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__6866 = this;
  if(this__6866.off === this__6866.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__6866.arr, this__6866.off + 1, this__6866.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__6867 = this;
  return this__6867.arr[this__6867.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__6868 = this;
  if(function() {
    var and__3941__auto____6869 = i >= 0;
    if(and__3941__auto____6869) {
      return i < this__6868.end - this__6868.off
    }else {
      return and__3941__auto____6869
    }
  }()) {
    return this__6868.arr[this__6868.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6870 = this;
  return this__6870.end - this__6870.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__6871 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6872 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6873 = this;
  return cljs.core._nth.call(null, this__6873.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6874 = this;
  if(cljs.core._count.call(null, this__6874.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__6874.chunk), this__6874.more, this__6874.meta)
  }else {
    if(this__6874.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__6874.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__6875 = this;
  if(this__6875.more == null) {
    return null
  }else {
    return this__6875.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6876 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__6877 = this;
  return new cljs.core.ChunkedCons(this__6877.chunk, this__6877.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6878 = this;
  return this__6878.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__6879 = this;
  return this__6879.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__6880 = this;
  if(this__6880.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__6880.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__6884__6885 = s;
    if(G__6884__6885) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____6886 = null;
        if(cljs.core.truth_(or__3943__auto____6886)) {
          return or__3943__auto____6886
        }else {
          return G__6884__6885.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__6884__6885.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__6884__6885)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__6884__6885)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__6889 = [];
  var s__6890 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__6890)) {
      ary__6889.push(cljs.core.first.call(null, s__6890));
      var G__6891 = cljs.core.next.call(null, s__6890);
      s__6890 = G__6891;
      continue
    }else {
      return ary__6889
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__6895 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__6896 = 0;
  var xs__6897 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__6897) {
      ret__6895[i__6896] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__6897));
      var G__6898 = i__6896 + 1;
      var G__6899 = cljs.core.next.call(null, xs__6897);
      i__6896 = G__6898;
      xs__6897 = G__6899;
      continue
    }else {
    }
    break
  }
  return ret__6895
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__6907 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__6908 = cljs.core.seq.call(null, init_val_or_seq);
      var i__6909 = 0;
      var s__6910 = s__6908;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____6911 = s__6910;
          if(and__3941__auto____6911) {
            return i__6909 < size
          }else {
            return and__3941__auto____6911
          }
        }())) {
          a__6907[i__6909] = cljs.core.first.call(null, s__6910);
          var G__6914 = i__6909 + 1;
          var G__6915 = cljs.core.next.call(null, s__6910);
          i__6909 = G__6914;
          s__6910 = G__6915;
          continue
        }else {
          return a__6907
        }
        break
      }
    }else {
      var n__2428__auto____6912 = size;
      var i__6913 = 0;
      while(true) {
        if(i__6913 < n__2428__auto____6912) {
          a__6907[i__6913] = init_val_or_seq;
          var G__6916 = i__6913 + 1;
          i__6913 = G__6916;
          continue
        }else {
        }
        break
      }
      return a__6907
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__6924 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__6925 = cljs.core.seq.call(null, init_val_or_seq);
      var i__6926 = 0;
      var s__6927 = s__6925;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____6928 = s__6927;
          if(and__3941__auto____6928) {
            return i__6926 < size
          }else {
            return and__3941__auto____6928
          }
        }())) {
          a__6924[i__6926] = cljs.core.first.call(null, s__6927);
          var G__6931 = i__6926 + 1;
          var G__6932 = cljs.core.next.call(null, s__6927);
          i__6926 = G__6931;
          s__6927 = G__6932;
          continue
        }else {
          return a__6924
        }
        break
      }
    }else {
      var n__2428__auto____6929 = size;
      var i__6930 = 0;
      while(true) {
        if(i__6930 < n__2428__auto____6929) {
          a__6924[i__6930] = init_val_or_seq;
          var G__6933 = i__6930 + 1;
          i__6930 = G__6933;
          continue
        }else {
        }
        break
      }
      return a__6924
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__6941 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__6942 = cljs.core.seq.call(null, init_val_or_seq);
      var i__6943 = 0;
      var s__6944 = s__6942;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____6945 = s__6944;
          if(and__3941__auto____6945) {
            return i__6943 < size
          }else {
            return and__3941__auto____6945
          }
        }())) {
          a__6941[i__6943] = cljs.core.first.call(null, s__6944);
          var G__6948 = i__6943 + 1;
          var G__6949 = cljs.core.next.call(null, s__6944);
          i__6943 = G__6948;
          s__6944 = G__6949;
          continue
        }else {
          return a__6941
        }
        break
      }
    }else {
      var n__2428__auto____6946 = size;
      var i__6947 = 0;
      while(true) {
        if(i__6947 < n__2428__auto____6946) {
          a__6941[i__6947] = init_val_or_seq;
          var G__6950 = i__6947 + 1;
          i__6947 = G__6950;
          continue
        }else {
        }
        break
      }
      return a__6941
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__6955 = s;
    var i__6956 = n;
    var sum__6957 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____6958 = i__6956 > 0;
        if(and__3941__auto____6958) {
          return cljs.core.seq.call(null, s__6955)
        }else {
          return and__3941__auto____6958
        }
      }())) {
        var G__6959 = cljs.core.next.call(null, s__6955);
        var G__6960 = i__6956 - 1;
        var G__6961 = sum__6957 + 1;
        s__6955 = G__6959;
        i__6956 = G__6960;
        sum__6957 = G__6961;
        continue
      }else {
        return sum__6957
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__6966 = cljs.core.seq.call(null, x);
      if(s__6966) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__6966)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__6966), concat.call(null, cljs.core.chunk_rest.call(null, s__6966), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__6966), concat.call(null, cljs.core.rest.call(null, s__6966), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__6970__delegate = function(x, y, zs) {
      var cat__6969 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__6968 = cljs.core.seq.call(null, xys);
          if(xys__6968) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__6968)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__6968), cat.call(null, cljs.core.chunk_rest.call(null, xys__6968), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__6968), cat.call(null, cljs.core.rest.call(null, xys__6968), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__6969.call(null, concat.call(null, x, y), zs)
    };
    var G__6970 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6970__delegate.call(this, x, y, zs)
    };
    G__6970.cljs$lang$maxFixedArity = 2;
    G__6970.cljs$lang$applyTo = function(arglist__6971) {
      var x = cljs.core.first(arglist__6971);
      var y = cljs.core.first(cljs.core.next(arglist__6971));
      var zs = cljs.core.rest(cljs.core.next(arglist__6971));
      return G__6970__delegate(x, y, zs)
    };
    G__6970.cljs$lang$arity$variadic = G__6970__delegate;
    return G__6970
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__6972__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__6972 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6972__delegate.call(this, a, b, c, d, more)
    };
    G__6972.cljs$lang$maxFixedArity = 4;
    G__6972.cljs$lang$applyTo = function(arglist__6973) {
      var a = cljs.core.first(arglist__6973);
      var b = cljs.core.first(cljs.core.next(arglist__6973));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6973)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6973))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6973))));
      return G__6972__delegate(a, b, c, d, more)
    };
    G__6972.cljs$lang$arity$variadic = G__6972__delegate;
    return G__6972
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7015 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7016 = cljs.core._first.call(null, args__7015);
    var args__7017 = cljs.core._rest.call(null, args__7015);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7016)
      }else {
        return f.call(null, a__7016)
      }
    }else {
      var b__7018 = cljs.core._first.call(null, args__7017);
      var args__7019 = cljs.core._rest.call(null, args__7017);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7016, b__7018)
        }else {
          return f.call(null, a__7016, b__7018)
        }
      }else {
        var c__7020 = cljs.core._first.call(null, args__7019);
        var args__7021 = cljs.core._rest.call(null, args__7019);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7016, b__7018, c__7020)
          }else {
            return f.call(null, a__7016, b__7018, c__7020)
          }
        }else {
          var d__7022 = cljs.core._first.call(null, args__7021);
          var args__7023 = cljs.core._rest.call(null, args__7021);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7016, b__7018, c__7020, d__7022)
            }else {
              return f.call(null, a__7016, b__7018, c__7020, d__7022)
            }
          }else {
            var e__7024 = cljs.core._first.call(null, args__7023);
            var args__7025 = cljs.core._rest.call(null, args__7023);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7016, b__7018, c__7020, d__7022, e__7024)
              }else {
                return f.call(null, a__7016, b__7018, c__7020, d__7022, e__7024)
              }
            }else {
              var f__7026 = cljs.core._first.call(null, args__7025);
              var args__7027 = cljs.core._rest.call(null, args__7025);
              if(argc === 6) {
                if(f__7026.cljs$lang$arity$6) {
                  return f__7026.cljs$lang$arity$6(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026)
                }else {
                  return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026)
                }
              }else {
                var g__7028 = cljs.core._first.call(null, args__7027);
                var args__7029 = cljs.core._rest.call(null, args__7027);
                if(argc === 7) {
                  if(f__7026.cljs$lang$arity$7) {
                    return f__7026.cljs$lang$arity$7(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028)
                  }else {
                    return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028)
                  }
                }else {
                  var h__7030 = cljs.core._first.call(null, args__7029);
                  var args__7031 = cljs.core._rest.call(null, args__7029);
                  if(argc === 8) {
                    if(f__7026.cljs$lang$arity$8) {
                      return f__7026.cljs$lang$arity$8(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030)
                    }else {
                      return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030)
                    }
                  }else {
                    var i__7032 = cljs.core._first.call(null, args__7031);
                    var args__7033 = cljs.core._rest.call(null, args__7031);
                    if(argc === 9) {
                      if(f__7026.cljs$lang$arity$9) {
                        return f__7026.cljs$lang$arity$9(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032)
                      }else {
                        return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032)
                      }
                    }else {
                      var j__7034 = cljs.core._first.call(null, args__7033);
                      var args__7035 = cljs.core._rest.call(null, args__7033);
                      if(argc === 10) {
                        if(f__7026.cljs$lang$arity$10) {
                          return f__7026.cljs$lang$arity$10(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034)
                        }else {
                          return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034)
                        }
                      }else {
                        var k__7036 = cljs.core._first.call(null, args__7035);
                        var args__7037 = cljs.core._rest.call(null, args__7035);
                        if(argc === 11) {
                          if(f__7026.cljs$lang$arity$11) {
                            return f__7026.cljs$lang$arity$11(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036)
                          }else {
                            return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036)
                          }
                        }else {
                          var l__7038 = cljs.core._first.call(null, args__7037);
                          var args__7039 = cljs.core._rest.call(null, args__7037);
                          if(argc === 12) {
                            if(f__7026.cljs$lang$arity$12) {
                              return f__7026.cljs$lang$arity$12(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038)
                            }else {
                              return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038)
                            }
                          }else {
                            var m__7040 = cljs.core._first.call(null, args__7039);
                            var args__7041 = cljs.core._rest.call(null, args__7039);
                            if(argc === 13) {
                              if(f__7026.cljs$lang$arity$13) {
                                return f__7026.cljs$lang$arity$13(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040)
                              }else {
                                return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040)
                              }
                            }else {
                              var n__7042 = cljs.core._first.call(null, args__7041);
                              var args__7043 = cljs.core._rest.call(null, args__7041);
                              if(argc === 14) {
                                if(f__7026.cljs$lang$arity$14) {
                                  return f__7026.cljs$lang$arity$14(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042)
                                }else {
                                  return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042)
                                }
                              }else {
                                var o__7044 = cljs.core._first.call(null, args__7043);
                                var args__7045 = cljs.core._rest.call(null, args__7043);
                                if(argc === 15) {
                                  if(f__7026.cljs$lang$arity$15) {
                                    return f__7026.cljs$lang$arity$15(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044)
                                  }else {
                                    return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044)
                                  }
                                }else {
                                  var p__7046 = cljs.core._first.call(null, args__7045);
                                  var args__7047 = cljs.core._rest.call(null, args__7045);
                                  if(argc === 16) {
                                    if(f__7026.cljs$lang$arity$16) {
                                      return f__7026.cljs$lang$arity$16(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044, p__7046)
                                    }else {
                                      return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044, p__7046)
                                    }
                                  }else {
                                    var q__7048 = cljs.core._first.call(null, args__7047);
                                    var args__7049 = cljs.core._rest.call(null, args__7047);
                                    if(argc === 17) {
                                      if(f__7026.cljs$lang$arity$17) {
                                        return f__7026.cljs$lang$arity$17(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044, p__7046, q__7048)
                                      }else {
                                        return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044, p__7046, q__7048)
                                      }
                                    }else {
                                      var r__7050 = cljs.core._first.call(null, args__7049);
                                      var args__7051 = cljs.core._rest.call(null, args__7049);
                                      if(argc === 18) {
                                        if(f__7026.cljs$lang$arity$18) {
                                          return f__7026.cljs$lang$arity$18(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044, p__7046, q__7048, r__7050)
                                        }else {
                                          return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044, p__7046, q__7048, r__7050)
                                        }
                                      }else {
                                        var s__7052 = cljs.core._first.call(null, args__7051);
                                        var args__7053 = cljs.core._rest.call(null, args__7051);
                                        if(argc === 19) {
                                          if(f__7026.cljs$lang$arity$19) {
                                            return f__7026.cljs$lang$arity$19(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044, p__7046, q__7048, r__7050, s__7052)
                                          }else {
                                            return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044, p__7046, q__7048, r__7050, s__7052)
                                          }
                                        }else {
                                          var t__7054 = cljs.core._first.call(null, args__7053);
                                          var args__7055 = cljs.core._rest.call(null, args__7053);
                                          if(argc === 20) {
                                            if(f__7026.cljs$lang$arity$20) {
                                              return f__7026.cljs$lang$arity$20(a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044, p__7046, q__7048, r__7050, s__7052, t__7054)
                                            }else {
                                              return f__7026.call(null, a__7016, b__7018, c__7020, d__7022, e__7024, f__7026, g__7028, h__7030, i__7032, j__7034, k__7036, l__7038, m__7040, n__7042, o__7044, p__7046, q__7048, r__7050, s__7052, t__7054)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7070 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7071 = cljs.core.bounded_count.call(null, args, fixed_arity__7070 + 1);
      if(bc__7071 <= fixed_arity__7070) {
        return cljs.core.apply_to.call(null, f, bc__7071, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7072 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7073 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7074 = cljs.core.bounded_count.call(null, arglist__7072, fixed_arity__7073 + 1);
      if(bc__7074 <= fixed_arity__7073) {
        return cljs.core.apply_to.call(null, f, bc__7074, arglist__7072)
      }else {
        return f.cljs$lang$applyTo(arglist__7072)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7072))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7075 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7076 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7077 = cljs.core.bounded_count.call(null, arglist__7075, fixed_arity__7076 + 1);
      if(bc__7077 <= fixed_arity__7076) {
        return cljs.core.apply_to.call(null, f, bc__7077, arglist__7075)
      }else {
        return f.cljs$lang$applyTo(arglist__7075)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7075))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7078 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7079 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7080 = cljs.core.bounded_count.call(null, arglist__7078, fixed_arity__7079 + 1);
      if(bc__7080 <= fixed_arity__7079) {
        return cljs.core.apply_to.call(null, f, bc__7080, arglist__7078)
      }else {
        return f.cljs$lang$applyTo(arglist__7078)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7078))
    }
  };
  var apply__6 = function() {
    var G__7084__delegate = function(f, a, b, c, d, args) {
      var arglist__7081 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7082 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7083 = cljs.core.bounded_count.call(null, arglist__7081, fixed_arity__7082 + 1);
        if(bc__7083 <= fixed_arity__7082) {
          return cljs.core.apply_to.call(null, f, bc__7083, arglist__7081)
        }else {
          return f.cljs$lang$applyTo(arglist__7081)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7081))
      }
    };
    var G__7084 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7084__delegate.call(this, f, a, b, c, d, args)
    };
    G__7084.cljs$lang$maxFixedArity = 5;
    G__7084.cljs$lang$applyTo = function(arglist__7085) {
      var f = cljs.core.first(arglist__7085);
      var a = cljs.core.first(cljs.core.next(arglist__7085));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7085)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7085))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7085)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7085)))));
      return G__7084__delegate(f, a, b, c, d, args)
    };
    G__7084.cljs$lang$arity$variadic = G__7084__delegate;
    return G__7084
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7086) {
    var obj = cljs.core.first(arglist__7086);
    var f = cljs.core.first(cljs.core.next(arglist__7086));
    var args = cljs.core.rest(cljs.core.next(arglist__7086));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7087__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7087 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7087__delegate.call(this, x, y, more)
    };
    G__7087.cljs$lang$maxFixedArity = 2;
    G__7087.cljs$lang$applyTo = function(arglist__7088) {
      var x = cljs.core.first(arglist__7088);
      var y = cljs.core.first(cljs.core.next(arglist__7088));
      var more = cljs.core.rest(cljs.core.next(arglist__7088));
      return G__7087__delegate(x, y, more)
    };
    G__7087.cljs$lang$arity$variadic = G__7087__delegate;
    return G__7087
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7089 = pred;
        var G__7090 = cljs.core.next.call(null, coll);
        pred = G__7089;
        coll = G__7090;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3943__auto____7092 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto____7092)) {
        return or__3943__auto____7092
      }else {
        var G__7093 = pred;
        var G__7094 = cljs.core.next.call(null, coll);
        pred = G__7093;
        coll = G__7094;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7095 = null;
    var G__7095__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7095__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7095__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7095__3 = function() {
      var G__7096__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7096 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7096__delegate.call(this, x, y, zs)
      };
      G__7096.cljs$lang$maxFixedArity = 2;
      G__7096.cljs$lang$applyTo = function(arglist__7097) {
        var x = cljs.core.first(arglist__7097);
        var y = cljs.core.first(cljs.core.next(arglist__7097));
        var zs = cljs.core.rest(cljs.core.next(arglist__7097));
        return G__7096__delegate(x, y, zs)
      };
      G__7096.cljs$lang$arity$variadic = G__7096__delegate;
      return G__7096
    }();
    G__7095 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7095__0.call(this);
        case 1:
          return G__7095__1.call(this, x);
        case 2:
          return G__7095__2.call(this, x, y);
        default:
          return G__7095__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7095.cljs$lang$maxFixedArity = 2;
    G__7095.cljs$lang$applyTo = G__7095__3.cljs$lang$applyTo;
    return G__7095
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7098__delegate = function(args) {
      return x
    };
    var G__7098 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7098__delegate.call(this, args)
    };
    G__7098.cljs$lang$maxFixedArity = 0;
    G__7098.cljs$lang$applyTo = function(arglist__7099) {
      var args = cljs.core.seq(arglist__7099);
      return G__7098__delegate(args)
    };
    G__7098.cljs$lang$arity$variadic = G__7098__delegate;
    return G__7098
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7106 = null;
      var G__7106__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7106__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7106__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7106__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7106__4 = function() {
        var G__7107__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7107 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7107__delegate.call(this, x, y, z, args)
        };
        G__7107.cljs$lang$maxFixedArity = 3;
        G__7107.cljs$lang$applyTo = function(arglist__7108) {
          var x = cljs.core.first(arglist__7108);
          var y = cljs.core.first(cljs.core.next(arglist__7108));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7108)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7108)));
          return G__7107__delegate(x, y, z, args)
        };
        G__7107.cljs$lang$arity$variadic = G__7107__delegate;
        return G__7107
      }();
      G__7106 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7106__0.call(this);
          case 1:
            return G__7106__1.call(this, x);
          case 2:
            return G__7106__2.call(this, x, y);
          case 3:
            return G__7106__3.call(this, x, y, z);
          default:
            return G__7106__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7106.cljs$lang$maxFixedArity = 3;
      G__7106.cljs$lang$applyTo = G__7106__4.cljs$lang$applyTo;
      return G__7106
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7109 = null;
      var G__7109__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7109__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7109__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7109__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7109__4 = function() {
        var G__7110__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7110 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7110__delegate.call(this, x, y, z, args)
        };
        G__7110.cljs$lang$maxFixedArity = 3;
        G__7110.cljs$lang$applyTo = function(arglist__7111) {
          var x = cljs.core.first(arglist__7111);
          var y = cljs.core.first(cljs.core.next(arglist__7111));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7111)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7111)));
          return G__7110__delegate(x, y, z, args)
        };
        G__7110.cljs$lang$arity$variadic = G__7110__delegate;
        return G__7110
      }();
      G__7109 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7109__0.call(this);
          case 1:
            return G__7109__1.call(this, x);
          case 2:
            return G__7109__2.call(this, x, y);
          case 3:
            return G__7109__3.call(this, x, y, z);
          default:
            return G__7109__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7109.cljs$lang$maxFixedArity = 3;
      G__7109.cljs$lang$applyTo = G__7109__4.cljs$lang$applyTo;
      return G__7109
    }()
  };
  var comp__4 = function() {
    var G__7112__delegate = function(f1, f2, f3, fs) {
      var fs__7103 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7113__delegate = function(args) {
          var ret__7104 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7103), args);
          var fs__7105 = cljs.core.next.call(null, fs__7103);
          while(true) {
            if(fs__7105) {
              var G__7114 = cljs.core.first.call(null, fs__7105).call(null, ret__7104);
              var G__7115 = cljs.core.next.call(null, fs__7105);
              ret__7104 = G__7114;
              fs__7105 = G__7115;
              continue
            }else {
              return ret__7104
            }
            break
          }
        };
        var G__7113 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7113__delegate.call(this, args)
        };
        G__7113.cljs$lang$maxFixedArity = 0;
        G__7113.cljs$lang$applyTo = function(arglist__7116) {
          var args = cljs.core.seq(arglist__7116);
          return G__7113__delegate(args)
        };
        G__7113.cljs$lang$arity$variadic = G__7113__delegate;
        return G__7113
      }()
    };
    var G__7112 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7112__delegate.call(this, f1, f2, f3, fs)
    };
    G__7112.cljs$lang$maxFixedArity = 3;
    G__7112.cljs$lang$applyTo = function(arglist__7117) {
      var f1 = cljs.core.first(arglist__7117);
      var f2 = cljs.core.first(cljs.core.next(arglist__7117));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7117)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7117)));
      return G__7112__delegate(f1, f2, f3, fs)
    };
    G__7112.cljs$lang$arity$variadic = G__7112__delegate;
    return G__7112
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7118__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7118 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7118__delegate.call(this, args)
      };
      G__7118.cljs$lang$maxFixedArity = 0;
      G__7118.cljs$lang$applyTo = function(arglist__7119) {
        var args = cljs.core.seq(arglist__7119);
        return G__7118__delegate(args)
      };
      G__7118.cljs$lang$arity$variadic = G__7118__delegate;
      return G__7118
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7120__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7120 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7120__delegate.call(this, args)
      };
      G__7120.cljs$lang$maxFixedArity = 0;
      G__7120.cljs$lang$applyTo = function(arglist__7121) {
        var args = cljs.core.seq(arglist__7121);
        return G__7120__delegate(args)
      };
      G__7120.cljs$lang$arity$variadic = G__7120__delegate;
      return G__7120
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7122__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7122 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7122__delegate.call(this, args)
      };
      G__7122.cljs$lang$maxFixedArity = 0;
      G__7122.cljs$lang$applyTo = function(arglist__7123) {
        var args = cljs.core.seq(arglist__7123);
        return G__7122__delegate(args)
      };
      G__7122.cljs$lang$arity$variadic = G__7122__delegate;
      return G__7122
    }()
  };
  var partial__5 = function() {
    var G__7124__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7125__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7125 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7125__delegate.call(this, args)
        };
        G__7125.cljs$lang$maxFixedArity = 0;
        G__7125.cljs$lang$applyTo = function(arglist__7126) {
          var args = cljs.core.seq(arglist__7126);
          return G__7125__delegate(args)
        };
        G__7125.cljs$lang$arity$variadic = G__7125__delegate;
        return G__7125
      }()
    };
    var G__7124 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7124__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7124.cljs$lang$maxFixedArity = 4;
    G__7124.cljs$lang$applyTo = function(arglist__7127) {
      var f = cljs.core.first(arglist__7127);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7127));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7127)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7127))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7127))));
      return G__7124__delegate(f, arg1, arg2, arg3, more)
    };
    G__7124.cljs$lang$arity$variadic = G__7124__delegate;
    return G__7124
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7128 = null;
      var G__7128__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7128__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7128__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7128__4 = function() {
        var G__7129__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7129 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7129__delegate.call(this, a, b, c, ds)
        };
        G__7129.cljs$lang$maxFixedArity = 3;
        G__7129.cljs$lang$applyTo = function(arglist__7130) {
          var a = cljs.core.first(arglist__7130);
          var b = cljs.core.first(cljs.core.next(arglist__7130));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7130)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7130)));
          return G__7129__delegate(a, b, c, ds)
        };
        G__7129.cljs$lang$arity$variadic = G__7129__delegate;
        return G__7129
      }();
      G__7128 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7128__1.call(this, a);
          case 2:
            return G__7128__2.call(this, a, b);
          case 3:
            return G__7128__3.call(this, a, b, c);
          default:
            return G__7128__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7128.cljs$lang$maxFixedArity = 3;
      G__7128.cljs$lang$applyTo = G__7128__4.cljs$lang$applyTo;
      return G__7128
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7131 = null;
      var G__7131__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7131__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7131__4 = function() {
        var G__7132__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7132 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7132__delegate.call(this, a, b, c, ds)
        };
        G__7132.cljs$lang$maxFixedArity = 3;
        G__7132.cljs$lang$applyTo = function(arglist__7133) {
          var a = cljs.core.first(arglist__7133);
          var b = cljs.core.first(cljs.core.next(arglist__7133));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7133)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7133)));
          return G__7132__delegate(a, b, c, ds)
        };
        G__7132.cljs$lang$arity$variadic = G__7132__delegate;
        return G__7132
      }();
      G__7131 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7131__2.call(this, a, b);
          case 3:
            return G__7131__3.call(this, a, b, c);
          default:
            return G__7131__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7131.cljs$lang$maxFixedArity = 3;
      G__7131.cljs$lang$applyTo = G__7131__4.cljs$lang$applyTo;
      return G__7131
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7134 = null;
      var G__7134__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7134__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7134__4 = function() {
        var G__7135__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7135 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7135__delegate.call(this, a, b, c, ds)
        };
        G__7135.cljs$lang$maxFixedArity = 3;
        G__7135.cljs$lang$applyTo = function(arglist__7136) {
          var a = cljs.core.first(arglist__7136);
          var b = cljs.core.first(cljs.core.next(arglist__7136));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7136)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7136)));
          return G__7135__delegate(a, b, c, ds)
        };
        G__7135.cljs$lang$arity$variadic = G__7135__delegate;
        return G__7135
      }();
      G__7134 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7134__2.call(this, a, b);
          case 3:
            return G__7134__3.call(this, a, b, c);
          default:
            return G__7134__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7134.cljs$lang$maxFixedArity = 3;
      G__7134.cljs$lang$applyTo = G__7134__4.cljs$lang$applyTo;
      return G__7134
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7152 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7160 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7160) {
        var s__7161 = temp__4092__auto____7160;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7161)) {
          var c__7162 = cljs.core.chunk_first.call(null, s__7161);
          var size__7163 = cljs.core.count.call(null, c__7162);
          var b__7164 = cljs.core.chunk_buffer.call(null, size__7163);
          var n__2428__auto____7165 = size__7163;
          var i__7166 = 0;
          while(true) {
            if(i__7166 < n__2428__auto____7165) {
              cljs.core.chunk_append.call(null, b__7164, f.call(null, idx + i__7166, cljs.core._nth.call(null, c__7162, i__7166)));
              var G__7167 = i__7166 + 1;
              i__7166 = G__7167;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7164), mapi.call(null, idx + size__7163, cljs.core.chunk_rest.call(null, s__7161)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7161)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7161)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7152.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____7177 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____7177) {
      var s__7178 = temp__4092__auto____7177;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7178)) {
        var c__7179 = cljs.core.chunk_first.call(null, s__7178);
        var size__7180 = cljs.core.count.call(null, c__7179);
        var b__7181 = cljs.core.chunk_buffer.call(null, size__7180);
        var n__2428__auto____7182 = size__7180;
        var i__7183 = 0;
        while(true) {
          if(i__7183 < n__2428__auto____7182) {
            var x__7184 = f.call(null, cljs.core._nth.call(null, c__7179, i__7183));
            if(x__7184 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7181, x__7184)
            }
            var G__7186 = i__7183 + 1;
            i__7183 = G__7186;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7181), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7178)))
      }else {
        var x__7185 = f.call(null, cljs.core.first.call(null, s__7178));
        if(x__7185 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7178))
        }else {
          return cljs.core.cons.call(null, x__7185, keep.call(null, f, cljs.core.rest.call(null, s__7178)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7212 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7222 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7222) {
        var s__7223 = temp__4092__auto____7222;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7223)) {
          var c__7224 = cljs.core.chunk_first.call(null, s__7223);
          var size__7225 = cljs.core.count.call(null, c__7224);
          var b__7226 = cljs.core.chunk_buffer.call(null, size__7225);
          var n__2428__auto____7227 = size__7225;
          var i__7228 = 0;
          while(true) {
            if(i__7228 < n__2428__auto____7227) {
              var x__7229 = f.call(null, idx + i__7228, cljs.core._nth.call(null, c__7224, i__7228));
              if(x__7229 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7226, x__7229)
              }
              var G__7231 = i__7228 + 1;
              i__7228 = G__7231;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7226), keepi.call(null, idx + size__7225, cljs.core.chunk_rest.call(null, s__7223)))
        }else {
          var x__7230 = f.call(null, idx, cljs.core.first.call(null, s__7223));
          if(x__7230 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7223))
          }else {
            return cljs.core.cons.call(null, x__7230, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7223)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7212.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7317 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7317)) {
            return p.call(null, y)
          }else {
            return and__3941__auto____7317
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7318 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7318)) {
            var and__3941__auto____7319 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7319)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____7319
            }
          }else {
            return and__3941__auto____7318
          }
        }())
      };
      var ep1__4 = function() {
        var G__7388__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7320 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7320)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto____7320
            }
          }())
        };
        var G__7388 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7388__delegate.call(this, x, y, z, args)
        };
        G__7388.cljs$lang$maxFixedArity = 3;
        G__7388.cljs$lang$applyTo = function(arglist__7389) {
          var x = cljs.core.first(arglist__7389);
          var y = cljs.core.first(cljs.core.next(arglist__7389));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7389)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7389)));
          return G__7388__delegate(x, y, z, args)
        };
        G__7388.cljs$lang$arity$variadic = G__7388__delegate;
        return G__7388
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7332 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7332)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto____7332
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7333 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7333)) {
            var and__3941__auto____7334 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7334)) {
              var and__3941__auto____7335 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7335)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____7335
              }
            }else {
              return and__3941__auto____7334
            }
          }else {
            return and__3941__auto____7333
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7336 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7336)) {
            var and__3941__auto____7337 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7337)) {
              var and__3941__auto____7338 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____7338)) {
                var and__3941__auto____7339 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____7339)) {
                  var and__3941__auto____7340 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7340)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____7340
                  }
                }else {
                  return and__3941__auto____7339
                }
              }else {
                return and__3941__auto____7338
              }
            }else {
              return and__3941__auto____7337
            }
          }else {
            return and__3941__auto____7336
          }
        }())
      };
      var ep2__4 = function() {
        var G__7390__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7341 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7341)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7187_SHARP_) {
                var and__3941__auto____7342 = p1.call(null, p1__7187_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7342)) {
                  return p2.call(null, p1__7187_SHARP_)
                }else {
                  return and__3941__auto____7342
                }
              }, args)
            }else {
              return and__3941__auto____7341
            }
          }())
        };
        var G__7390 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7390__delegate.call(this, x, y, z, args)
        };
        G__7390.cljs$lang$maxFixedArity = 3;
        G__7390.cljs$lang$applyTo = function(arglist__7391) {
          var x = cljs.core.first(arglist__7391);
          var y = cljs.core.first(cljs.core.next(arglist__7391));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7391)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7391)));
          return G__7390__delegate(x, y, z, args)
        };
        G__7390.cljs$lang$arity$variadic = G__7390__delegate;
        return G__7390
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7361 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7361)) {
            var and__3941__auto____7362 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7362)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____7362
            }
          }else {
            return and__3941__auto____7361
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7363 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7363)) {
            var and__3941__auto____7364 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7364)) {
              var and__3941__auto____7365 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7365)) {
                var and__3941__auto____7366 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7366)) {
                  var and__3941__auto____7367 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7367)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____7367
                  }
                }else {
                  return and__3941__auto____7366
                }
              }else {
                return and__3941__auto____7365
              }
            }else {
              return and__3941__auto____7364
            }
          }else {
            return and__3941__auto____7363
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7368 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7368)) {
            var and__3941__auto____7369 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7369)) {
              var and__3941__auto____7370 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7370)) {
                var and__3941__auto____7371 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7371)) {
                  var and__3941__auto____7372 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7372)) {
                    var and__3941__auto____7373 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____7373)) {
                      var and__3941__auto____7374 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____7374)) {
                        var and__3941__auto____7375 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____7375)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____7375
                        }
                      }else {
                        return and__3941__auto____7374
                      }
                    }else {
                      return and__3941__auto____7373
                    }
                  }else {
                    return and__3941__auto____7372
                  }
                }else {
                  return and__3941__auto____7371
                }
              }else {
                return and__3941__auto____7370
              }
            }else {
              return and__3941__auto____7369
            }
          }else {
            return and__3941__auto____7368
          }
        }())
      };
      var ep3__4 = function() {
        var G__7392__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7376 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7376)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7188_SHARP_) {
                var and__3941__auto____7377 = p1.call(null, p1__7188_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7377)) {
                  var and__3941__auto____7378 = p2.call(null, p1__7188_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____7378)) {
                    return p3.call(null, p1__7188_SHARP_)
                  }else {
                    return and__3941__auto____7378
                  }
                }else {
                  return and__3941__auto____7377
                }
              }, args)
            }else {
              return and__3941__auto____7376
            }
          }())
        };
        var G__7392 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7392__delegate.call(this, x, y, z, args)
        };
        G__7392.cljs$lang$maxFixedArity = 3;
        G__7392.cljs$lang$applyTo = function(arglist__7393) {
          var x = cljs.core.first(arglist__7393);
          var y = cljs.core.first(cljs.core.next(arglist__7393));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7393)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7393)));
          return G__7392__delegate(x, y, z, args)
        };
        G__7392.cljs$lang$arity$variadic = G__7392__delegate;
        return G__7392
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7394__delegate = function(p1, p2, p3, ps) {
      var ps__7379 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7189_SHARP_) {
            return p1__7189_SHARP_.call(null, x)
          }, ps__7379)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7190_SHARP_) {
            var and__3941__auto____7384 = p1__7190_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7384)) {
              return p1__7190_SHARP_.call(null, y)
            }else {
              return and__3941__auto____7384
            }
          }, ps__7379)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7191_SHARP_) {
            var and__3941__auto____7385 = p1__7191_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7385)) {
              var and__3941__auto____7386 = p1__7191_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____7386)) {
                return p1__7191_SHARP_.call(null, z)
              }else {
                return and__3941__auto____7386
              }
            }else {
              return and__3941__auto____7385
            }
          }, ps__7379)
        };
        var epn__4 = function() {
          var G__7395__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto____7387 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto____7387)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7192_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7192_SHARP_, args)
                }, ps__7379)
              }else {
                return and__3941__auto____7387
              }
            }())
          };
          var G__7395 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7395__delegate.call(this, x, y, z, args)
          };
          G__7395.cljs$lang$maxFixedArity = 3;
          G__7395.cljs$lang$applyTo = function(arglist__7396) {
            var x = cljs.core.first(arglist__7396);
            var y = cljs.core.first(cljs.core.next(arglist__7396));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7396)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7396)));
            return G__7395__delegate(x, y, z, args)
          };
          G__7395.cljs$lang$arity$variadic = G__7395__delegate;
          return G__7395
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7394 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7394__delegate.call(this, p1, p2, p3, ps)
    };
    G__7394.cljs$lang$maxFixedArity = 3;
    G__7394.cljs$lang$applyTo = function(arglist__7397) {
      var p1 = cljs.core.first(arglist__7397);
      var p2 = cljs.core.first(cljs.core.next(arglist__7397));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7397)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7397)));
      return G__7394__delegate(p1, p2, p3, ps)
    };
    G__7394.cljs$lang$arity$variadic = G__7394__delegate;
    return G__7394
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto____7478 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7478)) {
          return or__3943__auto____7478
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto____7479 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7479)) {
          return or__3943__auto____7479
        }else {
          var or__3943__auto____7480 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7480)) {
            return or__3943__auto____7480
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7549__delegate = function(x, y, z, args) {
          var or__3943__auto____7481 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7481)) {
            return or__3943__auto____7481
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__7549 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7549__delegate.call(this, x, y, z, args)
        };
        G__7549.cljs$lang$maxFixedArity = 3;
        G__7549.cljs$lang$applyTo = function(arglist__7550) {
          var x = cljs.core.first(arglist__7550);
          var y = cljs.core.first(cljs.core.next(arglist__7550));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7550)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7550)));
          return G__7549__delegate(x, y, z, args)
        };
        G__7549.cljs$lang$arity$variadic = G__7549__delegate;
        return G__7549
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto____7493 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7493)) {
          return or__3943__auto____7493
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto____7494 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7494)) {
          return or__3943__auto____7494
        }else {
          var or__3943__auto____7495 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7495)) {
            return or__3943__auto____7495
          }else {
            var or__3943__auto____7496 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7496)) {
              return or__3943__auto____7496
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto____7497 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7497)) {
          return or__3943__auto____7497
        }else {
          var or__3943__auto____7498 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7498)) {
            return or__3943__auto____7498
          }else {
            var or__3943__auto____7499 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____7499)) {
              return or__3943__auto____7499
            }else {
              var or__3943__auto____7500 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____7500)) {
                return or__3943__auto____7500
              }else {
                var or__3943__auto____7501 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7501)) {
                  return or__3943__auto____7501
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7551__delegate = function(x, y, z, args) {
          var or__3943__auto____7502 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7502)) {
            return or__3943__auto____7502
          }else {
            return cljs.core.some.call(null, function(p1__7232_SHARP_) {
              var or__3943__auto____7503 = p1.call(null, p1__7232_SHARP_);
              if(cljs.core.truth_(or__3943__auto____7503)) {
                return or__3943__auto____7503
              }else {
                return p2.call(null, p1__7232_SHARP_)
              }
            }, args)
          }
        };
        var G__7551 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7551__delegate.call(this, x, y, z, args)
        };
        G__7551.cljs$lang$maxFixedArity = 3;
        G__7551.cljs$lang$applyTo = function(arglist__7552) {
          var x = cljs.core.first(arglist__7552);
          var y = cljs.core.first(cljs.core.next(arglist__7552));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7552)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7552)));
          return G__7551__delegate(x, y, z, args)
        };
        G__7551.cljs$lang$arity$variadic = G__7551__delegate;
        return G__7551
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto____7522 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7522)) {
          return or__3943__auto____7522
        }else {
          var or__3943__auto____7523 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7523)) {
            return or__3943__auto____7523
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto____7524 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7524)) {
          return or__3943__auto____7524
        }else {
          var or__3943__auto____7525 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7525)) {
            return or__3943__auto____7525
          }else {
            var or__3943__auto____7526 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7526)) {
              return or__3943__auto____7526
            }else {
              var or__3943__auto____7527 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7527)) {
                return or__3943__auto____7527
              }else {
                var or__3943__auto____7528 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7528)) {
                  return or__3943__auto____7528
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto____7529 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7529)) {
          return or__3943__auto____7529
        }else {
          var or__3943__auto____7530 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7530)) {
            return or__3943__auto____7530
          }else {
            var or__3943__auto____7531 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7531)) {
              return or__3943__auto____7531
            }else {
              var or__3943__auto____7532 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7532)) {
                return or__3943__auto____7532
              }else {
                var or__3943__auto____7533 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7533)) {
                  return or__3943__auto____7533
                }else {
                  var or__3943__auto____7534 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____7534)) {
                    return or__3943__auto____7534
                  }else {
                    var or__3943__auto____7535 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____7535)) {
                      return or__3943__auto____7535
                    }else {
                      var or__3943__auto____7536 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____7536)) {
                        return or__3943__auto____7536
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__7553__delegate = function(x, y, z, args) {
          var or__3943__auto____7537 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7537)) {
            return or__3943__auto____7537
          }else {
            return cljs.core.some.call(null, function(p1__7233_SHARP_) {
              var or__3943__auto____7538 = p1.call(null, p1__7233_SHARP_);
              if(cljs.core.truth_(or__3943__auto____7538)) {
                return or__3943__auto____7538
              }else {
                var or__3943__auto____7539 = p2.call(null, p1__7233_SHARP_);
                if(cljs.core.truth_(or__3943__auto____7539)) {
                  return or__3943__auto____7539
                }else {
                  return p3.call(null, p1__7233_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7553 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7553__delegate.call(this, x, y, z, args)
        };
        G__7553.cljs$lang$maxFixedArity = 3;
        G__7553.cljs$lang$applyTo = function(arglist__7554) {
          var x = cljs.core.first(arglist__7554);
          var y = cljs.core.first(cljs.core.next(arglist__7554));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7554)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7554)));
          return G__7553__delegate(x, y, z, args)
        };
        G__7553.cljs$lang$arity$variadic = G__7553__delegate;
        return G__7553
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__7555__delegate = function(p1, p2, p3, ps) {
      var ps__7540 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7234_SHARP_) {
            return p1__7234_SHARP_.call(null, x)
          }, ps__7540)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7235_SHARP_) {
            var or__3943__auto____7545 = p1__7235_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7545)) {
              return or__3943__auto____7545
            }else {
              return p1__7235_SHARP_.call(null, y)
            }
          }, ps__7540)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7236_SHARP_) {
            var or__3943__auto____7546 = p1__7236_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7546)) {
              return or__3943__auto____7546
            }else {
              var or__3943__auto____7547 = p1__7236_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7547)) {
                return or__3943__auto____7547
              }else {
                return p1__7236_SHARP_.call(null, z)
              }
            }
          }, ps__7540)
        };
        var spn__4 = function() {
          var G__7556__delegate = function(x, y, z, args) {
            var or__3943__auto____7548 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto____7548)) {
              return or__3943__auto____7548
            }else {
              return cljs.core.some.call(null, function(p1__7237_SHARP_) {
                return cljs.core.some.call(null, p1__7237_SHARP_, args)
              }, ps__7540)
            }
          };
          var G__7556 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7556__delegate.call(this, x, y, z, args)
          };
          G__7556.cljs$lang$maxFixedArity = 3;
          G__7556.cljs$lang$applyTo = function(arglist__7557) {
            var x = cljs.core.first(arglist__7557);
            var y = cljs.core.first(cljs.core.next(arglist__7557));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7557)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7557)));
            return G__7556__delegate(x, y, z, args)
          };
          G__7556.cljs$lang$arity$variadic = G__7556__delegate;
          return G__7556
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__7555 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7555__delegate.call(this, p1, p2, p3, ps)
    };
    G__7555.cljs$lang$maxFixedArity = 3;
    G__7555.cljs$lang$applyTo = function(arglist__7558) {
      var p1 = cljs.core.first(arglist__7558);
      var p2 = cljs.core.first(cljs.core.next(arglist__7558));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7558)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7558)));
      return G__7555__delegate(p1, p2, p3, ps)
    };
    G__7555.cljs$lang$arity$variadic = G__7555__delegate;
    return G__7555
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7577 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7577) {
        var s__7578 = temp__4092__auto____7577;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7578)) {
          var c__7579 = cljs.core.chunk_first.call(null, s__7578);
          var size__7580 = cljs.core.count.call(null, c__7579);
          var b__7581 = cljs.core.chunk_buffer.call(null, size__7580);
          var n__2428__auto____7582 = size__7580;
          var i__7583 = 0;
          while(true) {
            if(i__7583 < n__2428__auto____7582) {
              cljs.core.chunk_append.call(null, b__7581, f.call(null, cljs.core._nth.call(null, c__7579, i__7583)));
              var G__7595 = i__7583 + 1;
              i__7583 = G__7595;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7581), map.call(null, f, cljs.core.chunk_rest.call(null, s__7578)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__7578)), map.call(null, f, cljs.core.rest.call(null, s__7578)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7584 = cljs.core.seq.call(null, c1);
      var s2__7585 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____7586 = s1__7584;
        if(and__3941__auto____7586) {
          return s2__7585
        }else {
          return and__3941__auto____7586
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__7584), cljs.core.first.call(null, s2__7585)), map.call(null, f, cljs.core.rest.call(null, s1__7584), cljs.core.rest.call(null, s2__7585)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7587 = cljs.core.seq.call(null, c1);
      var s2__7588 = cljs.core.seq.call(null, c2);
      var s3__7589 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto____7590 = s1__7587;
        if(and__3941__auto____7590) {
          var and__3941__auto____7591 = s2__7588;
          if(and__3941__auto____7591) {
            return s3__7589
          }else {
            return and__3941__auto____7591
          }
        }else {
          return and__3941__auto____7590
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__7587), cljs.core.first.call(null, s2__7588), cljs.core.first.call(null, s3__7589)), map.call(null, f, cljs.core.rest.call(null, s1__7587), cljs.core.rest.call(null, s2__7588), cljs.core.rest.call(null, s3__7589)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__7596__delegate = function(f, c1, c2, c3, colls) {
      var step__7594 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__7593 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__7593)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__7593), step.call(null, map.call(null, cljs.core.rest, ss__7593)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7398_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7398_SHARP_)
      }, step__7594.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__7596 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7596__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__7596.cljs$lang$maxFixedArity = 4;
    G__7596.cljs$lang$applyTo = function(arglist__7597) {
      var f = cljs.core.first(arglist__7597);
      var c1 = cljs.core.first(cljs.core.next(arglist__7597));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7597)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7597))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7597))));
      return G__7596__delegate(f, c1, c2, c3, colls)
    };
    G__7596.cljs$lang$arity$variadic = G__7596__delegate;
    return G__7596
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__4092__auto____7600 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7600) {
        var s__7601 = temp__4092__auto____7600;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__7601), take.call(null, n - 1, cljs.core.rest.call(null, s__7601)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__7607 = function(n, coll) {
    while(true) {
      var s__7605 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____7606 = n > 0;
        if(and__3941__auto____7606) {
          return s__7605
        }else {
          return and__3941__auto____7606
        }
      }())) {
        var G__7608 = n - 1;
        var G__7609 = cljs.core.rest.call(null, s__7605);
        n = G__7608;
        coll = G__7609;
        continue
      }else {
        return s__7605
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__7607.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__7612 = cljs.core.seq.call(null, coll);
  var lead__7613 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__7613) {
      var G__7614 = cljs.core.next.call(null, s__7612);
      var G__7615 = cljs.core.next.call(null, lead__7613);
      s__7612 = G__7614;
      lead__7613 = G__7615;
      continue
    }else {
      return s__7612
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__7621 = function(pred, coll) {
    while(true) {
      var s__7619 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____7620 = s__7619;
        if(and__3941__auto____7620) {
          return pred.call(null, cljs.core.first.call(null, s__7619))
        }else {
          return and__3941__auto____7620
        }
      }())) {
        var G__7622 = pred;
        var G__7623 = cljs.core.rest.call(null, s__7619);
        pred = G__7622;
        coll = G__7623;
        continue
      }else {
        return s__7619
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__7621.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____7626 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____7626) {
      var s__7627 = temp__4092__auto____7626;
      return cljs.core.concat.call(null, s__7627, cycle.call(null, s__7627))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7632 = cljs.core.seq.call(null, c1);
      var s2__7633 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____7634 = s1__7632;
        if(and__3941__auto____7634) {
          return s2__7633
        }else {
          return and__3941__auto____7634
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__7632), cljs.core.cons.call(null, cljs.core.first.call(null, s2__7633), interleave.call(null, cljs.core.rest.call(null, s1__7632), cljs.core.rest.call(null, s2__7633))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__7636__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__7635 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__7635)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__7635), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__7635)))
        }else {
          return null
        }
      }, null)
    };
    var G__7636 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7636__delegate.call(this, c1, c2, colls)
    };
    G__7636.cljs$lang$maxFixedArity = 2;
    G__7636.cljs$lang$applyTo = function(arglist__7637) {
      var c1 = cljs.core.first(arglist__7637);
      var c2 = cljs.core.first(cljs.core.next(arglist__7637));
      var colls = cljs.core.rest(cljs.core.next(arglist__7637));
      return G__7636__delegate(c1, c2, colls)
    };
    G__7636.cljs$lang$arity$variadic = G__7636__delegate;
    return G__7636
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__7647 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____7645 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____7645) {
        var coll__7646 = temp__4090__auto____7645;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__7646), cat.call(null, cljs.core.rest.call(null, coll__7646), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__7647.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__7648__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__7648 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7648__delegate.call(this, f, coll, colls)
    };
    G__7648.cljs$lang$maxFixedArity = 2;
    G__7648.cljs$lang$applyTo = function(arglist__7649) {
      var f = cljs.core.first(arglist__7649);
      var coll = cljs.core.first(cljs.core.next(arglist__7649));
      var colls = cljs.core.rest(cljs.core.next(arglist__7649));
      return G__7648__delegate(f, coll, colls)
    };
    G__7648.cljs$lang$arity$variadic = G__7648__delegate;
    return G__7648
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____7659 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____7659) {
      var s__7660 = temp__4092__auto____7659;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7660)) {
        var c__7661 = cljs.core.chunk_first.call(null, s__7660);
        var size__7662 = cljs.core.count.call(null, c__7661);
        var b__7663 = cljs.core.chunk_buffer.call(null, size__7662);
        var n__2428__auto____7664 = size__7662;
        var i__7665 = 0;
        while(true) {
          if(i__7665 < n__2428__auto____7664) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__7661, i__7665)))) {
              cljs.core.chunk_append.call(null, b__7663, cljs.core._nth.call(null, c__7661, i__7665))
            }else {
            }
            var G__7668 = i__7665 + 1;
            i__7665 = G__7668;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7663), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__7660)))
      }else {
        var f__7666 = cljs.core.first.call(null, s__7660);
        var r__7667 = cljs.core.rest.call(null, s__7660);
        if(cljs.core.truth_(pred.call(null, f__7666))) {
          return cljs.core.cons.call(null, f__7666, filter.call(null, pred, r__7667))
        }else {
          return filter.call(null, pred, r__7667)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__7671 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__7671.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__7669_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__7669_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__7675__7676 = to;
    if(G__7675__7676) {
      if(function() {
        var or__3943__auto____7677 = G__7675__7676.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3943__auto____7677) {
          return or__3943__auto____7677
        }else {
          return G__7675__7676.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__7675__7676.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__7675__7676)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__7675__7676)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__7678__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__7678 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7678__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__7678.cljs$lang$maxFixedArity = 4;
    G__7678.cljs$lang$applyTo = function(arglist__7679) {
      var f = cljs.core.first(arglist__7679);
      var c1 = cljs.core.first(cljs.core.next(arglist__7679));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7679)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7679))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7679))));
      return G__7678__delegate(f, c1, c2, c3, colls)
    };
    G__7678.cljs$lang$arity$variadic = G__7678__delegate;
    return G__7678
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7686 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7686) {
        var s__7687 = temp__4092__auto____7686;
        var p__7688 = cljs.core.take.call(null, n, s__7687);
        if(n === cljs.core.count.call(null, p__7688)) {
          return cljs.core.cons.call(null, p__7688, partition.call(null, n, step, cljs.core.drop.call(null, step, s__7687)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7689 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7689) {
        var s__7690 = temp__4092__auto____7689;
        var p__7691 = cljs.core.take.call(null, n, s__7690);
        if(n === cljs.core.count.call(null, p__7691)) {
          return cljs.core.cons.call(null, p__7691, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__7690)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__7691, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__7696 = cljs.core.lookup_sentinel;
    var m__7697 = m;
    var ks__7698 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__7698) {
        var m__7699 = cljs.core._lookup.call(null, m__7697, cljs.core.first.call(null, ks__7698), sentinel__7696);
        if(sentinel__7696 === m__7699) {
          return not_found
        }else {
          var G__7700 = sentinel__7696;
          var G__7701 = m__7699;
          var G__7702 = cljs.core.next.call(null, ks__7698);
          sentinel__7696 = G__7700;
          m__7697 = G__7701;
          ks__7698 = G__7702;
          continue
        }
      }else {
        return m__7697
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__7703, v) {
  var vec__7708__7709 = p__7703;
  var k__7710 = cljs.core.nth.call(null, vec__7708__7709, 0, null);
  var ks__7711 = cljs.core.nthnext.call(null, vec__7708__7709, 1);
  if(cljs.core.truth_(ks__7711)) {
    return cljs.core.assoc.call(null, m, k__7710, assoc_in.call(null, cljs.core._lookup.call(null, m, k__7710, null), ks__7711, v))
  }else {
    return cljs.core.assoc.call(null, m, k__7710, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__7712, f, args) {
    var vec__7717__7718 = p__7712;
    var k__7719 = cljs.core.nth.call(null, vec__7717__7718, 0, null);
    var ks__7720 = cljs.core.nthnext.call(null, vec__7717__7718, 1);
    if(cljs.core.truth_(ks__7720)) {
      return cljs.core.assoc.call(null, m, k__7719, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__7719, null), ks__7720, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__7719, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__7719, null), args))
    }
  };
  var update_in = function(m, p__7712, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__7712, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__7721) {
    var m = cljs.core.first(arglist__7721);
    var p__7712 = cljs.core.first(cljs.core.next(arglist__7721));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7721)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7721)));
    return update_in__delegate(m, p__7712, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7724 = this;
  var h__2089__auto____7725 = this__7724.__hash;
  if(!(h__2089__auto____7725 == null)) {
    return h__2089__auto____7725
  }else {
    var h__2089__auto____7726 = cljs.core.hash_coll.call(null, coll);
    this__7724.__hash = h__2089__auto____7726;
    return h__2089__auto____7726
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7727 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7728 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7729 = this;
  var new_array__7730 = this__7729.array.slice();
  new_array__7730[k] = v;
  return new cljs.core.Vector(this__7729.meta, new_array__7730, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__7761 = null;
  var G__7761__2 = function(this_sym7731, k) {
    var this__7733 = this;
    var this_sym7731__7734 = this;
    var coll__7735 = this_sym7731__7734;
    return coll__7735.cljs$core$ILookup$_lookup$arity$2(coll__7735, k)
  };
  var G__7761__3 = function(this_sym7732, k, not_found) {
    var this__7733 = this;
    var this_sym7732__7736 = this;
    var coll__7737 = this_sym7732__7736;
    return coll__7737.cljs$core$ILookup$_lookup$arity$3(coll__7737, k, not_found)
  };
  G__7761 = function(this_sym7732, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7761__2.call(this, this_sym7732, k);
      case 3:
        return G__7761__3.call(this, this_sym7732, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7761
}();
cljs.core.Vector.prototype.apply = function(this_sym7722, args7723) {
  var this__7738 = this;
  return this_sym7722.call.apply(this_sym7722, [this_sym7722].concat(args7723.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7739 = this;
  var new_array__7740 = this__7739.array.slice();
  new_array__7740.push(o);
  return new cljs.core.Vector(this__7739.meta, new_array__7740, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__7741 = this;
  var this__7742 = this;
  return cljs.core.pr_str.call(null, this__7742)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__7743 = this;
  return cljs.core.ci_reduce.call(null, this__7743.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__7744 = this;
  return cljs.core.ci_reduce.call(null, this__7744.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7745 = this;
  if(this__7745.array.length > 0) {
    var vector_seq__7746 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__7745.array.length) {
          return cljs.core.cons.call(null, this__7745.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__7746.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7747 = this;
  return this__7747.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7748 = this;
  var count__7749 = this__7748.array.length;
  if(count__7749 > 0) {
    return this__7748.array[count__7749 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7750 = this;
  if(this__7750.array.length > 0) {
    var new_array__7751 = this__7750.array.slice();
    new_array__7751.pop();
    return new cljs.core.Vector(this__7750.meta, new_array__7751, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__7752 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7753 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7754 = this;
  return new cljs.core.Vector(meta, this__7754.array, this__7754.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7755 = this;
  return this__7755.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7756 = this;
  if(function() {
    var and__3941__auto____7757 = 0 <= n;
    if(and__3941__auto____7757) {
      return n < this__7756.array.length
    }else {
      return and__3941__auto____7757
    }
  }()) {
    return this__7756.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7758 = this;
  if(function() {
    var and__3941__auto____7759 = 0 <= n;
    if(and__3941__auto____7759) {
      return n < this__7758.array.length
    }else {
      return and__3941__auto____7759
    }
  }()) {
    return this__7758.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7760 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__7760.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2207__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__7763 = pv.cnt;
  if(cnt__7763 < 32) {
    return 0
  }else {
    return cnt__7763 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__7769 = level;
  var ret__7770 = node;
  while(true) {
    if(ll__7769 === 0) {
      return ret__7770
    }else {
      var embed__7771 = ret__7770;
      var r__7772 = cljs.core.pv_fresh_node.call(null, edit);
      var ___7773 = cljs.core.pv_aset.call(null, r__7772, 0, embed__7771);
      var G__7774 = ll__7769 - 5;
      var G__7775 = r__7772;
      ll__7769 = G__7774;
      ret__7770 = G__7775;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__7781 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__7782 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__7781, subidx__7782, tailnode);
    return ret__7781
  }else {
    var child__7783 = cljs.core.pv_aget.call(null, parent, subidx__7782);
    if(!(child__7783 == null)) {
      var node_to_insert__7784 = push_tail.call(null, pv, level - 5, child__7783, tailnode);
      cljs.core.pv_aset.call(null, ret__7781, subidx__7782, node_to_insert__7784);
      return ret__7781
    }else {
      var node_to_insert__7785 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__7781, subidx__7782, node_to_insert__7785);
      return ret__7781
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto____7789 = 0 <= i;
    if(and__3941__auto____7789) {
      return i < pv.cnt
    }else {
      return and__3941__auto____7789
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__7790 = pv.root;
      var level__7791 = pv.shift;
      while(true) {
        if(level__7791 > 0) {
          var G__7792 = cljs.core.pv_aget.call(null, node__7790, i >>> level__7791 & 31);
          var G__7793 = level__7791 - 5;
          node__7790 = G__7792;
          level__7791 = G__7793;
          continue
        }else {
          return node__7790.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__7796 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__7796, i & 31, val);
    return ret__7796
  }else {
    var subidx__7797 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__7796, subidx__7797, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__7797), i, val));
    return ret__7796
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__7803 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__7804 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__7803));
    if(function() {
      var and__3941__auto____7805 = new_child__7804 == null;
      if(and__3941__auto____7805) {
        return subidx__7803 === 0
      }else {
        return and__3941__auto____7805
      }
    }()) {
      return null
    }else {
      var ret__7806 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__7806, subidx__7803, new_child__7804);
      return ret__7806
    }
  }else {
    if(subidx__7803 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__7807 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__7807, subidx__7803, null);
        return ret__7807
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__7810 = this;
  return new cljs.core.TransientVector(this__7810.cnt, this__7810.shift, cljs.core.tv_editable_root.call(null, this__7810.root), cljs.core.tv_editable_tail.call(null, this__7810.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7811 = this;
  var h__2089__auto____7812 = this__7811.__hash;
  if(!(h__2089__auto____7812 == null)) {
    return h__2089__auto____7812
  }else {
    var h__2089__auto____7813 = cljs.core.hash_coll.call(null, coll);
    this__7811.__hash = h__2089__auto____7813;
    return h__2089__auto____7813
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7814 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7815 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7816 = this;
  if(function() {
    var and__3941__auto____7817 = 0 <= k;
    if(and__3941__auto____7817) {
      return k < this__7816.cnt
    }else {
      return and__3941__auto____7817
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__7818 = this__7816.tail.slice();
      new_tail__7818[k & 31] = v;
      return new cljs.core.PersistentVector(this__7816.meta, this__7816.cnt, this__7816.shift, this__7816.root, new_tail__7818, null)
    }else {
      return new cljs.core.PersistentVector(this__7816.meta, this__7816.cnt, this__7816.shift, cljs.core.do_assoc.call(null, coll, this__7816.shift, this__7816.root, k, v), this__7816.tail, null)
    }
  }else {
    if(k === this__7816.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__7816.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__7866 = null;
  var G__7866__2 = function(this_sym7819, k) {
    var this__7821 = this;
    var this_sym7819__7822 = this;
    var coll__7823 = this_sym7819__7822;
    return coll__7823.cljs$core$ILookup$_lookup$arity$2(coll__7823, k)
  };
  var G__7866__3 = function(this_sym7820, k, not_found) {
    var this__7821 = this;
    var this_sym7820__7824 = this;
    var coll__7825 = this_sym7820__7824;
    return coll__7825.cljs$core$ILookup$_lookup$arity$3(coll__7825, k, not_found)
  };
  G__7866 = function(this_sym7820, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7866__2.call(this, this_sym7820, k);
      case 3:
        return G__7866__3.call(this, this_sym7820, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7866
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym7808, args7809) {
  var this__7826 = this;
  return this_sym7808.call.apply(this_sym7808, [this_sym7808].concat(args7809.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__7827 = this;
  var step_init__7828 = [0, init];
  var i__7829 = 0;
  while(true) {
    if(i__7829 < this__7827.cnt) {
      var arr__7830 = cljs.core.array_for.call(null, v, i__7829);
      var len__7831 = arr__7830.length;
      var init__7835 = function() {
        var j__7832 = 0;
        var init__7833 = step_init__7828[1];
        while(true) {
          if(j__7832 < len__7831) {
            var init__7834 = f.call(null, init__7833, j__7832 + i__7829, arr__7830[j__7832]);
            if(cljs.core.reduced_QMARK_.call(null, init__7834)) {
              return init__7834
            }else {
              var G__7867 = j__7832 + 1;
              var G__7868 = init__7834;
              j__7832 = G__7867;
              init__7833 = G__7868;
              continue
            }
          }else {
            step_init__7828[0] = len__7831;
            step_init__7828[1] = init__7833;
            return init__7833
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__7835)) {
        return cljs.core.deref.call(null, init__7835)
      }else {
        var G__7869 = i__7829 + step_init__7828[0];
        i__7829 = G__7869;
        continue
      }
    }else {
      return step_init__7828[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7836 = this;
  if(this__7836.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__7837 = this__7836.tail.slice();
    new_tail__7837.push(o);
    return new cljs.core.PersistentVector(this__7836.meta, this__7836.cnt + 1, this__7836.shift, this__7836.root, new_tail__7837, null)
  }else {
    var root_overflow_QMARK___7838 = this__7836.cnt >>> 5 > 1 << this__7836.shift;
    var new_shift__7839 = root_overflow_QMARK___7838 ? this__7836.shift + 5 : this__7836.shift;
    var new_root__7841 = root_overflow_QMARK___7838 ? function() {
      var n_r__7840 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__7840, 0, this__7836.root);
      cljs.core.pv_aset.call(null, n_r__7840, 1, cljs.core.new_path.call(null, null, this__7836.shift, new cljs.core.VectorNode(null, this__7836.tail)));
      return n_r__7840
    }() : cljs.core.push_tail.call(null, coll, this__7836.shift, this__7836.root, new cljs.core.VectorNode(null, this__7836.tail));
    return new cljs.core.PersistentVector(this__7836.meta, this__7836.cnt + 1, new_shift__7839, new_root__7841, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7842 = this;
  if(this__7842.cnt > 0) {
    return new cljs.core.RSeq(coll, this__7842.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__7843 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__7844 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__7845 = this;
  var this__7846 = this;
  return cljs.core.pr_str.call(null, this__7846)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__7847 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__7848 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7849 = this;
  if(this__7849.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7850 = this;
  return this__7850.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7851 = this;
  if(this__7851.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__7851.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7852 = this;
  if(this__7852.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__7852.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__7852.meta)
    }else {
      if(1 < this__7852.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__7852.meta, this__7852.cnt - 1, this__7852.shift, this__7852.root, this__7852.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__7853 = cljs.core.array_for.call(null, coll, this__7852.cnt - 2);
          var nr__7854 = cljs.core.pop_tail.call(null, coll, this__7852.shift, this__7852.root);
          var new_root__7855 = nr__7854 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__7854;
          var cnt_1__7856 = this__7852.cnt - 1;
          if(function() {
            var and__3941__auto____7857 = 5 < this__7852.shift;
            if(and__3941__auto____7857) {
              return cljs.core.pv_aget.call(null, new_root__7855, 1) == null
            }else {
              return and__3941__auto____7857
            }
          }()) {
            return new cljs.core.PersistentVector(this__7852.meta, cnt_1__7856, this__7852.shift - 5, cljs.core.pv_aget.call(null, new_root__7855, 0), new_tail__7853, null)
          }else {
            return new cljs.core.PersistentVector(this__7852.meta, cnt_1__7856, this__7852.shift, new_root__7855, new_tail__7853, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__7858 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7859 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7860 = this;
  return new cljs.core.PersistentVector(meta, this__7860.cnt, this__7860.shift, this__7860.root, this__7860.tail, this__7860.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7861 = this;
  return this__7861.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7862 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7863 = this;
  if(function() {
    var and__3941__auto____7864 = 0 <= n;
    if(and__3941__auto____7864) {
      return n < this__7863.cnt
    }else {
      return and__3941__auto____7864
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7865 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__7865.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__7870 = xs.length;
  var xs__7871 = no_clone === true ? xs : xs.slice();
  if(l__7870 < 32) {
    return new cljs.core.PersistentVector(null, l__7870, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__7871, null)
  }else {
    var node__7872 = xs__7871.slice(0, 32);
    var v__7873 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__7872, null);
    var i__7874 = 32;
    var out__7875 = cljs.core._as_transient.call(null, v__7873);
    while(true) {
      if(i__7874 < l__7870) {
        var G__7876 = i__7874 + 1;
        var G__7877 = cljs.core.conj_BANG_.call(null, out__7875, xs__7871[i__7874]);
        i__7874 = G__7876;
        out__7875 = G__7877;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__7875)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__7878) {
    var args = cljs.core.seq(arglist__7878);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7879 = this;
  if(this__7879.off + 1 < this__7879.node.length) {
    var s__7880 = cljs.core.chunked_seq.call(null, this__7879.vec, this__7879.node, this__7879.i, this__7879.off + 1);
    if(s__7880 == null) {
      return null
    }else {
      return s__7880
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7881 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7882 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7883 = this;
  return this__7883.node[this__7883.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7884 = this;
  if(this__7884.off + 1 < this__7884.node.length) {
    var s__7885 = cljs.core.chunked_seq.call(null, this__7884.vec, this__7884.node, this__7884.i, this__7884.off + 1);
    if(s__7885 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__7885
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7886 = this;
  var l__7887 = this__7886.node.length;
  var s__7888 = this__7886.i + l__7887 < cljs.core._count.call(null, this__7886.vec) ? cljs.core.chunked_seq.call(null, this__7886.vec, this__7886.i + l__7887, 0) : null;
  if(s__7888 == null) {
    return null
  }else {
    return s__7888
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7889 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7890 = this;
  return cljs.core.chunked_seq.call(null, this__7890.vec, this__7890.node, this__7890.i, this__7890.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__7891 = this;
  return this__7891.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7892 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__7892.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7893 = this;
  return cljs.core.array_chunk.call(null, this__7893.node, this__7893.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7894 = this;
  var l__7895 = this__7894.node.length;
  var s__7896 = this__7894.i + l__7895 < cljs.core._count.call(null, this__7894.vec) ? cljs.core.chunked_seq.call(null, this__7894.vec, this__7894.i + l__7895, 0) : null;
  if(s__7896 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__7896
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7899 = this;
  var h__2089__auto____7900 = this__7899.__hash;
  if(!(h__2089__auto____7900 == null)) {
    return h__2089__auto____7900
  }else {
    var h__2089__auto____7901 = cljs.core.hash_coll.call(null, coll);
    this__7899.__hash = h__2089__auto____7901;
    return h__2089__auto____7901
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7902 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7903 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__7904 = this;
  var v_pos__7905 = this__7904.start + key;
  return new cljs.core.Subvec(this__7904.meta, cljs.core._assoc.call(null, this__7904.v, v_pos__7905, val), this__7904.start, this__7904.end > v_pos__7905 + 1 ? this__7904.end : v_pos__7905 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__7931 = null;
  var G__7931__2 = function(this_sym7906, k) {
    var this__7908 = this;
    var this_sym7906__7909 = this;
    var coll__7910 = this_sym7906__7909;
    return coll__7910.cljs$core$ILookup$_lookup$arity$2(coll__7910, k)
  };
  var G__7931__3 = function(this_sym7907, k, not_found) {
    var this__7908 = this;
    var this_sym7907__7911 = this;
    var coll__7912 = this_sym7907__7911;
    return coll__7912.cljs$core$ILookup$_lookup$arity$3(coll__7912, k, not_found)
  };
  G__7931 = function(this_sym7907, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7931__2.call(this, this_sym7907, k);
      case 3:
        return G__7931__3.call(this, this_sym7907, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7931
}();
cljs.core.Subvec.prototype.apply = function(this_sym7897, args7898) {
  var this__7913 = this;
  return this_sym7897.call.apply(this_sym7897, [this_sym7897].concat(args7898.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7914 = this;
  return new cljs.core.Subvec(this__7914.meta, cljs.core._assoc_n.call(null, this__7914.v, this__7914.end, o), this__7914.start, this__7914.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__7915 = this;
  var this__7916 = this;
  return cljs.core.pr_str.call(null, this__7916)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7917 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7918 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7919 = this;
  var subvec_seq__7920 = function subvec_seq(i) {
    if(i === this__7919.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__7919.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__7920.call(null, this__7919.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7921 = this;
  return this__7921.end - this__7921.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7922 = this;
  return cljs.core._nth.call(null, this__7922.v, this__7922.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7923 = this;
  if(this__7923.start === this__7923.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__7923.meta, this__7923.v, this__7923.start, this__7923.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__7924 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7925 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7926 = this;
  return new cljs.core.Subvec(meta, this__7926.v, this__7926.start, this__7926.end, this__7926.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7927 = this;
  return this__7927.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7928 = this;
  return cljs.core._nth.call(null, this__7928.v, this__7928.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7929 = this;
  return cljs.core._nth.call(null, this__7929.v, this__7929.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7930 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__7930.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__7933 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__7933, 0, tl.length);
  return ret__7933
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__7937 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__7938 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__7937, subidx__7938, level === 5 ? tail_node : function() {
    var child__7939 = cljs.core.pv_aget.call(null, ret__7937, subidx__7938);
    if(!(child__7939 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__7939, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__7937
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__7944 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__7945 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__7946 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__7944, subidx__7945));
    if(function() {
      var and__3941__auto____7947 = new_child__7946 == null;
      if(and__3941__auto____7947) {
        return subidx__7945 === 0
      }else {
        return and__3941__auto____7947
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__7944, subidx__7945, new_child__7946);
      return node__7944
    }
  }else {
    if(subidx__7945 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__7944, subidx__7945, null);
        return node__7944
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto____7952 = 0 <= i;
    if(and__3941__auto____7952) {
      return i < tv.cnt
    }else {
      return and__3941__auto____7952
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__7953 = tv.root;
      var node__7954 = root__7953;
      var level__7955 = tv.shift;
      while(true) {
        if(level__7955 > 0) {
          var G__7956 = cljs.core.tv_ensure_editable.call(null, root__7953.edit, cljs.core.pv_aget.call(null, node__7954, i >>> level__7955 & 31));
          var G__7957 = level__7955 - 5;
          node__7954 = G__7956;
          level__7955 = G__7957;
          continue
        }else {
          return node__7954.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__7997 = null;
  var G__7997__2 = function(this_sym7960, k) {
    var this__7962 = this;
    var this_sym7960__7963 = this;
    var coll__7964 = this_sym7960__7963;
    return coll__7964.cljs$core$ILookup$_lookup$arity$2(coll__7964, k)
  };
  var G__7997__3 = function(this_sym7961, k, not_found) {
    var this__7962 = this;
    var this_sym7961__7965 = this;
    var coll__7966 = this_sym7961__7965;
    return coll__7966.cljs$core$ILookup$_lookup$arity$3(coll__7966, k, not_found)
  };
  G__7997 = function(this_sym7961, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7997__2.call(this, this_sym7961, k);
      case 3:
        return G__7997__3.call(this, this_sym7961, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7997
}();
cljs.core.TransientVector.prototype.apply = function(this_sym7958, args7959) {
  var this__7967 = this;
  return this_sym7958.call.apply(this_sym7958, [this_sym7958].concat(args7959.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7968 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7969 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7970 = this;
  if(this__7970.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7971 = this;
  if(function() {
    var and__3941__auto____7972 = 0 <= n;
    if(and__3941__auto____7972) {
      return n < this__7971.cnt
    }else {
      return and__3941__auto____7972
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7973 = this;
  if(this__7973.root.edit) {
    return this__7973.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__7974 = this;
  if(this__7974.root.edit) {
    if(function() {
      var and__3941__auto____7975 = 0 <= n;
      if(and__3941__auto____7975) {
        return n < this__7974.cnt
      }else {
        return and__3941__auto____7975
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__7974.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__7980 = function go(level, node) {
          var node__7978 = cljs.core.tv_ensure_editable.call(null, this__7974.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__7978, n & 31, val);
            return node__7978
          }else {
            var subidx__7979 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__7978, subidx__7979, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__7978, subidx__7979)));
            return node__7978
          }
        }.call(null, this__7974.shift, this__7974.root);
        this__7974.root = new_root__7980;
        return tcoll
      }
    }else {
      if(n === this__7974.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__7974.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__7981 = this;
  if(this__7981.root.edit) {
    if(this__7981.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__7981.cnt) {
        this__7981.cnt = 0;
        return tcoll
      }else {
        if((this__7981.cnt - 1 & 31) > 0) {
          this__7981.cnt = this__7981.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__7982 = cljs.core.editable_array_for.call(null, tcoll, this__7981.cnt - 2);
            var new_root__7984 = function() {
              var nr__7983 = cljs.core.tv_pop_tail.call(null, tcoll, this__7981.shift, this__7981.root);
              if(!(nr__7983 == null)) {
                return nr__7983
              }else {
                return new cljs.core.VectorNode(this__7981.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3941__auto____7985 = 5 < this__7981.shift;
              if(and__3941__auto____7985) {
                return cljs.core.pv_aget.call(null, new_root__7984, 1) == null
              }else {
                return and__3941__auto____7985
              }
            }()) {
              var new_root__7986 = cljs.core.tv_ensure_editable.call(null, this__7981.root.edit, cljs.core.pv_aget.call(null, new_root__7984, 0));
              this__7981.root = new_root__7986;
              this__7981.shift = this__7981.shift - 5;
              this__7981.cnt = this__7981.cnt - 1;
              this__7981.tail = new_tail__7982;
              return tcoll
            }else {
              this__7981.root = new_root__7984;
              this__7981.cnt = this__7981.cnt - 1;
              this__7981.tail = new_tail__7982;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__7987 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__7988 = this;
  if(this__7988.root.edit) {
    if(this__7988.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__7988.tail[this__7988.cnt & 31] = o;
      this__7988.cnt = this__7988.cnt + 1;
      return tcoll
    }else {
      var tail_node__7989 = new cljs.core.VectorNode(this__7988.root.edit, this__7988.tail);
      var new_tail__7990 = cljs.core.make_array.call(null, 32);
      new_tail__7990[0] = o;
      this__7988.tail = new_tail__7990;
      if(this__7988.cnt >>> 5 > 1 << this__7988.shift) {
        var new_root_array__7991 = cljs.core.make_array.call(null, 32);
        var new_shift__7992 = this__7988.shift + 5;
        new_root_array__7991[0] = this__7988.root;
        new_root_array__7991[1] = cljs.core.new_path.call(null, this__7988.root.edit, this__7988.shift, tail_node__7989);
        this__7988.root = new cljs.core.VectorNode(this__7988.root.edit, new_root_array__7991);
        this__7988.shift = new_shift__7992;
        this__7988.cnt = this__7988.cnt + 1;
        return tcoll
      }else {
        var new_root__7993 = cljs.core.tv_push_tail.call(null, tcoll, this__7988.shift, this__7988.root, tail_node__7989);
        this__7988.root = new_root__7993;
        this__7988.cnt = this__7988.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__7994 = this;
  if(this__7994.root.edit) {
    this__7994.root.edit = null;
    var len__7995 = this__7994.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__7996 = cljs.core.make_array.call(null, len__7995);
    cljs.core.array_copy.call(null, this__7994.tail, 0, trimmed_tail__7996, 0, len__7995);
    return new cljs.core.PersistentVector(null, this__7994.cnt, this__7994.shift, this__7994.root, trimmed_tail__7996, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7998 = this;
  var h__2089__auto____7999 = this__7998.__hash;
  if(!(h__2089__auto____7999 == null)) {
    return h__2089__auto____7999
  }else {
    var h__2089__auto____8000 = cljs.core.hash_coll.call(null, coll);
    this__7998.__hash = h__2089__auto____8000;
    return h__2089__auto____8000
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8001 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8002 = this;
  var this__8003 = this;
  return cljs.core.pr_str.call(null, this__8003)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8004 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8005 = this;
  return cljs.core._first.call(null, this__8005.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8006 = this;
  var temp__4090__auto____8007 = cljs.core.next.call(null, this__8006.front);
  if(temp__4090__auto____8007) {
    var f1__8008 = temp__4090__auto____8007;
    return new cljs.core.PersistentQueueSeq(this__8006.meta, f1__8008, this__8006.rear, null)
  }else {
    if(this__8006.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8006.meta, this__8006.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8009 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8010 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8010.front, this__8010.rear, this__8010.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8011 = this;
  return this__8011.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8012 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8012.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8013 = this;
  var h__2089__auto____8014 = this__8013.__hash;
  if(!(h__2089__auto____8014 == null)) {
    return h__2089__auto____8014
  }else {
    var h__2089__auto____8015 = cljs.core.hash_coll.call(null, coll);
    this__8013.__hash = h__2089__auto____8015;
    return h__2089__auto____8015
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8016 = this;
  if(cljs.core.truth_(this__8016.front)) {
    return new cljs.core.PersistentQueue(this__8016.meta, this__8016.count + 1, this__8016.front, cljs.core.conj.call(null, function() {
      var or__3943__auto____8017 = this__8016.rear;
      if(cljs.core.truth_(or__3943__auto____8017)) {
        return or__3943__auto____8017
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8016.meta, this__8016.count + 1, cljs.core.conj.call(null, this__8016.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8018 = this;
  var this__8019 = this;
  return cljs.core.pr_str.call(null, this__8019)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8020 = this;
  var rear__8021 = cljs.core.seq.call(null, this__8020.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto____8022 = this__8020.front;
    if(cljs.core.truth_(or__3943__auto____8022)) {
      return or__3943__auto____8022
    }else {
      return rear__8021
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8020.front, cljs.core.seq.call(null, rear__8021), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8023 = this;
  return this__8023.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8024 = this;
  return cljs.core._first.call(null, this__8024.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8025 = this;
  if(cljs.core.truth_(this__8025.front)) {
    var temp__4090__auto____8026 = cljs.core.next.call(null, this__8025.front);
    if(temp__4090__auto____8026) {
      var f1__8027 = temp__4090__auto____8026;
      return new cljs.core.PersistentQueue(this__8025.meta, this__8025.count - 1, f1__8027, this__8025.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8025.meta, this__8025.count - 1, cljs.core.seq.call(null, this__8025.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8028 = this;
  return cljs.core.first.call(null, this__8028.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8029 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8030 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8031 = this;
  return new cljs.core.PersistentQueue(meta, this__8031.count, this__8031.front, this__8031.rear, this__8031.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8032 = this;
  return this__8032.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8033 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8034 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8037 = array.length;
  var i__8038 = 0;
  while(true) {
    if(i__8038 < len__8037) {
      if(k === array[i__8038]) {
        return i__8038
      }else {
        var G__8039 = i__8038 + incr;
        i__8038 = G__8039;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8042 = cljs.core.hash.call(null, a);
  var b__8043 = cljs.core.hash.call(null, b);
  if(a__8042 < b__8043) {
    return-1
  }else {
    if(a__8042 > b__8043) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8051 = m.keys;
  var len__8052 = ks__8051.length;
  var so__8053 = m.strobj;
  var out__8054 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8055 = 0;
  var out__8056 = cljs.core.transient$.call(null, out__8054);
  while(true) {
    if(i__8055 < len__8052) {
      var k__8057 = ks__8051[i__8055];
      var G__8058 = i__8055 + 1;
      var G__8059 = cljs.core.assoc_BANG_.call(null, out__8056, k__8057, so__8053[k__8057]);
      i__8055 = G__8058;
      out__8056 = G__8059;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8056, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8065 = {};
  var l__8066 = ks.length;
  var i__8067 = 0;
  while(true) {
    if(i__8067 < l__8066) {
      var k__8068 = ks[i__8067];
      new_obj__8065[k__8068] = obj[k__8068];
      var G__8069 = i__8067 + 1;
      i__8067 = G__8069;
      continue
    }else {
    }
    break
  }
  return new_obj__8065
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8072 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8073 = this;
  var h__2089__auto____8074 = this__8073.__hash;
  if(!(h__2089__auto____8074 == null)) {
    return h__2089__auto____8074
  }else {
    var h__2089__auto____8075 = cljs.core.hash_imap.call(null, coll);
    this__8073.__hash = h__2089__auto____8075;
    return h__2089__auto____8075
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8076 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8077 = this;
  if(function() {
    var and__3941__auto____8078 = goog.isString(k);
    if(and__3941__auto____8078) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8077.keys) == null)
    }else {
      return and__3941__auto____8078
    }
  }()) {
    return this__8077.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8079 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto____8080 = this__8079.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto____8080) {
        return or__3943__auto____8080
      }else {
        return this__8079.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8079.keys) == null)) {
        var new_strobj__8081 = cljs.core.obj_clone.call(null, this__8079.strobj, this__8079.keys);
        new_strobj__8081[k] = v;
        return new cljs.core.ObjMap(this__8079.meta, this__8079.keys, new_strobj__8081, this__8079.update_count + 1, null)
      }else {
        var new_strobj__8082 = cljs.core.obj_clone.call(null, this__8079.strobj, this__8079.keys);
        var new_keys__8083 = this__8079.keys.slice();
        new_strobj__8082[k] = v;
        new_keys__8083.push(k);
        return new cljs.core.ObjMap(this__8079.meta, new_keys__8083, new_strobj__8082, this__8079.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8084 = this;
  if(function() {
    var and__3941__auto____8085 = goog.isString(k);
    if(and__3941__auto____8085) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8084.keys) == null)
    }else {
      return and__3941__auto____8085
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8107 = null;
  var G__8107__2 = function(this_sym8086, k) {
    var this__8088 = this;
    var this_sym8086__8089 = this;
    var coll__8090 = this_sym8086__8089;
    return coll__8090.cljs$core$ILookup$_lookup$arity$2(coll__8090, k)
  };
  var G__8107__3 = function(this_sym8087, k, not_found) {
    var this__8088 = this;
    var this_sym8087__8091 = this;
    var coll__8092 = this_sym8087__8091;
    return coll__8092.cljs$core$ILookup$_lookup$arity$3(coll__8092, k, not_found)
  };
  G__8107 = function(this_sym8087, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8107__2.call(this, this_sym8087, k);
      case 3:
        return G__8107__3.call(this, this_sym8087, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8107
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8070, args8071) {
  var this__8093 = this;
  return this_sym8070.call.apply(this_sym8070, [this_sym8070].concat(args8071.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8094 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8095 = this;
  var this__8096 = this;
  return cljs.core.pr_str.call(null, this__8096)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8097 = this;
  if(this__8097.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8060_SHARP_) {
      return cljs.core.vector.call(null, p1__8060_SHARP_, this__8097.strobj[p1__8060_SHARP_])
    }, this__8097.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8098 = this;
  return this__8098.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8099 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8100 = this;
  return new cljs.core.ObjMap(meta, this__8100.keys, this__8100.strobj, this__8100.update_count, this__8100.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8101 = this;
  return this__8101.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8102 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8102.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8103 = this;
  if(function() {
    var and__3941__auto____8104 = goog.isString(k);
    if(and__3941__auto____8104) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8103.keys) == null)
    }else {
      return and__3941__auto____8104
    }
  }()) {
    var new_keys__8105 = this__8103.keys.slice();
    var new_strobj__8106 = cljs.core.obj_clone.call(null, this__8103.strobj, this__8103.keys);
    new_keys__8105.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8105), 1);
    cljs.core.js_delete.call(null, new_strobj__8106, k);
    return new cljs.core.ObjMap(this__8103.meta, new_keys__8105, new_strobj__8106, this__8103.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8111 = this;
  var h__2089__auto____8112 = this__8111.__hash;
  if(!(h__2089__auto____8112 == null)) {
    return h__2089__auto____8112
  }else {
    var h__2089__auto____8113 = cljs.core.hash_imap.call(null, coll);
    this__8111.__hash = h__2089__auto____8113;
    return h__2089__auto____8113
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8114 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8115 = this;
  var bucket__8116 = this__8115.hashobj[cljs.core.hash.call(null, k)];
  var i__8117 = cljs.core.truth_(bucket__8116) ? cljs.core.scan_array.call(null, 2, k, bucket__8116) : null;
  if(cljs.core.truth_(i__8117)) {
    return bucket__8116[i__8117 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8118 = this;
  var h__8119 = cljs.core.hash.call(null, k);
  var bucket__8120 = this__8118.hashobj[h__8119];
  if(cljs.core.truth_(bucket__8120)) {
    var new_bucket__8121 = bucket__8120.slice();
    var new_hashobj__8122 = goog.object.clone(this__8118.hashobj);
    new_hashobj__8122[h__8119] = new_bucket__8121;
    var temp__4090__auto____8123 = cljs.core.scan_array.call(null, 2, k, new_bucket__8121);
    if(cljs.core.truth_(temp__4090__auto____8123)) {
      var i__8124 = temp__4090__auto____8123;
      new_bucket__8121[i__8124 + 1] = v;
      return new cljs.core.HashMap(this__8118.meta, this__8118.count, new_hashobj__8122, null)
    }else {
      new_bucket__8121.push(k, v);
      return new cljs.core.HashMap(this__8118.meta, this__8118.count + 1, new_hashobj__8122, null)
    }
  }else {
    var new_hashobj__8125 = goog.object.clone(this__8118.hashobj);
    new_hashobj__8125[h__8119] = [k, v];
    return new cljs.core.HashMap(this__8118.meta, this__8118.count + 1, new_hashobj__8125, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8126 = this;
  var bucket__8127 = this__8126.hashobj[cljs.core.hash.call(null, k)];
  var i__8128 = cljs.core.truth_(bucket__8127) ? cljs.core.scan_array.call(null, 2, k, bucket__8127) : null;
  if(cljs.core.truth_(i__8128)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8153 = null;
  var G__8153__2 = function(this_sym8129, k) {
    var this__8131 = this;
    var this_sym8129__8132 = this;
    var coll__8133 = this_sym8129__8132;
    return coll__8133.cljs$core$ILookup$_lookup$arity$2(coll__8133, k)
  };
  var G__8153__3 = function(this_sym8130, k, not_found) {
    var this__8131 = this;
    var this_sym8130__8134 = this;
    var coll__8135 = this_sym8130__8134;
    return coll__8135.cljs$core$ILookup$_lookup$arity$3(coll__8135, k, not_found)
  };
  G__8153 = function(this_sym8130, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8153__2.call(this, this_sym8130, k);
      case 3:
        return G__8153__3.call(this, this_sym8130, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8153
}();
cljs.core.HashMap.prototype.apply = function(this_sym8109, args8110) {
  var this__8136 = this;
  return this_sym8109.call.apply(this_sym8109, [this_sym8109].concat(args8110.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8137 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8138 = this;
  var this__8139 = this;
  return cljs.core.pr_str.call(null, this__8139)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8140 = this;
  if(this__8140.count > 0) {
    var hashes__8141 = cljs.core.js_keys.call(null, this__8140.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8108_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8140.hashobj[p1__8108_SHARP_]))
    }, hashes__8141)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8142 = this;
  return this__8142.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8143 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8144 = this;
  return new cljs.core.HashMap(meta, this__8144.count, this__8144.hashobj, this__8144.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8145 = this;
  return this__8145.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8146 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8146.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8147 = this;
  var h__8148 = cljs.core.hash.call(null, k);
  var bucket__8149 = this__8147.hashobj[h__8148];
  var i__8150 = cljs.core.truth_(bucket__8149) ? cljs.core.scan_array.call(null, 2, k, bucket__8149) : null;
  if(cljs.core.not.call(null, i__8150)) {
    return coll
  }else {
    var new_hashobj__8151 = goog.object.clone(this__8147.hashobj);
    if(3 > bucket__8149.length) {
      cljs.core.js_delete.call(null, new_hashobj__8151, h__8148)
    }else {
      var new_bucket__8152 = bucket__8149.slice();
      new_bucket__8152.splice(i__8150, 2);
      new_hashobj__8151[h__8148] = new_bucket__8152
    }
    return new cljs.core.HashMap(this__8147.meta, this__8147.count - 1, new_hashobj__8151, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8154 = ks.length;
  var i__8155 = 0;
  var out__8156 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8155 < len__8154) {
      var G__8157 = i__8155 + 1;
      var G__8158 = cljs.core.assoc.call(null, out__8156, ks[i__8155], vs[i__8155]);
      i__8155 = G__8157;
      out__8156 = G__8158;
      continue
    }else {
      return out__8156
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8162 = m.arr;
  var len__8163 = arr__8162.length;
  var i__8164 = 0;
  while(true) {
    if(len__8163 <= i__8164) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8162[i__8164], k)) {
        return i__8164
      }else {
        if("\ufdd0'else") {
          var G__8165 = i__8164 + 2;
          i__8164 = G__8165;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8168 = this;
  return new cljs.core.TransientArrayMap({}, this__8168.arr.length, this__8168.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8169 = this;
  var h__2089__auto____8170 = this__8169.__hash;
  if(!(h__2089__auto____8170 == null)) {
    return h__2089__auto____8170
  }else {
    var h__2089__auto____8171 = cljs.core.hash_imap.call(null, coll);
    this__8169.__hash = h__2089__auto____8171;
    return h__2089__auto____8171
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8172 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8173 = this;
  var idx__8174 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8174 === -1) {
    return not_found
  }else {
    return this__8173.arr[idx__8174 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8175 = this;
  var idx__8176 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8176 === -1) {
    if(this__8175.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8175.meta, this__8175.cnt + 1, function() {
        var G__8177__8178 = this__8175.arr.slice();
        G__8177__8178.push(k);
        G__8177__8178.push(v);
        return G__8177__8178
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8175.arr[idx__8176 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8175.meta, this__8175.cnt, function() {
          var G__8179__8180 = this__8175.arr.slice();
          G__8179__8180[idx__8176 + 1] = v;
          return G__8179__8180
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8181 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8213 = null;
  var G__8213__2 = function(this_sym8182, k) {
    var this__8184 = this;
    var this_sym8182__8185 = this;
    var coll__8186 = this_sym8182__8185;
    return coll__8186.cljs$core$ILookup$_lookup$arity$2(coll__8186, k)
  };
  var G__8213__3 = function(this_sym8183, k, not_found) {
    var this__8184 = this;
    var this_sym8183__8187 = this;
    var coll__8188 = this_sym8183__8187;
    return coll__8188.cljs$core$ILookup$_lookup$arity$3(coll__8188, k, not_found)
  };
  G__8213 = function(this_sym8183, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8213__2.call(this, this_sym8183, k);
      case 3:
        return G__8213__3.call(this, this_sym8183, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8213
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8166, args8167) {
  var this__8189 = this;
  return this_sym8166.call.apply(this_sym8166, [this_sym8166].concat(args8167.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8190 = this;
  var len__8191 = this__8190.arr.length;
  var i__8192 = 0;
  var init__8193 = init;
  while(true) {
    if(i__8192 < len__8191) {
      var init__8194 = f.call(null, init__8193, this__8190.arr[i__8192], this__8190.arr[i__8192 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8194)) {
        return cljs.core.deref.call(null, init__8194)
      }else {
        var G__8214 = i__8192 + 2;
        var G__8215 = init__8194;
        i__8192 = G__8214;
        init__8193 = G__8215;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8195 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8196 = this;
  var this__8197 = this;
  return cljs.core.pr_str.call(null, this__8197)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8198 = this;
  if(this__8198.cnt > 0) {
    var len__8199 = this__8198.arr.length;
    var array_map_seq__8200 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8199) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8198.arr[i], this__8198.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8200.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8201 = this;
  return this__8201.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8202 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8203 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8203.cnt, this__8203.arr, this__8203.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8204 = this;
  return this__8204.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8205 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8205.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8206 = this;
  var idx__8207 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8207 >= 0) {
    var len__8208 = this__8206.arr.length;
    var new_len__8209 = len__8208 - 2;
    if(new_len__8209 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8210 = cljs.core.make_array.call(null, new_len__8209);
      var s__8211 = 0;
      var d__8212 = 0;
      while(true) {
        if(s__8211 >= len__8208) {
          return new cljs.core.PersistentArrayMap(this__8206.meta, this__8206.cnt - 1, new_arr__8210, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8206.arr[s__8211])) {
            var G__8216 = s__8211 + 2;
            var G__8217 = d__8212;
            s__8211 = G__8216;
            d__8212 = G__8217;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8210[d__8212] = this__8206.arr[s__8211];
              new_arr__8210[d__8212 + 1] = this__8206.arr[s__8211 + 1];
              var G__8218 = s__8211 + 2;
              var G__8219 = d__8212 + 2;
              s__8211 = G__8218;
              d__8212 = G__8219;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8220 = cljs.core.count.call(null, ks);
  var i__8221 = 0;
  var out__8222 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8221 < len__8220) {
      var G__8223 = i__8221 + 1;
      var G__8224 = cljs.core.assoc_BANG_.call(null, out__8222, ks[i__8221], vs[i__8221]);
      i__8221 = G__8223;
      out__8222 = G__8224;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8222)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8225 = this;
  if(cljs.core.truth_(this__8225.editable_QMARK_)) {
    var idx__8226 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8226 >= 0) {
      this__8225.arr[idx__8226] = this__8225.arr[this__8225.len - 2];
      this__8225.arr[idx__8226 + 1] = this__8225.arr[this__8225.len - 1];
      var G__8227__8228 = this__8225.arr;
      G__8227__8228.pop();
      G__8227__8228.pop();
      G__8227__8228;
      this__8225.len = this__8225.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8229 = this;
  if(cljs.core.truth_(this__8229.editable_QMARK_)) {
    var idx__8230 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8230 === -1) {
      if(this__8229.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8229.len = this__8229.len + 2;
        this__8229.arr.push(key);
        this__8229.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8229.len, this__8229.arr), key, val)
      }
    }else {
      if(val === this__8229.arr[idx__8230 + 1]) {
        return tcoll
      }else {
        this__8229.arr[idx__8230 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8231 = this;
  if(cljs.core.truth_(this__8231.editable_QMARK_)) {
    if(function() {
      var G__8232__8233 = o;
      if(G__8232__8233) {
        if(function() {
          var or__3943__auto____8234 = G__8232__8233.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____8234) {
            return or__3943__auto____8234
          }else {
            return G__8232__8233.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8232__8233.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8232__8233)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8232__8233)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8235 = cljs.core.seq.call(null, o);
      var tcoll__8236 = tcoll;
      while(true) {
        var temp__4090__auto____8237 = cljs.core.first.call(null, es__8235);
        if(cljs.core.truth_(temp__4090__auto____8237)) {
          var e__8238 = temp__4090__auto____8237;
          var G__8244 = cljs.core.next.call(null, es__8235);
          var G__8245 = tcoll__8236.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8236, cljs.core.key.call(null, e__8238), cljs.core.val.call(null, e__8238));
          es__8235 = G__8244;
          tcoll__8236 = G__8245;
          continue
        }else {
          return tcoll__8236
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8239 = this;
  if(cljs.core.truth_(this__8239.editable_QMARK_)) {
    this__8239.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8239.len, 2), this__8239.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8240 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8241 = this;
  if(cljs.core.truth_(this__8241.editable_QMARK_)) {
    var idx__8242 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8242 === -1) {
      return not_found
    }else {
      return this__8241.arr[idx__8242 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8243 = this;
  if(cljs.core.truth_(this__8243.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8243.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8248 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8249 = 0;
  while(true) {
    if(i__8249 < len) {
      var G__8250 = cljs.core.assoc_BANG_.call(null, out__8248, arr[i__8249], arr[i__8249 + 1]);
      var G__8251 = i__8249 + 2;
      out__8248 = G__8250;
      i__8249 = G__8251;
      continue
    }else {
      return out__8248
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2207__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8256__8257 = arr.slice();
    G__8256__8257[i] = a;
    return G__8256__8257
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8258__8259 = arr.slice();
    G__8258__8259[i] = a;
    G__8258__8259[j] = b;
    return G__8258__8259
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8261 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8261, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8261, 2 * i, new_arr__8261.length - 2 * i);
  return new_arr__8261
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8264 = inode.ensure_editable(edit);
    editable__8264.arr[i] = a;
    return editable__8264
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8265 = inode.ensure_editable(edit);
    editable__8265.arr[i] = a;
    editable__8265.arr[j] = b;
    return editable__8265
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8272 = arr.length;
  var i__8273 = 0;
  var init__8274 = init;
  while(true) {
    if(i__8273 < len__8272) {
      var init__8277 = function() {
        var k__8275 = arr[i__8273];
        if(!(k__8275 == null)) {
          return f.call(null, init__8274, k__8275, arr[i__8273 + 1])
        }else {
          var node__8276 = arr[i__8273 + 1];
          if(!(node__8276 == null)) {
            return node__8276.kv_reduce(f, init__8274)
          }else {
            return init__8274
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8277)) {
        return cljs.core.deref.call(null, init__8277)
      }else {
        var G__8278 = i__8273 + 2;
        var G__8279 = init__8277;
        i__8273 = G__8278;
        init__8274 = G__8279;
        continue
      }
    }else {
      return init__8274
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8280 = this;
  var inode__8281 = this;
  if(this__8280.bitmap === bit) {
    return null
  }else {
    var editable__8282 = inode__8281.ensure_editable(e);
    var earr__8283 = editable__8282.arr;
    var len__8284 = earr__8283.length;
    editable__8282.bitmap = bit ^ editable__8282.bitmap;
    cljs.core.array_copy.call(null, earr__8283, 2 * (i + 1), earr__8283, 2 * i, len__8284 - 2 * (i + 1));
    earr__8283[len__8284 - 2] = null;
    earr__8283[len__8284 - 1] = null;
    return editable__8282
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8285 = this;
  var inode__8286 = this;
  var bit__8287 = 1 << (hash >>> shift & 31);
  var idx__8288 = cljs.core.bitmap_indexed_node_index.call(null, this__8285.bitmap, bit__8287);
  if((this__8285.bitmap & bit__8287) === 0) {
    var n__8289 = cljs.core.bit_count.call(null, this__8285.bitmap);
    if(2 * n__8289 < this__8285.arr.length) {
      var editable__8290 = inode__8286.ensure_editable(edit);
      var earr__8291 = editable__8290.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8291, 2 * idx__8288, earr__8291, 2 * (idx__8288 + 1), 2 * (n__8289 - idx__8288));
      earr__8291[2 * idx__8288] = key;
      earr__8291[2 * idx__8288 + 1] = val;
      editable__8290.bitmap = editable__8290.bitmap | bit__8287;
      return editable__8290
    }else {
      if(n__8289 >= 16) {
        var nodes__8292 = cljs.core.make_array.call(null, 32);
        var jdx__8293 = hash >>> shift & 31;
        nodes__8292[jdx__8293] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8294 = 0;
        var j__8295 = 0;
        while(true) {
          if(i__8294 < 32) {
            if((this__8285.bitmap >>> i__8294 & 1) === 0) {
              var G__8348 = i__8294 + 1;
              var G__8349 = j__8295;
              i__8294 = G__8348;
              j__8295 = G__8349;
              continue
            }else {
              nodes__8292[i__8294] = !(this__8285.arr[j__8295] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8285.arr[j__8295]), this__8285.arr[j__8295], this__8285.arr[j__8295 + 1], added_leaf_QMARK_) : this__8285.arr[j__8295 + 1];
              var G__8350 = i__8294 + 1;
              var G__8351 = j__8295 + 2;
              i__8294 = G__8350;
              j__8295 = G__8351;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8289 + 1, nodes__8292)
      }else {
        if("\ufdd0'else") {
          var new_arr__8296 = cljs.core.make_array.call(null, 2 * (n__8289 + 4));
          cljs.core.array_copy.call(null, this__8285.arr, 0, new_arr__8296, 0, 2 * idx__8288);
          new_arr__8296[2 * idx__8288] = key;
          new_arr__8296[2 * idx__8288 + 1] = val;
          cljs.core.array_copy.call(null, this__8285.arr, 2 * idx__8288, new_arr__8296, 2 * (idx__8288 + 1), 2 * (n__8289 - idx__8288));
          added_leaf_QMARK_.val = true;
          var editable__8297 = inode__8286.ensure_editable(edit);
          editable__8297.arr = new_arr__8296;
          editable__8297.bitmap = editable__8297.bitmap | bit__8287;
          return editable__8297
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8298 = this__8285.arr[2 * idx__8288];
    var val_or_node__8299 = this__8285.arr[2 * idx__8288 + 1];
    if(key_or_nil__8298 == null) {
      var n__8300 = val_or_node__8299.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8300 === val_or_node__8299) {
        return inode__8286
      }else {
        return cljs.core.edit_and_set.call(null, inode__8286, edit, 2 * idx__8288 + 1, n__8300)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8298)) {
        if(val === val_or_node__8299) {
          return inode__8286
        }else {
          return cljs.core.edit_and_set.call(null, inode__8286, edit, 2 * idx__8288 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8286, edit, 2 * idx__8288, null, 2 * idx__8288 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8298, val_or_node__8299, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8301 = this;
  var inode__8302 = this;
  return cljs.core.create_inode_seq.call(null, this__8301.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8303 = this;
  var inode__8304 = this;
  var bit__8305 = 1 << (hash >>> shift & 31);
  if((this__8303.bitmap & bit__8305) === 0) {
    return inode__8304
  }else {
    var idx__8306 = cljs.core.bitmap_indexed_node_index.call(null, this__8303.bitmap, bit__8305);
    var key_or_nil__8307 = this__8303.arr[2 * idx__8306];
    var val_or_node__8308 = this__8303.arr[2 * idx__8306 + 1];
    if(key_or_nil__8307 == null) {
      var n__8309 = val_or_node__8308.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8309 === val_or_node__8308) {
        return inode__8304
      }else {
        if(!(n__8309 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8304, edit, 2 * idx__8306 + 1, n__8309)
        }else {
          if(this__8303.bitmap === bit__8305) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8304.edit_and_remove_pair(edit, bit__8305, idx__8306)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8307)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8304.edit_and_remove_pair(edit, bit__8305, idx__8306)
      }else {
        if("\ufdd0'else") {
          return inode__8304
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8310 = this;
  var inode__8311 = this;
  if(e === this__8310.edit) {
    return inode__8311
  }else {
    var n__8312 = cljs.core.bit_count.call(null, this__8310.bitmap);
    var new_arr__8313 = cljs.core.make_array.call(null, n__8312 < 0 ? 4 : 2 * (n__8312 + 1));
    cljs.core.array_copy.call(null, this__8310.arr, 0, new_arr__8313, 0, 2 * n__8312);
    return new cljs.core.BitmapIndexedNode(e, this__8310.bitmap, new_arr__8313)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8314 = this;
  var inode__8315 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8314.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8316 = this;
  var inode__8317 = this;
  var bit__8318 = 1 << (hash >>> shift & 31);
  if((this__8316.bitmap & bit__8318) === 0) {
    return not_found
  }else {
    var idx__8319 = cljs.core.bitmap_indexed_node_index.call(null, this__8316.bitmap, bit__8318);
    var key_or_nil__8320 = this__8316.arr[2 * idx__8319];
    var val_or_node__8321 = this__8316.arr[2 * idx__8319 + 1];
    if(key_or_nil__8320 == null) {
      return val_or_node__8321.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8320)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8320, val_or_node__8321], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8322 = this;
  var inode__8323 = this;
  var bit__8324 = 1 << (hash >>> shift & 31);
  if((this__8322.bitmap & bit__8324) === 0) {
    return inode__8323
  }else {
    var idx__8325 = cljs.core.bitmap_indexed_node_index.call(null, this__8322.bitmap, bit__8324);
    var key_or_nil__8326 = this__8322.arr[2 * idx__8325];
    var val_or_node__8327 = this__8322.arr[2 * idx__8325 + 1];
    if(key_or_nil__8326 == null) {
      var n__8328 = val_or_node__8327.inode_without(shift + 5, hash, key);
      if(n__8328 === val_or_node__8327) {
        return inode__8323
      }else {
        if(!(n__8328 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8322.bitmap, cljs.core.clone_and_set.call(null, this__8322.arr, 2 * idx__8325 + 1, n__8328))
        }else {
          if(this__8322.bitmap === bit__8324) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8322.bitmap ^ bit__8324, cljs.core.remove_pair.call(null, this__8322.arr, idx__8325))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8326)) {
        return new cljs.core.BitmapIndexedNode(null, this__8322.bitmap ^ bit__8324, cljs.core.remove_pair.call(null, this__8322.arr, idx__8325))
      }else {
        if("\ufdd0'else") {
          return inode__8323
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8329 = this;
  var inode__8330 = this;
  var bit__8331 = 1 << (hash >>> shift & 31);
  var idx__8332 = cljs.core.bitmap_indexed_node_index.call(null, this__8329.bitmap, bit__8331);
  if((this__8329.bitmap & bit__8331) === 0) {
    var n__8333 = cljs.core.bit_count.call(null, this__8329.bitmap);
    if(n__8333 >= 16) {
      var nodes__8334 = cljs.core.make_array.call(null, 32);
      var jdx__8335 = hash >>> shift & 31;
      nodes__8334[jdx__8335] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8336 = 0;
      var j__8337 = 0;
      while(true) {
        if(i__8336 < 32) {
          if((this__8329.bitmap >>> i__8336 & 1) === 0) {
            var G__8352 = i__8336 + 1;
            var G__8353 = j__8337;
            i__8336 = G__8352;
            j__8337 = G__8353;
            continue
          }else {
            nodes__8334[i__8336] = !(this__8329.arr[j__8337] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8329.arr[j__8337]), this__8329.arr[j__8337], this__8329.arr[j__8337 + 1], added_leaf_QMARK_) : this__8329.arr[j__8337 + 1];
            var G__8354 = i__8336 + 1;
            var G__8355 = j__8337 + 2;
            i__8336 = G__8354;
            j__8337 = G__8355;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8333 + 1, nodes__8334)
    }else {
      var new_arr__8338 = cljs.core.make_array.call(null, 2 * (n__8333 + 1));
      cljs.core.array_copy.call(null, this__8329.arr, 0, new_arr__8338, 0, 2 * idx__8332);
      new_arr__8338[2 * idx__8332] = key;
      new_arr__8338[2 * idx__8332 + 1] = val;
      cljs.core.array_copy.call(null, this__8329.arr, 2 * idx__8332, new_arr__8338, 2 * (idx__8332 + 1), 2 * (n__8333 - idx__8332));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8329.bitmap | bit__8331, new_arr__8338)
    }
  }else {
    var key_or_nil__8339 = this__8329.arr[2 * idx__8332];
    var val_or_node__8340 = this__8329.arr[2 * idx__8332 + 1];
    if(key_or_nil__8339 == null) {
      var n__8341 = val_or_node__8340.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8341 === val_or_node__8340) {
        return inode__8330
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8329.bitmap, cljs.core.clone_and_set.call(null, this__8329.arr, 2 * idx__8332 + 1, n__8341))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8339)) {
        if(val === val_or_node__8340) {
          return inode__8330
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8329.bitmap, cljs.core.clone_and_set.call(null, this__8329.arr, 2 * idx__8332 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8329.bitmap, cljs.core.clone_and_set.call(null, this__8329.arr, 2 * idx__8332, null, 2 * idx__8332 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8339, val_or_node__8340, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8342 = this;
  var inode__8343 = this;
  var bit__8344 = 1 << (hash >>> shift & 31);
  if((this__8342.bitmap & bit__8344) === 0) {
    return not_found
  }else {
    var idx__8345 = cljs.core.bitmap_indexed_node_index.call(null, this__8342.bitmap, bit__8344);
    var key_or_nil__8346 = this__8342.arr[2 * idx__8345];
    var val_or_node__8347 = this__8342.arr[2 * idx__8345 + 1];
    if(key_or_nil__8346 == null) {
      return val_or_node__8347.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8346)) {
        return val_or_node__8347
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8363 = array_node.arr;
  var len__8364 = 2 * (array_node.cnt - 1);
  var new_arr__8365 = cljs.core.make_array.call(null, len__8364);
  var i__8366 = 0;
  var j__8367 = 1;
  var bitmap__8368 = 0;
  while(true) {
    if(i__8366 < len__8364) {
      if(function() {
        var and__3941__auto____8369 = !(i__8366 === idx);
        if(and__3941__auto____8369) {
          return!(arr__8363[i__8366] == null)
        }else {
          return and__3941__auto____8369
        }
      }()) {
        new_arr__8365[j__8367] = arr__8363[i__8366];
        var G__8370 = i__8366 + 1;
        var G__8371 = j__8367 + 2;
        var G__8372 = bitmap__8368 | 1 << i__8366;
        i__8366 = G__8370;
        j__8367 = G__8371;
        bitmap__8368 = G__8372;
        continue
      }else {
        var G__8373 = i__8366 + 1;
        var G__8374 = j__8367;
        var G__8375 = bitmap__8368;
        i__8366 = G__8373;
        j__8367 = G__8374;
        bitmap__8368 = G__8375;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8368, new_arr__8365)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8376 = this;
  var inode__8377 = this;
  var idx__8378 = hash >>> shift & 31;
  var node__8379 = this__8376.arr[idx__8378];
  if(node__8379 == null) {
    var editable__8380 = cljs.core.edit_and_set.call(null, inode__8377, edit, idx__8378, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8380.cnt = editable__8380.cnt + 1;
    return editable__8380
  }else {
    var n__8381 = node__8379.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8381 === node__8379) {
      return inode__8377
    }else {
      return cljs.core.edit_and_set.call(null, inode__8377, edit, idx__8378, n__8381)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8382 = this;
  var inode__8383 = this;
  return cljs.core.create_array_node_seq.call(null, this__8382.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8384 = this;
  var inode__8385 = this;
  var idx__8386 = hash >>> shift & 31;
  var node__8387 = this__8384.arr[idx__8386];
  if(node__8387 == null) {
    return inode__8385
  }else {
    var n__8388 = node__8387.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8388 === node__8387) {
      return inode__8385
    }else {
      if(n__8388 == null) {
        if(this__8384.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8385, edit, idx__8386)
        }else {
          var editable__8389 = cljs.core.edit_and_set.call(null, inode__8385, edit, idx__8386, n__8388);
          editable__8389.cnt = editable__8389.cnt - 1;
          return editable__8389
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8385, edit, idx__8386, n__8388)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8390 = this;
  var inode__8391 = this;
  if(e === this__8390.edit) {
    return inode__8391
  }else {
    return new cljs.core.ArrayNode(e, this__8390.cnt, this__8390.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8392 = this;
  var inode__8393 = this;
  var len__8394 = this__8392.arr.length;
  var i__8395 = 0;
  var init__8396 = init;
  while(true) {
    if(i__8395 < len__8394) {
      var node__8397 = this__8392.arr[i__8395];
      if(!(node__8397 == null)) {
        var init__8398 = node__8397.kv_reduce(f, init__8396);
        if(cljs.core.reduced_QMARK_.call(null, init__8398)) {
          return cljs.core.deref.call(null, init__8398)
        }else {
          var G__8417 = i__8395 + 1;
          var G__8418 = init__8398;
          i__8395 = G__8417;
          init__8396 = G__8418;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8396
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8399 = this;
  var inode__8400 = this;
  var idx__8401 = hash >>> shift & 31;
  var node__8402 = this__8399.arr[idx__8401];
  if(!(node__8402 == null)) {
    return node__8402.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8403 = this;
  var inode__8404 = this;
  var idx__8405 = hash >>> shift & 31;
  var node__8406 = this__8403.arr[idx__8405];
  if(!(node__8406 == null)) {
    var n__8407 = node__8406.inode_without(shift + 5, hash, key);
    if(n__8407 === node__8406) {
      return inode__8404
    }else {
      if(n__8407 == null) {
        if(this__8403.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8404, null, idx__8405)
        }else {
          return new cljs.core.ArrayNode(null, this__8403.cnt - 1, cljs.core.clone_and_set.call(null, this__8403.arr, idx__8405, n__8407))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8403.cnt, cljs.core.clone_and_set.call(null, this__8403.arr, idx__8405, n__8407))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8404
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8408 = this;
  var inode__8409 = this;
  var idx__8410 = hash >>> shift & 31;
  var node__8411 = this__8408.arr[idx__8410];
  if(node__8411 == null) {
    return new cljs.core.ArrayNode(null, this__8408.cnt + 1, cljs.core.clone_and_set.call(null, this__8408.arr, idx__8410, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8412 = node__8411.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8412 === node__8411) {
      return inode__8409
    }else {
      return new cljs.core.ArrayNode(null, this__8408.cnt, cljs.core.clone_and_set.call(null, this__8408.arr, idx__8410, n__8412))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8413 = this;
  var inode__8414 = this;
  var idx__8415 = hash >>> shift & 31;
  var node__8416 = this__8413.arr[idx__8415];
  if(!(node__8416 == null)) {
    return node__8416.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8421 = 2 * cnt;
  var i__8422 = 0;
  while(true) {
    if(i__8422 < lim__8421) {
      if(cljs.core.key_test.call(null, key, arr[i__8422])) {
        return i__8422
      }else {
        var G__8423 = i__8422 + 2;
        i__8422 = G__8423;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8424 = this;
  var inode__8425 = this;
  if(hash === this__8424.collision_hash) {
    var idx__8426 = cljs.core.hash_collision_node_find_index.call(null, this__8424.arr, this__8424.cnt, key);
    if(idx__8426 === -1) {
      if(this__8424.arr.length > 2 * this__8424.cnt) {
        var editable__8427 = cljs.core.edit_and_set.call(null, inode__8425, edit, 2 * this__8424.cnt, key, 2 * this__8424.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8427.cnt = editable__8427.cnt + 1;
        return editable__8427
      }else {
        var len__8428 = this__8424.arr.length;
        var new_arr__8429 = cljs.core.make_array.call(null, len__8428 + 2);
        cljs.core.array_copy.call(null, this__8424.arr, 0, new_arr__8429, 0, len__8428);
        new_arr__8429[len__8428] = key;
        new_arr__8429[len__8428 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8425.ensure_editable_array(edit, this__8424.cnt + 1, new_arr__8429)
      }
    }else {
      if(this__8424.arr[idx__8426 + 1] === val) {
        return inode__8425
      }else {
        return cljs.core.edit_and_set.call(null, inode__8425, edit, idx__8426 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8424.collision_hash >>> shift & 31), [null, inode__8425, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8430 = this;
  var inode__8431 = this;
  return cljs.core.create_inode_seq.call(null, this__8430.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8432 = this;
  var inode__8433 = this;
  var idx__8434 = cljs.core.hash_collision_node_find_index.call(null, this__8432.arr, this__8432.cnt, key);
  if(idx__8434 === -1) {
    return inode__8433
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8432.cnt === 1) {
      return null
    }else {
      var editable__8435 = inode__8433.ensure_editable(edit);
      var earr__8436 = editable__8435.arr;
      earr__8436[idx__8434] = earr__8436[2 * this__8432.cnt - 2];
      earr__8436[idx__8434 + 1] = earr__8436[2 * this__8432.cnt - 1];
      earr__8436[2 * this__8432.cnt - 1] = null;
      earr__8436[2 * this__8432.cnt - 2] = null;
      editable__8435.cnt = editable__8435.cnt - 1;
      return editable__8435
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8437 = this;
  var inode__8438 = this;
  if(e === this__8437.edit) {
    return inode__8438
  }else {
    var new_arr__8439 = cljs.core.make_array.call(null, 2 * (this__8437.cnt + 1));
    cljs.core.array_copy.call(null, this__8437.arr, 0, new_arr__8439, 0, 2 * this__8437.cnt);
    return new cljs.core.HashCollisionNode(e, this__8437.collision_hash, this__8437.cnt, new_arr__8439)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8440 = this;
  var inode__8441 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8440.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8442 = this;
  var inode__8443 = this;
  var idx__8444 = cljs.core.hash_collision_node_find_index.call(null, this__8442.arr, this__8442.cnt, key);
  if(idx__8444 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8442.arr[idx__8444])) {
      return cljs.core.PersistentVector.fromArray([this__8442.arr[idx__8444], this__8442.arr[idx__8444 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8445 = this;
  var inode__8446 = this;
  var idx__8447 = cljs.core.hash_collision_node_find_index.call(null, this__8445.arr, this__8445.cnt, key);
  if(idx__8447 === -1) {
    return inode__8446
  }else {
    if(this__8445.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8445.collision_hash, this__8445.cnt - 1, cljs.core.remove_pair.call(null, this__8445.arr, cljs.core.quot.call(null, idx__8447, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8448 = this;
  var inode__8449 = this;
  if(hash === this__8448.collision_hash) {
    var idx__8450 = cljs.core.hash_collision_node_find_index.call(null, this__8448.arr, this__8448.cnt, key);
    if(idx__8450 === -1) {
      var len__8451 = this__8448.arr.length;
      var new_arr__8452 = cljs.core.make_array.call(null, len__8451 + 2);
      cljs.core.array_copy.call(null, this__8448.arr, 0, new_arr__8452, 0, len__8451);
      new_arr__8452[len__8451] = key;
      new_arr__8452[len__8451 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8448.collision_hash, this__8448.cnt + 1, new_arr__8452)
    }else {
      if(cljs.core._EQ_.call(null, this__8448.arr[idx__8450], val)) {
        return inode__8449
      }else {
        return new cljs.core.HashCollisionNode(null, this__8448.collision_hash, this__8448.cnt, cljs.core.clone_and_set.call(null, this__8448.arr, idx__8450 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8448.collision_hash >>> shift & 31), [null, inode__8449])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8453 = this;
  var inode__8454 = this;
  var idx__8455 = cljs.core.hash_collision_node_find_index.call(null, this__8453.arr, this__8453.cnt, key);
  if(idx__8455 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8453.arr[idx__8455])) {
      return this__8453.arr[idx__8455 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8456 = this;
  var inode__8457 = this;
  if(e === this__8456.edit) {
    this__8456.arr = array;
    this__8456.cnt = count;
    return inode__8457
  }else {
    return new cljs.core.HashCollisionNode(this__8456.edit, this__8456.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8462 = cljs.core.hash.call(null, key1);
    if(key1hash__8462 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8462, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8463 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8462, key1, val1, added_leaf_QMARK___8463).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8463)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8464 = cljs.core.hash.call(null, key1);
    if(key1hash__8464 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8464, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8465 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8464, key1, val1, added_leaf_QMARK___8465).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8465)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8466 = this;
  var h__2089__auto____8467 = this__8466.__hash;
  if(!(h__2089__auto____8467 == null)) {
    return h__2089__auto____8467
  }else {
    var h__2089__auto____8468 = cljs.core.hash_coll.call(null, coll);
    this__8466.__hash = h__2089__auto____8468;
    return h__2089__auto____8468
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8469 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8470 = this;
  var this__8471 = this;
  return cljs.core.pr_str.call(null, this__8471)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8472 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8473 = this;
  if(this__8473.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8473.nodes[this__8473.i], this__8473.nodes[this__8473.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8473.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8474 = this;
  if(this__8474.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8474.nodes, this__8474.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8474.nodes, this__8474.i, cljs.core.next.call(null, this__8474.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8475 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8476 = this;
  return new cljs.core.NodeSeq(meta, this__8476.nodes, this__8476.i, this__8476.s, this__8476.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8477 = this;
  return this__8477.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8478 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8478.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8485 = nodes.length;
      var j__8486 = i;
      while(true) {
        if(j__8486 < len__8485) {
          if(!(nodes[j__8486] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8486, null, null)
          }else {
            var temp__4090__auto____8487 = nodes[j__8486 + 1];
            if(cljs.core.truth_(temp__4090__auto____8487)) {
              var node__8488 = temp__4090__auto____8487;
              var temp__4090__auto____8489 = node__8488.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____8489)) {
                var node_seq__8490 = temp__4090__auto____8489;
                return new cljs.core.NodeSeq(null, nodes, j__8486 + 2, node_seq__8490, null)
              }else {
                var G__8491 = j__8486 + 2;
                j__8486 = G__8491;
                continue
              }
            }else {
              var G__8492 = j__8486 + 2;
              j__8486 = G__8492;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8493 = this;
  var h__2089__auto____8494 = this__8493.__hash;
  if(!(h__2089__auto____8494 == null)) {
    return h__2089__auto____8494
  }else {
    var h__2089__auto____8495 = cljs.core.hash_coll.call(null, coll);
    this__8493.__hash = h__2089__auto____8495;
    return h__2089__auto____8495
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8496 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8497 = this;
  var this__8498 = this;
  return cljs.core.pr_str.call(null, this__8498)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8499 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8500 = this;
  return cljs.core.first.call(null, this__8500.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8501 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8501.nodes, this__8501.i, cljs.core.next.call(null, this__8501.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8502 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8503 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8503.nodes, this__8503.i, this__8503.s, this__8503.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8504 = this;
  return this__8504.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8505 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8505.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8512 = nodes.length;
      var j__8513 = i;
      while(true) {
        if(j__8513 < len__8512) {
          var temp__4090__auto____8514 = nodes[j__8513];
          if(cljs.core.truth_(temp__4090__auto____8514)) {
            var nj__8515 = temp__4090__auto____8514;
            var temp__4090__auto____8516 = nj__8515.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____8516)) {
              var ns__8517 = temp__4090__auto____8516;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8513 + 1, ns__8517, null)
            }else {
              var G__8518 = j__8513 + 1;
              j__8513 = G__8518;
              continue
            }
          }else {
            var G__8519 = j__8513 + 1;
            j__8513 = G__8519;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8522 = this;
  return new cljs.core.TransientHashMap({}, this__8522.root, this__8522.cnt, this__8522.has_nil_QMARK_, this__8522.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8523 = this;
  var h__2089__auto____8524 = this__8523.__hash;
  if(!(h__2089__auto____8524 == null)) {
    return h__2089__auto____8524
  }else {
    var h__2089__auto____8525 = cljs.core.hash_imap.call(null, coll);
    this__8523.__hash = h__2089__auto____8525;
    return h__2089__auto____8525
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8526 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8527 = this;
  if(k == null) {
    if(this__8527.has_nil_QMARK_) {
      return this__8527.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8527.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8527.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8528 = this;
  if(k == null) {
    if(function() {
      var and__3941__auto____8529 = this__8528.has_nil_QMARK_;
      if(and__3941__auto____8529) {
        return v === this__8528.nil_val
      }else {
        return and__3941__auto____8529
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8528.meta, this__8528.has_nil_QMARK_ ? this__8528.cnt : this__8528.cnt + 1, this__8528.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8530 = new cljs.core.Box(false);
    var new_root__8531 = (this__8528.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8528.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8530);
    if(new_root__8531 === this__8528.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8528.meta, added_leaf_QMARK___8530.val ? this__8528.cnt + 1 : this__8528.cnt, new_root__8531, this__8528.has_nil_QMARK_, this__8528.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8532 = this;
  if(k == null) {
    return this__8532.has_nil_QMARK_
  }else {
    if(this__8532.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8532.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__8555 = null;
  var G__8555__2 = function(this_sym8533, k) {
    var this__8535 = this;
    var this_sym8533__8536 = this;
    var coll__8537 = this_sym8533__8536;
    return coll__8537.cljs$core$ILookup$_lookup$arity$2(coll__8537, k)
  };
  var G__8555__3 = function(this_sym8534, k, not_found) {
    var this__8535 = this;
    var this_sym8534__8538 = this;
    var coll__8539 = this_sym8534__8538;
    return coll__8539.cljs$core$ILookup$_lookup$arity$3(coll__8539, k, not_found)
  };
  G__8555 = function(this_sym8534, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8555__2.call(this, this_sym8534, k);
      case 3:
        return G__8555__3.call(this, this_sym8534, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8555
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8520, args8521) {
  var this__8540 = this;
  return this_sym8520.call.apply(this_sym8520, [this_sym8520].concat(args8521.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8541 = this;
  var init__8542 = this__8541.has_nil_QMARK_ ? f.call(null, init, null, this__8541.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__8542)) {
    return cljs.core.deref.call(null, init__8542)
  }else {
    if(!(this__8541.root == null)) {
      return this__8541.root.kv_reduce(f, init__8542)
    }else {
      if("\ufdd0'else") {
        return init__8542
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8543 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8544 = this;
  var this__8545 = this;
  return cljs.core.pr_str.call(null, this__8545)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8546 = this;
  if(this__8546.cnt > 0) {
    var s__8547 = !(this__8546.root == null) ? this__8546.root.inode_seq() : null;
    if(this__8546.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__8546.nil_val], true), s__8547)
    }else {
      return s__8547
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8548 = this;
  return this__8548.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8549 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8550 = this;
  return new cljs.core.PersistentHashMap(meta, this__8550.cnt, this__8550.root, this__8550.has_nil_QMARK_, this__8550.nil_val, this__8550.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8551 = this;
  return this__8551.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8552 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__8552.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8553 = this;
  if(k == null) {
    if(this__8553.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__8553.meta, this__8553.cnt - 1, this__8553.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__8553.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__8554 = this__8553.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__8554 === this__8553.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__8553.meta, this__8553.cnt - 1, new_root__8554, this__8553.has_nil_QMARK_, this__8553.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__8556 = ks.length;
  var i__8557 = 0;
  var out__8558 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__8557 < len__8556) {
      var G__8559 = i__8557 + 1;
      var G__8560 = cljs.core.assoc_BANG_.call(null, out__8558, ks[i__8557], vs[i__8557]);
      i__8557 = G__8559;
      out__8558 = G__8560;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8558)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8561 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8562 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__8563 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8564 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8565 = this;
  if(k == null) {
    if(this__8565.has_nil_QMARK_) {
      return this__8565.nil_val
    }else {
      return null
    }
  }else {
    if(this__8565.root == null) {
      return null
    }else {
      return this__8565.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8566 = this;
  if(k == null) {
    if(this__8566.has_nil_QMARK_) {
      return this__8566.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8566.root == null) {
      return not_found
    }else {
      return this__8566.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8567 = this;
  if(this__8567.edit) {
    return this__8567.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__8568 = this;
  var tcoll__8569 = this;
  if(this__8568.edit) {
    if(function() {
      var G__8570__8571 = o;
      if(G__8570__8571) {
        if(function() {
          var or__3943__auto____8572 = G__8570__8571.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____8572) {
            return or__3943__auto____8572
          }else {
            return G__8570__8571.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8570__8571.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8570__8571)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8570__8571)
      }
    }()) {
      return tcoll__8569.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8573 = cljs.core.seq.call(null, o);
      var tcoll__8574 = tcoll__8569;
      while(true) {
        var temp__4090__auto____8575 = cljs.core.first.call(null, es__8573);
        if(cljs.core.truth_(temp__4090__auto____8575)) {
          var e__8576 = temp__4090__auto____8575;
          var G__8587 = cljs.core.next.call(null, es__8573);
          var G__8588 = tcoll__8574.assoc_BANG_(cljs.core.key.call(null, e__8576), cljs.core.val.call(null, e__8576));
          es__8573 = G__8587;
          tcoll__8574 = G__8588;
          continue
        }else {
          return tcoll__8574
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__8577 = this;
  var tcoll__8578 = this;
  if(this__8577.edit) {
    if(k == null) {
      if(this__8577.nil_val === v) {
      }else {
        this__8577.nil_val = v
      }
      if(this__8577.has_nil_QMARK_) {
      }else {
        this__8577.count = this__8577.count + 1;
        this__8577.has_nil_QMARK_ = true
      }
      return tcoll__8578
    }else {
      var added_leaf_QMARK___8579 = new cljs.core.Box(false);
      var node__8580 = (this__8577.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8577.root).inode_assoc_BANG_(this__8577.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8579);
      if(node__8580 === this__8577.root) {
      }else {
        this__8577.root = node__8580
      }
      if(added_leaf_QMARK___8579.val) {
        this__8577.count = this__8577.count + 1
      }else {
      }
      return tcoll__8578
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__8581 = this;
  var tcoll__8582 = this;
  if(this__8581.edit) {
    if(k == null) {
      if(this__8581.has_nil_QMARK_) {
        this__8581.has_nil_QMARK_ = false;
        this__8581.nil_val = null;
        this__8581.count = this__8581.count - 1;
        return tcoll__8582
      }else {
        return tcoll__8582
      }
    }else {
      if(this__8581.root == null) {
        return tcoll__8582
      }else {
        var removed_leaf_QMARK___8583 = new cljs.core.Box(false);
        var node__8584 = this__8581.root.inode_without_BANG_(this__8581.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___8583);
        if(node__8584 === this__8581.root) {
        }else {
          this__8581.root = node__8584
        }
        if(cljs.core.truth_(removed_leaf_QMARK___8583[0])) {
          this__8581.count = this__8581.count - 1
        }else {
        }
        return tcoll__8582
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__8585 = this;
  var tcoll__8586 = this;
  if(this__8585.edit) {
    this__8585.edit = null;
    return new cljs.core.PersistentHashMap(null, this__8585.count, this__8585.root, this__8585.has_nil_QMARK_, this__8585.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__8591 = node;
  var stack__8592 = stack;
  while(true) {
    if(!(t__8591 == null)) {
      var G__8593 = ascending_QMARK_ ? t__8591.left : t__8591.right;
      var G__8594 = cljs.core.conj.call(null, stack__8592, t__8591);
      t__8591 = G__8593;
      stack__8592 = G__8594;
      continue
    }else {
      return stack__8592
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8595 = this;
  var h__2089__auto____8596 = this__8595.__hash;
  if(!(h__2089__auto____8596 == null)) {
    return h__2089__auto____8596
  }else {
    var h__2089__auto____8597 = cljs.core.hash_coll.call(null, coll);
    this__8595.__hash = h__2089__auto____8597;
    return h__2089__auto____8597
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8598 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__8599 = this;
  var this__8600 = this;
  return cljs.core.pr_str.call(null, this__8600)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8601 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8602 = this;
  if(this__8602.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__8602.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__8603 = this;
  return cljs.core.peek.call(null, this__8603.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__8604 = this;
  var t__8605 = cljs.core.first.call(null, this__8604.stack);
  var next_stack__8606 = cljs.core.tree_map_seq_push.call(null, this__8604.ascending_QMARK_ ? t__8605.right : t__8605.left, cljs.core.next.call(null, this__8604.stack), this__8604.ascending_QMARK_);
  if(!(next_stack__8606 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__8606, this__8604.ascending_QMARK_, this__8604.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8607 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8608 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__8608.stack, this__8608.ascending_QMARK_, this__8608.cnt, this__8608.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8609 = this;
  return this__8609.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto____8611 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3941__auto____8611) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3941__auto____8611
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto____8613 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3941__auto____8613) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3941__auto____8613
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__8617 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__8617)) {
    return cljs.core.deref.call(null, init__8617)
  }else {
    var init__8618 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__8617) : init__8617;
    if(cljs.core.reduced_QMARK_.call(null, init__8618)) {
      return cljs.core.deref.call(null, init__8618)
    }else {
      var init__8619 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__8618) : init__8618;
      if(cljs.core.reduced_QMARK_.call(null, init__8619)) {
        return cljs.core.deref.call(null, init__8619)
      }else {
        return init__8619
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8622 = this;
  var h__2089__auto____8623 = this__8622.__hash;
  if(!(h__2089__auto____8623 == null)) {
    return h__2089__auto____8623
  }else {
    var h__2089__auto____8624 = cljs.core.hash_coll.call(null, coll);
    this__8622.__hash = h__2089__auto____8624;
    return h__2089__auto____8624
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__8625 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__8626 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__8627 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__8627.key, this__8627.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__8675 = null;
  var G__8675__2 = function(this_sym8628, k) {
    var this__8630 = this;
    var this_sym8628__8631 = this;
    var node__8632 = this_sym8628__8631;
    return node__8632.cljs$core$ILookup$_lookup$arity$2(node__8632, k)
  };
  var G__8675__3 = function(this_sym8629, k, not_found) {
    var this__8630 = this;
    var this_sym8629__8633 = this;
    var node__8634 = this_sym8629__8633;
    return node__8634.cljs$core$ILookup$_lookup$arity$3(node__8634, k, not_found)
  };
  G__8675 = function(this_sym8629, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8675__2.call(this, this_sym8629, k);
      case 3:
        return G__8675__3.call(this, this_sym8629, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8675
}();
cljs.core.BlackNode.prototype.apply = function(this_sym8620, args8621) {
  var this__8635 = this;
  return this_sym8620.call.apply(this_sym8620, [this_sym8620].concat(args8621.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__8636 = this;
  return cljs.core.PersistentVector.fromArray([this__8636.key, this__8636.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__8637 = this;
  return this__8637.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__8638 = this;
  return this__8638.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__8639 = this;
  var node__8640 = this;
  return ins.balance_right(node__8640)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__8641 = this;
  var node__8642 = this;
  return new cljs.core.RedNode(this__8641.key, this__8641.val, this__8641.left, this__8641.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__8643 = this;
  var node__8644 = this;
  return cljs.core.balance_right_del.call(null, this__8643.key, this__8643.val, this__8643.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__8645 = this;
  var node__8646 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__8647 = this;
  var node__8648 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__8648, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__8649 = this;
  var node__8650 = this;
  return cljs.core.balance_left_del.call(null, this__8649.key, this__8649.val, del, this__8649.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__8651 = this;
  var node__8652 = this;
  return ins.balance_left(node__8652)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__8653 = this;
  var node__8654 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__8654, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__8676 = null;
  var G__8676__0 = function() {
    var this__8655 = this;
    var this__8657 = this;
    return cljs.core.pr_str.call(null, this__8657)
  };
  G__8676 = function() {
    switch(arguments.length) {
      case 0:
        return G__8676__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8676
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__8658 = this;
  var node__8659 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__8659, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__8660 = this;
  var node__8661 = this;
  return node__8661
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__8662 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__8663 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__8664 = this;
  return cljs.core.list.call(null, this__8664.key, this__8664.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__8665 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__8666 = this;
  return this__8666.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__8667 = this;
  return cljs.core.PersistentVector.fromArray([this__8667.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__8668 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__8668.key, this__8668.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8669 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__8670 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__8670.key, this__8670.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__8671 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__8672 = this;
  if(n === 0) {
    return this__8672.key
  }else {
    if(n === 1) {
      return this__8672.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__8673 = this;
  if(n === 0) {
    return this__8673.key
  }else {
    if(n === 1) {
      return this__8673.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__8674 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8679 = this;
  var h__2089__auto____8680 = this__8679.__hash;
  if(!(h__2089__auto____8680 == null)) {
    return h__2089__auto____8680
  }else {
    var h__2089__auto____8681 = cljs.core.hash_coll.call(null, coll);
    this__8679.__hash = h__2089__auto____8681;
    return h__2089__auto____8681
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__8682 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__8683 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__8684 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__8684.key, this__8684.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__8732 = null;
  var G__8732__2 = function(this_sym8685, k) {
    var this__8687 = this;
    var this_sym8685__8688 = this;
    var node__8689 = this_sym8685__8688;
    return node__8689.cljs$core$ILookup$_lookup$arity$2(node__8689, k)
  };
  var G__8732__3 = function(this_sym8686, k, not_found) {
    var this__8687 = this;
    var this_sym8686__8690 = this;
    var node__8691 = this_sym8686__8690;
    return node__8691.cljs$core$ILookup$_lookup$arity$3(node__8691, k, not_found)
  };
  G__8732 = function(this_sym8686, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8732__2.call(this, this_sym8686, k);
      case 3:
        return G__8732__3.call(this, this_sym8686, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8732
}();
cljs.core.RedNode.prototype.apply = function(this_sym8677, args8678) {
  var this__8692 = this;
  return this_sym8677.call.apply(this_sym8677, [this_sym8677].concat(args8678.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__8693 = this;
  return cljs.core.PersistentVector.fromArray([this__8693.key, this__8693.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__8694 = this;
  return this__8694.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__8695 = this;
  return this__8695.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__8696 = this;
  var node__8697 = this;
  return new cljs.core.RedNode(this__8696.key, this__8696.val, this__8696.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__8698 = this;
  var node__8699 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__8700 = this;
  var node__8701 = this;
  return new cljs.core.RedNode(this__8700.key, this__8700.val, this__8700.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__8702 = this;
  var node__8703 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__8704 = this;
  var node__8705 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__8705, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__8706 = this;
  var node__8707 = this;
  return new cljs.core.RedNode(this__8706.key, this__8706.val, del, this__8706.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__8708 = this;
  var node__8709 = this;
  return new cljs.core.RedNode(this__8708.key, this__8708.val, ins, this__8708.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__8710 = this;
  var node__8711 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8710.left)) {
    return new cljs.core.RedNode(this__8710.key, this__8710.val, this__8710.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__8710.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8710.right)) {
      return new cljs.core.RedNode(this__8710.right.key, this__8710.right.val, new cljs.core.BlackNode(this__8710.key, this__8710.val, this__8710.left, this__8710.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__8710.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__8711, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__8733 = null;
  var G__8733__0 = function() {
    var this__8712 = this;
    var this__8714 = this;
    return cljs.core.pr_str.call(null, this__8714)
  };
  G__8733 = function() {
    switch(arguments.length) {
      case 0:
        return G__8733__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8733
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__8715 = this;
  var node__8716 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8715.right)) {
    return new cljs.core.RedNode(this__8715.key, this__8715.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__8715.left, null), this__8715.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8715.left)) {
      return new cljs.core.RedNode(this__8715.left.key, this__8715.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__8715.left.left, null), new cljs.core.BlackNode(this__8715.key, this__8715.val, this__8715.left.right, this__8715.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__8716, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__8717 = this;
  var node__8718 = this;
  return new cljs.core.BlackNode(this__8717.key, this__8717.val, this__8717.left, this__8717.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__8719 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__8720 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__8721 = this;
  return cljs.core.list.call(null, this__8721.key, this__8721.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__8722 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__8723 = this;
  return this__8723.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__8724 = this;
  return cljs.core.PersistentVector.fromArray([this__8724.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__8725 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__8725.key, this__8725.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8726 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__8727 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__8727.key, this__8727.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__8728 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__8729 = this;
  if(n === 0) {
    return this__8729.key
  }else {
    if(n === 1) {
      return this__8729.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__8730 = this;
  if(n === 0) {
    return this__8730.key
  }else {
    if(n === 1) {
      return this__8730.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__8731 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__8737 = comp.call(null, k, tree.key);
    if(c__8737 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__8737 < 0) {
        var ins__8738 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__8738 == null)) {
          return tree.add_left(ins__8738)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__8739 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__8739 == null)) {
            return tree.add_right(ins__8739)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__8742 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__8742)) {
            return new cljs.core.RedNode(app__8742.key, app__8742.val, new cljs.core.RedNode(left.key, left.val, left.left, app__8742.left, null), new cljs.core.RedNode(right.key, right.val, app__8742.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__8742, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__8743 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__8743)) {
              return new cljs.core.RedNode(app__8743.key, app__8743.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__8743.left, null), new cljs.core.BlackNode(right.key, right.val, app__8743.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__8743, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__8749 = comp.call(null, k, tree.key);
    if(c__8749 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__8749 < 0) {
        var del__8750 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto____8751 = !(del__8750 == null);
          if(or__3943__auto____8751) {
            return or__3943__auto____8751
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__8750, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__8750, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__8752 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto____8753 = !(del__8752 == null);
            if(or__3943__auto____8753) {
              return or__3943__auto____8753
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__8752)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__8752, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__8756 = tree.key;
  var c__8757 = comp.call(null, k, tk__8756);
  if(c__8757 === 0) {
    return tree.replace(tk__8756, v, tree.left, tree.right)
  }else {
    if(c__8757 < 0) {
      return tree.replace(tk__8756, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__8756, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8760 = this;
  var h__2089__auto____8761 = this__8760.__hash;
  if(!(h__2089__auto____8761 == null)) {
    return h__2089__auto____8761
  }else {
    var h__2089__auto____8762 = cljs.core.hash_imap.call(null, coll);
    this__8760.__hash = h__2089__auto____8762;
    return h__2089__auto____8762
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8763 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8764 = this;
  var n__8765 = coll.entry_at(k);
  if(!(n__8765 == null)) {
    return n__8765.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8766 = this;
  var found__8767 = [null];
  var t__8768 = cljs.core.tree_map_add.call(null, this__8766.comp, this__8766.tree, k, v, found__8767);
  if(t__8768 == null) {
    var found_node__8769 = cljs.core.nth.call(null, found__8767, 0);
    if(cljs.core._EQ_.call(null, v, found_node__8769.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__8766.comp, cljs.core.tree_map_replace.call(null, this__8766.comp, this__8766.tree, k, v), this__8766.cnt, this__8766.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__8766.comp, t__8768.blacken(), this__8766.cnt + 1, this__8766.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8770 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__8804 = null;
  var G__8804__2 = function(this_sym8771, k) {
    var this__8773 = this;
    var this_sym8771__8774 = this;
    var coll__8775 = this_sym8771__8774;
    return coll__8775.cljs$core$ILookup$_lookup$arity$2(coll__8775, k)
  };
  var G__8804__3 = function(this_sym8772, k, not_found) {
    var this__8773 = this;
    var this_sym8772__8776 = this;
    var coll__8777 = this_sym8772__8776;
    return coll__8777.cljs$core$ILookup$_lookup$arity$3(coll__8777, k, not_found)
  };
  G__8804 = function(this_sym8772, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8804__2.call(this, this_sym8772, k);
      case 3:
        return G__8804__3.call(this, this_sym8772, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8804
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym8758, args8759) {
  var this__8778 = this;
  return this_sym8758.call.apply(this_sym8758, [this_sym8758].concat(args8759.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8779 = this;
  if(!(this__8779.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__8779.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8780 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8781 = this;
  if(this__8781.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__8781.tree, false, this__8781.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__8782 = this;
  var this__8783 = this;
  return cljs.core.pr_str.call(null, this__8783)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__8784 = this;
  var coll__8785 = this;
  var t__8786 = this__8784.tree;
  while(true) {
    if(!(t__8786 == null)) {
      var c__8787 = this__8784.comp.call(null, k, t__8786.key);
      if(c__8787 === 0) {
        return t__8786
      }else {
        if(c__8787 < 0) {
          var G__8805 = t__8786.left;
          t__8786 = G__8805;
          continue
        }else {
          if("\ufdd0'else") {
            var G__8806 = t__8786.right;
            t__8786 = G__8806;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__8788 = this;
  if(this__8788.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__8788.tree, ascending_QMARK_, this__8788.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__8789 = this;
  if(this__8789.cnt > 0) {
    var stack__8790 = null;
    var t__8791 = this__8789.tree;
    while(true) {
      if(!(t__8791 == null)) {
        var c__8792 = this__8789.comp.call(null, k, t__8791.key);
        if(c__8792 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__8790, t__8791), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__8792 < 0) {
              var G__8807 = cljs.core.conj.call(null, stack__8790, t__8791);
              var G__8808 = t__8791.left;
              stack__8790 = G__8807;
              t__8791 = G__8808;
              continue
            }else {
              var G__8809 = stack__8790;
              var G__8810 = t__8791.right;
              stack__8790 = G__8809;
              t__8791 = G__8810;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__8792 > 0) {
                var G__8811 = cljs.core.conj.call(null, stack__8790, t__8791);
                var G__8812 = t__8791.right;
                stack__8790 = G__8811;
                t__8791 = G__8812;
                continue
              }else {
                var G__8813 = stack__8790;
                var G__8814 = t__8791.left;
                stack__8790 = G__8813;
                t__8791 = G__8814;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__8790 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__8790, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__8793 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__8794 = this;
  return this__8794.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8795 = this;
  if(this__8795.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__8795.tree, true, this__8795.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8796 = this;
  return this__8796.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8797 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8798 = this;
  return new cljs.core.PersistentTreeMap(this__8798.comp, this__8798.tree, this__8798.cnt, meta, this__8798.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8799 = this;
  return this__8799.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8800 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__8800.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8801 = this;
  var found__8802 = [null];
  var t__8803 = cljs.core.tree_map_remove.call(null, this__8801.comp, this__8801.tree, k, found__8802);
  if(t__8803 == null) {
    if(cljs.core.nth.call(null, found__8802, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__8801.comp, null, 0, this__8801.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__8801.comp, t__8803.blacken(), this__8801.cnt - 1, this__8801.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__8817 = cljs.core.seq.call(null, keyvals);
    var out__8818 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__8817) {
        var G__8819 = cljs.core.nnext.call(null, in__8817);
        var G__8820 = cljs.core.assoc_BANG_.call(null, out__8818, cljs.core.first.call(null, in__8817), cljs.core.second.call(null, in__8817));
        in__8817 = G__8819;
        out__8818 = G__8820;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8818)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__8821) {
    var keyvals = cljs.core.seq(arglist__8821);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__8822) {
    var keyvals = cljs.core.seq(arglist__8822);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__8825 = cljs.core.seq.call(null, keyvals);
    var out__8826 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__8825) {
        var G__8827 = cljs.core.nnext.call(null, in__8825);
        var G__8828 = cljs.core.assoc.call(null, out__8826, cljs.core.first.call(null, in__8825), cljs.core.second.call(null, in__8825));
        in__8825 = G__8827;
        out__8826 = G__8828;
        continue
      }else {
        return out__8826
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__8829) {
    var keyvals = cljs.core.seq(arglist__8829);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__8832 = cljs.core.seq.call(null, keyvals);
    var out__8833 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__8832) {
        var G__8834 = cljs.core.nnext.call(null, in__8832);
        var G__8835 = cljs.core.assoc.call(null, out__8833, cljs.core.first.call(null, in__8832), cljs.core.second.call(null, in__8832));
        in__8832 = G__8834;
        out__8833 = G__8835;
        continue
      }else {
        return out__8833
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__8836) {
    var comparator = cljs.core.first(arglist__8836);
    var keyvals = cljs.core.rest(arglist__8836);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__8837_SHARP_, p2__8838_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto____8840 = p1__8837_SHARP_;
          if(cljs.core.truth_(or__3943__auto____8840)) {
            return or__3943__auto____8840
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__8838_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__8841) {
    var maps = cljs.core.seq(arglist__8841);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__8849 = function(m, e) {
        var k__8847 = cljs.core.first.call(null, e);
        var v__8848 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__8847)) {
          return cljs.core.assoc.call(null, m, k__8847, f.call(null, cljs.core._lookup.call(null, m, k__8847, null), v__8848))
        }else {
          return cljs.core.assoc.call(null, m, k__8847, v__8848)
        }
      };
      var merge2__8851 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__8849, function() {
          var or__3943__auto____8850 = m1;
          if(cljs.core.truth_(or__3943__auto____8850)) {
            return or__3943__auto____8850
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__8851, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__8852) {
    var f = cljs.core.first(arglist__8852);
    var maps = cljs.core.rest(arglist__8852);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__8857 = cljs.core.ObjMap.EMPTY;
  var keys__8858 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__8858) {
      var key__8859 = cljs.core.first.call(null, keys__8858);
      var entry__8860 = cljs.core._lookup.call(null, map, key__8859, "\ufdd0'user/not-found");
      var G__8861 = cljs.core.not_EQ_.call(null, entry__8860, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__8857, key__8859, entry__8860) : ret__8857;
      var G__8862 = cljs.core.next.call(null, keys__8858);
      ret__8857 = G__8861;
      keys__8858 = G__8862;
      continue
    }else {
      return ret__8857
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8866 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__8866.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8867 = this;
  var h__2089__auto____8868 = this__8867.__hash;
  if(!(h__2089__auto____8868 == null)) {
    return h__2089__auto____8868
  }else {
    var h__2089__auto____8869 = cljs.core.hash_iset.call(null, coll);
    this__8867.__hash = h__2089__auto____8869;
    return h__2089__auto____8869
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__8870 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__8871 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__8871.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__8892 = null;
  var G__8892__2 = function(this_sym8872, k) {
    var this__8874 = this;
    var this_sym8872__8875 = this;
    var coll__8876 = this_sym8872__8875;
    return coll__8876.cljs$core$ILookup$_lookup$arity$2(coll__8876, k)
  };
  var G__8892__3 = function(this_sym8873, k, not_found) {
    var this__8874 = this;
    var this_sym8873__8877 = this;
    var coll__8878 = this_sym8873__8877;
    return coll__8878.cljs$core$ILookup$_lookup$arity$3(coll__8878, k, not_found)
  };
  G__8892 = function(this_sym8873, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8892__2.call(this, this_sym8873, k);
      case 3:
        return G__8892__3.call(this, this_sym8873, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8892
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym8864, args8865) {
  var this__8879 = this;
  return this_sym8864.call.apply(this_sym8864, [this_sym8864].concat(args8865.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8880 = this;
  return new cljs.core.PersistentHashSet(this__8880.meta, cljs.core.assoc.call(null, this__8880.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__8881 = this;
  var this__8882 = this;
  return cljs.core.pr_str.call(null, this__8882)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8883 = this;
  return cljs.core.keys.call(null, this__8883.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__8884 = this;
  return new cljs.core.PersistentHashSet(this__8884.meta, cljs.core.dissoc.call(null, this__8884.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8885 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8886 = this;
  var and__3941__auto____8887 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____8887) {
    var and__3941__auto____8888 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____8888) {
      return cljs.core.every_QMARK_.call(null, function(p1__8863_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__8863_SHARP_)
      }, other)
    }else {
      return and__3941__auto____8888
    }
  }else {
    return and__3941__auto____8887
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8889 = this;
  return new cljs.core.PersistentHashSet(meta, this__8889.hash_map, this__8889.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8890 = this;
  return this__8890.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8891 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__8891.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__8910 = null;
  var G__8910__2 = function(this_sym8896, k) {
    var this__8898 = this;
    var this_sym8896__8899 = this;
    var tcoll__8900 = this_sym8896__8899;
    if(cljs.core._lookup.call(null, this__8898.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__8910__3 = function(this_sym8897, k, not_found) {
    var this__8898 = this;
    var this_sym8897__8901 = this;
    var tcoll__8902 = this_sym8897__8901;
    if(cljs.core._lookup.call(null, this__8898.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__8910 = function(this_sym8897, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8910__2.call(this, this_sym8897, k);
      case 3:
        return G__8910__3.call(this, this_sym8897, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8910
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym8894, args8895) {
  var this__8903 = this;
  return this_sym8894.call.apply(this_sym8894, [this_sym8894].concat(args8895.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__8904 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__8905 = this;
  if(cljs.core._lookup.call(null, this__8905.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8906 = this;
  return cljs.core.count.call(null, this__8906.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__8907 = this;
  this__8907.transient_map = cljs.core.dissoc_BANG_.call(null, this__8907.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8908 = this;
  this__8908.transient_map = cljs.core.assoc_BANG_.call(null, this__8908.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8909 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__8909.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8913 = this;
  var h__2089__auto____8914 = this__8913.__hash;
  if(!(h__2089__auto____8914 == null)) {
    return h__2089__auto____8914
  }else {
    var h__2089__auto____8915 = cljs.core.hash_iset.call(null, coll);
    this__8913.__hash = h__2089__auto____8915;
    return h__2089__auto____8915
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__8916 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__8917 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__8917.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__8943 = null;
  var G__8943__2 = function(this_sym8918, k) {
    var this__8920 = this;
    var this_sym8918__8921 = this;
    var coll__8922 = this_sym8918__8921;
    return coll__8922.cljs$core$ILookup$_lookup$arity$2(coll__8922, k)
  };
  var G__8943__3 = function(this_sym8919, k, not_found) {
    var this__8920 = this;
    var this_sym8919__8923 = this;
    var coll__8924 = this_sym8919__8923;
    return coll__8924.cljs$core$ILookup$_lookup$arity$3(coll__8924, k, not_found)
  };
  G__8943 = function(this_sym8919, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8943__2.call(this, this_sym8919, k);
      case 3:
        return G__8943__3.call(this, this_sym8919, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8943
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym8911, args8912) {
  var this__8925 = this;
  return this_sym8911.call.apply(this_sym8911, [this_sym8911].concat(args8912.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8926 = this;
  return new cljs.core.PersistentTreeSet(this__8926.meta, cljs.core.assoc.call(null, this__8926.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8927 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__8927.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__8928 = this;
  var this__8929 = this;
  return cljs.core.pr_str.call(null, this__8929)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__8930 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__8930.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__8931 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__8931.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__8932 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__8933 = this;
  return cljs.core._comparator.call(null, this__8933.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8934 = this;
  return cljs.core.keys.call(null, this__8934.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__8935 = this;
  return new cljs.core.PersistentTreeSet(this__8935.meta, cljs.core.dissoc.call(null, this__8935.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8936 = this;
  return cljs.core.count.call(null, this__8936.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8937 = this;
  var and__3941__auto____8938 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____8938) {
    var and__3941__auto____8939 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____8939) {
      return cljs.core.every_QMARK_.call(null, function(p1__8893_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__8893_SHARP_)
      }, other)
    }else {
      return and__3941__auto____8939
    }
  }else {
    return and__3941__auto____8938
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8940 = this;
  return new cljs.core.PersistentTreeSet(meta, this__8940.tree_map, this__8940.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8941 = this;
  return this__8941.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8942 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__8942.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in__8946 = cljs.core.seq.call(null, coll);
  var out__8947 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.seq.call(null, in__8946)) {
      var G__8948 = cljs.core.next.call(null, in__8946);
      var G__8949 = cljs.core.conj_BANG_.call(null, out__8947, cljs.core.first.call(null, in__8946));
      in__8946 = G__8948;
      out__8947 = G__8949;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8947)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__8950) {
    var keys = cljs.core.seq(arglist__8950);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__8952) {
    var comparator = cljs.core.first(arglist__8952);
    var keys = cljs.core.rest(arglist__8952);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__8958 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto____8959 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto____8959)) {
        var e__8960 = temp__4090__auto____8959;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__8960))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__8958, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__8951_SHARP_) {
      var temp__4090__auto____8961 = cljs.core.find.call(null, smap, p1__8951_SHARP_);
      if(cljs.core.truth_(temp__4090__auto____8961)) {
        var e__8962 = temp__4090__auto____8961;
        return cljs.core.second.call(null, e__8962)
      }else {
        return p1__8951_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__8992 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__8985, seen) {
        while(true) {
          var vec__8986__8987 = p__8985;
          var f__8988 = cljs.core.nth.call(null, vec__8986__8987, 0, null);
          var xs__8989 = vec__8986__8987;
          var temp__4092__auto____8990 = cljs.core.seq.call(null, xs__8989);
          if(temp__4092__auto____8990) {
            var s__8991 = temp__4092__auto____8990;
            if(cljs.core.contains_QMARK_.call(null, seen, f__8988)) {
              var G__8993 = cljs.core.rest.call(null, s__8991);
              var G__8994 = seen;
              p__8985 = G__8993;
              seen = G__8994;
              continue
            }else {
              return cljs.core.cons.call(null, f__8988, step.call(null, cljs.core.rest.call(null, s__8991), cljs.core.conj.call(null, seen, f__8988)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__8992.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__8997 = cljs.core.PersistentVector.EMPTY;
  var s__8998 = s;
  while(true) {
    if(cljs.core.next.call(null, s__8998)) {
      var G__8999 = cljs.core.conj.call(null, ret__8997, cljs.core.first.call(null, s__8998));
      var G__9000 = cljs.core.next.call(null, s__8998);
      ret__8997 = G__8999;
      s__8998 = G__9000;
      continue
    }else {
      return cljs.core.seq.call(null, ret__8997)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3943__auto____9003 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3943__auto____9003) {
        return or__3943__auto____9003
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9004 = x.lastIndexOf("/");
      if(i__9004 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9004 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3943__auto____9007 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3943__auto____9007) {
      return or__3943__auto____9007
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9008 = x.lastIndexOf("/");
    if(i__9008 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9008)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9015 = cljs.core.ObjMap.EMPTY;
  var ks__9016 = cljs.core.seq.call(null, keys);
  var vs__9017 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto____9018 = ks__9016;
      if(and__3941__auto____9018) {
        return vs__9017
      }else {
        return and__3941__auto____9018
      }
    }()) {
      var G__9019 = cljs.core.assoc.call(null, map__9015, cljs.core.first.call(null, ks__9016), cljs.core.first.call(null, vs__9017));
      var G__9020 = cljs.core.next.call(null, ks__9016);
      var G__9021 = cljs.core.next.call(null, vs__9017);
      map__9015 = G__9019;
      ks__9016 = G__9020;
      vs__9017 = G__9021;
      continue
    }else {
      return map__9015
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9024__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9009_SHARP_, p2__9010_SHARP_) {
        return max_key.call(null, k, p1__9009_SHARP_, p2__9010_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9024 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9024__delegate.call(this, k, x, y, more)
    };
    G__9024.cljs$lang$maxFixedArity = 3;
    G__9024.cljs$lang$applyTo = function(arglist__9025) {
      var k = cljs.core.first(arglist__9025);
      var x = cljs.core.first(cljs.core.next(arglist__9025));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9025)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9025)));
      return G__9024__delegate(k, x, y, more)
    };
    G__9024.cljs$lang$arity$variadic = G__9024__delegate;
    return G__9024
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9026__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9022_SHARP_, p2__9023_SHARP_) {
        return min_key.call(null, k, p1__9022_SHARP_, p2__9023_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9026 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9026__delegate.call(this, k, x, y, more)
    };
    G__9026.cljs$lang$maxFixedArity = 3;
    G__9026.cljs$lang$applyTo = function(arglist__9027) {
      var k = cljs.core.first(arglist__9027);
      var x = cljs.core.first(cljs.core.next(arglist__9027));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9027)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9027)));
      return G__9026__delegate(k, x, y, more)
    };
    G__9026.cljs$lang$arity$variadic = G__9026__delegate;
    return G__9026
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9030 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9030) {
        var s__9031 = temp__4092__auto____9030;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9031), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9031)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9034 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9034) {
      var s__9035 = temp__4092__auto____9034;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9035)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9035), take_while.call(null, pred, cljs.core.rest.call(null, s__9035)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9037 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9037.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9049 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__4092__auto____9050 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto____9050)) {
        var vec__9051__9052 = temp__4092__auto____9050;
        var e__9053 = cljs.core.nth.call(null, vec__9051__9052, 0, null);
        var s__9054 = vec__9051__9052;
        if(cljs.core.truth_(include__9049.call(null, e__9053))) {
          return s__9054
        }else {
          return cljs.core.next.call(null, s__9054)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9049, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9055 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto____9055)) {
      var vec__9056__9057 = temp__4092__auto____9055;
      var e__9058 = cljs.core.nth.call(null, vec__9056__9057, 0, null);
      var s__9059 = vec__9056__9057;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9058)) ? s__9059 : cljs.core.next.call(null, s__9059))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9071 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__4092__auto____9072 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto____9072)) {
        var vec__9073__9074 = temp__4092__auto____9072;
        var e__9075 = cljs.core.nth.call(null, vec__9073__9074, 0, null);
        var s__9076 = vec__9073__9074;
        if(cljs.core.truth_(include__9071.call(null, e__9075))) {
          return s__9076
        }else {
          return cljs.core.next.call(null, s__9076)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9071, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9077 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto____9077)) {
      var vec__9078__9079 = temp__4092__auto____9077;
      var e__9080 = cljs.core.nth.call(null, vec__9078__9079, 0, null);
      var s__9081 = vec__9078__9079;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9080)) ? s__9081 : cljs.core.next.call(null, s__9081))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9082 = this;
  var h__2089__auto____9083 = this__9082.__hash;
  if(!(h__2089__auto____9083 == null)) {
    return h__2089__auto____9083
  }else {
    var h__2089__auto____9084 = cljs.core.hash_coll.call(null, rng);
    this__9082.__hash = h__2089__auto____9084;
    return h__2089__auto____9084
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9085 = this;
  if(this__9085.step > 0) {
    if(this__9085.start + this__9085.step < this__9085.end) {
      return new cljs.core.Range(this__9085.meta, this__9085.start + this__9085.step, this__9085.end, this__9085.step, null)
    }else {
      return null
    }
  }else {
    if(this__9085.start + this__9085.step > this__9085.end) {
      return new cljs.core.Range(this__9085.meta, this__9085.start + this__9085.step, this__9085.end, this__9085.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9086 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9087 = this;
  var this__9088 = this;
  return cljs.core.pr_str.call(null, this__9088)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9089 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9090 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9091 = this;
  if(this__9091.step > 0) {
    if(this__9091.start < this__9091.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9091.start > this__9091.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9092 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9092.end - this__9092.start) / this__9092.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9093 = this;
  return this__9093.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9094 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9094.meta, this__9094.start + this__9094.step, this__9094.end, this__9094.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9095 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9096 = this;
  return new cljs.core.Range(meta, this__9096.start, this__9096.end, this__9096.step, this__9096.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9097 = this;
  return this__9097.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9098 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9098.start + n * this__9098.step
  }else {
    if(function() {
      var and__3941__auto____9099 = this__9098.start > this__9098.end;
      if(and__3941__auto____9099) {
        return this__9098.step === 0
      }else {
        return and__3941__auto____9099
      }
    }()) {
      return this__9098.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9100 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9100.start + n * this__9100.step
  }else {
    if(function() {
      var and__3941__auto____9101 = this__9100.start > this__9100.end;
      if(and__3941__auto____9101) {
        return this__9100.step === 0
      }else {
        return and__3941__auto____9101
      }
    }()) {
      return this__9100.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9102 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9102.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9105 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9105) {
      var s__9106 = temp__4092__auto____9105;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9106), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9106)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9113 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9113) {
      var s__9114 = temp__4092__auto____9113;
      var fst__9115 = cljs.core.first.call(null, s__9114);
      var fv__9116 = f.call(null, fst__9115);
      var run__9117 = cljs.core.cons.call(null, fst__9115, cljs.core.take_while.call(null, function(p1__9107_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9116, f.call(null, p1__9107_SHARP_))
      }, cljs.core.next.call(null, s__9114)));
      return cljs.core.cons.call(null, run__9117, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9117), s__9114))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____9132 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____9132) {
        var s__9133 = temp__4090__auto____9132;
        return reductions.call(null, f, cljs.core.first.call(null, s__9133), cljs.core.rest.call(null, s__9133))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9134 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9134) {
        var s__9135 = temp__4092__auto____9134;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9135)), cljs.core.rest.call(null, s__9135))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9138 = null;
      var G__9138__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9138__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9138__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9138__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9138__4 = function() {
        var G__9139__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9139 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9139__delegate.call(this, x, y, z, args)
        };
        G__9139.cljs$lang$maxFixedArity = 3;
        G__9139.cljs$lang$applyTo = function(arglist__9140) {
          var x = cljs.core.first(arglist__9140);
          var y = cljs.core.first(cljs.core.next(arglist__9140));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9140)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9140)));
          return G__9139__delegate(x, y, z, args)
        };
        G__9139.cljs$lang$arity$variadic = G__9139__delegate;
        return G__9139
      }();
      G__9138 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9138__0.call(this);
          case 1:
            return G__9138__1.call(this, x);
          case 2:
            return G__9138__2.call(this, x, y);
          case 3:
            return G__9138__3.call(this, x, y, z);
          default:
            return G__9138__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9138.cljs$lang$maxFixedArity = 3;
      G__9138.cljs$lang$applyTo = G__9138__4.cljs$lang$applyTo;
      return G__9138
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9141 = null;
      var G__9141__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9141__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9141__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9141__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9141__4 = function() {
        var G__9142__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9142 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9142__delegate.call(this, x, y, z, args)
        };
        G__9142.cljs$lang$maxFixedArity = 3;
        G__9142.cljs$lang$applyTo = function(arglist__9143) {
          var x = cljs.core.first(arglist__9143);
          var y = cljs.core.first(cljs.core.next(arglist__9143));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9143)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9143)));
          return G__9142__delegate(x, y, z, args)
        };
        G__9142.cljs$lang$arity$variadic = G__9142__delegate;
        return G__9142
      }();
      G__9141 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9141__0.call(this);
          case 1:
            return G__9141__1.call(this, x);
          case 2:
            return G__9141__2.call(this, x, y);
          case 3:
            return G__9141__3.call(this, x, y, z);
          default:
            return G__9141__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9141.cljs$lang$maxFixedArity = 3;
      G__9141.cljs$lang$applyTo = G__9141__4.cljs$lang$applyTo;
      return G__9141
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9144 = null;
      var G__9144__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9144__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9144__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9144__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9144__4 = function() {
        var G__9145__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9145 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9145__delegate.call(this, x, y, z, args)
        };
        G__9145.cljs$lang$maxFixedArity = 3;
        G__9145.cljs$lang$applyTo = function(arglist__9146) {
          var x = cljs.core.first(arglist__9146);
          var y = cljs.core.first(cljs.core.next(arglist__9146));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9146)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9146)));
          return G__9145__delegate(x, y, z, args)
        };
        G__9145.cljs$lang$arity$variadic = G__9145__delegate;
        return G__9145
      }();
      G__9144 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9144__0.call(this);
          case 1:
            return G__9144__1.call(this, x);
          case 2:
            return G__9144__2.call(this, x, y);
          case 3:
            return G__9144__3.call(this, x, y, z);
          default:
            return G__9144__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9144.cljs$lang$maxFixedArity = 3;
      G__9144.cljs$lang$applyTo = G__9144__4.cljs$lang$applyTo;
      return G__9144
    }()
  };
  var juxt__4 = function() {
    var G__9147__delegate = function(f, g, h, fs) {
      var fs__9137 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9148 = null;
        var G__9148__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9118_SHARP_, p2__9119_SHARP_) {
            return cljs.core.conj.call(null, p1__9118_SHARP_, p2__9119_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9137)
        };
        var G__9148__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9120_SHARP_, p2__9121_SHARP_) {
            return cljs.core.conj.call(null, p1__9120_SHARP_, p2__9121_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9137)
        };
        var G__9148__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9122_SHARP_, p2__9123_SHARP_) {
            return cljs.core.conj.call(null, p1__9122_SHARP_, p2__9123_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9137)
        };
        var G__9148__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9124_SHARP_, p2__9125_SHARP_) {
            return cljs.core.conj.call(null, p1__9124_SHARP_, p2__9125_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9137)
        };
        var G__9148__4 = function() {
          var G__9149__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9126_SHARP_, p2__9127_SHARP_) {
              return cljs.core.conj.call(null, p1__9126_SHARP_, cljs.core.apply.call(null, p2__9127_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9137)
          };
          var G__9149 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9149__delegate.call(this, x, y, z, args)
          };
          G__9149.cljs$lang$maxFixedArity = 3;
          G__9149.cljs$lang$applyTo = function(arglist__9150) {
            var x = cljs.core.first(arglist__9150);
            var y = cljs.core.first(cljs.core.next(arglist__9150));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9150)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9150)));
            return G__9149__delegate(x, y, z, args)
          };
          G__9149.cljs$lang$arity$variadic = G__9149__delegate;
          return G__9149
        }();
        G__9148 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9148__0.call(this);
            case 1:
              return G__9148__1.call(this, x);
            case 2:
              return G__9148__2.call(this, x, y);
            case 3:
              return G__9148__3.call(this, x, y, z);
            default:
              return G__9148__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9148.cljs$lang$maxFixedArity = 3;
        G__9148.cljs$lang$applyTo = G__9148__4.cljs$lang$applyTo;
        return G__9148
      }()
    };
    var G__9147 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9147__delegate.call(this, f, g, h, fs)
    };
    G__9147.cljs$lang$maxFixedArity = 3;
    G__9147.cljs$lang$applyTo = function(arglist__9151) {
      var f = cljs.core.first(arglist__9151);
      var g = cljs.core.first(cljs.core.next(arglist__9151));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9151)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9151)));
      return G__9147__delegate(f, g, h, fs)
    };
    G__9147.cljs$lang$arity$variadic = G__9147__delegate;
    return G__9147
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9154 = cljs.core.next.call(null, coll);
        coll = G__9154;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____9153 = cljs.core.seq.call(null, coll);
        if(and__3941__auto____9153) {
          return n > 0
        }else {
          return and__3941__auto____9153
        }
      }())) {
        var G__9155 = n - 1;
        var G__9156 = cljs.core.next.call(null, coll);
        n = G__9155;
        coll = G__9156;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9158 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9158), s)) {
    if(cljs.core.count.call(null, matches__9158) === 1) {
      return cljs.core.first.call(null, matches__9158)
    }else {
      return cljs.core.vec.call(null, matches__9158)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9160 = re.exec(s);
  if(matches__9160 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9160) === 1) {
      return cljs.core.first.call(null, matches__9160)
    }else {
      return cljs.core.vec.call(null, matches__9160)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9165 = cljs.core.re_find.call(null, re, s);
  var match_idx__9166 = s.search(re);
  var match_str__9167 = cljs.core.coll_QMARK_.call(null, match_data__9165) ? cljs.core.first.call(null, match_data__9165) : match_data__9165;
  var post_match__9168 = cljs.core.subs.call(null, s, match_idx__9166 + cljs.core.count.call(null, match_str__9167));
  if(cljs.core.truth_(match_data__9165)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9165, re_seq.call(null, re, post_match__9168))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9175__9176 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9177 = cljs.core.nth.call(null, vec__9175__9176, 0, null);
  var flags__9178 = cljs.core.nth.call(null, vec__9175__9176, 1, null);
  var pattern__9179 = cljs.core.nth.call(null, vec__9175__9176, 2, null);
  return new RegExp(pattern__9179, flags__9178)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9169_SHARP_) {
    return print_one.call(null, p1__9169_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3941__auto____9189 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3941__auto____9189)) {
            var and__3941__auto____9193 = function() {
              var G__9190__9191 = obj;
              if(G__9190__9191) {
                if(function() {
                  var or__3943__auto____9192 = G__9190__9191.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto____9192) {
                    return or__3943__auto____9192
                  }else {
                    return G__9190__9191.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9190__9191.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9190__9191)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9190__9191)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____9193)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____9193
            }
          }else {
            return and__3941__auto____9189
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3941__auto____9194 = !(obj == null);
          if(and__3941__auto____9194) {
            return obj.cljs$lang$type
          }else {
            return and__3941__auto____9194
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9195__9196 = obj;
          if(G__9195__9196) {
            if(function() {
              var or__3943__auto____9197 = G__9195__9196.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3943__auto____9197) {
                return or__3943__auto____9197
              }else {
                return G__9195__9196.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9195__9196.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9195__9196)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9195__9196)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__9212 = cljs.core.first.call(null, objs);
  var sb__9213 = new goog.string.StringBuffer;
  var G__9214__9215 = cljs.core.seq.call(null, objs);
  if(G__9214__9215) {
    var obj__9216 = cljs.core.first.call(null, G__9214__9215);
    var G__9214__9217 = G__9214__9215;
    while(true) {
      if(obj__9216 === first_obj__9212) {
      }else {
        sb__9213.append(" ")
      }
      var G__9218__9219 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9216, opts));
      if(G__9218__9219) {
        var string__9220 = cljs.core.first.call(null, G__9218__9219);
        var G__9218__9221 = G__9218__9219;
        while(true) {
          sb__9213.append(string__9220);
          var temp__4092__auto____9222 = cljs.core.next.call(null, G__9218__9221);
          if(temp__4092__auto____9222) {
            var G__9218__9223 = temp__4092__auto____9222;
            var G__9226 = cljs.core.first.call(null, G__9218__9223);
            var G__9227 = G__9218__9223;
            string__9220 = G__9226;
            G__9218__9221 = G__9227;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9224 = cljs.core.next.call(null, G__9214__9217);
      if(temp__4092__auto____9224) {
        var G__9214__9225 = temp__4092__auto____9224;
        var G__9228 = cljs.core.first.call(null, G__9214__9225);
        var G__9229 = G__9214__9225;
        obj__9216 = G__9228;
        G__9214__9217 = G__9229;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9213
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9231 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9231.append("\n");
  return[cljs.core.str(sb__9231)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__9245 = cljs.core.first.call(null, objs);
  var G__9246__9247 = cljs.core.seq.call(null, objs);
  if(G__9246__9247) {
    var obj__9248 = cljs.core.first.call(null, G__9246__9247);
    var G__9246__9249 = G__9246__9247;
    while(true) {
      if(obj__9248 === first_obj__9245) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__9250__9251 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9248, opts));
      if(G__9250__9251) {
        var string__9252 = cljs.core.first.call(null, G__9250__9251);
        var G__9250__9253 = G__9250__9251;
        while(true) {
          cljs.core.string_print.call(null, string__9252);
          var temp__4092__auto____9254 = cljs.core.next.call(null, G__9250__9253);
          if(temp__4092__auto____9254) {
            var G__9250__9255 = temp__4092__auto____9254;
            var G__9258 = cljs.core.first.call(null, G__9250__9255);
            var G__9259 = G__9250__9255;
            string__9252 = G__9258;
            G__9250__9253 = G__9259;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9256 = cljs.core.next.call(null, G__9246__9249);
      if(temp__4092__auto____9256) {
        var G__9246__9257 = temp__4092__auto____9256;
        var G__9260 = cljs.core.first.call(null, G__9246__9257);
        var G__9261 = G__9246__9257;
        obj__9248 = G__9260;
        G__9246__9249 = G__9261;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9262) {
    var objs = cljs.core.seq(arglist__9262);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9263) {
    var objs = cljs.core.seq(arglist__9263);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9264) {
    var objs = cljs.core.seq(arglist__9264);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9265) {
    var objs = cljs.core.seq(arglist__9265);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9266) {
    var objs = cljs.core.seq(arglist__9266);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9267) {
    var objs = cljs.core.seq(arglist__9267);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9268) {
    var objs = cljs.core.seq(arglist__9268);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9269) {
    var objs = cljs.core.seq(arglist__9269);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9270 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9270, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9271 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9271, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9272 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9272, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__4092__auto____9273 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__4092__auto____9273)) {
        var nspc__9274 = temp__4092__auto____9273;
        return[cljs.core.str(nspc__9274), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__4092__auto____9275 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__4092__auto____9275)) {
          var nspc__9276 = temp__4092__auto____9275;
          return[cljs.core.str(nspc__9276), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9277 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9277, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9279 = function(n, len) {
    var ns__9278 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9278) < len) {
        var G__9281 = [cljs.core.str("0"), cljs.core.str(ns__9278)].join("");
        ns__9278 = G__9281;
        continue
      }else {
        return ns__9278
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9279.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9279.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9279.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9279.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9279.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9279.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9280 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9280, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9282 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9283 = this;
  var G__9284__9285 = cljs.core.seq.call(null, this__9283.watches);
  if(G__9284__9285) {
    var G__9287__9289 = cljs.core.first.call(null, G__9284__9285);
    var vec__9288__9290 = G__9287__9289;
    var key__9291 = cljs.core.nth.call(null, vec__9288__9290, 0, null);
    var f__9292 = cljs.core.nth.call(null, vec__9288__9290, 1, null);
    var G__9284__9293 = G__9284__9285;
    var G__9287__9294 = G__9287__9289;
    var G__9284__9295 = G__9284__9293;
    while(true) {
      var vec__9296__9297 = G__9287__9294;
      var key__9298 = cljs.core.nth.call(null, vec__9296__9297, 0, null);
      var f__9299 = cljs.core.nth.call(null, vec__9296__9297, 1, null);
      var G__9284__9300 = G__9284__9295;
      f__9299.call(null, key__9298, this$, oldval, newval);
      var temp__4092__auto____9301 = cljs.core.next.call(null, G__9284__9300);
      if(temp__4092__auto____9301) {
        var G__9284__9302 = temp__4092__auto____9301;
        var G__9309 = cljs.core.first.call(null, G__9284__9302);
        var G__9310 = G__9284__9302;
        G__9287__9294 = G__9309;
        G__9284__9295 = G__9310;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9303 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9303.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9304 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9304.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9305 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9305.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9306 = this;
  return this__9306.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9307 = this;
  return this__9307.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9308 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9322__delegate = function(x, p__9311) {
      var map__9317__9318 = p__9311;
      var map__9317__9319 = cljs.core.seq_QMARK_.call(null, map__9317__9318) ? clojure.lang.PersistentHashMap.create.call(null, cljs.core.seq.call(null, map__9317__9318)) : map__9317__9318;
      var validator__9320 = cljs.core._lookup.call(null, map__9317__9319, "\ufdd0'validator", null);
      var meta__9321 = cljs.core._lookup.call(null, map__9317__9319, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9321, validator__9320, null)
    };
    var G__9322 = function(x, var_args) {
      var p__9311 = null;
      if(goog.isDef(var_args)) {
        p__9311 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9322__delegate.call(this, x, p__9311)
    };
    G__9322.cljs$lang$maxFixedArity = 1;
    G__9322.cljs$lang$applyTo = function(arglist__9323) {
      var x = cljs.core.first(arglist__9323);
      var p__9311 = cljs.core.rest(arglist__9323);
      return G__9322__delegate(x, p__9311)
    };
    G__9322.cljs$lang$arity$variadic = G__9322__delegate;
    return G__9322
  }();
  atom = function(x, var_args) {
    var p__9311 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto____9327 = a.validator;
  if(cljs.core.truth_(temp__4092__auto____9327)) {
    var validate__9328 = temp__4092__auto____9327;
    if(cljs.core.truth_(validate__9328.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6394, "\ufdd0'column", 13))))].join(""));
    }
  }else {
  }
  var old_value__9329 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9329, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9330__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9330 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9330__delegate.call(this, a, f, x, y, z, more)
    };
    G__9330.cljs$lang$maxFixedArity = 5;
    G__9330.cljs$lang$applyTo = function(arglist__9331) {
      var a = cljs.core.first(arglist__9331);
      var f = cljs.core.first(cljs.core.next(arglist__9331));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9331)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9331))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9331)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9331)))));
      return G__9330__delegate(a, f, x, y, z, more)
    };
    G__9330.cljs$lang$arity$variadic = G__9330__delegate;
    return G__9330
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9332) {
    var iref = cljs.core.first(arglist__9332);
    var f = cljs.core.first(cljs.core.next(arglist__9332));
    var args = cljs.core.rest(cljs.core.next(arglist__9332));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9333 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9333.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9334 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9334.state, function(p__9335) {
    var map__9336__9337 = p__9335;
    var map__9336__9338 = cljs.core.seq_QMARK_.call(null, map__9336__9337) ? clojure.lang.PersistentHashMap.create.call(null, cljs.core.seq.call(null, map__9336__9337)) : map__9336__9337;
    var curr_state__9339 = map__9336__9338;
    var done__9340 = cljs.core._lookup.call(null, map__9336__9338, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9340)) {
      return curr_state__9339
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9334.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9369__9370 = options;
    var map__9369__9371 = cljs.core.seq_QMARK_.call(null, map__9369__9370) ? clojure.lang.PersistentHashMap.create.call(null, cljs.core.seq.call(null, map__9369__9370)) : map__9369__9370;
    var keywordize_keys__9372 = cljs.core._lookup.call(null, map__9369__9371, "\ufdd0'keywordize-keys", null);
    var keyfn__9373 = cljs.core.truth_(keywordize_keys__9372) ? cljs.core.keyword : cljs.core.str;
    var f__9396 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2363__auto____9395 = function iter__9385(s__9386) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9386__9391 = s__9386;
                    while(true) {
                      var temp__4092__auto____9392 = cljs.core.seq.call(null, s__9386__9391);
                      if(temp__4092__auto____9392) {
                        var xs__4579__auto____9393 = temp__4092__auto____9392;
                        var k__9394 = cljs.core.first.call(null, xs__4579__auto____9393);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9373.call(null, k__9394), thisfn.call(null, x[k__9394])], true), iter__9385.call(null, cljs.core.rest.call(null, s__9386__9391)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2363__auto____9395.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9396.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9397) {
    var x = cljs.core.first(arglist__9397);
    var options = cljs.core.rest(arglist__9397);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9402 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9406__delegate = function(args) {
      var temp__4090__auto____9403 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9402), args, null);
      if(cljs.core.truth_(temp__4090__auto____9403)) {
        var v__9404 = temp__4090__auto____9403;
        return v__9404
      }else {
        var ret__9405 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9402, cljs.core.assoc, args, ret__9405);
        return ret__9405
      }
    };
    var G__9406 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9406__delegate.call(this, args)
    };
    G__9406.cljs$lang$maxFixedArity = 0;
    G__9406.cljs$lang$applyTo = function(arglist__9407) {
      var args = cljs.core.seq(arglist__9407);
      return G__9406__delegate(args)
    };
    G__9406.cljs$lang$arity$variadic = G__9406__delegate;
    return G__9406
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9409 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9409)) {
        var G__9410 = ret__9409;
        f = G__9410;
        continue
      }else {
        return ret__9409
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9411__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9411 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9411__delegate.call(this, f, args)
    };
    G__9411.cljs$lang$maxFixedArity = 1;
    G__9411.cljs$lang$applyTo = function(arglist__9412) {
      var f = cljs.core.first(arglist__9412);
      var args = cljs.core.rest(arglist__9412);
      return G__9411__delegate(f, args)
    };
    G__9411.cljs$lang$arity$variadic = G__9411__delegate;
    return G__9411
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9414 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9414, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9414, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto____9423 = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto____9423) {
      return or__3943__auto____9423
    }else {
      var or__3943__auto____9424 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____9424) {
        return or__3943__auto____9424
      }else {
        var and__3941__auto____9425 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto____9425) {
          var and__3941__auto____9426 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____9426) {
            var and__3941__auto____9427 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____9427) {
              var ret__9428 = true;
              var i__9429 = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____9430 = cljs.core.not.call(null, ret__9428);
                  if(or__3943__auto____9430) {
                    return or__3943__auto____9430
                  }else {
                    return i__9429 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9428
                }else {
                  var G__9431 = isa_QMARK_.call(null, h, child.call(null, i__9429), parent.call(null, i__9429));
                  var G__9432 = i__9429 + 1;
                  ret__9428 = G__9431;
                  i__9429 = G__9432;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____9427
            }
          }else {
            return and__3941__auto____9426
          }
        }else {
          return and__3941__auto____9425
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6678, "\ufdd0'column", 12))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6682, "\ufdd0'column", 12))))].join(""));
    }
    var tp__9441 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9442 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9443 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9444 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3943__auto____9445 = cljs.core.contains_QMARK_.call(null, tp__9441.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9443.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9443.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9441, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__9444.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9442, parent, ta__9443), "\ufdd0'descendants":tf__9444.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9443, tag, td__9442)})
    }();
    if(cljs.core.truth_(or__3943__auto____9445)) {
      return or__3943__auto____9445
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9450 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9451 = cljs.core.truth_(parentMap__9450.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9450.call(null, tag), parent) : cljs.core.set([]);
    var newParents__9452 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9451)) ? cljs.core.assoc.call(null, parentMap__9450, tag, childsParents__9451) : cljs.core.dissoc.call(null, parentMap__9450, tag);
    var deriv_seq__9453 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9433_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9433_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9433_SHARP_), cljs.core.second.call(null, p1__9433_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9452)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9450.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9434_SHARP_, p2__9435_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9434_SHARP_, p2__9435_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9453))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9461 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto____9463 = cljs.core.truth_(function() {
    var and__3941__auto____9462 = xprefs__9461;
    if(cljs.core.truth_(and__3941__auto____9462)) {
      return xprefs__9461.call(null, y)
    }else {
      return and__3941__auto____9462
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto____9463)) {
    return or__3943__auto____9463
  }else {
    var or__3943__auto____9465 = function() {
      var ps__9464 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9464) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9464), prefer_table))) {
          }else {
          }
          var G__9468 = cljs.core.rest.call(null, ps__9464);
          ps__9464 = G__9468;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____9465)) {
      return or__3943__auto____9465
    }else {
      var or__3943__auto____9467 = function() {
        var ps__9466 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9466) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9466), y, prefer_table))) {
            }else {
            }
            var G__9469 = cljs.core.rest.call(null, ps__9466);
            ps__9466 = G__9469;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____9467)) {
        return or__3943__auto____9467
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto____9471 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto____9471)) {
    return or__3943__auto____9471
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9489 = cljs.core.reduce.call(null, function(be, p__9481) {
    var vec__9482__9483 = p__9481;
    var k__9484 = cljs.core.nth.call(null, vec__9482__9483, 0, null);
    var ___9485 = cljs.core.nth.call(null, vec__9482__9483, 1, null);
    var e__9486 = vec__9482__9483;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9484)) {
      var be2__9488 = cljs.core.truth_(function() {
        var or__3943__auto____9487 = be == null;
        if(or__3943__auto____9487) {
          return or__3943__auto____9487
        }else {
          return cljs.core.dominates.call(null, k__9484, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9486 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9488), k__9484, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9484), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9488)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9488
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9489)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9489));
      return cljs.core.second.call(null, best_entry__9489)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto____9493 = mf;
    if(and__3941__auto____9493) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto____9493
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3943__auto____9494 = cljs.core._reset[goog.typeOf(mf)];
      if(or__3943__auto____9494) {
        return or__3943__auto____9494
      }else {
        var or__3943__auto____9495 = cljs.core._reset["_"];
        if(or__3943__auto____9495) {
          return or__3943__auto____9495
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto____9499 = mf;
    if(and__3941__auto____9499) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto____9499
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3943__auto____9500 = cljs.core._add_method[goog.typeOf(mf)];
      if(or__3943__auto____9500) {
        return or__3943__auto____9500
      }else {
        var or__3943__auto____9501 = cljs.core._add_method["_"];
        if(or__3943__auto____9501) {
          return or__3943__auto____9501
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____9505 = mf;
    if(and__3941__auto____9505) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto____9505
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3943__auto____9506 = cljs.core._remove_method[goog.typeOf(mf)];
      if(or__3943__auto____9506) {
        return or__3943__auto____9506
      }else {
        var or__3943__auto____9507 = cljs.core._remove_method["_"];
        if(or__3943__auto____9507) {
          return or__3943__auto____9507
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto____9511 = mf;
    if(and__3941__auto____9511) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto____9511
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3943__auto____9512 = cljs.core._prefer_method[goog.typeOf(mf)];
      if(or__3943__auto____9512) {
        return or__3943__auto____9512
      }else {
        var or__3943__auto____9513 = cljs.core._prefer_method["_"];
        if(or__3943__auto____9513) {
          return or__3943__auto____9513
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____9517 = mf;
    if(and__3941__auto____9517) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto____9517
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3943__auto____9518 = cljs.core._get_method[goog.typeOf(mf)];
      if(or__3943__auto____9518) {
        return or__3943__auto____9518
      }else {
        var or__3943__auto____9519 = cljs.core._get_method["_"];
        if(or__3943__auto____9519) {
          return or__3943__auto____9519
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto____9523 = mf;
    if(and__3941__auto____9523) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto____9523
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3943__auto____9524 = cljs.core._methods[goog.typeOf(mf)];
      if(or__3943__auto____9524) {
        return or__3943__auto____9524
      }else {
        var or__3943__auto____9525 = cljs.core._methods["_"];
        if(or__3943__auto____9525) {
          return or__3943__auto____9525
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto____9529 = mf;
    if(and__3941__auto____9529) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto____9529
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3943__auto____9530 = cljs.core._prefers[goog.typeOf(mf)];
      if(or__3943__auto____9530) {
        return or__3943__auto____9530
      }else {
        var or__3943__auto____9531 = cljs.core._prefers["_"];
        if(or__3943__auto____9531) {
          return or__3943__auto____9531
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto____9535 = mf;
    if(and__3941__auto____9535) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto____9535
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3943__auto____9536 = cljs.core._dispatch[goog.typeOf(mf)];
      if(or__3943__auto____9536) {
        return or__3943__auto____9536
      }else {
        var or__3943__auto____9537 = cljs.core._dispatch["_"];
        if(or__3943__auto____9537) {
          return or__3943__auto____9537
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__9540 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__9541 = cljs.core._get_method.call(null, mf, dispatch_val__9540);
  if(cljs.core.truth_(target_fn__9541)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__9540)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__9541, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9542 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__9543 = this;
  cljs.core.swap_BANG_.call(null, this__9543.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9543.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9543.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9543.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__9544 = this;
  cljs.core.swap_BANG_.call(null, this__9544.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__9544.method_cache, this__9544.method_table, this__9544.cached_hierarchy, this__9544.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__9545 = this;
  cljs.core.swap_BANG_.call(null, this__9545.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__9545.method_cache, this__9545.method_table, this__9545.cached_hierarchy, this__9545.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__9546 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__9546.cached_hierarchy), cljs.core.deref.call(null, this__9546.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__9546.method_cache, this__9546.method_table, this__9546.cached_hierarchy, this__9546.hierarchy)
  }
  var temp__4090__auto____9547 = cljs.core.deref.call(null, this__9546.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto____9547)) {
    var target_fn__9548 = temp__4090__auto____9547;
    return target_fn__9548
  }else {
    var temp__4090__auto____9549 = cljs.core.find_and_cache_best_method.call(null, this__9546.name, dispatch_val, this__9546.hierarchy, this__9546.method_table, this__9546.prefer_table, this__9546.method_cache, this__9546.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____9549)) {
      var target_fn__9550 = temp__4090__auto____9549;
      return target_fn__9550
    }else {
      return cljs.core.deref.call(null, this__9546.method_table).call(null, this__9546.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__9551 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__9551.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__9551.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__9551.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__9551.method_cache, this__9551.method_table, this__9551.cached_hierarchy, this__9551.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__9552 = this;
  return cljs.core.deref.call(null, this__9552.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__9553 = this;
  return cljs.core.deref.call(null, this__9553.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__9554 = this;
  return cljs.core.do_dispatch.call(null, mf, this__9554.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__9556__delegate = function(_, args) {
    var self__9555 = this;
    return cljs.core._dispatch.call(null, self__9555, args)
  };
  var G__9556 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__9556__delegate.call(this, _, args)
  };
  G__9556.cljs$lang$maxFixedArity = 1;
  G__9556.cljs$lang$applyTo = function(arglist__9557) {
    var _ = cljs.core.first(arglist__9557);
    var args = cljs.core.rest(arglist__9557);
    return G__9556__delegate(_, args)
  };
  G__9556.cljs$lang$arity$variadic = G__9556__delegate;
  return G__9556
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__9558 = this;
  return cljs.core._dispatch.call(null, self__9558, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9559 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_9561, _) {
  var this__9560 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__9560.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__9562 = this;
  return this__9562.uuid === other.uuid
};
cljs.core.UUID.prototype.toString = function() {
  var this__9563 = this;
  var this__9564 = this;
  return cljs.core.pr_str.call(null, this__9564)
};
cljs.core.UUID;
goog.provide("domina.support");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.dom");
var div__10601 = document.createElement("div");
var test_html__10602 = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";
div__10601.innerHTML = test_html__10602;
domina.support.leading_whitespace_QMARK_ = cljs.core._EQ_.call(null, div__10601.firstChild.nodeType, 3);
domina.support.extraneous_tbody_QMARK_ = cljs.core._EQ_.call(null, div__10601.getElementsByTagName("tbody").length, 0);
domina.support.unscoped_html_elements_QMARK_ = cljs.core._EQ_.call(null, div__10601.getElementsByTagName("link").length, 0);
goog.provide("goog.dom.xml");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.dom.xml.MAX_XML_SIZE_KB = 2 * 1024;
goog.dom.xml.MAX_ELEMENT_DEPTH = 256;
goog.dom.xml.createDocument = function(opt_rootTagName, opt_namespaceUri) {
  if(opt_namespaceUri && !opt_rootTagName) {
    throw Error("Can't create document with namespace and no root tag");
  }
  if(document.implementation && document.implementation.createDocument) {
    return document.implementation.createDocument(opt_namespaceUri || "", opt_rootTagName || "", null)
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      if(doc) {
        if(opt_rootTagName) {
          doc.appendChild(doc.createNode(goog.dom.NodeType.ELEMENT, opt_rootTagName, opt_namespaceUri || ""))
        }
        return doc
      }
    }
  }
  throw Error("Your browser does not support creating new documents");
};
goog.dom.xml.loadXml = function(xml) {
  if(typeof DOMParser != "undefined") {
    return(new DOMParser).parseFromString(xml, "application/xml")
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      doc.loadXML(xml);
      return doc
    }
  }
  throw Error("Your browser does not support loading xml documents");
};
goog.dom.xml.serialize = function(xml) {
  if(typeof XMLSerializer != "undefined") {
    return(new XMLSerializer).serializeToString(xml)
  }
  var text = xml.xml;
  if(text) {
    return text
  }
  throw Error("Your browser does not support serializing XML documents");
};
goog.dom.xml.selectSingleNode = function(node, path) {
  if(typeof node.selectSingleNode != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectSingleNode(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var result = doc.evaluate(path, node, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue
    }
  }
  return null
};
goog.dom.xml.selectNodes = function(node, path) {
  if(typeof node.selectNodes != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectNodes(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var nodes = doc.evaluate(path, node, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var results = [];
      var count = nodes.snapshotLength;
      for(var i = 0;i < count;i++) {
        results.push(nodes.snapshotItem(i))
      }
      return results
    }else {
      return[]
    }
  }
};
goog.dom.xml.createMsXmlDocument_ = function() {
  var doc = new ActiveXObject("MSXML2.DOMDocument");
  if(doc) {
    doc.resolveExternals = false;
    doc.validateOnParse = false;
    try {
      doc.setProperty("ProhibitDTD", true);
      doc.setProperty("MaxXMLSize", goog.dom.xml.MAX_XML_SIZE_KB);
      doc.setProperty("MaxElementDepth", goog.dom.xml.MAX_ELEMENT_DEPTH)
    }catch(e) {
    }
  }
  return doc
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.dom.forms");
goog.require("goog.structs.Map");
goog.dom.forms.getFormDataMap = function(form) {
  var map = new goog.structs.Map;
  goog.dom.forms.getFormDataHelper_(form, map, goog.dom.forms.addFormDataToMap_);
  return map
};
goog.dom.forms.getFormDataString = function(form) {
  var sb = [];
  goog.dom.forms.getFormDataHelper_(form, sb, goog.dom.forms.addFormDataToStringBuffer_);
  return sb.join("&")
};
goog.dom.forms.getFormDataHelper_ = function(form, result, fnAppend) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(el.disabled || el.tagName.toLowerCase() == "fieldset") {
      continue
    }
    var name = el.name;
    var type = el.type.toLowerCase();
    switch(type) {
      case "file":
      ;
      case "submit":
      ;
      case "reset":
      ;
      case "button":
        break;
      case "select-multiple":
        var values = goog.dom.forms.getValue(el);
        if(values != null) {
          for(var value, j = 0;value = values[j];j++) {
            fnAppend(result, name, value)
          }
        }
        break;
      default:
        var value = goog.dom.forms.getValue(el);
        if(value != null) {
          fnAppend(result, name, value)
        }
    }
  }
  var inputs = form.getElementsByTagName("input");
  for(var input, i = 0;input = inputs[i];i++) {
    if(input.form == form && input.type.toLowerCase() == "image") {
      name = input.name;
      fnAppend(result, name, input.value);
      fnAppend(result, name + ".x", "0");
      fnAppend(result, name + ".y", "0")
    }
  }
};
goog.dom.forms.addFormDataToMap_ = function(map, name, value) {
  var array = map.get(name);
  if(!array) {
    array = [];
    map.set(name, array)
  }
  array.push(value)
};
goog.dom.forms.addFormDataToStringBuffer_ = function(sb, name, value) {
  sb.push(encodeURIComponent(name) + "=" + encodeURIComponent(value))
};
goog.dom.forms.hasFileInput = function(form) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(!el.disabled && el.type && el.type.toLowerCase() == "file") {
      return true
    }
  }
  return false
};
goog.dom.forms.setDisabled = function(el, disabled) {
  if(el.tagName == "FORM") {
    var els = el.elements;
    for(var i = 0;el = els[i];i++) {
      goog.dom.forms.setDisabled(el, disabled)
    }
  }else {
    if(disabled == true) {
      el.blur()
    }
    el.disabled = disabled
  }
};
goog.dom.forms.focusAndSelect = function(el) {
  el.focus();
  if(el.select) {
    el.select()
  }
};
goog.dom.forms.hasValue = function(el) {
  var value = goog.dom.forms.getValue(el);
  return!!value
};
goog.dom.forms.hasValueByName = function(form, name) {
  var value = goog.dom.forms.getValueByName(form, name);
  return!!value
};
goog.dom.forms.getValue = function(el) {
  var type = el.type;
  if(!goog.isDef(type)) {
    return null
  }
  switch(type.toLowerCase()) {
    case "checkbox":
    ;
    case "radio":
      return goog.dom.forms.getInputChecked_(el);
    case "select-one":
      return goog.dom.forms.getSelectSingle_(el);
    case "select-multiple":
      return goog.dom.forms.getSelectMultiple_(el);
    default:
      return goog.isDef(el.value) ? el.value : null
  }
};
goog.dom.$F = goog.dom.forms.getValue;
goog.dom.forms.getValueByName = function(form, name) {
  var els = form.elements[name];
  if(els.type) {
    return goog.dom.forms.getValue(els)
  }else {
    for(var i = 0;i < els.length;i++) {
      var val = goog.dom.forms.getValue(els[i]);
      if(val) {
        return val
      }
    }
    return null
  }
};
goog.dom.forms.getInputChecked_ = function(el) {
  return el.checked ? el.value : null
};
goog.dom.forms.getSelectSingle_ = function(el) {
  var selectedIndex = el.selectedIndex;
  return selectedIndex >= 0 ? el.options[selectedIndex].value : null
};
goog.dom.forms.getSelectMultiple_ = function(el) {
  var values = [];
  for(var option, i = 0;option = el.options[i];i++) {
    if(option.selected) {
      values.push(option.value)
    }
  }
  return values.length ? values : null
};
goog.dom.forms.setValue = function(el, opt_value) {
  var type = el.type;
  if(goog.isDef(type)) {
    switch(type.toLowerCase()) {
      case "checkbox":
      ;
      case "radio":
        goog.dom.forms.setInputChecked_(el, opt_value);
        break;
      case "select-one":
        goog.dom.forms.setSelectSingle_(el, opt_value);
        break;
      case "select-multiple":
        goog.dom.forms.setSelectMultiple_(el, opt_value);
        break;
      default:
        el.value = goog.isDefAndNotNull(opt_value) ? opt_value : ""
    }
  }
};
goog.dom.forms.setInputChecked_ = function(el, opt_value) {
  el.checked = opt_value ? "checked" : null
};
goog.dom.forms.setSelectSingle_ = function(el, opt_value) {
  el.selectedIndex = -1;
  if(goog.isString(opt_value)) {
    for(var option, i = 0;option = el.options[i];i++) {
      if(option.value == opt_value) {
        option.selected = true;
        break
      }
    }
  }
};
goog.dom.forms.setSelectMultiple_ = function(el, opt_value) {
  if(goog.isString(opt_value)) {
    opt_value = [opt_value]
  }
  for(var option, i = 0;option = el.options[i];i++) {
    option.selected = false;
    if(opt_value) {
      for(var value, j = 0;value = opt_value[j];j++) {
        if(option.value == value) {
          option.selected = true
        }
      }
    }
  }
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__10609 = s;
      var limit__10610 = limit;
      var parts__10611 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__10610, 1)) {
          return cljs.core.conj.call(null, parts__10611, s__10609)
        }else {
          var temp__4090__auto____10612 = cljs.core.re_find.call(null, re, s__10609);
          if(cljs.core.truth_(temp__4090__auto____10612)) {
            var m__10613 = temp__4090__auto____10612;
            var index__10614 = s__10609.indexOf(m__10613);
            var G__10615 = s__10609.substring(index__10614 + cljs.core.count.call(null, m__10613));
            var G__10616 = limit__10610 - 1;
            var G__10617 = cljs.core.conj.call(null, parts__10611, s__10609.substring(0, index__10614));
            s__10609 = G__10615;
            limit__10610 = G__10616;
            parts__10611 = G__10617;
            continue
          }else {
            return cljs.core.conj.call(null, parts__10611, s__10609)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__10621 = s.length;
  while(true) {
    if(index__10621 === 0) {
      return""
    }else {
      var ch__10622 = cljs.core._lookup.call(null, s, index__10621 - 1, null);
      if(function() {
        var or__3943__auto____10623 = cljs.core._EQ_.call(null, ch__10622, "\n");
        if(or__3943__auto____10623) {
          return or__3943__auto____10623
        }else {
          return cljs.core._EQ_.call(null, ch__10622, "\r")
        }
      }()) {
        var G__10624 = index__10621 - 1;
        index__10621 = G__10624;
        continue
      }else {
        return s.substring(0, index__10621)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__10628 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3943__auto____10629 = cljs.core.not.call(null, s__10628);
    if(or__3943__auto____10629) {
      return or__3943__auto____10629
    }else {
      var or__3943__auto____10630 = cljs.core._EQ_.call(null, "", s__10628);
      if(or__3943__auto____10630) {
        return or__3943__auto____10630
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__10628)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__10637 = new goog.string.StringBuffer;
  var length__10638 = s.length;
  var index__10639 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__10638, index__10639)) {
      return buffer__10637.toString()
    }else {
      var ch__10640 = s.charAt(index__10639);
      var temp__4090__auto____10641 = cljs.core._lookup.call(null, cmap, ch__10640, null);
      if(cljs.core.truth_(temp__4090__auto____10641)) {
        var replacement__10642 = temp__4090__auto____10641;
        buffer__10637.append([cljs.core.str(replacement__10642)].join(""))
      }else {
        buffer__10637.append(ch__10640)
      }
      var G__10643 = index__10639 + 1;
      index__10639 = G__10643;
      continue
    }
    break
  }
};
goog.provide("domina");
goog.require("cljs.core");
goog.require("domina.support");
goog.require("goog.dom.classes");
goog.require("goog.events");
goog.require("goog.dom.xml");
goog.require("goog.dom.forms");
goog.require("goog.dom");
goog.require("goog.string");
goog.require("clojure.string");
goog.require("goog.style");
goog.require("cljs.core");
domina.re_html = /<|&#?\w+;/;
domina.re_leading_whitespace = /^\s+/;
domina.re_xhtml_tag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/i;
domina.re_tag_name = /<([\w:]+)/;
domina.re_no_inner_html = /<(?:script|style)/i;
domina.re_tbody = /<tbody/i;
var opt_wrapper__10198 = cljs.core.PersistentVector.fromArray([1, "<select multiple='multiple'>", "</select>"], true);
var table_section_wrapper__10199 = cljs.core.PersistentVector.fromArray([1, "<table>", "</table>"], true);
var cell_wrapper__10200 = cljs.core.PersistentVector.fromArray([3, "<table><tbody><tr>", "</tr></tbody></table>"], true);
domina.wrap_map = cljs.core.ObjMap.fromObject(["col", "\ufdd0'default", "tfoot", "caption", "optgroup", "legend", "area", "td", "thead", "th", "option", "tbody", "tr", "colgroup"], {"col":cljs.core.PersistentVector.fromArray([2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], true), "\ufdd0'default":cljs.core.PersistentVector.fromArray([0, "", ""], true), "tfoot":table_section_wrapper__10199, "caption":table_section_wrapper__10199, "optgroup":opt_wrapper__10198, "legend":cljs.core.PersistentVector.fromArray([1, 
"<fieldset>", "</fieldset>"], true), "area":cljs.core.PersistentVector.fromArray([1, "<map>", "</map>"], true), "td":cell_wrapper__10200, "thead":table_section_wrapper__10199, "th":cell_wrapper__10200, "option":opt_wrapper__10198, "tbody":table_section_wrapper__10199, "tr":cljs.core.PersistentVector.fromArray([2, "<table><tbody>", "</tbody></table>"], true), "colgroup":table_section_wrapper__10199});
domina.remove_extraneous_tbody_BANG_ = function remove_extraneous_tbody_BANG_(div, html) {
  var no_tbody_QMARK___10213 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_tbody, html));
  var tbody__10217 = function() {
    var and__3941__auto____10214 = cljs.core._EQ_.call(null, domina.tag_name, "table");
    if(and__3941__auto____10214) {
      return no_tbody_QMARK___10213
    }else {
      return and__3941__auto____10214
    }
  }() ? function() {
    var and__3941__auto____10215 = div.firstChild;
    if(cljs.core.truth_(and__3941__auto____10215)) {
      return div.firstChild.childNodes
    }else {
      return and__3941__auto____10215
    }
  }() : function() {
    var and__3941__auto____10216 = cljs.core._EQ_.call(null, domina.start_wrap, "<table>");
    if(and__3941__auto____10216) {
      return no_tbody_QMARK___10213
    }else {
      return and__3941__auto____10216
    }
  }() ? divchildNodes : cljs.core.PersistentVector.EMPTY;
  var G__10218__10219 = cljs.core.seq.call(null, tbody__10217);
  if(G__10218__10219) {
    var child__10220 = cljs.core.first.call(null, G__10218__10219);
    var G__10218__10221 = G__10218__10219;
    while(true) {
      if(function() {
        var and__3941__auto____10222 = cljs.core._EQ_.call(null, child__10220.nodeName, "tbody");
        if(and__3941__auto____10222) {
          return cljs.core._EQ_.call(null, child__10220.childNodes.length, 0)
        }else {
          return and__3941__auto____10222
        }
      }()) {
        child__10220.parentNode.removeChild(child__10220)
      }else {
      }
      var temp__4092__auto____10223 = cljs.core.next.call(null, G__10218__10221);
      if(temp__4092__auto____10223) {
        var G__10218__10224 = temp__4092__auto____10223;
        var G__10225 = cljs.core.first.call(null, G__10218__10224);
        var G__10226 = G__10218__10224;
        child__10220 = G__10225;
        G__10218__10221 = G__10226;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
domina.restore_leading_whitespace_BANG_ = function restore_leading_whitespace_BANG_(div, html) {
  return div.insertBefore(document.createTextNode(cljs.core.first.call(null, cljs.core.re_find.call(null, domina.re_leading_whitespace, html))), div.firstChild)
};
domina.html_to_dom = function html_to_dom(html) {
  var html__10240 = clojure.string.replace.call(null, html, domina.re_xhtml_tag, "<$1></$2>");
  var tag_name__10241 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html__10240)))].join("").toLowerCase();
  var vec__10239__10242 = cljs.core._lookup.call(null, domina.wrap_map, tag_name__10241, (new cljs.core.Keyword("\ufdd0'default")).call(null, domina.wrap_map));
  var depth__10243 = cljs.core.nth.call(null, vec__10239__10242, 0, null);
  var start_wrap__10244 = cljs.core.nth.call(null, vec__10239__10242, 1, null);
  var end_wrap__10245 = cljs.core.nth.call(null, vec__10239__10242, 2, null);
  var div__10249 = function() {
    var wrapper__10247 = function() {
      var div__10246 = document.createElement("div");
      div__10246.innerHTML = [cljs.core.str(start_wrap__10244), cljs.core.str(html__10240), cljs.core.str(end_wrap__10245)].join("");
      return div__10246
    }();
    var level__10248 = depth__10243;
    while(true) {
      if(level__10248 > 0) {
        var G__10251 = wrapper__10247.lastChild;
        var G__10252 = level__10248 - 1;
        wrapper__10247 = G__10251;
        level__10248 = G__10252;
        continue
      }else {
        return wrapper__10247
      }
      break
    }
  }();
  if(cljs.core.truth_(domina.support.extraneous_tbody_QMARK_)) {
    domina.remove_extraneous_tbody_BANG_.call(null, div__10249, html__10240)
  }else {
  }
  if(cljs.core.truth_(function() {
    var and__3941__auto____10250 = cljs.core.not.call(null, domina.support.leading_whitespace_QMARK_);
    if(and__3941__auto____10250) {
      return cljs.core.re_find.call(null, domina.re_leading_whitespace, html__10240)
    }else {
      return and__3941__auto____10250
    }
  }())) {
    domina.restore_leading_whitespace_BANG_.call(null, div__10249, html__10240)
  }else {
  }
  return div__10249.childNodes
};
domina.string_to_dom = function string_to_dom(s) {
  if(cljs.core.truth_(cljs.core.re_find.call(null, domina.re_html, s))) {
    return domina.html_to_dom.call(null, s)
  }else {
    return document.createTextNode(s)
  }
};
void 0;
domina.DomContent = {};
domina.nodes = function nodes(content) {
  if(function() {
    var and__3941__auto____10256 = content;
    if(and__3941__auto____10256) {
      return content.domina$DomContent$nodes$arity$1
    }else {
      return and__3941__auto____10256
    }
  }()) {
    return content.domina$DomContent$nodes$arity$1(content)
  }else {
    return function() {
      var or__3943__auto____10257 = domina.nodes[goog.typeOf(content)];
      if(or__3943__auto____10257) {
        return or__3943__auto____10257
      }else {
        var or__3943__auto____10258 = domina.nodes["_"];
        if(or__3943__auto____10258) {
          return or__3943__auto____10258
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.nodes", content);
        }
      }
    }().call(null, content)
  }
};
domina.single_node = function single_node(nodeseq) {
  if(function() {
    var and__3941__auto____10262 = nodeseq;
    if(and__3941__auto____10262) {
      return nodeseq.domina$DomContent$single_node$arity$1
    }else {
      return and__3941__auto____10262
    }
  }()) {
    return nodeseq.domina$DomContent$single_node$arity$1(nodeseq)
  }else {
    return function() {
      var or__3943__auto____10263 = domina.single_node[goog.typeOf(nodeseq)];
      if(or__3943__auto____10263) {
        return or__3943__auto____10263
      }else {
        var or__3943__auto____10264 = domina.single_node["_"];
        if(or__3943__auto____10264) {
          return or__3943__auto____10264
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.single-node", nodeseq);
        }
      }
    }().call(null, nodeseq)
  }
};
void 0;
domina._STAR_debug_STAR_ = true;
domina.log_debug = function() {
  var log_debug__delegate = function(mesg) {
    if(cljs.core.truth_(function() {
      var and__3941__auto____10266 = domina._STAR_debug_STAR_;
      if(cljs.core.truth_(and__3941__auto____10266)) {
        return!cljs.core._EQ_.call(null, window.console, undefined)
      }else {
        return and__3941__auto____10266
      }
    }())) {
      return console.log(cljs.core.apply.call(null, cljs.core.str, mesg))
    }else {
      return null
    }
  };
  var log_debug = function(var_args) {
    var mesg = null;
    if(goog.isDef(var_args)) {
      mesg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log_debug__delegate.call(this, mesg)
  };
  log_debug.cljs$lang$maxFixedArity = 0;
  log_debug.cljs$lang$applyTo = function(arglist__10267) {
    var mesg = cljs.core.seq(arglist__10267);
    return log_debug__delegate(mesg)
  };
  log_debug.cljs$lang$arity$variadic = log_debug__delegate;
  return log_debug
}();
domina.log = function() {
  var log__delegate = function(mesg) {
    if(cljs.core.truth_(window.console)) {
      return console.log(cljs.core.apply.call(null, cljs.core.str, mesg))
    }else {
      return null
    }
  };
  var log = function(var_args) {
    var mesg = null;
    if(goog.isDef(var_args)) {
      mesg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, mesg)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__10268) {
    var mesg = cljs.core.seq(arglist__10268);
    return log__delegate(mesg)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
domina.by_id = function by_id(id) {
  return goog.dom.getElement(cljs.core.name.call(null, id))
};
void 0;
domina.by_class = function by_class(class_name) {
  if(void 0 === domina.t10276) {
    domina.t10276 = function(class_name, by_class, meta10277) {
      this.class_name = class_name;
      this.by_class = by_class;
      this.meta10277 = meta10277;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    domina.t10276.cljs$lang$type = true;
    domina.t10276.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
      return cljs.core.list.call(null, "domina/t10276")
    };
    domina.t10276.prototype.domina$DomContent$ = true;
    domina.t10276.prototype.domina$DomContent$nodes$arity$1 = function(_) {
      var this__10279 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementsByClass(cljs.core.name.call(null, this__10279.class_name)))
    };
    domina.t10276.prototype.domina$DomContent$single_node$arity$1 = function(_) {
      var this__10280 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementByClass(cljs.core.name.call(null, this__10280.class_name)))
    };
    domina.t10276.prototype.cljs$core$IMeta$_meta$arity$1 = function(_10278) {
      var this__10281 = this;
      return this__10281.meta10277
    };
    domina.t10276.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_10278, meta10277) {
      var this__10282 = this;
      return new domina.t10276(this__10282.class_name, this__10282.by_class, meta10277)
    };
    domina.t10276
  }else {
  }
  return new domina.t10276(class_name, by_class, null)
};
domina.children = function children(content) {
  return cljs.core.doall.call(null, cljs.core.mapcat.call(null, goog.dom.getChildren, domina.nodes.call(null, content)))
};
domina.clone = function clone(content) {
  return cljs.core.map.call(null, function(p1__10283_SHARP_) {
    return p1__10283_SHARP_.cloneNode(true)
  }, domina.nodes.call(null, content))
};
void 0;
domina.append_BANG_ = function append_BANG_(parent_content, child_content) {
  domina.apply_with_cloning.call(null, goog.dom.appendChild, parent_content, child_content);
  return parent_content
};
domina.insert_BANG_ = function insert_BANG_(parent_content, child_content, idx) {
  domina.apply_with_cloning.call(null, function(p1__10284_SHARP_, p2__10285_SHARP_) {
    return goog.dom.insertChildAt(p1__10284_SHARP_, p2__10285_SHARP_, idx)
  }, parent_content, child_content);
  return parent_content
};
domina.prepend_BANG_ = function prepend_BANG_(parent_content, child_content) {
  domina.insert_BANG_.call(null, parent_content, child_content, 0);
  return parent_content
};
domina.insert_before_BANG_ = function insert_before_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10287_SHARP_, p2__10286_SHARP_) {
    return goog.dom.insertSiblingBefore(p2__10286_SHARP_, p1__10287_SHARP_)
  }, content, new_content);
  return content
};
domina.insert_after_BANG_ = function insert_after_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10289_SHARP_, p2__10288_SHARP_) {
    return goog.dom.insertSiblingAfter(p2__10288_SHARP_, p1__10289_SHARP_)
  }, content, new_content);
  return content
};
domina.swap_content_BANG_ = function swap_content_BANG_(old_content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10291_SHARP_, p2__10290_SHARP_) {
    return goog.dom.replaceNode(p2__10290_SHARP_, p1__10291_SHARP_)
  }, old_content, new_content);
  return old_content
};
domina.detach_BANG_ = function detach_BANG_(content) {
  return cljs.core.doall.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_BANG_ = function destroy_BANG_(content) {
  return cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_children_BANG_ = function destroy_children_BANG_(content) {
  cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeChildren, domina.nodes.call(null, content)));
  return content
};
domina.style = function style(content, name) {
  var s__10293 = goog.style.getStyle(domina.single_node.call(null, content), cljs.core.name.call(null, name));
  if(cljs.core.truth_(clojure.string.blank_QMARK_.call(null, s__10293))) {
    return null
  }else {
    return s__10293
  }
};
domina.attr = function attr(content, name) {
  return domina.single_node.call(null, content).getAttribute(cljs.core.name.call(null, name))
};
domina.set_style_BANG_ = function() {
  var set_style_BANG___delegate = function(content, name, value) {
    var G__10300__10301 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__10300__10301) {
      var n__10302 = cljs.core.first.call(null, G__10300__10301);
      var G__10300__10303 = G__10300__10301;
      while(true) {
        goog.style.setStyle(n__10302, cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__4092__auto____10304 = cljs.core.next.call(null, G__10300__10303);
        if(temp__4092__auto____10304) {
          var G__10300__10305 = temp__4092__auto____10304;
          var G__10306 = cljs.core.first.call(null, G__10300__10305);
          var G__10307 = G__10300__10305;
          n__10302 = G__10306;
          G__10300__10303 = G__10307;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return content
  };
  var set_style_BANG_ = function(content, name, var_args) {
    var value = null;
    if(goog.isDef(var_args)) {
      value = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return set_style_BANG___delegate.call(this, content, name, value)
  };
  set_style_BANG_.cljs$lang$maxFixedArity = 2;
  set_style_BANG_.cljs$lang$applyTo = function(arglist__10308) {
    var content = cljs.core.first(arglist__10308);
    var name = cljs.core.first(cljs.core.next(arglist__10308));
    var value = cljs.core.rest(cljs.core.next(arglist__10308));
    return set_style_BANG___delegate(content, name, value)
  };
  set_style_BANG_.cljs$lang$arity$variadic = set_style_BANG___delegate;
  return set_style_BANG_
}();
domina.set_attr_BANG_ = function() {
  var set_attr_BANG___delegate = function(content, name, value) {
    var G__10315__10316 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__10315__10316) {
      var n__10317 = cljs.core.first.call(null, G__10315__10316);
      var G__10315__10318 = G__10315__10316;
      while(true) {
        n__10317.setAttribute(cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__4092__auto____10319 = cljs.core.next.call(null, G__10315__10318);
        if(temp__4092__auto____10319) {
          var G__10315__10320 = temp__4092__auto____10319;
          var G__10321 = cljs.core.first.call(null, G__10315__10320);
          var G__10322 = G__10315__10320;
          n__10317 = G__10321;
          G__10315__10318 = G__10322;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return content
  };
  var set_attr_BANG_ = function(content, name, var_args) {
    var value = null;
    if(goog.isDef(var_args)) {
      value = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return set_attr_BANG___delegate.call(this, content, name, value)
  };
  set_attr_BANG_.cljs$lang$maxFixedArity = 2;
  set_attr_BANG_.cljs$lang$applyTo = function(arglist__10323) {
    var content = cljs.core.first(arglist__10323);
    var name = cljs.core.first(cljs.core.next(arglist__10323));
    var value = cljs.core.rest(cljs.core.next(arglist__10323));
    return set_attr_BANG___delegate(content, name, value)
  };
  set_attr_BANG_.cljs$lang$arity$variadic = set_attr_BANG___delegate;
  return set_attr_BANG_
}();
domina.remove_attr_BANG_ = function remove_attr_BANG_(content, name) {
  var G__10330__10331 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10330__10331) {
    var n__10332 = cljs.core.first.call(null, G__10330__10331);
    var G__10330__10333 = G__10330__10331;
    while(true) {
      n__10332.removeAttribute(cljs.core.name.call(null, name));
      var temp__4092__auto____10334 = cljs.core.next.call(null, G__10330__10333);
      if(temp__4092__auto____10334) {
        var G__10330__10335 = temp__4092__auto____10334;
        var G__10336 = cljs.core.first.call(null, G__10330__10335);
        var G__10337 = G__10330__10335;
        n__10332 = G__10336;
        G__10330__10333 = G__10337;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.parse_style_attributes = function parse_style_attributes(style) {
  return cljs.core.reduce.call(null, function(acc, pair) {
    var vec__10343__10344 = pair.split(/\s*:\s*/);
    var k__10345 = cljs.core.nth.call(null, vec__10343__10344, 0, null);
    var v__10346 = cljs.core.nth.call(null, vec__10343__10344, 1, null);
    if(cljs.core.truth_(function() {
      var and__3941__auto____10347 = k__10345;
      if(cljs.core.truth_(and__3941__auto____10347)) {
        return v__10346
      }else {
        return and__3941__auto____10347
      }
    }())) {
      return cljs.core.assoc.call(null, acc, cljs.core.keyword.call(null, k__10345.toLowerCase()), v__10346)
    }else {
      return acc
    }
  }, cljs.core.ObjMap.EMPTY, style.split(/\s*;\s*/))
};
domina.styles = function styles(content) {
  var style__10350 = domina.attr.call(null, content, "style");
  if(cljs.core.string_QMARK_.call(null, style__10350)) {
    return domina.parse_style_attributes.call(null, style__10350)
  }else {
    if(cljs.core.truth_(style__10350.cssText)) {
      return domina.parse_style_attributes.call(null, style__10350.cssText)
    }else {
      return null
    }
  }
};
domina.attrs = function attrs(content) {
  var node__10356 = domina.single_node.call(null, content);
  var attrs__10357 = node__10356.attributes;
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.filter.call(null, cljs.core.complement.call(null, cljs.core.nil_QMARK_), cljs.core.map.call(null, function(p1__10348_SHARP_) {
    var attr__10358 = attrs__10357.item(p1__10348_SHARP_);
    var value__10359 = attr__10358.nodeValue;
    if(function() {
      var and__3941__auto____10360 = cljs.core.not_EQ_.call(null, null, value__10359);
      if(and__3941__auto____10360) {
        return cljs.core.not_EQ_.call(null, "", value__10359)
      }else {
        return and__3941__auto____10360
      }
    }()) {
      return cljs.core.PersistentArrayMap.fromArrays([cljs.core.keyword.call(null, attr__10358.nodeName.toLowerCase())], [attr__10358.nodeValue])
    }else {
      return null
    }
  }, cljs.core.range.call(null, attrs__10357.length))))
};
domina.set_styles_BANG_ = function set_styles_BANG_(content, styles) {
  var G__10380__10381 = cljs.core.seq.call(null, styles);
  if(G__10380__10381) {
    var G__10383__10385 = cljs.core.first.call(null, G__10380__10381);
    var vec__10384__10386 = G__10383__10385;
    var name__10387 = cljs.core.nth.call(null, vec__10384__10386, 0, null);
    var value__10388 = cljs.core.nth.call(null, vec__10384__10386, 1, null);
    var G__10380__10389 = G__10380__10381;
    var G__10383__10390 = G__10383__10385;
    var G__10380__10391 = G__10380__10389;
    while(true) {
      var vec__10392__10393 = G__10383__10390;
      var name__10394 = cljs.core.nth.call(null, vec__10392__10393, 0, null);
      var value__10395 = cljs.core.nth.call(null, vec__10392__10393, 1, null);
      var G__10380__10396 = G__10380__10391;
      domina.set_style_BANG_.call(null, content, name__10394, value__10395);
      var temp__4092__auto____10397 = cljs.core.next.call(null, G__10380__10396);
      if(temp__4092__auto____10397) {
        var G__10380__10398 = temp__4092__auto____10397;
        var G__10399 = cljs.core.first.call(null, G__10380__10398);
        var G__10400 = G__10380__10398;
        G__10383__10390 = G__10399;
        G__10380__10391 = G__10400;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.set_attrs_BANG_ = function set_attrs_BANG_(content, attrs) {
  var G__10420__10421 = cljs.core.seq.call(null, attrs);
  if(G__10420__10421) {
    var G__10423__10425 = cljs.core.first.call(null, G__10420__10421);
    var vec__10424__10426 = G__10423__10425;
    var name__10427 = cljs.core.nth.call(null, vec__10424__10426, 0, null);
    var value__10428 = cljs.core.nth.call(null, vec__10424__10426, 1, null);
    var G__10420__10429 = G__10420__10421;
    var G__10423__10430 = G__10423__10425;
    var G__10420__10431 = G__10420__10429;
    while(true) {
      var vec__10432__10433 = G__10423__10430;
      var name__10434 = cljs.core.nth.call(null, vec__10432__10433, 0, null);
      var value__10435 = cljs.core.nth.call(null, vec__10432__10433, 1, null);
      var G__10420__10436 = G__10420__10431;
      domina.set_attr_BANG_.call(null, content, name__10434, value__10435);
      var temp__4092__auto____10437 = cljs.core.next.call(null, G__10420__10436);
      if(temp__4092__auto____10437) {
        var G__10420__10438 = temp__4092__auto____10437;
        var G__10439 = cljs.core.first.call(null, G__10420__10438);
        var G__10440 = G__10420__10438;
        G__10423__10430 = G__10439;
        G__10420__10431 = G__10440;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.has_class_QMARK_ = function has_class_QMARK_(content, class$) {
  return goog.dom.classes.has(domina.single_node.call(null, content), class$)
};
domina.add_class_BANG_ = function add_class_BANG_(content, class$) {
  var G__10447__10448 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10447__10448) {
    var node__10449 = cljs.core.first.call(null, G__10447__10448);
    var G__10447__10450 = G__10447__10448;
    while(true) {
      goog.dom.classes.add(node__10449, class$);
      var temp__4092__auto____10451 = cljs.core.next.call(null, G__10447__10450);
      if(temp__4092__auto____10451) {
        var G__10447__10452 = temp__4092__auto____10451;
        var G__10453 = cljs.core.first.call(null, G__10447__10452);
        var G__10454 = G__10447__10452;
        node__10449 = G__10453;
        G__10447__10450 = G__10454;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.remove_class_BANG_ = function remove_class_BANG_(content, class$) {
  var G__10461__10462 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10461__10462) {
    var node__10463 = cljs.core.first.call(null, G__10461__10462);
    var G__10461__10464 = G__10461__10462;
    while(true) {
      goog.dom.classes.remove(node__10463, class$);
      var temp__4092__auto____10465 = cljs.core.next.call(null, G__10461__10464);
      if(temp__4092__auto____10465) {
        var G__10461__10466 = temp__4092__auto____10465;
        var G__10467 = cljs.core.first.call(null, G__10461__10466);
        var G__10468 = G__10461__10466;
        node__10463 = G__10467;
        G__10461__10464 = G__10468;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.classes = function classes(content) {
  return cljs.core.seq.call(null, goog.dom.classes.get(domina.single_node.call(null, content)))
};
domina.set_classes_BANG_ = function set_classes_BANG_(content, classes) {
  var classes__10476 = cljs.core.coll_QMARK_.call(null, classes) ? clojure.string.join.call(null, " ", classes) : classes;
  var G__10477__10478 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10477__10478) {
    var node__10479 = cljs.core.first.call(null, G__10477__10478);
    var G__10477__10480 = G__10477__10478;
    while(true) {
      goog.dom.classes.set(node__10479, classes__10476);
      var temp__4092__auto____10481 = cljs.core.next.call(null, G__10477__10480);
      if(temp__4092__auto____10481) {
        var G__10477__10482 = temp__4092__auto____10481;
        var G__10483 = cljs.core.first.call(null, G__10477__10482);
        var G__10484 = G__10477__10482;
        node__10479 = G__10483;
        G__10477__10480 = G__10484;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.text = function text(content) {
  return goog.string.trim(goog.dom.getTextContent(domina.single_node.call(null, content)))
};
domina.set_text_BANG_ = function set_text_BANG_(content, value) {
  var G__10491__10492 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10491__10492) {
    var node__10493 = cljs.core.first.call(null, G__10491__10492);
    var G__10491__10494 = G__10491__10492;
    while(true) {
      goog.dom.setTextContent(node__10493, value);
      var temp__4092__auto____10495 = cljs.core.next.call(null, G__10491__10494);
      if(temp__4092__auto____10495) {
        var G__10491__10496 = temp__4092__auto____10495;
        var G__10497 = cljs.core.first.call(null, G__10491__10496);
        var G__10498 = G__10491__10496;
        node__10493 = G__10497;
        G__10491__10494 = G__10498;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.value = function value(content) {
  return goog.dom.forms.getValue(domina.single_node.call(null, content))
};
domina.set_value_BANG_ = function set_value_BANG_(content, value) {
  var G__10505__10506 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10505__10506) {
    var node__10507 = cljs.core.first.call(null, G__10505__10506);
    var G__10505__10508 = G__10505__10506;
    while(true) {
      goog.dom.forms.setValue(node__10507, value);
      var temp__4092__auto____10509 = cljs.core.next.call(null, G__10505__10508);
      if(temp__4092__auto____10509) {
        var G__10505__10510 = temp__4092__auto____10509;
        var G__10511 = cljs.core.first.call(null, G__10505__10510);
        var G__10512 = G__10505__10510;
        node__10507 = G__10511;
        G__10505__10508 = G__10512;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.html = function html(content) {
  return domina.single_node.call(null, content).innerHTML
};
domina.replace_children_BANG_ = function replace_children_BANG_(content, inner_content) {
  return domina.append_BANG_.call(null, domina.destroy_children_BANG_.call(null, content), inner_content)
};
domina.set_inner_html_BANG_ = function set_inner_html_BANG_(content, html_string) {
  var allows_inner_html_QMARK___10529 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_no_inner_html, html_string));
  var leading_whitespace_QMARK___10530 = cljs.core.re_find.call(null, domina.re_leading_whitespace, html_string);
  var tag_name__10531 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html_string)))].join("").toLowerCase();
  var special_tag_QMARK___10532 = cljs.core.contains_QMARK_.call(null, domina.wrap_map, tag_name__10531);
  if(cljs.core.truth_(function() {
    var and__3941__auto____10533 = allows_inner_html_QMARK___10529;
    if(and__3941__auto____10533) {
      var and__3941__auto____10535 = function() {
        var or__3943__auto____10534 = domina.support.leading_whitespace_QMARK_;
        if(cljs.core.truth_(or__3943__auto____10534)) {
          return or__3943__auto____10534
        }else {
          return cljs.core.not.call(null, leading_whitespace_QMARK___10530)
        }
      }();
      if(cljs.core.truth_(and__3941__auto____10535)) {
        return!special_tag_QMARK___10532
      }else {
        return and__3941__auto____10535
      }
    }else {
      return and__3941__auto____10533
    }
  }())) {
    var value__10536 = clojure.string.replace.call(null, html_string, domina.re_xhtml_tag, "<$1></$2>");
    try {
      var G__10539__10540 = cljs.core.seq.call(null, domina.nodes.call(null, content));
      if(G__10539__10540) {
        var node__10541 = cljs.core.first.call(null, G__10539__10540);
        var G__10539__10542 = G__10539__10540;
        while(true) {
          goog.events.removeAll(node__10541);
          node__10541.innerHTML = value__10536;
          var temp__4092__auto____10543 = cljs.core.next.call(null, G__10539__10542);
          if(temp__4092__auto____10543) {
            var G__10539__10544 = temp__4092__auto____10543;
            var G__10545 = cljs.core.first.call(null, G__10539__10544);
            var G__10546 = G__10539__10544;
            node__10541 = G__10545;
            G__10539__10542 = G__10546;
            continue
          }else {
          }
          break
        }
      }else {
      }
    }catch(e10537) {
      if(cljs.core.instance_QMARK_.call(null, domina.Exception, e10537)) {
        var e__10538 = e10537;
        domina.replace_children_BANG_.call(null, content, value__10536)
      }else {
        if("\ufdd0'else") {
          throw e10537;
        }else {
        }
      }
    }
  }else {
    domina.replace_children_BANG_.call(null, content, html_string)
  }
  return content
};
domina.set_html_BANG_ = function set_html_BANG_(content, inner_content) {
  if(cljs.core.string_QMARK_.call(null, inner_content)) {
    return domina.set_inner_html_BANG_.call(null, content, inner_content)
  }else {
    return domina.replace_children_BANG_.call(null, content, inner_content)
  }
};
domina.get_data = function() {
  var get_data = null;
  var get_data__2 = function(node, key) {
    return get_data.call(null, node, key, false)
  };
  var get_data__3 = function(node, key, bubble) {
    var m__10552 = domina.single_node.call(null, node).__domina_data;
    var value__10553 = cljs.core.truth_(m__10552) ? cljs.core._lookup.call(null, m__10552, key, null) : null;
    if(cljs.core.truth_(function() {
      var and__3941__auto____10554 = bubble;
      if(cljs.core.truth_(and__3941__auto____10554)) {
        return value__10553 == null
      }else {
        return and__3941__auto____10554
      }
    }())) {
      var temp__4092__auto____10555 = domina.single_node.call(null, node).parentNode;
      if(cljs.core.truth_(temp__4092__auto____10555)) {
        var parent__10556 = temp__4092__auto____10555;
        return get_data.call(null, parent__10556, key, true)
      }else {
        return null
      }
    }else {
      return value__10553
    }
  };
  get_data = function(node, key, bubble) {
    switch(arguments.length) {
      case 2:
        return get_data__2.call(this, node, key);
      case 3:
        return get_data__3.call(this, node, key, bubble)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_data.cljs$lang$arity$2 = get_data__2;
  get_data.cljs$lang$arity$3 = get_data__3;
  return get_data
}();
domina.set_data_BANG_ = function set_data_BANG_(node, key, value) {
  var m__10562 = function() {
    var or__3943__auto____10561 = domina.single_node.call(null, node).__domina_data;
    if(cljs.core.truth_(or__3943__auto____10561)) {
      return or__3943__auto____10561
    }else {
      return cljs.core.ObjMap.EMPTY
    }
  }();
  return domina.single_node.call(null, node).__domina_data = cljs.core.assoc.call(null, m__10562, key, value)
};
domina.apply_with_cloning = function apply_with_cloning(f, parent_content, child_content) {
  var parents__10574 = domina.nodes.call(null, parent_content);
  var children__10575 = domina.nodes.call(null, child_content);
  var first_child__10583 = function() {
    var frag__10576 = document.createDocumentFragment();
    var G__10577__10578 = cljs.core.seq.call(null, children__10575);
    if(G__10577__10578) {
      var child__10579 = cljs.core.first.call(null, G__10577__10578);
      var G__10577__10580 = G__10577__10578;
      while(true) {
        frag__10576.appendChild(child__10579);
        var temp__4092__auto____10581 = cljs.core.next.call(null, G__10577__10580);
        if(temp__4092__auto____10581) {
          var G__10577__10582 = temp__4092__auto____10581;
          var G__10585 = cljs.core.first.call(null, G__10577__10582);
          var G__10586 = G__10577__10582;
          child__10579 = G__10585;
          G__10577__10580 = G__10586;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return frag__10576
  }();
  var other_children__10584 = cljs.core.doall.call(null, cljs.core.repeatedly.call(null, cljs.core.count.call(null, parents__10574) - 1, function() {
    return first_child__10583.cloneNode(true)
  }));
  if(cljs.core.seq.call(null, parents__10574)) {
    f.call(null, cljs.core.first.call(null, parents__10574), first_child__10583);
    return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__10557_SHARP_, p2__10558_SHARP_) {
      return f.call(null, p1__10557_SHARP_, p2__10558_SHARP_)
    }, cljs.core.rest.call(null, parents__10574), other_children__10584))
  }else {
    return null
  }
};
domina.lazy_nl_via_item = function() {
  var lazy_nl_via_item = null;
  var lazy_nl_via_item__1 = function(nl) {
    return lazy_nl_via_item.call(null, nl, 0)
  };
  var lazy_nl_via_item__2 = function(nl, n) {
    if(n < nl.length) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl.item(n), lazy_nl_via_item.call(null, nl, n + 1))
      }, null)
    }else {
      return null
    }
  };
  lazy_nl_via_item = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nl_via_item__1.call(this, nl);
      case 2:
        return lazy_nl_via_item__2.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lazy_nl_via_item.cljs$lang$arity$1 = lazy_nl_via_item__1;
  lazy_nl_via_item.cljs$lang$arity$2 = lazy_nl_via_item__2;
  return lazy_nl_via_item
}();
domina.lazy_nl_via_array_ref = function() {
  var lazy_nl_via_array_ref = null;
  var lazy_nl_via_array_ref__1 = function(nl) {
    return lazy_nl_via_array_ref.call(null, nl, 0)
  };
  var lazy_nl_via_array_ref__2 = function(nl, n) {
    if(n < nl.length) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl[n], lazy_nl_via_array_ref.call(null, nl, n + 1))
      }, null)
    }else {
      return null
    }
  };
  lazy_nl_via_array_ref = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nl_via_array_ref__1.call(this, nl);
      case 2:
        return lazy_nl_via_array_ref__2.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lazy_nl_via_array_ref.cljs$lang$arity$1 = lazy_nl_via_array_ref__1;
  lazy_nl_via_array_ref.cljs$lang$arity$2 = lazy_nl_via_array_ref__2;
  return lazy_nl_via_array_ref
}();
domina.lazy_nodelist = function lazy_nodelist(nl) {
  if(cljs.core.truth_(nl.item)) {
    return domina.lazy_nl_via_item.call(null, nl)
  }else {
    return domina.lazy_nl_via_array_ref.call(null, nl)
  }
};
domina.array_like_QMARK_ = function array_like_QMARK_(obj) {
  var and__3941__auto____10588 = obj;
  if(cljs.core.truth_(and__3941__auto____10588)) {
    return obj.length
  }else {
    return and__3941__auto____10588
  }
};
domina.normalize_seq = function normalize_seq(list_thing) {
  if(list_thing == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var G__10592__10593 = list_thing;
      if(G__10592__10593) {
        if(function() {
          var or__3943__auto____10594 = G__10592__10593.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3943__auto____10594) {
            return or__3943__auto____10594
          }else {
            return G__10592__10593.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10592__10593.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10592__10593)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10592__10593)
      }
    }()) {
      return cljs.core.seq.call(null, list_thing)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, list_thing))) {
        return domina.lazy_nodelist.call(null, list_thing)
      }else {
        if("\ufdd0'default") {
          return cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([list_thing], true))
        }else {
          return null
        }
      }
    }
  }
};
domina.DomContent["_"] = true;
domina.nodes["_"] = function(content) {
  if(content == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var G__10595__10596 = content;
      if(G__10595__10596) {
        if(function() {
          var or__3943__auto____10597 = G__10595__10596.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3943__auto____10597) {
            return or__3943__auto____10597
          }else {
            return G__10595__10596.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10595__10596.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10595__10596)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10595__10596)
      }
    }()) {
      return cljs.core.seq.call(null, content)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, content))) {
        return domina.lazy_nodelist.call(null, content)
      }else {
        if("\ufdd0'default") {
          return cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([content], true))
        }else {
          return null
        }
      }
    }
  }
};
domina.single_node["_"] = function(content) {
  if(content == null) {
    return null
  }else {
    if(function() {
      var G__10598__10599 = content;
      if(G__10598__10599) {
        if(function() {
          var or__3943__auto____10600 = G__10598__10599.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3943__auto____10600) {
            return or__3943__auto____10600
          }else {
            return G__10598__10599.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10598__10599.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10598__10599)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10598__10599)
      }
    }()) {
      return cljs.core.first.call(null, content)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, content))) {
        return content.item(0)
      }else {
        if("\ufdd0'default") {
          return content
        }else {
          return null
        }
      }
    }
  }
};
domina.DomContent["string"] = true;
domina.nodes["string"] = function(s) {
  return cljs.core.doall.call(null, domina.nodes.call(null, domina.string_to_dom.call(null, s)))
};
domina.single_node["string"] = function(s) {
  return domina.single_node.call(null, domina.string_to_dom.call(null, s))
};
if(cljs.core.truth_(typeof NodeList != "undefined")) {
  NodeList.prototype.cljs$core$ISeqable$ = true;
  NodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  NodeList.prototype.cljs$core$IIndexed$ = true;
  NodeList.prototype.cljs$core$IIndexed$_nth$arity$2 = function(nodelist, n) {
    return nodelist.item(n)
  };
  NodeList.prototype.cljs$core$IIndexed$_nth$arity$3 = function(nodelist, n, not_found) {
    if(nodelist.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  NodeList.prototype.cljs$core$ICounted$ = true;
  NodeList.prototype.cljs$core$ICounted$_count$arity$1 = function(nodelist) {
    return nodelist.length
  }
}else {
}
if(cljs.core.truth_(typeof StaticNodeList != "undefined")) {
  StaticNodeList.prototype.cljs$core$ISeqable$ = true;
  StaticNodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$ = true;
  StaticNodeList.prototype.cljs$core$IIndexed$_nth$arity$2 = function(nodelist, n) {
    return nodelist.item(n)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$_nth$arity$3 = function(nodelist, n, not_found) {
    if(nodelist.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  StaticNodeList.prototype.cljs$core$ICounted$ = true;
  StaticNodeList.prototype.cljs$core$ICounted$_count$arity$1 = function(nodelist) {
    return nodelist.length
  }
}else {
}
if(cljs.core.truth_(typeof HTMLCollection != "undefined")) {
  HTMLCollection.prototype.cljs$core$ISeqable$ = true;
  HTMLCollection.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
    return domina.lazy_nodelist.call(null, coll)
  };
  HTMLCollection.prototype.cljs$core$IIndexed$ = true;
  HTMLCollection.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
    return coll.item(n)
  };
  HTMLCollection.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
    if(coll.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, coll, n)
    }
  };
  HTMLCollection.prototype.cljs$core$ICounted$ = true;
  HTMLCollection.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
    return coll.length
  }
}else {
}
;goog.provide("domina.events");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.object");
goog.require("domina");
void 0;
domina.events.Event = {};
domina.events.prevent_default = function prevent_default(evt) {
  if(function() {
    var and__3941__auto____9992 = evt;
    if(and__3941__auto____9992) {
      return evt.domina$events$Event$prevent_default$arity$1
    }else {
      return and__3941__auto____9992
    }
  }()) {
    return evt.domina$events$Event$prevent_default$arity$1(evt)
  }else {
    return function() {
      var or__3943__auto____9993 = domina.events.prevent_default[goog.typeOf(evt)];
      if(or__3943__auto____9993) {
        return or__3943__auto____9993
      }else {
        var or__3943__auto____9994 = domina.events.prevent_default["_"];
        if(or__3943__auto____9994) {
          return or__3943__auto____9994
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.prevent-default", evt);
        }
      }
    }().call(null, evt)
  }
};
domina.events.stop_propagation = function stop_propagation(evt) {
  if(function() {
    var and__3941__auto____9998 = evt;
    if(and__3941__auto____9998) {
      return evt.domina$events$Event$stop_propagation$arity$1
    }else {
      return and__3941__auto____9998
    }
  }()) {
    return evt.domina$events$Event$stop_propagation$arity$1(evt)
  }else {
    return function() {
      var or__3943__auto____9999 = domina.events.stop_propagation[goog.typeOf(evt)];
      if(or__3943__auto____9999) {
        return or__3943__auto____9999
      }else {
        var or__3943__auto____10000 = domina.events.stop_propagation["_"];
        if(or__3943__auto____10000) {
          return or__3943__auto____10000
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.stop-propagation", evt);
        }
      }
    }().call(null, evt)
  }
};
domina.events.target = function target(evt) {
  if(function() {
    var and__3941__auto____10004 = evt;
    if(and__3941__auto____10004) {
      return evt.domina$events$Event$target$arity$1
    }else {
      return and__3941__auto____10004
    }
  }()) {
    return evt.domina$events$Event$target$arity$1(evt)
  }else {
    return function() {
      var or__3943__auto____10005 = domina.events.target[goog.typeOf(evt)];
      if(or__3943__auto____10005) {
        return or__3943__auto____10005
      }else {
        var or__3943__auto____10006 = domina.events.target["_"];
        if(or__3943__auto____10006) {
          return or__3943__auto____10006
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.target", evt);
        }
      }
    }().call(null, evt)
  }
};
domina.events.current_target = function current_target(evt) {
  if(function() {
    var and__3941__auto____10010 = evt;
    if(and__3941__auto____10010) {
      return evt.domina$events$Event$current_target$arity$1
    }else {
      return and__3941__auto____10010
    }
  }()) {
    return evt.domina$events$Event$current_target$arity$1(evt)
  }else {
    return function() {
      var or__3943__auto____10011 = domina.events.current_target[goog.typeOf(evt)];
      if(or__3943__auto____10011) {
        return or__3943__auto____10011
      }else {
        var or__3943__auto____10012 = domina.events.current_target["_"];
        if(or__3943__auto____10012) {
          return or__3943__auto____10012
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.current-target", evt);
        }
      }
    }().call(null, evt)
  }
};
domina.events.event_type = function event_type(evt) {
  if(function() {
    var and__3941__auto____10016 = evt;
    if(and__3941__auto____10016) {
      return evt.domina$events$Event$event_type$arity$1
    }else {
      return and__3941__auto____10016
    }
  }()) {
    return evt.domina$events$Event$event_type$arity$1(evt)
  }else {
    return function() {
      var or__3943__auto____10017 = domina.events.event_type[goog.typeOf(evt)];
      if(or__3943__auto____10017) {
        return or__3943__auto____10017
      }else {
        var or__3943__auto____10018 = domina.events.event_type["_"];
        if(or__3943__auto____10018) {
          return or__3943__auto____10018
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.event-type", evt);
        }
      }
    }().call(null, evt)
  }
};
domina.events.raw_event = function raw_event(evt) {
  if(function() {
    var and__3941__auto____10022 = evt;
    if(and__3941__auto____10022) {
      return evt.domina$events$Event$raw_event$arity$1
    }else {
      return and__3941__auto____10022
    }
  }()) {
    return evt.domina$events$Event$raw_event$arity$1(evt)
  }else {
    return function() {
      var or__3943__auto____10023 = domina.events.raw_event[goog.typeOf(evt)];
      if(or__3943__auto____10023) {
        return or__3943__auto____10023
      }else {
        var or__3943__auto____10024 = domina.events.raw_event["_"];
        if(or__3943__auto____10024) {
          return or__3943__auto____10024
        }else {
          throw cljs.core.missing_protocol.call(null, "Event.raw-event", evt);
        }
      }
    }().call(null, evt)
  }
};
void 0;
domina.events.builtin_events = cljs.core.set.call(null, cljs.core.map.call(null, cljs.core.keyword, goog.object.getValues(goog.events.EventType)));
domina.events.root_element = window.document.documentElement;
domina.events.find_builtin_type = function find_builtin_type(evt_type) {
  if(cljs.core.contains_QMARK_.call(null, domina.events.builtin_events, evt_type)) {
    return cljs.core.name.call(null, evt_type)
  }else {
    return evt_type
  }
};
domina.events.create_listener_function = function create_listener_function(f) {
  return function(evt) {
    f.call(null, function() {
      if(void 0 === domina.events.t10041) {
        domina.events.t10041 = function(evt, f, create_listener_function, meta10042) {
          this.evt = evt;
          this.f = f;
          this.create_listener_function = create_listener_function;
          this.meta10042 = meta10042;
          this.cljs$lang$protocol_mask$partition1$ = 0;
          this.cljs$lang$protocol_mask$partition0$ = 393472
        };
        domina.events.t10041.cljs$lang$type = true;
        domina.events.t10041.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
          return cljs.core.list.call(null, "domina.events/t10041")
        };
        domina.events.t10041.prototype.cljs$core$ILookup$_lookup$arity$2 = function(o, k) {
          var this__10044 = this;
          var temp__4090__auto____10045 = this__10044.evt[k];
          if(cljs.core.truth_(temp__4090__auto____10045)) {
            var val__10046 = temp__4090__auto____10045;
            return val__10046
          }else {
            return this__10044.evt[cljs.core.name.call(null, k)]
          }
        };
        domina.events.t10041.prototype.cljs$core$ILookup$_lookup$arity$3 = function(o, k, not_found) {
          var this__10047 = this;
          var or__3943__auto____10048 = o.cljs$core$ILookup$_lookup$arity$2(o, k);
          if(cljs.core.truth_(or__3943__auto____10048)) {
            return or__3943__auto____10048
          }else {
            return not_found
          }
        };
        domina.events.t10041.prototype.domina$events$Event$ = true;
        domina.events.t10041.prototype.domina$events$Event$prevent_default$arity$1 = function(_) {
          var this__10049 = this;
          return this__10049.evt.preventDefault()
        };
        domina.events.t10041.prototype.domina$events$Event$stop_propagation$arity$1 = function(_) {
          var this__10050 = this;
          return this__10050.evt.stopPropagation()
        };
        domina.events.t10041.prototype.domina$events$Event$target$arity$1 = function(_) {
          var this__10051 = this;
          return this__10051.evt.target
        };
        domina.events.t10041.prototype.domina$events$Event$current_target$arity$1 = function(_) {
          var this__10052 = this;
          return this__10052.evt.currentTarget
        };
        domina.events.t10041.prototype.domina$events$Event$event_type$arity$1 = function(_) {
          var this__10053 = this;
          return this__10053.evt.type
        };
        domina.events.t10041.prototype.domina$events$Event$raw_event$arity$1 = function(_) {
          var this__10054 = this;
          return this__10054.evt
        };
        domina.events.t10041.prototype.cljs$core$IMeta$_meta$arity$1 = function(_10043) {
          var this__10055 = this;
          return this__10055.meta10042
        };
        domina.events.t10041.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_10043, meta10042) {
          var this__10056 = this;
          return new domina.events.t10041(this__10056.evt, this__10056.f, this__10056.create_listener_function, meta10042)
        };
        domina.events.t10041
      }else {
      }
      return new domina.events.t10041(evt, f, create_listener_function, null)
    }());
    return true
  }
};
domina.events.listen_internal_BANG_ = function listen_internal_BANG_(content, type, listener, capture, once) {
  var f__10070 = domina.events.create_listener_function.call(null, listener);
  var t__10071 = domina.events.find_builtin_type.call(null, type);
  return cljs.core.doall.call(null, function() {
    var iter__2363__auto____10082 = function iter__10072(s__10073) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__10073__10078 = s__10073;
        while(true) {
          var temp__4092__auto____10079 = cljs.core.seq.call(null, s__10073__10078);
          if(temp__4092__auto____10079) {
            var xs__4579__auto____10080 = temp__4092__auto____10079;
            var node__10081 = cljs.core.first.call(null, xs__4579__auto____10080);
            return cljs.core.cons.call(null, cljs.core.truth_(once) ? goog.events.listenOnce(node__10081, t__10071, f__10070, capture) : goog.events.listen(node__10081, t__10071, f__10070, capture), iter__10072.call(null, cljs.core.rest.call(null, s__10073__10078)))
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__2363__auto____10082.call(null, domina.nodes.call(null, content))
  }())
};
domina.events.listen_BANG_ = function() {
  var listen_BANG_ = null;
  var listen_BANG___2 = function(type, listener) {
    return listen_BANG_.call(null, domina.events.root_element, type, listener)
  };
  var listen_BANG___3 = function(content, type, listener) {
    return domina.events.listen_internal_BANG_.call(null, content, type, listener, false, false)
  };
  listen_BANG_ = function(content, type, listener) {
    switch(arguments.length) {
      case 2:
        return listen_BANG___2.call(this, content, type);
      case 3:
        return listen_BANG___3.call(this, content, type, listener)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_BANG_.cljs$lang$arity$2 = listen_BANG___2;
  listen_BANG_.cljs$lang$arity$3 = listen_BANG___3;
  return listen_BANG_
}();
domina.events.capture_BANG_ = function() {
  var capture_BANG_ = null;
  var capture_BANG___2 = function(type, listener) {
    return capture_BANG_.call(null, domina.events.root_element, type, listener)
  };
  var capture_BANG___3 = function(content, type, listener) {
    return domina.events.listen_internal_BANG_.call(null, content, type, listener, true, false)
  };
  capture_BANG_ = function(content, type, listener) {
    switch(arguments.length) {
      case 2:
        return capture_BANG___2.call(this, content, type);
      case 3:
        return capture_BANG___3.call(this, content, type, listener)
    }
    throw"Invalid arity: " + arguments.length;
  };
  capture_BANG_.cljs$lang$arity$2 = capture_BANG___2;
  capture_BANG_.cljs$lang$arity$3 = capture_BANG___3;
  return capture_BANG_
}();
domina.events.listen_once_BANG_ = function() {
  var listen_once_BANG_ = null;
  var listen_once_BANG___2 = function(type, listener) {
    return listen_once_BANG_.call(null, domina.events.root_element, type, listener)
  };
  var listen_once_BANG___3 = function(content, type, listener) {
    return domina.events.listen_internal_BANG_.call(null, content, type, listener, false, true)
  };
  listen_once_BANG_ = function(content, type, listener) {
    switch(arguments.length) {
      case 2:
        return listen_once_BANG___2.call(this, content, type);
      case 3:
        return listen_once_BANG___3.call(this, content, type, listener)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_once_BANG_.cljs$lang$arity$2 = listen_once_BANG___2;
  listen_once_BANG_.cljs$lang$arity$3 = listen_once_BANG___3;
  return listen_once_BANG_
}();
domina.events.capture_once_BANG_ = function() {
  var capture_once_BANG_ = null;
  var capture_once_BANG___2 = function(type, listener) {
    return capture_once_BANG_.call(null, domina.events.root_element, type, listener)
  };
  var capture_once_BANG___3 = function(content, type, listener) {
    return domina.events.listen_internal_BANG_.call(null, content, type, listener, true, true)
  };
  capture_once_BANG_ = function(content, type, listener) {
    switch(arguments.length) {
      case 2:
        return capture_once_BANG___2.call(this, content, type);
      case 3:
        return capture_once_BANG___3.call(this, content, type, listener)
    }
    throw"Invalid arity: " + arguments.length;
  };
  capture_once_BANG_.cljs$lang$arity$2 = capture_once_BANG___2;
  capture_once_BANG_.cljs$lang$arity$3 = capture_once_BANG___3;
  return capture_once_BANG_
}();
domina.events.unlisten_BANG_ = function() {
  var unlisten_BANG_ = null;
  var unlisten_BANG___0 = function() {
    return unlisten_BANG_.call(null, domina.events.root_element)
  };
  var unlisten_BANG___1 = function(content) {
    var G__10090__10091 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__10090__10091) {
      var node__10092 = cljs.core.first.call(null, G__10090__10091);
      var G__10090__10093 = G__10090__10091;
      while(true) {
        goog.events.removeAll(node__10092);
        var temp__4092__auto____10094 = cljs.core.next.call(null, G__10090__10093);
        if(temp__4092__auto____10094) {
          var G__10090__10095 = temp__4092__auto____10094;
          var G__10097 = cljs.core.first.call(null, G__10090__10095);
          var G__10098 = G__10090__10095;
          node__10092 = G__10097;
          G__10090__10093 = G__10098;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  };
  var unlisten_BANG___2 = function(content, type) {
    var type__10096 = domina.events.find_builtin_type.call(null, type);
    return goog.events.removeAll(domina.events.node, type__10096)
  };
  unlisten_BANG_ = function(content, type) {
    switch(arguments.length) {
      case 0:
        return unlisten_BANG___0.call(this);
      case 1:
        return unlisten_BANG___1.call(this, content);
      case 2:
        return unlisten_BANG___2.call(this, content, type)
    }
    throw"Invalid arity: " + arguments.length;
  };
  unlisten_BANG_.cljs$lang$arity$0 = unlisten_BANG___0;
  unlisten_BANG_.cljs$lang$arity$1 = unlisten_BANG___1;
  unlisten_BANG_.cljs$lang$arity$2 = unlisten_BANG___2;
  return unlisten_BANG_
}();
domina.events.ancestor_nodes = function() {
  var ancestor_nodes = null;
  var ancestor_nodes__1 = function(n) {
    return ancestor_nodes.call(null, n, cljs.core.PersistentVector.fromArray([n], true))
  };
  var ancestor_nodes__2 = function(n, so_far) {
    while(true) {
      var temp__4090__auto____10101 = n.parentNode;
      if(cljs.core.truth_(temp__4090__auto____10101)) {
        var parent__10102 = temp__4090__auto____10101;
        var G__10103 = parent__10102;
        var G__10104 = cljs.core.cons.call(null, parent__10102, so_far);
        n = G__10103;
        so_far = G__10104;
        continue
      }else {
        return so_far
      }
      break
    }
  };
  ancestor_nodes = function(n, so_far) {
    switch(arguments.length) {
      case 1:
        return ancestor_nodes__1.call(this, n);
      case 2:
        return ancestor_nodes__2.call(this, n, so_far)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestor_nodes.cljs$lang$arity$1 = ancestor_nodes__1;
  ancestor_nodes.cljs$lang$arity$2 = ancestor_nodes__2;
  return ancestor_nodes
}();
domina.events.dispatch_browser_BANG_ = function dispatch_browser_BANG_(source, evt) {
  var ancestors__10118 = domina.events.ancestor_nodes.call(null, domina.single_node.call(null, source));
  var G__10119__10120 = cljs.core.seq.call(null, ancestors__10118);
  if(G__10119__10120) {
    var n__10121 = cljs.core.first.call(null, G__10119__10120);
    var G__10119__10122 = G__10119__10120;
    while(true) {
      if(cljs.core.truth_(n__10121.propagationStopped)) {
      }else {
        evt.currentTarget = n__10121;
        goog.events.fireListeners(n__10121, evt.type, true, evt)
      }
      var temp__4092__auto____10123 = cljs.core.next.call(null, G__10119__10122);
      if(temp__4092__auto____10123) {
        var G__10119__10124 = temp__4092__auto____10123;
        var G__10131 = cljs.core.first.call(null, G__10119__10124);
        var G__10132 = G__10119__10124;
        n__10121 = G__10131;
        G__10119__10122 = G__10132;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10125__10126 = cljs.core.seq.call(null, cljs.core.reverse.call(null, ancestors__10118));
  if(G__10125__10126) {
    var n__10127 = cljs.core.first.call(null, G__10125__10126);
    var G__10125__10128 = G__10125__10126;
    while(true) {
      if(cljs.core.truth_(n__10127.propagationStopped)) {
      }else {
        evt.currentTarget = n__10127;
        goog.events.fireListeners(n__10127, evt.type, false, evt)
      }
      var temp__4092__auto____10129 = cljs.core.next.call(null, G__10125__10128);
      if(temp__4092__auto____10129) {
        var G__10125__10130 = temp__4092__auto____10129;
        var G__10133 = cljs.core.first.call(null, G__10125__10130);
        var G__10134 = G__10125__10130;
        n__10127 = G__10133;
        G__10125__10128 = G__10134;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return evt.returnValue_
};
domina.events.dispatch_event_target_BANG_ = function dispatch_event_target_BANG_(source, evt) {
  return goog.events.dispatchEvent(source, evt)
};
domina.events.is_event_target_QMARK_ = function is_event_target_QMARK_(o) {
  var and__3941__auto____10136 = o.getParentEventTarget;
  if(cljs.core.truth_(and__3941__auto____10136)) {
    return o.dispatchEvent
  }else {
    return and__3941__auto____10136
  }
};
domina.events.dispatch_BANG_ = function() {
  var dispatch_BANG_ = null;
  var dispatch_BANG___2 = function(type, evt_map) {
    return dispatch_BANG_.call(null, domina.events.root_element, type, evt_map)
  };
  var dispatch_BANG___3 = function(source, type, evt_map) {
    var evt__10157 = new goog.events.Event(domina.events.find_builtin_type.call(null, type));
    var G__10158__10159 = cljs.core.seq.call(null, evt_map);
    if(G__10158__10159) {
      var G__10161__10163 = cljs.core.first.call(null, G__10158__10159);
      var vec__10162__10164 = G__10161__10163;
      var k__10165 = cljs.core.nth.call(null, vec__10162__10164, 0, null);
      var v__10166 = cljs.core.nth.call(null, vec__10162__10164, 1, null);
      var G__10158__10167 = G__10158__10159;
      var G__10161__10168 = G__10161__10163;
      var G__10158__10169 = G__10158__10167;
      while(true) {
        var vec__10170__10171 = G__10161__10168;
        var k__10172 = cljs.core.nth.call(null, vec__10170__10171, 0, null);
        var v__10173 = cljs.core.nth.call(null, vec__10170__10171, 1, null);
        var G__10158__10174 = G__10158__10169;
        evt__10157[k__10172] = v__10173;
        var temp__4092__auto____10175 = cljs.core.next.call(null, G__10158__10174);
        if(temp__4092__auto____10175) {
          var G__10158__10176 = temp__4092__auto____10175;
          var G__10177 = cljs.core.first.call(null, G__10158__10176);
          var G__10178 = G__10158__10176;
          G__10161__10168 = G__10177;
          G__10158__10169 = G__10178;
          continue
        }else {
        }
        break
      }
    }else {
    }
    if(cljs.core.truth_(domina.events.is_event_target_QMARK_.call(null, source))) {
      return domina.events.dispatch_event_target_BANG_.call(null, source, evt__10157)
    }else {
      return domina.events.dispatch_browser_BANG_.call(null, source, evt__10157)
    }
  };
  dispatch_BANG_ = function(source, type, evt_map) {
    switch(arguments.length) {
      case 2:
        return dispatch_BANG___2.call(this, source, type);
      case 3:
        return dispatch_BANG___3.call(this, source, type, evt_map)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dispatch_BANG_.cljs$lang$arity$2 = dispatch_BANG___2;
  dispatch_BANG_.cljs$lang$arity$3 = dispatch_BANG___3;
  return dispatch_BANG_
}();
domina.events.unlisten_by_key_BANG_ = function unlisten_by_key_BANG_(key) {
  return goog.events.unlistenByKey(key)
};
domina.events.get_listeners = function get_listeners(content, type) {
  var type__10181 = domina.events.find_builtin_type.call(null, type);
  return cljs.core.mapcat.call(null, function(p1__10179_SHARP_) {
    return goog.events.getListeners(p1__10179_SHARP_, type__10181, false)
  }, domina.nodes.call(null, content))
};
goog.provide("goog.functions");
goog.functions.constant = function(retValue) {
  return function() {
    return retValue
  }
};
goog.functions.FALSE = goog.functions.constant(false);
goog.functions.TRUE = goog.functions.constant(true);
goog.functions.NULL = goog.functions.constant(null);
goog.functions.identity = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.functions.error = function(message) {
  return function() {
    throw Error(message);
  }
};
goog.functions.lock = function(f) {
  return function() {
    return f.call(this)
  }
};
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue))
};
goog.functions.compose = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    if(length) {
      result = functions[length - 1].apply(this, arguments)
    }
    for(var i = length - 2;i >= 0;i--) {
      result = functions[i].call(this, result)
    }
    return result
  }
};
goog.functions.sequence = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    for(var i = 0;i < length;i++) {
      result = functions[i].apply(this, arguments)
    }
    return result
  }
};
goog.functions.and = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(!functions[i].apply(this, arguments)) {
        return false
      }
    }
    return true
  }
};
goog.functions.or = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(functions[i].apply(this, arguments)) {
        return true
      }
    }
    return false
  }
};
goog.functions.not = function(f) {
  return function() {
    return!f.apply(this, arguments)
  }
};
goog.functions.create = function(constructor, var_args) {
  var temp = function() {
  };
  temp.prototype = constructor.prototype;
  var obj = new temp;
  constructor.apply(obj, Array.prototype.slice.call(arguments, 1));
  return obj
};
/*
 Portions of this code are from the Dojo Toolkit, received by
 The Closure Library Authors under the BSD license. All other code is
 Copyright 2005-2009 The Closure Library Authors. All Rights Reserved.

The "New" BSD License:

Copyright (c) 2005-2009, The Dojo Foundation
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

 Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
 Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.
 Neither the name of the Dojo Foundation nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
goog.provide("goog.dom.query");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.functions");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.query = function() {
  var cssCaseBug = goog.userAgent.WEBKIT && goog.dom.getDocument().compatMode == "BackCompat";
  var childNodesName = !!goog.dom.getDocument().firstChild["children"] ? "children" : "childNodes";
  var specials = ">~+";
  var caseSensitive = false;
  var getQueryParts = function(query) {
    if(specials.indexOf(query.slice(-1)) >= 0) {
      query += " * "
    }else {
      query += " "
    }
    var ts = function(s, e) {
      return goog.string.trim(query.slice(s, e))
    };
    var queryParts = [];
    var inBrackets = -1, inParens = -1, inMatchFor = -1, inPseudo = -1, inClass = -1, inId = -1, inTag = -1, lc = "", cc = "", pStart;
    var x = 0, ql = query.length, currentPart = null, cp = null;
    var endTag = function() {
      if(inTag >= 0) {
        var tv = inTag == x ? null : ts(inTag, x);
        if(specials.indexOf(tv) < 0) {
          currentPart.tag = tv
        }else {
          currentPart.oper = tv
        }
        inTag = -1
      }
    };
    var endId = function() {
      if(inId >= 0) {
        currentPart.id = ts(inId, x).replace(/\\/g, "");
        inId = -1
      }
    };
    var endClass = function() {
      if(inClass >= 0) {
        currentPart.classes.push(ts(inClass + 1, x).replace(/\\/g, ""));
        inClass = -1
      }
    };
    var endAll = function() {
      endId();
      endTag();
      endClass()
    };
    var endPart = function() {
      endAll();
      if(inPseudo >= 0) {
        currentPart.pseudos.push({name:ts(inPseudo + 1, x)})
      }
      currentPart.loops = currentPart.pseudos.length || currentPart.attrs.length || currentPart.classes.length;
      currentPart.oquery = currentPart.query = ts(pStart, x);
      currentPart.otag = currentPart.tag = currentPart.oper ? null : currentPart.tag || "*";
      if(currentPart.tag) {
        currentPart.tag = currentPart.tag.toUpperCase()
      }
      if(queryParts.length && queryParts[queryParts.length - 1].oper) {
        currentPart.infixOper = queryParts.pop();
        currentPart.query = currentPart.infixOper.query + " " + currentPart.query
      }
      queryParts.push(currentPart);
      currentPart = null
    };
    for(;lc = cc, cc = query.charAt(x), x < ql;x++) {
      if(lc == "\\") {
        continue
      }
      if(!currentPart) {
        pStart = x;
        currentPart = {query:null, pseudos:[], attrs:[], classes:[], tag:null, oper:null, id:null, getTag:function() {
          return caseSensitive ? this.otag : this.tag
        }};
        inTag = x
      }
      if(inBrackets >= 0) {
        if(cc == "]") {
          if(!cp.attr) {
            cp.attr = ts(inBrackets + 1, x)
          }else {
            cp.matchFor = ts(inMatchFor || inBrackets + 1, x)
          }
          var cmf = cp.matchFor;
          if(cmf) {
            if(cmf.charAt(0) == '"' || cmf.charAt(0) == "'") {
              cp.matchFor = cmf.slice(1, -1)
            }
          }
          currentPart.attrs.push(cp);
          cp = null;
          inBrackets = inMatchFor = -1
        }else {
          if(cc == "=") {
            var addToCc = "|~^$*".indexOf(lc) >= 0 ? lc : "";
            cp.type = addToCc + cc;
            cp.attr = ts(inBrackets + 1, x - addToCc.length);
            inMatchFor = x + 1
          }
        }
      }else {
        if(inParens >= 0) {
          if(cc == ")") {
            if(inPseudo >= 0) {
              cp.value = ts(inParens + 1, x)
            }
            inPseudo = inParens = -1
          }
        }else {
          if(cc == "#") {
            endAll();
            inId = x + 1
          }else {
            if(cc == ".") {
              endAll();
              inClass = x
            }else {
              if(cc == ":") {
                endAll();
                inPseudo = x
              }else {
                if(cc == "[") {
                  endAll();
                  inBrackets = x;
                  cp = {}
                }else {
                  if(cc == "(") {
                    if(inPseudo >= 0) {
                      cp = {name:ts(inPseudo + 1, x), value:null};
                      currentPart.pseudos.push(cp)
                    }
                    inParens = x
                  }else {
                    if(cc == " " && lc != cc) {
                      endPart()
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return queryParts
  };
  var agree = function(first, second) {
    if(!first) {
      return second
    }
    if(!second) {
      return first
    }
    return function() {
      return first.apply(window, arguments) && second.apply(window, arguments)
    }
  };
  function getArr(i, opt_arr) {
    var r = opt_arr || [];
    if(i) {
      r.push(i)
    }
    return r
  }
  var isElement = function(n) {
    return 1 == n.nodeType
  };
  var blank = "";
  var getAttr = function(elem, attr) {
    if(!elem) {
      return blank
    }
    if(attr == "class") {
      return elem.className || blank
    }
    if(attr == "for") {
      return elem.htmlFor || blank
    }
    if(attr == "style") {
      return elem.style.cssText || blank
    }
    return(caseSensitive ? elem.getAttribute(attr) : elem.getAttribute(attr, 2)) || blank
  };
  var attrs = {"*=":function(attr, value) {
    return function(elem) {
      return getAttr(elem, attr).indexOf(value) >= 0
    }
  }, "^=":function(attr, value) {
    return function(elem) {
      return getAttr(elem, attr).indexOf(value) == 0
    }
  }, "$=":function(attr, value) {
    var tval = " " + value;
    return function(elem) {
      var ea = " " + getAttr(elem, attr);
      return ea.lastIndexOf(value) == ea.length - value.length
    }
  }, "~=":function(attr, value) {
    var tval = " " + value + " ";
    return function(elem) {
      var ea = " " + getAttr(elem, attr) + " ";
      return ea.indexOf(tval) >= 0
    }
  }, "|=":function(attr, value) {
    value = " " + value;
    return function(elem) {
      var ea = " " + getAttr(elem, attr);
      return ea == value || ea.indexOf(value + "-") == 0
    }
  }, "=":function(attr, value) {
    return function(elem) {
      return getAttr(elem, attr) == value
    }
  }};
  var noNextElementSibling = typeof goog.dom.getDocument().firstChild.nextElementSibling == "undefined";
  var nSibling = !noNextElementSibling ? "nextElementSibling" : "nextSibling";
  var pSibling = !noNextElementSibling ? "previousElementSibling" : "previousSibling";
  var simpleNodeTest = noNextElementSibling ? isElement : goog.functions.TRUE;
  var _lookLeft = function(node) {
    while(node = node[pSibling]) {
      if(simpleNodeTest(node)) {
        return false
      }
    }
    return true
  };
  var _lookRight = function(node) {
    while(node = node[nSibling]) {
      if(simpleNodeTest(node)) {
        return false
      }
    }
    return true
  };
  var getNodeIndex = function(node) {
    var root = node.parentNode;
    var i = 0, tret = root[childNodesName], ci = node["_i"] || -1, cl = root["_l"] || -1;
    if(!tret) {
      return-1
    }
    var l = tret.length;
    if(cl == l && ci >= 0 && cl >= 0) {
      return ci
    }
    root["_l"] = l;
    ci = -1;
    var te = root["firstElementChild"] || root["firstChild"];
    for(;te;te = te[nSibling]) {
      if(simpleNodeTest(te)) {
        te["_i"] = ++i;
        if(node === te) {
          ci = i
        }
      }
    }
    return ci
  };
  var isEven = function(elem) {
    return!(getNodeIndex(elem) % 2)
  };
  var isOdd = function(elem) {
    return getNodeIndex(elem) % 2
  };
  var pseudos = {"checked":function(name, condition) {
    return function(elem) {
      return elem.checked || elem.attributes["checked"]
    }
  }, "first-child":function() {
    return _lookLeft
  }, "last-child":function() {
    return _lookRight
  }, "only-child":function(name, condition) {
    return function(node) {
      if(!_lookLeft(node)) {
        return false
      }
      if(!_lookRight(node)) {
        return false
      }
      return true
    }
  }, "empty":function(name, condition) {
    return function(elem) {
      var cn = elem.childNodes;
      var cnl = elem.childNodes.length;
      for(var x = cnl - 1;x >= 0;x--) {
        var nt = cn[x].nodeType;
        if(nt === 1 || nt == 3) {
          return false
        }
      }
      return true
    }
  }, "contains":function(name, condition) {
    var cz = condition.charAt(0);
    if(cz == '"' || cz == "'") {
      condition = condition.slice(1, -1)
    }
    return function(elem) {
      return elem.innerHTML.indexOf(condition) >= 0
    }
  }, "not":function(name, condition) {
    var p = getQueryParts(condition)[0];
    var ignores = {el:1};
    if(p.tag != "*") {
      ignores.tag = 1
    }
    if(!p.classes.length) {
      ignores.classes = 1
    }
    var ntf = getSimpleFilterFunc(p, ignores);
    return function(elem) {
      return!ntf(elem)
    }
  }, "nth-child":function(name, condition) {
    function pi(n) {
      return parseInt(n, 10)
    }
    if(condition == "odd") {
      return isOdd
    }else {
      if(condition == "even") {
        return isEven
      }
    }
    if(condition.indexOf("n") != -1) {
      var tparts = condition.split("n", 2);
      var pred = tparts[0] ? tparts[0] == "-" ? -1 : pi(tparts[0]) : 1;
      var idx = tparts[1] ? pi(tparts[1]) : 0;
      var lb = 0, ub = -1;
      if(pred > 0) {
        if(idx < 0) {
          idx = idx % pred && pred + idx % pred
        }else {
          if(idx > 0) {
            if(idx >= pred) {
              lb = idx - idx % pred
            }
            idx = idx % pred
          }
        }
      }else {
        if(pred < 0) {
          pred *= -1;
          if(idx > 0) {
            ub = idx;
            idx = idx % pred
          }
        }
      }
      if(pred > 0) {
        return function(elem) {
          var i = getNodeIndex(elem);
          return i >= lb && (ub < 0 || i <= ub) && i % pred == idx
        }
      }else {
        condition = idx
      }
    }
    var ncount = pi(condition);
    return function(elem) {
      return getNodeIndex(elem) == ncount
    }
  }};
  var defaultGetter = goog.userAgent.IE ? function(cond) {
    var clc = cond.toLowerCase();
    if(clc == "class") {
      cond = "className"
    }
    return function(elem) {
      return caseSensitive ? elem.getAttribute(cond) : elem[cond] || elem[clc]
    }
  } : function(cond) {
    return function(elem) {
      return elem && elem.getAttribute && elem.hasAttribute(cond)
    }
  };
  var getSimpleFilterFunc = function(query, ignores) {
    if(!query) {
      return goog.functions.TRUE
    }
    ignores = ignores || {};
    var ff = null;
    if(!ignores.el) {
      ff = agree(ff, isElement)
    }
    if(!ignores.tag) {
      if(query.tag != "*") {
        ff = agree(ff, function(elem) {
          return elem && elem.tagName == query.getTag()
        })
      }
    }
    if(!ignores.classes) {
      goog.array.forEach(query.classes, function(cname, idx, arr) {
        var re = new RegExp("(?:^|\\s)" + cname + "(?:\\s|$)");
        ff = agree(ff, function(elem) {
          return re.test(elem.className)
        });
        ff.count = idx
      })
    }
    if(!ignores.pseudos) {
      goog.array.forEach(query.pseudos, function(pseudo) {
        var pn = pseudo.name;
        if(pseudos[pn]) {
          ff = agree(ff, pseudos[pn](pn, pseudo.value))
        }
      })
    }
    if(!ignores.attrs) {
      goog.array.forEach(query.attrs, function(attr) {
        var matcher;
        var a = attr.attr;
        if(attr.type && attrs[attr.type]) {
          matcher = attrs[attr.type](a, attr.matchFor)
        }else {
          if(a.length) {
            matcher = defaultGetter(a)
          }
        }
        if(matcher) {
          ff = agree(ff, matcher)
        }
      })
    }
    if(!ignores.id) {
      if(query.id) {
        ff = agree(ff, function(elem) {
          return!!elem && elem.id == query.id
        })
      }
    }
    if(!ff) {
      if(!("default" in ignores)) {
        ff = goog.functions.TRUE
      }
    }
    return ff
  };
  var nextSiblingIterator = function(filterFunc) {
    return function(node, ret, bag) {
      while(node = node[nSibling]) {
        if(noNextElementSibling && !isElement(node)) {
          continue
        }
        if((!bag || _isUnique(node, bag)) && filterFunc(node)) {
          ret.push(node)
        }
        break
      }
      return ret
    }
  };
  var nextSiblingsIterator = function(filterFunc) {
    return function(root, ret, bag) {
      var te = root[nSibling];
      while(te) {
        if(simpleNodeTest(te)) {
          if(bag && !_isUnique(te, bag)) {
            break
          }
          if(filterFunc(te)) {
            ret.push(te)
          }
        }
        te = te[nSibling]
      }
      return ret
    }
  };
  var _childElements = function(filterFunc) {
    filterFunc = filterFunc || goog.functions.TRUE;
    return function(root, ret, bag) {
      var te, x = 0, tret = root[childNodesName];
      while(te = tret[x++]) {
        if(simpleNodeTest(te) && (!bag || _isUnique(te, bag)) && filterFunc(te, x)) {
          ret.push(te)
        }
      }
      return ret
    }
  };
  var _isDescendant = function(node, root) {
    var pn = node.parentNode;
    while(pn) {
      if(pn == root) {
        break
      }
      pn = pn.parentNode
    }
    return!!pn
  };
  var _getElementsFuncCache = {};
  var getElementsFunc = function(query) {
    var retFunc = _getElementsFuncCache[query.query];
    if(retFunc) {
      return retFunc
    }
    var io = query.infixOper;
    var oper = io ? io.oper : "";
    var filterFunc = getSimpleFilterFunc(query, {el:1});
    var qt = query.tag;
    var wildcardTag = "*" == qt;
    var ecs = goog.dom.getDocument()["getElementsByClassName"];
    if(!oper) {
      if(query.id) {
        filterFunc = !query.loops && wildcardTag ? goog.functions.TRUE : getSimpleFilterFunc(query, {el:1, id:1});
        retFunc = function(root, arr) {
          var te = goog.dom.getDomHelper(root).getElement(query.id);
          if(!te || !filterFunc(te)) {
            return
          }
          if(9 == root.nodeType) {
            return getArr(te, arr)
          }else {
            if(_isDescendant(te, root)) {
              return getArr(te, arr)
            }
          }
        }
      }else {
        if(ecs && /\{\s*\[native code\]\s*\}/.test(String(ecs)) && query.classes.length && !cssCaseBug) {
          filterFunc = getSimpleFilterFunc(query, {el:1, classes:1, id:1});
          var classesString = query.classes.join(" ");
          retFunc = function(root, arr) {
            var ret = getArr(0, arr), te, x = 0;
            var tret = root.getElementsByClassName(classesString);
            while(te = tret[x++]) {
              if(filterFunc(te, root)) {
                ret.push(te)
              }
            }
            return ret
          }
        }else {
          if(!wildcardTag && !query.loops) {
            retFunc = function(root, arr) {
              var ret = getArr(0, arr), te, x = 0;
              var tret = root.getElementsByTagName(query.getTag());
              while(te = tret[x++]) {
                ret.push(te)
              }
              return ret
            }
          }else {
            filterFunc = getSimpleFilterFunc(query, {el:1, tag:1, id:1});
            retFunc = function(root, arr) {
              var ret = getArr(0, arr), te, x = 0;
              var tret = root.getElementsByTagName(query.getTag());
              while(te = tret[x++]) {
                if(filterFunc(te, root)) {
                  ret.push(te)
                }
              }
              return ret
            }
          }
        }
      }
    }else {
      var skipFilters = {el:1};
      if(wildcardTag) {
        skipFilters.tag = 1
      }
      filterFunc = getSimpleFilterFunc(query, skipFilters);
      if("+" == oper) {
        retFunc = nextSiblingIterator(filterFunc)
      }else {
        if("~" == oper) {
          retFunc = nextSiblingsIterator(filterFunc)
        }else {
          if(">" == oper) {
            retFunc = _childElements(filterFunc)
          }
        }
      }
    }
    return _getElementsFuncCache[query.query] = retFunc
  };
  var filterDown = function(root, queryParts) {
    var candidates = getArr(root), qp, x, te, qpl = queryParts.length, bag, ret;
    for(var i = 0;i < qpl;i++) {
      ret = [];
      qp = queryParts[i];
      x = candidates.length - 1;
      if(x > 0) {
        bag = {};
        ret.nozip = true
      }
      var gef = getElementsFunc(qp);
      for(var j = 0;te = candidates[j];j++) {
        gef(te, ret, bag)
      }
      if(!ret.length) {
        break
      }
      candidates = ret
    }
    return ret
  };
  var _queryFuncCacheDOM = {}, _queryFuncCacheQSA = {};
  var getStepQueryFunc = function(query) {
    var qparts = getQueryParts(goog.string.trim(query));
    if(qparts.length == 1) {
      var tef = getElementsFunc(qparts[0]);
      return function(root) {
        var r = tef(root, []);
        if(r) {
          r.nozip = true
        }
        return r
      }
    }
    return function(root) {
      return filterDown(root, qparts)
    }
  };
  var qsa = "querySelectorAll";
  var qsaAvail = !!goog.dom.getDocument()[qsa] && (!goog.userAgent.WEBKIT || goog.userAgent.isVersion("526"));
  var getQueryFunc = function(query, opt_forceDOM) {
    if(qsaAvail) {
      var qsaCached = _queryFuncCacheQSA[query];
      if(qsaCached && !opt_forceDOM) {
        return qsaCached
      }
    }
    var domCached = _queryFuncCacheDOM[query];
    if(domCached) {
      return domCached
    }
    var qcz = query.charAt(0);
    var nospace = -1 == query.indexOf(" ");
    if(query.indexOf("#") >= 0 && nospace) {
      opt_forceDOM = true
    }
    var useQSA = qsaAvail && !opt_forceDOM && specials.indexOf(qcz) == -1 && (!goog.userAgent.IE || query.indexOf(":") == -1) && !(cssCaseBug && query.indexOf(".") >= 0) && query.indexOf(":contains") == -1 && query.indexOf("|=") == -1;
    if(useQSA) {
      var tq = specials.indexOf(query.charAt(query.length - 1)) >= 0 ? query + " *" : query;
      return _queryFuncCacheQSA[query] = function(root) {
        try {
          if(!(9 == root.nodeType || nospace)) {
            throw"";
          }
          var r = root[qsa](tq);
          if(goog.userAgent.IE) {
            r.commentStrip = true
          }else {
            r.nozip = true
          }
          return r
        }catch(e) {
          return getQueryFunc(query, true)(root)
        }
      }
    }else {
      var parts = query.split(/\s*,\s*/);
      return _queryFuncCacheDOM[query] = parts.length < 2 ? getStepQueryFunc(query) : function(root) {
        var pindex = 0, ret = [], tp;
        while(tp = parts[pindex++]) {
          ret = ret.concat(getStepQueryFunc(tp)(root))
        }
        return ret
      }
    }
  };
  var _zipIdx = 0;
  var _nodeUID = goog.userAgent.IE ? function(node) {
    if(caseSensitive) {
      return node.getAttribute("_uid") || node.setAttribute("_uid", ++_zipIdx) || _zipIdx
    }else {
      return node.uniqueID
    }
  } : function(node) {
    return node["_uid"] || (node["_uid"] = ++_zipIdx)
  };
  var _isUnique = function(node, bag) {
    if(!bag) {
      return 1
    }
    var id = _nodeUID(node);
    if(!bag[id]) {
      return bag[id] = 1
    }
    return 0
  };
  var _zipIdxName = "_zipIdx";
  var _zip = function(arr) {
    if(arr && arr.nozip) {
      return arr
    }
    var ret = [];
    if(!arr || !arr.length) {
      return ret
    }
    if(arr[0]) {
      ret.push(arr[0])
    }
    if(arr.length < 2) {
      return ret
    }
    _zipIdx++;
    if(goog.userAgent.IE && caseSensitive) {
      var szidx = _zipIdx + "";
      arr[0].setAttribute(_zipIdxName, szidx);
      for(var x = 1, te;te = arr[x];x++) {
        if(arr[x].getAttribute(_zipIdxName) != szidx) {
          ret.push(te)
        }
        te.setAttribute(_zipIdxName, szidx)
      }
    }else {
      if(goog.userAgent.IE && arr.commentStrip) {
        try {
          for(var x = 1, te;te = arr[x];x++) {
            if(isElement(te)) {
              ret.push(te)
            }
          }
        }catch(e) {
        }
      }else {
        if(arr[0]) {
          arr[0][_zipIdxName] = _zipIdx
        }
        for(var x = 1, te;te = arr[x];x++) {
          if(arr[x][_zipIdxName] != _zipIdx) {
            ret.push(te)
          }
          te[_zipIdxName] = _zipIdx
        }
      }
    }
    return ret
  };
  var query = function(query, root) {
    if(!query) {
      return[]
    }
    if(query.constructor == Array) {
      return query
    }
    if(!goog.isString(query)) {
      return[query]
    }
    if(goog.isString(root)) {
      root = goog.dom.getElement(root);
      if(!root) {
        return[]
      }
    }
    root = root || goog.dom.getDocument();
    var od = root.ownerDocument || root.documentElement;
    caseSensitive = root.contentType && root.contentType == "application/xml" || goog.userAgent.OPERA && (root.doctype || od.toString() == "[object XMLDocument]") || !!od && (goog.userAgent.IE ? od.xml : root.xmlVersion || od.xmlVersion);
    var r = getQueryFunc(query)(root);
    if(r && r.nozip) {
      return r
    }
    return _zip(r)
  };
  query.pseudos = pseudos;
  return query
}();
goog.exportSymbol("goog.dom.query", goog.dom.query);
goog.exportSymbol("goog.dom.query.pseudos", goog.dom.query.pseudos);
goog.provide("domina.css");
goog.require("cljs.core");
goog.require("goog.dom.query");
goog.require("goog.dom");
goog.require("domina");
domina.css.root_element = function root_element() {
  return goog.dom.getElementsByTagNameAndClass("html")[0]
};
domina.css.sel = function() {
  var sel = null;
  var sel__1 = function(expr) {
    return sel.call(null, domina.css.root_element.call(null), expr)
  };
  var sel__2 = function(base, expr) {
    if(void 0 === domina.css.t10191) {
      domina.css.t10191 = function(expr, base, sel, meta10192) {
        this.expr = expr;
        this.base = base;
        this.sel = sel;
        this.meta10192 = meta10192;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 393216
      };
      domina.css.t10191.cljs$lang$type = true;
      domina.css.t10191.cljs$lang$ctorPrSeq = function(this__2206__auto__) {
        return cljs.core.list.call(null, "domina.css/t10191")
      };
      domina.css.t10191.prototype.domina$DomContent$ = true;
      domina.css.t10191.prototype.domina$DomContent$nodes$arity$1 = function(_) {
        var this__10194 = this;
        return cljs.core.mapcat.call(null, function(p1__10182_SHARP_) {
          return domina.normalize_seq.call(null, goog.dom.query(this__10194.expr, p1__10182_SHARP_))
        }, domina.nodes.call(null, this__10194.base))
      };
      domina.css.t10191.prototype.domina$DomContent$single_node$arity$1 = function(_) {
        var this__10195 = this;
        return cljs.core.first.call(null, cljs.core.filter.call(null, cljs.core.complement.call(null, cljs.core.nil_QMARK_), cljs.core.mapcat.call(null, function(p1__10183_SHARP_) {
          return domina.normalize_seq.call(null, goog.dom.query(this__10195.expr, p1__10183_SHARP_))
        }, domina.nodes.call(null, this__10195.base))))
      };
      domina.css.t10191.prototype.cljs$core$IMeta$_meta$arity$1 = function(_10193) {
        var this__10196 = this;
        return this__10196.meta10192
      };
      domina.css.t10191.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_10193, meta10192) {
        var this__10197 = this;
        return new domina.css.t10191(this__10197.expr, this__10197.base, this__10197.sel, meta10192)
      };
      domina.css.t10191
    }else {
    }
    return new domina.css.t10191(expr, base, sel, null)
  };
  sel = function(base, expr) {
    switch(arguments.length) {
      case 1:
        return sel__1.call(this, base);
      case 2:
        return sel__2.call(this, base, expr)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sel.cljs$lang$arity$1 = sel__1;
  sel.cljs$lang$arity$2 = sel__2;
  return sel
}();
goog.provide("eisago_web.var_view");
goog.require("cljs.core");
goog.require("domina.events");
goog.require("domina.css");
goog.require("domina");
eisago_web.var_view.toggle_hidden = function toggle_hidden(element) {
  return domina.toggle_class_BANG_.call(null, element, "hidden")
};
eisago_web.var_view.add_show_hide_toggles = function add_show_hide_toggles() {
  var source_toggle__26215 = domina.css.sel.call(null, "#source-link");
  var example_toggle__26216 = domina.css.sel.call(null, "#examples-link");
  domina.events.listen_BANG_.call(null, source_toggle__26215, "\ufdd0'click", function() {
    return eisago_web.var_view.toggle_hidden.call(null, domina.css.sel.call(null, "#source"))
  });
  return domina.events.listen_BANG_.call(null, example_toggle__26216, "\ufdd0'click", function() {
    return eisago_web.var_view.toggle_hidden.call(null, domina.css.sel.call(null, "#examples"))
  })
};
eisago_web.var_view.init = function init() {
  return eisago_web.var_view.add_show_hide_toggles.call(null)
};
