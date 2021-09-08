const Mock = require('mockjs')
const Random = Mock.Random
let data = [30,76,90,37,19,59,27]

function getData() {
  var data = Mock.mock({
    'list|6-20': [{
      'name': /[A-Z]{2,4}/
    }],
  })
  return data.list.map(v=>{
    v.value = Random.natural(0,100)
    return v
  })
}

export default class FyBar {
  constructor({
    el,
    width,
    height,
    padding,
  }) {
    this.el = el ? document.getElementById(el) : document.body
    this.width = parseInt(width || this.el.offsetWidth || 600)
    this.height = parseInt(height || this.el.offsetHeight || 400)
    this.padding = padding || 20
  }
  init() {
    
    let canvas = document.createElement("canvas");
    this.ctx = canvas.getContext("2d");
    this.el.appendChild(canvas)
    let {width, height } = this
    canvas.width = this.width
    canvas.height = this.height
    this.data = getData()
    this.drawBar()
  }
  reset(){
    let { width, height, ctx} = this
    ctx.clearRect(0, 0, width, height);
    this.data = getData()
    this.drawBar()
  }
  drawBar(){
    let fixNum = 0.5
    let { padding, data, width, height, ctx } = this
    const barMinWidth = 20
    let max = 0, Len = data.length
    data.forEach(v=>{
      max = v.value > max ? v.value : max
    })
    while(max % 10 != 0){
      max++
    }

    let stepX = 4
    while( (max / stepX) % 5 != 0){
      stepX++
    }

    let barWidth = parseInt((width - padding * 2 ) / (Len * 2 + 1)), stepNum 
    if (barWidth < barMinWidth) {
      barWidth = barMinWidth
      stepNum = parseInt(( (width - padding * 2 ) - (barWidth * Len) ) / Len)
    }else{
      stepNum = barWidth
    }
    // x,y轴
    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.lineJoin = "miter";
    ctx.moveTo(padding + fixNum,padding + fixNum)
    ctx.lineTo(padding + fixNum,height - padding + fixNum)
    ctx.lineTo(width - padding + fixNum,height - padding + fixNum)
    ctx.stroke()

    // TODO 画xy 轴刻度

    let maxH = height - padding * 2 
    // 画x轴
    for(let x = 0; x < stepX; x++){
      let y1 = x * parseInt(maxH / stepX) + 20
      let num = max - max / stepX * x
      ctx.font = "12px serif";
      ctx.fillStyle = '#000'
      ctx.textAlign = 'right'
      ctx.fillText( num, padding - 2 + fixNum, y1 + 7 + fixNum );
      ctx.beginPath()
      ctx.strokeStyle = '#ccc'
      ctx.setLineDash([4, 16]);
      ctx.lineDashOffset = padding + fixNum;
      ctx.moveTo(padding + fixNum,y1 + fixNum)
      ctx.lineTo(width - padding + fixNum,y1 + fixNum)
      ctx.stroke();
    }

    // 画柱形
    ctx.font = "14px serif";
    ctx.textAlign = 'center'
    data.forEach((v,k)=>{
      let hei = parseInt((v.value / max) * maxH)
      let x1 = parseInt(padding + stepNum * (k + 1) + barWidth * k)
      ctx.beginPath()
      ctx.fillStyle = 'rgb(128, 180, 121)'
      ctx.fillRect(x1 + fixNum, maxH - hei + padding  + fixNum, barWidth, hei);
      ctx.fillStyle = '#000'
      ctx.fillText(v.name, x1 + barWidth / 2 + fixNum , height - 7 + fixNum);
      ctx.fillText(v.value, x1 + barWidth / 2  + fixNum, maxH - hei + padding - 2 + fixNum);
    })
  }
}