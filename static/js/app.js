
const DEFAULT_LANG = 'en'
const SUPPORTED_LANG = {
    'en': {
        err: 'Error',
        pepw: 'Please enter password.',
        pwcnbe: 'Password is empty!',
        enpw: 'Enter a new password(Keeping it empty will remove the current password)',
        pwss: 'Password set successfully.',
        pwrs: 'Password removed successfully.',
        cpys: 'Copied!',
        exportSuccess: 'Exported successfully',
        importSuccess: 'Imported successfully, reloading...',
        backupSuccess: 'Backup successful',
        restoreSuccess: 'Restored successfully, reloading...',
        connSuccess: 'Connection successful',
        connFailed: 'Connection failed',
        invalidFile: 'Invalid backup file',
        wrongPassword: 'Wrong password or corrupted file',
        confirmRestore: 'Restore this backup? Current content will be overwritten.',
        noBackups: 'No backups yet',
        encryptPwRequired: 'Please enter encryption password',
        webdavNotConfigured: 'Please configure WebDAV settings first',
        configSaved: 'Config saved',
        restore: 'Restore',
    },
    'zh': {
        err: '出错了',
        pepw: '请输入密码',
        pwcnbe: '密码不能为空！',
        enpw: '输入新密码（留空可清除当前密码）',
        pwss: '密码设置成功！',
        pwrs: '密码清除成功！',
        cpys: '已复制',
        exportSuccess: '导出成功',
        importSuccess: '导入成功，正在刷新...',
        backupSuccess: '备份成功',
        restoreSuccess: '恢复成功，正在刷新...',
        connSuccess: '连接成功',
        connFailed: '连接失败',
        invalidFile: '无效的备份文件',
        wrongPassword: '密码错误或文件损坏',
        confirmRestore: '确认恢复？当前内容将被覆盖。',
        noBackups: '暂无备份',
        encryptPwRequired: '请输入加密密码',
        webdavNotConfigured: '请先配置 WebDAV',
        configSaved: '配置已保存',
        restore: '恢复',
    }
}

const getI18n = key => {
    const userLang = (navigator.language || navigator.userLanguage || DEFAULT_LANG).split('-')[0]
    const targetLang = Object.keys(SUPPORTED_LANG).find(l => l === userLang) || DEFAULT_LANG
    return SUPPORTED_LANG[targetLang][key]
}

const errHandle = (err) => {
    alert(`${getI18n('err')}: ${err}`)
}

const throttle = (func, delay) => {
    let tid = null

    return (...arg) => {
        if (tid) return;

        tid = setTimeout(() => {
            func(...arg)
            tid = null
        }, delay)
    }
}

const passwdPrompt = () => {
    const passwd = window.prompt(getI18n('pepw'))
    if (passwd == null) return;

    if (!passwd.trim()) {
        alert(getI18n('pwcnbe'))
    }
    const path = location.pathname
    window.fetch(`${path}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            passwd,
        }),
    })
        .then(res => res.json())
        .then(res => {
            if (res.err !== 0) {
                return errHandle(res.msg)
            }
            if (res.data.refresh) {
                window.location.reload()
            }
        })
        .catch(err => errHandle(err))
}

const renderPlain = (node, text) => {
    if (node) {
        node.innerHTML = DOMPurify.sanitize(text)
    }
}

const renderMarkdown = (node, text) => {
    if (node) {
        const parseText = marked.parse(text)
        node.innerHTML = DOMPurify.sanitize(parseText)
    }
}

async function deriveKey(password, salt) {
    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

async function encryptContent(content, password) {
    const enc = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(password, salt)
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(content))
    const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length)
    return btoa(String.fromCharCode(...combined))
}

async function decryptContent(base64Data, password) {
    const binary = atob(base64Data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const salt = bytes.slice(0, 16)
    const iv = bytes.slice(16, 28)
    const ciphertext = bytes.slice(28)
    const key = await deriveKey(password, salt)
    const dec = new TextDecoder()
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return dec.decode(plaintext)
}

function getWebdavConfig() {
    try { return JSON.parse(localStorage.getItem('webdav_config')) || {} } catch { return {} }
}

function saveWebdavConfig(config) {
    localStorage.setItem('webdav_config', JSON.stringify(config))
}

function getNotePath() {
    const p = window.location.pathname
    return p.startsWith('/e/') ? p.slice(3) : p.slice(1)
}

function escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
}

window.addEventListener('DOMContentLoaded', function () {
    const $textarea = document.querySelector('#contents')
    const $loading = document.querySelector('#loading')
    const $pwBtn = document.querySelector('.opt-pw')
    const $modeBtn = document.querySelector('.opt-mode > input')
    const $shareBtn = document.querySelector('.opt-share > input')
    const $previewPlain = document.querySelector('#preview-plain')
    const $previewMd = document.querySelector('#preview-md')
    const $shareModal = document.querySelector('.share-modal')
    const $closeBtn = document.querySelector('.share-modal .close-btn')
    const $copyBtn = document.querySelector('.share-modal .opt-button')
    const $shareInput = document.querySelector('.share-modal input')

    renderPlain($previewPlain, $textarea.value)
    renderMarkdown($previewMd, $textarea.value)

    if ($textarea) {
        $textarea.oninput = throttle(function () {
            renderMarkdown($previewMd, $textarea.value)

            $loading.style.display = 'inline-block'
            const data = {
                t: $textarea.value,
            }

            window.fetch('', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        errHandle(res.msg)
                    }
                })
                .catch(err => errHandle(err))
                .finally(() => {
                    $loading.style.display = 'none'
                })
        }, 1000)
    }

    if ($pwBtn) {
        $pwBtn.onclick = function () {
            const passwd = window.prompt(getI18n('enpw'))
            if (passwd == null) return;

            const path = window.location.pathname
            window.fetch(`${path}/pw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    passwd: passwd.trim(),
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }
                    alert(passwd ? getI18n('pwss') : getI18n('pwrs'))
                })
                .catch(err => errHandle(err))
        }
    }

    if ($modeBtn) {
        $modeBtn.onclick = function (e) {
            const isMd = e.target.checked
            const path = window.location.pathname
            window.fetch(`${path}/setting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mode: isMd ? 'md' : 'plain',
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }

                    window.location.reload()
                })
                .catch(err => errHandle(err))
        }
    }

    if ($shareBtn) {
        $shareBtn.onclick = function (e) {
            const isShare = e.target.checked
            const path = window.location.pathname
            window.fetch(`${path}/setting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    share: isShare,
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }

                    if (isShare) {
                        const origin = window.location.origin
                        const url = `${origin}/share/${res.data}`
                        // show modal
                        $shareInput.value = url
                        $shareModal.style.display = 'block'
                    }
                })
                .catch(err => errHandle(err))
        }
    }

    if ($shareModal) {
        $closeBtn.onclick = function () {
            $shareModal.style.display = 'none'

        }
        $copyBtn.onclick = function () {
            clipboardCopy($shareInput.value)
            const originText = $copyBtn.innerHTML
            const originColor = $copyBtn.style.background
            $copyBtn.innerHTML = getI18n('cpys')
            $copyBtn.style.background = 'orange'
            window.setTimeout(() => {
                $shareModal.style.display = 'none'
                $copyBtn.innerHTML = originText
                $copyBtn.style.background = originColor
            }, 1500)
        }
    }

    // Backup drawer
    const $backupBtn = document.querySelector('.opt-backup')
    const $drawer = document.querySelector('.backup-drawer')
    const $drawerMask = document.querySelector('.backup-drawer-mask')
    const $drawerClose = document.querySelector('.drawer-close')

    if ($backupBtn && $drawer) {
        const openDrawer = () => {
            $drawer.classList.add('open')
            $drawerMask.classList.add('open')
            loadWebdavConfigToForm()
            refreshBackupList()
        }
        const closeDrawer = () => {
            $drawer.classList.remove('open')
            $drawerMask.classList.remove('open')
        }

        $backupBtn.onclick = openDrawer
        $drawerClose.onclick = closeDrawer
        $drawerMask.onclick = closeDrawer

        // Export encrypt toggle
        const $exportEncryptCheck = $drawer.querySelector('.export-encrypt-check')
        const $exportPwRow = $drawer.querySelector('.export-pw-row')
        const $exportPwInput = $drawer.querySelector('.export-pw-input')
        $exportEncryptCheck.onchange = () => {
            $exportPwRow.style.display = $exportEncryptCheck.checked ? 'flex' : 'none'
        }

        // Backup encrypt toggle
        const $backupEncryptCheck = $drawer.querySelector('.backup-encrypt-check')
        const $backupPwRow = $drawer.querySelector('.backup-pw-row')
        const $backupPwInput = $drawer.querySelector('.backup-pw-input')
        $backupEncryptCheck.onchange = () => {
            $backupPwRow.style.display = $backupEncryptCheck.checked ? 'flex' : 'none'
        }

        // Local export
        $drawer.querySelector('.export-btn').onclick = async function () {
            const path = getNotePath()
            try {
                const res = await window.fetch(`/${path}/export`).then(r => r.json())
                if (res.err !== 0) return errHandle(res.msg)
                const exportData = res.data
                if ($exportEncryptCheck.checked) {
                    const pw = $exportPwInput.value.trim()
                    if (!pw) return alert(getI18n('encryptPwRequired'))
                    exportData.note.content = await encryptContent(exportData.note.content, pw)
                    exportData.encrypted = true
                }
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `${decodeURIComponent(path)}_${Date.now()}.json`
                a.click()
                URL.revokeObjectURL(a.href)
            } catch (err) { errHandle(err) }
        }

        // Local import
        const $importFileInput = $drawer.querySelector('.import-file-input')
        const $importPwRow = $drawer.querySelector('.import-pw-row')
        const $importPwInput = $drawer.querySelector('.import-pw-input')
        const $importDecryptBtn = $drawer.querySelector('.import-decrypt-btn')
        let pendingImportData = null

        $drawer.querySelector('.import-btn').onclick = () => $importFileInput.click()

        $importFileInput.onchange = async function () {
            const file = this.files[0]
            if (!file) return
            try {
                const text = await file.text()
                const data = JSON.parse(text)
                if (!data.note || data.note.content === undefined) {
                    return alert(getI18n('invalidFile'))
                }
                if (data.encrypted) {
                    pendingImportData = data
                    $importPwRow.style.display = 'flex'
                    $importPwInput.focus()
                } else {
                    await doImport(data)
                }
            } catch (err) {
                alert(getI18n('invalidFile'))
            }
            this.value = ''
        }

        $importDecryptBtn.onclick = async function () {
            if (!pendingImportData) return
            const pw = $importPwInput.value.trim()
            if (!pw) return alert(getI18n('encryptPwRequired'))
            try {
                pendingImportData.note.content = await decryptContent(pendingImportData.note.content, pw)
                pendingImportData.encrypted = false
                await doImport(pendingImportData)
            } catch {
                alert(getI18n('wrongPassword'))
            }
        }

        async function doImport(data) {
            const path = getNotePath()
            const res = await window.fetch(`/${path}/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(r => r.json())
            if (res.err !== 0) return errHandle(res.msg)
            alert(getI18n('importSuccess'))
            $importPwRow.style.display = 'none'
            pendingImportData = null
            window.location.reload()
        }

        // WebDAV config
        const $webdavUrl = $drawer.querySelector('.webdav-url')
        const $webdavUser = $drawer.querySelector('.webdav-username')
        const $webdavPass = $drawer.querySelector('.webdav-password')
        const $webdavPath = $drawer.querySelector('.webdav-basepath')
        const $webdavStatus = $drawer.querySelector('.webdav-status')

        function loadWebdavConfigToForm() {
            const cfg = getWebdavConfig()
            if (cfg.url) $webdavUrl.value = cfg.url
            if (cfg.username) $webdavUser.value = cfg.username
            if (cfg.password) $webdavPass.value = cfg.password
            if (cfg.basePath) $webdavPath.value = cfg.basePath
        }

        function readWebdavForm() {
            return {
                url: $webdavUrl.value.trim(),
                username: $webdavUser.value.trim(),
                password: $webdavPass.value,
                basePath: $webdavPath.value.trim() || '/cloud-notepad/',
            }
        }

        $drawer.querySelector('.webdav-save-btn').onclick = () => {
            saveWebdavConfig(readWebdavForm())
            $webdavStatus.textContent = getI18n('configSaved')
            $webdavStatus.style.color = '#52c41a'
        }

        $drawer.querySelector('.webdav-test-btn').onclick = async function () {
            const webdav = readWebdavForm()
            if (!webdav.url) return alert(getI18n('webdavNotConfigured'))
            $webdavStatus.textContent = '...'
            $webdavStatus.style.color = '#999'
            try {
                const path = getNotePath()
                const res = await window.fetch(`/${path}/webdav`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'test', webdav }),
                }).then(r => r.json())
                if (res.err === 0) {
                    $webdavStatus.textContent = getI18n('connSuccess')
                    $webdavStatus.style.color = '#52c41a'
                } else {
                    $webdavStatus.textContent = getI18n('connFailed') + ': ' + res.msg
                    $webdavStatus.style.color = '#ff4d4f'
                }
            } catch (err) {
                $webdavStatus.textContent = getI18n('connFailed')
                $webdavStatus.style.color = '#ff4d4f'
            }
        }

        // WebDAV backup
        $drawer.querySelector('.webdav-backup-btn').onclick = async function () {
            const webdav = readWebdavForm()
            if (!webdav.url) return alert(getI18n('webdavNotConfigured'))
            const path = getNotePath()
            this.disabled = true
            try {
                const res = await window.fetch(`/${path}/export`).then(r => r.json())
                if (res.err !== 0) { this.disabled = false; return errHandle(res.msg) }
                const exportData = res.data
                if ($backupEncryptCheck.checked) {
                    const pw = $backupPwInput.value.trim()
                    if (!pw) { this.disabled = false; return alert(getI18n('encryptPwRequired')) }
                    exportData.note.content = await encryptContent(exportData.note.content, pw)
                    exportData.encrypted = true
                }
                await window.fetch(`/${path}/webdav`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'mkdir', webdav }),
                })
                const backupRes = await window.fetch(`/${path}/webdav`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'backup', webdav, data: JSON.stringify(exportData) }),
                }).then(r => r.json())
                if (backupRes.err !== 0) { this.disabled = false; return errHandle(backupRes.msg) }
                alert(getI18n('backupSuccess'))
                refreshBackupList()
            } catch (err) { errHandle(err) }
            this.disabled = false
        }

        // WebDAV backup list
        const $backupList = $drawer.querySelector('.backup-list')

        async function refreshBackupList() {
            const webdav = readWebdavForm()
            if (!webdav.url) return
            const path = getNotePath()
            try {
                const res = await window.fetch(`/${path}/webdav`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'list', webdav }),
                }).then(r => r.json())
                if (res.err !== 0 || !res.data?.files?.length) {
                    $backupList.innerHTML = `<div class="backup-list-empty">${getI18n('noBackups')}</div>`
                    return
                }
                $backupList.innerHTML = res.data.files.map(f => {
                    const safeName = escapeHtml(f.filename)
                    const date = f.lastModified ? new Date(f.lastModified).toLocaleString() : ''
                    const sizeKB = f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''
                    return `<div class="backup-item" data-filename="${safeName}">
                        <div class="backup-item-info">
                            <div class="backup-item-name">${safeName}</div>
                            <div class="backup-item-meta">${date} ${sizeKB}</div>
                        </div>
                        <button class="drawer-btn backup-restore-btn">${getI18n('restore')}</button>
                    </div>`
                }).join('')
                $backupList.querySelectorAll('.backup-restore-btn').forEach(btn => {
                    btn.onclick = () => restoreBackup(btn.closest('.backup-item').dataset.filename)
                })
            } catch { }
        }

        async function restoreBackup(filename) {
            if (!confirm(getI18n('confirmRestore'))) return
            const webdav = readWebdavForm()
            const path = getNotePath()
            try {
                const res = await window.fetch(`/${path}/webdav`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'restore', webdav, filename }),
                }).then(r => r.json())
                if (res.err !== 0) return errHandle(res.msg)
                const data = JSON.parse(res.data.content)
                if (data.encrypted) {
                    const pw = prompt(getI18n('encryptPwRequired'))
                    if (!pw) return
                    try {
                        data.note.content = await decryptContent(data.note.content, pw)
                        data.encrypted = false
                    } catch {
                        return alert(getI18n('wrongPassword'))
                    }
                }
                await doImport(data)
            } catch (err) { errHandle(err) }
        }
    }

})
