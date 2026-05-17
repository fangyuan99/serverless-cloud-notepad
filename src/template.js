import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CDN_PREFIX, SUPPORTED_LANG } from "./constant";

dayjs.extend(relativeTime);

const SWITCHER = (text, open, className = "") => `
<span class="opt-desc">${text}</span>
<label class="opt-switcher ${className}">
  <input type="checkbox" ${open ? "checked" : ""}>
  <span class="slider round"></span>
</label>
`;
const FOOTER = ({ lang, isEdit, updateAt, pw, mode, share }) => `
    <div class="footer">
        ${
          isEdit
            ? `
            <div class="opt">
                <button class="opt-button opt-pw">${pw ? SUPPORTED_LANG[lang].changePW : SUPPORTED_LANG[lang].setPW}</button>
                ${SWITCHER("Markdown", mode === "md", "opt-mode")}
                ${SWITCHER(SUPPORTED_LANG[lang].share, share, "opt-share")}
                <button class="opt-button opt-backup">${SUPPORTED_LANG[lang].backup}</button>
            </div>
            `
            : ""
        }
        <a class="github-link" title="Github" target="_blank" href="https://github.com/fangyuan99/serverless-cloud-notepad" rel="noreferrer">
            <svg viewBox="64 64 896 896" focusable="false" data-icon="github" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9a127.5 127.5 0 0138.1 91v112.5c.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z"></path></svg>
        </a>
        ${updateAt ? `<span class="last-modified">${SUPPORTED_LANG[lang].lastModified} ${dayjs.unix(updateAt).fromNow()}</span>` : ""}
    </div>
`;
const BACKUP_DRAWER = (lang) => `
<div class="backup-drawer-mask"></div>
<div class="backup-drawer">
    <div class="drawer-header">
        <h3>${SUPPORTED_LANG[lang].backup}</h3>
        <span class="drawer-close">x</span>
    </div>
    <div class="drawer-section">
        <h4>${SUPPORTED_LANG[lang].localBackup}</h4>
        <div class="drawer-row">
            <label class="drawer-checkbox-label">
                <input type="checkbox" class="export-encrypt-check" />
                <span>${SUPPORTED_LANG[lang].encrypt}</span>
            </label>
        </div>
        <div class="drawer-row export-pw-row" style="display:none">
            <input type="password" class="drawer-input export-pw-input" placeholder="${SUPPORTED_LANG[lang].encryptPw}" />
        </div>
        <div class="drawer-row">
            <button class="drawer-btn export-btn">${SUPPORTED_LANG[lang].export_}</button>
            <button class="drawer-btn import-btn">${SUPPORTED_LANG[lang].import_}</button>
            <input type="file" class="import-file-input" accept=".json" style="display:none" />
        </div>
        <div class="drawer-row import-pw-row" style="display:none">
            <input type="password" class="drawer-input import-pw-input" placeholder="${SUPPORTED_LANG[lang].encryptPw}" />
            <button class="drawer-btn import-decrypt-btn">${SUPPORTED_LANG[lang].restore}</button>
        </div>
    </div>
    <div class="drawer-section">
        <h4>${SUPPORTED_LANG[lang].webdavConfig}</h4>
        <div class="drawer-row">
            <input type="text" class="drawer-input webdav-url" placeholder="${SUPPORTED_LANG[lang].webdavUrl}" />
        </div>
        <div class="drawer-row">
            <input type="text" class="drawer-input webdav-username" placeholder="${SUPPORTED_LANG[lang].username}" />
        </div>
        <div class="drawer-row">
            <input type="password" class="drawer-input webdav-password" placeholder="${SUPPORTED_LANG[lang].password}" />
        </div>
        <div class="drawer-row">
            <input type="text" class="drawer-input webdav-basepath" placeholder="${SUPPORTED_LANG[lang].basePath}" value="/cloud-notepad/" />
        </div>
        <div class="drawer-row">
            <button class="drawer-btn webdav-save-btn">${SUPPORTED_LANG[lang].saveConfig}</button>
            <button class="drawer-btn webdav-test-btn">${SUPPORTED_LANG[lang].testConn}</button>
        </div>
        <div class="drawer-row webdav-status"></div>
    </div>
    <div class="drawer-section">
        <h4>${SUPPORTED_LANG[lang].backupNow}</h4>
        <div class="drawer-row">
            <label class="drawer-checkbox-label">
                <input type="checkbox" class="backup-encrypt-check" />
                <span>${SUPPORTED_LANG[lang].encrypt}</span>
            </label>
        </div>
        <div class="drawer-row backup-pw-row" style="display:none">
            <input type="password" class="drawer-input backup-pw-input" placeholder="${SUPPORTED_LANG[lang].encryptPw}" />
        </div>
        <div class="drawer-row">
            <button class="drawer-btn webdav-backup-btn">${SUPPORTED_LANG[lang].backupNow}</button>
        </div>
    </div>
    <div class="drawer-section">
        <h4>${SUPPORTED_LANG[lang].backupList}</h4>
        <div class="backup-list">
            <div class="backup-list-empty">${SUPPORTED_LANG[lang].noBackups}</div>
        </div>
    </div>
</div>
`;
const MODAL = (lang) => `
<div class="modal share-modal">
    <div class="modal-mask"></div>
    <div class="modal-content">
        <span class="close-btn">x</span>
        <div class="modal-body">
            <input type="text" readonly value="" />
            <button class="opt-button">${SUPPORTED_LANG[lang].copy}</button>
        </div>
    </div>
</div>
`;
const HTML = ({
  lang,
  title,
  content,
  ext = {},
  tips,
  isEdit,
  showPwPrompt,
}) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Cloud Notepad</title>
    <link href="${CDN_PREFIX}/favicon.ico" rel="shortcut icon" type="image/ico" />
    <link href="${CDN_PREFIX}/css/app.min.css" rel="stylesheet" media="screen" />
</head>
<body>
    <div class="note-container">
        <div class="stack">
            <div class="layer_1">
                <div class="layer_2">
                    <div class="layer_3">
                        ${tips ? `<div class="tips">${tips}</div>` : ""}
                        <textarea id="contents" class="contents ${isEdit ? "" : "hide"}" spellcheck="true" placeholder="${SUPPORTED_LANG[lang].emptyPH}">${content}</textarea>
                        ${isEdit && ext.mode === "md" ? '<div class="divide-line"></div>' : ""}
                        ${tips || (isEdit && ext.mode !== "md") ? "" : `<div id="preview-${ext.mode || "plain"}" class="contents"></div>`}
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div id="loading"></div>
    ${MODAL(lang)}
    ${isEdit ? BACKUP_DRAWER(lang) : ""}
    ${FOOTER({ ...ext, isEdit, lang })}
    ${ext.mode === "md" || ext.share ? `<script src="${CDN_PREFIX}/js/purify.min.js"></script>` : ""}
    ${ext.mode === "md" ? `<script src="${CDN_PREFIX}/js/marked.min.js"></script>` : ""}
    <script src="${CDN_PREFIX}/js/clip.min.js"></script>
    <script src="${CDN_PREFIX}/js/app.min.js"></script>
    ${showPwPrompt ? "<script>passwdPrompt()</script>" : ""}
</body>
</html>
`;

export const Edit = (data) => HTML({ isEdit: true, ...data });
export const Share = (data) => HTML(data);
export const Markdown = (data) => HTML(data);
export const NeedPasswd = (data) =>
  HTML({
    tips: SUPPORTED_LANG[data.lang].tipEncrypt,
    showPwPrompt: true,
    ...data,
  });
export const Page404 = (data) =>
  HTML({ tips: SUPPORTED_LANG[data.lang].tip404, ...data });

export const AdminLogin = ({ lang }) => {
  const L = SUPPORTED_LANG[lang];
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${L.adminLogin} — Cloud Notepad</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#ebeef2;font:normal 14px Arial,Helvetica,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.login-card{background:#fff;border:1px solid #dcdde1;border-radius:6px;box-shadow:0 2px 12px rgba(0,0,0,0.08);padding:40px 32px;width:100%;max-width:380px}
.login-card h2{color:#3a3b3c;font-size:20px;margin-bottom:24px;text-align:center}
.login-card input{width:100%;padding:10px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:14px;outline:none;margin-bottom:16px}
.login-card input:focus{border-color:#3a86ff}
.login-card button{width:100%;padding:10px;background:#3a86ff;color:#fff;border:none;border-radius:4px;font-size:15px;cursor:pointer}
.login-card button:hover{background:#3a86ffd4}
.login-card button:active{background:#3275df}
.login-err{color:#ff4d4f;font-size:13px;text-align:center;margin-bottom:12px;display:none}
</style>
</head>
<body>
<div class="login-card">
  <h2>${L.adminLogin}</h2>
  <div class="login-err" id="err"></div>
  <input type="password" id="pw" placeholder="${L.adminPassword}" autofocus/>
  <button id="loginBtn">${L.adminLoginBtn}</button>
</div>
<script>
var L=${JSON.stringify({fail:L.adminLoginFail})};
document.getElementById('loginBtn').onclick=function(){
  var pw=document.getElementById('pw').value;
  if(!pw.trim())return;
  this.disabled=true;
  fetch('/admin/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passwd:pw})})
  .then(function(r){return r.json()})
  .then(function(r){
    if(r.err===0){location.reload()}
    else{var e=document.getElementById('err');e.textContent=L.fail;e.style.display='block';document.getElementById('loginBtn').disabled=false}
  })
  .catch(function(){document.getElementById('loginBtn').disabled=false})
};
document.getElementById('pw').onkeydown=function(e){if(e.key==='Enter')document.getElementById('loginBtn').click()};
</script>
</body>
</html>`;
};

export const AdminPage = ({ lang }) => {
  const L = SUPPORTED_LANG[lang];
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${L.adminDashboard} — Cloud Notepad</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#ebeef2;font:normal 14px Arial,Helvetica,sans-serif;color:#3a3b3c}
.admin-header{background:#fff;border-bottom:1px solid #dcdde1;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:5}
.admin-header h1{font-size:18px;font-weight:600}
.admin-header button{padding:6px 16px;background:#fff;color:#666;border:1px solid #d9d9d9;border-radius:4px;cursor:pointer;font-size:13px}
.admin-header button:hover{color:#3a86ff;border-color:#3a86ff}
.admin-body{max-width:1200px;margin:0 auto;padding:20px}
.stats-card{background:#fff;border:1px solid #dcdde1;border-radius:6px;padding:20px 24px;margin-bottom:20px;display:flex;align-items:center;gap:16px}
.stats-card .stat-num{font-size:28px;font-weight:700;color:#3a86ff}
.stats-card .stat-label{font-size:13px;color:#999}
.toolbar{display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.btn{cursor:pointer;padding:7px 16px;border-radius:4px;background:#3a86ff;color:#fff;border:none;font-size:13px;white-space:nowrap}
.btn:hover{background:#3a86ffd4}
.btn:active{background:#3275df}
.btn:disabled{background:#ccc;cursor:not-allowed}
.btn-danger{background:#ff4d4f}
.btn-danger:hover{background:#ff7875}
.btn-danger:active{background:#d9363e}
.btn-outline{background:#fff;color:#3a3b3c;border:1px solid #d9d9d9}
.btn-outline:hover{color:#3a86ff;border-color:#3a86ff;background:#fff}
.encrypt-row{display:flex;align-items:center;gap:8px;margin-left:auto}
.encrypt-row label{display:flex;align-items:center;gap:4px;font-size:13px;color:#666;cursor:pointer;user-select:none}
.encrypt-row input[type=password]{padding:6px 10px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;width:160px;display:none}
.encrypt-row input[type=password]:focus{border-color:#3a86ff}
.table-wrap{background:#fff;border:1px solid #dcdde1;border-radius:6px;overflow-x:auto}
table{width:100%;border-collapse:collapse}
thead{background:#fafafa}
th,td{padding:10px 14px;text-align:left;border-bottom:1px solid #f0f0f0;font-size:13px}
th{font-weight:600;color:#666;white-space:nowrap}
td{color:#3a3b3c}
tr:hover{background:#fafcff}
th:first-child,td:first-child{width:36px;text-align:center}
.note-path{color:#3a86ff;text-decoration:none;word-break:break-all}
.note-path:hover{text-decoration:underline}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px}
.badge-yes{background:#f6ffed;color:#52c41a}
.badge-no{background:#f5f5f5;color:#bfbfbf}
.actions{display:flex;gap:6px}
.actions button{padding:3px 10px;font-size:12px}
.pagination{display:flex;justify-content:center;gap:12px;margin-top:16px}
.batch-bar{display:none;align-items:center;gap:12px;padding:10px 16px;background:#fff7e6;border:1px solid #ffd591;border-radius:6px;margin-bottom:16px}
.batch-bar .batch-count{font-size:13px;color:#d48806}
.empty-state{text-align:center;padding:60px 20px;color:#bfbfbf;font-size:15px}
.modal-overlay{display:none;position:fixed;z-index:10;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45)}
.modal-box{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:8px;width:90%;max-width:700px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 6px 24px rgba(0,0,0,0.15)}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f0f0f0}
.modal-head h3{font-size:15px;color:#3a3b3c}
.modal-close{cursor:pointer;font-size:20px;font-weight:bold;color:#999;width:24px;height:24px;line-height:24px;text-align:center}
.modal-close:hover{color:#333}
.modal-body{padding:20px;overflow-y:auto;flex:1;white-space:pre-wrap;font:normal 14px/1.6 monospace;color:#3a3b3c;word-break:break-all}
.hidden-input{display:none}
@media(max-width:768px){
  .admin-body{padding:12px}
  .encrypt-row{margin-left:0;width:100%}
  th,td{padding:8px 10px;font-size:12px}
}
</style>
</head>
<body>
<div class="admin-header">
  <h1>${L.adminDashboard}</h1>
  <button id="logoutBtn">${L.adminLogout}</button>
</div>
<div class="admin-body">
  <div class="stats-card">
    <div><div class="stat-num" id="totalCount">-</div><div class="stat-label">${L.adminTotalNotes}</div></div>
  </div>
  <div class="toolbar">
    <button class="btn" id="exportBtn">${L.adminExportAll}</button>
    <button class="btn btn-outline" id="importBtn">${L.adminImportAll}</button>
    <input type="file" class="hidden-input" id="importFile" accept=".json"/>
    <div class="encrypt-row">
      <label><input type="checkbox" id="encryptCheck"/>${L.adminEncrypt}</label>
      <input type="password" id="encryptPw" placeholder="${L.adminExportPw}"/>
    </div>
  </div>
  <div class="batch-bar" id="batchBar">
    <span class="batch-count" id="batchCount"></span>
    <button class="btn btn-danger" id="batchDeleteBtn">${L.adminBatchDelete}</button>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr>
        <th><input type="checkbox" id="selectAll"/></th>
        <th>${L.adminPath}</th>
        <th>${L.adminUpdated}</th>
        <th>${L.adminHasPassword}</th>
        <th>${L.adminHasShare}</th>
        <th>${L.adminActions}</th>
      </tr></thead>
      <tbody id="notesList"></tbody>
    </table>
  </div>
  <div class="empty-state" id="emptyState" style="display:none">${L.adminNoNotes}</div>
  <div class="pagination" id="pagination" style="display:none">
    <button class="btn btn-outline" id="prevBtn">${L.adminPrevPage}</button>
    <button class="btn btn-outline" id="nextBtn">${L.adminNextPage}</button>
  </div>
</div>
<div class="modal-overlay" id="previewModal">
  <div class="modal-box">
    <div class="modal-head">
      <h3 id="previewTitle">${L.adminPreviewTitle}</h3>
      <span class="modal-close" id="previewClose">x</span>
    </div>
    <div class="modal-body" id="previewBody"></div>
  </div>
</div>
<script>
var L=${JSON.stringify({
  deleteConfirm:L.adminDeleteConfirm,
  batchDeleteConfirm:L.adminBatchDeleteConfirm,
  deleteSuccess:L.adminDeleteSuccess,
  batchDeleteSuccess:L.adminBatchDeleteSuccess,
  exportSuccess:L.adminExportSuccess,
  importSuccess:L.adminImportSuccess,
  exporting:L.adminExporting,
  importing:L.adminImporting,
  noNotes:L.adminNoNotes,
  yes:L.adminYes,
  no:L.adminNo,
  never:L.adminNever,
  preview:L.adminPreview,
  del:L.adminDelete,
  edit:L.adminEdit,
  exportPw:L.adminExportPw,
  selected:L.adminSelectAll
})};

var cursorHistory=[null],pageIndex=0,selectedPaths=new Set();
var $list=document.getElementById('notesList'),$empty=document.getElementById('emptyState');
var $pagination=document.getElementById('pagination'),$prev=document.getElementById('prevBtn'),$next=document.getElementById('nextBtn');
var $selectAll=document.getElementById('selectAll'),$batchBar=document.getElementById('batchBar'),$batchCount=document.getElementById('batchCount');
var $total=document.getElementById('totalCount');
var $encryptCheck=document.getElementById('encryptCheck'),$encryptPw=document.getElementById('encryptPw');
var $previewModal=document.getElementById('previewModal'),$previewBody=document.getElementById('previewBody'),$previewTitle=document.getElementById('previewTitle');

$encryptCheck.onchange=function(){$encryptPw.style.display=this.checked?'inline-block':'none'};

function escapeHtml(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}

function adminFetch(url,opt){
  return fetch(url,opt).then(function(r){return r.json()}).then(function(r){
    if(r.err===10002){location.reload();throw new Error('unauthorized')}
    return r;
  })
}

function timeAgo(ts){
  if(!ts)return L.never;
  var diff=Math.floor(Date.now()/1000)-ts;
  if(diff<60)return diff+'s';
  if(diff<3600)return Math.floor(diff/60)+'m';
  if(diff<86400)return Math.floor(diff/3600)+'h';
  return new Date(ts*1000).toLocaleDateString()
}

function loadNotes(cursor){
  var url='/admin/api/notes?limit=50';
  if(cursor)url+='&cursor='+encodeURIComponent(cursor);
  adminFetch(url).then(function(r){
    if(r.err!==0)return;
    var d=r.data;
    renderTable(d.keys);
    $prev.disabled=pageIndex===0;
    $next.disabled=d.list_complete;
    $pagination.style.display=(pageIndex>0||!d.list_complete)?'flex':'none';
    if(!d.list_complete&&d.cursor){
      if(cursorHistory.length<=pageIndex+1)cursorHistory.push(d.cursor);
      else cursorHistory[pageIndex+1]=d.cursor;
    }
    $selectAll.checked=false;
    selectedPaths.clear();
    updateBatchBar();
  })
}

function renderTable(keys){
  if(!keys||!keys.length){$list.innerHTML='';$empty.style.display='block';document.querySelector('.table-wrap').style.display='none';return}
  $empty.style.display='none';document.querySelector('.table-wrap').style.display='block';
  $list.innerHTML=keys.map(function(k){
    var m=k.metadata||{};
    var path=k.name;
    var ePath=encodeURIComponent(path);
    return '<tr data-path="'+escapeHtml(path)+'">'+
      '<td><input type="checkbox" class="row-check"/></td>'+
      '<td><a class="note-path" href="/'+ePath+'" target="_blank" title="'+escapeHtml(path)+'">'+escapeHtml(decodeURIComponent(path))+'</a></td>'+
      '<td>'+timeAgo(m.updateAt)+'</td>'+
      '<td><span class="badge '+(m.pw?'badge-yes':'badge-no')+'">'+(m.pw?L.yes:L.no)+'</span></td>'+
      '<td><span class="badge '+(m.share?'badge-yes':'badge-no')+'">'+(m.share?L.yes:L.no)+'</span></td>'+
      '<td class="actions">'+
        '<button class="btn btn-outline preview-btn">'+L.preview+'</button>'+
        '<button class="btn btn-danger del-btn">'+L.del+'</button>'+
      '</td></tr>';
  }).join('');
  $list.querySelectorAll('.preview-btn').forEach(function(b){
    b.onclick=function(){previewNote(this.closest('tr').dataset.path)}
  });
  $list.querySelectorAll('.del-btn').forEach(function(b){
    b.onclick=function(){deleteNote(this.closest('tr').dataset.path)}
  });
  $list.querySelectorAll('.row-check').forEach(function(cb){
    cb.onchange=function(){
      var p=this.closest('tr').dataset.path;
      if(this.checked)selectedPaths.add(p);else selectedPaths.delete(p);
      updateBatchBar();
    }
  });
}

function updateBatchBar(){
  if(selectedPaths.size>0){
    $batchBar.style.display='flex';
    $batchCount.textContent=selectedPaths.size+' '+L.selected;
  }else{
    $batchBar.style.display='none';
  }
}

$selectAll.onchange=function(){
  var checked=this.checked;
  selectedPaths.clear();
  $list.querySelectorAll('.row-check').forEach(function(cb){
    cb.checked=checked;
    if(checked)selectedPaths.add(cb.closest('tr').dataset.path);
  });
  updateBatchBar();
};

function nextPage(){pageIndex++;loadNotes(cursorHistory[pageIndex])}
function prevPage(){if(pageIndex>0){pageIndex--;loadNotes(cursorHistory[pageIndex])}}
$next.onclick=nextPage;
$prev.onclick=prevPage;

function previewNote(path){
  $previewTitle.textContent=L.preview+' — '+decodeURIComponent(path);
  $previewBody.textContent='...';
  $previewModal.style.display='block';
  adminFetch('/admin/api/notes/'+encodeURIComponent(path)+'/preview').then(function(r){
    if(r.err===0)$previewBody.textContent=r.data.content||'(empty)';
    else $previewBody.textContent='Error: '+r.msg;
  })
}
document.getElementById('previewClose').onclick=function(){$previewModal.style.display='none'};
$previewModal.onclick=function(e){if(e.target===$previewModal)$previewModal.style.display='none'};

function deleteNote(path){
  if(!confirm(L.deleteConfirm))return;
  adminFetch('/admin/api/notes/'+encodeURIComponent(path),{method:'DELETE'}).then(function(r){
    if(r.err===0){loadNotes(cursorHistory[pageIndex]);countNotes()}
  })
}

document.getElementById('batchDeleteBtn').onclick=function(){
  if(!selectedPaths.size||!confirm(L.batchDeleteConfirm))return;
  var paths=Array.from(selectedPaths);
  adminFetch('/admin/api/notes/delete-batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paths:paths})}).then(function(r){
    if(r.err===0){selectedPaths.clear();updateBatchBar();loadNotes(cursorHistory[pageIndex]);countNotes()}
  })
};

function countNotes(){
  adminFetch('/admin/api/notes?limit=1000&count=true').then(function(r){
    if(r.err===0)$total.textContent=r.data.total||r.data.keys.length;
  })
}

// Crypto
function deriveKey(pw,salt){
  var enc=new TextEncoder();
  return crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveKey']).then(function(km){
    return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:100000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])
  })
}
function encryptContent(content,pw){
  var enc=new TextEncoder();
  var salt=crypto.getRandomValues(new Uint8Array(16));
  var iv=crypto.getRandomValues(new Uint8Array(12));
  return deriveKey(pw,salt).then(function(key){
    return crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,enc.encode(content))
  }).then(function(ct){
    var combined=new Uint8Array(salt.length+iv.length+new Uint8Array(ct).length);
    combined.set(salt,0);combined.set(iv,salt.length);combined.set(new Uint8Array(ct),salt.length+iv.length);
    return btoa(String.fromCharCode.apply(null,combined))
  })
}
function decryptContent(b64,pw){
  var binary=atob(b64);var bytes=new Uint8Array(binary.length);
  for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  var salt=bytes.slice(0,16),iv=bytes.slice(16,28),ct=bytes.slice(28);
  return deriveKey(pw,salt).then(function(key){
    return crypto.subtle.decrypt({name:'AES-GCM',iv:iv},key,ct)
  }).then(function(pt){return new TextDecoder().decode(pt)})
}

// Export All
document.getElementById('exportBtn').onclick=function(){
  var btn=this;btn.disabled=true;btn.textContent=L.exporting;
  adminFetch('/admin/api/export-all').then(function(r){
    if(r.err!==0){btn.disabled=false;btn.textContent='${L.adminExportAll}';return}
    var data=r.data;
    var proceed=function(d){
      var blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);
      a.download='cloud-notepad-backup-'+Date.now()+'.json';a.click();
      URL.revokeObjectURL(a.href);
      btn.disabled=false;btn.textContent='${L.adminExportAll}';
    };
    if($encryptCheck.checked){
      var pw=$encryptPw.value.trim();
      if(!pw){alert(L.exportPw);btn.disabled=false;btn.textContent='${L.adminExportAll}';return}
      var content=JSON.stringify(data.notes);
      encryptContent(content,pw).then(function(enc){
        data.notes=enc;data.encrypted=true;proceed(data);
      }).catch(function(){btn.disabled=false;btn.textContent='${L.adminExportAll}'})
    }else{proceed(data)}
  }).catch(function(){btn.disabled=false;btn.textContent='${L.adminExportAll}'})
};

// Import All
document.getElementById('importBtn').onclick=function(){document.getElementById('importFile').click()};
document.getElementById('importFile').onchange=function(){
  var file=this.files[0];if(!file)return;this.value='';
  var reader=new FileReader();
  reader.onload=function(){
    try{
      var data=JSON.parse(reader.result);
      if(!data.notes){alert('Invalid backup file');return}
      var doImport=function(d){
        adminFetch('/admin/api/import-all',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(function(r){
          if(r.err===0){alert(L.importSuccess);loadNotes(null);pageIndex=0;cursorHistory=[null];countNotes()}
          else alert('Error: '+r.msg);
        })
      };
      if(data.encrypted){
        var pw=prompt(L.exportPw);if(!pw)return;
        decryptContent(data.notes,pw).then(function(plain){
          data.notes=JSON.parse(plain);data.encrypted=false;doImport(data);
        }).catch(function(){alert('Wrong password or corrupted file')})
      }else{doImport(data)}
    }catch(e){alert('Invalid backup file')}
  };
  reader.readAsText(file);
};

// Logout
document.getElementById('logoutBtn').onclick=function(){
  document.cookie='auth_admin=;path=/;expires=Thu,01 Jan 1970 00:00:00 GMT';
  location.reload();
};

// Init
loadNotes(null);
countNotes();
</script>
</body>
</html>`;
};
