import dayjs from 'dayjs'
import { Router } from 'itty-router'
import Cookies from 'cookie'
import jwt from '@tsndr/cloudflare-worker-jwt'
import { queryNote, MD5, checkAuth, checkAdminAuth, checkPasswordFromRequest, genRandomStr, returnPage, returnJSON, saltPw, getI18n } from './helper'
import { SECRET, ADMIN_PASSWORD } from './constant'
import { exportHandler, importHandler, webdavProxyHandler } from './backup'

// init
const router = Router()

router.get('/', ({ url }) => {
    const newHash = genRandomStr(3)
    // redirect to new page
    return Response.redirect(`${url}${newHash}`, 302)
})

router.get('/share/:md5', async (request) => {
    const lang = getI18n(request)
    const { md5 } = request.params
    const path = await SHARE.get(md5)

    if (!!path) {
        const { value, metadata } = await queryNote(path)

        return returnPage('Share', {
            lang,
            title: decodeURIComponent(path),
            content: value,
            ext: metadata,
        })
    }

    return returnPage('Page404', { lang, title: '404' })
})

// ==================== Admin Routes ====================

router.get('/admin', async (request) => {
    const lang = getI18n(request)
    const cookie = Cookies.parse(request.headers.get('Cookie') || '')
    const valid = await checkAdminAuth(cookie)
    if (valid) {
        return returnPage('AdminPage', { lang })
    }
    return returnPage('AdminLogin', { lang })
})

router.post('/admin/auth', async (request) => {
    if (request.headers.get('Content-Type') === 'application/json') {
        const { passwd } = await request.json()
        if (passwd && ADMIN_PASSWORD && passwd === ADMIN_PASSWORD) {
            const token = await jwt.sign({ role: 'admin' }, SECRET)
            return returnJSON(0, { ok: true }, {
                'Set-Cookie': Cookies.serialize('auth_admin', token, {
                    path: '/',
                    expires: dayjs().add(7, 'day').toDate(),
                    httpOnly: true,
                })
            })
        }
    }
    return returnJSON(10002, 'Admin auth failed!')
})

// Admin API middleware helper
async function requireAdmin(request) {
    const cookie = Cookies.parse(request.headers.get('Cookie') || '')
    return await checkAdminAuth(cookie)
}

router.get('/admin/api/notes', async (request) => {
    if (!await requireAdmin(request)) return returnJSON(10002, 'Unauthorized')

    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor') || undefined
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 1000)
    const isCount = url.searchParams.get('count') === 'true'

    if (isCount) {
        // Count all notes by iterating through all pages
        let total = 0
        let c = undefined
        do {
            const page = await NOTES.list({ cursor: c, limit: 1000 })
            total += page.keys.length
            c = page.list_complete ? undefined : page.cursor
        } while (c)
        return returnJSON(0, { total })
    }

    const result = await NOTES.list({ cursor, limit })
    return returnJSON(0, {
        keys: result.keys.map(k => ({
            name: k.name,
            metadata: k.metadata || {},
        })),
        cursor: result.cursor,
        list_complete: result.list_complete,
    })
})

router.get('/admin/api/notes/:path/preview', async (request) => {
    if (!await requireAdmin(request)) return returnJSON(10002, 'Unauthorized')

    const { path } = request.params
    const { value, metadata } = await queryNote(path)
    return returnJSON(0, {
        content: value,
        metadata,
    })
})

router.delete('/admin/api/notes/:path', async (request) => {
    if (!await requireAdmin(request)) return returnJSON(10002, 'Unauthorized')

    const { path } = request.params
    const { metadata } = await queryNote(path)

    // Clean up share mapping if shared
    if (metadata.share) {
        const md5 = await MD5(path)
        await SHARE.delete(md5)
    }

    await NOTES.delete(path)
    return returnJSON(0)
})

router.post('/admin/api/notes/delete-batch', async (request) => {
    if (!await requireAdmin(request)) return returnJSON(10002, 'Unauthorized')

    if (request.headers.get('Content-Type') !== 'application/json') {
        return returnJSON(10005, 'Invalid content type')
    }

    const { paths } = await request.json()
    if (!Array.isArray(paths) || paths.length === 0) {
        return returnJSON(10005, 'Invalid paths')
    }

    // Cap at 100 per request
    const toDelete = paths.slice(0, 100)
    let deleted = 0
    const errors = []

    for (const path of toDelete) {
        try {
            const { metadata } = await queryNote(path)
            if (metadata.share) {
                const md5 = await MD5(path)
                await SHARE.delete(md5)
            }
            await NOTES.delete(path)
            deleted++
        } catch (err) {
            errors.push({ path, error: err.message })
        }
    }

    return returnJSON(0, { deleted, errors, total: toDelete.length })
})

router.get('/admin/api/export-all', async (request) => {
    if (!await requireAdmin(request)) return returnJSON(10002, 'Unauthorized')

    const allNotes = []
    let cursor = undefined

    do {
        const page = await NOTES.list({ cursor, limit: 1000 })
        for (const key of page.keys) {
            const value = await NOTES.get(key.name)
            allNotes.push({
                path: key.name,
                content: value || '',
                metadata: key.metadata || {},
            })
        }
        cursor = page.list_complete ? undefined : page.cursor
    } while (cursor)

    return returnJSON(0, {
        version: 1,
        app: 'serverless-cloud-notepad',
        exportedAt: new Date().toISOString(),
        notes: allNotes,
        encrypted: false,
    })
})

router.post('/admin/api/import-all', async (request) => {
    if (!await requireAdmin(request)) return returnJSON(10002, 'Unauthorized')

    if (request.headers.get('Content-Type') !== 'application/json') {
        return returnJSON(10005, 'Invalid content type')
    }

    const body = await request.json()
    const { notes } = body

    if (!Array.isArray(notes) || notes.length === 0) {
        return returnJSON(10005, 'Invalid import data')
    }

    let imported = 0
    const errors = []

    for (const note of notes) {
        try {
            if (!note.path) continue
            const metadata = note.metadata || {}
            await NOTES.put(note.path, note.content || '', { metadata })

            // Restore share mapping if shared
            if (metadata.share) {
                const md5 = await MD5(note.path)
                await SHARE.put(md5, note.path)
            }
            imported++
        } catch (err) {
            errors.push({ path: note.path, error: err.message })
        }
    }

    return returnJSON(0, { imported, errors, total: notes.length })
})

// ==================== Note Routes ====================

async function editHandler(request) {
    const lang = getI18n(request)

    const { path } = request.params
    const title = decodeURIComponent(path)

    const cookie = Cookies.parse(request.headers.get('Cookie') || '')

    const { value, metadata } = await queryNote(path)

    if (!metadata.pw) {
        return returnPage('Edit', {
            lang,
            title,
            content: value,
            ext: metadata,
        })
    }

    const valid = await checkAuth(cookie, path)
    if (valid) {
        return returnPage('Edit', {
            lang,
            title,
            content: value,
            ext: metadata,
        })
    }

    return returnPage('NeedPasswd', { lang, title })
}

router.get('/r/:path', async (request) => {
    const { path } = request.params
    const { value, metadata } = await queryNote(path)

    if (!value && !metadata.pw) {
        return new Response('Not Found', {
            status: 404,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
        })
    }

    if (metadata.pw) {
        const cookie = Cookies.parse(request.headers.get('Cookie') || '')
        const cookieValid = await checkAuth(cookie, path)
        const passwordValid = cookieValid || await checkPasswordFromRequest(request, metadata.pw)
        if (!passwordValid) {
            return new Response('Unauthorized', {
                status: 401,
                headers: {
                    'content-type': 'text/plain; charset=utf-8',
                    'WWW-Authenticate': 'Bearer realm="note"',
                },
            })
        }
    }

    return new Response(value, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-store',
        },
    })
})

router.get('/m/:path', async (request) => {
    const lang = getI18n(request)
    const { path } = request.params
    const title = decodeURIComponent(path)

    const cookie = Cookies.parse(request.headers.get('Cookie') || '')
    const { value, metadata } = await queryNote(path)

    if (metadata.pw) {
        const cookieValid = await checkAuth(cookie, path)
        const passwordValid = cookieValid || await checkPasswordFromRequest(request, metadata.pw)
        if (!passwordValid) {
            return returnPage('NeedPasswd', { lang, title })
        }
    }

    return returnPage('Markdown', {
        lang,
        title,
        content: value,
        ext: { ...metadata, mode: 'md' },
    })
})

router.get('/:path/export', exportHandler)
router.post('/:path/import', importHandler)
router.post('/:path/webdav', webdavProxyHandler)

router.get('/e/:path', editHandler)
router.get('/:path', editHandler)

router.post('/:path/auth', async request => {
    const { path } = request.params
    if (request.headers.get('Content-Type') === 'application/json') {
        const { passwd } = await request.json()

        const { metadata } = await queryNote(path)

        if (metadata.pw) {
            const storePw = await saltPw(passwd)

            if (metadata.pw === storePw) {
                const token = await jwt.sign({ path }, SECRET)
                return returnJSON(0, {
                    refresh: true,
                }, {
                    'Set-Cookie': Cookies.serialize(`auth_${path}`, token, {
                        path: '/',
                        expires: dayjs().add(7, 'day').toDate(),
                        httpOnly: true,
                    })
                })
            }
        }
    }

    return returnJSON(10002, 'Password auth failed!')
})

router.post('/:path/pw', async request => {
    const { path } = request.params
    if (request.headers.get('Content-Type') === 'application/json') {
        const cookie = Cookies.parse(request.headers.get('Cookie') || '')
        const { passwd } = await request.json()

        const { value, metadata } = await queryNote(path)
        const valid = await checkAuth(cookie, path)

        if (!metadata.pw || valid) {
            const pw = passwd ? await saltPw(passwd) : undefined
            try {
                await NOTES.put(path, value, {
                    metadata: {
                        ...metadata,
                        pw,
                    },
                })

                return returnJSON(0, null, {
                    'Set-Cookie': Cookies.serialize(`auth_${path}`, '', {
                        path: '/',
                        expires: dayjs().subtract(100, 'day').toDate(),
                        httpOnly: true,
                    })
                })
            } catch (error) {
                console.error(error)
            }
        }

        return returnJSON(10003, 'Password setting failed!')
    }
})

router.post('/:path/setting', async request => {
    const { path } = request.params
    if (request.headers.get('Content-Type') === 'application/json') {
        const cookie = Cookies.parse(request.headers.get('Cookie') || '')
        const { mode, share } = await request.json()

        const { value, metadata } = await queryNote(path)
        const valid = await checkAuth(cookie, path)

        if (!metadata.pw || valid) {
            try {
                await NOTES.put(path, value, {
                    metadata: {
                        ...metadata,
                        ...mode !== undefined && { mode },
                        ...share !== undefined && { share },
                    },
                })

                const md5 = await MD5(path)
                if (share) {
                    await SHARE.put(md5, path)
                    return returnJSON(0, md5)
                }
                if (share === false) {
                    await SHARE.delete(md5)
                }


                return returnJSON(0)
            } catch (error) {
                console.error(error)
            }
        }

        return returnJSON(10004, 'Update Setting failed!')
    }
})

router.post('/:path', async request => {
    const { path } = request.params
    const { value, metadata } = await queryNote(path)

    const cookie = Cookies.parse(request.headers.get('Cookie') || '')
    const valid = await checkAuth(cookie, path)

    if (!metadata.pw || valid) {
        // OK
    } else {
        return returnJSON(10002, 'Password auth failed! Try refreshing this page if you had just set a password.')
    }

    const formData = await request.formData();
    const content = formData.get('t')

    try {

        if (content?.trim()){
            // 有值修改
            await NOTES.put(path, content, {
                metadata: {
                    ...metadata,
                    updateAt: dayjs().unix(),
                },
            })
        }else{
            // 无值删除
            await NOTES.delete(path)
        }

        return returnJSON(0)
    } catch (error) {
        console.error(error)
    }

    return returnJSON(10001, 'KV insert fail!')
})

router.all('*', (request) => {
    const lang = getI18n(request)
    returnPage('Page404', { lang, title: '404' })
})

addEventListener('fetch', event => {
    event.respondWith(router.handle(event.request))
})