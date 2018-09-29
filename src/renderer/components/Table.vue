<template>
  <div>
    <v-data-table
      :headers='headers'
      :items='items'
      :pagination.sync='pagination'
      hide-actions
    >
      <template slot="headers" slot-scope="props">
        <tr class="grey darken-1">
          <th class="white--text" v-for="header in props.headers" :key="header.text">
            {{header.text}}
          </th>
        </tr>
      </template>
      <template slot="items" slot-scope="props">
        <tr :class="props.item.class">
          <td>{{props.item.key}}</td>
          <td>{{props.item.value}}</td>
        </tr>
      </template>
    </v-data-table>
    <div class="text-xs-center pt-2">
      <v-pagination v-model="pagination.page" :length="pages"></v-pagination>
    </div>
  </div>
</template>

<script>
import {
  Vue,
  Component,
  Prop,
  Watch,
} from 'vue-property-decorator';

@Component
export default class Table extends Vue {
  @Prop(Array) headers;
  @Prop(Array) items;
  @Prop(Number) currentIndex;

  // Data
  pagination = {};

  // Computed properties
  // Number of pages in pagination
  get pages() {
    if (this.pagination.rowsPerPage
      && this.pagination.totalItems
      && this.pagination.rowsPerPage !== null
      && this.pagination.totalItems !== null
    ) return Math.ceil(this.pagination.totalItems / this.pagination.rowsPerPage);

    return 0;
  }

  // Watches if items changes and update pagination
  @Watch('items', { deep: true })
  changePagination() {
    this.$nextTick(() => {
      this.pagination.totalItems = this.items.length;
    });
  }

  // Watches to make sure that page snaps to currentIndex
  @Watch('currentIndex', { deep: true })
  changePage() {
    this.pagination.page = Math.ceil((this.currentIndex + 1) / this.pagination.rowsPerPage);
  }
}
</script>

