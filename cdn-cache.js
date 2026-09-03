/**
 * CDN 图片缓存管理器
 * 功能：
 * 1. 将 CDN 图片缓存到 localStorage
 * 2. 通过版本号和时间戳决定是否需要重新下载
 * 3. 缓存7天后自动过期，重新从 CDN 获取
 * 4. 缓存命中时直接返回 base64 数据，避免网络请求
 */
(function() {
    var CACHE_KEY_PREFIX = 'moonbeam_cdn_';
    var VERSION_KEY = 'moonbeam_cdn_version';
    var TIMESTAMP_KEY = 'moonbeam_cdn_timestamp';
    var CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7天毫秒数
    var MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB 缓存上限

    /**
     * 生成缓存 key
     */
    function getCacheKey(url) {
        // 提取文件名作为 key
        var match = url.match(/([^/?#]+)$/);
        return CACHE_KEY_PREFIX + (match ? match[1] : url.replace(/\//g, '_'));
    }

    /**
     * 获取缓存时间戳
     */
    function getCacheTimestamp() {
        try {
            return localStorage.getItem(TIMESTAMP_KEY);
        } catch (e) {
            return null;
        }
    }

    /**
     * 设置缓存时间戳
     */
    function setCacheTimestamp() {
        try {
            localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 检查缓存是否有效
     */
    function isCacheValid(url, version) {
        try {
            var key = getCacheKey(url);
            var cached = localStorage.getItem(key);
            var cachedVersion = localStorage.getItem(VERSION_KEY);
            var cachedTime = localStorage.getItem(TIMESTAMP_KEY);

            if (!cached || !cachedVersion) return false;
            if (cachedVersion !== version) return false;

            // 检查是否过期（7天）
            if (cachedTime) {
                var age = Date.now() - parseInt(cachedTime);
                if (age > CACHE_TTL) {
                    // 已过期，清除缓存
                    localStorage.removeItem(key);
                    localStorage.removeItem(VERSION_KEY);
                    localStorage.removeItem(TIMESTAMP_KEY);
                    return false;
                }
            }

            // 检查缓存大小
            var size = cached.length;
            var totalSize = 0;
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(CACHE_KEY_PREFIX) === 0) {
                    totalSize += localStorage.getItem(k).length;
                }
            }
            if (totalSize > MAX_CACHE_SIZE) {
                // 缓存过大，清除所有缓存
                clearCache();
                return false;
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 获取缓存的图片数据
     */
    function getCacheImage(url) {
        try {
            var key = getCacheKey(url);
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    /**
     * 缓存图片数据
     */
    function setCacheImage(url, dataUrl) {
        try {
            var key = getCacheKey(url);
            localStorage.setItem(key, dataUrl);
            localStorage.setItem(VERSION_KEY, typeof CDN_VERSION !== 'undefined' ? CDN_VERSION : '20260903');
            localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
            return true;
        } catch (e) {
            console.warn('[CDN-Cache] 缓存写入失败:', e.message);
            return false;
        }
    }

    /**
     * 清除缓存
     */
    function clearCache() {
        try {
            var keysToRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && (k.indexOf(CACHE_KEY_PREFIX) === 0 || k === VERSION_KEY || k === TIMESTAMP_KEY)) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(function(k) {
                localStorage.removeItem(k);
            });
            console.log('[CDN-Cache] 缓存已清除');
        } catch (e) {
            console.warn('[CDN-Cache] 清除缓存失败:', e.message);
        }
    }

    /**
     * 获取缓存统计信息
     */
    function getCacheStats() {
        try {
            var size = 0;
            var count = 0;
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(CACHE_KEY_PREFIX) === 0) {
                    var data = localStorage.getItem(k);
                    if (data) {
                        size += data.length;
                        count++;
                    }
                }
            }
            var version = localStorage.getItem(VERSION_KEY);
            var timestamp = localStorage.getItem(TIMESTAMP_KEY);
            var ageDays = 0;
            var remainingDays = 7;
            
            if (timestamp) {
                var age = Date.now() - parseInt(timestamp);
                ageDays = Math.floor(age / (24 * 60 * 60 * 1000));
                remainingDays = Math.max(0, 7 - ageDays);
            }
            
            return {
                count: count,
                size: size,
                sizeKB: (size / 1024).toFixed(1),
                version: version,
                ageDays: ageDays,
                remainingDays: remainingDays
            };
        } catch (e) {
            return { count: 0, size: 0, sizeKB: '0', version: null, ageDays: 0, remainingDays: 7 };
        }
    }

    /**
     * 获取缓存年龄（天）
     */
    function getCacheAge() {
        try {
            var timestamp = localStorage.getItem(TIMESTAMP_KEY);
            if (!timestamp) return 0;
            var age = Date.now() - parseInt(timestamp);
            return Math.floor(age / (24 * 60 * 60 * 1000));
        } catch (e) {
            return 0;
        }
    }

    /**
     * 获取缓存剩余有效天数
     */
    function getCacheRemaining() {
        try {
            var timestamp = localStorage.getItem(TIMESTAMP_KEY);
            if (!timestamp) return 7;
            var age = Date.now() - parseInt(timestamp);
            return Math.max(0, 7 - Math.floor(age / (24 * 60 * 60 * 1000)));
        } catch (e) {
            return 7;
        }
    }

    // 暴露到全局
    window.CDNCache = {
        isCacheValid: isCacheValid,
        getCacheImage: getCacheImage,
        setCacheImage: setCacheImage,
        clearCache: clearCache,
        getCacheStats: getCacheStats,
        getCacheAge: getCacheAge,
        getCacheRemaining: getCacheRemaining
    };

    console.log('[CDN-Cache] 缓存管理器已初始化（7天自动过期）');
})();
