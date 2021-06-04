<template>
    <div id="app">
       <div id="pie"></div>
    </div>
</template>
<script>
import StockPie from './libs/StockPie'
export default {
    mounted(){
      this.pie = new StockPie({el:'pie'})
      this.pie.initData()
    },
    data(){
        return {
            isAlive: true,
            pie: null
        }
    },
   
}
</script>
