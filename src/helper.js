import jwt from '@tsndr/cloudflare-worker-jwt'
import * as TEMPL from './template'
import { SALT, SECRET, SUPPORTED_LANG } from './constant'

// generate random string
export const genRandomStr = n => {
    // remove char that confuse user
    const charset = '2345679abcdefghjkmnpqrstwxyz'
    return Array(n)
        .join()
        .split(',')
        .map(() => charset.charAt(Math.floor(Math.random() * charset.length)))
        .join('')
}

export function returnPage(type, data) {
    return new Response(TEMPL[type](data), {
        headers: {
            'content-type': 'text/html;charset=UTF-8',
        },
    });
}

export function returnJSON(code, data, headers = {}) {
    const successTempl = {
        err: 0,
        msg: 'ok',
        ...data && { data },
    }
    const errTempl = {
        err: code,
        msg: JSON.stringify(data),
    }
    const ret = code ? errTempl : successTempl
    return new Response(JSON.stringify(ret), {
        headers: {
            'content-type': 'application/json;charset=UTF-8',
            ...headers,
        },
    })
}

export async function MD5(str) {
    const msgUint8 = new TextEncoder().encode(str)
    const hashBuffer = await crypto.subtle.digest('MD5', msgUint8) 
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function saltPw(password) {
    const hashPw = await MD5(password)
    return await MD5(`${hashPw}+${SALT}`)
}

export async function checkAuth(cookie, path) {
    const token = cookie[`auth_${path}`]
    if (token) {
        const valid = await jwt.verify(token, SECRET)
        if (valid) {
            const payload = jwt.decode(token)
            if (payload.path === path) {
                return true
            }
        }
    }
    return false
}

export async function checkAdminAuth(cookie) {
    const token = cookie['auth_admin']
    if (token) {
        const valid = await jwt.verify(token, SECRET)
        if (valid) {
            const payload = jwt.decode(token)
            if (payload.role === 'admin') {
                return true
            }
        }
    }
    return false
}

export async function checkPasswordFromRequest(request, storedPw) {
    if (!storedPw) return false

    let supplied = null

    const authz = request.headers.get('Authorization') || ''
    const match = authz.match(/^Bearer\s+(.+)$/i)
    if (match) supplied = match[1]

    if (!supplied) {
        const url = new URL(request.url)
        supplied = url.searchParams.get('password')
    }

    if (!supplied) return false
    const hashed = await saltPw(supplied)
    return hashed === storedPw
}

export async function queryNote(key) {
    const result = await NOTES.getWithMetadata(key)
    return {
        value: result.value || '',
        metadata: result.metadata || {},
    }
}

export function getI18n(request) {
    const DEFAULT_LANG = 'en'
    const al = request.headers.get('Accept-Language') || DEFAULT_LANG
    const acceptList = al.split(',').map(lang => lang.split(';')[0].trim())
    return acceptList.find(lang => Object.keys(SUPPORTED_LANG).includes(lang)) || DEFAULT_LANG
}

export function parsePropfindResponse(xmlText) {
    const results = []
    const responseRegex = /<(?:[a-zA-Z]+:)?response[^>]*>([\s\S]*?)<\/(?:[a-zA-Z]+:)?response>/gi
    let match
    while ((match = responseRegex.exec(xmlText)) !== null) {
        const block = match[1]
        const href = block.match(/<(?:[a-zA-Z]+:)?href[^>]*>([^<]+)<\/(?:[a-zA-Z]+:)?href>/i)?.[1] || ''
        const lastMod = block.match(/<(?:[a-zA-Z]+:)?getlastmodified[^>]*>([^<]+)/i)?.[1] || ''
        const size = block.match(/<(?:[a-zA-Z]+:)?getcontentlength[^>]*>([^<]+)/i)?.[1] || '0'
        if (href && href.endsWith('.json')) {
            const filename = decodeURIComponent(href.split('/').pop())
            results.push({ filename, lastModified: lastMod, size: parseInt(size) })
        }
    }
    return results.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
}
