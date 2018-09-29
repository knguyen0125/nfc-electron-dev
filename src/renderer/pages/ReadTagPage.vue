<template>
  <v-layout row wrap align-center justify-center fill-height>
    <v-flex xs12 class='display-2 text-xs-center pt-2'>
      Single Tag Reader
    </v-flex>
    <v-flex xs12 class="mt-5">
      <Table :headers="headers" :items="items"/>
    </v-flex>
    <v-flex>
      <v-alert :value="status.show" :type="status.type">
        {{status.message}}
    </v-alert>
    </v-flex>
  </v-layout>
</template>

<script>
import { Component, Mixins } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';

import MainCommunicationMixins from '@/mixins/mainCommunicationMixins';
import StatusMixins from '@/mixins/statusMixins';
import TableMixins from '@/mixins/tableMixins';

@Component
export default class ReadTagPage extends Mixins(
    MainCommunicationMixins,
    StatusMixins,
    TableMixins,
  ) {
  // Similar to Constructor
  mounted() {
    this.initPermissions();

    this.setRead(true);

    this.setTableHeaders('Attribute', 'Value');

    ipcRenderer.on('operation-complete', this.operationHandler);
  }

  // Operation Hanlder
  operationHandler(event, operationPackage) {
    // Checks if operation has read block (i.e. write operation started)
    if (operationPackage.read) {
      if (operationPackage.read.error) {
        this.changeStatus('error', operationPackage.read.error);
      } else {
        this.resetTable();

        this.items.push({
          key: 'Access Level',
          value: operationPackage.read['access-level'],
        });

        const { records } = operationPackage.read;
        for (let i = 0; i < records.length; i += 1) {
          this.items.push({
            key: `Record #${i + 1}`,
            value: records[i],
          });
        }

        this.changeStatus('success', 'Read Successful');
      }
    }
  } // END operationHandler
}
</script>