<template>
  <div id="app"> 
    <v-app>
      <v-bottom-nav app value="true" color="indigo" mandatory>
        <v-btn to='read' dark>
          <span>Read Tag</span>
          <v-icon>nfc</v-icon>
        </v-btn>
        <v-btn to='single' dark>
          <span>Single Tag Writer</span>
          <v-icon>edit</v-icon>
        </v-btn>
        <v-btn to='multiple' dark>
          <span>Multiple Tag Writer</span>
          <v-icon>library_add</v-icon>
        </v-btn>
      </v-bottom-nav>
      <v-content>
        <v-container>
          <router-view></router-view>
        </v-container>
      </v-content>
    </v-app>
  </div>
</template>

<script>
/* eslint-disable */
import { Vue, Component } from 'vue-property-decorator';

@Component
export default class App extends Vue {
}
</script>

<style lang="stylus">
@import '~vuetify/src/stylus/main'
@import '~material-design-icons-iconfont/dist/material-design-icons.css'

html, body 
  overflow: hidden
</style>