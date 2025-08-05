// ==UserScript==
// @name         GitHub镜像自动跳转（可配置）
// @namespace    https://github.com/your-namespace/
// @version      1.2.0
// @description  自动将GitHub链接替换为指定镜像站，支持配置镜像域名，处理静态/动态内容
// @author       Your Name
// @match        *://github.com/*
// @match        *://gist.github.com/*
// @match        *://api.github.com/*
// @match        *://raw.github.com/*
// @match        *://codeload.github.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // ---------------------- 配置项 ----------------------
    const DEFAULT_MIRROR = 'bgithub.xyz'; // 默认镜像域名
    const CONFIG_KEY = 'github_mirror_domain'; // 配置存储键名
    const GITHUB_HOST_REGEX = /github\.com$/i; // 匹配GitHub主机名的正则

    // ---------------------- 工具函数 ----------------------
    /**
     * 读取/设置镜像域名（持久化）
     * @returns {string} 当前镜像域名（默认DEFAULT_MIRROR）
     */
    function getMirrorDomain() {
        return GM_getValue(CONFIG_KEY, DEFAULT_MIRROR);
    }

    /**
     * 验证域名格式（简单验证）
     * @param {string} domain - 待验证的域名
     * @returns {boolean} 是否有效
     */
    function isValidDomain(domain) {
        const regex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(domain);
    }

    /**
     * 替换URL中的GitHub主机名为镜像域名（保留子域名）
     * @param {string} url - 原始URL
     * @returns {string} 替换后的URL（未匹配则返回原URL）
     */
    function replaceGithubHost(url) {
        try {
            const urlObj = new URL(url, document.baseURI); // 处理相对路径
            // 仅替换GitHub主机名（如github.com、gist.github.com）
            if (GITHUB_HOST_REGEX.test(urlObj.hostname)) {
                urlObj.hostname = urlObj.hostname.replace(GITHUB_HOST_REGEX, getMirrorDomain());
                return urlObj.href;
            }
            return url;
        } catch (err) {
            console.error('解析URL失败:', err.message, '原始URL:', url);
            return url;
        }
    }

    // ---------------------- 核心功能 ----------------------
    /**
     * 处理当前页面跳转（避免无限循环）
     */
    function redirectCurrentPage() {
        const currentUrl = window.location.href;
        const newUrl = replaceGithubHost(currentUrl);
        if (newUrl !== currentUrl) {
            window.location.replace(newUrl);
        }
    }

    /**
     * 替换指定容器内的所有GitHub链接（支持静态/动态内容）
     * @param {Node} [container=document.body] - 要处理的容器节点
     */
    function replaceLinks(container = document.body) {
        // 优化：先过滤包含github.com的a标签，再处理
        const links = container.querySelectorAll('a[href*="github.com"]');
        links.forEach(link => {
            const originalHref = link.href;
            const newHref = replaceGithubHost(originalHref);
            if (newHref !== originalHref) {
                link.href = newHref;
                // 添加 hover 提示（可选）
                link.title = `已切换至镜像站：${newHref}`;
                // 添加样式标记（可选，方便用户识别）
                link.classList.add('github-mirror-link');
            }
        });
    }

    /**
     * 初始化动态内容监听（针对GitHub特定容器，提升性能）
     */
    function initDynamicObserver() {
        // GitHub动态加载的核心容器（仓库页面、列表等）
        const targetContainer = document.querySelector('#js-repo-pjax-container') 
                            || document.querySelector('#js-pjax-container') 
                            || document.body;

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                // 处理新增的节点
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        replaceLinks(node); // 替换新增节点内的链接
                    }
                });
            });
        });

        // 启动观察者（监听子节点变化和后代节点）
        observer.observe(targetContainer, {
            childList: true,
            subtree: true
        });
        console.log('动态链接替换观察者已启动');
    }

    // ---------------------- 配置菜单 ----------------------
    /**
     * 初始化油猴菜单（设置镜像域名）
     */
    function initConfigMenu() {
        GM_registerMenuCommand('设置GitHub镜像域名', () => {
            const currentMirror = getMirrorDomain();
            const newMirror = prompt('请输入镜像域名（如bgithub.xyz）：', currentMirror);
            
            if (!newMirror) return; // 用户取消输入
            
            if (!isValidDomain(newMirror)) {
                alert('❌ 无效的域名格式，请输入如"bgithub.xyz"的正确域名');
                return;
            }
            
            GM_setValue(CONFIG_KEY, newMirror);
            alert('✅ 镜像域名设置成功！\n请刷新页面使配置生效。');
        });
    }

    // ---------------------- 样式定义（可选） ----------------------
    GM_addStyle(`
        .github-mirror-link {
            border: 1px solid #28a745 !important;
            padding: 1px 3px !important;
            border-radius: 3px !important;
            background-color: #f0fff4 !important;
            transition: all 0.3s ease !important;
        }
        .github-mirror-link:hover {
            background-color: #e6f9e6 !important;
            border-color: #218838 !important;
        }
    `);

    // ---------------------- 主程序入口 ----------------------
    (function main() {
        // 1. 初始化配置菜单
        initConfigMenu();
        
        // 2. 处理当前页面跳转（避免在镜像站重复跳转）
        redirectCurrentPage();
        
        // 3. 替换静态链接（页面加载完成后执行）
        window.addEventListener('load', () => {
            replaceLinks(); // 替换页面所有静态链接
            initDynamicObserver(); // 启动动态链接监听
        });
    })();
})();
