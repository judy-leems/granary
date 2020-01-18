<template>
  <div>
    <!-- <app-header v-bind:프롭스 속성 이름="상위 컴포넌트의 데이터 이름"></app-header> -->
    <app-header v-bind:propsdata="str" v-on:renew="renewStr"></app-header>
  </div>
</template>

<script>
// new Vue({
//   data: {
//     srt: 'hi'
//   }
// })
// vue cli 를 사용하면 위에 처럼 사용 하게 되면 에러남 
// vue cli를 사용하는것 자체가 컴포넌트화? 해서 사용할 확률이 높기 때문에 각각 함수에 담아서 사용해야한다.

import AppHeader from './components/AppHeader.vue';

export default {
  data: function() {
    return {
      str: 'Header'
    }
  },
  components: {
    'app-header': AppHeader
  },
  methods: {
    renewStr: function() {
      this.str = 'hi';
    }
  }
}
</script>

<style>

</style>