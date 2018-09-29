/* eslint-disable no-bitwise,class-methods-use-this */
import { NFC } from 'nfc-pcsc';
import ndef from '@taptrack/ndef';

import EventEmitter from 'events';

import to from 'common/to';
import { isBoolean } from 'util';

/** Wrapper for NFC Reader */
export default class NFCWrapper extends EventEmitter {
  /** @constant {Number} LOCK_PAGE - Address of Lock Page */
  static get LOCK_PAGE() { return 0x02; }
  /** @constant {Number} CAPABILITY_CONTAINER_PAGE - Address of Capability Container Page */
  static get CAPABILITY_CONTAINER_PAGE() { return 0x03; }
  /** @constant {Number} DATA_START_PAGE - Address of Start of Data Page */
  static get DATA_START_PAGE() { return 0x04; }
  /** @constant {Number} BLOCK_SIZE - Number of bytes per Page */
  static get BLOCK_SIZE() { return 4; }

  /** @property {object} NFC - NFC Object */
  nfc = null;

  /** @property {?object[]} readers - Array of Reader Object */
  readers = null;

  // Permissions
  /**
   * Read Permission
   * @type {boolean}
   * @default [false]
   */
  allowRead = false;

  /**
   * Sets Read permission
   * @param {boolean} val - True if allow Read
   */
  setAllowRead(val) {
    if (isBoolean(val)) {
      this.allowRead = val;
    }

    return this.allowRead;
  }

  /**
   * Write Permission
   * @type {boolean}
   * @default [false]
   */
  allowWrite = false;

  /**
   * Sets Write permission
   * @param {boolean} val - True if allow Write
   */
  setAllowWrite(val) {
    if (isBoolean(val)) {
      this.allowWrite = val;
    }

    return this.allowWrite;
  }

  /**
   * Write-Readonly Permission
   * @type {boolean}
   * @default [false]
   */
  allowWriteReadonly = false;

  /**
   * Sets Write-Readonly permission
   * @param {boolean} val - True if allow Write-Readonly
   */
  setAllowWriteReadonly(val) {
    if (isBoolean(val)) {
      this.allowWriteReadonly = val;
    }

    return this.allowWriteReadonly;
  }

  /**
   * Message to write to tag
   * @type {?string}
   * @default [null]
   */
  message = null;

  /**
   * Sets message to write to tag
   * @param {?string} msg - Message to write to tag
   */
  setMessage(msg) {
    this.message = msg;

    return this.message;
  }

  /**
   * Initializes NFCWrapper function
   * @constructor
   */
  constructor() {
    super();

    // Initializes NFCWrapper
    this.init();
  }

  /** Initializes NFCWrapper properties */
  init() {
    this.nfc = new NFC();
    this.readers = [];
    this.setAllowRead(false);
    this.setAllowWrite(false);
    this.setAllowWriteReadonly(false);
    this.setMessage(null);
  }

  /**
   * Starts listening with default configuration
   */
  startDefault() {
    this.start(this.readerHandler);

    return this;
  }

  /** Start listening with custom rader handler */
  start(readerHandler) {
    // Bind 'this' to handler
    readerHandler = readerHandler.bind(this);
    this.nfc.on('reader', readerHandler);

    // Handle NFC driver error
    this.nfc.on('error', (err) => {
      this.emit('nfc-error', err);
    });

    return this;
  }

  /**
   * Default reader handler
   * @param {object} reader - Reader instance to bind handler to
   */
  async readerHandler(reader) {
    reader.on('card', async () => {
      const [err, status] = await to(this.handleCard(reader));
      if (err) {
        this.emit('operation-complete', err.message);
      } else {
        this.emit('operation-complete', status);
      }

      return status;
    });

    // Pushes reader to array of readers
    this.readers.push(reader);
    this.emit('readerconn');

    // Handle errors of reader
    reader.on('error', (err) => {
      this.emit('reader-error', err);
    });

    // Garbage collection
    reader.on('end', () => {
      delete this.readers[this.readers.indexOf(reader)];
      this.emit('readerend');
    });
  }

  /**
   * Default card handler
   * @param {object} reader - Reader instance to bind card handler
   * @returns {object} - Object conaining status of read/write/write-readonly operations
   */
  async handleCard(reader) {
    const operation = {};

    // If write and write-readonly permissions are set, typically it means
    // that users want to write the message and lock it right away.
    // This flag prevents write error that also locks the tag
    let writeError = false;

    // Read handler
    if (this.allowRead) {
      const [err, status] = await to(this.readCard(reader));
      if (err) {
        operation.read = {
          error: err.message,
        };
      } else {
        operation.read = status;
      }
    }

    // Write handler
    if (this.allowWrite) {
      const [err, status] = await to(this.writeCard(reader));
      if (err) {
        operation.write = {
          error: err.message,
        };
        // If allowWrite is set but write to tag encounter an error
        // Set writeError so it prevents tag being made read-only
        writeError = true;
      } else {
        operation.write = status;
      }
    }

    // Write-Readonly handler
    if (!writeError && this.allowWriteReadonly) {
      const [err, status] = await to(this.writeReadOnly(reader));
      if (err) {
        operation.readOnly = {
          error: err.message,
        };
      } else {
        operation.readOnly = status;
      }
    }

    return operation;
  }

  /**
   * Default read card header handler
   * @param {object} reader - Reader instance to read tag header
   * @throws Error if unable to read tag header
   */
  async readHeader(reader) {
    // Read Header from Capability Container
    const [err, header] = await to(
      reader.read(NFCWrapper.CAPABILITY_CONTAINER_PAGE, NFCWrapper.BLOCK_SIZE),
    );
    if (err) throw new Error('Cannot read tag header');

    // Checks the magic header of Capability Conainer (Should be 0xE1).
    // See NFC Forum Type 2 Tags documentation
    const isValid = header[0] === 0xE1;

    // See https://github.com/adafruit/Adafruit-PN532/issues/34
    // Not guaranteed to be correct in all tags
    // (i.e. NTAG215 has more data pages than indicated by maxLength)
    const maxLength = header[2] * 8;

    // Major Version is first nibble (first 4 bits), Minor Version is 2nd nibble (last 4 bits)
    // TODO: There is some rules concerning versioning of the tag, but typically tags are
    // created correctly during manufacturing process, so we won't check it here.
    const majorVersion = (header[1] & 0x0F) >> 4;
    const minorVersion = header[1] & 0x0F;

    // Last byte of Capability Container contains information about locking.
    // First nibble indicates read status.
    // Last nibble indicates write status.
    // 0x00 means full write privilege, 0x0F means no write privilege
    const isReadOnly = (header[3] & 0x0F) === 0x0F; // Last nibble has value of F (1111)
    // Notes that apparently the readonly flag on
    // Capability Container do not prevent low-level writing

    return {
      isValid,
      maxLength,
      majorVersion,
      minorVersion,
      isReadOnly,
    };
  }

  /**
   * Default read card data handler
   * @param {object} reader - Reader instance to read tag data
   * @throws Error if cannot read tag header
   * @throws Error if tag is invalid under NFC Forum Type 2 Specification
   * @throws Error if cannot read tag data
   */
  async readCard(reader) {
    const [err, header] = await to(this.readHeader(reader));
    if (err) throw new Error(err);

    const tagAttribute = {
      'access-level': '',
      records: [],
    };

    if (!header.isValid) {
      throw new Error('Malformed Tag Header');
    } else {
      if (header.isReadOnly) {
        tagAttribute['access-level'] = 'Read-only';
      } else {
        tagAttribute['access-level'] = 'Read-Write';
      }

      // Read tag data
      const [dataErr, data] = await to(reader.read(NFCWrapper.DATA_START_PAGE, header.maxLength));
      if (dataErr) throw new Error(dataErr);

      const message = ndef.Message.fromBytes(data);
      const records = message.getRecords();

      for (let i = 0; i < records.length; i += 1) {
        const record = records[i];

        try {
          // Currently only text records are supported
          const { content } = ndef.Utils.resolveTextRecord(record);
          tagAttribute.records.push(content);
        } catch (err) {
          // Do nothing - Just ignore non-text-records
        }
      } // for loop
    } // header.isValid

    return tagAttribute;
  }

  /**
   * Default write tag record handler
   * @param {object} reader - Read instance to write tag data
   * @throws Error if cannot read tag header
   * @throws Error if header is malformed
   * @throws Error if no message is not set or is empty
   * @throws Error if tag is read-only
   * @throws Error if cannot write to tag
   */
  async writeCard(reader) {
    const [err, header] = await to(this.readHeader(reader));
    if (err) throw new Error(err);

    if (header.isReadOnly) {
      throw new Error('Tag is Read-only, cannot write');
    }

    if (header.isValid) {
      if (this.message === null || this.message === '') {
        throw new Error('No Message set.');
      }

      const NDEFTextRecord = ndef.Utils.createTextRecord(this.message);
      const NDEFMessage = new ndef.Message([NDEFTextRecord]);

      const byteStream = this.constructor.constructMessageNDEF(
        NDEFMessage.toByteArray(),
        header.maxLength,
      );

      const [err] = await to(reader.write(NFCWrapper.DATA_START_PAGE, byteStream));
      if (err) throw new Error('Error Writing to Tag');

      return true;
    }

    throw new Error('Malformed Tag Header');
  }

  /**
   * Default handler to lock tags
   * Currently only lock 12 pages of data or 48 bytes (subtracting 4-8 bytes of header)
   * @param {object} reader - Reader instance to lock tag
   * @throws Error if cannot read from tag
   * @throws Error if cannot write lock information to tag
   */
  async writeReadOnly(reader) {
    // Gets information about lock page
    const [err, lockPage] = await to(reader.read(NFCWrapper.LOCK_PAGE, NFCWrapper.BLOCK_SIZE));
    if (err) throw new Error('Error Reading Tag');

    // Sets new lock pages
    const lockBytes = [0xFF, 0xFF];
    const lockBeginPosition = 2;
    lockPage.set(lockBytes, lockBeginPosition);

    // Gets information about capability container page
    const [ccErr, ccPage] = await to(
      reader.read(NFCWrapper.CAPABILITY_CONTAINER_PAGE, NFCWrapper.BLOCK_SIZE),
    );
    if (ccErr) throw new Error('Error Reading Tag');

    // First 4 bits of the lock byte contains information about read capability.
    // Last 4 bits of the lock byte contains information about write capability.
    // OR'd to preserve the first 4 bits
    const ccBytes = [ccPage[3] | 0x0F];
    const ccBeginPosition = 3;
    ccPage.set(ccBytes, ccBeginPosition);

    // Constructs full lock array
    const fullLock = new Uint8Array(8);
    fullLock.set(lockPage, 0);
    fullLock.set(ccPage, 4);

    // Write lock array to tag
    const [flErr] = await to(reader.write(NFCWrapper.LOCK_PAGE, fullLock));
    if (flErr) throw new Error('Error writing readonly information to tag');

    return true;
  }

  /**
   * Constructs a wrapper around a NDEF text message
   * @param {Uint8Array} messageByteArray - NDEF formatted well-known text message
   * @param {Number} maxLength - Maximum data block length permitted by the tag
   * @param {Number} blockSize - Number of bytes per page - Default: 4
   * @throws Error if message is larger than maximum length of tag
   * @returns Valid NDEF Message with Wrapper
   */
  static constructMessageNDEF(messageByteArray, maxLength, blockSize = 4) {
    // Determine valid length of result message (must be divisible by blockSize)
    let validLength = (2 + messageByteArray.length + 1);
    validLength += 4;
    validLength -= validLength % blockSize;

    // Determine if the result message need to be formatted with long-form Length flag
    let longLengthFormat = false;
    if (messageByteArray.length > 0xFE) {
      longLengthFormat = true;
      validLength += 2;
    }

    if (validLength > maxLength) {
      throw new Error('Length of Message is larger than supported');
    }

    // Constructs result message
    const result = new Uint8Array(validLength);

    // Technically not needed because by default Uint8Array() fill and pad end of block
    result.fill(0); // Fill and pad end of block

    result.set([0x03]); // NDEF Message T

    if (longLengthFormat) {
      result.set([0xFF], 1); // Length (L)
      result.set([Math.floor(messageByteArray.length / 0x100)], 2);
      result.set([messageByteArray.length % 0x100], 3);
      // Message block
      result.set(messageByteArray, 4);
      // Terminator TLV
      result.set([0xFE], 4 + messageByteArray.length);
    } else {
      result.set([messageByteArray.length], 1); // Length (L)
      // Message block
      result.set(messageByteArray, 2);
      // Terminator TLV
      result.set([0xFE], 2 + messageByteArray.length);
    }

    return result;
  }
}
