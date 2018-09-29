import { Vue, Component } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
@Component()
export default class MainCommunicationMixins extends Vue {
  /* eslint-disable */
  /** Intialize Permissions - Disallow all operations */
  initPermissions() {
    // Set permission of NFC reader to
    // read (false) - write (false) - setReadonly (false)
    ipcRenderer.send('set-permission', [false, false, false]);
  }

  /** Set message to be written to tag
   * @param {String} message - Message to be written to tag
   */
  setMessage(message) {
    ipcRenderer.send('set-message', message);
  }

  /** Set Read Permission
   * @param {Boolean} allow - True if allow Write permission
   */
  setRead(allow) {
    ipcRenderer.send('set-read', allow);
  }

  /** Set Write Permission
   * @param {Boolean} allow - True if allow Write permission
   */
  setWrite(allow) {
    ipcRenderer.send('set-write', allow);
  }

  /** Set WriteReadonly Permission
   * @param {Boolean} allow - True if allow Write-Readonly permission
   */
  setWriteReadonly(allow) {
    ipcRenderer.send('set-write-readonly', allow);
  }

  /** Cleanup before destroy */
  beforeDestroy() {
    ipcRenderer.send('set-permission', [false, false, false]);
    ipcRenderer.send('set-message', null);
    ipcRenderer.removeAllListeners('operation-complete');
  }
}
