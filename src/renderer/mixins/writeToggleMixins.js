import { Vue, Component, Watch } from 'vue-property-decorator';

@Component
export default class WriteToggleMixins extends Vue {
  writeBtnColor = 'red white--text';
  writeBtnText = 'Start Write';

  cancelBtnColor = 'indigo white--text';
  cancelBtnText = 'Stop Write';

  writeToggle = {
    running: false,
    message: this.writeBtnText,
    color: this.writeBtnColor,
  };

  readOnlyToggle = false;

  toggleWrite() {
    // Toggle operation
    this.writeToggle.running = !this.writeToggle.running;
  }

  stopWrite() {
    this.writeToggle.running = false;
  }

  startWrite() {
    this.writeToggle.running = true;
  }

  // Communication with Main Thread
  @Watch('writeToggle.running')
  onOperationChange(val) {
    if (this.writeToggle.running) {
      this.writeToggle.message = this.cancelBtnText;
      this.writeToggle.color = this.cancelBtnColor;
    } else {
      this.writeToggle.message = this.writeBtnText;
      this.writeToggle.color = this.writeBtnColor;
    }

    this.setWrite(val);
  }

  @Watch('readOnlyToggle')
  onReadOnlyChanged(val) {
    this.setWriteReadonly(val);
  }
}
