/**
 * 月满西楼 · 诗意加速器 (Moonbeam Accelerator)
 * 基于 accelerator_moonbeam.html 的纯 JS 版本
 * 参考冰晶加速.js 的组织结构
 * Timer Hook 逻辑与冰晶加速.js 一致
 */
(function () {
    'use strict';

    // ================================================================
    // Part 1: Timer Hook 核心 (与冰晶加速.js 相同)
    // ================================================================

    var _origSetTimeout = window.setTimeout;
    var _origClearTimeout = window.clearTimeout;
    var _origSetInterval = window.setInterval;
    var _origClearInterval = window.clearInterval;
    var _origDate = window.Date;
    var _origDateNow = _origDate.now.bind ? _origDate.now.bind(_origDate) : function () { return _origDate.now(); };
    var _origDateParse = _origDate.parse;
    var _origDateUTC = _origDate.UTC;

    var _percentage = 1.0;
    var _invPercentage = 1.0;
    var _timeoutIds = {};
    var _intervalIds = {};
    var _autoUniqueId = 1;
    var _hooksInstalled = false;

    var _lastRealTime = _origDateNow();
    var _lastVirtualTime = _origDateNow();

    function genUniqueId() { return _autoUniqueId++; }

    function notifyExec(uniqueId) {
        if (!uniqueId) return;
        for (var id in _timeoutIds) {
            var info = _timeoutIds[id];
            if (info.uniqueId === uniqueId) {
                _origClearTimeout.call(window, info.nowId);
                delete _timeoutIds[info.originId];
                break;
            }
        }
    }

    function hookedSetTimeout() {
        var uniqueId = genUniqueId();
        var callback = arguments[0];
        if (typeof callback === 'function') {
            var _cb = callback;
            arguments[0] = function () {
                var ret = _cb.apply(this, arguments);
                notifyExec(uniqueId);
                return ret;
            };
        }
        var originMS = arguments[1];
        arguments[1] = (originMS || 0) * _percentage;
        var resultId = _origSetTimeout.apply(window, arguments);
        _timeoutIds[resultId] = {
            args: arguments, originMS: originMS, originId: resultId,
            nowId: resultId, uniqueId: uniqueId, oldPercentage: _percentage,
            exceptNextFireTime: _origDateNow() + (originMS || 0)
        };
        return resultId;
    }

    function hookedSetInterval() {
        var uniqueId = genUniqueId();
        var callback = arguments[0];
        if (typeof callback === 'function') {
            var _cb = callback;
            arguments[0] = function () {
                var ret = _cb.apply(this, arguments);
                notifyExec(uniqueId);
                return ret;
            };
        }
        var originMS = arguments[1];
        arguments[1] = (originMS || 0) * _percentage;
        var resultId = _origSetInterval.apply(window, arguments);
        _intervalIds[resultId] = {
            args: arguments, originMS: originMS, originId: resultId,
            nowId: resultId, uniqueId: uniqueId, oldPercentage: _percentage,
            exceptNextFireTime: _origDateNow() + (originMS || 0)
        };
        return resultId;
    }

    function hookedClearTimeout() {
        var id = arguments[0];
        if (_timeoutIds[id]) { arguments[0] = _timeoutIds[id].nowId; delete _timeoutIds[id]; }
        return _origClearTimeout.apply(window, arguments);
    }

    function hookedClearInterval() {
        var id = arguments[0];
        if (_intervalIds[id]) { arguments[0] = _intervalIds[id].nowId; delete _intervalIds[id]; }
        return _origClearInterval.apply(window, arguments);
    }

    function percentageChangeHandler(newPercentage) {
        var now = _origDateNow();
        var id, idObj;
        for (id in _intervalIds) {
            idObj = _intervalIds[id];
            idObj.args[1] = Math.floor((idObj.originMS || 1) * newPercentage);
            _origClearInterval.call(window, idObj.nowId);
            idObj.nowId = _origSetInterval.apply(window, idObj.args);
        }
        for (id in _timeoutIds) {
            idObj = _timeoutIds[id];
            var exceptTime = idObj.exceptNextFireTime;
            var oldPercentage = idObj.oldPercentage;
            var time = exceptTime - now;
            if (time < 0) time = 0;
            var changedTime = Math.floor(newPercentage / oldPercentage * time);
            idObj.args[1] = changedTime;
            idObj.exceptNextFireTime = now + changedTime;
            idObj.oldPercentage = newPercentage;
            _origClearTimeout.call(window, idObj.nowId);
            idObj.nowId = _origSetTimeout.apply(window, idObj.args);
        }
    }

    function _HookedDate() {
        var n = arguments.length;
        if (n === 0) return new _origDate(Date.now());
        if (n === 1) return new _origDate(arguments[0]);
        if (n === 2) return new _origDate(arguments[0], arguments[1]);
        if (n === 3) return new _origDate(arguments[0], arguments[1], arguments[2]);
        if (n === 4) return new _origDate(arguments[0], arguments[1], arguments[2], arguments[3]);
        if (n === 5) return new _origDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
        if (n === 6) return new _origDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
        return new _origDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
    }

    function _hookedDateNow() {
        var realNow = _origDateNow();
        return _lastVirtualTime + (realNow - _lastRealTime) * _invPercentage;
    }

    function installHooks() {
        if (_hooksInstalled) return;
        _hooksInstalled = true;
        window.setTimeout = hookedSetTimeout;
        window.setInterval = hookedSetInterval;
        window.clearTimeout = hookedClearTimeout;
        window.clearInterval = hookedClearInterval;
        window.Date = _HookedDate;
        _HookedDate.now = _hookedDateNow;
        _HookedDate.parse = _origDateParse;
        _HookedDate.UTC = _origDateUTC;
    }

    function removeHooks() {
        if (!_hooksInstalled) return;
        _hooksInstalled = false;
        window.setTimeout = _origSetTimeout;
        window.setInterval = _origSetInterval;
        window.clearTimeout = _origClearTimeout;
        window.clearInterval = _origClearInterval;
        window.Date = _origDate;
        _intervalIds = {};
        _timeoutIds = {};
    }

    function _applySpeed(speed) {
        var realNow = _origDateNow();
        if (speed === 1) {
            _lastVirtualTime = _hookedDateNow();
            _lastRealTime = realNow;
            _percentage = 1.0;
            _invPercentage = 1.0;
            percentageChangeHandler(1.0);
            return;
        }
        installHooks();
        _lastVirtualTime = _hookedDateNow();
        _lastRealTime = realNow;
        var newPercentage = 1 / speed;
        percentageChangeHandler(newPercentage);
        _percentage = newPercentage;
        _invPercentage = speed;
    }

    window.$hookTimer = {
        setSpeed: function (speed) {
            if (typeof speed !== 'number' || speed <= 0) return;
            _applySpeed(speed);
        },
        getSpeed: function () { return 1 / _percentage; },
        getPercentage: function () { return _percentage; }
    };

    // ================================================================
    // Part 2: CSS 注入 (月满西楼主题，仅触发器+面板)
    // ================================================================

    var _cssText = [
        // --- 月宫触发器基础 ---
        '#moon-trigger{position:fixed;top:20px;left:20px;z-index:2147483647;width:130px;height:150px;cursor:grab;user-select:none;touch-action:none;transition:transform .25s cubic-bezier(.34,1.56,.64,1)}',
        '#moon-trigger.dragging{cursor:grabbing}',
        // --- 水面倒影 ---
        '.water-surface{position:absolute;bottom:25px;left:50%;transform:translateX(-50%);width:110px;height:30px;z-index:2;pointer-events:none}',
        '.water-ripple{position:absolute;bottom:0;left:50%;transform:translateX(-50%);border-radius:50%;border:1px solid rgba(80,70,50,.18);opacity:.5;animation:rippleExpand 4s ease-out infinite}',
        '.water-ripple.r1{width:60px;height:12px;animation-delay:0s}',
        '.water-ripple.r2{width:60px;height:12px;animation-delay:-1.3s}',
        '.water-ripple.r3{width:60px;height:12px;animation-delay:-2.6s}',
        '@keyframes rippleExpand{0%{width:40px;height:8px;opacity:.6}100%{width:100px;height:20px;opacity:0}}',
        '.water-reflection{position:absolute;bottom:5px;left:50%;transform:translateX(-50%) scaleY(-.35);width:70px;height:70px;opacity:.25;filter:blur(3px);mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent 70%);-webkit-mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent 70%)}',
        // --- 月宫 ---
        '.moon-paradise{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:85px;height:85px;z-index:4;animation:moonFloat 5.5s ease-in-out infinite;will-change:transform}',
        '@keyframes moonFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-7px)}}',
        '#moon-trigger:hover .moon-paradise{animation:moonHover 2s ease-in-out infinite;filter:drop-shadow(0 0 25px rgba(240,235,224,.8))}',
        '@keyframes moonHover{0%,100%{transform:translateX(-50%) translateY(-4px) scale(1.05)}50%{transform:translateX(-50%) translateY(-10px) scale(1.08)}}',
        '.moon-glow-outer{position:absolute;inset:-25px;background:radial-gradient(ellipse at center,rgba(240,235,220,.35),transparent 65%);border-radius:50%;animation:moonGlowBreath 4s ease-in-out infinite}',
        '.moon-glow-inner{position:absolute;inset:-10px;background:radial-gradient(ellipse at center,rgba(250,245,232,.45),transparent 60%);border-radius:50%;animation:moonGlowBreath 3s ease-in-out infinite reverse}',
        '@keyframes moonGlowBreath{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.85;transform:scale(1.15)}}',
        '#moon-trigger:hover .moon-glow-outer{background:radial-gradient(ellipse at center,rgba(240,235,220,.5),rgba(160,57,47,.08),transparent 70%);animation-duration:2s}',
        // --- 流星萤火 ---
        '.meteor-container{position:absolute;inset:0;pointer-events:none;z-index:5}',
        '.meteor{position:absolute;width:2px;height:2px;background:#fff;border-radius:50%;box-shadow:0 0 6px #fff,0 0 12px rgba(255,255,255,.6);opacity:0}',
        '.meteor::after{content:"";position:absolute;top:0;right:0;width:30px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8));transform-origin:right center}',
        '.firefly{position:absolute;width:4px;height:4px;background:radial-gradient(circle,#fde68a,rgba(251,191,36,.3));border-radius:50%;box-shadow:0 0 8px #fbbf24,0 0 16px rgba(251,191,36,.4);opacity:0}',
        // --- 云海环绕 ---
        '.cloud-sea{position:absolute;inset:-15px -10px;pointer-events:none;z-index:3}',
        '.cloud-layer{position:absolute;background:radial-gradient(ellipse at center,rgba(250,245,232,.8),rgba(238,229,207,.4) 50%,transparent 70%);border-radius:50%;filter:blur(3px);animation:cloudLayerFloat 7s ease-in-out infinite;will-change:transform,opacity}',
        '.cloud-layer.cl1{width:55px;height:22px;top:35%;left:-8px;animation:cloudDrift1 8s ease-in-out infinite}',
        '.cloud-layer.cl2{width:60px;height:24px;bottom:28%;right:-6px;animation:cloudDrift2 9s ease-in-out infinite}',
        '.cloud-layer.cl3{width:42px;height:16px;top:20%;right:3px;animation:cloudDrift1 6.5s ease-in-out infinite reverse;opacity:.75}',
        '.cloud-layer.cl4{width:48px;height:18px;bottom:38%;left:-3px;animation:cloudDrift2 8.5s ease-in-out infinite reverse;opacity:.65}',
        '.cloud-layer.cl5{width:38px;height:14px;top:55%;right:8px;animation:cloudDrift1 7.5s ease-in-out infinite;opacity:.55}',
        '@keyframes cloudDrift1{0%,100%{transform:translateX(0) translateY(0);opacity:.65}50%{transform:translateX(10px) translateY(-4px);opacity:.9}}',
        '@keyframes cloudDrift2{0%,100%{transform:translateX(0) translateY(0);opacity:.55}50%{transform:translateX(-8px) translateY(5px);opacity:.85}}',
        // --- 月相环 ---
        '.phase-orbit{position:absolute;inset:0;pointer-events:none;z-index:1}',
        '.phase-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;will-change:transform}',
        '.phase-ring.pr-outer{width:115px;height:115px;border:1px dashed rgba(80,70,50,.12);animation:phaseOrbit 30s linear infinite}',
        '.phase-ring.pr-inner{width:90px;height:90px;border:1px solid rgba(80,70,50,.08);animation:phaseOrbit 20s linear infinite reverse}',
        '@keyframes phaseOrbit{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}',
        '.orbit-star{position:absolute;width:3px;height:3px;background:#fff;border-radius:50%;box-shadow:0 0 5px #fff,0 0 10px rgba(255,255,255,.5);animation:starTwinkle 2.5s ease-in-out infinite;will-change:opacity}',
        '.orbit-star.os1{top:4px;left:50%;transform:translateX(-50%)}',
        '.orbit-star.os2{top:50%;right:0;transform:translateY(-50%);animation-delay:-.7s}',
        '.orbit-star.os3{bottom:10px;left:50%;transform:translateX(-50%);animation-delay:-1.4s}',
        '.orbit-star.os4{top:50%;left:0;transform:translateY(-50%);animation-delay:-2.1s}',
        '@keyframes starTwinkle{0%,100%{opacity:.4;transform:scale(.7)}50%{opacity:1;transform:scale(1.3)}}',
        '.phase-ring.pr-outer .orbit-star.os1{top:0;left:50%;transform:translateX(-50%) translateY(-50%)}',
        '.phase-ring.pr-outer .orbit-star.os2{top:50%;right:0;transform:translateX(50%) translateY(-50%)}',
        '.phase-ring.pr-outer .orbit-star.os3{bottom:0;left:50%;transform:translateX(-50%) translateY(50%)}',
        // --- 速度印章 ---
        '.moon-seal-token{position:absolute;bottom:8px;right:5px;min-width:44px;height:32px;padding:0 8px;background:#a0392f;color:#f8f2e6;font-size:12px;font-weight:700;border-radius:4px;display:flex;align-items:center;justify-content:center;font-family:"Noto Serif SC","SimSun",serif;box-shadow:0 4px 14px rgba(160,57,47,.3),inset 0 1px 0 rgba(255,255,255,.2);z-index:10;letter-spacing:1px;transform:rotate(-5deg);animation:sealFloat 4s ease-in-out infinite;border:1px solid rgba(255,255,255,.15);will-change:transform}',
        '.moon-seal-token::before{content:"";position:absolute;inset:3px;border:1px solid rgba(248,242,230,.3);border-radius:2px}',
        '.moon-seal-token::after{content:"";position:absolute;top:3px;left:6px;right:6px;height:4px;background:linear-gradient(90deg,rgba(255,255,255,.3),transparent);border-radius:2px}',
        '@keyframes sealFloat{0%,100%{transform:rotate(-5deg) translateY(0)}50%{transform:rotate(-3deg) translateY(-4px)}}',
        // --- 水墨涟漪 ---
        '.ink-splash-container{position:absolute;inset:0;pointer-events:none;z-index:12}',
        '.ink-splash-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:2px solid #5a5a5a;opacity:0}',
        '.ink-splash-ring.vermilion{border-color:#a0392f}',
        '.ink-splash-ring.gold{border-color:#b8860b}',

        // ====================================================================
        // --- 面板卷轴 ---
        // ====================================================================
        '#moon-panel{position:fixed;top:170px;left:20px;z-index:2147483646;width:390px;visibility:hidden;pointer-events:none;perspective:1500px}',
        '#moon-panel.open{visibility:visible;pointer-events:auto}',
        // --- 上卷轴滚筒 ---
        '.scroll-top{position:relative;height:22px;z-index:3;transform-origin:top center;opacity:0}',
        '#moon-panel.open .scroll-top{animation:rollerTopDrop .6s cubic-bezier(.34,1.56,.64,1) forwards;animation-delay:0s}',
        '@keyframes rollerTopDrop{0%{opacity:0;transform:rotateX(-85deg) translateY(-25px)}100%{opacity:1;transform:rotateX(0) translateY(0)}}',
        '.scroll-roller-bar{position:absolute;left:-10px;right:-10px;top:0;height:22px;background:linear-gradient(180deg,#7a5c10 0%,#b88638 18%,#e0c050 42%,#d4af37 62%,#b88638 82%,#7a5c10 100%);border-radius:5px;box-shadow:0 3px 12px rgba(0,0,0,.25)}',
        '.scroll-roller-bar::before{content:"";position:absolute;top:4px;left:8px;right:8px;height:4px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);border-radius:2px}',
        '.scroll-roller-cap{position:absolute;top:-3px;width:12px;height:28px;background:linear-gradient(90deg,#5c4008,#907018,#5c4008);border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.35)}',
        '.scroll-roller-cap.left{left:-14px}',
        '.scroll-roller-cap.right{right:-14px}',
        // --- 卷轴流苏 ---
        '.scroll-cord{position:absolute;top:22px;left:50%;transform:translateX(-50%);width:2px;height:12px;background:linear-gradient(180deg,#b88638,#7a5c10);z-index:2;opacity:0}',
        '#moon-panel.open .scroll-cord{animation:cordDrop .4s ease-out forwards;animation-delay:.25s}',
        '@keyframes cordDrop{0%{height:0;opacity:0}100%{height:12px;opacity:.7}}',
        '.scroll-cord::after{content:"";position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:6px;height:8px;background:radial-gradient(ellipse at top,#a0392f,#c45648);border-radius:0 0 50% 50%;box-shadow:0 2px 6px rgba(160,57,47,.4)}',
        // --- 面板主体卷轴展开 ---
        '.panel-scroll-wrap{position:relative;overflow:hidden;max-height:0;opacity:0}',
        '#moon-panel.open .panel-scroll-wrap{animation:scrollUnfurl .7s cubic-bezier(.4,0,.2,1) forwards;animation-delay:.18s}',
        '@keyframes scrollUnfurl{0%{max-height:0;opacity:0}100%{max-height:650px;opacity:1}}',
        '.panel-body{background:linear-gradient(180deg,rgba(252,248,238,.98),rgba(242,235,218,.99));border-left:1px solid rgba(80,70,50,.16);border-right:1px solid rgba(80,70,50,.16);padding:0 28px 26px;position:relative;box-shadow:0 25px 60px rgba(80,70,50,.16),inset 0 1px 0 rgba(255,255,255,.7);backdrop-filter:blur(10px);overflow:hidden}',
        '.panel-body::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(160,57,47,.035),transparent 50%),radial-gradient(ellipse at 0% 100%,rgba(58,90,124,.035),transparent 50%);pointer-events:none}',
        '.panel-body::after{content:"";position:absolute;left:0;right:0;top:0;height:100%;background:repeating-linear-gradient(180deg,transparent 0px,transparent 28px,rgba(80,70,50,.025) 28px,rgba(80,70,50,.025) 29px);pointer-events:none;opacity:.6}',
        // --- 下卷轴滚筒 ---
        '.scroll-bottom{position:relative;height:18px;z-index:3;opacity:0}',
        '#moon-panel.open .scroll-bottom{animation:rollerBottom .6s cubic-bezier(.34,1.56,.64,1) forwards;animation-delay:.6s}',
        '@keyframes rollerBottom{0%{opacity:0;transform:translateY(-12px) scaleY(.4)}100%{opacity:1;transform:translateY(0) scaleY(1)}}',
        '.scroll-bottom .scroll-roller-bar{top:0;height:18px;background:linear-gradient(180deg,#7a5c10 0%,#b88638 22%,#d4af37 50%,#b88638 78%,#7a5c10 100%)}',
        '.scroll-bottom .scroll-roller-cap{top:-2px;height:22px}',
        // --- 月光瀑布 ---
        '.moonlight-fall{position:absolute;top:-20px;left:50%;transform:translateX(-50%);width:180px;height:60px;background:linear-gradient(180deg,rgba(240,235,220,.35),rgba(240,235,220,.1) 50%,transparent 100%);filter:blur(8px);pointer-events:none;opacity:0;z-index:1}',
        '#moon-panel.open .moonlight-fall{animation:moonlightAppear 1s ease-out forwards;animation-delay:.3s}',
        '@keyframes moonlightAppear{0%{opacity:0;transform:translateX(-50%) scaleY(.3)}100%{opacity:.8;transform:translateX(-50%) scaleY(1)}}',
        // --- 水墨角落装饰 ---
        '.panel-corner-ink{position:absolute;width:34px;height:34px;opacity:.28;z-index:2}',
        '.panel-corner-ink.tl{top:22px;left:18px}',
        '.panel-corner-ink.tr{top:22px;right:18px;transform:scaleX(-1)}',
        '.panel-corner-ink.bl{bottom:18px;left:18px;transform:scaleY(-1)}',
        '.panel-corner-ink.br{bottom:18px;right:18px;transform:scale(-1)}',
        // --- 面板月宫花园 ---
        '.panel-moon-garden{display:flex;justify-content:center;align-items:center;padding:20px 0 10px;position:relative;height:130px;overflow:hidden}',
        '.moon-halo-stack{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}',
        '.halo-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:1px solid rgba(80,70,50,.1)}',
        '.halo-ring.hr1{width:120px;height:120px;animation:haloPulse 5s ease-in-out infinite}',
        '.halo-ring.hr2{width:96px;height:96px;animation:haloPulse 5s ease-in-out infinite .8s}',
        '.halo-ring.hr3{width:72px;height:72px;animation:haloPulse 5s ease-in-out infinite 1.6s}',
        '.halo-ring.hr4{width:50px;height:50px;animation:haloPulse 5s ease-in-out infinite 2.4s}',
        '@keyframes haloPulse{0%,100%{opacity:.2;transform:translate(-50%,-50%) scale(1)}50%{opacity:.45;transform:translate(-50%,-50%) scale(1.1)}}',
        '.panel-cloud-sea{position:absolute;inset:0;pointer-events:none}',
        '.panel-cloud{position:absolute;background:radial-gradient(ellipse at center,rgba(180,170,140,.28),transparent 65%);border-radius:50%;filter:blur(2px);animation:panelCloudDrift 9s ease-in-out infinite}',
        '.panel-cloud.pc1{width:70px;height:24px;top:35%;left:8px;animation:panelCloud1 8s ease-in-out infinite}',
        '.panel-cloud.pc2{width:60px;height:20px;bottom:30%;right:8px;animation:panelCloud2 10s ease-in-out infinite}',
        '.panel-cloud.pc3{width:50px;height:16px;top:55%;right:15px;animation:panelCloud1 7s ease-in-out infinite reverse;opacity:.7}',
        '@keyframes panelCloud1{0%,100%{transform:translateX(0);opacity:.45}50%{transform:translateX(18px);opacity:.75}}',
        '@keyframes panelCloud2{0%,100%{transform:translateX(0);opacity:.4}50%{transform:translateX(-15px);opacity:.7}}',
        '.panel-moon-palace{width:75px;height:75px;position:relative;z-index:2;filter:drop-shadow(0 6px 20px rgba(100,90,70,.18));animation:panelMoonFloat 5.5s ease-in-out infinite;will-change:transform}',
        '@keyframes panelMoonFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
        '.panel-moon-palace svg{width:100%;height:100%}',
        // --- 面板标题 ---
        '.panel-title{text-align:center;font-size:24px;font-weight:700;color:#1a1a1a;letter-spacing:10px;margin-bottom:2px;position:relative;font-family:"Noto Serif SC","SimSun","Songti SC",serif}',
        '.panel-title::before{content:"—";position:absolute;top:50%;transform:translateY(-50%);color:#a0392f;font-size:14px;opacity:.45;letter-spacing:0;left:50px}',
        '.panel-title-deco{display:block;width:44px;height:2px;margin:8px auto 0;background:linear-gradient(90deg,transparent,#a0392f,#b8860b,#a0392f,transparent);opacity:.4}',
        '.panel-subtitle{text-align:center;font-size:11px;color:rgba(80,70,50,.42);letter-spacing:6px;margin-bottom:20px;font-style:italic}',
        // --- 速度显示 ---
        '.speed-display{text-align:center;margin-bottom:16px;padding:12px 20px;border:1px solid rgba(80,70,50,.1);border-radius:6px;background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,.15)),radial-gradient(ellipse at 50% 0%,rgba(160,57,47,.04),transparent 65%);position:relative;overflow:hidden}',
        '.speed-display::before{content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);animation:shineSweep 6s ease-in-out infinite}',
        '@keyframes shineSweep{0%{left:-100%}50%,100%{left:150%}}',
        '.speed-moon-core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140px;height:50px;background:radial-gradient(ellipse at center,rgba(240,235,220,.5),transparent 70%);border-radius:50%;pointer-events:none;animation:coreGlow 3s ease-in-out infinite}',
        '@keyframes coreGlow{0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)}50%{opacity:.75;transform:translate(-50%,-50%) scale(1.15)}}',
        '.speed-num{font-size:52px;font-weight:700;color:#a0392f;font-family:"Courier New",monospace;line-height:1;letter-spacing:-1px;text-shadow:0 0 18px rgba(160,57,47,.18);display:inline-block;transition:all .4s cubic-bezier(.34,1.56,.64,1);position:relative;z-index:1}',
        '.speed-num.bump{transform:scale(1.18);filter:brightness(1.2)}',
        '.speed-unit{font-size:14px;color:rgba(80,70,50,.48);margin-left:6px;font-weight:400;position:relative;z-index:1}',
        // --- 诗句动画 ---
        '.speed-poem{font-size:14px;color:#3a5a7c;margin-top:10px;letter-spacing:6px;font-weight:500;font-style:italic;position:relative;display:inline-block;z-index:1;text-shadow:0 1px 2px rgba(255,255,255,.5)}',
        '.speed-poem .char{display:inline-block;opacity:0;transform:translateY(10px);transition:all .35s ease}',
        '.speed-poem .char.show{opacity:1;transform:translateY(0)}',
        '.speed-poem::before,.speed-poem::after{content:"\u274b";position:absolute;top:50%;transform:translateY(-50%);color:#b8860b;font-size:10px;opacity:.5}',
        '.speed-poem::before{left:-26px}',
        '.speed-poem::after{right:-26px}',
        // --- 月相选择器 ---
        '.phase-selector{display:flex;justify-content:space-around;align-items:center;margin-bottom:16px;padding:10px 8px;background:radial-gradient(ellipse at 50% 0%,rgba(80,70,50,.04),transparent 60%),rgba(80,70,50,.02);border-radius:8px;border:1px solid rgba(80,70,50,.08);position:relative}',
        '.phase-selector::before{content:"";position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,rgba(80,70,50,.18),transparent)}',
        '.phase-track{position:absolute;top:50%;left:15px;right:15px;height:1px;background:linear-gradient(90deg,rgba(80,70,50,.08),rgba(160,57,47,.22),rgba(80,70,50,.08));transform:translateY(-50%);opacity:.4}',
        '.phase-btn{width:40px;height:40px;border:none;background:transparent;cursor:pointer;position:relative;z-index:1;padding:0;border-radius:50%;transition:all .35s cubic-bezier(.34,1.56,.64,1);display:flex;align-items:center;justify-content:center;flex-direction:column}',
        '.phase-btn:hover{transform:scale(1.15) translateY(-2px)}',
        '.phase-btn svg{width:34px;height:34px;transition:all .35s ease}',
        '.phase-btn.active{transform:scale(1.2) translateY(-3px)}',
        '.phase-btn.active svg{filter:drop-shadow(0 0 10px rgba(160,57,47,.35))}',
        '.phase-label{font-size:9px;color:rgba(80,70,50,.45);white-space:nowrap;margin-top:2px;font-family:"Noto Serif SC",serif;transition:all .3s ease}',
        '.phase-btn:hover .phase-label,.phase-btn.active .phase-label{color:#a0392f;font-weight:600}',
        // --- 速度网格 ---
        '.speed-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px}',
        '.speed-btn{height:42px;border:1px solid rgba(80,70,50,.1);background:rgba(255,255,255,.35);color:#5a5a5a;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;border-radius:5px;display:flex;align-items:center;justify-content:center;transition:all .3s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden}',
        '.speed-btn::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.4),transparent);opacity:0;transition:opacity .25s}',
        '.speed-btn:hover{background:rgba(160,57,47,.08);border-color:rgba(160,57,47,.25);color:#a0392f;transform:translateY(-4px);box-shadow:0 6px 18px rgba(160,57,47,.12)}',
        '.speed-btn:hover::before{opacity:1}',
        '.speed-btn.active{background:linear-gradient(180deg,rgba(160,57,47,.1),rgba(160,57,47,.04));border-color:#a0392f;color:#a0392f;box-shadow:0 0 15px rgba(160,57,47,.15),inset 0 1px 0 rgba(255,255,255,.4);transform:translateY(-3px)}',
        '.speed-btn.active::after{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:45%;height:2px;background:linear-gradient(90deg,transparent,#a0392f,transparent);border-radius:2px;box-shadow:0 0 6px rgba(160,57,47,.3)}',
        // --- 控制按钮 ---
        '.panel-controls{display:flex;gap:8px;align-items:center;justify-content:space-between}',
        '.ctrl-btn{flex:1;padding:10px 0;border:1px solid rgba(80,70,50,.1);background:rgba(255,255,255,.3);color:#5a5a5a;font-family:inherit;font-size:13px;cursor:pointer;border-radius:5px;transition:all .3s cubic-bezier(.34,1.56,.64,1);letter-spacing:3px;font-weight:500;position:relative;overflow:hidden}',
        '.ctrl-btn::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.35),transparent);opacity:0;transition:opacity .25s}',
        '.ctrl-btn:hover{transform:translateY(-4px);box-shadow:0 6px 20px rgba(80,70,50,.12)}',
        '.ctrl-btn:hover::before{opacity:1}',
        '.ctrl-btn:hover:first-child{background:rgba(58,90,124,.08);border-color:rgba(58,90,124,.28);color:#3a5a7c}',
        '.ctrl-btn.active-persist{background:rgba(160,57,47,.08);border-color:#a0392f;color:#a0392f}',
        '.ctrl-btn:last-child:hover{background:rgba(160,57,47,.08);border-color:rgba(160,57,47,.28);color:#a0392f}',
        // --- 关闭按钮 ---
        '.panel-close{position:absolute;top:22px;right:20px;width:28px;height:28px;border:1px solid rgba(80,70,50,.15);background:rgba(255,255,255,.3);color:rgba(80,70,50,.38);font-size:16px;cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all .35s cubic-bezier(.34,1.56,.64,1);z-index:10}',
        '.panel-close:hover{background:rgba(160,57,47,.08);border-color:#a0392f;color:#a0392f;transform:rotate(90deg) scale(1.15);box-shadow:0 0 12px rgba(160,57,47,.2)}',
        // --- 快捷键提示 ---
        '.kb-hint{text-align:center;margin-top:14px;font-size:10px;color:rgba(80,70,50,.32);letter-spacing:3px}',

        // ====================================================================
        // PC 性能优化：面板关闭时暂停非必要动画
        // ====================================================================
        '#moon-panel:not(.open) .halo-ring,#moon-panel:not(.open) .panel-cloud,#moon-panel:not(.open) .panel-moon-palace,#moon-panel:not(.open) .moonlight-fall,#moon-panel:not(.open) .speed-moon-core,#moon-panel:not(.open) .speed-display::before{animation-play-state:paused !important}',

        // ====================================================================
        // PC 性能优化：减少触发器装饰元素数量（min-width:768px = 所有桌面端）
        // ====================================================================
        '@media (min-width:768px){.cloud-layer.cl3,.cloud-layer.cl4,.cloud-layer.cl5{display:none}.orbit-star.os3,.orbit-star.os4{display:none}.water-ripple.r3{display:none}}',

        // ====================================================================
        // 无障碍：减少动画（PC + 移动端共用）
        // ====================================================================
        '@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important}.moon-paradise,.moon-glow-outer,.moon-glow-inner,.cloud-layer,.phase-ring,.orbit-star,.moon-seal-token,.halo-ring,.panel-cloud,.panel-moon-palace,.speed-display::before,.speed-moon-core{animation:none !important}}',

        // ====================================================================
        // 移动端适配：max-width:480px（所有手机）
        // ====================================================================
        '@media (max-width:480px){' +
            // 触发器缩小
            '#moon-trigger{width:90px;height:105px;top:12px;left:10px}' +
            '.moon-paradise{width:58px;height:58px;top:6px}' +
            '.moon-glow-outer{inset:-18px}' +
            '.moon-glow-inner{inset:-8px}' +
            '.water-surface{width:75px;bottom:18px}' +
            '.water-ripple.r1,.water-ripple.r2,.water-ripple.r3{width:45px;height:9px}' +
            '.water-reflection{width:48px;height:48px}' +
            '.moon-seal-token{min-width:34px;height:24px;padding:0 6px;font-size:10px;bottom:4px;right:2px;letter-spacing:.5px}' +
            '.cloud-layer.cl1{width:38px;height:15px}' +
            '.cloud-layer.cl2{width:42px;height:16px}' +
            '.phase-ring.pr-outer{width:80px;height:80px}' +
            '.phase-ring.pr-inner{width:62px;height:62px}' +
            '.orbit-star{width:2px;height:2px}' +

            // 面板缩小
            '#moon-panel{top:115px;left:10px;width:calc(100vw - 20px);max-width:390px}' +
            '.scroll-top{height:16px}' +
            '.scroll-roller-bar{height:16px;left:-8px;right:-8px}' +
            '.scroll-roller-cap{width:9px;height:20px;left:-11px;right:-11px}' +
            '.scroll-cord{top:16px}' +
            '.scroll-bottom{height:14px}' +
            '.scroll-bottom .scroll-roller-bar{height:14px}' +
            '.scroll-bottom .scroll-roller-cap{height:17px}' +
            '.panel-body{padding:0 14px 14px}' +
            '.moonlight-fall{width:120px;height:35px}' +
            '.panel-corner-ink{width:22px;height:22px}' +
            '.panel-corner-ink.tl,.panel-corner-ink.tr{top:14px}' +
            '.panel-corner-ink.tl,.panel-corner-ink.bl{left:12px}' +
            '.panel-corner-ink.tr,.panel-corner-ink.br{right:12px}' +
            '.panel-corner-ink.bl,.panel-corner-ink.br{bottom:12px}' +
            '.panel-moon-garden{height:100px;padding:12px 0 6px}' +
            '.halo-ring.hr1{width:90px;height:90px}' +
            '.halo-ring.hr2{width:72px;height:72px}' +
            '.halo-ring.hr3{width:54px;height:54px}' +
            '.halo-ring.hr4{width:38px;height:38px}' +
            '.panel-moon-palace{width:58px;height:58px}' +
            '.panel-title{font-size:16px;letter-spacing:5px}' +
            '.panel-title::before{left:26px}' +
            '.panel-title-deco{width:30px}' +
            '.panel-subtitle{font-size:10px;letter-spacing:2px;margin-bottom:10px}' +
            '.speed-display{padding:8px 12px;margin-bottom:10px}' +
            '.speed-num{font-size:30px}' +
            '.speed-unit{font-size:10px}' +
            '.speed-poem{font-size:10px;letter-spacing:2px}' +
            '.phase-selector{padding:6px 4px;margin-bottom:10px}' +
            '.phase-btn{width:34px;height:34px}' +
            '.phase-btn svg{width:28px;height:28px}' +
            '.phase-label{font-size:7px;margin-top:1px}' +
            '.speed-grid{gap:5px;margin-bottom:10px}' +
            '.speed-btn{height:32px;font-size:11px}' +
            '.panel-controls{gap:5px}' +
            '.ctrl-btn{padding:8px 0;font-size:11px;letter-spacing:2px}' +
            '.panel-close{top:12px;right:10px;width:20px;height:20px;font-size:12px}' +
            '.kb-hint{display:none}' +
        '}',

        // ====================================================================
        // 移动端适配：max-width:374px（小屏手机：360px安卓、iPhone SE 1代）
        // ====================================================================
        '@media (max-width:374px){' +
            '#moon-trigger{width:75px;height:88px;top:10px;left:8px}' +
            '.moon-paradise{width:48px;height:48px}' +
            '.moon-glow-outer{inset:-14px}' +
            '.moon-glow-inner{inset:-6px}' +
            '.water-surface{width:60px;bottom:14px}' +
            '.water-ripple.r1,.water-ripple.r2,.water-ripple.r3{width:36px;height:7px}' +
            '.water-reflection{width:40px;height:40px}' +
            '.moon-seal-token{min-width:28px;height:20px;padding:0 5px;font-size:9px;bottom:3px;right:1px}' +
            '.cloud-layer.cl1{width:30px;height:12px}' +
            '.cloud-layer.cl2{width:34px;height:13px}' +
            '.phase-ring.pr-outer{width:65px;height:65px}' +
            '.phase-ring.pr-inner{width:50px;height:50px}' +

            '#moon-panel{top:100px;left:8px;width:calc(100vw - 16px)}' +
            '.scroll-top{height:14px}' +
            '.scroll-roller-bar{height:14px}' +
            '.scroll-roller-cap{width:8px;height:17px}' +
            '.scroll-cord{top:14px}' +
            '.scroll-bottom{height:12px}' +
            '.scroll-bottom .scroll-roller-bar{height:12px}' +
            '.scroll-bottom .scroll-roller-cap{height:15px}' +
            '.panel-body{padding:0 12px 12px}' +
            '.moonlight-fall{width:90px;height:28px}' +
            '.panel-corner-ink{width:18px;height:18px}' +
            '.panel-corner-ink.tl,.panel-corner-ink.tr{top:12px}' +
            '.panel-corner-ink.tl,.panel-corner-ink.bl{left:10px}' +
            '.panel-corner-ink.tr,.panel-corner-ink.br{right:10px}' +
            '.panel-corner-ink.bl,.panel-corner-ink.br{bottom:10px}' +
            '.panel-moon-garden{height:80px;padding:8px 0 4px}' +
            '.halo-ring.hr1{width:70px;height:70px}' +
            '.halo-ring.hr2{width:56px;height:56px}' +
            '.halo-ring.hr3{width:42px;height:42px}' +
            '.halo-ring.hr4{width:30px;height:30px}' +
            '.panel-moon-palace{width:46px;height:46px}' +
            '.panel-title{font-size:14px;letter-spacing:3px}' +
            '.panel-title::before{left:22px}' +
            '.panel-title-deco{width:24px}' +
            '.panel-subtitle{font-size:9px;letter-spacing:2px;margin-bottom:8px}' +
            '.speed-display{padding:6px 10px;margin-bottom:8px}' +
            '.speed-num{font-size:26px}' +
            '.speed-unit{font-size:9px}' +
            '.speed-poem{font-size:9px;letter-spacing:2px}' +
            '.phase-selector{padding:5px 3px;margin-bottom:8px}' +
            '.phase-btn{width:26px;height:26px}' +
            '.phase-btn svg{width:22px;height:22px}' +
            '.phase-label{font-size:6px;margin-top:1px}' +
            '.speed-grid{gap:4px;margin-bottom:8px}' +
            '.speed-btn{height:28px;font-size:10px}' +
            '.panel-controls{gap:4px}' +
            '.ctrl-btn{padding:6px 0;font-size:10px;letter-spacing:2px}' +
            '.panel-close{top:10px;right:8px;width:18px;height:18px;font-size:11px}' +
        '}'
    ];

    var _styleNode = document.createElement('style');
    _styleNode.textContent = _cssText.join('');

    // ================================================================
    // Part 3: 常量与配置
    // ================================================================

    var _SPEEDS = [0.5, 1, 2, 5, 10, 50, 100, 200];
    var _PHASE_NAMES = ['朔月', '蛾眉', '上弦', '盈凸', '满月', '亏凸', '下弦', '残月'];
    var _POEM_LINES = [
        '月隐星稀',
        '新月如眉',
        '月上柳梢',
        '月华渐满',
        '月正当中',
        '月过中天',
        '月挂西窗',
        '月影依稀'
    ];
    var _STORAGE_KEY = 'accel_moon_poetry_speed';
    var _PERSIST_KEY = 'accel_moon_poetry_persist';

    // ================================================================
    // Part 4: SVG 生成函数
    // ================================================================

    function _getPhaseInnerSVG(index, size) {
        var half = size / 2;
        var r = size * 0.42;
        var shadeAmounts = [0.95, 0.65, 0.4, 0.18, 0, 0.22, 0.45, 0.75];
        var shade = shadeAmounts[index];
        var shadeRx = r * shade;

        var svg = '';
        svg += '<defs>';
        svg += '<radialGradient id="ipmg" cx="35%" cy="35%" r="65%">';
        svg += '<stop offset="0%" stop-color="#fffdf5"/>';
        svg += '<stop offset="40%" stop-color="#f5efe0"/>';
        svg += '<stop offset="70%" stop-color="#e8e0cc"/>';
        svg += '<stop offset="100%" stop-color="#b8b0a0"/>';
        svg += '</radialGradient>';
        svg += '</defs>';

        if (index === 0) {
            svg += '<circle cx="' + half + '" cy="' + half + '" r="' + r + '" fill="#d8cfb8" opacity=".35"/>';
            svg += '<circle cx="' + half + '" cy="' + half + '" r="' + r + '" fill="none" stroke="rgba(80,70,50,0.2)" stroke-width="1" opacity=".35"/>';
        } else {
            svg += '<circle cx="' + half + '" cy="' + half + '" r="' + r + '" fill="url(#ipmg)"/>';

            if (index < 4) {
                var sx = half + (r - shadeRx) + 1;
                svg += '<ellipse cx="' + sx + '" cy="' + half + '" rx="' + (shadeRx + 2) + '" ry="' + r + '" fill="#d8cfb8" opacity=".7"/>';
            } else if (index > 4) {
                var sx2 = half - (r - shadeRx) - 1;
                svg += '<ellipse cx="' + sx2 + '" cy="' + half + '" rx="' + (shadeRx + 2) + '" ry="' + r + '" fill="#d8cfb8" opacity=".7"/>';
            }

            if (index === 2 || index === 6) {
                var side = index < 4 ? '1' : '0';
                svg += '<path d="M' + half + ',' + (half - r) + ' A' + r + ',' + r + ' 0 0,' + side + ' ' + half + ',' + (half + r) + ' L' + half + ',' + (half - r) + '" fill="url(#ipmg)"/>';
            }

            svg += '<g opacity=".085" fill="#7a7060">';
            svg += '<ellipse cx="' + (half * 0.76) + '" cy="' + (half * 0.76) + '" rx="' + (r * 0.14) + '" ry="' + (r * 0.1) + '"/>';
            svg += '<ellipse cx="' + (half * 1.2) + '" cy="' + (half * 1.05) + '" rx="' + (r * 0.16) + '" ry="' + (r * 0.12) + '"/>';
            svg += '</g>';

            if (index === 4) {
                var palX = half * 0.56;
                var palY = half * 1.12;
                var palScale = size / 100;
                svg += '<g opacity=".1" fill="#3a3a3a" transform="translate(' + palX + ', ' + palY + ') scale(' + palScale + ')">';
                svg += '<rect x="6" y="12" width="24" height="16" rx="1"/>';
                svg += '<rect x="3" y="7" width="7" height="9" rx="1"/>';
                svg += '<rect x="26" y="7" width="7" height="9" rx="1"/>';
                svg += '<rect x="15" y="0" width="5" height="12" rx="1"/>';
                svg += '</g>';
            }
        }

        return svg;
    }

    function _getPhaseSVGForBtn(index) {
        var phases = [
            { cx: 70, rx: 30, fill: '#d8cfb8' },
            { cx: 58, rx: 22, fill: '#e8e0cc' },
            { cx: 50, rx: 0, fill: '#ebe3d0' },
            { cx: 42, rx: 18, fill: '#f0e8d8' },
            { cx: 36, rx: 28, fill: '#f5efe0' },
            { cx: 30, rx: 20, fill: '#eee6d4' },
            { cx: 50, rx: 0, fill: '#ebe3d0' },
            { cx: 62, rx: 24, fill: '#e5ddd0' }
        ];
        var p = phases[index];
        var isFull = index === 4;
        var isNew = index === 0;

        var svg = '<svg viewBox="0 0 100 100">';
        svg += '<defs>';
        svg += '<radialGradient id="pmg' + index + '" cx="35%" cy="35%" r="65%">';
        svg += '<stop offset="0%" stop-color="#fffdf5"/>';
        svg += '<stop offset="40%" stop-color="#f5efe0"/>';
        svg += '<stop offset="70%" stop-color="#e8e0cc"/>';
        svg += '<stop offset="100%" stop-color="#b8b0a0"/>';
        svg += '</radialGradient>';
        svg += '</defs>';

        if (isNew) {
            svg += '<circle cx="50" cy="50" r="42" fill="#d8cfb8" opacity=".35"/>';
            svg += '<circle cx="50" cy="50" r="42" fill="none" stroke="rgba(80,70,50,0.2)" stroke-width="1" opacity=".35"/>';
        } else {
            var shadeX = p.cx;
            var shadeRx = p.rx;

            svg += '<circle cx="50" cy="50" r="42" fill="url(#pmg' + index + ')"/>';

            if (index < 4) {
                svg += '<ellipse cx="' + (50 + (42 - shadeRx)) + '" cy="50" rx="' + (shadeRx + 2) + '" ry="42" fill="#d8cfb8" opacity=".7"/>';
            } else if (index > 4) {
                svg += '<ellipse cx="' + (50 - (42 - shadeRx)) + '" cy="50" rx="' + (shadeRx + 2) + '" ry="42" fill="#d8cfb8" opacity=".7"/>';
            }

            if (index === 2 || index === 6) {
                var side = index < 4 ? '0' : '1';
                svg += '<path d="M50,8 A42,42 0 0,' + side + ' 50,92 L50,8" fill="url(#pmg' + index + ')"/>';
            }

            svg += '<g opacity=".08" fill="#7a7060">';
            svg += '<ellipse cx="38" cy="38" rx="5" ry="4"/>';
            svg += '<ellipse cx="58" cy="50" rx="5" ry="4"/>';
            svg += '</g>';

            if (isFull) {
                svg += '<g opacity=".1" fill="#3a3a3a" transform="translate(27, 54)">';
                svg += '<rect x="6" y="12" width="24" height="16" rx="1"/>';
                svg += '<rect x="3" y="7" width="7" height="9" rx="1"/>';
                svg += '<rect x="26" y="7" width="7" height="9" rx="1"/>';
                svg += '<path d="M0,12 L3.5,7 L7,12 Z" fill="#2a2a2a"/>';
                svg += '<path d="M29,12 L32.5,7 L36,12 Z" fill="#2a2a2a"/>';
                svg += '<rect x="15" y="0" width="5" height="12" rx="1"/>';
                svg += '<path d="M12.5,5 L17.5,0 L22.5,5 Z" fill="#2a2a2a"/>';
                svg += '</g>';
            }
        }

        svg += '</svg>';
        return svg;
    }

    // ================================================================
    // Part 5: DOM 创建与 UI 逻辑
    // ================================================================

    var _panelOpen = false;
    var _currentSpeed = 1;
    var _currentPhase = 4;
    var _persisted = false;

    // DOM 引用（在 _mountUI 中赋值）
    var _trigger, _panel, _speedSeal, _speedNum, _speedPoem;
    var _speedGrid, _phaseSelector, _btnPersist, _btnReset, _panelClose;
    var _inkSplashContainer, _meteorContainer, _moonReflection;
    var _fireflyInterval = null, _meteorInterval = null;

    function _animatePoem(text) {
        _speedPoem.innerHTML = '';
        var chars = text.split('');
        for (var i = 0; i < chars.length; i++) {
            var span = document.createElement('span');
            span.className = 'char';
            span.textContent = chars[i];
            _speedPoem.appendChild(span);
            (function (s, idx) {
                setTimeout(function () {
                    s.classList.add('show');
                }, idx * 70);
            })(span, i);
        }
    }

    function _playInkSplash() {
        for (var i = 0; i < 4; i++) {
            var ring = document.createElement('div');
            ring.className = 'ink-splash-ring';
            if (i === 1) ring.classList.add('vermilion');
            if (i === 2) ring.classList.add('gold');
            ring.style.animation = 'none';
            ring.style.opacity = '0';
            _inkSplashContainer.appendChild(ring);

            (function (r, idx) {
                requestAnimationFrame(function () {
                    r.style.animation = 'inkWashExpand .8s ease-out forwards';
                    r.style.animationDelay = (idx * 0.1) + 's';
                });
                setTimeout(function () { r.remove(); }, 900);
            })(ring, i);
        }
    }

    function _updateUI() {
        var label = _currentSpeed >= 10 ? Math.round(_currentSpeed) : (Math.round(_currentSpeed * 10) / 10);
        _speedSeal.textContent = label + 'x';
        _speedNum.textContent = label;
        _animatePoem(_POEM_LINES[_currentPhase]);

        // 更新触发器月亮
        var triggerMoon = document.getElementById('mbTriggerMoon');
        if (triggerMoon) triggerMoon.innerHTML = _getPhaseInnerSVG(_currentPhase, 85);

        // 更新面板月亮
        var panelMoon = document.getElementById('mbPanelMoon');
        if (panelMoon) panelMoon.innerHTML = '<svg viewBox="0 0 95 95">' + _getPhaseInnerSVG(_currentPhase, 95) + '</svg>';

        // 更新倒影
        if (_moonReflection) {
            _moonReflection.innerHTML = '<svg viewBox="0 0 85 85" style="width:100%;height:100%">' + _getPhaseInnerSVG(_currentPhase, 85) + '</svg>';
        }

        // 更新月相按钮高亮
        var phaseBtns = _phaseSelector.querySelectorAll('.phase-btn');
        for (var i = 0; i < phaseBtns.length; i++) {
            phaseBtns[i].classList.toggle('active', i === _currentPhase);
        }

        // 更新速度按钮高亮
        var btns = _speedGrid.querySelectorAll('.speed-btn');
        for (var j = 0; j < btns.length; j++) {
            btns[j].classList.toggle('active', Math.abs(parseFloat(btns[j].dataset.speed) - _currentSpeed) < 0.01);
        }

        // 更新持久化按钮
        if (_persisted) {
            _btnPersist.classList.add('active-persist');
            _btnPersist.textContent = '已铭';
        } else {
            _btnPersist.classList.remove('active-persist');
            _btnPersist.textContent = '铭记';
        }
    }

    function _setSpeed(spd, phaseIdx) {
        _currentSpeed = spd;
        if (typeof phaseIdx === 'number') {
            _currentPhase = phaseIdx;
        } else {
            var nearest = 4;
            var minDiff = Infinity;
            for (var i = 0; i < 8; i++) {
                var diff = Math.abs(i - 3.5 - (spd >= 1 ? Math.log2(spd) : -Math.log2(1 / spd)));
                if (diff < minDiff) { minDiff = diff; nearest = i; }
            }
            _currentPhase = nearest;
        }
        window.$hookTimer.setSpeed(spd);
        _updateUI();
        if (_persisted) {
            try { localStorage.setItem(_STORAGE_KEY, spd); } catch (e) { }
        }

        _speedNum.classList.add('bump');
        setTimeout(function () { _speedNum.classList.remove('bump'); }, 400);
    }

    function _togglePanel(open) {
        var newOpen = typeof open === 'boolean' ? open : !_panelOpen;
        if (newOpen === _panelOpen) return;

        if (newOpen) {
            _panelOpen = true;
            _panel.classList.add('open');
            if (_panel._startEffects) _panel._startEffects();
        } else {
            _panel.classList.remove('open');
            if (_panel._stopEffects) _panel._stopEffects();
            setTimeout(function () {
                _panelOpen = false;
            }, 800);
        }
    }

    // ================================================================
    // Part 6: _mountUI - 创建所有 DOM 并绑定事件
    // ================================================================

    function _mountUI() {
        if (window.__moonbeamRendered) return;
        window.__moonbeamRendered = true;

        // 注入 CSS
        document.head.appendChild(_styleNode);

        // 注入水墨涟漪动画
        var inkAnimStyle = document.createElement('style');
        inkAnimStyle.textContent = '@keyframes inkWashExpand{0%{width:20px;height:20px;opacity:.7;border-width:3px}100%{width:200px;height:200px;opacity:0;border-width:1px}}';
        document.head.appendChild(inkAnimStyle);

        var frag = document.createDocumentFragment();

        // === 创建 #moon-trigger ===
        _trigger = document.createElement('div');
        _trigger.id = 'moon-trigger';
        _trigger.title = '点击展开 · 拖拽移动';

        // 月相轨道环
        var phaseOrbit = document.createElement('div');
        phaseOrbit.className = 'phase-orbit';
        var prOuter = document.createElement('div');
        prOuter.className = 'phase-ring pr-outer';
        prOuter.innerHTML = '<div class="orbit-star os1"></div><div class="orbit-star os2"></div><div class="orbit-star os3"></div>';
        var prInner = document.createElement('div');
        prInner.className = 'phase-ring pr-inner';
        prInner.innerHTML = '<div class="orbit-star os4"></div>';
        phaseOrbit.appendChild(prOuter);
        phaseOrbit.appendChild(prInner);
        _trigger.appendChild(phaseOrbit);

        // 云海
        var cloudSea = document.createElement('div');
        cloudSea.className = 'cloud-sea';
        cloudSea.innerHTML = '<div class="cloud-layer cl1"></div><div class="cloud-layer cl2"></div><div class="cloud-layer cl3"></div><div class="cloud-layer cl4"></div><div class="cloud-layer cl5"></div>';
        _trigger.appendChild(cloudSea);

        // 月宫
        var moonParadise = document.createElement('div');
        moonParadise.className = 'moon-paradise';
        moonParadise.innerHTML =
            '<div class="moon-glow-outer"></div>' +
            '<div class="moon-glow-inner"></div>' +
            '<svg viewBox="0 0 85 85" id="mbTriggerMoon" style="width:100%;height:100%;position:relative;z-index:2">' +
            '<defs>' +
            '<radialGradient id="tpMoonGrad" cx="35%" cy="35%" r="65%">' +
            '<stop offset="0%" stop-color="#fffdf5"/>' +
            '<stop offset="40%" stop-color="#f5efe0"/>' +
            '<stop offset="70%" stop-color="#e8e0cc"/>' +
            '<stop offset="100%" stop-color="#b8b0a0"/>' +
            '</radialGradient>' +
            '<filter id="tpMoonGlow" x="-50%" y="-50%" width="200%" height="200%">' +
            '<feGaussianBlur stdDeviation="1.8" result="blur"/>' +
            '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
            '</filter>' +
            '</defs>' +
            '<g filter="url(#tpMoonGlow)">' +
            '<circle cx="42.5" cy="42.5" r="33" fill="url(#tpMoonGrad)"/>' +
            '<g opacity=".1" fill="#7a7060">' +
            '<ellipse cx="32" cy="35" rx="5.5" ry="4.5"/>' +
            '<ellipse cx="52" cy="48" rx="7" ry="5.5"/>' +
            '<ellipse cx="37" cy="58" rx="4.5" ry="3.2"/>' +
            '<circle cx="57" cy="32" r="2.8"/>' +
            '</g>' +
            '<circle cx="42.5" cy="42.5" r="33" fill="none" stroke="rgba(100,90,70,.18)" stroke-width="1" opacity=".4"/>' +
            '<g opacity=".12" fill="#3a3a3a" transform="translate(25, 48)">' +
            '<rect x="5" y="10" width="20" height="14" rx="1"/>' +
            '<rect x="3" y="6" width="6" height="8" rx="1"/>' +
            '<rect x="21" y="6" width="6" height="8" rx="1"/>' +
            '<path d="M0,10 L3,6 L6,10 Z" fill="#2a2a2a"/>' +
            '<path d="M24,10 L27,6 L30,10 Z" fill="#2a2a2a"/>' +
            '<rect x="13" y="0" width="4" height="10" rx="1"/>' +
            '<path d="M11,4 L15,0 L19,4 Z" fill="#2a2a2a"/>' +
            '<rect x="10" y="14" width="2" height="6"/>' +
            '<rect x="18" y="14" width="2" height="6"/>' +
            '</g>' +
            '<g opacity=".13" fill="#4a4030" transform="translate(36, 58) scale(.65)">' +
            '<ellipse cx="6" cy="10" rx="5.5" ry="7"/>' +
            '<ellipse cx="3" cy="2" rx="1.8" ry="5"/>' +
            '<ellipse cx="9" cy="2" rx="1.8" ry="5"/>' +
            '<circle cx="4.5" cy="8" r="1" fill="#2a2010"/>' +
            '</g>' +
            '</g>' +
            '</svg>';
        _trigger.appendChild(moonParadise);

        // 水面倒影
        var waterSurface = document.createElement('div');
        waterSurface.className = 'water-surface';
        waterSurface.innerHTML = '<div class="water-ripple r1"></div><div class="water-ripple r2"></div><div class="water-ripple r3"></div>';
        _moonReflection = document.createElement('div');
        _moonReflection.className = 'water-reflection';
        _moonReflection.id = 'moonReflection';
        waterSurface.appendChild(_moonReflection);
        _trigger.appendChild(waterSurface);

        // 流星萤火容器
        _meteorContainer = document.createElement('div');
        _meteorContainer.className = 'meteor-container';
        _meteorContainer.id = 'meteorContainer';
        _trigger.appendChild(_meteorContainer);

        // 速度印章
        _speedSeal = document.createElement('span');
        _speedSeal.className = 'moon-seal-token';
        _speedSeal.id = 'moonSpeedSeal';
        _speedSeal.textContent = '1x';
        _trigger.appendChild(_speedSeal);

        // 水墨涟漪容器
        _inkSplashContainer = document.createElement('div');
        _inkSplashContainer.className = 'ink-splash-container';
        _inkSplashContainer.id = 'inkSplashContainer';
        _trigger.appendChild(_inkSplashContainer);

        frag.appendChild(_trigger);

        // === 创建 #moon-panel ===
        _panel = document.createElement('div');
        _panel.id = 'moon-panel';

        // 上卷轴滚筒
        var scrollTop = document.createElement('div');
        scrollTop.className = 'scroll-top';
        scrollTop.innerHTML =
            '<div class="scroll-roller-cap left"></div>' +
            '<div class="scroll-roller-bar"></div>' +
            '<div class="scroll-roller-cap right"></div>' +
            '<div class="scroll-cord"></div>';
        _panel.appendChild(scrollTop);

        // 卷轴主体
        var panelScrollWrap = document.createElement('div');
        panelScrollWrap.className = 'panel-scroll-wrap';
        var panelBody = document.createElement('div');
        panelBody.className = 'panel-body';

        // 月光瀑布
        panelBody.innerHTML = '<div class="moonlight-fall"></div>';

        // 水墨角落装饰
        var cornerSvg = function (cls) {
            return '<svg class="panel-corner-ink ' + cls + '" viewBox="0 0 34 34">' +
                '<path d="M2,20 Q2,8 12,2 M2,14 Q2,4 10,2 M2,26 Q2,22 10,20" stroke="#3a3a3a" stroke-width="1.4" fill="none" opacity=".55"/>' +
                '<circle cx="2" cy="2" r="3" fill="#3a3a3a" opacity=".3"/>' +
                '<path d="M0,34 Q8,28 14,34" stroke="#3a3a3a" stroke-width="1" fill="none" opacity=".3"/>' +
                '</svg>';
        };
        panelBody.innerHTML += cornerSvg('tl') + cornerSvg('tr') + cornerSvg('bl') + cornerSvg('br');

        // 关闭按钮
        _panelClose = document.createElement('button');
        _panelClose.className = 'panel-close';
        _panelClose.id = 'panel-close';
        _panelClose.title = '关闭';
        _panelClose.textContent = '\u00d7';
        panelBody.appendChild(_panelClose);

        // 月宫花园
        var moonGarden = document.createElement('div');
        moonGarden.className = 'panel-moon-garden';
        moonGarden.innerHTML =
            '<div class="moon-halo-stack">' +
            '<div class="halo-ring hr1"></div>' +
            '<div class="halo-ring hr2"></div>' +
            '<div class="halo-ring hr3"></div>' +
            '<div class="halo-ring hr4"></div>' +
            '</div>' +
            '<div class="panel-cloud-sea">' +
            '<div class="panel-cloud pc1"></div>' +
            '<div class="panel-cloud pc2"></div>' +
            '<div class="panel-cloud pc3"></div>' +
            '</div>' +
            '<div class="panel-moon-palace" id="mbPanelMoon">' +
            '<svg viewBox="0 0 95 95">' +
            '<defs>' +
            '<radialGradient id="pmMoonGrad" cx="35%" cy="35%" r="65%">' +
            '<stop offset="0%" stop-color="#fffdf5"/>' +
            '<stop offset="40%" stop-color="#f5efe0"/>' +
            '<stop offset="70%" stop-color="#e8e0cc"/>' +
            '<stop offset="100%" stop-color="#b8b0a0"/>' +
            '</radialGradient>' +
            '</defs>' +
            '<circle cx="47.5" cy="47.5" r="40" fill="url(#pmMoonGrad)"/>' +
            '<g opacity=".09" fill="#7a7060">' +
            '<ellipse cx="36" cy="40" rx="6.5" ry="5"/>' +
            '<ellipse cx="58" cy="56" rx="8" ry="6"/>' +
            '<ellipse cx="42" cy="66" rx="5" ry="3.5"/>' +
            '<circle cx="64" cy="36" r="3.2"/>' +
            '</g>' +
            '<g opacity=".1" fill="#3a3a3a" transform="translate(27, 54)">' +
            '<rect x="6" y="12" width="24" height="16" rx="1"/>' +
            '<rect x="3" y="7" width="7" height="9" rx="1"/>' +
            '<rect x="26" y="7" width="7" height="9" rx="1"/>' +
            '<path d="M0,12 L3.5,7 L7,12 Z" fill="#2a2a2a"/>' +
            '<path d="M29,12 L32.5,7 L36,12 Z" fill="#2a2a2a"/>' +
            '<rect x="15" y="0" width="5" height="12" rx="1"/>' +
            '<path d="M12.5,5 L17.5,0 L22.5,5 Z" fill="#2a2a2a"/>' +
            '<rect x="12" y="16" width="2.5" height="8"/>' +
            '<rect x="21.5" y="16" width="2.5" height="8"/>' +
            '</g>' +
            '</svg>' +
            '</div>';
        panelBody.appendChild(moonGarden);

        // 标题
        var titleDiv = document.createElement('div');
        titleDiv.className = 'panel-title';
        titleDiv.textContent = '\u6708\u6ee1\u897f\u697c';
        panelBody.appendChild(titleDiv);

        var titleDeco = document.createElement('div');
        titleDeco.className = 'panel-title-deco';
        panelBody.appendChild(titleDeco);

        var subtitleDiv = document.createElement('div');
        subtitleDiv.className = 'panel-subtitle';
        subtitleDiv.textContent = '\u660e\u6708\u51e0\u65f6\u6709 \u00b7 \u628a\u9152\u95ee\u9752\u5929';
        panelBody.appendChild(subtitleDiv);

        // 速度显示
        var speedDisplay = document.createElement('div');
        speedDisplay.className = 'speed-display';
        speedDisplay.innerHTML =
            '<div class="speed-moon-core"></div>' +
            '<span class="speed-num" id="mbSpeedNum">1</span><span class="speed-unit">\u500d\u901f</span>';
        _speedPoem = document.createElement('div');
        _speedPoem.className = 'speed-poem';
        _speedPoem.id = 'mbSpeedPoem';
        speedDisplay.appendChild(_speedPoem);
        panelBody.appendChild(speedDisplay);

        _speedNum = speedDisplay.querySelector('.speed-num');

        // 月相选择器
        _phaseSelector = document.createElement('div');
        _phaseSelector.className = 'phase-selector';
        _phaseSelector.id = 'mbPhaseSelector';
        var phaseTrack = document.createElement('div');
        phaseTrack.className = 'phase-track';
        _phaseSelector.appendChild(phaseTrack);

        for (var pi = 0; pi < 8; pi++) {
            (function (idx) {
                var btn = document.createElement('button');
                btn.className = 'phase-btn';
                btn.dataset.phase = idx;
                var spdIdx = idx < 4 ? Math.max(0, idx - 1) : Math.min(_SPEEDS.length - 1, idx);
                btn.dataset.speed = _SPEEDS[Math.min(spdIdx, _SPEEDS.length - 1)];
                btn.innerHTML = _getPhaseSVGForBtn(idx) + '<span class="phase-label">' + _PHASE_NAMES[idx] + '</span>';
                btn.addEventListener('click', function () {
                    var i = parseInt(this.dataset.phase);
                    var sIdx = i < 4 ? Math.max(0, i - 1) : Math.min(_SPEEDS.length - 1, i);
                    _setSpeed(_SPEEDS[Math.min(sIdx, _SPEEDS.length - 1)], i);
                    _playInkSplash();
                });
                _phaseSelector.appendChild(btn);
            })(pi);
        }
        panelBody.appendChild(_phaseSelector);

        // 速度网格
        _speedGrid = document.createElement('div');
        _speedGrid.className = 'speed-grid';
        _speedGrid.id = 'mbSpeedGrid';
        _SPEEDS.forEach(function (spd) {
            var btn = document.createElement('button');
            btn.className = 'speed-btn';
            btn.textContent = spd + 'x';
            btn.dataset.speed = spd;
            btn.addEventListener('click', function () {
                var s = parseFloat(this.dataset.speed);
                var idx = 4;
                var minDiff = Infinity;
                for (var i = 0; i < _SPEEDS.length; i++) {
                    var diff = Math.abs(Math.log(_SPEEDS[i]) - Math.log(s));
                    if (diff < minDiff) { minDiff = diff; idx = i; }
                }
                var phase = idx < 4 ? idx + 1 : idx;
                _setSpeed(s, Math.min(7, phase));
                _playInkSplash();
            });
            _speedGrid.appendChild(btn);
        });
        panelBody.appendChild(_speedGrid);

        // 控制按钮
        var panelControls = document.createElement('div');
        panelControls.className = 'panel-controls';
        _btnPersist = document.createElement('button');
        _btnPersist.className = 'ctrl-btn';
        _btnPersist.id = 'mbBtnPersist';
        _btnPersist.textContent = '\u94ed\u8bb0';
        _btnReset = document.createElement('button');
        _btnReset.className = 'ctrl-btn';
        _btnReset.id = 'mbBtnReset';
        _btnReset.textContent = '\u5f52\u4f4d';
        panelControls.appendChild(_btnPersist);
        panelControls.appendChild(_btnReset);
        panelBody.appendChild(panelControls);

        // 快捷键提示
        var kbHint = document.createElement('div');
        kbHint.className = 'kb-hint';
        kbHint.textContent = '[ ] \u6708\u76f8\u76c8\u4e8f \u00b7 0 \u5f52\u4f4d \u00b7 P \u94ed\u8bb0 \u00b7 Esc \u95ed';
        panelBody.appendChild(kbHint);

        panelScrollWrap.appendChild(panelBody);
        _panel.appendChild(panelScrollWrap);

        // 下卷轴滚筒
        var scrollBottom = document.createElement('div');
        scrollBottom.className = 'scroll-bottom';
        scrollBottom.innerHTML =
            '<div class="scroll-roller-cap left"></div>' +
            '<div class="scroll-roller-bar"></div>' +
            '<div class="scroll-roller-cap right"></div>';
        _panel.appendChild(scrollBottom);

        frag.appendChild(_panel);

        // === 创建流星萤火效果 ===
        function spawnFirefly() {
            var ff = document.createElement('div');
            ff.className = 'firefly';
            var startX = 10 + Math.random() * 80;
            var startY = 20 + Math.random() * 60;
            ff.style.left = startX + '%';
            ff.style.top = startY + '%';
            ff.style.opacity = '0';
            _meteorContainer.appendChild(ff);

            var duration = 4 + Math.random() * 4;
            var driftX = (Math.random() - 0.5) * 60;
            var driftY = -20 - Math.random() * 40;

            requestAnimationFrame(function () {
                ff.style.transition = 'all ' + duration + 's ease-out';
                ff.style.opacity = '1';
                setTimeout(function () {
                    ff.style.transform = 'translate(' + driftX + 'px,' + driftY + 'px)';
                    ff.style.opacity = '0';
                }, 50);
            });

            setTimeout(function () { ff.remove(); }, duration * 1000 + 200);
        }

        function spawnMeteor() {
            var m = document.createElement('div');
            m.className = 'meteor';
            m.style.left = (70 + Math.random() * 20) + '%';
            m.style.top = (10 + Math.random() * 30) + '%';
            m.style.transform = 'rotate(35deg)';
            _meteorContainer.appendChild(m);

            var duration = 1.2 + Math.random() * 0.8;

            requestAnimationFrame(function () {
                m.style.transition = 'all ' + duration + 's linear';
                m.style.opacity = '1';
                setTimeout(function () {
                    m.style.transform = 'translate(-120px, 80px) rotate(35deg)';
                    m.style.opacity = '0';
                }, 30);
            });

            setTimeout(function () { m.remove(); }, duration * 1000 + 200);
        }

        // 启动/停止流星萤火效果（面板打开时启动，关闭时停止以节省 GPU）
        function _startEffects() {
            if (_fireflyInterval) return;
            _fireflyInterval = setInterval(spawnFirefly, 2500);
            _meteorInterval = setInterval(spawnMeteor, 6000);
            for (var fi = 0; fi < 3; fi++) {
                setTimeout(spawnFirefly, fi * 800);
            }
        }
        function _stopEffects() {
            if (_fireflyInterval) { clearInterval(_fireflyInterval); _fireflyInterval = null; }
            if (_meteorInterval) { clearInterval(_meteorInterval); _meteorInterval = null; }
        }
        // 暴露给 _togglePanel 使用
        _panel._startEffects = _startEffects;
        _panel._stopEffects = _stopEffects;

        // 挂载到页面
        document.body.appendChild(frag);

        // === 绑定事件 ===

        // 触发器点击
        _trigger.addEventListener('click', function (e) {
            if (_trigger._dragged) { _trigger._dragged = false; return; }
            _togglePanel();
            _playInkSplash();
        });

        // 面板关闭按钮
        _panelClose.addEventListener('click', function () { _togglePanel(false); });

        // 铭记按钮
        _btnPersist.addEventListener('click', function () {
            _persisted = !_persisted;
            if (_persisted) {
                try {
                    localStorage.setItem(_PERSIST_KEY, 'true');
                    localStorage.setItem(_STORAGE_KEY, _currentSpeed);
                } catch (e) { }
            } else {
                try {
                    localStorage.setItem(_PERSIST_KEY, 'false');
                    localStorage.removeItem(_STORAGE_KEY);
                } catch (e) { }
            }
            _updateUI();
        });

        // 归位按钮
        _btnReset.addEventListener('click', function () { _setSpeed(1, 4); _playInkSplash(); });

        // 键盘快捷键
        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === '[' || e.key === '\u3010') {
                var newPhase = Math.max(0, _currentPhase - 1);
                var spIdx = newPhase < 4 ? Math.max(0, newPhase - 1) : Math.min(_SPEEDS.length - 1, newPhase);
                _setSpeed(_SPEEDS[Math.min(spIdx, _SPEEDS.length - 1)], newPhase);
                _playInkSplash();
            } else if (e.key === ']' || e.key === '\u3011') {
                var newPhase2 = Math.min(7, _currentPhase + 1);
                var spIdx2 = newPhase2 < 4 ? Math.max(0, newPhase2 - 1) : Math.min(_SPEEDS.length - 1, newPhase2);
                _setSpeed(_SPEEDS[Math.min(spIdx2, _SPEEDS.length - 1)], newPhase2);
                _playInkSplash();
            } else if (e.key === '0') {
                _setSpeed(1, 4); _playInkSplash();
            } else if (e.key === 'p' || e.key === 'P') {
                _btnPersist.click();
            } else if (e.key === 'Escape') {
                _togglePanel(false);
            }
        });

        // 触发器拖拽（使用 requestAnimationFrame 节流 + 动态边界）
        (function () {
            var dragging = false, startX, startY, origLeft, origTop, moved = false;
            var pendingX = 0, pendingY = 0, rafPending = false;
            function onDown(e) {
                dragging = true; moved = false;
                var ev = e.touches ? e.touches[0] : e;
                startX = ev.clientX; startY = ev.clientY;
                pendingX = startX; pendingY = startY;
                var r = _trigger.getBoundingClientRect();
                origLeft = r.left; origTop = r.top;
                _trigger.classList.add('dragging');
                e.preventDefault();
            }
            function onMove(e) {
                if (!dragging) return;
                var ev = e.touches ? e.touches[0] : e;
                pendingX = ev.clientX; pendingY = ev.clientY;
                if (!rafPending) {
                    rafPending = true;
                    requestAnimationFrame(function () {
                        rafPending = false;
                        if (!dragging) return;
                        var dx = pendingX - startX, dy = pendingY - startY;
                        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
                        var tw = _trigger.offsetWidth || 130;
                        var th = _trigger.offsetHeight || 150;
                        var nl = Math.max(0, Math.min(window.innerWidth - tw, origLeft + dx));
                        var nt = Math.max(0, Math.min(window.innerHeight - th, origTop + dy));
                        _trigger.style.left = nl + 'px';
                        _trigger.style.top = nt + 'px';
                        _panel.style.left = nl + 'px';
                        _panel.style.top = (nt + th + 20) + 'px';
                    });
                }
            }
            function onUp() {
                if (!dragging) return;
                dragging = false;
                _trigger.classList.remove('dragging');
                _trigger._dragged = moved;
            }
            _trigger.addEventListener('mousedown', onDown);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            _trigger.addEventListener('touchstart', onDown, { passive: false });
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
        })();

        // 点击面板外部关闭（同时监听 mousedown 和 touchstart 以支持移动端）
        function _onOutsideClick(e) {
            if (_panelOpen && !_panel.contains(e.target) && !_trigger.contains(e.target)) {
                _togglePanel(false);
            }
        }
        document.addEventListener('mousedown', _onOutsideClick);
        document.addEventListener('touchstart', _onOutsideClick, { passive: true });

        // === 初始化 ===
        try {
            var savedPersist = localStorage.getItem(_PERSIST_KEY);
            var savedSpeed = localStorage.getItem(_STORAGE_KEY);
            if (savedPersist === 'true' && savedSpeed) {
                var spd = parseFloat(savedSpeed);
                if (!isNaN(spd) && spd > 0) {
                    _persisted = true;
                    _origSetTimeout.call(window, function () { _setSpeed(spd); }, 500);
                }
            }
        } catch (e) { }

        if (!_persisted) {
            _setSpeed(1, 4);
        }
    }

    // ================================================================
    // Part 7: 初始化入口
    // ================================================================

    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        _mountUI();
    } else {
        document.addEventListener('readystatechange', function () {
            if ((document.readyState === 'interactive' || document.readyState === 'complete') && !window.__moonbeamRendered) {
                _mountUI();
            }
        });
    }
})();
