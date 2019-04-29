import Vue from 'vue'
import App from './App.vue'
import './plugins/element.js'
import vueResource from 'vue-resource';
import VCharts from 'v-charts'

Vue.config.productionTip = false
Vue.use(vueResource);
Vue.use(VCharts);

new Vue({
  render: h => h(App),
}).$mount('#app')
