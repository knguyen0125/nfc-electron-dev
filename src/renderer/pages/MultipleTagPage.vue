<template>
  <v-layout wrap row align-center justify-center>
    <v-flex xs12 class='display-2 text-xs-center pa-2 ma-2'>
      Multiple Tags Writer
    </v-flex>

    <v-flex xs6 class="mt-2">
      <v-switch 
        label="First Row header?" 
        v-model="csvHasHeader" 
      />
    </v-flex>
    <v-flex xs6 class="text-xs-right mt-2">
      <v-btn color="primary" large round @click='openFile'>Open File</v-btn>
    </v-flex>

    <v-flex xs6>
      <v-switch 
        label="Make Tag Read-only?" 
        v-model="readOnlyToggle" 
        hint="This is permanent and you cannot unlock tag after making it read-only" 
        persistent-hint
      />
    </v-flex>
    <v-flex xs6 class="text-xs-right">
      <v-btn
        large round
        :class='writeToggle.color'
        @click='toggleWrite'
      >{{writeToggle.message}}</v-btn>
    </v-flex>

    <v-flex xs12 class="mt-5">
      <Table :headers="headers" :items="items" :currentIndex="currentIndex"/>
    </v-flex>

    <v-flex>
      <v-alert :value="status.show" :type="status.type">
        {{status.message}}
      </v-alert>
    </v-flex>
  </v-layout>
</template>

<script>
import {
  Vue,
  Component,
  Watch,
  Mixins,
} from 'vue-property-decorator';

import { remote, ipcRenderer } from 'electron';

import fs from 'fs';
import Papa from 'papaparse';

// Mixins
import MainCommunicationMixins from '@/mixins/mainCommunicationMixins';
import StatusMixins from '@/mixins/statusMixins';
import WriteToggleMixins from '@/mixins/writeToggleMixins';
import TableMixins from '@/mixins/tableMixins';
const { dialog } = remote;

@Component
export default class MultipleTagPage extends Mixins(
    MainCommunicationMixins,
    StatusMixins,
    WriteToggleMixins,
    TableMixins,
  ) {
  csvHasHeader = false;

  // Similar to Constructor
  mounted() {
    // Initialize Permissions
    this.initPermissions();

    this.setTableHeaders('Serial ID', 'Status');

    ipcRenderer.on('operation-complete', this.operationHandler);
  }

  // Operation Handler
  operationHandler(event, operationPackage) {
    // Checks if operation has write block (i.e. write operation started)
    if (operationPackage.write) {
      if (operationPackage.write.error) {
        this.changeStatus('error', operationPackage.write.error);
      } else {
        this.hideStatus();
        if (operationPackage.readOnly) {
          if (operationPackage.readOnly.error) {
            this.changeItem(this.currentIndex, {
              class: 'orange',
              value: 'Success but NOT Readonly',
            });
          } else {
            this.changeItem(this.currentIndex, {
              value: 'Success and Readonly',
            });
          }
        } else {
          this.changeItem(this.currentIndex, {
            value: 'Success',
          });
        }

        this.currentIndex += 1;
      }
    }
  }

  /* Open and read CSV file */
  openFile() {
    dialog.showOpenDialog((fileName) => {
      this.resetTable();

      if (fileName === undefined) return;

      // Rebinds this to that
      const that = this;
      fs.readFile(fileName[0], 'utf-8', (err, data) => {
        if (err) return;

        // Parse csv
        Papa.parse(data, {
          header: that.csvHasHeader,
          step(row) {
            let data = row.data[0];
            if (that.csvHasHeader) {
              // Assumes that the first row is id
              // Assumes that second row is status, if exists
              data = Object.values(data);
            }

            that.items.push({
              key: data[0],
              value: data[1] ? data[1] : 'Pending',
            });
          },
          complete() {
            that.currentIndex = 0;
            that.stopWrite();
          },
        }); // Papa.parse
      }); // fs.readFile
    }); // Open Dialog
  }

  /* Watches current index. If index changes, updates status */
  @Watch('currentIndex')
  changeIndex(index, oldIndex) {
    console.log(index, oldIndex);
    if (index > this.items.length - 1) {
      this.toggleWrite();
      this.changeStatus('Success', 'All Tags Written');
    }

    if (oldIndex >= 0 && this.items.length > 0) {
      if (this.items[oldIndex].class.includes('green')) {
        Vue.set(this.items[oldIndex], 'class', 'green lighten-2');
      }
    }

    if (index >= 0 && index < this.items.length) {
      Vue.set(this.items[index], 'class', 'green darken-2');
      this.setMessage(this.items[index].key);
    } else {
      this.setMessage(null);
    }
  }
}
</script>