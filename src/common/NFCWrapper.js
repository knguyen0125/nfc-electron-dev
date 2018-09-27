/* eslint-disable no-bitwise,class-methods-use-this */
import { NFC } from 'nfc-pcsc';
import ndef from '@taptrack/ndef';

import EventEmitter from 'events';

import to from 'common/to';
import { isBoolean } from 'util';

export default class NFCWrapper extends EventEmitter {
  static get LOCK_PAGE() { return 0x02; }
  static get CAPABILITY_CONTAINER_PAGE() { return 0x03; }
  static get DATA_START_PAGE() { return 0x04; }
  static get BLOCK_SIZE() { return 4; }

  // Global Methods
  nfc = new NFC();

  readers = [];

  allowRead = true;
  set allowRead(val) {
    if (isBoolean(val)) {
      this.allowRead = val;
    }
  }

  allowWrite = false;
  set allowWrite(val) {
    if (isBoolean(val)) {
      this.allowWrite = val;
    }
  }

  allowWriteReadonly = false;
  set allowWriteReadonly(val) {
    if (isBoolean(val)) {
      this.allowWriteReadonly = val;
    }
  }

  message = '';
  set message(val) {
    this.message = val;
  }

  constructor() {
    super();

    this.start();
  }

  start() {
    this.nfc.on('reader', async (reader) => {
      reader.on('card', async () => {
        const [err, status] = await to(this.handleCard(reader));
        if (err) throw new Error('Unexpected Tag Error');

        return status;
      });
      this.readers.push(reader);
    });
  }

  async handleCard(reader) {
    let overallStatus = true;
    if (this.allowRead) {
      const [err, status] = await to(this.readCard(reader));
      if (err) throw new Error(err.message);

      overallStatus = overallStatus && status;
    }

    if (this.allowWrite) {
      const [err, status] = await to(await this.writeCard(reader));
      if (err) throw new Error(err.message);

      overallStatus = overallStatus && status;
    }

    if (this.allowWriteReadonly) {
      const [err, status] = await to(await this.writeReadOnly(reader));
      if (err) throw new Error(err.message);

      overallStatus = overallStatus && status;
    }

    return overallStatus;
  }

  async readHeader(reader) {
    // Read Header from Capability Container
    const [err, header] = await to(
      reader.read(NFCWrapper.CAPABILITY_CONTAINER_PAGE, NFCWrapper.BLOCK_SIZE)
    );
    if (err || !header) throw new Error('Error Reading tag');

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
    // Notes that apparently the readonly flag on Capability Container do not prevent low-level writing

    return {
      isValid,
      maxLength,
      majorVersion,
      minorVersion,
      isReadOnly,
    };
  }

  async readCard(reader) {
    const [err, header] = await to(this.readHeader(reader));
    if (err || !header) throw new Error(err.message);

    const tagAttribute = {
      'access-level': '',
      records: [],
    };

    if (!header.isValid) {
      throw new Error('Tag is invalid');
    } else {
      if (header.isReadOnly) {
        tagAttribute['access-level'] = 'Read-only';
      } else {
        tagAttribute['access-level'] = 'Read-only';
      }

      const [dataErr, data] = await to(reader.read(NFCWrapper.DATA_START_PAGE, header.maxLength));
      if (dataErr) throw new Error(dataErr.message);

      const message = ndef.Message.fromBytes(data);
      const records = message.getRecords();

      for (let i = 0; i < records.length; i += 1) {
        const record = records[i];

        try {
          const { content } = ndef.Utils.resolveTextRecords(record);
          tagAttribute.records.push(content);
        } catch (err) {
          // Do nothing - Just ignore non-text-records
        }
      } // for loop
    } // header.isValid
  }

  async writeCard(reader) {
    const [err, header] = await to(this.readHeader(reader));
    if (err || !header) throw new Error(err.message);

    if (header.isReadOnly) {
      throw new Error('Tag is Read-only, cannot read');
    }

    if (header.isValid) {
      const NDEFTextRecord = ndef.Utils.createTextRecord(this.message);
      const NDEFMessage = new ndef.Message([NDEFTextRecord]);

      const byteStream = this.constructore.construcMessageNDEF(
        NDEFMessage.toByteArray(),
        header.maxLength,
      );

      const [err, writeStatus] = await to(reader.write(NFCWrapper.DATA_START_PAGE, byteStream));
      if (err) throw new Error('Error Writing to Tag');

      return writeStatus;
    }

    throw new Error('Malformed Tag header');
  }

  async writeReadonly(reader) {
    // Gets information about lock page
    const [err, lockPage] = await to(reader.read(NFCWrapper.LOCK_PAGE, NFCWrapper.BLOCK_SIZE));
    if (err) throw new Error('Error Reading Tag');

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

    const fullLock = new Uint8Array(8);
    fullLock.set(lockPage, 0);
    fullLock.set(ccPage, 4);

    const [flErr, status] = await to(reader.write(NFCWrapper.LOCK_PAGE, fullLock));
    if (flErr) throw new Error('Error writing readonly information to tag');

    return status;
  }

  /** Construct a valid message TLV for NDEF message */
  static construcMessageNDEF(messageByteArray, maxLength, blockSize = 4) {
    let validLength = (2 + messageByteArray.length + 1);
    validLength += 4;
    validLength -= validLength % blockSize;

    let longLengthFormat = false;
    if (messageByteArray.length > 0xFE) {
      longLengthFormat = true;
      validLength += 2;
    }

    if (validLength > maxLength) {
      throw new Error('Length of Message is larger than supported');
    }

    const result = new Uint8Array(validLength);

    result.fill(0); // Fill and pad end of block

    result.set([0x03]); // NDEF Message T

    if (longLengthFormat) {
      result.set([0xFF], 1); // Length (L)
      result.set([Math.floor(messageByteArray.length / 0x100)], 2);
      result.set([messageByteArray.length % 0x100], 3);
      result.set(messageByteArray, 4);
      result.set([0xFE], 4 + messageByteArray.length);
    } else {
      result.set([messageByteArray.length], 1); // Length (L)
      result.set(messageByteArray, 2);
      result.set([0xFE], 2 + messageByteArray.length);
    }

    return result;
  }
}
