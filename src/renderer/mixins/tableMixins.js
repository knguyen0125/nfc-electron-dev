import { Vue, Component } from 'vue-property-decorator';
// Components
import Table from '@/components/Table';

@Component({
  components: { Table },
})
export default class MultipleTagPage extends Vue {
  /** Headers for table */
  headers = [
    {
      text: 'key',
      value: 'key',
      sortable: false,
    },
    {
      text: 'value',
      value: 'value',
      sortable: false,
    },
  ]

  /** List of items in table */
  items = [];

  currentIndex = -1;

  /** Set header
   * @param {string} key - First row of table
   * @param {string} value - Second row of table
   */
  setTableHeaders(key, value) {
    this.headers[0].text = key;
    this.headers[1].text = value;
  }

  /** Change values of Item
   * @param {Number} index - Index of item
   * @param {object} object - Configuration object of item
   */
  changeItem(index, object) {
    const keys = Object.keys(object);

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = object[key];

      this.items[index][key] = value;
    }
  }

  /** Reset table to blank form */
  resetTable() {
    this.items = [];
    this.currentIndex = -100;
  }
}
