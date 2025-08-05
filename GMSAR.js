// ==UserScript==
// @name         GitHub 镜像站自动跳转
// @namespace    https://github.com/your-username/
// @version      1.1.0
// @description  自动将GitHub链接跳转至自定义镜像站，支持配置面板和跳转通知（优化延迟显示）
// @match        *://github.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ------------------- 配置初始化 -------------------
    const DEFAULT_MIRROR = 'bgithub.xyz'; // 默认镜像站（可修改）
    let mirror = GM_getValue('github_mirror', DEFAULT_MIRROR); // 从存储获取镜像站（键名可自定义）

    // ------------------- 核心跳转逻辑 -------------------
    if (window.location.hostname === 'github.com') {
        // 1. 构建新URL（替换github.com为镜像站，保留路径和参数）
        const newUrl = window.location.href.replace(
            /^https?:\/\/github\.com/,
            `https://${mirror}`
        );

        // 2. 显示跳转通知
        showNotification(`已跳转至镜像站：\n${mirror}`);

        // 3. 延迟100ms跳转（确保通知显示，不影响体验）
        setTimeout(() => {
            window.location.replace(newUrl); // 用replace避免历史记录
        }, 100);
    }

    // ------------------- 跳转通知函数 -------------------
    function showNotification(message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 14px 28px;
            background: #1f2937; /* 深灰背景（符合GitHub风格） */
            color: #f3f4f6; /* 浅灰文字 */
            font-size: 14px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); /* 增强阴影 */
            z-index: 99999; /* 最上层显示 */
            opacity: 0; /* 初始隐藏 */
            transition: opacity 0.3s ease, transform 0.3s ease; /* 渐显+平移 */
            transform: translateX(100px); /* 初始向右偏移 */
        `;
        notification.textContent = message;

        // 添加到页面（document-start时body未加载，用html元素）
        document.documentElement.appendChild(notification);

        // 渐显+平移动画（从右到左滑入）
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 50); // 轻微延迟，增强动画感

        // 3秒后渐隐+移除（2.5秒显示+0.5秒过渡）
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)'; // 滑出
            setTimeout(() => {
                notification.remove();
            }, 500); // 等待过渡完成
        }, 2500);
    }

    // ------------------- 配置面板（油猴菜单） -------------------
    GM_registerMenuCommand('设置GitHub镜像站', () => {
        const newMirror = prompt('请输入镜像站地址（如bgithub.xyz）：', mirror);
        if (newMirror) {
            // 清洗输入（去除http/https前缀）
            const cleanedMirror = newMirror.replace(/^https?:\/\//, '').trim();
            if (cleanedMirror) {
                GM_setValue('github_mirror', cleanedMirror);
                mirror = cleanedMirror; // 更新当前变量
                alert('镜像站设置保存成功！\n下次访问GitHub将使用：\n' + cleanedMirror);
            } else {
                alert('❌ 请输入有效的镜像站地址（无需协议前缀）！');
            }
        }
    });
})();
