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
        if (!LoadManager) return;

        var version = typeof CDN_VERSION !== 'undefined' ? CDN_VERSION : '20260903';

        // 保存原始 loadImage 方法
        var originalLoadImage = LoadManager.prototype.loadImage;

        // 重写 loadImage，优先使用缓存
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

        // 拦截图片加载完成，存入缓存
        var originalFinish = LoadManager.prototype.finished;
        if (originalFinish) {
            LoadManager.prototype.finished = function(t) {
                var result = originalFinish.call(this, t);
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
            };
        }

        console.log('[CDN-Cache-Patch] 缓存拦截已注入，版本号: ' + version + '，7天自动过期');
    }
})();
