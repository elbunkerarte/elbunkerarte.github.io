'use strict';
/**
 * DriveApp emulator. ONE Drive per account: every project of the account sees
 * (and can touch) every file, exactly like two Apps Script projects owned by
 * the same Google user. Isolation is therefore a property of the CODE, which is
 * what the integration suite checks.
 *
 * Faithful quirks kept on purpose:
 *  - getFolderById/getFileById still return TRASHED items (check isTrashed()).
 *  - getFiles()/getFolders()/get*ByName() include trashed items too.
 *  - Google-type files (spreadsheets) report getSize() === 0.
 */
const crypto = require('crypto');
const { Blob } = require('./blob');

const SPREADSHEET_MIME = 'application/vnd.google-apps.spreadsheet';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

const ACCESS = { ANYONE: 'ANYONE', ANYONE_WITH_LINK: 'ANYONE_WITH_LINK', DOMAIN: 'DOMAIN',
  DOMAIN_WITH_LINK: 'DOMAIN_WITH_LINK', PRIVATE: 'PRIVATE' };
const PERMISSION = { VIEW: 'VIEW', EDIT: 'EDIT', COMMENT: 'COMMENT', OWNER: 'OWNER',
  ORGANIZER: 'ORGANIZER', FILE_ORGANIZER: 'FILE_ORGANIZER', NONE: 'NONE' };

const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function driveId(length) {
  const bytes = crypto.randomBytes(length);
  let s = '1';
  for (let i = 1; i < length; i++) s += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return s;
}

class DriveStore {
  constructor(account) {
    this.account = account;
    this.items = new Map();
    const root = this._put({ kind: 'folder', name: 'My Drive', mimeType: FOLDER_MIME, parents: [] });
    this.rootId = root.id;
  }

  _put(fields) {
    const now = this.account.nowMs();
    const item = Object.assign({
      id: driveId(fields.kind === 'folder' ? 33 : 33),
      bytes: null, trashed: false, created: now, updated: now, description: '',
      access: ACCESS.PRIVATE, permission: PERMISSION.NONE, starred: false,
      editors: [], viewers: [], createdBy: null
    }, fields);
    item.parents = new Set(fields.parents || []);
    this.items.set(item.id, item);
    return item;
  }

  addFolder(name, parentId, project) {
    return this._put({ kind: 'folder', name: String(name), mimeType: FOLDER_MIME,
      parents: [parentId || this.rootId], createdBy: project });
  }

  addFile(fields) {
    return this._put(Object.assign({ kind: 'file' }, fields, {
      parents: [fields.parentId || this.rootId]
    }));
  }

  /** Registers an already-created Google file (e.g. a spreadsheet) under a given id. */
  addGoogleFile(id, name, mimeType, project) {
    const now = this.account.nowMs();
    const item = {
      id, kind: 'file', name: String(name), mimeType, bytes: null, trashed: false,
      created: now, updated: now, description: '', access: ACCESS.PRIVATE, permission: PERMISSION.NONE,
      starred: false, editors: [], viewers: [], createdBy: project, parents: new Set([this.rootId])
    };
    this.items.set(id, item);
    return item;
  }

  get(id) { return this.items.get(String(id)) || null; }

  childrenOf(folderId, kind) {
    const out = [];
    for (const item of this.items.values()) {
      if (item.kind === kind && item.parents.has(folderId)) out.push(item);
    }
    return out;
  }

  all(kind) {
    return Array.from(this.items.values()).filter((i) => i.kind === kind && i.id !== this.rootId);
  }

  /** Host-side view for tests: plain objects, no facades. */
  list(filter) {
    return Array.from(this.items.values())
      .filter((i) => i.id !== this.rootId)
      .filter((i) => !filter || filter(i))
      .map((i) => ({ id: i.id, kind: i.kind, name: i.name, mimeType: i.mimeType, trashed: i.trashed,
        size: i.bytes ? i.bytes.length : 0, parents: Array.from(i.parents), createdBy: i.createdBy,
        text: i.bytes ? i.bytes.toString('utf8') : null }));
  }
}

// ---------------------------------------------------------------------------
// Facades (one set per execution)
// ---------------------------------------------------------------------------

function makeIterator(env, items, wrap) {
  let i = 0;
  return {
    hasNext() { return i < items.length; },
    next() {
      if (i >= items.length) throw env.realm.error('Cannot retrieve the next object: iterator has reached the end.');
      return wrap(items[i++]);
    },
    getContinuationToken() { return 'emulated-token-' + i; }
  };
}

const QUERY_CLAUSE = [
  [/^(?:title|name)\s*=\s*'((?:[^'\\]|\\.)*)'$/i, (m) => (i) => i.name === m[1].replace(/\\'/g, "'")],
  [/^(?:title|name)\s+contains\s+'((?:[^'\\]|\\.)*)'$/i, (m) => (i) => i.name.indexOf(m[1].replace(/\\'/g, "'")) !== -1],
  [/^trashed\s*=\s*(true|false)$/i, (m) => (i) => i.trashed === (m[1].toLowerCase() === 'true')],
  [/^'([^']+)'\s+in\s+parents$/i, (m) => (i) => i.parents.has(m[1])],
  [/^mimeType\s*=\s*'([^']+)'$/i, (m) => (i) => i.mimeType === m[1]],
  [/^mimeType\s*!=\s*'([^']+)'$/i, (m) => (i) => i.mimeType !== m[1]]
];

function compileQuery(env, q) {
  const clauses = String(q || '').split(/\s+and\s+/i).map((c) => c.trim()).filter(Boolean);
  const preds = clauses.map((c) => {
    for (const [re, build] of QUERY_CLAUSE) {
      const m = c.match(re);
      if (m) return build(m);
    }
    throw env.realm.error('Invalid argument: q (emulator supports title/name =|contains, trashed, in parents, mimeType): ' + c);
  });
  return (item) => preds.every((p) => p(item));
}

function makeDrive(env) {
  const store = env.account.drive;
  const R = env.realm;

  function notFound() {
    return R.error('No item with the given ID could be found. Possibly because you have not edited this item or you do not have permission to access it.');
  }

  function blobFromArgs(args, where) {
    if (args.length === 1 && args[0] instanceof Blob) return args[0];
    if (args.length === 1 && args[0] && typeof args[0].getBlob === 'function') return args[0].getBlob();
    if (args.length >= 2 && typeof args[0] === 'string') {
      return new Blob(env, Buffer.from(String(args[1] === undefined ? '' : args[1]), 'utf8'),
        args[2] || 'text/plain', args[0]);
    }
    throw R.error("The parameters don't match the method signature for " + where + '.createFile.');
  }

  function createFileIn(parentId, args, where) {
    env.count('Drive.createFile');
    const blob = blobFromArgs(args, where);
    const item = store.addFile({
      name: blob.getName() || 'Untitled',
      mimeType: blob.getContentType() || 'application/octet-stream',
      bytes: Buffer.from(blob._bytes), parentId, createdBy: env.project.name
    });
    return wrapFile(item);
  }

  function sharingMethods(item) {
    return {
      setSharing(access, permission) { item.access = access; item.permission = permission; return this; },
      getSharingAccess() { return item.access; },
      getSharingPermission() { return item.permission; },
      addEditor(e) { item.editors.push(String(e)); return this; },
      addEditors(list) { list.forEach((e) => item.editors.push(String(e))); return this; },
      addViewer(e) { item.viewers.push(String(e)); return this; },
      addViewers(list) { list.forEach((e) => item.viewers.push(String(e))); return this; },
      removeEditor(e) { item.editors = item.editors.filter((x) => x !== String(e)); return this; },
      removeViewer(e) { item.viewers = item.viewers.filter((x) => x !== String(e)); return this; },
      getEditors() { return R.array(item.editors.map(userFacade)); },
      getViewers() { return R.array(item.viewers.map(userFacade)); },
      getOwner() { return userFacade(env.account.ownerEmail); },
      isStarred() { return item.starred; },
      setStarred(v) { item.starred = !!v; return this; },
      getDescription() { return item.description; },
      setDescription(d) { item.description = String(d); return this; },
      getDateCreated() { return R.date(item.created); },
      getLastUpdated() { return R.date(item.updated); },
      isTrashed() { return item.trashed; },
      setTrashed(v) { item.trashed = !!v; item.updated = env.account.nowMs(); return this; },
      getParents() {
        return makeIterator(env, Array.from(item.parents).map((id) => store.get(id)).filter(Boolean), wrapFolder);
      }
    };
  }

  function userFacade(email) {
    return { getEmail: () => email, getName: () => email, getDomain: () => String(email).split('@')[1] || '' };
  }

  function wrapFile(item) {
    const f = Object.assign(sharingMethods(item), {
      getId() { return item.id; },
      getName() { return item.name; },
      setName(n) { item.name = String(n); item.updated = env.account.nowMs(); return f; },
      getMimeType() { return item.mimeType; },
      getSize() { return item.bytes ? item.bytes.length : 0; },
      getUrl() {
        if (item.mimeType === SPREADSHEET_MIME) return 'https://docs.google.com/spreadsheets/d/' + item.id + '/edit?usp=drivesdk';
        return 'https://drive.google.com/file/d/' + item.id + '/view?usp=drivesdk';
      },
      getDownloadUrl() { return 'https://drive.google.com/uc?id=' + item.id + '&export=download'; },
      getBlob() {
        env.count('Drive.getBlob');
        if (item.mimeType === SPREADSHEET_MIME) {
          return new Blob(env, Buffer.from('%PDF-1.4 emulated export of ' + item.name), 'application/pdf', item.name + '.pdf');
        }
        return new Blob(env, item.bytes || Buffer.alloc(0), item.mimeType, item.name);
      },
      getAs(contentType) { return f.getBlob().getAs(contentType); },
      setContent(text) {
        if (item.mimeType === SPREADSHEET_MIME) throw R.error('Cannot set content of a Google Sheets file.');
        item.bytes = Buffer.from(String(text), 'utf8'); item.updated = env.account.nowMs(); return f;
      },
      getThumbnail() { return null; },
      makeCopy(a, b) {
        env.count('Drive.makeCopy');
        let name = item.name;
        let folder = null;
        if (typeof a === 'string') { name = a; folder = b || null; } else if (a) { folder = a; }
        const parentId = folder ? folder.getId() : Array.from(item.parents)[0] || store.rootId;
        if (item.mimeType === SPREADSHEET_MIME) {
          const copyId = env.account.copySpreadsheet(item.id, name, env.project.name);
          const copy = store.get(copyId);
          copy.parents = new Set([parentId]);
          return wrapFile(copy);
        }
        const copy = store.addFile({ name, mimeType: item.mimeType, bytes: item.bytes ? Buffer.from(item.bytes) : null,
          parentId, createdBy: env.project.name });
        return wrapFile(copy);
      },
      moveTo(folder) { item.parents = new Set([folder.getId()]); item.updated = env.account.nowMs(); return f; },
      toString() { return item.name; }
    });
    Object.defineProperty(f, '_item', { value: item });
    return f;
  }

  function wrapFolder(item) {
    const folder = Object.assign(sharingMethods(item), {
      getId() { return item.id; },
      getName() { return item.name; },
      setName(n) { item.name = String(n); return folder; },
      getUrl() { return 'https://drive.google.com/drive/folders/' + item.id; },
      getSize() { return 0; },
      createFolder(name) { env.count('Drive.createFolder'); return wrapFolder(store.addFolder(name, item.id, env.project.name)); },
      createFile() { return createFileIn(item.id, Array.from(arguments), 'Folder'); },
      getFiles() { return makeIterator(env, store.childrenOf(item.id, 'file'), wrapFile); },
      getFolders() { return makeIterator(env, store.childrenOf(item.id, 'folder'), wrapFolder); },
      getFilesByName(n) { return makeIterator(env, store.childrenOf(item.id, 'file').filter((i) => i.name === n), wrapFile); },
      getFoldersByName(n) { return makeIterator(env, store.childrenOf(item.id, 'folder').filter((i) => i.name === n), wrapFolder); },
      getFilesByType(mime) { return makeIterator(env, store.childrenOf(item.id, 'file').filter((i) => i.mimeType === mime), wrapFile); },
      searchFiles(q) {
        const pred = compileQuery(env, q);
        return makeIterator(env, store.childrenOf(item.id, 'file').filter(pred), wrapFile);
      },
      searchFolders(q) {
        const pred = compileQuery(env, q);
        return makeIterator(env, store.childrenOf(item.id, 'folder').filter(pred), wrapFolder);
      },
      addFile(file) { file._item.parents.add(item.id); return folder; },
      removeFile(file) { file._item.parents.delete(item.id); return folder; },
      addFolder(child) { child._item.parents.add(item.id); return folder; },
      removeFolder(child) { child._item.parents.delete(item.id); return folder; },
      moveTo(dest) { item.parents = new Set([dest.getId()]); return folder; },
      isRoot() { return item.id === store.rootId; },
      toString() { return item.name; }
    });
    Object.defineProperty(folder, '_item', { value: item });
    return folder;
  }

  return {
    Access: ACCESS,
    Permission: PERMISSION,
    getRootFolder() { return wrapFolder(store.get(store.rootId)); },
    createFolder(name) { env.count('Drive.createFolder'); return wrapFolder(store.addFolder(name, store.rootId, env.project.name)); },
    createFile() { return createFileIn(store.rootId, Array.from(arguments), 'DriveApp'); },
    getFolderById(id) {
      env.count('Drive.getFolderById');
      const item = store.get(id);
      if (!item || item.kind !== 'folder') throw notFound();
      return wrapFolder(item);
    },
    getFileById(id) {
      env.count('Drive.getFileById');
      const item = store.get(id);
      if (!item || item.kind !== 'file') throw notFound();
      return wrapFile(item);
    },
    getFiles() { return makeIterator(env, store.all('file'), wrapFile); },
    getFolders() { return makeIterator(env, store.all('folder'), wrapFolder); },
    getFilesByName(n) { return makeIterator(env, store.all('file').filter((i) => i.name === n), wrapFile); },
    getFoldersByName(n) { return makeIterator(env, store.all('folder').filter((i) => i.name === n), wrapFolder); },
    getFilesByType(mime) { return makeIterator(env, store.all('file').filter((i) => i.mimeType === mime), wrapFile); },
    getTrashedFiles() { return makeIterator(env, store.all('file').filter((i) => i.trashed), wrapFile); },
    getTrashedFolders() { return makeIterator(env, store.all('folder').filter((i) => i.trashed), wrapFolder); },
    searchFiles(q) { const p = compileQuery(env, q); return makeIterator(env, store.all('file').filter(p), wrapFile); },
    searchFolders(q) { const p = compileQuery(env, q); return makeIterator(env, store.all('folder').filter(p), wrapFolder); },
    getStorageUsed() { return store.all('file').reduce((s, i) => s + (i.bytes ? i.bytes.length : 0), 0); },
    getStorageLimit() { return 15 * 1024 * 1024 * 1024; }
  };
}

module.exports = { DriveStore, makeDrive, SPREADSHEET_MIME, FOLDER_MIME, driveId };
