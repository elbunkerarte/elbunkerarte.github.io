'use strict';
/** Apps Script Blob: bytes + content type + name. Bytes surface as SIGNED arrays. */
const { toSignedArray, isByteArray, bytesToBuffer, encodingFor } = require('./realm');

function bufferFrom(env, data, charset) {
  if (data === null || data === undefined) return Buffer.alloc(0);
  if (Buffer.isBuffer(data)) return Buffer.from(data);
  if (typeof data === 'string') return Buffer.from(data, encodingFor(charset));
  if (isByteArray(data)) return bytesToBuffer(data);
  if (data && typeof data.getBytes === 'function') return bytesToBuffer(data.getBytes());
  throw env.realm.error('The parameters (' + typeof data + ") don't match the method signature for Utilities.newBlob.");
}

class Blob {
  constructor(env, bytes, contentType, name) {
    Object.defineProperty(this, '_env', { value: env });
    this._bytes = Buffer.from(bytes || []);
    this._contentType = contentType === undefined ? null : contentType;
    this._name = name === undefined ? null : name;
  }

  getBytes() { return toSignedArray(this._env.realm, this._bytes); }
  getDataAsString(charset) { return this._bytes.toString(encodingFor(charset)); }
  setDataFromString(s, charset) { this._bytes = Buffer.from(String(s), encodingFor(charset)); return this; }
  setBytes(bytes) { this._bytes = bufferFrom(this._env, bytes); return this; }
  setDataFromBlob(blob) {
    this._bytes = Buffer.from(blob._bytes);
    this._contentType = blob._contentType;
    return this;
  }
  getContentType() { return this._contentType; }
  setContentType(ct) { this._contentType = ct; return this; }
  getName() { return this._name; }
  setName(name) { this._name = name; return this; }
  copyBlob() { return new Blob(this._env, this._bytes, this._contentType, this._name); }
  getBlob() { return this; }
  isGoogleType() { return false; }
  getAllBlobs() { return this._env.realm.array([this]); }
  getAs(contentType) {
    if (contentType === this._contentType) return this.copyBlob();
    throw this._env.realm.error('Converting from ' + this._contentType + ' to ' + contentType + ' is not supported.');
  }
  toString() { return 'Blob'; }
}

module.exports = { Blob, bufferFrom };
