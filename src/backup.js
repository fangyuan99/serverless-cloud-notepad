import Cookies from 'cookie'
import dayjs from 'dayjs'
import { queryNote, checkAuth, returnJSON, parsePropfindResponse } from './helper'

export async function exportHandler(request) {
    const { path } = request.params
    const cookie = Cookies.parse(request.headers.get('Cookie') || '')
    const { value, metadata } = await queryNote(path)

    if (metadata.pw) {
        const valid = await checkAuth(cookie, path)
        if (!valid) return returnJSON(10002, 'Auth required')
    }

    return returnJSON(0, {
        version: 1,
        app: 'serverless-cloud-notepad',
        exportedAt: new Date().toISOString(),
        note: {
            path: decodeURIComponent(path),
            content: value,
            metadata: {
                mode: metadata.mode,
                updateAt: metadata.updateAt,
            }
        },
        encrypted: false,
    })
}

export async function importHandler(request) {
    const { path } = request.params
    const cookie = Cookies.parse(request.headers.get('Cookie') || '')
    const { metadata } = await queryNote(path)

    if (metadata.pw) {
        const valid = await checkAuth(cookie, path)
        if (!valid) return returnJSON(10002, 'Auth required')
    }

    const body = await request.json()
    if (!body.note || body.note.content === undefined) {
        return returnJSON(10005, 'Invalid import format')
    }

    await NOTES.put(path, body.note.content, {
        metadata: {
            ...metadata,
            mode: body.note.metadata?.mode || metadata.mode,
            updateAt: dayjs().unix(),
        },
    })

    return returnJSON(0)
}

export async function webdavProxyHandler(request) {
    const { path } = request.params
    const cookie = Cookies.parse(request.headers.get('Cookie') || '')
    const { metadata } = await queryNote(path)

    if (metadata.pw) {
        const valid = await checkAuth(cookie, path)
        if (!valid) return returnJSON(10002, 'Auth required')
    }

    const { action, webdav, filename, data } = await request.json()
    const { url, username, password, basePath } = webdav
    const authHeader = 'Basic ' + btoa(`${username}:${password}`)
    const baseUrl = url.replace(/\/+$/, '') + (basePath.startsWith('/') ? '' : '/') + basePath.replace(/\/+$/, '')
    const noteDir = `${baseUrl}/${encodeURIComponent(path)}`

    try {
        switch (action) {
            case 'test': {
                const resp = await fetch(baseUrl + '/', {
                    method: 'PROPFIND',
                    headers: { Authorization: authHeader, Depth: '0' },
                })
                if (resp.status === 401) return returnJSON(10006, 'Authentication failed')
                if (resp.ok || resp.status === 207) return returnJSON(0)
                return returnJSON(10006, `Connection failed: ${resp.status}`)
            }
            case 'mkdir': {
                await fetch(baseUrl + '/', {
                    method: 'MKCOL',
                    headers: { Authorization: authHeader },
                })
                await fetch(noteDir + '/', {
                    method: 'MKCOL',
                    headers: { Authorization: authHeader },
                })
                return returnJSON(0)
            }
            case 'backup': {
                const ts = dayjs().unix()
                const fname = `${path}_${ts}.json`
                const putUrl = noteDir + '/' + encodeURIComponent(fname)
                const resp = await fetch(putUrl, {
                    method: 'PUT',
                    headers: {
                        Authorization: authHeader,
                        'Content-Type': 'application/json; charset=utf-8',
                    },
                    body: data,
                })
                if (!resp.ok && resp.status !== 201 && resp.status !== 204) {
                    return returnJSON(10006, `WebDAV PUT failed: ${resp.status}`)
                }
                return returnJSON(0, { filename: fname })
            }
            case 'list': {
                const resp = await fetch(noteDir + '/', {
                    method: 'PROPFIND',
                    headers: {
                        Authorization: authHeader,
                        Depth: '1',
                        'Content-Type': 'application/xml; charset=utf-8',
                    },
                    body: '<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:getlastmodified/><d:getcontentlength/></d:prop></d:propfind>',
                })
                if (!resp.ok && resp.status !== 207) {
                    if (resp.status === 404) return returnJSON(0, { files: [] })
                    return returnJSON(10006, `WebDAV PROPFIND failed: ${resp.status}`)
                }
                const xml = await resp.text()
                const files = parsePropfindResponse(xml)
                return returnJSON(0, { files })
            }
            case 'restore': {
                const getUrl = noteDir + '/' + encodeURIComponent(filename)
                const resp = await fetch(getUrl, {
                    method: 'GET',
                    headers: { Authorization: authHeader },
                })
                if (!resp.ok) return returnJSON(10006, `WebDAV GET failed: ${resp.status}`)
                const content = await resp.text()
                return returnJSON(0, { content })
            }
            default:
                return returnJSON(10005, 'Unknown action')
        }
    } catch (err) {
        return returnJSON(10006, `WebDAV error: ${err.message}`)
    }
}
