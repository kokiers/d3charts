<template>
    <div id="app">
      <template v-for="(v,k) in list" >
      <h3>{{v.name}} <button class="my-botton" @click="resetChart(v.id)">刷新</button></h3>
       <div :id="v.id" :key="k"></div>
      </template>
    </div>
</template>
<script>
import StockPie from './libs/StockPie'
import treeChart from './libs/treeChart'
import macChart from './libs/macChart'
import barChart from './libs/barChart'
export default {
    mounted(){
      this.$nextTick(()=>{
        // this.pie = new StockPie({el:'pie'})
        // this.pie.initData()
        // this.tree = new treeChart({el:'tree'})
        // this.tree.initTree()
        // this.mac = new macChart({el: 'mac'})
        // this.mac.render()
          this.bar = new barChart({el: 'bar'})
          this.bar.init()
      })
    },
    data(){
        return {
            isAlive: true,
            pie: null,
            list: [
            // {
            //   name: '饼图',
            //   id: 'pie'
            // },
            // {
            //   name: '层级树形图',
            //   id: 'tree'
            // },
            // {
            //   name: '树形图',
            //   id: 'mac'
            // },
              {
                name: '柱形图',
                id: 'bar'
              },
            ]
        }
    },
   methods:{
    resetChart(index){
      switch(index){
        case 'pie':
          this.pie.initData()
          break;
        case 'tree':
          this.tree.resetSvg()
          break;
        case 'mac':
          this.mac.resetRender()
          break;
        case 'bar':
          this.bar.reset()
      }
    }
   }
}
</script>
<style lang="stylus">
#app
  padding: 30px;
  div 
    box-shadow: 0 0 2px #ccc
  .my-botton
    background: transparent;
    border: 0;
    box-shadow: 0 0 2px blue
    border-radius: 4px;
    padding: 2px 8px;
    &:hover
      cursor: pointer
</style>
