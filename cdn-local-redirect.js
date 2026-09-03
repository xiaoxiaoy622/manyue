/**
 * CDN 本地资源重写补丁
 * 将所有 CDN 资源请求重写为本地 img/ 路径
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

        var cdnBase = window.CDN_BASE || '';
        console.log('[Local-Resource] CDN_BASE = "' + cdnBase + '"');

        // ============================================
        // 1. 重写 fullUrl：所有 CDN URL 转为本地路径
        // ============================================
        var originalFullUrl = LoadManager.prototype.fullUrl;
        LoadManager.prototype.fullUrl = function() {
            var url = originalFullUrl.call(this);
            if (!url || !cdnBase || url.indexOf(cdnBase) !== 0) {
                return url || '';
            }
            
            // 移除 CDN 前缀和版本参数
            var relative = url.substring(cdnBase.length);
            relative = relative.replace(/\?v=[^&]*/, '').replace(/\?.*$/, '');
            
            // 只有 bg.jpg 保留原路径（可尝试 CDN）
            if (relative === 'img/bg.jpg') {
                return url;
            }
            
            // 其他资源全部指向本地
            return ensureLocalPath(relative);
        };

        // ============================================
        // 2. 重写 loadImage：直接加载本地图片
        // ============================================
        var originalLoadImage = LoadManager.prototype.loadImage;
        LoadManager.prototype.loadImage = function(e) {
            var url = e.url;
            
            // 如果是 bg.jpg，尝试原始逻辑
            if (url && cdnBase && url.indexOf(cdnBase) !== -1 && url.indexOf('bg.jpg') !== -1) {
                return originalLoadImage.call(this, e);
            }
            
            // 所有其他图片：直接尝试本地加载
            var localUrl = ensureLocalPath(url);
            console.log('[Local-Resource] 加载图片: ' + localUrl);
            
            var img = new Image();
            img.crossOrigin = '*';
            img.onload = function() {
                try {
                    var texture = new window.cc.Texture(img, window.cc.Texture.UV);
                    window.cc.ResManager.addRes(url, texture);
                    if (e.loadingData) delete e.loadingData[url];
                    if (e.finished) e.finished(texture);
                } catch (err) {
                    console.error('[Local-Resource] 图片处理错误:', err.message);
                }
            };
            img.onerror = function() {
                console.warn('[Local-Resource] 本地加载失败: ' + localUrl);
                // 尝试原始 CDN 加载
                if (originalLoadImage) {
                    originalLoadImage.call(this, e);
                }
            };
            img.src = localUrl;
            if (e.temp) e.temp = img;
        };

        // ============================================
        // 3. 重写 loadText：JSON 从本地加载
        // ============================================
        var originalLoadText = LoadManager.prototype.loadText;
        if (originalLoadText) {
            LoadManager.prototype.loadText = function(e) {
                var url = e.url;
                
                if (url && cdnBase && url.indexOf(cdnBase) === 0) {
                    var localUrl = ensureLocalPath(url);
                    console.log('[Local-Resource] 加载 JSON: ' + localUrl);
                    
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', localUrl, true);
                    xhr.onload = function() {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                window.cc.ResManager.addRes(url, xhr.responseText);
                                if (e.loadingData) delete e.loadingData[url];
                                if (e.finished) e.finished(xhr.responseText);
                            } catch (err) {
                                console.error('[Local-Resource] JSON 处理错误:', err.message);
                            }
                        } else {
                            console.warn('[Local-Resource] JSON 加载失败: ' + localUrl);
                            if (originalLoadText) originalLoadText.call(this, e);
                        }
                    };
                    xhr.onerror = function() {
                        console.warn('[Local-Resource] JSON 请求失败: ' + localUrl);
                        if (originalLoadText) originalLoadText.call(this, e);
                    };
                    if (e.temp) e.temp = xhr;
                    xhr.send();
                    return;
                }
                
                if (originalLoadText) originalLoadText.call(this, e);
            };
        }

        // ============================================
        // 4. 重写 loadAtlas：图集从本地加载
        // ============================================
        var originalLoadAtlas = LoadManager.prototype.loadAtlas;
        if (originalLoadAtlas) {
            LoadManager.prototype.loadAtlas = function(t) {
                var url = t.url;
                
                if (url && cdnBase && url.indexOf(cdnBase) === 0) {
                    var localUrl = ensureLocalPath(url);
                    console.log('[Local-Resource] 加载图集: ' + localUrl);
                    
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', localUrl, true);
                    xhr.onload = function() {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                var data = JSON.parse(xhr.responseText);
                                // 重写图集元数据中的图片路径
                                if (data.meta && data.meta.image) {
                                    data.meta.image = ensureLocalPath(data.meta.image);
                                }
                                window.cc.ResManager.addRes(url, data);
                                if (t.loadingData) delete t.loadingData[url];
                                if (t.finished) t.finished(data);
                            } catch (err) {
                                console.error('[Local-Resource] 图集解析错误:', err.message);
                            }
                        } else {
                            console.warn('[Local-Resource] 图集加载失败: ' + localUrl);
                            if (originalLoadAtlas) originalLoadAtlas.call(this, t);
                        }
                    };
                    xhr.onerror = function() {
                        console.warn('[Local-Resource] 图集请求失败: ' + localUrl);
                        if (originalLoadAtlas) originalLoadAtlas.call(this, t);
                    };
                    if (t.temp) t.temp = xhr;
                    xhr.send();
                    return;
                }
                
                if (originalLoadAtlas) originalLoadAtlas.call(this, t);
            };
        }

        console.log('[Local-Resource] 本地资源重写已注入');
    }

    // ============================================
    // 工具函数：将路径转为本地路径
    // ============================================
    function ensureLocalPath(url) {
        if (!url) return url;
        
        // 如果是完整 URL，提取路径部分
        if (url.indexOf('http') === 0) {
            var cdnBase = window.CDN_BASE || '';
            if (cdnBase && url.indexOf(cdnBase) === 0) {
                url = url.substring(cdnBase.length);
            }
            url = url.replace(/\?.*$/, '');
        }
        
        // 确保以 img/ 开头
        if (url.indexOf('img/') !== 0) {
            url = 'img/' + url;
        }
        
        return url;
    }
})();
