# ☁ Serverless Cloud Notepad

[![cloudflare workers](https://badgen.net/badge/a/Cloudflare%20Workers/orange?icon=https%3A%2F%2Fworkers.cloudflare.com%2Fresources%2Flogo%2Flogo.svg&label=)](https://workers.cloudflare.com/)
![example workflow](https://github.com/fangyuan99/serverless-cloud-notepad/actions/workflows/deploy.yml/badge.svg)
[![jsdelivr](https://img.shields.io/badge/jsdelivr-cdn-brightgreen)](https://www.jsdelivr.com/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/dotzero/pad/blob/master/LICENSE)

English | [简体中文](./README-zh_CN.md)

Build for recording text or sharing between friends.

Powered by Cloudflare Workers、KV & Github Actions, Easy to deploy privately.

## ✨ Features

- ✏ No login/register required, start writing right away.
- 💾 Auto saving.
- ❌ No backend/server or database required.
- ⚡ High available & High performance in worldwide.
- 📦 One-click deployment for your own site.
- 🌍 i18n support for pathname.

## 🔨 Usage

- Enter `/` root path will generate a new note with random path.

- Enter `/any-custom-name-you-like` view/edit custom note.

- URL prefixes select the view mode (same underlying note):
  - `/<name>` or `/e/<name>` — editor (default)
  - `/m/<name>` — read-only Markdown rendering
  - `/r/<name>` — raw `text/plain` content, also usable from API/CLI

For password-protected notes, `/r/<name>` accepts the password via header or query string:

```bash
curl https://note.example.com/r/abc                                       # public
curl -H "Authorization: Bearer <password>" https://note.example.com/r/abc
curl "https://note.example.com/r/abc?password=<password>"
```

Try it out! [https://note.src.moe/example](https://note.src.moe/example)

> [!NOTE]
> According to Cloudflare's [free policy](https://developers.cloudflare.com/kv/platform/limits/), KV has a daily limit of 1,000 write/delete operations. It is highly recommended to deploy your own.

## 💻 Compatibility

- Modern browsers (both PC & Mobile)

## 📦 Deployment

- Create your Cloudflare API token in [here](https://dash.cloudflare.com/profile/api-tokens), choose `Cloudflare Workers Template` to complete create.
- Fork this repository and add 4 Secrets in `Settings -> Secrets and variables -> Actions`:
```bash
CLOUDFLARE_API_TOKEN # your Cloudflare API token

CLOUDFLARE_ACCOUNT_ID # your Cloudflare Account ID, find it at https://dash.cloudflare.com/?to=/:account/workers-and-pages (right sidebar)

SCN_SALT # whatever you like(for security reason)

SCN_SECRET # whatever you like(for security reason)
```
- Go to Actions tab, run `Deploy cloud-notepad` workflow.
- After a while, you will see the deployment-url in Annotations.
- CNAME deployment-url to your domain if you like.(optional)

## 👀 Roadmap

- [x] ~~password protection.~~
- [x] ~~support URL/Image (Markdown mode).~~
- [x] ~~read only mode (share link).~~
- [x] ~~show last modify date.~~

## ☕ Donate

maybe, buy me a coffee?

<a href="https://www.buymeacoffee.com/s0urce" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

[https://src.moe/donate](https://src.moe/donate)
