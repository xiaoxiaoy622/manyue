/**
 * CDN 版本号注入补丁
 * 在 cc.js 加载后运行，将所有 CDN 请求加上版本号参数
 */
(function() {
    // 等待 cc 模块初始化完成
    var checkCc = setInterval(function() {
        if (window.cc && window.cc.LoadManager) {
            clearInterval(checkCc);
            injectVersion();
        }
    }, 50);

    function injectVersion() {
        var LoadManager = window.cc.LoadManager;
        if (!LoadManager) return;

        // 获取版本号
        var version = typeof CDN_VERSION !== 'undefined' ? CDN_VERSION : '20260903';
        var versionParam = '?v=' + version;

        // 保存原始的 fullUrl 方法
        var originalFullUrl = LoadManager.prototype.fullUrl;

        // 重写 fullUrl，在 URL 后添加版本号
        LoadManager.prototype.fullUrl = function() {
            var url = originalFullUrl.call(this);
            // 如果是 CDN URL 且没有查询参数，则添加版本号
            if (url && url.indexOf(':') === -1 && LoadManager.cdn && url.indexOf('?') === -1) {
                return url + versionParam;
            }
            return url;
        };

        console.log('[CDN-Patch] 版本号注入成功: ' + versionParam);
    }
})();
