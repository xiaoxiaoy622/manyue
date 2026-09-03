
(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else {
        var a = factory();
        for (var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
    }
})(typeof self !== 'undefined' ? self : this, function () {
    return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function (module, __unused_webpack_exports, __webpack_require__) {

                "use strict";

                /**
                 * ---------------------------
                 * Time: 2017/9/20 18:33.
                 * Author: Cangshi
                 * View: http://palerock.cn
                 * ---------------------------
                 */


                const eUtils = __webpack_require__(1);

                ~(function (global, factory) {

                    "use strict";

                    if (true && typeof module.exports === "object") {
                        var results = factory.bind(global)(global, eUtils, true) || [];
                        var HookJS = {};
                        results.forEach(function (part) {
                            HookJS[part.name] = part.module;
                        });
                        module.exports = HookJS;
                    } else {
                        factory.bind(global)(global, eUtils);
                    }

                }(typeof window !== "undefined" ? window : this, function (_global, utils, noGlobal) {
                    /**
                     * @namespace EHook
                     * @author Cangshi
                     * @constructor
                     * @see {@link https://palerock.cn/projects/006HDUuOhBj}
                     * @license Apache License 2.0
                     */
                    var EHook = function () {
                        var _autoId = 1;
                        var _hookedMap = {};
                        var _hookedContextMap = {};
                        this._getHookedMap = function () {
                            return _hookedMap;
                        };
                        this._getHookedContextMap = function () {
                            return _hookedContextMap;
                        };
                        this._getAutoStrId = function () {
                            return '__auto__' + _autoId++;
                        };
                        this._getAutoId = function () {
                            return _autoId++;
                        };
                    };
                    EHook.prototype = {
                        /**
                         * 获取一个对象的劫持id，若没有则创建一个
                         * @param context
                         * @return {*}
                         * @private
                         */
                        _getHookedId: function (context) {
                            var contextMap = this._getHookedContextMap();
                            var hookedId = null;
                            Object.keys(contextMap).forEach(key => {
                                if (context === contextMap[key]) {
                                    hookedId = key;
                                }
                            });
                            if (hookedId == null) {
                                hookedId = this._getAutoStrId();
                                contextMap[hookedId] = context;
                            }
                            return hookedId;
                        },
                        /**
                         * 获取一个对象的劫持方法映射，若没有则创建一个
                         * @param context
                         * @return {*}
                         * @private
                         */
                        _getHookedMethodMap: function (context) {
                            var hookedId = this._getHookedId(context);
                            var hookedMap = this._getHookedMap();
                            var thisTask = hookedMap[hookedId];
                            if (!utils.isExistObject(thisTask)) {
                                thisTask = hookedMap[hookedId] = {};
                            }
                            return thisTask;
                        },
                        /**
                         * 获取对应方法的hook原型任务对象，若没有则初始化一个。
                         * @param context
                         * @param methodName
                         * @private
                         */
                        _getHookedMethodTask: function (context, methodName) {
                            var thisMethodMap = this._getHookedMethodMap(context);
                            var thisMethod = thisMethodMap[methodName];
                            if (!utils.isExistObject(thisMethod)) {
                                thisMethod = thisMethodMap[methodName] = {
                                    original: undefined,
                                    replace: undefined,
                                    task: {
                                        before: [],
                                        current: undefined,
                                        after: []
                                    }
                                };
                            }
                            return thisMethod;
                        },
                        /**
                         * 执行多个方法并注入一个方法和参数集合
                         * @param context
                         * @param methods
                         * @param args
                         * @return result 最后一次执行方法的有效返回值
                         * @private
                         */
                        _invokeMethods: function (context, methods, args) {
                            if (!utils.isArray(methods)) {
                                return;
                            }
                            var result = null;
                            utils.ergodicArrayObject(context, methods, function (_method) {
                                if (!utils.isFunction(_method.method)) {
                                    return;
                                }
                                var r = _method.method.apply(this, args);
                                if (r != null) {
                                    result = r;
                                }
                            });
                            return result;
                        },
                        /**
                         * 生成和替换劫持方法
                         * @param parent
                         * @param context
                         * @param methodName {string}
                         * @private
                         */
                        _hook: function (parent, methodName, context) {
                            if (context === undefined) {
                                context = parent;
                            }
                            var method = parent[methodName];
                            var methodTask = this._getHookedMethodTask(parent, methodName);
                            if (!methodTask.original) {
                                methodTask.original = method;
                            }
                            if (utils.isExistObject(methodTask.replace) && utils.isFunction(methodTask.replace.method)) {
                                parent[methodName] = methodTask.replace.method(methodTask.original);
                                return;
                            }
                            var invokeMethods = this._invokeMethods;
                            // 组装劫持函数
                            var builder = new utils.FunctionBuilder(function (v) {
                                return {
                                    result: undefined
                                };
                            });
                            if (methodTask.task.before.length > 0) {
                                builder.push(function (v) {
                                    invokeMethods(context || v.this, methodTask.task.before, [methodTask.original, v.arguments]);
                                });
                            }
                            if (utils.isExistObject(methodTask.task.current) && utils.isFunction(methodTask.task.current.method)) {
                                builder.push(function (v) {
                                    return {
                                        result: methodTask.task.current.method.call(context || v.this, parent, methodTask.original, v.arguments)
                                    }
                                });
                            } else {
                                builder.push(function (v) {
                                    return {
                                        result: methodTask.original.apply(context || v.this, v.arguments)
                                    }
                                });
                            }
                            if (methodTask.task.after.length > 0) {
                                builder.push(function (v) {
                                    var args = [];
                                    args.push(methodTask.original);
                                    args.push(v.arguments);
                                    args.push(v.result);
                                    var r = invokeMethods(context || v.this, methodTask.task.after, args);
                                    return {
                                        result: (r != null ? r : v.result)
                                    };
                                });
                            }
                            builder.push(function (v) {
                                return {
                                    returnValue: v.result
                                };
                            });
                            // var methodStr = '(function(){\n';
                            // methodStr = methodStr + 'var result = undefined;\n';
                            // if (methodTask.task.before.length > 0) {
                            //     methodStr = methodStr + 'invokeMethods(context, methodTask.task.before,[methodTask.original, arguments]);\n';
                            // }
                            // if (utils.isExistObject(methodTask.task.current) && utils.isFunction(methodTask.task.current.method)) {
                            //     methodStr = methodStr + 'result = methodTask.task.current.method.call(context, parent, methodTask.original, arguments);\n';
                            // } else {
                            //     methodStr = methodStr + 'result = methodTask.original.apply(context, arguments);\n';
                            // }
                            // if (methodTask.task.after.length > 0) {
                            //     methodStr = methodStr + 'var args = [];args.push(methodTask.original);args.push(arguments);args.push(result);\n';
                            //     methodStr = methodStr + 'var r = invokeMethods(context, methodTask.task.after, args);result = (r!=null?r:result);\n';
                            // }
                            // methodStr = methodStr + 'return result;\n})';
                            // 绑定劫持函数
                            var resultFunc = builder.result();
                            for (var proxyName in methodTask.original) {
                                Object.defineProperty(resultFunc, proxyName, {
                                    get: function () {
                                        return methodTask.original[proxyName];
                                    },
                                    set: function (v) {
                                        methodTask.original[proxyName] = v;
                                    }
                                })
                            }
                            resultFunc.prototype = methodTask.original.prototype;
                            parent[methodName] = resultFunc;
                        },
                        /**
                         * 劫持一个方法
                         * @inner
                         * @memberOf EHook
                         * @param parent{Object} 指定方法所在的对象
                         * @param methodName{String} 指定方法的名称
                         * @param config{Object} 劫持的配置对象
                         */
                        hook: function (parent, methodName, config) {
                            var hookedFailure = -1;
                            // 调用方法的上下文
                            var context = config.context !== undefined ? config.context : parent;
                            if (parent[methodName] == null) {
                                parent[methodName] = function () {
                                }
                            }
                            if (!utils.isFunction(parent[methodName])) {
                                return hookedFailure;
                            }
                            var methodTask = this._getHookedMethodTask(parent, methodName);
                            var id = this._getAutoId();
                            if (utils.isFunction(config.replace)) {
                                methodTask.replace = {
                                    id: id,
                                    method: config.replace
                                };
                                hookedFailure = 0;
                            }
                            if (utils.isFunction(config.before)) {
                                methodTask.task.before.push({
                                    id: id,
                                    method: config.before
                                });
                                hookedFailure = 0;
                            }
                            if (utils.isFunction(config.current)) {
                                methodTask.task.current = {
                                    id: id,
                                    method: config.current
                                };
                                hookedFailure = 0;
                            }
                            if (utils.isFunction(config.after)) {
                                methodTask.task.after.push({
                                    id: id,
                                    method: config.after
                                });
                                hookedFailure = 0;
                            }
                            if (hookedFailure === 0) {
                                this._hook(parent, methodName, context);
                                return id;
                            } else {
                                return hookedFailure;
                            }

                        },
                        /**
                         * 劫持替换一个方法
                         * @see 注意：该方法会覆盖指定劫持方法在之前所进行的一切劫持，也不能重复使用，并且不和hookAfter,hookCurrent,hookBefore共存，在同时使用的情况下，优先使用hookReplace而不是其他的方法
                         * @inner
                         * @memberOf EHook
                         * @param parent{Object} 指定方法所在的对象
                         * @param context{Object=} 回调方法的上下文
                         * @param methodName{String} 指定方法的名称
                         * @param replace {function} 回调方法，该方法的返回值便是替换的方法 回调参数及返回值：[ method:指定的原方法，类型:function return:规定被替换的方法内容，类型:function ]
                         * @return {number} 该次劫持的id
                         */
                        hookReplace: function (parent, methodName, replace, context) {
                            return this.hook(parent, methodName, {
                                replace: replace,
                                context: context
                            });
                        },
                        /**
                         * 在指定方法前执行
                         * @inner
                         * @memberOf EHook
                         * @param parent{Object} 指定方法所在的对象
                         * @param methodName{String} 指定方法的名称
                         * @param before{function} 回调方法，该方法在指定方法运行前执行 回调参数：[ method:指定的原方法 args:原方法运行的参数（在此改变参数值会影响后续指定方法的参数值） ]
                         * @param context{Object=} 回调方法的上下文
                         * @returns {number} 劫持id（用于解除劫持）
                         */
                        hookBefore: function (parent, methodName, before, context) {
                            return this.hook(parent, methodName, {
                                before: before,
                                context: context
                            });
                        },
                        /**
                         * 劫持方法的运行，在对制定方法进行该劫持的时候，指定方法不会主动执行，替换为执行参数中的current方法
                         * @see 注意：该方法只能对指定方法进行一次劫持，若再次使用该方法劫持就会覆盖之前的劫持[可以和hookBefore,hookAfter共存，且hookBefore和hookAfter可以对同个指定方法多次劫持]
                         * @inner
                         * @memberOf EHook
                         * @param parent{Object} 指定方法所在的对象
                         * @param methodName{String} 指定方法的名称
                         * @param current{function} 回调方法，该方法在指定方法被调用时执行 回调参数及返回值：[ parent:指定方法所在的对象，类型:object method:指定的原方法，类型:function args:原方法的参数，类型:array return:规定被劫持方法的返回值，类型:* ]
                         * @param context{Object=} 回调方法的上下文
                         * @returns {number} 劫持id（用于解除劫持）
                         */
                        hookCurrent: function (parent, methodName, current, context) {
                            return this.hook(parent, methodName, {
                                current: current,
                                context: context
                            });
                        },
                        /**
                         * 在指定方法后执行
                         * @inner
                         * @memberOf EHook
                         * @param parent{Object} 指定方法所在的对象
                         * @param methodName{String} 指定方法的名称
                         * @param after{function} 回调方法，该方法在指定方法运行后执行 回调参数及返回值：[ method:指定的原方法，类型:function args:原方法的参数，类型:array result:原方法的返回值，类型:* return:规定被劫持方法的返回值，类型:* ]
                         * @param context{Object=} 回调方法的上下文
                         * @returns {number} 劫持id（用于解除劫持）
                         */
                        hookAfter: function (parent, methodName, after, context) {
                            return this.hook(parent, methodName, {
                                after: after,
                                context: context
                            });
                        },
                        hookClass: function (parent, className, replace, innerName, excludeProperties) {
                            var _this = this;
                            var originFunc = parent[className];
                            if (!excludeProperties) {
                                excludeProperties = [];
                            }
                            excludeProperties.push('prototype');
                            excludeProperties.push('caller');
                            excludeProperties.push('arguments');
                            innerName = innerName || '_innerHook';
                            var resFunc = function () {
                                this[innerName] = new originFunc();
                                replace.apply(this, arguments);
                            };
                            this.hookedToString(originFunc, resFunc);
                            this.hookedToProperties(originFunc, resFunc, true, excludeProperties);
                            var prototypeProperties = Object.getOwnPropertyNames(originFunc.prototype);
                            var prototype = resFunc.prototype = {
                                constructor: resFunc
                            };
                            prototypeProperties.forEach(function (name) {
                                if (name === 'constructor') {
                                    return;
                                }
                                var method = function () {
                                    if (originFunc.prototype[name] && utils.isFunction(originFunc.prototype[name])) {
                                        return originFunc.prototype[name].apply(this[innerName], arguments);
                                    }
                                    return undefined;
                                };
                                _this.hookedToString(originFunc.prototype[name], method);
                                prototype[name] = method;
                            });
                            this.hookReplace(parent, className, function () {
                                return resFunc;
                            }, parent)
                        },
                        hookedToProperties: function (originObject, resultObject, isDefined, excludeProperties) {
                            var objectProperties = Object.getOwnPropertyNames(originObject);
                            objectProperties.forEach(function (property) {
                                if (utils.contains(excludeProperties, property)) {
                                    return;
                                }
                                if (!isDefined) {
                                    resultObject[property] = originObject[property];
                                } else {
                                    Object.defineProperty(resultObject, property, {
                                        configurable: false,
                                        enumerable: false,
                                        value: originObject[property],
                                        writable: false
                                    });
                                }
                            });
                        },
                        hookedToString: function (originObject, resultObject) {
                            Object.defineProperties(resultObject, {
                                toString: {
                                    configurable: false,
                                    enumerable: false,
                                    value: originObject.toString.bind(originObject),
                                    writable: false
                                },
                                toLocaleString: {
                                    configurable: false,
                                    enumerable: false,
                                    value: originObject.toLocaleString.bind(originObject),
                                    writable: false
                                }
                            })
                        },
                        /**
                         * 劫持全局ajax
                         * @inner
                         * @memberOf EHook
                         * @param methods {object} 劫持的方法
                         * @return {*|number} 劫持的id
                         */
                        hookAjax: function (methods) {
                            if (this.isHooked(_global, 'XMLHttpRequest')) {
                                return;
                            }
                            var _this = this;
                            var hookMethod = function (methodName) {
                                if (utils.isFunction(methods[methodName])) {
                                    // 在执行方法之前hook原方法
                                    _this.hookBefore(this.xhr, methodName, methods[methodName]);
                                }
                                // 返回方法调用内部的xhr
                                return this.xhr[methodName].bind(this.xhr);
                            };
                            var getProperty = function (attr) {
                                return function () {
                                    return this.hasOwnProperty(attr + "_") ? this[attr + "_"] : this.xhr[attr];
                                };
                            };
                            var setProperty = function (attr) {
                                return function (f) {
                                    var xhr = this.xhr;
                                    var that = this;
                                    if (attr.indexOf("on") !== 0) {
                                        this[attr + "_"] = f;
                                        return;
                                    }
                                    if (methods[attr]) {
                                        xhr[attr] = function () {
                                            f.apply(xhr, arguments);
                                        };
                                        // on方法在set时劫持
                                        _this.hookBefore(xhr, attr, methods[attr]);
                                        // console.log(1,attr);
                                        // xhr[attr] = function () {
                                        //     methods[attr](that) || f.apply(xhr, arguments);
                                        // }
                                    } else {
                                        xhr[attr] = f;
                                    }
                                };
                            };
                            return this.hookReplace(_global, 'XMLHttpRequest', function (XMLHttpRequest) {
                                var resFunc = function () {
                                    this.xhr = new XMLHttpRequest();
                                    for (var propertyName in this.xhr) {
                                        var property = this.xhr[propertyName];
                                        if (utils.isFunction(property)) {
                                            // hook 原方法
                                            this[propertyName] = hookMethod.bind(this)(propertyName);
                                        } else {
                                            Object.defineProperty(this, propertyName, {
                                                get: getProperty(propertyName),
                                                set: setProperty(propertyName)
                                            });
                                        }
                                    }
                                    // 定义外部xhr可以在内部访问
                                    this.xhr.xhr = this;
                                };
                                _this.hookedToProperties(XMLHttpRequest, resFunc, true);
                                _this.hookedToString(XMLHttpRequest, resFunc);
                                return resFunc
                            });
                        },
                        /**
                         * 劫持全局ajax
                         * @param methods {object} 劫持的方法
                         * @return {*|number} 劫持的id
                         */
                        hookAjaxV2: function (methods) {
                            this.hookClass(window, 'XMLHttpRequest', function () {

                            });
                            utils.ergodicObject(this, methods, function (method) {

                            });
                        },
                        /**
                         * 解除劫持
                         * @inner
                         * @memberOf EHook
                         * @param context 上下文
                         * @param methodName 方法名
                         * @param isDeeply {boolean=} 是否深度解除[默认为false]
                         * @param eqId {number=}  解除指定id的劫持[可选]
                         */
                        unHook: function (context, methodName, isDeeply, eqId) {
                            if (!context[methodName] || !utils.isFunction(context[methodName])) {
                                return;
                            }
                            var methodTask = this._getHookedMethodTask(context, methodName);
                            if (eqId) {
                                if (this.unHookById(eqId)) {
                                    return;
                                }
                            }
                            if (!methodTask.original) {
                                delete this._getHookedMethodMap(context)[methodName];
                                return;
                            }
                            context[methodName] = methodTask.original;
                            if (isDeeply) {
                                delete this._getHookedMethodMap(context)[methodName];
                            }
                        },
                        /**
                         * 通过Id解除劫持
                         * @inner
                         * @memberOf EHook
                         * @param eqId
                         * @returns {boolean}
                         */
                        unHookById: function (eqId) {
                            var hasEq = false;
                            if (eqId) {
                                var hookedMap = this._getHookedMap();
                                utils.ergodicObject(this, hookedMap, function (contextMap) {
                                    utils.ergodicObject(this, contextMap, function (methodTask) {
                                        methodTask.task.before = methodTask.task.before.filter(function (before) {
                                            hasEq = hasEq || before.id === eqId;
                                            return before.id !== eqId;
                                        });
                                        methodTask.task.after = methodTask.task.after.filter(function (after) {
                                            hasEq = hasEq || after.id === eqId;
                                            return after.id !== eqId;
                                        });
                                        if (methodTask.task.current && methodTask.task.current.id === eqId) {
                                            methodTask.task.current = undefined;
                                            hasEq = true;
                                        }
                                        if (methodTask.replace && methodTask.replace.id === eqId) {
                                            methodTask.replace = undefined;
                                            hasEq = true;
                                        }
                                    })
                                });
                            }
                            return hasEq;
                        },
                        /**
                         *  移除所有劫持相关的方法
                         * @inner
                         * @memberOf EHook
                         * @param context 上下文
                         * @param methodName 方法名
                         */
                        removeHookMethod: function (context, methodName) {
                            if (!context[methodName] || !utils.isFunction(context[methodName])) {
                                return;
                            }
                            this._getHookedMethodMap(context)[methodName] = {
                                original: undefined,
                                replace: undefined,
                                task: {
                                    before: [],
                                    current: undefined,
                                    after: []
                                }
                            };
                        },
                        /**
                         * 判断一个方法是否被劫持过
                         * @inner
                         * @memberOf EHook
                         * @param context
                         * @param methodName
                         */
                        isHooked: function (context, methodName) {
                            var hookMap = this._getHookedMethodMap(context);
                            return hookMap[methodName] !== undefined ? (hookMap[methodName].original !== undefined) : false;
                        },
                        /**
                         * 保护一个对象使之不会被篡改
                         * @inner
                         * @memberOf EHook
                         * @param parent
                         * @param methodName
                         */
                        protect: function (parent, methodName) {
                            Object.defineProperty(parent, methodName, {
                                configurable: false,
                                writable: false
                            });
                        },
                        preventError: function (parent, methodName, returnValue, context) {
                            this.hookCurrent(parent, methodName, function (m, args) {
                                var value = returnValue;
                                try {
                                    value = m.apply(this, args);
                                } catch (e) {
                                    console.log('Error Prevented from method ' + methodName, e);
                                }
                                return value;
                            }, context)
                        },
                        /**
                         * 装载插件
                         * @inner
                         * @memberOf EHook
                         * @param option
                         */
                        plugins: function (option) {
                            if (utils.isFunction(option.mount)) {
                                var result = option.mount.call(this, utils);
                                if (typeof option.name === 'string') {
                                    _global[option.name] = result;
                                }
                            }
                        }
                    };
                    if (_global.eHook && (_global.eHook instanceof EHook)) {
                        return;
                    }
                    var eHook = new EHook();
                    /**
                     * @namespace AHook
                     * @author Cangshi
                     * @constructor
                     * @see {@link https://palerock.cn/projects/006HDUuOhBj}
                     * @license Apache License 2.0
                     */
                    var AHook = function () {
                        this.isHooked = false;
                        var autoId = 1;
                        this._urlDispatcherList = [];
                        this._getAutoId = function () {
                            return autoId++;
                        };
                    };
                    AHook.prototype = {
                        /**
                         * 执行配置列表中的指定方法组
                         * @param xhr
                         * @param methodName
                         * @param args
                         * @private
                         */
                        _invokeAimMethods: function (xhr, methodName, args) {
                            var configs = utils.parseArrayByProperty(xhr.patcherList, 'config');
                            var methods = [];
                            utils.ergodicArrayObject(xhr, configs, function (config) {
                                if (utils.isFunction(config[methodName])) {
                                    methods.push(config[methodName]);
                                }
                            });
                            return utils.invokeMethods(xhr, methods, args);
                        },
                        /**
                         * 根据url获取配置列表
                         * @param url
                         * @return {Array}
                         * @private
                         */
                        _urlPatcher: function (url) {
                            var patcherList = [];
                            utils.ergodicArrayObject(this, this._urlDispatcherList, function (patcherMap, i) {
                                if (utils.UrlUtils.urlMatching(url, patcherMap.patcher)) {
                                    patcherList.push(patcherMap);
                                }
                            });
                            return patcherList;
                        },
                        /**
                         * 根据xhr对象分发回调请求
                         * @param xhr
                         * @param fullUrl
                         * @private
                         */
                        _xhrDispatcher: function (xhr, fullUrl) {
                            var url = utils.UrlUtils.getUrlWithoutParam(fullUrl);
                            xhr.patcherList = this._urlPatcher(url);
                        },
                        /**
                         * 转换响应事件
                         * @param e
                         * @param xhr
                         * @private
                         */
                        _parseEvent: function (e, xhr) {
                            try {
                                Object.defineProperties(e, {
                                    target: {
                                        get: function () {
                                            return xhr;
                                        }
                                    },
                                    srcElement: {
                                        get: function () {
                                            return xhr;
                                        }
                                    }
                                });
                            } catch (error) {
                                console.warn('重定义返回事件失败，劫持响应可能失败');
                            }
                            return e;
                        },
                        /**
                         * 解析open方法的参数
                         * @param args
                         * @private
                         */
                        _parseOpenArgs: function (args) {
                            return {
                                method: args[0],
                                fullUrl: args[1],
                                url: utils.UrlUtils.getUrlWithoutParam(args[1]),
                                params: utils.UrlUtils.getParamFromUrl(args[1]),
                                async: args[2]
                            };
                        },
                        /**
                         * 劫持ajax 请求参数
                         * @param argsObject
                         * @param argsArray
                         * @private
                         */
                        _rebuildOpenArgs: function (argsObject, argsArray) {
                            argsArray[0] = argsObject.method;
                            argsArray[1] = utils.UrlUtils.margeUrlAndParams(argsObject.url, argsObject.params);
                            argsArray[2] = argsObject.async;
                        },
                        /**
                         * 获取劫持方法的参数 [原方法,原方法参数,原方法返回值]，剔除原方法参数
                         * @param args
                         * @return {*|Array.<T>}
                         * @private
                         */
                        _getHookedArgs: function (args) {
                            // 将参数中'原方法'剔除
                            return Array.prototype.slice.call(args, 0).splice(1);
                        },
                        /**
                         * 响应被触发时调用的方法
                         * @param outerXhr
                         * @param funcArgs
                         * @private
                         */
                        _onResponse: function (outerXhr, funcArgs) {
                            // 因为参数是被劫持的参数为[method(原方法),args(参数)],该方法直接获取参数并转换为数组
                            var args = this._getHookedArgs(funcArgs);
                            args[0][0] = this._parseEvent(args[0][0], outerXhr.xhr); // 强制事件指向外部xhr
                            // 执行所有的名为hookResponse的方法组
                            var results = this._invokeAimMethods(outerXhr, 'hookResponse', args);
                            // 遍历结果数组并获取最后返回的有效的值作为响应值
                            var resultIndex = -1;
                            utils.ergodicArrayObject(outerXhr, results, function (res, i) {
                                if (res != null) {
                                    resultIndex = i;
                                }
                            });
                            if (resultIndex !== -1) {
                                outerXhr.xhr.responseText_ = outerXhr.xhr.response_ = results[resultIndex];
                            }
                        },
                        /**
                         * 手动开始劫持
                         * @inner
                         * @memberOf AHook
                         */
                        startHook: function () {
                            var _this = this;
                            var normalMethods = {
                                // 方法中的this指向内部xhr
                                // 拦截响应
                                onreadystatechange: function () {
                                    if (this.readyState == 4 && this.status == 200 || this.status == 304) {
                                        _this._onResponse(this, arguments);
                                    }
                                },
                                onload: function () {
                                    _this._onResponse(this, arguments);
                                },
                                // 拦截请求
                                open: function () {
                                    var args = _this._getHookedArgs(arguments);
                                    var fullUrl = args[0][1];
                                    _this._xhrDispatcher(this, fullUrl);
                                    var argsObject = _this._parseOpenArgs(args[0]);
                                    this.openArgs = argsObject;
                                    _this._invokeAimMethods(this, 'hookRequest', [argsObject]);
                                    _this._rebuildOpenArgs(argsObject, args[0]);
                                },
                                send: function () {
                                    var args = _this._getHookedArgs(arguments);
                                    this.sendArgs = args;
                                    _this._invokeAimMethods(this, 'hookSend', args);
                                }
                            };
                            // 设置总的hookId
                            this.___hookedId = _global.eHook.hookAjax(normalMethods);
                            this.isHooked = true;
                        },
                        /**
                         * 注册ajaxUrl拦截
                         * @inner
                         * @memberOf AHook
                         * @param urlPatcher
                         * @param configOrRequest
                         * @param response
                         * @return {number}
                         */
                        register: function (urlPatcher, configOrRequest, response) {
                            if (!urlPatcher) {
                                return -1;
                            }
                            if (!utils.isExistObject(configOrRequest) && !utils.isFunction(response)) {
                                return -1;
                            }
                            var config = {};
                            if (utils.isFunction(configOrRequest)) {
                                config.hookRequest = configOrRequest;
                            }
                            if (utils.isFunction(response)) {
                                config.hookResponse = response;
                            }
                            if (utils.isExistObject(configOrRequest)) {
                                config = configOrRequest;
                            }
                            var id = this._getAutoId();
                            this._urlDispatcherList.push({
                                // 指定id便于后续取消
                                id: id,
                                patcher: urlPatcher,
                                config: config
                            });
                            // 当注册一个register时，自动开始运行劫持
                            if (!this.isHooked) {
                                this.startHook();
                            }
                            return id;
                        }
                        // todo 注销  cancellation: function (registerId){};
                    };

                    _global['eHook'] = eHook;
                    _global['aHook'] = new AHook();

                    return [{
                        name: 'eHook',
                        module: eHook
                    }, {
                        name: 'aHook',
                        module: _global['aHook']
                    }]

                }));

                /***/
}),
/* 1 */
/***/ (function (module) {

                (function (global, factory) {

                    "use strict";

                    if (true && typeof module.exports === "object") {
                        module.exports = factory(global, true);
                    } else {
                        factory(global);
                    }

                }(typeof window !== "undefined" ? window : this, function (_global, noGlobal) {

                    var map = Array.prototype.map;
                    var forEach = Array.prototype.forEach;
                    var reduce = Array.prototype.reduce;

                    var BaseUtils = {
                        /**
                         * 对象是否为数组
                         * @param arr
                         */
                        isArray: function (arr) {
                            return Array.isArray(arr) || Object.prototype.toString.call(arr) === "[object Array]";
                        },
                        /**
                         * 判断是否为方法
                         * @param func
                         * @return {boolean}
                         */
                        isFunction: function (func) {
                            if (!func) {
                                return false;
                            }
                            return typeof func === 'function';
                        },
                        /**
                         * 判断是否是一个有效的对象
                         * @param obj
                         * @return {*|boolean}
                         */
                        isExistObject: function (obj) {
                            return obj && (typeof obj === 'object');
                        },
                        isString: function (str) {
                            if (str === null) {
                                return false;
                            }
                            return typeof str === 'string';
                        },
                        uniqueNum: 1000,
                        /**
                         * 根据当前时间戳生产一个随机id
                         * @returns {string}
                         */
                        buildUniqueId: function () {
                            var prefix = new Date().getTime().toString();
                            var suffix = this.uniqueNum.toString();
                            this.uniqueNum++;
                            return prefix + suffix;
                        }
                    };

                    //
                    var serviceProvider = {
                        _parseDepends: function (depends) {
                            var dependsArr = [];
                            if (!BaseUtils.isArray(depends)) {
                                return;
                            }
                            forEach.call(depends, function (depend) {
                                if (BaseUtils.isString(depend)) {
                                    dependsArr.push(serviceProvider[depend.toLowerCase()]);
                                }
                            });
                            return dependsArr;
                        }
                    };

                    var factory = function (name, depends, construction) {
                        if (!BaseUtils.isFunction(construction)) {
                            return;
                        }
                        serviceProvider[name.toLowerCase()] = construction.apply(this, serviceProvider._parseDepends(depends));
                    };

                    var depend = function (depends, construction) {
                        if (!BaseUtils.isFunction(construction)) {
                            return;
                        }
                        construction.apply(this, serviceProvider._parseDepends(depends));
                    };

                    factory('BaseUtils', [], function () {
                        return BaseUtils;
                    });

                    // logger
                    factory('logger', [], function () {
                        return console;
                    });

                    // DateTimeUtils
                    factory('DateTimeUtils', ['logger'], function (logger) {
                        return {
                            /**
                             * 打印当前时间
                             */
                            printNowTime: function () {
                                var date = new Date();
                                console.log(this.pattern(date, 'hh:mm:ss:S'));
                            },
                            /**
                             * 格式化日期
                             * @param date
                             * @param fmt
                             * @returns {*}
                             */
                            pattern: function (date, fmt) {
                                var o = {
                                    "M+": date.getMonth() + 1, //月份
                                    "d+": date.getDate(), //日
                                    "h+": date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, //小时
                                    "H+": date.getHours(), //小时
                                    "m+": date.getMinutes(), //分
                                    "s+": date.getSeconds(), //秒
                                    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
                                    "S": date.getMilliseconds() //毫秒
                                };
                                var week = {
                                    "0": "/u65e5",
                                    "1": "/u4e00",
                                    "2": "/u4e8c",
                                    "3": "/u4e09",
                                    "4": "/u56db",
                                    "5": "/u4e94",
                                    "6": "/u516d"
                                };
                                if (/(y+)/.test(fmt)) {
                                    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
                                }
                                if (/(E+)/.test(fmt)) {
                                    fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[date.getDay() + ""]);
                                }
                                for (var k in o) {
                                    if (new RegExp("(" + k + ")").test(fmt)) {
                                        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                                    }
                                }
                                return fmt;
                            },
                            /**
                             * 以当前时间获取id
                             * @returns {number}
                             */
                            getCurrentId: function () {
                                var date = new Date();
                                return date.getTime();
                            },
                            /**
                             * 获取指定时间距离现在相差多久
                             * @param date {number|Date}
                             * @param isCeil{boolean=} 是否对结果向上取整，默认[false]
                             * @param type {string=} 单位可取值['day','month','year']默认'day'
                             * @returns {number}
                             */
                            getNowBetweenADay: function (date, isCeil, type) {
                                if (!type) {
                                    type = 'day'
                                }
                                if (typeof date === 'number') {
                                    date = new Date(date);
                                }
                                if (!(date instanceof Date)) {
                                    throw new TypeError('该参数类型必须是Date')
                                }
                                var time = date.getTime();
                                var now = new Date();
                                var nowTime = now.getTime();
                                if (nowTime - time < 0) {
                                    logger.warn('需要计算的时间必须在当前时间之前');
                                }
                                var result = 0;
                                switch (type) {
                                    default:
                                    case 'day':
                                        result = (nowTime - time) / (1000 * 60 * 60 * 24);
                                        break;
                                    case 'month':
                                        var yearDifference = now.getFullYear() - date.getFullYear();
                                        if (yearDifference > 0) {
                                            result += yearDifference * 12;
                                        }
                                        result += now.getMonth() - date.getMonth();
                                        break;
                                    case 'year':
                                        result += now.getFullYear() - date.getFullYear();
                                        break;
                                }
                                if (!isCeil) {
                                    return Math.floor(result);
                                } else {
                                    if (result === 0 && isCeil) {
                                        result = 1;
                                    }
                                    return Math.ceil(result);
                                }
                            }
                        }
                    });

                    // ArrayUtils
                    factory('ArrayUtils', ['BaseUtils'], function (BaseUtils) {
                        return {
                            isArrayObject: function (arr) {
                                return BaseUtils.isArray(arr);
                            },
                            /**
                             * 遍历数组
                             * @param context {Object}
                             * @param arr {Array}
                             * @param cb {Function} 回调函数
                             */
                            ergodicArrayObject: function (context, arr, cb) {
                                if (!context) {
                                    context = _global;
                                }
                                if (!BaseUtils.isArray(arr) || !BaseUtils.isFunction(cb)) {
                                    return;
                                }
                                for (var i = 0; i < arr.length; i++) {
                                    var result = cb.call(context, arr[i], i);
                                    if (result && result === -1) {
                                        break;
                                    }
                                }
                            },
                            /**
                             * 获取数组对象的一个属性发起动作
                             * @param context {Object}
                             * @param arr {Array}
                             * @param propertyName {String}
                             * @param cb {Function}
                             * @param checkProperty {boolean} 是否排除不拥有该属性的对象[default:true]
                             */
                            getPropertyDo: function (context, arr, propertyName, cb, checkProperty) {
                                if (checkProperty === null) {
                                    checkProperty = true;
                                }
                                this.ergodicArrayObject(context, arr, function (ele) {
                                    if (!checkProperty || ele.hasOwnProperty(propertyName)) {
                                        cb.call(context, ele[propertyName], ele);
                                    }
                                })
                            },
                            /**
                             * [私有方法]将多个键值对对象转换为map
                             * @param arr {Array}
                             * @returns {{}}
                             */
                            parseKeyValue: function (arr) {
                                var map = {};
                                if (!(BaseUtils.isArray(arr))) {
                                    return map;
                                }
                                this.ergodicArrayObject(this, arr, function (ele) {
                                    if (ele.key === null) {
                                        return;
                                    }
                                    if (!map.hasOwnProperty(ele.key)) {
                                        map[ele.key] = ele.value;
                                    }
                                });
                                return map;
                            },
                            /**
                             * 获取数组的哈希码
                             * @param arr {Array}
                             * @returns {number}
                             */
                            getHashCode: function (arr) {
                                var str = arr.toString();
                                var hash = 31;
                                if (str.length === 0) return hash;
                                for (var i = 0; i < str.length; i++) {
                                    var char = str.charCodeAt(i);
                                    hash = ((hash << 5) - hash) + char;
                                    hash = hash & hash; // Convert to 32bit integer
                                }
                                return hash;
                            },
                            /**
                             * 通过数组中每个对象的指定属性生成一个新数组
                             * @param arr {Array}
                             * @param propertyName {String}
                             */
                            parseArrayByProperty: function (arr, propertyName) {
                                var result = [];
                                if (!this.isArrayObject(arr)) {
                                    return result;
                                }
                                this.getPropertyDo(this, arr, propertyName, function (value) {
                                    result.push(value);
                                }, true);
                                return result;
                            },
                            /**
                             * 数组对象是否包含一个对象
                             * @param arr {Array}
                             * @param obj
                             * @param cb {function=}
                             * @returns {boolean}
                             */
                            isContainsObject: function (arr, obj, cb) {
                                var isContainsObject = false;
                                this.ergodicArrayObject(this, arr, function (value, i) {
                                    if (obj === value) {
                                        isContainsObject = true;
                                        if (BaseUtils.isFunction(cb)) {
                                            cb.call(_global, i);
                                        }
                                        return -1;
                                    }
                                });
                                return isContainsObject;
                            },
                            /**
                             * 获取数组中的最大值
                             * @param arr 若数组中的对象还是数组，则按里面数组的每个对象进行多级比较
                             * @param cb
                             * @returns {*}
                             */
                            getMaxInArray: function (arr, cb) {
                                var maxObject = null;
                                var maxIndex = -1;
                                while (maxObject === null && maxIndex < arr.length) {
                                    maxObject = arr[++maxIndex]
                                }
                                for (var i = maxIndex + 1; i < arr.length; i++) {
                                    // 若是比较对象都是数组，则对每个数组的第一个元素进行比较，若相同，则比较第二个元素
                                    if (maxObject !== null && this.isArrayObject(maxObject) && this.isArrayObject(arr[i])) {
                                        var classLength = maxObject.length;
                                        var classLevel = 0;
                                        // console.log(maxObject[classLevel],arr[i][classLevel]);
                                        while (maxObject[classLevel] === arr[i][classLevel] && classLevel < classLength) {
                                            classLevel++
                                        }
                                        if (maxObject[classLevel] !== null && maxObject[classLevel] < arr[i][classLevel]) {
                                            maxObject = arr[i];
                                            maxIndex = i;
                                        }
                                        continue;
                                    }
                                    if (maxObject !== null && maxObject < arr[i]) {
                                        maxObject = arr[i];
                                        maxIndex = i;
                                    }
                                }
                                if (BaseUtils.isFunction(cb)) {
                                    cb.call(this, maxObject, maxIndex);
                                }
                                return maxObject;
                            },
                            /**
                             * 获取数组中的总值
                             * @param arr{Array<number>}
                             * @param cb {function=}
                             */
                            getSumInArray: function (arr, cb) {
                                if (!this.isArrayObject(arr)) {
                                    return;
                                }
                                var sum = 0;
                                var count = 0;
                                this.ergodicArrayObject(this, arr, function (value) {
                                    if (typeof value === 'number' && !Number.isNaN(value)) {
                                        sum += value;
                                        count += 1;
                                    }
                                });
                                if (BaseUtils.isFunction(cb)) {
                                    cb.call(_global, sum, count);
                                }
                                return sum;
                            },
                            /**
                             * 获取数组中的平均值
                             * @param arr{Array<number>}
                             */
                            getAverageInArray: function (arr) {
                                var average = 0;
                                this.getSumInArray(arr, function (sum, i) {
                                    i === 0 || (average = sum / i);
                                });
                                return average;
                            },
                            /**
                             * 为数组排序
                             * @param arr
                             * @param order
                             * @param sortSetting {object=}
                             */
                            sortingArrays: function (arr, order, sortSetting) {
                                if (!this.isArrayObject(arr)) {
                                    return;
                                }
                                var DESC = 0;
                                var ASC = 1;
                                var thisArr = arr.slice(0);
                                var _thisAction = null;
                                // 解析配置
                                var isSetting = sortSetting && sortSetting.getComparedProperty &&
                                    BaseUtils.isFunction(sortSetting.getComparedProperty);
                                if (isSetting) {
                                    thisArr = sortSetting.getComparedProperty(arr);
                                }
                                switch (order) {
                                    default:
                                    case DESC:
                                        _thisAction = thisArr.push;
                                        break;
                                    case ASC:
                                        _thisAction = thisArr.unshift;
                                        break;
                                }
                                var resultArr = [];
                                for (var j = 0; j < thisArr.length; j++) {
                                    this.getMaxInArray(thisArr, function (max, i) {
                                        delete thisArr[i];
                                        _thisAction.call(resultArr, arr[i]);
                                    });
                                }
                                if (sortSetting && sortSetting.createNewData) {
                                    return resultArr.slice(0);
                                }
                                return resultArr;
                            },
                            /**
                             * 将类数组转化为数组
                             * @param arrLike 类数组对象
                             */
                            toArray: function (arrLike) {
                                if (!arrLike || arrLike.length === 0) {
                                    return [];
                                }
                                // 非伪类对象，直接返回最好
                                if (!arrLike.length) {
                                    return arrLike;
                                }
                                // 针对IE8以前 DOM的COM实现
                                try {
                                    return [].slice.call(arrLike);
                                } catch (e) {
                                    var i = 0,
                                        j = arrLike.length,
                                        res = [];
                                    for (; i < j; i++) {
                                        res.push(arrLike[i]);
                                    }
                                    return res;
                                }
                            },
                            /**
                             * 判断是否为类数组
                             * @param o
                             * @returns {boolean}
                             */
                            isArrayLick: function (o) {
                                if (o &&                                // o is not null, undefined, etc.
                                    typeof o === 'object' &&            // o is an object
                                    isFinite(o.length) &&               // o.length is a finite number
                                    o.length >= 0 &&                    // o.length is non-negative
                                    o.length === Math.floor(o.length) &&  // o.length is an integer
                                    o.length < 4294967296)              // o.length < 2^32
                                    return true;                        // Then o is array-like
                                else
                                    return false;                       // Otherwise it is not

                            },
                            /**
                             * 判断数组是否包含对象
                             * @param arr
                             * @param obj
                             */
                            contains: function (arr, obj) {
                                var contains = false;
                                this.ergodicArrayObject(this, arr, function (a) {
                                    if (a === obj) {
                                        contains = true;
                                        return -1;
                                    }
                                });
                                return contains;
                            }
                        }
                    });

                    // ObjectUtils
                    factory('ObjectUtils', ['ArrayUtils', 'BaseUtils'], function (ArrayUtils, BaseUtils) {
                        return {
                            /**
                             * 获取对象属性[支持链式表达式,如获取学生所在班级所在的学校(student.class.school):'class.school']
                             * @param obj
                             * @param linkProperty {string|Array} 属性表达式，获取多个属性则用数组
                             * @param cb {function=}
                             * @return 对象属性
                             */
                            readLinkProperty: function (obj, linkProperty, cb) {
                                var callback = null;
                                if (BaseUtils.isFunction(cb)) {
                                    callback = cb;
                                }
                                if (typeof linkProperty === 'string') {
                                    // 除去所有的空格
                                    linkProperty = linkProperty.replace(/ /g, '');
                                    // 不判断为空的值
                                    if (linkProperty === '') {
                                        return null;
                                    }
                                    // 若是以','隔开的伪数组，则转化为数组再进行操作
                                    if (linkProperty.indexOf(',') !== -1) {
                                        var propertyNameArr = linkProperty.split(',');
                                        return this.readLinkProperty(obj, propertyNameArr, callback);
                                    }
                                    if (linkProperty.indexOf('.') !== -1) {
                                        var names = linkProperty.split('.');
                                        var iterationObj = obj;
                                        var result = null;
                                        ArrayUtils.ergodicArrayObject(this, names, function (name, i) {
                                            iterationObj = this.readLinkProperty(iterationObj, name);
                                            if (names[names.length - 1] === name && names.length - 1 === i) {
                                                result = iterationObj;
                                                if (callback) {
                                                    callback.call(_global, result, linkProperty);
                                                }
                                            }
                                            // 终止对接下来的属性的遍历
                                            if (typeof iterationObj === 'undefined') {
                                                return -1;
                                            }
                                        });
                                        return result;
                                    }
                                    var normalResult = null;
                                    if (linkProperty.slice(linkProperty.length - 2) === '()') {
                                        var func = linkProperty.slice(0, linkProperty.length - 2);
                                        normalResult = obj[func]();
                                    } else {
                                        normalResult = obj[linkProperty];
                                    }
                                    if (normalResult === null) {
                                        console.warn(obj, '的属性[\'' + linkProperty + '\']值未找到');
                                    }
                                    if (callback) {
                                        callback.call(_global, normalResult, linkProperty);
                                    }
                                    return normalResult;
                                }
                                if (BaseUtils.isArray(linkProperty)) {
                                    var results = [];
                                    ArrayUtils.ergodicArrayObject(this, linkProperty, function (name) {
                                        var value = this.readLinkProperty(obj, name);
                                        results.push(value);
                                        if (callback && name !== '') {
                                            return callback.call(_global, value, name);
                                        }
                                    });
                                    results.isMultipleResults = true;
                                    return results;
                                }
                            },
                            /**
                             * 为对象属性赋值
                             * （同一个对象中不能够既有数字开头的属性名和普通属性名）
                             * @param obj
                             * @param linkProperty {string|Array} 属性表达式，多个属性则用数组
                             * @param value
                             */
                            createLinkProperty: function (obj, linkProperty, value) {
                                if (obj === null) {
                                    obj = {};
                                }
                                if (typeof linkProperty === 'string') {
                                    // 除去所有的空格
                                    linkProperty = linkProperty.replace(/ /g, '');
                                    // 不判断为空的值
                                    if (linkProperty === '') {
                                        throw new TypeError('对象属性名不能为空')
                                    }
                                    if (linkProperty.indexOf(',') !== -1) {
                                        var propertyNameArr = linkProperty.split(',');
                                        this.createLinkProperty(obj, propertyNameArr, value);
                                        return obj;
                                    }
                                    if (linkProperty.indexOf('.') !== -1) {
                                        var names = linkProperty.split('.');
                                        if (!obj.hasOwnProperty(names[0])) {
                                            obj[names[0]] = {}
                                        }
                                        // 判断属性名是否以数字开头（若是代表是一个数组）
                                        if (!Number.isNaN(parseInt(names[0]))) {
                                            if (!ArrayUtils.isArrayObject(obj)) {
                                                obj = [];
                                            }
                                        }
                                        var propertyObj = obj[names[0]];
                                        var newProperties = names.slice(1, names.length);
                                        var newLinkProperty = '';
                                        ArrayUtils.ergodicArrayObject(this, newProperties, function (property, i) {
                                            if (i < newProperties.length - 1) {
                                                newLinkProperty = newLinkProperty + property + '.'
                                            } else {
                                                newLinkProperty = newLinkProperty + property;
                                            }
                                        });
                                        obj[names[0]] = this.createLinkProperty(propertyObj, newLinkProperty, value);
                                        return obj;
                                    }
                                    // 判断属性名是否以数字开头（若是代表是一个数组）
                                    if (!Number.isNaN(parseInt(linkProperty))) {
                                        if (!ArrayUtils.isArrayObject(obj)) {
                                            obj = [];
                                        }
                                    }
                                    obj[linkProperty] = value;
                                    return obj;
                                } else if (BaseUtils.isArray(linkProperty)) {
                                    ArrayUtils.ergodicArrayObject(this, linkProperty, function (link) {
                                        obj = this.createLinkProperty(obj, link, value);
                                    });
                                    return obj;
                                }
                            },
                            /**
                             * 遍历对象属性
                             * @param context {object} 上下文
                             * @param obj {object} 遍历对象
                             * @param cb {function} 回调函数
                             * @param isReadInnerObject {boolean=} 是否遍历内部对象的属性
                             */
                            ergodicObject: function (context, obj, cb, isReadInnerObject) {
                                var keys = Object.keys(obj);
                                ArrayUtils.ergodicArrayObject(this, keys, function (propertyName) {
                                    // 若内部对象需要遍历
                                    var _propertyName = propertyName;
                                    if (isReadInnerObject && obj[propertyName] !== null && typeof obj[propertyName] === 'object') {
                                        this.ergodicObject(this, obj[propertyName], function (value, key) {
                                            return cb.call(context, value, _propertyName + '.' + key);
                                        }, true)
                                    } else {
                                        return cb.call(context, obj[propertyName], propertyName);
                                    }
                                })
                            },
                            /**
                             * 当指定属性为空或不存在时执行回到函数；
                             * @param context {object} 上下文
                             * @param obj {object} 检测对象
                             * @param propertyNames{Array|string} 需要检测的属性名
                             *                                     可以检查多级属性如:'a.b.c.e'，
                             *                                     多个属性使用数组，支持纯字符串多个属性用','隔开
                             * @param cb {function} 回调函数[参数：为空或不存在的属性名,返回值为'-1'时，跳过之后的回调函数]
                             */
                            whileEmptyObjectProperty: function (context, obj, propertyNames, cb) {
                                // 解析单个属性名
                                if (typeof propertyNames === 'string') {
                                    // 除去所有的空格
                                    propertyNames = propertyNames.replace(/ /g, '');
                                    // 不判断为空的值
                                    if (propertyNames === '') {
                                        return;
                                    }
                                    // 若是以','隔开的伪数组，则转化为数组再进行操作
                                    if (propertyNames.indexOf(',') !== -1) {
                                        var propertyNameArr = propertyNames.split(',');
                                        return this.whileEmptyObjectProperty(context, obj, propertyNameArr, cb);
                                    }
                                    // 若指定级联属性
                                    if (propertyNames.indexOf('.') !== -1) {
                                        var names = propertyNames.split('.');
                                        var iterationObj = obj;
                                        var result = null;
                                        ArrayUtils.ergodicArrayObject(this, names, function (name) {
                                            if (iterationObj && iterationObj.hasOwnProperty(name)) {
                                                iterationObj = iterationObj[name];
                                            } else {
                                                result = cb.call(_global, propertyNames);
                                                // 终止对接下来的属性的遍历
                                                return -1;
                                            }
                                        });
                                        return result;
                                    }
                                    // 正常流程
                                    if (!obj.hasOwnProperty(propertyNames)) {
                                        return cb.call(context, propertyNames);
                                    }
                                    if (obj[propertyNames] === null || obj[propertyNames] === '') {
                                        return cb.call(context, propertyNames);
                                    }
                                } else if (BaseUtils.isArray(propertyNames)) {
                                    // 解析数组
                                    var _this = this;
                                    ArrayUtils.ergodicArrayObject(this, propertyNames, function (propertyName) {
                                        // 递归调用
                                        return _this.whileEmptyObjectProperty(context, obj, propertyName, cb);
                                    })
                                }
                            },
                            whileEmptyObjectPropertyV2: function (context, obj, propertyNames, cb) {
                                this.readLinkProperty(obj, propertyNames, function (value, propertyName) {
                                    if (value === null || value === '' || parseInt(value) < 0) {
                                        return cb.call(context, propertyName);
                                    }
                                })
                            },
                            /**
                             * 克隆对象[只克隆属性，不克隆原型链]
                             * @param obj {*}
                             */
                            cloneObject: function (obj) {
                                var newObj = {};
                                // 判断是否为基本数据类型，若是则直接返回
                                if (typeof obj === 'string' ||
                                    typeof obj === 'number' ||
                                    typeof obj === 'undefined' ||
                                    typeof obj === 'function' ||
                                    typeof obj === 'boolean') {
                                    return obj;
                                }
                                // 判断是否是数组
                                if (BaseUtils.isArray(obj)) {
                                    newObj = [];
                                    // 遍历数组并递归调用该方法获取数组内部对象的克隆对象并push到新数组
                                    ArrayUtils.ergodicArrayObject(this, obj, function (arrObjValue) {
                                        newObj.push(this.cloneObject(arrObjValue));
                                    })
                                } else if (typeof obj === 'object') {
                                    // 当目标为一般对象时即 typeof 为 object
                                    if (obj === null) {
                                        // 当克隆对象为空时，返回空
                                        return null;
                                    }
                                    // 遍历对象的属性并调用递归方法获得该属性对应的对象的克隆对象并将其重新赋值到该属性
                                    this.ergodicObject(this, obj, function (value, key) {
                                        newObj[key] = this.cloneObject(value);
                                    });
                                }
                                return newObj;
                            },
                            /**
                             * 获取对象的哈希码
                             * @param obj {Object}
                             * @returns {number}
                             */
                            getObjHashCode: function (obj) {
                                var str = JSON.stringify(obj);
                                var hash = 0, i, chr, len;
                                console.log(str)
                                console.log(hash)
                                if (str.length === 0) return hash;
                                for (i = 0, len = str.length; i < len; i++) {
                                    chr = str.charCodeAt(i);
                                    hash = ((hash << 5) - hash) + chr;
                                    hash |= 0; // Convert to 32bit integer
                                }
                                console.log(str)
                                console.log(hash)
                                return hash;
                            },
                            /**
                             * 扩展对象属性
                             * @param obj 原对象
                             * @param extendedObj 被扩展的对象
                             * @param isCover {boolean=} 扩展的属性和原来属性冲突时是否覆盖 默认[false]
                             * @param isClone {boolean=} 是否返回一个新的对象，默认[false]返回扩展后的原对象
                             */
                            expandObject: function (obj, extendedObj, isCover, isClone) {
                                var resultObj = obj;
                                if (isClone) {
                                    resultObj = this.cloneObject(obj);
                                }
                                this.ergodicObject(this, extendedObj, function (value, key) {
                                    if (isCover && this.readLinkProperty(resultObj, key) !== null) {
                                        return;
                                    }
                                    resultObj = this.createLinkProperty(resultObj, key, value);
                                }, true);
                                return resultObj;
                            },
                            /**
                             * 为数组排序，当数组中的元素为对象时，根据指定对象的属性名进行排序
                             * @param arr 数组
                             * @param propertyName 属性名（当有多个属性名时，为多级排序）
                             * @param order 升降序
                             * @returns {*}
                             */
                            sortingArrayByProperty: function (arr, propertyName, order) {
                                var _this = this;
                                var sortSetting = {
                                    // 是否创建新数据
                                    createNewData: false,
                                    // 通过该方法获取数组中每个对象中用来比较的属性
                                    getComparedProperty: function (arr) {
                                        var compareArr = [];
                                        ArrayUtils.ergodicArrayObject(_this, arr, function (obj, i) {
                                            if (typeof obj !== 'object') {
                                                compareArr.push(obj);
                                            } else {
                                                var compareValue = this.readLinkProperty(obj, propertyName);
                                                if (compareValue !== null) {
                                                    compareArr.push(compareValue);
                                                } else {
                                                    compareArr.push(obj);
                                                }
                                            }
                                        });
                                        return compareArr.slice(0);
                                    }
                                };
                                return ArrayUtils.sortingArrays(arr, order, sortSetting);
                            },
                            /**
                             * 转话为目标的实例
                             * @param constructor {function} 构造函数
                             * @param obj {object|Array}判断的对象
                             * @param defaultProperty {object=}
                             */
                            toAimObject: function (obj, constructor, defaultProperty) {
                                if (BaseUtils.isArray(obj)) {
                                    var originArr = [];
                                    ArrayUtils.ergodicArrayObject(this, obj, function (value) {
                                        originArr.push(this.toAimObject(value, constructor, defaultProperty));
                                    });
                                    return originArr;
                                } else if (typeof obj === 'object') {
                                    if (defaultProperty) {
                                        this.ergodicObject(this, defaultProperty, function (value, key) {
                                            if (obj[key] === null) {
                                                obj[key] = value;
                                            }
                                        });
                                    }
                                    if (obj instanceof constructor) {
                                        return obj;
                                    }
                                    var originObj = obj;
                                    while (originObj.__proto__ !== null && originObj.__proto__ !== Object.prototype) {
                                        originObj = originObj.__proto__;
                                    }
                                    originObj.__proto__ = constructor.prototype;
                                    return originObj;
                                }
                            },
                            /**
                             * 将数组中结构类似对象指定属性融合为一个数组
                             * @param arr {Array}
                             * @param propertyNames
                             */
                            parseTheSameObjectPropertyInArray: function (arr, propertyNames) {
                                var result = {};
                                var temp = {};
                                ArrayUtils.ergodicArrayObject(this, arr, function (obj) {
                                    // 获取想要得到的所有属性，以属性名为键值存储到temp中
                                    this.readLinkProperty(obj, propertyNames, function (value, property) {
                                        if (!temp.hasOwnProperty(property) || !(BaseUtils.isArray(temp[property]))) {
                                            temp[property] = [];
                                        }
                                        temp[property].push(value);
                                    });
                                });
                                // 遍历temp获取每个键值中的值，并单独取出
                                this.ergodicObject(this, temp, function (value, key) {
                                    result = this.createLinkProperty(result, key, value);
                                });
                                return this.cloneObject(result);
                            },
                            /**
                             * 将数组中结构类似对象指定属性融合为一个数组
                             * @param arr {Array}
                             */
                            parseTheSameObjectAllPropertyInArray: function (arr) {
                                if (!ArrayUtils.isArrayObject(arr) || arr.length < 1) {
                                    return;
                                }
                                // 获取一个对象的所有属性，包括内部对象的属性
                                var propertyNames = [];
                                this.ergodicObject(this, arr[0], function (v, k) {
                                    propertyNames.push(k);
                                }, true);
                                return this.parseTheSameObjectPropertyInArray(arr, propertyNames);
                            },
                            /**
                             * 获取对象属性，若为数组则计算其中数字的平均值或其它
                             * @param obj
                             * @param propertyNames{Array<string>|string}
                             * @param type
                             */
                            getCalculationInArrayByLinkPropertyNames: function (obj, propertyNames, type) {
                                var resultObject = {};
                                var _this = this;
                                switch (type) {
                                    default:
                                    case 'sum':
                                        this.readLinkProperty(obj, propertyNames, function (value, key) {
                                            if (ArrayUtils.isArrayObject(value)) {
                                                resultObject = _this.createLinkProperty(resultObject, key, ArrayUtils.getSumInArray(value));
                                            }
                                        });
                                        break;
                                    case 'average':
                                        this.readLinkProperty(obj, propertyNames, function (value, key) {
                                            if (ArrayUtils.isArrayObject(value)) {
                                                resultObject = _this.createLinkProperty(resultObject, key, ArrayUtils.getAverageInArray(value));
                                            }
                                        });
                                        break;
                                }
                                return resultObject;
                            }
                        }
                    });

                    // ColorUtils
                    factory('ColorUtils', [], function () {
                        return {
                            /**
                             * 转换颜色rgb为16进制
                             * @param r
                             * @param g
                             * @param b
                             * @return {string}
                             */
                            rgbToHex: function (r, g, b) {
                                var hex = ((r << 16) | (g << 8) | b).toString(16);
                                return "#" + new Array(Math.abs(hex.length - 7)).join("0") + hex;
                            },
                            /**
                             * 转换颜色16进制为rgb
                             * @param hex
                             * @return {Array}
                             */
                            hexToRgb: function (hex) {
                                hex = hex.replace(/ /g, '');
                                var length = hex.length;
                                var rgb = [];
                                switch (length) {
                                    case 4:
                                        rgb.push(parseInt(hex[1] + hex[1], 16));
                                        rgb.push(parseInt(hex[2] + hex[2], 16));
                                        rgb.push(parseInt(hex[3] + hex[3], 16));
                                        return rgb;
                                    case 7:
                                        for (var i = 1; i < 7; i += 2) {
                                            rgb.push(parseInt("0x" + hex.slice(i, i + 2)));
                                        }
                                        return rgb;
                                    default:
                                        break
                                }
                            },
                            /**
                             * 根据两个颜色以及之间的百分比获取渐进色
                             * @param start
                             * @param end
                             * @param percentage
                             * @return {*}
                             */
                            gradientColorsPercentage: function (start, end, percentage) {
                                var resultRgb = [];
                                var startRgb = this.hexToRgb(start);
                                if (end == null) {
                                    return start;
                                }
                                var endRgb = this.hexToRgb(end);
                                var totalR = endRgb[0] - startRgb[0];
                                var totalG = endRgb[1] - startRgb[1];
                                var totalB = endRgb[2] - startRgb[2];
                                resultRgb.push(startRgb[0] + totalR * percentage);
                                resultRgb.push(startRgb[1] + totalG * percentage);
                                resultRgb.push(startRgb[2] + totalB * percentage);
                                return this.rgbToHex(resultRgb[0], resultRgb[1], resultRgb[2])
                            }
                        }
                    });

                    factory('FunctionUtils', [], function () {
                        return {
                            /**
                             * 获取方法的名字
                             * @param func
                             * @returns {*}
                             */
                            getFunctionName: function (func) {
                                if (typeof func === 'function' || typeof func === 'object') {
                                    var name = ('' + func).match(/function\s*([\w\$]*)\s*\(/);
                                }
                                return func.name || name[1];
                            },
                            /**
                             * 获取方法的参数名
                             * @param func
                             * @returns {*}
                             */
                            getFunctionParams: function (func) {
                                if (typeof func === 'function' || typeof func === 'object') {
                                    var name = ('' + func).match(/function.*\(([^)]*)\)/);
                                    return name[1].replace(/( )|(\n)/g, '').split(',');
                                }
                            },
                            /**
                             * 通过方法的arguments获取调用该方法的函数
                             * @param func_arguments
                             * @returns {string}
                             */
                            getCallerName: function (func_arguments) {
                                var caller = func_arguments.callee.caller;
                                var callerName = '';
                                if (caller) {
                                    callerName = this.getFunctionName(caller);
                                }
                                return callerName;
                            },
                            FunctionBuilder: function (func) {
                                var _this = this;
                                var fs = [];
                                fs.push(func);
                                var properties = ['push', 'unshift', 'slice', 'map', 'forEach', 'keys', 'find', 'concat', 'fill', 'shift', 'values'];
                                map.call(properties, function (property) {
                                    if (typeof Array.prototype[property] === 'function') {
                                        Object.defineProperty(_this, property, {
                                            get: function () {
                                                return function () {
                                                    fs[property].apply(fs, arguments);
                                                    return this;
                                                }
                                            }
                                        });
                                    }
                                });
                                this.result = function (context) {
                                    var rfs = [];
                                    map.call(fs, function (f, index) {
                                        if (typeof f === 'function') {
                                            rfs.push(f);
                                        }
                                    });
                                    return function () {
                                        var declareVar = {
                                            arguments: arguments,
                                            this: this
                                        };
                                        map.call(rfs, function (f) {
                                            var dv = f.apply(context || this, [declareVar]);
                                            if (dv) {
                                                map.call(Object.keys(dv), function (key) {
                                                    declareVar[key] = dv[key];
                                                });
                                            }
                                        });
                                        return declareVar.returnValue;
                                    }
                                }
                            },
                            invokeMethods: function (context, methods, args) {
                                if (!this.isArray(methods)) {
                                    return;
                                }
                                var results = [];
                                var _this = this;
                                this.ergodicArrayObject(context, methods, function (method) {
                                    if (!_this.isFunction(method)) {
                                        return;
                                    }
                                    results.push(
                                        method.apply(context, args)
                                    );
                                });
                                return results;
                            }
                        }
                    });

                    factory('UrlUtils', [], function () {
                        return {
                            urlMatching: function (url, matchUrl) {
                                var pattern = new RegExp(matchUrl);
                                return pattern.test(url);
                            },
                            getUrlWithoutParam: function (url) {
                                return url.split('?')[0];
                            },
                            getParamFromUrl: function (url) {
                                var params = [];
                                var parts = url.split('?');
                                if (parts.length < 2) {
                                    return params;
                                }
                                var paramsStr = parts[1].split('&');
                                for (var i = 0; i < paramsStr.length; i++) {
                                    var index = paramsStr[i].indexOf('=');
                                    var ps = new Array(2);
                                    if (index !== -1) {
                                        ps = [
                                            paramsStr[i].substring(0, index),
                                            paramsStr[i].substring(index + 1),
                                        ];
                                    } else {
                                        ps[0] = paramsStr[i];
                                    }
                                    params.push({
                                        key: ps[0],
                                        value: ps[1]
                                    });
                                }
                                return params;
                            },
                            margeUrlAndParams: function (url, params) {
                                if (url.indexOf('?') !== -1 || !(params instanceof Array)) {
                                    return url;
                                }
                                var paramsStr = [];
                                for (var i = 0; i < params.length; i++) {
                                    if (params[i].key !== null && params[i].value !== null) {
                                        paramsStr.push(params[i].key + '=' + params[i].value);
                                    }
                                }
                                return url + '?' + paramsStr.join('&');
                            }
                        }
                    });

                    factory('PointUtils', [], function () {
                        var Point2D = function (x, y) {
                            this.x = x || 0;
                            this.y = y || 0;
                        };
                        Point2D.prototype = {
                            constructor: Point2D,
                            /**
                             * 获取指定距离和角度对应的平面点
                             * @param distance
                             * @param deg
                             */
                            getOtherPointFromDistanceAndDeg: function (distance, deg) {
                                var radian = Math.PI / 180 * deg;
                                var point = new this.constructor();
                                point.x = distance * Math.sin(radian) + this.x;
                                point.y = this.y - distance * Math.cos(radian);
                                return point;
                            },
                            /**
                             * 获取当前平面点与另一个平面点之间的距离
                             * @param p
                             * @returns {number}
                             */
                            getDistanceFromAnotherPoint: function (p) {
                                return Math.sqrt((this.x - p.x) * (this.x - p.x) + (this.y - p.y) * (this.y - p.y));
                            },
                            /**
                             * 获取当前平面点与另一个平面点之间的角度
                             * @param p
                             * @returns {number}
                             */
                            getDegFromAnotherPoint: function (p) {
                                var usedPoint = new Point2D(p.x * 1000000 - this.x * 1000000, p.y * 1000000 - this.y * 1000000);
                                var radian = Math.atan2(usedPoint.x * 1000000, usedPoint.y * 1000000);
                                var deg = radian * 180 / Math.PI;
                                return 180 - deg;
                            },
                            /**
                             * 判断该点是否位于一矩形内部
                             * @param x 矩形开始坐标x
                             * @param y 矩形开始坐标y
                             * @param width 矩形宽
                             * @param height 矩形长
                             * @returns {boolean}
                             */
                            isInRect: function (x, y, width, height) {
                                var px = this.x;
                                var py = this.y;
                                if (px < x || px > x + width) {
                                    return false;
                                }
                                return !(py < y || py > y + height);
                            }
                        };
                        return {
                            Point2D: Point2D
                        }
                    });


                    factory('PropExpand', ['BaseUtils', 'ObjectUtils', 'ArrayUtils', 'UrlUtils'],
                        function (BaseUtils, ObjectUtils, ArrayUtils, UrlUtils) {
                            return {
                                Object: {
                                    getProperty: function (_self, propertyLink) {
                                        return ObjectUtils.readLinkProperty(_self, propertyLink);
                                    },
                                    setProperty: function (_self, propertyLink, value) {
                                        ObjectUtils.createLinkProperty(_self, propertyLink, value);
                                    },
                                    mapConvert: function (_self, mapper) {

                                    },
                                    keyMap: function (_self, cb) {
                                    },
                                    keyValues: function (_self, cb) {
                                    },
                                    keyFilter: function (_self, cb) {
                                    },
                                },
                                Array: {
                                    map: function () {
                                    },
                                    forEach: function () {
                                    },
                                    filter: function () {
                                    },
                                    reduce: function () {
                                    },
                                    keep: function () {
                                    },
                                    remove: function () {
                                    }
                                },
                                String: {
                                    join: function (_self, arr) {
                                    },
                                }
                            }
                        });

                    _global.everyUtils = function () {
                        if (BaseUtils.isArray(arguments[0])) {
                            depend.call(arguments[2] || this, arguments[0], arguments[1]);
                        } else if (BaseUtils.isFunction(arguments[0])) {
                            var args = arguments;
                            depend.call(arguments[1] || this, ['FunctionUtils'], function (FunctionUtils) {
                                var depends = FunctionUtils.getFunctionParams(args[0]);
                                depend(depends, args[0]);
                            })
                        }
                    };

                    _global.eUtils = (function () {
                        var utils = {};
                        if (_global.everyUtils) {
                            _global.everyUtils([
                                'ArrayUtils', 'ObjectUtils', 'BaseUtils', 'FunctionUtils', 'ColorUtils', 'PointUtils', 'UrlUtils'
                            ], function (
                                ArrayUtils,
                                ObjectUtils,
                                BaseUtils,
                                FunctionUtils,
                                ColorUtils,
                                PointUtils,
                                UrlUtils) {
                                utils = {
                                    ArrayUtils: ArrayUtils,
                                    ObjectUtils: ObjectUtils,
                                    BaseUtils: BaseUtils,
                                    ColorUtils: ColorUtils,
                                    UrlUtils: UrlUtils,
                                    urlUtils: UrlUtils,
                                    PointUtils: PointUtils,
                                    FunctionUtils: FunctionUtils
                                };
                            });
                        }
                        var proxy = {};
                        forEach.call(Object.keys(utils), function (utilName) {
                            if (!utilName) {
                                return;
                            }
                            Object.defineProperty(proxy, utilName, {
                                get: function () {
                                    return utils[utilName];
                                }
                            });
                            forEach.call(Object.keys(utils[utilName]), function (key) {
                                if (!key) {
                                    return;
                                }
                                if (proxy[key]) {
                                    return;
                                }
                                Object.defineProperty(proxy, key, {
                                    get: function () {
                                        return utils[utilName][key];
                                    }
                                })
                            })
                        });
                        return proxy;
                    })();

                    return _global.eUtils;
                }));

                /***/
})
/******/]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if (__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
                /******/
}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
                /******/
};
/******/
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
            /******/
}
/******/
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
        /******/
})()
        ;
});
window.isDOMLoaded = false;
window.isDOMRendered = false;

document.addEventListener('readystatechange', function () {
    if (document.readyState === "interactive" || document.readyState === "complete") {
        window.isDOMLoaded = true;
    }
});
var QRCode2;

(function () {

	function QR8bitByte(data) {
		this.mode = QRMode.MODE_8BIT_BYTE;
		this.data = data;
		this.parsedData = [];

		// Added to support UTF-8 Characters
		for (var i = 0, l = this.data.length; i < l; i++) {
			var byteArray = [];
			var code = this.data.charCodeAt(i);

			if (code > 0x10000) {
				byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
				byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
				byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
				byteArray[3] = 0x80 | (code & 0x3F);
			} else if (code > 0x800) {
				byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
				byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
				byteArray[2] = 0x80 | (code & 0x3F);
			} else if (code > 0x80) {
				byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
				byteArray[1] = 0x80 | (code & 0x3F);
			} else {
				byteArray[0] = code;
			}

			this.parsedData.push(byteArray);
		}

		this.parsedData = Array.prototype.concat.apply([], this.parsedData);

		if (this.parsedData.length != this.data.length) {
			this.parsedData.unshift(191);
			this.parsedData.unshift(187);
			this.parsedData.unshift(239);
		}
	}

	QR8bitByte.prototype = {
		getLength: function (buffer) {
			return this.parsedData.length;
		},
		write: function (buffer) {
			for (var i = 0, l = this.parsedData.length; i < l; i++) {
				buffer.put(this.parsedData[i], 8);
			}
		}
	};

	function QRCodeModel(typeNumber, errorCorrectLevel) {
		this.typeNumber = typeNumber;
		this.errorCorrectLevel = errorCorrectLevel;
		this.modules = null;
		this.moduleCount = 0;
		this.dataCache = null;
		this.dataList = [];
	}

	QRCodeModel.prototype={addData:function(data){var newData=new QR8bitByte(data);this.dataList.push(newData);this.dataCache=null;},isDark:function(row,col){if(row<0||this.moduleCount<=row||col<0||this.moduleCount<=col){throw new Error(row+","+col);}
	return this.modules[row][col];},getModuleCount:function(){return this.moduleCount;},make:function(){this.makeImpl(false,this.getBestMaskPattern());},makeImpl:function(test,maskPattern){this.moduleCount=this.typeNumber*4+17;this.modules=new Array(this.moduleCount);for(var row=0;row<this.moduleCount;row++){this.modules[row]=new Array(this.moduleCount);for(var col=0;col<this.moduleCount;col++){this.modules[row][col]=null;}}
	this.setupPositionProbePattern(0,0);this.setupPositionProbePattern(this.moduleCount-7,0);this.setupPositionProbePattern(0,this.moduleCount-7);this.setupPositionAdjustPattern();this.setupTimingPattern();this.setupTypeInfo(test,maskPattern);if(this.typeNumber>=7){this.setupTypeNumber(test);}
	if(this.dataCache==null){this.dataCache=QRCodeModel.createData(this.typeNumber,this.errorCorrectLevel,this.dataList);}
	this.mapData(this.dataCache,maskPattern);},setupPositionProbePattern:function(row,col){for(var r=-1;r<=7;r++){if(row+r<=-1||this.moduleCount<=row+r)continue;for(var c=-1;c<=7;c++){if(col+c<=-1||this.moduleCount<=col+c)continue;if((0<=r&&r<=6&&(c==0||c==6))||(0<=c&&c<=6&&(r==0||r==6))||(2<=r&&r<=4&&2<=c&&c<=4)){this.modules[row+r][col+c]=true;}else{this.modules[row+r][col+c]=false;}}}},getBestMaskPattern:function(){var minLostPoint=0;var pattern=0;for(var i=0;i<8;i++){this.makeImpl(true,i);var lostPoint=QRUtil.getLostPoint(this);if(i==0||minLostPoint>lostPoint){minLostPoint=lostPoint;pattern=i;}}
	return pattern;},createMovieClip:function(target_mc,instance_name,depth){var qr_mc=target_mc.createEmptyMovieClip(instance_name,depth);var cs=1;this.make();for(var row=0;row<this.modules.length;row++){var y=row*cs;for(var col=0;col<this.modules[row].length;col++){var x=col*cs;var dark=this.modules[row][col];if(dark){qr_mc.beginFill(0,100);qr_mc.moveTo(x,y);qr_mc.lineTo(x+cs,y);qr_mc.lineTo(x+cs,y+cs);qr_mc.lineTo(x,y+cs);qr_mc.endFill();}}}
	return qr_mc;},setupTimingPattern:function(){for(var r=8;r<this.moduleCount-8;r++){if(this.modules[r][6]!=null){continue;}
	this.modules[r][6]=(r%2==0);}
	for(var c=8;c<this.moduleCount-8;c++){if(this.modules[6][c]!=null){continue;}
	this.modules[6][c]=(c%2==0);}},setupPositionAdjustPattern:function(){var pos=QRUtil.getPatternPosition(this.typeNumber);for(var i=0;i<pos.length;i++){for(var j=0;j<pos.length;j++){var row=pos[i];var col=pos[j];if(this.modules[row][col]!=null){continue;}
	for(var r=-2;r<=2;r++){for(var c=-2;c<=2;c++){if(r==-2||r==2||c==-2||c==2||(r==0&&c==0)){this.modules[row+r][col+c]=true;}else{this.modules[row+r][col+c]=false;}}}}}},setupTypeNumber:function(test){var bits=QRUtil.getBCHTypeNumber(this.typeNumber);for(var i=0;i<18;i++){var mod=(!test&&((bits>>i)&1)==1);this.modules[Math.floor(i/3)][i%3+this.moduleCount-8-3]=mod;}
	for(var i=0;i<18;i++){var mod=(!test&&((bits>>i)&1)==1);this.modules[i%3+this.moduleCount-8-3][Math.floor(i/3)]=mod;}},setupTypeInfo:function(test,maskPattern){var data=(this.errorCorrectLevel<<3)|maskPattern;var bits=QRUtil.getBCHTypeInfo(data);for(var i=0;i<15;i++){var mod=(!test&&((bits>>i)&1)==1);if(i<6){this.modules[i][8]=mod;}else if(i<8){this.modules[i+1][8]=mod;}else{this.modules[this.moduleCount-15+i][8]=mod;}}
	for(var i=0;i<15;i++){var mod=(!test&&((bits>>i)&1)==1);if(i<8){this.modules[8][this.moduleCount-i-1]=mod;}else if(i<9){this.modules[8][15-i-1+1]=mod;}else{this.modules[8][15-i-1]=mod;}}
	this.modules[this.moduleCount-8][8]=(!test);},mapData:function(data,maskPattern){var inc=-1;var row=this.moduleCount-1;var bitIndex=7;var byteIndex=0;for(var col=this.moduleCount-1;col>0;col-=2){if(col==6)col--;while(true){for(var c=0;c<2;c++){if(this.modules[row][col-c]==null){var dark=false;if(byteIndex<data.length){dark=(((data[byteIndex]>>>bitIndex)&1)==1);}
	var mask=QRUtil.getMask(maskPattern,row,col-c);if(mask){dark=!dark;}
	this.modules[row][col-c]=dark;bitIndex--;if(bitIndex==-1){byteIndex++;bitIndex=7;}}}
	row+=inc;if(row<0||this.moduleCount<=row){row-=inc;inc=-inc;break;}}}}};QRCodeModel.PAD0=0xEC;QRCodeModel.PAD1=0x11;QRCodeModel.createData=function(typeNumber,errorCorrectLevel,dataList){var rsBlocks=QRRSBlock.getRSBlocks(typeNumber,errorCorrectLevel);var buffer=new QRBitBuffer();for(var i=0;i<dataList.length;i++){var data=dataList[i];buffer.put(data.mode,4);buffer.put(data.getLength(),QRUtil.getLengthInBits(data.mode,typeNumber));data.write(buffer);}
	var totalDataCount=0;for(var i=0;i<rsBlocks.length;i++){totalDataCount+=rsBlocks[i].dataCount;}
	if(buffer.getLengthInBits()>totalDataCount*8){throw new Error("code length overflow. ("
	+buffer.getLengthInBits()
	+">"
	+totalDataCount*8
	+")");}
	if(buffer.getLengthInBits()+4<=totalDataCount*8){buffer.put(0,4);}
	while(buffer.getLengthInBits()%8!=0){buffer.putBit(false);}
	while(true){if(buffer.getLengthInBits()>=totalDataCount*8){break;}
	buffer.put(QRCodeModel.PAD0,8);if(buffer.getLengthInBits()>=totalDataCount*8){break;}
	buffer.put(QRCodeModel.PAD1,8);}
	return QRCodeModel.createBytes(buffer,rsBlocks);};QRCodeModel.createBytes=function(buffer,rsBlocks){var offset=0;var maxDcCount=0;var maxEcCount=0;var dcdata=new Array(rsBlocks.length);var ecdata=new Array(rsBlocks.length);for(var r=0;r<rsBlocks.length;r++){var dcCount=rsBlocks[r].dataCount;var ecCount=rsBlocks[r].totalCount-dcCount;maxDcCount=Math.max(maxDcCount,dcCount);maxEcCount=Math.max(maxEcCount,ecCount);dcdata[r]=new Array(dcCount);for(var i=0;i<dcdata[r].length;i++){dcdata[r][i]=0xff&buffer.buffer[i+offset];}
	offset+=dcCount;var rsPoly=QRUtil.getErrorCorrectPolynomial(ecCount);var rawPoly=new QRPolynomial(dcdata[r],rsPoly.getLength()-1);var modPoly=rawPoly.mod(rsPoly);ecdata[r]=new Array(rsPoly.getLength()-1);for(var i=0;i<ecdata[r].length;i++){var modIndex=i+modPoly.getLength()-ecdata[r].length;ecdata[r][i]=(modIndex>=0)?modPoly.get(modIndex):0;}}
	var totalCodeCount=0;for(var i=0;i<rsBlocks.length;i++){totalCodeCount+=rsBlocks[i].totalCount;}
	var data=new Array(totalCodeCount);var index=0;for(var i=0;i<maxDcCount;i++){for(var r=0;r<rsBlocks.length;r++){if(i<dcdata[r].length){data[index++]=dcdata[r][i];}}}
	for(var i=0;i<maxEcCount;i++){for(var r=0;r<rsBlocks.length;r++){if(i<ecdata[r].length){data[index++]=ecdata[r][i];}}}
	return data;};var QRMode={MODE_NUMBER:1<<0,MODE_ALPHA_NUM:1<<1,MODE_8BIT_BYTE:1<<2,MODE_KANJI:1<<3};var QRErrorCorrectLevel={L:1,M:0,Q:3,H:2};var QRMaskPattern={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};var QRUtil={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|(1<<0),G18:(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|(1<<0),G15_MASK:(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1),getBCHTypeInfo:function(data){var d=data<<10;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)>=0){d^=(QRUtil.G15<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)));}
	return((data<<10)|d)^QRUtil.G15_MASK;},getBCHTypeNumber:function(data){var d=data<<12;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)>=0){d^=(QRUtil.G18<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)));}
	return(data<<12)|d;},getBCHDigit:function(data){var digit=0;while(data!=0){digit++;data>>>=1;}
	return digit;},getPatternPosition:function(typeNumber){return QRUtil.PATTERN_POSITION_TABLE[typeNumber-1];},getMask:function(maskPattern,i,j){switch(maskPattern){case QRMaskPattern.PATTERN000:return(i+j)%2==0;case QRMaskPattern.PATTERN001:return i%2==0;case QRMaskPattern.PATTERN010:return j%3==0;case QRMaskPattern.PATTERN011:return(i+j)%3==0;case QRMaskPattern.PATTERN100:return(Math.floor(i/2)+Math.floor(j/3))%2==0;case QRMaskPattern.PATTERN101:return(i*j)%2+(i*j)%3==0;case QRMaskPattern.PATTERN110:return((i*j)%2+(i*j)%3)%2==0;case QRMaskPattern.PATTERN111:return((i*j)%3+(i+j)%2)%2==0;default:throw new Error("bad maskPattern:"+maskPattern);}},getErrorCorrectPolynomial:function(errorCorrectLength){var a=new QRPolynomial([1],0);for(var i=0;i<errorCorrectLength;i++){a=a.multiply(new QRPolynomial([1,QRMath.gexp(i)],0));}
	return a;},getLengthInBits:function(mode,type){if(1<=type&&type<10){switch(mode){case QRMode.MODE_NUMBER:return 10;case QRMode.MODE_ALPHA_NUM:return 9;case QRMode.MODE_8BIT_BYTE:return 8;case QRMode.MODE_KANJI:return 8;default:throw new Error("mode:"+mode);}}else if(type<27){switch(mode){case QRMode.MODE_NUMBER:return 12;case QRMode.MODE_ALPHA_NUM:return 11;case QRMode.MODE_8BIT_BYTE:return 16;case QRMode.MODE_KANJI:return 10;default:throw new Error("mode:"+mode);}}else if(type<41){switch(mode){case QRMode.MODE_NUMBER:return 14;case QRMode.MODE_ALPHA_NUM:return 13;case QRMode.MODE_8BIT_BYTE:return 16;case QRMode.MODE_KANJI:return 12;default:throw new Error("mode:"+mode);}}else{throw new Error("type:"+type);}},getLostPoint:function(QRCode2){var moduleCount=QRCode2.getModuleCount();var lostPoint=0;for(var row=0;row<moduleCount;row++){for(var col=0;col<moduleCount;col++){var sameCount=0;var dark=QRCode2.isDark(row,col);for(var r=-1;r<=1;r++){if(row+r<0||moduleCount<=row+r){continue;}
	for(var c=-1;c<=1;c++){if(col+c<0||moduleCount<=col+c){continue;}
	if(r==0&&c==0){continue;}
	if(dark==QRCode2.isDark(row+r,col+c)){sameCount++;}}}
	if(sameCount>5){lostPoint+=(3+sameCount-5);}}}
	for(var row=0;row<moduleCount-1;row++){for(var col=0;col<moduleCount-1;col++){var count=0;if(QRCode2.isDark(row,col))count++;if(QRCode2.isDark(row+1,col))count++;if(QRCode2.isDark(row,col+1))count++;if(QRCode2.isDark(row+1,col+1))count++;if(count==0||count==4){lostPoint+=3;}}}
	for(var row=0;row<moduleCount;row++){for(var col=0;col<moduleCount-6;col++){if(QRCode2.isDark(row,col)&&!QRCode2.isDark(row,col+1)&&QRCode2.isDark(row,col+2)&&QRCode2.isDark(row,col+3)&&QRCode2.isDark(row,col+4)&&!QRCode2.isDark(row,col+5)&&QRCode2.isDark(row,col+6)){lostPoint+=40;}}}
	for(var col=0;col<moduleCount;col++){for(var row=0;row<moduleCount-6;row++){if(QRCode2.isDark(row,col)&&!QRCode2.isDark(row+1,col)&&QRCode2.isDark(row+2,col)&&QRCode2.isDark(row+3,col)&&QRCode2.isDark(row+4,col)&&!QRCode2.isDark(row+5,col)&&QRCode2.isDark(row+6,col)){lostPoint+=40;}}}
	var darkCount=0;for(var col=0;col<moduleCount;col++){for(var row=0;row<moduleCount;row++){if(QRCode2.isDark(row,col)){darkCount++;}}}
	var ratio=Math.abs(100*darkCount/moduleCount/moduleCount-50)/5;lostPoint+=ratio*10;return lostPoint;}};var QRMath={glog:function(n){if(n<1){throw new Error("glog("+n+")");}
	return QRMath.LOG_TABLE[n];},gexp:function(n){while(n<0){n+=255;}
	while(n>=256){n-=255;}
	return QRMath.EXP_TABLE[n];},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)};for(var i=0;i<8;i++){QRMath.EXP_TABLE[i]=1<<i;}
	for(var i=8;i<256;i++){QRMath.EXP_TABLE[i]=QRMath.EXP_TABLE[i-4]^QRMath.EXP_TABLE[i-5]^QRMath.EXP_TABLE[i-6]^QRMath.EXP_TABLE[i-8];}
	for(var i=0;i<255;i++){QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]]=i;}
	function QRPolynomial(num,shift){if(num.length==undefined){throw new Error(num.length+"/"+shift);}
	var offset=0;while(offset<num.length&&num[offset]==0){offset++;}
	this.num=new Array(num.length-offset+shift);for(var i=0;i<num.length-offset;i++){this.num[i]=num[i+offset];}}
	QRPolynomial.prototype={get:function(index){return this.num[index];},getLength:function(){return this.num.length;},multiply:function(e){var num=new Array(this.getLength()+e.getLength()-1);for(var i=0;i<this.getLength();i++){for(var j=0;j<e.getLength();j++){num[i+j]^=QRMath.gexp(QRMath.glog(this.get(i))+QRMath.glog(e.get(j)));}}
	return new QRPolynomial(num,0);},mod:function(e){if(this.getLength()-e.getLength()<0){return this;}
	var ratio=QRMath.glog(this.get(0))-QRMath.glog(e.get(0));var num=new Array(this.getLength());for(var i=0;i<this.getLength();i++){num[i]=this.get(i);}
	for(var i=0;i<e.getLength();i++){num[i]^=QRMath.gexp(QRMath.glog(e.get(i))+ratio);}
	return new QRPolynomial(num,0).mod(e);}};function QRRSBlock(totalCount,dataCount){this.totalCount=totalCount;this.dataCount=dataCount;}
	QRRSBlock.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]];QRRSBlock.getRSBlocks=function(typeNumber,errorCorrectLevel){var rsBlock=QRRSBlock.getRsBlockTable(typeNumber,errorCorrectLevel);if(rsBlock==undefined){throw new Error("bad rs block @ typeNumber:"+typeNumber+"/errorCorrectLevel:"+errorCorrectLevel);}
	var length=rsBlock.length/3;var list=[];for(var i=0;i<length;i++){var count=rsBlock[i*3+0];var totalCount=rsBlock[i*3+1];var dataCount=rsBlock[i*3+2];for(var j=0;j<count;j++){list.push(new QRRSBlock(totalCount,dataCount));}}
	return list;};QRRSBlock.getRsBlockTable=function(typeNumber,errorCorrectLevel){switch(errorCorrectLevel){case QRErrorCorrectLevel.L:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+0];case QRErrorCorrectLevel.M:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+1];case QRErrorCorrectLevel.Q:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+2];case QRErrorCorrectLevel.H:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+3];default:return undefined;}};function QRBitBuffer(){this.buffer=[];this.length=0;}
	QRBitBuffer.prototype={get:function(index){var bufIndex=Math.floor(index/8);return((this.buffer[bufIndex]>>>(7-index%8))&1)==1;},put:function(num,length){for(var i=0;i<length;i++){this.putBit(((num>>>(length-i-1))&1)==1);}},getLengthInBits:function(){return this.length;},putBit:function(bit){var bufIndex=Math.floor(this.length/8);if(this.buffer.length<=bufIndex){this.buffer.push(0);}
	if(bit){this.buffer[bufIndex]|=(0x80>>>(this.length%8));}
	this.length++;}};var QRCodeLimitLength=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]];
	
	function _isSupportCanvas() {
		return typeof CanvasRenderingContext2D != "undefined";
	}
	
	// android 2.x doesn't support Data-URI spec
	function _getAndroid() {
		var android = false;
		var sAgent = navigator.userAgent;
		
		if (/android/i.test(sAgent)) { // android
			android = true;
			var aMat = sAgent.toString().match(/android ([0-9].?[0-9]?)/i);
			
			if (aMat && aMat[1]) {
				android = parseFloat(aMat[1]);
			}
		}
		
		return android;
	}
	
	var svgDrawer = (function() {

		var Drawing = function (el, htOption) {
			this._el = el;
			this._htOption = htOption;
		};

		Drawing.prototype.draw = function (oQRCode) {
			var _htOption = this._htOption;
			var _el = this._el;
			var nCount = oQRCode.getModuleCount();
			var nWidth = Math.floor(_htOption.width / nCount);
			var nHeight = Math.floor(_htOption.height / nCount);

			this.clear();

			function makeSVG(tag, attrs) {
				var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
				for (var k in attrs)
					if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
				return el;
			}

			var svg = makeSVG("svg" , {'viewBox': '0 0 ' + String(nCount) + " " + String(nCount), 'width': '100%', 'height': '100%', 'fill': _htOption.colorLight});
			svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
			_el.appendChild(svg);

			svg.appendChild(makeSVG("rect", {"fill": _htOption.colorLight, "width": "100%", "height": "100%"}));
			svg.appendChild(makeSVG("rect", {"fill": _htOption.colorDark, "width": "1", "height": "1", "id": "template"}));

			for (var row = 0; row < nCount; row++) {
				for (var col = 0; col < nCount; col++) {
					if (oQRCode.isDark(row, col)) {
						var child = makeSVG("use", {"x": String(col), "y": String(row)});
						child.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#template")
						svg.appendChild(child);
					}
				}
			}
		};
		Drawing.prototype.clear = function () {
			while (this._el.hasChildNodes())
				this._el.removeChild(this._el.lastChild);
		};
		return Drawing;
	})();

	var useSVG = document.documentElement.tagName.toLowerCase() === "svg";

	// Drawing in DOM by using Table tag
	var Drawing = useSVG ? svgDrawer : !_isSupportCanvas() ? (function () {
		var Drawing = function (el, htOption) {
			this._el = el;
			this._htOption = htOption;
		};
			
		/**
		 * Draw the QRCode2
		 * 
		 * @param {QRCode2} oQRCode
		 */
		Drawing.prototype.draw = function (oQRCode) {
            var _htOption = this._htOption;
            var _el = this._el;
			var nCount = oQRCode.getModuleCount();
			var nWidth = Math.floor(_htOption.width / nCount);
			var nHeight = Math.floor(_htOption.height / nCount);
			var aHTML = ['<table style="border:0;border-collapse:collapse;">'];
			
			for (var row = 0; row < nCount; row++) {
				aHTML.push('<tr>');
				
				for (var col = 0; col < nCount; col++) {
					aHTML.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:' + nWidth + 'px;height:' + nHeight + 'px;background-color:' + (oQRCode.isDark(row, col) ? _htOption.colorDark : _htOption.colorLight) + ';"></td>');
				}
				
				aHTML.push('</tr>');
			}
			
			aHTML.push('</table>');
			_el.innerHTML = aHTML.join('');
			
			// Fix the margin values as real size.
			var elTable = _el.childNodes[0];
			var nLeftMarginTable = (_htOption.width - elTable.offsetWidth) / 2;
			var nTopMarginTable = (_htOption.height - elTable.offsetHeight) / 2;
			
			if (nLeftMarginTable > 0 && nTopMarginTable > 0) {
				elTable.style.margin = nTopMarginTable + "px " + nLeftMarginTable + "px";	
			}
		};
		
		/**
		 * Clear the QRCode2
		 */
		Drawing.prototype.clear = function () {
			this._el.innerHTML = '';
		};
		
		return Drawing;
	})() : (function () { // Drawing in Canvas
		function _onMakeImage() {
			this._elImage.src = this._elCanvas.toDataURL("image/png");
			this._elImage.style.display = "block";
			this._elCanvas.style.display = "none";			
		}
		
		// Android 2.1 bug workaround
		// http://code.google.com/p/android/issues/detail?id=5141
		if (this._android && this._android <= 2.1) {
	    	var factor = 1 / window.devicePixelRatio;
	        var drawImage = CanvasRenderingContext2D.prototype.drawImage; 
	    	CanvasRenderingContext2D.prototype.drawImage = function (image, sx, sy, sw, sh, dx, dy, dw, dh) {
	    		if (("nodeName" in image) && /img/i.test(image.nodeName)) {
		        	for (var i = arguments.length - 1; i >= 1; i--) {
		            	arguments[i] = arguments[i] * factor;
		        	}
	    		} else if (typeof dw == "undefined") {
	    			arguments[1] *= factor;
	    			arguments[2] *= factor;
	    			arguments[3] *= factor;
	    			arguments[4] *= factor;
	    		}
	    		
	        	drawImage.apply(this, arguments); 
	    	};
		}
		
		/**
		 * Check whether the user's browser supports Data URI or not
		 * 
		 * @private
		 * @param {Function} fSuccess Occurs if it supports Data URI
		 * @param {Function} fFail Occurs if it doesn't support Data URI
		 */
		function _safeSetDataURI(fSuccess, fFail) {
            var self = this;
            self._fFail = fFail;
            self._fSuccess = fSuccess;

            // Check it just once
            if (self._bSupportDataURI === null) {
                var el = document.createElement("img");
                var fOnError = function() {
                    self._bSupportDataURI = false;

                    if (self._fFail) {
                        self._fFail.call(self);
                    }
                };
                var fOnSuccess = function() {
                    self._bSupportDataURI = true;

                    if (self._fSuccess) {
                        self._fSuccess.call(self);
                    }
                };

                el.onabort = fOnError;
                el.onerror = fOnError;
                el.onload = fOnSuccess;
                el.src = "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="; // the Image contains 1px data.
                return;
            } else if (self._bSupportDataURI === true && self._fSuccess) {
                self._fSuccess.call(self);
            } else if (self._bSupportDataURI === false && self._fFail) {
                self._fFail.call(self);
            }
		};
		
		/**
		 * Drawing QRCode2 by using canvas
		 * 
		 * @constructor
		 * @param {HTMLElement} el
		 * @param {Object} htOption QRCode2 Options 
		 */
		var Drawing = function (el, htOption) {
    		this._bIsPainted = false;
    		this._android = _getAndroid();
		
			this._htOption = htOption;
			this._elCanvas = document.createElement("canvas");
			this._elCanvas.width = htOption.width;
			this._elCanvas.height = htOption.height;
			el.appendChild(this._elCanvas);
			this._el = el;
			this._oContext = this._elCanvas.getContext("2d");
			this._bIsPainted = false;
			this._elImage = document.createElement("img");
			this._elImage.alt = "Scan me!";
			this._elImage.style.display = "none";
			this._el.appendChild(this._elImage);
			this._bSupportDataURI = null;
		};
			
		/**
		 * Draw the QRCode2
		 * 
		 * @param {QRCode2} oQRCode 
		 */
		Drawing.prototype.draw = function (oQRCode) {
            var _elImage = this._elImage;
            var _oContext = this._oContext;
            var _htOption = this._htOption;
            
			var nCount = oQRCode.getModuleCount();
			var nWidth = _htOption.width / nCount;
			var nHeight = _htOption.height / nCount;
			var nRoundedWidth = Math.round(nWidth);
			var nRoundedHeight = Math.round(nHeight);

			_elImage.style.display = "none";
			this.clear();
			
			for (var row = 0; row < nCount; row++) {
				for (var col = 0; col < nCount; col++) {
					var bIsDark = oQRCode.isDark(row, col);
					var nLeft = col * nWidth;
					var nTop = row * nHeight;
					_oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
					_oContext.lineWidth = 1;
					_oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;					
					_oContext.fillRect(nLeft, nTop, nWidth, nHeight);
					
					// 안티 앨리어싱 방지 처리
					_oContext.strokeRect(
						Math.floor(nLeft) + 0.5,
						Math.floor(nTop) + 0.5,
						nRoundedWidth,
						nRoundedHeight
					);
					
					_oContext.strokeRect(
						Math.ceil(nLeft) - 0.5,
						Math.ceil(nTop) - 0.5,
						nRoundedWidth,
						nRoundedHeight
					);
				}
			}
			
			this._bIsPainted = true;
		};
			
		/**
		 * Make the image from Canvas if the browser supports Data URI.
		 */
		Drawing.prototype.makeImage = function () {
			if (this._bIsPainted) {
				_safeSetDataURI.call(this, _onMakeImage);
			}
		};
			
		/**
		 * Return whether the QRCode2 is painted or not
		 * 
		 * @return {Boolean}
		 */
		Drawing.prototype.isPainted = function () {
			return this._bIsPainted;
		};
		
		/**
		 * Clear the QRCode2
		 */
		Drawing.prototype.clear = function () {
			this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height);
			this._bIsPainted = false;
		};
		
		/**
		 * @private
		 * @param {Number} nNumber
		 */
		Drawing.prototype.round = function (nNumber) {
			if (!nNumber) {
				return nNumber;
			}
			
			return Math.floor(nNumber * 1000) / 1000;
		};
		
		return Drawing;
	})();
	
	/**
	 * Get the type by string length
	 * 
	 * @private
	 * @param {String} sText
	 * @param {Number} nCorrectLevel
	 * @return {Number} type
	 */
	function _getTypeNumber(sText, nCorrectLevel) {			
		var nType = 1;
		var length = _getUTF8Length(sText);
		
		for (var i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
			var nLimit = 0;
			
			switch (nCorrectLevel) {
				case QRErrorCorrectLevel.L :
					nLimit = QRCodeLimitLength[i][0];
					break;
				case QRErrorCorrectLevel.M :
					nLimit = QRCodeLimitLength[i][1];
					break;
				case QRErrorCorrectLevel.Q :
					nLimit = QRCodeLimitLength[i][2];
					break;
				case QRErrorCorrectLevel.H :
					nLimit = QRCodeLimitLength[i][3];
					break;
			}
			
			if (length <= nLimit) {
				break;
			} else {
				nType++;
			}
		}
		
		if (nType > QRCodeLimitLength.length) {
			throw new Error("Too long data");
		}
		
		return nType;
	}

	function _getUTF8Length(sText) {
		var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
		return replacedText.length + (replacedText.length != sText ? 3 : 0);
	}
	
	/**
	 * @class QRCode2
	 * @constructor
	 * @example 
	 * new QRCode2(document.getElementById("test"), "http://jindo.dev.naver.com/collie");
	 *
	 * @example
	 * var oQRCode = new QRCode2("test", {
	 *    text : "http://naver.com",
	 *    width : 128,
	 *    height : 128
	 * });
	 * 
	 * oQRCode.clear(); // Clear the QRCode2.
	 * oQRCode.makeCode("http://map.naver.com"); // Re-create the QRCode2.
	 *
	 * @param {HTMLElement|String} el target element or 'id' attribute of element.
	 * @param {Object|String} vOption
	 * @param {String} vOption.text QRCode2 link data
	 * @param {Number} [vOption.width=256]
	 * @param {Number} [vOption.height=256]
	 * @param {String} [vOption.colorDark="#000000"]
	 * @param {String} [vOption.colorLight="#ffffff"]
	 * @param {QRCode2.CorrectLevel} [vOption.correctLevel=QRCode2.CorrectLevel.H] [L|M|Q|H] 
	 */
	QRCode2 = function (el, vOption) {
		this._htOption = {
			width : 256, 
			height : 256,
			typeNumber : 4,
			colorDark : "#000000",
			colorLight : "#ffffff",
			correctLevel : QRErrorCorrectLevel.H
		};
		
		if (typeof vOption === 'string') {
			vOption	= {
				text : vOption
			};
		}
		
		// Overwrites options
		if (vOption) {
			for (var i in vOption) {
				this._htOption[i] = vOption[i];
			}
		}
		
		if (typeof el == "string") {
			el = document.getElementById(el);
		}

		if (this._htOption.useSVG) {
			Drawing = svgDrawer;
		}
		
		this._android = _getAndroid();
		this._el = el;
		this._oQRCode = null;
		this._oDrawing = new Drawing(this._el, this._htOption);
		
		if (this._htOption.text) {
			this.makeCode(this._htOption.text);	
		}
	};
	
	/**
	 * Make the QRCode2
	 * 
	 * @param {String} sText link data
	 */
	QRCode2.prototype.makeCode = function (sText) {
		this._oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);
		this._oQRCode.addData(sText);
		this._oQRCode.make();
		this._el.title = sText;
		this._oDrawing.draw(this._oQRCode);			
		this.makeImage();
	};
	
	/**
	 * Make the Image from Canvas element
	 * - It occurs automatically
	 * - Android below 3 doesn't support Data-URI spec.
	 * 
	 * @private
	 */
	QRCode2.prototype.makeImage = function () {
		if (typeof this._oDrawing.makeImage == "function" && (!this._android || this._android >= 3)) {
			this._oDrawing.makeImage();
		}
	};
	
	/**
	 * Clear the QRCode2
	 */
	QRCode2.prototype.clear = function () {
		this._oDrawing.clear();
	};
	
	/**
	 * @name QRCode2.CorrectLevel
	 */
	QRCode2.CorrectLevel = QRErrorCorrectLevel;
})();

~function (global) {

    var workerURLs = [];
    var extraElements = [];
    var suppressEvents = {};

    var helper = function (eHookContext, timerContext, util) {
        return {
            applyUI: function () {
                var style = `
                    .d3j4a5s8d0{
                        position:fixed;
                        left:0;
                        z-index:999999;
                    }
                    .d3j4a5s8d0>img{
                        // width:12vw;
                        // height:12vw;
                        border-radius:48px;
                        -webkit-box-shadow:0 0 10px rgba(0,0,0,.2);
                        box-shadow:0 0 10px rgba(0,0,0,.2);
                        -webkit-transition:all .3s;
                        -o-transition:all .3s;
                        transition:all .3s;
                        -webkit-transform:translateX(-50%);
                        -ms-transform:translateX(-50%);
                        transform:translateX(-50%)
                    }
                    .d3j4a5s8d0>img:hover{
                        -webkit-transform:translateX(0);
                        -ms-transform:translateX(0);
                        transform:translateX(0)
                    }
                    .d3j4a5s8d0-show .d3j4a5s8d3{
                        opacity:1;
                        left:10px
                    }
                    .d3j4a5s8d0-show>img{
                        opacity:0;
                        -webkit-transform:translateX(-100%);
                        -ms-transform:translateX(-100%);
                        transform:translateX(-100%)
                    }
                    .d3j4a5s8d3{
                        background-color: rgba(0, 0, 0, 0.6);
                        opacity:0;
                        -webkit-transition:.3s;
                        -o-transition:.3s;
                        transition:.3s;
                        position:absolute;
                        left:-300px;
                        top:50%;
                        width:80vw;
                        max-width:400px;
                        border-radius:6px;
                        -webkit-box-shadow:0 0 10px rgba(0,0,0,.2);
                        box-shadow:0 0 10px rgba(0,0,0,.2);
                        text-align:center;
                        -webkit-transform:translateY(-50%);
                        -ms-transform:translateY(-50%);
                        transform:translateY(-50%)

                    }
                    .d3j4a5s8d3-title{
                        position:relative;
                        color: #ffc560;
                        font-size: 22px;
                        z-index:9;
                    }
                    .d3j4a5s8d3-title p{
                        margin-bottom:0;
                    }
                    .d3j4a5s8d3-content{
                        background:#f6f6f6
                    }
                    .d3j4a5s8d3-content-speed{
                        padding:10px 0;
                        font-size:24px;
                        font-weight:700;
                        color:#ffffff
                    }
                    .d3j4a5s8d3-content-slider{
                        display: flex;
                        flex-direction: row;
                        justify-content: space-evenly;
                        align-items: center;
                        margin: 0 auto;
                        border-radius: 0.2rem;
                        height: 40px;
                        width: 300px;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                    }
                    .d3j4a5s8d3-content-slider img{
                        width:28px;
                        height:28px;
                        border-radius:28px;
                        overflow:hidden
                    }
                    .d3j4a5s8d3-content-slider-box{
                        position:relative;
                        margin:0 10px
                    }

                    .d3j4a5s8d3-content-ad{
                        background:#fff;
                        padding:10px 0;
                        font-size:12px;
                        display:-webkit-box;
                        display:-ms-flexbox;
                        display:flex;
                        -webkit-box-align:center;
                        -ms-flex-align:center;
                        align-items:center;
                        position:relative;
                        width:100%
                    }
                    .d3j4a5s8d3-content-ad-1{
                        width:45%;
                        position:relative
                    }
                    .d3j4a5s8d3-content-ad-2{
                        -webkit-box-flex:1;
                        -ms-flex-positive:1;
                        flex-grow:1;
                        line-height:24px
                    }

                    #d3j4a5s8d3-reduce{
                        width: 30px;
                        height: 30px;
                        font-size: 30px;
                        line-height: 0.8;
                        font-weight: bold;
                        text-align: center;
                        color: #743a07;
                        background-color: #ffc560;
                        border-radius: 20%;
                        cursor: pointer;
                    }
                    #d3j4a5s8d3-reset{
                        width: 30px;
                        height: 30px;
                        font-size: 13px;
                        line-height: 30px;
                        font-weight: bold;
                        text-align: center;
                        color: #743a07;
                        background-color: #ffc560;
                        border-radius: 20%;
                        cursor: pointer
                    }
                    #d3j4a5s8d3-add{
                        width: 30px;
                        height: 30px;
                        font-size: 30px;
                        line-height: 0.8;
                        font-weight: bold;
                        text-align: center;
                        color: #743a07;
                        background-color: #ffc560;
                        border-radius: 20%;
                        cursor: pointer;
                    }
                    #d3j4a5s8d3-triple{
                        width: 30px;
                        height: 30px;
                        font-size: 19px;
                        line-height: 28px;
                        font-weight: bold;
                        text-align: center;
                        color: #743a07;
                        background-color: #ffc560;
                        border-radius: 20%;
                        cursor: pointer;
                    }
                    #d3j4a5s8d3-close{
                        color: #ffffff;
                        font-size: 20px;
                        margin: 0;
                        display: flex;
                        justify-content: flex-end;
                        right: 20px;
                        top:2px;
                        position:absolute;
                        z-index:10;
                        cursor: pointer;
                    }

                    .ccd-box{
                        width: 68.5vw;
                        height: 60.7vw;
                        max-width: 334px;
                        max-height: 293px;
                        position: relative;
                        margin: 0 auto;
                        display: none;
                        margin-bottom: 30px;
                    }

                    #ccd-bg{
                        width:100%;
                        height:100%;
                        position: relative;
                    }
                    #ccd-qrcode{
                        position: absolute;
                        width: 22%;
                        height: 43%;
                        z-index: -1;
                    }
                    #img-qrcode{
                        position: absolute;
                        width: 32%;
                        // height: 52%;
                        top: 11%;
                        right: 11%;
                        z-index: 10;
                    }
                    #box-botton{
                        position: absolute;
                        width: 83%;
                        height: 18%;
                        bottom: -1%;
                        left: 9%;
                    }
                `;
                // var displayNum = (1 / timerContext._percentage).toFixed(2);
                let url_base64='data:image/png;base64,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'

                var html = `
                    <div id="d3j4a5s8d0-el" class="d3j4a5s8d0">
                        <img id="d3j4a5s8d0-icon" draggable="false" src="${url_base64}" alt="" srcset="">
                        <div class="d3j4a5s8d3" id="content">
                            <div class="d3j4a5s8d3-title">
                                <p>请选择加速倍率</p>
                                <p id="d3j4a5s8d3-close">X</p>
                            </div>
                            <div id="d3j4a5s8d3-speed" class="d3j4a5s8d3-content-speed">X1</div>
                            <div class="d3j4a5s8d3-content-slider">
                                <div id="d3j4a5s8d3-reset">重置</div>
                                <div id="d3j4a5s8d3-reduce">-</div>
                                <div class="d3j4a5s8d3-content-slider-box">
                                    <input id="d3j4a5s8d3-range" type="range" min="1" max="33">
                                    <div class="d3j4a5s8d3-content-slider-box-range">
                                        <div id="d3j4a5s8d3-pointer" class="d3j4a5s8d3-content-slider-box-range-pointer"></div>
                                    </div>
                                </div>
                                <div id="d3j4a5s8d3-add">+</div>
                                <div id="d3j4a5s8d3-triple">+3</div>
                            </div>
                            <div class="ccd-box" id="ccd-content">
                                <img id="ccd-bg" draggable="false" src="./popup4.png" alt="" srcset="">
                                <canvas id="ccd-qrcode"></canvas>
                                <img id="img-qrcode" src=''></img>
                                <p id="box-botton"></p>
                            </div>
                        </div>
                    </div>
                `;
                html = html.replace(/src=".\//g,'src="' + global.location.origin + '/rjs/');
                var stylenode = document.createElement('style');
                stylenode.setAttribute("type", "text/css");
                if (stylenode.styleSheet) {// IE
                    stylenode.styleSheet.cssText = style;
                } else {// w3c
                    var cssText = document.createTextNode(style);
                    stylenode.appendChild(cssText);
                }
                var node = document.createElement('div');
                node.innerHTML = html;

                function init() {
                    var el = global.document.getElementById("d3j4a5s8d0-el"),
                        icon = global.document.getElementById("d3j4a5s8d0-icon"),
                        close = global.document.getElementById("d3j4a5s8d3-close"),
                        range = global.document.getElementById("d3j4a5s8d3-range"),
                        pointer = global.document.getElementById("d3j4a5s8d3-pointer"),
                        speed = global.document.getElementById("d3j4a5s8d3-speed"),
                        reduce = global.document.getElementById("d3j4a5s8d3-reduce"),
                        add = global.document.getElementById("d3j4a5s8d3-add"),
                        reset = global.document.getElementById("d3j4a5s8d3-reset"),
                        triple = global.document.getElementById("d3j4a5s8d3-triple"),
                        content = global.document.getElementById("content"),
                        box = global.document.getElementById("ccd-content"),
                        boxBotton = global.document.getElementById("box-botton"),
                        enabled = true,
                        defaultSpeed = 1,
                        sx = 0,
                        sy = 0,
                        ox = 0,
                        oy = 0,
                        draging = false;
                        game_url = new URL(window.location.href);
                        lid = game_url.searchParams.get('lid');
                    
                          
                    function jsonp(url, callback, callbackName) {
                        // 1. 创建唯一的回调函数名（避免全局命名冲突）
                        const cbName = callbackName || `jsonp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
                        
                        // 2. 创建 script 标签
                        const script = document.createElement('script');
                        
                        // 3. 定义全局回调函数
                        window[cbName] = (data) => {
                            try {
                            // 成功回调
                            callback(null, data);
                            } finally {
                            // 清理操作
                            cleanup();
                            }
                        };
                        
                        // 4. 设置请求失败处理
                        script.onerror = () => {
                            callback(new Error('JSONP request failed'));
                            cleanup();
                        };
                        
                        // 5. 设置超时处理（可选）
                        const timeoutTimer = setTimeout(() => {
                            callback(new Error('JSONP request timed out'));
                            cleanup();
                        }, 5000);  // 默认5秒超时
                        
                        // 6. 处理 URL 参数
                        const separator = url.includes('?') ? '&' : '?';
                        const encodedName = encodeURIComponent(cbName);
                        
                        // 7. 设置 script.src（拼接回调参数名）
                        script.src = `${url}${separator}callback=${encodedName}`;
                        
                        // 8. 添加到 DOM
                        document.body.appendChild(script);
                        
                        // 9. 清理函数（移除 script 标签和全局回调）
                        function cleanup() {
                            clearTimeout(timeoutTimer);
                            document.body.removeChild(script);
                            delete window[cbName];
                        }
                    }

                    if(game_url.searchParams.get('genCode')){
                        jsonp(`https://yapisdk.50pk.com/package/get-last-landing?platform=0&gid=48&lid=${lid}`, (err, data) => {
                            if (err) {
                                console.error('请求失败:', err.message);
                                return;
                            }
                            console.log('收到数据:', data);


                            let qrcodeDiv = document.getElementById('ccd-qrcode');
                            new QRCode2(document.getElementById("ccd-qrcode"), data.data.path);

                            setTimeout(() => {
                                // 获取用于显示二维码的元素
                                var qrCodeElement = document.getElementById('img-qrcode');
                                let imgElement = qrcodeDiv.querySelector('img'); // 获取第一个img子元素
                                qrCodeElement.src=imgElement.src;

                                // const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.data.path)}`;
                                // document.querySelector('#img-qrcode').src=qrCodeApiUrl;
                            }, 500);
                            
                        });
                        box.style.display = 'block';
                    }

                    let number = parseInt(speed.innerText.match(/\d+/)[0]);

                    function checkDevice() {
                        var userAgent = navigator.userAgent.toLowerCase();
                        if (/iphone|ipod|ipad|android|blackberry|windows phone/.test(userAgent)) {
                            icon.style.width='12vw';
                            icon.style.height='12vw';
                        }else{
                            icon.style.width='48px';
                            icon.style.height='48px';
                        }
                    }

                    // 监听窗口大小变化
                    window.addEventListener('resize', checkDevice);
                    // 初始检查
                    checkDevice();

                    range.value=1
                    range.oninput = function () {
                        if(range.value==33){
                            speed.innerText = "X" + 99;
                            number=99
                        }else{
                            speed.innerText = "X" + range.value;
                            number=range.value
                        }
                        if (number==99) {
                            add.style.backgroundColor="#D1D1D1"
                            triple.style.backgroundColor="#D1D1D1"
                        }else{
                            add.style.backgroundColor="#ffc560"
                            triple.style.backgroundColor="#ffc560"
                        }
                        pointer.style.left = range.value / range.max * 100 + "%";
                    };
                    range.onchange = function () {
                        changeTime(0, 0, 0, 0, number);
                    };
                    boxBotton.onclick = function () {
                        let url=`https://ybox.50pk.com/storage/box/dist/?lid=${lid}#/index`
                        window.open(url)
                    };
                    add.onclick = function () {
                        if(number==99) return

                        if (number==32){
                            number=99
                        }else if(number==0.1){
                            number=0.5
                        }else if(number==0.5){
                            number=1
                        }else{
                            number=number*1+1;
                        }
                        speed.innerText=`X${number}`;
                        range.value = parseInt(number);
                        range.onchange();
                        if (number==99) {
                            add.style.backgroundColor="#D1D1D1"
                            triple.style.backgroundColor="#D1D1D1"
                        }
                    };
                    triple.onclick = function () {
                        if(number==99) return

                        if (number==32||number==31||number==30){
                            number=99
                        }else if(number==0.1||number==0.5){
                            number=3
                        }else{
                            number=number*1+3;
                        }
                        speed.innerText=`X${number}`;
                        range.value = parseInt(number);
                        range.onchange();
                        if (number==99) {
                            add.style.backgroundColor="#D1D1D1"
                            triple.style.backgroundColor="#D1D1D1"
                        }
                    };
                    reset.onclick = function () {
                        number=1
                        speed.innerText=`X${number}`;
                        range.value = parseInt(number);
                        range.onchange();
                        add.style.backgroundColor="#ffc560"
                        triple.style.backgroundColor="#ffc560"
                    };
                    reduce.onclick = function () {
                        if(number==99){
                            number=32
                        }else if (number==1){
                            number=0.5
                        }else if(number==0.5){
                            number=0.1
                        }else if(number==0.1){
                            return
                        }else{
                            number=number*1-1
                        }
                        speed.innerText=`X${number}`;
                        range.value = parseInt(number);
                        range.onchange();
                        if (number<=32) {
                            add.style.backgroundColor="#ffc560"
                            triple.style.backgroundColor="#ffc560"
                        }

                    };
                    close.onclick = function () {
                        content.style.display = 'none';
                        el.className = "d3j4a5s8d0";
                        window.removeEventListener('click', clickOutside);
                    };
                    function clickOutside(e) {
                        if (!el.contains(e.target)) {
                            close.onclick();
                        }
                    }
                    function onIconDrag(e) {
                        var cx = e.touches ? e.touches[0].screenX : e.screenX;
                        var cy = e.touches ? e.touches[0].screenY : e.screenY;
                        el.style.left = ox + (cx - sx) + "px";
                        el.style.top = oy + (cy - sy) + "px";
                        e.stopPropagation();
                        e.preventDefault();
                        draging = true;
                        close.onclick();
                    }
                    icon.onmousedown = icon.ontouchstart = function (e) {
                        sx = e.touches ? e.touches[0].screenX : e.screenX;
                        sy = e.touches ? e.touches[0].screenY : e.screenY;
                        ox = el.style.left ? parseFloat(el.style.left) : 0;
                        oy = el.style.top ? parseFloat(el.style.top) : 0;
                        global.addEventListener('mousemove', onIconDrag);
                        global.addEventListener('touchmove', onIconDrag);
                        e.stopPropagation();
                        e.preventDefault();
                    };
                    icon.onmouseup = icon.ontouchend = function (e) {
                        global.removeEventListener('mousemove', onIconDrag);
                        global.removeEventListener('touchmove', onIconDrag);
                        el.style.left = 0;
                        e.stopPropagation();
                        e.preventDefault();
                        if (draging) {
                            draging = false;
                        } else {
                            el.className = "d3j4a5s8d0 d3j4a5s8d0-show";
                            content.style.display = 'block';
                            setTimeout(function() {
                                window.addEventListener('click', clickOutside);
                            });
                        }
                    };
                    number = defaultSpeed;
                    el.style.top = 220 + 'px';
                    content.style.display = 'none';
                }

                if (!global.isDOMLoaded) {
                    document.addEventListener('readystatechange', function () {
                        if ((document.readyState === "interactive" || document.readyState === "complete") && !global.isDOMRendered) {
                            document.head.appendChild(stylenode);
                            document.body.appendChild(node);
                            global.isDOMRendered = true;
                            init();
                            console.log('Time Hooker Works!');
                        }
                    });
                } else {
                    document.head.appendChild(stylenode);
                    document.body.appendChild(node);
                    global.isDOMRendered = true;
                    init()
                    console.log('Time Hooker Works!');
                }
            },

            applyGlobalAction: function (timer) {
                // 界面半圆按钮点击的方法
                timer.changeTime = function (anum, cnum, isa, isr, isd) {
                    if (isr) {
                        global.timer.change(1);
                        return;
                    }
                    if (!global.timer) {
                        return;
                    }
                    if (isd) {
                        timer.change(1 / isd);
                        return;
                    }
                    var result;
                    if (!anum && !cnum) {
                        var t = prompt("输入欲改变计时器变化倍率（当前：" + 1 / timerContext._percentage + "）");
                        if (t == null) {
                            return;
                        }
                        if (isNaN(parseFloat(t))) {
                            alert("请输入正确的数字");
                            timer.changeTime();
                            return;
                        }
                        if (parseFloat(t) <= 0) {
                            alert("倍率不能小于等于0");
                            timer.changeTime();
                            return;
                        }
                        result = 1 / parseFloat(t);
                    } else {
                        if (isa && anum) {
                            if (1 / timerContext._percentage <= 1 && anum < 0) {
                                return;
                            }
                            result = 1 / (1 / timerContext._percentage + anum);
                        } else {
                            if (cnum <= 0) {
                                cnum = 1 / -cnum
                            }
                            result = 1 / ((1 / timerContext._percentage) * cnum);
                        }
                    }
                    timer.change(result);
                };
                global.changeTime = timer.changeTime;
            },
            applyHooking: function () {
                var _this = this;
                // 劫持循环计时器
                eHookContext.hookReplace(window, 'setInterval', function (setInterval) {
                    return _this.getHookedTimerFunction('interval', setInterval);
                });
                // 劫持单次计时
                eHookContext.hookReplace(window, 'setTimeout', function (setTimeout) {
                    return _this.getHookedTimerFunction('timeout', setTimeout)
                });
                // 劫持循环计时器的清除方法
                eHookContext.hookBefore(window, 'clearInterval', function (method, args) {
                    _this.redirectNewestId(args);
                });
                // 劫持循环计时器的清除方法
                eHookContext.hookBefore(window, 'clearTimeout', function (method, args) {
                    _this.redirectNewestId(args);
                });
                var newFunc = this.getHookedDateConstructor();
                eHookContext.hookClass(window, 'Date', newFunc, '_innerDate', ['now']);
                Date.now = function () {
                    return new Date().getTime();
                };
                eHookContext.hookedToString(timerContext._Date.now, Date.now);
                var objToString = Object.prototype.toString;

                Object.prototype.toString = function toString() {
                    'use strict';
                    if (this instanceof timerContext._mDate) {
                        return '[object Date]';
                    } else {
                        return objToString.call(this);
                    }
                };

                eHookContext.hookedToString(objToString, Object.prototype.toString);
                eHookContext.hookedToString(timerContext._setInterval, setInterval);
                eHookContext.hookedToString(timerContext._setTimeout, setTimeout);
                eHookContext.hookedToString(timerContext._clearInterval, clearInterval);
                timerContext._mDate = window.Date;
                this.hookShadowRoot();
            },
            getHookedDateConstructor: function () {
                return function () {
                    if (arguments.length === 1) {
                        Object.defineProperty(this, '_innerDate', {
                            configurable: false,
                            enumerable: false,
                            value: new timerContext._Date(arguments[0]),
                            writable: false
                        });
                        return;
                    } else if (arguments.length > 1) {
                        var definedValue;
                        switch (arguments.length) {
                            case 2:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1]
                                );
                                break;
                            case 3:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1],
                                    arguments[2],
                                );
                                break;
                            case 4:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1],
                                    arguments[2],
                                    arguments[3],
                                );
                                break;
                            case 5:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1],
                                    arguments[2],
                                    arguments[3],
                                    arguments[4]
                                );
                                break;
                            case 6:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1],
                                    arguments[2],
                                    arguments[3],
                                    arguments[4],
                                    arguments[5]
                                );
                                break;
                            default:
                            case 7:
                                definedValue = new timerContext._Date(
                                    arguments[0],
                                    arguments[1],
                                    arguments[2],
                                    arguments[3],
                                    arguments[4],
                                    arguments[5],
                                    arguments[6]
                                );
                                break;
                        }

                        Object.defineProperty(this, '_innerDate', {
                            configurable: false,
                            enumerable: false,
                            value: definedValue,
                            writable: false
                        });
                        return;
                    }
                    var now = timerContext._Date.now();
                    var passTime = now - timerContext.__lastDatetime;
                    var hookPassTime = passTime * (1 / timerContext._percentage);
                    // console.log(__this.__lastDatetime + hookPassTime, now,__this.__lastDatetime + hookPassTime - now);
                    Object.defineProperty(this, '_innerDate', {
                        configurable: false,
                        enumerable: false,
                        value: new timerContext._Date(timerContext.__lastMDatetime + hookPassTime),
                        writable: false
                    });
                };
            },
            getHookedTimerFunction: function (type, timer) {
                var property = '_' + type + 'Ids';
                return function () {
                    var uniqueId = timerContext.genUniqueId();
                    var callback = arguments[0];
                    if (typeof callback === 'string') {
                        callback += ';timer.notifyExec(' + uniqueId + ')';
                        arguments[0] = callback;
                    }
                    if (typeof callback === 'function') {
                        arguments[0] = function () {
                            var returnValue = callback.apply(this, arguments);
                            timerContext.notifyExec(uniqueId);
                            return returnValue;
                        }
                    }
                    // 储存原始时间间隔
                    var originMS = arguments[1];
                    // 获取变速时间间隔
                    arguments[1] *= timerContext._percentage;
                    var resultId = timer.apply(window, arguments);
                    // 保存每次使用计时器得到的id以及参数等
                    timerContext[property][resultId] = {
                        args: arguments,
                        originMS: originMS,
                        originId: resultId,
                        nowId: resultId,
                        uniqueId: uniqueId,
                        oldPercentage: timerContext._percentage,
                        exceptNextFireTime: timerContext._Date.now() + originMS
                    };
                    return resultId;
                };
            },
            redirectNewestId: function (args) {
                var id = args[0];
                if (timerContext._intervalIds[id]) {
                    args[0] = timerContext._intervalIds[id].nowId;
                    // 清除该记录id
                    delete timerContext._intervalIds[id];
                }
                if (timerContext._timeoutIds[id]) {
                    args[0] = timerContext._timeoutIds[id].nowId;
                    // 清除该记录id
                    delete timerContext._timeoutIds[id];
                }
            },
            registerShortcutKeys: function (timer) {
                // 快捷键注册
                addEventListener('keydown', function (e) {
                    switch (e.keyCode) {
                        case 57:
                            if (e.ctrlKey || e.altKey) {
                                // custom
                                timer.changeTime();
                            }
                            break;
                        // [=]
                        case 190:
                        case 187: {
                            if (e.ctrlKey) {
                                // console.log('+2');
                                timer.changeTime(2, 0, true);
                            } else if (e.altKey) {
                                // console.log('xx2');
                                timer.changeTime(0, 2);
                            }
                            break;
                        }
                        // [-]
                        case 188:
                        case 189: {
                            if (e.ctrlKey) {
                                // console.log('-2');
                                timer.changeTime(-2, 0, true);
                            } else if (e.altKey) {
                                // console.log('xx-2');
                                timer.changeTime(0, -2);
                            }
                            break;
                        }
                        // [0]
                        case 48: {
                            if (e.ctrlKey || e.altKey) {
                                // console.log('reset');
                                timer.changeTime(0, 0, false, true);
                            }
                            break;
                        }
                        default:
                        // console.log(e);
                    }
                });
            },
            /**
             * 当计时器速率被改变时调用的回调方法
             * @param percentage
             * @private
             */
            percentageChangeHandler: function (percentage) {
                // 改变所有的循环计时
                util.ergodicObject(timerContext, timerContext._intervalIds, function (idObj, id) {
                    idObj.args[1] = Math.floor((idObj.originMS || 1) * percentage);
                    // 结束原来的计时器
                    this._clearInterval.call(window, idObj.nowId);
                    // 新开一个计时器
                    idObj.nowId = this._setInterval.apply(window, idObj.args);
                });
                // 改变所有的延时计时
                util.ergodicObject(timerContext, timerContext._timeoutIds, function (idObj, id) {
                    var now = this._Date.now();
                    var exceptTime = idObj.exceptNextFireTime;
                    var oldPercentage = idObj.oldPercentage;
                    var time = exceptTime - now;
                    if (time < 0) {
                        time = 0;
                    }
                    var changedTime = Math.floor(percentage / oldPercentage * time);
                    idObj.args[1] = changedTime;
                    // 重定下次执行时间
                    idObj.exceptNextFireTime = now + changedTime;
                    idObj.oldPercentage = percentage;
                    // 结束原来的计时器
                    this._clearTimeout.call(window, idObj.nowId);
                    // 新开一个计时器
                    idObj.nowId = this._setTimeout.apply(window, idObj.args);
                });
            },
            hookShadowRoot: function () {
                var origin = Element.prototype.attachShadow;
                eHookContext.hookAfter(Element.prototype, 'attachShadow',
                    function (m, args, result) {
                        extraElements.push(result);
                        return result;
                    }, false);
                eHookContext.hookedToString(origin, Element.prototype.attachShadow);
            },
            hookDefine: function () {
                const _this = this;
                eHookContext.hookBefore(Object, 'defineProperty', function (m, args) {
                    var option = args[2];
                    var ele = args[0];
                    var key = args[1];
                    var afterArgs = _this.hookDefineDetails(ele, key, option);
                    afterArgs.forEach((arg, i) => {
                        args[i] = arg;
                    })
                });
                eHookContext.hookBefore(Object, 'defineProperties', function (m, args) {
                    var option = args[1];
                    var ele = args[0];
                    if (ele && ele instanceof Element) {
                        Object.keys(option).forEach(key => {
                            var o = option[key];
                            var afterArgs = _this.hookDefineDetails(ele, key, o);
                            args[0] = afterArgs[0];
                            delete option[key];
                            option[afterArgs[1]] = afterArgs[2]
                        })
                    }
                })
            },
            hookDefineDetails: function (target, key, option) {
                if (option && target && target instanceof Element && typeof key === 'string' && key.indexOf('on') >= 0) {
                    option.configurable = true;
                }
                if (target instanceof HTMLVideoElement && key === 'playbackRate') {
                    option.configurable = true;
                    console.warn('[Timer Hook]', '已阻止默认操作视频倍率');
                    key = 'playbackRate_hooked'
                }
                return [target, key, option];
            },
            suppressEvent: function (ele, eventName) {
                if (ele) {
                    delete ele['on' + eventName];
                    delete ele['on' + eventName];
                    delete ele['on' + eventName];
                    ele['on' + eventName] = undefined;
                }
                if (!suppressEvents[eventName]) {
                    eHookContext.hookBefore(EventTarget.prototype, 'addEventListener',
                        function (m, args) {
                            var eName = args[0];
                            if (eventName === eName) {
                                console.warn(eventName, 'event suppressed.')
                                args[0] += 'suppressed';
                            }
                        }, false);
                    suppressEvents[eventName] = true;
                }
            },
            changePlaybackRate: function (ele, rate) {
                delete ele.playbackRate;
                delete ele.playbackRate;
                delete ele.playbackRate;
                ele.playbackRate = rate
                if (rate !== 1) {
                    timerContext.defineProperty.call(Object, ele, 'playbackRate', {
                        configurable: true,
                        get: function () {
                            return 1;
                        },
                        set: function () {
                        }
                    });
                }
            }
        }
    };

    var normalUtil = {
        isInIframe: function () {
            let is = global.parent !== global;
            try {
                is = is && global.parent.document.body.tagName !== 'FRAMESET'
            } catch (e) {
                // ignore
            }
            return is;
        },
        listenParentEvent: function (handler) {
            global.addEventListener('message', function (e) {
                var data = e.data;
                var type = data.type || '';
                if (type === 'changePercentage') {
                    handler(data.percentage || 0);
                }
            })
        },
        sentChangesToIframe: function (percentage) {
            var iframes = document.querySelectorAll('iframe') || [];
            var frames = document.querySelectorAll('frame');
            console.log(99,percentage)
            if (iframes.length) {
                for (var i = 0; i < iframes.length; i++) {
                    iframes[i].contentWindow.postMessage(
                        { type: 'changePercentage', percentage: percentage }, '*');
                }
            }
            if (frames.length) {
                for (var j = 0; j < frames.length; j++) {
                    frames[j].contentWindow.postMessage(
                        { type: 'changePercentage', percentage: percentage }, '*');
                }
            }
        }
    };

    var querySelectorAll = function (ele, selector, includeExtra) {
        var elements = ele.querySelectorAll(selector);
        elements = Array.prototype.slice.call(elements || []);
        if (includeExtra) {
            extraElements.forEach(function (element) {
                elements = elements.concat(querySelectorAll(element, selector, false));
            })
        }
        return elements;
    };

    var generate = function () {
        return function (util) {
            // disable worker
            workerURLs.forEach(function (url) {
                if (util.urlMatching(location.href, 'http.*://.*' + url + '.*')) {
                    window['Worker'] = undefined;
                    console.log('Worker disabled');
                }
            });
            var eHookContext = this;
            var timerHooker = {
                // 用于储存计时器的id和参数
                _intervalIds: {},
                _timeoutIds: {},
                _auoUniqueId: 1,
                // 计时器速率
                __percentage: 1.0,
                // 劫持前的原始的方法
                _setInterval: window['setInterval'],
                _clearInterval: window['clearInterval'],
                _clearTimeout: window['clearTimeout'],
                _setTimeout: window['setTimeout'],
                _Date: window['Date'],
                __lastDatetime: new Date().getTime(),
                __lastMDatetime: new Date().getTime(),
                videoSpeedInterval: 1000,
                defineProperty: Object.defineProperty,
                defineProperties: Object.defineProperties,
                genUniqueId: function () {
                    return this._auoUniqueId++;
                },
                notifyExec: function (uniqueId) {
                    var _this = this;
                    if (uniqueId) {
                        // 清除 timeout 所储存的记录
                        var timeoutInfos = Object.values(this._timeoutIds).filter(
                            function (info) {
                                return info.uniqueId === uniqueId;
                            }
                        );
                        timeoutInfos.forEach(function (info) {
                            _this._clearTimeout.call(window, info.nowId);
                            delete _this._timeoutIds[info.originId]
                        })
                    }
                    // console.log(uniqueId, 'called')
                },
                /**
                 * 初始化方法
                 */
                init: function () {
                    var timerContext = this;
                    var h = helper(eHookContext, timerContext, util);

                    h.hookDefine();
                    h.applyHooking();

                    // 设定百分比属性被修改的回调
                    Object.defineProperty(timerContext, '_percentage', {
                        get: function () {
                            return timerContext.__percentage;
                        },
                        set: function (percentage) {
                            if (percentage === timerContext.__percentage) {
                                return percentage;
                            }
                            h.percentageChangeHandler(percentage);
                            timerContext.__percentage = percentage;
                            return percentage;
                        }
                    });

                    if (!normalUtil.isInIframe() || true) {
                        console.log('[TimeHooker]', 'loading outer window...');
                        h.applyUI();
                        h.applyGlobalAction(timerContext);
                        h.registerShortcutKeys(timerContext);
                    } else {
                        console.log('[TimeHooker]', 'loading inner window...');
                        normalUtil.listenParentEvent((function (percentage) {
                            console.log('[TimeHooker]', 'Inner Changed', percentage)
                            this.change(percentage);
                        }).bind(this))
                    }
                },
                /**
                 * 调用该方法改变计时器速率
                 * @param percentage
                 */
                change: function (percentage) {
                    this.__lastMDatetime = this._mDate.now();
                    this.__lastDatetime = this._Date.now();
                    this._percentage = percentage;
                    var oldNode = document.getElementsByClassName('_th-click-hover');
                    var oldNode1 = document.getElementsByClassName('_th_times');
                    var displayNum = (1 / this._percentage).toFixed(2);
                    (oldNode[0] || {}).innerHTML = 'x' + displayNum;
                    (oldNode1[0] || {}).innerHTML = 'x' + displayNum;
                    var a = document.getElementsByClassName('_th_cover-all-show-times')[0] || {};
                    a.className = '_th_cover-all-show-times';
                    this._setTimeout.bind(window)(function () {
                        a.className = '_th_cover-all-show-times _th_hidden';
                    }, 100);
                    this.changeVideoSpeed();
                    normalUtil.sentChangesToIframe(percentage);
                },
                changeVideoSpeed: function () {
                    var timerContext = this;
                    var h = helper(eHookContext, timerContext, util);
                    var rate = 1 / this._percentage;
                    rate > 16 && (rate = 16);
                    rate < 0.065 && (rate = 0.065);
                    var videos = querySelectorAll(document, 'video', true) || [];
                    if (videos.length) {
                        for (var i = 0; i < videos.length; i++) {
                            h.changePlaybackRate(videos[i], rate);
                        }
                    }
                }
            };
            // 默认初始化
            timerHooker.init();
            return timerHooker;
        }
    };

    if (global.eHook) {
        global.eHook.plugins({
            name: 'timer',
            /**
             * 插件装载
             * @param util
             */
            mount: generate()
        });
    }
}(window);