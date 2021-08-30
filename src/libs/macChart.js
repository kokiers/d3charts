import * as d3 from 'd3'
var Mock = require('mockjs')
var Random = Mock.Random

const fontSize = 10;
const symbolSize = 14;
const padding = 10;

const manPic = require('@/img/wx.png');
const imgW = 40


function getData() {
  var data = Mock.mock({
    'node|4-6': [{
      'kh': /[62]\d{17}/,
      'mac': /[a-z][A-Z][0-9]{6,10}/
    }],
  })
  let nodes = [], links = [], mac = []
  data.node.forEach(val=>{

    nodes.push({
      name: Random.cname(),
      kh: val.kh,
      nodeType: 0
    })
    nodes.push({
      nodeType: 2,
      kh: val.mac
    })
    mac.push(val.mac)
    links.push({
      targetNode: val.kh,
      sourceNode: val.mac
    })
    if (nodes.length > 2){
      let index = parseInt(Math.random() * (mac.length - 1))
      links.push({
        targetNode: val.kh,
        sourceNode: mac[index]
      })
    }

  })
  return {nodes,links}
}

export default class MacChart {
  constructor({
    el
  }) {
    this.el = `#${el}`
  }

  resetNode() {
    let dom = d3.select(this.el)
      .select("svg")
    if (dom) {
      dom.remove();
    }
    this.lineGroup = null
    this.lineTextGroup = null
  }
  resetRender(flag) {
    let dom = d3.select(this.el)
      .select("svg")
    if (dom) {
      dom.remove();
    }
    this.lineGroup = null
    this.lineTextGroup = null
    this.render(flag)
  }

  //主渲染方法 {link,node}
  render(data, param, key) {
    this.scale = 1;
    this.chartKey = key
    this.idNode = param ? param.split(',') : []
    let {links, nodes} = getData()
    this.data = nodes;
    this.link = links
    this.initRender()
  }
  initRender(flag) {
    if (flag) {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    } else {
      let dom = document.querySelector(this.el)
      let style = dom.getBoundingClientRect()
      this.width = style.left == 0 ? style.width - 390 : style.width;
      this.height = 400;
    }
    this.svg = d3.select(this.el)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
    this.container = this.svg.append('g').attr('transform', 'scale(' + this.scale + ')');
    this.initPosition();
    this.initDefineSymbol()
    this.initLink();
    this.initNode();
    this.initZoom();
  }

  //初始化节点位置
  initPosition() {
    let origin = [this.width / 2, this.height / 2];

    //  有 chartkey 
    // if (!this.chartKey) { //圆形闭环
    //   let points = this.getVertices(origin, Math.min(this.width, this.height) * 0.3, this.data.length);
    //   this.data = this.data.map((item, i) => {
    //       item.x = points[i].x
    //       item.y = points[i].y
    //       return item
    //   })
    // } else {
      let {
        M,
        L
      } = this.getSpace();

      let a = 0,
        b = 0
      this.data.forEach((item, i) => {
        let x, y
        if (item.nodeType) {
          x = M * a + M / 2
          y = 60
          a++
        } else {
          x = L * b + L / 2
          y = this.height - 60
          b++
        }
        item.x = x;
        item.y = y;
        item.name = item[this.chartKey]
      })
    // }
  }

  getSpace() {
    let mac = 0,
      man = 0
    this.data.forEach((v, k) => {
      if (v.nodeType) {
        mac++
      } else {
        man++
      }
    })
    return {
      M: mac ? this.width / mac : 0,
      L: man ? this.width / man : 0
    }
  }


  //根据多边形获取定位点
  getVertices(origin, r, n) {
    if (typeof n !== 'number') return;
    var ox = origin[0];
    var oy = origin[1];
    var angle = 360 / n;
    var i = 0;
    var points = [];
    var tempAngle = 0;
    while (i < n) {
      tempAngle = (i * angle * Math.PI) / 180;
      points.push({
        x: ox + r * Math.sin(tempAngle),
        y: oy + r * Math.cos(tempAngle),
      });
      i++;
    }
    return points;
  }

  //两点的中心点
  getCenter(x1, y1, x2, y2) {
    return [(x1 + x2) / 2, (y1 + y2) / 2]
  }

  //两点的距离
  getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  //两点角度
  getAngle(x1, y1, x2, y2) {
    var x = Math.abs(x1 - x2);
    var y = Math.abs(y1 - y2);
    var z = Math.sqrt(x * x + y * y);
    return Math.round((Math.asin(y / z) / Math.PI * 180));
  }

  initDefineSymbol() {
    let defs = this.container.append('svg:defs');

    //箭头
    const marker = defs
      .selectAll('marker')
      .data(this.link)
      .enter()
      .append('svg:marker')
      .attr('id', (link, i) => 'marker-' + i)
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', symbolSize + padding)
      .attr('refY', 0)
      .attr('markerWidth', 14)
      .attr('markerHeight', 14)
      .attr('orient', 'auto')
      .attr('stroke-width', 2)
      .append('svg:path')
      .attr('d', 'M2,0 L0,-3 L9,0 L0,3 M2,0 L0,-3')
      .attr('fill', '#317CEA')
      .attr('class', 'arrow')

  }

  //初始化缩放器
  initZoom() {
    let self = this;
    let zoom = d3.zoom()
      .scaleExtent([0.7, 3])
      .on('zoom', function() {
        self.onZoom(this)
      });
    this.svg.call(zoom)
  }


  //初始化链接线
  initLink() {
    this.drawLinkLine();
    this.drawLinkText();
  }

  initNode() {
    let self = this;
    this.nodes = this.container.selectAll(".node")
      .data(this.data)
      .enter()
      .append("g")
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      })
      .call(d3.drag()
        .on("drag", function(d) {
          self.onDrag(this, d)
        })
      )

    this.nodes.append('circle')
      .attr('fill', '#fff')
      .attr('r', symbolSize / 2 + padding)
      .attr('class', 'node-bg');
    this.drawNodeSymbol();
    this.drawNodeTitle();
  }


  drawNodeSymbol() {
    this.nodes.append("image")
      .attr("width", imgW)
      .attr("height", imgW)
      .attr('transform', (d) => {
        return 'translate(-' + imgW / 2 + ',-' + imgW / 2 + ')'
      })
      .attr("xlink:href", manPic)
  }

  drawNodeTitle() {
    this.nodes.append("text")
      .attr('class', 'node-title')
      .text(function(d) {
        return d.mc || d.name;
      })
      .attr('font-size', '12px')
      .attr('dx', (d) => {
        return -(getTextWidth(d.mc || d.name))
      })
      .attr("dy", (d) => {
        return d.nodeType ? -(symbolSize * 2) : symbolSize * 2.4
      })

    this.nodes.append("text")
      .attr('class', 'node-title')
      .text(function(d) {
        return d.kh || '';
      })
      .attr('font-size', '12px')
      .attr('dx', (d) => {
        return -(getTextWidth(d.kh))
      })
      .attr("dy", (d) => {
        return d.nodeType ? -(symbolSize * 2) : symbolSize * 3.4
      })
  }

  //画节点链接线
  drawLinkLine() {
    let data = this.data;
    if (this.lineGroup) {
      this.lineGroup.selectAll('.link')
        .attr(
          'd', link => genLinkPath(link),
        )
    } else {
      this.lineGroup = this.container.append('g')

      this.lineGroup.selectAll('.link')
        .data(this.link)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', link => genLinkPath(link))
        .attr('stroke', '#317CEA')
        .style('fill', 'none')
        .attr('marker-end', (link, i) => 'url(#' + 'marker-' + i + ')')
    }


    function genLinkPath(d) {
      let source = d.sourceNode
      let target = d.targetNode
      let souIndex = data.findIndex(v => {
        return v.kh == source
      })
      let tarIndex = data.findIndex(v => {
        return v.kh == target
      })

      let sx = data[souIndex].x || 0;
      let tx = data[tarIndex].x || 0;
      let sy = data[souIndex].y || 0;
      let ty = data[tarIndex].y || 0;

      return 'M ' + sx + ' ' + sy + ' L ' + tx + ' ' + ty;
    }
  }

  drawLinkText() {
    let data = this.data,
      self = this;

    if (this.lineTextGroup) {
      this.lineTexts.attr('transform', getTransform)
    } else {
      this.lineTextGroup = this.container.append('g').attr('class', 'glink')
      this.lineTexts = this.lineTextGroup
        .selectAll('.linetext')
        .data(this.link)
        .enter()
        .append('text')
        .attr('dy', -40)
        .attr('transform', getTransform)

      // this.lineTexts
      //   .append('tspan')
      //   .text((d, i) => {
      //     return d.linLinkCount
      //   })
      //   .style('color', 'orange')
      //   .attr('dy', '5')
      //   .on('click', (d) => {
      //     bus.$emit('link-count-detail', d);
      //   })
      // .attr('dx', function() {
      //   return -this.getBBox().width / 3
      // })
    }


    function getTransform(link) {

      let source = link.sourceNode
      let target = link.targetNode
      let souIndex = data.findIndex(v => {
        return v.kh == source
      })
      let tarIndex = data.findIndex(v => {
        return v.kh == target
      })

      let s = data[souIndex];
      let t = data[tarIndex];
      let p = self.getCenter(s.x, s.y, t.x, t.y);

      let angle = self.getAngle(s.x, s.y, t.x, t.y);
      if (s.x > t.x && s.y < t.y || s.x < t.x && s.y > t.y) {
        angle = -angle
      }
      return 'translate(' + p[0] + 6 + ',' + p[1] + 6 + ') rotate(' + angle + ')'
    }
  }

  update(d) {
    this.drawLinkLine();
    this.drawLinkText();
  }

  //拖拽方法
  onDrag(ele, d) {
    d.x = d3.event.x;
    d.y = d3.event.y;
    d3.select(ele)
      .attr('transform', "translate(" + d3.event.x + "," + d3.event.y + ")")
    this.update(d);
  }

  //缩放方法
  onZoom(ele) {
    var transform = d3.zoomTransform(ele);
    this.scale = transform.k;
    this.container.attr('transform', "translate(" + transform.x + "," + transform.y + ")scale(" + transform.k + ")")
  }

  zoomIn() {
    this.svg.transition().call(this.zoom.scaleBy, 2)
  }

  zoomOut() {
    this.svg.transition().call(this.zoom.scaleBy, 0.5)
  }

  zoomReset() {
    this.svg.transition().duration(750).call(
      this.zoom.transform,
      // d3.zoomIdentity.translate(this.start.tx, this.start.ty).scale(1),
      d3.zoomTransform(this.svg.node()).invert([this.width / 2, this.height / 2])
    );
  }

}

function getTextWidth(str) {
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  context.font = 12;

  let width = str ? parseInt(context.measureText(str).width) : 0
  context = null
  return width / 2
}