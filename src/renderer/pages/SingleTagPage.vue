<template>
  <v-layout row wrap align-center justify-center fill-height>
    <v-flex xs12 class='display-2 text-xs-center pt-2'>
      Single Tag Writer
    </v-flex>
    <v-flex xs12 class="mt-2">
      <v-text-field 
        type='text'
        name='tagMsg'
        id='tagMsg'
        @keydown.enter='toggleWrite'
        v-model='tagMsg'
        placeholder='Enter Tag Message to write here'
      />
    </v-flex>
    <v-flex xs6 class="mt-2">
      <v-switch 
        label="Make Tag Read-only?" 
        v-model="readOnlyToggle" 
        hint="This is permanent and you cannot unlock tag after making it read-only" 
        persistent-hint
      />
    </v-flex>
    <v-flex xs6 class="text-xs-right mt-2">
      <v-btn
        :class='writeToggle.color'
        @click='toggleWrite'
        large round
      >{{writeToggle.message}}</v-btn>
    </v-flex>
    <v-flex>
      <v-alert :value="status.show" :type="status.type">
        {{status.message}}
    </v-alert>
    </v-flex>
  </v-layout>
</template>

<script>
import { Component, Watch, Mixins } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
// import { debounce } from 'lodash';

import MainCommunicationMixins from '@/mixins/mainCommunicationMixins';
import StatusMixins from '@/mixins/statusMixins';
import WriteToggleMixins from '@/mixins/writeToggleMixins';
@Component
export default class SingleTagPage extends Mixins(
    MainCommunicationMixins,
    StatusMixins,
    WriteToggleMixins,
  ) {
  /** Message to be written to tag */
  tagMsg = '';

  // Similar to a constructor
  mounted() {
    this.initPermissions();

    ipcRenderer.on('operation-complete', this.operationHandler);
  }

  // //// Operation Hanlder
  operationHandler(event, operationPackage) {
    // Checks if operation has write block (i.e. write operation started)
    if (operationPackage.write) {
      if (operationPackage.write.error) {
        this.changeStatus('error', operationPackage.write.error);
      } else {
        if (operationPackage.readOnly) {
          if (operationPackage.readOnly.error) {
            this.changeStatus(
              'warning',
              `Successfully written ${this.tagMsg} to tag but failed to make readonly`,
            );
          } else {
            this.changeStatus(
              'success',
              `Successfully written ${this.tagMsg} to tag and made readonly`,
            );
          }
        } else {
          this.changeStatus(
            'success',
            `Successfully written ${this.tagMsg} to tag`,
          );
        }

        this.toggleWrite();
      }
    }
  }

  // Watches tag message and updates main process
  @Watch('tagMsg')
  onMessageChanged(msg) {
    this.setMessage(msg);
  }
}
</script>