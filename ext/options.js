document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('config-form');
    const storageApi = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
    const submitButton = form.querySelector('button[type="submit"]');

    const shortcutOptions = [
        { id: 'focus', keyField: 'focus-key', enabledField: 'focus-enabled', defaultKey: 'a' },
        { id: 'replay', keyField: 'replay-key', enabledField: 'replay-enabled', defaultKey: 'b' },
        { id: 'fullscreen', keyField: 'fullscreen-key', enabledField: 'fullscreen-enabled', defaultKey: 'g' },
        { id: 'refresh', keyField: 'refresh-key', enabledField: 'refresh-enabled', defaultKey: 'r' },
        { id: 'wide', keyField: 'wide-key', enabledField: 'wide-enabled', defaultKey: 't' },
        { id: 'toggleWindow', keyField: 'toggle-window-key', enabledField: 'toggle-window-enabled', defaultKey: 'v' },
    ];


    // 保存设置的函数
    async function saveSettings(config) {
        return new Promise((resolve) => {
            storageApi.local.set({ 'bilibili-shortcuts-config': config }, resolve);
        });
    }

    // 加载设置的函数
    async function loadSettings() {
        return new Promise((resolve) => {
            storageApi.local.get('bilibili-shortcuts-config', (result) => resolve(result['bilibili-shortcuts-config']));
        });
    }

    // 更新按钮状态的函数
    function updateButtonState(isError = false) {
        const message = isError ? '发生错误' : '保存成功'; // 根据状态选择信息
        const fontSize = '16px'; // 默认字体大小
        const defaultColor = submitButton.style.backgroundColor;
        submitButton.disabled = true;
        submitButton.textContent = message;
        submitButton.style.fontSize = fontSize;
        submitButton.style.backgroundColor = isError ? '#dc3545' : '#28a745'; // 根据状态选择背景颜色

        const displayTime = isError ? 1000 : 300; // 错误状态显示时间更长

        setTimeout(() => {
            submitButton.textContent = '保存设置';
            submitButton.style.fontSize = '';
            submitButton.disabled = false;
            submitButton.style.backgroundColor = defaultColor;
        }, displayTime);
    }

    function showMessage(message, duration = 3000) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        messageElement.style.display = 'block';

        setTimeout(() => {
            messageElement.style.display = 'none';
        }, duration);
    }

    const ruleoutKeys = ['q', 'w', 'e', 'm', '[', ']'];
    // 加载配置并设置表单值
    async function initializeForm() {
        const config = await loadSettings() || {};

        shortcutOptions.forEach(({ id, keyField, enabledField, defaultKey }) => {
            document.getElementById(keyField).value = config[id]?.key || defaultKey;
            document.getElementById(enabledField).checked = !!config[id]?.enabled;
        });
    }

    // 提交表单时保存设置
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // 防止默认提交行为

        const inputs = document.querySelectorAll('input[type="text"]');
        const inputSet = new Set(); // 用于存储已经输入的内容

        for (const input of inputs) {
            const key = input.value.toLowerCase();

            // 检查输入的有效性
            if (key.trim().length !== 1) {
                updateButtonState(true);
                showMessage('按键必须为单个字母, 不允许为空');
                input.value = ''; // 还原输入框
                return;
            } else if (ruleoutKeys.includes(key.toLowerCase())) {
                updateButtonState(true);
                showMessage('不能设置为q: 投币, w: 投币, e: 收藏, m: 静音, [: 上一个,  ]: 下一个,  这是网站默认使用快捷键, 请指定其他按键');
                input.value = ''; // 还原输入框
                return;
            } else if (!/^[a-zA-Z0-9\\\-=;,.'\/]$/.test(key)) { // 检查是否是允许的字符
                updateButtonState(true);
                showMessage('按键必须是英文字符、数字或符号\\ - = ; , . \' /, 不允许使用需要按住Shift键的字符');
                input.value = ''; // 还原输入框
                return;
            } else {
                input.value = key.trim(); // 去除空格
            }

            if (inputSet.has(key)) {
                updateButtonState(true);
                showMessage('不能设置相同的按键');
                input.value = ''; // 还原输入框
                return;
            }

            inputSet.add(key); // 将有效的输入添加到集合中
        }

        // 生成配置
        const config = {};
        shortcutOptions.forEach(({ id, keyField, enabledField }) => {
            config[id] = {
                key: document.getElementById(keyField).value,
                enabled: document.getElementById(enabledField).checked,
            };
        });

        try {
            await saveSettings(config);
            updateButtonState();
        } catch (error) {
            updateButtonState(true);
        }
    });


    // 初始化表单
    await initializeForm();
});
