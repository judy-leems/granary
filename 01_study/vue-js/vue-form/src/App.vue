<template>
  <form v-on:submit.prevent="submitForm">
    <div>
      <label for="username">id: </label>
      <input id="username" type="text" v-model="username">
    </div>
    <div>
      <label for="password">pw: </label>
      <input id="password" type="password" v-model="password">
    </div>
    <button type="submit">login</button><!-- click했을 떄 이벤트를 걸수도 있지만 폼으로 전송을 하기 때문에 form에서 건다 -->
  </form>
</template>

<script>
import axios from 'axios';

export default {
  data: function() {
    return {
      username: '',
      password: '',
    }
  }, 
  methods: {
    submitForm: function() {
      var url = 'https://jsonplaceholder.typicode.com/users'
      var data = {
        username: this.username,
        password: this.password
      }
      axios.post(url, data)
        .then(function(response) {
          console.log(response)
        })
        .catch(function(error) {
          console.log(error)
        });
    }
  }
}
</script>

<style>

</style>