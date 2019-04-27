<template>
  <div id="app">
    <el-container>
      <el-header class="container-top" height="90px">
        <Header></Header>
      </el-header>

      <el-main class="container-main">
        <Content></Content>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import Content from './components/Content.vue'
import Header from './components/Header.vue'

export default {
  name: 'app',
  components: {
    Content,
    Header
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
#app .container-top {
  padding: 0;
}
#app .container-main {
  padding: 12px;
}
</style>
