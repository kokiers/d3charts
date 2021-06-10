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
export default {
    mounted(){
      this.$nextTick(()=>{
        this.pie = new StockPie({el:'pie'})
        this.pie.initData()
        this.tree = new treeChart({el:'tree'})
        this.tree.initTree()

      })
    },
    data(){
        return {
            isAlive: true,
            pie: null,
            list: [{
              name: '饼图',
              id: 'pie'
            },{
              name: '树形图',
              id: 'tree'
            },{
              name: '树形图',
              id: 'mac'
            }]
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
