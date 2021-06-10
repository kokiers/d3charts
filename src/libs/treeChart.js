import * as d3 from 'd3'
import html2canvas from 'html2canvas';

const manPic = require('@/img/wx.png');
const imgW = 40

export default class treeChart {
  constructor({
    el,
    width,
    height
  }) {
    this.el = `#${el}`
    this.height = height || 400
    let element = document.getElementById(el)
    if (!width) {
      this.width = element.offsetWidth
    } else {
      this.width = width
    }
    this.start = {}
    this.start.x = element.offsetLeft
    this.start.y = element.offsetTop 
  }

  resetSvg() {
    d3.select(this.el)
      .select("svg")
      .remove();
    this.initTree()
  }

  initTree() {

    let num = parseInt(Math.random() * 20)
    let list = [] , lastId = [], parent = ''
    for(let i = 0; i < num ; i++ ){
      let tid = `${num}-${parseInt(Math.random() * 100000)}`
      let level = i > 0 ? i < 3 ? 1 : 2 : 0
      list.push({
        weight: parseInt(Math.random() * 1000),
        name: `帅哥${i}`,
        sourceId: level > 1 ? Math.random() < 0.5 && lastId[1] ? lastId[1] : lastId[0] : parent,
        targetId: tid,
        level: level 
      })
      if (level == 0) {
        parent = tid
      }
      if (level == 1){
        lastId.push(tid)
      }
    }
    this.nodeData = [...list]
    if (this.nodeData.length < 1) {
      return false;
    } else {
      this.drawTree();
    }
  }
  sortChild(arr) {
    let left = [], right = []
    arr.sort((a, b) => {
      let va = a.weight || 0
      let ba = b.weight || 0
      return va - ba
    })
    arr.forEach((v, k) => {
      if (k % 2 == 0) {
        right.unshift(v)
      } else {
        left.push(v)
      }
    })
    let list = left.concat(right)
    return list
  }

  drawTree() {

    this.svg = d3.select(this.el).append("svg")
      .attr("width", this.width)
      .attr("height", this.height)

    let root, self = this
    try {
      root = d3.stratify()
        .id((d) => {
          return d.targetId;
        })
        .parentId((d) => {
          return d.sourceId
        })(this.nodeData);
    } catch (e) {
      console.log('层级关系错误', e)
    }

    this.hierarchyData = d3.hierarchy(root)
      .sum((d) => {
        return d.data.weight || 0
      })
      .sort((a, b) => {
        return a.value - b.value
      })
    root = null;

    let tree = d3.tree().size([this.width, this.height]).separation((a, b) => {
      return a.parent == b.parent ? 2 : 4
    })
    let treeData = tree(this.hierarchyData)
    this.treeNode = treeData.descendants();
    this.treeLink = treeData.links()

    this.g = this.svg.append('g')
    this.zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .translateExtent([
        [0, 0],
        [this.width, this.height]
      ])
      .extent([
        [0, 0],
        [this.width, this.height]
      ])
      .on('zoom', this.zoomed( this.g))

    this.initDefineSymbol()
    this.drawNodes()
    this.drawLinks()

    this.svg.call(d3.zoom().on("zoom", function(){
      self.zoomed(this)
    })
      )
    .on('click', () => {
      console.log('click')
    })
    .on("dblclick.zoom", null);

  }
  drawLinks() {
    let links = this.treeLink
    let linkG = this.g
    linkG.selectAll('.link').data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', '#317CEA')
      .style('fill', 'none')
      .attr('d', (d) => {

        const {
          source,
          target
        } = d

        let x = target.x
        let y = target.y
        let px, py, py1, px1

        let baseNum = 40, baseY = 30

        if (source.x > x) {
          px = source.x - baseNum
          py = source.y + baseY
          y = y - baseY
        } else if (source.x < x) {
          px = source.x + baseNum
          py = source.y + baseY
          y = y - baseY
        } else {
          px = source.x
          py = source.y + 55
          y = y - baseY
        }

        if (Math.abs(px - x) >= 40) {
          py1 = py + 30
          if (px > x) {
            px1 = px - 40
          } else {
            px1 = px + 40
          }
          return 'M ' + px + ' ' + py + ' L ' + px1 + ' ' + py1 + ' L ' + x + ' ' + py1 + ' L ' + x + ' ' + y;
        } else {
          return 'M ' + px + ' ' + py + ' L ' + x + ' ' + y;
        }
      }).attr('marker-end', (link, i) => 'url(#' + 'marker-' + i + ')')


  }
  drawNodes() {
    let nodes = this.treeNode
    let that = this
    let gDom = this.g

    nodes.forEach((d) => {
      d.y = d.depth * 150 + 24;
      d.value = d.data.data.id;
      if (d.data.data.level < 1) {
        this.start.tx = -(d.x - this.width / 2)
        this.start.ty = -(d.y - this.height / 2)
      }
    });
    
    gDom.selectAll('.node').data(nodes)
      .enter()
      .append('g')
      .attr('class', (d) => {
        return 'node' + (d.children ? ' node--internal' : ' node--leaf')
      })
      .attr('transform', (d) => {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
      .each(function(d) {

        d3.select(this)
          .append("image")
          .attr("width", imgW)
          .attr("height", imgW)
          .attr('transform', () => {
            return 'translate(-' + imgW / 2 + ',-' + imgW / 2 + ')'
          })
          .attr("xlink:href", (d) => {
            return manPic
          })
      })
    this.drawNodeText();
  }
  drawNodeText() {

    let fontColor = '#606266',
      fontSize = 11,
      fontAlign = 'middle',
      that = this

    this.g.selectAll('.node').append('text')
      .attr('dy', (imgW * 1.2))
      .attr('font-size', fontSize)
      .style('text-anchor', fontAlign)
      .style('color', fontColor)
      .text((d) => {
        return d.data.data ? `魅力值：${d.data.data.weight}` : ''
      })

    this.g.selectAll('.node').append('text')
      .attr('dy', imgW * 4 / 5)
      .attr('font-size', fontSize)
      .style('text-anchor', fontAlign)
      .style('color', fontColor)
      .text((d) => {
        return d.data.data.name || ''
      })

  }
  zoomed(el) {
    // console.log(this,el)
    // el.attr('transform', d3.event.transform)
    var transform = d3.zoomTransform(el);
    this.scale = transform.k;
    this.g.attr('transform', "translate(" + transform.x + "," + transform.y + ")scale(" + transform.k + ")")
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
      d3.zoomIdentity.translate(this.start.tx, this.start.ty).scale(1),
      d3.zoomTransform(this.svg.node()).invert([this.width / 2, this.height / 2])
    );
  }
  onDrag(ele, d) {
    d.x = d3.event.x;
    d.y = d3.event.y;
    d3.select(ele)
      .attr('transform', "translate(" + d3.event.x + "," + d3.event.y + ")")
    this.update(d);
  }
  update(d) {
    this.drawLinks();
  }
  clicked(el) {
    const {
      x,
      y
    } = el
    d3.event.stopPropagation();
    this.svg.transition().duration(750).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(this.width / 2, this.height / 2).scale(4).translate(-x, -y),
      d3.mouse(this.svg.node())
    );
  }
  initDefineSymbol() {

    let defs = this.g.append('svg:defs');
    //箭头
    const marker = defs
      .selectAll('marker')
      .data(this.treeLink)
      .enter()
      .append('svg:marker')
      .attr('id', (link, i) => 'marker-' + i)
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 2)
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
}
