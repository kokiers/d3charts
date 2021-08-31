import * as d3 from 'd3'
const Mock = require('mockjs')
const Random = Mock.Random


function getData() {
  var data = Mock.mock({
    'list|4-13': [{
      'name': /[A-Z]{2,4}[0-9]{2,4}/
    }],
  })
  return data.list.map(v=>{
    v.value = Random.natural(100,999999)
    return v
  })
}
export default class  StockPie {
  constructor({el,width,height,innerRadius,outerRadius}) {
    this.el = `#${el}`
    this.height = height || 300
    this.innerRadius =  innerRadius || 45
    this.outerRadius =  outerRadius || 80
    let element = document.getElementById(el)
    if (!width) {
      this.width = element.offsetWidth
    }else{
      this.width = width
    }
  }

  initData(data) {
    this.list = data || []

    d3.select(this.el)
      .select("svg")
      .remove();

    this.svg = d3.select(this.el)
      .append("svg")
      .attr('width', this.width)
      .attr('height', this.height);

    if (this.list.length > 0) {
      this.drawPieChart();
    }else{
      let num = parseInt(Math.random() * 15)
      let list = []
      for(let i = 0; i < num ; i++ ){
        list.push({
          value: parseInt(Math.random() * 1000),
          name: `帅哥${parseInt(Math.random() * 12)}`
        })
      }
      this.list = getData() //[...list]
      this.drawPieChart();
    }
  }

  drawPieChart() {

    this.sumNum = 0
    let pie = d3.pie()
      .value(d => {
        this.sumNum += d.value
        return d.value
      })
      .sortValues(null)

    let line = d3.line()
      .x(d => {
        return d.x
      })
      .y(d => {
        return d.y
      })

    let arc = d3.arc()
      .innerRadius(this.innerRadius)
      .outerRadius(this.outerRadius)

    let arc2 = d3.arc()
      .innerRadius(this.innerRadius)
      .outerRadius(this.outerRadius + 15)

    let that = this;
    let sum = 0;
    let g = this.svg.append('g')
      .attr("transform", "translate(" + parseInt(this.width / 2) + "," + parseInt(this.height / 2) + ")")

    g.selectAll('g')
      .data(pie(this.list))
      .enter()
      .append('g')
      .each(function(d, i) {

        let color = d3.interpolateRdYlGn(i / that.list.length);

        d3.select(this)
          .append('path')
          .attr('fill', color)
          .on("mouseover", function(d) {
            d3.select(this)
              .transition()
              .duration(100)
              .attr("d", arc2(d))
            let text = d.value
          })
          .on("mouseout", function(d) {
            d3.select(this)
              .transition()
              .duration(100)
              .attr("d", arc(d))
          })
          .transition()
          .delay(sum)
          .duration(d => {
            let duration = parseInt(420 * (d.value / that.sumNum));
            sum += duration
            return duration;
          })
          .attrTween("d", function(d) {
            let i = d3.interpolate(d.startAngle, d.endAngle);
            return function(t) {
              d.endAngle = i(t);
              return arc(d);
            }
          })

        let angle = d.startAngle + (d.endAngle - d.startAngle) / 2 - Math.PI / 2;
        let points = that.getPoints(angle);
        let pointt = new Array(2);
        pointt[0] = points[2].x + (angle > Math.PI / 2 && angle < Math.PI * 1.5 ? -10 : 10);
        pointt[1] = points[2].y

        d.points = points;

        d3.select(this)
          .append('path')
          .attr('class', 'tips')
          .attr('fill', 'none')
          .attr('stroke', color);

        let direct = 'end';
        if (angle >= -Math.PI / 2 && angle <= Math.PI / 2) {
          direct = 'start'
        }
        let el = d3.select(this)
        that.drawTextTips(el, pointt[0], pointt[1] - 4, d.data.name, 't', direct)
        that.drawTextTips(el, pointt[0], pointt[1] + 10, d.data.value, 'y', direct)
      })

    let circle = g.append('circle').attr('r', this.innerRadius).attr('fill', '#fff')
    let num = this.sumNum
   
    this.drawTextTips(g, 0, 4, num)
    circle.on("mouseover", () => {
        const {
          x,
          y
        } = d3.event
      })
      .on("mouseout", () => {
      })
  }

  changeNum(v) {
    let v1 = this.type == 0 ? parseInt(v / 100000000) : v
    let prefix = this.type == 0 ? '亿元' : ''
    if (!v1) return ' '
    let num = Number(v1).toFixed(0)
    return num.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,') + prefix
  }

  drawTextTips(el, px, py, text, id, direct) {
    el.append('text')
      .text(text)
      .attr("x", px)
      .attr("y", py)
      .attr('font-size', 12)
      .attr('class', id ? id : '')
      .attr("text-anchor", direct ? direct : 'middle')
      .style('color', '#666')
  }

  getPoints(angle) {
    let points = new Array(3);
    let small = 4,
      bigMove = 26;

    for (let j = 0; j < 3; j++) {
      let x1, y1, p
      switch (j) { 
        case 0:
          p = getRoundPoint(this.outerRadius + small, angle)
          x1 = p[0];
          y1 = p[1];
          break;
        case 1:
          p = getRoundPoint(this.outerRadius + bigMove, angle)
          x1 = p[0];
          y1 = p[1];
          break;
        case 2:
          p = getRoundPoint(this.outerRadius + bigMove, angle)
          x1 = p[0] + (angle > Math.PI / 2 && angle < Math.PI * 1.5 ? -bigMove : bigMove);
          y1 = p[1];
          break;
      }
      points[j] = {
        x: x1,
        y: y1
      }
    }
    return points;
  }
}


function getRoundPoint(r, angle) {
  return [
    r * Math.cos(angle),
    r * Math.sin(angle)
  ]
}

