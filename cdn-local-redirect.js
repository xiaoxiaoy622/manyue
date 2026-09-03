/**
 * CDN 本地资源重写补丁
 * 所有图片资源优先使用本地 img/ 目录
 * 只有 bg.jpg 尝试从 CDN 获取（用于缓存预检）
 */
(function() {
    var checkCc = setInterval(function() {
        if (window.cc && window.cc.LoadManager) {
            clearInterval(checkCc);
            injectLocalResources();
        }
    }, 50);

    function injectLocalResources() {
        var LoadManager = window.cc.LoadManager;
        if (!LoadManager) return;

        var cdnBase = typeof CDN_BASE !== 'undefined' ? CDN_BASE : '';
        var cdnVersion = typeof CDN_VERSION !== 'undefined' ? CDN_VERSION : '20260903';

        // ============================================
        // 1. 重写 fullUrl：所有 CDN URL 转为本地路径
        // ============================================
        var originalFullUrl = LoadManager.prototype.fullUrl;
        LoadManager.prototype.fullUrl = function() {
            var url = originalFullUrl.call(this);
            if (!url || !cdnBase || url.indexOf(cdnBase) !== 0) {
                return url;
            }
            
            // 移除 CDN 前缀
            var relative = url.substring(cdnBase.length);
            // 移除版本参数
            relative = relative.replace(/\?v=[^&]*/, '').replace(/\?.*$/, '');
            
            // 只有 bg.jpg 保留 CDN 路径（用于预检）
            if (relative === 'img/bg.jpg') {
                return url;
            }
            
            // 其他资源全部指向本地
            return ensureLocalPath(relative);
        };

        // ============================================
        // 2. 重写 loadImage：优先从本地加载
        // ============================================
        var originalLoadImage = LoadManager.prototype.loadImage;
        LoadManager.prototype.loadImage = function(e) {
            var url = e.url;
            
            // 如果是 CDN bg.jpg，走原始逻辑（允许 CDN 缓存预检）
            if (url && cdnBase && url.indexOf(cdnBase) === 0 && url.indexOf('img/bg.jpg') !== -1) {
                return originalLoadImage.call(this, e);
            }
            
            // 所有其他图片：直接尝试本地加载
            var localUrl = ensureLocalPath(url);
            var img = new Image();
            img.crossOrigin = '*';
            img.onload = function() {
                var texture = new window.cc.Texture(img, window.cc.Texture.UV);
                window.cc.ResManager.addRes(url, texture);
                delete e.loadingData[url];
                e.finished(texture);
            };
            img.onerror = function() {
                // 本地失败，尝试 CDN 作为最后手段
                console.warn('[Local-Resource] 本地加载失败，尝试 CDN: ' + url);
                originalLoadImage.call(this, e);
            };
            img.src = localUrl;
            e.temp = img;
        };

        // ============================================
        // 3. 重写 loadText：JSON 文件从本地加载
        // ============================================
        var originalLoadText = LoadManager.prototype.loadText;
        LoadManager.prototype.loadText = function(e) {
            var url = e.url;
            
            // JSON 文件全部从本地加载
            if (url && cdnBase && url.indexOf(cdnBase) === 0) {
                var localUrl = ensureLocalPath(url);
                var xhr = new XMLHttpRequest();
                xhr.open('GET', localUrl, true);
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        window.cc.ResManager.addRes(url, xhr.responseText);
                        delete e.loadingData[url];
                        e.finished(xhr.responseText);
                    } else {
                        originalLoadText.call(this, e);
                    }
                };
                xhr.onerror = function() {
                    originalLoadText.call(this, e);
                };
                e.temp = xhr;
                xhr.send();
                return;
            }
            
            originalLoadText.call(this, e);
        };

        // ============================================
        // 4. 重写 loadAtlas：图集 JSON 从本地加载
        // ============================================
        var originalLoadAtlas = LoadManager.prototype.loadAtlas;
        if (originalLoadAtlas) {
            LoadManager.prototype.loadAtlas = function(t) {
                var url = t.url;
                
                if (url && cdnBase && url.indexOf(cdnBase) === 0) {
                    var localUrl = ensureLocalPath(url);
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', localUrl, true);
                    xhr.onload = function() {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            var data = JSON.parse(xhr.responseText);
                            // 重写图集元数据中的图片路径
                            if (data.meta && data.meta.image) {
                                data.meta.image = ensureLocalPath(data.meta.image);
                            }
                            window.cc.ResManager.addRes(url, data);
                            delete t.loadingData[url];
                            t.finished(data);
                        } else {
                            originalLoadAtlas.call(this, t);
                        }
                    };
                    xhr.onerror = function() {
                        originalLoadAtlas.call(this, t);
                    };
                    t.temp = xhr;
                    xhr.send();
                    return;
                }
                
                originalLoadAtlas.call(this, t);
            };
        }

        console.log('[Local-Resource] 本地资源重写已注入');
    }

    // ============================================
    // 工具函数：将相对路径转为本地路径
    // ============================================
    function ensureLocalPath(url) {
        // 如果是完整 URL，提取路径部分
        if (url.indexOf('http') === 0) {
            // 移除 CDN 前缀
            if (cdnBase && url.indexOf(cdnBase) === 0) {
                url = url.substring(cdnBase.length);
            }
            // 移除版本参数
            url = url.replace(/\?.*$/, '');
        }
        
        // 确保以 img/ 开头
        if (url.indexOf('img/') !== 0) {
            url = 'img/' + url;
        }
        
        return url;
    }
})();
