<template>
   <div class="app" @click="toTest">Hi {{ma}}</div> 
</template>

<script>
import { Vue, Component } from 'vue-property-decorator';

@Component
export default class App extends Vue {
  ma = ''

  async toTest() {
    this.ma = 'ha';
  }
}
</script>

<style lang="stylus">
div 
  background-color: red
</style>


