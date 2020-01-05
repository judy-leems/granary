<template>
  <div>
    {{ str }}
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

export default {
  data: function() {
    return {
      str: 'hi'
    }
  }
}
</script>

<style>

</style>