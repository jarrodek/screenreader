/* eslint-disable no-console */
import archiver from 'archiver';
import { createWriteStream, createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';

/**
 * Bundles the extension.
 * 
 * Note, this will update the manifest file with the version from the `package.json` file.
 */
export class ExtensionBundler {
  /** 
   * @type string[] 
   */
  files = [
    // DO NOT ADD THE MANIFEST FILE HERE. IT IS PROCESSED ELSEWHERE
    'options.html',
  ];
  
  /** 
   * The list of directories to zip.
   * @type string[] 
   */
  dirs = [
    '_locales',
    'assets',
    'css',
    'img',
    'src',
  ];

  /**
   * The destination file.
   * @type string
   */
  out = 'extension.zip';

  archive = archiver('zip');

  /** @type {import("node:fs").WriteStream} */
  stream;

  constructor() {
    const { out } = this;
    this.stream = createWriteStream(out);

    this.stream.on('close', () => {
      console.log(`Bundling complete. Final file size: ${this.#fileSize(this.archive.pointer())}.`);
    });

    this.archive.on('warning', function(err) {
      console.warn(err);
    });
  }

  async bundle() {
    const manifest = await this.#getManifest();
    
    const { dirs, files, archive } = this;
    let result = archive;
    for (const d of dirs) {
      result = result.directory(d, d);
    }
    for (const f of files) {
      result = result.append(createReadStream(f), { name: f });
    }
    result = result.append(manifest, { name: 'manifest.json' });
    await this.#finalize(archive);
  }

  async #readPackage() {
    const contents = await readFile('package.json', 'utf8');
    return JSON.parse(contents);
  }

  async #readManifest() {
    const contents = await readFile('manifest.json', 'utf8');
    return JSON.parse(contents);
  }

  async #getManifest() {
    const pkg = await this.#readPackage();
    const manifest = await this.#readManifest();
    manifest.version = pkg.version;
    return JSON.stringify(manifest, null, 2);
  }

  /**
   * @param {archiver.Archiver} archive 
   */
  #finalize(archive) {
    const { stream } = this;
    return new Promise((resolve, reject) => {
      archive.on('error', err => reject(err)).pipe(stream);
      stream.on('close', () => resolve());
      archive.finalize();
    });
  }

  /**
   * @see https://stackoverflow.com/q/10420352
   * @param {number} bytes Size in bytes
   * @returns string
   */
  #fileSize(bytes) {
    let i = -1;
    const byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
      bytes /= 1024;
      i++;
    } while (bytes > 1024);

    return Math.max(bytes, 0.1).toFixed(1) + byteUnits[i];
  }
}
