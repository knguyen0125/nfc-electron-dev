import { Vue, Component } from 'vue-property-decorator';

@Component
export default class StatusMixins extends Vue {
  /** Status handler */
  status = {
    type: 'success',
    message: '',
    show: false,
  };

  /** Change status bar
   * @param {string} type - Type of Status Bar
   * @param {string} message - Message to be written on status bar
  */
  changeStatus(type, message) {
    if (['success', 'warning', 'error', 'info'].includes(type.toLowerCase())) {
      this.status.type = type.toLowerCase();
      this.status.message = message;
      this.status.show = true;
    }
  }

  /** Hide status bar */
  hideStatus() {
    this.status.show = false;
  }
}
