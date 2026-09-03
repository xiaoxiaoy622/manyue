/**
 * CDN 图片缓存补丁
 * 在 cc.js 加载后运行，拦截图片加载请求，优先使用缓存
 * 缓存7天后自动过期，重新从 CDN 获取
 */
(function() {
    var CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7天毫秒数
    var TIMESTAMP_KEY = 'moonbeam_cdn_timestamp';
    
    var checkCc = setInterval(function() {
        if (window.cc && window.cc.LoadManager) {
            clearInterval(checkCc);
            injectCache();
        }
    }, 50);

    function injectCache() {
        var LoadManager = window.cc.LoadManager;
        var LoadInfo = window.cc.LoadInfo;
        if (!LoadManager || !LoadInfo) return;

        var version = typeof CDN_VERSION !== 'undefined' ? CDN_VERSION : '20260903';

        // ============================================
        // 补丁1：包装 LoadInfo.prototype.finished
        // 防止 finished(null) 时回调崩溃
        // ============================================
        var originalFinish = LoadInfo.prototype.finished;
        if (originalFinish) {
            LoadInfo.prototype.finished = function(t) {
                // 图片加载失败时（t 为 null），跳过所有回调，防止崩溃
                if (t === null || t === undefined) {
                    console.warn('[CDN-Cache] 图片加载失败，跳过回调: ' + this.url);
                    // 不调用原始 finished，避免触发崩溃的回调
                    // 但需要恢复状态
                    try {
                        this.recover();
                    } catch (err) {
                        console.warn('[CDN-Cache] recover 错误:', err.message);
                    }
                    return null;
                }
                
                try {
                    var result = originalFinish.call(this, t);
                    // 只有当图片加载成功时才缓存
                    if (t && t.img && this.url && typeof CDN_BASE !== 'undefined' && this.url.indexOf(CDN_BASE) === 0) {
                        try {
                            var canvas = document.createElement('canvas');
                            canvas.width = t.img.width;
                            canvas.height = t.img.height;
                            var ctx = canvas.getContext('2d');
                            ctx.drawImage(t.img, 0, 0);
                            var dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                            var relativeUrl = this.url.substring(CDN_BASE.length);
                            var cacheKey = 'moonbeam_cdn_' + relativeUrl.replace(/[^a-zA-Z0-9._-]/g, '_');
                            localStorage.setItem(cacheKey, dataUrl);
                            localStorage.setItem('moonbeam_cdn_version', typeof CDN_VERSION !== 'undefined' ? CDN_VERSION : '20260903');
                            localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
                            console.log('[CDN-Cache] 缓存图片: ' + relativeUrl + ' (' + (dataUrl.length / 1024).toFixed(0) + ' KB) - 7天有效');
                        } catch (err) {
                            console.warn('[CDN-Cache] 缓存写入失败:', err.message);
                        }
                    }
                    return result;
                } catch (err) {
                    // 原始 finished 出错时也返回，避免阻断游戏
                    console.warn('[CDN-Cache] finished 错误:', err.message);
                    return null;
                }
            };
        }

        // ============================================
        // 补丁2：包装 LoadInfo.prototype.addCallback
        // 为所有回调添加 null 保护（双重保险）
        // ============================================
        var originalAddCallback = LoadInfo.prototype.addCallback;
        if (originalAddCallback) {
            LoadInfo.prototype.addCallback = function(caller, callback, args) {
                // 包装回调：当 e 为 null 时跳过执行，防止崩溃
                var wrappedCallback = function(url, e, args) {
                    if (e === null || e === undefined) {
                        console.warn('[CDN-Cache] 加载失败，跳过回调: ' + url);
                        return;
                    }
                    return callback.call(caller, url, e, args);
                };
                return originalAddCallback.call(this, caller, wrappedCallback, args);
            };
        }

        // ============================================
        // 补丁3：重写 loadImage，优先使用缓存
        // ============================================
        var originalLoadImage = LoadManager.prototype.loadImage;
        if (originalLoadImage) {
            LoadManager.prototype.loadImage = function(e) {
                var url = e.url;
                var cdnBase = typeof CDN_BASE !== 'undefined' ? CDN_BASE : '';

                // 如果是 CDN 图片，尝试从缓存加载
                if (cdnBase && url.indexOf(cdnBase) === 0) {
                    var relativeUrl = url.substring(cdnBase.length);
                    var cacheKey = 'moonbeam_cdn_' + relativeUrl.replace(/[^a-zA-Z0-9._-]/g, '_');

                    // 检查缓存
                    var cachedData = null;
                    try {
                        cachedData = localStorage.getItem(cacheKey);
                        var cachedVersion = localStorage.getItem('moonbeam_cdn_version');
                        var cachedTime = localStorage.getItem(TIMESTAMP_KEY);

                        if (cachedData && cachedVersion === version) {
                            // 检查是否过期（7天）
                            if (cachedTime) {
                                var age = Date.now() - parseInt(cachedTime);
                                if (age > CACHE_TTL) {
                                    // 已过期，清除缓存
                                    localStorage.removeItem(cacheKey);
                                    console.log('[CDN-Cache] 缓存已过期(>7天)，重新下载: ' + relativeUrl);
                                    originalLoadImage.call(this, e);
                                    return;
                                }
                                var remaining = Math.max(0, Math.floor((CACHE_TTL - age) / (24 * 60 * 60 * 1000)));
                                console.log('[CDN-Cache] 命中缓存: ' + relativeUrl + ' (剩余' + remaining + '天)');
                            } else {
                                console.log('[CDN-Cache] 命中缓存: ' + relativeUrl);
                            }
                            
                            // 直接创建 Image 对象并触发 onload
                            var img = new Image();
                            img.crossOrigin = '*';
                            img.onload = function() {
                                var texture = new window.cc.Texture(img, window.cc.Texture.UV);
                                window.cc.ResManager.addRes(e.url, texture);
                                delete e.loadingData[e.url];
                                e.finished(texture);
                            };
                            img.onerror = function() {
                                console.warn('[CDN-Cache] 缓存图片加载失败，重新下载: ' + relativeUrl);
                                // 缓存失效，重新下载
                                localStorage.removeItem(cacheKey);
                                originalLoadImage.call(this, e);
                            };
                            img.src = cachedData;
                            e.temp = img;
                            return;
                        }
                    } catch (err) {
                        console.warn('[CDN-Cache] 缓存读取失败:', err.message);
                    }
                }

                // 缓存未命中或已过期，使用原始方法
                originalLoadImage.call(this, e);
            };
        }

        console.log('[CDN-Cache-Patch] 缓存拦截已注入，版本号: ' + version + '，7天自动过期');
    }
})();
